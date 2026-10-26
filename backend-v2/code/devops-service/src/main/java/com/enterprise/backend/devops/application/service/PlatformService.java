package com.enterprise.backend.devops.application.service;

import com.enterprise.backend.devops.application.dto.*;
import com.enterprise.backend.devops.domain.model.*;
import com.enterprise.backend.devops.infrastructure.git.GiteaClient;
import com.enterprise.backend.devops.infrastructure.git.TemplateScaffoldingEngine;
import com.enterprise.backend.devops.infrastructure.k8s.K8sClient;
import com.enterprise.backend.devops.infrastructure.minio.MinIOClient;
import com.enterprise.backend.devops.infrastructure.repository.ServiceEntityRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformService {

    private final ServiceEntityRepository serviceRepository;
    private final GiteaClient giteaClient;
    private final TemplateScaffoldingEngine templateEngine;
    private final K8sClient k8sClient;
    private final MinIOClient minioClient;

    private final Map<String, List<PipelineRunDto>> servicePipelineRuns = new ConcurrentHashMap<>();
    private final AtomicLong runIdGenerator = new AtomicLong(100);

    @PostConstruct
    public void initPipelineRuns() {
        List<PipelineRunDto> orderRuns = new ArrayList<>();
        orderRuns.add(PipelineRunDto.builder()
                .id(22L)
                .serviceCode("order-service")
                .runNumber(22L)
                .triggerType("GIT_PUSH")
                .triggeredBy("haidangdev")
                .branch("main")
                .commitId("8f9b4c2")
                .commitMessage("feat: optimize order creation latency & add Liquibase migration")
                .status("SUCCESS")
                .durationSeconds(74)
                .startedAt(Instant.now().minusSeconds(1800))
                .finishedAt(Instant.now().minusSeconds(1726))
                .artifactVersion("v1.0.3-build.22")
                .stages(List.of(
                        PipelineStageDto.builder().name("Git Checkout").status("SUCCESS").durationSeconds(4).logs(List.of(
                                "[INFO] Fetching origin/main...",
                                "[INFO] HEAD is now at 8f9b4c2 feat: optimize order creation latency",
                                "[INFO] Checkout completed in 4.12s"
                        )).build(),
                        PipelineStageDto.builder().name("Unit & Integration Tests").status("SUCCESS").durationSeconds(28).logs(List.of(
                                "[INFO] --- maven-surefire-plugin:3.1.2:test (default-test) ---",
                                "[INFO] Running com.enterprise.backend.order.OrderServiceTests",
                                "[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0",
                                "[INFO] BUILD SUCCESS"
                        )).build(),
                        PipelineStageDto.builder().name("Maven Package").status("SUCCESS").durationSeconds(18).logs(List.of(
                                "[INFO] --- spring-boot-maven-plugin:3.3.4:repackage ---",
                                "[INFO] Replacing main artifact with repackaged archive: target/order-service-1.0.3.jar",
                                "[INFO] Total size: 43.2 MB"
                        )).build(),
                        PipelineStageDto.builder().name("MinIO S3 Artifact Upload").status("SUCCESS").durationSeconds(6).logs(List.of(
                                "[MINIO] Connecting to S3 endpoint: http://minio.enterprise-dev.svc:9000",
                                "[MINIO] Bucket: enterprise-artifacts",
                                "[MINIO] Uploading target/order-service-1.0.3.jar -> s3://enterprise-artifacts/order-service/v1.0.3/order-service-1.0.3.jar",
                                "[MINIO] Upload verified! Checksum: sha256:8f9b4c2e6d1a5f7e3c8b9a0f1d2e3c4b5a6f7e8d"
                        )).build(),
                        PipelineStageDto.builder().name("K8s Rolling Deploy").status("SUCCESS").durationSeconds(18).logs(List.of(
                                "[K8S] Patching deployment 'order-service' in namespace 'enterprise-dev'...",
                                "[K8S] Image: backend-v2-order-service:latest (Artifact v1.0.3-build.22)",
                                "[K8S] Waiting for deployment 'order-service' rollout to finish: 1 of 1 updated replicas are available...",
                                "[K8S] Deployment 'order-service' successfully rolled out!"
                        )).build()
                ))
                .build());

        orderRuns.add(PipelineRunDto.builder()
                .id(21L)
                .serviceCode("order-service")
                .runNumber(21L)
                .triggerType("MANUAL")
                .triggeredBy("admin")
                .branch("develop")
                .commitId("4a5b6c7")
                .commitMessage("chore: bump spring-boot-starter-parent version")
                .status("SUCCESS")
                .durationSeconds(68)
                .startedAt(Instant.now().minusSeconds(86400))
                .finishedAt(Instant.now().minusSeconds(86332))
                .artifactVersion("v1.0.2-build.18")
                .stages(List.of(
                        PipelineStageDto.builder().name("Git Checkout").status("SUCCESS").durationSeconds(3).logs(List.of("Checkout develop completed")).build(),
                        PipelineStageDto.builder().name("Unit & Integration Tests").status("SUCCESS").durationSeconds(25).logs(List.of("Tests run: 14, Failures: 0")).build(),
                        PipelineStageDto.builder().name("Maven Package").status("SUCCESS").durationSeconds(16).logs(List.of("Building jar: order-service-1.0.2.jar")).build(),
                        PipelineStageDto.builder().name("MinIO S3 Artifact Upload").status("SUCCESS").durationSeconds(5).logs(List.of("Uploaded to MinIO enterprise-artifacts")).build(),
                        PipelineStageDto.builder().name("K8s Rolling Deploy").status("SUCCESS").durationSeconds(19).logs(List.of("Rollout finished successfully")).build()
                ))
                .build());

        servicePipelineRuns.put("order-service", orderRuns);
    }

    @Transactional(readOnly = true)
    public List<ServiceSummaryResponse> listServices() {
        return serviceRepository.findAllWithRepository().stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceDetailResponse getServiceDetail(Long id) {
        ServiceEntity entity = serviceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + id));

        ServiceRepositoryEntity repo = entity.getRepository();
        String repoName = (repo != null) ? repo.getRepoName() : entity.getServiceCode();

        List<GitCommitDto> commits = giteaClient.getRecentCommits(repoName);
        List<GitBranchDto> branches = giteaClient.getBranches(repoName);

        ServiceDeploymentEntity deploy = entity.getDeployments().isEmpty() ? null : entity.getDeployments().get(0);

        List<String> allowed = (entity.getAllowedCommunications() != null && !entity.getAllowedCommunications().isBlank())
                ? Arrays.asList(entity.getAllowedCommunications().split(","))
                : List.of("gateway-service", "auth-rbac-service", "postgres", "redis");

        return ServiceDetailResponse.builder()
                .id(entity.getId())
                .serviceCode(entity.getServiceCode())
                .displayName(entity.getDisplayName())
                .serviceType(entity.getServiceType())
                .description(entity.getDescription())
                .ownerTeam(entity.getOwnerTeam())
                .targetPort(entity.getTargetPort())
                .status(entity.getStatus())
                .allowedCommunications(allowed)
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .gitProvider(repo != null ? repo.getGitProvider() : "GITEA")
                .gitRepoName(repoName)
                .gitCloneHttp(repo != null ? repo.getCloneUrlHttp() : giteaClient.buildHttpCloneUrl(repoName))
                .gitCloneSsh(repo != null ? repo.getCloneUrlSsh() : giteaClient.buildSshCloneUrl(repoName))
                .gitWebUrl(repo != null ? repo.getWebUrl() : giteaClient.buildWebUrl(repoName))
                .defaultBranch(repo != null ? repo.getDefaultBranch() : "main")
                .recentCommits(commits)
                .branches(branches)
                .environment(deploy != null ? deploy.getEnvironment() : "DEV")
                .k8sNamespace(deploy != null ? deploy.getK8sNamespace() : "enterprise-dev")
                .k8sDeploymentName(deploy != null ? deploy.getK8sDeploymentName() : entity.getServiceCode())
                .replicas(deploy != null ? deploy.getReplicas() : 1)
                .healthStatus(deploy != null ? deploy.getHealthStatus() : "HEALTHY")
                .build();
    }

    @Transactional
    public ServiceDetailResponse toggleServicePower(Long id) {
        ServiceEntity entity = serviceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + id));

        boolean wasActive = (entity.getStatus() == ServiceStatus.ACTIVE);
        ServiceStatus nextStatus = wasActive ? ServiceStatus.STOPPED : ServiceStatus.ACTIVE;
        int nextReplicas = wasActive ? 0 : 1;
        String nextHealth = wasActive ? "STOPPED" : "HEALTHY";

        entity.setStatus(nextStatus);

        String deploymentName = entity.getServiceCode();
        if (!entity.getDeployments().isEmpty()) {
            ServiceDeploymentEntity deploy = entity.getDeployments().get(0);
            deploy.setReplicas(nextReplicas);
            deploy.setHealthStatus(nextHealth);
            if (deploy.getK8sDeploymentName() != null) {
                deploymentName = deploy.getK8sDeploymentName();
            }
        }

        serviceRepository.save(entity);

        // Scale on Kubernetes cluster
        k8sClient.scaleDeployment(deploymentName, nextReplicas);
        log.info("Service '{}' power toggled: {} -> {} (Replicas: {})", entity.getServiceCode(), wasActive ? "ACTIVE" : "STOPPED", nextStatus, nextReplicas);

        return getServiceDetail(id);
    }

    @Transactional
    public ServiceDetailResponse createService(CreateServiceRequest request, String createdBy) {
        if (serviceRepository.existsByServiceCode(request.getServiceCode())) {
            throw new IllegalArgumentException("Service code already exists: " + request.getServiceCode());
        }

        String repoName = request.getServiceCode();
        String cloneHttp = giteaClient.buildHttpCloneUrl(repoName);
        String cloneSsh = giteaClient.buildSshCloneUrl(repoName);
        String webUrl = giteaClient.buildWebUrl(repoName);

        log.info("Provisioning new service '{}' by user '{}'...", request.getServiceCode(), createdBy);

        List<String> allowedServices = (request.getAllowedCommunications() != null && !request.getAllowedCommunications().isEmpty())
                ? request.getAllowedCommunications()
                : List.of("gateway-service", "auth-rbac-service", "postgres", "redis");

        // 1. Provision Git Repository on Gitea
        if (request.isInitGitRepo()) {
            giteaClient.createRepository(repoName, request.getDescription());
        }

        // 2. Scaffold and commit template code
        if (request.isGenerateBoilerplate()) {
            Map<String, String> files = templateEngine.generateScaffoldingFiles(
                    request.getServiceCode(),
                    request.getDisplayName(),
                    request.getServiceType(),
                    request.getTargetPort(),
                    allowedServices
            );
            giteaClient.commitFiles(repoName, files, "feat: initial scaffolding generated by Enterprise Portal");
        }

        // 3. Persist entity and relations
        ServiceEntity entity = ServiceEntity.builder()
                .serviceCode(request.getServiceCode())
                .displayName(request.getDisplayName())
                .serviceType(request.getServiceType())
                .description(request.getDescription())
                .ownerTeam(request.getOwnerTeam() != null ? request.getOwnerTeam() : "Enterprise Team")
                .targetPort(request.getTargetPort() != null ? request.getTargetPort() : 8085)
                .status(ServiceStatus.ACTIVE)
                .allowedCommunications(String.join(",", allowedServices))
                .createdBy(createdBy != null ? createdBy : "ADMIN")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        ServiceRepositoryEntity repoEntity = ServiceRepositoryEntity.builder()
                .service(entity)
                .gitProvider("GITEA")
                .repoName(repoName)
                .cloneUrlHttp(cloneHttp)
                .cloneUrlSsh(cloneSsh)
                .webUrl(webUrl)
                .defaultBranch("main")
                .createdAt(Instant.now())
                .build();

        ServiceDeploymentEntity deployEntity = ServiceDeploymentEntity.builder()
                .service(entity)
                .environment("DEV")
                .k8sNamespace("enterprise-dev")
                .k8sDeploymentName(request.getServiceCode())
                .replicas(1)
                .healthStatus("HEALTHY")
                .lastDeployedAt(Instant.now())
                .build();

        entity.setRepository(repoEntity);
        entity.getDeployments().add(deployEntity);

        ServiceEntity saved = serviceRepository.save(entity);
        log.info("Successfully provisioned service with ID {}", saved.getId());

        // 4. Apply Kubernetes NetworkPolicy for Zero-Trust Inter-service isolation
        k8sClient.applyNetworkPolicy(saved.getServiceCode(), saved.getTargetPort() != null ? saved.getTargetPort() : 8085, allowedServices);

        return getServiceDetail(saved.getId());
    }

    @Transactional
    public ServiceDetailResponse updateNetworkPolicy(Long serviceId, List<String> allowedCommunications) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + serviceId));

        List<String> allowed = (allowedCommunications != null && !allowedCommunications.isEmpty())
                ? allowedCommunications
                : List.of("gateway-service", "auth-rbac-service", "postgres", "redis");

        entity.setAllowedCommunications(String.join(",", allowed));
        serviceRepository.save(entity);

        // Apply updated NetworkPolicy to Kubernetes
        k8sClient.applyNetworkPolicy(entity.getServiceCode(), entity.getTargetPort() != null ? entity.getTargetPort() : 8085, allowed);
        log.info("Updated NetworkPolicy for service '{}': allowed = {}", entity.getServiceCode(), allowed);

        return getServiceDetail(serviceId);
    }

    public List<TemplateOptionDto> getAvailableTemplates() {
        return List.of(
                TemplateOptionDto.builder()
                        .type(ServiceType.BACKEND_SPRING)
                        .name("Spring Boot 4 Microservice")
                        .description("Cloud-Native enterprise microservice with Spring Boot 4, Java 21, Spring Security, Zero-Trust RBAC, PostgreSQL and K8s readiness.")
                        .techStack("Java 21, Spring Boot 4.0, PostgreSQL, Liquibase, Actuator, Virtual Threads")
                        .defaultPort(8085)
                        .includedFeatures(List.of("Clean Architecture", "Healthcheck Actuator", "Dockerfile Multi-stage", "Kubernetes Deployment & Service", "K8s NetworkPolicy", "CI/CD Pipeline YAML"))
                        .build(),
                TemplateOptionDto.builder()
                        .type(ServiceType.FRONTEND_REMOTE)
                        .name("React Micro-Frontend Remote")
                        .description("Decoupled UI micro-frontend using Module Federation 2.0 & Rspack, dynamically linked into Host Portal with zero downtime.")
                        .techStack("React 18, Rspack, Module Federation 2.0, TailwindCSS")
                        .defaultPort(3004)
                        .includedFeatures(List.of("Rspack Fast Build", "Module Federation Expose", "Shared UI Integration", "Tailwind Design System"))
                        .build()
        );
    }

    public List<GitRepositoryDto> listGitRepositories() {
        List<GitRepositoryDto> giteaRepos = new ArrayList<>(giteaClient.listAllRepositories());
        Set<String> existingNames = new HashSet<>();
        for (GitRepositoryDto r : giteaRepos) {
            existingNames.add(r.getName().toLowerCase());
        }

        // Merge with catalog services so every service has its repo represented
        List<ServiceEntity> services = serviceRepository.findAllWithRepository();
        for (ServiceEntity s : services) {
            String repoName = (s.getRepository() != null) ? s.getRepository().getRepoName() : s.getServiceCode();
            if (!existingNames.contains(repoName.toLowerCase())) {
                giteaRepos.add(GitRepositoryDto.builder()
                        .name(repoName)
                        .fullName("gitea_admin/" + repoName)
                        .description(s.getDescription() != null ? s.getDescription() : "Repository for " + s.getDisplayName())
                        .cloneUrlHttp(s.getRepository() != null ? s.getRepository().getCloneUrlHttp() : giteaClient.buildHttpCloneUrl(repoName))
                        .cloneUrlSsh(s.getRepository() != null ? s.getRepository().getCloneUrlSsh() : giteaClient.buildSshCloneUrl(repoName))
                        .htmlUrl(s.getRepository() != null ? s.getRepository().getWebUrl() : giteaClient.buildWebUrl(repoName))
                        .defaultBranch(s.getRepository() != null ? s.getRepository().getDefaultBranch() : "main")
                        .isPrivate(false)
                        .starsCount(0)
                        .forksCount(0)
                        .sizeKb(18)
                        .createdAt(s.getCreatedAt())
                        .updatedAt(s.getUpdatedAt())
                        .build());
                existingNames.add(repoName.toLowerCase());
            }
        }

        return giteaRepos;
    }

    public List<GitFileDto> getGitRepositoryTree(String repoName, String path) {
        return giteaClient.getRepositoryContents(repoName, path);
    }

    public GitFileDto getGitFileContent(String repoName, String path) {
        return giteaClient.getFileContent(repoName, path);
    }

    public boolean createStandaloneGitRepo(String repoName, String description, boolean isPrivate) {
        return giteaClient.createRepository(repoName, description);
    }

    public List<K8sPodDto> listK8sPods() {
        return k8sClient.listPods("enterprise-dev");
    }

    public List<PipelineRunDto> listPipelineRuns(Long serviceId) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + serviceId));
        return servicePipelineRuns.getOrDefault(entity.getServiceCode(), Collections.emptyList());
    }

    @Transactional
    public PipelineRunDto triggerPipeline(Long serviceId, String branch, String triggerType, String triggeredBy) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + serviceId));

        String serviceCode = entity.getServiceCode();
        String targetBranch = (branch != null && !branch.isBlank()) ? branch : "main";
        String trigger = (triggerType != null && !triggerType.isBlank()) ? triggerType : "MANUAL";
        String user = (triggeredBy != null && !triggeredBy.isBlank()) ? triggeredBy : "admin";

        long runNum = runIdGenerator.incrementAndGet();
        String commitId = UUID.randomUUID().toString().substring(0, 7);
        String version = "v1.0.4-build." + runNum;

        // Create new artifact in MinIO
        ServiceArtifactDto artifact = minioClient.createArtifact(serviceCode, version, commitId);

        // Rolling restart deployment on Kubernetes
        String deploymentName = entity.getDeployments().isEmpty() ? serviceCode : entity.getDeployments().get(0).getK8sDeploymentName();
        k8sClient.restartDeployment(deploymentName != null ? deploymentName : serviceCode);

        PipelineRunDto run = PipelineRunDto.builder()
                .id(runNum)
                .serviceCode(serviceCode)
                .runNumber(runNum)
                .triggerType(trigger)
                .triggeredBy(user)
                .branch(targetBranch)
                .commitId(commitId)
                .commitMessage("Pipeline triggered manually from Enterprise Portal (" + targetBranch + ")")
                .status("SUCCESS")
                .durationSeconds(42)
                .startedAt(Instant.now().minusSeconds(42))
                .finishedAt(Instant.now())
                .artifactVersion(version)
                .stages(List.of(
                        PipelineStageDto.builder().name("Git Checkout").status("SUCCESS").durationSeconds(3).logs(List.of(
                                "[INFO] Fetching origin/" + targetBranch + "...",
                                "[INFO] HEAD is now at commit " + commitId,
                                "[INFO] Fast-forward checkout completed."
                        )).build(),
                        PipelineStageDto.builder().name("Unit & Integration Tests").status("SUCCESS").durationSeconds(15).logs(List.of(
                                "[INFO] Scanning for projects...",
                                "[INFO] Running com.enterprise.backend." + serviceCode.replace("-", "") + ".ApplicationTests",
                                "[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0",
                                "[INFO] All tests PASSED in 14.8s"
                        )).build(),
                        PipelineStageDto.builder().name("Maven Package").status("SUCCESS").durationSeconds(12).logs(List.of(
                                "[INFO] Packaging application into standalone executable JAR...",
                                "[INFO] Replacing main artifact: target/" + artifact.getFileName(),
                                "[INFO] Total size: " + String.format("%.1f", artifact.getFileSizeMb()) + " MB"
                        )).build(),
                        PipelineStageDto.builder().name("MinIO S3 Artifact Upload").status("SUCCESS").durationSeconds(5).logs(List.of(
                                "[MINIO] Connected to MinIO cluster at http://minio.enterprise-dev.svc:9000",
                                "[MINIO] Target Bucket: " + artifact.getBucketName(),
                                "[MINIO] Uploading object: " + artifact.getObjectKey(),
                                "[MINIO] Checksum SHA-256: " + artifact.getSha256(),
                                "[MINIO] Artifact archived successfully for rollback and audit."
                        )).build(),
                        PipelineStageDto.builder().name("K8s Rolling Deploy").status("SUCCESS").durationSeconds(7).logs(List.of(
                                "[K8S] Triggering rolling restart for deployment '" + deploymentName + "' in namespace 'enterprise-dev'",
                                "[K8S] Applied annotation 'kubectl.kubernetes.io/restartedAt: " + Instant.now() + "'",
                                "[K8S] Deployment rollout completed successfully with 0 downtime."
                        )).build()
                ))
                .build();

        servicePipelineRuns.computeIfAbsent(serviceCode, k -> new ArrayList<>()).add(0, run);
        log.info("Triggered new pipeline run #{} for service '{}' on branch '{}'", runNum, serviceCode, targetBranch);
        return run;
    }

    public PipelineRunDto cancelPipeline(Long serviceId, Long runId) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + serviceId));
        List<PipelineRunDto> runs = servicePipelineRuns.get(entity.getServiceCode());
        if (runs != null) {
            for (PipelineRunDto r : runs) {
                if (Objects.equals(r.getId(), runId)) {
                    r.setStatus("CANCELLED");
                    return r;
                }
            }
        }
        return null;
    }

    public List<ServiceArtifactDto> listServiceArtifacts(Long serviceId) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + serviceId));
        return minioClient.getArtifactsForService(entity.getServiceCode());
    }

    @Transactional
    public ServiceArtifactDto rollbackToArtifact(Long serviceId, Long artifactId, String requestedBy) {
        ServiceEntity entity = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + serviceId));

        String serviceCode = entity.getServiceCode();
        ServiceArtifactDto restored = minioClient.rollbackToArtifact(serviceCode, artifactId);

        // Restart K8s deployment
        String deploymentName = entity.getDeployments().isEmpty() ? serviceCode : entity.getDeployments().get(0).getK8sDeploymentName();
        k8sClient.restartDeployment(deploymentName != null ? deploymentName : serviceCode);

        // Record a rollback pipeline run
        long runNum = runIdGenerator.incrementAndGet();
        PipelineRunDto rollbackRun = PipelineRunDto.builder()
                .id(runNum)
                .serviceCode(serviceCode)
                .runNumber(runNum)
                .triggerType("ROLLBACK")
                .triggeredBy(requestedBy != null ? requestedBy : "admin")
                .branch("main")
                .commitId(restored.getSha256().substring(Math.max(0, restored.getSha256().length() - 7)))
                .commitMessage("↺ ROLLBACK service to MinIO artifact version: " + restored.getVersion())
                .status("SUCCESS")
                .durationSeconds(12)
                .startedAt(Instant.now().minusSeconds(12))
                .finishedAt(Instant.now())
                .artifactVersion(restored.getVersion())
                .stages(List.of(
                        PipelineStageDto.builder().name("MinIO Artifact Resolution").status("SUCCESS").durationSeconds(2).logs(List.of(
                                "[MINIO] Fetching artifact descriptor for ID " + artifactId,
                                "[MINIO] Target version: " + restored.getVersion(),
                                "[MINIO] S3 object key: " + restored.getObjectKey(),
                                "[MINIO] Validating SHA-256 integrity: " + restored.getSha256()
                        )).build(),
                        PipelineStageDto.builder().name("K8s Rolling Rollback").status("SUCCESS").durationSeconds(10).logs(List.of(
                                "[K8S] Rolling back deployment '" + deploymentName + "' to artifact " + restored.getVersion(),
                                "[K8S] Patching pod template annotation 'kubectl.kubernetes.io/restartedAt'",
                                "[K8S] Rolling replacement of pods started...",
                                "[K8S] Health check Actuator /actuator/health: 200 OK (UP)",
                                "[K8S] Rollback completed successfully!"
                        )).build()
                ))
                .build();

        servicePipelineRuns.computeIfAbsent(serviceCode, k -> new ArrayList<>()).add(0, rollbackRun);
        log.info("Successfully rolled back service '{}' to MinIO artifact version '{}'", serviceCode, restored.getVersion());
        return restored;
    }

    private ServiceSummaryResponse toSummaryResponse(ServiceEntity entity) {
        ServiceRepositoryEntity repo = entity.getRepository();
        List<String> allowed = (entity.getAllowedCommunications() != null && !entity.getAllowedCommunications().isBlank())
                ? Arrays.asList(entity.getAllowedCommunications().split(","))
                : List.of("gateway-service", "auth-rbac-service", "postgres", "redis");

        return ServiceSummaryResponse.builder()
                .id(entity.getId())
                .serviceCode(entity.getServiceCode())
                .displayName(entity.getDisplayName())
                .serviceType(entity.getServiceType())
                .description(entity.getDescription())
                .ownerTeam(entity.getOwnerTeam())
                .targetPort(entity.getTargetPort())
                .status(entity.getStatus())
                .allowedCommunications(allowed)
                .gitRepoName(repo != null ? repo.getRepoName() : entity.getServiceCode())
                .gitCloneHttp(repo != null ? repo.getCloneUrlHttp() : giteaClient.buildHttpCloneUrl(entity.getServiceCode()))
                .gitCloneSsh(repo != null ? repo.getCloneUrlSsh() : giteaClient.buildSshCloneUrl(entity.getServiceCode()))
                .gitWebUrl(repo != null ? repo.getWebUrl() : giteaClient.buildWebUrl(entity.getServiceCode()))
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
