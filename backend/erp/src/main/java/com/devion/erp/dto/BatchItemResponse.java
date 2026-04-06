package com.devion.erp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchItemResponse {

    private Long id;
    private PartResponse part;

    private Integer quantityRequired;
    private Integer quantityUsed;
    private Integer remainingQuantity;

    private Boolean isIssued;
    private LocalDateTime issuedAt;

    private WarehouseStockResponse warehouseStock;
    private String remarks;
}
