package com.enterprise.backend.devops.application.dto;

import com.enterprise.backend.devops.domain.model.ServiceStatus;
import com.enterprise.backend.devops.domain.model.ServiceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceDetailResponse {
    private Long id;
    private String serviceCode;
    private String displayName;
    private ServiceType serviceType;
    private String description;
    private String ownerTeam;
    private Integer targetPort;
    private ServiceStatus status;
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    // Repository Details
    private String gitProvider;
    private String gitRepoName;
    private String gitCloneHttp;
    private String gitCloneSsh;
    private String gitWebUrl;
    private String defaultBranch;
    private java.util.List<String> allowedCommunications;

    // Live Git info
    private List<GitCommitDto> recentCommits;
    private List<GitBranchDto> branches;

    // Deployment preview
    private String environment;
    private String k8sNamespace;
    private String k8sDeploymentName;
    private Integer replicas;
    private String healthStatus;
}
