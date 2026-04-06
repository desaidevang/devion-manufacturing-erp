package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "supplier_code", unique = true, nullable = false)
    private String supplierCode;

    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "country")
    private String country;

    @Column(name = "pin_code")
    private String pinCode;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(name = "pan_number")
    private String panNumber;

    @Column(name = "payment_terms")
    private String paymentTerms;

    @Column(name = "rating")
    private Integer rating; // 1-5

    @Column(name = "remarks")
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SupplierStatus status = SupplierStatus.ACTIVE;

    @Column(name = "is_approved")
    private Boolean isApproved = true;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        isApproved = true;
        status = SupplierStatus.ACTIVE;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum SupplierStatus {
        ACTIVE,
        INACTIVE,
        BLACKLISTED,
        ON_HOLD
    }
}