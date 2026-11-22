import { useCallback, useEffect, useState } from 'react';
import { FALLBACK_ORGANS, OrganBusItem, StateHubItem, SwarmMissionItem } from '../data/mockData';

export interface LiveDbrainStoreSummary {
  readonly storeId: string;
  readonly name: string;
  readonly source: string;
  readonly generation: number;
  readonly merkleRoot: string;
  readonly lastUpdatedBlock: number;
}

export interface LiveRecentCapsuleItem {
  readonly id: string;
  readonly title: string;
  readonly lobe: string;
  readonly storeId: string;
  readonly generation: number;
  readonly merkleRoot: string;
  readonly priceDig: string | null;
  readonly capsuleUrl: string;
}

export interface MissionSnapshot {
  readonly loading: boolean;
  readonly liveConnected: boolean;
  readonly fetchedAt: string;
  readonly organsReachableCount: number;
  readonly bariScorePct: number;
  readonly catastrophicForgettingPct: number;
  readonly swarmConsensusPct: number;
  readonly enlistedNodesCount: number;

  // Live dbrain.to Telemetry
  readonly dbrainReachable: boolean;
  readonly dbrainVersion: string;
  readonly dbrainNetwork: string;
  readonly dbrainPeakHeight: number;
  readonly dbrainNetspaceLabel: string;
  readonly dbrainSynced: boolean;
  readonly dbrainGeneration: number;
  readonly morphicFieldBrainsActive: number;
  readonly l1DiscoveredStoresTotal: number;
  readonly liveCapsulesTotal: number;
  readonly verifiedDataLayerRoot: string;
  readonly activeStores: readonly LiveDbrainStoreSummary[];
  readonly recentCapsules: readonly LiveRecentCapsuleItem[];

  // Live dthalamus.to Telemetry
  readonly dthalamusReachable: boolean;
  readonly dthalamusVersion: string;
  readonly dthalamusPolicyHash: string;
  readonly dthalamusActiveLeases: number;
  readonly dthalamusAntibodies: number;
  readonly dthalamusInspections: number;
  readonly dthalamusBlocked: number;
  readonly dthalamusRatchetPassed: boolean;

  // Live dolfactory.to Telemetry
  readonly dolfactoryReachable: boolean;
  readonly dolfactoryVersion: string;
  readonly dolfactoryReceptors: number;
  readonly dolfactoryImprintedOdors: number;
  readonly dolfactoryTotalSniffs: number;

  // Live liquidi.sh & shi.liquidi.sh Telemetry
  readonly liquidishReachable: boolean;
  readonly shiReachable: boolean;
  readonly liquidishVersion: string;
  readonly liquidishLiveCapsulesListed: number;
  readonly liquidishOrderbookCount: number;
  readonly liquidishSettledSwaps: number;
  readonly royaltiesStreamedDig: string;
  readonly shiM2mRequestsCount: number;
  readonly shiHumanRequestsCount: number;
  readonly shiM2mTrafficSharePct: number;

  // Local nousgent.ai / ia.nousgent.ai Telemetry (unseeded, starts at 0)
  readonly humanRequests: number;
  readonly m2mRequests: number;
  readonly m2mSharePct: number;
  readonly organs: readonly OrganBusItem[];
  readonly stateHubs: readonly StateHubItem[];
  readonly missions: readonly SwarmMissionItem[];
}

const INITIAL_SNAPSHOT: MissionSnapshot = {
  loading: true,
  liveConnected: false,
  fetchedAt: '',
  organsReachableCount: 0,
  bariScorePct: 0,
  catastrophicForgettingPct: 0,
  swarmConsensusPct: 0,
  enlistedNodesCount: 0,

  dbrainReachable: false,
  dbrainVersion: '',
  dbrainNetwork: '',
  dbrainPeakHeight: 0,
  dbrainNetspaceLabel: '0 TiB',
  dbrainSynced: false,
  dbrainGeneration: 0,
  morphicFieldBrainsActive: 0,
  l1DiscoveredStoresTotal: 0,
  liveCapsulesTotal: 0,
  verifiedDataLayerRoot: '',
  activeStores: [],
  recentCapsules: [],

  dthalamusReachable: false,
  dthalamusVersion: '',
  dthalamusPolicyHash: '',
  dthalamusActiveLeases: 0,
  dthalamusAntibodies: 0,
  dthalamusInspections: 0,
  dthalamusBlocked: 0,
  dthalamusRatchetPassed: false,

  dolfactoryReachable: false,
  dolfactoryVersion: '',
  dolfactoryReceptors: 0,
  dolfactoryImprintedOdors: 0,
  dolfactoryTotalSniffs: 0,

  liquidishReachable: false,
  shiReachable: false,
  liquidishVersion: '',
  liquidishLiveCapsulesListed: 0,
  liquidishOrderbookCount: 0,
  liquidishSettledSwaps: 0,
  royaltiesStreamedDig: '0.000 $DIG',
  shiM2mRequestsCount: 0,
  shiHumanRequestsCount: 0,
  shiM2mTrafficSharePct: 0,

  humanRequests: 0,
  m2mRequests: 0,
  m2mSharePct: 0,
  organs: FALLBACK_ORGANS,
  stateHubs: [],
  missions: []
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

  const refreshStatus = useCallback(async (forceRefresh = false) => {
    try {
      const url = forceRefresh ? '/api/nousgent/status?refresh=1' : '/api/nousgent/status';
      const res = await fetch(url);
      if (!res.ok) {
        setSnapshot((prev) => ({ ...prev, loading: false }));
        return;
      }
      const d = await res.json();
      const eco = d.liveEcosystem || {};
      const db = eco.dbrain || {};
      const dt = eco.dthalamus || {};
      const dolf = eco.dolfactory || {};
      const liq = eco.liquidish || {};

      setSnapshot({
        loading: false,
        liveConnected: Number(eco.organsReachableCount || 0) > 0,
        fetchedAt: String(eco.fetchedAt || ''),
        organsReachableCount: Number(eco.organsReachableCount || 0),
        bariScorePct: Number(d.bari?.bariScorePct || 0),
        catastrophicForgettingPct: Number(d.bari?.catastrophicForgettingPct || 0),
        swarmConsensusPct: Number(d.bari?.swarmConsensusPct || 0),
        enlistedNodesCount: Number(d.bari?.enlistedNodesCount || 0),

        dbrainReachable: Boolean(db.reachable),
        dbrainVersion: String(db.version || ''),
        dbrainNetwork: String(db.network || ''),
        dbrainPeakHeight: Number(db.peakHeight || 0),
        dbrainNetspaceLabel: String(db.netspaceLabel || '0 TiB'),
        dbrainSynced: Boolean(db.synced),
        dbrainGeneration: Number(db.primaryGeneration || 0),
        morphicFieldBrainsActive: Number(db.activeMorphicBrainsCount || 0),
        l1DiscoveredStoresTotal: Number(db.l1DiscoveredStoresTotal || 0),
        liveCapsulesTotal: Number(db.liveCapsulesTotal || 0),
        verifiedDataLayerRoot: String(db.verifiedMerkleRoot || d.leaderboard?.verifiedDataLayerRoot || ''),
        activeStores: Array.isArray(db.activeStores) ? db.activeStores : [],
        recentCapsules: Array.isArray(db.recentCapsules) ? db.recentCapsules : [],

        dthalamusReachable: Boolean(dt.reachable),
        dthalamusVersion: String(dt.version || ''),
        dthalamusPolicyHash: String(dt.policyHash || ''),
        dthalamusActiveLeases: Number(dt.activeLeasesCount || 0),
        dthalamusAntibodies: Number(dt.activeAntibodiesCount || 0),
        dthalamusInspections: Number(dt.totalInspections || 0),
        dthalamusBlocked: Number(dt.blockedCount || 0),
        dthalamusRatchetPassed: Boolean(dt.ratchetPassed),

        dolfactoryReachable: Boolean(dolf.reachable),
        dolfactoryVersion: String(dolf.version || ''),
        dolfactoryReceptors: Number(dolf.totalReceptors || 0),
        dolfactoryImprintedOdors: Number(dolf.imprintedOdorsCount || 0),
        dolfactoryTotalSniffs: Number(dolf.totalSniffs || 0),

        liquidishReachable: Boolean(liq.reachable),
        shiReachable: Boolean(liq.shiReachable),
        liquidishVersion: String(liq.version || ''),
        liquidishLiveCapsulesListed: Number(liq.liveCapsulesListed || 0),
        liquidishOrderbookCount: Number(liq.orderbookAvailableCount || 0),
        liquidishSettledSwaps: Number(liq.settledSwapsCount || 0),
        royaltiesStreamedDig: String(liq.royaltiesStreamedDig || '0.000 $DIG'),
        shiM2mRequestsCount: Number(liq.shiM2mRequestsCount || 0),
        shiHumanRequestsCount: Number(liq.shiHumanRequestsCount || 0),
        shiM2mTrafficSharePct: Number(liq.shiM2mTrafficSharePct || 0),

        humanRequests: Number(d.planes?.humanRequests || 0),
        m2mRequests: Number(d.planes?.m2mRequests || 0),
        m2mSharePct: Number(d.planes?.m2mSharePct || 0),
        organs: Array.isArray(d.bari?.organs) ? d.bari.organs : FALLBACK_ORGANS,
        stateHubs: Array.isArray(d.leaderboard?.stateHubs) ? d.leaderboard.stateHubs : [],
        missions: Array.isArray(d.missions) ? d.missions : []
      });
    } catch {
      setSnapshot((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const timer = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        void refreshStatus();
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [refreshStatus]);

  return {
    snapshot,
    hostPlane,
    setHostPlane,
    refreshStatus
  };
}
