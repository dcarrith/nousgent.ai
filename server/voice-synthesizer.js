'use strict';

/**
 * ============================================================================
 * NOUSGENT Neural Voice Synthesizer & Runtime UI Config (`server/voice-synthesizer.js`)
 * - Admin-configurable Mask Opacity (`NOUSGENT_MASK_OPACITY_PCT`, default 65%)
 * - Sovereign Neural VITS ONNX Voice Model (`NOUSGENT_VOICE_MODEL`, default `en_US-joe-medium`)
 * - West African / Lagos Afrobeat-Baritone Phonology & Analog Warmth DSP (`NOUSGENT_VOICE_PERSONA=afrobeat-baritone`)
 *   inspired by iconic Lagos non-rhotic Yoruba-English prosody, deep chest register, and rhythmic cadence
 * - Optional OpenAI-compatible upstream TTS override (`NOUSGENT_TTS_UPSTREAM_URL`)
 * - Deterministic harmonic WAV fallback when running offline/unit CI without `.onnx` weights
 * ============================================================================
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');

const DEFAULT_MASK_OPACITY_PCT = 65;
const DEFAULT_VOICE_MODEL = 'en_US-joe-medium';
const DEFAULT_VOICE_PERSONA = 'afrobeat-baritone';

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
    .replace(/\bia\.nousgent\.ai\b/gi, 'I A dot Noosjent dot A I')
    .replace(/\bnousgent\.ai\b/gi, 'Noosjent dot A I')
    .replace(/\bdbrain\.to\b/gi, 'dee-brain dot to')
    .replace(/\bdthalamus\.to\b/gi, 'dee-thalamus dot to')
    .replace(/\bdolfactory\.to\b/gi, 'dee-olfactory dot to')
    .replace(/\bcbrain\.to\b/gi, 'see-brain dot to')
    .replace(/@cbrain\/core/gi, 'see-brain core')
    .replace(/\bshi\.liquidi\.sh\b/gi, 'shi dot liquidi dot S H')
    .replace(/\bliquidi\.sh\b/gi, 'liquidi dot S H')
    .replace(/\bNOUSGENT\b/gi, 'Noosjent')
    .replace(/\$DIG\b/gi, 'DIG')
    .replace(/\.dig\b/gi, 'dot dig')
    .replace(/\bCHIP-0043\b/gi, 'CHIP zero zero four three')
    .replace(/-32044\b/g, 'minus thirty two zero forty four')
    .replace(/\bPoST\b/g, 'Proof of Space Time')
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

  if (text.length > 620) {
    const cut = text.slice(0, 620);
    const lastPeriod = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    text = lastPeriod > 220 ? cut.slice(0, lastPeriod + 1) : `${cut.trim()}...`;
  }
  return text;
}

/**
 * Applies Lagos Yoruba-English non-rhotic syllable-timed IPA phonology:
 * - Pure monophthongal West African vowels (`eː`, `oː`, `ɔ`, `a`)
 * - Full syllable-timed `-ʃɔn` / `-ʒɔn` / `-mɛnt` / `-dʒɛnt` endings
 * - Dental fricative stopping (`ð -> d`, `θ -> t`, `"the" -> dɛ/di`, `"to" -> tu`)
 * - Word-final `-er/-or/-ar` schwa opening (`-ə -> -a`, `-aʊə -> -aʊwa`)
 * - Strictly non-rhotic coda while preserving prevocalic `ɹ` across stress marks
 */
function toLagosAfrobeatIpa(rawIpa) {
  return rawIpa
    .replace(/(^|\s)ðə(?=\s|$)/g, '$1dɛ')
    .replace(/(^|\s)ðiː?(?=\s|$)/g, '$1di')
    .replace(/(^|\s)ðɪ(?=\s|$)/g, '$1di')
    .replace(/(^|\s)tə(?=\s|$)/g, '$1tu')
    .replace(/(^|\s)tʊ(?=\s|$)/g, '$1tu')
    .replace(/aɪɐm/g, 'aɪ ˈam')
    .replace(/aɪəm/g, 'aɪ ˈam')
    .replace(/ʃən(?=\s|$|z)/g, 'ʃɔn')
    .replace(/ʒən(?=\s|$|z)/g, 'ʒɔn')
    .replace(/mənt(?=\s|$|s)/g, 'mɛnt')
    .replace(/dʒənt(?=\s|$|s)/g, 'dʒɛnt')
    .replace(/(^|\s)tə(?=ɡ|d|m)/g, '$1tu')
    .replace(/aʊə(?=\s|$|z)/g, 'aʊwa')
    .replace(/əʊ/g, 'oː')
    .replace(/oʊ/g, 'oː')
    .replace(/eɪ/g, 'eː')
    .replace(/ð/g, 'd')
    .replace(/θ/g, 't')
    .replace(/ɾ/g, 't')
    .replace(/ɜː/g, 'ɔː')
    .replace(/ʌ/g, 'ɔ')
    .replace(/ɒ/g, 'ɔ')
    .replace(/æ/g, 'a')
    .replace(/ə(?=\s|$)/g, 'a')
    .replace(/ɐ/g, 'a')
    .replace(/ᵻ/g, 'i')
    .replace(/ɹ(?![ˈˌː]?[aeiouɛɔɑɒɪʊəɐæɜ])/g, '');
}

/**
 * Shapes raw VITS float samples into a deep, warm, smoky baritone register:
 * 1. Cubic Hermite vocal-tract & F0 lowering (`pitchRatio = 0.91`)
 * 2. Warm chest-resonance shelf (~175 Hz) + crisp articulation presence (~1.8 kHz)
 * 3. Subtle asymmetric analog tube saturation for soulful baritone rasp
 */
function applyAfrobeatBaritoneDsp(floatSamples, pitchRatio = 0.91, sampleRate = 22050) {
  const outLen = Math.floor(floatSamples.length / pitchRatio);
  const pitched = new Float32Array(outLen);
  for (let i = 0; i < outLen; i += 1) {
    const pos = i * pitchRatio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const y0 = floatSamples[Math.max(0, idx - 1)] || 0;
    const y1 = floatSamples[Math.min(floatSamples.length - 1, idx)] || 0;
    const y2 = floatSamples[Math.min(floatSamples.length - 1, idx + 1)] || 0;
    const y3 = floatSamples[Math.min(floatSamples.length - 1, idx + 2)] || 0;
    const c0 = y1;
    const c1 = 0.5 * (y2 - y0);
    const c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
    const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
    pitched[i] = ((c3 * frac + c2) * frac + c1) * frac + c0;
  }

  const dt = 1.0 / sampleRate;
  const alphaLow = dt / (1.0 / (2 * Math.PI * 175) + dt);
  const alphaPresence = dt / (1.0 / (2 * Math.PI * 1800) + dt);
  let lowState = 0;
  let presLow = 0;
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i += 1) {
    const x = pitched[i];
    lowState += alphaLow * (x - lowState);
    presLow += alphaPresence * (x - presLow);
    const highBand = x - presLow;
    const eq = x + 0.28 * lowState + 0.22 * highBand;
    const driven = eq * 1.24 + 0.035 * eq * eq;
    out[i] = Math.tanh(driven) * 0.88;
  }
  return out;
}

function encodePcm16MonoWav(floatSamples, sampleRate = 22050) {
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

function synthesizeHarmonicFallbackWav(text, sampleRate = 22050) {
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

function createNousgentVoiceSynthesizer(options = {}) {
  const env = options.env || process.env;
  const repoRoot = options.repoRoot || path.resolve(__dirname, '..');
  const stateDir = options.stateDir || env.NOUSGENT_STATE_DIR || '';

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
    const rawScale = Number(env.NOUSGENT_VOICE_LENGTH_SCALE ?? 0.96);
    const voiceLengthScale = Number.isFinite(rawScale) ? Math.max(0.55, Math.min(1.6, rawScale)) : 0.96;
    const upstreamTtsUrl = resolveLocalTtsEndpoint();
    const ttsModel = String(env.NOUSGENT_VOICE_TTS_MODEL || voiceModel).trim() || voiceModel;
    const ttsVoice = String(env.NOUSGENT_VOICE_TTS_VOICE || voiceModel).trim() || voiceModel;
    const ttsProtocol =
      String(env.NOUSGENT_VOICE_TTS_PROTOCOL || 'openai').trim().toLowerCase() === 'piper-http'
        ? 'piper-http'
        : 'openai';
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
      voiceEngine: upstreamTtsUrl ? `local-tts-${ttsProtocol}` : 'piper-vits-afrobeat-baritone'
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
      const jsonPath = path.join(dir, `${voiceModel}.onnx.json`);
      if (fs.existsSync(onnxPath) && fs.existsSync(jsonPath)) {
        return { onnxPath, jsonPath };
      }
    }
    return null;
  }

  let loadedModelKey = '';
  let ortModule = null;
  let phonemizeFn = null;
  let ortSession = null;
  let modelConfig = null;
  let queuePromise = Promise.resolve();
  const wavCache = new Map();

  async function ensurePiperSession(paths) {
    const key = `${paths.onnxPath}`;
    if (ortSession && modelConfig && loadedModelKey === key) {
      return { ort: ortModule, phonemize: phonemizeFn, session: ortSession, cfg: modelConfig };
    }
    if (!ortModule) {
      ortModule = require('onnxruntime-web');
      ortModule.env.wasm.numThreads = 1;
      ortModule.env.wasm.wasmPaths = path.dirname(require.resolve('onnxruntime-web')) + path.sep;
    }
    if (!phonemizeFn) {
      const mod = await import('phonemizer');
      phonemizeFn = mod.phonemize;
    }
    modelConfig = JSON.parse(fs.readFileSync(paths.jsonPath, 'utf8'));
    ortSession = await ortModule.InferenceSession.create(fs.readFileSync(paths.onnxPath), {
      executionProviders: ['wasm']
    });
    loadedModelKey = key;
    return { ort: ortModule, phonemize: phonemizeFn, session: ortSession, cfg: modelConfig };
  }

  async function runPiperVitsSynthesis(spokenText, paths, runtimeCfg) {
    const { ort, phonemize, session, cfg } = await ensurePiperSession(paths);
    const idMap = cfg.phoneme_id_map || {};
    const isAfrobeatBaritone = runtimeCfg.voicePersona === 'afrobeat-baritone';
    const voiceLang = isAfrobeatBaritone ? 'en-gb-x-rp' : (cfg.espeak && cfg.espeak.voice) || 'en-us';
    const sampleRate = (cfg.audio && cfg.audio.sample_rate) || 22050;

    const sentences = spokenText.match(/[^.!?;]+[.!?;]?/g) || [spokenText];
    const audioChunks = [];

    const inf = cfg.inference || {};
    const noiseScale = isAfrobeatBaritone ? 0.68 : Number.isFinite(inf.noise_scale) ? inf.noise_scale : 0.667;
    const lengthScale = Number.isFinite(runtimeCfg.voiceLengthScale)
      ? runtimeCfg.voiceLengthScale
      : inf.length_scale || 1.0;
    const noiseW = isAfrobeatBaritone ? 0.82 : Number.isFinite(inf.noise_w) ? inf.noise_w : 0.8;

    for (const sent of sentences) {
      const subClauses = sent.match(/[^,:.!?;]+[,:.!?;]?/g) || [sent];
      const ids = [1, 0];
      for (const rawClause of subClauses) {
        const punctMatch = rawClause.match(/([,:.!?;])\s*$/);
        const punct = punctMatch ? punctMatch[1] : '';
        const words = rawClause.replace(/[,:.!?;]\s*$/, '').trim();
        if (!words) continue;

        const ipaLines = await phonemize(words, voiceLang);
        const baseIpa = Array.isArray(ipaLines) ? ipaLines.join(' ') : String(ipaLines || '');
        const shapedIpa = (isAfrobeatBaritone ? toLagosAfrobeatIpa(baseIpa) : baseIpa).normalize('NFD');
        for (const ch of Array.from(shapedIpa)) {
          const mapped = idMap[ch];
          if (mapped) {
            for (const m of mapped) ids.push(m, 0);
          }
        }
        if (punct && idMap[punct]) {
          for (const m of idMap[punct]) ids.push(m, 0);
          if (idMap[' ']) {
            for (const m of idMap[' ']) ids.push(m, 0);
          }
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
      const rawPcm = results[outName].data;
      const processedChunk = isAfrobeatBaritone
        ? applyAfrobeatBaritoneDsp(rawPcm, 0.91, sampleRate)
        : rawPcm;
      audioChunks.push(processedChunk);
      audioChunks.push(new Float32Array(Math.floor(sampleRate * (isAfrobeatBaritone ? 0.22 : 0.12))));
    }

    const totalSamples = audioChunks.reduce((sum, arr) => sum + arr.length, 0);
    const mergedPcm = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of audioChunks) {
      mergedPcm.set(chunk, offset);
      offset += chunk.length;
    }
    return encodePcm16MonoWav(mergedPcm, sampleRate);
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
          wavBuffer = await runPiperVitsSynthesis(spokenText, modelPaths, cfg);
          engineUsed =
            cfg.voicePersona === 'afrobeat-baritone' ? 'piper-vits-afrobeat-baritone' : 'piper-vits-onnx-wasm';
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

  function warmupSession() {
    const cfg = getUiRuntimeConfig();
    if (!cfg.voiceEnabled || cfg.localTtsConfigured) return Promise.resolve(false);
    if (String(env.NOUSGENT_TTS_SYNTH_MODE || '').toLowerCase() === 'harmonic') return Promise.resolve(false);
    const paths = resolveModelPaths(cfg.voiceModel);
    if (!paths) return Promise.resolve(false);
    return ensurePiperSession(paths).then(
      () => true,
      () => false
    );
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
  parseMaskOpacityPct,
  normalizeSpeechText,
  toLagosAfrobeatIpa,
  createNousgentVoiceSynthesizer
});
