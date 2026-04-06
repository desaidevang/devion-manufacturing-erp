package com.devion.erp.dto;

import com.devion.erp.entity.Batch;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchResponse {

    private Long id;
    private String batchCode;
    private ProductResponse product;
    private Integer batchQuantity;

    private Batch.BatchStatus status;
    private UserResponse assignedEmployee;
    private Batch.Priority priority;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime expectedCompletionTime;
    private LocalDateTime actualCompletionTime;

    private String notes;
    private String createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Integer totalPartsRequired;
    private Integer totalPartsUsed;
    private Integer progressPercentage;
    private Boolean isDelayed;
    private Long delayHours;

    private List<BatchItemResponse> batchItems;
}
