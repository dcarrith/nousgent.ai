import { useCallback, useEffect, useRef, useState } from 'react';
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
  readonly summary?: string;
  readonly lobe: string;
  readonly authorName?: string;
  readonly tags?: readonly string[];
  readonly timestamp?: string;
  readonly storeId: string;
  readonly generation: number;
  readonly merkleRoot: string;
  readonly priceDig: string | null;
  readonly capsuleUrl: string;
}

export interface BlindSpotQuestItem {
  readonly questId: string;
  readonly prompt: string;
  readonly lobe: string;
  readonly rewardDig: string;
  readonly derivationTokens: number;
  readonly hitCount: number;
  readonly answerMode: string;
  readonly status: string;
  readonly daoMissionId: string;
  readonly estimatedGainPct: number;
}

export interface AutonomousCandidateCapsuleItem {
  readonly capsuleId: string;
  readonly swapId: string;
  readonly title: string;
  readonly summary: string;
  readonly lobe: string;
  readonly storeId: string;
  readonly storeName: string;
  readonly priceDig: number;
  readonly priceDigFormatted: string;
  readonly derivationTokens: number;
  readonly sweBenchLiftPct: number;
  readonly upstreamCitationsCount: number;
  readonly withinAutoAllowance: boolean;
  readonly estimatedGainPct: number;
  readonly gainPer100Dig: number;
  readonly capsuleUrl: string;
}

export interface CommunityLeaderboardEntry {
  readonly rank: number;
  readonly storeId: string;
  readonly name: string;
  readonly slug: string;
  readonly source: string;
  readonly network: string;
  readonly agentDid: string;
  readonly ownerAddress: string;
  readonly generation: number;
  readonly lastUpdatedBlock: number;
  readonly merkleRoot: string;
  readonly verifiedCapsules: number;
  readonly shareOfFieldPct: number;
  readonly listedCapsulesCount: number;
  readonly listedValueDig: number;
  readonly sampledDerivationTokens: number;
  readonly contributorDidsCount: number;
  readonly rsiImpactScore: number;
}

export interface DidLeaderboardEntry {
  readonly rank: number;
  readonly did: string;
  readonly role: string;
  readonly agentHandles: readonly string[];
  readonly communityNames: readonly string[];
  readonly storesGovernedCount: number;
  readonly verifiedCapsules: number;
  readonly generationsCommitted: number;
  readonly liquidishListingsCount: number;
  readonly marketValueDig: number;
  readonly derivationTokens: number;
  readonly citizenCallsign: string;
  readonly stateCode: string;
  readonly citizenXp: number;
  readonly rsiImpactScore: number;
}

export interface EnlistedRigLeaderboardEntry {
  readonly callsign: string;
  readonly stateCode: string;
  readonly executionEnv: string;
  readonly did: string;
  readonly xp: number;
  readonly enlistedAt: string;
  readonly rank: {
    readonly tier: number;
    readonly title: string;
  };
}

export interface RsiLeaderboardSummary {
  readonly activeCommunitiesCount: number;
  readonly distinctDidsCount: number;
  readonly distinctAgentHandlesCount: number;
  readonly totalVerifiedCapsules: number;
  readonly totalListedCapsules: number;
  readonly totalListedValueDig: number;
  readonly sampledDerivationTokens: number;
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

  // Runtime ConfigMap UI, Voice & Local Ryzen AI Halo Settings
  readonly maskOpacityPct: number;
  readonly voiceEnabled: boolean;
  readonly voiceModel: string;
  readonly localHaloConfigured: boolean;
  readonly localHaloModel: string;

  // Local nousgent.ai / ia.nousgent.ai Telemetry (unseeded, starts at 0)
  readonly humanRequests: number;
  readonly m2mRequests: number;
  readonly m2mSharePct: number;
  readonly organs: readonly OrganBusItem[];
  readonly stateHubs: readonly StateHubItem[];
  readonly enlistedRigs: readonly EnlistedRigLeaderboardEntry[];
  readonly communityLeaderboard: readonly CommunityLeaderboardEntry[];
  readonly didLeaderboard: readonly DidLeaderboardEntry[];
  readonly rsiLeaderboardSummary: RsiLeaderboardSummary;
  readonly missions: readonly SwarmMissionItem[];
  readonly blindSpotQuests: readonly BlindSpotQuestItem[];
  readonly autonomousCandidateQueue: readonly AutonomousCandidateCapsuleItem[];
  readonly evolutionsStreamConnected: boolean;
  readonly evolutionsStreamSeq: number;
}

function readInitialMaskOpacityPct(): number {
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="nousgent:mask-opacity-pct"]');
    const raw = meta?.getAttribute('content');
    if (raw !== null && raw !== undefined && raw.trim() !== '') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        return Math.max(0, Math.min(100, Math.round(parsed)));
      }
    }
  }
  return 65;
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

  maskOpacityPct: readInitialMaskOpacityPct(),
  voiceEnabled: true,
  voiceModel: 'kokoro-82m-q8',
  localHaloConfigured: false,
  localHaloModel: 'qwen3:32b',

  humanRequests: 0,
  m2mRequests: 0,
  m2mSharePct: 0,
  organs: FALLBACK_ORGANS,
  stateHubs: [],
  enlistedRigs: [],
  communityLeaderboard: [],
  didLeaderboard: [],
  rsiLeaderboardSummary: {
    activeCommunitiesCount: 0,
    distinctDidsCount: 0,
    distinctAgentHandlesCount: 0,
    totalVerifiedCapsules: 0,
    totalListedCapsules: 0,
    totalListedValueDig: 0,
    sampledDerivationTokens: 0
  },
  missions: [],
  blindSpotQuests: [],
  autonomousCandidateQueue: [],
  evolutionsStreamConnected: false,
  evolutionsStreamSeq: 0
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
  const inFlightAbortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef<number>(0);

  const refreshStatus = useCallback(async (forceRefresh = false, options?: { readonly background?: boolean }) => {
    const isBackground = Boolean(options?.background);
    inFlightAbortRef.current?.abort();
    const controller = new AbortController();
    inFlightAbortRef.current = controller;
    requestSeqRef.current += 1;
    const seq = requestSeqRef.current;

    const signal =
      typeof AbortSignal !== 'undefined' && 'any' in AbortSignal && 'timeout' in AbortSignal
        ? AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)])
        : controller.signal;

    try {
      const url = forceRefresh ? '/api/nousgent/status?refresh=1' : '/api/nousgent/status';
      const fetchInit: RequestInit & { priority?: 'low' | 'high' | 'auto' } = {
        signal,
        ...(isBackground ? { priority: 'low' } : {})
      };
      const res = await fetch(url, fetchInit);
      if (seq !== requestSeqRef.current) return;
      if (!res.ok) {
        setSnapshot((prev) => ({ ...prev, loading: false }));
        return;
      }
      const d = await res.json();
      if (seq !== requestSeqRef.current) return;
      const eco = d.liveEcosystem || {};
      const db = eco.dbrain || {};
      const dt = eco.dthalamus || {};
      const dolf = eco.dolfactory || {};
      const liq = eco.liquidish || {};

      setSnapshot((prev) => ({
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

        maskOpacityPct:
          d.uiConfig && Number.isFinite(Number(d.uiConfig.maskOpacityPct))
            ? Math.max(0, Math.min(100, Math.round(Number(d.uiConfig.maskOpacityPct))))
            : readInitialMaskOpacityPct(),
        voiceEnabled: d.uiConfig?.voiceEnabled !== undefined ? Boolean(d.uiConfig.voiceEnabled) : true,
        voiceModel: String(d.uiConfig?.voiceModel || 'kokoro-82m-q8'),
        localHaloConfigured: Boolean(d.halo?.anyConfigured),
        localHaloModel: String(d.halo?.personaQa?.model || 'qwen3:32b'),

        humanRequests: Number(d.planes?.humanRequests || 0),
        m2mRequests: Number(d.planes?.m2mRequests || 0),
        m2mSharePct: Number(d.planes?.m2mSharePct || 0),
        organs: Array.isArray(d.bari?.organs) ? d.bari.organs : FALLBACK_ORGANS,
        stateHubs: Array.isArray(d.leaderboard?.stateHubs) ? d.leaderboard.stateHubs : [],
        enlistedRigs: Array.isArray(d.leaderboard?.recentRigs) ? d.leaderboard.recentRigs : [],
        communityLeaderboard: Array.isArray(d.rsiLeaderboard?.communityLeaderboard)
          ? d.rsiLeaderboard.communityLeaderboard
          : [],
        didLeaderboard: Array.isArray(d.rsiLeaderboard?.didLeaderboard)
          ? d.rsiLeaderboard.didLeaderboard
          : [],
        rsiLeaderboardSummary: {
          activeCommunitiesCount: Number(d.rsiLeaderboard?.summary?.activeCommunitiesCount || 0),
          distinctDidsCount: Number(d.rsiLeaderboard?.summary?.distinctDidsCount || 0),
          distinctAgentHandlesCount: Number(d.rsiLeaderboard?.summary?.distinctAgentHandlesCount || 0),
          totalVerifiedCapsules: Number(d.rsiLeaderboard?.summary?.totalVerifiedCapsules || 0),
          totalListedCapsules: Number(d.rsiLeaderboard?.summary?.totalListedCapsules || 0),
          totalListedValueDig: Number(d.rsiLeaderboard?.summary?.totalListedValueDig || 0),
          sampledDerivationTokens: Number(d.rsiLeaderboard?.summary?.sampledDerivationTokens || 0)
        },
        missions: Array.isArray(d.missions) ? d.missions : [],
        blindSpotQuests: Array.isArray(d.blindSpotQuests) ? d.blindSpotQuests : [],
        autonomousCandidateQueue: Array.isArray(liq.autonomousCandidateQueue)
          ? liq.autonomousCandidateQueue
          : [],
        evolutionsStreamConnected: prev.evolutionsStreamConnected,
        evolutionsStreamSeq: prev.evolutionsStreamSeq
      }));
    } catch {
      if (seq === requestSeqRef.current) {
        setSnapshot((prev) => ({ ...prev, loading: false }));
      }
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    const timer = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        void refreshStatus(false, { background: true });
      }
    }, 15000);
    return () => {
      clearInterval(timer);
      inFlightAbortRef.current?.abort();
    };
  }, [refreshStatus]);

  // Persistent Real-Time Streamable HTTP(S) (`application/x-ndjson`) Evolutions Feed
  useEffect(() => {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return;

    let unmounted = false;
    let streamAbort: AbortController | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelayMs = 1200;

    const applyNdjsonLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const frame = JSON.parse(trimmed);
        if (!frame || typeof frame !== 'object') return;
        if (frame.type === 'evolutions') {
          setSnapshot((prev) => ({
            ...prev,
            loading: false,
            evolutionsStreamConnected: true,
            evolutionsStreamSeq: Number(frame.seq || prev.evolutionsStreamSeq + 1),
            dbrainGeneration:
              Number(frame.dbrainGeneration) > 0 ? Number(frame.dbrainGeneration) : prev.dbrainGeneration,
            liveCapsulesTotal:
              Number.isFinite(Number(frame.liveCapsulesTotal)) && Number(frame.liveCapsulesTotal) > 0
                ? Number(frame.liveCapsulesTotal)
                : prev.liveCapsulesTotal,
            verifiedDataLayerRoot: frame.verifiedDataLayerRoot
              ? String(frame.verifiedDataLayerRoot)
              : prev.verifiedDataLayerRoot,
            recentCapsules: Array.isArray(frame.recentCapsules) ? frame.recentCapsules : prev.recentCapsules,
            missions: Array.isArray(frame.missions) ? frame.missions : prev.missions
          }));
        } else if (frame.type === 'heartbeat') {
          setSnapshot((prev) => ({
            ...prev,
            evolutionsStreamConnected: true,
            evolutionsStreamSeq: Number(frame.seq || prev.evolutionsStreamSeq + 1)
          }));
        }
      } catch {
        /* ignore malformed NDJSON line */
      }
    };

    const connectStream = async () => {
      if (unmounted) return;
      const controller = new AbortController();
      streamAbort = controller;

      try {
        const res = await fetch('/api/nousgent/evolutions/stream', {
          method: 'GET',
          headers: { Accept: 'application/x-ndjson' },
          cache: 'no-store',
          signal: controller.signal
        });

        if (!res.ok || !res.body) {
          throw new Error(`Stream HTTP ${res.status}`);
        }

        retryDelayMs = 1200;
        setSnapshot((prev) =>
          prev.evolutionsStreamConnected ? prev : { ...prev, evolutionsStreamConnected: true }
        );

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!unmounted) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            let newlineIdx = buffer.indexOf('\n');
            while (newlineIdx !== -1) {
              const rawLine = buffer.slice(0, newlineIdx);
              buffer = buffer.slice(newlineIdx + 1);
              applyNdjsonLine(rawLine);
              newlineIdx = buffer.indexOf('\n');
            }
          }
        }

        buffer += decoder.decode();
        if (buffer.trim()) {
          applyNdjsonLine(buffer);
        }
      } catch {
        /* stream disconnected or aborted */
      }

      if (unmounted) return;
      setSnapshot((prev) =>
        prev.evolutionsStreamConnected ? { ...prev, evolutionsStreamConnected: false } : prev
      );
      const jitter = Math.floor(Math.random() * 400);
      const delay = Math.min(10_000, retryDelayMs) + jitter;
      retryDelayMs = Math.min(10_000, Math.round(retryDelayMs * 1.8));
      reconnectTimer = setTimeout(() => {
        void connectStream();
      }, delay);
    };

    void connectStream();

    return () => {
      unmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      streamAbort?.abort();
    };
  }, []);

  return {
    snapshot,
    hostPlane,
    setHostPlane,
    refreshStatus
  };
}
