package com.devion.erp.dto;

import lombok.*;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GRNInspectionSubmitRequest {
    private List<Item> items;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Item {
        private Long partId;
        private Integer acceptedQty;
        private Integer rejectedQty;
        private String remarks;
        private List<PSIResult> inspectionResults;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PSIResult {
        private Long psiItemId;
        private String result;
        private String value;
        private String remarks;
    }
}
