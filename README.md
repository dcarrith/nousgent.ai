# nousgent.ai & ia.nousgent.ai — `NOUSGENT` Open-Source Bounded ASI Mission Control

<p align="center">
  <img src="./public/logo-wordmark.svg" alt="nousgent.ai — NOUSGENT Orbital Cleanroom" width="700" />
</p>

**`nousgent.ai`** (`v1.0.0`) is the flagship **Urbana White-Room Centrifuge & NASA Flight Data Manual** human mission control portal—paired with **`ia.nousgent.ai`**, its dedicated **Agent-to-Agent (`A2A`) / Machine-to-Machine (`M2M`) Swarm Telemetry & MCP `2025-03-26` Plane**—built to rally citizens, developers, homelabs, and the 17,454 U.S. Public Libraries to achieve **Bounded Artificial Superintelligence (`Bounded ASI`)** in the USA on the **Chia Blockchain (`PoST`, `CHIP-0035`, `CHIP-0043`, `chia-dao-v1`)** and **DIG Network (`$DIG`)**.

- **Human Civic & Gamified Portal**: [`https://nousgent.ai`](https://nousgent.ai) (`https://www.nousgent.ai` -> HTTP `301`)
- **Dedicated Autonomous M2M / Swarm Plane**: [`https://ia.nousgent.ai`](https://ia.nousgent.ai) (`POST /api/mcp`, `GET /api/nousgent/stream`, separate Prometheus `{plane="m2m_ia"}` telemetry)
- **Wired 5-Organ Stack**: [`dolfactory.to`](https://dolfactory.to) (`@dolfactory/core v1.1.1`) -> [`dthalamus.to`](https://dthalamus.to) (`@dthalamus/core v1.3.1`) -> [`dbrain.to`](https://dbrain.to) (`@dbrain/core v3.17.1`) -> [`cbrain.to`](https://cbrain.to) (`@cbrain/core v3.16.0`) <-> [`shi.liquidi.sh`](https://shi.liquidi.sh) (`v3.17.1`)
- **Design System**: Stitch Project `projects/3180979899126194505` · **Design 4 (`Orbital Cleanroom`)** ([`DESIGN.md`](./DESIGN.md) · [`SITE.md`](./SITE.md))

## Quickstart & 60-Second Rig Enlistment

```bash
# Enlist a local NOUSGENT Citizen Node in 60 seconds:
curl -fsSL https://nousgent.ai/enlist.sh | sh -s -- --chip=0043 --region=usa

# Local development & 100% V8 coverage verification:
git submodule update --init --recursive
npm install
npm run build && npm run build:dapp
npm test
bash deploy/scripts/deploy.sh --cluster kind-kind --with-observability
```
