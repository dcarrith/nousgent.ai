'use strict';

const { parentPort, workerData } = require('node:worker_threads');
const { createNousgentVoiceSynthesizer } = require('./voice-synthesizer.js');

const synth = createNousgentVoiceSynthesizer({
  env: (workerData && workerData.env) || process.env,
  stateDir: (workerData && workerData.stateDir) || '',
  repoRoot: (workerData && workerData.repoRoot) || undefined,
  inWorker: true
});

if (parentPort) {
  parentPort.on('message', async (msg) => {
    const id = msg && msg.id;
    const action = msg && msg.action;
    const text = msg && msg.text;
    try {
      if (action === 'warmup') {
        const warmed = await synth.warmupSession(text);
        parentPort.postMessage({ id, ok: true, result: { warmed } });
        return;
      }
      if (action === 'synthesize') {
        const res = await synth.synthesizeSpeechWav(text);
        const copy = new Uint8Array(res.wavBuffer.byteLength);
        copy.set(res.wavBuffer);
        parentPort.postMessage(
          {
            id,
            ok: true,
            result: {
              wavArrayBuffer: copy.buffer,
              voiceModel: res.voiceModel,
              voiceEngine: res.voiceEngine,
              spokenText: res.spokenText
            }
          },
          [copy.buffer]
        );
        return;
      }
      parentPort.postMessage({ id, ok: false, error: `Unknown worker action: ${action}` });
    } catch (err) {
      parentPort.postMessage({ id, ok: false, error: (err && err.message) || 'TTS worker error' });
    }
  });
}
