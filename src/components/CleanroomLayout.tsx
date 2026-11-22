import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MissionSnapshot } from '../hooks/useNousgentMission';

export interface CleanroomLayoutProps {
  readonly snapshot: MissionSnapshot;
  readonly hostPlane: 'human_ui' | 'm2m_ia';
  readonly onTogglePlane: (plane: 'human_ui' | 'm2m_ia') => void;
  readonly children: React.ReactNode;
}

const FLIGHT_NAV: readonly { readonly to: string; readonly label: string }[] = [
  { to: '/', label: 'Flight Deck' },
  { to: '/pod-bay', label: 'Pod Bay Red-Team' },
  { to: '/enlist', label: 'Enlist Node' },
  { to: '/missions', label: 'Swarm Clear-Sign' },
  { to: '/observatory', label: '4D cbrain' },
  { to: '/ranks', label: '$DIG Royalties' }
];

export function CleanroomLayout({
  snapshot,
  hostPlane,
  onTogglePlane,
  children
}: Readonly<CleanroomLayoutProps>) {
  const [tickerPaused, setTickerPaused] = useState<boolean>(false);

  return (
    <div className="antigravity-shell">
      <div className="nebula-backdrop" aria-hidden="true">
        <div className="nebula-orb violet" />
        <div className="nebula-orb cyan" />
        <div className="nebula-orb emerald" />
      </div>

      {/* Floating Glassmorphic Pill Header */}
      <header className="pill-header-wrap">
        <div className="pill-header">
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              paddingLeft: '0.25rem'
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: '9999px',
                background: 'var(--color-surface-highest)',
                border: '1px solid rgb(221 183 255 / 0.45)',
                boxShadow: '0 0 14px rgb(221 183 255 / 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-violet)',
                fontSize: '14px'
              }}
              aria-hidden="true"
            >
              ◈
            </span>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, letterSpacing: '0.03em' }}>
                nousgent<span className="text-violet">.ai</span>
              </div>
              <div className="mono-xs text-muted" style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                antigravity
              </div>
            </div>
          </Link>

          <nav className="pill-nav" aria-label="Antigravity Flight Deck Navigation">
            {FLIGHT_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className="pill-nav-link"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onTogglePlane(hostPlane === 'human_ui' ? 'm2m_ia' : 'human_ui')}
              className="btn-spatial btn-glass"
              style={{ padding: '0.35rem 0.75rem', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
              aria-label="Switch active telemetry plane between nousgent.ai and ia.nousgent.ai"
            >
              <span className="text-violet" aria-hidden="true">●</span>
              <span>{hostPlane === 'm2m_ia' ? 'ia.nousgent.ai' : 'nousgent.ai'}</span>
              <span
                style={{
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  background: hostPlane === 'm2m_ia' ? 'var(--color-emerald-bright)' : 'rgb(183 109 255 / 0.3)',
                  color: hostPlane === 'm2m_ia' ? 'var(--color-on-emerald)' : 'var(--color-violet)',
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                {hostPlane === 'm2m_ia' ? `M2M LIVE (${snapshot.m2mRequests.toLocaleString()})` : `HUMAN (${snapshot.humanRequests.toLocaleString()})`}
              </span>
            </button>

            <Link to="/enlist" className="btn-spatial btn-violet" style={{ padding: '0.4rem 0.95rem', fontSize: '12px' }}>
              <span aria-hidden="true">🔑</span>
              <span>Connect</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Syndicate Realtime Telemetry Marquee with WCAG 2.2.2 Pause/Play Control */}
      <div className="syndicate-ribbon">
        <div className="syndicate-ribbon-inner">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flex: 'none' }}>
            <span className="text-emerald" aria-hidden="true">●</span>
            <span className="mono-xs text-emerald" style={{ fontWeight: 600 }}>SYNDICATE REALTIME</span>
          </div>

          <div className="marquee-viewport">
            <div className="marquee-track" data-paused={tickerPaused ? 'true' : 'false'}>
              <span>COLLECTIVE BOUNDED ASI // SOVEREIGN US DEFENSE</span>
              <span className="text-muted">◈</span>
              <span className="text-cyan">CHIA PoST CONSENSUS · {snapshot.petabytesCommitted} PB LOCKED</span>
              <span className="text-muted">◈</span>
              <span className="text-violet">{snapshot.enlistedNodesCount.toLocaleString()} CITIZEN NODES ONLINE</span>
              <span className="text-muted">◈</span>
              <span className="text-emerald">DOLFACTORY AIR-GAP: 100% NOMINAL (0.14ms)</span>
              <span className="text-muted">◈</span>
              <span>IA.NOUSGENT.AI M2M SHARE: {snapshot.m2mSharePct}%</span>
              <span className="text-muted">◈</span>
              <span>COLLECTIVE BOUNDED ASI // SOVEREIGN US DEFENSE</span>
              <span className="text-muted">◈</span>
              <span className="text-cyan">CHIA PoST CONSENSUS · {snapshot.petabytesCommitted} PB LOCKED</span>
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', flex: 'none' }}>
            <span className="mono-xs text-cyan">⛨ CHIP-0043 ACTIVE</span>
            <button
              type="button"
              className="btn-spatial btn-glass"
              style={{ minBlockSize: '26px', padding: '0.15rem 0.55rem', fontSize: '10px', fontFamily: 'var(--font-mono)' }}
              onClick={() => setTickerPaused((prev) => !prev)}
            >
              {tickerPaused ? 'Play' : 'Pause'}
            </button>
          </div>
        </div>
      </div>

      <main className="antigravity-main">{children}</main>

      <footer className="antigravity-footer">
        <div className="antigravity-footer-inner mono-xs text-muted">
          <div>
            // CONNECTOME PROTOCOL : NOUSGENT.AI (HUMAN) • IA.NOUSGENT.AI (ZERO-GRAVITY M2M SUITE)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', flexWrap: 'wrap' }}>
            <a href="https://dolfactory.to" target="_blank" rel="noreferrer" className="text-cyan" style={{ textDecoration: 'none' }}>
              dolfactory.to
            </a>
            <a href="https://dthalamus.to" target="_blank" rel="noreferrer" className="text-violet" style={{ textDecoration: 'none' }}>
              dthalamus.to
            </a>
            <a href="https://dbrain.to" target="_blank" rel="noreferrer" className="text-violet" style={{ textDecoration: 'none' }}>
              dbrain.to
            </a>
            <a href="https://cbrain.to" target="_blank" rel="noreferrer" className="text-emerald" style={{ textDecoration: 'none' }}>
              cbrain.to
            </a>
            <a href="https://shi.liquidi.sh" target="_blank" rel="noreferrer" className="text-cyan" style={{ textDecoration: 'none' }}>
              shi.liquidi.sh
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
