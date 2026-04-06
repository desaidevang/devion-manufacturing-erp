// src/main/java/com/devion/erp/dto/InventoryMovementResponse.java
package com.devion.erp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovementResponse {
    private Long id;
    private Long stockId;
    private String partNumber;
    private String partName;
    private String fromLocationCode;
    private String fromLocationName;
    private String toLocationCode;
    private String toLocationName;
    private Integer quantity;
    private String movementType;
    private String referenceNumber;
    private String referenceType;
    private String remarks;
    private String performedBy;
    private LocalDateTime movementDate;
}