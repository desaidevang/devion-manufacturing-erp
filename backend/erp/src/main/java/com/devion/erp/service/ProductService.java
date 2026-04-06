package com.devion.erp.service;

import com.devion.erp.dto.*;
import com.devion.erp.entity.Part;
import com.devion.erp.entity.Product;
import com.devion.erp.entity.ProductBomItem;
import com.devion.erp.repository.PartRepository;
import com.devion.erp.repository.ProductBomItemRepository;
import com.devion.erp.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PartRepository partRepository;

    @Autowired
    private ProductBomItemRepository bomItemRepository;

    public ProductResponse createProduct(ProductCreateRequest request) {
        // Check if product code already exists
        if (productRepository.existsByProductCode(request.getProductCode())) {
            throw new RuntimeException("Product code already exists");
        }

        Product product = new Product();
        product.setProductCode(request.getProductCode());
        product.setProductName(request.getProductName());
        product.setDescription(request.getDescription());
        product.setUom(request.getUom() != null ? request.getUom() : "PCS");

        // Get current user
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        product.setCreatedBy(currentUser);

        // Save product first
        Product savedProduct = productRepository.save(product);
        if (request.getBomItems() != null && !request.getBomItems().isEmpty()) {
            addBomItems(savedProduct, request.getBomItems());

            // ⭐ Fix: must re-save product so hasBom = true is persisted
            savedProduct = productRepository.save(savedProduct);
        }
        Product refreshed = productRepository.findByIdWithBom(savedProduct.getId())
                .orElseThrow(() -> new RuntimeException("Product fetch failed"));

        return convertToResponse(savedProduct);
    }

    private void addBomItems(Product product, List<ProductCreateRequest.BomItemRequest> bomItemRequests) {
        for (ProductCreateRequest.BomItemRequest bomRequest : bomItemRequests) {

            Part part = partRepository.findById(bomRequest.getPartId())
                    .orElseThrow(() -> new RuntimeException("Part not found with id: " + bomRequest.getPartId()));

            ProductBomItem bomItem = new ProductBomItem();
            bomItem.setProduct(product);
            bomItem.setPart(part);
            bomItem.setQuantityRequired(bomRequest.getQuantityRequired());
            bomItem.setSequenceNumber(bomRequest.getSequenceNumber() != null ? bomRequest.getSequenceNumber() : 0);
            bomItem.setIsOptional(bomRequest.getIsOptional());
            bomItem.setNotes(bomRequest.getNotes());

            // Save + attach to parent
            bomItem = bomItemRepository.save(bomItem);
            product.getBomItems().add(bomItem);   // ⭐ THIS was missing
        }

        product.setHasBom(true);
    }


    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<ProductResponse> getActiveProducts() {
        return productRepository.findByIsActiveTrue().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findByIdWithBom(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return convertToResponse(product);
    }

    public ProductResponse getProductByCode(String productCode) {
        Product product = productRepository.findByProductCodeWithBom(productCode)
                .orElseThrow(() -> new RuntimeException("Product not found with code: " + productCode));
        return convertToResponse(product);
    }

    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findByIdWithBom(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        if (request.getProductName() != null) {
            product.setProductName(request.getProductName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getUom() != null) {
            product.setUom(request.getUom());
        }
        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        }

        // Update BOM if provided
        if (request.getBomItems() != null) {
            updateBomItems(product, request.getBomItems());
        }

        Product updatedProduct = productRepository.save(product);
        return convertToResponse(updatedProduct);
    }

    private void updateBomItems(Product product, List<ProductUpdateRequest.BomItemUpdateRequest> bomUpdates) {
        // Handle updates, deletions, and new additions
        for (ProductUpdateRequest.BomItemUpdateRequest update : bomUpdates) {
            if (update.getId() != null && update.getDelete() != null && update.getDelete()) {
                // Delete existing item
                bomItemRepository.deleteById(update.getId());
                continue;
            }

            if (update.getId() != null) {
                // Update existing item
                ProductBomItem existingItem = bomItemRepository.findById(update.getId())
                        .orElseThrow(() -> new RuntimeException("BOM item not found with id: " + update.getId()));

                if (update.getQuantityRequired() != null) {
                    existingItem.setQuantityRequired(update.getQuantityRequired());
                }
                if (update.getSequenceNumber() != null) {
                    existingItem.setSequenceNumber(update.getSequenceNumber());
                }
                if (update.getIsOptional() != null) {
                    existingItem.setIsOptional(update.getIsOptional());
                }
                if (update.getNotes() != null) {
                    existingItem.setNotes(update.getNotes());
                }

                bomItemRepository.save(existingItem);
            } else {
                // Add new item
                if (update.getPartId() != null) {
                    Part part = partRepository.findById(update.getPartId())
                            .orElseThrow(() -> new RuntimeException("Part not found with id: " + update.getPartId()));

                    // Check if already exists
                    Optional<ProductBomItem> existing = bomItemRepository.findByProductIdAndPartId(
                            product.getId(), update.getPartId());

                    if (existing.isPresent()) {
                        throw new RuntimeException("Part already exists in BOM");
                    }

                    ProductBomItem newItem = new ProductBomItem();
                    newItem.setProduct(product);
                    newItem.setPart(part);
                    newItem.setQuantityRequired(update.getQuantityRequired() != null ?
                            update.getQuantityRequired() : 1);
                    newItem.setSequenceNumber(update.getSequenceNumber() != null ?
                            update.getSequenceNumber() : 0);
                    newItem.setIsOptional(update.getIsOptional() != null ?
                            update.getIsOptional() : false);
                    newItem.setNotes(update.getNotes());

                    bomItemRepository.save(newItem);
                }
            }
        }
    }

    public ProductResponse manageBom(Long productId, List<ProductCreateRequest.BomItemRequest> bomItems) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        // Clear existing BOM
        bomItemRepository.deleteByProductId(productId);

        // Add new BOM items (if any)
        if (bomItems != null && !bomItems.isEmpty()) {
            addBomItems(product, bomItems);
        } else {
            product.setHasBom(false);
        }

        Product updatedProduct = productRepository.save(product);
        return convertToResponse(updatedProduct);
    }

    public void deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setIsActive(false);
        productRepository.save(product);
    }

    private ProductResponse convertToResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setProductCode(product.getProductCode());
        response.setProductName(product.getProductName());
        response.setDescription(product.getDescription());
        response.setUom(product.getUom());
        response.setIsActive(product.getIsActive());
        response.setHasBom(product.getHasBom());
        response.setCreatedBy(product.getCreatedBy());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());

        // Convert BOM items if present
        if (product.getBomItems() != null && !product.getBomItems().isEmpty()) {
            List<ProductResponse.BomItemResponse> bomResponses = new ArrayList<>();

            for (ProductBomItem bomItem : product.getBomItems()) {
                ProductResponse.BomItemResponse bomResponse = new ProductResponse.BomItemResponse();
                bomResponse.setId(bomItem.getId());
                bomResponse.setPartId(bomItem.getPart().getId());
                bomResponse.setPartNumber(bomItem.getPart().getPartNumber());
                bomResponse.setPartName(bomItem.getPart().getPartName());
                bomResponse.setPartUom(bomItem.getPart().getUom());
                bomResponse.setQuantityRequired(bomItem.getQuantityRequired());
                bomResponse.setSequenceNumber(bomItem.getSequenceNumber());
                bomResponse.setIsOptional(bomItem.getIsOptional());
                bomResponse.setNotes(bomItem.getNotes());
                bomResponse.setCreatedAt(bomItem.getCreatedAt());

                bomResponses.add(bomResponse);
            }

            // Sort by sequence number
            bomResponses.sort((a, b) -> {
                if (a.getSequenceNumber() == null) return 1;
                if (b.getSequenceNumber() == null) return -1;
                return a.getSequenceNumber().compareTo(b.getSequenceNumber());
            });

            response.setBomItems(bomResponses);
        }

        return response;
    }

    public List<ProductResponse.BomItemResponse> getBomForProduct(Long productId) {
        List<ProductBomItem> bomItems = bomItemRepository.findByProductIdWithParts(productId);

        return bomItems.stream().map(bomItem -> {
            ProductResponse.BomItemResponse response = new ProductResponse.BomItemResponse();
            response.setId(bomItem.getId());
            response.setPartId(bomItem.getPart().getId());
            response.setPartNumber(bomItem.getPart().getPartNumber());
            response.setPartName(bomItem.getPart().getPartName());
            response.setPartUom(bomItem.getPart().getUom());
            response.setQuantityRequired(bomItem.getQuantityRequired());
            response.setSequenceNumber(bomItem.getSequenceNumber());
            response.setIsOptional(bomItem.getIsOptional());
            response.setNotes(bomItem.getNotes());
            response.setCreatedAt(bomItem.getCreatedAt());
            return response;
        }).collect(Collectors.toList());
    }
}