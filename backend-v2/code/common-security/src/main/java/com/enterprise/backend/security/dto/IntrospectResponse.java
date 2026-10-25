package com.enterprise.backend.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * DTO returned by auth-rbac-service to gateway-service upon token introspection.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntrospectResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Whether the token is valid, active, and the internal user is not blocked.
     */
    private boolean active;

    /**
     * Internal User ID (PK from internal_users).
     */
    private Long internalUserId;

    /**
     * Employee / User Code (e.g. USR-0001).
     */
    private String userCode;

    /**
     * Canonical internal username.
     */
    private String username;

    /**
     * Internal user email.
     */
    private String email;

    /**
     * Full name of user.
     */
    private String fullName;

    /**
     * IdP Provider type (e.g. KEYCLOAK, AZURE_AD).
     */
    private String provider;

    /**
     * External subject ID from IdP.
     */
    private String externalUserId;

    /**
     * List of assigned roles (e.g. ["ROLE_ADMIN", "ROLE_INVENTORY_MANAGER"]).
     */
    private List<String> roles;

    /**
     * List of assigned permissions (e.g. ["inventory:stock:adjust", "order:approve"]).
     */
    private List<String> permissions;

    /**
     * Epoch timestamp in seconds when the token expires.
     */
    private Long expiresAt;

    /**
     * Error message if token is inactive or validation failed.
     */
    private String errorMessage;
}
