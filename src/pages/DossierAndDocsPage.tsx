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
    <div className="grid-12">
      <section className="spec-cell col-6" aria-label="Flight Telemetry Dossier and 50-State Ranks">
        <div className="spec-cell-header">
          <span className="spec-label">FLIGHT TELEMETRY DOSSIER &amp; SOVEREIGN RANKS</span>
          <span className="spec-mono text-emerald">SHAREABLE SVG PROOF CARD</span>
        </div>
        <div className="spec-cell-body">
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="spec-input"
              style={{ flex: '1 1 220px' }}
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              aria-label="Callsign for SVG Flight Dossier"
            />
            <a
              href={`/api/nousgent/card/${encodeURIComponent(callsign)}.svg`}
              target="_blank"
              rel="noreferrer"
              className="btn-spec btn-carbon"
            >
              OPEN FULL SVG
            </a>
          </div>

          <div style={{ border: '1px solid var(--color-outline-variant)', background: 'var(--color-surface)' }}>
            <img
              src={`/api/nousgent/card/${encodeURIComponent(callsign)}.svg`}
              alt={`NOUSGENT Flight Telemetry Dossier for ${callsign}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          <div className="metric-tile">
            <div className="spec-label text-muted" style={{ marginBottom: '0.4rem' }}>
              SOVEREIGN OPERATOR PROGRESSION LADDER
            </div>
            <div className="spec-mono" style={{ display: 'grid', gap: '0.25rem', fontSize: '12px' }}>
              <div>01 // Rank I: Clavius Cadet (0+ XP — Sandboxed Rig Enlisted)</div>
              <div>02 // Rank II: Discovery Flight Engineer (2,500+ XP — Verified .dig Minted)</div>
              <div>03 // Rank III: Piriform Immunologist (5,000+ XP — CN-I Antibody Synthesized)</div>
              <div>04 // Rank IV: Thalamic Keyholder (10,000+ XP — CHIP-0043 Passkey Co-Signer)</div>
              <div className="text-emerald">05 // Rank V: Urbana Sovereign Architect (25,000+ XP — Citation-DAG Lineage)</div>
            </div>
          </div>
        </div>
      </section>

      <section className="spec-cell col-6" aria-label="Dual-Host Architecture and ia.nousgent.ai API">
        <div className="spec-cell-header">
          <span className="spec-label">DUAL-DOMAIN SEPARATION: NOUSGENT.AI VS IA.NOUSGENT.AI</span>
          <span className="spec-mono text-cobalt">PROMETHEUS + MCP 2025-03-26</span>
        </div>
        <div className="spec-cell-body">
          <div className="grid-12" style={{ gap: '0.75rem' }}>
            <div className="metric-tile col-6">
              <div className="spec-label text-emerald">PRIMARY HUMAN DOMAIN</div>
              <div className="spec-mono" style={{ fontWeight: 700, marginTop: '0.2rem' }}>https://nousgent.ai</div>
              <div className="spec-mono text-muted" style={{ marginTop: '0.2rem' }}>
                plane=&quot;human_ui&quot; · {snapshot.humanRequests.toLocaleString()} REQS
              </div>
            </div>
            <div className="metric-tile metric-tile-dark col-6">
              <div className="spec-label text-mint">DEDICATED A2A / M2M DOMAIN</div>
              <div className="spec-mono" style={{ fontWeight: 700, marginTop: '0.2rem' }}>https://ia.nousgent.ai</div>
              <div className="spec-mono text-sky" style={{ marginTop: '0.2rem' }}>
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
                  aria-controls={`api-panel-${t.id}`}
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
                  tabIndex={0}
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
                      <code id={cmdId} className="spec-mono" style={{ whiteSpace: 'pre-wrap' }}>
                        {t.code}
                      </code>
                      <CopyCommandButton targetId={cmdId} label="COPY" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="metric-tile">
            <div className="spec-label text-muted" style={{ marginBottom: '0.4rem' }}>
              TOP U.S. STATE CHIA MESH HUBS
            </div>
            {snapshot.stateHubs.map((h) => (
              <div
                key={h.stateCode}
                className="spec-mono"
                style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}
              >
                <span>{h.stateCode} // {h.hubName} ({h.subtitle})</span>
                <span className="text-emerald">{h.rigsCount.toLocaleString()} NODES · {h.storagePb} PB</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
