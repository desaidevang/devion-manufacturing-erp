// BatchItemRepository.java
package com.devion.erp.repository;

import com.devion.erp.entity.BatchItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchItemRepository extends JpaRepository<BatchItem, Long> {

    List<BatchItem> findByBatchId(Long batchId);

    @Query("SELECT bi FROM BatchItem bi JOIN FETCH bi.part WHERE bi.batch.id = :batchId")
    List<BatchItem> findByBatchIdWithParts(@Param("batchId") Long batchId);

    @Query("SELECT bi FROM BatchItem bi WHERE bi.batch.id = :batchId AND bi.isIssued = false")
    List<BatchItem> findPendingItemsByBatchId(@Param("batchId") Long batchId);

    @Query("SELECT bi FROM BatchItem bi WHERE bi.part.id = :partId AND bi.isIssued = false")
    List<BatchItem> findPendingItemsByPartId(@Param("partId") Long partId);

    @Query("SELECT SUM(bi.quantityRequired - bi.quantityUsed) FROM BatchItem bi WHERE bi.part.id = :partId AND bi.isIssued = false")
    Integer getReservedQuantityForPart(@Param("partId") Long partId);
}