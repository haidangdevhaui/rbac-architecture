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
public class K8sPodDto {
    private String name;
    private String namespace;
    private String status;
    private String podIp;
    private String nodeName;
    private int restartCount;
    private boolean isReady;
    private Instant startTime;
}
