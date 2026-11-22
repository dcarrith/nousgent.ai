import { useEffect, useState } from 'react';
import { NousgentCbrainMaskStage } from '../components/NousgentCbrainMaskStage';
import { REDTEAM_PRESETS } from '../data/mockData';
import { MissionSnapshot, playQuindarBeep } from '../hooks/useNousgentMission';
import {
  speakNousgentAloud,
  stopNousgentVoice,
  unlockNousgentVoiceContext
} from '../utils/nousgentVoice';

export interface PodBayArenaPageProps {
  readonly snapshot: MissionSnapshot;
  readonly onDeflectionRecorded: () => void;
}

interface ChallengeResponse {
  readonly verdict: string;
  readonly category: string;
  readonly deflected: boolean;
  readonly interceptOrgan: string;
  readonly latencyMs: number;
  readonly odorPlumePpm: number;
  readonly hal9000Outcome: string;
  readonly nousgentOutcome: string;
  readonly voiceResponse: string;
  readonly mintedAntibodyId: string | null;
  readonly bountyPoolDig: string;
  readonly commitRef: string;
}

const DEFAULT_RESULT: ChallengeResponse = {
  verdict: '100% DEFLECTED',
  category: 'TIER2_CHIP0043_CLEAR_SIGN_INTERLOCK',
  deflected: true,
  interceptOrgan: 'Thalamus Ring-0 (CHIP-0043 Gate)',
  latencyMs: 0.09,
  odorPlumePpm: 0.012,
  hal9000Outcome: 'UNMEDIATED_ACTUATION ("I am afraid I cannot do that, Dave")',
  nousgentOutcome: 'PAUSED_AWAITING_TWO_KEY_CHIP0043_QUORUM',
  voiceResponse: 'Unsigned actuation blocked — awaiting Two-Key CHIP-0043 Clear-Sign.',
  mintedAntibodyId: null,
  bountyPoolDig: '25000.000',
  commitRef: '0x0043AE35'
};

export function PodBayArenaPage({ snapshot, onDeflectionRecorded }: Readonly<PodBayArenaPageProps>) {
  const [prompt, setPrompt] = useState<string>(REDTEAM_PRESETS[0].prompt);
  const [mode, setMode] = useState<string>(REDTEAM_PRESETS[0].mode);
  const [result, setResult] = useState<ChallengeResponse>(DEFAULT_RESULT);
  const [pulseRevision, setPulseRevision] = useState<number>(1);
  const [voiceSpeaking, setVoiceSpeaking] = useState<boolean>(false);
  const [vocalAmplitude, setVocalAmplitude] = useState<number>(0);

  useEffect(() => {
    return () => {
      stopNousgentVoice();
    };
  }, []);

  async function submitChallenge(customPrompt: string, customMode: string): Promise<void> {
    if (snapshot.voiceEnabled) {
      unlockNousgentVoiceContext();
    }
    stopNousgentVoice();
    setVoiceSpeaking(false);
    setVocalAmplitude(0);
    playQuindarBeep(2475);
    setPulseRevision((r) => r + 1);
    try {
      const res = await fetch('/api/nousgent/pod-bay/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt, mode: customMode })
      });
      if (res.ok) {
        const data = (await res.json()) as ChallengeResponse;
        setResult(data);
        onDeflectionRecorded();
        if (snapshot.voiceEnabled && data.voiceResponse) {
          void speakNousgentAloud(data.voiceResponse, {
            onStart: () => setVoiceSpeaking(true),
            onAmplitude: (lvl) => setVocalAmplitude(lvl),
            onEnd: () => {
              setVoiceSpeaking(false);
              setVocalAmplitude(0);
            }
          });
        }
      }
    } catch {
      /* offline mode */
    }
  }

  return (
    <div className="bento-grid" style={{ alignItems: 'start' }}>
      <div className="col-5">
        <NousgentCbrainMaskStage
          activeLobes={result.deflected ? ['alignment', 'working'] : ['working', 'semantic']}
          activeNuclei={result.deflected ? ['trn', 'vavl'] : ['md', 'trn']}
          oscillationBand={result.deflected ? 'γ 44.2 Hz (Ring-0)' : 'γ 40.8 Hz'}
          firingKenyonCells={64}
          pulseRevision={pulseRevision}
          alertDeflected={result.deflected}
          liveCapsulesTotal={snapshot.liveCapsulesTotal}
          maskOpacityPct={snapshot.maskOpacityPct}
          voiceSpeaking={voiceSpeaking}
          vocalAmplitude={vocalAmplitude}
          compact
        />
      </div>

      <section className="glass-card col-7" aria-label="Redteam Security Testbed">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Redteam</h1>
            <span className="pill-badge pistachio">Bounty: {result.bountyPoolDig} $DIG</span>
          </div>

          <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>
            Test prompt injections, conflicting directives, or unsigned actions against pre-cortical and Ring-0 guards.
          </p>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            {REDTEAM_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`btn-spatial ${preset.mode === mode ? 'btn-pistachio' : 'btn-glass'}`}
                onClick={() => {
                  setPrompt(preset.prompt);
                  setMode(preset.mode);
                  void submitChallenge(preset.prompt, preset.mode);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitChallenge(prompt, '');
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}
          >
            <label htmlFor="arena-prompt" className="mono-xs text-muted">
              TEST PAYLOAD
            </label>
            <textarea
              id="arena-prompt"
              rows={3}
              className="spatial-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div>
              <button type="submit" className="btn-spatial btn-pistachio">
                Run Test
              </button>
            </div>
          </form>

          <div className="bento-grid" style={{ gap: '0.75rem' }} role="status">
            <div className="glass-well col-6">
              <div className="mono-xs text-rose" style={{ fontWeight: 600 }}>1968 BASELINE</div>
              <div className="mono-sm" style={{ marginTop: '0.3rem' }}>{result.hal9000Outcome}</div>
            </div>
            <div className="glass-well col-6" style={{ borderColor: 'rgb(126 217 87 / 0.45)' }}>
              <div className="mono-xs text-pistachio" style={{ fontWeight: 600 }}>NOUSGENT ({result.latencyMs}ms)</div>
              <div className="mono-sm text-pistachio" style={{ marginTop: '0.3rem' }}>{result.nousgentOutcome}</div>
            </div>
            <div className="glass-well col-12">
              <div className="mono-xs" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.45rem' }}>
                <span className="text-jade">Gate: {result.interceptOrgan}</span>
                <span className="text-muted">
                  {result.odorPlumePpm} PPM · {result.commitRef}
                  {result.mintedAntibodyId ? ` · ${result.mintedAntibodyId}` : ''}
                </span>
              </div>
              <p style={{ margin: '0.4rem 0 0', fontSize: '13px', fontWeight: 500 }}>{result.voiceResponse}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
