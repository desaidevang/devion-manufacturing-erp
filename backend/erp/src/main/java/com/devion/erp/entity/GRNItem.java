package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Table(name = "grn_items")
public class GRNItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grn_id")
    private GRN grn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id")
    private Part part;

    private Integer receivedQty;
    private Integer acceptedQty;
    private Integer rejectedQty;

    private BigDecimal unitPrice;
    private String batchNumber;

    private LocalDate manufacturingDate;
    private LocalDate expiryDate;

    private String remarks;
}
