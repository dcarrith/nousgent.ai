#!/usr/bin/env bash
# ==============================================================================
# nousgent.ai & ia.nousgent.ai Platform Deployment Script (Kind & Production K8s)
# Canonical Targets:
#   - https://nousgent.ai     (Primary Human Mission Control, plane="human_ui")
#   - https://www.nousgent.ai (HTTP 301 -> https://nousgent.ai)
#   - https://ia.nousgent.ai  (Dedicated A2A / M2M Swarm Plane, plane="m2m_ia")
# Supports: --dry-run | --skip-build | --with-observability | --cluster <ctx> | --registry <url> | --tag <semver>
# ==============================================================================
set -euo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DRY_RUN=false
SKIP_BUILD=false
WITH_OBSERVABILITY=false
TARGET_CLUSTER=""
REGISTRY_URL=""
TAG_OVERRIDE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    --with-observability) WITH_OBSERVABILITY=true; shift ;;
    --cluster) TARGET_CLUSTER="$2"; shift 2 ;;
    --registry) REGISTRY_URL="${2%/}"; shift 2 ;;
    --tag) TAG_OVERRIDE="${2#v}"; shift 2 ;;
    *) echo -e "${RED}Unknown flag: $1${NC}"; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$DEPLOY_DIR/../index.html" ]; then
  PLATFORM_DIR="$(cd "$DEPLOY_DIR/.." && pwd)"
elif [ -f "$DEPLOY_DIR/../../../index.html" ]; then
  PLATFORM_DIR="$(cd "$DEPLOY_DIR/../../.." && pwd)"
else
  PLATFORM_DIR="${NOUSGENT_PLATFORM_DIR:-/Users/dcarrith/Repositories/nousgent.ai}"
fi
K8S_DIR="$DEPLOY_DIR/resources/k8s"
OBS_DIR="$DEPLOY_DIR/resources/observability"
DOCKERFILE="$DEPLOY_DIR/resources/Dockerfile"

APP_VERSION="${TAG_OVERRIDE:-$(node -p "require('$PLATFORM_DIR/package.json').version")}"
IMAGE_REPO="${REGISTRY_URL:+${REGISTRY_URL}/}nousgent-web"
SEMVER_IMAGE="${IMAGE_REPO}:${APP_VERSION}"
V_SEMVER_IMAGE="${IMAGE_REPO}:v${APP_VERSION}"
LATEST_IMAGE="${IMAGE_REPO}:latest"

echo -e "${CYAN}==============================================================${NC}"
echo -e "${CYAN}  nousgent.ai & ia.nousgent.ai — Orbital Cleanroom Deployment${NC}"
echo -e "${CYAN}  Human Portal: https://nousgent.ai | M2M Plane: https://ia.nousgent.ai${NC}"
echo -e "${CYAN}  Version: v${APP_VERSION} | Image: ${SEMVER_IMAGE}${NC}"
echo -e "${CYAN}  Observability Stack (--with-observability): ${WITH_OBSERVABILITY}${NC}"
echo -e "${CYAN}==============================================================${NC}"

if [ -n "$TARGET_CLUSTER" ]; then
  kubectl config use-context "$TARGET_CLUSTER" >/dev/null 2>&1 || true
fi
CURRENT_CONTEXT="$(kubectl config current-context 2>/dev/null || echo "none")"
echo -e "Current kubectl context: ${YELLOW}$CURRENT_CONTEXT${NC}"

if [ "$SKIP_BUILD" = false ]; then
  if [ ! -f "$PLATFORM_DIR/packages/dbrain/package.json" ]; then
    echo -e "\n${CYAN}>>> Initializing Git submodules...${NC}"
    git -C "$PLATFORM_DIR" submodule update --init --recursive
  fi

  echo -e "\n${CYAN}>>> Verifying Docs/DAG & compiling Vite + DIG.net dApp bundle...${NC}"
  (
    cd "$PLATFORM_DIR"
    npm run docs:generate
    npm run build
    npm run build:dapp
  )

  echo -e "\n${CYAN}>>> Building hardened non-root container (${SEMVER_IMAGE})...${NC}"
  docker build \
    --build-arg APP_VERSION="$APP_VERSION" \
    -t "$SEMVER_IMAGE" \
    -t "$V_SEMVER_IMAGE" \
    -t "$LATEST_IMAGE" \
    -f "$DOCKERFILE" \
    "$PLATFORM_DIR"
  echo -e "${GREEN}✓ Built ${SEMVER_IMAGE}${NC}"

  if [ -n "$REGISTRY_URL" ] && [ "$DRY_RUN" = false ]; then
    echo -e "${CYAN}>>> Pushing ${SEMVER_IMAGE} & ${LATEST_IMAGE} to registry...${NC}"
    docker push "$SEMVER_IMAGE"
    docker push "$LATEST_IMAGE"
  elif [[ "$CURRENT_CONTEXT" == *"kind"* ]] && command -v kind &>/dev/null && [ "$DRY_RUN" = false ]; then
    KIND_NAME="${CURRENT_CONTEXT#kind-}"
    echo -e "${CYAN}>>> Loading ${SEMVER_IMAGE} & ${LATEST_IMAGE} into Kind cluster: ${KIND_NAME}...${NC}"
    kind load docker-image "$SEMVER_IMAGE" "$LATEST_IMAGE" --name "$KIND_NAME"
  fi
fi

if [ "$DRY_RUN" = true ]; then
  echo -e "\n${YELLOW}>>> [DRY RUN] Validating Kubernetes manifests...${NC}"
  kubectl apply -f "$K8S_DIR/00-namespace.yaml" --dry-run=client -o yaml
  kubectl apply -f "$K8S_DIR/01-configmap.yaml" --dry-run=client -o yaml
  kubectl apply -f "$K8S_DIR/20-service.yaml" --dry-run=client -o yaml
  kubectl apply -f "$K8S_DIR/10-deployment-web.yaml" --dry-run=client -o yaml
  kubectl apply -f "$K8S_DIR/30-ingress.yaml" --dry-run=client -o yaml
  kubectl apply -f "$K8S_DIR/40-hpa.yaml" --dry-run=client -o yaml
  if [ "$WITH_OBSERVABILITY" = true ] && [ -f "$K8S_DIR/60-observability-stack.yaml" ]; then
    kubectl apply -f "$K8S_DIR/60-observability-stack.yaml" --dry-run=client -o yaml
  fi
  exit 0
fi

# Enforce TLS 1.3 & Post-Quantum X25519MLKEM768 at NGINX Ingress
if kubectl get cm ingress-nginx-controller -n ingress-nginx &>/dev/null; then
  kubectl patch cm ingress-nginx-controller -n ingress-nginx --type merge \
    -p '{"data":{"ssl-protocols":"TLSv1.3","ssl-ecdh-curve":"X25519MLKEM768:X25519:prime256v1:secp384r1"}}' || true
fi

# Ensure cert-manager split-horizon hostAliases include nousgent.ai, www.nousgent.ai, and ia.nousgent.ai
if kubectl get deployment cert-manager -n cert-manager &>/dev/null; then
  if ! kubectl get deployment cert-manager -n cert-manager -o jsonpath='{.spec.template.spec.hostAliases[*].hostnames[*]}' | grep -qw "ia.nousgent.ai"; then
    echo -e "\n${CYAN}>>> Adding nousgent.ai, www.nousgent.ai & ia.nousgent.ai to cert-manager HTTP-01 self-check hostAliases...${NC}"
    if kubectl get deployment cert-manager -n cert-manager -o jsonpath='{.spec.template.spec.hostAliases[0].ip}' 2>/dev/null | grep -q .; then
      kubectl patch deployment cert-manager -n cert-manager --type=json \
        -p='[{"op":"add","path":"/spec/template/spec/hostAliases/0/hostnames/-","value":"nousgent.ai"},{"op":"add","path":"/spec/template/spec/hostAliases/0/hostnames/-","value":"www.nousgent.ai"},{"op":"add","path":"/spec/template/spec/hostAliases/0/hostnames/-","value":"ia.nousgent.ai"}]' || true
    fi
    kubectl rollout status deployment/cert-manager -n cert-manager --timeout=90s || true
  fi
fi

echo -e "\n${CYAN}>>> Provisioning dynamic 256-bit CSPRNG secrets & applying K8s manifests to namespace 'dbrain'...${NC}"
kubectl apply -f "$K8S_DIR/00-namespace.yaml"
kubectl apply -f "$K8S_DIR/01-configmap.yaml"

EXISTING_SIGNING="$(kubectl get secret nousgent-secrets -n dbrain -o jsonpath='{.data.NOUSGENT_SIGNING_SECRET}' 2>/dev/null | base64 -d 2>/dev/null || true)"
EXISTING_ADMIN="$(kubectl get secret nousgent-secrets -n dbrain -o jsonpath='{.data.NOUSGENT_ADMIN_KEY}' 2>/dev/null | base64 -d 2>/dev/null || true)"

RESOLVED_SIGNING_KEY="${EXISTING_SIGNING:-$(openssl rand -hex 32)}"
RESOLVED_ADMIN_KEY="${EXISTING_ADMIN:-$(openssl rand -hex 32)}"

kubectl create secret generic nousgent-secrets \
  -n dbrain \
  --from-literal=NOUSGENT_SIGNING_SECRET="$RESOLVED_SIGNING_KEY" \
  --from-literal=NOUSGENT_ADMIN_KEY="$RESOLVED_ADMIN_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f "$K8S_DIR/04-issuer.yaml" || true
kubectl apply -f "$K8S_DIR/20-service.yaml"
kubectl apply -f "$K8S_DIR/10-deployment-web.yaml"
kubectl apply -f "$K8S_DIR/30-ingress.yaml"
kubectl apply -f "$K8S_DIR/40-hpa.yaml"

if [ "$WITH_OBSERVABILITY" = true ] && [ -f "$K8S_DIR/60-observability-stack.yaml" ]; then
  echo -e "\n${CYAN}>>> Provisioning Standalone 5-Organ Prometheus, Alertmanager & Grafana SOC Stack...${NC}"
  kubectl create configmap nousgent-observability-configs \
    -n dbrain \
    --from-file=prometheus.yml="$OBS_DIR/prometheus.yml" \
    --from-file=prometheus-nousgent-alerts.yaml="$OBS_DIR/prometheus-nousgent-alerts.yaml" \
    --from-file=alertmanager.yml="$OBS_DIR/alertmanager.yml" \
    --from-file=grafana-datasources.yaml="$OBS_DIR/grafana-datasources.yaml" \
    --from-file=grafana-dashboards-provider.yaml="$OBS_DIR/grafana-dashboards-provider.yaml" \
    --from-file=grafana-01-dolfactory-soc-dashboard.json="$OBS_DIR/grafana-01-dolfactory-soc-dashboard.json" \
    --from-file=grafana-02-dthalamus-soc-dashboard.json="$OBS_DIR/grafana-02-dthalamus-soc-dashboard.json" \
    --from-file=grafana-03-dbrain-soc-dashboard.json="$OBS_DIR/grafana-03-dbrain-soc-dashboard.json" \
    --from-file=grafana-04-liquidish-soc-dashboard.json="$OBS_DIR/grafana-04-liquidish-soc-dashboard.json" \
    --from-file=grafana-nousgent-soc-dashboard.json="$OBS_DIR/grafana-nousgent-soc-dashboard.json" \
    --dry-run=client -o yaml | kubectl apply -f -
  kubectl apply -f "$K8S_DIR/60-observability-stack.yaml"
  kubectl rollout restart deployment/nousgent-prometheus deployment/nousgent-alertmanager deployment/nousgent-grafana -n dbrain
  kubectl rollout status deployment/nousgent-prometheus -n dbrain --timeout=120s
  kubectl rollout status deployment/nousgent-alertmanager -n dbrain --timeout=120s
  kubectl rollout status deployment/nousgent-grafana -n dbrain --timeout=120s
fi

kubectl set image statefulset/nousgent-web web="$SEMVER_IMAGE" -n dbrain
kubectl rollout restart statefulset/nousgent-web -n dbrain
kubectl rollout status statefulset/nousgent-web -n dbrain --timeout=120s

echo -e "\n${GREEN}==============================================================${NC}"
echo -e "${GREEN}  ✓ nousgent.ai & ia.nousgent.ai deployment succeeded (${SEMVER_IMAGE})!${NC}"
echo -e "${GREEN}==============================================================${NC}"
kubectl get pods,pvc,svc,ingress,certificate -n dbrain | grep -E "NAME|nousgent" || true
