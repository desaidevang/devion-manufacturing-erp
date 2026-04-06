// Service Layer
package com.devion.erp.service;

import com.devion.erp.dto.*;
import com.devion.erp.entity.*;
import com.devion.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchService {

    private final BatchRepository batchRepository;
    private final BatchItemRepository batchItemRepository;
    private final ProductRepository productRepository;
    private final PartRepository partRepository;
    private final WarehouseStockRepository warehouseStockRepository;
    private final UserRepository userRepository;
    private final ProductService productService;
    private final WarehouseStockService warehouseStockService;

    // Step 1: Create Batch with stock validation
    @Transactional
    public BatchResponse createBatch(BatchCreateRequest request) {
        log.info("Creating new batch with code: {}", request.getBatchCode());

        // Check if batch code already exists
        if (batchRepository.existsByBatchCode(request.getBatchCode())) {
            throw new RuntimeException("Batch code already exists: " + request.getBatchCode());
        }

        // Get product and its BOM
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + request.getProductId()));

        if (!product.getHasBom()) {
            throw new RuntimeException("Product does not have a BOM defined");
        }

        // Get BOM items for the product
        List<ProductBomItem> bomItems = product.getBomItems();
        if (bomItems == null || bomItems.isEmpty()) {
            throw new RuntimeException("Product BOM is empty");
        }

        // Step 1: Check warehouse stock for all parts
        StockCheckResponse stockCheck = checkStockAvailability(product, request.getBatchQuantity());
        if (!stockCheck.getHasSufficientStock()) {
            throw new RuntimeException("Insufficient stock: " + stockCheck.getMessage());
        }

        // Step 2: Deduct stock from warehouse and create batch
        Batch batch = new Batch();
        batch.setBatchCode(request.getBatchCode());
        batch.setProduct(product);
        batch.setBatchQuantity(request.getBatchQuantity());
        batch.setPriority(request.getPriority() != null ? request.getPriority() : Batch.Priority.MEDIUM);
        batch.setStatus(Batch.BatchStatus.PENDING);
        batch.setNotes(request.getNotes());

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        batch.setCreatedBy(currentUser);

        // Save batch first to get ID
        Batch savedBatch = batchRepository.save(batch);

        // Step 3: Create batch items and deduct stock
        List<BatchItem> batchItems = new ArrayList<>();

        for (ProductBomItem bomItem : bomItems) {
            Part part = bomItem.getPart();
            int requiredQuantity = bomItem.getQuantityRequired() * request.getBatchQuantity();

            // Find available stock for this part
            List<WarehouseStock> availableStocks = warehouseStockRepository.findAvailableStockByPartId(part.getId());

            int remainingToAllocate = requiredQuantity;
            WarehouseStock allocatedStock = null;

            for (WarehouseStock stock : availableStocks) {
                int availableQty = stock.getAvailableQuantity();
                if (availableQty > 0) {
                    int allocateQty = Math.min(availableQty, remainingToAllocate);

                    // Deduct from stock
                    stock.setReservedQuantity(stock.getReservedQuantity() + allocateQty);
                    stock.setAvailableQuantity(stock.getQuantity() - stock.getReservedQuantity());
                    warehouseStockRepository.save(stock);

                    allocatedStock = stock;
                    remainingToAllocate -= allocateQty;

                    if (remainingToAllocate <= 0) {
                        break;
                    }
                }
            }


// ⭐ FIX: maintain inverse side
            BatchItem batchItem = new BatchItem();
            batchItem.setPart(part);
            batchItem.setQuantityRequired(requiredQuantity);
            batchItem.setQuantityUsed(0);
            batchItem.setWarehouseStock(allocatedStock);
            batchItem.setIsIssued(false);
            batchItem.setRemarks("Auto-allocated from stock");

            // ⭐ Correct relationship linking
            savedBatch.getBatchItems().add(batchItem);
            batchItem.setBatch(savedBatch);
        }

// ⭐ Do NOT save batchItems manually
// ⭐ Only save the parent
        batchRepository.save(savedBatch);
        // Save all batch items


        log.info("Batch created successfully: {}", savedBatch.getId());

        return convertToResponse(savedBatch);
    }

    // Stock availability check
    @Transactional(readOnly = true)
    public StockCheckResponse checkStockAvailability(Product product, Integer batchQuantity) {
        log.info("Checking stock availability for product: {}, quantity: {}",
                product.getProductCode(), batchQuantity);

        List<ProductBomItem> bomItems = product.getBomItems();
        List<StockCheckResponse.PartStockStatus> partStatuses = new ArrayList<>();
        boolean hasSufficientStock = true;
        StringBuilder message = new StringBuilder();

        for (ProductBomItem bomItem : bomItems) {
            Part part = bomItem.getPart();
            int requiredQuantity = bomItem.getQuantityRequired() * batchQuantity;

            // Get total available stock for this part
            Integer availableStock = warehouseStockRepository.getTotalAvailableStockByPart(part.getId());
            if (availableStock == null) {
                availableStock = 0;
            }

            int shortage = Math.max(0, requiredQuantity - availableStock);
            boolean partHasStock = availableStock >= requiredQuantity;

            if (!partHasStock) {
                hasSufficientStock = false;
                message.append(String.format("Part %s (%s): Required %d, Available %d, Shortage %d. ",
                        part.getPartNumber(), part.getPartName(), requiredQuantity, availableStock, shortage));
            }

            StockCheckResponse.PartStockStatus status = new StockCheckResponse.PartStockStatus();
            status.setPartId(part.getId());
            status.setPartNumber(part.getPartNumber());
            status.setPartName(part.getPartName());
            status.setRequiredQuantity(requiredQuantity);
            status.setAvailableStock(availableStock);
            status.setShortage(shortage);
            status.setHasSufficientStock(partHasStock);

            partStatuses.add(status);
        }

        StockCheckResponse response = new StockCheckResponse();
        response.setHasSufficientStock(hasSufficientStock);
        response.setPartStockStatus(partStatuses);
        response.setMessage(hasSufficientStock ? "Sufficient stock available" : message.toString());

        return response;
    }

    // Step 2: Start Batch (assign to employee)
    @Transactional
    public BatchResponse startBatch(Long batchId, BatchStartRequest request) {
        log.info("Starting batch: {}, Employee: {}", batchId, request.getEmployeeId());

        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + batchId));

        if (batch.getStatus() != Batch.BatchStatus.PENDING) {
            throw new RuntimeException("Batch cannot be started. Current status: " + batch.getStatus());
        }

        // Assign employee
        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + request.getEmployeeId()));

        if (employee.getRole() != User.Role.EMPLOYEE && employee.getRole() != User.Role.SUPERVISOR) {
            throw new RuntimeException("Only employees or supervisors can be assigned to batches");
        }

        batch.setAssignedEmployee(employee);
        batch.setStatus(Batch.BatchStatus.IN_PROGRESS);
        batch.setStartTime(LocalDateTime.now());
        batch.setExpectedCompletionTime(request.getExpectedCompletionTime());

        if (request.getNotes() != null) {
            batch.setNotes(batch.getNotes() != null ?
                    batch.getNotes() + "\n" + request.getNotes() : request.getNotes());
        }

        Batch updatedBatch = batchRepository.save(batch);
        log.info("Batch started: {}", batchId);

        return convertToResponse(updatedBatch);
    }

    // Step 3: Complete Batch
    @Transactional
    public BatchResponse completeBatch(Long batchId, BatchCompleteRequest request) {
        log.info("Completing batch: {}", batchId);

        Batch batch = batchRepository.findByIdWithItems(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + batchId));

        if (batch.getStatus() != Batch.BatchStatus.IN_PROGRESS &&
                batch.getStatus() != Batch.BatchStatus.DELAYED) {

            throw new RuntimeException(
                    "Only in-progress or delayed batches can be completed. Current status: " + batch.getStatus()
            );
        }

        // Update batch status and times
        batch.setStatus(Batch.BatchStatus.COMPLETED);
        batch.setEndTime(request.getCompletionTime() != null ? request.getCompletionTime() : LocalDateTime.now());
        batch.setActualCompletionTime(batch.getEndTime());

        // Update actual quantity if provided
        if (request.getActualQuantity() != null) {
            batch.setBatchQuantity(request.getActualQuantity());
        }

        if (request.getNotes() != null) {
            batch.setNotes(batch.getNotes() != null ?
                    batch.getNotes() + "\n" + request.getNotes() : request.getNotes());
        }

        // Release any unused reserved stock
        releaseUnusedStock(batch);

        Batch completedBatch = batchRepository.save(batch);
        log.info("Batch completed: {}", batchId);

        return convertToResponse(completedBatch);
    }

    // Cancel batch
    @Transactional
    public BatchResponse cancelBatch(Long batchId, String reason) {
        log.info("Cancelling batch: {}, Reason: {}", batchId, reason);

        Batch batch = batchRepository.findByIdWithItems(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + batchId));

        if (batch.getStatus() == Batch.BatchStatus.COMPLETED ||
                batch.getStatus() == Batch.BatchStatus.CANCELLED) {
            throw new RuntimeException("Cannot cancel batch with status: " + batch.getStatus());
        }

        // Release all reserved stock
        releaseAllStock(batch);

        batch.setStatus(Batch.BatchStatus.CANCELLED);
        batch.setEndTime(LocalDateTime.now());

        if (reason != null) {
            batch.setNotes(batch.getNotes() != null ?
                    batch.getNotes() + "\nCancelled: " + reason : "Cancelled: " + reason);
        }

        Batch cancelledBatch = batchRepository.save(batch);
        log.info("Batch cancelled: {}", batchId);

        return convertToResponse(cancelledBatch);
    }

    // Helper method to release unused stock
    private void releaseUnusedStock(Batch batch) {
        for (BatchItem item : batch.getBatchItems()) {
            if (item.getWarehouseStock() != null && !item.isFullyIssued()) {
                int unusedQuantity = item.getRemainingQuantity();
                if (unusedQuantity > 0) {
                    WarehouseStock stock = item.getWarehouseStock();
                    stock.setReservedQuantity(stock.getReservedQuantity() - unusedQuantity);
                    stock.setAvailableQuantity(stock.getQuantity() - stock.getReservedQuantity());
                    warehouseStockRepository.save(stock);

                    log.debug("Released {} units of part {} from stock {}",
                            unusedQuantity, item.getPart().getPartNumber(), stock.getId());
                }
            }
        }
    }

    // Helper method to release all stock (for cancellation)
    private void releaseAllStock(Batch batch) {
        for (BatchItem item : batch.getBatchItems()) {
            if (item.getWarehouseStock() != null) {
                int reservedQuantity = item.getQuantityRequired() - item.getQuantityUsed();
                if (reservedQuantity > 0) {
                    WarehouseStock stock = item.getWarehouseStock();
                    stock.setReservedQuantity(stock.getReservedQuantity() - reservedQuantity);
                    stock.setAvailableQuantity(stock.getQuantity() - stock.getReservedQuantity());
                    warehouseStockRepository.save(stock);

                    log.debug("Released all {} units of part {} from stock {}",
                            reservedQuantity, item.getPart().getPartNumber(), stock.getId());
                }
            }
        }
    }

    // Step 4: Scheduled job for delay checking
    @Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void checkDelayedBatches() {
        log.info("Checking for delayed batches...");

        LocalDateTime threshold = LocalDateTime.now().minusHours(48);
        List<Batch> delayedBatches = batchRepository.findDelayedBatches(threshold);

        for (Batch batch : delayedBatches) {
            if (batch.getStatus() == Batch.BatchStatus.IN_PROGRESS) {
                batch.setStatus(Batch.BatchStatus.DELAYED);
                batchRepository.save(batch);

                log.warn("Batch {} marked as DELAYED (started at {})",
                        batch.getBatchCode(), batch.getStartTime());
            }
        }

        log.info("Found {} delayed batches", delayedBatches.size());
    }

    // Get all employees for assignment
    @Transactional(readOnly = true)
    public List<UserResponse> getAvailableEmployees() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == User.Role.EMPLOYEE ||
                        user.getRole() == User.Role.SUPERVISOR)
                .filter(User::getIsActive)
                .map(this::convertToUserResponse)
                .collect(Collectors.toList());
    }

    // Get batch dashboard data
    @Transactional(readOnly = true)
    public BatchDashboardResponse getDashboard() {
        BatchDashboardResponse dashboard = new BatchDashboardResponse();

        dashboard.setTotalBatches(batchRepository.count());
        dashboard.setPendingBatches(batchRepository.countByStatus(Batch.BatchStatus.PENDING));
        dashboard.setInProgressBatches(batchRepository.countByStatus(Batch.BatchStatus.IN_PROGRESS));
        dashboard.setCompletedBatches(batchRepository.countByStatus(Batch.BatchStatus.COMPLETED));
        dashboard.setDelayedBatches(batchRepository.countByStatus(Batch.BatchStatus.DELAYED));

        // Get recent batches (last 10)
        dashboard.setRecentBatches(batchRepository.findAll().stream()
                .sorted((b1, b2) -> b2.getCreatedAt().compareTo(b1.getCreatedAt()))
                .limit(10)
                .map(this::convertToResponse)
                .collect(Collectors.toList()));

        // Get delayed batches
        dashboard.setDelayedBatchesList(batchRepository.findByStatus(Batch.BatchStatus.DELAYED).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList()));

        // Get employee summary
        dashboard.setEmployeeSummary(getEmployeeBatchSummary());

        return dashboard;
    }

    private List<EmployeeBatchSummary> getEmployeeBatchSummary() {
        List<User> employees = userRepository.findAll().stream()
                .filter(user -> user.getRole() == User.Role.EMPLOYEE ||
                        user.getRole() == User.Role.SUPERVISOR)
                .filter(User::getIsActive)
                .collect(Collectors.toList());

        List<EmployeeBatchSummary> summary = new ArrayList<>();

        for (User employee : employees) {
            List<Batch> employeeBatches = batchRepository.findByAssignedEmployeeId(employee.getId());

            EmployeeBatchSummary empSummary = new EmployeeBatchSummary();
            empSummary.setEmployeeId(employee.getId());
            empSummary.setEmployeeName(employee.getFullName());
            empSummary.setUsername(employee.getUsername());
            empSummary.setTotalAssigned((long) employeeBatches.size());
            empSummary.setInProgress(employeeBatches.stream()
                    .filter(b -> b.getStatus() == Batch.BatchStatus.IN_PROGRESS)
                    .count());
            empSummary.setCompleted(employeeBatches.stream()
                    .filter(b -> b.getStatus() == Batch.BatchStatus.COMPLETED)
                    .count());
            empSummary.setDelayed(employeeBatches.stream()
                    .filter(b -> b.getStatus() == Batch.BatchStatus.DELAYED)
                    .count());

            summary.add(empSummary);
        }

        return summary;
    }

    // Get batch by ID
    @Transactional(readOnly = true)
    public BatchResponse getBatchById(Long id) {
        Batch batch = batchRepository.findByIdWithItems(id)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + id));
        return convertToResponse(batch);
    }

    // Get all batches
    @Transactional(readOnly = true)
    public List<BatchResponse> getAllBatches() {
        return batchRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Get batches by status
    @Transactional(readOnly = true)
    public List<BatchResponse> getBatchesByStatus(Batch.BatchStatus status) {
        return batchRepository.findByStatus(status).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Get batches by employee
    @Transactional(readOnly = true)
    public List<BatchResponse> getBatchesByEmployee(Long employeeId) {
        return batchRepository.findByAssignedEmployeeId(employeeId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Update batch
    @Transactional
    public BatchResponse updateBatch(Long id, BatchUpdateRequest request) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + id));

        if (request.getNotes() != null) {
            batch.setNotes(request.getNotes());
        }

        if (request.getPriority() != null) {
            batch.setPriority(request.getPriority());
        }

        if (request.getAssignedEmployeeId() != null) {
            User employee = userRepository.findById(request.getAssignedEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + request.getAssignedEmployeeId()));
            batch.setAssignedEmployee(employee);
        }

        if (request.getStatus() != null) {
            batch.setStatus(request.getStatus());

            // Handle status-specific logic
            if (request.getStatus() == Batch.BatchStatus.IN_PROGRESS && batch.getStartTime() == null) {
                batch.setStartTime(LocalDateTime.now());
            } else if (request.getStatus() == Batch.BatchStatus.COMPLETED && batch.getEndTime() == null) {
                batch.setEndTime(LocalDateTime.now());
                releaseUnusedStock(batch);
            } else if (request.getStatus() == Batch.BatchStatus.CANCELLED) {
                releaseAllStock(batch);
            }
        }

        Batch updatedBatch = batchRepository.save(batch);
        return convertToResponse(updatedBatch);
    }

    // Stock check before creating batch
    @Transactional(readOnly = true)
    public StockCheckResponse preCheckStock(Long productId, Integer batchQuantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));

        return checkStockAvailability(product, batchQuantity);
    }

    // Conversion methods
    private BatchResponse convertToResponse(Batch batch) {
        BatchResponse response = new BatchResponse();
        response.setId(batch.getId());
        response.setBatchCode(batch.getBatchCode());
        response.setProduct(convertToProductResponse(batch.getProduct()));
        response.setBatchQuantity(batch.getBatchQuantity());
        response.setStatus(batch.getStatus());
        response.setPriority(batch.getPriority());
        response.setStartTime(batch.getStartTime());
        response.setEndTime(batch.getEndTime());
        response.setExpectedCompletionTime(batch.getExpectedCompletionTime());
        response.setActualCompletionTime(batch.getActualCompletionTime());
        response.setNotes(batch.getNotes());
        response.setCreatedBy(batch.getCreatedBy());
        response.setCreatedAt(batch.getCreatedAt());
        response.setUpdatedAt(batch.getUpdatedAt());

        // Calculate additional fields
        response.setTotalPartsRequired(batch.getTotalPartsRequired());
        response.setTotalPartsUsed(batch.getTotalPartsUsed());
        response.setIsDelayed(batch.isDelayed());

        if (batch.getStartTime() != null && batch.getStatus() == Batch.BatchStatus.IN_PROGRESS) {
            long hours = ChronoUnit.HOURS.between(batch.getStartTime(), LocalDateTime.now());
            response.setDelayHours(Math.max(0, hours - 48));
        }

        // Calculate progress percentage
        if (batch.getTotalPartsRequired() > 0) {
            int progress = (int) ((batch.getTotalPartsUsed() * 100.0) / batch.getTotalPartsRequired());
            response.setProgressPercentage(Math.min(100, progress));
        } else {
            response.setProgressPercentage(0);
        }

        // Convert assigned employee if exists
        if (batch.getAssignedEmployee() != null) {
            response.setAssignedEmployee(convertToUserResponse(batch.getAssignedEmployee()));
        }

        // Convert batch items if needed
        if (batch.getBatchItems() != null && !batch.getBatchItems().isEmpty()) {
            List<BatchItemResponse> itemResponses = batch.getBatchItems().stream()
                    .map(this::convertToBatchItemResponse)
                    .collect(Collectors.toList());
            response.setBatchItems(itemResponses);
        }

        return response;
    }

    private BatchItemResponse convertToBatchItemResponse(BatchItem batchItem) {
        BatchItemResponse response = new BatchItemResponse();
        response.setId(batchItem.getId());
        response.setPart(convertToPartResponse(batchItem.getPart()));
        response.setQuantityRequired(batchItem.getQuantityRequired());
        response.setQuantityUsed(batchItem.getQuantityUsed());
        response.setRemainingQuantity(batchItem.getRemainingQuantity());
        response.setIsIssued(batchItem.getIsIssued());
        response.setIssuedAt(batchItem.getIssuedAt());
        response.setRemarks(batchItem.getRemarks());

        return response;
    }

    private ProductResponse convertToProductResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setProductCode(product.getProductCode());
        response.setProductName(product.getProductName());
        response.setDescription(product.getDescription());
        response.setUom(product.getUom());
        response.setIsActive(product.getIsActive());
        response.setHasBom(product.getHasBom());
        response.setCreatedBy(product.getCreatedBy());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());
        return response;
    }

    private PartResponse convertToPartResponse(Part part) {
        PartResponse response = new PartResponse();
        response.setId(part.getId());
        response.setPartNumber(part.getPartNumber());
        response.setPartName(part.getPartName());
        response.setPartType(part.getPartType());
        response.setClassCode(part.getClassCode());
        response.setIsActive(part.getIsActive());
        return response;
    }

    private UserResponse convertToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getIsActive(),
                user.getCreatedAt(),
                user.getLastLogin()
        );
    }
}