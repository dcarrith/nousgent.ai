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
    <div className="grid-12">
      <section className="spec-cell col-6" aria-label="cbrain.to 5-Lobe Holographic Connectome">
        <div className="spec-cell-header">
          <span className="spec-label">CBRAIN.TO // 5-LOBE + 2,048-KC CONNECTOME MONITOR</span>
          <span className="spec-mono text-emerald">WASM32 SPATIAL VERIFIED</span>
        </div>
        <div className="spec-cell-body">
          <div style={{ background: 'var(--color-ink)', padding: '1rem', border: '1px solid var(--color-outline)' }}>
            <svg viewBox="0 0 420 210" width="100%" height="196" aria-label="5-Lobe Chia Merkle Connectome">
              <line x1="90" y1="60" x2="210" y2="45" stroke="#007bb9" strokeWidth="1.5" />
              <line x1="210" y1="45" x2="330" y2="65" stroke="#00855d" strokeWidth="1.5" />
              <line x1="90" y1="60" x2="145" y2="155" stroke="#007bb9" strokeWidth="1.5" />
              <line x1="330" y1="65" x2="275" y2="155" stroke="#ba0035" strokeWidth="1.5" />
              <line x1="145" y1="155" x2="275" y2="155" stroke="#85f8c4" strokeWidth="1.5" />

              {[
                { x: 90, y: 60, label: 'WORKING', color: '#007bb9' },
                { x: 210, y: 45, label: 'SEMANTIC', color: '#00855d' },
                { x: 330, y: 65, label: 'PROCEDURAL', color: '#85f8c4' },
                { x: 145, y: 155, label: 'EPISODIC', color: '#cce5ff' },
                { x: 275, y: 155, label: 'ALIGNMENT (RING-0)', color: '#ba0035' }
              ].map((lobe) => (
                <g key={lobe.label}>
                  <circle cx={lobe.x} cy={lobe.y} r="16" fill="#191c1e" stroke={lobe.color} strokeWidth="2.5" />
                  <circle cx={lobe.x} cy={lobe.y} r="5" fill={lobe.color} />
                  <text
                    x={lobe.x}
                    y={lobe.y + 30}
                    textAnchor="middle"
                    fill="#f0f1f3"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {lobe.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="metric-grid-3">
            <div className="metric-tile">
              <div className="spec-label text-muted">KENYON CELLS</div>
              <div className="spec-mono" style={{ fontSize: '18px', fontWeight: 700, marginTop: '0.2rem' }}>2,048 (w=64)</div>
            </div>
            <div className="metric-tile">
              <div className="spec-label text-muted">MERKLE DRIFT</div>
              <div className="spec-mono text-emerald" style={{ fontSize: '18px', fontWeight: 700, marginTop: '0.2rem' }}>0 LEAVES</div>
            </div>
            <div className="metric-tile">
              <div className="spec-label text-muted">OBSERVATORY</div>
              <a href="https://cbrain.to" target="_blank" rel="noreferrer" className="spec-mono text-cobalt" style={{ display: 'block', marginTop: '0.3rem' }}>
                OPEN CBRAIN.TO
              </a>
            </div>
          </div>

          <div className="metric-tile">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="spec-label">IA.NOUSGENT.AI // M2M STREAMABLE HTTP NDJSON</span>
              <button type="button" className="btn-spec btn-outline" onClick={() => void handleFetchStreamSample()}>
                SAMPLE LIVE M2M WIRE
              </button>
            </div>
            <pre
              className="spec-mono"
              style={{
                margin: 0,
                background: 'var(--color-ink)',
                color: 'var(--color-tertiary-mint)',
                padding: '0.65rem',
                overflowX: 'auto',
                fontSize: '11px'
              }}
            >
              {ndjsonLines.join('\n')}
            </pre>
          </div>
        </div>
      </section>

      <section className="spec-cell col-6" aria-label="O(log N) Git Bisect Simulator">
        <div className="spec-cell-header">
          <span className="spec-label">DBRAIN BISECT // SURGICAL EXCISE VS. BOWMAN SCREWDRIVER</span>
          <span className="spec-mono text-cobalt">{probes.length} PROBES ({latencyMs}ms)</span>
        </div>
        <div className="spec-cell-body">
          <div className="grid-12" style={{ gap: '0.75rem' }}>
            <div className="col-6">
              <label htmlFor="total-gens" className="spec-label">
                CAPSULE GENERATIONS ({totalGens})
              </label>
              <input
                id="total-gens"
                type="number"
                min={16}
                max={65536}
                className="spec-input"
                style={{ marginTop: '0.25rem' }}
                value={totalGens}
                onChange={(e) => setTotalGens(Number(e.target.value) || 1024)}
              />
            </div>
            <div className="col-6">
              <label htmlFor="culprit-gen" className="spec-label">
                POISONED GENERATION (#{culpritGen})
              </label>
              <input
                id="culprit-gen"
                type="number"
                min={1}
                max={totalGens}
                className="spec-input"
                style={{ marginTop: '0.25rem' }}
                value={culpritGen}
                onChange={(e) => setCulpritGen(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <button type="button" className="btn-spec btn-cobalt" onClick={() => void handleRunBisect()}>
            RUN O(LOG N) CANARY BISECT + ATOMIC TOMBSTONE REVERT
          </button>

          <div className="metric-tile metric-tile-emerald">
            <div className="spec-mono text-emerald">
              ISOLATED CULPRIT COMMIT {culpritCommit} IN {probes.length} PROBES ({latencyMs}ms) — 100% COGNITION RETAINED
            </div>
          </div>

          <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--color-outline-variant)' }}>
            {probes.map((p) => (
              <div
                key={p.step}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.75rem',
                  borderBottom: '1px solid var(--color-outline-variant)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
              >
                <span>STEP {String(p.step).padStart(2, '0')} // GEN #{p.generationProbed}</span>
                <span className={p.canaryVerdict === 'REGRESSION_DETECTED' ? 'text-vermilion' : 'text-emerald'}>
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
