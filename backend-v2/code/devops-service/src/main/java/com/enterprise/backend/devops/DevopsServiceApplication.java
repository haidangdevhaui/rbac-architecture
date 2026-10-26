package com.enterprise.backend.devops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.enterprise.backend.devops", "com.enterprise.backend.security"})
public class DevopsServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DevopsServiceApplication.class, args);
    }
}
