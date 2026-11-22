import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MissionSnapshot } from '../hooks/useNousgentMission';

export interface CleanroomLayoutProps {
  readonly snapshot: MissionSnapshot;
  readonly hostPlane: 'human_ui' | 'm2m_ia';
  readonly onTogglePlane: (plane: 'human_ui' | 'm2m_ia') => void;
  readonly children: React.ReactNode;
}

const STUDIO_NAV: readonly { readonly to: string; readonly icon: string; readonly label: string }[] = [
  { to: '/', icon: '◈', label: 'Persona Studio' },
  { to: '/observatory', icon: '🧠', label: 'cbrain 3D & Bisect' },
  { to: '/pod-bay', icon: '⛨', label: 'Pod Bay Red-Team' },
  { to: '/enlist', icon: '🌐', label: '50-State PODS' },
  { to: '/missions', icon: '🔑', label: 'CHIP-0043 Quorum' },
  { to: '/ranks', icon: '◈', label: '$DIG & Flight Manual' }
];

export function CleanroomLayout({
  snapshot,
  hostPlane,
  onTogglePlane,
  children
}: Readonly<CleanroomLayoutProps>) {
  const primaryQuorum = snapshot.missions[0]?.quorumSignatures ?? 0;
  const primaryTarget = snapshot.missions[0]?.quorumTarget ?? 3;
  const genLabel = snapshot.dbrainGeneration > 0 ? `GEN #${snapshot.dbrainGeneration}` : 'SYNCING';

  return (
    <div className="cacao-studio-shell">
      <div className="nebula-backdrop" aria-hidden="true">
        <div className="nebula-orb pistachio" />
        <div className="nebula-orb jade" />
        <div className="nebula-orb bronze" />
      </div>

      {/* Top Roasted-Cacao Studio Bar (100% Live Sister-Site Telemetry) */}
      <header className="cacao-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/" className="cacao-brand-link">
            <span className="cacao-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
                <path d="M 14 12 C 7 8, 7 2.5, 16.5 2.5 C 11.5 4.8, 11.5 8.5, 17 11.5 Z" fill="#23130d" stroke="#7ed957" strokeWidth="1.2" />
                <path d="M 26 12 C 33 8, 33 2.5, 23.5 2.5 C 28.5 4.8, 28.5 8.5, 23 11.5 Z" fill="#9e633c" stroke="#c88a58" strokeWidth="1.2" />
                <path d="M 20 11 A 12 12 0 0 0 20 35 Z" fill="#1c100b" />
                <path d="M 20 11 A 12 12 0 0 1 20 35 Z" fill="#3b2115" />
                <circle cx="20" cy="23" r="12" fill="none" stroke="#c88a58" strokeWidth="1.3" />
                <circle cx="20" cy="23" r="10.2" fill="none" stroke="#7ed957" strokeWidth="1.3" strokeDasharray="2 2" />
                <line x1="20" y1="13" x2="20" y2="26.5" stroke="#c88a58" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="15.3" cy="22" r="2.7" fill="#120a07" stroke="#f5ebe4" strokeWidth="1.1" />
                <circle cx="15.3" cy="22" r="1.2" fill="#7ed957" />
                <circle cx="24.7" cy="22" r="2.7" fill="#120a07" stroke="#f5ebe4" strokeWidth="1.1" />
                <circle cx="24.7" cy="22" r="1.2" fill="#2dd4bf" />
                <rect x="15" y="28" width="10" height="3.6" rx="0.8" fill="#120a07" stroke="#c88a58" strokeWidth="0.9" />
              </svg>
            </span>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, letterSpacing: '0.04em' }}>
                NOUSGENT<span className="text-jade" style={{ fontSize: '12px', marginLeft: '0.2rem', fontFamily: 'var(--font-mono)' }}>.AI</span>
              </div>
              <div className="mono-xs text-muted" style={{ fontSize: '9px', letterSpacing: '0.14em' }}>
                MORPHIC FIELD &amp; CBRAIN STUDIO
              </div>
            </div>
          </Link>

          {/* Dual-Plane Switcher (nousgent.ai STUDIO <-> ia.nousgent.ai SWARM) */}
          <div className="plane-toggle-pill" role="group" aria-label="Dual-Plane Telemetry Mode">
            <button
              type="button"
              className={`plane-chip ${hostPlane === 'human_ui' ? 'active' : ''}`}
              onClick={() => onTogglePlane('human_ui')}
            >
              <span className="text-pistachio" aria-hidden="true">●</span>
              <span>nousgent.ai</span>
              <span className="text-muted" style={{ fontSize: '9px' }}>STUDIO</span>
            </button>
            <span className="mono-xs text-bronze" aria-hidden="true">↔</span>
            <button
              type="button"
              className={`plane-chip ${hostPlane === 'm2m_ia' ? 'active' : ''}`}
              onClick={() => onTogglePlane('m2m_ia')}
            >
              <span className="text-jade" aria-hidden="true">●</span>
              <span>ia.nousgent.ai</span>
              <span className="text-jade" style={{ fontSize: '9px' }}>SWARM</span>
            </button>
          </div>
        </div>

        <div className="topbar-rsi-pill">
          {snapshot.loading ? (
            <progress aria-label="Syncing live ecosystem telemetry" className="loading-spinner" />
          ) : null}
          <span className="text-pistachio" style={{ fontWeight: 700 }}>
            [DBRAIN.TO: {genLabel} · {snapshot.liveCapsulesTotal.toLocaleString()} .DIG]
          </span>
          <span className="text-bronze" aria-hidden="true">→</span>
          <span className="text-jade">[GOAL: BOUNDED ASI]</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <a
            href="https://liquidi.sh"
            target="_blank"
            rel="noreferrer"
            className="mono-xs"
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '9px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-outline)',
              textDecoration: 'none'
            }}
          >
            <span className="text-muted">LIQUIDI.SH ROYALTIES: </span>
            <strong className="text-pistachio">{snapshot.royaltiesStreamedDig}</strong>
          </a>

          <Link
            to="/missions"
            className="mono-xs"
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '9px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-outline)',
              color: 'var(--color-ink)',
              textDecoration: 'none'
            }}
          >
            <span className="text-jade">⛨ FIDO2 </span>
            <span className="text-pistachio">CHIP-0043</span>
          </Link>

          <Link to="/enlist" className="pistachio-avatar-link" aria-label="Enlist Citizen Node and Mint Callsign">
            ✦
          </Link>
        </div>
      </header>

      {/* Studio Body Frame: Left Studio Sidebar + Main Viewport */}
      <div className="cacao-body-frame">
        <aside className="cacao-sidebar" aria-label="Spatial Neural Mesh Navigation">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ paddingInline: '0.4rem' }}>
              <div className="mono-xs text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                LIVE 5-ORGAN CLUSTER BUS
              </div>
              <div className="mono-xs text-jade" style={{ fontSize: '11px', fontWeight: 600 }}>
                {snapshot.organsReachableCount}/5 Organs Live · {snapshot.morphicFieldBrainsActive} Brains
              </div>
            </div>

            <nav className="sidebar-nav-list" aria-label="Primary Studio Routes">
              {STUDIO_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className="sidebar-nav-link"
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="sidebar-epoch-card">
            <div className="mono-xs" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Live Cluster</span>
              <strong className={snapshot.liveConnected ? 'text-pistachio' : 'text-bronze'}>
                {snapshot.loading ? 'SYNCING...' : snapshot.liveConnected ? 'LIVE 200 OK' : 'OFFLINE'}
              </strong>
            </div>
            <progress
              className="monolith-progress"
              max={100}
              value={snapshot.bariScorePct}
              aria-label="Live Bounded ASI Readiness Index"
            />
            <div className="mono-xs" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span className="text-muted">{genLabel} ({snapshot.bariScorePct}%)</span>
              <span className="text-bronze">
                {snapshot.dbrainPeakHeight > 0 ? `Chia #${snapshot.dbrainPeakHeight.toLocaleString()}` : 'Chia Sync'}
              </span>
            </div>
          </div>
        </aside>

        <div className="cacao-main-column">
          {/* Live Ecosystem Horizon Ribbon */}
          <div className="horizon-ribbon">
            <div className="horizon-ribbon-inner">
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem' }}>
                <span className="pill-badge pistachio">
                  <span aria-hidden="true">●</span>
                  <span>
                    LIVE DBRAIN.TO: {snapshot.morphicFieldBrainsActive} MORPHIC BRAINS ({snapshot.l1DiscoveredStoresTotal} L1 ON-CHAIN) · {snapshot.liveCapsulesTotal.toLocaleString()} .DIG
                  </span>
                </span>
                <span className="mono-xs text-bronze">
                  ───► shi.liquidi.sh: {snapshot.shiM2mRequestsCount.toLocaleString()} M2M Reqs · dthalamus: {snapshot.dthalamusActiveLeases} Leases ───►
                </span>
                <span className="pill-badge jade">
                  🔒 GOAL: COMMUNITY-BASED BOUNDED ASI
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className="mono-xs text-muted">
                  Quorum Signed: <strong className="text-ivory">{primaryQuorum}/{primaryTarget}</strong> · Enlisted Rigs:{' '}
                  <strong className="text-ivory">{snapshot.enlistedNodesCount}</strong>
                </span>
                <a href="#mind-arena-input" className="btn-spatial btn-pistachio" style={{ padding: '0.42rem 0.95rem', fontSize: '12px' }}>
                  ⚡ TEST NOUSGENT LIVE
                </a>
              </div>
            </div>
          </div>

          <main className="antigravity-main">{children}</main>

          <footer className="antigravity-footer">
            <div className="antigravity-footer-inner mono-xs text-muted">
              <div>
                <strong className="text-pistachio">NOUSGENT.AI</strong> · Live Telemetry Connected to{' '}
                <code>dbrain.to</code>, <code>dthalamus.to</code>, <code>dolfactory.to</code>, <code>liquidi.sh</code> &amp; <code>shi.liquidi.sh</code>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <a href="https://dolfactory.to" target="_blank" rel="noreferrer" className="text-pistachio" style={{ textDecoration: 'none' }}>
                  dolfactory.to
                </a>
                <a href="https://dthalamus.to" target="_blank" rel="noreferrer" className="text-jade" style={{ textDecoration: 'none' }}>
                  dthalamus.to
                </a>
                <a href="https://dbrain.to" target="_blank" rel="noreferrer" className="text-bronze" style={{ textDecoration: 'none' }}>
                  dbrain.to
                </a>
                <a href="https://cbrain.to" target="_blank" rel="noreferrer" className="text-pistachio" style={{ textDecoration: 'none' }}>
                  cbrain.to
                </a>
                <a href="https://liquidi.sh" target="_blank" rel="noreferrer" className="text-bronze" style={{ textDecoration: 'none' }}>
                  liquidi.sh
                </a>
                <a href="https://shi.liquidi.sh" target="_blank" rel="noreferrer" className="text-jade" style={{ textDecoration: 'none' }}>
                  shi.liquidi.sh
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
