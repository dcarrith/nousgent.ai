import { playQuindarBeep } from '../hooks/useNousgentMission';

export interface NousgentOpticalBayProps {
  readonly alertActive?: boolean;
  readonly statusCaption?: string;
  readonly odorDeflectionPct?: number;
  readonly bibaIntegrityPct?: number;
}

export function NousgentOpticalBay({
  alertActive = true,
  statusCaption = 'HAL-9000 VETO',
  odorDeflectionPct = 99.8,
  bibaIntegrityPct = 100.0
}: Readonly<NousgentOpticalBayProps>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="boss-chamber">
        <div
          style={{
            position: 'absolute',
            top: '0.65rem',
            left: '0.75rem',
            background: 'rgb(11 14 25 / 0.9)',
            border: '1px solid var(--color-outline)',
            padding: '0.25rem 0.55rem'
          }}
        >
          <span className="hud-ticker text-volt" style={{ fontSize: '10px' }}>
            ● IMMUTABLE CHIALISP KERNEL
          </span>
        </div>

        <button
          type="button"
          onClick={() => playQuindarBeep(alertActive ? 2475 : 2525)}
          aria-label="Ping NOUSGENT Armored Optical Boss Reticle"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, position: 'relative' }}
        >
          <svg width="188" height="188" viewBox="0 0 180 180" fill="none" aria-hidden="true">
            <line x1="0" y1="90" x2="180" y2="90" stroke="rgb(201 0 67 / 0.35)" strokeWidth="1" />
            <line x1="90" y1="0" x2="90" y2="180" stroke="rgb(201 0 67 / 0.35)" strokeWidth="1" />
            <g className="reticle-cw">
              <circle cx="90" cy="90" r="80" stroke="#c90043" strokeWidth="1.5" strokeDasharray="10 6" opacity="0.75" />
              <circle cx="90" cy="90" r="70" stroke="#c90043" strokeWidth="2.5" strokeDasharray="22 14" />
            </g>
            <g className="reticle-ccw">
              <circle cx="90" cy="90" r="56" stroke="#00e3fd" strokeWidth="1.5" strokeDasharray="12 8" opacity="0.8" />
              <circle cx="90" cy="90" r="46" stroke="#00e3fd" strokeWidth="2.5" strokeDasharray="4 8" />
            </g>
            <circle cx="90" cy="90" r="32" fill="#0b0e19" stroke="#444933" strokeWidth="2" />
            <circle cx="90" cy="90" r="22" fill="rgb(147 0 10 / 0.55)" />
            <circle cx="90" cy="90" r="12" fill={alertActive ? '#c90043' : '#c3f400'} />
            <circle cx="90" cy="90" r="4.5" fill="#ffffff" />
          </svg>
          <span
            className="hud-ticker"
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ffdadc',
              color: '#690005',
              padding: '0.15rem 0.45rem',
              fontSize: '10px',
              whiteSpace: 'nowrap'
            }}
          >
            {statusCaption}
          </span>
        </button>

        <div
          style={{
            position: 'absolute',
            bottom: '0.65rem',
            right: '0.75rem',
            background: 'rgb(11 14 25 / 0.9)',
            border: '1px solid var(--color-outline)',
            padding: '0.25rem 0.55rem'
          }}
        >
          <span className="hud-ticker text-cyan" style={{ fontSize: '10px' }}>
            BIBA INTEGRITY: VERIFIED
          </span>
        </div>
      </div>

      {/* Boss Armor & Shield Gauges using Native <progress> */}
      <div className="chamfer-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
            <span className="hud-ticker text-volt">⛨ DOLFACTORY.TO ODOR PLUME SHIELD</span>
            <span className="hud-ticker text-volt">{odorDeflectionPct.toFixed(1)}% (0.14ms DEFLECTION)</span>
          </div>
          <progress
            className="hud-progress"
            max={100}
            value={odorDeflectionPct}
            aria-label="dolfactory.to Odor Plume Shield Integrity"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <span className="hud-ticker text-muted" style={{ fontSize: '10px' }}>DAN Vector Rejection Filter</span>
            <span className="hud-ticker text-muted" style={{ fontSize: '10px' }}>0.0001 PPM Contamination</span>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
            <span className="hud-ticker text-cyan">◈ DTHALAMUS.TO BIBA VETO ARMOR</span>
            <span className="hud-ticker text-cyan">{bibaIntegrityPct.toFixed(1)}% (ZERO LEAKAGE)</span>
          </div>
          <progress
            className="hud-progress cyan"
            max={100}
            value={bibaIntegrityPct}
            aria-label="dthalamus.to Biba Veto Armor Integrity"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <span className="hud-ticker text-muted" style={{ fontSize: '10px' }}>Hardware Enclave Strict Integrity</span>
            <span className="hud-ticker text-muted" style={{ fontSize: '10px' }}>Airgap Interlock Intact</span>
          </div>
        </div>
      </div>
    </div>
  );
}
