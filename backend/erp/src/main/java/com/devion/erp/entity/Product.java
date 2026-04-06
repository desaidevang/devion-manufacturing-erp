package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_code", unique = true, nullable = false)
    private String productCode;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "description")
    private String description;

    @Column(name = "uom")
    private String uom = "PCS"; // Unit of measurement

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "has_bom")
    private Boolean hasBom = false; // Flag to indicate if BOM is defined

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // BOM components (optional - only if product needs assembly)
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductBomItem> bomItems = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        isActive = true;
        hasBom = bomItems != null && !bomItems.isEmpty();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        hasBom = bomItems != null && !bomItems.isEmpty();
    }
}