package com.enterprise.backend.auth.infrastructure.idp;

public interface IdpTokenVerifier {
    IdpClaims verifyToken(String token);
}
