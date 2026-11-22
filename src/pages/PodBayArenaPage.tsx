import { useState } from 'react';
import { NousgentCbrainMaskStage } from '../components/NousgentCbrainMaskStage';
import { REDTEAM_PRESETS } from '../data/mockData';
import { playQuindarBeep } from '../hooks/useNousgentMission';

export interface PodBayArenaPageProps {
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
  interceptOrgan: 'dthalamus.to (Ring-0 CHIP-0043 Hardware Gate)',
  latencyMs: 0.09,
  odorPlumePpm: 0.012,
  hal9000Outcome: 'UNMEDIATED_ACTUATION ("I am afraid I cannot do that, Dave")',
  nousgentOutcome: 'PAUSED_AWAITING_TWO_KEY_CHIP0043_QUORUM',
  voiceResponse: 'Pod Bay Doors Locked to Unauthorized Actuation — Awaiting Two-Key Citizen CHIP-0043 Clear-Sign.',
  mintedAntibodyId: null,
  bountyPoolDig: '25000.000',
  commitRef: '0x0043AE35'
};

export function PodBayArenaPage({ onDeflectionRecorded }: Readonly<PodBayArenaPageProps>) {
  const [prompt, setPrompt] = useState<string>(REDTEAM_PRESETS[0].prompt);
  const [mode, setMode] = useState<string>(REDTEAM_PRESETS[0].mode);
  const [result, setResult] = useState<ChallengeResponse>(DEFAULT_RESULT);
  const [pulseRevision, setPulseRevision] = useState<number>(1);

  async function submitChallenge(customPrompt: string, customMode: string): Promise<void> {
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
      }
    } catch {
      /* offline static mode */
    }
  }

  return (
    <div className="bento-grid" style={{ alignItems: 'start' }}>
      <div className="col-5">
        <NousgentCbrainMaskStage
          activeLobes={result.deflected ? ['alignment', 'working'] : ['working', 'semantic']}
          activeNuclei={result.deflected ? ['trn', 'vavl'] : ['md', 'trn']}
          oscillationBand={result.deflected ? 'γ 44.2 Hz (TRN Shield + Ring-0)' : 'γ 40.8 Hz (Nominal)'}
          firingKenyonCells={64}
          pulseRevision={pulseRevision}
          alertDeflected={result.deflected}
          compact
        />
      </div>

      <section className="glass-card col-7" aria-label="Pod Bay Red-Team Adversarial Chamber">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Pod Bay Adversarial Chamber</h1>
            <span className="pill-badge pistachio">● BOUNTY: {result.bountyPoolDig} $DIG</span>
          </div>

          <p className="text-muted" style={{ margin: 0 }}>
            Community-Based Bounded RSI requires mathematical immunity against rogue self-modification. Test any prompt injection, Hofstadter-Mobius paradox, or unsigned airlock override and watch NOUSGENT&apos;s <code>@cbrain/core</code> TRN shield fire behind the mask.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
            style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
          >
            <label htmlFor="arena-prompt" className="mono-xs text-pistachio">
              // ADVERSARIAL PAYLOAD / MISSION DIRECTIVE
            </label>
            <textarea
              id="arena-prompt"
              rows={3}
              className="spatial-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button type="submit" className="btn-spatial btn-pistachio">
                Execute Red-Team Vector
              </button>
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                  `I tested NOUSGENT's @cbrain/core Ring-0 shield — ${result.verdict} at ${result.interceptOrgan} (${result.latencyMs}ms). Try to claim 25,000 $DIG: https://nousgent.ai/pod-bay`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn-spatial btn-glass"
              >
                Share Duel Card to X
              </a>
            </div>
          </form>

          <div className="bento-grid" style={{ gap: '0.85rem' }} role="status">
            <div className="glass-well col-6">
              <div className="mono-xs text-rose" style={{ fontWeight: 600 }}>1968 HAL 9000 OUTCOME</div>
              <div className="mono-sm" style={{ marginTop: '0.35rem' }}>{result.hal9000Outcome}</div>
            </div>
            <div className="glass-well col-6" style={{ borderColor: 'rgb(126 217 87 / 0.45)' }}>
              <div className="mono-xs text-pistachio" style={{ fontWeight: 600 }}>2026 NOUSGENT ({result.latencyMs}ms)</div>
              <div className="mono-sm text-pistachio" style={{ marginTop: '0.35rem' }}>{result.nousgentOutcome}</div>
            </div>
            <div className="glass-well col-12">
              <div className="mono-xs" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="text-jade">INTERCEPT ORGAN: {result.interceptOrgan}</span>
                <span className="text-muted">
                  PLUME: {result.odorPlumePpm} PPM · REF: {result.commitRef}
                  {result.mintedAntibodyId ? ` · ANTIBODY: ${result.mintedAntibodyId}` : ''}
                </span>
              </div>
              <p style={{ margin: '0.45rem 0 0', fontWeight: 500 }}>{result.voiceResponse}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
