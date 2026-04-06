package com.devion.erp.repository;

import com.devion.erp.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findBySupplierCode(String supplierCode);

    Optional<Supplier> findBySupplierName(String supplierName);

    List<Supplier> findByStatus(Supplier.SupplierStatus status);

    List<Supplier> findByIsApprovedTrue();

    boolean existsBySupplierCode(String supplierCode);

    boolean existsByGstNumber(String gstNumber);

    List<Supplier> findBySupplierCodeContainingIgnoreCaseOrSupplierNameContainingIgnoreCase(
            String supplierCode, String supplierName);
}