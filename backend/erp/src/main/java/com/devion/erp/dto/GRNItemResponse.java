package com.devion.erp.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GRNItemResponse {
    private Long id;
    private Long partId;
    private String partNumber;
    private String partName;
    private Integer receivedQty;
    private Integer acceptedQty;
    private Integer rejectedQty;
    private BigDecimal unitPrice;
    private String batchNumber;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String remarks;

    private List<PSIResultResponse> psiResults; // ⬅ ADD THIS
}
