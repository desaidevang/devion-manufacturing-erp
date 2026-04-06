package com.devion.erp.controller;

import com.devion.erp.dto.SupplierCreateRequest;
import com.devion.erp.dto.SupplierResponse;
import com.devion.erp.entity.Supplier;
import com.devion.erp.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/warehouse/suppliers")
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER', 'INSPECTION_OFFICER')")
public class SupplierController {

    @Autowired
    private SupplierService supplierService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<SupplierResponse> createSupplier(@Valid @RequestBody SupplierCreateRequest request) {
        SupplierResponse response = supplierService.createSupplier(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<SupplierResponse>> getAllSuppliers() {
        List<SupplierResponse> suppliers = supplierService.getAllSuppliers();
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/approved")
    public ResponseEntity<List<SupplierResponse>> getApprovedSuppliers() {
        List<SupplierResponse> suppliers = supplierService.getApprovedSuppliers();
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierResponse> getSupplierById(@PathVariable Long id) {
        SupplierResponse supplier = supplierService.getSupplierById(id);
        return ResponseEntity.ok(supplier);
    }

    @GetMapping("/code/{supplierCode}")
    public ResponseEntity<SupplierResponse> getSupplierByCode(@PathVariable String supplierCode) {
        SupplierResponse supplier = supplierService.getSupplierByCode(supplierCode);
        return ResponseEntity.ok(supplier);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<SupplierResponse> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody SupplierCreateRequest request) {
        SupplierResponse response = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateSupplierStatus(
            @PathVariable Long id,
            @RequestParam Supplier.SupplierStatus status) {
        supplierService.updateSupplierStatus(id, status);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/approval")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateSupplierApproval(
            @PathVariable Long id,
            @RequestParam Boolean isApproved) {
        supplierService.updateSupplierApproval(id, isApproved);
        return ResponseEntity.noContent().build();
    }
}