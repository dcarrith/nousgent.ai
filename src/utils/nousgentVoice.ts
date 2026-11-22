/**
 * NOUSGENT Neural Voice Client (`src/utils/nousgentVoice.ts`)
 * - Unlocks Web Audio API synchronously inside user click/Enter gestures
 * - Fetches 22.05 kHz neural VITS speech WAV from `POST /api/nousgent/tts`
 * - Streams real-time RMS vocal amplitude (0..1) at 60 FPS so NOUSGENT's
 *   sculpted 3D mask mouth & eyes animate in lockstep with spoken syllables.
 */

export interface SpeakCallbacks {
  readonly onStart?: () => void;
  readonly onAmplitude?: (level: number) => void;
  readonly onEnd?: () => void;
}

let sharedAudioCtx: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeAbortController: AbortController | null = null;
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
      void sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function stopNousgentVoice(): void {
  currentSpeechToken += 1;
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

export async function speakNousgentAloud(text: string, callbacks: SpeakCallbacks = {}): Promise<void> {
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
      if (myToken === currentSpeechToken) {
        fallbackBrowserSpeechSynthesis(trimmed, myToken, callbacks);
      }
      return;
    }

    const wavBytes = await res.arrayBuffer();
    if (myToken !== currentSpeechToken) return;

    if (!ctx) {
      fallbackBrowserSpeechSynthesis(trimmed, myToken, callbacks);
      return;
    }
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

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
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return;
    if (myToken === currentSpeechToken) {
      fallbackBrowserSpeechSynthesis(trimmed, myToken, callbacks);
    }
  }
}
