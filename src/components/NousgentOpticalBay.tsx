import { playQuindarBeep } from '../hooks/useNousgentMission';

export interface NousgentOpticalBayProps {
  readonly alertActive?: boolean;
  readonly statusCaption?: string;
  readonly petabytesCommitted?: number;
}

export function NousgentOpticalBay({
  alertActive = false,
  statusCaption = 'EXOCORTEX + VERIFIER-DRIVEN // ACTIVE',
  petabytesCommitted = 148.9
}: Readonly<NousgentOpticalBayProps>) {
  return (
    <div className="monolith-slab" role="region" aria-label="Dubai Cacao Monolith and @cbrain/core Connectome">
      {/* Top Header & Pistachio-Jade NOUSGENT Optical Iris */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          className="mono-xs"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgb(126 217 87 / 0.2)'
          }}
        >
          <span className="text-pistachio" style={{ fontWeight: 600 }}>// NOUSGENT.AI</span>
          <span className="text-emerald">0.14ms IPS</span>
        </div>

        <button
          type="button"
          onClick={() => playQuindarBeep(alertActive ? 2475 : 2525)}
          aria-label="Ping NOUSGENT Pistachio-Jade Optical Iris"
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
              border: `1px solid ${alertActive ? 'rgb(244 63 94 / 0.6)' : 'rgb(126 217 87 / 0.45)'}`
            }}
            aria-hidden="true"
          />
          <div
            className="iris-ring-ccw"
            style={{
              position: 'absolute',
              inset: 9,
              borderRadius: '9999px',
              border: `1px dashed ${alertActive ? 'rgb(244 63 94 / 0.7)' : 'rgb(45 212 191 / 0.55)'}`
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
                : 'radial-gradient(circle, rgb(126 217 87 / 0.32), rgb(45 212 191 / 0.2) 70%)'
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
              border: `2px solid ${alertActive ? 'var(--color-rose)' : 'var(--color-pistachio)'}`,
              boxShadow: alertActive
                ? '0 0 26px rgb(244 63 94 / 0.85)'
                : '0 0 26px rgb(126 217 87 / 0.85)',
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
                  ? 'linear-gradient(135deg, #f43f5e, #e89c94)'
                  : 'linear-gradient(135deg, #2dd4bf, #7ed957)'
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
              border: '1px solid rgb(126 217 87 / 0.45)',
              color: 'var(--color-pistachio)',
              fontSize: '9px',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            {statusCaption}
          </span>
        </button>
      </div>

      {/* Center: 4D Holographic Connectome Visualizer (@cbrain/core) */}
      <div
        style={{
          borderRadius: '14px',
          background: 'rgb(26 16 11 / 0.78)',
          border: '1px solid rgb(126 217 87 / 0.22)',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <svg viewBox="0 0 200 200" width="196" height="196" fill="none" aria-label="5-Lobe @cbrain/core Connectome">
          <circle cx="100" cy="100" r="84" stroke="rgb(126 217 87 / 0.16)" strokeWidth="1" />
          <circle cx="100" cy="100" r="58" stroke="rgb(45 212 191 / 0.2)" strokeWidth="1" />
          <path
            d="M 40 80 Q 90 40 160 70 T 170 140 Q 110 180 40 130 Z"
            stroke="#3d2418"
            strokeDasharray="3 3"
            strokeWidth="1.5"
          />
          <line x1="65" y1="75" x2="100" y2="100" stroke="#7ed957" strokeWidth="2" />
          <line x1="50" y1="118" x2="100" y2="100" stroke="#c88a58" strokeWidth="1.6" />
          <line x1="100" y1="100" x2="145" y2="135" stroke="#4ade80" strokeWidth="2" />
          <line x1="100" y1="100" x2="136" y2="74" stroke="#e89c94" strokeWidth="2" />

          {/* Prefrontal Lobe (Pistachio) */}
          <circle cx="65" cy="75" r="9" fill="#7ed957" />
          {/* Olfactory / Kataifi Lobe (Roasted Kataifi Bronze) */}
          <circle cx="50" cy="118" r="7.5" fill="#c88a58" />
          {/* Thalamic Gate (Cardamom Jade) */}
          <circle cx="100" cy="100" r="12" fill="#2dd4bf" />
          {/* Procedural / Cerebellar Lobe (Mint) */}
          <circle cx="145" cy="135" r="8.5" fill="#4ade80" />
          {/* Episodic / Hippocampal Lobe (Warm Terracotta) */}
          <circle cx="136" cy="74" r="8.5" fill="#e89c94" />

          <circle cx="82" cy="88" r="2.5" fill="#f7efe8" />
          <circle cx="122" cy="118" r="2" fill="#2dd4bf" />
        </svg>

        <div
          className="mono-xs"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgb(126 217 87 / 0.2)',
            fontSize: '10px'
          }}
        >
          <span className="text-jade">@cbrain/core // 60 FPS</span>
          <span className="text-pistachio">2,048 KENYON SYNAPSES</span>
        </div>
      </div>

      {/* Bottom Slab Base Anchor */}
      <div
        style={{
          paddingTop: '0.8rem',
          borderTop: '1px solid rgb(126 217 87 / 0.2)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}
      >
        <div className="mono-xs text-muted" style={{ fontSize: '10px', letterSpacing: '0.14em' }}>
          DUBAI CACAO CONNECTOME BAY
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, letterSpacing: '0.02em' }}>
          EXOCORTEX + VERIFIER-DRIVEN FLYWHEEL
        </div>
        <div className="mono-xs text-pistachio" style={{ fontSize: '10px' }}>
          ● CHIA PoST LOCKED: {petabytesCommitted} PB
        </div>
      </div>
    </div>
  );
}
