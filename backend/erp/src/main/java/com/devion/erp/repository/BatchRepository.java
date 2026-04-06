// BatchRepository.java
package com.devion.erp.repository;

import com.devion.erp.entity.Batch;
import com.devion.erp.entity.Batch.BatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {

    Optional<Batch> findByBatchCode(String batchCode);

    boolean existsByBatchCode(String batchCode);

    List<Batch> findByStatus(BatchStatus status);

    List<Batch> findByAssignedEmployeeId(Long employeeId);

    List<Batch> findByProductId(Long productId);

    @Query("SELECT b FROM Batch b WHERE b.status = 'IN_PROGRESS' AND (b.startTime < :threshold OR (b.startTime IS NULL AND b.createdAt < :threshold))")
    List<Batch> findDelayedBatches(@Param("threshold") LocalDateTime threshold);

    @Query("SELECT b FROM Batch b WHERE b.assignedEmployee.id = :employeeId AND b.status = 'IN_PROGRESS'")
    List<Batch> findActiveBatchesByEmployee(@Param("employeeId") Long employeeId);

    @Query("SELECT b FROM Batch b JOIN FETCH b.batchItems WHERE b.id = :id")
    Optional<Batch> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT b FROM Batch b JOIN FETCH b.product WHERE b.id = :id")
    Optional<Batch> findByIdWithProduct(@Param("id") Long id);

    @Query("SELECT b FROM Batch b WHERE b.createdAt BETWEEN :startDate AND :endDate")
    List<Batch> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(b) FROM Batch b WHERE b.status = :status")
    Long countByStatus(@Param("status") BatchStatus status);

    @Query("""
        SELECT b FROM Batch b 
        WHERE (:status IS NULL OR b.status = :status)
        AND (:employeeId IS NULL OR b.assignedEmployee.id = :employeeId)
        AND (:productId IS NULL OR b.product.id = :productId)
        AND (:priority IS NULL OR b.priority = :priority)
        ORDER BY b.createdAt DESC
        """)
    List<Batch> findWithFilters(@Param("status") BatchStatus status,
                                @Param("employeeId") Long employeeId,
                                @Param("productId") Long productId,
                                @Param("priority") Batch.Priority priority);
}