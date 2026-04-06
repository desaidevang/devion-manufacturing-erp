package com.devion.erp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchCompleteRequest {

    private Integer actualQuantity;
    private String notes;
    private LocalDateTime completionTime;
}
