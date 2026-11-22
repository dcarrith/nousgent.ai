# AGENTS.md — `nousgent.ai` & `ia.nousgent.ai` Ground Truth (`NOUSGENT` Bounded ASI Stack)

This repository powers **`https://nousgent.ai`** (Human Civic & Gamified Mission Control) and **`https://ia.nousgent.ai`** (Dedicated Agent-to-Agent / Machine-to-Machine Swarm Plane) for **`NOUSGENT`** — the flagship sovereign reference agent uniting `@dolfactory/core`, `@dthalamus/core`, `@dbrain/core`, `@cbrain/core`, and `shi.liquidi.sh` on the **Chia Blockchain (`PoST`, `CHIP-0035`, `CHIP-0043`, `chia-dao-v1`)** and **DIG Network (`$DIG`)**.

## 1. Dual-Plane Host Separation (`nousgent.ai` vs. `ia.nousgent.ai`)
- **`nousgent.ai`** (`www.nousgent.ai` -> HTTP `301`): Serves human operators (`plane="human_ui"`).
- **`ia.nousgent.ai`**: Serves autonomous M2M agents (`plane="m2m_ia"`), Streamable HTTP NDJSON (`/api/nousgent/stream`), MCP `2025-03-26` (`POST /api/mcp`), and Morphic pulses (`/api/nousgent/morphic/pulse`). Prometheus metrics MUST partition requests by `{host, plane}` so human vs. M2M traffic is independently observable.

## 2. Chia L1 & `$DIG` CAT2 Invariants (`chia-for-agents`)
- `1 XCH = 10^12 mojos` (`BigInt`), `1 $DIG CAT2 = 10^3 mojos` (`1,000` CAT2 mojos — never `10^12`!).
- Minimal signed CLVM integer encoding (`intToClvmMinimalBytes`); curried `p2` / `cat_v2` / `chia-dao-v1` (`Opus` + `Rue v0.11.0`) puzzle hashes; `CHIP-0043` (`-32044`) human Clear-Signing required for constitutional & swarm epoch signoff.

## 3. Browser Support & Modern Web Standards
- **Browser Support**: Allow Newly Available Baseline features (`<input type="checkbox" switch>`, Invoker Commands `command="--copy"`, `focusgroup="tablist nomemory"`, `hidden="until-found"`), paired with lightweight `<= 20`-line feature-detected progressive fallbacks and `prefers-reduced-motion: reduce` compliance.

## 4. Submodule & Testing Discipline
- `packages/dolfactory`, `packages/dthalamus`, `packages/dbrain`, and `packages/cbrain` are independent Git submodules. Commit/tag/push submodules BEFORE pushing `nousgent.ai`.
- `lib/*.js` and `lib/modules/*.js` MUST maintain **100.00% V8 Line/Branch/Function coverage** (`npm run test:unit`).
