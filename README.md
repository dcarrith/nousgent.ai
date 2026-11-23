# NOUSGENT (`v1.11.2`) — Community-Based Bounded RSI on Chia

<p align="center">
  <img src="./public/logo-wordmark.svg" alt="NOUSGENT — Morphic Field & Bounded RSI" width="680" />
</p>

**NOUSGENT** unites pre-cortical sensory screening (`@dolfactory/core`), Ring-0 policy & sandbox gating (`@dthalamus/core`), a 5-lobe Chia Merkle cortex (`@dbrain/core`), live 3D connectome telemetry (`@cbrain/core`), and `$DIG` CAT2 citation royalties (`1 $DIG = 1,000 CAT2 mojos`), paired with optional local **AMD Ryzen AI Halo** frontier inference, neural voice synthesis, and **`chia-dao-v1` + `CHIP-0043`** governance.

## Quickstart

```bash
git submodule update --init --recursive
npm install
npm run build && npm run build:dapp
npm test
bash deploy/scripts/deploy.sh --cluster kind-kind
```

---

## Configuring a Local AMD Ryzen AI Halo Endpoint

NOUSGENT can route unanswered frontier queries, autonomous background agent loops, vector embeddings, and neural voice synthesis to a local **AMD Ryzen AI Max+ / Strix Halo** workstation (or any OpenAI-compatible server: Ollama, `llama-server`, vLLM ROCm, LM Studio, or AMD Lemonade SDK).

Every prompt still passes through pre-cortical Fly-LSH screening and Ring-0 policy checks **before** reaching any local model:
- Adversarial prompts are blocked at Ring-0 (`403` / `RING0_ADVERSARIAL_DEFLECTION`) and never forwarded to the local LLM.
- Exact math/crypto/mojo conversions and verified `.dig` capsules resolve immediately in `< 2 ms`.
- Uncharted questions (`UNCHARTED_BLIND_SPOT_QUEST`) automatically query your local Ryzen AI Halo model, strip `<think>...</think>` reasoning blocks, speak **only** the concise direct first sentence (`spokenSummary`), and queue a candidate capsule quest for DAO & `CHIP-0043` verification.

### 1. Master Single-URL Setup (`NOUSGENT_HALO_BASE_URL`)

Pointing `NOUSGENT_HALO_BASE_URL` at your Halo host wires **Q&A fallback**, **autonomous RSI agents**, and **embeddings** in one step:

```bash
# Example A: Ollama on AMD Ryzen AI Halo over LAN
export NOUSGENT_HALO_BASE_URL="http://halo.local:11434/v1"
export NOUSGENT_LLM_MODEL="qwen3:32b"
export NOUSGENT_EMBEDDING_MODEL="nomic-embed-text"

# Example B: llama.cpp / vLLM ROCm / Lemonade SDK on host from inside Kind
export NOUSGENT_HALO_BASE_URL="http://host.docker.internal:8000/v1"
export NOUSGENT_LLM_MODEL="Qwen/Qwen3-32B-Instruct"
export NOUSGENT_HALO_API_KEY="" # optional bearer token if your local gateway requires auth
```

Check connectivity and loaded models anytime:

```bash
curl -s http://localhost:3000/api/nousgent/halo/status | jq
```

### 2. Configuring Voice Synthesis (`POST /api/nousgent/tts`) to Use a Local Endpoint

By default, NOUSGENT pre-warms its built-in WASM VITS ONNX voice engine (`en_US-joe-medium` shaped with West African Lagos Afrobeat-baritone prosody and DSP) and speaks **only `spokenSummary`** (the direct answer sentence, without capsule IDs, hashes, or trailing metadata).

To offload TTS to a local neural voice server on your Ryzen AI Halo (such as `Kokoro-FastAPI`, `speaches`, `openedai-speech`, or a local `piper` HTTP daemon), set:

```bash
# Option A: OpenAI-compatible /v1/audio/speech endpoint (Kokoro-FastAPI, speaches, openedai-speech)
export NOUSGENT_VOICE_TTS_URL="http://halo.local:8880/v1/audio/speech"
export NOUSGENT_VOICE_TTS_PROTOCOL="openai"
export NOUSGENT_VOICE_TTS_MODEL="kokoro"
export NOUSGENT_VOICE_TTS_VOICE="am_adam"
export NOUSGENT_VOICE_TTS_API_KEY="" # optional; falls back to NOUSGENT_HALO_API_KEY

# Option B: Native Piper HTTP server (POST { text, voice, length_scale } -> audio/wav)
export NOUSGENT_VOICE_TTS_URL="http://halo.local:5000"
export NOUSGENT_VOICE_TTS_PROTOCOL="piper-http"
export NOUSGENT_VOICE_TTS_VOICE="en_US-joe-medium"
```

If the local TTS server is temporarily unreachable, NOUSGENT falls back seamlessly to its built-in ONNX voice synthesizer without failing the request.

### 3. Configuring Autonomous Agent Processes to Use a Local Model

Background and M2M agent processes can share `NOUSGENT_HALO_BASE_URL` or target dedicated models/ports on your Ryzen AI Halo (for example, running a fast 8B/14B model for interactive Q&A and a larger 70B/120B model on Strix Halo unified memory for RSI synthesis and dream consolidation):

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `NOUSGENT_HALO_BASE_URL` | `""` | Master OpenAI-compatible base URL (`/v1/chat/completions`, `/v1/embeddings`, `/v1/models`) |
| `NOUSGENT_LLM_URL` | `""` | Override chat-completions URL specifically for interactive Q&A fallback |
| `NOUSGENT_LLM_MODEL` | `"qwen3:32b"` | Model ID for interactive Q&A fallback |
| `NOUSGENT_LLM_TIMEOUT_MS` | `"12000"` | Per-request timeout (ms) for local inference |
| `NOUSGENT_LLM_MAX_TOKENS` | `"320"` | Max completion tokens |
| `NOUSGENT_RSI_AGENT_LLM_URL` | Inherits `NOUSGENT_LLM_URL` | Override chat-completions URL for autonomous agent loops |
| `NOUSGENT_RSI_AGENT_MODEL` | Inherits `NOUSGENT_LLM_MODEL` | Model ID for RSI synthesis, Benna-Fusi dream consolidation, and redteam auditing |
| `NOUSGENT_EMBEDDING_URL` | `""` | Override `/v1/embeddings` URL for local vector indexing |
| `NOUSGENT_EMBEDDING_MODEL` | `"nomic-embed-text"` | Embedding model ID |
| `NOUSGENT_MASK_OPACITY_PCT` | `"65"` | 3D persona mask opacity (`0`–`100`) |

Invoke Ring-0-screened local agent processes over HTTP or MCP (`nousgent_local_agent_infer`):

```bash
# Autonomous agent roles: persona_qa | rsi_synthesizer | dream_consolidator | redteam_auditor | general_agent
curl -s -X POST http://localhost:3000/api/nousgent/agents/infer \
  -H "Content-Type: application/json" \
  -d '{
    "role": "rsi_synthesizer",
    "prompt": "Distill the CLVM minimal integer encoding rule into a single verifiable invariant."
  }' | jq

# Local embeddings via Ryzen AI Halo
curl -s -X POST http://localhost:3000/api/nousgent/agents/embed \
  -H "Content-Type: application/json" \
  -d '{"input": "Mode-2 deterministic vote nullifier on chia-dao-v1"}' | jq
```

### 4. Applying Local Model Settings in Kubernetes (`kind-kind` or Bare-Metal)

Edit [`deploy/resources/k8s/01-configmap.yaml`](./deploy/resources/k8s/01-configmap.yaml) prior to running `deploy.sh`, or patch the live cluster ConfigMap directly:

```bash
kubectl patch configmap nousgent-config -n dbrain --type merge -p '{
  "data": {
    "NOUSGENT_HALO_BASE_URL": "http://192.168.1.50:11434/v1",
    "NOUSGENT_LLM_MODEL": "qwen3:32b",
    "NOUSGENT_RSI_AGENT_MODEL": "llama3.3:70b",
    "NOUSGENT_VOICE_TTS_URL": "http://192.168.1.50:8880/v1/audio/speech",
    "NOUSGENT_VOICE_TTS_PROTOCOL": "openai",
    "NOUSGENT_VOICE_TTS_MODEL": "kokoro",
    "NOUSGENT_VOICE_TTS_VOICE": "am_adam"
  }
}'
kubectl rollout restart statefulset/nousgent-web -n dbrain
```

---

## `chia-dao-v1` Governance & Bounded RSI Mission Voting

Bounded RSI upgrades advance through a two-stage constitutional governance pipeline on the **Signing** (`/missions`) page and MCP server:

1. **Stage 1 — `chia-dao-v1` Proposal & DID Voting (`1 $DIG = 1,000 CAT2 mojos`)**:
   - Citizens and community Brain Stores propose Bounded RSI missions (`POST /api/nousgent/dao/proposals` or MCP `nousgent_create_dao_proposal`) across `CAPABILITY_SYNTHESIS`, `IMMUNE_ANTIBODY`, `DREAM_CONSOLIDATION`, and `LOCAL_HALO_BENCHMARK`.
   - Voters cast `FOR`, `AGAINST`, or `ABSTAIN` ballots (`POST /api/nousgent/dao/vote` or MCP `nousgent_cast_dao_vote`) weighted in exact `$DIG` CAT2 `BigInt` mojos (`10^3` scale) plus enlisted citizen node XP (`1 XP = 1 CAT2 mojo`).
   - Every ballot records a deterministic **Mode-2 nullifier** (`sha256(0x02 || voter_did || "|" || mission_id)`), rejecting duplicate votes (`HTTP 409 DUPLICATE_VOTE_NULLIFIER`). Reaching the `10,000.000 $DIG` quorum with `FOR > AGAINST` advances the mission to `DAO_APPROVED_AWAITING_SIGNING`.
2. **Stage 2 — Two-Key `CHIP-0043` Clear-Signing (`-32044`)**:
   - Hardware FIDO2 passkey (`Key A`) and Swarm BLS G2 telemetry (`Key B`) co-sign the `ur:chia-clear-sign/v1/...` digest (`POST /api/nousgent/missions/clear-sign`) to seal execution (`CHIP0043_QUORUM_SEALED`).
