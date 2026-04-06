package com.devion.erp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimplePSIResponse {
    private Long id;
    private String standardCode;
    private String standardName;
    private String standardType;
    private Boolean isActive; // Add this line
    private String description; // Optional: add if you want description in the list
}