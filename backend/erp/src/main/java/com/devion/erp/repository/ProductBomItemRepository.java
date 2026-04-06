package com.devion.erp.repository;

import com.devion.erp.entity.ProductBomItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductBomItemRepository extends JpaRepository<ProductBomItem, Long> {
    List<ProductBomItem> findByProductId(Long productId);

    @Query("SELECT bi FROM ProductBomItem bi JOIN FETCH bi.part WHERE bi.product.id = :productId ORDER BY bi.sequenceNumber")
    List<ProductBomItem> findByProductIdWithParts(@Param("productId") Long productId);

    Optional<ProductBomItem> findByProductIdAndPartId(Long productId, Long partId);

    @Modifying
    @Query("DELETE FROM ProductBomItem bi WHERE bi.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);
}