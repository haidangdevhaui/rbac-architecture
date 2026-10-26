package com.enterprise.backend.devops.application.dto;

import com.enterprise.backend.devops.domain.model.ServiceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateServiceRequest {

    @NotBlank(message = "Service code is required")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Service code must contain only lowercase alphanumeric characters and hyphens")
    @Size(min = 3, max = 50, message = "Service code length must be between 3 and 50 characters")
    private String serviceCode;

    @NotBlank(message = "Display name is required")
    @Size(max = 120, message = "Display name must not exceed 120 characters")
    private String displayName;

    @NotNull(message = "Service type is required")
    private ServiceType serviceType;

    private String description;

    private String ownerTeam;

    private Integer targetPort;

    @Builder.Default
    private java.util.List<String> allowedCommunications = java.util.List.of("gateway-service", "auth-rbac-service", "postgres", "redis");

    @Builder.Default
    private boolean initGitRepo = true;

    @Builder.Default
    private boolean generateBoilerplate = true;
}
