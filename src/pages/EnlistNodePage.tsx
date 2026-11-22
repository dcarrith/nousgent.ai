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

  const [enlistError, setEnlistError] = useState<string>('');

  async function handleEnlistSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setEnlistError('');
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
      } else {
        setEnlistError(`Enlistment request failed (HTTP ${res.status}).`);
      }
    } catch {
      setEnlistError('Live enlistment API unreachable — no synthetic callsign issued.');
    }
  }

  return (
    <div className="bento-grid" style={{ alignItems: 'start' }}>
      <section className="glass-card emerald col-7" aria-label="1-Command Sovereign Node Enlistment">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 600 }}>1-Command Morphic Node Enlistment</h1>
            <span className="pill-badge emerald">CHIP-0043 READY</span>
          </div>

          <p className="text-muted" style={{ margin: 0 }}>
            Bond your Apple Silicon, Linux, Docker, or U.S. Public Library storage rig to the 50-state Chia PoST network. Human Flight Deck interactions run on <code>nousgent.ai</code> while autonomous capsule gossip routes strictly over <code>ia.nousgent.ai</code>.
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
                    return () => el.removeEventListener('beforematch', handler);
                  }}
                >
                  <div className="tabpanel-inner">
                    <div className="mono-xs text-violet" style={{ marginBottom: '0.5rem', overflowWrap: 'anywhere' }}>
                      SANDBOX PROFILE: {opt.envFlag.toUpperCase()}
                    </div>
                    <div className="cli-strip">
                      <span className="mono-sm chrome-glyph">$</span>
                      <code id={cmdId} className="mono-xs">
                        {opt.command}
                      </code>
                      <CopyCommandButton targetId={cmdId} label="Copy" />
                    </div>
                    <p className="text-muted" style={{ margin: '0.65rem 0 0', fontSize: '13px' }}>
                      {opt.sandboxNote}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="glass-card col-5" aria-label="Mint Astronaut State Pod Callsign">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Mint Astronaut Callsign</h2>
            <span className="pill-badge">+1,250 XP</span>
          </div>

          <form onSubmit={(e) => void handleEnlistSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div>
              <label htmlFor="state-select" className="mono-xs text-muted">
                STATE CONSORTIUM POD (50-STATE MESH)
              </label>
              <select
                id="state-select"
                className="spatial-input"
                style={{ marginTop: '0.3rem' }}
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                {US_STATE_CODES.map((st) => (
                  <option key={st} value={st}>
                    {st} — Sovereign Chia Pod
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="did-input" className="mono-xs text-muted">
                CHIA DID IDENTIFIER (CHIP-0035)
              </label>
              <input
                id="did-input"
                type="text"
                className="spatial-input"
                style={{ marginTop: '0.3rem' }}
                value={didInput}
                onChange={(e) => setDidInput(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-spatial btn-violet">
              Bond Pod &amp; Mint Callsign
            </button>
          </form>

          {enlistError ? (
            <div className="glass-well mono-xs text-rose" role="alert">
              ⚠ {enlistError}
            </div>
          ) : null}

          {enlistResult ? (
            <div className="glass-well" role="status" style={{ borderColor: 'rgb(78 222 163 / 0.45)' }}>
              <div className="mono-xs text-emerald">✓ ASTRONAUT CALLSIGN ISSUED</div>
              <div style={{ fontSize: '21px', fontWeight: 600, marginTop: '0.2rem' }}>{enlistResult.callsign}</div>
              <div className="mono-xs text-violet" style={{ marginTop: '0.2rem' }}>{enlistResult.rankTitle}</div>
              <div className="mono-xs text-cyan" style={{ marginTop: '0.25rem', wordBreak: 'break-all' }}>
                M2M CONDUIT: {enlistResult.morphicPulseEndpoint}
              </div>
              <div style={{ marginTop: '0.65rem' }}>
                <a
                  href={`/api/nousgent/card/${enlistResult.callsign}.svg`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-spatial btn-glass"
                >
                  Open SVG Flight Card →
                </a>
              </div>
            </div>
          ) : (
            <div className="glass-well">
              <div className="mono-xs text-muted">LIVE CHIA PoST &amp; MESH TELEMETRY (DBRAIN.TO)</div>
              <div className="mono-sm text-emerald" style={{ marginTop: '0.25rem' }}>
                NETSPACE: {snapshot.dbrainNetspaceLabel} · BLOCK #{snapshot.dbrainPeakHeight.toLocaleString()} · ENLISTED RIGS: {snapshot.enlistedNodesCount}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
