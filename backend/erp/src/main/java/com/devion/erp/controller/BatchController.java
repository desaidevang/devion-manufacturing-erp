// BatchController.java - Fixed version
package com.devion.erp.controller;

import com.devion.erp.dto.*;
import com.devion.erp.service.BatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/batches")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'PRODUCTION_MANAGER', 'WAREHOUSE_MANAGER')")
public class BatchController {

    private final BatchService batchService;

    // Step 1: Create Batch
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    public ResponseEntity<BatchResponse> createBatch(@Valid @RequestBody BatchCreateRequest request) {
        return ResponseEntity.ok(batchService.createBatch(request));
    }

    // Pre-check stock before creating batch
    @PostMapping("/pre-check")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR')")
    public ResponseEntity<StockCheckResponse> preCheckStock(
            @RequestParam Long productId,
            @RequestParam Integer batchQuantity) {
        return ResponseEntity.ok(batchService.preCheckStock(productId, batchQuantity));
    }

    // Step 2: Start Batch (assign to employee)
    @PatchMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<BatchResponse> startBatch(
            @PathVariable Long id,
            @Valid @RequestBody BatchStartRequest request) {
        return ResponseEntity.ok(batchService.startBatch(id, request));
    }

    // Step 3: Complete Batch
    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<BatchResponse> completeBatch(
            @PathVariable Long id,
            @Valid @RequestBody BatchCompleteRequest request) {
        return ResponseEntity.ok(batchService.completeBatch(id, request));
    }

    // Cancel Batch
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    public ResponseEntity<BatchResponse> cancelBatch(
            @PathVariable Long id,
            @RequestParam String reason) {
        return ResponseEntity.ok(batchService.cancelBatch(id, reason));
    }

    // Get all batches
    @GetMapping
    public ResponseEntity<List<BatchResponse>> getAllBatches() {
        return ResponseEntity.ok(batchService.getAllBatches());
    }

    // Get batch by ID
    @GetMapping("/{id}")
    public ResponseEntity<BatchResponse> getBatchById(@PathVariable Long id) {
        return ResponseEntity.ok(batchService.getBatchById(id));
    }

    // Get batches by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BatchResponse>> getBatchesByStatus(@PathVariable String status) {
        try {
            com.devion.erp.entity.Batch.BatchStatus batchStatus =
                    com.devion.erp.entity.Batch.BatchStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(batchService.getBatchesByStatus(batchStatus));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }

    // Get batches by employee
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<BatchResponse>> getBatchesByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(batchService.getBatchesByEmployee(employeeId));
    }

    // Get available employees for assignment
    @GetMapping("/employees/available")
    public ResponseEntity<List<UserResponse>> getAvailableEmployees() {
        return ResponseEntity.ok(batchService.getAvailableEmployees());
    }

    // Get dashboard data - FIXED: Added @GetMapping annotation
    @GetMapping("/dashboard")
    public ResponseEntity<BatchDashboardResponse> getDashboard() {
        return ResponseEntity.ok(batchService.getDashboard());
    }

    // Update batch
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<BatchResponse> updateBatch(
            @PathVariable Long id,
            @Valid @RequestBody BatchUpdateRequest request) {
        return ResponseEntity.ok(batchService.updateBatch(id, request));
    }

    // Get delayed batches (for frontend highlighting)
    @GetMapping("/delayed")
    public ResponseEntity<List<BatchResponse>> getDelayedBatches() {
        return ResponseEntity.ok(batchService.getBatchesByStatus(
                com.devion.erp.entity.Batch.BatchStatus.DELAYED));
    }

    // Get in-progress batches
    @GetMapping("/in-progress")
    public ResponseEntity<List<BatchResponse>> getInProgressBatches() {
        return ResponseEntity.ok(batchService.getBatchesByStatus(
                com.devion.erp.entity.Batch.BatchStatus.IN_PROGRESS));
    }

    // Search/filter batches
    @GetMapping("/search")
    public ResponseEntity<List<BatchResponse>> searchBatches(
            @RequestParam(required = false) String batchCode,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {
        // Implementation would go here
        return ResponseEntity.ok(batchService.getAllBatches());
    }
}