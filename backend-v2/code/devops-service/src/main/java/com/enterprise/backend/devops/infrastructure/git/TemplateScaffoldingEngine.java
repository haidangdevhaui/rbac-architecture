package com.enterprise.backend.devops.infrastructure.git;

import com.enterprise.backend.devops.domain.model.ServiceType;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class TemplateScaffoldingEngine {

    public Map<String, String> generateScaffoldingFiles(String serviceCode, String displayName, ServiceType serviceType, Integer port) {
        return generateScaffoldingFiles(serviceCode, displayName, serviceType, port, List.of("gateway-service", "auth-rbac-service", "postgres", "redis"));
    }

    public Map<String, String> generateScaffoldingFiles(String serviceCode, String displayName, ServiceType serviceType, Integer port, List<String> allowedCommunications) {
        int targetPort = (port != null && port > 0) ? port : 8085;
        Map<String, String> files = new LinkedHashMap<>();

        List<String> allowed = (allowedCommunications != null && !allowedCommunications.isEmpty())
                ? allowedCommunications
                : List.of("gateway-service", "auth-rbac-service", "postgres", "redis");

        switch (serviceType) {
            case BACKEND_SPRING -> generateSpringBootTemplate(files, serviceCode, displayName, targetPort, allowed);
            case FRONTEND_REMOTE -> generateReactRemoteTemplate(files, serviceCode, displayName, targetPort, allowed);
            default -> generateSpringBootTemplate(files, serviceCode, displayName, targetPort, allowed);
        }

        return files;
    }

    private void generateSpringBootTemplate(Map<String, String> files, String serviceCode, String displayName, int port, List<String> allowedServices) {
        String javaPackageName = serviceCode.replace("-", "").toLowerCase();
        String className = toPascalCase(serviceCode) + "Application";

        // 1. README.md
        files.put("README.md", String.format("""
                # %s (%s)
                
                Enterprise Cloud-Native Microservice initialized from Enterprise Portal.
                
                ## Architecture & Technical Stack
                - **Service Code**: `%s`
                - **Target Port**: `%d`
                - **Architecture**: Spring Boot 4.0, Java 21, Spring Security, Zero-Trust RBAC, PostgreSQL 16
                - **API Gateway Path**: `http://localhost:8080/api/v1/%s/**`
                - **Network Isolation**: Kubernetes NetworkPolicy enforced (Allowed: %s)
                
                ## Local Run
                ```bash
                mvn spring-boot:run
                ```
                
                ## CI/CD Pipeline & MinIO Artifacts
                Each commit triggers automated test packaging into .jar, archives into MinIO S3 Object Storage, and performs rolling restart on Kubernetes.
                """, displayName, serviceCode, serviceCode, port, serviceCode.replace("-service", "s"), String.join(", ", allowedServices)));

        // 2. pom.xml
        files.put("pom.xml", String.format("""
                <?xml version="1.0" encoding="UTF-8"?>
                <project xmlns="http://maven.apache.org/POM/4.0.0"
                         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
                    <modelVersion>4.0.0</modelVersion>
                    <parent>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-starter-parent</artifactId>
                        <version>4.0.0</version>
                        <relativePath/>
                    </parent>
                    <groupId>com.enterprise.backend</groupId>
                    <artifactId>%s</artifactId>
                    <version>1.0.0-SNAPSHOT</version>
                    <name>%s</name>
                    <description>%s - Built with Spring Boot 4 &amp; Java 21</description>
                    <properties>
                        <java.version>21</java.version>
                    </properties>
                    <dependencies>
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-starter-web</artifactId>
                        </dependency>
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-starter-security</artifactId>
                        </dependency>
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-starter-actuator</artifactId>
                        </dependency>
                    </dependencies>
                </project>
                """, serviceCode, serviceCode, displayName));

        // 3. Application.java
        files.put("src/main/java/com/enterprise/backend/" + javaPackageName + "/" + className + ".java", String.format("""
                package com.enterprise.backend.%s;

                import org.springframework.boot.SpringApplication;
                import org.springframework.boot.autoconfigure.SpringBootApplication;
                import org.springframework.web.bind.annotation.GetMapping;
                import org.springframework.web.bind.annotation.RestController;
                import java.util.Map;

                @SpringBootApplication
                @RestController
                public class %s {

                    public static void main(String[] args) {
                        SpringApplication.run(%s.class, args);
                    }

                    @GetMapping("/api/v1/%s/ping")
                    public Map<String, Object> ping() {
                        return Map.of(
                            "service", "%s",
                            "framework", "Spring Boot 4.0",
                            "javaVersion", "21",
                            "status", "UP",
                            "timestamp", System.currentTimeMillis()
                        );
                    }
                }
                """, javaPackageName, className, className, serviceCode, serviceCode));

        // 4. application.yml
        files.put("src/main/resources/application.yml", String.format("""
                server:
                  port: %d

                spring:
                  application:
                    name: %s

                management:
                  endpoints:
                    web:
                      exposure:
                        include: health,info,metrics
                """, port, serviceCode));

        // 5. Dockerfile
        files.put("Dockerfile", """
                FROM maven:3.9.9-eclipse-temurin-21 AS builder
                WORKDIR /build
                COPY pom.xml .
                COPY src src
                RUN mvn clean package -DskipTests

                FROM eclipse-temurin:21-jre-alpine
                WORKDIR /app
                COPY --from=builder /build/target/*.jar app.jar
                ENTRYPOINT ["java", "-XX:+UseG1GC", "-jar", "app.jar"]
                """);

        // 6. Kubernetes Deployment & Service Manifest
        files.put("k8s/deployment.yaml", String.format("""
                apiVersion: apps/v1
                kind: Deployment
                metadata:
                  name: %s
                  namespace: enterprise-dev
                  labels:
                    app: %s
                    framework: spring-boot-4
                spec:
                  replicas: 1
                  selector:
                    matchLabels:
                      app: %s
                  template:
                    metadata:
                      labels:
                        app: %s
                    spec:
                      containers:
                        - name: %s
                          image: enterprise/%s:latest
                          ports:
                            - containerPort: %d
                          livenessProbe:
                            httpGet:
                              path: /actuator/health
                              port: %d
                            initialDelaySeconds: 20
                            periodSeconds: 10
                ---
                apiVersion: v1
                kind: Service
                metadata:
                  name: %s
                  namespace: enterprise-dev
                spec:
                  selector:
                    app: %s
                  ports:
                    - port: %d
                      targetPort: %d
                """, serviceCode, serviceCode, serviceCode, serviceCode, serviceCode, serviceCode, port, port, serviceCode, serviceCode, port, port));

        // 7. Kubernetes NetworkPolicy Manifest (Zero-Trust Inter-service Security)
        StringBuilder egressRules = new StringBuilder();
        // CoreDNS always allowed for DNS resolution
        egressRules.append("""
                    # 1. Allow CoreDNS for internal Kubernetes service discovery
                    - ports:
                        - protocol: UDP
                          port: 53
                        - protocol: TCP
                          port: 53
                """);

        for (String allowedSvc : allowedServices) {
            int svcPort = switch (allowedSvc) {
                case "postgres" -> 5432;
                case "redis" -> 6379;
                case "minio" -> 9000;
                case "auth-rbac-service" -> 8081;
                case "inventory-service" -> 8082;
                case "order-service" -> 8083;
                case "gateway-service" -> 8080;
                default -> 8080;
            };

            egressRules.append(String.format("""
                    # Allow communication to %s
                    - to:
                        - podSelector:
                            matchLabels:
                              app: %s
                      ports:
                        - protocol: TCP
                          port: %d
                """, allowedSvc, allowedSvc, svcPort));
        }

        files.put("k8s/network-policy.yaml", String.format("""
                apiVersion: networking.k8s.io/v1
                kind: NetworkPolicy
                metadata:
                  name: %s-netpol
                  namespace: enterprise-dev
                  labels:
                    app: %s
                spec:
                  podSelector:
                    matchLabels:
                      app: %s
                  policyTypes:
                    - Ingress
                    - Egress
                  ingress:
                    # Ingress allowed from API Gateway (Spring Cloud Gateway)
                    - from:
                        - podSelector:
                            matchLabels:
                              app: gateway-service
                      ports:
                        - protocol: TCP
                          port: %d
                  egress:
                %s
                """, serviceCode, serviceCode, serviceCode, port, egressRules));

        // 8. CI/CD Pipeline definition (.woodpecker.yml)
        files.put(".woodpecker.yml", String.format("""
                pipeline:
                  build:
                    image: maven:3.9.9-eclipse-temurin-21
                    commands:
                      - mvn clean package -DskipTests

                  minio-archive:
                    image: minio/mc:latest
                    commands:
                      - mc alias set local http://minio.enterprise-dev.svc:9000 minioadmin minioadmin123
                      - mc cp target/*.jar local/enterprise-artifacts/%s/latest/

                  deploy:
                    image: bitnami/kubectl:latest
                    commands:
                      - kubectl apply -f k8s/deployment.yaml
                      - kubectl apply -f k8s/network-policy.yaml
                """, serviceCode));
    }

    private void generateReactRemoteTemplate(Map<String, String> files, String serviceCode, String displayName, int port, List<String> allowedServices) {
        files.put("README.md", String.format("# %s\n\nReact Micro-Frontend Remote Module (Module Federation 2.0)", displayName));
        files.put("package.json", String.format("""
                {
                  "name": "%s",
                  "version": "1.0.0",
                  "scripts": {
                    "dev": "rspack serve --port %d",
                    "build": "rspack build"
                  }
                }
                """, serviceCode, port));

        // Network policy for frontend remote
        files.put("k8s/network-policy.yaml", String.format("""
                apiVersion: networking.k8s.io/v1
                kind: NetworkPolicy
                metadata:
                  name: %s-netpol
                  namespace: enterprise-dev
                  labels:
                    app: %s
                spec:
                  podSelector:
                    matchLabels:
                      app: %s
                  policyTypes:
                    - Ingress
                    - Egress
                  ingress:
                    - ports:
                        - protocol: TCP
                          port: %d
                  egress:
                    - ports:
                        - protocol: UDP
                          port: 53
                        - protocol: TCP
                          port: 53
                """, serviceCode, serviceCode, serviceCode, port));
    }

    private String toPascalCase(String input) {
        StringBuilder result = new StringBuilder();
        boolean capitalizeNext = true;
        for (char c : input.toCharArray()) {
            if (c == '-' || c == '_') {
                capitalizeNext = true;
            } else if (capitalizeNext) {
                result.append(Character.toUpperCase(c));
                capitalizeNext = false;
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }
}
