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

  return (
    <div className="grid-12" style={{ alignItems: 'start' }}>
      <section className="chamfer-plate col-6" aria-label="Active Co-Op Raid Contracts">
        <div className="arena-header-strip">
          <div>
            <span className="hud-ticker text-volt">04 // COLLABORATIVE OBJECTIVES</span>
            <h1 className="hud-headline">ACTIVE RAID CONTRACTS (DAO_ESCROW)</h1>
          </div>
          <span className="hud-mono text-cyan">400,000 $DIG POOL</span>
        </div>

        <p className="text-muted" style={{ margin: 0 }}>
          Every recursive capability upgrade is locked in an on-chain <code>chia-dao-v1</code> contract and halted at Ring-0 (<code>-32044</code>) until Allied Keyholders verify 0.00% catastrophic forgetting and co-sign the <code>CHIP-0043</code> quorum.
        </p>

        {snapshot.missions.map((m, idx) => {
          const active = idx === selectedIndex;
          return (
            <div
              key={m.missionId}
              className="chamfer-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                borderColor: active ? 'var(--color-volt)' : 'var(--color-outline)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="hud-mono" style={{ fontWeight: 700 }}>{m.missionId} // {m.title}</span>
                <span className="hud-mono text-volt">{m.rewardDig} $DIG</span>
              </div>
              <progress className="hud-progress" max={100} value={m.progressPct} aria-label={m.title} />
              <div className="text-muted" style={{ fontSize: '13px' }}>{m.summary}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="hud-mono text-cyan" style={{ fontSize: '11px' }}>
                  PROGRESS: {m.progressPct}% · QUORUM: {m.quorumSignatures}/{m.quorumTarget}
                </span>
                <button
                  type="button"
                  className={`btn-hud ${active ? 'btn-volt' : 'btn-ghost'}`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  {active ? '✓ LOADED IN KEY BAY' : 'LOAD CONTRACT'}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <TwoKeyClearSignCell
        key={activeMission.missionId}
        mission={activeMission}
        colClass="col-6"
        onSigned={onRefresh}
      />
    </div>
  );
}
