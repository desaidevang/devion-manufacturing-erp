// PSI Entity
package com.devion.erp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_standards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductStandard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "standard_code", unique = true, nullable = false)
    private String standardCode;

    @Column(name = "standard_name", nullable = false)
    private String standardName;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "standard_type", nullable = false)
    private StandardType standardType;

    @Column(name = "version", nullable = false)
    private String version = "1.0";

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "inspection_items")
    @JsonIgnore   // ⬅ ADD THIS
    private String inspectionItems;

    @Column(name = "status")
    private Boolean isActive = true;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        isActive = true;
        if (version == null) version = "1.0";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum StandardType {
        DIMENSIONAL,
        VISUAL,
        PERFORMANCE,
        MATERIAL,
        SAFETY,
        GENERAL
    }
}