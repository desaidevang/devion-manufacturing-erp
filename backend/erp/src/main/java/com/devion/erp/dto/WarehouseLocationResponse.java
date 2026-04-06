package com.devion.erp.dto;

import com.devion.erp.entity.WarehouseLocation;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class WarehouseLocationResponse {
    private Long id;
    private String locationCode;
    private String locationName;
    private WarehouseLocation.LocationType locationType;
    private String zone;
    private String rack;
    private String shelf;
    private String bin;
    private Integer capacity;
    private Integer currentOccupancy;
    private Integer availableCapacity;
    private String temperatureRange;
    private String humidityRange;
    private Boolean isActive;
    private Boolean isQuarantine;
    private String remarks;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}