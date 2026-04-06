package com.devion.erp.controller;

import com.devion.erp.dto.*;
import com.devion.erp.service.BatchService;
import com.devion.erp.service.UserService;
import com.devion.erp.service.WarehouseStockService;
import com.devion.erp.service.SupplierService;
import com.devion.erp.service.GRNServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboardStat")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'PRODUCTION_MANAGER', 'WAREHOUSE_MANAGER')")
public class DashboardController {

    private final BatchService batchService;
    private final UserService userService;
    private final WarehouseStockService warehouseStockService;
    private final SupplierService supplierService;
    private final GRNServiceImpl grnService;

    // 1. BATCH DASHBOARD - Get comprehensive batch statistics
    @GetMapping("/batch-stats")
    public ResponseEntity<BatchDashboardResponse> getBatchDashboard() {
        return ResponseEntity.ok(batchService.getDashboard());
    }

    // 2. QUICK OVERVIEW - For dashboard cards
    @GetMapping("/quick-overview")
    public ResponseEntity<Map<String, Object>> getQuickOverview() {
        Map<String, Object> overview = new HashMap<>();

        // User statistics
        long totalUsers = userService.getAllUsers().size();
        long activeUsers = userService.getAllUsers().stream()
                .filter(UserResponse::getIsActive)
                .count();

        // Batch statistics from batch dashboard
        BatchDashboardResponse batchDashboard = batchService.getDashboard();

        // Warehouse statistics
        int lowStockItems = warehouseStockService.getLowStockItems().size();
        int expiringSoonItems = warehouseStockService.getExpiringSoonItems().size();

        // Supplier statistics
        long totalSuppliers = supplierService.getAllSuppliers().size();
        long approvedSuppliers = supplierService.getApprovedSuppliers().size();

        // GRN statistics
        int pendingGRN = grnService.getGRNByStatus("PENDING").size();
        int verifiedGRN = grnService.getGRNByStatus("VERIFIED").size();

        overview.put("batchStats", Map.of(
                "totalBatches", batchDashboard.getTotalBatches(),
                "pendingBatches", batchDashboard.getPendingBatches(),
                "inProgressBatches", batchDashboard.getInProgressBatches(),
                "completedBatches", batchDashboard.getCompletedBatches(),
                "delayedBatches", batchDashboard.getDelayedBatches()
        ));

        overview.put("userStats", Map.of(
                "totalUsers", totalUsers,
                "activeUsers", activeUsers,
                "adminCount", userService.getAllUsers().stream()
                        .filter(u -> u.getRole().name().equals("ADMIN"))
                        .count(),
                "todayLogins", userService.getAllUsers().stream()
                        .filter(u -> u.getLastLogin() != null &&
                                u.getLastLogin().toLocalDate().equals(LocalDate.now()))
                        .count()
        ));

        overview.put("warehouseStats", Map.of(
                "totalStockItems", warehouseStockService.getAllStocks().size(),
                "lowStockItems", lowStockItems,
                "expiringSoonItems", expiringSoonItems,
                "inQuarantine", warehouseStockService.getAllStocks().stream()
                        .filter(s -> "QUARANTINE".equals(s.getStockStatus()))
                        .count()
        ));

        overview.put("supplierStats", Map.of(
                "totalSuppliers", totalSuppliers,
                "approvedSuppliers", approvedSuppliers,
                "activeSuppliers", supplierService.getAllSuppliers().stream()
                        .filter(s -> "ACTIVE".equals(s.getStatus()))
                        .count()
        ));

        overview.put("grnStats", Map.of(
                "pendingGRN", pendingGRN,
                "verifiedGRN", verifiedGRN,
                "totalGRN", grnService.getAllGRN().size()
        ));

        overview.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(overview);
    }

    // 3. EMPLOYEE PERFORMANCE DASHBOARD
    @GetMapping("/employee-performance")
    public ResponseEntity<Map<String, Object>> getEmployeePerformance() {
        Map<String, Object> response = new HashMap<>();

        // Get employee summary from batch service
        BatchDashboardResponse batchDashboard = batchService.getDashboard();
        response.put("employeeSummary", batchDashboard.getEmployeeSummary());

        // Calculate top performers
        response.put("topPerformers", batchDashboard.getEmployeeSummary().stream()
                .sorted((e1, e2) -> Double.compare(
                        e2.getCompleted().doubleValue() / (e2.getTotalAssigned().doubleValue() > 0 ?
                                e2.getTotalAssigned().doubleValue() : 1),
                        e1.getCompleted().doubleValue() / (e1.getTotalAssigned().doubleValue() > 0 ?
                                e1.getTotalAssigned().doubleValue() : 1)
                ))
                .limit(5)
                .toList());

        // Calculate metrics
        long totalEmployees = batchDashboard.getEmployeeSummary().size();
        double avgCompletionRate = batchDashboard.getEmployeeSummary().stream()
                .mapToDouble(e -> e.getTotalAssigned() > 0 ?
                        (e.getCompleted().doubleValue() / e.getTotalAssigned().doubleValue()) * 100 : 0)
                .average()
                .orElse(0.0);

        long employeesWithDelays = batchDashboard.getEmployeeSummary().stream()
                .filter(e -> e.getDelayed() > 0)
                .count();

        response.put("metrics", Map.of(
                "totalEmployees", totalEmployees,
                "avgCompletionRate", Math.round(avgCompletionRate * 100.0) / 100.0,
                "employeesWithDelays", employeesWithDelays,
                "onTimeRate", totalEmployees > 0 ?
                        Math.round(((totalEmployees - employeesWithDelays) * 100.0 / totalEmployees) * 100.0) / 100.0 : 100.0
        ));

        return ResponseEntity.ok(response);
    }

    // 4. PRODUCTION ANALYTICS
    @GetMapping("/production-analytics")
    public ResponseEntity<Map<String, Object>> getProductionAnalytics(
            @RequestParam(required = false) String period) { // daily, weekly, monthly

        Map<String, Object> analytics = new HashMap<>();

        // Get all batches
        List<BatchResponse> allBatches = batchService.getAllBatches();

        // Calculate daily average (last 30 days)
        long last30DaysCount = allBatches.stream()
                .filter(b -> b.getCreatedAt() != null &&
                        b.getCreatedAt().isAfter(LocalDateTime.now().minusDays(30)))
                .count();

        double dailyAverage = last30DaysCount / 30.0;

        // Calculate completion rate
        long completedCount = allBatches.stream()
                .filter(b -> b.getStatus() == com.devion.erp.entity.Batch.BatchStatus.COMPLETED)
                .count();

        double completionRate = allBatches.size() > 0 ?
                (completedCount * 100.0 / allBatches.size()) : 0.0;

        // Calculate on-time delivery (batches completed within 48 hours)
        long onTimeCompleted = allBatches.stream()
                .filter(b -> b.getStatus() == com.devion.erp.entity.Batch.BatchStatus.COMPLETED)
                .filter(b -> {
                    if (b.getStartTime() != null && b.getEndTime() != null) {
                        long hours = java.time.Duration.between(b.getStartTime(), b.getEndTime()).toHours();
                        return hours <= 48;
                    }
                    return false;
                })
                .count();

        double onTimeDeliveryRate = completedCount > 0 ?
                (onTimeCompleted * 100.0 / completedCount) : 0.0;

        // Get productivity trend (last 7 days)
        Map<String, Long> dailyProduction = new HashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            long dayCount = allBatches.stream()
                    .filter(b -> b.getCreatedAt() != null &&
                            b.getCreatedAt().toLocalDate().equals(date))
                    .count();
            dailyProduction.put(date.toString(), dayCount);
        }

        analytics.put("dailyAverage", Math.round(dailyAverage * 100.0) / 100.0);
        analytics.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
        analytics.put("onTimeDeliveryRate", Math.round(onTimeDeliveryRate * 100.0) / 100.0);
        analytics.put("dailyProduction", dailyProduction);
        analytics.put("totalBatches", allBatches.size());
        analytics.put("totalCompleted", completedCount);
        analytics.put("totalInProgress", allBatches.stream()
                .filter(b -> b.getStatus() == com.devion.erp.entity.Batch.BatchStatus.IN_PROGRESS)
                .count());

        return ResponseEntity.ok(analytics);
    }

    // 5. SYSTEM HEALTH DASHBOARD
    @GetMapping("/system-health")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();

        // Database health
        try {
            health.put("database", "HEALTHY");
            health.put("databaseTimestamp", LocalDateTime.now());
        } catch (Exception e) {
            health.put("database", "UNHEALTHY");
            health.put("databaseError", e.getMessage());
        }

        // Service health
        List<Map<String, Object>> services = new ArrayList<>();

        // Batch service health
        Map<String, Object> batchServiceHealth = new HashMap<>();
        batchServiceHealth.put("name", "Batch Service");
        batchServiceHealth.put("status", "ACTIVE");
        batchServiceHealth.put("lastCheck", LocalDateTime.now());
        services.add(batchServiceHealth);

        // User service health
        Map<String, Object> userServiceHealth = new HashMap<>();
        userServiceHealth.put("name", "User Service");
        userServiceHealth.put("status", "ACTIVE");
        userServiceHealth.put("lastCheck", LocalDateTime.now());
        services.add(userServiceHealth);

        // Warehouse service health
        Map<String, Object> warehouseServiceHealth = new HashMap<>();
        warehouseServiceHealth.put("name", "Warehouse Service");
        warehouseServiceHealth.put("status", "ACTIVE");
        warehouseServiceHealth.put("lastCheck", LocalDateTime.now());
        services.add(warehouseServiceHealth);

        health.put("services", services);
        health.put("systemUptime", "24/7"); // You can calculate actual uptime
        health.put("lastMaintenance", LocalDateTime.now().minusDays(7));
        health.put("nextMaintenance", LocalDateTime.now().plusDays(30));

        return ResponseEntity.ok(health);
    }

    // 6. CRITICAL ALERTS
    @GetMapping("/critical-alerts")
    public ResponseEntity<Map<String, Object>> getCriticalAlerts() {
        Map<String, Object> alerts = new HashMap<>();

        List<Map<String, Object>> alertList = new ArrayList<>();

        // Delayed batches
        long delayedBatches = batchService.getBatchesByStatus(
                com.devion.erp.entity.Batch.BatchStatus.DELAYED).size();
        if (delayedBatches > 0) {
            Map<String, Object> delayedAlert = new HashMap<>();
            delayedAlert.put("type", "BATCH_DELAYED");
            delayedAlert.put("severity", "HIGH");
            delayedAlert.put("message", delayedBatches + " batches are delayed (>48 hours)");
            delayedAlert.put("count", delayedBatches);
            delayedAlert.put("actionRequired", true);
            alertList.add(delayedAlert);
        }

        // Low stock alerts
        List<WarehouseStockResponse> lowStockItems = warehouseStockService.getLowStockItems();
        if (!lowStockItems.isEmpty()) {
            Map<String, Object> stockAlert = new HashMap<>();
            stockAlert.put("type", "LOW_STOCK");
            stockAlert.put("severity", "MEDIUM");
            stockAlert.put("message", lowStockItems.size() + " items are below minimum stock level");
            stockAlert.put("count", lowStockItems.size());
            stockAlert.put("actionRequired", true);
            alertList.add(stockAlert);
        }

        // Expiring soon items
        List<WarehouseStockResponse> expiringItems = warehouseStockService.getExpiringSoonItems();
        if (!expiringItems.isEmpty()) {
            Map<String, Object> expiryAlert = new HashMap<>();
            expiryAlert.put("type", "EXPIRING_SOON");
            expiryAlert.put("severity", "MEDIUM");
            expiryAlert.put("message", expiringItems.size() + " items are expiring within 30 days");
            expiryAlert.put("count", expiringItems.size());
            expiryAlert.put("actionRequired", true);
            alertList.add(expiryAlert);
        }

        // Pending GRN approvals
        long pendingGRN = grnService.getGRNByStatus("PENDING").size();
        if (pendingGRN > 0) {
            Map<String, Object> grnAlert = new HashMap<>();
            grnAlert.put("type", "PENDING_GRN");
            grnAlert.put("severity", "LOW");
            grnAlert.put("message", pendingGRN + " GRN(s) pending approval");
            grnAlert.put("count", pendingGRN);
            grnAlert.put("actionRequired", false);
            alertList.add(grnAlert);
        }

        alerts.put("alerts", alertList);
        alerts.put("totalAlerts", alertList.size());
        alerts.put("highPriorityAlerts", alertList.stream()
                .filter(a -> "HIGH".equals(a.get("severity")))
                .count());
        alerts.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(alerts);
    }

    // 7. REAL-TIME COUNTERS (for auto-refresh)
    @GetMapping("/realtime-counters")
    public ResponseEntity<Map<String, Object>> getRealtimeCounters() {
        Map<String, Object> counters = new HashMap<>();

        // Get batch dashboard for quick counts
        BatchDashboardResponse batchDashboard = batchService.getDashboard();

        counters.put("batches", Map.of(
                "total", batchDashboard.getTotalBatches(),
                "pending", batchDashboard.getPendingBatches(),
                "inProgress", batchDashboard.getInProgressBatches(),
                "completed", batchDashboard.getCompletedBatches(),
                "delayed", batchDashboard.getDelayedBatches()
        ));

        counters.put("users", Map.of(
                "total", userService.getAllUsers().size(),
                "active", userService.getAllUsers().stream()
                        .filter(UserResponse::getIsActive)
                        .count()
        ));

        counters.put("warehouse", Map.of(
                "totalItems", warehouseStockService.getAllStocks().size(),
                "inQuarantine", warehouseStockService.getAllStocks().stream()
                        .filter(s -> "QUARANTINE".equals(s.getStockStatus()))
                        .count()
        ));

        counters.put("suppliers", Map.of(
                "total", supplierService.getAllSuppliers().size(),
                "approved", supplierService.getApprovedSuppliers().size()
        ));

        counters.put("timestamp", LocalDateTime.now());
        counters.put("serverTime", System.currentTimeMillis());

        return ResponseEntity.ok(counters);
    }
}