package com.devion.erp.dto;



import com.devion.erp.entity.User.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private Role role;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
}