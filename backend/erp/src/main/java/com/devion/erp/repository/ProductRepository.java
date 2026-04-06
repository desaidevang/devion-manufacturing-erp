package com.devion.erp.repository;

import com.devion.erp.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByProductCode(String productCode);
    List<Product> findByIsActiveTrue();
    boolean existsByProductCode(String productCode);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.bomItems bi LEFT JOIN FETCH bi.part WHERE p.id = :id")
    Optional<Product> findByIdWithBom(@Param("id") Long id);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.bomItems bi LEFT JOIN FETCH bi.part WHERE p.productCode = :productCode")
    Optional<Product> findByProductCodeWithBom(@Param("productCode") String productCode);
}