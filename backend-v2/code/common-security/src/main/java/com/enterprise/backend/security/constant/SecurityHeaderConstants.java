package com.enterprise.backend.security.constant;

/**
 * Constants for internal HTTP headers exchanged between Gateway and Downstream Business Services.
 */
public final class SecurityHeaderConstants {

    private SecurityHeaderConstants() {
        // Utility class
    }

    /**
     * Unique internal user ID (Primary Key from internal_users table).
     */
    public static final String HEADER_INTERNAL_USER_ID = "X-Internal-User-Id";

    /**
     * Internal user employee code (e.g. USR-0001).
     */
    public static final String HEADER_USER_CODE = "X-User-Code";

    /**
     * Canonical internal username.
     */
    public static final String HEADER_USERNAME = "X-User-Name";

    /**
     * Internal user email address.
     */
    public static final String HEADER_USER_EMAIL = "X-User-Email";

    /**
     * Comma-separated roles (e.g. ROLE_ADMIN,ROLE_INVENTORY_ADMIN).
     */
    public static final String HEADER_USER_ROLES = "X-User-Roles";

    /**
     * Comma-separated fine-grained permissions (e.g. inventory:stock:adjust,order:approve).
     */
    public static final String HEADER_USER_PERMISSIONS = "X-User-Permissions";

    /**
     * Identity Provider name (e.g. KEYCLOAK, AZURE_AD).
     */
    public static final String HEADER_IDP_PROVIDER = "X-Idp-Provider";

    /**
     * External Subject ID from IdP (sub claim).
     */
    public static final String HEADER_EXTERNAL_USER_ID = "X-External-User-Id";

    /**
     * Distributed Tracing Correlation ID.
     */
    public static final String HEADER_CORRELATION_ID = "X-Correlation-Id";

    /**
     * Prefix for headers that must be stripped from incoming public requests at Gateway.
     */
    public static final String INTERNAL_HEADER_PREFIX = "X-Internal-";
    public static final String USER_HEADER_PREFIX = "X-User-";
}
