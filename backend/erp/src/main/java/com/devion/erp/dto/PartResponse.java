package com.devion.erp.dto;

import com.devion.erp.entity.Part;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PartResponse {
    private Long id;
    private String partNumber;
    private String partName;
    private String description;
    private String drawingNumber;
    private String revisionLevel;
    private Part.PartType partType;
    private Part.ClassCode classCode;
    private Boolean isActive;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // Remove PSIResponse or keep it null
    // private List<PSIResponse> psiStandards; // Remove this line
    private List<SimplePSIResponse> linkedPsiStandards;
}