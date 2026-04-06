package com.devion.erp.service;

import com.devion.erp.dto.*;
import com.devion.erp.entity.Part;
import com.devion.erp.entity.ProductStandard;
import com.devion.erp.repository.PartRepository;
import com.devion.erp.repository.PSIRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional // Add this at class level
public class PartService {

    @Autowired
    private PartRepository partRepository;

    @Autowired
    private PSIRepository psiRepository;

    @Autowired
    private PSIService psiService;

    // Create new part
    public PartResponse createPart(PartCreateRequest request) {
        // Check if part number already exists
        if (partRepository.existsByPartNumber(request.getPartNumber())) {
            throw new RuntimeException("Part number already exists");
        }

        Part part = new Part();
        part.setPartNumber(request.getPartNumber());
        part.setPartName(request.getPartName());
        part.setDescription(request.getDescription());
        part.setDrawingNumber(request.getDrawingNumber());
        part.setRevisionLevel(request.getRevisionLevel() != null ? request.getRevisionLevel() : "00");
        part.setPartType(request.getPartType());
        part.setClassCode(request.getClassCode() != null ? request.getClassCode() : Part.ClassCode.CRITICAL);
        part.setIsActive(true);

        // Get current user
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        part.setCreatedBy(currentUser);

        // Link PSI standards if provided
        if (request.getPsiStandardIds() != null && !request.getPsiStandardIds().isEmpty()) {
            List<ProductStandard> psiStandards = psiRepository.findAllById(request.getPsiStandardIds());
            part.setPsiStandards(psiStandards);
        }

        Part savedPart = partRepository.save(part);
        return convertToResponse(savedPart);
    }

    // Get all parts
    @Transactional(readOnly = true) // Add this to read methods
    public List<PartResponse> getAllParts() {
        return partRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Get active parts
    @Transactional(readOnly = true) // Add this to read methods
    public List<PartResponse> getActiveParts() {
        return partRepository.findByIsActiveTrue().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Get part by ID
    public PartResponse getPartById(Long id) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Part not found with id: " + id));
        return convertToResponse(part);
    }

    // Get part by part number
    public PartResponse getPartByNumber(String partNumber) {
        Part part = partRepository.findByPartNumber(partNumber)
                .orElseThrow(() -> new RuntimeException("Part not found with number: " + partNumber));
        return convertToResponse(part);
    }

    // Update part
    public PartResponse updatePart(Long id, PartUpdateRequest request) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Part not found with id: " + id));

        if (request.getPartName() != null) {
            part.setPartName(request.getPartName());
        }
        if (request.getDescription() != null) {
            part.setDescription(request.getDescription());
        }
        if (request.getDrawingNumber() != null) {
            part.setDrawingNumber(request.getDrawingNumber());
        }
        if (request.getRevisionLevel() != null) {
            part.setRevisionLevel(request.getRevisionLevel());
        }
        if (request.getPartType() != null) {
            part.setPartType(request.getPartType());
        }
        if (request.getClassCode() != null) {
            part.setClassCode(request.getClassCode());
        }
        if (request.getIsActive() != null) {
            part.setIsActive(request.getIsActive());
        }

        // Update linked PSI standards
        if (request.getPsiStandardIds() != null) {
            List<ProductStandard> psiStandards = psiRepository.findAllById(request.getPsiStandardIds());
            part.setPsiStandards(psiStandards);
        }

        Part updatedPart = partRepository.save(part);
        return convertToResponse(updatedPart);
    }

    // Link PSI standards to part
    public PartResponse linkPsiStandards(Long partId, List<Long> psiStandardIds) {
        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new RuntimeException("Part not found with id: " + partId));

        List<ProductStandard> psiStandards = psiRepository.findAllById(psiStandardIds);
        part.getPsiStandards().addAll(psiStandards);

        Part updatedPart = partRepository.save(part);
        return convertToResponse(updatedPart);
    }

    // Remove PSI standard from part
    public PartResponse removePsiStandard(Long partId, Long psiId) {
        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new RuntimeException("Part not found with id: " + partId));

        part.getPsiStandards().removeIf(psi -> psi.getId().equals(psiId));

        Part updatedPart = partRepository.save(part);
        return convertToResponse(updatedPart);
    }

    // Deactivate part
    public void deactivatePart(Long id) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Part not found with id: " + id));

        part.setIsActive(false);
        partRepository.save(part);
    }

    // Convert entity to response DTO
    // Convert entity to response DTO
    private PartResponse convertToResponse(Part part) {
        PartResponse response = new PartResponse();
        response.setId(part.getId());
        response.setPartNumber(part.getPartNumber());
        response.setPartName(part.getPartName());
        response.setDescription(part.getDescription());
        response.setDrawingNumber(part.getDrawingNumber());
        response.setRevisionLevel(part.getRevisionLevel());
        response.setPartType(part.getPartType());
        response.setClassCode(part.getClassCode());
        response.setIsActive(part.getIsActive());
        response.setCreatedBy(part.getCreatedBy());
        response.setCreatedAt(part.getCreatedAt());
        response.setUpdatedAt(part.getUpdatedAt());

        // Convert linked PSI standards
        List<SimplePSIResponse> linkedPsi = new ArrayList<>();
        if (part.getPsiStandards() != null) {
            for (ProductStandard psi : part.getPsiStandards()) {
                SimplePSIResponse psiResponse = new SimplePSIResponse();
                psiResponse.setId(psi.getId());
                psiResponse.setStandardCode(psi.getStandardCode());
                psiResponse.setStandardName(psi.getStandardName());
                psiResponse.setStandardType(psi.getStandardType().toString());

                // ADD THIS LINE - THIS IS WHAT'S MISSING
                psiResponse.setIsActive(psi.getIsActive());

                // Optional: Add description if you want it
                psiResponse.setDescription(psi.getDescription());

                linkedPsi.add(psiResponse);
            }
        }
        response.setLinkedPsiStandards(linkedPsi);

        return response;
    }
}