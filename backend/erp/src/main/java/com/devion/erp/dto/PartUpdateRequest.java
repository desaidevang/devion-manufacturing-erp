package com.devion.erp.dto;


import com.devion.erp.entity.Part;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PartUpdateRequest {
    private String partName;
    private String description;
    private String drawingNumber;
    private String revisionLevel;
    private Part.PartType partType;
    private Part.ClassCode classCode;
    private Boolean isActive;
    private List<Long> psiStandardIds;
}