package com.devion.erp.service;

import com.devion.erp.dto.CreateUserRequest;
import com.devion.erp.dto.UpdateUserRequest;
import com.devion.erp.dto.UserResponse;
import com.devion.erp.entity.User;
import com.devion.erp.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Check if trying to create ADMIN user (only existing admins can create new admins)
        if (request.getRole() == User.Role.ADMIN) {
            String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new RuntimeException("Current user not found"));

            if (currentUser.getRole() != User.Role.ADMIN) {
                throw new RuntimeException("Only admins can create admin users");
            }
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setCreatedBy(request.getCreatedBy());

        User savedUser = userRepository.save(user);

        return convertToResponse(savedUser);
    }

    // Use @Transactional without readOnly parameter or use @Transactional(propagation = Propagation.SUPPORTS)
    @Transactional
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return convertToResponse(user);
    }

    @Transactional
    public UserResponse updateUserStatus(Long id, Boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Prevent deactivating the last admin
        if (user.getRole() == User.Role.ADMIN && !isActive) {
            long activeAdminCount = userRepository.countActiveAdmins();
            if (activeAdminCount <= 1) {
                throw new RuntimeException("Cannot deactivate the last active admin");
            }
        }

        user.setIsActive(isActive);
        User updatedUser = userRepository.save(user);

        return convertToResponse(updatedUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Prevent deleting the last admin
        if (user.getRole() == User.Role.ADMIN) {
            long activeAdminCount = userRepository.countActiveAdmins();
            if (activeAdminCount <= 1) {
                throw new RuntimeException("Cannot delete the last active admin");
            }
        }

        userRepository.delete(user);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Check if username already exists (excluding current user)
        if (!user.getUsername().equals(request.getUsername()) &&
                userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // Check if email already exists (excluding current user)
        if (!user.getEmail().equals(request.getEmail()) &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Prevent deactivating the last admin
        if (user.getRole() == User.Role.ADMIN && !request.getIsActive()) {
            long activeAdminCount = userRepository.countActiveAdmins();
            if (activeAdminCount <= 1) {
                throw new RuntimeException("Cannot deactivate the last active admin");
            }
        }

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setIsActive(request.getIsActive());

        // Update password only if provided
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);

        return convertToResponse(updatedUser);
    }

    private UserResponse convertToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getIsActive(),
                user.getCreatedAt(),
                user.getLastLogin()
        );
    }
}