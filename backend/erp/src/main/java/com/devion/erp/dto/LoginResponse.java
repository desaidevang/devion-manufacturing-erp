package com.devion.erp.dto;




import com.devion.erp.entity.User.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String email;
    private String fullName;
    private Role role;
    private String message;
}
