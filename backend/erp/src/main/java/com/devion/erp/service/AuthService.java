package com.devion.erp.service;

import com.devion.erp.dto.LoginRequest;
import com.devion.erp.dto.LoginResponse;
import com.devion.erp.entity.User;
import com.devion.erp.repository.UserRepository;
import com.devion.erp.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomUserDetailsService customUserDetailsService; // Fixed: Added this line

    @Transactional
    public LoginResponse login(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Reset failed attempts on successful login
            user.setFailedAttempts(0);
            user.setAccountLocked(false);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            String jwt = jwtUtil.generateToken(user);

            return new LoginResponse(
                    jwt,
                    user.getUsername(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getRole(),
                    "Login successful"
            );

        } catch (Exception e) {
            // Increment failed attempts
            userRepository.findByUsername(loginRequest.getUsername()).ifPresent(user -> {
                int failedAttempts = user.getFailedAttempts() + 1;
                user.setFailedAttempts(failedAttempts);

                if (failedAttempts >= 5) {
                    user.setAccountLocked(true);
                }

                userRepository.save(user);
            });

            throw new RuntimeException("Invalid username or password");
        }
    }

    public boolean validateToken(String token) {
        try {
            String username = jwtUtil.extractUsername(token);
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(username); // Fixed: Changed to customUserDetailsService
            return jwtUtil.validateToken(token, userDetails);
        } catch (Exception e) {
            return false;
        }
    }
}