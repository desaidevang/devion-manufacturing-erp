package com.devion.erp.controller;

import com.devion.erp.dto.*;
import com.devion.erp.service.PartService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/parts")
@PreAuthorize("hasAnyRole('ADMIN', 'INSPECTION_OFFICER', 'WAREHOUSE_MANAGER', 'SUPERVISOR')")
public class PartController {

    @Autowired
    private PartService partService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTION_OFFICER')")
    public ResponseEntity<PartResponse> createPart(@Valid @RequestBody PartCreateRequest request) {
        PartResponse response = partService.createPart(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<PartResponse>> getAllParts() {
        List<PartResponse> parts = partService.getAllParts();
        return ResponseEntity.ok(parts);
    }

    @GetMapping("/active")
    public ResponseEntity<List<PartResponse>> getActiveParts() {
        List<PartResponse> parts = partService.getActiveParts();
        return ResponseEntity.ok(parts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PartResponse> getPartById(@PathVariable Long id) {
        PartResponse part = partService.getPartById(id);
        return ResponseEntity.ok(part);
    }

    @GetMapping("/number/{partNumber}")
    public ResponseEntity<PartResponse> getPartByNumber(@PathVariable String partNumber) {
        PartResponse part = partService.getPartByNumber(partNumber);
        return ResponseEntity.ok(part);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTION_OFFICER')")
    public ResponseEntity<PartResponse> updatePart(
            @PathVariable Long id,
            @Valid @RequestBody PartUpdateRequest request) {
        PartResponse response = partService.updatePart(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/link-psi")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTION_OFFICER')")
    public ResponseEntity<PartResponse> linkPsiStandards(
            @PathVariable Long id,
            @RequestBody List<Long> psiStandardIds) {
        PartResponse response = partService.linkPsiStandards(id, psiStandardIds);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{partId}/remove-psi/{psiId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTION_OFFICER')")
    public ResponseEntity<PartResponse> removePsiStandard(
            @PathVariable Long partId,
            @PathVariable Long psiId) {
        PartResponse response = partService.removePsiStandard(partId, psiId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivatePart(@PathVariable Long id) {
        partService.deactivatePart(id);
        return ResponseEntity.noContent().build();
    }
}