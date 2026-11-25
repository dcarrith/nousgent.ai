---
name: no-more-slop-gate
description: >-
  Enforces the NoMoreSlop.com dual-layer quality gate (30% deterministic CLI scanners + 70% design/logic/security review) before shipping backend, protocol, or frontend changes. Use before finalizing multi-file features, new endpoints, cryptographic/auth flows, or React/TSX UI updates.
---

# NoMoreSlop Pre-Ship Quality Gate (`nomoreslop.com`)

Automated linters and vulnerability scanners catch roughly **30%** of AI-generated issues (syntax, CVEs, unused exports, structural clones, deterministic UI tells). The remaining **70%** are **design-level, domain-logic, and fail-open security flaws** that pass every scanner cleanly. Run both layers before shipping.

---

## Layer 1: Deterministic Anti-Slop Scanners (The 30% Floor)

Run applicable scanners against touched directories before concluding a feature:

1. **Frontend UI & AI-Tell Detector (`impeccable`)**:
   ```bash
   impeccable detect --json src/
   ```
   - Flags 62 deterministic UI anti-patterns: WCAG AA contrast failures, nested card kits, tracked-out ALL-CAPS eyebrows above every heading, tiny touch targets, bounce/layout transitions, and generic AI color tells.
   - Respect incumbent brand/design systems (`DESIGN.md` / existing site CSS tokens) when refining an existing page; fix genuine contrast, hierarchy, touch-target, and copy issues without breaking established site identity.

2. **Dead Code, Unused Exports & Architecture Drift (`fallow` & `knip`)**:
   ```bash
   fallow --no-color
   knip --no-progress
   ```
   - Zero unreferenced helper files, dead exports, unused TypeScript interfaces, or stray dependencies left behind by iterative edits.

3. **Copy/Paste Structural Clone Check (`jscpd`)**:
   ```bash
   jscpd --min-lines 12 --min-tokens 90 <touched-paths>
   ```
   - Extract shared protocol/validation helpers instead of copy-pasting 30-line blocks across routes or packages.

4. **Secret & `.env` Hygiene**:
   ```bash
   git status --short && git ls-files | grep -E '\.env$|\.env\.' || true
   ```
   - Never commit `.env` files, private keys, live bearer tokens, or machine-local paths.

---

## Layer 2: Logic, Protocol & Security Checklist (The 70% Automated Tools Miss)

Audit every new or modified endpoint, parser, and UI control against these 7 domain-logic failure modes:

1. **Rate Limiting Defaults to ON**:
   - Public HTTP/JSON-RPC endpoints (`POST /api/*`, `/api/mcp`) MUST enforce rate limiting **by default** (never opt-in) with per-IP limits on state-changing or CPU/DB-touching routes.
2. **Authenticated Encryption & Non-Predictable Keys**:
   - Sensitive payloads at rest MUST use authenticated encryption (`AES-256-GCM`, never `base64` or `AES-256-CBC`) with keys derived via CSPRNG / HKDF secrets — never predictable URLs, hostnames, or prefixes.
3. **SSRF Hostname Allowlisting + Transport Hygiene**:
   - External URLs/URIs MUST be validated against scheme + hostname/CIDR guards (blocking loopback, RFC-1918 private ranges, link-local `169.254.169.254`, and local daemon ports), not merely checking `startsWith('https://')`.
4. **Fail-Closed Integrity Verification (Zero Silent Fallback on Missing Digests)**:
   - Artifact updaters, remote `SEP-2640` `skill://` manifests, and signed envelopes MUST verify `SHA-256` digests / `Ed25519` signatures before consumption and **fail closed** when a required digest, manifest entry, or signature is missing or mismatched.
5. **No Public Enumeration Oracles**:
   - Public lookup endpoints (`skills/get`, `resources/read`, slug/ID resolvers) MUST return uniform protocol error codes (e.g., JSON-RPC `-32602`) rather than leaking internal path existence or private store state.
6. **Zero Silent Catch Swallowing (`marko` Rule)**:
   - Never write empty `catch {}` blocks that turn crashes or corrupt payloads into silent `null`/`200 OK` responses unless explicitly documented as non-critical telemetry best-effort.
7. **Plain, Actionable UI Copy (`frontend-design` / `impeccable` Rule)**:
   - Buttons state the exact verb + object (`Verify Skill Manifest`, not `Submit` or `Run ->`); avoid decorative `'A · B · C'` / ALL-CAPS eyebrow clutter on new cards unless matching an incumbent page header pattern; errors state what failed and how to fix it without apologizing.
