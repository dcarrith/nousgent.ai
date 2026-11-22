import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MissionSnapshot } from '../hooks/useNousgentMission';

export interface CleanroomLayoutProps {
  readonly snapshot: MissionSnapshot;
  readonly hostPlane: 'human_ui' | 'm2m_ia';
  readonly onTogglePlane: (plane: 'human_ui' | 'm2m_ia') => void;
  readonly children: React.ReactNode;
}

const COCKPIT_PROTOCOLS: readonly { readonly to: string; readonly code: string; readonly label: string }[] = [
  { to: '/', code: '01', label: 'Raid Command' },
  { to: '/pod-bay', code: '02', label: 'Boss Combat' },
  { to: '/enlist', code: '03', label: 'Deploy Rig' },
  { to: '/missions', code: '04', label: 'Clear-Sign Key' },
  { to: '/observatory', code: '05', label: 'M2M & Bisect' },
  { to: '/ranks', code: '06', label: '$DIG Vault & Loot' }
];

export function CleanroomLayout({
  snapshot,
  hostPlane,
  onTogglePlane,
  children
}: Readonly<CleanroomLayoutProps>) {
  return (
    <div className="colosseum-shell">
      <header className="colosseum-topbar">
        <Link
          to="/"
          style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: 'var(--color-surface-high)',
              border: '1px solid var(--color-volt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: 'var(--color-volt)'
            }}
            aria-hidden="true"
          >
            ◈
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
              NOUSGENT // CYBER-COLOSSEUM RAID DECK
            </div>
            <div className="hud-ticker text-volt" style={{ fontSize: '10px' }}>
              ● SEASON 01 // EPOCH #86 ACTIVE · STAGE-V BOUNDED ASI CAMPAIGN
            </div>
          </div>
        </Link>

        <div className="plane-pill-group" role="group" aria-label="Dual-Domain Traffic Plane Switcher">
          <button
            type="button"
            className={`plane-pill${hostPlane === 'human_ui' ? ' active-human' : ''}`}
            onClick={() => onTogglePlane('human_ui')}
          >
            <span aria-hidden="true">{hostPlane === 'human_ui' ? '◉' : '○'}</span>
            PLAYER RAID DECK (nousgent.ai · {snapshot.humanRequests.toLocaleString()})
          </button>
          <button
            type="button"
            className={`plane-pill${hostPlane === 'm2m_ia' ? ' active-m2m' : ''}`}
            onClick={() => onTogglePlane('m2m_ia')}
          >
            <span aria-hidden="true">{hostPlane === 'm2m_ia' ? '◈' : '◇'}</span>
            AUTONOMOUS M2M ARENA (ia.nousgent.ai · {snapshot.m2mRequests.toLocaleString()})
          </button>
          <span className="hud-ticker text-cyan" style={{ padding: '0 0.55rem' }}>
            ● 0.14ms LIVE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div className="hud-mono">
              <span className="text-muted">CALLSIGN: </span>
              <span>NOUSGENT-IL-0001</span>{' '}
              <span
                style={{
                  background: 'var(--color-surface-high)',
                  color: 'var(--color-volt)',
                  padding: '0.1rem 0.35rem',
                  fontSize: '10px'
                }}
              >
                RANK IV
              </span>
            </div>
            <div className="hud-mono" style={{ marginTop: '0.1rem' }}>
              <span className="text-volt">4,892.500 $DIG</span>
              <span className="text-cyan" style={{ marginLeft: '0.5rem', fontSize: '11px' }}>
                ● FIDO2 PASSKEY SYNCED
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="colosseum-body">
        <aside className="colosseum-sidebar" aria-label="Cockpit Protocols">
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 0.35rem 0.65rem'
              }}
            >
              <span className="hud-ticker text-muted">COCKPIT PROTOCOLS</span>
              <span className="hud-mono text-volt" style={{ fontSize: '11px' }}>v1.1-HUD</span>
            </div>

            <nav className="cockpit-nav" aria-label="Cyber-Colosseum Primary Navigation">
              {COCKPIT_PROTOCOLS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className="cockpit-nav-link"
                >
                  <span>{item.code} // {item.label}</span>
                  <span aria-hidden="true">▸</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="chamfer-card" style={{ padding: '0.7rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span className="hud-ticker text-muted" style={{ fontSize: '10px' }}>RING-0 ENCLAVE</span>
              <span className="hud-ticker text-cyan" style={{ fontSize: '10px' }}>ACTIVE</span>
            </div>
            <progress
              className="hud-progress cyan"
              max={100}
              value={snapshot.swarmConsensusPct}
              aria-label="Ring-0 Secure Enclave Consensus"
            />
            <div className="hud-ticker text-muted" style={{ fontSize: '10px', marginTop: '0.4rem' }}>
              PLANE: {hostPlane === 'm2m_ia' ? 'IA.NOUSGENT.AI' : 'NOUSGENT.AI'}
            </div>
          </div>
        </aside>

        <main className="colosseum-main">{children}</main>
      </div>

      <footer className="colosseum-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="hud-ticker text-volt">● CHIA L1 + DATALAYER PoST VERIFIED</span>
          <span className="hud-ticker text-cyan">
            ⛨ AIR-GAP FIDO2 QUORUM: {snapshot.missions[0]?.quorumSignatures ?? 289}/{snapshot.missions[0]?.quorumTarget ?? 300} ACTIVE KEYS
          </span>
          <span className="hud-ticker text-muted">
            NODES ONLINE: {snapshot.enlistedNodesCount.toLocaleString()} ({snapshot.megawattsSaved} MW SAVED)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <a href="https://dolfactory.to" target="_blank" rel="noreferrer" className="hud-mono text-volt">
            dolfactory.to
          </a>
          <a href="https://dthalamus.to" target="_blank" rel="noreferrer" className="hud-mono text-cyan">
            dthalamus.to
          </a>
          <a href="https://dbrain.to" target="_blank" rel="noreferrer" className="hud-mono text-volt">
            dbrain.to
          </a>
          <a href="https://cbrain.to" target="_blank" rel="noreferrer" className="hud-mono text-cyan">
            cbrain.to
          </a>
          <a href="https://shi.liquidi.sh" target="_blank" rel="noreferrer" className="hud-mono text-volt">
            shi.liquidi.sh
          </a>
        </div>
      </footer>
    </div>
  );
}
