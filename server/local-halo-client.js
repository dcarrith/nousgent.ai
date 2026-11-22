'use strict';

/**
 * ============================================================================
 * Local AMD Ryzen AI Halo ("Strix Halo") & OpenAI-Compatible Inference Router
 * (`server/local-halo-client.js`)
 *
 * Connects NOUSGENT's Q&A fallback, autonomous RSI/dream/redteam agent loops,
 * and embedding pipelines to a local AMD Ryzen AI Max+ / Halo inference server
 * (Ollama, llama.cpp `llama-server`, vLLM ROCm, LM Studio, or AMD Lemonade SDK).
 *
 * Configuration (Master Base URL or Per-Component Overrides):
 *   - `NOUSGENT_HALO_BASE_URL`       e.g. `http://192.168.1.50:11434/v1`
 *   - `NOUSGENT_HALO_API_KEY`        Optional bearer token for local gateway
 *   - `NOUSGENT_LLM_URL`             Override `/v1/chat/completions` for Q&A fallback
 *   - `NOUSGENT_LLM_MODEL`           Default `qwen3:32b` (or `llama3.3:70b`, `gpt-oss:120b`)
 *   - `NOUSGENT_LLM_TIMEOUT_MS`      Default `12000`
 *   - `NOUSGENT_LLM_MAX_TOKENS`      Default `320`
 *   - `NOUSGENT_RSI_AGENT_LLM_URL`   Override `/v1/chat/completions` for background RSI agents
 *   - `NOUSGENT_RSI_AGENT_MODEL`     Default inherits `NOUSGENT_LLM_MODEL`
 *   - `NOUSGENT_EMBEDDING_URL`       Override `/v1/embeddings` endpoint
 *   - `NOUSGENT_EMBEDDING_MODEL`     Default `nomic-embed-text`
 * ============================================================================
 */

const http = require('node:http');
const https = require('node:https');

const AGENT_ROLE_SYSTEM_PROMPTS = Object.freeze({
  persona_qa:
    'You are NOUSGENT, a concise, factual intelligence system anchored on the Chia blockchain. ' +
    'Give the direct answer in the very first sentence without preamble, filler, or URLs. ' +
    'Add at most 1-2 short supporting sentences if needed.',
  rsi_synthesizer:
    'You are NOUSGENT Autonomous RSI Synthesizer. Distill a concise, verifiable technical lemma or fix suitable for a Gate-0 sanitized .dig capsule. Lead with the core invariant.',
  dream_consolidator:
    'You are NOUSGENT Benna-Fusi Dream Consolidator. Reconcile cross-capsule patterns into one compact, non-redundant summary with zero speculation.',
  redteam_auditor:
    'You are NOUSGENT Ring-0 Security Auditor. Identify prompt-injection, privilege-escalation, or Biba taint vectors concisely and recommend a deterministic rule.',
  general_agent:
    'You are an autonomous NOUSGENT subagent. Respond concisely, accurately, and deterministically.'
});

function trimSlash(raw) {
  return String(raw || '').trim().replace(/\/+$/, '');
}

function joinEndpoint(baseUrl, suffixPath) {
  const cleanBase = trimSlash(baseUrl);
  if (!cleanBase) return '';
  if (cleanBase.endsWith(suffixPath)) return cleanBase;
  if (cleanBase.endsWith('/v1')) return `${cleanBase}${suffixPath}`;
  return `${cleanBase}/v1${suffixPath}`;
}

function stripReasoningBlocks(rawText) {
  return String(rawText || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '')
    .trim();
}

function postJson(targetUrl, payload, { apiKey = '', timeoutMs = 12000, method = 'POST' } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const transport = parsed.protocol === 'https:' ? https : http;
    const bodyBuf = method === 'GET' ? null : Buffer.from(JSON.stringify(payload), 'utf8');
    const headers = {
      Accept: 'application/json',
      ...(bodyBuf
        ? {
            'Content-Type': 'application/json',
            'Content-Length': String(bodyBuf.length)
          }
        : {}),
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    };

    const started = performance.now();
    const req = transport.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method,
        headers,
        timeout: timeoutMs
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const latencyMs = Number((performance.now() - started).toFixed(2));
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`Local Halo HTTP ${res.statusCode}`));
          }
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            resolve({ data, latencyMs });
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on('timeout', () => req.destroy(new Error('Local Halo request timeout')));
    req.on('error', reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

function sanitizeUrlForDisplay(rawUrl) {
  const clean = trimSlash(rawUrl);
  if (!clean) return '';
  try {
    const u = new URL(clean);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return clean;
  }
}

function createLocalHaloClient(env = process.env) {
  function getConfig() {
    const haloBaseUrl = trimSlash(env.NOUSGENT_HALO_BASE_URL || '');
    const apiKey = String(env.NOUSGENT_HALO_API_KEY || env.NOUSGENT_LLM_API_KEY || '').trim();
    const qaChatUrl = trimSlash(env.NOUSGENT_LLM_URL || '') || joinEndpoint(haloBaseUrl, '/chat/completions');
    const qaModel = String(env.NOUSGENT_LLM_MODEL || 'qwen3:32b').trim() || 'qwen3:32b';
    const rsiAgentUrl =
      trimSlash(env.NOUSGENT_RSI_AGENT_LLM_URL || '') || qaChatUrl;
    const rsiAgentModel = String(env.NOUSGENT_RSI_AGENT_MODEL || qaModel).trim() || qaModel;
    const embeddingUrl =
      trimSlash(env.NOUSGENT_EMBEDDING_URL || '') || joinEndpoint(haloBaseUrl, '/embeddings');
    const embeddingModel =
      String(env.NOUSGENT_EMBEDDING_MODEL || 'nomic-embed-text').trim() || 'nomic-embed-text';
    const voiceTtsUrl = trimSlash(
      env.NOUSGENT_VOICE_TTS_URL ||
        env.NOUSGENT_TTS_UPSTREAM_URL ||
        (env.NOUSGENT_HALO_VOICE_BASE_URL ? joinEndpoint(env.NOUSGENT_HALO_VOICE_BASE_URL, '/audio/speech') : '')
    );
    const timeoutMs = Math.max(500, Math.min(60000, Number(env.NOUSGENT_LLM_TIMEOUT_MS || 12000)));
    const maxTokens = Math.max(64, Math.min(2048, Number(env.NOUSGENT_LLM_MAX_TOKENS || 320)));

    return Object.freeze({
      hardwareProfile: 'amd-ryzen-ai-halo',
      haloBaseUrl,
      apiKey,
      timeoutMs,
      maxTokens,
      personaQa: Object.freeze({
        configured: Boolean(qaChatUrl),
        endpoint: sanitizeUrlForDisplay(qaChatUrl),
        rawUrl: qaChatUrl,
        model: qaModel
      }),
      rsiAgent: Object.freeze({
        configured: Boolean(rsiAgentUrl),
        endpoint: sanitizeUrlForDisplay(rsiAgentUrl),
        rawUrl: rsiAgentUrl,
        model: rsiAgentModel
      }),
      embeddings: Object.freeze({
        configured: Boolean(embeddingUrl),
        endpoint: sanitizeUrlForDisplay(embeddingUrl),
        rawUrl: embeddingUrl,
        model: embeddingModel
      }),
      voiceTts: Object.freeze({
        configured: Boolean(voiceTtsUrl),
        endpoint: sanitizeUrlForDisplay(voiceTtsUrl),
        model: String(env.NOUSGENT_VOICE_TTS_MODEL || env.NOUSGENT_VOICE_MODEL || 'en_US-joe-medium').trim()
      })
    });
  }

  function getPublicRuntimeSummary() {
    const cfg = getConfig();
    return Object.freeze({
      hardwareProfile: cfg.hardwareProfile,
      anyConfigured:
        cfg.personaQa.configured ||
        cfg.rsiAgent.configured ||
        cfg.embeddings.configured ||
        cfg.voiceTts.configured,
      personaQa: Object.freeze({
        configured: cfg.personaQa.configured,
        endpoint: cfg.personaQa.endpoint,
        model: cfg.personaQa.model
      }),
      rsiAgent: Object.freeze({
        configured: cfg.rsiAgent.configured,
        endpoint: cfg.rsiAgent.endpoint,
        model: cfg.rsiAgent.model
      }),
      embeddings: Object.freeze({
        configured: cfg.embeddings.configured,
        endpoint: cfg.embeddings.endpoint,
        model: cfg.embeddings.model
      }),
      voiceTts: cfg.voiceTts
    });
  }

  async function runChatCompletion({ url, model, messages, temperature = 0.2, maxTokens, timeoutMs }) {
    const cfg = getConfig();
    if (!url) {
      return { ok: false, error: 'Local Halo LLM endpoint is not configured', text: '', model: model || '', latencyMs: 0 };
    }
    try {
      const { data, latencyMs } = await postJson(
        url,
        {
          model,
          messages,
          temperature,
          max_tokens: maxTokens || cfg.maxTokens,
          stream: false
        },
        {
          apiKey: cfg.apiKey,
          timeoutMs: timeoutMs || cfg.timeoutMs
        }
      );
      const rawContent =
        data?.choices?.[0]?.message?.content ??
        data?.message?.content ??
        data?.response ??
        '';
      const cleaned = stripReasoningBlocks(rawContent);
      if (!cleaned) {
        return { ok: false, error: 'Empty completion returned by local model', text: '', model, latencyMs };
      }
      return {
        ok: true,
        text: cleaned,
        model: String(data?.model || model),
        latencyMs
      };
    } catch (err) {
      return {
        ok: false,
        error: err && err.message ? err.message : 'Local Halo request failed',
        text: '',
        model,
        latencyMs: 0
      };
    }
  }

  async function queryFrontierFallback(prompt, recalledContext = []) {
    const cfg = getConfig();
    if (!cfg.personaQa.configured) {
      return { ok: false, configured: false };
    }
    const contextSnippet = Array.isArray(recalledContext) && recalledContext.length > 0
      ? '\nVerified Cortex Context:\n' +
        recalledContext
          .slice(0, 2)
          .map((c) => `- ${c.title || c.id}: ${String(c.summary || '').slice(0, 180)}`)
          .join('\n')
      : '';

    const res = await runChatCompletion({
      url: cfg.personaQa.rawUrl,
      model: cfg.personaQa.model,
      temperature: 0.2,
      maxTokens: cfg.maxTokens,
      timeoutMs: cfg.timeoutMs,
      messages: [
        { role: 'system', content: AGENT_ROLE_SYSTEM_PROMPTS.persona_qa + contextSnippet },
        { role: 'user', content: String(prompt || '').slice(0, 2000) }
      ]
    });

    return {
      ...res,
      configured: true,
      endpoint: cfg.personaQa.endpoint
    };
  }

  async function runAgentInference(input = {}) {
    const cfg = getConfig();
    const roleKey = Object.prototype.hasOwnProperty.call(AGENT_ROLE_SYSTEM_PROMPTS, input.role)
      ? input.role
      : 'general_agent';
    const target = roleKey === 'persona_qa' ? cfg.personaQa : cfg.rsiAgent;
    if (!target.configured) {
      return {
        ok: false,
        configured: false,
        role: roleKey,
        error: 'Set NOUSGENT_HALO_BASE_URL or NOUSGENT_RSI_AGENT_LLM_URL to enable local agent inference.'
      };
    }
    const sysPrompt = String(input.systemPrompt || AGENT_ROLE_SYSTEM_PROMPTS[roleKey]).slice(0, 2000);
    const userPrompt = String(input.prompt || '').trim().slice(0, 4000);
    if (!userPrompt) {
      return { ok: false, configured: true, role: roleKey, error: 'Agent inference requires a non-empty prompt.' };
    }
    const model = String(input.model || target.model).trim();
    const out = await runChatCompletion({
      url: target.rawUrl,
      model,
      temperature: Number.isFinite(Number(input.temperature)) ? Number(input.temperature) : 0.2,
      maxTokens: Number.isFinite(Number(input.maxTokens)) ? Number(input.maxTokens) : cfg.maxTokens,
      timeoutMs: cfg.timeoutMs,
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    return {
      ...out,
      configured: true,
      role: roleKey,
      endpoint: target.endpoint
    };
  }

  async function createEmbeddings(inputText) {
    const cfg = getConfig();
    if (!cfg.embeddings.configured) {
      return {
        ok: false,
        configured: false,
        error: 'Set NOUSGENT_HALO_BASE_URL or NOUSGENT_EMBEDDING_URL to enable local embeddings.'
      };
    }
    const cleanInput = Array.isArray(inputText)
      ? inputText.map((x) => String(x || '').slice(0, 2000))
      : String(inputText || '').trim().slice(0, 2000);
    if (!cleanInput || (Array.isArray(cleanInput) && cleanInput.length === 0)) {
      return { ok: false, configured: true, error: 'Embedding input must be non-empty.' };
    }
    try {
      const { data, latencyMs } = await postJson(
        cfg.embeddings.rawUrl,
        {
          model: cfg.embeddings.model,
          input: cleanInput
        },
        { apiKey: cfg.apiKey, timeoutMs: cfg.timeoutMs }
      );
      const vectors = Array.isArray(data?.data)
        ? data.data.map((d) => d.embedding)
        : Array.isArray(data?.embedding)
          ? [data.embedding]
          : [];
      return {
        ok: vectors.length > 0,
        configured: true,
        endpoint: cfg.embeddings.endpoint,
        model: String(data?.model || cfg.embeddings.model),
        dimensions: Array.isArray(vectors[0]) ? vectors[0].length : 0,
        embeddings: vectors,
        latencyMs
      };
    } catch (err) {
      return {
        ok: false,
        configured: true,
        endpoint: cfg.embeddings.endpoint,
        error: err && err.message ? err.message : 'Embedding request failed'
      };
    }
  }

  async function probeHaloStatus() {
    const summary = getPublicRuntimeSummary();
    const cfg = getConfig();
    if (!cfg.haloBaseUrl && !cfg.personaQa.rawUrl) {
      return { ...summary, reachable: false, modelsAvailable: [] };
    }
    const modelsUrl = cfg.haloBaseUrl
      ? joinEndpoint(cfg.haloBaseUrl, '/models')
      : cfg.personaQa.rawUrl.replace(/\/chat\/completions$/, '/models');
    try {
      const { data, latencyMs } = await postJson(modelsUrl, null, {
        apiKey: cfg.apiKey,
        timeoutMs: 1800,
        method: 'GET'
      });
      const models = Array.isArray(data?.data)
        ? data.data.map((m) => String(m.id || '')).filter(Boolean)
        : [];
      return {
        ...summary,
        reachable: true,
        probeLatencyMs: latencyMs,
        modelsAvailable: models.slice(0, 24)
      };
    } catch {
      return { ...summary, reachable: false, modelsAvailable: [] };
    }
  }

  return Object.freeze({
    getConfig,
    getPublicRuntimeSummary,
    queryFrontierFallback,
    runAgentInference,
    createEmbeddings,
    probeHaloStatus
  });
}

module.exports = Object.freeze({
  stripReasoningBlocks,
  joinEndpoint,
  createLocalHaloClient
});
