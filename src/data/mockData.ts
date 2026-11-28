export interface OrganBusItem {
  readonly slot: string;
  readonly domain: string;
  readonly url: string;
  readonly packageName: string;
  readonly status: string;
  readonly latencyMs: number;
  readonly role: string;
}

export interface StateHubItem {
  readonly stateCode: string;
  readonly hubName: string;
  readonly subtitle: string;
  readonly rigsCount: number;
  readonly storagePb: number;
  readonly mapX: number;
  readonly mapY: number;
}

interface DaoMissionGovernance {
  readonly daoSingletonId: string;
  readonly proposalPuzzleHash: string;
  readonly category: string;
  readonly proposerDid: string;
  readonly votesForMojos: string;
  readonly votesAgainstMojos: string;
  readonly votesAbstainMojos: string;
  readonly votesForDig: string;
  readonly votesAgainstDig: string;
  readonly votesAbstainDig: string;
  readonly voterCount: number;
  readonly quorumTargetDig: string;
  readonly quorumPct: number;
  readonly approvalPct: number;
  readonly daoApproved: boolean;
}

export interface SwarmMissionItem {
  readonly missionId: string;
  readonly title: string;
  readonly summary: string;
  readonly progressPct: number;
  readonly rewardDig: string;
  readonly quorumSignatures: number;
  readonly quorumTarget: number;
  readonly quorumPct: number;
  readonly status: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly clearSignUr: string;
  readonly dao?: DaoMissionGovernance;
}

export interface EnlistOsOption {
  readonly id: string;
  readonly label: string;
  readonly envFlag: string;
  readonly command: string;
  readonly sandboxNote: string;
}

export const ENLIST_OS_OPTIONS: readonly EnlistOsOption[] = [
  {
    id: 'macos',
    label: 'macOS',
    envFlag: 'macos-seatbelt',
    command: 'curl -fsSL https://nousgent.ai/enlist.sh | sh -s -- --chip=0043 --env=macos-seatbelt',
    sandboxNote: 'Apple sandbox-exec isolation with zero SSH or environment key exposure.'
  },
  {
    id: 'linux',
    label: 'Linux',
    envFlag: 'linux-bwrap',
    command: 'curl -fsSL https://nousgent.ai/enlist.sh | sh -s -- --chip=0043 --env=linux-bwrap',
    sandboxNote: 'Unprivileged user, mount, and network namespace isolation via bwrap.'
  },
  {
    id: 'docker',
    label: 'Docker',
    envFlag: 'docker-rootless',
    command: 'docker run --rm -it --read-only --cap-drop=ALL ghcr.io/dcarrith/nousgent:1.0.0 enlist --chip=0043',
    sandboxNote: 'Read-only rootfs non-root Alpine container with dropped capabilities.'
  },
  {
    id: 'library',
    label: 'Civic Node',
    envFlag: 'carnegie-library-post',
    command: 'curl -fsSL https://nousgent.ai/enlist.sh | sh -s -- --chip=0043 --env=carnegie-library-post',
    sandboxNote: 'Public library and community storage node profile earning 5% verifier $DIG royalties.'
  }
];

export const US_STATE_CODES: readonly string[] = [
  'IL', 'TX', 'WY', 'CA', 'OH', 'NY', 'FL', 'WA', 'VA', 'CO', 'MA', 'PA', 'GA', 'NC', 'MI', 'AZ'
];

export const FALLBACK_ORGANS: readonly OrganBusItem[] = [
  {
    slot: '01 // SENSORY',
    domain: 'Olfactory',
    url: 'https://dolfactory.to',
    packageName: '@dolfactory/core@1.7.0',
    status: 'NOMINAL',
    latencyMs: 0.14,
    role: 'Pre-thalamic IPS (12 ORs + OR-002 epistemic spoof), VNO pinning, and 2,048-KC Fly-LSH'
  },
  {
    slot: '02 // RELAY',
    domain: 'Thalamus',
    url: 'https://dthalamus.to',
    packageName: '@dthalamus/core@1.11.0',
    status: 'FILTERED',
    latencyMs: 0.09,
    role: 'Ring-0 reference monitor, Biba modality clamp, 3-stage provenance, and SEP-2640 firewall'
  },
  {
    slot: '03 // CORTEX',
    domain: 'Cortex',
    url: 'https://dbrain.to',
    packageName: '@dbrain/core@3.24.1',
    status: 'BOUNDED',
    latencyMs: 0.045,
    role: '5-lobe Chia Merkle WAL, 4-way epistemic SPO ontology, pre-flight coverage, and bisect'
  },
  {
    slot: '04 // CONNECTOME',
    domain: 'Connectome',
    url: 'https://cbrain.to',
    packageName: '@cbrain/core@3.24.0',
    status: 'VERIFIED',
    latencyMs: 0.18,
    role: '3D WebGL connectome, Kenyon synapse firing, and epistemic/provenance dissectors'
  },
  {
    slot: '05 // EXCHANGE',
    domain: 'Exchange',
    url: 'https://liquidi.sh',
    packageName: 'liquidi.sh@3.24.0',
    status: 'SYNCED',
    latencyMs: 0.42,
    role: '$DIG CAT2 market, >= REFERENCED provenance royalty floor, and 60/25/10/5% royalties'
  }
];
