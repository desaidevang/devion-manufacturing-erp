package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
@Entity
@Table(name = "warehouse_stocks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id", nullable = false)
    private Part part;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_location_id", nullable = false)
    private WarehouseLocation warehouseLocation;

    private String batchNumber;
    private String lotNumber;
    private String heatNumber;

    @Column(nullable = false)
    private Integer quantity;



    @Column(nullable = false)
    private Integer availableQuantity;

    private BigDecimal unitPrice;
    private BigDecimal totalValue;

    private Integer minimumStockLevel = 10;
    private Integer maximumStockLevel = 1000;
    private Integer reorderLevel = 50;

    private Integer shelfLifeDays;

    private LocalDate manufacturingDate;
    private LocalDate expiryDate;

    private String grnNumber;
    private Long grnItemId;

    @Enumerated(EnumType.STRING)
    private StockStatus stockStatus = StockStatus.ACTIVE; // Changed from AVAILABLE
    // In WarehouseStock.java - Add supplier relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "supplier_batch_number")
    private String supplierBatchNumber;

    @Column(name = "supplier_invoice_number")
    private String supplierInvoiceNumber;

    @Column(name = "supplier_delivery_date")
    private LocalDate supplierDeliveryDate;


    @Column(columnDefinition = "TEXT")
    private String remarks;
    @Column(nullable = false)
    private Integer reservedQuantity = 0;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        availableQuantity = quantity - reservedQuantity;
        calculateTotalValue();
        if (reservedQuantity == null) reservedQuantity = 0;
        if (quantity == null) quantity = 0;

        availableQuantity = quantity - reservedQuantity;
        calculateTotalValue();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        availableQuantity = quantity - reservedQuantity;
        calculateTotalValue();
    }

    private void calculateTotalValue() {
        if (unitPrice != null && quantity != null) {
            totalValue = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }

    public enum StockStatus {
        ACTIVE,        // Changed from AVAILABLE
        RESERVED,
        QUARANTINE,
        EXPIRED,
        DAMAGED,       // Keep or change to BLOCKED
        IN_TRANSIT,
        HOLD           // May need to map to BLOCKED
    }
}
