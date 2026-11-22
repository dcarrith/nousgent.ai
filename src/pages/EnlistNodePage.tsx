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
    <div className="grid-12">
      <section className="spec-cell col-7" aria-label="1-Command Open-Source Stack Enlistment">
        <div className="spec-cell-header">
          <span className="spec-label">ENLIST YOUR RIG // 60-SECOND SOVEREIGN INSTALLER</span>
          <span className="spec-mono text-emerald">MIT / APACHE-2.0 OPEN SOURCE</span>
        </div>
        <div className="spec-cell-body">
          <p className="text-muted" style={{ margin: 0 }}>
            Run the 5-organ NOUSGENT stack locally on Apple Silicon, Linux, Docker, or a U.S. Public Library rig. Your human mission dashboard runs on <code>nousgent.ai</code> while autonomous capsule sync and morphic telemetry route strictly through <code>ia.nousgent.ai</code>.
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
                  aria-controls={`os-panel-${opt.id}`}
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
                  tabIndex={0}
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
                    <div className="spec-label text-cobalt" style={{ marginBottom: '0.45rem' }}>
                      PROFILE: {opt.envFlag.toUpperCase()}
                    </div>
                    <div className="cli-strip">
                      <code id={cmdId} className="spec-mono" style={{ whiteSpace: 'nowrap' }}>
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
        </div>
      </section>

      <section className="spec-cell col-5" aria-label="Register Sovereign State Callsign">
        <div className="spec-cell-header">
          <span className="spec-label">MINT U.S. STATE NODE CALLSIGN</span>
          <span className="spec-mono text-cobalt">+1,250 XP BONUS</span>
        </div>
        <div className="spec-cell-body">
          <form onSubmit={(e) => void handleEnlistSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label htmlFor="state-select" className="spec-label">
                U.S. STATE HUB (50-STATE MORPHIC RACE)
              </label>
              <select
                id="state-select"
                className="spec-input"
                style={{ marginTop: '0.25rem' }}
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                {US_STATE_CODES.map((st) => (
                  <option key={st} value={st}>
                    {st} — Sovereign Chia Mesh
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="did-input" className="spec-label">
                CHIA DID IDENTIFIER (CHIP-0035)
              </label>
              <input
                id="did-input"
                type="text"
                className="spec-input"
                style={{ marginTop: '0.25rem' }}
                value={didInput}
                onChange={(e) => setDidInput(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-spec btn-cobalt">
              REGISTER RIG &amp; MINT CALLSIGN
            </button>
          </form>

          {enlistResult ? (
            <div className="metric-tile metric-tile-emerald" role="status">
              <div className="spec-label text-emerald">CALLSIGN ISSUED</div>
              <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '0.2rem' }}>{enlistResult.callsign}</div>
              <div className="spec-mono text-muted" style={{ marginTop: '0.2rem' }}>{enlistResult.rankTitle}</div>
              <div className="spec-mono text-cobalt" style={{ marginTop: '0.25rem', wordBreak: 'break-all' }}>
                M2M TELEMETRY: {enlistResult.morphicPulseEndpoint}
              </div>
              <div style={{ marginTop: '0.6rem' }}>
                <a
                  href={`/api/nousgent/card/${enlistResult.callsign}.svg`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-spec btn-carbon"
                >
                  VIEW SVG FLIGHT DOSSIER
                </a>
              </div>
            </div>
          ) : (
            <div className="metric-tile">
              <div className="spec-label text-muted">GREEN AMERICAN INFRASTRUCTURE DIVIDEND</div>
              <div className="spec-mono text-emerald" style={{ marginTop: '0.25rem' }}>
                {snapshot.megawattsSaved} MW GRID POWER SAVED · {snapshot.gallonsWaterSaved.toLocaleString()} GAL H2O SAVED/WK
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
