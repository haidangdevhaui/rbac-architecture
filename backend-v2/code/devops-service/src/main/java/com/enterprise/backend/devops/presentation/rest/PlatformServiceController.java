package com.enterprise.backend.devops.presentation.rest;

import com.enterprise.backend.devops.application.dto.*;
import com.enterprise.backend.devops.application.service.PlatformService;
import com.enterprise.backend.security.annotation.CurrentUser;
import com.enterprise.backend.security.context.UserContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/platform")
@RequiredArgsConstructor
public class PlatformServiceController {

    private final PlatformService platformService;

    @GetMapping("/services")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:service:read')")
    public ResponseEntity<List<ServiceSummaryResponse>> listServices() {
        return ResponseEntity.ok(platformService.listServices());
    }

    @GetMapping("/services/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:service:read')")
    public ResponseEntity<ServiceDetailResponse> getServiceDetail(@PathVariable Long id) {
        return ResponseEntity.ok(platformService.getServiceDetail(id));
    }

    @PostMapping("/services")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:service:create')")
    public ResponseEntity<ServiceDetailResponse> createService(
            @Valid @RequestBody CreateServiceRequest request,
            @CurrentUser UserContext currentUser) {
        String createdBy = (currentUser != null && currentUser.getUsername() != null)
                ? currentUser.getUsername()
                : "ADMIN";

        ServiceDetailResponse created = platformService.createService(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/services/{id}/toggle-power")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:service:create')")
    public ResponseEntity<ServiceDetailResponse> toggleServicePower(@PathVariable Long id) {
        return ResponseEntity.ok(platformService.toggleServicePower(id));
    }

    @GetMapping("/git/repos")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:git:read')")
    public ResponseEntity<List<GitRepositoryDto>> listGitRepositories() {
        return ResponseEntity.ok(platformService.listGitRepositories());
    }

    @GetMapping("/git/repos/{repoName}/tree")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:git:read')")
    public ResponseEntity<List<GitFileDto>> getGitRepositoryTree(
            @PathVariable String repoName,
            @RequestParam(required = false, defaultValue = "") String path) {
        return ResponseEntity.ok(platformService.getGitRepositoryTree(repoName, path));
    }

    @GetMapping("/git/repos/{repoName}/file")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:git:read')")
    public ResponseEntity<GitFileDto> getGitFileContent(
            @PathVariable String repoName,
            @RequestParam String path) {
        return ResponseEntity.ok(platformService.getGitFileContent(repoName, path));
    }

    @PostMapping("/git/repos")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:git:read')")
    public ResponseEntity<Boolean> createGitRepository(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String desc = (String) body.get("description");
        Boolean isPrivate = (Boolean) body.getOrDefault("private", false);
        return ResponseEntity.ok(platformService.createStandaloneGitRepo(name, desc, isPrivate));
    }

    @GetMapping("/k8s/pods")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:k8s:view')")
    public ResponseEntity<List<K8sPodDto>> listPods() {
        return ResponseEntity.ok(platformService.listK8sPods());
    }

    @GetMapping("/templates")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:service:read')")
    public ResponseEntity<List<TemplateOptionDto>> getTemplates() {
        return ResponseEntity.ok(platformService.getAvailableTemplates());
    }

    @GetMapping("/services/{id}/pipelines")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:service:read')")
    public ResponseEntity<List<PipelineRunDto>> listPipelineRuns(@PathVariable Long id) {
        return ResponseEntity.ok(platformService.listPipelineRuns(id));
    }

    @PostMapping("/services/{id}/pipelines/trigger")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:service:create')")
    public ResponseEntity<PipelineRunDto> triggerPipeline(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @CurrentUser UserContext currentUser) {
        String branch = (body != null) ? body.get("branch") : "main";
        String triggerType = (body != null) ? body.getOrDefault("triggerType", "MANUAL") : "MANUAL";
        String username = (currentUser != null && currentUser.getUsername() != null) ? currentUser.getUsername() : "admin";
        return ResponseEntity.ok(platformService.triggerPipeline(id, branch, triggerType, username));
    }

    @PostMapping("/services/{id}/pipelines/{runId}/cancel")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:service:create')")
    public ResponseEntity<PipelineRunDto> cancelPipeline(
            @PathVariable Long id,
            @PathVariable Long runId) {
        return ResponseEntity.ok(platformService.cancelPipeline(id, runId));
    }

    @GetMapping("/services/{id}/artifacts")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:service:read')")
    public ResponseEntity<List<ServiceArtifactDto>> listServiceArtifacts(@PathVariable Long id) {
        return ResponseEntity.ok(platformService.listServiceArtifacts(id));
    }

    @PostMapping("/services/{id}/artifacts/{artifactId}/rollback")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:service:create')")
    public ResponseEntity<ServiceArtifactDto> rollbackToArtifact(
            @PathVariable Long id,
            @PathVariable Long artifactId,
            @CurrentUser UserContext currentUser) {
        String username = (currentUser != null && currentUser.getUsername() != null) ? currentUser.getUsername() : "admin";
        return ResponseEntity.ok(platformService.rollbackToArtifact(id, artifactId, username));
    }

    @PutMapping("/services/{id}/network-policy")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('platform:service:create')")
    public ResponseEntity<ServiceDetailResponse> updateNetworkPolicy(
            @PathVariable Long id,
            @RequestBody Map<String, List<String>> body) {
        List<String> allowedCommunications = body.getOrDefault("allowedCommunications", List.of());
        return ResponseEntity.ok(platformService.updateNetworkPolicy(id, allowedCommunications));
    }
}
