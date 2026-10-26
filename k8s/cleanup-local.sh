#!/usr/bin/env bash
set -e

echo "⚠️ Deleting all Enterprise Portal resources in namespace 'enterprise-dev'..."
kubectl delete namespace enterprise-dev --timeout=60s || true
echo "✅ Cleanup complete!"
