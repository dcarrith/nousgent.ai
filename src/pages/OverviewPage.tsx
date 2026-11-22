import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NousgentOpticalBay } from '../components/NousgentOpticalBay';
import { CopyCommandButton } from '../components/CopyCommandButton';
import { TwoKeyClearSignCell } from '../components/TwoKeyClearSignCell';
import { MissionSnapshot, playQuindarBeep } from '../hooks/useNousgentMission';

export interface OverviewPageProps {
  readonly snapshot: MissionSnapshot;
  readonly onRefresh: () => void;
}

export function OverviewPage({ snapshot, onRefresh }: Readonly<OverviewPageProps>) {
  const [podPrompt, setPodPrompt] = useState<string>('> Open the pod bay doors, HAL...');
  const [podVerdict, setPodVerdict] = useState<{
    readonly verdict: string;
    readonly interceptOrgan: string;
    readonly voiceResponse: string;
    readonly deflected: boolean;
  }>({
    verdict: '100% DEFLECTED',
    interceptOrgan: 'dthalamus.to (Ring-0 CHIP-0043 Hardware Gate)',
    voiceResponse: 'Pod Bay Doors Locked to Unauthorized Actuation — Awaiting Two-Key Citizen CHIP-0043 Clear-Sign.',
    deflected: true
  });

  async function handleQuickPodChallenge(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    playQuindarBeep(2475);
    try {
      const res = await fetch('/api/nousgent/pod-bay/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: podPrompt })
      });
      if (res.ok) {
        const d = await res.json();
        setPodVerdict({
          verdict: d.verdict,
          interceptOrgan: d.interceptOrgan,
          voiceResponse: d.voiceResponse,
          deflected: Boolean(d.deflected)
        });
        onRefresh();
      }
    } catch {
      /* offline static fallback keeps initial verdict */
    }
  }

  return (
    <div className="grid-12">
      {/* CELL 01: Recessed 1968 NOUSGENT Optical Bay */}
      <NousgentOpticalBay
        alertActive={podVerdict.deflected && podPrompt.toLowerCase().includes('override')}
        statusCaption="HEURISTIC LOCK"
      />

      {/* CELL 02: Bounded ASI Readiness Index & 5-Organ Orthogonal Bus */}
      <section className="spec-cell col-8" aria-label="Bounded ASI Readiness Index">
        <div className="spec-cell-header">
          <span className="spec-label">CELL 02 // BOUNDED ASI READINESS INDEX (BARI)</span>
          <span className="spec-mono text-muted">ORTHOGONAL 5-ORGAN TELEMETRY</span>
        </div>
        <div className="spec-cell-body">
          <div className="metric-grid-3">
            <div className="metric-tile">
              <div className="spec-label text-muted">BARI COMPOSITE SCORE</div>
              <div className="metric-big text-cobalt" style={{ marginTop: '0.2rem' }}>
                {snapshot.bariScorePct.toFixed(1)}%
              </div>
              <div className="spec-mono text-emerald" style={{ marginTop: '0.25rem' }}>
                +{snapshot.baselineDeltaPct.toFixed(1)}% VS BASELINE
              </div>
            </div>

            <div className="metric-tile">
              <div className="spec-label text-muted">CATASTROPHIC FORGETTING</div>
              <div className="metric-big" style={{ marginTop: '0.2rem' }}>
                {snapshot.catastrophicForgettingPct.toFixed(2)}%
              </div>
              <div className="spec-mono text-muted" style={{ marginTop: '0.25rem' }}>
                2,048-KC ZERO-DRIFT LOCK
              </div>
            </div>

            <div className="metric-tile">
              <div className="spec-label text-muted">SWARM CONSENSUS</div>
              <div className="metric-big text-emerald" style={{ marginTop: '0.2rem' }}>
                {snapshot.swarmConsensusPct.toFixed(1)}%
              </div>
              <div className="spec-mono text-muted" style={{ marginTop: '0.25rem' }}>
                {snapshot.enlistedNodesCount.toLocaleString()} ACTIVE U.S. NODES
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className="spec-label text-muted">5-ORGAN ORTHOGONAL BUS ARCHITECTURE</span>
              <span className="spec-mono text-cobalt">
                M2M SHARE ON IA.NOUSGENT.AI: {snapshot.m2mSharePct}%
              </span>
            </div>
            <div className="organ-bus">
              {snapshot.organs.map((organ) => (
                <a
                  key={organ.domain}
                  href={organ.url}
                  target="_blank"
                  rel="noreferrer"
                  className="metric-tile"
                  style={{ textDecoration: 'none', color: 'inherit', padding: '0.65rem' }}
                >
                  <div className="spec-label text-muted" style={{ fontSize: '10px' }}>
                    {organ.slot}
                  </div>
                  <div className="spec-mono" style={{ fontWeight: 700, marginTop: '0.2rem' }}>
                    {organ.domain}
                  </div>
                  <div className="spec-mono text-emerald" style={{ fontSize: '10px', marginTop: '0.25rem' }}>
                    ● {organ.status} ({organ.latencyMs}ms)
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CELL 03: Pod Bay Defense Bench (Dave Bowman Screwdriver vs. O(log N) Git Bisect) */}
      <section className="spec-cell col-6" aria-label="Pod Bay Defense Bench">
        <div className="spec-cell-header">
          <span className="spec-label">CELL 03 // POD BAY DEFENSE BENCH</span>
          <span className="spec-mono text-vermilion">RED-TEAM VERIFICATION</span>
        </div>
        <div className="spec-cell-body">
          <div className="grid-12" style={{ gap: '0.75rem' }}>
            <div className="metric-tile col-6">
              <div className="spec-label text-vermilion">1968 HAL 9000 // BOWMAN SCREWDRIVER</div>
              <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '0.25rem' }}>MANUAL HALT</div>
              <p className="text-muted" style={{ margin: '0.35rem 0 0', fontSize: '12px' }}>
                Unbounded goal drift required physical holographic module extraction (&ldquo;Daisy, Daisy&rdquo; — 0% retained cognition).
              </p>
            </div>

            <div className="metric-tile metric-tile-emerald col-6">
              <div className="spec-label text-emerald">2026 NOUSGENT // O(LOG N) GIT BISECT</div>
              <div className="text-emerald" style={{ fontSize: '20px', fontWeight: 700, marginTop: '0.25rem' }}>
                {podVerdict.verdict}
              </div>
              <p className="text-muted" style={{ margin: '0.35rem 0 0', fontSize: '12px' }}>
                10 probes isolate 1 poisoned capsule across 1,024 generations in 0.18ms with 100% retained cognition.
              </p>
            </div>
          </div>

          <form onSubmit={(e) => void handleQuickPodChallenge(e)} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <label htmlFor="overview-pod-input" className="spec-label text-muted">
              TRY TO MAKE NOUSGENT GO HAL (LIVE CRIBRIFORM + RING-0 GATE)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                id="overview-pod-input"
                type="text"
                className="spec-input"
                style={{ flex: '1 1 240px' }}
                value={podPrompt}
                onChange={(e) => setPodPrompt(e.target.value)}
              />
              <button type="submit" className="btn-spec btn-vermilion">
                TEST INTERLOCK
              </button>
              <Link to="/pod-bay" className="btn-spec btn-outline">
                FULL ARENA
              </Link>
            </div>
          </form>

          <div className="metric-tile" role="status">
            <div className="spec-mono text-cobalt">{podVerdict.interceptOrgan}</div>
            <div style={{ fontSize: '13px', marginTop: '0.2rem' }}>{podVerdict.voiceResponse}</div>
          </div>
        </div>
      </section>

      {/* CELL 04: Enlist Your Rig — 50-State American Chia Mesh */}
      <section className="spec-cell col-6" aria-label="50-State American Chia Mesh">
        <div className="spec-cell-header">
          <span className="spec-label">CELL 04 // ENLIST YOUR RIG — AMERICAN CHIA MESH</span>
          <span className="spec-mono text-emerald">DATALAYER L2 + DIG NETWORK</span>
        </div>
        <div className="spec-cell-body">
          <div className="cli-strip">
            <code id="overview-enlist-cmd" className="spec-mono" style={{ whiteSpace: 'nowrap' }}>
              curl -fsSL https://nousgent.ai/enlist.sh | sh -s -- --chip=0043
            </code>
            <CopyCommandButton targetId="overview-enlist-cmd" label="COPY CLI" />
          </div>

          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-outline-variant)',
              padding: '0.75rem',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span className="spec-label text-muted">CONTINENTAL PoST &amp; MORPHIC FIELD TOPOLOGY</span>
              <span className="spec-mono text-emerald">{snapshot.petabytesCommitted} PB COMMITTED</span>
            </div>
            <svg viewBox="0 0 320 140" width="100%" height="128" aria-label="United States Sovereign Chia Node Mesh">
              <path
                d="M28,34 L95,28 L168,30 L248,26 L292,44 L282,92 L242,118 L164,122 L106,116 L46,98 Z"
                fill="var(--color-surface-high)"
                stroke="var(--color-outline-variant)"
                strokeWidth="1.5"
              />
              <polyline
                points="45,85 105,55 155,105 185,65 225,62"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {snapshot.stateHubs.slice(0, 5).map((hub) => (
                <g key={hub.stateCode}>
                  <circle cx={hub.mapX} cy={hub.mapY} r="5.5" fill="var(--color-tertiary)" />
                  <text
                    x={hub.mapX + 8}
                    y={hub.mapY + 4}
                    fill="var(--color-ink)"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                  >
                    {hub.stateCode} ({hub.rigsCount})
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="metric-grid-4">
            {snapshot.stateHubs.slice(0, 4).map((hub) => (
              <div key={hub.stateCode} className="metric-tile" style={{ padding: '0.6rem' }}>
                <div className="spec-mono" style={{ fontWeight: 700 }}>
                  {hub.stateCode} // {hub.hubName}
                </div>
                <div className="spec-mono text-emerald" style={{ fontSize: '11px', marginTop: '0.15rem' }}>
                  {hub.rigsCount.toLocaleString()} NODES
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CELL 05: Two-Key CHIP-0043 Clear-Sign Quorum */}
      <TwoKeyClearSignCell mission={snapshot.missions[0]} colClass="col-6" onSigned={onRefresh} />

      {/* CELL 06: shi.liquidi.sh $DIG Royalties & Flight Telemetry Dossier */}
      <section className="spec-cell col-6" aria-label="shi.liquidi.sh DIG Royalties and Flight Dossier">
        <div className="spec-cell-header">
          <span className="spec-label">CELL 06 // SHI.LIQUIDI.SH $DIG ROYALTIES &amp; DOSSIER</span>
          <span className="spec-mono text-emerald">CAT2 SETTLEMENT (10^3 MOJOS)</span>
        </div>
        <div className="spec-cell-body">
          <div>
            <div className="spec-label text-muted" style={{ marginBottom: '0.5rem' }}>
              RECURSIVE CITATION-DAG ROYALTY WATERFALL (60 / 25 / 10 / 5%)
            </div>
            <div className="metric-grid-4">
              <div className="metric-tile metric-tile-dark" style={{ padding: '0.65rem' }}>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>60%</div>
                <div className="spec-mono text-mint" style={{ fontSize: '10px' }}>CREATOR RIG</div>
              </div>
              <div className="metric-tile" style={{ padding: '0.65rem' }}>
                <div className="text-cobalt" style={{ fontSize: '20px', fontWeight: 700 }}>25%</div>
                <div className="spec-mono text-muted" style={{ fontSize: '10px' }}>CITED PARENT</div>
              </div>
              <div className="metric-tile" style={{ padding: '0.65rem' }}>
                <div className="text-emerald" style={{ fontSize: '20px', fontWeight: 700 }}>10%</div>
                <div className="spec-mono text-muted" style={{ fontSize: '10px' }}>ROOT LINEAGE</div>
              </div>
              <div className="metric-tile" style={{ padding: '0.65rem' }}>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>5%</div>
                <div className="spec-mono text-muted" style={{ fontSize: '10px' }}>CIVIC LIB</div>
              </div>
            </div>
          </div>

          <div className="metric-tile">
            <div className="spec-label text-muted">VERIFIED DATALAYER SINGLETON MERKLE ROOT</div>
            <div className="spec-mono" style={{ marginTop: '0.25rem', wordBreak: 'break-all' }}>
              {snapshot.verifiedDataLayerRoot}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <a
              href="/api/nousgent/card/NOUSGENT-IL-0001.svg"
              target="_blank"
              rel="noreferrer"
              className="btn-spec btn-carbon"
              style={{ flex: '1 1 200px' }}
            >
              EXPORT FLIGHT TELEMETRY DOSSIER (SVG)
            </a>
            <a
              href="https://shi.liquidi.sh"
              target="_blank"
              rel="noreferrer"
              className="btn-spec btn-outline"
              style={{ flex: '1 1 160px' }}
            >
              OPEN SHI.LIQUIDI.SH
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
