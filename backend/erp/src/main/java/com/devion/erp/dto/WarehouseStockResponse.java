package com.devion.erp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseStockResponse {
    private Long id;
    private PartResponse part;
    private WarehouseLocationResponse warehouseLocation;

    // Supplier information - MAKE SURE THESE FIELDS EXIST
    private SupplierResponse supplier;
    private String supplierBatchNumber;
    private String supplierInvoiceNumber;
    private LocalDate supplierDeliveryDate;

    // Stock information
    private String batchNumber;
    private String lotNumber;
    private String heatNumber;
    private String grnNumber;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private BigDecimal unitPrice;
    private BigDecimal totalValue;
    private Integer minimumStockLevel;
    private Integer maximumStockLevel;
    private Integer reorderLevel;
    private Integer shelfLifeDays;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String stockStatus;
    private String remarks;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}