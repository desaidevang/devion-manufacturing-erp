// src/main/java/com/devion/erp/entity/InventoryMovement.java
package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_movements")
@Data
public class InventoryMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_stock_id")
    private WarehouseStock warehouseStock;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_location_id")
    private WarehouseLocation fromLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_location_id")
    private WarehouseLocation toLocation;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementType movementType;

    private String referenceNumber; // GRN, Work Order, etc.
    private String referenceType; // GRN, TRANSFER, ADJUSTMENT, etc.

    @Column(columnDefinition = "TEXT")
    private String remarks;

    private String performedBy;
    private LocalDateTime movementDate = LocalDateTime.now();

    public enum MovementType {
        RECEIPT,
        TRANSFER,
        ISSUE,
        ADJUSTMENT,
        RESERVATION,
        QUARANTINE,
        RELEASE
    }
}