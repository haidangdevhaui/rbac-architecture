package com.enterprise.backend.auth.infrastructure.idp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdpClaims {
    private String provider;
    private String externalUserId;
    private String username;
    private String email;
    private String fullName;
    private Long expiresAt;
    private String rawClaimsJson;
}
