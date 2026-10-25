import Keycloak from "keycloak-js";

// Helper to safely access env or fallback in browser runtime
const getKeycloakUrl = (): string => {
  if (typeof window !== "undefined" && (window as any).__KEYCLOAK_URL__) {
    return (window as any).__KEYCLOAK_URL__;
  }
  if (typeof process !== "undefined" && process?.env?.KEYCLOAK_URL) {
    return process.env.KEYCLOAK_URL;
  }
  return "http://localhost:8180";
};

// Keycloak client configuration matching backend-v2/docker/keycloak/enterprise-realm.json
export const keycloakConfig = {
  url: getKeycloakUrl(),
  realm: "enterprise",
  clientId: "admin-portal",
};

export const keycloak = new Keycloak(keycloakConfig);

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Initializes Keycloak with PKCE S256 and silent / check-sso check.
 */
export function initKeycloak(): Promise<boolean> {
  if (isInitialized) {
    return Promise.resolve(keycloak.authenticated ?? false);
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = keycloak
    .init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    })
    .then((authenticated) => {
      isInitialized = true;
      console.log(`[Keycloak] Initialized. Authenticated: ${authenticated}`);
      return authenticated;
    })
    .catch((error) => {
      console.warn("[Keycloak] Init warning or server unreachable:", error);
      isInitialized = true;
      return false;
    });

  return initPromise;
}

export const login = () => {
  return keycloak.login({
    redirectUri: window.location.origin,
  });
};

export const logout = () => {
  return keycloak.logout({
    redirectUri: window.location.origin,
  });
};

export const getToken = async (): Promise<string | undefined> => {
  if (!keycloak.authenticated) {
    return undefined;
  }
  // Auto refresh token if expiring within 30 seconds
  try {
    await keycloak.updateToken(30);
  } catch (err) {
    console.warn("[Keycloak] Token refresh failed:", err);
  }
  return keycloak.token;
};
