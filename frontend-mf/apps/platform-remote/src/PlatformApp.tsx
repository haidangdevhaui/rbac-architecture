import React, { useState, useEffect } from "react";
import { Card, Button, Badge } from "@enterprise/shared-ui";
import {
  Server,
  GitBranch,
  Plus,
  PlayCircle,
  Cpu,
  Layers,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  FolderGit2,
  Terminal,
  Activity,
  Box,
  Code2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCode,
  GitCommit,
  GitPullRequest,
  Search,
  Filter,
  X,
  Power,
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  Lock,
  Globe,
  ArrowLeft,
  CornerLeftUp,
  CheckCircle,
  Sliders,
  Database,
  Eye,
  RotateCcw,
  Archive,
  HardDrive,
  Download,
  StopCircle,
  Clock,
  Sparkles,
  History,
  TerminalSquare,
  Network,
} from "lucide-react";

export interface NetworkServiceOption {
  id: string;
  name: string;
  desc: string;
  port: number;
  category: "INGRESS" | "EGRESS" | "INFRA";
  required?: boolean;
}

export const AVAILABLE_NETWORK_SERVICES: NetworkServiceOption[] = [
  { id: "gateway-service", name: "API Gateway", desc: "Route ingress traffic via Spring Cloud Gateway", port: 8080, category: "INGRESS", required: true },
  { id: "auth-rbac-service", name: "Auth & RBAC Service", desc: "JWT token validation & fine-grained permissions", port: 8081, category: "EGRESS" },
  { id: "inventory-service", name: "Inventory Domain", desc: "Warehouse stock management & inventory reservation", port: 8082, category: "EGRESS" },
  { id: "order-service", name: "Order Domain", desc: "Order lifecycle management & checkout processing", port: 8083, category: "EGRESS" },
  { id: "postgres", name: "PostgreSQL 16 DB", desc: "Multi-tenant relational database instance", port: 5432, category: "INFRA" },
  { id: "redis", name: "Redis Distributed Cache", desc: "Distributed caching & rate-limit state store", port: 6379, category: "INFRA" },
  { id: "minio", name: "MinIO S3 Storage", desc: "Build artifact archiving & version rollback repository", port: 9000, category: "INFRA" },
  { id: "external-apis", name: "External Web APIs", desc: "Outbound HTTPS 443 external internet communication", port: 443, category: "EGRESS" },
];

export function generateK8sNetpolYaml(
  serviceCode: string,
  targetPort: number,
  allowedCommunications: string[]
): string {
  let egressRules = `  # Allow DNS resolution
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53\n`;

  for (const srv of allowedCommunications) {
    if (srv === "external-apis") {
      egressRules += `  # Allow Outbound HTTPS
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - 10.0.0.0/8
        - 172.16.0.0/12
        - 192.168.0.0/16
    ports:
    - protocol: TCP
      port: 443\n`;
    } else {
      const matchOpt = AVAILABLE_NETWORK_SERVICES.find((o) => o.id === srv);
      const port = matchOpt ? matchOpt.port : 8080;
      egressRules += `  # Allow communication with ${srv}
  - to:
    - podSelector:
        matchLabels:
          app: ${srv}
    ports:
    - protocol: TCP
      port: ${port}\n`;
    }
  }

  return `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ${serviceCode}-netpol
  namespace: enterprise-dev
spec:
  podSelector:
    matchLabels:
      app: ${serviceCode}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Ingress permitted from API Gateway
  - from:
    - podSelector:
        matchLabels:
          app: gateway-service
    ports:
    - protocol: TCP
      port: ${targetPort}
  egress:
${egressRules}`;
}

export interface PipelineStage {
  name: string;
  status: "SUCCESS" | "RUNNING" | "PENDING" | "FAILED";
  durationSeconds: number;
  logs: string[];
}

export interface PipelineRun {
  id: number;
  serviceCode: string;
  runNumber: number;
  triggerType: string;
  triggeredBy: string;
  branch: string;
  commitId: string;
  commitMessage: string;
  status: "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";
  durationSeconds: number;
  startedAt: string;
  finishedAt: string;
  artifactVersion: string;
  stages: PipelineStage[];
}

export interface ServiceArtifact {
  id: number;
  serviceCode: string;
  version: string;
  fileName: string;
  bucketName: string;
  objectKey: string;
  fileSizeMb: number;
  sha256: string;
  downloadUrl: string;
  createdAt: string;
  currentDeployed: boolean;
  k8sImageTag: string;
}

export interface ServiceSummary {
  id: number;
  serviceCode: string;
  displayName: string;
  serviceType: "BACKEND_SPRING" | "FRONTEND_REMOTE";
  description: string;
  ownerTeam: string;
  targetPort: number;
  status: "ACTIVE" | "STOPPED" | "CREATING" | "FAILED" | "ARCHIVED";
  gitRepoName: string;
  gitCloneHttp: string;
  gitCloneSsh: string;
  gitWebUrl: string;
  allowedCommunications?: string[];
  createdBy: string;
  createdAt: string;
}

export interface GitRepositoryItem {
  name: string;
  fullName: string;
  description: string;
  cloneUrlHttp: string;
  cloneUrlSsh: string;
  htmlUrl: string;
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  sizeKb: number;
  createdAt: string;
  updatedAt: string;
  private: boolean;
}

export interface GitFileItem {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
  content?: string | null;
  encoding?: string | null;
}

export interface K8sPodItem {
  name: string;
  namespace: string;
  status: string;
  podIp: string;
  nodeName: string;
  restartCount: number;
  startTime: string;
  ready: boolean;
}

export interface GitCommitItem {
  id: string;
  shortId: string;
  message: string;
  authorName: string;
  authorEmail: string;
  timestamp: string;
}

export interface GitBranchItem {
  name: string;
  commitId: string;
  isDefault: boolean;
}

export interface ServiceDetail extends ServiceSummary {
  updatedAt: string;
  gitProvider: string;
  defaultBranch: string;
  recentCommits: GitCommitItem[];
  branches: GitBranchItem[];
  environment: string;
  k8sNamespace: string;
  k8sDeploymentName: string;
  replicas: number;
  healthStatus: string;
}

interface PlatformAppProps {
  isStandalone?: boolean;
  token?: string;
  userPermissions?: string[];
  gatewayUrl?: string;
  initialTab?: string;
  onNavigate?: (path: string) => void;
}

const DEFAULT_MOCK_SERVICES: ServiceSummary[] = [
  {
    id: 1,
    serviceCode: "order-service",
    displayName: "Admin Order Management Service",
    serviceType: "BACKEND_SPRING",
    description: "Order lifecycle management, approval, SLA tracking, and audit logging",
    ownerTeam: "Order Domain Team",
    targetPort: 8083,
    status: "ACTIVE",
    gitRepoName: "order-service",
    gitCloneHttp: "http://localhost:3030/enterprise/order-service.git",
    gitCloneSsh: "git@localhost:2222:enterprise/order-service.git",
    gitWebUrl: "http://localhost:3030/enterprise/order-service",
    allowedCommunications: ["gateway-service", "auth-rbac-service", "postgres", "redis", "inventory-service"],
    createdBy: "SYSTEM",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 2,
    serviceCode: "inventory-service",
    displayName: "Admin Warehouse & Inventory Service",
    serviceType: "BACKEND_SPRING",
    description: "SKU-based inventory tracking, multi-warehouse catalog, and stock adjustments",
    ownerTeam: "Warehouse Team",
    targetPort: 8082,
    status: "ACTIVE",
    gitRepoName: "inventory-service",
    gitCloneHttp: "http://localhost:3030/enterprise/inventory-service.git",
    gitCloneSsh: "git@localhost:2222:enterprise/inventory-service.git",
    gitWebUrl: "http://localhost:3030/enterprise/inventory-service",
    allowedCommunications: ["gateway-service", "auth-rbac-service", "postgres", "redis"],
    createdBy: "SYSTEM",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 3,
    serviceCode: "gateway-service",
    displayName: "Enterprise API Gateway",
    serviceType: "BACKEND_SPRING",
    description: "API routing gateway, rate limiting, token introspection, and security header filtering",
    ownerTeam: "Platform Engineering",
    targetPort: 8080,
    status: "ACTIVE",
    gitRepoName: "gateway-service",
    gitCloneHttp: "http://localhost:3030/enterprise/gateway-service.git",
    gitCloneSsh: "git@localhost:2222:enterprise/gateway-service.git",
    gitWebUrl: "http://localhost:3030/enterprise/gateway-service",
    createdBy: "SYSTEM",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export function PlatformApp({
  isStandalone = false,
  token,
  userPermissions = [],
  gatewayUrl = "http://localhost:8080",
  initialTab,
  onNavigate,
}: PlatformAppProps) {
  // Data states
  const [services, setServices] = useState<ServiceSummary[]>(DEFAULT_MOCK_SERVICES);
  const [gitRepos, setGitRepos] = useState<GitRepositoryItem[]>([]);
  const [k8sPods, setK8sPods] = useState<K8sPodItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPowerToggling, setIsPowerToggling] = useState<{ [id: number]: boolean }>({});

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);

  // Modal 1: Create Service Wizard
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [provisionStep, setProvisionStep] = useState<number>(0);
  const [formData, setFormData] = useState({
    serviceCode: "",
    displayName: "",
    serviceType: "BACKEND_SPRING" as "BACKEND_SPRING" | "FRONTEND_REMOTE",
    description: "",
    ownerTeam: "Enterprise Team",
    targetPort: 8085,
    initGitRepo: true,
    generateBoilerplate: true,
    allowedCommunications: ["gateway-service", "auth-rbac-service", "postgres", "redis"] as string[],
  });
  const [isUpdatingNetpol, setIsUpdatingNetpol] = useState<boolean>(false);
  const [showK8sNetpolYaml, setShowK8sNetpolYaml] = useState<boolean>(false);

  // KEY UX: SELECTED SERVICE MANAGEMENT WORKSPACE (DRILL-DOWN)
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [serviceWorkspaceTab, setServiceWorkspaceTab] = useState<"git" | "k8s" | "pipeline" | "config">("git");
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // Git Code Explorer View State
  const [activeGitRepo, setActiveGitRepo] = useState<string | null>(null);
  const [gitTree, setGitTree] = useState<GitFileItem[]>([]);
  const [currentGitPath, setCurrentGitPath] = useState<string>("");
  const [selectedGitFile, setSelectedGitFile] = useState<GitFileItem | null>(null);
  const [isFileLoading, setIsFileLoading] = useState<boolean>(false);
  const [isTreeLoading, setIsTreeLoading] = useState<boolean>(false);

  // Pipeline & MinIO Artifact states
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [selectedPipelineRun, setSelectedPipelineRun] = useState<PipelineRun | null>(null);
  const [artifacts, setArtifacts] = useState<ServiceArtifact[]>([]);
  const [isPipelineLoading, setIsPipelineLoading] = useState<boolean>(false);
  const [isArtifactsLoading, setIsArtifactsLoading] = useState<boolean>(false);
  const [isTriggeringPipeline, setIsTriggeringPipeline] = useState<boolean>(false);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState<boolean>(false);
  const [triggerBranch, setTriggerBranch] = useState<string>("main");
  const [isRollingBackId, setIsRollingBackId] = useState<number | null>(null);
  const [confirmRollbackArtifact, setConfirmRollbackArtifact] = useState<ServiceArtifact | null>(null);
  const [pipelineLogFilter, setPipelineLogFilter] = useState<string>("ALL");

  const showToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`Copied to clipboard: ${text}`, "info");
    setTimeout(() => setCopiedText(null), 2000);
  };

  // 1. Fetch Services
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${gatewayUrl}/api/v1/platform/services`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setServices(data);
        }
      }
    } catch (err) {
      console.warn("Using local fallback services:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch Git Repositories
  const fetchGitRepos = async () => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${gatewayUrl}/api/v1/platform/git/repos`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGitRepos(data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch git repos:", err);
    }
  };

  // 3. Fetch K8s Pods
  const fetchK8sPods = async () => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${gatewayUrl}/api/v1/platform/k8s/pods`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setK8sPods(data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch K8s pods:", err);
    }
  };

  // 4. Fetch Pipelines for Service
  const fetchPipelines = async (serviceId: number) => {
    setIsPipelineLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${gatewayUrl}/api/v1/platform/services/${serviceId}/pipelines`, { headers });
      if (res.ok) {
        const data: PipelineRun[] = await res.json();
        setPipelineRuns(data);
        if (data.length > 0) {
          setSelectedPipelineRun(data[0]);
        }
      }
    } catch (e) {
      console.warn("Could not fetch pipelines:", e);
    } finally {
      setIsPipelineLoading(false);
    }
  };

  // 5. Fetch Artifacts for Service
  const fetchArtifacts = async (serviceId: number) => {
    setIsArtifactsLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${gatewayUrl}/api/v1/platform/services/${serviceId}/artifacts`, { headers });
      if (res.ok) {
        const data: ServiceArtifact[] = await res.json();
        setArtifacts(data);
      }
    } catch (e) {
      console.warn("Could not fetch artifacts:", e);
    } finally {
      setIsArtifactsLoading(false);
    }
  };

  // 6. Trigger Pipeline
  const handleTriggerPipeline = async (branch: string = "main") => {
    if (!selectedService) return;
    setIsTriggeringPipeline(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${gatewayUrl}/api/v1/platform/services/${selectedService.id}/pipelines/trigger`, {
        method: "POST",
        headers,
        body: JSON.stringify({ branch, triggerType: "MANUAL" }),
      });
      if (res.ok) {
        const newRun: PipelineRun = await res.json();
        setPipelineRuns((prev) => [newRun, ...prev]);
        setSelectedPipelineRun(newRun);
        fetchArtifacts(selectedService.id);
        fetchK8sPods();
        showToast(`🚀 Successfully triggered Pipeline #${newRun.runNumber} on branch "${branch}" & deployed to K8s!`, "success");
      }
    } catch (err) {
      console.error("Failed to trigger pipeline:", err);
      showToast("Error occurred while triggering pipeline", "warning");
    } finally {
      setIsTriggeringPipeline(false);
      setIsTriggerModalOpen(false);
    }
  };

  // 7. Cancel Pipeline
  const handleCancelPipeline = async (runId: number) => {
    if (!selectedService) return;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${gatewayUrl}/api/v1/platform/services/${selectedService.id}/pipelines/${runId}/cancel`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        const updated = await res.json();
        setPipelineRuns((prev) => prev.map((r) => (r.id === runId ? updated : r)));
        if (selectedPipelineRun?.id === runId) {
          setSelectedPipelineRun(updated);
        }
        showToast(`Cancelled Pipeline #${runId}`, "info");
      }
    } catch (e) {
      console.error("Failed to cancel pipeline:", e);
    }
  };

  // 8. Rollback to Artifact Version
  const handleRollback = async (artifact: ServiceArtifact) => {
    if (!selectedService) return;
    setIsRollingBackId(artifact.id);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${gatewayUrl}/api/v1/platform/services/${selectedService.id}/artifacts/${artifact.id}/rollback`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        showToast(`↺ Successfully rolled back to ${artifact.version}! Kubernetes is performing rolling update.`, "success");
        await fetchArtifacts(selectedService.id);
        await fetchPipelines(selectedService.id);
        await fetchK8sPods();
      }
    } catch (e) {
      console.error("Failed to rollback artifact:", e);
      showToast("Error executing version rollback", "warning");
    } finally {
      setIsRollingBackId(null);
      setConfirmRollbackArtifact(null);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchGitRepos();
    fetchK8sPods();
  }, [token]);

  // Feature: Start / Stop Service (Toggle Power)
  const handleTogglePower = async (service: ServiceSummary, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const isCurrentlyActive = service.status === "ACTIVE";
    const nextStatus = isCurrentlyActive ? "STOPPED" : "ACTIVE";
    const actionName = isCurrentlyActive ? "Power Off" : "Power On";

    // Optimistic Update
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, status: nextStatus } : s))
    );
    if (selectedService && selectedService.id === service.id) {
      setSelectedService({
        ...selectedService,
        status: nextStatus,
        replicas: isCurrentlyActive ? 0 : 1,
        healthStatus: isCurrentlyActive ? "STOPPED" : "HEALTHY",
      });
    }

    setIsPowerToggling((prev) => ({ ...prev, [service.id]: true }));

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${gatewayUrl}/api/v1/platform/services/${service.id}/toggle-power`, {
        method: "POST",
        headers,
      });

      if (res.ok) {
        const updated = await res.json();
        setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
        if (selectedService && selectedService.id === service.id) {
          setSelectedService(updated);
        }
        showToast(
          isCurrentlyActive
            ? `⚡ Scaled down ${service.serviceCode} to 0 Pods (Stopped)`
            : `🚀 Scaled up ${service.serviceCode} to 1 Pod (Active)`,
          "success"
        );
        fetchK8sPods();
      } else {
        showToast(`Updated power state for ${service.serviceCode}`, "info");
      }
    } catch (err) {
      console.warn("Power toggle simulated:", err);
      showToast(`Changed state of ${service.serviceCode} to ${nextStatus}`, "info");
    } finally {
      setIsPowerToggling((prev) => ({ ...prev, [service.id]: false }));
    }
  };

  // Git Code Explorer: Open Directory Tree (FIX FOR FOLDER BROWSING)
  const openGitRepoExplorer = async (repoName: string, path: string = "") => {
    setActiveGitRepo(repoName);
    setCurrentGitPath(path);
    setIsTreeLoading(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const queryParam = path ? `?path=${encodeURIComponent(path)}` : "";
      const res = await fetch(
        `${gatewayUrl}/api/v1/platform/git/repos/${encodeURIComponent(repoName)}/tree${queryParam}`,
        { headers }
      );

      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items)) {
          // Sort folders first, then files alphabetically
          const sorted = [...items].sort((a, b) => {
            if (a.type === "dir" && b.type !== "dir") return -1;
            if (a.type !== "dir" && b.type === "dir") return 1;
            return a.name.localeCompare(b.name);
          });
          setGitTree(sorted);
        }
      } else {
        // Fallback hierarchy for demo
        setGitTree(getFallbackTreeForPath(path));
      }
    } catch (err) {
      console.warn("Could not fetch git tree, using structured fallback:", err);
      setGitTree(getFallbackTreeForPath(path));
    } finally {
      setIsTreeLoading(false);
    }
  };

  // Helper: Go Up One Directory Level
  const handleGoUpDirectory = () => {
    if (!currentGitPath) return;
    const parts = currentGitPath.split("/").filter(Boolean);
    parts.pop(); // remove current folder
    const parentPath = parts.join("/");
    openGitRepoExplorer(selectedService?.gitRepoName || selectedService?.serviceCode || "", parentPath);
  };

  // Helper: Navigate to specific breadcrumb segment
  const handleNavigateBreadcrumb = (index: number) => {
    const parts = currentGitPath.split("/").filter(Boolean);
    const targetPath = parts.slice(0, index + 1).join("/");
    openGitRepoExplorer(selectedService?.gitRepoName || selectedService?.serviceCode || "", targetPath);
  };

  // Local Fallback Tree Generator for offline reliability
  const getFallbackTreeForPath = (path: string): GitFileItem[] => {
    if (!path) {
      return [
        { name: "k8s", path: "k8s", type: "dir", size: 0 },
        { name: "src", path: "src", type: "dir", size: 0 },
        { name: ".woodpecker.yml", path: ".woodpecker.yml", type: "file", size: 188 },
        { name: "Dockerfile", path: "Dockerfile", type: "file", size: 267 },
        { name: "pom.xml", path: "pom.xml", type: "file", size: 395 },
        { name: "README.md", path: "README.md", type: "file", size: 47 },
      ];
    }
    if (path === "k8s") {
      return [
        { name: "deployment.yaml", path: "k8s/deployment.yaml", type: "file", size: 224 },
        { name: "service.yaml", path: "k8s/service.yaml", type: "file", size: 143 },
      ];
    }
    if (path === "src") {
      return [{ name: "main", path: "src/main", type: "dir", size: 0 }];
    }
    if (path === "src/main") {
      return [
        { name: "java", path: "src/main/java", type: "dir", size: 0 },
        { name: "resources", path: "src/main/resources", type: "dir", size: 0 },
      ];
    }
    if (path === "src/main/resources") {
      return [{ name: "application.yml", path: "src/main/resources/application.yml", type: "file", size: 146 }];
    }
    if (path.startsWith("src/main/java")) {
      return [{ name: "Application.java", path: `${path}/Application.java`, type: "file", size: 320 }];
    }
    return [];
  };

  // Git Code Explorer: Open File Content
  const openGitFileContent = async (repoName: string, filePath: string) => {
    setIsFileLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${gatewayUrl}/api/v1/platform/git/repos/${encodeURIComponent(repoName)}/file?path=${encodeURIComponent(filePath)}`,
        { headers }
      );
      if (res.ok) {
        const fileData = await res.json();
        setSelectedGitFile(fileData);
      } else {
        setSelectedGitFile({
          name: filePath.split("/").pop() || filePath,
          path: filePath,
          type: "file",
          size: 1024,
          content: `# File: ${filePath}\n# Repository: ${repoName}\n# Generated by Enterprise IDP\n\n[Content loaded from Gitea Git Engine]`,
        });
      }
    } catch {
      setSelectedGitFile({
        name: filePath.split("/").pop() || filePath,
        path: filePath,
        type: "file",
        size: 1024,
        content: `// Sample content for ${filePath}`,
      });
    } finally {
      setIsFileLoading(false);
    }
  };

  // Handle Create Service
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceCode || !formData.displayName) return;

    setIsProvisioning(true);
    setProvisionStep(1);

    try {
      await new Promise((r) => setTimeout(r, 450));
      setProvisionStep(2);
      await new Promise((r) => setTimeout(r, 450));
      setProvisionStep(3);
      await new Promise((r) => setTimeout(r, 450));
      setProvisionStep(4);

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${gatewayUrl}/api/v1/platform/services`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      let createdData: ServiceDetail;
      if (response.ok) {
        createdData = await response.json();
      } else {
        createdData = {
          id: Date.now(),
          serviceCode: formData.serviceCode,
          displayName: formData.displayName,
          serviceType: formData.serviceType,
          description: formData.description,
          ownerTeam: formData.ownerTeam,
          targetPort: formData.targetPort,
          status: "ACTIVE",
          gitRepoName: formData.serviceCode,
          gitCloneHttp: `http://localhost:3030/enterprise/${formData.serviceCode}.git`,
          gitCloneSsh: `git@localhost:2222:enterprise/${formData.serviceCode}.git`,
          gitWebUrl: `http://localhost:3030/enterprise/${formData.serviceCode}`,
          createdBy: "ADMIN",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          gitProvider: "GITEA",
          defaultBranch: "main",
          recentCommits: [
            {
              id: "9e8a7b6c5d4e3f2a1b0c",
              shortId: "9e8a7b6",
              message: "feat: initial scaffolding generated by Enterprise Portal",
              authorName: "Platform Bot",
              authorEmail: "bot@enterprise.local",
              timestamp: new Date().toISOString(),
            },
          ],
          branches: [{ name: "main", commitId: "9e8a7b6", isDefault: true }],
          environment: "DEV",
          k8sNamespace: "enterprise-dev",
          k8sDeploymentName: formData.serviceCode,
          replicas: 1,
          healthStatus: "HEALTHY",
          allowedCommunications: formData.allowedCommunications,
        };
      }

      setServices((prev) => [createdData, ...prev]);
      setIsProvisioning(false);
      setIsCreateModalOpen(false);
      showToast(`Successfully created service "${formData.serviceCode}" with Spring Boot 4 and K8s NetworkPolicy!`, "success");
      fetchGitRepos();
      openServiceDetail(createdData);
    } catch (error) {
      console.error("Error creating service:", error);
      setIsProvisioning(false);
    }
  };

  // Update Network Policy for existing service
  const handleUpdateNetworkPolicy = async (serviceId: number, allowedServices: string[]) => {
    setIsUpdatingNetpol(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${gatewayUrl}/api/v1/platform/services/${serviceId}/network-policy`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ allowedCommunications: allowedServices }),
      });
      if (res.ok) {
        const updated: ServiceDetail = await res.json();
        setSelectedService(updated);
        setServices((prev) =>
          prev.map((s) => (s.id === serviceId ? { ...s, allowedCommunications: allowedServices } : s))
        );
        showToast("NetworkPolicy updated and enforced on Kubernetes!", "success");
      }
    } catch (e) {
      console.error("Failed to update NetworkPolicy:", e);
      showToast("Error updating network policy", "warning");
    } finally {
      setIsUpdatingNetpol(false);
    }
  };

  // Open Service Detail Workspace (Drill-Down)
  const openServiceDetail = async (service: ServiceSummary) => {
    setIsDetailLoading(true);
    setSelectedGitFile(null);
    setCurrentGitPath("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${gatewayUrl}/api/v1/platform/services/${service.id}`, { headers });
      if (res.ok) {
        const detail = await res.json();
        setSelectedService(detail);
      } else {
        setSelectedService({
          ...service,
          updatedAt: service.createdAt,
          gitProvider: "GITEA",
          defaultBranch: "main",
          recentCommits: [
            {
              id: "8f9b4c2e6d1a5f7e3c8b9a0f1d2e3c4b5a6f7e8d",
              shortId: "8f9b4c2",
              message: "feat: initial service scaffolding with CI/CD manifests",
              authorName: "Platform Bot",
              authorEmail: "bot@enterprise.local",
              timestamp: new Date().toISOString(),
            },
          ],
          branches: [{ name: "main", commitId: "8f9b4c2", isDefault: true }],
          environment: "DEV",
          k8sNamespace: "enterprise-dev",
          k8sDeploymentName: service.serviceCode,
          replicas: service.status === "ACTIVE" ? 1 : 0,
          healthStatus: service.status === "ACTIVE" ? "HEALTHY" : "STOPPED",
          allowedCommunications: service.allowedCommunications || ["gateway-service", "auth-rbac-service", "postgres", "redis"],
        });
      }
      openGitRepoExplorer(service.gitRepoName || service.serviceCode, "");
      fetchPipelines(service.id);
      fetchArtifacts(service.id);
      setServiceWorkspaceTab("git");
    } catch {
      setSelectedService({
        ...service,
        updatedAt: service.createdAt,
        gitProvider: "GITEA",
        defaultBranch: "main",
        recentCommits: [],
        branches: [{ name: "main", commitId: "HEAD", isDefault: true }],
        environment: "DEV",
        k8sNamespace: "enterprise-dev",
        k8sDeploymentName: service.serviceCode,
        replicas: service.status === "ACTIVE" ? 1 : 0,
        healthStatus: service.status === "ACTIVE" ? "HEALTHY" : "STOPPED",
      });
      openGitRepoExplorer(service.gitRepoName || service.serviceCode, "");
      fetchPipelines(service.id);
      fetchArtifacts(service.id);
      setServiceWorkspaceTab("git");
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Filtered Services for Table View
  const filteredServices = services.filter((s) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (s.serviceCode || "").toLowerCase().includes(search) ||
      (s.displayName || "").toLowerCase().includes(search) ||
      (s.ownerTeam || "").toLowerCase().includes(search);
    const matchesType =
      selectedFilter === "ALL" || s.serviceType === selectedFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 text-sm font-medium ${
              toast.type === "success"
                ? "bg-slate-900 text-white border-slate-700"
                : toast.type === "warning"
                ? "bg-amber-900 text-amber-100 border-amber-700"
                : "bg-blue-900 text-blue-100 border-blue-700"
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Server className="w-3.5 h-3.5" /> Developer Platform & Service Manager
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Activity className="w-3 h-3 animate-pulse" /> Local K8s Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Service Catalog, Git & Kubernetes Hub
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Unified platform replacing legacy Bitbucket & Jenkins: Interactive service table, instant K8s power management, Git code browsing, MinIO artifact storage, and CI/CD pipelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
              onClick={() => {
                fetchServices();
                fetchGitRepos();
                fetchK8sPods();
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md text-xs sm:text-sm font-medium"
              onClick={() => {
                setFormData({
                  serviceCode: "",
                  displayName: "",
                  serviceType: "BACKEND_SPRING",
                  description: "",
                  ownerTeam: "Enterprise Team",
                  targetPort: 8085,
                  initGitRepo: true,
                  generateBoilerplate: true,
                  allowedCommunications: ["gateway-service", "auth-rbac-service", "postgres", "redis"],
                });
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Create New Service
            </Button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold">{services.length}</div>
              <div className="text-xs text-slate-400">Service Catalog</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold">{gitRepos.length || services.length}</div>
              <div className="text-xs text-slate-400">Git Repositories (Gitea)</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Power className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold">
                {services.filter((s) => s.status === "ACTIVE").length} / {services.length}
              </div>
              <div className="text-xs text-slate-400">Active Services</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold">{k8sPods.length || 9}</div>
              <div className="text-xs text-slate-400">Live K8s Pods</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTENT: DRILL-DOWN WORKSPACE OR SERVICES TABLE */}
      {/* ========================================================================= */}
      {selectedService ? (
        /* WORKSPACE VIEW FOR SELECTED SERVICE */
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Breadcrumb & Power Switch Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs">
              <button
                onClick={() => setSelectedService(null)}
                className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Service Catalog (Table)
              </button>
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 text-sm">
                <Server className="w-4 h-4 text-indigo-600" />
                <span>{selectedService.serviceCode}</span>
              </div>
            </div>

            {/* Quick Power Switch in Breadcrumb Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Status:</span>
              <Badge variant={selectedService.status === "ACTIVE" ? "success" : "warning"}>
                {selectedService.status === "ACTIVE" ? "Running (1 Pod)" : "Stopped (0 Pods)"}
              </Badge>
              <button
                onClick={(e) => handleTogglePower(selectedService, e)}
                disabled={isPowerToggling[selectedService.id]}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                  selectedService.status === "ACTIVE"
                    ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {isPowerToggling[selectedService.id] ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Power className="w-3.5 h-3.5" />
                )}
                <span>{selectedService.status === "ACTIVE" ? "Power Off Service" : "Power On Service"}</span>
              </button>
            </div>
          </div>

          {/* Service Hero Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                    selectedService.status === "ACTIVE" ? "bg-indigo-600" : "bg-slate-400"
                  }`}
                >
                  <Server className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {selectedService.displayName}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedService.serviceCode}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {selectedService.serviceType === "BACKEND_SPRING"
                        ? "Spring Boot 4 • Java 21"
                        : "React Remote MF"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-2xl">
                    {selectedService.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Right metadata summary */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Port</div>
                  <div className="font-bold text-indigo-600">{selectedService.targetPort}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Team</div>
                  <div className="font-bold text-slate-700">{selectedService.ownerTeam}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">K8s Namespace</div>
                  <div className="font-bold text-slate-700">enterprise-dev</div>
                </div>
              </div>
            </div>

            {/* Sub-tabs for managing this specific service */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setServiceWorkspaceTab("git")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  serviceWorkspaceTab === "git"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <FolderGit2 className="w-4 h-4" />
                <span>Git Repository & Code Explorer</span>
              </button>

              <button
                onClick={() => setServiceWorkspaceTab("k8s")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  serviceWorkspaceTab === "k8s"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Kubernetes Workload & Pods</span>
              </button>

              <button
                onClick={() => setServiceWorkspaceTab("pipeline")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  serviceWorkspaceTab === "pipeline"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <PlayCircle className="w-4 h-4" />
                <span>CI/CD Pipeline & MinIO</span>
              </button>

              <button
                onClick={() => setServiceWorkspaceTab("config")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                  serviceWorkspaceTab === "config"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Routing & Network Policy</span>
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: GIT REPO & MULTI-LEVEL CODE EXPLORER */}
          {serviceWorkspaceTab === "git" && (
            <div className="space-y-4">
              {/* Clone Links Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>HTTP Clone URL</span>
                    <a
                      href={selectedService.gitWebUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      Open in Gitea Web <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                    <span className="truncate pr-2 select-all">{selectedService.gitCloneHttp}</span>
                    <button
                      onClick={() => copyToClipboard(selectedService.gitCloneHttp, "detail-http")}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                    >
                      {copiedText === "detail-http" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-700 mb-1">SSH Clone URL</div>
                  <div className="flex items-center justify-between font-mono text-xs bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                    <span className="truncate pr-2 select-all">{selectedService.gitCloneSsh}</span>
                    <button
                      onClick={() => copyToClipboard(selectedService.gitCloneSsh, "detail-ssh")}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                    >
                      {copiedText === "detail-ssh" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Branches & Commit Timeline */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                    Branches & Commit History
                  </h4>
                  <div className="flex items-center gap-2">
                    {(selectedService.branches || [{ name: "main", commitId: "HEAD", isDefault: true }]).map((b) => (
                      <span
                        key={b.name}
                        className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
                      >
                        <GitBranch className="w-3 h-3" />
                        {b.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 border-l-2 border-indigo-100 pl-4 ml-2">
                  {(selectedService.recentCommits || []).map((commit, idx) => (
                    <div key={commit.id || idx} className="relative group">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white" />
                      <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900">{commit.message}</span>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Author: <strong>{commit.authorName}</strong> • {new Date(commit.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/50">
                          {commit.shortId}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IN-PORTAL CODE TREE & BROWSER (FIXED FOLDER NAVIGATION) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    Multi-Level Code & Directory Explorer
                  </h4>
                  <span className="text-xs text-slate-400">
                    Click folders to browse deeper, click files to view code
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column: Directory Tree Browser */}
                  <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col">
                    {/* Interactive Breadcrumb Bar */}
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-1.5 overflow-x-auto truncate pr-2">
                        <button
                          onClick={() => openGitRepoExplorer(selectedService.gitRepoName, "")}
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-mono shrink-0 cursor-pointer"
                          title="Root directory"
                        >
                          <Folder className="w-3.5 h-3.5" />
                          <span>{selectedService.gitRepoName}</span>
                        </button>

                        {currentGitPath &&
                          currentGitPath
                            .split("/")
                            .filter(Boolean)
                            .map((segment, index, arr) => (
                              <React.Fragment key={index}>
                                <span className="text-slate-300">/</span>
                                <button
                                  onClick={() => handleNavigateBreadcrumb(index)}
                                  className={`hover:underline font-mono truncate shrink-0 cursor-pointer ${
                                    index === arr.length - 1
                                      ? "text-slate-800 font-bold"
                                      : "text-indigo-600"
                                  }`}
                                >
                                  {segment}
                                </button>
                              </React.Fragment>
                            ))}
                      </div>

                      {currentGitPath && (
                        <button
                          onClick={handleGoUpDirectory}
                          className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 shrink-0 p-1 rounded hover:bg-slate-200 cursor-pointer"
                          title="Parent directory"
                        >
                          <CornerLeftUp className="w-3.5 h-3.5" /> Up 1 level
                        </button>
                      )}
                    </div>

                    {/* Tree List */}
                    <div className="p-2 divide-y divide-slate-100 max-h-[460px] overflow-y-auto flex-1">
                      {isTreeLoading ? (
                        <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                          <span>Loading directory files...</span>
                        </div>
                      ) : (
                        <>
                          {/* Up One Level Row if inside subfolder */}
                          {currentGitPath && (
                            <div
                              onClick={handleGoUpDirectory}
                              className="p-2 rounded-lg flex items-center gap-2 text-xs font-mono text-slate-500 hover:bg-indigo-50/60 hover:text-indigo-700 cursor-pointer transition-colors"
                            >
                              <CornerLeftUp className="w-4 h-4 text-indigo-500" />
                              <span className="font-semibold">.. (Back to parent directory)</span>
                            </div>
                          )}

                          {/* List of Folders and Files */}
                          {gitTree.map((item) => {
                            const isDir = item.type === "dir";
                            const isSelected = selectedGitFile?.path === item.path;

                            return (
                              <div
                                key={item.path}
                                onClick={() => {
                                  if (isDir) {
                                    openGitRepoExplorer(selectedService.gitRepoName, item.path);
                                  } else {
                                    openGitFileContent(selectedService.gitRepoName, item.path);
                                  }
                                }}
                                className={`p-2.5 rounded-lg flex items-center justify-between text-xs font-mono cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-indigo-600 text-white font-semibold"
                                    : "hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  {isDir ? (
                                    <Folder className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-amber-500"}`} />
                                  ) : (
                                    <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-blue-500"}`} />
                                  )}
                                  <span className="truncate">{item.name}</span>
                                </div>

                                <div className="flex items-center gap-1 text-[10px]">
                                  {isDir ? (
                                    <span
                                      className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                        isSelected ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"
                                      }`}
                                    >
                                      Directory <ChevronRight className="w-3 h-3" />
                                    </span>
                                  ) : (
                                    <span className={isSelected ? "text-indigo-100" : "text-slate-400"}>
                                      {item.size ? `${item.size} B` : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {gitTree.length === 0 && (
                            <div className="p-6 text-center text-xs text-slate-400">
                              Directory is empty.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Code Viewer */}
                  <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col min-h-[380px]">
                    {selectedGitFile ? (
                      <>
                        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate font-semibold">{selectedGitFile.path}</span>
                            <span className="text-slate-400 text-[11px] shrink-0">
                              ({selectedGitFile.size || 0} bytes)
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(selectedGitFile.content || "", "viewer-code")}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white flex items-center gap-1 text-[11px] shrink-0 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Code
                          </button>
                        </div>

                        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-200 flex-1 overflow-x-auto overflow-y-auto max-h-[480px]">
                          {isFileLoading ? (
                            <div className="flex items-center justify-center p-12 text-slate-500">
                              <RefreshCw className="w-5 h-5 animate-spin mr-2 text-indigo-400" />
                              <span>Reading file from Gitea Server...</span>
                            </div>
                          ) : (
                            <pre className="leading-relaxed">
                              <code>{selectedGitFile.content || "// Empty file"}</code>
                            </pre>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-400 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <FileCode className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-700 text-sm">No file selected</p>
                          <p className="text-xs text-slate-400 max-w-sm">
                            Click any file in the directory tree on the left (e.g., pom.xml, Dockerfile, k8s/deployment.yaml) to inspect its source code.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: KUBERNETES WORKLOAD & PODS FOR THIS SERVICE */}
          {serviceWorkspaceTab === "k8s" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-medium">Deployment Name</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {selectedService.k8sDeploymentName || selectedService.serviceCode}
                  </div>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-medium">K8s Namespace</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    enterprise-dev
                  </div>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-medium">Replicas (Pods)</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {selectedService.status === "ACTIVE" ? "1 / 1 Ready" : "0 / 0 Ready"}
                  </div>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-400 font-medium">Health Status</div>
                  <div
                    className={`font-mono font-bold text-sm mt-0.5 ${
                      selectedService.status === "ACTIVE" ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {selectedService.status === "ACTIVE" ? "HEALTHY (Running)" : "STOPPED (0 Pods)"}
                  </div>
                </div>
              </div>

              {/* Service Pods Live List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Live Pods for Service "{selectedService.serviceCode}" on Cluster</span>
                  <button
                    onClick={(e) => handleTogglePower(selectedService, e)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      selectedService.status === "ACTIVE"
                        ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {selectedService.status === "ACTIVE" ? "Scale to 0 (Power Off)" : "Scale to 1 (Power On)"}
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  {selectedService.status === "ACTIVE" ? (
                    k8sPods.filter((p) => p.name.includes(selectedService.serviceCode)).length > 0 ? (
                      k8sPods
                        .filter((p) => p.name.includes(selectedService.serviceCode))
                        .map((pod) => (
                          <div
                            key={pod.name}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono gap-2"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="font-bold text-slate-900">{pod.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-500">
                              <span>IP: {pod.podIp || "10.1.0.x"}</span>
                              <span>Node: {pod.nodeName}</span>
                              <span>Restarts: {pod.restartCount}</span>
                              <Badge variant="success">Running</Badge>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-bold text-slate-900">{selectedService.serviceCode}-5fc459b468-lx5kd</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500">
                          <span>IP: 10.1.0.28</span>
                          <span>Restarts: 0</span>
                          <Badge variant="success">Running</Badge>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                      <Power className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-semibold text-slate-700">Service is currently stopped (0 Pods)</p>
                      <p>Deployment has been scaled down to 0 replicas on the Kubernetes cluster.</p>
                      <button
                        onClick={(e) => handleTogglePower(selectedService, e)}
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Power className="w-3.5 h-3.5" /> Power On Service Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: CI/CD PIPELINE & MINIO ARTIFACTS MANAGEMENT */}
          {serviceWorkspaceTab === "pipeline" && (
            <div className="space-y-6">
              {/* TOP ACTION BAR */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        CI/CD Pipeline & MinIO Artifacts
                      </h4>
                      <Badge variant="indigo">{selectedService.serviceCode}</Badge>
                      {artifacts.find((a) => a.currentDeployed) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live: {artifacts.find((a) => a.currentDeployed)?.version}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      K8s Namespace: <code className="font-mono text-indigo-600 font-semibold">{selectedService.k8sNamespace}</code> • MinIO S3 Bucket: <code className="font-mono text-amber-600 font-semibold">enterprise-artifacts/{selectedService.serviceCode}</code>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setTriggerBranch("main");
                      setIsTriggerModalOpen(true);
                    }}
                    disabled={isTriggeringPipeline}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isTriggeringPipeline ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <PlayCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Trigger Pipeline</span>
                  </button>

                  <button
                    onClick={() => handleTriggerPipeline(selectedPipelineRun?.branch || "main")}
                    disabled={isTriggeringPipeline}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Rerun most recent pipeline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rerun Pipeline</span>
                  </button>

                  <a
                    href="http://localhost:9001"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Open MinIO S3 Web Console (User: minioadmin / Pass: minioadmin123)"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-amber-600" />
                    <span>MinIO Console</span>
                    <ExternalLink className="w-3 h-3 text-amber-500" />
                  </a>

                  <button
                    onClick={() => {
                      fetchPipelines(selectedService.id);
                      fetchArtifacts(selectedService.id);
                      showToast("Refreshed Pipeline & Artifacts data", "info");
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${isPipelineLoading || isArtifactsLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* SECTION 1: PIPELINE RUNS HISTORY & REALTIME TERMINAL LOGS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* RUNS LIST (5 COLS) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-500" />
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Pipeline Run History ({pipelineRuns.length})
                      </h5>
                    </div>
                    <span className="text-[11px] text-slate-400">Select run to inspect logs</span>
                  </div>

                  {isPipelineLoading && pipelineRuns.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                      <p className="text-xs">Loading pipeline run history...</p>
                    </div>
                  ) : pipelineRuns.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                      <PlayCircle className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="font-medium">No pipeline runs yet</p>
                      <button
                        onClick={() => handleTriggerPipeline("main")}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 text-xs cursor-pointer"
                      >
                        Trigger first run
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                      {pipelineRuns.map((run) => {
                        const isSelected = selectedPipelineRun?.id === run.id;
                        return (
                          <div
                            key={run.id}
                            onClick={() => setSelectedPipelineRun(run)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-slate-900">
                                  #{run.runNumber}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    run.triggerType === "ROLLBACK"
                                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                                      : run.triggerType === "MANUAL"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {run.triggerType}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                                  <GitBranch className="w-3 h-3 text-slate-400" />
                                  {run.branch}
                                </span>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                                  run.status === "SUCCESS"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : run.status === "RUNNING"
                                    ? "bg-amber-100 text-amber-700 animate-pulse"
                                    : run.status === "CANCELLED"
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {run.status === "SUCCESS" && <Check className="w-2.5 h-2.5" />}
                                {run.status === "RUNNING" && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                                {run.status} ({run.durationSeconds}s)
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 font-medium truncate mt-1.5">
                              {run.commitMessage || "Pipeline execution"}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                              <span className="font-mono truncate max-w-[150px]">
                                Commit: {run.commitId}
                              </span>
                              <span>By: {run.triggeredBy || "admin"}</span>
                              {run.status === "RUNNING" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelPipeline(run.id);
                                  }}
                                  className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                                >
                                  Cancel run
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* RUN DETAILS & REALTIME LOGS TERMINAL (7 COLS) */}
                <div className="lg:col-span-7 space-y-4">
                  {selectedPipelineRun ? (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 text-white p-5 space-y-4 shadow-md">
                      {/* RUN SUMMARY HEADER */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-200">
                              Pipeline Run #{selectedPipelineRun.runNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                selectedPipelineRun.status === "SUCCESS"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : selectedPipelineRun.status === "RUNNING"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              }`}
                            >
                              {selectedPipelineRun.status} ({selectedPipelineRun.durationSeconds}s)
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">
                            Branch: <span className="text-indigo-400">{selectedPipelineRun.branch}</span> • Commit: <span className="text-amber-400">{selectedPipelineRun.commitId}</span> • Triggered by: <span className="text-slate-300">{selectedPipelineRun.triggeredBy}</span>
                          </p>
                        </div>

                        {selectedPipelineRun.artifactVersion && (
                          <div className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-right">
                            <span className="text-[10px] text-slate-400 block">MinIO Artifact</span>
                            <span className="font-mono text-xs font-bold text-amber-400">
                              {selectedPipelineRun.artifactVersion}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* STAGE EXECUTION PIPELINE PROGRESS */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Pipeline Stages
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          {selectedPipelineRun.stages?.map((stage, idx) => (
                            <div
                              key={idx}
                              onClick={() => setPipelineLogFilter(pipelineLogFilter === stage.name ? "ALL" : stage.name)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                pipelineLogFilter === stage.name
                                    ? "bg-indigo-950/80 border-indigo-400 ring-1 ring-indigo-400"
                                    : "bg-slate-800/70 border-slate-700/80 hover:bg-slate-800"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                                <Check className="w-3 h-3 text-emerald-400" />
                              </div>
                              <div className="font-semibold text-[11px] text-slate-200 truncate" title={stage.name}>
                                {stage.name}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{stage.durationSeconds}s</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TERMINAL CONSOLE WINDOW */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <TerminalSquare className="w-4 h-4 text-emerald-400" />
                            <span className="font-mono text-xs font-semibold text-slate-300">
                              Realtime Console Logs {pipelineLogFilter !== "ALL" ? `[Filter: ${pipelineLogFilter}]` : ""}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {pipelineLogFilter !== "ALL" && (
                              <button
                                onClick={() => setPipelineLogFilter("ALL")}
                                className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                              >
                                View all logs
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const allText = (selectedPipelineRun.stages || [])
                                  .flatMap((s) => s.logs || [])
                                  .join("\n");
                                copyToClipboard(allText, "all-logs");
                              }}
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copy Logs</span>
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1 max-h-72 overflow-y-auto shadow-inner border border-slate-800/80">
                          {(selectedPipelineRun.stages || [])
                            .filter((s) => pipelineLogFilter === "ALL" || s.name === pipelineLogFilter)
                            .flatMap((s) => s.logs || [])
                            .map((logLine, idx) => {
                              const isInfo = logLine.includes("[INFO]");
                              const isMinio = logLine.includes("[MINIO]");
                              const isK8s = logLine.includes("[K8S]");
                              const isSuccess = logLine.includes("SUCCESS") || logLine.includes("PASSED") || logLine.includes("completed");
                              const isError = logLine.includes("[ERROR]") || logLine.includes("Failures: [1-9]");

                              return (
                                <div key={idx} className="leading-relaxed flex items-start gap-2">
                                  <span className="text-slate-600 select-none text-[10px] w-6 text-right">
                                    {idx + 1}
                                  </span>
                                  <span
                                    className={`${
                                      isError
                                        ? "text-rose-400 font-bold"
                                        : isSuccess
                                        ? "text-emerald-400"
                                        : isMinio
                                        ? "text-amber-300"
                                        : isK8s
                                        ? "text-cyan-300"
                                        : isInfo
                                        ? "text-slate-300"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {logLine}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center text-slate-400 space-y-3">
                      <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs">Select a Pipeline Run on the left to inspect stages and live terminal logs.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: MINIO S3 ARTIFACT STORAGE & VERSION ROLLBACK */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        MinIO Artifact Storage & Version Rollback
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          S3 Object Storage
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Securely store build artifacts (.jar) on bucket <code className="font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">enterprise-artifacts/{selectedService.serviceCode}</code>. Instant zero-downtime version rollback.
                      </p>
                    </div>
                  </div>

                  <a
                    href="http://localhost:9001"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <span>Open MinIO S3 Console</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </div>

                {isArtifactsLoading && artifacts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                    <p className="text-xs">Loading artifacts from MinIO...</p>
                  </div>
                ) : artifacts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                    <Archive className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-700">No artifacts stored yet</p>
                    <p>Trigger a pipeline run to build and push artifacts to MinIO.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {artifacts.map((artifact) => {
                      const isDeploying = isRollingBackId === artifact.id;
                      return (
                        <div
                          key={artifact.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                            artifact.currentDeployed
                              ? "bg-emerald-50/40 border-emerald-400 ring-2 ring-emerald-500/20"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                {artifact.version}
                              </span>

                              {artifact.currentDeployed ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Live on K8s
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                  S3 Archived
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="font-mono text-slate-700 font-semibold truncate" title={artifact.fileName}>
                                {artifact.fileName}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-3">
                                <span>Size: {artifact.fileSizeMb?.toFixed(1)} MB</span>
                                <span>Tag: {artifact.k8sImageTag}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate flex items-center justify-between bg-slate-50 p-1 rounded border border-slate-100">
                                <span className="truncate max-w-[200px]" title={artifact.sha256}>
                                  {artifact.sha256}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(artifact.sha256, `sha-${artifact.id}`)}
                                  className="text-indigo-600 hover:text-indigo-800 ml-1 cursor-pointer"
                                  title="Copy SHA-256"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                            {artifact.currentDeployed ? (
                              <button
                                disabled
                                className="w-full py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 opacity-80 cursor-default flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Current Active Version</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmRollbackArtifact(artifact)}
                                disabled={isDeploying}
                                className="w-full py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isDeploying ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                )}
                                <span>Rollback to this Version</span>
                              </button>
                            )}

                            <a
                              href={artifact.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                              title="Download .JAR from MinIO"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 4: CONFIGURATION & NETWORK SECURITY */}
          {serviceWorkspaceTab === "config" && (
            <div className="space-y-6">
              {/* Routing & Actuator Endpoints */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Configuration & Routing Endpoints (API Gateway)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-medium">Gateway Route Path</span>
                    <div className="font-mono font-bold text-slate-900">
                      http://localhost:8080/api/v1/{selectedService.serviceCode.replace("-service", "s")}/**
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-medium">Internal K8s DNS Service</span>
                    <div className="font-mono font-bold text-slate-900">
                      http://{selectedService.serviceCode}.enterprise-dev.svc:{selectedService.targetPort}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-medium">Actuator Health Check</span>
                    <div className="font-mono font-bold text-emerald-600">
                      http://localhost:8080/actuator/health
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-medium">Database Instance</span>
                    <div className="font-mono font-bold text-slate-900">
                      PostgreSQL 16 Multi-Tenant ({selectedService.serviceCode.replace("-", "_")}_db)
                    </div>
                  </div>
                </div>
              </div>

              {/* Zero-Trust Network Policy & Inter-Service Communications */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Zero-Trust Network Access Control (K8s NetworkPolicy)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enforce micro-segmentation. Only explicitly selected services are permitted for inter-service communication (egress).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowK8sNetpolYaml(!showK8sNetpolYaml)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{showK8sNetpolYaml ? "Hide K8s YAML" : "Inspect K8s YAML"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingNetpol}
                      onClick={() =>
                        handleUpdateNetworkPolicy(
                          selectedService.id,
                          selectedService.allowedCommunications || []
                        )
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isUpdatingNetpol ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Apply Network Policy</span>
                    </button>
                  </div>
                </div>

                {/* Ingress Rule Badge */}
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-emerald-900">Default Ingress:</span>
                    <span className="text-emerald-700">
                      API Gateway (<code>gateway-service:8080</code>) traffic is automatically allowed.
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-200/70 text-emerald-800">
                    Always Allowed
                  </span>
                </div>

                {/* Egress Inter-Service Communication Selection Grid */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2.5">
                    Authorized Outbound (Egress) Services:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {AVAILABLE_NETWORK_SERVICES.map((srv) => {
                      const isAllowed = (selectedService.allowedCommunications || []).includes(srv.id);
                      return (
                        <div
                          key={srv.id}
                          onClick={() => {
                            const current = selectedService.allowedCommunications || [];
                            const updated = isAllowed
                              ? current.filter((c) => c !== srv.id)
                              : [...current, srv.id];
                            setSelectedService({ ...selectedService, allowedCommunications: updated });
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isAllowed
                              ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/30"
                              : "bg-slate-50/50 border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-[11px] font-bold text-slate-900">
                              {srv.id}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isAllowed
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {isAllowed ? "ACTIVE" : "BLOCKED"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 line-clamp-1">{srv.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            Port {srv.port} • {srv.category}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inspect K8s YAML Modal / Accordion */}
                {showK8sNetpolYaml && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                      <span>Live Kubernetes Manifest: {selectedService.serviceCode}-netpol</span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            generateK8sNetpolYaml(
                              selectedService.serviceCode,
                              selectedService.targetPort,
                              selectedService.allowedCommunications || []
                            ),
                            "netpol-yaml"
                          )
                        }
                        className="text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy YAML</span>
                      </button>
                    </div>
                    <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-400">
                      {generateK8sNetpolYaml(
                        selectedService.serviceCode,
                        selectedService.targetPort,
                        selectedService.allowedCommunications || []
                      )}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MAIN SERVICE CATALOG TABLE (USER REQUIREMENT 1) */
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by service name, code, or team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
              {["ALL", "BACKEND_SPRING", "FRONTEND_REMOTE"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedFilter === type
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {type === "ALL"
                    ? "All"
                    : type === "BACKEND_SPRING"
                    ? "Spring Boot 4"
                    : "React Remote (MF)"}
                </button>
              ))}
            </div>
          </div>

          {/* SERVICES TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Service & Code</th>
                    <th className="py-3.5 px-4">Tech Stack</th>
                    <th className="py-3.5 px-4">Port</th>
                    <th className="py-3.5 px-4">Team</th>
                    <th className="py-3.5 px-4">K8s Status</th>
                    <th className="py-3.5 px-4 text-center">Power</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredServices.map((service) => {
                    const isServiceActive = service.status === "ACTIVE";
                    const isToggling = isPowerToggling[service.id];

                    return (
                      <tr
                        key={service.id}
                        onClick={() => openServiceDetail(service)}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                      >
                        {/* Service Code & Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${
                                isServiceActive
                                  ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                  : "bg-slate-100 text-slate-400 border border-slate-200"
                              }`}
                            >
                              {service.serviceType === "FRONTEND_REMOTE" ? (
                                <Layers className="w-4 h-4" />
                              ) : (
                                <Server className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                <span>{service.displayName}</span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                                <span>{service.serviceCode}</span>
                                <span>•</span>
                                <span className="text-slate-400">Git: {service.gitRepoName}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tech Stack */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                            {service.serviceType === "BACKEND_SPRING"
                              ? "Java 21 • Spring Boot 4"
                              : "React 18 • MF 2.0"}
                          </span>
                        </td>

                        {/* Target Port */}
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                          Port {service.targetPort}
                        </td>

                        {/* Owner Team */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {service.ownerTeam}
                        </td>

                        {/* K8s Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isServiceActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                              }`}
                            />
                            <Badge variant={isServiceActive ? "success" : "warning"}>
                              {isServiceActive ? "Running (1 Pod)" : "Stopped (0 Pod)"}
                            </Badge>
                          </div>
                        </td>

                        {/* Power Toggle Button */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => handleTogglePower(service, e)}
                            disabled={isToggling}
                            title={
                              isServiceActive
                                ? "Click to Power Off service (Scale to 0 replicas)"
                                : "Click to Power On service (Scale to 1 replica)"
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition-all cursor-pointer ${
                              isServiceActive
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600"
                            }`}
                          >
                            {isToggling ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Power className="w-3 h-3" />
                            )}
                            <span>{isServiceActive ? "Power Off" : "Power On"}</span>
                          </button>
                        </td>

                        {/* Action: Open Management Drill-Down */}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              openServiceDetail(service);
                            }}
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <strong>{filteredServices.length}</strong> of <strong>{services.length}</strong> services
              </span>
              <span className="text-[11px] text-slate-400">
                Click on any service row to open its Git, K8s Pods, CI/CD and MinIO workspace
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Create Service Wizard */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Create New Microservice
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatically provision Git repository, boilerplate source code, and Kubernetes manifests
                  </p>
                </div>
              </div>
              <button
                disabled={isProvisioning}
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isProvisioning ? (
              <div className="p-8 space-y-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 mx-auto flex items-center justify-center shadow-inner">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">
                    Provisioning service "{formData.serviceCode}"...
                  </h4>
                  <p className="text-xs text-slate-500">
                    Please wait while the platform configures the infrastructure
                  </p>
                </div>

                <div className="space-y-3 max-w-sm mx-auto text-left text-xs">
                  <div
                    className={`flex items-center gap-2.5 ${
                      provisionStep >= 1 ? "text-slate-900 font-medium" : "text-slate-400"
                    }`}
                  >
                    {provisionStep > 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                    )}
                    <span>1. Provisioning Git Repository on Gitea Server...</span>
                  </div>
                  <div
                    className={`flex items-center gap-2.5 ${
                      provisionStep >= 2 ? "text-slate-900 font-medium" : "text-slate-400"
                    }`}
                  >
                    {provisionStep > 2 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : provisionStep === 2 ? (
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                    <span>2. Generating boilerplate source code (pom.xml, Dockerfile, K8s)...</span>
                  </div>
                  <div
                    className={`flex items-center gap-2.5 ${
                      provisionStep >= 3 ? "text-slate-900 font-medium" : "text-slate-400"
                    }`}
                  >
                    {provisionStep > 3 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : provisionStep === 3 ? (
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                    <span>3. Committing initial source code to branch main...</span>
                  </div>
                  <div
                    className={`flex items-center gap-2.5 ${
                      provisionStep >= 4 ? "text-slate-900 font-medium" : "text-slate-400"
                    }`}
                  >
                    {provisionStep >= 4 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                    <span>4. Registering Service Catalog & Kubernetes manifests...</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* LEFT COLUMN: Service Identity & Architecture Specs */}
                  <div className="space-y-3.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Server className="w-3.5 h-3.5 text-indigo-600" />
                      <span>1. Service Specification & Template</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Service Code *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. billing-service"
                          value={formData.serviceCode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              serviceCode: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Display Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Billing & Payment Service"
                          value={formData.displayName}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Architecture Template *
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          {
                            type: "BACKEND_SPRING",
                            label: "Spring Boot 4 (Cloud-Native)",
                            sub: "Java 21, Spring Boot 4, Zero-Trust RBAC",
                            port: 8085,
                          },
                          {
                            type: "FRONTEND_REMOTE",
                            label: "React MF Remote",
                            sub: "React 18, Module Fed 2.0, Rspack",
                            port: 3004,
                          },
                        ].map((tpl) => (
                          <div
                            key={tpl.type}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                serviceType: tpl.type as any,
                                targetPort: tpl.port,
                              })
                            }
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                              formData.serviceType === tpl.type
                                ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="font-semibold text-xs text-slate-900">{tpl.label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{tpl.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Target Port
                        </label>
                        <input
                          type="number"
                          value={formData.targetPort}
                          onChange={(e) =>
                            setFormData({ ...formData, targetPort: parseInt(e.target.value) || 8085 })
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Owner Team
                        </label>
                        <input
                          type="text"
                          value={formData.ownerTeam}
                          onChange={(e) => setFormData({ ...formData, ownerTeam: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Business Description
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Briefly describe the business role of this microservice..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Network Policy & Automation Flags */}
                  <div className="space-y-3.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Network className="w-3.5 h-3.5 text-indigo-600" />
                        <span>2. Network Policy & Provisioning</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Zero-Trust Security
                      </span>
                    </div>

                    {/* Network Policy Services Selection */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">
                          Authorized Outbound Egress:
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {(formData.allowedCommunications || []).length} / {AVAILABLE_NETWORK_SERVICES.length} Selected
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Select internal services this service can access. Ingress from API Gateway and DNS resolution are automatically enabled.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        {AVAILABLE_NETWORK_SERVICES.map((srv) => {
                          const isChecked = (formData.allowedCommunications || []).includes(srv.id);
                          return (
                            <label
                              key={srv.id}
                              className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                isChecked
                                  ? "bg-indigo-50/70 border-indigo-300 text-slate-900 shadow-2xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentComms = formData.allowedCommunications || [];
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      allowedCommunications: [...currentComms, srv.id],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      allowedCommunications: currentComms.filter((id) => id !== srv.id),
                                    });
                                  }
                                }}
                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <div className="space-y-0.5 overflow-hidden">
                                <div className="font-semibold text-[11px] text-slate-900 truncate">
                                  {srv.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Port {srv.port}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Automation Flags */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="text-xs font-semibold text-slate-800">
                        Automated Infrastructure Actions:
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={formData.initGitRepo}
                          onChange={(e) =>
                            setFormData({ ...formData, initGitRepo: e.target.checked })
                          }
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>
                          Provision Git repository <strong>{formData.serviceCode || "service"}</strong> on Gitea
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={formData.generateBoilerplate}
                          onChange={(e) =>
                            setFormData({ ...formData, generateBoilerplate: e.target.checked })
                          }
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>
                          Generate standard boilerplate (Dockerfile, K8s manifests, Woodpecker CI)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    <Plus className="w-4 h-4 mr-1.5" /> Start Provisioning
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: TRIGGER PIPELINE */}
      {isTriggerModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PlayCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Trigger CI/CD Pipeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Service: {selectedService.serviceCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTriggerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Git Branch
                </label>
                <select
                  value={triggerBranch}
                  onChange={(e) => setTriggerBranch(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="main">main (Default)</option>
                  <option value="develop">develop</option>
                  <option value="feature/order-discount">feature/order-discount</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="font-semibold text-slate-800">Automated Workflow Stages:</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Git Checkout from Gitea Repository</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Maven Test & Package Application JAR</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Upload Versioned Artifact to MinIO Object Storage</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4. Rolling Update Deployment on Kubernetes</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTriggerModalOpen(false)}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  disabled={isTriggeringPipeline}
                  onClick={() => handleTriggerPipeline(triggerBranch)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTriggeringPipeline ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PlayCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Start Pipeline Run</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM ROLLBACK ARTIFACT */}
      {confirmRollbackArtifact && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Confirm Version Rollback
                  </h3>
                  <p className="text-xs text-slate-500">
                    Service: {selectedService.serviceCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmRollbackArtifact(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/80 space-y-2 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>You are about to roll back to version:</span>
                </div>
                <div className="font-mono font-bold text-sm text-slate-900 bg-white p-2 rounded border border-amber-200">
                  {confirmRollbackArtifact.version} ({confirmRollbackArtifact.fileName})
                </div>
                <p className="text-[11px] leading-relaxed">
                  The artifact will be fetched directly from MinIO Object Storage and Kubernetes will execute a <strong>Rolling Restart</strong> with zero downtime.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmRollbackArtifact(null)}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  disabled={isRollingBackId !== null}
                  onClick={() => handleRollback(confirmRollbackArtifact)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isRollingBackId !== null ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Rollback Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlatformApp;
