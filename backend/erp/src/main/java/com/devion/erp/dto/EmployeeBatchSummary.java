package com.devion.erp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeBatchSummary {

    private Long employeeId;
    private String employeeName;
    private String username;

    private Long totalAssigned;
    private Long inProgress;
    private Long completed;
    private Long delayed;
}
