package com.devion.erp.dto;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GRNItemRequest {
    private Long partId;
    private Integer receivedQty;
    private BigDecimal unitPrice;
    private String batchNumber;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String remarks;
}