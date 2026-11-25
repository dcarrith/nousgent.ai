---
name: nousgent-deployer
description: Packages, containerizes, tests, security-audits, and deploys the nousgent.ai & ia.nousgent.ai NOUSGENT Flagship Gamified Mission Control & Autonomous M2M Swarm Platform (https://nousgent.ai for Human Civic UI, https://www.nousgent.ai -> 301, and https://ia.nousgent.ai for Agent-to-Agent / Machine-to-Machine Swarm Traffic) to a local Kubernetes cluster (Kind) or production Kubernetes environment. Includes Urbana White-Room Centrifuge & NASA Flight Manual UI (Stitch Project 3180979899126194505), 5-organ wiring (dolfactory.to, dthalamus.to, dbrain.to, cbrain.to, shi.liquidi.sh), Pod Bay Red-Team Airlock, Two-Key CHIP-0043 Clear-Sign Quorum, 50-State Chia Morphic Mesh (StatefulSet 2Gi SQLite WAL PVCs), standalone Dual-Host Prometheus + Alertmanager + Grafana SOC stack (--with-observability), Let's Encrypt ECDSA P-384 TLS 1.3 & Post-Quantum X25519MLKEM768 certificates, read-only rootfs non-root Node 22 Alpine container builds, 100% V8 coverage + 27-assertion E2E testing, and Trivy security scanning. Use this skill when deploying, updating, testing, or auditing nousgent.ai or ia.nousgent.ai.
---

# `nousgent-deployer` — Dual-Domain Orbital Cleanroom & Bounded ASI Swarm Deployer

Deploys **`https://nousgent.ai`** (Human Civic & Gamified Mission Control, `plane="human_ui"`), **`https://www.nousgent.ai`** (`301` redirect), and **`https://ia.nousgent.ai`** (Dedicated Agent-to-Agent / Machine-to-Machine Swarm Plane, `plane="m2m_ia"`) into namespace `dbrain`.

## Primary Commands

```bash
# 1. Full 100% V8 coverage + 27-check Dual-Host E2E verification
bash /Users/dcarrith/Repositories/nousgent.ai/deploy/scripts/test.sh

# 2. Deploy to local Kind cluster with Dual-Host Prometheus/Alertmanager/Grafana SOC
bash /Users/dcarrith/Repositories/nousgent.ai/deploy/scripts/deploy.sh --cluster kind-kind --with-observability

# 3. Security & Trivy scan
bash /Users/dcarrith/Repositories/nousgent.ai/deploy/scripts/scan.sh
```

## Observability Port-Forwards & 5-Organ SOC Dashboards (Namespace `dbrain`)

- **Grafana (`nousgent-soc`)**: `kubectl port-forward -n dbrain svc/nousgent-grafana 3600:3000`
- **Prometheus**: `kubectl port-forward -n dbrain svc/nousgent-prometheus 9096:9090`
- **Alertmanager**: `kubectl port-forward -n dbrain svc/nousgent-alertmanager 9097:9093`

Auto-provisioned Grafana 11 dashboards (`folder: "dbrain & NOUSGENT 5-Organ SOC"`):
1. `01 · dolfactory.to` (`uid: dolfactory-cn1-soc-v2`) — CN-I Pre-Thalamic Olfactory IDS/IPS, 2,048-KC Fly-LSH & VNO Guard
2. `02 · dthalamus.to` (`uid: dthalamus-ring0-soc-v2`) — Ring-0 Sensory/Motor Relay, 4-Layer Cache, Leases & Ratchet
3. `03 · dbrain.to & cbrain.to` (`uid: dbrain-cortex-soc-v2`) — 5-Lobe Chia Cortex, PQC/GDPR Integrity, Sleep ES & 4D Connectome
4. `04 · liquidi.sh & shi.liquidi.sh` (`uid: liquidish-dex-soc-v2`) — `$DIG` CAT2 Intelligence Exchange, Royalties & Glymphatic Health
5. `05 · nousgent.ai & ia.nousgent.ai` (`uid: nousgent-cleanroom-soc-v1`) — Bounded ASI Mission Control, BARI, SEP-2640 Firewall & 5-Organ Bus
