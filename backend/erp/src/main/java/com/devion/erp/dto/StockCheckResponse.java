package com.devion.erp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockCheckResponse {

    private Boolean hasSufficientStock;
    private List<PartStockStatus> partStockStatus;
    private String message;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartStockStatus {
        private Long partId;
        private String partNumber;
        private String partName;

        private Integer requiredQuantity;
        private Integer availableStock;
        private Integer shortage;

        private Boolean hasSufficientStock;
    }
}
