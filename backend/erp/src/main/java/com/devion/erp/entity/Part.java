// Part Entity
package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "parts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Part {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "part_number", unique = true, nullable = false)
    private String partNumber;
    @Column(name = "uom")
    private String uom = "PCS"; // Unit of measur
    @Column(name = "part_name", nullable = false)
    private String partName;

    @Column(name = "description")
    private String description;

    @Column(name = "drawing_number")
    private String drawingNumber;

    @Column(name = "revision_number")
    private String revisionLevel = "00";

    @Enumerated(EnumType.STRING)
    @Column(name = "part_type")
    private PartType partType;

    @Enumerated(EnumType.STRING)
    @Column(name = "class_code")
    private ClassCode classCode = ClassCode.CRITICAL;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Many-to-Many relationship with PSI standards
    @ManyToMany
    @JoinTable(
            name = "part_psi_standards",
            joinColumns = @JoinColumn(name = "part_id"),
            inverseJoinColumns = @JoinColumn(name = "psi_id")
    )
    private List<ProductStandard> psiStandards = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        isActive = true;
        if (revisionLevel == null) revisionLevel = "00";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum PartType {
        ASSEMBLY,
        COMPONENT,
        SUB_ASSEMBLY,
        RAW_MATERIAL,
        FINISHED_GOODS,
        SEMI_FINISHED

    }

    public enum ClassCode {
        CRITICAL("C"),
        MAJOR("A"),
        MINOR("B"),
        GENERAL("G");

        private final String code;

        ClassCode(String code) {
            this.code = code;
        }

        public String getCode() {
            return code;
        }
    }
}