package com.enterprise.backend.devops.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitFileDto {
    private String name;
    private String path;
    private String type; // "file" or "dir"
    private long size;
    private String content; // text content if file
    private String encoding; // "base64" or "utf-8"
}
