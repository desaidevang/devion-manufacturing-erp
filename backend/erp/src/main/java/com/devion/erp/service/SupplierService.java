package com.devion.erp.service;

import com.devion.erp.dto.SupplierCreateRequest;
import com.devion.erp.dto.SupplierResponse;
import com.devion.erp.entity.Supplier;
import com.devion.erp.repository.SupplierRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    // Create new supplier
    public SupplierResponse createSupplier(SupplierCreateRequest request) {
        // Check if supplier code already exists
        if (supplierRepository.existsBySupplierCode(request.getSupplierCode())) {
            throw new RuntimeException("Supplier code already exists: " + request.getSupplierCode());
        }

        // Check if GST number already exists
        if (request.getGstNumber() != null && !request.getGstNumber().isEmpty()) {
            if (supplierRepository.existsByGstNumber(request.getGstNumber())) {
                throw new RuntimeException("GST number already exists: " + request.getGstNumber());
            }
        }

        Supplier supplier = new Supplier();
        supplier.setSupplierCode(request.getSupplierCode());
        supplier.setSupplierName(request.getSupplierName());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setEmail(request.getEmail());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());
        supplier.setGstNumber(request.getGstNumber());
        supplier.setPanNumber(request.getPanNumber());
        supplier.setPaymentTerms(request.getPaymentTerms());
        supplier.setRating(request.getRating());
        supplier.setIsApproved(true);
        supplier.setStatus(Supplier.SupplierStatus.ACTIVE);

        // Get current user
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        supplier.setCreatedBy(currentUser);

        Supplier savedSupplier = supplierRepository.save(supplier);
        return convertToResponse(savedSupplier);
    }

    // Get all suppliers
    public List<SupplierResponse> getAllSuppliers() {
        return supplierRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Get approved suppliers
    public List<SupplierResponse> getApprovedSuppliers() {
        return supplierRepository.findByIsApprovedTrue().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Get supplier by ID
    public SupplierResponse getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));
        return convertToResponse(supplier);
    }

    // Get supplier by code
    public SupplierResponse getSupplierByCode(String supplierCode) {
        Supplier supplier = supplierRepository.findBySupplierCode(supplierCode)
                .orElseThrow(() -> new RuntimeException("Supplier not found with code: " + supplierCode));
        return convertToResponse(supplier);
    }

    // Update supplier
    public SupplierResponse updateSupplier(Long id, SupplierCreateRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));

        // Check if supplier code is being changed and if new code already exists
        if (!supplier.getSupplierCode().equals(request.getSupplierCode())) {
            if (supplierRepository.existsBySupplierCode(request.getSupplierCode())) {
                throw new RuntimeException("Supplier code already exists: " + request.getSupplierCode());
            }
            supplier.setSupplierCode(request.getSupplierCode());
        }

        supplier.setSupplierName(request.getSupplierName());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setEmail(request.getEmail());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());
        supplier.setGstNumber(request.getGstNumber());
        supplier.setPanNumber(request.getPanNumber());
        supplier.setPaymentTerms(request.getPaymentTerms());

        if (request.getRating() != null) {
            supplier.setRating(request.getRating());
        }

        Supplier updatedSupplier = supplierRepository.save(supplier);
        return convertToResponse(updatedSupplier);
    }

    // Update supplier status
    public void updateSupplierStatus(Long id, Supplier.SupplierStatus status) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));
        supplier.setStatus(status);
        supplierRepository.save(supplier);
    }

    // Update supplier approval status
    public void updateSupplierApproval(Long id, Boolean isApproved) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + id));
        supplier.setIsApproved(isApproved);
        supplierRepository.save(supplier);
    }

    // Search suppliers
    public List<SupplierResponse> searchSuppliers(String searchTerm, Supplier.SupplierStatus status) {
        List<Supplier> suppliers;

        if (searchTerm != null && !searchTerm.isEmpty()) {
            suppliers = supplierRepository.findAll().stream()
                    .filter(supplier ->
                            supplier.getSupplierCode().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                    supplier.getSupplierName().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                    (supplier.getContactPerson() != null &&
                                            supplier.getContactPerson().toLowerCase().contains(searchTerm.toLowerCase())) ||
                                    (supplier.getEmail() != null &&
                                            supplier.getEmail().toLowerCase().contains(searchTerm.toLowerCase()))
                    )
                    .collect(Collectors.toList());
        } else {
            suppliers = supplierRepository.findAll();
        }

        // Filter by status if provided
        if (status != null) {
            suppliers = suppliers.stream()
                    .filter(supplier -> supplier.getStatus() == status)
                    .collect(Collectors.toList());
        }

        return suppliers.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Convert entity to response DTO
    private SupplierResponse convertToResponse(Supplier supplier) {
        SupplierResponse response = new SupplierResponse();
        response.setId(supplier.getId());
        response.setSupplierCode(supplier.getSupplierCode());
        response.setSupplierName(supplier.getSupplierName());
        response.setContactPerson(supplier.getContactPerson());
        response.setEmail(supplier.getEmail());
        response.setPhone(supplier.getPhone());
        response.setAddress(supplier.getAddress());
        // Remove these lines since entity doesn't have these fields
        // response.setCity(supplier.getCity());
        // response.setState(supplier.getState());
        // response.setCountry(supplier.getCountry());
        // response.setPinCode(supplier.getPinCode());
        response.setGstNumber(supplier.getGstNumber());
        response.setPanNumber(supplier.getPanNumber());
        response.setPaymentTerms(supplier.getPaymentTerms());
        response.setRating(supplier.getRating());
        response.setStatus(supplier.getStatus());
        response.setIsApproved(supplier.getIsApproved());
        // Remove this line too
        // response.setRemarks(supplier.getRemarks());
        response.setCreatedBy(supplier.getCreatedBy());
        response.setCreatedAt(supplier.getCreatedAt());
        response.setUpdatedAt(supplier.getUpdatedAt());

        return response;
    }
}