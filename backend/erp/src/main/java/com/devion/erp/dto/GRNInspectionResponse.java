package com.devion.erp.dto;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
@Data
@AllArgsConstructor
public class GRNInspectionResponse {
    private Long id;
    private String grnNumber;
    private List<GRNInspectionItem> items;
}
