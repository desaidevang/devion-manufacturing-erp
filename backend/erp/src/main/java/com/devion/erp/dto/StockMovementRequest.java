package com.devion.erp.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementRequest {
    @NotNull(message = "Stock ID is required")
    private Long stockId;

    @NotNull(message = "Movement type is required")
    private MovementType movementType;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private Long toLocationId;
    private String referenceNumber;
    private String remarks;

    public enum MovementType {
        IN,            // Stock in (purchase, production)
        OUT,           // Stock out (issue, sale)
        TRANSFER,      // Transfer between locations
        ADJUSTMENT,    // Quantity adjustment
        RESERVE,       // Reserve for production
        UNRESERVE,     // Unreserve
        QUARANTINE,    // Move to quarantine
        RELEASE        // Release from quarantine
    }
}
