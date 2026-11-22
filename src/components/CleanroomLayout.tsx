import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MissionSnapshot } from '../hooks/useNousgentMission';

export interface CleanroomLayoutProps {
  readonly snapshot: MissionSnapshot;
  readonly hostPlane: 'human_ui' | 'm2m_ia';
  readonly onTogglePlane: (plane: 'human_ui' | 'm2m_ia') => void;
  readonly children: React.ReactNode;
}

const NAV_ITEMS: readonly { readonly to: string; readonly label: string }[] = [
  { to: '/', label: 'OVERVIEW' },
  { to: '/pod-bay', label: 'POD BAY ARENA' },
  { to: '/enlist', label: 'ENLIST NODE' },
  { to: '/missions', label: 'CLEAR-SIGN' },
  { to: '/observatory', label: 'OBSERVATORY' },
  { to: '/ranks', label: 'DOSSIER & API' }
];

export function CleanroomLayout({
  snapshot,
  hostPlane,
  onTogglePlane,
  children
}: Readonly<CleanroomLayoutProps>) {
  return (
    <div className="cleanroom-shell">
      <header className="cleanroom-header">
        <div className="cleanroom-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="spec-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                DOC-ID: NOUSGENT-ASI-USA-2026
              </span>
            </Link>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="spec-badge"
                onClick={() => onTogglePlane('human_ui')}
                style={{
                  cursor: 'pointer',
                  borderColor: hostPlane === 'human_ui' ? 'var(--color-tertiary)' : 'var(--color-outline-variant)',
                  background: hostPlane === 'human_ui' ? 'var(--color-surface-lowest)' : 'var(--color-surface)'
                }}
              >
                <span className="status-dot" />
                PRIMARY: NOUSGENT.AI ({snapshot.humanRequests.toLocaleString()})
              </button>
              <button
                type="button"
                className="spec-badge spec-badge-dark"
                onClick={() => onTogglePlane('m2m_ia')}
                style={{
                  cursor: 'pointer',
                  outline: hostPlane === 'm2m_ia' ? '2px solid var(--color-primary-bright)' : 'none'
                }}
              >
                <span className="status-dot status-dot-mint" />
                M2M: IA.NOUSGENT.AI ({snapshot.m2mRequests.toLocaleString()})
              </button>
            </div>
          </div>

          <nav className="cleanroom-nav" aria-label="Mission Control Navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className="cleanroom-nav-link"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link to="/enlist" className="btn-spec btn-vermilion">
            DOWNLOAD OPEN-SOURCE STACK
          </Link>
        </div>
      </header>

      <main className="cleanroom-main">
        <div className="subbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <span className="spec-label">
              URBANA WHITE-ROOM CENTRIFUGE · BAY 01 // 1.00G NOMINAL // CLEANROOM CLASS 100
            </span>
            <span className="spec-mono text-cobalt">
              ACTIVE PLANE: {hostPlane === 'm2m_ia' ? 'HTTPS://IA.NOUSGENT.AI (AUTONOMOUS A2A/MCP)' : 'HTTPS://NOUSGENT.AI (HUMAN CIVIC CONTROL)'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <span className="spec-mono text-muted">
              SAVED: {snapshot.megawattsSaved} MW · {(snapshot.gallonsWaterSaved / 1_000_000).toFixed(2)}M GAL H2O
            </span>
            <span className="spec-mono text-emerald">RING-0 HARDWARE ISOLATION ACTIVE</span>
          </div>
        </div>

        {children}
      </main>

      <footer className="cleanroom-footer">
        <div className="cleanroom-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <span className="spec-label">REV 4.2 // APOLLO FLIGHT DATA MANUAL STANDARD</span>
            <span className="spec-mono text-muted">
              HUMAN: HTTPS://NOUSGENT.AI · M2M SWARM: HTTPS://IA.NOUSGENT.AI
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href="https://dolfactory.to" target="_blank" rel="noreferrer" className="spec-mono text-cobalt">
              dolfactory.to
            </a>
            <a href="https://dthalamus.to" target="_blank" rel="noreferrer" className="spec-mono text-cobalt">
              dthalamus.to
            </a>
            <a href="https://dbrain.to" target="_blank" rel="noreferrer" className="spec-mono text-cobalt">
              dbrain.to
            </a>
            <a href="https://cbrain.to" target="_blank" rel="noreferrer" className="spec-mono text-cobalt">
              cbrain.to
            </a>
            <a href="https://shi.liquidi.sh" target="_blank" rel="noreferrer" className="spec-mono text-cobalt">
              shi.liquidi.sh
            </a>
            <span className="spec-badge spec-badge-emerald">CHIA POST + CHIP-0043 VERIFIED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
