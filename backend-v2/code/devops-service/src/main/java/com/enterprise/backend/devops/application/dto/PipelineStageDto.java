package com.enterprise.backend.devops.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineStageDto {
    private String name;
    private String status; // SUCCESS, RUNNING, PENDING, FAILED
    private Integer durationSeconds;
    private List<String> logs;
}
