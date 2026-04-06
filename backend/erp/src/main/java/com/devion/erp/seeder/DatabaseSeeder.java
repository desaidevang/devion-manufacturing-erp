package com.devion.erp.seeder;

import com.devion.erp.entity.User;
import com.devion.erp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create default admin if no admin exists
        if (userRepository.countActiveAdmins() == 0) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin@123"));
            admin.setEmail("admin@devion-india.com");
            admin.setFullName("System Administrator");
            admin.setRole(User.Role.ADMIN);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setIsActive(true);

            userRepository.save(admin);
            System.out.println("Default admin user created successfully!");
            System.out.println("Username: admin");
            System.out.println("Password: admin@123");
        }
    }
}