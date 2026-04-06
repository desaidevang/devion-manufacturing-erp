package com.devion.erp.dto;

import com.devion.erp.entity.WarehouseLocation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WarehouseLocationRequest {
    @NotBlank(message = "Location code is required")
    private String locationCode;

    @NotBlank(message = "Location name is required")
    private String locationName;

    @NotNull(message = "Location type is required")
    private WarehouseLocation.LocationType locationType;

    private String zone;
    private String rack;
    private String shelf;
    private String bin;
    private Integer capacity;
    private String temperatureRange;
    private String humidityRange;
    private Boolean isActive = true;
    private Boolean isQuarantine = false;
    private String remarks;
}