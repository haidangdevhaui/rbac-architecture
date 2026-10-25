# Multi-stage Docker build for inventory-service
FROM maven:3.9.8-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

COPY pom.xml .
COPY common-security/pom.xml common-security/
COPY gateway-service/pom.xml gateway-service/
COPY auth-rbac-service/pom.xml auth-rbac-service/
COPY inventory-service/pom.xml inventory-service/
COPY order-service/pom.xml order-service/

COPY common-security/src common-security/src
COPY inventory-service/src inventory-service/src

RUN mvn clean package -pl common-security,inventory-service -am -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /workspace/inventory-service/target/inventory-service-*.jar app.jar

EXPOSE 8082
ENTRYPOINT ["java", "-XX:+UseG1GC", "-jar", "app.jar"]
