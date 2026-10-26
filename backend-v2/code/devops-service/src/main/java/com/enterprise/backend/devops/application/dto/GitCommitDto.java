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
public class GitCommitDto {
    private String id;
    private String shortId;
    private String message;
    private String authorName;
    private String authorEmail;
    private Instant timestamp;
}
