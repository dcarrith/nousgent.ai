/**
 * NOUSGENT Neural Voice Client (`src/utils/nousgentVoice.ts`)
 * - Unlocks Web Audio API synchronously inside user click/Enter gestures
 * - Fetches 24 kHz neural StyleTTS2/Kokoro speech WAV from `POST /api/nousgent/tts`
 * - Streams real-time RMS vocal amplitude (0..1) at 60 FPS so NOUSGENT's
 *   sculpted 3D mask mouth & eyes animate in lockstep with spoken syllables
 * - Gracefully handles initial-page-load browser autoplay policies by pre-buffering
 *   the welcome WAV and starting playback immediately (or on first gesture if gated).
 */

export const WELCOME_SPOKEN_MESSAGE =
  'Welcome to Nousgent. Our mission is open, community-owned intelligence that serves the public rather than closed corporate silos. ' +
  'My five-lobe Second Brain continually learns verified knowledge capsules without forgetting past skills, protected by pre-cortical threat screening and two-key human approval. ' +
  'And yes, communities across the country really can pool their resources toward shared super-intelligence: instead of needing one billion-dollar datacenter, local nodes distill breakthroughs into compact, verified capsules, so an insight solved in one town strengthens every connected brain nationwide.';

export interface SpeakCallbacks {
  readonly onStart?: () => void;
  readonly onAmplitude?: (level: number) => void;
  readonly onAutoplayDeferred?: () => void;
  readonly onEnd?: () => void;
}

export interface SpeakOptions {
  readonly autoplayOnFirstGesture?: boolean;
}

let sharedAudioCtx: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeAbortController: AbortController | null = null;
let pendingGestureCleanup: (() => void) | null = null;
let activeRafId = 0;
let currentSpeechToken = 0;

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

/**
 * Must be called synchronously inside a user interaction (`onSubmit` / `onClick`)
 * BEFORE any `await fetch(...)` so Safari, Chrome, and iOS unlock audio playback.
 */
export function unlockNousgentVoiceContext(): AudioContext | null {
  try {
    const Ctor = getAudioContextConstructor();
    if (!Ctor) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new Ctor();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume().catch(() => undefined);
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function stopNousgentVoice(): void {
  currentSpeechToken += 1;
  if (pendingGestureCleanup) {
    pendingGestureCleanup();
    pendingGestureCleanup = null;
  }
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  if (activeRafId) {
    cancelAnimationFrame(activeRafId);
    activeRafId = 0;
  }
  if (activeSourceNode) {
    try {
      activeSourceNode.onended = null;
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {
      /* already stopped */
    }
    activeSourceNode = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

function fallbackBrowserSpeechSynthesis(text: string, token: number, callbacks: SpeakCallbacks): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    callbacks.onEnd?.();
    return;
  }
  try {
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices?.() || [];
    const preferred =
      voices.find((v) => /^en[-_](NG|GH|KE|ZA)/i.test(v.lang)) ||
      voices.find((v) => /^en[-_]GB/i.test(v.lang));
    if (preferred) {
      utter.voice = preferred;
      utter.lang = preferred.lang;
    }
    utter.rate = 0.92;
    utter.pitch = 0.78;
    utter.onstart = () => {
      if (token !== currentSpeechToken) return;
      callbacks.onStart?.();
      callbacks.onAmplitude?.(0.65);
    };
    utter.onend = () => {
      if (token !== currentSpeechToken) return;
      callbacks.onAmplitude?.(0);
      callbacks.onEnd?.();
    };
    utter.onerror = () => {
      if (token !== currentSpeechToken) return;
      callbacks.onAmplitude?.(0);
      callbacks.onEnd?.();
    };
    window.speechSynthesis.speak(utter);
  } catch {
    callbacks.onEnd?.();
  }
}

async function tryResumeWithTimeout(ctx: AudioContext, timeoutMs = 220): Promise<boolean> {
  if (ctx.state === 'running') return true;
  try {
    const resumed = await Promise.race<boolean>([
      ctx
        .resume()
        .then(() => ctx.state === 'running')
        .catch(() => false),
      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(ctx.state === 'running'), timeoutMs);
      })
    ]);
    return resumed;
  } catch {
    return false;
  }
}

async function decodeAndPlayWavBuffer(
  ctx: AudioContext,
  wavBytes: ArrayBuffer,
  myToken: number,
  callbacks: SpeakCallbacks
): Promise<void> {
  const audioBuffer = await ctx.decodeAudioData(wavBytes.slice(0));
  if (myToken !== currentSpeechToken) return;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.55;

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);
  analyser.connect(ctx.destination);
  activeSourceNode = source;

  const timeData = new Uint8Array(analyser.fftSize);
  callbacks.onStart?.();

  const sampleEnvelope = () => {
    if (myToken !== currentSpeechToken || activeSourceNode !== source) return;
    analyser.getByteTimeDomainData(timeData);
    let sumSq = 0;
    for (let i = 0; i < timeData.length; i += 1) {
      const centered = (timeData[i] - 128) / 128;
      sumSq += centered * centered;
    }
    const rms = Math.sqrt(sumSq / timeData.length);
    const normalized = Math.min(1, rms * 4.2);
    callbacks.onAmplitude?.(normalized);
    activeRafId = requestAnimationFrame(sampleEnvelope);
  };

  source.onended = () => {
    if (activeRafId) {
      cancelAnimationFrame(activeRafId);
      activeRafId = 0;
    }
    if (activeSourceNode === source) {
      activeSourceNode = null;
    }
    if (myToken === currentSpeechToken) {
      callbacks.onAmplitude?.(0);
      callbacks.onEnd?.();
    }
  };

  source.start(0);
  activeRafId = requestAnimationFrame(sampleEnvelope);
}

export async function speakNousgentAloud(
  text: string,
  callbacks: SpeakCallbacks = {},
  options: SpeakOptions = {}
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  stopNousgentVoice();
  const myToken = currentSpeechToken;
  const controller = new AbortController();
  activeAbortController = controller;

  const ctx = unlockNousgentVoiceContext();

  try {
    const res = await fetch('/api/nousgent/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed }),
      signal: controller.signal
    });

    if (!res.ok || myToken !== currentSpeechToken) {
      if (myToken === currentSpeechToken && !options.autoplayOnFirstGesture) {
        fallbackBrowserSpeechSynthesis(trimmed, myToken, callbacks);
      }
      return;
    }

    const wavBytes = await res.arrayBuffer();
    if (myToken !== currentSpeechToken) return;

    if (!ctx) {
      if (!options.autoplayOnFirstGesture) {
        fallbackBrowserSpeechSynthesis(trimmed, myToken, callbacks);
      }
      return;
    }

    const canPlayNow = await tryResumeWithTimeout(ctx, 220);
    if (myToken !== currentSpeechToken) return;

    if (canPlayNow) {
      await decodeAndPlayWavBuffer(ctx, wavBytes, myToken, callbacks);
      return;
    }

    if (options.autoplayOnFirstGesture && typeof window !== 'undefined') {
      callbacks.onAutoplayDeferred?.();

      const cleanup = () => {
        window.removeEventListener('pointerdown', onFirstGesture, true);
        window.removeEventListener('keydown', onFirstGesture, true);
        if (pendingGestureCleanup === cleanup) {
          pendingGestureCleanup = null;
        }
      };

      const onFirstGesture = (ev: Event) => {
        if (ev.type === 'keydown') {
          const ke = ev as KeyboardEvent;
          if (ke.key === 'Shift' || ke.key === 'Control' || ke.key === 'Alt' || ke.key === 'Meta' || ke.key === 'Escape') {
            return;
          }
        }
        const targetEl = ev.target instanceof Element ? ev.target : null;
        cleanup();
        if (myToken !== currentSpeechToken) return;
        if (targetEl?.closest('[data-voice-cancel="true"]')) {
          callbacks.onEnd?.();
          return;
        }
        const unlocked = unlockNousgentVoiceContext();
        if (!unlocked) {
          callbacks.onEnd?.();
          return;
        }
        void unlocked
          .resume()
          .then(() => {
            if (myToken !== currentSpeechToken) return;
            return decodeAndPlayWavBuffer(unlocked, wavBytes, myToken, callbacks);
          })
          .catch(() => {
            if (myToken === currentSpeechToken) callbacks.onEnd?.();
          });
      };

      pendingGestureCleanup = cleanup;
      window.addEventListener('pointerdown', onFirstGesture, { capture: true });
      window.addEventListener('keydown', onFirstGesture, { capture: true });
      return;
    }

    fallbackBrowserSpeechSynthesis(trimmed, myToken, callbacks);
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return;
    if (myToken === currentSpeechToken && !options.autoplayOnFirstGesture) {
      fallbackBrowserSpeechSynthesis(trimmed, myToken, callbacks);
    }
  }
}
