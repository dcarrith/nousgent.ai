'use strict';

const fs = require('node:fs');
const path = require('node:path');

const NOUSGENT_VERSION = '1.0.0';
const FLAGSHIP_AGENT_ID = 'NOUSGENT';
const TARGET_US_LIBRARIES = 17454;

function readPkgVersion(relDir) {
  const pkgPath = path.resolve(__dirname, '../../', relDir, 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
}

function getSubmoduleVersions() {
  return Object.freeze({
    dolfactory: readPkgVersion('packages/dolfactory'),
    dthalamus: readPkgVersion('packages/dthalamus'),
    dbrain: readPkgVersion('packages/dbrain'),
    cbrain: readPkgVersion('packages/cbrain')
  });
}

function clampPct(val) {
  return Math.max(0, Math.min(100, Number(val)));
}

function computeBoundedAsiReadinessIndex(options = {}) {
  const enlistedNodesCount = Math.max(0, Number(options.enlistedNodesCount ?? 0));
  const completedQuorumsCount = Math.max(0, Number(options.completedQuorumsCount ?? 0));
  const activeMorphicBrainsCount = Math.max(0, Number(options.activeMorphicBrainsCount ?? 0));
  const l1DiscoveredStoresTotal = Math.max(0, Number(options.l1DiscoveredStoresTotal ?? 0));
  const liveCapsulesTotal = Math.max(0, Number(options.liveCapsulesTotal ?? 0));
  const verifiedAntibodiesCount = Math.max(0, Number(options.verifiedAntibodiesCount ?? 0));
  const organsReachableCount = Math.max(0, Math.min(5, Number(options.organsReachableCount ?? 0)));

  const reasoningRank1Pct = clampPct(options.reasoningRank1Pct ?? 0);
  const catastrophicForgettingPct = clampPct(options.catastrophicForgettingPct ?? 0.0);
  const retentionScorePct = Number((100 - catastrophicForgettingPct).toFixed(2));
  const pathogenDeflectionPct = clampPct(options.pathogenDeflectionPct ?? 0);
  const canaryDiversityPct = clampPct(options.canaryDiversityPct ?? 0);

  const combinedNodes = enlistedNodesCount + activeMorphicBrainsCount;
  const rawMeshRatio = Math.min(1, Math.log10(1 + combinedNodes) / Math.log10(1 + TARGET_US_LIBRARIES));
  const capsuleRatio = Math.min(1, Math.log10(1 + liveCapsulesTotal) / Math.log10(1 + 100000));
  const swarmConsensusPct = clampPct(
    Number(((organsReachableCount / 5) * 75 + rawMeshRatio * 20 + Math.min(5, completedQuorumsCount * 1)).toFixed(1))
  );
  const meshReadinessAxisPct = clampPct(
    Number((rawMeshRatio * 35 + capsuleRatio * 50 + Math.min(15, verifiedAntibodiesCount)).toFixed(2))
  );

  const weighted =
    reasoningRank1Pct * 0.24 +
    retentionScorePct * 0.22 +
    pathogenDeflectionPct * 0.20 +
    canaryDiversityPct * 0.16 +
    meshReadinessAxisPct * 0.18;

  const bariScorePct = Number(clampPct(weighted).toFixed(1));

  const submodules = getSubmoduleVersions();
  const organOverrides = options.organOverrides || {};

  const dolfOvr = organOverrides.dolfactory || {};
  const dthOvr = organOverrides.dthalamus || {};
  const dbrOvr = organOverrides.dbrain || {};
  const cbrOvr = organOverrides.cbrain || {};
  const liqOvr = organOverrides.liquidish || {};

  const organs = Object.freeze([
    Object.freeze({
      slot: '01 // SENSORY',
      domain: 'dolfactory.to',
      url: 'https://dolfactory.to',
      packageName: `@dolfactory/core@${dolfOvr.version || submodules.dolfactory}`,
      status: dolfOvr.status || 'LOCAL_MODULE',
      latencyMs: Number(dolfOvr.latencyMs ?? 0),
      role: 'Cranial Nerve I Pre-Thalamic IPS, Glomerular Plumes & 2,048-KC Fly-LSH Immunity'
    }),
    Object.freeze({
      slot: '02 // RELAY',
      domain: 'dthalamus.to',
      url: 'https://dthalamus.to',
      packageName: `@dthalamus/core@${dthOvr.version || submodules.dthalamus}`,
      status: dthOvr.status || 'LOCAL_MODULE',
      latencyMs: Number(dthOvr.latencyMs ?? 0),
      role: 'Ring-0 Reference Monitor, OS Sandbox, Biba PAM Veto & Ed25519 DAN-* RPE Oracle'
    }),
    Object.freeze({
      slot: '03 // CORTEX',
      domain: 'dbrain.to',
      url: 'https://dbrain.to',
      packageName: `@dbrain/core@${dbrOvr.version || submodules.dbrain}`,
      status: dbrOvr.status || 'LOCAL_MODULE',
      latencyMs: Number(dbrOvr.latencyMs ?? 0),
      role: '5-Lobe Chia Merkle Cortex, 2,048-KC 0% Forgetting WAL & O(log N) Git Bisect'
    }),
    Object.freeze({
      slot: '04 // EXECUTIVE',
      domain: 'cbrain.to',
      url: 'https://cbrain.to',
      packageName: `@cbrain/core@${cbrOvr.version || submodules.cbrain}`,
      status: cbrOvr.status || 'LOCAL_MODULE',
      latencyMs: Number(cbrOvr.latencyMs ?? 0),
      role: 'Live 4D WebGL/wasm32 Holographic Connectome & Kenyon Synapse Observatory'
    }),
    Object.freeze({
      slot: '05 // LEDGER',
      domain: 'shi.liquidi.sh',
      url: 'https://shi.liquidi.sh',
      packageName: `liquidi.sh@${liqOvr.version || 'local'}`,
      status: liqOvr.status || 'OFFLINE',
      latencyMs: Number(liqOvr.latencyMs ?? 0),
      role: '$DIG CAT2 (10^3 Mojos) Proof-of-Derivation Market & 60/25/10/5% Citation Royalties'
    })
  ]);

  return Object.freeze({
    docId: 'NOUSGENT-ASI-USA-2026',
    flagshipAgent: FLAGSHIP_AGENT_ID,
    version: NOUSGENT_VERSION,
    dataPolicy: '100_PERCENT_LIVE_ECOSYSTEM_DATA',
    bariScorePct,
    catastrophicForgettingPct,
    swarmConsensusPct,
    enlistedNodesCount,
    targetUsLibraries: TARGET_US_LIBRARIES,
    axes: Object.freeze({
      reasoningRank1Pct,
      retentionScorePct,
      pathogenDeflectionPct,
      canaryDiversityPct,
      meshReadinessAxisPct
    }),
    dualEngineRsi: Object.freeze({
      morphicFieldBrainsActive: activeMorphicBrainsCount,
      l1DiscoveredStoresTotal,
      liveCapsulesTotal,
      verifiedAntibodiesCount,
      organsReachableCount,
      mathematicalInvariant: 'C(G_{t+1}) > C(G_t) && S(G_{t+1}) >= S(G_t)',
      godelianAnchor: 'CHIP-0043 (-32044) Citizen FIDO2 Quorum'
    }),
    submodules,
    organs
  });
}

module.exports = Object.freeze({
  NOUSGENT_VERSION,
  FLAGSHIP_AGENT_ID,
  TARGET_US_LIBRARIES,
  getSubmoduleVersions,
  computeBoundedAsiReadinessIndex
});
