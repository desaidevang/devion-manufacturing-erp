package com.devion.erp.dto;
import lombok.Data;
@Data
public class SimplePartResponse {
    private Long id;
    private String partNumber;
    private String partName;
    private String description;
    private String drawingNumber;
    private String revisionLevel;
}