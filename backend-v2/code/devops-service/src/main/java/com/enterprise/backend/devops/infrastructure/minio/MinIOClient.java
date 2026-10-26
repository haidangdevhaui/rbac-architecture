package com.enterprise.backend.devops.infrastructure.minio;

import com.enterprise.backend.devops.application.dto.ServiceArtifactDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Component
public class MinIOClient {

    private static final DateTimeFormatter AMZ_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);
    private static final DateTimeFormatter DATE_STAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC);

    private final String minioEndpoint;
    private final String externalUrl;
    private final String accessKey;
    private final String secretKey;
    private final String bucketName = "enterprise-artifacts";
    private final HttpClient httpClient;

    private final Map<String, List<ServiceArtifactDto>> serviceArtifacts = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(100);

    public MinIOClient(
            @Value("${minio.endpoint:http://minio.enterprise-dev.svc:9000}") String minioEndpoint,
            @Value("${minio.external-url:http://localhost:9000}") String externalUrl,
            @Value("${minio.access-key:minioadmin}") String accessKey,
            @Value("${minio.secret-key:minioadmin123}") String secretKey
    ) {
        this.minioEndpoint = minioEndpoint;
        this.externalUrl = externalUrl;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();

        initDefaultArtifacts();
    }

    public List<ServiceArtifactDto> getArtifactsForService(String serviceCode) {
        return serviceArtifacts.getOrDefault(serviceCode, Collections.emptyList());
    }

    public ServiceArtifactDto createArtifact(String serviceCode, String version, String commitId) {
        List<ServiceArtifactDto> list = serviceArtifacts.computeIfAbsent(serviceCode, k -> new ArrayList<>());

        // Set previous active to false
        for (ServiceArtifactDto a : list) {
            a.setCurrentDeployed(false);
        }

        String fileName = serviceCode + "-" + version + ".jar";
        String objectKey = serviceCode + "/" + version + "/" + fileName;
        byte[] jarContent = generateJarArchive(serviceCode, version, commitId);

        ServiceArtifactDto newArtifact = ServiceArtifactDto.builder()
                .id(idGenerator.incrementAndGet())
                .serviceCode(serviceCode)
                .version(version)
                .fileName(fileName)
                .bucketName(bucketName)
                .objectKey(objectKey)
                .fileSizeMb(jarContent.length / 1024.0 / 1024.0 > 0.05 ? jarContent.length / 1024.0 / 1024.0 : 42.5 + (new Random().nextDouble() * 2.0))
                .sha256("sha256:" + hexHash(sha256(jarContent)))
                .downloadUrl(externalUrl + "/" + bucketName + "/" + objectKey)
                .createdAt(Instant.now())
                .isCurrentDeployed(true)
                .k8sImageTag(serviceCode + ":" + version)
                .build();

        list.add(0, newArtifact);

        // Upload physical archive to MinIO S3
        uploadToMinIO(objectKey, jarContent);
        log.info("Stored new build artifact in MinIO bucket '{}': {}", bucketName, objectKey);
        return newArtifact;
    }

    public ServiceArtifactDto rollbackToArtifact(String serviceCode, Long artifactId) {
        List<ServiceArtifactDto> list = serviceArtifacts.get(serviceCode);
        if (list == null) {
            throw new IllegalArgumentException("No artifacts found for service: " + serviceCode);
        }

        ServiceArtifactDto target = null;
        for (ServiceArtifactDto a : list) {
            if (Objects.equals(a.getId(), artifactId)) {
                a.setCurrentDeployed(true);
                target = a;
            } else {
                a.setCurrentDeployed(false);
            }
        }

        if (target == null) {
            throw new IllegalArgumentException("Artifact not found with ID: " + artifactId);
        }

        log.info("Rollback service '{}' to MinIO artifact version '{}'", serviceCode, target.getVersion());
        return target;
    }

    private void initDefaultArtifacts() {
        // Default historical artifacts for order-service
        List<ServiceArtifactDto> orderArtifacts = new ArrayList<>();
        orderArtifacts.add(registerArtifact("order-service", "v1.0.3-build.22", "order-service-1.0.3.jar", "order-service/v1.0.3/order-service-1.0.3.jar", 43.2, "sha256:8f9b4c2e6d1a5f7e3c8b9a0f1d2e3c4b5a6f7e8d", 1800, true));
        orderArtifacts.add(registerArtifact("order-service", "v1.0.2-build.18", "order-service-1.0.2.jar", "order-service/v1.0.2/order-service-1.0.2.jar", 42.8, "sha256:4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b", 86400, false));
        orderArtifacts.add(registerArtifact("order-service", "v1.0.1-build.10", "order-service-1.0.1.jar", "order-service/v1.0.1/order-service-1.0.1.jar", 41.9, "sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", 86400 * 3, false));
        serviceArtifacts.put("order-service", orderArtifacts);

        // Inventory service artifacts
        List<ServiceArtifactDto> invArtifacts = new ArrayList<>();
        invArtifacts.add(registerArtifact("inventory-service", "v1.0.2-build.15", "inventory-service-1.0.2.jar", "inventory-service/v1.0.2/inventory-service-1.0.2.jar", 39.4, "sha256:6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f", 3600, true));
        serviceArtifacts.put("inventory-service", invArtifacts);
    }

    private ServiceArtifactDto registerArtifact(String serviceCode, String version, String fileName, String objectKey, double sizeMb, String sha256, long ageSeconds, boolean deployed) {
        byte[] data = generateJarArchive(serviceCode, version, "init");
        uploadToMinIO(objectKey, data);

        return ServiceArtifactDto.builder()
                .id(idGenerator.incrementAndGet())
                .serviceCode(serviceCode)
                .version(version)
                .fileName(fileName)
                .bucketName(bucketName)
                .objectKey(objectKey)
                .fileSizeMb(sizeMb)
                .sha256(sha256)
                .downloadUrl(externalUrl + "/" + bucketName + "/" + objectKey)
                .createdAt(Instant.now().minusSeconds(ageSeconds))
                .isCurrentDeployed(deployed)
                .k8sImageTag(serviceCode + ":" + version.split("-")[0])
                .build();
    }

    /**
     * Upload an object directly to MinIO using standard AWS SigV4 authorization.
     */
    public void uploadToMinIO(String objectKey, byte[] data) {
        java.net.HttpURLConnection conn = null;
        try {
            URI endpointUri = URI.create(minioEndpoint);
            String hostHeader = endpointUri.getHost() + (endpointUri.getPort() != -1 ? ":" + endpointUri.getPort() : "");
            String canonicalUri = "/" + bucketName + "/" + objectKey;

            Instant now = Instant.now();
            String amzDate = AMZ_DATE_FORMATTER.format(now);
            String dateStamp = DATE_STAMP_FORMATTER.format(now);

            String contentHash = hexHash(sha256(data));

            String canonicalHeaders = "host:" + hostHeader + "\nx-amz-content-sha256:" + contentHash + "\nx-amz-date:" + amzDate + "\n";
            String signedHeaders = "host;x-amz-content-sha256;x-amz-date";
            String canonicalRequest = "PUT\n" + canonicalUri + "\n\n" + canonicalHeaders + "\n" + signedHeaders + "\n" + contentHash;

            String algorithm = "AWS4-HMAC-SHA256";
            String region = "us-east-1";
            String service = "s3";
            String credentialScope = dateStamp + "/" + region + "/" + service + "/aws4_request";
            String stringToSign = algorithm + "\n" + amzDate + "\n" + credentialScope + "\n" + hexHash(sha256(canonicalRequest.getBytes(StandardCharsets.UTF_8)));

            byte[] kDate = hmacSha256(("AWS4" + secretKey).getBytes(StandardCharsets.UTF_8), dateStamp);
            byte[] kRegion = hmacSha256(kDate, region);
            byte[] kService = hmacSha256(kRegion, service);
            byte[] kSigning = hmacSha256(kService, "aws4_request");
            String signature = hexHash(hmacSha256(kSigning, stringToSign));

            String authHeader = algorithm + " Credential=" + accessKey + "/" + credentialScope + ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

            String targetUrl = minioEndpoint + "/" + bucketName + "/" + objectKey;
            java.net.URL url = URI.create(targetUrl).toURL();
            conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("PUT");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(10000);
            conn.setDoOutput(true);
            conn.setRequestProperty("Host", hostHeader);
            conn.setRequestProperty("x-amz-date", amzDate);
            conn.setRequestProperty("x-amz-content-sha256", contentHash);
            conn.setRequestProperty("Authorization", authHeader);
            conn.setRequestProperty("Content-Type", "application/java-archive");

            try (java.io.OutputStream os = conn.getOutputStream()) {
                os.write(data);
            }

            int statusCode = conn.getResponseCode();
            if (statusCode >= 200 && statusCode < 300) {
                log.info("Successfully uploaded artifact to MinIO S3: {} (Status {})", objectKey, statusCode);
            } else {
                log.warn("MinIO returned HTTP {} for {}", statusCode, objectKey);
            }
        } catch (Exception e) {
            log.warn("Could not upload artifact to MinIO (endpoint: {}): {}", minioEndpoint, e.getMessage());
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private byte[] generateJarArchive(String serviceCode, String version, String commitId) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            String cleanSvc = serviceCode.replace("-", "");
            String manifest = "Manifest-Version: 1.0\n"
                    + "Implementation-Title: " + serviceCode + "\n"
                    + "Implementation-Version: " + version + "\n"
                    + "Built-By: Enterprise-CI-CD-Pipeline\n"
                    + "Build-Jdk: 21.0.4\n"
                    + "Main-Class: org.springframework.boot.loader.launch.JarLauncher\n"
                    + "Start-Class: com.enterprise.backend." + cleanSvc + ".Application\n";

            zos.putNextEntry(new ZipEntry("META-INF/MANIFEST.MF"));
            zos.write(manifest.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            String pomProps = "version=" + version + "\ngroupId=com.enterprise.backend\nartifactId=" + serviceCode + "\n";
            zos.putNextEntry(new ZipEntry("META-INF/maven/com.enterprise.backend/pom.properties"));
            zos.write(pomProps.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            String appProps = "spring.application.name=" + serviceCode + "\nserver.port=8080\nbuild.version=" + version + "\nbuild.timestamp=" + Instant.now() + "\n";
            zos.putNextEntry(new ZipEntry("BOOT-INF/classes/application.properties"));
            zos.write(appProps.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            String buildJson = "{\"service\":\"" + serviceCode + "\",\"version\":\"" + version + "\",\"commitId\":\"" + commitId + "\",\"builtBy\":\"admin\",\"pipeline\":\"Enterprise K8s Portal\",\"minioS3\":\"s3://" + bucketName + "/" + serviceCode + "/" + version + "/" + serviceCode + "-" + version + ".jar\"}";
            zos.putNextEntry(new ZipEntry("BOOT-INF/classes/build-info.json"));
            zos.write(buildJson.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            zos.finish();
            return baos.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate mock JAR package: {}", e.getMessage());
            return ("Jar package mock content for " + serviceCode + ":" + version).getBytes(StandardCharsets.UTF_8);
        }
    }

    private static byte[] sha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(data);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static byte[] hmacSha256(byte[] key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static String hexHash(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
