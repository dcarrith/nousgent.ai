import { useState } from 'react';
import { TwoKeyClearSignCell } from '../components/TwoKeyClearSignCell';
import { MissionSnapshot } from '../hooks/useNousgentMission';

export interface MissionsQuorumPageProps {
  readonly snapshot: MissionSnapshot;
  readonly onRefresh: () => void;
}

export function MissionsQuorumPage({ snapshot, onRefresh }: Readonly<MissionsQuorumPageProps>) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const activeMission = snapshot.missions[selectedIndex] || snapshot.missions[0];

  if (!activeMission) {
    return (
      <div className="glass-card mono-xs text-muted">
        {snapshot.loading ? 'Syncing live CHIP-0043 missions from nousgent.ai SQLite WAL...' : 'No active missions loaded.'}
      </div>
    );
  }

  return (
    <div className="bento-grid" style={{ alignItems: 'start' }}>
      <section className="glass-card col-7" aria-label="Co-Op Bounded ASI Major Orders">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Swarm Clear-Sign Major Orders</h1>
            <span className="pill-badge cyan">DAO_ESCROW · 400,000 $DIG</span>
          </div>

          <p className="text-muted" style={{ margin: 0 }}>
            Every recursive capability upgrade is staged inside an on-chain <code>chia-dao-v1</code> escrow and paused at Ring-0 (<code>-32044</code>) until Citizen Keyholders verify 0.00% catastrophic forgetting and co-sign the <code>CHIP-0043</code> FIDO2 quorum.
          </p>

          {snapshot.missions.map((m, idx) => {
            const active = idx === selectedIndex;
            return (
              <div
                key={m.missionId}
                className="glass-well"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  borderColor: active ? 'rgb(126 217 87 / 0.55)' : 'var(--color-outline)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{m.missionId} // {m.title}</span>
                  <span className="mono-xs text-emerald" style={{ fontWeight: 700 }}>{m.rewardDig} $DIG</span>
                </div>
                <progress className="monolith-progress violet" max={100} value={m.progressPct} aria-label={m.title} />
                <div className="text-muted" style={{ fontSize: '13px' }}>{m.summary}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="mono-xs text-cyan">
                    PROGRESS: {m.progressPct}% · QUORUM: {m.quorumSignatures}/{m.quorumTarget}
                  </span>
                  <button
                    type="button"
                    className={`btn-spatial ${active ? 'btn-violet' : 'btn-glass'}`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    {active ? '✓ Loaded in Ceremony' : 'Select Mission'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <TwoKeyClearSignCell
        key={activeMission.missionId}
        mission={activeMission}
        colClass="col-5"
        onSigned={onRefresh}
      />
    </div>
  );
}
