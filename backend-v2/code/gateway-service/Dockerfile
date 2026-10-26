# Multi-stage Docker build for gateway-service
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /workspace

COPY pom.xml .
COPY common-security/pom.xml common-security/
COPY gateway-service/pom.xml gateway-service/
COPY auth-rbac-service/pom.xml auth-rbac-service/
COPY inventory-service/pom.xml inventory-service/
COPY order-service/pom.xml order-service/
COPY devops-service/pom.xml devops-service/

COPY common-security/src common-security/src
COPY gateway-service/src gateway-service/src

RUN mvn clean package -pl common-security,gateway-service -am -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /workspace/gateway-service/target/gateway-service-*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseG1GC", "-jar", "app.jar"]
