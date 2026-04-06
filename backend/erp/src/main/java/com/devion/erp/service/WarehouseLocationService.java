package com.devion.erp.service;

import com.devion.erp.dto.WarehouseLocationRequest;
import com.devion.erp.dto.WarehouseLocationResponse;
import com.devion.erp.entity.WarehouseLocation;
import com.devion.erp.repository.WarehouseLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseLocationService {

    private final WarehouseLocationRepository locationRepository;

    @Transactional
    public WarehouseLocationResponse createLocation(WarehouseLocationRequest request) {
        // Check if location code already exists
        if (locationRepository.findByLocationCode(request.getLocationCode()).isPresent()) {
            throw new RuntimeException("Location code already exists: " + request.getLocationCode());
        }

        WarehouseLocation location = new WarehouseLocation();
        location.setLocationCode(request.getLocationCode());
        location.setLocationName(request.getLocationName());
        location.setLocationType(request.getLocationType());
        location.setZone(request.getZone());
        location.setRack(request.getRack());
        location.setShelf(request.getShelf());
        location.setBin(request.getBin());
        location.setCapacity(request.getCapacity());
        location.setTemperatureRange(request.getTemperatureRange());
        location.setHumidityRange(request.getHumidityRange());
        location.setIsActive(request.getIsActive());
        location.setIsQuarantine(request.getIsQuarantine());
        location.setRemarks(request.getRemarks());

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        location.setCreatedBy(currentUser);

        WarehouseLocation savedLocation = locationRepository.save(location);
        return convertToResponse(savedLocation);
    }

    @Transactional(readOnly = true)
    public List<WarehouseLocationResponse> getAllLocations() {
        return locationRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WarehouseLocationResponse> getActiveLocations() {
        return locationRepository.findByIsActiveTrue().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WarehouseLocationResponse> getAvailableLocations() {
        return locationRepository.findAvailableLocations().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WarehouseLocationResponse getLocationById(Long id) {
        WarehouseLocation location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with ID: " + id));
        return convertToResponse(location);
    }

    @Transactional(readOnly = true)
    public WarehouseLocationResponse getLocationByCode(String locationCode) {
        WarehouseLocation location = locationRepository.findByLocationCode(locationCode)
                .orElseThrow(() -> new RuntimeException("Location not found with code: " + locationCode));
        return convertToResponse(location);
    }

    @Transactional
    public WarehouseLocationResponse updateLocation(Long id, WarehouseLocationRequest request) {
        WarehouseLocation location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with ID: " + id));

        // Check if location code is being changed and if it already exists
        if (!location.getLocationCode().equals(request.getLocationCode())) {
            if (locationRepository.findByLocationCode(request.getLocationCode()).isPresent()) {
                throw new RuntimeException("Location code already exists: " + request.getLocationCode());
            }
        }

        location.setLocationCode(request.getLocationCode());
        location.setLocationName(request.getLocationName());
        location.setLocationType(request.getLocationType());
        location.setZone(request.getZone());
        location.setRack(request.getRack());
        location.setShelf(request.getShelf());
        location.setBin(request.getBin());
        location.setCapacity(request.getCapacity());
        location.setTemperatureRange(request.getTemperatureRange());
        location.setHumidityRange(request.getHumidityRange());
        location.setIsActive(request.getIsActive());
        location.setIsQuarantine(request.getIsQuarantine());
        location.setRemarks(request.getRemarks());

        WarehouseLocation updatedLocation = locationRepository.save(location);
        return convertToResponse(updatedLocation);
    }

    @Transactional
    public void deleteLocation(Long id) {
        WarehouseLocation location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with ID: " + id));

        // Check if location has stock
        if (!location.getStocks().isEmpty()) {
            throw new RuntimeException("Cannot delete location with existing stock");
        }

        locationRepository.delete(location);
    }

    @Transactional(readOnly = true)
    public List<WarehouseLocationResponse> searchLocations(String searchTerm) {
        return locationRepository.searchLocations(searchTerm).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private WarehouseLocationResponse convertToResponse(WarehouseLocation location) {
        WarehouseLocationResponse response = new WarehouseLocationResponse();
        response.setId(location.getId());
        response.setLocationCode(location.getLocationCode());
        response.setLocationName(location.getLocationName());
        response.setLocationType(location.getLocationType());
        response.setZone(location.getZone());
        response.setRack(location.getRack());
        response.setShelf(location.getShelf());
        response.setBin(location.getBin());
        response.setCapacity(location.getCapacity());
        response.setCurrentOccupancy(location.getCurrentOccupancy());
        response.setAvailableCapacity(location.getAvailableCapacity());
        response.setTemperatureRange(location.getTemperatureRange());
        response.setHumidityRange(location.getHumidityRange());
        response.setIsActive(location.getIsActive());
        response.setIsQuarantine(location.getIsQuarantine());
        response.setRemarks(location.getRemarks());
        response.setCreatedBy(location.getCreatedBy());
        response.setCreatedAt(location.getCreatedAt());
        response.setUpdatedAt(location.getUpdatedAt());

        return response;
    }
}