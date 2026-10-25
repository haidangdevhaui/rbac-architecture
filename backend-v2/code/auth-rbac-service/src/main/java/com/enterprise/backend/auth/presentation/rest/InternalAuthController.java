package com.enterprise.backend.auth.presentation.rest;

import com.enterprise.backend.auth.application.usecase.IntrospectTokenUseCase;
import com.enterprise.backend.auth.presentation.dto.TokenApiRequest;
import com.enterprise.backend.security.dto.IntrospectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/v1/auth")
@RequiredArgsConstructor
public class InternalAuthController {

    private final IntrospectTokenUseCase introspectTokenUseCase;

    @PostMapping("/introspect")
    public ResponseEntity<IntrospectResponse> introspect(@RequestBody TokenApiRequest request) {
        IntrospectResponse response = introspectTokenUseCase.execute(request.getToken());
        if (!response.isActive()) {
            return ResponseEntity.status(401).body(response);
        }
        return ResponseEntity.ok(response);
    }
}
