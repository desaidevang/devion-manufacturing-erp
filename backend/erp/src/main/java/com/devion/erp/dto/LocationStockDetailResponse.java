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
public class LocationStockDetailResponse {
    private Long stockId;
    private Long partId;
    private String partNumber;
    private String partName;
    private String partType;

    // Batch/Lot Information
    private String batchNumber;
    private String lotNumber;
    private String heatNumber;
    private String grnNumber; // ADD THIS FIELD

    // Quantity Information
    private Integer quantity;
    private Integer availableQuantity;
    private Integer reservedQuantity;

    // Pricing Information
    private BigDecimal unitPrice;
    private BigDecimal totalValue;
    private String stockStatus;

    // Supplier Information
    private Long supplierId;
    private String supplierName;
    private String supplierCode;
    private String supplierBatchNumber;
    private String supplierInvoiceNumber;
    private LocalDate supplierDeliveryDate;

    // Date Information
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private LocalDateTime stockCreatedAt;
    private LocalDateTime stockUpdatedAt;

    // Warehouse Location Details
    private Long locationId;
    private String locationCode;
    private String locationName;
    private String locationType;
    private String zone;
    private String rack;
    private String shelf;
    private String bin;
    private Boolean isQuarantine;

    // Stock Levels
    private Integer minimumStockLevel;
    private Integer maximumStockLevel;
    private Integer reorderLevel;
    private Integer shelfLifeDays;

    private String remarks;
}