// PSIResponse.java
package com.devion.erp.dto;

import com.devion.erp.entity.ProductStandard;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PSIResponse { // Changed from class to public class
    private Long id;
    private String standardCode;
    private String standardName;
    private String description;
    private ProductStandard.StandardType standardType;
    private String version;
    private String inspectionItems;
    private Boolean isActive;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}