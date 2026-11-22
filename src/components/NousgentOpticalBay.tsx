import { playQuindarBeep } from '../hooks/useNousgentMission';

export interface NousgentOpticalBayProps {
  readonly alertActive?: boolean;
  readonly statusCaption?: string;
  readonly petabytesCommitted?: number;
}

export function NousgentOpticalBay({
  alertActive = false,
  statusCaption = 'BOUNDED // ACTIVE',
  petabytesCommitted = 148.9
}: Readonly<NousgentOpticalBayProps>) {
  return (
    <div className="monolith-slab" role="region" aria-label="1:4:9 Obsidian Monolith and 4D Holographic Connectome">
      {/* Top Header & Sapphire-Violet NOUSGENT Optical Iris */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          className="mono-xs"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgb(77 67 84 / 0.45)'
          }}
        >
          <span className="text-violet" style={{ fontWeight: 600 }}>// MONOLITH.ASI</span>
          <span className="text-emerald">0.14ms IPS</span>
        </div>

        <button
          type="button"
          onClick={() => playQuindarBeep(alertActive ? 2475 : 2525)}
          aria-label="Ping NOUSGENT Sapphire-Violet Monolith Optical Iris"
          style={{
            position: 'relative',
            margin: '1.35rem 0 1.1rem',
            width: 118,
            height: 118,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
        >
          <div
            className="iris-ring-cw"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '9999px',
              border: `1px solid ${alertActive ? 'rgb(244 63 94 / 0.6)' : 'rgb(221 183 255 / 0.45)'}`
            }}
            aria-hidden="true"
          />
          <div
            className="iris-ring-ccw"
            style={{
              position: 'absolute',
              inset: 9,
              borderRadius: '9999px',
              border: `1px dashed ${alertActive ? 'rgb(244 63 94 / 0.7)' : 'rgb(123 208 255 / 0.55)'}`
            }}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'absolute',
              inset: 18,
              borderRadius: '9999px',
              background: alertActive
                ? 'radial-gradient(circle, rgb(244 63 94 / 0.35), transparent 70%)'
                : 'radial-gradient(circle, rgb(221 183 255 / 0.32), rgb(123 208 255 / 0.2) 70%)'
            }}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'relative',
              width: 58,
              height: 58,
              borderRadius: '9999px',
              background: 'var(--color-void)',
              border: `2px solid ${alertActive ? 'var(--color-rose)' : 'var(--color-violet)'}`,
              boxShadow: alertActive
                ? '0 0 26px rgb(244 63 94 / 0.85)'
                : '0 0 26px rgb(221 183 255 / 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '9999px',
                background: alertActive
                  ? 'linear-gradient(135deg, #f43f5e, #ddb7ff)'
                  : 'linear-gradient(135deg, #7bd0ff, #ddb7ff)'
              }}
            />
          </div>
          <span
            className="mono-xs"
            style={{
              position: 'absolute',
              bottom: -10,
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              background: 'var(--color-void)',
              border: '1px solid rgb(78 222 163 / 0.45)',
              color: 'var(--color-emerald)',
              fontSize: '9px',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            {statusCaption}
          </span>
        </button>
      </div>

      {/* Center: 4D Holographic Connectome Visualizer (cbrain.to) */}
      <div
        style={{
          borderRadius: '14px',
          background: 'rgb(27 27 35 / 0.72)',
          border: '1px solid rgb(77 67 84 / 0.4)',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <svg viewBox="0 0 200 200" width="196" height="196" fill="none" aria-label="5-Lobe 4D Holographic Connectome">
          <circle cx="100" cy="100" r="84" stroke="rgb(221 183 255 / 0.16)" strokeWidth="1" />
          <circle cx="100" cy="100" r="58" stroke="rgb(123 208 255 / 0.2)" strokeWidth="1" />
          <path
            d="M 40 80 Q 90 40 160 70 T 170 140 Q 110 180 40 130 Z"
            stroke="#34343d"
            strokeDasharray="3 3"
            strokeWidth="1.5"
          />
          <line x1="65" y1="75" x2="100" y2="100" stroke="#7bd0ff" strokeWidth="2" />
          <line x1="50" y1="118" x2="100" y2="100" stroke="#facc15" strokeWidth="1.6" />
          <line x1="100" y1="100" x2="145" y2="135" stroke="#4edea3" strokeWidth="2" />
          <line x1="100" y1="100" x2="136" y2="74" stroke="#f43f5e" strokeWidth="2" />

          {/* Prefrontal Lobe (Violet) */}
          <circle cx="65" cy="75" r="9" fill="#ddb7ff" />
          {/* Olfactory Lobe (Amber) */}
          <circle cx="50" cy="118" r="7.5" fill="#facc15" />
          {/* Thalamic Gate (Cyan) */}
          <circle cx="100" cy="100" r="12" fill="#7bd0ff" />
          {/* Procedural / Cerebellar Lobe (Emerald) */}
          <circle cx="145" cy="135" r="8.5" fill="#4edea3" />
          {/* Episodic / Hippocampal Lobe (Rose) */}
          <circle cx="136" cy="74" r="8.5" fill="#f43f5e" />

          <circle cx="82" cy="88" r="2.5" fill="#ffffff" />
          <circle cx="122" cy="118" r="2" fill="#7bd0ff" />
        </svg>

        <div
          className="mono-xs"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgb(77 67 84 / 0.35)',
            fontSize: '10px'
          }}
        >
          <span className="text-cyan">cbrain.to // 60 FPS</span>
          <span className="text-emerald">2,048 KENYON SYNAPSES</span>
        </div>
      </div>

      {/* Bottom Slab Base Anchor */}
      <div
        style={{
          paddingTop: '0.8rem',
          borderTop: '1px solid rgb(77 67 84 / 0.45)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}
      >
        <div className="mono-xs text-muted" style={{ fontSize: '10px', letterSpacing: '0.14em' }}>
          SOVEREIGN AIR-GAP CONDUIT
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, letterSpacing: '0.03em' }}>
          1:4:9 OBSIDIAN PROJECTION
        </div>
        <div className="mono-xs text-emerald" style={{ fontSize: '10px' }}>
          ● CHIA PoST LOCKED: {petabytesCommitted} PB
        </div>
      </div>
    </div>
  );
}
