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
    <div className="grid-12" style={{ alignItems: 'start' }}>
      <section className="chamfer-plate col-6" aria-label="Cyber-Colosseum Raid Dossier and Ranks">
        <div className="arena-header-strip">
          <div>
            <span className="hud-ticker text-volt">06 // $DIG VAULT &amp; COMBATANT CARD</span>
            <h1 className="hud-headline">CYBER-COLOSSEUM RAID DOSSIER</h1>
          </div>
          <span className="hud-mono text-cyan">SHAREABLE SVG</span>
        </div>

        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="hud-input"
            style={{ flex: '1 1 220px' }}
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
            aria-label="Callsign for SVG Raid Dossier"
          />
          <a
            href={`/api/nousgent/card/${encodeURIComponent(callsign)}.svg`}
            target="_blank"
            rel="noreferrer"
            className="btn-hud btn-volt"
          >
            OPEN FULL SVG ▸
          </a>
        </div>

        <div style={{ border: '1px solid var(--color-outline)', background: 'var(--color-surface-lowest)' }}>
          <img
            src={`/api/nousgent/card/${encodeURIComponent(callsign)}.svg`}
            alt={`NOUSGENT Cyber-Colosseum Raid Dossier for ${callsign}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        <div className="chamfer-card">
          <div className="hud-ticker text-muted" style={{ marginBottom: '0.4rem' }}>
            COMBATANT RANK PROGRESSION LADDER
          </div>
          <div className="hud-mono" style={{ display: 'grid', gap: '0.3rem', fontSize: '12px' }}>
            <div>01 // Rank I: Clavius Cadet (0+ XP — Sandboxed Rig Enlisted)</div>
            <div>02 // Rank II: Discovery Flight Engineer (2,500+ XP — Verified .dig Minted)</div>
            <div>03 // Rank III: Piriform Immunologist (5,000+ XP — CN-I Antibody Synthesized)</div>
            <div className="text-cyan">04 // Rank IV: Thalamic Keyholder (10,000+ XP — CHIP-0043 Passkey Co-Signer)</div>
            <div className="text-volt">05 // Rank V: Urbana Sovereign Architect (25,000+ XP — Citation-DAG Lineage)</div>
          </div>
        </div>
      </section>

      <section className="chamfer-plate col-6" aria-label="Dual-Host Architecture and ia.nousgent.ai M2M API">
        <div className="arena-header-strip cyan">
          <div>
            <span className="hud-ticker text-cyan">DUAL-DOMAIN SEPARATION</span>
            <h2 className="hud-headline">NOUSGENT.AI (HUMAN) VS IA.NOUSGENT.AI (M2M)</h2>
          </div>
          <span className="hud-mono text-volt">MCP 2025-03-26</span>
        </div>

        <div className="grid-12" style={{ gap: '0.75rem' }}>
          <div className="chamfer-card col-6" style={{ borderColor: 'var(--color-volt)' }}>
            <div className="hud-ticker text-volt">PLAYER RAID DECK (HUMAN)</div>
            <div className="hud-mono" style={{ fontWeight: 700, marginTop: '0.25rem' }}>https://nousgent.ai</div>
            <div className="hud-mono text-muted" style={{ marginTop: '0.2rem', fontSize: '11px' }}>
              plane=&quot;human_ui&quot; · {snapshot.humanRequests.toLocaleString()} REQS
            </div>
          </div>
          <div className="chamfer-card col-6" style={{ borderColor: 'var(--color-cyan)' }}>
            <div className="hud-ticker text-cyan">AUTONOMOUS M2M ARENA</div>
            <div className="hud-mono" style={{ fontWeight: 700, marginTop: '0.25rem' }}>https://ia.nousgent.ai</div>
            <div className="hud-mono text-muted" style={{ marginTop: '0.2rem', fontSize: '11px' }}>
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
                    <code id={cmdId} className="hud-mono" style={{ whiteSpace: 'pre-wrap', flex: 1 }}>
                      {t.code}
                    </code>
                    <CopyCommandButton targetId={cmdId} label="COPY" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="chamfer-card">
          <div className="hud-ticker text-muted" style={{ marginBottom: '0.45rem' }}>
            U.S. 50-STATE GUILD WARS LEADERBOARD
          </div>
          {snapshot.stateHubs.map((h, idx) => (
            <div
              key={h.stateCode}
              className="hud-mono"
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--color-outline)' }}
            >
              <span>0{idx + 1} // {h.stateCode} ({h.hubName} · {h.subtitle})</span>
              <span className="text-volt">{h.rigsCount.toLocaleString()} RIGS · {h.storagePb} PB</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
