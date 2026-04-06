

// BatchItem.java - Entity
package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "batch_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id", nullable = false)
    private Part part;

    @Column(name = "quantity_required", nullable = false)
    private Integer quantityRequired;

    @Column(name = "quantity_used", nullable = false)
    private Integer quantityUsed = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_stock_id")
    private WarehouseStock warehouseStock;

    @Column(name = "is_issued")
    private Boolean isIssued = false;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (quantityUsed == null) {
            quantityUsed = 0;
        }
        if (isIssued == null) {
            isIssued = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // BatchItem.java - Entity (continued)
    public boolean isFullyIssued() {
        return isIssued && quantityUsed >= quantityRequired;
    }

    // Get remaining quantity to issue
    public Integer getRemainingQuantity() {
        return quantityRequired - quantityUsed;
    }
}