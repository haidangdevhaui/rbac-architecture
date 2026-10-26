package com.enterprise.backend.devops.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceArtifactDto {
    private Long id;
    private String serviceCode;
    private String version;
    private String fileName;
    private String bucketName;
    private String objectKey;
    private Double fileSizeMb;
    private String sha256;
    private String downloadUrl;
    private Instant createdAt;
    private boolean isCurrentDeployed;
    private String k8sImageTag;
}
