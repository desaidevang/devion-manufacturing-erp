package com.devion.erp.service;

import com.devion.erp.dto.*;
import com.devion.erp.entity.*;
import com.devion.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarehouseStockService {

    private final WarehouseStockRepository stockRepository;
    private final PartRepository partRepository;
    private final WarehouseLocationRepository locationRepository;
    private final SupplierRepository supplierRepository;  // Add this
    private final InventoryMovementRepository movementRepository;  // Add this

    @Transactional
    public WarehouseStockResponse createStock(WarehouseStockCreateRequest request) {
        log.info("Creating warehouse stock");

        // Validate part
        Part part = partRepository.findById(request.getPartId())
                .orElseThrow(() -> new RuntimeException("Part not found with ID: " + request.getPartId()));

        if (!part.getIsActive()) {
            throw new RuntimeException("Part is not active");
        }

        // Validate warehouse location
        WarehouseLocation location = locationRepository.findById(request.getWarehouseLocationId())
                .orElseThrow(() -> new RuntimeException("Warehouse location not found with ID: " + request.getWarehouseLocationId()));

        if (!location.getIsActive()) {
            throw new RuntimeException("Warehouse location is not active");
        }

        // Validate supplier if provided
        Supplier supplier = null;
        if (request.getSupplierId() != null) {
            supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new RuntimeException("Supplier not found with ID: " + request.getSupplierId()));
        }

        // Check capacity
        if (location.getCapacity() != null) {
            int availableCapacity = location.getAvailableCapacity();
            if (availableCapacity < request.getQuantity()) {
                throw new RuntimeException("Insufficient capacity in warehouse location. Available: " +
                        availableCapacity + ", Requested: " + request.getQuantity());
            }
        }

        // Check for existing stock with same batch in same location
        if (request.getBatchNumber() != null && !request.getBatchNumber().isEmpty()) {
            Optional<WarehouseStock> existingStock = stockRepository.findByPartIdAndWarehouseLocationIdAndBatchNumber(
                    part.getId(), location.getId(), request.getBatchNumber());
            if (existingStock.isPresent()) {
                throw new RuntimeException("Stock already exists for part " + part.getPartNumber() +
                        " with batch " + request.getBatchNumber() + " in location " + location.getLocationCode());
            }
        }

        // Create stock
        WarehouseStock stock = new WarehouseStock();
        stock.setPart(part);
        stock.setWarehouseLocation(location);
        stock.setSupplier(supplier);
        stock.setQuantity(request.getQuantity());
        stock.setBatchNumber(request.getBatchNumber());
        stock.setSupplierBatchNumber(request.getSupplierBatchNumber());
        stock.setSupplierInvoiceNumber(request.getSupplierInvoiceNumber());
        stock.setSupplierDeliveryDate(request.getSupplierDeliveryDate());
        stock.setHeatNumber(request.getHeatNumber());
        stock.setUnitPrice(request.getUnitPrice());
        stock.setMinimumStockLevel(request.getMinimumStockLevel());
        stock.setMaximumStockLevel(request.getMaximumStockLevel());
        stock.setReorderLevel(request.getReorderLevel());
        stock.setShelfLifeDays(request.getShelfLifeDays());
        stock.setManufacturingDate(request.getManufacturingDate());
        stock.setExpiryDate(request.getExpiryDate());
        stock.setGrnNumber(request.getGrnNumber());
        stock.setRemarks(request.getRemarks());
        stock.setStockStatus(WarehouseStock.StockStatus.ACTIVE);

        // Set default stock levels if not provided
        if (stock.getMinimumStockLevel() == null || stock.getMinimumStockLevel() == 0) {
            setDefaultStockLevels(stock, part);
        }

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        stock.setCreatedBy(currentUser);

        // Update location occupancy
        location.setCurrentOccupancy(location.getCurrentOccupancy() + request.getQuantity());
        locationRepository.save(location);

        WarehouseStock savedStock = stockRepository.save(stock);

        // Create movement history
        createMovementHistory(savedStock, null, location, request.getQuantity(),
                InventoryMovement.MovementType.RECEIPT,
                request.getGrnNumber() != null ? "GRN-" + request.getGrnNumber() : "STK-" + savedStock.getId(),
                "STOCK_CREATION",
                currentUser);

        log.info("Warehouse stock created successfully: ID {}", savedStock.getId());

        return convertToStockResponse(savedStock);
    }

    private void createMovementHistory(WarehouseStock stock, WarehouseLocation fromLocation,
                                       WarehouseLocation toLocation, Integer quantity,
                                       InventoryMovement.MovementType movementType,
                                       String referenceNumber, String referenceType, String performedBy) {
        InventoryMovement movement = new InventoryMovement();
        movement.setWarehouseStock(stock);
        movement.setFromLocation(fromLocation);
        movement.setToLocation(toLocation);
        movement.setQuantity(quantity);
        movement.setMovementType(movementType);
        movement.setReferenceNumber(referenceNumber);
        movement.setReferenceType(referenceType);
        movement.setPerformedBy(performedBy);
        movement.setRemarks("Automated movement record");

        movementRepository.save(movement);
    }

    @Transactional
    public WarehouseStockResponse moveStock(StockMovementRequest request) {
        log.info("Moving stock: {}", request);

        WarehouseStock stock = stockRepository.findById(request.getStockId())
                .orElseThrow(() -> new RuntimeException("Stock not found with ID: " + request.getStockId()));

        // Validate quantity
        if (request.getQuantity() > stock.getAvailableQuantity()) {
            throw new RuntimeException("Insufficient available quantity. Available: " +
                    stock.getAvailableQuantity() + ", Requested: " + request.getQuantity());
        }

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();

        switch (request.getMovementType()) {
            case TRANSFER:
                return transferStock(stock, request, currentUser);
            case RESERVE:
                return reserveStock(stock, request, currentUser);
            case UNRESERVE:
                return unreserveStock(stock, request, currentUser);
            case ADJUSTMENT:
                return adjustStock(stock, request, currentUser);
            case QUARANTINE:
                return quarantineStock(stock, request, currentUser);
            case RELEASE:
                return releaseStock(stock, request, currentUser);
            default:
                throw new RuntimeException("Unsupported movement type: " + request.getMovementType());
        }
    }

    private WarehouseStockResponse transferStock(WarehouseStock stock, StockMovementRequest request, String user) {
        // Validate target location
        if (request.getToLocationId() == null) {
            throw new RuntimeException("Target location ID is required for transfer");
        }

        WarehouseLocation toLocation = locationRepository.findById(request.getToLocationId())
                .orElseThrow(() -> new RuntimeException("Target location not found with ID: " + request.getToLocationId()));

        if (!toLocation.getIsActive()) {
            throw new RuntimeException("Target location is not active");
        }

        // Check target location capacity
        if (toLocation.getCapacity() != null) {
            if (toLocation.getAvailableCapacity() < request.getQuantity()) {
                throw new RuntimeException("Insufficient capacity in target location. Available: " +
                        toLocation.getAvailableCapacity() + ", Requested: " + request.getQuantity());
            }
        }

        // Create new stock in target location
        WarehouseStock newStock = new WarehouseStock();
        newStock.setPart(stock.getPart());
        newStock.setWarehouseLocation(toLocation);
        newStock.setSupplier(stock.getSupplier());
        newStock.setQuantity(request.getQuantity());
        newStock.setBatchNumber(stock.getBatchNumber());
        newStock.setSupplierBatchNumber(stock.getSupplierBatchNumber());
        newStock.setSupplierInvoiceNumber(stock.getSupplierInvoiceNumber());
        newStock.setSupplierDeliveryDate(stock.getSupplierDeliveryDate());
        newStock.setHeatNumber(stock.getHeatNumber());
        newStock.setUnitPrice(stock.getUnitPrice());
        newStock.setMinimumStockLevel(stock.getMinimumStockLevel());
        newStock.setMaximumStockLevel(stock.getMaximumStockLevel());
        newStock.setReorderLevel(stock.getReorderLevel());
        newStock.setShelfLifeDays(stock.getShelfLifeDays());
        newStock.setManufacturingDate(stock.getManufacturingDate());
        newStock.setExpiryDate(stock.getExpiryDate());
        newStock.setStockStatus(WarehouseStock.StockStatus.ACTIVE);
        newStock.setRemarks("Transferred from " + stock.getWarehouseLocation().getLocationCode() +
                ". " + request.getRemarks());
        newStock.setCreatedBy(user);
        newStock.setGrnNumber(stock.getGrnNumber());
        newStock.setGrnItemId(stock.getGrnItemId());

        // Reduce source stock
        stock.setQuantity(stock.getQuantity() - request.getQuantity());
        stock.setRemarks("Transferred to " + toLocation.getLocationCode() + ". " + request.getRemarks());

        // Update source location occupancy
        WarehouseLocation fromLocation = stock.getWarehouseLocation();
        fromLocation.setCurrentOccupancy(fromLocation.getCurrentOccupancy() - request.getQuantity());

        // Update target location occupancy
        toLocation.setCurrentOccupancy(toLocation.getCurrentOccupancy() + request.getQuantity());

        locationRepository.save(fromLocation);
        locationRepository.save(toLocation);

        WarehouseStock savedStock = stockRepository.save(newStock);
        stockRepository.save(stock);

        // Create movement history AFTER variables are defined
        createMovementHistory(stock, fromLocation, toLocation, request.getQuantity(),
                InventoryMovement.MovementType.TRANSFER,
                "TRF-" + System.currentTimeMillis(),
                "TRANSFER",
                user);

        return convertToStockResponse(savedStock);
    }

    private WarehouseStockResponse reserveStock(WarehouseStock stock, StockMovementRequest request, String user) {
        stock.setReservedQuantity(stock.getReservedQuantity() + request.getQuantity());
        stock.setRemarks("Reserved: " + request.getRemarks());

        // Create movement history for reservation
        createMovementHistory(stock, null, null, request.getQuantity(),
                InventoryMovement.MovementType.RESERVATION,
                "RES-" + System.currentTimeMillis(),
                "RESERVATION",
                user);

        WarehouseStock savedStock = stockRepository.save(stock);
        return convertToStockResponse(savedStock);
    }

    private WarehouseStockResponse unreserveStock(WarehouseStock stock, StockMovementRequest request, String user) {
        if (request.getQuantity() > stock.getReservedQuantity()) {
            throw new RuntimeException("Cannot unreserve more than reserved quantity. Reserved: " +
                    stock.getReservedQuantity() + ", Requested: " + request.getQuantity());
        }

        stock.setReservedQuantity(stock.getReservedQuantity() - request.getQuantity());
        stock.setRemarks("Unreserved: " + request.getRemarks());

        // Create movement history for unreservation
        createMovementHistory(stock, null, null, request.getQuantity(),
                InventoryMovement.MovementType.RELEASE,
                "UNRES-" + System.currentTimeMillis(),
                "UNRESERVE",
                user);

        WarehouseStock savedStock = stockRepository.save(stock);
        return convertToStockResponse(savedStock);
    }

    private WarehouseStockResponse adjustStock(WarehouseStock stock, StockMovementRequest request, String user) {
        // This is for quantity adjustments (positive or negative)
        int newQuantity = stock.getQuantity() + request.getQuantity();
        if (newQuantity < 0) {
            throw new RuntimeException("Cannot adjust quantity to negative value");
        }

        int quantityChange = request.getQuantity();
        stock.setQuantity(newQuantity);
        stock.setRemarks("Quantity adjusted by " + quantityChange + ". " + request.getRemarks());

        // Update location occupancy
        WarehouseLocation location = stock.getWarehouseLocation();
        location.setCurrentOccupancy(location.getCurrentOccupancy() + quantityChange);
        locationRepository.save(location);

        // Create movement history for adjustment
        createMovementHistory(stock, null, location, quantityChange,
                InventoryMovement.MovementType.ADJUSTMENT,
                "ADJ-" + System.currentTimeMillis(),
                "ADJUSTMENT",
                user);

        WarehouseStock savedStock = stockRepository.save(stock);
        return convertToStockResponse(savedStock);
    }

    private WarehouseStockResponse quarantineStock(WarehouseStock stock, StockMovementRequest request, String user) {
        // Find quarantine location
        List<WarehouseLocation> quarantineLocations = locationRepository.findByIsQuarantineTrue();
        if (quarantineLocations.isEmpty()) {
            throw new RuntimeException("No quarantine location configured");
        }

        WarehouseLocation quarantineLocation = quarantineLocations.get(0);

        // Check quarantine location capacity
        if (quarantineLocation.getCapacity() != null) {
            if (quarantineLocation.getAvailableCapacity() < request.getQuantity()) {
                throw new RuntimeException("Insufficient capacity in quarantine location. Available: " +
                        quarantineLocation.getAvailableCapacity() + ", Requested: " + request.getQuantity());
            }
        }

        // Create stock in quarantine
        WarehouseStock quarantineStock = new WarehouseStock();
        quarantineStock.setPart(stock.getPart());
        quarantineStock.setWarehouseLocation(quarantineLocation);
        quarantineStock.setSupplier(stock.getSupplier());
        quarantineStock.setQuantity(request.getQuantity());
        quarantineStock.setBatchNumber(stock.getBatchNumber());
        quarantineStock.setSupplierBatchNumber(stock.getSupplierBatchNumber());
        quarantineStock.setSupplierInvoiceNumber(stock.getSupplierInvoiceNumber());
        quarantineStock.setSupplierDeliveryDate(stock.getSupplierDeliveryDate());
        quarantineStock.setHeatNumber(stock.getHeatNumber());
        quarantineStock.setUnitPrice(stock.getUnitPrice());
        quarantineStock.setMinimumStockLevel(stock.getMinimumStockLevel());
        quarantineStock.setMaximumStockLevel(stock.getMaximumStockLevel());
        quarantineStock.setReorderLevel(stock.getReorderLevel());
        quarantineStock.setShelfLifeDays(stock.getShelfLifeDays());
        quarantineStock.setManufacturingDate(stock.getManufacturingDate());
        quarantineStock.setExpiryDate(stock.getExpiryDate());
        quarantineStock.setStockStatus(WarehouseStock.StockStatus.QUARANTINE);
        quarantineStock.setRemarks("Quarantined: " + request.getRemarks());
        quarantineStock.setCreatedBy(user);
        quarantineStock.setGrnNumber(stock.getGrnNumber());
        quarantineStock.setGrnItemId(stock.getGrnItemId());

        // Reduce original stock
        stock.setQuantity(stock.getQuantity() - request.getQuantity());

        // Update locations
        WarehouseLocation originalLocation = stock.getWarehouseLocation();
        originalLocation.setCurrentOccupancy(originalLocation.getCurrentOccupancy() - request.getQuantity());
        quarantineLocation.setCurrentOccupancy(quarantineLocation.getCurrentOccupancy() + request.getQuantity());

        locationRepository.save(originalLocation);
        locationRepository.save(quarantineLocation);

        stockRepository.save(stock);
        WarehouseStock savedStock = stockRepository.save(quarantineStock);

        // Create movement history for quarantine
        createMovementHistory(stock, originalLocation, quarantineLocation, request.getQuantity(),
                InventoryMovement.MovementType.QUARANTINE,
                "QTN-" + System.currentTimeMillis(),
                "QUARANTINE",
                user);

        return convertToStockResponse(savedStock);
    }

    private WarehouseStockResponse releaseStock(WarehouseStock stock, StockMovementRequest request, String user) {
        log.info("Releasing stock from quarantine. Stock ID: {}, Status: {}",
                stock.getId(), stock.getStockStatus());

        // Validate stock is in quarantine
        if (stock.getStockStatus() != WarehouseStock.StockStatus.QUARANTINE) {
            String errorMsg = String.format("Only quarantine stock can be released. Current status: %s",
                    stock.getStockStatus());
            log.error(errorMsg);
            throw new RuntimeException(errorMsg);
        }

        // Validate target location if provided
        WarehouseLocation storageLocation;
        if (request.getToLocationId() != null) {
            storageLocation = locationRepository.findById(request.getToLocationId())
                    .orElseThrow(() -> new RuntimeException("Target location not found with ID: " + request.getToLocationId()));

            // Validate location is not quarantine
            if (storageLocation.getIsQuarantine()) {
                throw new RuntimeException("Cannot release quarantine stock to another quarantine location");
            }
        } else {
            // If no location specified, find suitable one
            storageLocation = findSuitableLocation(stock.getPart(), request.getQuantity());
        }

        // Check capacity
        if (storageLocation.getCapacity() != null) {
            if (storageLocation.getAvailableCapacity() < request.getQuantity()) {
                throw new RuntimeException("Insufficient capacity in target location. Available: " +
                        storageLocation.getAvailableCapacity() + ", Requested: " + request.getQuantity());
            }
        }

        // Create stock in storage location
        WarehouseStock storageStock = new WarehouseStock();
        storageStock.setPart(stock.getPart());
        storageStock.setWarehouseLocation(storageLocation);
        storageStock.setSupplier(stock.getSupplier());
        storageStock.setQuantity(request.getQuantity());
        storageStock.setBatchNumber(stock.getBatchNumber());
        storageStock.setSupplierBatchNumber(stock.getSupplierBatchNumber());
        storageStock.setSupplierInvoiceNumber(stock.getSupplierInvoiceNumber());
        storageStock.setSupplierDeliveryDate(stock.getSupplierDeliveryDate());
        storageStock.setHeatNumber(stock.getHeatNumber());
        storageStock.setUnitPrice(stock.getUnitPrice());
        storageStock.setMinimumStockLevel(stock.getMinimumStockLevel());
        storageStock.setMaximumStockLevel(stock.getMaximumStockLevel());
        storageStock.setReorderLevel(stock.getReorderLevel());
        storageStock.setShelfLifeDays(stock.getShelfLifeDays());
        storageStock.setManufacturingDate(stock.getManufacturingDate());
        storageStock.setExpiryDate(stock.getExpiryDate());

        // CRITICAL FIX: Set stock status correctly
        storageStock.setStockStatus(WarehouseStock.StockStatus.ACTIVE);

        storageStock.setRemarks("Released from quarantine: " + request.getRemarks());
        storageStock.setCreatedBy(user);
        storageStock.setGrnNumber(stock.getGrnNumber());
        storageStock.setGrnItemId(stock.getGrnItemId());

        log.info("Creating released stock with status: {}", storageStock.getStockStatus());

        // Reduce quarantine stock
        stock.setQuantity(stock.getQuantity() - request.getQuantity());

        // If quarantine stock becomes zero, update its status or delete
        if (stock.getQuantity() <= 0) {
            stock.setStockStatus(WarehouseStock.StockStatus.EXPIRED); // Or mark as released
            stock.setRemarks("Fully released from quarantine. " + request.getRemarks());
        }

        // Update locations occupancy
        WarehouseLocation quarantineLocation = stock.getWarehouseLocation();
        quarantineLocation.setCurrentOccupancy(quarantineLocation.getCurrentOccupancy() - request.getQuantity());
        storageLocation.setCurrentOccupancy(storageLocation.getCurrentOccupancy() + request.getQuantity());

        locationRepository.save(quarantineLocation);
        locationRepository.save(storageLocation);

        stockRepository.save(stock);
        WarehouseStock savedStock = stockRepository.save(storageStock);

        // Create movement history for release
        createMovementHistory(stock, quarantineLocation, storageLocation, request.getQuantity(),
                InventoryMovement.MovementType.RELEASE,
                "REL-" + System.currentTimeMillis(),
                "RELEASE",
                user);

        log.info("Successfully released stock {} to location {}",
                savedStock.getId(), storageLocation.getLocationCode());

        return convertToStockResponse(savedStock);
    }


    private WarehouseLocation findSuitableLocation(Part part, int quantity) {
        // Find active, non-quarantine location for the part type
        List<WarehouseLocation> locations = locationRepository.findByIsActiveTrueAndIsQuarantineFalse();

        // Filter by location type based on part type
        WarehouseLocation.LocationType targetType;
        switch (part.getPartType()) {
            case RAW_MATERIAL:
                targetType = WarehouseLocation.LocationType.RAW_MATERIAL;
                break;
            case FINISHED_GOODS:
                targetType = WarehouseLocation.LocationType.FINISHED_GOODS;
                break;
            case SEMI_FINISHED:
                targetType = WarehouseLocation.LocationType.SEMI_FINISHED;
                break;
            default:
                targetType = WarehouseLocation.LocationType.GENERAL_STORE;
        }

        return locations.stream()
                .filter(loc -> loc.getLocationType() == targetType)
                .filter(loc -> loc.getCapacity() == null || loc.getAvailableCapacity() >= quantity)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No suitable storage location found for part type: " + part.getPartType()));
    }

    private void setDefaultStockLevels(WarehouseStock stock, Part part) {
        // Set default stock levels based on part type
        switch (part.getPartType()) {
            case RAW_MATERIAL:
                stock.setMinimumStockLevel(100);
                stock.setMaximumStockLevel(1000);
                stock.setReorderLevel(150);
                break;
            case COMPONENT:
                stock.setMinimumStockLevel(50);
                stock.setMaximumStockLevel(500);
                stock.setReorderLevel(75);
                break;
            case ASSEMBLY:
                stock.setMinimumStockLevel(10);
                stock.setMaximumStockLevel(100);
                stock.setReorderLevel(20);
                break;
            default:
                stock.setMinimumStockLevel(25);
                stock.setMaximumStockLevel(250);
                stock.setReorderLevel(50);
        }

        if (part.getClassCode() == Part.ClassCode.CRITICAL) {
            stock.setMinimumStockLevel(stock.getMinimumStockLevel() * 2);
            stock.setReorderLevel(stock.getReorderLevel() * 2);
        }
    }

    @Transactional(readOnly = true)
    public List<WarehouseStockResponse> getAllStocks() {
        return stockRepository.findAll().stream()
                .map(this::convertToStockResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WarehouseStockResponse getStockById(Long id) {
        WarehouseStock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock not found with ID: " + id));
        return convertToStockResponse(stock);
    }

    @Transactional(readOnly = true)
    public List<WarehouseStockResponse> getStocksByPart(Long partId) {
        return stockRepository.findByPartId(partId).stream()
                .map(this::convertToStockResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WarehouseStockResponse> getStocksByLocation(Long locationId) {
        return stockRepository.findByWarehouseLocationId(locationId).stream()
                .map(this::convertToStockResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WarehouseStockResponse> getLowStockItems() {
        return stockRepository.findLowStockItems().stream()
                .map(this::convertToStockResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WarehouseStockResponse> getExpiringSoonItems() {
        // Get items expiring in the next 30 days
        LocalDate thresholdDate = LocalDate.now().plusDays(30);
        return stockRepository.findExpiringSoon(thresholdDate).stream()
                .map(this::convertToStockResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Integer getTotalStockByPart(Long partId) {
        Integer total = stockRepository.getTotalStockByPart(partId);
        return total != null ? total : 0;
    }

    @Transactional(readOnly = true)
    public Integer getAvailableStockByPart(Long partId) {
        Integer available = stockRepository.getTotalAvailableStockByPart(partId);
        return available != null ? available : 0;
    }

    // NEW METHODS FOR LOCATION STOCK DETAILS
    @Transactional(readOnly = true)
    public List<LocationStockDetailResponse> getLocationStockDetails(Long locationId) {
        WarehouseLocation location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found with ID: " + locationId));

        List<WarehouseStock> stocks = stockRepository.findByWarehouseLocationId(locationId);

        return stocks.stream()
                .map(this::convertToLocationStockDetailResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LocationStockDetailResponse> getLocationStockDetailsByCode(String locationCode) {
        WarehouseLocation location = locationRepository.findByLocationCode(locationCode)
                .orElseThrow(() -> new RuntimeException("Location not found with code: " + locationCode));

        return getLocationStockDetails(location.getId());
    }

    @Transactional(readOnly = true)
    public List<InventoryMovementResponse> getMovementHistory(Long stockId, Long locationId,
                                                              LocalDate fromDate, LocalDate toDate) {
        LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toDateTime = toDate != null ? toDate.plusDays(1).atStartOfDay() : null;

        List<InventoryMovement> movements = movementRepository.findMovements(stockId, locationId,
                fromDateTime, toDateTime);

        return movements.stream()
                .map(this::convertToMovementResponse)
                .collect(Collectors.toList());
    }

    private WarehouseStockResponse convertToStockResponse(WarehouseStock stock) {
        WarehouseStockResponse response = new WarehouseStockResponse();
        response.setId(stock.getId());

        // Convert part
        Part part = stock.getPart();
        PartResponse partResponse = new PartResponse();
        partResponse.setId(part.getId());
        partResponse.setPartNumber(part.getPartNumber());
        partResponse.setPartName(part.getPartName());
        partResponse.setPartType(part.getPartType());
        partResponse.setClassCode(part.getClassCode());
        response.setPart(partResponse);

        // Convert location
        WarehouseLocation location = stock.getWarehouseLocation();
        WarehouseLocationResponse locationResponse = new WarehouseLocationResponse();
        locationResponse.setId(location.getId());
        locationResponse.setLocationCode(location.getLocationCode());
        locationResponse.setLocationName(location.getLocationName());
        locationResponse.setLocationType(location.getLocationType());
        locationResponse.setZone(location.getZone());
        locationResponse.setRack(location.getRack());
        locationResponse.setShelf(location.getShelf());
        locationResponse.setBin(location.getBin());
        locationResponse.setCapacity(location.getCapacity());
        locationResponse.setCurrentOccupancy(location.getCurrentOccupancy());
        locationResponse.setAvailableCapacity(location.getAvailableCapacity());
        locationResponse.setIsQuarantine(location.getIsQuarantine());
        response.setWarehouseLocation(locationResponse);

        // Convert supplier if exists - UPDATED to match your SupplierResponse DTO
        if (stock.getSupplier() != null) {
            Supplier supplier = stock.getSupplier();
            SupplierResponse supplierResponse = new SupplierResponse();
            supplierResponse.setId(supplier.getId());
            supplierResponse.setSupplierName(supplier.getSupplierName());
            supplierResponse.setSupplierCode(supplier.getSupplierCode());
            supplierResponse.setContactPerson(supplier.getContactPerson());
            supplierResponse.setEmail(supplier.getEmail());
            supplierResponse.setPhone(supplier.getPhone());
            supplierResponse.setAddress(supplier.getAddress());
            supplierResponse.setGstNumber(supplier.getGstNumber());
            supplierResponse.setPanNumber(supplier.getPanNumber());
            supplierResponse.setPaymentTerms(supplier.getPaymentTerms());
            supplierResponse.setRating(supplier.getRating());
            supplierResponse.setStatus(supplier.getStatus());
            supplierResponse.setIsApproved(supplier.getIsApproved());
            supplierResponse.setCreatedBy(supplier.getCreatedBy());
            supplierResponse.setCreatedAt(supplier.getCreatedAt());
            supplierResponse.setUpdatedAt(supplier.getUpdatedAt());

            // Calculate isActive based on status
            boolean isActive = supplier.getStatus() == Supplier.SupplierStatus.ACTIVE;
            supplierResponse.setIsActive(isActive);

            response.setSupplier(supplierResponse);
        }

        // Set other fields - MAKE SURE YOUR DTO HAS THESE FIELDS
        response.setBatchNumber(stock.getBatchNumber());
        response.setLotNumber(stock.getLotNumber());
        response.setHeatNumber(stock.getHeatNumber());
        response.setGrnNumber(stock.getGrnNumber());
        response.setSupplierBatchNumber(stock.getSupplierBatchNumber());
        response.setSupplierInvoiceNumber(stock.getSupplierInvoiceNumber());
        response.setSupplierDeliveryDate(stock.getSupplierDeliveryDate());
        response.setQuantity(stock.getQuantity());
        response.setReservedQuantity(stock.getReservedQuantity());
        response.setAvailableQuantity(stock.getAvailableQuantity());
        response.setUnitPrice(stock.getUnitPrice());
        response.setTotalValue(stock.getTotalValue());
        response.setMinimumStockLevel(stock.getMinimumStockLevel());
        response.setMaximumStockLevel(stock.getMaximumStockLevel());
        response.setReorderLevel(stock.getReorderLevel());
        response.setShelfLifeDays(stock.getShelfLifeDays());
        response.setManufacturingDate(stock.getManufacturingDate());
        response.setExpiryDate(stock.getExpiryDate());
        response.setStockStatus(stock.getStockStatus() != null ? stock.getStockStatus().name() : null);
        response.setRemarks(stock.getRemarks());
        response.setCreatedBy(stock.getCreatedBy());
        response.setCreatedAt(stock.getCreatedAt());
        response.setUpdatedAt(stock.getUpdatedAt());

        return response;
    }


    private LocationStockDetailResponse convertToLocationStockDetailResponse(WarehouseStock stock) {
        LocationStockDetailResponse response = new LocationStockDetailResponse();

        // Stock information
        response.setStockId(stock.getId());
        response.setQuantity(stock.getQuantity());
        response.setAvailableQuantity(stock.getAvailableQuantity());
        response.setReservedQuantity(stock.getReservedQuantity());
        response.setUnitPrice(stock.getUnitPrice());
        response.setTotalValue(stock.getTotalValue());
        response.setStockStatus(stock.getStockStatus() != null ? stock.getStockStatus().name() : null);

        // Batch information
        response.setBatchNumber(stock.getBatchNumber());
        response.setSupplierBatchNumber(stock.getSupplierBatchNumber());
        response.setLotNumber(stock.getLotNumber());
        response.setHeatNumber(stock.getHeatNumber());
        response.setGrnNumber(stock.getGrnNumber()); // Make sure this field exists in DTO

        // Date information
        response.setManufacturingDate(stock.getManufacturingDate());
        response.setExpiryDate(stock.getExpiryDate());
        response.setSupplierDeliveryDate(stock.getSupplierDeliveryDate());
        response.setStockCreatedAt(stock.getCreatedAt());
        response.setStockUpdatedAt(stock.getUpdatedAt());

        // Supplier information
        if (stock.getSupplier() != null) {
            response.setSupplierId(stock.getSupplier().getId());
            response.setSupplierName(stock.getSupplier().getSupplierName());
            response.setSupplierCode(stock.getSupplier().getSupplierCode());
            response.setSupplierBatchNumber(stock.getSupplierBatchNumber());
            response.setSupplierInvoiceNumber(stock.getSupplierInvoiceNumber());
        }

        // Part information
        Part part = stock.getPart();
        response.setPartId(part.getId());
        response.setPartNumber(part.getPartNumber());
        response.setPartName(part.getPartName());
        response.setPartType(part.getPartType() != null ? part.getPartType().name() : null);

        // Location information
        WarehouseLocation location = stock.getWarehouseLocation();
        response.setLocationId(location.getId());
        response.setLocationCode(location.getLocationCode());
        response.setLocationName(location.getLocationName());
        response.setLocationType(location.getLocationType() != null ? location.getLocationType().name() : null);
        response.setZone(location.getZone());
        response.setRack(location.getRack());
        response.setShelf(location.getShelf());
        response.setBin(location.getBin());
        response.setIsQuarantine(location.getIsQuarantine());

        // Stock levels
        response.setMinimumStockLevel(stock.getMinimumStockLevel());
        response.setMaximumStockLevel(stock.getMaximumStockLevel());
        response.setReorderLevel(stock.getReorderLevel());
        response.setShelfLifeDays(stock.getShelfLifeDays());

        response.setRemarks(stock.getRemarks());

        return response;
    }


    private InventoryMovementResponse convertToMovementResponse(InventoryMovement movement) {
        InventoryMovementResponse response = new InventoryMovementResponse();
        response.setId(movement.getId());

        if (movement.getWarehouseStock() != null) {
            response.setStockId(movement.getWarehouseStock().getId());
            if (movement.getWarehouseStock().getPart() != null) {
                response.setPartNumber(movement.getWarehouseStock().getPart().getPartNumber());
                response.setPartName(movement.getWarehouseStock().getPart().getPartName());
            }
        }

        if (movement.getFromLocation() != null) {
            response.setFromLocationCode(movement.getFromLocation().getLocationCode());
            response.setFromLocationName(movement.getFromLocation().getLocationName());
        }

        if (movement.getToLocation() != null) {
            response.setToLocationCode(movement.getToLocation().getLocationCode());
            response.setToLocationName(movement.getToLocation().getLocationName());
        }

        response.setQuantity(movement.getQuantity());
        response.setMovementType(movement.getMovementType().name());
        response.setReferenceNumber(movement.getReferenceNumber());
        response.setReferenceType(movement.getReferenceType());
        response.setRemarks(movement.getRemarks());
        response.setPerformedBy(movement.getPerformedBy());
        response.setMovementDate(movement.getMovementDate());

        return response;
    }
}