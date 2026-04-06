package com.devion.erp.controller;


import com.devion.erp.dto.LoginRequest;
import com.devion.erp.dto.LoginResponse;
import com.devion.erp.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/validate-token")
    public ResponseEntity<Boolean> validateToken(@RequestHeader("Authorization") String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            boolean isValid = authService.validateToken(token);
            return ResponseEntity.ok(isValid);
        }
        return ResponseEntity.ok(false);
    }
}
