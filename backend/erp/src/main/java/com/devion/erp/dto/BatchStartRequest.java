package com.devion.erp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchStartRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    private LocalDateTime expectedCompletionTime;
    private String notes;
}
