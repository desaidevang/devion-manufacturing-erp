// GRN.java
package com.devion.erp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Table(name = "grn")
public class GRN {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String grnNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    private String poNumber;
    private String invoiceNumber;
    private String challanNumber;
    private String vehicleNumber;
    private String shift;
    private String remarks;

    private LocalDateTime invoiceDate;
    private LocalDateTime receivedDate;
    private String receivedBy;

    @Enumerated(EnumType.STRING)
    private Status status;

    @OneToMany(mappedBy = "grn", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GRNItem> items;

    public enum Status {
        PENDING, VERIFIED, REJECTED, COMPLETED
    }
}
