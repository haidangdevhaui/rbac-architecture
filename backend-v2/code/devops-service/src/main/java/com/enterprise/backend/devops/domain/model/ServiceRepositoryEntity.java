package com.enterprise.backend.devops.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "service_repositories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceRepositoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceEntity service;

    @Column(name = "git_provider", nullable = false, length = 32)
    private String gitProvider;

    @Column(name = "repo_name", nullable = false, length = 128)
    private String repoName;

    @Column(name = "clone_url_http", nullable = false, length = 256)
    private String cloneUrlHttp;

    @Column(name = "clone_url_ssh", length = 256)
    private String cloneUrlSsh;

    @Column(name = "web_url", length = 256)
    private String webUrl;

    @Column(name = "default_branch", length = 32)
    @Builder.Default
    private String defaultBranch = "main";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (defaultBranch == null) defaultBranch = "main";
    }
}
