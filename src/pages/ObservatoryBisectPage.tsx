import { useEffect, useState } from 'react';
import { NousgentCbrainMaskStage } from '../components/NousgentCbrainMaskStage';
import { MissionSnapshot, playQuindarBeep } from '../hooks/useNousgentMission';

export interface ObservatoryBisectPageProps {
  readonly snapshot: MissionSnapshot;
}

interface BisectProbe {
  readonly step: number;
  readonly generationProbed: number;
  readonly canaryVerdict: string;
}

export function ObservatoryBisectPage({ snapshot }: Readonly<ObservatoryBisectPageProps>) {
  const initialTotal = snapshot.dbrainGeneration >= 16 ? snapshot.dbrainGeneration : 64;
  const [totalGens, setTotalGens] = useState<number>(initialTotal);
  const [culpritGen, setCulpritGen] = useState<number>(Math.max(1, Math.floor(initialTotal / 2)));
  const [pulseRevision, setPulseRevision] = useState<number>(1);
  const [probes, setProbes] = useState<readonly BisectProbe[]>([]);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [culpritCommit, setCulpritCommit] = useState<string>('');
  const [ndjsonLines, setNdjsonLines] = useState<readonly string[]>([]);

  useEffect(() => {
    if (snapshot.dbrainGeneration >= 16) {
      setTotalGens(snapshot.dbrainGeneration);
      setCulpritGen(Math.max(1, snapshot.dbrainGeneration - 1));
    }
  }, [snapshot.dbrainGeneration]);

  async function handleRunBisect(gensOverride?: number, culpritOverride?: number): Promise<void> {
    const g = gensOverride ?? totalGens;
    const c = culpritOverride ?? culpritGen;
    try {
      const res = await fetch('/api/nousgent/bisect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalGenerations: g, culpritGeneration: c })
      });
      if (res.ok) {
        const d = await res.json();
        setProbes(d.probeHistory);
        setLatencyMs(d.bisectLatencyMs);
        setCulpritCommit(d.culpritCommit);
      }
    } catch {
      /* API unreachable */
    }
  }

  async function handleFetchStreamSample(): Promise<void> {
    try {
      const res = await fetch('/api/nousgent/stream?frames=5');
      if (res.ok) {
        const txt = await res.text();
        setNdjsonLines(txt.trim().split('\n').filter(Boolean));
      }
    } catch {
      /* API unreachable */
    }
  }

  useEffect(() => {
    void handleFetchStreamSample();
    void handleRunBisect(initialTotal, Math.max(1, Math.floor(initialTotal / 2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bento-grid" style={{ alignItems: 'start' }}>
      <div className="col-6" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <NousgentCbrainMaskStage
          activeLobes={['working', 'procedural', 'semantic', 'episodic', 'alignment']}
          activeNuclei={['trn', 'md', 'massa']}
          oscillationBand="4D fMRI · 2,048 KC (60 FPS)"
          firingKenyonCells={64}
          pulseRevision={pulseRevision}
          compact
        />

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className="mono-xs text-jade">IA.NOUSGENT.AI // LIVE STREAMABLE HTTP NDJSON</span>
            <button
              type="button"
              className="btn-spatial btn-glass"
              onClick={() => {
                setPulseRevision((r) => r + 1);
                void handleFetchStreamSample();
              }}
            >
              Sample Live M2M Wire
            </button>
          </div>
          <pre
            className="mono-xs text-pistachio"
            style={{
              margin: 0,
              background: 'var(--color-void)',
              padding: '0.7rem',
              borderRadius: '8px',
              overflowX: 'auto',
              border: '1px solid var(--color-outline)'
            }}
          >
            {ndjsonLines.length > 0 ? ndjsonLines.join('\n') : 'Fetching live /api/nousgent/stream frames...'}
          </pre>
        </div>
      </div>

      <section className="glass-card col-6" aria-label="O(log N) Git Bisect vs 1968 Bowman Screwdriver">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700 }}>O(log N) Git Bisect vs. 1968 Screwdriver</h1>
            <span className="pill-badge jade">
              {snapshot.dbrainGeneration > 0 ? `LIVE DBRAIN GEN #${snapshot.dbrainGeneration}` : '100% RETAINED COGNITION'}
            </span>
          </div>

          <p className="text-muted" style={{ margin: 0 }}>
            In 1968, Dave Bowman had to lobotomize HAL&apos;s entire mind to stop one bad directive. Across{' '}
            <code>dbrain.to</code>&apos;s live Generation #{totalGens.toLocaleString()}, <code>dbrain bisect</code> isolates any faulty capsule in{' '}
            <code>O(log N)</code> Merkle probes while retaining 100% of verified cognition.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.75rem' }}>
            <div>
              <label htmlFor="total-gens-input" className="mono-xs text-muted">TOTAL GENERATIONS (N)</label>
              <input
                id="total-gens-input"
                type="number"
                className="spatial-input"
                style={{ marginTop: '0.3rem' }}
                min={8}
                max={1048576}
                value={totalGens}
                onChange={(e) => setTotalGens(Number(e.target.value) || 64)}
              />
            </div>
            <div>
              <label htmlFor="culprit-gen-input" className="mono-xs text-muted">CULPRIT GENERATION</label>
              <input
                id="culprit-gen-input"
                type="number"
                className="spatial-input"
                style={{ marginTop: '0.3rem' }}
                min={1}
                max={totalGens}
                value={culpritGen}
                onChange={(e) => setCulpritGen(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-spatial btn-pistachio"
            onClick={() => {
              playQuindarBeep(2525);
              setPulseRevision((r) => r + 1);
              void handleRunBisect();
            }}
          >
            Run O(log N) Surgical Bisect ({latencyMs}ms)
          </button>

          <div className="mono-xs text-bronze">
            ISOLATED COMMIT: <strong className="text-pistachio">{culpritCommit || '—'}</strong> ({probes.length} Merkle Probes)
          </div>

          <div style={{ maxHeight: '250px', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--color-outline)' }}>
            {probes.map((p) => (
              <div
                key={p.step}
                className="mono-xs"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.75rem',
                  borderBottom: '1px solid var(--color-outline)',
                  background: 'var(--color-surface)'
                }}
              >
                <span>STEP #{String(p.step).padStart(2, '0')} · GEN #{p.generationProbed}</span>
                <span className={p.canaryVerdict === 'CLEAN_MERKLE_ROOT' ? 'text-pistachio' : 'text-rose'}>
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
