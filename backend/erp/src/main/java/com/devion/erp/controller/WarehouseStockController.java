package com.devion.erp.controller;

import com.devion.erp.dto.*;
import com.devion.erp.service.WarehouseStockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/warehouse/stocks")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER', 'INSPECTION_OFFICER')")
public class WarehouseStockController {

    private final WarehouseStockService stockService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<WarehouseStockResponse> createStock(
            @Valid @RequestBody WarehouseStockCreateRequest request) {
        WarehouseStockResponse response = stockService.createStock(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/move")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ResponseEntity<WarehouseStockResponse> moveStock(
            @Valid @RequestBody StockMovementRequest request) {
        WarehouseStockResponse response = stockService.moveStock(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<WarehouseStockResponse>> getAllStocks() {
        List<WarehouseStockResponse> stocks = stockService.getAllStocks();
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarehouseStockResponse> getStockById(@PathVariable Long id) {
        WarehouseStockResponse stock = stockService.getStockById(id);
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/part/{partId}")
    public ResponseEntity<List<WarehouseStockResponse>> getStocksByPart(@PathVariable Long partId) {
        List<WarehouseStockResponse> stocks = stockService.getStocksByPart(partId);
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/location/{locationId}")
    public ResponseEntity<List<WarehouseStockResponse>> getStocksByLocation(@PathVariable Long locationId) {
        List<WarehouseStockResponse> stocks = stockService.getStocksByLocation(locationId);
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<WarehouseStockResponse>> getLowStockItems() {
        List<WarehouseStockResponse> stocks = stockService.getLowStockItems();
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/part/{partId}/total")
    public ResponseEntity<Integer> getTotalStockByPart(@PathVariable Long partId) {
        Integer total = stockService.getTotalStockByPart(partId);
        return ResponseEntity.ok(total);
    }

    @GetMapping("/part/{partId}/available")
    public ResponseEntity<Integer> getAvailableStockByPart(@PathVariable Long partId) {
        Integer available = stockService.getAvailableStockByPart(partId);
        return ResponseEntity.ok(available);
    }

    @GetMapping("/location/{locationId}/details")
    public ResponseEntity<List<LocationStockDetailResponse>> getLocationStockDetails(@PathVariable Long locationId) {
        List<LocationStockDetailResponse> details = stockService.getLocationStockDetails(locationId);
        return ResponseEntity.ok(details);
    }

    @GetMapping("/location/code/{locationCode}/details")
    public ResponseEntity<List<LocationStockDetailResponse>> getLocationStockDetailsByCode(@PathVariable String locationCode) {
        List<LocationStockDetailResponse> details = stockService.getLocationStockDetailsByCode(locationCode);
        return ResponseEntity.ok(details);
    }

    @GetMapping("/movement/history")
    public ResponseEntity<List<InventoryMovementResponse>> getMovementHistory(
            @RequestParam(required = false) Long stockId,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        // FIXED: Changed from movementService to stockService
        List<InventoryMovementResponse> movements = stockService.getMovementHistory(stockId, locationId, fromDate, toDate);
        return ResponseEntity.ok(movements);
    }
}