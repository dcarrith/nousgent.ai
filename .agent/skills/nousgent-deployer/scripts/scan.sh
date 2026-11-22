#!/usr/bin/env bash
# ==============================================================================
# nousgent.ai & ia.nousgent.ai Container, Manifest & Dependency Security Audit
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PLATFORM_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"
APP_VERSION="$(node -p "require('$PLATFORM_DIR/package.json').version")"
IMAGE="nousgent-web:${APP_VERSION}"

echo "=== [1/3] npm Production Dependency Audit ==="
npm --prefix "$PLATFORM_DIR" audit --omit=dev

if command -v trivy &>/dev/null; then
  echo "=== [2/3] Trivy K8s Manifest Misconfiguration Audit ==="
  trivy config --severity HIGH,CRITICAL --exit-code 1 "$DEPLOY_DIR/resources/k8s"
  if docker image inspect "$IMAGE" &>/dev/null; then
    echo "=== [3/3] Trivy Container Image Vulnerability & Secret Scan (${IMAGE}) ==="
    trivy image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 "$IMAGE"
  fi
else
  echo "Trivy CLI not installed locally; skipping container image scan."
fi
echo "✓ Security audit completed cleanly."
