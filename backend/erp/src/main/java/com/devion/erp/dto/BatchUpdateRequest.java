package com.devion.erp.dto;

import com.devion.erp.entity.Batch;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchUpdateRequest {

    private String notes;
    private Batch.Priority priority;
    private Batch.BatchStatus status;
    private Long assignedEmployeeId;
}
