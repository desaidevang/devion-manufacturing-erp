package com.devion.erp.dto;

import com.devion.erp.entity.WarehouseStock;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseStockUpdateRequest {
    private Integer quantity;
    private Integer reservedQuantity;
    private BigDecimal unitPrice;
    private Integer minimumStockLevel;
    private Integer maximumStockLevel;
    private Integer reorderLevel;
    private WarehouseStock.StockStatus stockStatus;
    private String remarks;
}
