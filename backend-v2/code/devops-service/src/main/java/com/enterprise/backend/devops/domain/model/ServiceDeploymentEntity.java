package com.enterprise.backend.devops.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "service_deployments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceDeploymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceEntity service;

    @Column(name = "environment", nullable = false, length = 32)
    private String environment;

    @Column(name = "k8s_namespace", length = 64)
    private String k8sNamespace;

    @Column(name = "k8s_deployment_name", length = 128)
    private String k8sDeploymentName;

    @Column(name = "replicas")
    @Builder.Default
    private Integer replicas = 1;

    @Column(name = "health_status", length = 32)
    @Builder.Default
    private String healthStatus = "HEALTHY";

    @Column(name = "last_deployed_at")
    private Instant lastDeployedAt;
}
