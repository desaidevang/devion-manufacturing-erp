package com.devion.erp.dto;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
@Data
@AllArgsConstructor
public class GRNInspectionItem {
    private Long grnItemId;
    private Long partId;
    private String partName;
    private Integer receivedQty;
    private List<SimplePSIResponse> psi;
}