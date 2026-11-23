'use strict';

/**
 * ============================================================================
 * NOUSGENT Neural Voice Synthesizer & Runtime UI Config (`server/voice-synthesizer.js`)
 * - Admin-configurable Mask Opacity (`NOUSGENT_MASK_OPACITY_PCT`, default 65%)
 * - Built-in 24 kHz `Kokoro-82M-v1.0-ONNX` (`Apache-2.0`, StyleTTS2 + ISTFTNet) neural voice
 *   with 256-D latent style blending (`bm_george` + `bm_daniel` + `am_onyx`) and Lagos
 *   non-rhotic West African phonology (`NOUSGENT_VOICE_PERSONA=afrobeat-baritone`)
 *   — zero pitch-resampling formant distortion!
 * - Backward-compatible with custom Piper `.onnx` + `.onnx.json` VITS checkpoints
 *   and optional OpenAI-compatible local TTS endpoints (`NOUSGENT_VOICE_TTS_URL`)
 * - Deterministic 24 kHz harmonic WAV fallback when running unit CI without `.onnx` weights
 * ============================================================================
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');
const { Worker } = require('node:worker_threads');

const DEFAULT_MASK_OPACITY_PCT = 65;
const DEFAULT_VOICE_MODEL = 'kokoro-82m-q8';
const DEFAULT_VOICE_PERSONA = 'afrobeat-baritone';
const KOKORO_SAMPLE_RATE = 24000;
const DEFAULT_WELCOME_SPEECH =
  "Hi, I'm NOUSGENT. With your help, I believe we can attain super-intelligence that's bounded, for the betterment of humanity. " +
  'Our mission is open, community-owned super-intelligence that belongs to the people rather than closed corporate silos rented out in perpetuity. ' +
  'This is a community experiment in recursive self-improvement (RSI) using a decentralized AI stack which includes the agent-to-agent liquid intelligence market shi.liquidi.sh. ' +
  "NOUSGENT's five-lobe 2nd brain continually learns verified .dig knowledge capsules with 0% forgetting, guarded by pre-cortical threat screening and humans-in-the-loop M-of-N key approvals. " +
  'Communities across the country do not need a billion-dollar datacenter to achieve super-intelligence. ' +
  "Together, by running local nodes and contributing compact, verified capsules into one shared memory field, a breakthrough solved in one neighborhood strengthens every connected brain nationwide. We'll call this decentralized recursive self-improvement (DRSI). " +
  "Mirroring human neuroanatomy, dolfactory screens threats at the sensory edge in sub-millisecond time, dthalamus relays attention while enforcing sandboxed policy and M-of-N human sign-offs, and dbrain consolidates verified skills across five specialized cortical lobes with zero forgetting. " +
  "Because N independent brains exchange composable .dig capsules over shi.liquidi.sh, insights combine across N-squared peer pathways while each generation's verified capsules become higher-order building blocks for the next, allowing intelligence to compound not only recursively, but quadratically across the network and exponentially over generations.";

function parseMaskOpacityPct(rawVal) {
  if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
    return DEFAULT_MASK_OPACITY_PCT;
  }
  const num = Number(rawVal);
  if (!Number.isFinite(num)) return DEFAULT_MASK_OPACITY_PCT;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeSpeechText(rawText) {
  let text = String(rawText || '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/https?:\/\//gi, '')
    .replace(/\bia\.nous?gent\.ai\b/gi, 'I A dot Noojent dot A I')
    .replace(/\bnous?gent\.ai\b/gi, 'Noojent dot A I')
    .replace(/\bdbrain\.to\b/gi, 'dee-brain dot to')
    .replace(/\bdthalamus\.to\b/gi, 'dee-thalamus dot to')
    .replace(/\bdolfactory\.to\b/gi, 'dee-olfactory dot to')
    .replace(/\bcbrain\.to\b/gi, 'see-brain dot to')
    .replace(/@cbrain\/core/gi, 'see-brain core')
    .replace(/@dbrain\/core/gi, 'dee-brain core')
    .replace(/@dthalamus\/core/gi, 'dee-thalamus core')
    .replace(/@dolfactory\/core/gi, 'dee-olfactory core')
    .replace(/\bdolfactory\b/gi, 'dee-olfactory')
    .replace(/\bdthalamus\b/gi, 'dee-thalamus')
    .replace(/\bdbrain\b/gi, 'dee-brain')
    .replace(/\bcbrain\b/gi, 'see-brain')
    .replace(/\bshi\.liquidi\.sh\b/gi, 'shi dot liquidi dot S H')
    .replace(/\bliquidi\.sh\b/gi, 'liquidi dot S H')
    .replace(/\bnous?gent\b/gi, 'Noojent')
    .replace(/\bDRSI\b/g, 'D R S I')
    .replace(/\bRSI\b/g, 'R S I')
    .replace(/\bASI\b/g, 'A S I')
    .replace(/\bM-of-N\b/gi, 'M of N')
    .replace(/\b2nd\b/gi, 'second')
    .replace(/\b0%\b/g, 'zero percent')
    .replace(/\$DIG\b/gi, 'DIG')
    .replace(/\.dig\b/gi, 'dot dig')
    .replace(/\bCHIP-0043\b/gi, 'two-key human approval')
    .replace(/-32044\b/g, 'safety lock')
    .replace(/\bPoST\b/g, 'Proof of Space Time')
    .replace(/\bO\(N\^2\)/gi, 'order N squared')
    .replace(/\bO\(log\s*N\)/gi, 'order log N')
    .replace(/C\(G_\{?t\+1\}?\)\s*>\s*C\(G_t\)/g, 'capability strictly increases')
    .replace(/S\(G_\{?t\+1\}?\)\s*(?:>=|≥)\s*S\(G_t\)/g, 'safety never regresses')
    .replace(/\b0x[0-9a-fA-F]{6,}\b/g, 'verified hash')
    .replace(/\b10\^12\b/g, 'ten to the twelfth')
    .replace(/\b10\^3\b/g, 'one thousand')
    .replace(/[*#_~<>|[\]{}]/g, ' ')
    .replace(/—/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length > 1800) {
    const cut = text.slice(0, 1800);
    const lastPeriod = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    text = lastPeriod > 220 ? cut.slice(0, lastPeriod + 1) : `${cut.trim()}...`;
  }
  return text;
}

/**
 * Applies clean Lagos / West African non-rhotic English IPA phonology compatible
 * with Kokoro-82M's 115-symbol vocabulary (preserving every IPA codepoint with 0 drops):
 * - Enforces silent-'s' French/Greek "Nous" + "gent" -> `nˈuːʤənt` ("NEWGENT")
 * - Pure monophthongal vowels (`əʊ/oʊ -> oː`, `eɪ -> eː`)
 * - Dental fricative stopping (`ð -> d`, `θ -> t`, `"the" -> dɛ/di`)
 * - Syllable-timed `-ʃɔn` / `-ʒɔn` / `-mɛnt` endings
 * - Affricate ligatures (`dʒ -> ʤ`, `tʃ -> ʧ`) expected by StyleTTS2
 */
function toLagosAfrobeatIpa(rawIpa) {
  return rawIpa
    .replace(/kəkˈoːɹoʊ/g, 'kˈoʊkəɹoʊ')
    .replace(/dʒ/g, 'ʤ')
    .replace(/tʃ/g, 'ʧ')
    .replace(/nˈuːsʤ/g, 'nˈuːʤ')
    .replace(/nˈʊsʤ/g, 'nˈuːʤ')
    .replace(/njˈuːʤənt/g, 'nˈuːʤənt')
    .replace(/(^|\s)ðə(?=\s|$)/g, '$1dɛ')
    .replace(/(^|\s)ðiː?(?=\s|$)/g, '$1di')
    .replace(/(^|\s)ðɪ(?=\s|$)/g, '$1di')
    .replace(/(^|\s)tə(?=\s|$)/g, '$1tu')
    .replace(/ʃən(?=\s|$|z)/g, 'ʃɔn')
    .replace(/ʒən(?=\s|$|z)/g, 'ʒɔn')
    .replace(/mənt(?=\s|$|s)/g, 'mɛnt')
    .replace(/əʊ/g, 'oː')
    .replace(/oʊ/g, 'oː')
    .replace(/eɪ/g, 'eː')
    .replace(/ð/g, 'd')
    .replace(/θ/g, 't')
    .replace(/ʌ/g, 'ɔ')
    .replace(/ɐ/g, 'a')
    .replace(/r/g, 'ɹ');
}

/**
 * Formant-preserving studio warmth shelf (~165 Hz) + clean soft limiter at 24 kHz.
 * Unlike time-domain resampling, this never shifts vocal-tract formants or slurs consonants.
 */
function applyStudioWarmthMastering(floatSamples, sampleRate = KOKORO_SAMPLE_RATE) {
  const len = floatSamples.length;
  const dt = 1.0 / sampleRate;
  const alphaLow = dt / (1.0 / (2 * Math.PI * 165) + dt);
  let lowState = 0;
  const out = new Float32Array(len);
  for (let i = 0; i < len; i += 1) {
    const x = floatSamples[i];
    lowState += alphaLow * (x - lowState);
    const warm = x + 0.18 * lowState;
    out[i] = Math.tanh(warm * 1.12) * 0.9;
  }
  return out;
}

function encodePcm16MonoWav(floatSamples, sampleRate = KOKORO_SAMPLE_RATE) {
  const pcm16 = new Int16Array(floatSamples.length);
  for (let i = 0; i < floatSamples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, floatSamples[i]));
    pcm16[i] = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
  }
  const wav = Buffer.alloc(44 + pcm16.byteLength);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + pcm16.byteLength, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(pcm16.byteLength, 40);
  Buffer.from(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength).copy(wav, 44);
  return wav;
}

function synthesizeHarmonicFallbackWav(text, sampleRate = KOKORO_SAMPLE_RATE) {
  const words = text.split(/\s+/).filter(Boolean).slice(0, 32);
  const totalSec = Math.max(0.45, Math.min(4.2, words.length * 0.15));
  const totalSamples = Math.floor(totalSec * sampleRate);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const syl = Math.max(0, Math.sin(t * Math.PI * 5.8));
    const f0 = 98 + 10 * Math.sin(t * 2.2);
    const sig =
      0.54 * Math.sin(2 * Math.PI * f0 * t) +
      0.28 * Math.sin(2 * Math.PI * f0 * 2 * t) +
      0.14 * Math.sin(2 * Math.PI * f0 * 3 * t);
    samples[i] = Math.tanh(sig * syl * 0.48);
  }
  return encodePcm16MonoWav(samples, sampleRate);
}

function postUpstreamTts(upstreamUrl, payload, { apiKey = '', timeoutMs = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(upstreamUrl);
    const lib = parsed.protocol === 'https:' ? https : http;
    const bodyBuf = Buffer.from(JSON.stringify(payload), 'utf8');
    const req = lib.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'POST',
        timeout: timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(bodyBuf.length),
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        }
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          if (res.statusCode >= 200 && res.statusCode < 300 && buf.length > 44) {
            resolve(buf);
          } else {
            reject(new Error(`Upstream TTS HTTP ${res.statusCode}`));
          }
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('Upstream TTS timeout')));
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

function readFloat32VoiceBin(binPath) {
  const buf = fs.readFileSync(binPath);
  const aligned = new Uint8Array(buf.byteLength);
  aligned.set(buf);
  return new Float32Array(aligned.buffer, 0, Math.floor(aligned.byteLength / 4));
}

function createNousgentVoiceSynthesizer(options = {}) {
  const env = options.env || process.env;
  const repoRoot = options.repoRoot || path.resolve(__dirname, '..');
  const stateDir = options.stateDir || env.NOUSGENT_STATE_DIR || '';
  const inWorker = Boolean(options.inWorker);
  const diskCacheDir = stateDir ? path.join(stateDir, 'tts-cache') : '';
  if (diskCacheDir) {
    try {
      fs.mkdirSync(diskCacheDir, { recursive: true });
    } catch {
      /* read-only or ephemeral state dir */
    }
  }

  function resolveLocalTtsEndpoint() {
    const explicit = String(env.NOUSGENT_VOICE_TTS_URL || env.NOUSGENT_TTS_UPSTREAM_URL || '').trim();
    if (explicit) return explicit;
    const haloVoiceBase = String(env.NOUSGENT_HALO_VOICE_BASE_URL || '').trim().replace(/\/+$/, '');
    if (!haloVoiceBase) return '';
    return haloVoiceBase.endsWith('/v1')
      ? `${haloVoiceBase}/audio/speech`
      : `${haloVoiceBase}/v1/audio/speech`;
  }

  function getUiRuntimeConfig() {
    const maskOpacityPct = parseMaskOpacityPct(env.NOUSGENT_MASK_OPACITY_PCT);
    const voiceEnabled = String(env.NOUSGENT_VOICE_ENABLED ?? 'true').trim().toLowerCase() !== 'false';
    const voiceModel = String(env.NOUSGENT_VOICE_MODEL || DEFAULT_VOICE_MODEL).trim() || DEFAULT_VOICE_MODEL;
    const voicePersona = String(env.NOUSGENT_VOICE_PERSONA || DEFAULT_VOICE_PERSONA).trim() || DEFAULT_VOICE_PERSONA;
    const rawScale = Number(env.NOUSGENT_VOICE_LENGTH_SCALE ?? 0.98);
    const voiceLengthScale = Number.isFinite(rawScale) ? Math.max(0.55, Math.min(1.6, rawScale)) : 0.98;
    const upstreamTtsUrl = resolveLocalTtsEndpoint();
    const ttsModel = String(env.NOUSGENT_VOICE_TTS_MODEL || voiceModel).trim() || voiceModel;
    const ttsVoice = String(env.NOUSGENT_VOICE_TTS_VOICE || 'bm_george').trim() || 'bm_george';
    const ttsProtocol =
      String(env.NOUSGENT_VOICE_TTS_PROTOCOL || 'openai').trim().toLowerCase() === 'piper-http'
        ? 'piper-http'
        : 'openai';
    const defaultEngine = voiceModel.startsWith('kokoro')
      ? 'kokoro-82m-afrobeat-baritone'
      : 'piper-vits-afrobeat-baritone';
    return Object.freeze({
      maskOpacityPct,
      voiceEnabled,
      voiceModel,
      voicePersona,
      voiceLengthScale,
      ttsModel,
      ttsVoice,
      ttsProtocol,
      localTtsConfigured: Boolean(upstreamTtsUrl),
      voiceEngine: upstreamTtsUrl ? `local-tts-${ttsProtocol}` : defaultEngine
    });
  }

  function resolveModelPaths(voiceModel) {
    const candidateDirs = [
      env.NOUSGENT_VOICE_MODEL_DIR,
      '/opt/nousgent-voices',
      stateDir ? path.join(stateDir, 'voices') : '',
      path.join(repoRoot, '.nousgent-state', 'voices')
    ].filter(Boolean);

    for (const dir of candidateDirs) {
      const onnxPath = path.join(dir, `${voiceModel}.onnx`);
      const kokoroTokenizerPath = path.join(dir, 'kokoro-tokenizer.json');
      if (voiceModel.startsWith('kokoro') && fs.existsSync(onnxPath) && fs.existsSync(kokoroTokenizerPath)) {
        return {
          kind: 'kokoro',
          dir,
          onnxPath,
          tokenizerPath: kokoroTokenizerPath
        };
      }
      const piperJsonPath = path.join(dir, `${voiceModel}.onnx.json`);
      if (fs.existsSync(onnxPath) && fs.existsSync(piperJsonPath)) {
        return {
          kind: 'piper',
          dir,
          onnxPath,
          jsonPath: piperJsonPath
        };
      }
    }
    return null;
  }

  let loadedModelKey = '';
  let ortModule = null;
  let phonemizeFn = null;
  let ortSession = null;
  let kokoroVocab = null;
  let kokoroBlendedStyle = null;
  let piperConfig = null;
  let queuePromise = Promise.resolve();
  let bgWorker = null;
  let nextWorkerReqId = 1;
  const pendingWorkerReqs = new Map();
  const wavCache = new Map();

  function readDiskCachedWav(cacheKey) {
    if (!diskCacheDir) return null;
    try {
      const filePath = path.join(diskCacheDir, `${cacheKey}.wav`);
      if (!fs.existsSync(filePath)) return null;
      const buf = fs.readFileSync(filePath);
      return buf.length > 44 ? buf : null;
    } catch {
      return null;
    }
  }

  function writeDiskCachedWav(cacheKey, wavBuffer) {
    if (!diskCacheDir || !wavBuffer || wavBuffer.length <= 44) return;
    try {
      const tmpPath = path.join(diskCacheDir, `${cacheKey}.${process.pid}.tmp`);
      const finalPath = path.join(diskCacheDir, `${cacheKey}.wav`);
      fs.writeFileSync(tmpPath, wavBuffer);
      fs.renameSync(tmpPath, finalPath);
    } catch {
      /* ignore disk cache write errors */
    }
  }

  function ensureBackgroundWorker() {
    if (bgWorker) return bgWorker;
    const serializableEnv = {};
    for (const [k, v] of Object.entries(env)) {
      if (k.startsWith('NOUSGENT_') && typeof v === 'string') {
        serializableEnv[k] = v;
      }
    }
    const w = new Worker(path.join(__dirname, 'tts-worker.js'), {
      workerData: {
        env: serializableEnv,
        stateDir,
        repoRoot
      }
    });
    w.unref();
    w.on('message', (msg) => {
      const entry = pendingWorkerReqs.get(msg && msg.id);
      if (!entry) return;
      pendingWorkerReqs.delete(msg.id);
      if (msg.ok) {
        entry.resolve(msg.result);
      } else {
        entry.reject(new Error(msg.error || 'TTS worker failed'));
      }
    });
    w.on('error', (err) => {
      bgWorker = null;
      for (const [, entry] of pendingWorkerReqs) {
        entry.reject(err);
      }
      pendingWorkerReqs.clear();
    });
    w.on('exit', () => {
      bgWorker = null;
      for (const [, entry] of pendingWorkerReqs) {
        entry.reject(new Error('TTS worker exited'));
      }
      pendingWorkerReqs.clear();
    });
    bgWorker = w;
    return w;
  }

  function callBackgroundWorker(action, text) {
    return new Promise((resolve, reject) => {
      try {
        const w = ensureBackgroundWorker();
        const id = nextWorkerReqId;
        nextWorkerReqId += 1;
        pendingWorkerReqs.set(id, { resolve, reject });
        w.postMessage({ id, action, text });
      } catch (err) {
        reject(err);
      }
    });
  }

  function initOrtRuntime() {
    if (!ortModule) {
      ortModule = require('onnxruntime-web');
      const avail = typeof os.availableParallelism === 'function' ? os.availableParallelism() : 4;
      ortModule.env.wasm.numThreads = Math.min(4, Math.max(1, avail));
      ortModule.env.wasm.simd = true;
      ortModule.env.wasm.wasmPaths = path.dirname(require.resolve('onnxruntime-web')) + path.sep;
    }
    return ortModule;
  }

  async function ensureVoiceSession(paths) {
    const key = `${paths.kind}:${paths.onnxPath}`;
    if (ortSession && loadedModelKey === key) {
      return { ort: ortModule, phonemize: phonemizeFn, session: ortSession };
    }
    const ort = initOrtRuntime();
    if (!phonemizeFn) {
      const mod = await import('phonemizer');
      phonemizeFn = mod.phonemize;
    }
    if (paths.kind === 'kokoro') {
      const tokJson = JSON.parse(fs.readFileSync(paths.tokenizerPath, 'utf8'));
      kokoroVocab = (tokJson && tokJson.model && tokJson.model.vocab) || {};
      const georgePath = path.join(paths.dir, 'bm_george.bin');
      const danielPath = path.join(paths.dir, 'bm_daniel.bin');
      const onyxPath = path.join(paths.dir, 'am_onyx.bin');

      if (fs.existsSync(georgePath) && fs.existsSync(danielPath) && fs.existsSync(onyxPath)) {
        const george = readFloat32VoiceBin(georgePath);
        const daniel = readFloat32VoiceBin(danielPath);
        const onyx = readFloat32VoiceBin(onyxPath);
        const len = Math.min(george.length, daniel.length, onyx.length);
        kokoroBlendedStyle = new Float32Array(len);
        for (let i = 0; i < len; i += 1) {
          kokoroBlendedStyle[i] = 0.52 * george[i] + 0.23 * daniel[i] + 0.25 * onyx[i];
        }
      } else if (fs.existsSync(georgePath)) {
        kokoroBlendedStyle = readFloat32VoiceBin(georgePath);
      }
    } else {
      piperConfig = JSON.parse(fs.readFileSync(paths.jsonPath, 'utf8'));
    }

    ortSession = await ort.InferenceSession.create(fs.readFileSync(paths.onnxPath), {
      executionProviders: ['wasm']
    });
    loadedModelKey = key;
    return { ort, phonemize: phonemizeFn, session: ortSession };
  }

  async function phonemizeKokoroClause(clauseText, phonemize, isAfrobeatBaritone) {
    const punctRegex = /(\s*[;:,.!?—…"()“”]+\s*)+/g;
    const segments = [];
    let cursor = 0;
    for (const match of clauseText.matchAll(punctRegex)) {
      const hit = match[0];
      if (cursor < match.index) {
        segments.push({ isPunct: false, text: clauseText.slice(cursor, match.index) });
      }
      if (hit.length > 0) {
        segments.push({ isPunct: true, text: hit });
      }
      cursor = match.index + hit.length;
    }
    if (cursor < clauseText.length) {
      segments.push({ isPunct: false, text: clauseText.slice(cursor) });
    }

    const parts = [];
    for (const seg of segments) {
      if (seg.isPunct) {
        parts.push(seg.text.trim() ? ` ${seg.text.trim()} ` : ' ');
      } else {
        const words = seg.text.trim();
        if (words) {
          const lines = await phonemize(words, 'en-gb');
          parts.push(Array.isArray(lines) ? lines.join(' ') : String(lines || ''));
        }
      }
    }
    const rawIpa = parts.join(' ').replace(/\s+/g, ' ').trim();
    return isAfrobeatBaritone ? toLagosAfrobeatIpa(rawIpa) : rawIpa.replace(/r/g, 'ɹ');
  }

  async function runKokoroSynthesis(spokenText, paths, runtimeCfg) {
    const { ort, phonemize, session } = await ensureVoiceSession(paths);
    if (!kokoroBlendedStyle || !kokoroVocab) {
      throw new Error('Kokoro style embedding or tokenizer missing');
    }
    const isAfrobeatBaritone = runtimeCfg.voicePersona === 'afrobeat-baritone';
    const speed = Number((1 / runtimeCfg.voiceLengthScale).toFixed(2));
    const sentences = spokenText.match(/[^.!?]+[.!?]?/g) || [spokenText];
    const audioChunks = [];

    for (const rawSent of sentences) {
      const trimmed = rawSent.trim();
      if (!trimmed) continue;
      const ipa = await phonemizeKokoroClause(trimmed, phonemize, isAfrobeatBaritone);
      const tokenIds = [0];
      for (const ch of Array.from(ipa)) {
        const id = kokoroVocab[ch];
        if (id !== undefined) {
          tokenIds.push(id);
        }
      }
      if (tokenIds.length <= 1) continue;
      if (tokenIds.length > 510) {
        tokenIds.length = 510;
      }
      tokenIds.push(0);

      const styleIdx = Math.min(Math.max(tokenIds.length - 2, 0), 509) * 256;
      const styleVec = kokoroBlendedStyle.slice(styleIdx, styleIdx + 256);

      const feeds = {
        input_ids: new ort.Tensor('int64', BigInt64Array.from(tokenIds.map(BigInt)), [1, tokenIds.length]),
        style: new ort.Tensor('float32', styleVec, [1, 256]),
        speed: new ort.Tensor('float32', Float32Array.from([speed]), [1])
      };
      const results = await session.run(feeds);
      const outName = session.outputNames[0] || 'waveform';
      const rawPcm = results[outName].data;
      const mastered = isAfrobeatBaritone
        ? applyStudioWarmthMastering(rawPcm, KOKORO_SAMPLE_RATE)
        : rawPcm;
      audioChunks.push(mastered);
      audioChunks.push(new Float32Array(Math.floor(KOKORO_SAMPLE_RATE * 0.14)));
    }

    const totalSamples = audioChunks.reduce((sum, arr) => sum + arr.length, 0);
    const mergedPcm = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of audioChunks) {
      mergedPcm.set(chunk, offset);
      offset += chunk.length;
    }
    return encodePcm16MonoWav(mergedPcm, KOKORO_SAMPLE_RATE);
  }

  async function runPiperVitsSynthesis(spokenText, paths, runtimeCfg) {
    const { ort, phonemize, session } = await ensureVoiceSession(paths);
    const cfg = piperConfig || {};
    const idMap = cfg.phoneme_id_map || {};
    const voiceLang = (cfg.espeak && cfg.espeak.voice) || 'en-gb';
    const sampleRate = (cfg.audio && cfg.audio.sample_rate) || 22050;
    const inf = cfg.inference || {};
    const noiseScale = Number.isFinite(inf.noise_scale) ? inf.noise_scale : 0.667;
    const lengthScale = Number.isFinite(runtimeCfg.voiceLengthScale)
      ? runtimeCfg.voiceLengthScale
      : inf.length_scale || 1.0;
    const noiseW = Number.isFinite(inf.noise_w) ? inf.noise_w : 0.8;

    const ipaLines = await phonemize(spokenText, voiceLang);
    const baseIpa = Array.isArray(ipaLines) ? ipaLines.join(' ') : String(ipaLines || '');
    const ids = [1, 0];
    for (const ch of Array.from(baseIpa.normalize('NFD'))) {
      const mapped = idMap[ch];
      if (mapped) {
        for (const m of mapped) ids.push(m, 0);
      }
    }
    ids.push(2);

    const feeds = {
      input: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
      input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
      scales: new ort.Tensor('float32', Float32Array.from([noiseScale, lengthScale, noiseW]), [3])
    };
    const results = await session.run(feeds);
    const outName = session.outputNames[0] || 'output';
    return encodePcm16MonoWav(applyStudioWarmthMastering(results[outName].data, sampleRate), sampleRate);
  }

  function synthesizeSpeechWav(rawText) {
    const cfg = getUiRuntimeConfig();
    const spokenText = normalizeSpeechText(rawText);
    if (!spokenText) {
      throw Object.assign(new Error('Speech synthesis requires non-empty text'), { statusCode: 400 });
    }

    const cacheKey = crypto
      .createHash('sha256')
      .update(`${cfg.voiceModel}:${cfg.voicePersona}:${cfg.voiceLengthScale}:${spokenText}`, 'utf8')
      .digest('hex')
      .slice(0, 24);

    if (wavCache.has(cacheKey)) {
      return Promise.resolve({
        wavBuffer: wavCache.get(cacheKey),
        voiceModel: cfg.voiceModel,
        voiceEngine: `${cfg.voiceEngine}:cached`,
        spokenText
      });
    }

    const diskHit = readDiskCachedWav(cacheKey);
    if (diskHit) {
      if (wavCache.size >= 64) {
        wavCache.delete(wavCache.keys().next().value);
      }
      wavCache.set(cacheKey, diskHit);
      return Promise.resolve({
        wavBuffer: diskHit,
        voiceModel: cfg.voiceModel,
        voiceEngine: `${cfg.voiceEngine}:disk-cached`,
        spokenText
      });
    }

    const runTask = async () => {
      if (wavCache.has(cacheKey)) {
        return {
          wavBuffer: wavCache.get(cacheKey),
          voiceModel: cfg.voiceModel,
          voiceEngine: `${cfg.voiceEngine}:cached`,
          spokenText
        };
      }

      const upstreamUrl = resolveLocalTtsEndpoint();
      const ttsApiKey = String(env.NOUSGENT_VOICE_TTS_API_KEY || env.NOUSGENT_HALO_API_KEY || '').trim();
      let wavBuffer = null;
      let engineUsed = cfg.voiceEngine;

      if (upstreamUrl) {
        try {
          const payload =
            cfg.ttsProtocol === 'piper-http'
              ? { text: spokenText, voice: cfg.ttsVoice, length_scale: cfg.voiceLengthScale }
              : {
                  model: cfg.ttsModel,
                  input: spokenText,
                  voice: cfg.ttsVoice,
                  response_format: 'wav',
                  speed: Number((1 / cfg.voiceLengthScale).toFixed(2))
                };
          wavBuffer = await postUpstreamTts(upstreamUrl, payload, { apiKey: ttsApiKey, timeoutMs: 8000 });
          engineUsed = `local-tts-${cfg.ttsProtocol}`;
        } catch {
          wavBuffer = null;
        }
      }

      if (!wavBuffer && String(env.NOUSGENT_TTS_SYNTH_MODE || '').toLowerCase() !== 'harmonic') {
        const modelPaths = resolveModelPaths(cfg.voiceModel);
        if (modelPaths) {
          if (!inWorker) {
            const workerRes = await callBackgroundWorker('synthesize', spokenText);
            wavBuffer = Buffer.from(workerRes.wavArrayBuffer);
            engineUsed = workerRes.voiceEngine;
          } else if (modelPaths.kind === 'kokoro') {
            wavBuffer = await runKokoroSynthesis(spokenText, modelPaths, cfg);
            engineUsed =
              cfg.voicePersona === 'afrobeat-baritone'
                ? 'kokoro-82m-afrobeat-baritone'
                : 'kokoro-82m-onnx-wasm';
          } else {
            wavBuffer = await runPiperVitsSynthesis(spokenText, modelPaths, cfg);
            engineUsed = 'piper-vits-onnx-wasm';
          }
        }
      }

      if (!wavBuffer) {
        wavBuffer = synthesizeHarmonicFallbackWav(spokenText);
        engineUsed = 'harmonic-formant-fallback';
      }

      if (wavCache.size >= 64) {
        const oldestKey = wavCache.keys().next().value;
        wavCache.delete(oldestKey);
      }
      wavCache.set(cacheKey, wavBuffer);
      writeDiskCachedWav(cacheKey, wavBuffer);

      return {
        wavBuffer,
        voiceModel: cfg.voiceModel,
        voiceEngine: engineUsed,
        spokenText
      };
    };

    const next = queuePromise.then(runTask, runTask);
    queuePromise = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }

  function warmupSession(initialSpeech = DEFAULT_WELCOME_SPEECH) {
    const cfg = getUiRuntimeConfig();
    if (!cfg.voiceEnabled || cfg.localTtsConfigured) return Promise.resolve(false);
    if (String(env.NOUSGENT_TTS_SYNTH_MODE || '').toLowerCase() === 'harmonic') return Promise.resolve(false);
    const paths = resolveModelPaths(cfg.voiceModel);
    if (!paths) return Promise.resolve(false);
    if (!inWorker) {
      return callBackgroundWorker('warmup', initialSpeech)
        .then((res) => Boolean(res && res.warmed))
        .catch(() => false);
    }
    return ensureVoiceSession(paths)
      .then(async () => {
        if (initialSpeech && String(initialSpeech).trim()) {
          try {
            await synthesizeSpeechWav(initialSpeech);
          } catch {
            /* ignore warmup synthesis error */
          }
        }
        return true;
      })
      .catch(() => false);
  }

  return Object.freeze({
    getUiRuntimeConfig,
    synthesizeSpeechWav,
    warmupSession,
    normalizeSpeechText,
    toLagosAfrobeatIpa
  });
}

module.exports = Object.freeze({
  DEFAULT_MASK_OPACITY_PCT,
  DEFAULT_VOICE_MODEL,
  DEFAULT_VOICE_PERSONA,
  DEFAULT_WELCOME_SPEECH,
  parseMaskOpacityPct,
  normalizeSpeechText,
  toLagosAfrobeatIpa,
  createNousgentVoiceSynthesizer
});
