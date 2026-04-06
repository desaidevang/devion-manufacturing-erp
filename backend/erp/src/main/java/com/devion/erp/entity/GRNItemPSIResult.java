package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "grn_item_psi_result")
public class GRNItemPSIResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link with GRN Item
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grn_item_id")
    private GRNItem grnItem;

    // Link with PSI master (ProductStandard)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "psi_id")
    private ProductStandard psi;

    private String result;      // PASS / FAIL / VALUE
    private String value;       // For VALUE mode
    private Double minValue;
    private Double maxValue;
    private String unit;
    private String remarks;
}
