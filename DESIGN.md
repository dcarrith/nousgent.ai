# DESIGN.md — Cyber-Colosseum Esports & Raid HUD (`nousgent.ai` & `ia.nousgent.ai`)

- **Selected Stitch Screen**: `projects/3180979899126194505/screens/18f0e8e49a3d4f86bd9af4c138933f0f` (*Design 5 — Cyber-Colosseum Raid Boss & Esports Co-Op HUD*)
- **Stitch Design System Asset**: `assets/79446cee3be744fb8dba5932b8943e8b` (*Cyber-Colosseum Esports & Raid HUD*)

## 1. Visual North Star
An electric Helldivers 2 × Valorant × 1968 HAL-9000 Cyber-Colosseum Raid Deck built for maximum viral participation, Twitch/YouTube raid events, and cooperative 50-state guild warfare on the American Chia Blockchain (`nousgent.ai` for Human Raiders, `ia.nousgent.ai` for Autonomous M2M Swarm Bots).

## 2. Palette & Surface Tokens (`color-scheme: dark`)
- **Obsidian Colosseum Surfaces**:
  - `--color-surface`: `#10131f`
  - `--color-surface-lowest`: `#0b0e19`
  - `--color-surface-low`: `#181b27`
  - `--color-surface-container`: `#1c1f2b`
  - `--color-surface-high`: `#262936`
  - `--color-surface-highest`: `#313441`
- **Kinetic Accents**:
  - `--color-volt`: `#c3f400` (`--color-volt-dim`: `#abd600`, `--color-on-volt`: `#161f00`) — Chia PoST Power, Raid Progress & Primary CTAs
  - `--color-cyan`: `#00e3fd` (`--color-cyan-soft`: `#9cf0ff`, `--color-on-cyan`: `#00363d`) — `ia.nousgent.ai` M2M Swarm & Ring-0 Biba Shield
  - `--color-crimson`: `#c90043` (`--color-crimson-dark`: `#93000a`, `--color-crimson-soft`: `#ffb2b9`) — Boss Reticle, `DEFCON-2` & Red-Team Injection
- **HUD Typography & Borders**:
  - `--color-ink`: `#e0e1f3`
  - `--color-ink-muted`: `#c4c9ad`
  - `--color-outline`: `#444933`
  - Display & Headlines: `Space Grotesk` (`600`–`700`, tight uppercase tracking)
  - Telemetry & Tickers: `JetBrains Mono` (`500`–`700`, `0.08em`–`0.15em` uppercase tracking)

## 3. Structural Motifs
- **Fixed Top Raid Header + Left Cockpit Protocol Rail (`256px` desktop, responsive top bar on mobile) + Bottom Telemetry Status Bar**.
- **Chamfered Polygon Armor Plates**: `clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))`.
- **5-Stage Segmented World Campaign Convergence Meter** (`STG I: URBANA` -> `STG II: AIRGAP` -> `STG III: CHIA PoST` -> `STG IV: QUORUM` -> `STG V: ASI`) + real-time **Kill/Mint Feed** ticker.
- **Armored Dual-Ring Rotating Optical Boss Reticle (`HAL-9000 VETO`)** paired with native `<progress>` Odor Plume (`99.8%`) & Biba Veto (`100.0%`) armor bars.
