package com.devion.erp.dto;

import com.devion.erp.entity.Product;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProductResponse {
    private Long id;
    private String productCode;
    private String productName;
    private String description;
    private String uom;
    private Boolean isActive;
    private Boolean hasBom;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<BomItemResponse> bomItems;

    @Data
    public static class BomItemResponse {
        private Long id;
        private Long partId;
        private String partNumber;
        private String partName;
        private String partUom;
        private Integer quantityRequired;
        private Integer sequenceNumber;
        private Boolean isOptional;
        private String notes;
        private LocalDateTime createdAt;
    }
}