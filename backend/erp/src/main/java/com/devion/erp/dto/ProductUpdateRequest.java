package com.devion.erp.dto;

import lombok.Data;

import java.util.List;

@Data
public class ProductUpdateRequest {
    private String productName;
    private String description;
    private String uom;
    private Boolean isActive;

    // BOM can be updated separately, but we can accept it here too
    private List<BomItemUpdateRequest> bomItems;

    @Data
    public static class BomItemUpdateRequest {
        private Long id; // For existing items
        private Long partId;
        private Integer quantityRequired;
        private Integer sequenceNumber;
        private Boolean isOptional;
        private String notes;
        private Boolean delete = false; // Flag to mark for deletion
    }
}