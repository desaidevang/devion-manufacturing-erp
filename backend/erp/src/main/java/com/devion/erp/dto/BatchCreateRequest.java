package com.devion.erp.dto;

import com.devion.erp.entity.Batch;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchCreateRequest {

    @NotBlank(message = "Batch code is required")
    private String batchCode;

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Batch quantity is required")
    @Min(value = 1, message = "Batch quantity must be at least 1")
    private Integer batchQuantity;

    private Batch.Priority priority = Batch.Priority.MEDIUM;
    private String notes;

    private String manualBatchName;
}
