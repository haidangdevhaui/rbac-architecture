import React, { Suspense, useState, useEffect } from "react";
import { ShellLayout, Card, Button, Badge } from "@enterprise/shared-ui";
import {
  Sparkles,
  Layers,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Key,
  Package,
  ShoppingCart,
  LogIn,
  LogOut,
  ExternalLink,
  UserCheck,
  Server,
} from "lucide-react";
import { useAuth } from "./auth/AuthContext";

// 1. Dynamic imports of federated remotes over the network
const RemoteApprovalApp = React.lazy(() => import("approvalApp/ApprovalApp"));
const RemoteApprovalWidget = React.lazy(() => import("approvalApp/ApprovalWidget"));
const RemoteIntegrationApp = React.lazy(() => import("integrationApp/IntegrationApp"));
const RemoteLegacySyncWidget = React.lazy(() => import("integrationApp/LegacySyncWidget"));
const RemotePlatformApp = React.lazy(() => import("platformApp/PlatformApp"));
const RemotePlatformWidget = React.lazy(() => import("platformApp/PlatformWidget"));

// 2. Resilient Error Boundary for Micro-Frontends
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle: string;
  port: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RemoteErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn("Micro-Frontend Remote Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-8 text-center border-amber-200 bg-amber-50/50 max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">{this.props.fallbackTitle}</h3>
          <p className="text-xs text-slate-500">
            Failed to load remote module from{" "}
            <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono">
              http://localhost:{this.props.port}
            </code>
            . Please verify that this remote service is running.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false })}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}

export function App() {
  const [activePath, setActivePath] = useState<string>(() => {
    if (typeof window !== "undefined" && window.location.pathname) {
      const p = window.location.pathname;
      if (["/services", "/platform", "/backend-v2", "/approvals", "/integrations", "/system"].includes(p)) {
        return p;
      }
    }
    return "/";
  });

  const handleNavigate = (path: string) => {
    setActivePath(path);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", path);
    }
  };

  useEffect(() => {
    const onPopState = () => {
      setActivePath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const {
    isAuthenticated,
    isLoading,
    user,
    backendProfile,
    backendError,
    token,
    login,
    logout,
    callGatewayApi,
    refreshBackendProfile,
  } = useAuth();

  // Test state for Backend V2 Live APIs
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState<string | null>(null);
  const [apiFeedback, setApiFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const getCurrentTeamTitle = () => {
    switch (activePath) {
      case "/services":
      case "/platform":
        return "Service Catalog & Cloud Platform (Port 3003)";
      case "/approvals":
        return "Team 1: Approval & Workflow Remote (Port 3001)";
      case "/integrations":
        return "Team 2: Integration & Legacy Bridge Remote (Port 3002)";
      case "/backend-v2":
        return "Domain Services: Inventory & Orders Admin";
      case "/system":
        return "Team 3: System Settings & Security";
      default:
        return "Enterprise Portal Host Shell (Port 3000)";
    }
  };

  // Helper: Test Inventory API through Gateway
  const handleFetchInventory = async () => {
    setApiLoading("inventory");
    setApiFeedback(null);
    try {
      const data = await callGatewayApi("/api/v1/inventory/stocks");
      setInventoryList(data);
      setApiFeedback({
        type: "success",
        message: `Successfully loaded ${data.length} stock items from inventory-service via Gateway (8080)!`,
      });
    } catch (err: any) {
      setApiFeedback({
        type: "error",
        message: `Error calling inventory-service: ${err.message}`,
      });
    } finally {
      setApiLoading(null);
    }
  };

  // Helper: Test Orders API through Gateway
  const handleFetchOrders = async () => {
    setApiLoading("orders");
    setApiFeedback(null);
    try {
      const data = await callGatewayApi("/api/v1/orders");
      setOrdersList(data);
      setApiFeedback({
        type: "success",
        message: `Successfully loaded ${data.length} orders from order-service via Gateway (8080)!`,
      });
    } catch (err: any) {
      setApiFeedback({
        type: "error",
        message: `Error calling order-service: ${err.message}`,
      });
    } finally {
      setApiLoading(null);
    }
  };

  // Helper: Approve Order
  const handleApproveOrder = async (orderId: number) => {
    setApiLoading(`approve-${orderId}`);
    try {
      await callGatewayApi(`/api/v1/orders/${orderId}/approve`, {
        method: "POST",
        body: JSON.stringify({ comment: `Approved by ${user?.name || "Admin"} from Host Portal` }),
      });
      setApiFeedback({
        type: "success",
        message: `Successfully approved order #${orderId}!`,
      });
      // Refresh list
      handleFetchOrders();
    } catch (err: any) {
      setApiFeedback({
        type: "error",
        message: `Could not approve order: ${err.message}`,
      });
    } finally {
      setApiLoading(null);
    }
  };

  // Auto-fetch demo data when opening backend-v2 tab
  useEffect(() => {
    if (activePath === "/backend-v2" && isAuthenticated) {
      handleFetchInventory();
      handleFetchOrders();
    }
  }, [activePath, isAuthenticated]);

  return (
    <ShellLayout
      activePath={activePath}
      currentTeam={getCurrentTeamTitle()}
      onNavigate={handleNavigate}
      user={user}
      isAuthenticated={isAuthenticated}
      onLogin={login}
      onLogout={logout}
    >
      {/* 1. Dashboard Overview */}
      {activePath === "/" && (
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-slate-900 text-white p-7 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <Cpu className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
                Next-Gen Enterprise Architecture
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Enterprise Micro-Frontends with Module Federation 2.0 & Keycloak SSO
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Teams build and deploy completely independently without rebuilding the Host application.
              Integrated OIDC authentication with Keycloak, automated Just-In-Time (JIT) provisioning, and two-layer RBAC authorization at Spring Cloud Gateway.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                onClick={() => handleNavigate("/services")}
              >
                <Server className="w-3.5 h-3.5 mr-1.5" /> Service Catalog & Platform
              </Button>
              {isAuthenticated ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleNavigate("/backend-v2")}
                >
                  <Package className="w-3.5 h-3.5 mr-1.5" /> Domain: Inventory & Orders
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={login}
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In with Keycloak
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent text-white border-slate-700 hover:bg-slate-800"
                onClick={() => handleNavigate("/approvals")}
              >
                Approval Workflows <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent text-white border-slate-700 hover:bg-slate-800"
                onClick={() => handleNavigate("/integrations")}
              >
                Integration Bridge <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Keycloak SSO & Authentication Status Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                Keycloak Authentication & Backend V2 RBAC Status
              </h3>
              {isAuthenticated ? (
                <Badge variant="success">SSO Authenticated</Badge>
              ) : (
                <Badge variant="warning">Unauthenticated</Badge>
              )}
            </div>

            {isAuthenticated ? (
              <Card className="p-6 border-l-4 border-l-emerald-500 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{user?.name}</h4>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={refreshBackendProfile}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sync RBAC Profile
                    </Button>
                    <Button variant="danger" size="sm" onClick={logout}>
                      <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out
                    </Button>
                  </div>
                </div>

                {/* Identity & RBAC Mapping Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Keycloak Identity (IdP)</span>
                    <p className="font-mono text-slate-700 truncate" title={user?.sub}>
                      sub: {user?.sub}
                    </p>
                    <p className="text-slate-500">Provider: <span className="font-semibold text-blue-600">KEYCLOAK</span></p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Internal Identity (Backend V2)</span>
                    <p className="font-bold text-slate-800">
                      Code: {backendProfile?.userCode || "Loading..."} (ID: #{backendProfile?.internalUserId || "-"})
                    </p>
                    <p className="text-slate-500">
                      Status: <span className="text-emerald-600 font-semibold">{backendProfile?.active ? "ACTIVE" : "PENDING"}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">RBAC Roles</span>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {backendProfile?.roles?.map((r) => (
                        <span key={r} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold">
                          {r}
                        </span>
                      )) || <span className="text-slate-400">No roles assigned</span>}
                    </div>
                  </div>
                </div>

                {/* Permissions pills */}
                {backendProfile?.permissions && backendProfile.permissions.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Effective Permissions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {backendProfile.permissions.map((p) => (
                        <code key={p} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px]">
                          {p}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6 border-l-4 border-l-blue-600 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">Single Sign-On (SSO) with Keycloak</h4>
                    <p className="text-xs text-slate-500">
                      Realm: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">enterprise</code> • Client: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">admin-portal</code>
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={login}>
                    <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In with Keycloak
                  </Button>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 space-y-1">
                  <p className="font-semibold">Pre-configured Demo Accounts in Keycloak:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-700">
                    <li>
                      <strong>Super Admin:</strong> username: <code className="font-mono font-bold">admin</code> / password: <code className="font-mono">admin123</code> (Full platform & domain administration)
                    </li>
                    <li>
                      <strong>Warehouse Manager:</strong> username: <code className="font-mono font-bold">warehouse_mgr</code> / password: <code className="font-mono">pass123</code> (Warehouse management)
                    </li>
                  </ul>
                </div>
              </Card>
            )}
          </div>

          {/* Platform & DevOps Hub Widget */}
          <div className="space-y-3">
            <RemoteErrorBoundary fallbackTitle="Platform Widget Not Started" port={3003}>
              <Suspense fallback={<div className="text-xs text-slate-400">Loading platform widget...</div>}>
                <RemotePlatformWidget
                  token={token}
                  onNavigateToCatalog={() => handleNavigate("/services")}
                />
              </Suspense>
            </RemoteErrorBoundary>
          </div>

          {/* Cross-Team Widgets Demonstration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Cross-Remote Widget Embedding Demonstration
              </h3>
              <Badge variant="success">Runtime Composition</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Widget Team 1 */}
              <Card className="p-5 space-y-3 border-l-4 border-l-blue-600">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Widget from Team 1 (Approval)</span>
                  <span className="text-[10px] font-mono text-slate-400">Port 3001</span>
                </div>
                <p className="text-xs text-slate-500">
                  This component is loaded over the network from Team 1 and embedded dynamically:
                </p>
                <RemoteErrorBoundary fallbackTitle="Team 1 Widget Not Available" port={3001}>
                  <Suspense fallback={<div className="text-xs text-slate-400">Loading widget...</div>}>
                    <RemoteApprovalWidget pendingCount={2} />
                  </Suspense>
                </RemoteErrorBoundary>
              </Card>

              {/* Widget Team 2 */}
              <Card className="p-5 space-y-3 border-l-4 border-l-purple-600">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Widget from Team 2 (Integration)</span>
                  <span className="text-[10px] font-mono text-slate-400">Port 3002</span>
                </div>
                <p className="text-xs text-slate-500">
                  This component is published by Team 2 via Module Federation 2.0:
                </p>
                <RemoteErrorBoundary fallbackTitle="Team 2 Widget Not Available" port={3002}>
                  <Suspense fallback={<div className="text-xs text-slate-400">Loading widget...</div>}>
                    <RemoteLegacySyncWidget
                      documentCode="DOC-MF-001"
                      legacyVoucherId="VOUCHER_LEGACY_98821"
                      status="SUCCESS"
                    />
                  </Suspense>
                </RemoteErrorBoundary>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 2. Backend V2: Live Management Tab */}
      {activePath === "/backend-v2" && (
        <div className="space-y-6 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Domain Microservices: Inventory & Orders Admin
              </h2>
              <p className="text-xs text-slate-500">
                Direct communication with Spring Cloud Gateway (Port 8080) secured by Keycloak JWT Bearer Token.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFetchInventory();
                  handleFetchOrders();
                }}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Data
              </Button>
            </div>
          </div>

          {/* Feedback alert */}
          {apiFeedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                apiFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {apiFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{apiFeedback.message}</span>
            </div>
          )}

          {!isAuthenticated ? (
            <Card className="p-8 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Keycloak Authentication Required</h3>
              <p className="text-xs text-slate-500">
                Gateway requires a valid Bearer JWT and corresponding RBAC permissions to access inventory-service and order-service.
              </p>
              <Button variant="primary" size="sm" onClick={login}>
                <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In with Keycloak
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inventory Service Section */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900">Inventory Stocks (inventory-service)</h3>
                  </div>
                  <Badge variant="info">Port 8082</Badge>
                </div>

                <div className="space-y-2">
                  {inventoryList.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No inventory items found or loading...</p>
                  ) : (
                    <div className="space-y-2">
                      {inventoryList.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{item.productName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              SKU: {item.sku} • Warehouse: {item.warehouse?.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900">{item.quantity}</span>
                            <p className="text-[10px] text-slate-400">in stock</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Order Service Section */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-purple-600" />
                    <h3 className="font-bold text-sm text-slate-900">Orders Management (order-service)</h3>
                  </div>
                  <Badge variant="info">Port 8083</Badge>
                </div>

                <div className="space-y-2">
                  {ordersList.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No orders found or loading...</p>
                  ) : (
                    <div className="space-y-2">
                      {ordersList.map((order: any) => (
                        <div
                          key={order.id}
                          className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {order.orderCode}
                            </span>
                            {order.status === "APPROVED" ? (
                              <Badge variant="success">Approved</Badge>
                            ) : order.status === "PENDING_APPROVAL" ? (
                              <Badge variant="warning">Pending Approval</Badge>
                            ) : (
                              <Badge variant="danger">{order.status}</Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-slate-600 text-[11px]">
                            <span>Customer: <strong>{order.customerName}</strong></span>
                            <span>
                              Total: <strong>{Number(order.totalAmount).toLocaleString("en-US")} {order.currency}</strong>
                            </span>
                          </div>

                          {order.status === "PENDING_APPROVAL" && (
                            <div className="pt-1 flex justify-end">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleApproveOrder(order.id)}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve Order
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* 3. Team 1: Approval Remote View */}
      {activePath === "/approvals" && (
        <RemoteErrorBoundary
          fallbackTitle="Team 1 Remote App Not Started"
          port={3001}
        >
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 text-xs gap-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading Team 1 Approval module from port 3001...</span>
              </div>
            }
          >
            <RemoteApprovalApp />
          </Suspense>
        </RemoteErrorBoundary>
      )}

      {/* 4. Team 2: Integration Remote View */}
      {activePath === "/integrations" && (
        <RemoteErrorBoundary
          fallbackTitle="Team 2 Remote App Not Started"
          port={3002}
        >
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 text-xs gap-3">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading Team 2 Integration module from port 3002...</span>
              </div>
            }
          >
            <RemoteIntegrationApp />
          </Suspense>
        </RemoteErrorBoundary>
      )}

      {/* Platform & DevOps: Service Catalog, Git, CI/CD, K8s (Port 3003) */}
      {(activePath === "/platform" || activePath === "/services" || activePath === "/git" || activePath === "/k8s") && (
        <RemoteErrorBoundary
          fallbackTitle="Platform & DevOps Remote Not Started"
          port={3003}
        >
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 text-xs gap-3">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading Platform & DevOps module from port 3003...</span>
              </div>
            }
          >
            <RemotePlatformApp
              token={token}
              userPermissions={backendProfile?.permissions || []}
              gatewayUrl="http://localhost:8080"
              initialTab="catalog"
              onNavigate={handleNavigate}
            />
          </Suspense>
        </RemoteErrorBoundary>
      )}

      {/* 5. Team 3: System View */}
      {activePath === "/system" && (
        <Card className="p-8 text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Team 3: System Settings & Security</h3>
          <p className="text-xs text-slate-500">
            Role-Based Access Control (RBAC), user directory, and shared master data management.
          </p>
        </Card>
      )}
    </ShellLayout>
  );
}

export default App;
