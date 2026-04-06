package com.devion.erp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ProductCreateRequest {

    @NotBlank(message = "Product code is required")
    private String productCode;

    @NotBlank(message = "Product name is required")
    private String productName;

    private String description;

    private String uom;

    // Optional BOM items
    private List<BomItemRequest> bomItems;

    @Data
    public static class BomItemRequest {
        @NotNull(message = "Part ID is required")
        private Long partId;

        @NotNull(message = "Quantity is required")
        private Integer quantityRequired;

        private Integer sequenceNumber;
        private Boolean isOptional = false;
        private String notes;
    }
}