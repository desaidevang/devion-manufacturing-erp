package com.devion.erp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SupplierCreateRequest {

    @NotBlank(message = "Supplier code is required")
    @Size(min = 3, max = 50, message = "Supplier code must be between 3 and 50 characters")
    private String supplierCode;

    @NotBlank(message = "Supplier name is required")
    @Size(min = 3, max = 100, message = "Supplier name must be between 3 and 100 characters")
    private String supplierName;

    @Size(max = 100, message = "Contact person name cannot exceed 100 characters")
    private String contactPerson;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    private String email;

    @Pattern(regexp = "^[0-9]{10}$", message = "Invalid phone number. Must be 10 digits")
    private String phone;

    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;

    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
            message = "Invalid GST number format")
    private String gstNumber;

    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
            message = "Invalid PAN number format")
    private String panNumber;

    @Size(max = 100, message = "Payment terms cannot exceed 100 characters")
    private String paymentTerms;

    @jakarta.validation.constraints.Min(value = 1, message = "Rating must be at least 1")
    @jakarta.validation.constraints.Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;
}