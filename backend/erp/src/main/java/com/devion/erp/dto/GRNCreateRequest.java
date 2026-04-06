package com.devion.erp.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GRNCreateRequest {
    private Long supplierId;
    private String poNumber;
    private String invoiceNumber;
    private String challanNumber;
    private String vehicleNumber;
    private String shift;
    private String remarks;
    private LocalDateTime invoiceDate;
    private List<GRNItemRequest> items;
}