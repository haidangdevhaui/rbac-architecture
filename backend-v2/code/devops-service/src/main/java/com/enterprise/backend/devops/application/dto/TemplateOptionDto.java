package com.enterprise.backend.devops.application.dto;

import com.enterprise.backend.devops.domain.model.ServiceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateOptionDto {
    private ServiceType type;
    private String name;
    private String description;
    private String techStack;
    private Integer defaultPort;
    private List<String> includedFeatures;
}
