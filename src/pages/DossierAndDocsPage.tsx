import { useState } from 'react';
import { CopyCommandButton } from '../components/CopyCommandButton';
import { MissionSnapshot } from '../hooks/useNousgentMission';

export interface DossierAndDocsPageProps {
  readonly snapshot: MissionSnapshot;
}

const API_TABS = [
  {
    id: 'mcp',
    label: 'IA.NOUSGENT.AI MCP 2025-03-26',
    code: `curl -sS https://ia.nousgent.ai/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"nousgent_get_bari_status","arguments":{}}}'`
  },
  {
    id: 'stream',
    label: 'M2M NDJSON WIRE STREAM',
    code: `curl -sN https://ia.nousgent.ai/api/nousgent/stream?frames=5`
  },
  {
    id: 'metrics',
    label: 'DUAL-HOST PROMETHEUS METRICS',
    code: `curl -sS https://ia.nousgent.ai/metrics | grep nousgent_http_requests_total`
  }
] as const;

export function DossierAndDocsPage({ snapshot }: Readonly<DossierAndDocsPageProps>) {
  const supportsUntilFound =
    typeof HTMLElement !== 'undefined' && 'onbeforematch' in HTMLElement.prototype;

  const [callsign, setCallsign] = useState<string>('NOUSGENT-IL-0001');
  const [activeDocTab, setActiveDocTab] = useState<number>(0);

  return (
    <div className="bento-grid" style={{ alignItems: 'start' }}>
      <section className="glass-card col-6" aria-label="Antigravity Flight Card and Astronaut Ranks">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '23px', fontWeight: 600 }}>Antigravity 4D Flight Card</h1>
            <span className="pill-badge">SHAREABLE SVG</span>
          </div>

          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="spatial-input"
              style={{ flex: '1 1 220px' }}
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              aria-label="Callsign for SVG Flight Card"
            />
            <a
              href={`/api/nousgent/card/${encodeURIComponent(callsign)}.svg`}
              target="_blank"
              rel="noreferrer"
              className="btn-spatial btn-violet"
            >
              Open Full SVG →
            </a>
          </div>

          <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgb(221 183 255 / 0.3)' }}>
            <img
              src={`/api/nousgent/card/${encodeURIComponent(callsign)}.svg`}
              alt={`NOUSGENT Antigravity 4D Connectome Flight Card for ${callsign}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          <div className="glass-well">
            <div className="mono-xs text-muted" style={{ marginBottom: '0.45rem' }}>
              ASTRONAUT PROGRESSION LADDER
            </div>
            <div className="mono-xs" style={{ display: 'grid', gap: '0.35rem' }}>
              <div>01 // Rank I: Clavius Cadet (0+ XP — Sandboxed Pod Bonded)</div>
              <div>02 // Rank II: Discovery Flight Engineer (2,500+ XP — Verified .dig Minted)</div>
              <div>03 // Rank III: Piriform Immunologist (5,000+ XP — CN-I Antibody Synthesized)</div>
              <div className="text-cyan">04 // Rank IV: Thalamic Keyholder (10,000+ XP — CHIP-0043 Passkey Co-Signer)</div>
              <div className="text-violet">05 // Rank V: Urbana Sovereign Architect (25,000+ XP — Citation-DAG Lineage)</div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card cyan col-6" aria-label="Dual-Domain Separation and ia.nousgent.ai M2M API">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '21px', fontWeight: 600 }}>Dual-Domain Telemetry &amp; M2M Suite</h2>
            <span className="pill-badge cyan">MCP 2025-03-26</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="glass-well" style={{ borderColor: 'rgb(221 183 255 / 0.4)' }}>
              <div className="mono-xs text-violet">FLIGHT DECK (HUMAN)</div>
              <div className="mono-sm" style={{ fontWeight: 600, marginTop: '0.25rem' }}>https://nousgent.ai</div>
              <div className="mono-xs text-muted" style={{ marginTop: '0.2rem' }}>
                plane=&quot;human_ui&quot; · {snapshot.humanRequests.toLocaleString()} REQS
              </div>
            </div>
            <div className="glass-well" style={{ borderColor: 'rgb(78 222 163 / 0.4)' }}>
              <div className="mono-xs text-emerald">ZERO-GRAVITY M2M CONDUIT</div>
              <div className="mono-sm" style={{ fontWeight: 600, marginTop: '0.25rem' }}>https://ia.nousgent.ai</div>
              <div className="mono-xs text-muted" style={{ marginTop: '0.2rem' }}>
                plane=&quot;m2m_ia&quot; · {snapshot.m2mRequests.toLocaleString()} REQS
              </div>
            </div>
          </div>

          <div
            className="spec-tablist"
            role="tablist"
            aria-label="ia.nousgent.ai Machine-to-Machine Protocol Reference"
            {...({ focusgroup: 'tablist nomemory' } as Record<string, string>)}
          >
            {API_TABS.map((t, idx) => {
              const selected = idx === activeDocTab;
              return (
                <button
                  key={t.id}
                  id={`api-tab-${t.id}`}
                  type="button"
                  role="tab"
                  className="spec-tab"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  {...(selected ? ({ focusgroupstart: '' } as Record<string, string>) : {})}
                  onClick={() => setActiveDocTab(idx)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="spec-tabpanel-grid">
            {API_TABS.map((t, idx) => {
              const selected = idx === activeDocTab;
              const cmdId = `api-cmd-${t.id}`;
              return (
                <div
                  key={t.id}
                  id={`api-panel-${t.id}`}
                  role="tabpanel"
                  aria-labelledby={`api-tab-${t.id}`}
                  tabIndex={selected ? 0 : undefined}
                  {...(!selected
                    ? supportsUntilFound
                      ? ({ hidden: 'until-found' } as unknown as Record<string, string>)
                      : { hidden: true }
                    : {})}
                  ref={(el) => {
                    if (!el) return;
                    const handler = () => setActiveDocTab(idx);
                    el.addEventListener('beforematch', handler);
                  }}
                >
                  <div className="tabpanel-inner">
                    <div className="cli-strip">
                      <code id={cmdId} className="mono-xs" style={{ whiteSpace: 'pre-wrap', flex: 1 }}>
                        {t.code}
                      </code>
                      <CopyCommandButton targetId={cmdId} label="Copy" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-well">
            <div className="mono-xs text-muted" style={{ marginBottom: '0.45rem' }}>
              SOVEREIGN STATE CONSORTIUM PODS
            </div>
            {snapshot.stateHubs.map((h, idx) => (
              <div
                key={h.stateCode}
                className="mono-xs"
                style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgb(77 67 84 / 0.3)' }}
              >
                <span>#0{idx + 1} · {h.stateCode} ({h.hubName} · {h.subtitle})</span>
                <span className="text-emerald">{h.rigsCount.toLocaleString()} PODS · {h.storagePb} PB</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
