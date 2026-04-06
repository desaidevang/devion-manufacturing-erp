package com.devion.erp.repository;

import com.devion.erp.entity.WarehouseLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseLocationRepository extends JpaRepository<WarehouseLocation, Long> {
    Optional<WarehouseLocation> findByLocationCode(String locationCode);
    List<WarehouseLocation> findByLocationType(WarehouseLocation.LocationType locationType);
    List<WarehouseLocation> findByIsActiveTrue();
    List<WarehouseLocation> findByIsQuarantineTrue();
    List<WarehouseLocation> findByIsActiveTrueAndIsQuarantineFalse();
    List<WarehouseLocation> findByZone(String zone);

    @Query("SELECT wl FROM WarehouseLocation wl WHERE " +
            "wl.locationCode LIKE %:searchTerm% OR " +
            "wl.locationName LIKE %:searchTerm% OR " +
            "wl.zone LIKE %:searchTerm%")
    List<WarehouseLocation> searchLocations(@Param("searchTerm") String searchTerm);

    @Query("SELECT SUM(wl.capacity) FROM WarehouseLocation wl WHERE wl.isActive = true")
    Long getTotalCapacity();

    @Query("SELECT SUM(wl.currentOccupancy) FROM WarehouseLocation wl WHERE wl.isActive = true")
    Long getTotalOccupancy();

    @Query("SELECT wl FROM WarehouseLocation wl WHERE wl.isActive = true " +
            "AND (wl.capacity IS NULL OR wl.currentOccupancy < wl.capacity) " +
            "ORDER BY wl.availableCapacity DESC")
    List<WarehouseLocation> findAvailableLocations();
}