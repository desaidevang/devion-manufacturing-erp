// PSICreateRequest.java
package com.devion.erp.dto;

import com.devion.erp.entity.ProductStandard.StandardType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PSICreateRequest {

    @NotBlank(message = "Standard code is required")
    private String standardCode;

    @NotBlank(message = "Standard name is required")
    private String standardName;

    private String description;

    @NotNull(message = "Standard type is required")
    private StandardType standardType;

    private String version = "1.0";

    private String inspectionItems; // JSON string

    private Boolean isActive = true;
}