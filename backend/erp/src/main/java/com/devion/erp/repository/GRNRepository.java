package com.devion.erp.repository;

import com.devion.erp.entity.GRN;
import com.devion.erp.entity.GRN.Status;
import com.devion.erp.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GRNRepository extends JpaRepository<GRN, Long> {
    Optional<GRN> findByGrnNumber(String grnNumber);
    boolean existsByGrnNumber(String grnNumber);

    // Add these missing methods
    List<GRN> findByStatus(Status status);
    List<GRN> findBySupplier(Supplier supplier);

    @Query("SELECT g FROM GRN g WHERE " +
            "g.grnNumber LIKE %:searchTerm% OR " +
            "g.invoiceNumber LIKE %:searchTerm% OR " +
            "g.poNumber LIKE %:searchTerm% OR " +
            "g.challanNumber LIKE %:searchTerm% OR " +
            "g.supplier.supplierName LIKE %:searchTerm% OR " +
            "g.supplier.supplierCode LIKE %:searchTerm%")
    List<GRN> searchGRN(@Param("searchTerm") String searchTerm);
}