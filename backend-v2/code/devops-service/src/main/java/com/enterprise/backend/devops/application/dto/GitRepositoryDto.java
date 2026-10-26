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
public class GitRepositoryDto {
    private String name;
    private String fullName;
    private String description;
    private String cloneUrlHttp;
    private String cloneUrlSsh;
    private String htmlUrl;
    private String defaultBranch;
    private boolean isPrivate;
    private int starsCount;
    private int forksCount;
    private long sizeKb;
    private Instant createdAt;
    private Instant updatedAt;
}
