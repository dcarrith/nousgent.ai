# Design System: Urbana White-Room Centrifuge & NASA Flight Data Manual (`Orbital Cleanroom`)
**Project ID:** `projects/3180979899126194505` (`assets/8907c529b3ba4b0c95946333ae3f4296` · Screen `1e61d965d44645af8ab01200c302bfc6`)

## 1. Visual Theme & Atmosphere
`nousgent.ai` (Human Mission Control) and `ia.nousgent.ai` (Dedicated Agent-to-Agent / Machine-to-Machine Swarm Plane) channel a crisp, daylight **Spacecraft Cleanroom & 1968 NASA Apollo Flight Data Manual** aesthetic inspired by *Discovery One*'s white centrifuge bay in *2001: A Space Odyssey* and Braun/Dieter Rams precision instrumentation. Because 99% of AI portals default to dark mode, this bright ceramic-white modular specification grid contrasts dramatically with a single recessed **Jet-Black Machined-Aluminum `NOUSGENT` Optical Camera Bay (`CELL 01`)**, projecting transparency, public auditability, and constitutional human control.

## 2. Color Palette & Roles
- **Ceramic Spacecraft Ivory (`#f8f9fb`)**: Primary cleanroom canvas background.
- **Instrument Panel Pure White (`#ffffff`)**: Primary modular cell surface (`CELL 01`..`CELL 06`).
- **Recessed Header Pearl (`#f3f4f6`)**: Cell specification headers and subtle tabular bands.
- **Structural Graphite Rule (`#bfc7d2`)**: Crisp `1px` orthogonal cell borders and schematics.
- **Jet-Black Camera Bezel (`#191c1e`)**: High-contrast recessed 1968 optical faceplate housing the glowing `NOUSGENT` lens, CLI terminal strips, and `shi.liquidi.sh` ledger block.
- **Aerospace Telemetry Cobalt (`#006194`)**: Primary telemetry accents, `Key B // Swarm Cobalt` switch, FIDO2 quorum progress bar, and interactive execution controls.
- **International Signal Vermilion (`#ba0035`)**: High-priority CTA (`DOWNLOAD OPEN-SOURCE STACK`), `Key A // Citizen Vermilion Arm` switch, and Dave Bowman manual-halt warnings.
- **American Chia Forest Emerald (`#006948`)**: Verified Chia PoST roots, `0.00%` catastrophic forgetting readouts, `RING-0 HARDWARE ISOLATION ACTIVE` indicators, and optical lens pupil (`#85f8c4` highlight).
- **Deep Carbon Ink (`#191c1e`) & Technical Slate (`#3f4850`)**: Primary and secondary typography.

## 3. Typography Rules
- **Display & Headings (`Inter`, weights `600`–`700`, tight `-0.02em` tracking)**: Clean Swiss neo-grotesk hierarchy for cell titles and `48px` readiness readouts (`84.7%`, `0.00%`, `91.2%`).
- **Specification Labels & Telemetry (`JetBrains Mono`, weights `500`–`600`, `+0.04em` to `+0.08em` uppercase tracking)**: Used for all `DOC-ID`, `CELL 01`..`CELL 06` headers, CLVM/Merkle hashes, latency metrics, and CLI commands.

## 4. Component Stylings
* **Buttons & Switches:** Squared-off aerospace precision (`0px`–`2px` radius), solid Cobalt (`#006194`), Vermilion (`#ba0035`), or Carbon (`#191c1e`) fills with uppercase `JetBrains Mono` labels, paired with native `<input type="checkbox" switch>` physical toggle switches (`>= 3:1` `:focus-visible` outline).
* **Cards/Containers:** Numbered Swiss specification cells (`CELL 01`..`CELL 06`) with `1px solid #bfc7d2` borders, zero drop-shadow clutter, and `12px` uppercase pearl header bars.
* **Inputs/Forms:** Crisp `1px solid #bfc7d2` recessed `#f8f9fb` monospace inputs focusing to `2px solid #006194`.

## 5. Layout Principles
- Max container width `1440px` centered with `24px` outer margins and `16px` (`1rem`) 12-column Swiss grid gutters.
- Strict separation between **`nousgent.ai` (Human Mission Control)** and **`ia.nousgent.ai` (M2M Swarm Telemetry)** surfaced directly in the fixed specification header.

## 6. Design System Notes for Stitch Generation
- Platform: Web, Desktop-first modular Swiss aerospace grid (`1440px`)
- Theme: Light high-contrast spacecraft cleanroom (`#f8f9fb` background, `#ffffff` cells, `#bfc7d2` 1px borders) contrasted with a Jet-Black (`#191c1e`) `NOUSGENT` optical bezel
- Accents: Aerospace Cobalt (`#006194`), Signal Vermilion (`#ba0035`), Chia Forest Emerald (`#006948`)
- Fonts: `Inter` headings/body + `JetBrains Mono` uppercase specification labels and tabular telemetry
