package com.devion.erp.controller;

import com.devion.erp.dto.PSICreateRequest;
import com.devion.erp.dto.PSIResponse;
import com.devion.erp.dto.PSIUpdateRequest;
import com.devion.erp.service.PSIService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/psi")
@PreAuthorize("hasAnyRole('ADMIN', 'INSPECTION_OFFICER', 'WAREHOUSE_MANAGER')")
public class PSIController {

    @Autowired
    private PSIService psiService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTION_OFFICER')")
    public ResponseEntity<PSIResponse> createPSI(@Valid @RequestBody PSICreateRequest request) {
        PSIResponse response = psiService.createPSI(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<PSIResponse>> getAllPSI() {
        List<PSIResponse> psiList = psiService.getAllPSI();
        return ResponseEntity.ok(psiList);
    }

    @GetMapping("/active")
    public ResponseEntity<List<PSIResponse>> getActivePSI() {
        List<PSIResponse> psiList = psiService.getActivePSI();
        return ResponseEntity.ok(psiList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PSIResponse> getPSIById(@PathVariable Long id) {
        PSIResponse psi = psiService.getPSIById(id);
        return ResponseEntity.ok(psi);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSPECTION_OFFICER')")
    public ResponseEntity<PSIResponse> updatePSI(
            @PathVariable Long id,
            @Valid @RequestBody PSIUpdateRequest request) {
        PSIResponse response = psiService.updatePSI(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivatePSI(@PathVariable Long id) {
        psiService.deactivatePSI(id);
        return ResponseEntity.noContent().build();
    }
}