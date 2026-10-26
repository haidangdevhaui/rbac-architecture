package com.enterprise.backend.devops.application.dto;

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
public class PipelineRunDto {
    private Long id;
    private String serviceCode;
    private Long runNumber;
    private String triggerType; // MANUAL, GIT_PUSH, SCHEDULE
    private String triggeredBy;
    private String branch;
    private String commitId;
    private String commitMessage;
    private String status; // RUNNING, SUCCESS, FAILED, CANCELLED
    private Integer durationSeconds;
    private Instant startedAt;
    private Instant finishedAt;
    private String artifactVersion;
    private List<PipelineStageDto> stages;
}
