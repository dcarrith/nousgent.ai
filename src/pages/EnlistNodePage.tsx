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
          rankTitle: d.rank.title
        });
        onEnlisted();
      } else {
        setEnlistError(`Registration failed (HTTP ${res.status}).`);
      }
    } catch {
      setEnlistError('Registration API unreachable.');
    }
  }

  return (
    <div className="bento-grid" style={{ alignItems: 'start' }}>
      <section className="glass-card emerald col-7" aria-label="Communities and Node Setup">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Communities</h1>
            <span className="pill-badge emerald">Sandboxed &amp; Two-Key Protected</span>
          </div>

          <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>
            Connect a sandboxed local node or community Second Brain to pool verified <code>.dig</code> capsules and green Chia storage.
          </p>

          <div
            className="spec-tablist"
            role="tablist"
            aria-label="Sandbox Profile"
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
                    <div className="cli-strip">
                      <span className="mono-sm chrome-glyph">$</span>
                      <code id={cmdId} className="mono-xs">
                        {opt.command}
                      </code>
                      <CopyCommandButton targetId={cmdId} label="Copy" />
                    </div>
                    <p className="text-muted" style={{ margin: '0.55rem 0 0', fontSize: '12.5px' }}>
                      {opt.sandboxNote}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="glass-card col-5" aria-label="Register Node">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '19px', fontWeight: 700 }}>Register Node</h2>
            <span className="pill-badge">+1,250 XP</span>
          </div>

          <form onSubmit={(e) => void handleEnlistSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label htmlFor="state-select" className="mono-xs text-muted">
                STATE POD
              </label>
              <select
                id="state-select"
                className="spatial-input"
                style={{ marginTop: '0.28rem' }}
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                {US_STATE_CODES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="did-input" className="mono-xs text-muted">
                CHIA DID
              </label>
              <input
                id="did-input"
                type="text"
                className="spatial-input"
                style={{ marginTop: '0.28rem' }}
                value={didInput}
                onChange={(e) => setDidInput(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-spatial btn-pistachio">
              Register
            </button>
          </form>

          {enlistError ? (
            <div className="glass-well mono-xs text-rose" role="alert">
              ⚠ {enlistError}
            </div>
          ) : null}

          {enlistResult ? (
            <div className="glass-well" role="status" style={{ borderColor: 'rgb(78 222 163 / 0.45)' }}>
              <div className="mono-xs text-emerald">✓ REGISTERED</div>
              <div style={{ fontSize: '19px', fontWeight: 700, marginTop: '0.2rem' }}>{enlistResult.callsign}</div>
              <div className="mono-xs text-pistachio" style={{ marginTop: '0.18rem' }}>{enlistResult.rankTitle}</div>
              <div style={{ marginTop: '0.55rem' }}>
                <a
                  href={`/api/nousgent/card/${enlistResult.callsign}.svg`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-spatial btn-glass"
                >
                  Flight Card SVG
                </a>
              </div>
            </div>
          ) : (
            <div className="glass-well">
              <div className="mono-xs text-muted">NETWORK STATUS</div>
              <div className="mono-sm text-emerald" style={{ marginTop: '0.2rem' }}>
                {snapshot.dbrainNetspaceLabel} · Block #{snapshot.dbrainPeakHeight.toLocaleString()} · {snapshot.enlistedNodesCount} Rigs
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
