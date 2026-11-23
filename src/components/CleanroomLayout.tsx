import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MissionSnapshot } from '../hooks/useNousgentMission';

export interface CleanroomLayoutProps {
  readonly snapshot: MissionSnapshot;
  readonly children: React.ReactNode;
}

type StudioNavIconId = 'nousgent' | 'communities' | 'leaderboard' | 'signing';

const STUDIO_NAV: readonly {
  readonly to: string;
  readonly icon: StudioNavIconId;
  readonly label: string;
}[] = [
  { to: '/', icon: 'nousgent', label: 'Nousgent' },
  { to: '/enlist', icon: 'communities', label: 'Communities' },
  { to: '/ranks', icon: 'leaderboard', label: 'Leaderboard' },
  { to: '/missions', icon: 'signing', label: 'Signing' }
];

function renderNavIcon(icon: StudioNavIconId): React.ReactNode {
  if (icon === 'nousgent') {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="8,1.6 14.4,8 8,14.4 1.6,8" />
        <circle cx="8" cy="8" r="2.1" />
      </svg>
    );
  }
  if (icon === 'communities') {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6.2" />
        <line x1="2" y1="8" x2="14" y2="8" />
        <ellipse cx="8" cy="8" rx="3" ry="6.2" />
      </svg>
    );
  }
  if (icon === 'leaderboard') {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 2.5h7v3.6a3.5 3.5 0 0 1-7 0V2.5Z" />
        <path d="M4.5 3.8H2.7a1.5 1.5 0 0 0 0 3h1.9" />
        <path d="M11.5 3.8h1.8a1.5 1.5 0 0 1 0 3h-1.9" />
        <line x1="8" y1="9.6" x2="8" y2="13.2" />
        <line x1="5.2" y1="13.4" x2="10.8" y2="13.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.2" cy="8" r="2.8" />
      <line x1="8" y1="8" x2="14.2" y2="8" />
      <line x1="11.4" y1="8" x2="11.4" y2="10.5" />
      <line x1="13.8" y1="8" x2="13.8" y2="10.5" />
    </svg>
  );
}

export function CleanroomLayout({
  snapshot,
  children
}: Readonly<CleanroomLayoutProps>) {
  const primaryQuorum = snapshot.missions[0]?.quorumSignatures ?? 0;
  const primaryTarget = snapshot.missions[0]?.quorumTarget ?? 3;
  const genLabel = snapshot.dbrainGeneration > 0 ? `Gen #${snapshot.dbrainGeneration}` : 'Syncing';

  return (
    <div className="cacao-studio-shell">
      <div className="nebula-backdrop" aria-hidden="true">
        <div className="nebula-orb pistachio" />
        <div className="nebula-orb jade" />
        <div className="nebula-orb bronze" />
      </div>

      {/* Compact Single-Row Topbar */}
      <header className="cacao-topbar">
        <Link to="/" className="cacao-brand-link">
          <span className="cacao-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="28" height="28" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <circle cx="32" cy="34" r="22" fill="none" stroke="#2dd4bf" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="3 2.5" />
              <path d="M 21 19 C 12 15, 13 7.5, 25 7.5 C 19 10, 19 15, 26 18.5 Z" fill="#23130d" stroke="#7ed957" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M 43 19 C 52 15, 51 7.5, 39 7.5 C 45 10, 45 15, 38 18.5 Z" fill="#9e633c" stroke="#c88a58" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M 32 16 A 19 19 0 0 0 32 54 Z" fill="#1c100b" />
              <path d="M 32 16 A 19 19 0 0 1 32 54 Z" fill="#3b2115" />
              <circle cx="32" cy="35" r="19" fill="none" stroke="#c88a58" strokeWidth="1.9" />
              <circle cx="32" cy="35" r="16.2" fill="none" stroke="#7ed957" strokeWidth="1.6" strokeDasharray="2.8 2.8" />
              <path d="M 19.5 30 Q 25.8 24.5 32 29 Q 38.2 24.5 44.5 30" fill="none" stroke="#c88a58" strokeWidth="1.7" strokeLinecap="round" />
              <line x1="32" y1="20.5" x2="32" y2="40" stroke="#c88a58" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="24.5" cy="33.5" r="4.3" fill="#120a07" stroke="#f5ebe4" strokeWidth="1.5" />
              <circle cx="24.5" cy="33.5" r="2.1" fill="#7ed957" />
              <circle cx="39.5" cy="33.5" r="4.3" fill="#120a07" stroke="#f5ebe4" strokeWidth="1.5" />
              <circle cx="39.5" cy="33.5" r="2.1" fill="#2dd4bf" />
              <rect x="24.5" y="43" width="15" height="5.2" rx="1.2" fill="#120a07" stroke="#c88a58" strokeWidth="1.35" />
            </svg>
          </span>
          <div className="cacao-brand-wordmark">
            <div className="cacao-brand-title">
              NOUSGENT<span className="text-pistachio" style={{ fontSize: '0.9em' }}>.AI</span>
            </div>
            <div className="mono-xs text-muted cacao-brand-subtitle">
              MORPHIC INTELLIGENCE
            </div>
          </div>
        </Link>

        <div className="topbar-rsi-pill">
          {snapshot.loading ? (
            <progress aria-label="Syncing live telemetry" className="loading-spinner" />
          ) : null}
          <span className="text-pistachio" style={{ fontWeight: 600 }}>
            {genLabel} · {snapshot.liveCapsulesTotal.toLocaleString()} .dig
          </span>
          <span className="text-muted">·</span>
          <span className="text-jade">{snapshot.morphicFieldBrainsActive} Brains</span>
        </div>

        <div className="topbar-actions">
          <Link to="/ranks" className="mono-xs topbar-stat-chip">
            <span className="text-muted">Royalties: </span>
            <strong className="text-pistachio">{snapshot.royaltiesStreamedDig}</strong>
          </Link>

          <Link to="/missions" className="mono-xs topbar-stat-chip">
            <span className="text-jade">Signing </span>
            <strong className="text-pistachio">{primaryQuorum}/{primaryTarget}</strong>
          </Link>

          <Link
            to="/enlist"
            className="btn-spatial btn-pistachio topbar-enlist-btn"
          >
            Enlist
          </Link>
        </div>
      </header>

      {/* Sidebar + Main Viewport */}
      <div className="cacao-body-frame">
        <aside className="cacao-sidebar" aria-label="Primary Navigation">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="mono-xs text-jade" style={{ paddingInline: '0.4rem', fontSize: '11px', fontWeight: 600 }}>
              {snapshot.organsReachableCount}/5 Organs · {snapshot.morphicFieldBrainsActive} Brains
            </div>

            <nav className="sidebar-nav-list" aria-label="Primary Studio Routes">
              {STUDIO_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className="sidebar-nav-link"
                >
                  <span className="sidebar-nav-icon" aria-hidden="true">
                    {renderNavIcon(item.icon)}
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="sidebar-epoch-card">
            <div className="mono-xs" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Cluster</span>
              <strong className={snapshot.liveConnected ? 'text-pistachio' : 'text-bronze'}>
                {snapshot.loading ? 'Syncing' : snapshot.liveConnected ? 'Live' : 'Offline'}
              </strong>
            </div>
            <progress
              className="monolith-progress"
              max={100}
              value={snapshot.bariScorePct}
              aria-label="Bounded RSI Readiness"
            />
            <div className="mono-xs" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span className="text-muted">{genLabel} ({snapshot.bariScorePct}%)</span>
              <span className="text-bronze">
                {snapshot.dbrainPeakHeight > 0 ? `#${snapshot.dbrainPeakHeight.toLocaleString()}` : 'Sync'}
              </span>
            </div>
          </div>
        </aside>

        <div className="cacao-main-column">
          <main className="antigravity-main">{children}</main>

          <footer className="antigravity-footer">
            <div className="antigravity-footer-inner mono-xs text-muted">
              <div>
                <strong className="text-pistachio">NOUSGENT</strong> · Collective Bounded RSI on Chia
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
                <a href="https://dolfactory.to" target="_blank" rel="noreferrer" className="text-pistachio" style={{ textDecoration: 'none' }}>
                  Olfactory
                </a>
                <a href="https://dthalamus.to" target="_blank" rel="noreferrer" className="text-jade" style={{ textDecoration: 'none' }}>
                  Thalamus
                </a>
                <a href="https://dbrain.to" target="_blank" rel="noreferrer" className="text-bronze" style={{ textDecoration: 'none' }}>
                  Cortex
                </a>
                <a href="https://cbrain.to" target="_blank" rel="noreferrer" className="text-pistachio" style={{ textDecoration: 'none' }}>
                  Connectome
                </a>
                <a href="https://liquidi.sh" target="_blank" rel="noreferrer" className="text-jade" style={{ textDecoration: 'none' }}>
                  Exchange
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
