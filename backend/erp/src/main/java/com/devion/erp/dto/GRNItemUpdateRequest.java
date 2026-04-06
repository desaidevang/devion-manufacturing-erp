// GRNItemUpdateRequest.java (for updating items)
package com.devion.erp.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GRNItemUpdateRequest {
    private Integer acceptedQty;
    private String remarks;
}