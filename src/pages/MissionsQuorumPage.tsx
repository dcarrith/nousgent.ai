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
    <div className="grid-12">
      <section className="spec-cell col-6" aria-label="Co-Op Bounded ASI Major Orders">
        <div className="spec-cell-header">
          <span className="spec-label">CO-OP BOUNDED ASI MAJOR ORDERS</span>
          <span className="spec-mono text-emerald">DAO_ESCROW + DAO_COUNCIL</span>
        </div>
        <div className="spec-cell-body">
          <p className="text-muted" style={{ margin: 0 }}>
            Every recursive capability leap is staged inside an on-chain <code>chia-dao-v1</code> escrow and paused at Ring-0 (<code>-32044</code>) until Citizen Keyholders verify 0.00% catastrophic forgetting and co-sign the <code>CHIP-0043</code> quorum.
          </p>

          {snapshot.missions.map((m, idx) => {
            const active = idx === selectedIndex;
            return (
              <div
                key={m.missionId}
                className={`metric-tile${active ? ' metric-tile-emerald' : ''}`}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="spec-mono" style={{ fontWeight: 700 }}>{m.missionId} // {m.title}</span>
                  <span className="spec-mono text-emerald">{m.rewardDig} $DIG</span>
                </div>
                <div className="text-muted" style={{ fontSize: '13px' }}>{m.summary}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="spec-mono text-cobalt">
                    PROGRESS: {m.progressPct}% · QUORUM: {m.quorumSignatures}/{m.quorumTarget}
                  </span>
                  <button
                    type="button"
                    className={`btn-spec ${active ? 'btn-cobalt' : 'btn-outline'}`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    {active ? 'SELECTED IN CEREMONY BAY' : 'SELECT MISSION'}
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
        colClass="col-6"
        onSigned={onRefresh}
      />
    </div>
  );
}
