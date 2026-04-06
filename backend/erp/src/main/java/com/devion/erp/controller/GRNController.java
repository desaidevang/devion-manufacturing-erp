package com.devion.erp.controller;

import com.devion.erp.dto.GRNCreateRequest;
import com.devion.erp.dto.GRNInspectionResponse;
import com.devion.erp.dto.GRNInspectionSubmitRequest;
import com.devion.erp.dto.GRNResponse;

import com.devion.erp.service.GRNServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/warehouse/grn")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('WAREHOUSE_MANAGER','ADMIN')")
public class GRNController {

    private final GRNServiceImpl grnService;

    @PostMapping
    public ResponseEntity<GRNResponse> createGRN(@RequestBody GRNCreateRequest request) {
        return ResponseEntity.ok(grnService.createGRN(request));
    }

    @GetMapping
    public ResponseEntity<List<GRNResponse>> getAllGRN() {
        return ResponseEntity.ok(grnService.getAllGRN());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GRNResponse> getGRNById(@PathVariable Long id) {
        return ResponseEntity.ok(grnService.getGRNById(id));
    }
    @GetMapping("/{id}/inspection")
    @PreAuthorize("hasAnyRole('ADMIN','INSPECTION_OFFICER')")
    public ResponseEntity<GRNInspectionResponse> getGRNInspection(@PathVariable Long id) {
        return ResponseEntity.ok(grnService.getGRNInspection(id));
    }
    @PostMapping("/{id}/inspection")
    @PreAuthorize("hasAnyRole('ADMIN','INSPECTION_OFFICER')")
    public ResponseEntity<String> submitGRNInspection(
            @PathVariable Long id,
            @RequestBody GRNInspectionSubmitRequest request) {

        grnService.submitInspection(id, request);
        return ResponseEntity.ok("Inspection saved successfully");
    }
    @PatchMapping("/{id}/status")
    public ResponseEntity<GRNResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(grnService.updateStatus(id, status));
    }
}