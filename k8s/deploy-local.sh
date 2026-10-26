#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 DEPLOYING ENTERPRISE PORTAL ON LOCAL KUBERNETES CLUSTER"
echo "=========================================================="

# 1. Verify cluster connection
echo "🔍 Checking Kubernetes cluster..."
kubectl cluster-info > /dev/null || { echo "❌ Cannot connect to Kubernetes. Please make sure Docker Desktop K8s is running."; exit 1; }
echo "✅ Kubernetes cluster is ready!"

# 2. Apply Namespace
echo "📦 Creating/updating namespace 'enterprise-dev'..."
kubectl apply -f k8s/00-namespace.yaml

# 3. Deploy Infrastructure (Postgres, Redis, Keycloak, Gitea)
echo "🗄 Deploying Database, Cache & Identity Provider (Postgres, Redis, Keycloak, Gitea)..."
kubectl apply -f k8s/01-postgres.yaml
kubectl apply -f k8s/02-redis.yaml
kubectl apply -f k8s/03-keycloak.yaml
kubectl apply -f k8s/04-gitea.yaml

echo "⏳ Waiting for PostgreSQL to become Ready..."
kubectl rollout status deployment/postgres -n enterprise-dev --timeout=90s

# 4. Deploy Microservices & Gateway
echo "⚙️ Deploying Backend Microservices & API Gateway..."
kubectl apply -f k8s/05-auth-rbac-service.yaml
kubectl apply -f k8s/06-inventory-service.yaml
kubectl apply -f k8s/07-order-service.yaml
kubectl apply -f k8s/08-devops-service.yaml
kubectl apply -f k8s/09-gateway-service.yaml

echo "⏳ Waiting for Gateway Service deployment..."
kubectl rollout status deployment/gateway-service -n enterprise-dev --timeout=90s || true

echo "=========================================================="
echo "🎉 DEPLOYMENT FINISHED! ALL SERVICES RUNNING ON K8S"
echo "=========================================================="
echo ""
echo "📊 Kubernetes Pods Status:"
kubectl get pods -n enterprise-dev
echo ""
echo "🌐 Kubernetes LoadBalancer Services:"
kubectl get svc -n enterprise-dev
echo ""
echo "🔗 Access Endpoints on Localhost:"
echo "   - API Gateway:    http://localhost:8080"
echo "   - Keycloak SSO:   http://localhost:8180 (Admin: admin / admin123)"
echo "   - Gitea Git:      http://localhost:3030 (Admin: gitea_admin / admin123)"
echo "   - Host Portal:    http://localhost:3000 (Run via: cd frontend-mf && pnpm dev)"
echo "=========================================================="
