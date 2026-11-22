import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MissionSnapshot } from '../hooks/useNousgentMission';

export interface CleanroomLayoutProps {
  readonly snapshot: MissionSnapshot;
  readonly children: React.ReactNode;
}

const STUDIO_NAV: readonly { readonly to: string; readonly icon: string; readonly label: string }[] = [
  { to: '/', icon: '◈', label: 'Nousgent' },
  { to: '/enlist', icon: '🌐', label: 'Communities' },
  { to: '/ranks', icon: '🏆', label: 'Leaderboard' },
  { to: '/missions', icon: '🔑', label: 'Signing' }
];

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
            <svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true">
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
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '0.02em' }}>
              NOUSGENT<span className="text-pistachio" style={{ fontSize: '0.88em' }}>.AI</span>
            </div>
            <div className="mono-xs text-muted" style={{ fontSize: '0.5625rem', letterSpacing: '0.12em' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            to="/ranks"
            className="mono-xs"
            style={{
              padding: '0.32rem 0.65rem',
              borderRadius: '9px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-outline)',
              color: 'var(--color-ink)',
              textDecoration: 'none'
            }}
          >
            <span className="text-muted">Royalties: </span>
            <strong className="text-pistachio">{snapshot.royaltiesStreamedDig}</strong>
          </Link>

          <Link
            to="/missions"
            className="mono-xs"
            style={{
              padding: '0.32rem 0.65rem',
              borderRadius: '9px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-outline)',
              color: 'var(--color-ink)',
              textDecoration: 'none'
            }}
          >
            <span className="text-jade">Signing </span>
            <strong className="text-pistachio">{primaryQuorum}/{primaryTarget}</strong>
          </Link>

          <Link
            to="/enlist"
            className="btn-spatial btn-pistachio"
            style={{ minBlockSize: '32px', padding: '0.3rem 0.75rem', fontSize: '12px' }}
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
                  <span aria-hidden="true">{item.icon}</span>
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
