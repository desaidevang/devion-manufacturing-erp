package com.devion.erp.dto;

import com.devion.erp.entity.Supplier;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupplierResponse {
    private Long id;
    private String supplierCode;
    private String supplierName;
    private String contactPerson;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String country;
    private String pinCode;
    private String gstNumber;
    private String panNumber;
    private String paymentTerms;
    private Integer rating;
    private Supplier.SupplierStatus status;
    private Boolean isApproved;
    private String remarks;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isActive; // ADD THIS FIELD

    // This is needed for lombok to generate getters/setters for isActive
    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}