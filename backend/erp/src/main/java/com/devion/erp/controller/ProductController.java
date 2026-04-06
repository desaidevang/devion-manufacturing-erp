package com.devion.erp.controller;

import com.devion.erp.dto.*;
import com.devion.erp.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@PreAuthorize("hasAnyRole('ADMIN', 'INSPECTION_OFFICER', 'WAREHOUSE_MANAGER', 'SUPERVISOR', 'PRODUCTION_MANAGER')")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER', 'ENGINEERING')")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/active")
    public ResponseEntity<List<ProductResponse>> getActiveProducts() {
        List<ProductResponse> products = productService.getActiveProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    @GetMapping("/code/{productCode}")
    public ResponseEntity<ProductResponse> getProductByCode(@PathVariable String productCode) {
        ProductResponse product = productService.getProductByCode(productCode);
        return ResponseEntity.ok(product);
    }

    @GetMapping("/{id}/bom")
    public ResponseEntity<List<ProductResponse.BomItemResponse>> getProductBom(@PathVariable Long id) {
        List<ProductResponse.BomItemResponse> bom = productService.getBomForProduct(id);
        return ResponseEntity.ok(bom);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER', 'ENGINEERING')")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/bom")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER', 'ENGINEERING')")
    public ResponseEntity<ProductResponse> manageBom(
            @PathVariable Long id,
            @RequestBody List<ProductCreateRequest.BomItemRequest> bomItems) {
        ProductResponse response = productService.manageBom(id, bomItems);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateProduct(@PathVariable Long id) {
        productService.deactivateProduct(id);
        return ResponseEntity.noContent().build();
    }
}