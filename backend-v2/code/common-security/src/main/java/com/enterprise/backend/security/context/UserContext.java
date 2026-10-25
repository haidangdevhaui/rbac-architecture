package com.enterprise.backend.security.context;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

/**
 * Representation of the authenticated internal user context in downstream business services.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserContext {

    private Long internalUserId;
    private String userCode;
    private String username;
    private String email;
    private String provider;
    private String externalUserId;

    @Builder.Default
    private List<String> roles = Collections.emptyList();

    @Builder.Default
    private List<String> permissions = Collections.emptyList();

    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }

    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }
}
