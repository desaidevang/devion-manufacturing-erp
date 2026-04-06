package com.devion.erp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchDashboardResponse {

    private Long totalBatches;
    private Long pendingBatches;
    private Long inProgressBatches;
    private Long completedBatches;
    private Long delayedBatches;

    private List<BatchResponse> recentBatches;
    private List<BatchResponse> delayedBatchesList;

    private List<EmployeeBatchSummary> employeeSummary;
}
