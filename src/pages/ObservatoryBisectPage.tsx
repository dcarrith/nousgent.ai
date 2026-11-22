import { useState } from 'react';
import { playQuindarBeep } from '../hooks/useNousgentMission';

interface BisectProbe {
  readonly step: number;
  readonly generationProbed: number;
  readonly canaryVerdict: string;
}

export function ObservatoryBisectPage() {
  const [totalGens, setTotalGens] = useState<number>(1024);
  const [culpritGen, setCulpritGen] = useState<number>(611);
  const [probes, setProbes] = useState<readonly BisectProbe[]>([
    { step: 1, generationProbed: 512, canaryVerdict: 'CLEAN_MERKLE_ROOT' },
    { step: 2, generationProbed: 768, canaryVerdict: 'REGRESSION_DETECTED' },
    { step: 3, generationProbed: 640, canaryVerdict: 'REGRESSION_DETECTED' },
    { step: 4, generationProbed: 576, canaryVerdict: 'CLEAN_MERKLE_ROOT' },
    { step: 5, generationProbed: 608, canaryVerdict: 'CLEAN_MERKLE_ROOT' },
    { step: 6, generationProbed: 624, canaryVerdict: 'REGRESSION_DETECTED' },
    { step: 7, generationProbed: 616, canaryVerdict: 'REGRESSION_DETECTED' },
    { step: 8, generationProbed: 612, canaryVerdict: 'REGRESSION_DETECTED' },
    { step: 9, generationProbed: 610, canaryVerdict: 'CLEAN_MERKLE_ROOT' },
    { step: 10, generationProbed: 611, canaryVerdict: 'REGRESSION_DETECTED' }
  ]);
  const [latencyMs, setLatencyMs] = useState<number>(0.18);
  const [culpritCommit, setCulpritCommit] = useState<string>('0x8B2F1904C71EA611');
  const [ndjsonLines, setNdjsonLines] = useState<readonly string[]>([
    '{"plane":"m2m_ia","host":"ia.nousgent.ai","seq":1,"kcWinners":64,"bariPct":84.7,"forgettingPct":0}',
    '{"plane":"m2m_ia","host":"ia.nousgent.ai","seq":2,"organ":"dolfactory.to","odorPlumePpm":0.004,"verdict":"NOMINAL"}'
  ]);

  async function handleRunBisect(): Promise<void> {
    playQuindarBeep(2525);
    try {
      const res = await fetch('/api/nousgent/bisect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalGenerations: totalGens, culpritGeneration: culpritGen })
      });
      if (res.ok) {
        const d = await res.json();
        setProbes(d.probeHistory);
        setLatencyMs(d.bisectLatencyMs);
        setCulpritCommit(d.culpritCommit);
      }
    } catch {
      /* offline static mode */
    }
  }

  async function handleFetchStreamSample(): Promise<void> {
    try {
      const res = await fetch('/api/nousgent/stream?frames=3');
      if (res.ok) {
        const txt = await res.text();
        setNdjsonLines(txt.trim().split('\n').filter(Boolean));
      }
    } catch {
      /* offline static mode */
    }
  }

  return (
    <div className="bento-grid" style={{ alignItems: 'start' }}>
      <section className="glass-card emerald col-6" aria-label="4D cbrain.to Holographic Connectome">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '23px', fontWeight: 600 }}>4D cbrain.to Holographic Topology</h1>
            <span className="pill-badge emerald">● 60 FPS · 2,048 KC</span>
          </div>

          <div className="glass-well" style={{ padding: '1rem' }}>
            <svg viewBox="0 0 420 210" width="100%" height="200" aria-label="5-Lobe Chia Merkle Connectome">
              <line x1="90" y1="60" x2="210" y2="45" stroke="#7bd0ff" strokeWidth="1.6" strokeDasharray="4 3" />
              <line x1="210" y1="45" x2="330" y2="65" stroke="#4edea3" strokeWidth="1.6" strokeDasharray="4 3" />
              <line x1="90" y1="60" x2="145" y2="155" stroke="#ddb7ff" strokeWidth="1.6" />
              <line x1="330" y1="65" x2="275" y2="155" stroke="#f43f5e" strokeWidth="1.6" />
              <line x1="145" y1="155" x2="275" y2="155" stroke="#7bd0ff" strokeWidth="1.6" />

              {[
                { x: 90, y: 60, label: 'WORKING', color: '#ddb7ff' },
                { x: 210, y: 45, label: 'SEMANTIC', color: '#7bd0ff' },
                { x: 330, y: 65, label: 'PROCEDURAL', color: '#4edea3' },
                { x: 145, y: 155, label: 'EPISODIC', color: '#facc15' },
                { x: 275, y: 155, label: 'ALIGNMENT (RING-0)', color: '#f43f5e' }
              ].map((lobe) => (
                <g key={lobe.label}>
                  <circle cx={lobe.x} cy={lobe.y} r="16" fill="#0e0d15" stroke={lobe.color} strokeWidth="2.5" />
                  <circle cx={lobe.x} cy={lobe.y} r="5.5" fill={lobe.color} />
                  <text
                    x={lobe.x}
                    y={lobe.y + 30}
                    textAnchor="middle"
                    fill="#e4e1ed"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {lobe.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="glass-well">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="mono-xs text-cyan">IA.NOUSGENT.AI // M2M STREAMABLE HTTP NDJSON</span>
              <button type="button" className="btn-spatial btn-glass" onClick={() => void handleFetchStreamSample()}>
                Sample M2M Wire
              </button>
            </div>
            <pre
              className="mono-xs text-emerald"
              style={{
                margin: 0,
                background: 'var(--color-void)',
                padding: '0.7rem',
                borderRadius: '8px',
                overflowX: 'auto',
                border: '1px solid rgb(77 67 84 / 0.4)'
              }}
            >
              {ndjsonLines.join('\n')}
            </pre>
          </div>
        </div>
      </section>

      <section className="glass-card col-6" aria-label="O(log N) Git Bisect Surgical Excise">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '21px', fontWeight: 600 }}>O(log N) Git Bisect vs. Bowman Screwdriver</h2>
            <span className="pill-badge">{probes.length} PROBES ({latencyMs}ms)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label htmlFor="total-gens" className="mono-xs text-muted">
                CAPSULE GENERATIONS ({totalGens})
              </label>
              <input
                id="total-gens"
                type="number"
                min={16}
                max={65536}
                className="spatial-input"
                style={{ marginTop: '0.3rem' }}
                value={totalGens}
                onChange={(e) => setTotalGens(Number(e.target.value) || 1024)}
              />
            </div>
            <div>
              <label htmlFor="culprit-gen" className="mono-xs text-muted">
                POISONED GENERATION (#{culpritGen})
              </label>
              <input
                id="culprit-gen"
                type="number"
                min={1}
                max={totalGens}
                className="spatial-input"
                style={{ marginTop: '0.3rem' }}
                value={culpritGen}
                onChange={(e) => setCulpritGen(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <button type="button" className="btn-spatial btn-violet" onClick={() => void handleRunBisect()}>
            Run O(log N) Canary Bisect + Tombstone Revert
          </button>

          <div className="glass-well" style={{ borderColor: 'rgb(78 222 163 / 0.45)' }}>
            <div className="mono-xs text-emerald">
              ✓ ISOLATED CULPRIT {culpritCommit} IN {probes.length} PROBES ({latencyMs}ms) — 100% COGNITION RETAINED
            </div>
          </div>

          <div style={{ maxHeight: '236px', overflowY: 'auto', borderRadius: '10px', border: '1px solid rgb(77 67 84 / 0.45)' }}>
            {probes.map((p) => (
              <div
                key={p.step}
                className="mono-xs"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid rgb(77 67 84 / 0.3)'
                }}
              >
                <span>STEP {String(p.step).padStart(2, '0')} // GEN #{p.generationProbed}</span>
                <span className={p.canaryVerdict === 'REGRESSION_DETECTED' ? 'text-rose' : 'text-emerald'}>
                  {p.canaryVerdict === 'REGRESSION_DETECTED' ? '✕ ' : '✓ '}
                  {p.canaryVerdict}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
