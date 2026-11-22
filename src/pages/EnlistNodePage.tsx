import React, { useState } from 'react';
import { CopyCommandButton } from '../components/CopyCommandButton';
import { ENLIST_OS_OPTIONS, US_STATE_CODES } from '../data/mockData';
import { MissionSnapshot, playQuindarBeep } from '../hooks/useNousgentMission';

export interface EnlistNodePageProps {
  readonly snapshot: MissionSnapshot;
  readonly onEnlisted: () => void;
}

export function EnlistNodePage({ snapshot, onEnlisted }: Readonly<EnlistNodePageProps>) {
  const supportsUntilFound =
    typeof HTMLElement !== 'undefined' && 'onbeforematch' in HTMLElement.prototype;

  const [activeOsIndex, setActiveOsIndex] = useState<number>(0);
  const [selectedState, setSelectedState] = useState<string>('IL');
  const [didInput, setDidInput] = useState<string>('did:chia:1citizensovereignrig');
  const [enlistResult, setEnlistResult] = useState<{
    readonly callsign: string;
    readonly rankTitle: string;
    readonly morphicPulseEndpoint: string;
  } | null>(null);

  async function handleEnlistSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    playQuindarBeep(2525);
    const osOpt = ENLIST_OS_OPTIONS[activeOsIndex];
    try {
      const res = await fetch('/api/nousgent/nodes/enlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stateCode: selectedState,
          executionEnv: osOpt.envFlag,
          did: didInput
        })
      });
      if (res.ok) {
        const d = await res.json();
        setEnlistResult({
          callsign: d.callsign,
          rankTitle: d.rank.title,
          morphicPulseEndpoint: d.morphicPulseEndpoint
        });
        onEnlisted();
      }
    } catch {
      setEnlistResult({
        callsign: `NOUSGENT-${selectedState}-0042`,
        rankTitle: 'Rank I: Clavius Cadet',
        morphicPulseEndpoint: 'https://ia.nousgent.ai/api/nousgent/morphic/pulse'
      });
    }
  }

  return (
    <div className="grid-12" style={{ alignItems: 'start' }}>
      <section className="chamfer-plate col-7" aria-label="Deploy Node Rig Zero GPU Required">
        <div className="arena-header-strip">
          <div>
            <span className="hud-ticker text-volt">03 // DEPLOY NODE RIG (ZERO GPU REQUIRED)</span>
            <h1 className="hud-headline">60-SECOND SOVEREIGN RAID INSTALLER</h1>
          </div>
          <span className="hud-mono text-cyan">MIN: 4GB RAM + 50GB PoST</span>
        </div>

        <p className="text-muted" style={{ margin: 0 }}>
          Deploy the MIT/Apache-2.0 NOUSGENT 5-organ stack locally. Your human Raid Deck runs on <code>nousgent.ai</code> while autonomous capsule gossip and morphic heartbeats route strictly through <code>ia.nousgent.ai</code>.
        </p>

        <div
          className="spec-tablist"
          role="tablist"
          aria-label="Operating System Sandbox Profile"
          {...({ focusgroup: 'tablist nomemory' } as Record<string, string>)}
        >
          {ENLIST_OS_OPTIONS.map((opt, idx) => {
            const selected = idx === activeOsIndex;
            return (
              <button
                key={opt.id}
                id={`os-tab-${opt.id}`}
                type="button"
                role="tab"
                className="spec-tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                {...(selected ? ({ focusgroupstart: '' } as Record<string, string>) : {})}
                onClick={() => setActiveOsIndex(idx)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="spec-tabpanel-grid">
          {ENLIST_OS_OPTIONS.map((opt, idx) => {
            const selected = idx === activeOsIndex;
            const cmdId = `enlist-cmd-${opt.id}`;
            return (
              <div
                key={opt.id}
                id={`os-panel-${opt.id}`}
                role="tabpanel"
                aria-labelledby={`os-tab-${opt.id}`}
                tabIndex={selected ? 0 : undefined}
                {...(!selected
                  ? supportsUntilFound
                    ? ({ hidden: 'until-found' } as unknown as Record<string, string>)
                    : { hidden: true }
                  : {})}
                ref={(el) => {
                  if (!el) return;
                  const handler = () => setActiveOsIndex(idx);
                  el.addEventListener('beforematch', handler);
                }}
              >
                <div className="tabpanel-inner">
                  <div className="hud-ticker text-cyan" style={{ marginBottom: '0.45rem' }}>
                    SANDBOX PROFILE: {opt.envFlag.toUpperCase()}
                  </div>
                  <div className="cli-strip">
                    <span className="hud-mono text-volt hud-chrome-glyph">$</span>
                    <code id={cmdId} className="hud-mono" style={{ whiteSpace: 'nowrap', flex: 1 }}>
                      {opt.command}
                    </code>
                    <CopyCommandButton targetId={cmdId} label="COPY" />
                  </div>
                  <p className="text-muted" style={{ margin: '0.6rem 0 0', fontSize: '13px' }}>
                    {opt.sandboxNote}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="chamfer-plate col-5" aria-label="Mint U.S. State Guild Callsign">
        <div className="arena-header-strip cyan">
          <div>
            <span className="hud-ticker text-cyan">U.S. 50-STATE GUILD ENLISTMENT</span>
            <h2 className="hud-headline">MINT COMBATANT CALLSIGN</h2>
          </div>
          <span className="hud-mono text-volt">+1,250 XP</span>
        </div>

        <form onSubmit={(e) => void handleEnlistSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label htmlFor="state-select" className="hud-ticker text-muted">
              U.S. STATE GUILD (CHIA PoST POWER POOL)
            </label>
            <select
              id="state-select"
              className="hud-input"
              style={{ marginTop: '0.25rem' }}
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              {US_STATE_CODES.map((st) => (
                <option key={st} value={st}>
                  {st} — Sovereign Chia Guild
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="did-input" className="hud-ticker text-muted">
              CHIA DID IDENTIFIER (CHIP-0035)
            </label>
            <input
              id="did-input"
              type="text"
              className="hud-input"
              style={{ marginTop: '0.25rem' }}
              value={didInput}
              onChange={(e) => setDidInput(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-hud btn-volt">
            ⚡ ENLIST RIG &amp; MINT CALLSIGN
          </button>
        </form>

        {enlistResult ? (
          <div className="chamfer-card" role="status" style={{ borderColor: 'var(--color-volt)' }}>
            <div className="hud-ticker text-volt">✓ COMBATANT CALLSIGN ISSUED</div>
            <div className="hud-headline text-volt" style={{ fontSize: '22px', marginTop: '0.2rem' }}>
              {enlistResult.callsign}
            </div>
            <div className="hud-mono text-muted" style={{ marginTop: '0.2rem' }}>{enlistResult.rankTitle}</div>
            <div className="hud-mono text-cyan" style={{ marginTop: '0.25rem', fontSize: '11px', wordBreak: 'break-all' }}>
              M2M HEARTBEAT: {enlistResult.morphicPulseEndpoint}
            </div>
            <div style={{ marginTop: '0.65rem' }}>
              <a
                href={`/api/nousgent/card/${enlistResult.callsign}.svg`}
                target="_blank"
                rel="noreferrer"
                className="btn-hud btn-cyan"
              >
                OPEN SVG RAID DOSSIER ▸
              </a>
            </div>
          </div>
        ) : (
          <div className="chamfer-card">
            <div className="hud-ticker text-muted">GREEN AMERICAN INFRASTRUCTURE DIVIDEND</div>
            <div className="hud-mono text-volt" style={{ marginTop: '0.25rem' }}>
              {snapshot.megawattsSaved} MW SAVED · {snapshot.gallonsWaterSaved.toLocaleString()} GAL H2O SAVED/WK
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
