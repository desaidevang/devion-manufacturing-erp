package com.devion.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling  // Add this annotation
public class devionErpApplication {

	public static void main(String[] args) {
		SpringApplication.run(devionErpApplication.class, args);
	}

}
