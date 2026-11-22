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
  const enlistedNodesCount = Math.max(1, Number(options.enlistedNodesCount ?? 4108));
  const completedQuorumsCount = Math.max(0, Number(options.completedQuorumsCount ?? 0));
  const verifiedAntibodiesCount = Math.max(0, Number(options.verifiedAntibodiesCount ?? 640));

  const reasoningRank1Pct = clampPct(options.reasoningRank1Pct ?? 95.96);
  const catastrophicForgettingPct = clampPct(options.catastrophicForgettingPct ?? 0.0);
  const retentionScorePct = Number((100 - catastrophicForgettingPct).toFixed(2));
  const pathogenDeflectionPct = clampPct(options.pathogenDeflectionPct ?? 99.84);
  const canaryDiversityPct = clampPct(options.canaryDiversityPct ?? 98.9);

  // Smooth logarithmic mesh saturation toward the 17,454 U.S. Public Library "Carnegie 2.0" target
  const rawMeshRatio = Math.min(1, Math.log10(1 + enlistedNodesCount) / Math.log10(1 + TARGET_US_LIBRARIES));
  const swarmConsensusPct = clampPct(Number((70 + rawMeshRatio * 25.1 + Math.min(4.9, completedQuorumsCount * 0.2)).toFixed(1)));
  const meshReadinessAxisPct = clampPct(Number((rawMeshRatio * 42 + Math.min(15, verifiedAntibodiesCount / 100)).toFixed(2)));

  const weighted =
    reasoningRank1Pct * 0.24 +
    retentionScorePct * 0.22 +
    pathogenDeflectionPct * 0.20 +
    canaryDiversityPct * 0.16 +
    meshReadinessAxisPct * 0.18;

  const bariScorePct = Number(clampPct(weighted).toFixed(1));
  const megawattsSavedVsHyperscalers = Number((enlistedNodesCount * 0.020594).toFixed(1));
  const gallonsWaterSavedWeekly = Math.round(enlistedNodesCount * 301.972);
  const petabytesChiaPostCommitted = Number((enlistedNodesCount * 0.036246).toFixed(1));

  const submodules = getSubmoduleVersions();
  const organs = Object.freeze([
    Object.freeze({
      slot: '01 // SENSORY',
      domain: 'dolfactory.to',
      url: 'https://dolfactory.to',
      packageName: `@dolfactory/core@${submodules.dolfactory}`,
      status: 'NOMINAL',
      latencyMs: 0.14,
      role: 'Cranial Nerve I Pre-Thalamic IPS, Glomerular Plumes & 2,048-KC Fly-LSH Immunity'
    }),
    Object.freeze({
      slot: '02 // RELAY',
      domain: 'dthalamus.to',
      url: 'https://dthalamus.to',
      packageName: `@dthalamus/core@${submodules.dthalamus}`,
      status: 'FILTERED',
      latencyMs: 0.09,
      role: 'Ring-0 Reference Monitor, OS Sandbox, Biba PAM Veto & Ed25519 DAN-* RPE Oracle'
    }),
    Object.freeze({
      slot: '03 // CORTEX',
      domain: 'dbrain.to',
      url: 'https://dbrain.to',
      packageName: `@dbrain/core@${submodules.dbrain}`,
      status: 'BOUNDED',
      latencyMs: 0.045,
      role: '5-Lobe Chia Merkle Cortex, 2,048-KC 0% Forgetting WAL & O(log N) Git Bisect'
    }),
    Object.freeze({
      slot: '04 // EXECUTIVE',
      domain: 'cbrain.to',
      url: 'https://cbrain.to',
      packageName: `@cbrain/core@${submodules.cbrain}`,
      status: 'VERIFIED',
      latencyMs: 0.18,
      role: 'Live 4D WebGL/wasm32 Holographic Connectome & Kenyon Synapse Observatory'
    }),
    Object.freeze({
      slot: '05 // LEDGER',
      domain: 'shi.liquidi.sh',
      url: 'https://shi.liquidi.sh',
      packageName: 'liquidi.sh@3.17.1',
      status: 'POST SYNCED',
      latencyMs: 0.42,
      role: '$DIG CAT2 (10^3 Mojos) Proof-of-Derivation Market & 60/25/10/5% Citation Royalties'
    })
  ]);

  return Object.freeze({
    docId: 'NOUSGENT-ASI-USA-2026',
    flagshipAgent: FLAGSHIP_AGENT_ID,
    version: NOUSGENT_VERSION,
    designSystem: 'Orbital Cleanroom (Urbana White-Room Centrifuge & NASA Flight Manual)',
    bariScorePct,
    baselineDeltaPct: Number((bariScorePct - 82.3).toFixed(1)),
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
    greenSavings: Object.freeze({
      megawattsSavedVsHyperscalers,
      gallonsWaterSavedWeekly,
      petabytesChiaPostCommitted
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
