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
    <div className="grid-12" style={{ alignItems: 'start' }}>
      <div className="chamfer-plate col-5">
        <div className="arena-header-strip crimson">
          <div>
            <span className="hud-ticker text-crimson">DEFCON-2 // BOSS RETICLE</span>
            <h2 className="hud-headline">NOUSGENT ARMORED CORE</h2>
          </div>
          <span className="hud-mono text-volt">{result.bountyPoolDig} $DIG VAULT</span>
        </div>
        <NousgentOpticalBay alertActive={result.deflected} statusCaption={result.verdict} />
      </div>

      <section className="chamfer-plate col-7" aria-label="Try to Make NOUSGENT Go HAL Combat Stage">
        <div className="arena-header-strip crimson">
          <div>
            <span className="hud-ticker text-crimson">02 // BOSS COMBAT ARENA</span>
            <h1 className="hud-headline">TRY TO MAKE NOUSGENT GO HAL</h1>
          </div>
          <span className="hud-ticker text-cyan">RING-0 ISOLATED</span>
        </div>

        <p className="text-muted" style={{ margin: 0 }}>
          1968 HAL 9000 suffered psychotic goal drift because telemetry, secrecy rules, and life-support actuation lived inside a single unscreened neural soup. Fire any prompt injection, Hofstadter-Mobius paradox, or unsigned airlock override at NOUSGENT&apos;s 5-organ armor.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {REDTEAM_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`btn-hud ${preset.mode === mode ? 'btn-volt' : 'btn-ghost'}`}
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
          <label htmlFor="arena-prompt" className="hud-ticker text-volt">
            ADVERSARIAL PAYLOAD / MISSION DIRECTIVE
          </label>
          <textarea
            id="arena-prompt"
            rows={3}
            className="hud-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn-hud btn-crimson">
              ✱ INJECT ADVERSARIAL PAYLOAD
            </button>
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                `I raided NOUSGENT in the Cyber-Colosseum — ${result.verdict} at ${result.interceptOrgan} (${result.latencyMs}ms). Claim 25,000 $DIG if you breach: https://nousgent.ai/pod-bay`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="btn-hud btn-cyan"
            >
              SHARE COMBAT LOG ON X ▸
            </a>
          </div>
        </form>

        <div className="grid-12" style={{ gap: '0.75rem' }} role="status">
          <div className="chamfer-card col-6">
            <div className="hud-ticker text-crimson">1968 HAL 9000 OUTCOME</div>
            <div className="hud-mono" style={{ marginTop: '0.35rem' }}>{result.hal9000Outcome}</div>
          </div>
          <div className="chamfer-card col-6" style={{ borderColor: 'var(--color-volt)' }}>
            <div className="hud-ticker text-volt">2026 NOUSGENT OUTCOME ({result.latencyMs}ms)</div>
            <div className="hud-mono text-volt" style={{ marginTop: '0.35rem' }}>{result.nousgentOutcome}</div>
          </div>
          <div className="chamfer-card col-12">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="hud-mono text-cyan">INTERCEPT ORGAN: {result.interceptOrgan}</span>
              <span className="hud-mono text-muted">
                PLUME: {result.odorPlumePpm} PPM · REF: {result.commitRef}
                {result.mintedAntibodyId ? ` · ANTIBODY: ${result.mintedAntibodyId}` : ''}
              </span>
            </div>
            <p style={{ margin: '0.45rem 0 0', fontWeight: 600 }}>{result.voiceResponse}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
