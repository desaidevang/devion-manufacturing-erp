package com.devion.erp.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseStockCreateRequest {
    @NotNull(message = "Part ID is required")
    private Long partId;

    @NotNull(message = "Warehouse location ID is required")
    private Long warehouseLocationId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private String batchNumber;
    private String lotNumber;
    private String heatNumber;
    private String grnNumber;

    // Add these supplier-related fields
    private Long supplierId;
    private String supplierBatchNumber;
    private String supplierInvoiceNumber;
    private LocalDate supplierDeliveryDate;

    private BigDecimal unitPrice;
    private Integer minimumStockLevel;
    private Integer maximumStockLevel;
    private Integer reorderLevel;
    private Integer shelfLifeDays;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String remarks;
}