// src/main/java/com/devion/erp/repository/InventoryMovementRepository.java
package com.devion.erp.repository;

import com.devion.erp.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

    List<InventoryMovement> findByWarehouseStockId(Long stockId);

    List<InventoryMovement> findByFromLocationIdOrToLocationId(Long fromLocationId, Long toLocationId);

    @Query("SELECT im FROM InventoryMovement im WHERE " +
            "(:stockId IS NULL OR im.warehouseStock.id = :stockId) AND " +
            "(:locationId IS NULL OR (im.fromLocation.id = :locationId OR im.toLocation.id = :locationId)) AND " +
            "(:fromDate IS NULL OR im.movementDate >= :fromDate) AND " +
            "(:toDate IS NULL OR im.movementDate <= :toDate) " +
            "ORDER BY im.movementDate DESC")
    List<InventoryMovement> findMovements(@Param("stockId") Long stockId,
                                          @Param("locationId") Long locationId,
                                          @Param("fromDate") LocalDateTime fromDate,
                                          @Param("toDate") LocalDateTime toDate);
}