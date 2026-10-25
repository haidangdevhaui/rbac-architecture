-- ====================================================================
-- SCHEMA DDL: auth_rbac_db
-- Decoupled IdP User Mapping & Role-Based Access Control (RBAC)
-- ====================================================================

-- 1. Bảng người dùng nội bộ (Internal Users)
CREATE TABLE IF NOT EXISTS internal_users (
    id BIGSERIAL PRIMARY KEY,
    user_code VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_internal_users_status ON internal_users(status) WHERE is_deleted = FALSE;

-- 2. Bảng định danh người dùng từ IdP bên ngoài (External Users)
CREATE TABLE IF NOT EXISTS external_users (
    id BIGSERIAL PRIMARY KEY,
    internal_user_id BIGINT NOT NULL REFERENCES internal_users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,           -- 'KEYCLOAK', 'AZURE_AD', 'OKTA'
    external_user_id VARCHAR(255) NOT NULL,  -- sub claim từ JWT của IdP
    external_username VARCHAR(100),          -- preferred_username
    external_email VARCHAR(255),
    idp_metadata JSONB DEFAULT '{}'::jsonb,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_provider_external_id UNIQUE (provider, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_external_users_lookup ON external_users(provider, external_user_id);
CREATE INDEX IF NOT EXISTS idx_external_users_internal_id ON external_users(internal_user_id);

-- 3. Bảng Vai trò (Roles)
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,        -- e.g. 'ROLE_SUPER_ADMIN', 'ROLE_INVENTORY_ADMIN', 'ROLE_ORDER_ADMIN'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Quyền hạn chi tiết (Permissions)
CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,       -- e.g. 'inventory:stock:adjust', 'order:approve'
    resource VARCHAR(50) NOT NULL,           -- 'inventory', 'order', 'user'
    action VARCHAR(50) NOT NULL,             -- 'read', 'create', 'update', 'delete', 'approve'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng liên kết Vai trò - Quyền hạn (Role-Permission Mapping)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- 6. Bảng gán Vai trò cho Người dùng nội bộ (User-Role Mapping)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES internal_users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT,
    PRIMARY KEY (user_id, role_id)
);
