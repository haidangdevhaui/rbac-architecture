package com.enterprise.backend.auth.presentation.rest;

import com.enterprise.backend.auth.application.usecase.IntrospectTokenUseCase;
import com.enterprise.backend.security.dto.IntrospectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class UserAuthController {

    private final IntrospectTokenUseCase introspectTokenUseCase;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Missing Bearer token");
        }
        String token = authHeader.substring(7).trim();
        IntrospectResponse response = introspectTokenUseCase.execute(token);
        if (!response.isActive()) {
            return ResponseEntity.status(401).body(response);
        }
        return ResponseEntity.ok(response);
    }
}
