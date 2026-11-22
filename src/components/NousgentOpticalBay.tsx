import { playQuindarBeep } from '../hooks/useNousgentMission';

export interface NousgentOpticalBayProps {
  readonly alertActive?: boolean;
  readonly statusCaption?: string;
}

export function NousgentOpticalBay({
  alertActive = false,
  statusCaption = 'HEURISTIC LOCK'
}: Readonly<NousgentOpticalBayProps>) {
  return (
    <section className="spec-cell col-4" aria-label="NOUSGENT Optical Bay">
      <div className="spec-cell-header">
        <span className="spec-label">CELL 01 // OPTICAL BAY</span>
        <span className="spec-mono text-emerald">RING-0 ISOLATED</span>
      </div>
      <div className="spec-cell-body">
        <div className="optical-bezel">
          <div className="hex-screw tl" aria-hidden="true" />
          <div className="hex-screw tr" aria-hidden="true" />
          <div className="hex-screw bl" aria-hidden="true" />
          <div className="hex-screw br" aria-hidden="true" />

          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 0.35rem' }}>
            <span className="spec-mono">OPTICAL BAY 01</span>
            <span className="spec-mono text-mint">NOUSGENT</span>
          </div>

          <button
            type="button"
            onClick={() => playQuindarBeep(alertActive ? 2475 : 2525)}
            aria-label="Ping NOUSGENT Apollo Quindar Optical Telemetry"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg width="176" height="176" viewBox="0 0 180 180" fill="none" aria-hidden="true">
              <circle cx="90" cy="90" r="84" stroke="var(--color-outline)" strokeWidth="2" />
              <circle cx="90" cy="90" r="74" stroke="var(--color-ink-muted)" strokeWidth="6" />
              <circle cx="90" cy="90" r="62" stroke="var(--color-outline-variant)" strokeDasharray="4 4" strokeWidth="1" />
              <circle
                cx="90"
                cy="90"
                r="52"
                fill="var(--color-ink)"
                stroke={alertActive ? 'var(--color-secondary)' : 'var(--color-primary)'}
                strokeWidth="2.5"
              />
              <circle
                cx="90"
                cy="90"
                r="36"
                fill="var(--color-ink)"
                stroke={alertActive ? 'var(--color-secondary)' : 'var(--color-tertiary-bright)'}
                strokeWidth="2.5"
              />
              <circle
                cx="90"
                cy="90"
                r="18"
                fill={alertActive ? 'var(--color-secondary)' : 'var(--color-tertiary)'}
              />
              <circle
                cx="90"
                cy="90"
                r="7"
                fill={alertActive ? 'var(--color-secondary-fixed)' : 'var(--color-tertiary-mint)'}
              />
              <ellipse
                cx="74"
                cy="70"
                rx="10"
                ry="5"
                fill="var(--color-primary-fixed)"
                fillOpacity="0.45"
                transform="rotate(-35 74 70)"
              />
              <line x1="90" y1="10" x2="90" y2="26" stroke="var(--color-tertiary-mint)" strokeWidth="1.5" />
              <line x1="90" y1="154" x2="90" y2="170" stroke="var(--color-tertiary-mint)" strokeWidth="1.5" />
              <line x1="10" y1="90" x2="26" y2="90" stroke="var(--color-tertiary-mint)" strokeWidth="1.5" />
              <line x1="154" y1="90" x2="170" y2="90" stroke="var(--color-tertiary-mint)" strokeWidth="1.5" />
            </svg>
          </button>

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-outline)',
              paddingTop: '0.55rem'
            }}
          >
            <span className="spec-mono text-sky">APERTURE F/1.2</span>
            <span className="spec-mono text-mint" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className={alertActive ? 'status-dot status-dot-crimson' : 'status-dot status-dot-mint'} />
              {statusCaption}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
