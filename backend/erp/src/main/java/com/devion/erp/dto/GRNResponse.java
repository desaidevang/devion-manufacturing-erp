package com.devion.erp.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GRNResponse {
    private Long id;
    private String grnNumber;
    private Long supplierId;
    private String supplierName;
    private String supplierCode;
    private String poNumber;
    private String invoiceNumber;
    private String challanNumber;
    private String vehicleNumber;
    private String shift;
    private String remarks;
    private LocalDateTime invoiceDate;
    private String status;
    private LocalDateTime receivedDate;
    private String receivedBy;
    private List<GRNItemResponse> items;
}
