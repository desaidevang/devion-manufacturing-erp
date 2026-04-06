package com.devion.erp.repository;

import com.devion.erp.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartRepository extends JpaRepository<Part, Long> {
    Optional<Part> findByPartNumber(String partNumber);
    List<Part> findByIsActiveTrue();
    List<Part> findByPartType(Part.PartType partType);
    List<Part> findByClassCode(Part.ClassCode classCode);
    boolean existsByPartNumber(String partNumber);

    // NEW: Fetch part with PSI standards
    @Query("SELECT DISTINCT p FROM Part p " +
            "LEFT JOIN FETCH p.psiStandards ps " +
            "WHERE p.id = :id")
    Optional<Part> findByIdWithPsiStandards(@Param("id") Long id);

    // NEW: Fetch part by number with PSI standards
    @Query("SELECT DISTINCT p FROM Part p " +
            "LEFT JOIN FETCH p.psiStandards ps " +
            "WHERE p.partNumber = :partNumber")
    Optional<Part> findByPartNumberWithPsiStandards(@Param("partNumber") String partNumber);
}