import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { keycloak, initKeycloak, login as kcLogin, logout as kcLogout, getToken } from "./keycloak";

export interface BackendUserProfile {
  active: boolean;
  internalUserId: number;
  userCode: string;
  username: string;
  email: string;
  fullName: string;
  provider: string;
  externalUserId: string;
  roles: string[];
  permissions: string[];
  expiresAt?: number;
  errorMessage?: string;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: {
    name?: string;
    email?: string;
    role?: string;
    sub?: string;
  } | null;
  backendProfile: BackendUserProfile | null;
  backendError: string | null;
  login: () => void;
  logout: () => void;
  refreshBackendProfile: () => Promise<void>;
  callGatewayApi: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const GATEWAY_BASE_URL = "http://localhost:8080";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [backendProfile, setBackendProfile] = useState<BackendUserProfile | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Sync with Gateway backend-v2 (JIT Provisioning & RBAC)
  const syncWithBackend = useCallback(async (jwtToken: string) => {
    try {
      setBackendError(null);
      const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gateway returned ${res.status}: ${errorText}`);
      }

      const data: BackendUserProfile = await res.json();
      setBackendProfile(data);
      console.log("[AuthContext] Synced with Backend V2:", data);
    } catch (err: any) {
      console.warn("[AuthContext] Could not sync with Backend V2 (Gateway might not be running yet):", err.message);
      setBackendError(err.message);
    }
  }, []);

  // Initialize Keycloak
  useEffect(() => {
    initKeycloak()
      .then(async (auth) => {
        setIsAuthenticated(auth);
        if (auth && keycloak.token) {
          setToken(keycloak.token);
          await syncWithBackend(keycloak.token);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [syncWithBackend]);

  const login = () => {
    kcLogin();
  };

  const logout = () => {
    kcLogout();
  };

  const refreshBackendProfile = async () => {
    const currentToken = await getToken();
    if (currentToken) {
      setToken(currentToken);
      await syncWithBackend(currentToken);
    }
  };

  // Helper to make authenticated calls through Gateway
  const callGatewayApi = async <T = any,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const currentToken = await getToken();
    if (!currentToken) {
      throw new Error("User is not authenticated with Keycloak");
    }

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${currentToken}`);
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    const url = endpoint.startsWith("http") ? endpoint : `${GATEWAY_BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(errorBody);
      } catch {
        parsed = { message: errorBody };
      }
      throw new Error(parsed.message || `HTTP ${res.status} from ${endpoint}`);
    }

    return res.json();
  };

  const parsedToken: any = keycloak.tokenParsed;
  const roles = backendProfile?.roles?.length
    ? backendProfile.roles.join(", ")
    : parsedToken?.realm_access?.roles?.filter((r: string) => !r.startsWith("default-"))?.join(", ") || "User";

  const user = isAuthenticated
    ? {
        name: parsedToken?.name || parsedToken?.preferred_username || "Keycloak User",
        email: parsedToken?.email,
        role: roles,
        sub: parsedToken?.sub,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        user,
        backendProfile,
        backendError,
        login,
        logout,
        refreshBackendProfile,
        callGatewayApi,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
