// Batch.java - Entity
package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_code", unique = true, nullable = false)
    private String batchCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "batch_quantity", nullable = false)
    private Integer batchQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BatchStatus status = BatchStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_employee_id")
    private User assignedEmployee;

    @Column(name = "priority")
    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.MEDIUM;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "expected_completion_time")
    private LocalDateTime expectedCompletionTime;

    @Column(name = "actual_completion_time")
    private LocalDateTime actualCompletionTime;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BatchItem> batchItems = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = BatchStatus.PENDING;
        }
        if (priority == null) {
            priority = Priority.MEDIUM;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum BatchStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        DELAYED,
        CANCELLED,
        ON_HOLD
    }

    public enum Priority {
        LOW,
        MEDIUM,
        HIGH,
        URGENT
    }

    // Helper method to check if batch is delayed
    public boolean isDelayed() {
        if (status == BatchStatus.IN_PROGRESS && startTime != null) {
            return LocalDateTime.now().isAfter(startTime.plusHours(48));
        }
        return false;
    }

    // Calculate total parts required (for display)
    public Integer getTotalPartsRequired() {
        return batchItems.stream()
                .mapToInt(BatchItem::getQuantityRequired)
                .sum();
    }

    // Calculate parts used (for display)
    public Integer getTotalPartsUsed() {
        return batchItems.stream()
                .mapToInt(BatchItem::getQuantityUsed)
                .sum();
    }
}


// Check if item is fully issued