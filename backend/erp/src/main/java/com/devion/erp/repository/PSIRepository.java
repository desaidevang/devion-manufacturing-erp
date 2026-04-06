package com.devion.erp.repository;

import com.devion.erp.entity.ProductStandard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PSIRepository extends JpaRepository<ProductStandard, Long> {
    Optional<ProductStandard> findByStandardCode(String standardCode);
    List<ProductStandard> findByIsActiveTrue();
    List<ProductStandard> findByStandardType(ProductStandard.StandardType type);
    boolean existsByStandardCode(String standardCode);
}