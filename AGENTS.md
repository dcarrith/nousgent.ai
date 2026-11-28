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

## 5. NoMoreSlop Pre-Ship Quality Gate (`.agent/skills/no-more-slop-gate/SKILL.md`)
Run both layers of the NoMoreSlop Pre-Ship Quality Gate before finalizing multi-file features, new endpoints, cryptographic/auth flows, or React/TSX UI updates:

1. **Layer 1 — Deterministic CLI Scanners**:
   - `impeccable detect --json src/` (WCAG AA contrast, nested card kits, tracked-out ALL-CAPS eyebrow clutter, touch targets)
   - `NO_COLOR=1 fallow` and `knip --no-progress` (dead files, unused exports, stray dependencies)
   - `jscpd --min-lines 12 --min-tokens 90 <touched-paths>` (copy/paste structural clone detection)
   - `git status --short && git ls-files | grep -E '\.env$|\.env\.' || true` (`.env` and secret hygiene)
2. **Layer 2 — Logic, Protocol & Security Review**:
   - Rate limiting defaults to ON on public HTTP/JSON-RPC endpoints (`POST /api/*`, `/api/mcp`).
   - Authenticated encryption (`AES-256-GCM` with CSPRNG/HKDF keys, never `base64`/`AES-256-CBC` or predictable keys).
   - SSRF scheme + hostname/CIDR allowlisting (`validateOnChainUriSafety`).
   - Fail-closed integrity verification (`SHA-256` `skill://` resource digests and `Ed25519` signatures fail closed when missing or mismatched).
   - Uniform protocol error codes (`-32602`) on public lookup routes (`skills/get`, `resources/read`) with zero enumeration oracles.
   - Zero silent `catch {}` swallowing without explicit best-effort telemetry documentation.
   - Plain, actionable verb + object UI button copy (`Verify Skill Manifest`, `Test Skill Firewall`) without decorative eyebrow clutter.
