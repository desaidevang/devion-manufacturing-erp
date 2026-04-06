package com.devion.erp.repository;

import com.devion.erp.entity.GRNItemPSIResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GRNItemPSIResultRepository extends JpaRepository<GRNItemPSIResult, Long> {

    List<GRNItemPSIResult> findByGrnItemId(Long grnItemId);

    void deleteAllByGrnItemId(Long grnItemId);
}
