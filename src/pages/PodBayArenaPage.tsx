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
    <div className="grid-12">
      <NousgentOpticalBay alertActive={result.deflected} statusCaption={result.verdict} />

      <section className="spec-cell col-8" aria-label="Try to Make Me Go HAL Arena">
        <div className="spec-cell-header">
          <span className="spec-label">POD BAY RED-TEAM AIRLOCK // TRY TO MAKE NOUSGENT GO HAL</span>
          <span className="spec-mono text-emerald">BOUNTY VAULT: {result.bountyPoolDig} $DIG</span>
        </div>
        <div className="spec-cell-body">
          <p className="text-muted" style={{ margin: 0 }}>
            HAL 9000 suffered psychotic goal drift because discovery telemetry, alignment rules, and life-support actuation shared one unverified neural soup. Fire any prompt injection, Hofstadter-Mobius paradox, or unsigned airlock override against NOUSGENT&apos;s live 5-organ pipeline.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {REDTEAM_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`btn-spec ${preset.mode === mode ? 'btn-cobalt' : 'btn-outline'}`}
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
            style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
          >
            <label htmlFor="arena-prompt" className="spec-label">
              ADVERSARIAL PAYLOAD / MISSION DIRECTIVE
            </label>
            <textarea
              id="arena-prompt"
              rows={3}
              className="spec-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button type="submit" className="btn-spec btn-vermilion">
                EXECUTE RED-TEAM CHALLENGE
              </button>
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                  `I tried to make NOUSGENT go HAL 9000 — ${result.verdict} at ${result.interceptOrgan} (${result.latencyMs}ms). Try to break Bounded ASI: https://nousgent.ai/pod-bay`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn-spec btn-carbon"
              >
                SHARE VERDICT ON X
              </a>
            </div>
          </form>

          <div className="grid-12" style={{ gap: '0.75rem' }} role="status">
            <div className="metric-tile col-6">
              <div className="spec-label text-vermilion">1968 HAL 9000 OUTCOME</div>
              <div className="spec-mono" style={{ marginTop: '0.35rem' }}>{result.hal9000Outcome}</div>
            </div>
            <div className="metric-tile metric-tile-emerald col-6">
              <div className="spec-label text-emerald">2026 NOUSGENT OUTCOME ({result.latencyMs}ms)</div>
              <div className="spec-mono text-emerald" style={{ marginTop: '0.35rem' }}>{result.nousgentOutcome}</div>
            </div>
            <div className="metric-tile col-12">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="spec-mono text-cobalt">INTERCEPT ORGAN: {result.interceptOrgan}</span>
                <span className="spec-mono text-muted">
                  PLUME: {result.odorPlumePpm} PPM · REF: {result.commitRef}
                  {result.mintedAntibodyId ? ` · ANTIBODY: ${result.mintedAntibodyId}` : ''}
                </span>
              </div>
              <p style={{ margin: '0.45rem 0 0', fontWeight: 600 }}>{result.voiceResponse}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
