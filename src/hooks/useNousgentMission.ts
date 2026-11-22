import { useCallback, useEffect, useState } from 'react';
import { FALLBACK_ORGANS, OrganBusItem, StateHubItem, SwarmMissionItem } from '../data/mockData';

export interface MissionSnapshot {
  readonly bariScorePct: number;
  readonly baselineDeltaPct: number;
  readonly catastrophicForgettingPct: number;
  readonly swarmConsensusPct: number;
  readonly enlistedNodesCount: number;
  readonly megawattsSaved: number;
  readonly gallonsWaterSaved: number;
  readonly petabytesCommitted: number;
  readonly humanRequests: number;
  readonly m2mRequests: number;
  readonly m2mSharePct: number;
  readonly verifiedDataLayerRoot: string;
  readonly organs: readonly OrganBusItem[];
  readonly stateHubs: readonly StateHubItem[];
  readonly missions: readonly SwarmMissionItem[];
}

const INITIAL_SNAPSHOT: MissionSnapshot = {
  bariScorePct: 84.7,
  baselineDeltaPct: 2.4,
  catastrophicForgettingPct: 0.0,
  swarmConsensusPct: 91.2,
  enlistedNodesCount: 4108,
  megawattsSaved: 84.6,
  gallonsWaterSaved: 1240500,
  petabytesCommitted: 148.9,
  humanRequests: 1420,
  m2mRequests: 14780,
  m2mSharePct: 91.2,
  verifiedDataLayerRoot: '0x8F4A9C2E7B104D66A19E0043D5B811C09E2177FA34C08B12D4E67A9012FE0043',
  organs: FALLBACK_ORGANS,
  stateHubs: [
    { stateCode: 'IL', hubName: 'URBANA', subtitle: 'Birthplace Core', rigsCount: 1420, storagePb: 38.4, mapX: 185, mapY: 65 },
    { stateCode: 'TX', hubName: 'ERCOT', subtitle: 'Sovereign Grid', rigsCount: 984, storagePb: 29.1, mapX: 155, mapY: 105 },
    { stateCode: 'WY', hubName: 'VAULT', subtitle: 'DUNA Sanctuary', rigsCount: 712, storagePb: 24.8, mapX: 105, mapY: 55 },
    { stateCode: 'CA', hubName: 'BAY', subtitle: 'Silicon Canopy', rigsCount: 540, storagePb: 18.2, mapX: 45, mapY: 85 },
    { stateCode: 'OH', hubName: 'CLE', subtitle: 'Great Lakes Mesh', rigsCount: 452, storagePb: 12.6, mapX: 225, mapY: 62 }
  ],
  missions: [
    {
      missionId: 'NGT-ORDER-01',
      title: 'OPERATION CHIALISP & RUE FORMAL MASTERY',
      summary: 'Verify 5,000 deterministic chia-dao-v1 CAT2 & Singleton spends across citizen 8B SLMs.',
      progressPct: 82.4,
      rewardDig: '50000.000',
      quorumSignatures: 289,
      quorumTarget: 300,
      quorumPct: 96.3,
      status: 'AWAITING_CHIP0043_QUORUM',
      clearSignUr: 'ur:chia-clear-sign/v1/8f4a9c2e7b104d66a19e0043'
    },
    {
      missionId: 'NGT-ORDER-02',
      title: '1,000 FLY-LSH POLYMORPHIC ANTIBODIES',
      summary: 'Crowd-curate pre-thalamic Cranial Nerve I odor antibodies with 0.00% false positives.',
      progressPct: 64.0,
      rewardDig: '100000.000',
      quorumSignatures: 214,
      quorumTarget: 300,
      quorumPct: 71.3,
      status: 'ACTIVE_SWARM_HARVEST',
      clearSignUr: 'ur:chia-clear-sign/v1/3c91a4f022d7e8119b54cc02'
    },
    {
      missionId: 'NGT-ORDER-03',
      title: 'SWE-CONTEXTBENCH 99% COLLECTIVE RIGOR',
      summary: 'Distill verified multi-repo bug fixes via Sleep-Time Dreaming into durable .dig capsules.',
      progressPct: 91.2,
      rewardDig: '250000.000',
      quorumSignatures: 296,
      quorumTarget: 300,
      quorumPct: 98.7,
      status: 'AWAITING_CHIP0043_QUORUM',
      clearSignUr: 'ur:chia-clear-sign/v1/71e09ba45c83d210f44a8901'
    }
  ]
};

export function playQuindarBeep(frequencyHz = 2525): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequencyHz;
    gain.gain.value = 0.035;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    /* ignore audio autoplay blocks */
  }
}

export function useNousgentMission() {
  const [snapshot, setSnapshot] = useState<MissionSnapshot>(INITIAL_SNAPSHOT);
  const [hostPlane, setHostPlane] = useState<'human_ui' | 'm2m_ia'>(() => {
    if (typeof window !== 'undefined' && window.location.hostname.startsWith('ia.')) {
      return 'm2m_ia';
    }
    return 'human_ui';
  });

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/nousgent/status');
      if (!res.ok) return;
      const d = await res.json();
      setSnapshot({
        bariScorePct: d.bari.bariScorePct,
        baselineDeltaPct: d.bari.baselineDeltaPct,
        catastrophicForgettingPct: d.bari.catastrophicForgettingPct,
        swarmConsensusPct: d.bari.swarmConsensusPct,
        enlistedNodesCount: d.bari.enlistedNodesCount,
        megawattsSaved: d.bari.greenSavings.megawattsSavedVsHyperscalers,
        gallonsWaterSaved: d.bari.greenSavings.gallonsWaterSavedWeekly,
        petabytesCommitted: d.bari.greenSavings.petabytesChiaPostCommitted,
        humanRequests: d.planes.humanRequests,
        m2mRequests: d.planes.m2mRequests,
        m2mSharePct: d.planes.m2mSharePct,
        verifiedDataLayerRoot: d.leaderboard.verifiedDataLayerRoot,
        organs: d.bari.organs,
        stateHubs: d.leaderboard.stateHubs,
        missions: d.missions
      });
    } catch {
      /* offline static dApp fallback */
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  return {
    snapshot,
    hostPlane,
    setHostPlane,
    refreshStatus
  };
}
