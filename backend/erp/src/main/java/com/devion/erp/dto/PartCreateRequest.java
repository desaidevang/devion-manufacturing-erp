// Part DTOs
package com.devion.erp.dto;

import com.devion.erp.entity.Part.ClassCode;
import com.devion.erp.entity.Part.PartType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PartCreateRequest {

    @NotBlank(message = "Part number is required")
    private String partNumber;

    @NotBlank(message = "Part name is required")
    private String partName;

    private String description;
    private String drawingNumber;
    private String revisionLevel = "00";
    private PartType partType;
    private ClassCode classCode = ClassCode.CRITICAL;
    private List<Long> psiStandardIds; // IDs of PSI standards to link
}


