package com.devion.erp.controller;

import com.devion.erp.dto.WarehouseLocationRequest;
import com.devion.erp.dto.WarehouseLocationResponse;
import com.devion.erp.service.WarehouseLocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/warehouse/locations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
public class WarehouseLocationController {

    private final WarehouseLocationService locationService;

    @PostMapping
    public ResponseEntity<WarehouseLocationResponse> createLocation(
            @Valid @RequestBody WarehouseLocationRequest request) {
        WarehouseLocationResponse response = locationService.createLocation(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<WarehouseLocationResponse>> getAllLocations() {
        List<WarehouseLocationResponse> locations = locationService.getAllLocations();
        return ResponseEntity.ok(locations);
    }

    @GetMapping("/active")
    public ResponseEntity<List<WarehouseLocationResponse>> getActiveLocations() {
        List<WarehouseLocationResponse> locations = locationService.getActiveLocations();
        return ResponseEntity.ok(locations);
    }

    @GetMapping("/available")
    public ResponseEntity<List<WarehouseLocationResponse>> getAvailableLocations() {
        List<WarehouseLocationResponse> locations = locationService.getAvailableLocations();
        return ResponseEntity.ok(locations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarehouseLocationResponse> getLocationById(@PathVariable Long id) {
        WarehouseLocationResponse location = locationService.getLocationById(id);
        return ResponseEntity.ok(location);
    }

    @GetMapping("/code/{locationCode}")
    public ResponseEntity<WarehouseLocationResponse> getLocationByCode(@PathVariable String locationCode) {
        WarehouseLocationResponse location = locationService.getLocationByCode(locationCode);
        return ResponseEntity.ok(location);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WarehouseLocationResponse> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody WarehouseLocationRequest request) {
        WarehouseLocationResponse response = locationService.updateLocation(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long id) {
        locationService.deleteLocation(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<WarehouseLocationResponse>> searchLocations(
            @RequestParam String searchTerm) {
        List<WarehouseLocationResponse> locations = locationService.searchLocations(searchTerm);
        return ResponseEntity.ok(locations);
    }
}