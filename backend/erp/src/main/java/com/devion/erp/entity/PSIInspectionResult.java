// PSIInspectionResult.java
package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "psi_inspection_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder  // Add this
public class PSIInspectionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grn_item_id")
    private GRNItem grnItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "psi_id")
    private ProductStandard psiStandard;

    @Enumerated(EnumType.STRING)
    @Column(name = "result")
    private Result result;

    @Column(name = "value")
    private String value;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "inspected_by")
    private String inspectedBy;

    @Column(name = "inspected_at")
    private LocalDateTime inspectedAt;

    @PrePersist
    protected void onCreate() {
        inspectedAt = LocalDateTime.now();
    }

    public enum Result {
        PASS, FAIL, VALUE
    }
}