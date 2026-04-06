package com.devion.erp.service;

import com.devion.erp.dto.*;
import com.devion.erp.entity.*;
import com.devion.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.devion.erp.entity.GRNItemPSIResult;
import com.devion.erp.repository.GRNItemPSIResultRepository;
import com.devion.erp.repository.ProductStandardRepository;
import com.devion.erp.entity.WarehouseStock;
import com.devion.erp.entity.WarehouseLocation;
import com.devion.erp.repository.WarehouseStockRepository;
import com.devion.erp.repository.WarehouseLocationRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class GRNServiceImpl {

    private final GRNRepository grnRepo;
    private final SupplierRepository supplierRepo;
    private final PartRepository partRepo;
    private final UserRepository userRepo;
    private final GRNItemPSIResultRepository psiResultRepo;
    private final ProductStandardRepository productStandardRepo;
    private final WarehouseStockRepository warehouseStockRepo;
    private final WarehouseLocationRepository warehouseLocationRepo;
    private String generateGrnNumber() {
        String prefix = "GRN-" + LocalDateTime.now().getYear();
        long count = grnRepo.count() + 1;
        return prefix + "-" + String.format("%04d", count);
    }

    @Transactional
    public GRNResponse createGRN(GRNCreateRequest req) {
        // Validate supplier
        Supplier supplier = supplierRepo.findById(req.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        // Create GRN entity with all fields
        GRN grn = GRN.builder()
                .supplier(supplier)
                .poNumber(req.getPoNumber())
                .invoiceNumber(req.getInvoiceNumber())
                .challanNumber(req.getChallanNumber())
                .vehicleNumber(req.getVehicleNumber())
                .shift(req.getShift())
                .remarks(req.getRemarks())
                .invoiceDate(req.getInvoiceDate())
                .status(GRN.Status.PENDING)
                .grnNumber(generateGrnNumber())
                .receivedBy("SYSTEM") // TODO: Set from logged-in user authentication
                .receivedDate(LocalDateTime.now())
                .build();

        // Validate and create GRN items
        List<GRNItem> items = req.getItems().stream().map(itemReq -> {
            Part part = partRepo.findById(itemReq.getPartId())
                    .orElseThrow(() -> new RuntimeException("Part not found with id: " + itemReq.getPartId()));

            return GRNItem.builder()
                    .grn(grn)
                    .part(part)
                    .receivedQty(itemReq.getReceivedQty())
                    .unitPrice(itemReq.getUnitPrice() != null ?
                            itemReq.getUnitPrice() : BigDecimal.ZERO)
                    .batchNumber(itemReq.getBatchNumber())
                    .manufacturingDate(itemReq.getManufacturingDate())
                    .expiryDate(itemReq.getExpiryDate())
                    .acceptedQty(0)
                    .rejectedQty(0)
                    .remarks(itemReq.getRemarks())
                    .build();
        }).collect(Collectors.toList());

        grn.setItems(items);
        GRN saved = grnRepo.save(grn);

        return mapToResponse(saved);
    }

    public GRNResponse getGRNById(Long id) {
        GRN grn = grnRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("GRN not found with id: " + id));
        return mapToResponse(grn);
    }

    public List<GRNResponse> getAllGRN() {
        return grnRepo.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public GRNResponse updateStatus(Long id, String status) {
        GRN grn = grnRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("GRN not found with id: " + id));

        try {
            GRN.Status newStatus = GRN.Status.valueOf(status.toUpperCase());
            grn.setStatus(newStatus);

            // If status is COMPLETED, update warehouse stock
            if (newStatus == GRN.Status.COMPLETED) {
                updateWarehouseStock(grn);
            }

            GRN updated = grnRepo.save(grn);
            return mapToResponse(updated);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }

    private void updateWarehouseStock(GRN grn) {
        // TODO: Implement warehouse stock update logic
        // This should update stock levels for accepted quantities
        System.out.println("Updating warehouse stock for GRN: " + grn.getGrnNumber());
    }

    private GRNResponse mapToResponse(GRN grn) {
        return GRNResponse.builder()
                .id(grn.getId())
                .grnNumber(grn.getGrnNumber())
                .supplierId(grn.getSupplier().getId())
                .supplierName(grn.getSupplier().getSupplierName())
                .supplierCode(grn.getSupplier().getSupplierCode())
                .poNumber(grn.getPoNumber())
                .invoiceNumber(grn.getInvoiceNumber())
                .challanNumber(grn.getChallanNumber())
                .vehicleNumber(grn.getVehicleNumber())
                .shift(grn.getShift())
                .remarks(grn.getRemarks())
                .invoiceDate(grn.getInvoiceDate())
                .status(grn.getStatus().name())
                .receivedDate(grn.getReceivedDate())
                .receivedBy(grn.getReceivedBy())
                .items(mapToItemResponses(grn.getItems()))
                .build();
    }

    private List<GRNItemResponse> mapToItemResponses(List<GRNItem> items) {
        return items.stream()
                .map(this::mapToItemResponse)
                .collect(Collectors.toList());
    }

    private GRNItemResponse mapToItemResponse(GRNItem item) {

        List<PSIResultResponse> psiResults = psiResultRepo.findByGrnItemId(item.getId())
                .stream()
                .map(r -> new PSIResultResponse(
                        r.getPsi().getId(),
                        r.getPsi().getStandardCode(),
                        r.getPsi().getStandardName(),
                        r.getPsi().getStandardType().name(),
                        r.getPsi().getDescription(),
                        r.getResult(),
                        r.getValue(),
                        null, // you don't have minValue
                        null, // you don't have maxValue
                        null, // you don't have unit
                        r.getRemarks()
                ))
                .toList();

        return GRNItemResponse.builder()
                .id(item.getId())
                .partId(item.getPart().getId())
                .partNumber(item.getPart().getPartNumber())
                .partName(item.getPart().getPartName())
                .receivedQty(item.getReceivedQty())
                .acceptedQty(item.getAcceptedQty())
                .rejectedQty(item.getRejectedQty())
                .unitPrice(item.getUnitPrice())
                .batchNumber(item.getBatchNumber())
                .manufacturingDate(item.getManufacturingDate())
                .expiryDate(item.getExpiryDate())
                .remarks(item.getRemarks())
                .psiResults(psiResults)
                .build();
    }


    // Additional methods for filtering/searching
    public List<GRNResponse> getGRNByStatus(String status) {
        try {
            GRN.Status grnStatus = GRN.Status.valueOf(status.toUpperCase());
            return grnRepo.findByStatus(grnStatus).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }

    public List<GRNResponse> getGRNBySupplier(Long supplierId) {
        Supplier supplier = supplierRepo.findById(supplierId)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        return grnRepo.findBySupplier(supplier).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<GRNResponse> searchGRN(String searchTerm) {
        return grnRepo.searchGRN(searchTerm).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    public GRNInspectionResponse getGRNInspection(Long id) {

        GRN grn = grnRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("GRN not found"));

        List<GRNInspectionItem> items = grn.getItems()
                .stream()
                .map(item -> {

                    List<SimplePSIResponse> psiItems = item.getPart()
                            .getPsiStandards()
                            .stream()
                            .map(psi -> new SimplePSIResponse(
                                    psi.getId(),
                                    psi.getStandardCode(),
                                    psi.getStandardName(),
                                    psi.getStandardType().name(),
                                    psi.getIsActive(),
                                    psi.getDescription()
                            ))
                            .toList();

                    return new GRNInspectionItem(
                            item.getId(),
                            item.getPart().getId(),
                            item.getPart().getPartName(),
                            item.getReceivedQty(),
                            psiItems
                    );
                })
                .toList();

        return new GRNInspectionResponse(
                grn.getId(),
                grn.getGrnNumber(),
                items
        );
    }

    @Transactional
    public void submitInspection(Long grnId, GRNInspectionSubmitRequest req) {

        GRN grn = grnRepo.findById(grnId)
                .orElseThrow(() -> new RuntimeException("GRN not found"));

        WarehouseLocation quarantineLocation = getDefaultQuarantineLocation();

        for (GRNInspectionSubmitRequest.Item itemReq : req.getItems()) {

            GRNItem item = grn.getItems().stream()
                    .filter(i -> i.getPart().getId().equals(itemReq.getPartId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("GRN item not found"));

            // Update quantities
            item.setAcceptedQty(itemReq.getAcceptedQty());
            item.setRejectedQty(itemReq.getRejectedQty());
            item.setRemarks(itemReq.getRemarks());

            // ---- Save PSI results ----
            psiResultRepo.deleteAllByGrnItemId(item.getId());
            for (GRNInspectionSubmitRequest.PSIResult psiReq : itemReq.getInspectionResults()) {

                ProductStandard psi = productStandardRepo.findById(psiReq.getPsiItemId())
                        .orElseThrow(() -> new RuntimeException("PSI not found"));

                GRNItemPSIResult psiResult = GRNItemPSIResult.builder()
                        .grnItem(item)
                        .psi(psi)
                        .result(psiReq.getResult())
                        .value(psiReq.getValue())
                        .remarks(psiReq.getRemarks())
                        .build();

                psiResultRepo.save(psiResult);
            }

            // ---- CREATE WAREHOUSE STOCK automatically ----
            if (item.getAcceptedQty() > 0) {

                // normalize batch (DB unique constraint likely treats empty string same as empty)
                String batch = item.getBatchNumber();
                if (batch != null && batch.trim().isEmpty()) batch = null;

                // try to find existing stock (repo method used elsewhere)
                Optional<WarehouseStock> optExisting = warehouseStockRepo
                        .findByPartIdAndWarehouseLocationIdAndBatchNumber(
                                item.getPart().getId(),
                                quarantineLocation.getId(),
                                batch == null ? "" : batch // adapt if repo expects empty string
                        );

                if (optExisting.isPresent()) {
                    WarehouseStock existing = optExisting.get();

                    // update quantities and values
                    int addQty = item.getAcceptedQty();
                    Integer prevQty = existing.getQuantity() == null ? 0 : existing.getQuantity();
                    Integer prevReserved = existing.getReservedQuantity() == null ? 0 : existing.getReservedQuantity();

                    existing.setQuantity(prevQty + addQty);
                    existing.setAvailableQuantity((existing.getQuantity() == null ? 0 : existing.getQuantity()) - prevReserved);

                    // update total value if unit price present
                    if (existing.getUnitPrice() != null) {
                        existing.setTotalValue(existing.getUnitPrice().multiply(BigDecimal.valueOf(existing.getQuantity())));
                    } else if (item.getUnitPrice() != null) {
                        existing.setUnitPrice(item.getUnitPrice());
                        existing.setTotalValue(item.getUnitPrice().multiply(BigDecimal.valueOf(existing.getQuantity())));
                    }

                    existing.setStockStatus(WarehouseStock.StockStatus.QUARANTINE);
                    existing.setRemarks((existing.getRemarks() == null ? "" : existing.getRemarks() + " ; ")
                            + "Added from GRN " + grn.getGrnNumber());

                    // update timestamps handled by @PreUpdate if present, otherwise:
                    // existing.setUpdatedAt(LocalDateTime.now());

                    warehouseStockRepo.save(existing);

                } else {
                    WarehouseStock stock = WarehouseStock.builder()
                            .part(item.getPart())
                            .warehouseLocation(quarantineLocation)
                            .quantity(item.getAcceptedQty())
                            .reservedQuantity(0)
                            .availableQuantity(item.getAcceptedQty())
                            .batchNumber(batch) // null or actual batch
                            .heatNumber(null)
                            .lotNumber(null)
                            .unitPrice(item.getUnitPrice())
                            .minimumStockLevel(10)
                            .maximumStockLevel(1000)
                            .reorderLevel(50)
                            .stockStatus(WarehouseStock.StockStatus.QUARANTINE)
                            .manufacturingDate(item.getManufacturingDate())
                            .expiryDate(item.getExpiryDate())
                            .grnNumber(grn.getGrnNumber())
                            .grnItemId(item.getId())
                            .remarks("Stock created from GRN inspection")
                            .build();

                    warehouseStockRepo.save(stock);
                }

                // Increase location occupancy
                quarantineLocation.setCurrentOccupancy(
                        quarantineLocation.getCurrentOccupancy() + item.getAcceptedQty()
                );
            }
        }

        // Update GRN status
        grn.setStatus(GRN.Status.VERIFIED);
        grnRepo.save(grn);
    }
    private WarehouseLocation getDefaultQuarantineLocation() {

        // If exists, return it
        List<WarehouseLocation> list = warehouseLocationRepo.findByIsQuarantineTrue();
        if (!list.isEmpty()) return list.get(0);

        // If NOT exists: create one automatically ✔
        WarehouseLocation loc = new WarehouseLocation();
        loc.setLocationCode("QUAR-DEFAULT");
        loc.setLocationName("Default Quarantine Location");
        loc.setLocationType(WarehouseLocation.LocationType.QUARANTINE);
        loc.setIsQuarantine(true);
        loc.setIsActive(true);
        loc.setCapacity(999999); // Large capacity
        loc.setZone("QUARANTINE");
        loc.setRack("AUTO");
        loc.setShelf("AUTO");
        loc.setBin("AUTO");
        loc.setCurrentOccupancy(0);
        loc.setAvailableCapacity(999999);
        loc.setCreatedBy("SYSTEM");

        return warehouseLocationRepo.save(loc);
    }

    @Transactional
    public GRNResponse updateGRNItem(Long grnId, Long itemId, GRNItemUpdateRequest updateRequest) {
        GRN grn = grnRepo.findById(grnId)
                .orElseThrow(() -> new RuntimeException("GRN not found"));

        GRNItem item = grn.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("GRN item not found"));

        // Update only allowed fields
        if (updateRequest.getAcceptedQty() != null) {
            if (updateRequest.getAcceptedQty() > item.getReceivedQty()) {
                throw new RuntimeException("Accepted quantity cannot exceed received quantity");
            }
            item.setAcceptedQty(updateRequest.getAcceptedQty());

            // Calculate rejected quantity
            item.setRejectedQty(item.getReceivedQty() - updateRequest.getAcceptedQty());
        }

        if (updateRequest.getRemarks() != null) {
            item.setRemarks(updateRequest.getRemarks());
        }

        grnRepo.save(grn);
        return mapToResponse(grn);
    }
}
