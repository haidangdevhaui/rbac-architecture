package com.enterprise.backend.devops.application.dto;

import com.enterprise.backend.devops.domain.model.ServiceStatus;
import com.enterprise.backend.devops.domain.model.ServiceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceSummaryResponse {
    private Long id;
    private String serviceCode;
    private String displayName;
    private ServiceType serviceType;
    private String description;
    private String ownerTeam;
    private Integer targetPort;
    private ServiceStatus status;
    private String gitRepoName;
    private String gitCloneHttp;
    private String gitCloneSsh;
    private String gitWebUrl;
    private java.util.List<String> allowedCommunications;
    private String createdBy;
    private Instant createdAt;
}
