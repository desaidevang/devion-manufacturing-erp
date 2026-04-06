package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "warehouse_locations")
@Data
public class WarehouseLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "location_code", unique = true, nullable = false)
    private String locationCode;

    @Column(name = "location_name", nullable = false)
    private String locationName;

    @Column(name = "location_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private LocationType locationType;

    @Column(name = "zone")
    private String zone;

    @Column(name = "rack")
    private String rack;

    @Column(name = "shelf")
    private String shelf;

    @Column(name = "bin")
    private String bin;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "current_occupancy")
    private Integer currentOccupancy = 0;

    @Column(name = "available_capacity")
    private Integer availableCapacity;

    @Column(name = "temperature_range")
    private String temperatureRange;

    @Column(name = "humidity_range")
    private String humidityRange;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_quarantine")
    private Boolean isQuarantine = false;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "warehouseLocation")
    private List<WarehouseStock> stocks = new ArrayList<>();

    public enum LocationType {
        RAW_MATERIAL,
        INSPECTION,
        QUARANTINE,
        FINISHED_GOODS,
        SEMI_FINISHED,
        ASSEMBLY,
        TOOL_ROOM,
        PACKING,
        SHIPPING,
        GENERAL_STORE
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        calculateAvailableCapacity();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateAvailableCapacity();
    }

    private void calculateAvailableCapacity() {
        if (capacity != null) {
            availableCapacity = capacity - currentOccupancy;
            if (availableCapacity < 0) availableCapacity = 0;
        }
    }
}