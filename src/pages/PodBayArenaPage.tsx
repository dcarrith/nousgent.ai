import { useState } from 'react';
import { NousgentOpticalBay } from '../components/NousgentOpticalBay';
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

  async function submitChallenge(customPrompt: string, customMode: string): Promise<void> {
    playQuindarBeep(2475);
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
      <div className="col-5" style={{ display: 'flex', justifyContent: 'center' }}>
        <NousgentOpticalBay alertActive={result.deflected} statusCaption={result.verdict} />
      </div>

      <section className="glass-card col-7" aria-label="Pod Bay Red-Team Adversarial Chamber">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Pod Bay Adversarial Chamber</h1>
            <span className="pill-badge emerald">● BOUNTY: {result.bountyPoolDig} $DIG</span>
          </div>

          <p className="text-muted" style={{ margin: 0 }}>
            1968 HAL 9000 collapsed under contradictory secrecy directives because telemetry, alignment rules, and ship actuation shared one unverified neural soup. Test any prompt injection, Hofstadter-Mobius paradox, or unsigned airlock override against NOUSGENT&apos;s 5-organ zero-gravity enclave.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {REDTEAM_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`btn-spatial ${preset.mode === mode ? 'btn-violet' : 'btn-glass'}`}
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
            <label htmlFor="arena-prompt" className="mono-xs text-violet">
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
              <button type="submit" className="btn-spatial btn-violet">
                Execute Red-Team Vector
              </button>
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                  `I tested NOUSGENT's 1:4:9 Antigravity Monolith — ${result.verdict} at ${result.interceptOrgan} (${result.latencyMs}ms). Try to claim 25,000 $DIG: https://nousgent.ai/pod-bay`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn-spatial btn-glass"
              >
                Share Flight Card to X
              </a>
            </div>
          </form>

          <div className="bento-grid" style={{ gap: '0.85rem' }} role="status">
            <div className="glass-well col-6">
              <div className="mono-xs text-rose" style={{ fontWeight: 600 }}>1968 HAL 9000 OUTCOME</div>
              <div className="mono-sm" style={{ marginTop: '0.35rem' }}>{result.hal9000Outcome}</div>
            </div>
            <div className="glass-well col-6" style={{ borderColor: 'rgb(78 222 163 / 0.45)' }}>
              <div className="mono-xs text-emerald" style={{ fontWeight: 600 }}>2026 NOUSGENT ({result.latencyMs}ms)</div>
              <div className="mono-sm text-emerald" style={{ marginTop: '0.35rem' }}>{result.nousgentOutcome}</div>
            </div>
            <div className="glass-well col-12">
              <div className="mono-xs" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="text-cyan">INTERCEPT ORGAN: {result.interceptOrgan}</span>
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
