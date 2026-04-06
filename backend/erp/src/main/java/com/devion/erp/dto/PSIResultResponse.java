// PSIResultResponse.java
package com.devion.erp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PSIResultResponse {
    private Long psiItemId;
    private String standardCode;
    private String standardName;
    private String standardType;
    private String description;
    private String result; // PASS, FAIL, VALUE
    private String value;
    private Double minValue; // Add if you have these fields
    private Double maxValue;
    private String unit;
    private String remarks;
}