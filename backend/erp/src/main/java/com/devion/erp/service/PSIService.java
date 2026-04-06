package com.devion.erp.service;

import com.devion.erp.dto.PSICreateRequest;
import com.devion.erp.dto.PSIResponse;
import com.devion.erp.dto.PSIUpdateRequest;
import com.devion.erp.entity.ProductStandard;
import com.devion.erp.repository.PSIRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PSIService {

    @Autowired
    private PSIRepository psiRepository;

    // Create new PSI
    public PSIResponse createPSI(PSICreateRequest request) {
        // Check if code already exists
        if (psiRepository.existsByStandardCode(request.getStandardCode())) {
            throw new RuntimeException("PSI standard code already exists");
        }

        ProductStandard psi = new ProductStandard();
        psi.setStandardCode(request.getStandardCode());
        psi.setStandardName(request.getStandardName());
        psi.setDescription(request.getDescription());
        psi.setStandardType(request.getStandardType());
        psi.setVersion(request.getVersion() != null ? request.getVersion() : "1.0");
        psi.setInspectionItems(request.getInspectionItems());
        psi.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        // Get current user from security context
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        psi.setCreatedBy(currentUser);

        ProductStandard savedPSI = psiRepository.save(psi);
        return convertToResponse(savedPSI);
    }

    // Get all PSI records
    public List<PSIResponse> getAllPSI() {
        return psiRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Get active PSI records
    public List<PSIResponse> getActivePSI() {
        // FIXED: Changed productStandardRepository to psiRepository
        List<ProductStandard> standards = psiRepository.findByIsActiveTrue();

        // Manually map to avoid lazy loading issues
        return standards.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private PSIResponse convertToResponse(ProductStandard standard) {
        PSIResponse response = new PSIResponse();
        response.setId(standard.getId());
        response.setStandardCode(standard.getStandardCode());
        response.setStandardName(standard.getStandardName());
        response.setDescription(standard.getDescription());
        response.setStandardType(standard.getStandardType());
        response.setVersion(standard.getVersion());

        // Force loading of inspectionItems before serialization
        if (standard.getInspectionItems() != null) {
            response.setInspectionItems(standard.getInspectionItems());
        }

        response.setIsActive(standard.getIsActive());
        response.setCreatedBy(standard.getCreatedBy());
        response.setCreatedAt(standard.getCreatedAt());
        response.setUpdatedAt(standard.getUpdatedAt());

        return response;
    }

    // Get PSI by ID
    public PSIResponse getPSIById(Long id) {
        ProductStandard psi = psiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PSI record not found with id: " + id));
        return convertToResponse(psi);
    }

    // Update PSI
    public PSIResponse updatePSI(Long id, PSIUpdateRequest request) {
        ProductStandard psi = psiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PSI record not found with id: " + id));

        if (request.getStandardName() != null) {
            psi.setStandardName(request.getStandardName());
        }
        if (request.getDescription() != null) {
            psi.setDescription(request.getDescription());
        }
        if (request.getStandardType() != null) {
            psi.setStandardType(request.getStandardType());
        }
        if (request.getVersion() != null) {
            psi.setVersion(request.getVersion());
        }
        if (request.getInspectionItems() != null) {
            psi.setInspectionItems(request.getInspectionItems());
        }
        if (request.getIsActive() != null) {
            psi.setIsActive(request.getIsActive());
        }

        ProductStandard updatedPSI = psiRepository.save(psi);
        return convertToResponse(updatedPSI);
    }

    // Soft delete (deactivate)
    public void deactivatePSI(Long id) {
        ProductStandard psi = psiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PSI record not found with id: " + id));

        psi.setIsActive(false);
        psiRepository.save(psi);
    }
}