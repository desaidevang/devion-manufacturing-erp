package com.devion.erp.repository;

import com.devion.erp.entity.WarehouseStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, Long> {

    // Basic CRUD operations
    List<WarehouseStock> findByPartId(Long partId);

    List<WarehouseStock> findByWarehouseLocationId(Long locationId);

    List<WarehouseStock> findByBatchNumber(String batchNumber);

    List<WarehouseStock> findByStockStatus(WarehouseStock.StockStatus status);

    Optional<WarehouseStock> findByGrnNumber(String grnNumber);

    // Stock level queries
    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.availableQuantity <= ws.reorderLevel")
    List<WarehouseStock> findLowStockItems();

    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.expiryDate <= :date")
    List<WarehouseStock> findExpiringSoon(@Param("date") LocalDate date);

    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.expiryDate BETWEEN CURRENT_DATE AND :thresholdDate")
    List<WarehouseStock> findExpiringSoonWithThreshold(@Param("thresholdDate") LocalDate thresholdDate);

    // Available stock queries (for batch allocation)
    @Query("SELECT ws FROM WarehouseStock ws WHERE " +
            "ws.part.id = :partId AND " +
            "ws.availableQuantity > 0 AND " +
            "ws.stockStatus = 'ACTIVE' " +  // Changed from 'AVAILABLE' to 'ACTIVE' based on your entity
            "ORDER BY ws.expiryDate ASC NULLS LAST, ws.manufacturingDate ASC, ws.createdAt ASC")
    List<WarehouseStock> findAvailableStockByPart(@Param("partId") Long partId);

    // Updated method for batch stock allocation (FIFO with expiry consideration)
    @Query("""
        SELECT ws FROM WarehouseStock ws 
        WHERE ws.part.id = :partId 
        AND ws.stockStatus = 'ACTIVE'
        AND ws.availableQuantity > 0
        ORDER BY 
            CASE WHEN ws.expiryDate IS NOT NULL THEN 0 ELSE 1 END,
            ws.expiryDate ASC,
            ws.manufacturingDate ASC,
            ws.createdAt ASC
        """)
    List<WarehouseStock> findAvailableStockByPartId(@Param("partId") Long partId);

    // Aggregate stock queries
    @Query("SELECT COALESCE(SUM(ws.availableQuantity), 0) FROM WarehouseStock ws WHERE ws.part.id = :partId AND ws.stockStatus = 'ACTIVE'")
    Integer getTotalAvailableStockByPart(@Param("partId") Long partId);

    @Query("SELECT COALESCE(SUM(ws.quantity), 0) FROM WarehouseStock ws WHERE ws.part.id = :partId")
    Integer getTotalStockByPart(@Param("partId") Long partId);

    @Query("SELECT COALESCE(SUM(ws.reservedQuantity), 0) FROM WarehouseStock ws WHERE ws.part.id = :partId")
    Integer getTotalReservedStockByPart(@Param("partId") Long partId);

    // Find stock by composite key
    @Query("SELECT ws FROM WarehouseStock ws WHERE " +
            "ws.part.id = :partId AND " +
            "ws.warehouseLocation.id = :locationId AND " +
            "ws.batchNumber = :batchNumber")
    Optional<WarehouseStock> findByPartIdAndWarehouseLocationIdAndBatchNumber(
            @Param("partId") Long partId,
            @Param("locationId") Long locationId,
            @Param("batchNumber") String batchNumber);

    // Fetch with details
    @Query("SELECT DISTINCT ws FROM WarehouseStock ws " +
            "LEFT JOIN FETCH ws.part p " +
            "LEFT JOIN FETCH ws.warehouseLocation wl " +
            "LEFT JOIN FETCH ws.supplier s " +
            "WHERE ws.id = :id")
    Optional<WarehouseStock> findByIdWithDetails(@Param("id") Long id);

    // Quarantine related queries
    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.stockStatus = 'QUARANTINE'")
    List<WarehouseStock> findQuarantineStocks();

    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.stockStatus = 'QUARANTINE' AND ws.part.id = :partId")
    List<WarehouseStock> findQuarantineStocksByPart(@Param("partId") Long partId);

    // Stock by supplier
    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.supplier.id = :supplierId")
    List<WarehouseStock> findBySupplierId(@Param("supplierId") Long supplierId);

    @Query("SELECT ws FROM WarehouseStock ws WHERE ws.supplier.id = :supplierId AND ws.part.id = :partId")
    List<WarehouseStock> findBySupplierAndPart(@Param("supplierId") Long supplierId, @Param("partId") Long partId);

    // Location-based queries
    @Query("SELECT ws FROM WarehouseStock ws WHERE " +
            "ws.warehouseLocation.id = :locationId AND " +
            "ws.availableQuantity > 0")
    List<WarehouseStock> findAvailableStockByLocation(@Param("locationId") Long locationId);

    @Query("SELECT ws FROM WarehouseStock ws WHERE " +
            "ws.warehouseLocation.id = :locationId AND " +
            "ws.part.id = :partId")
    List<WarehouseStock> findByLocationAndPart(@Param("locationId") Long locationId, @Param("partId") Long partId);

    // Stock movement queries
    @Query("SELECT ws FROM WarehouseStock ws WHERE " +
            "ws.part.id = :partId AND " +
            "ws.stockStatus IN ('ACTIVE', 'RESERVED') " +
            "ORDER BY ws.createdAt DESC")
    List<WarehouseStock> findActiveStockByPart(@Param("partId") Long partId);

    // Batch-specific queries
    @Query("SELECT ws FROM WarehouseStock ws WHERE " +
            "ws.batchNumber LIKE CONCAT(:batchPrefix, '%')")
    List<WarehouseStock> findByBatchPrefix(@Param("batchPrefix") String batchPrefix);

    // Find stocks that will expire within specified days
    @Query("SELECT ws FROM WarehouseStock ws WHERE " +
            "ws.expiryDate IS NOT NULL AND " +
            "ws.expiryDate <= :expiryDate")
    List<WarehouseStock> findByExpiryDateBefore(@Param("expiryDate") LocalDate expiryDate);

    // Find stocks with specific manufacturing date range
    @Query("SELECT ws FROM WarehouseStock ws WHERE " +
            "ws.manufacturingDate BETWEEN :startDate AND :endDate")
    List<WarehouseStock> findByManufacturingDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Find stocks by multiple criteria (for reporting)
    @Query("SELECT ws FROM WarehouseStock ws WHERE " +
            "(:partId IS NULL OR ws.part.id = :partId) AND " +
            "(:locationId IS NULL OR ws.warehouseLocation.id = :locationId) AND " +
            "(:status IS NULL OR ws.stockStatus = :status) AND " +
            "(:supplierId IS NULL OR ws.supplier.id = :supplierId)")
    List<WarehouseStock> findByMultipleCriteria(
            @Param("partId") Long partId,
            @Param("locationId") Long locationId,
            @Param("status") WarehouseStock.StockStatus status,
            @Param("supplierId") Long supplierId);

    // Check if any stock exists for a part
    @Query("SELECT CASE WHEN COUNT(ws) > 0 THEN true ELSE false END " +
            "FROM WarehouseStock ws WHERE ws.part.id = :partId")
    boolean existsByPartId(@Param("partId") Long partId);

    // Get stock by part and status
    @Query("SELECT ws FROM WarehouseStock ws WHERE " +
            "ws.part.id = :partId AND " +
            "ws.stockStatus = :status")
    List<WarehouseStock> findByPartAndStatus(
            @Param("partId") Long partId,
            @Param("status") WarehouseStock.StockStatus status);

    // Find stock by GRN item ID
    List<WarehouseStock> findByGrnItemId(Long grnItemId);

    // Find stocks that need reordering (below reorder level)
    @Query("SELECT ws FROM WarehouseStock ws WHERE " +
            "ws.availableQuantity <= ws.reorderLevel AND " +
            "ws.stockStatus = 'ACTIVE'")
    List<WarehouseStock> findStocksNeedingReorder();

    // Find stock for batch creation with quantity constraint
    @Query("""
        SELECT ws FROM WarehouseStock ws 
        WHERE ws.part.id = :partId 
        AND ws.stockStatus = 'ACTIVE'
        AND ws.availableQuantity >= :minimumQuantity
        ORDER BY ws.expiryDate ASC, ws.createdAt ASC
        """)
    List<WarehouseStock> findAvailableStockWithMinimumQuantity(
            @Param("partId") Long partId,
            @Param("minimumQuantity") Integer minimumQuantity);

    // Get total stock value by part
    @Query("SELECT COALESCE(SUM(ws.totalValue), 0) FROM WarehouseStock ws WHERE ws.part.id = :partId")
    Double getTotalStockValueByPart(@Param("partId") Long partId);

    // Get stock summary by location type
    @Query("""
        SELECT wl.locationType, SUM(ws.quantity) as totalQuantity, SUM(ws.totalValue) as totalValue
        FROM WarehouseStock ws 
        JOIN ws.warehouseLocation wl
        WHERE ws.stockStatus = 'ACTIVE'
        GROUP BY wl.locationType
        """)
    List<Object[]> getStockSummaryByLocationType();

    // Find stock for specific batch allocation (with lock for concurrency)
    @Query(value = """
        SELECT * FROM warehouse_stocks ws 
        WHERE ws.part_id = :partId 
        AND ws.stock_status = 'ACTIVE'
        AND ws.available_quantity > 0
        ORDER BY ws.expiry_date ASC NULLS LAST
        FOR UPDATE SKIP LOCKED
        LIMIT 1
        """, nativeQuery = true)
    Optional<WarehouseStock> findStockForAllocation(@Param("partId") Long partId);
}