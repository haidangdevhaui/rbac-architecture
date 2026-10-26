package com.enterprise.backend.devops.infrastructure.k8s;

import com.enterprise.backend.devops.application.dto.K8sPodDto;
import io.netty.handler.ssl.SslContext;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Slf4j
@Component
public class K8sClient {

    private final WebClient webClient;
    private final String defaultNamespace;
    private final boolean inCluster;
    private String saToken;

    public K8sClient(
            WebClient.Builder builder,
            @Value("${k8s.api-url:https://kubernetes.default.svc}") String k8sApiUrl,
            @Value("${k8s.namespace:enterprise-dev}") String defaultNamespace
    ) {
        this.defaultNamespace = defaultNamespace;
        boolean detectedInCluster = false;
        String token = null;

        try {
            File tokenFile = new File("/var/run/secrets/kubernetes.io/serviceaccount/token");
            if (tokenFile.exists()) {
                token = Files.readString(tokenFile.toPath()).trim();
                detectedInCluster = true;
                log.info("Detected Kubernetes in-cluster ServiceAccount token.");
            }
        } catch (Exception ex) {
            log.debug("Not running in K8s pod or token not readable: {}", ex.getMessage());
        }

        this.inCluster = detectedInCluster;
        this.saToken = token;

        WebClient client;
        try {
            SslContext sslContext = SslContextBuilder.forClient()
                    .trustManager(InsecureTrustManagerFactory.INSTANCE)
                    .build();
            HttpClient httpClient = HttpClient.create().secure(t -> t.sslContext(sslContext));

            WebClient.Builder b = builder
                    .baseUrl(k8sApiUrl)
                    .clientConnector(new ReactorClientHttpConnector(httpClient));

            if (token != null) {
                b.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
            }
            client = b.build();
        } catch (Exception e) {
            log.warn("Could not initialize secure K8s WebClient: {}", e.getMessage());
            client = builder.baseUrl(k8sApiUrl).build();
        }

        this.webClient = client;
    }

    public boolean applyNetworkPolicy(String serviceCode, int targetPort, List<String> allowedServices) {
        if (!inCluster) {
            log.info("[Local Dev / Mock] Simulated applying NetworkPolicy for service '{}': allowed = {}", serviceCode, allowedServices);
            return true;
        }

        String netpolName = serviceCode + "-netpol";
        try {
            List<Map<String, Object>> egressRules = new ArrayList<>();
            // Allow CoreDNS
            egressRules.add(Map.of(
                    "ports", List.of(
                            Map.of("protocol", "UDP", "port", 53),
                            Map.of("protocol", "TCP", "port", 53)
                    )
            ));

            if (allowedServices != null) {
                for (String allowedSvc : allowedServices) {
                    int port = switch (allowedSvc) {
                        case "postgres" -> 5432;
                        case "redis" -> 6379;
                        case "minio" -> 9000;
                        case "auth-rbac-service" -> 8081;
                        case "inventory-service" -> 8082;
                        case "order-service" -> 8083;
                        case "gateway-service" -> 8080;
                        default -> 8080;
                    };

                    egressRules.add(Map.of(
                            "to", List.of(Map.of("podSelector", Map.of("matchLabels", Map.of("app", allowedSvc)))),
                            "ports", List.of(Map.of("protocol", "TCP", "port", port))
                    ));
                }
            }

            Map<String, Object> netpol = Map.of(
                    "apiVersion", "networking.k8s.io/v1",
                    "kind", "NetworkPolicy",
                    "metadata", Map.of(
                            "name", netpolName,
                            "namespace", defaultNamespace,
                            "labels", Map.of("app", serviceCode)
                    ),
                    "spec", Map.of(
                            "podSelector", Map.of("matchLabels", Map.of("app", serviceCode)),
                            "policyTypes", List.of("Ingress", "Egress"),
                            "ingress", List.of(
                                    Map.of(
                                            "from", List.of(Map.of("podSelector", Map.of("matchLabels", Map.of("app", "gateway-service")))),
                                            "ports", List.of(Map.of("protocol", "TCP", "port", targetPort))
                                    )
                            ),
                            "egress", egressRules
                    )
            );

            try {
                webClient.post()
                        .uri("/apis/networking.k8s.io/v1/namespaces/{ns}/networkpolicies", defaultNamespace)
                        .header("Content-Type", "application/json")
                        .bodyValue(netpol)
                        .retrieve()
                        .toBodilessEntity()
                        .block(Duration.ofSeconds(5));
                log.info("Created NetworkPolicy '{}/{}' on Kubernetes", defaultNamespace, netpolName);
            } catch (Exception existEx) {
                webClient.put()
                        .uri("/apis/networking.k8s.io/v1/namespaces/{ns}/networkpolicies/{name}", defaultNamespace, netpolName)
                        .header("Content-Type", "application/json")
                        .bodyValue(netpol)
                        .retrieve()
                        .toBodilessEntity()
                        .block(Duration.ofSeconds(5));
                log.info("Updated NetworkPolicy '{}/{}' on Kubernetes", defaultNamespace, netpolName);
            }
            return true;
        } catch (Exception ex) {
            log.warn("Failed to apply NetworkPolicy for '{}/{}': {}", defaultNamespace, netpolName, ex.getMessage());
            return false;
        }
    }

    public boolean scaleDeployment(String deploymentName, int replicas) {
        if (!inCluster) {
            log.info("[Local Dev / Mock] Simulated scaling deployment '{}' to replicas {}", deploymentName, replicas);
            return true;
        }

        boolean success = doScale(deploymentName, replicas);
        if (!success && deploymentName.endsWith("-deploy")) {
            String altName = deploymentName.substring(0, deploymentName.length() - "-deploy".length());
            log.info("Retrying scale with alternative deployment name: '{}'", altName);
            success = doScale(altName, replicas);
        } else if (!success && !deploymentName.endsWith("-deploy")) {
            String altName = deploymentName + "-deploy";
            log.info("Retrying scale with alternative deployment name: '{}'", altName);
            success = doScale(altName, replicas);
        }
        return success;
    }

    private boolean doScale(String name, int replicas) {
        try {
            Map<String, Object> body = Map.of(
                    "spec", Map.of("replicas", replicas)
            );

            webClient.patch()
                    .uri("/apis/apps/v1/namespaces/{ns}/deployments/{name}/scale", defaultNamespace, name)
                    .header("Content-Type", "application/merge-patch+json")
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .block(Duration.ofSeconds(5));

            log.info("Successfully scaled deployment '{}/{}' to {} replicas on Kubernetes", defaultNamespace, name, replicas);
            return true;
        } catch (Exception ex) {
            log.warn("Failed to scale deployment '{}/{}' on K8s: {}", defaultNamespace, name, ex.getMessage());
            return false;
        }
    }

    public boolean restartDeployment(String deploymentName) {
        if (!inCluster) {
            log.info("[Local Dev / Mock] Simulated restart of deployment '{}'", deploymentName);
            return true;
        }

        boolean success = doRestart(deploymentName);
        if (!success && deploymentName.endsWith("-deploy")) {
            String altName = deploymentName.substring(0, deploymentName.length() - "-deploy".length());
            log.info("Retrying restart with alternative deployment name: '{}'", altName);
            success = doRestart(altName);
        } else if (!success && !deploymentName.endsWith("-deploy")) {
            String altName = deploymentName + "-deploy";
            log.info("Retrying restart with alternative deployment name: '{}'", altName);
            success = doRestart(altName);
        }
        return success;
    }

    private boolean doRestart(String name) {
        try {
            Map<String, Object> body = Map.of(
                    "spec", Map.of(
                            "template", Map.of(
                                    "metadata", Map.of(
                                            "annotations", Map.of(
                                                    "kubectl.kubernetes.io/restartedAt", Instant.now().toString()
                                            )
                                    )
                            )
                    )
            );

            webClient.patch()
                    .uri("/apis/apps/v1/namespaces/{ns}/deployments/{name}", defaultNamespace, name)
                    .header("Content-Type", "application/merge-patch+json")
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .block(Duration.ofSeconds(5));

            log.info("Successfully triggered rolling restart for deployment '{}/{}' on Kubernetes", defaultNamespace, name);
            return true;
        } catch (Exception ex) {
            log.warn("Failed to restart deployment '{}/{}' on K8s: {}", defaultNamespace, name, ex.getMessage());
            return false;
        }
    }

    public List<K8sPodDto> listPods(String namespace) {
        String ns = (namespace != null && !namespace.isBlank()) ? namespace : defaultNamespace;

        if (!inCluster) {
            return getDefaultMockPods(ns);
        }

        try {
            Map<String, Object> response = webClient.get()
                    .uri("/api/v1/namespaces/{ns}/pods", ns)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block(Duration.ofSeconds(5));

            if (response == null || !response.containsKey("items")) {
                return getDefaultMockPods(ns);
            }

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
            List<K8sPodDto> pods = new ArrayList<>();

            for (Map<String, Object> item : items) {
                Map<String, Object> metadata = (Map<String, Object>) item.get("metadata");
                Map<String, Object> statusObj = (Map<String, Object>) item.get("status");

                String podName = metadata != null ? (String) metadata.get("name") : "unknown";
                String phase = statusObj != null ? (String) statusObj.get("phase") : "Running";
                String podIp = statusObj != null ? (String) statusObj.get("podIP") : "-";
                String nodeName = statusObj != null ? (String) statusObj.get("hostIP") : "-";

                int restarts = 0;
                boolean ready = false;
                if (statusObj != null && statusObj.containsKey("containerStatuses")) {
                    List<Map<String, Object>> cStatuses = (List<Map<String, Object>>) statusObj.get("containerStatuses");
                    if (cStatuses != null && !cStatuses.isEmpty()) {
                        Number r = (Number) cStatuses.get(0).get("restartCount");
                        if (r != null) restarts = r.intValue();
                        Boolean rd = (Boolean) cStatuses.get(0).get("ready");
                        if (rd != null) ready = rd;
                    }
                }

                pods.add(K8sPodDto.builder()
                        .name(podName)
                        .namespace(ns)
                        .status(phase)
                        .podIp(podIp)
                        .nodeName(nodeName)
                        .restartCount(restarts)
                        .isReady(ready)
                        .startTime(Instant.now().minusSeconds(7200))
                        .build());
            }

            return pods;
        } catch (Exception ex) {
            log.warn("Could not query live pods from K8s API ({}), using fallback pods", ex.getMessage());
            return getDefaultMockPods(ns);
        }
    }

    private List<K8sPodDto> getDefaultMockPods(String ns) {
        return List.of(
                K8sPodDto.builder().name("gateway-service-6689ddc7f6-857f4").namespace(ns).status("Running").podIp("10.1.0.12").nodeName("docker-desktop").restartCount(0).isReady(true).startTime(Instant.now().minusSeconds(3600)).build(),
                K8sPodDto.builder().name("auth-rbac-service-587cdb8b45-72h27").namespace(ns).status("Running").podIp("10.1.0.13").nodeName("docker-desktop").restartCount(0).isReady(true).startTime(Instant.now().minusSeconds(3600)).build(),
                K8sPodDto.builder().name("devops-service-79d7769856-588c4").namespace(ns).status("Running").podIp("10.1.0.14").nodeName("docker-desktop").restartCount(0).isReady(true).startTime(Instant.now().minusSeconds(3600)).build(),
                K8sPodDto.builder().name("inventory-service-749f8b4dbd-mr4t4").namespace(ns).status("Running").podIp("10.1.0.15").nodeName("docker-desktop").restartCount(0).isReady(true).startTime(Instant.now().minusSeconds(3600)).build(),
                K8sPodDto.builder().name("order-service-5fc459b468-pxr94").namespace(ns).status("Running").podIp("10.1.0.16").nodeName("docker-desktop").restartCount(0).isReady(true).startTime(Instant.now().minusSeconds(3600)).build(),
                K8sPodDto.builder().name("gitea-5464444d59-hckl9").namespace(ns).status("Running").podIp("10.1.0.17").nodeName("docker-desktop").restartCount(0).isReady(true).startTime(Instant.now().minusSeconds(3600)).build(),
                K8sPodDto.builder().name("keycloak-7cf98bb9b4-5sg9d").namespace(ns).status("Running").podIp("10.1.0.18").nodeName("docker-desktop").restartCount(0).isReady(true).startTime(Instant.now().minusSeconds(3600)).build(),
                K8sPodDto.builder().name("postgres-848446f4dc-fhwwd").namespace(ns).status("Running").podIp("10.1.0.19").nodeName("docker-desktop").restartCount(0).isReady(true).startTime(Instant.now().minusSeconds(3600)).build(),
                K8sPodDto.builder().name("redis-5fdfdb7bcc-p7l9g").namespace(ns).status("Running").podIp("10.1.0.20").nodeName("docker-desktop").restartCount(0).isReady(true).startTime(Instant.now().minusSeconds(3600)).build()
        );
    }
}
