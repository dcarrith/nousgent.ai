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

const SOCIAL_KIT_ASSETS = [
  {
    title: 'Primary OG · Three-Stage Persona Metamorphosis (1200×630 <120KB)',
    href: '/og-image.jpg',
    src: '/og-image.jpg',
    width: 1200,
    height: 630,
    alt: 'NOUSGENT three-stage persona metamorphosis from Awakened Persona across the 3D @cbrain/core Morphic Intelligence Field to Sovereign Wisdom'
  },
  {
    title: 'Design 1 · Solar X-Ray Connectome (1200×630)',
    href: '/brand/og-design-1-solar-xray.jpg',
    src: '/brand/og-design-1-solar-xray.jpg',
    width: 1200,
    height: 630,
    alt: 'NOUSGENT Solar X-Ray sculpted persona mask and glowing @cbrain/core 4D connectome Open Graph social card'
  },
  {
    title: 'Design 2 · 3/4 Sculptural Visage (1200×630)',
    href: '/brand/og-design-2-sculptural-totem.jpg',
    src: '/brand/og-design-2-sculptural-totem.jpg',
    width: 1200,
    height: 630,
    alt: 'NOUSGENT 3/4 sculptural persona visage in front of 3D @cbrain/core holographic brain social card'
  },
  {
    title: 'Square Unfurl · Bipartite Crest (1200×1200)',
    href: '/og-square.jpg',
    src: '/og-square.jpg',
    width: 1200,
    height: 1200,
    alt: 'NOUSGENT square 1200x1200 Morphic Persona & @cbrain/core Studio social graph emblem'
  }
] as const;

export function DossierAndDocsPage({ snapshot }: Readonly<DossierAndDocsPageProps>) {
  const supportsUntilFound =
    typeof HTMLElement !== 'undefined' && 'onbeforematch' in HTMLElement.prototype;

  const [callsign, setCallsign] = useState<string>('NOUSGENT-IL-0001');
  const [activeDocTab, setActiveDocTab] = useState<number>(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="bento-grid" style={{ alignItems: 'start' }}>
        <section className="glass-card col-6" aria-label="Morphic Persona Flight Card and Citizen Ranks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '23px', fontWeight: 600 }}>Morphic Persona &amp; @cbrain/core Flight Card</h1>
              <span className="pill-badge pistachio">SHAREABLE SVG</span>
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
                className="btn-spatial btn-pistachio"
              >
                Open Full SVG →
              </a>
            </div>

            <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--color-outline-strong)' }}>
              <img
                src={`/api/nousgent/card/${encodeURIComponent(callsign)}.svg`}
                alt={`NOUSGENT Morphic Persona and @cbrain/core Flight Card for ${callsign}`}
                width={1200}
                height={630}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            <div className="glass-well">
              <div className="mono-xs text-muted" style={{ marginBottom: '0.45rem' }}>
                CITIZEN KEYHOLDER PROGRESSION LADDER
              </div>
              <div className="mono-xs" style={{ display: 'grid', gap: '0.35rem' }}>
                <div>01 // Rank I: Clavius Cadet (0+ XP — Sandboxed Pod Bonded)</div>
                <div>02 // Rank II: Discovery Flight Engineer (2,500+ XP — Verified .dig Minted)</div>
                <div>03 // Rank III: Piriform Immunologist (5,000+ XP — CN-I Antibody Synthesized)</div>
                <div className="text-jade">04 // Rank IV: Thalamic Keyholder (10,000+ XP — CHIP-0043 Passkey Co-Signer)</div>
                <div className="text-pistachio">05 // Rank V: Urbana Sovereign Architect (25,000+ XP — Citation-DAG Lineage)</div>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card cyan col-6" aria-label="Dual-Domain Separation and ia.nousgent.ai M2M API">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '21px', fontWeight: 600 }}>Dual-Domain Telemetry &amp; M2M Suite</h2>
              <span className="pill-badge jade">MCP 2025-03-26</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="glass-well" style={{ borderColor: 'rgb(126 217 87 / 0.4)' }}>
                <div className="mono-xs text-pistachio">PERSONA STUDIO (HUMAN)</div>
                <div className="mono-sm" style={{ fontWeight: 600, marginTop: '0.25rem' }}>https://nousgent.ai</div>
                <div className="mono-xs text-muted" style={{ marginTop: '0.2rem' }}>
                  plane=&quot;human_ui&quot; · {snapshot.humanRequests.toLocaleString()} LIVE REQS
                </div>
              </div>
              <div className="glass-well" style={{ borderColor: 'rgb(45 212 191 / 0.4)' }}>
                <div className="mono-xs text-jade">M2M SWARM CONDUIT</div>
                <div className="mono-sm" style={{ fontWeight: 600, marginTop: '0.25rem' }}>https://ia.nousgent.ai</div>
                <div className="mono-xs text-muted" style={{ marginTop: '0.2rem' }}>
                  plane=&quot;m2m_ia&quot; · {snapshot.m2mRequests.toLocaleString()} LIVE REQS (shi: {snapshot.shiM2mRequestsCount.toLocaleString()})
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
                      return () => el.removeEventListener('beforematch', handler);
                    }}
                  >
                    <div className="tabpanel-inner">
                      <div className="cli-strip">
                        <code id={cmdId} className="mono-xs">
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
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--color-outline)' }}
                >
                  <span>#0{idx + 1} · {h.stateCode} ({h.hubName} · {h.subtitle})</span>
                  <span className="text-pistachio">{h.rigsCount.toLocaleString()} PODS · {h.storagePb} PB</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Brand Identity & Social Graph Gallery */}
      <section className="glass-card" aria-label="Morphic Persona Brand Identity and Rich Social Graph Kit">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
            <div>
              <span className="mono-xs text-bronze">// BRAND IDENTITY &amp; RICH SOCIAL SHARING KIT</span>
              <h2 style={{ fontSize: '21px', fontWeight: 700, marginTop: '0.2rem' }}>
                Sculpted Persona Metamorphosis × `@cbrain/core` Social Graph Designs
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a href="/logo-wordmark.svg" target="_blank" rel="noreferrer" className="btn-spatial btn-glass" style={{ fontSize: '12px' }}>
                Wordmark SVG →
              </a>
              <a href="/brand/logo-concept-b-bipartite-crest.svg" target="_blank" rel="noreferrer" className="btn-spatial btn-glass" style={{ fontSize: '12px' }}>
                Bipartite Crest SVG →
              </a>
              <a href="/brand/logo-concept-c-monoline-glyph.svg" target="_blank" rel="noreferrer" className="btn-spatial btn-glass" style={{ fontSize: '12px' }}>
                Monoline Glyph SVG →
              </a>
            </div>
          </div>

          <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--color-outline)' }}>
            <img
              src="/logo-wordmark.svg"
              alt="nousgent.ai Morphic Persona and @cbrain/core 4D Brand Wordmark"
              width={820}
              height={104}
              loading="lazy"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.9rem' }}>
            {SOCIAL_KIT_ASSETS.map((asset) => (
              <a
                key={asset.href}
                href={asset.href}
                target="_blank"
                rel="noreferrer"
                className="glass-well"
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}
              >
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-outline)' }}>
                  <img
                    src={asset.src}
                    alt={asset.alt}
                    width={asset.width}
                    height={asset.height}
                    loading="lazy"
                    style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: `${asset.width} / ${asset.height}`, objectFit: 'cover' }}
                  />
                </div>
                <div className="mono-xs text-ivory" style={{ fontWeight: 600 }}>
                  {asset.title}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
