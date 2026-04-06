// PSIUpdateRequest.java
package com.devion.erp.dto;

import com.devion.erp.entity.ProductStandard;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PSIUpdateRequest { // Changed from class to public class
    private String standardName;
    private String description;
    private ProductStandard.StandardType standardType;
    private String version;
    private String inspectionItems;
    private Boolean isActive;
}