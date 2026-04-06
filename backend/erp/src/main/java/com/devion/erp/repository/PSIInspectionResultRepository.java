// PSIInspectionResultRepository.java
package com.devion.erp.repository;

import com.devion.erp.entity.PSIInspectionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PSIInspectionResultRepository extends JpaRepository<PSIInspectionResult, Long> {
    List<PSIInspectionResult> findByGrnItemId(Long grnItemId);
    List<PSIInspectionResult> findByGrnItem_Grn_Id(Long grnId);
}