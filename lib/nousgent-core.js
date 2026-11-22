'use strict';

const bariAndOrgans = require('./modules/bari-and-organs.js');
const podBayRedteam = require('./modules/pod-bay-redteam.js');
const morphicMesh = require('./modules/morphic-mesh-and-missions.js');
const personaMindArena = require('./modules/persona-mind-arena.js');
const cbrain = require('../packages/cbrain/lib/cbrain-core.js');

function getObservatoryTelemetry(liveMerkleRoot = '') {
  const chron = cbrain.buildCbrainChronologyTelemetry({
    brandOrHost: 'nousgent.ai',
    route: '/observatory'
  });
  return Object.freeze({
    observatoryOrigin: 'https://cbrain.to',
    cbrainVersion: bariAndOrgans.getSubmoduleVersions().cbrain,
    wasmSpatialVerified: Boolean(chron.wasmSpatialVerified),
    kenyonCellsTotal: 2048,
    activeWtaWinners: 64,
    lobes: ['working', 'episodic', 'semantic', 'procedural', 'alignment'],
    coherencePct: chron.driftAudit.coherencePct,
    primaryMerkleRoot: String(liveMerkleRoot || chron.primaryMerkleRoot),
    peakFrameRateFps: 60
  });
}

function buildBariOptionsFromEcosystem(liveEcosystem, enlistedNodesCount, completedQuorumsCount) {
  if (!liveEcosystem) {
    return {
      enlistedNodesCount,
      completedQuorumsCount
    };
  }
  const db = liveEcosystem.dbrain;
  const dt = liveEcosystem.dthalamus;
  const dolf = liveEcosystem.dolfactory;
  const cb = liveEcosystem.cbrain;
  const liq = liveEcosystem.liquidish;

  const totalAntibodies =
    dt.activeAntibodiesCount + dolf.imprintedOdorsCount + liq.dreamSynthesizedAntibodiesCount;

  return {
    enlistedNodesCount,
    completedQuorumsCount,
    activeMorphicBrainsCount: db.activeMorphicBrainsCount,
    l1DiscoveredStoresTotal: db.l1DiscoveredStoresTotal,
    liveCapsulesTotal: db.liveCapsulesTotal,
    verifiedAntibodiesCount: totalAntibodies,
    organsReachableCount: liveEcosystem.organsReachableCount,
    reasoningRank1Pct: cb.reachable ? cb.coherencePct : 0,
    catastrophicForgettingPct: 0.0,
    pathogenDeflectionPct: dt.reachable && dt.ratchetPassed ? 100 : 0,
    canaryDiversityPct: dolf.reachable && dolf.totalReceptors > 0 ? 100 : 0,
    organOverrides: {
      dolfactory: {
        version: dolf.version,
        status: dolf.reachable ? 'LIVE' : 'UNREACHABLE',
        latencyMs: dolf.latencyMs
      },
      dthalamus: {
        version: dt.version,
        status: dt.reachable ? 'LIVE' : 'UNREACHABLE',
        latencyMs: dt.latencyMs
      },
      dbrain: {
        version: db.version,
        status: db.reachable ? 'LIVE' : 'UNREACHABLE',
        latencyMs: db.latencyMs
      },
      cbrain: {
        version: '',
        status: cb.reachable ? 'LIVE' : 'UNREACHABLE',
        latencyMs: cb.latencyMs
      },
      liquidish: {
        version: liq.version,
        status: liq.reachable || liq.shiReachable ? 'LIVE' : 'UNREACHABLE',
        latencyMs: liq.latencyMs
      }
    }
  };
}

function createNousgentEngine(options = {}) {
  const meshStore = morphicMesh.createMorphicMeshStore(options);
  const podBay = podBayRedteam.createPodBayDefenseBench();
  const mindArena = personaMindArena.createPersonaMindArena({ podBay });

  function getMissionStatus(liveEcosystem = null) {
    const liveRoot = liveEcosystem ? liveEcosystem.dbrain.verifiedMerkleRoot : '';
    const lb = meshStore.getLeaderboardSnapshot(liveRoot);
    const missions = meshStore.listMissions();
    const sealedCount = missions.filter((m) => m.status === 'CHIP0043_QUORUM_SEALED').length;
    const bari = bariAndOrgans.computeBoundedAsiReadinessIndex(
      buildBariOptionsFromEcosystem(liveEcosystem, lb.totalActiveNodes, sealedCount)
    );
    const planes = meshStore.getPlaneTelemetry();
    return Object.freeze({
      status: 'ok',
      protocol: 'NOUSGENT-BOUNDED-ASI-v1.0',
      bari,
      planes,
      leaderboard: lb,
      missions,
      observatory: getObservatoryTelemetry(liveRoot),
      liveEcosystem
    });
  }

  function runPodBayChallenge(payload = {}) {
    const res = podBay.evaluateChallenge(payload);
    if (res.deflected) {
      meshStore.recordRedTeamDeflection();
    }
    return res;
  }

  function askNousgent(payload = {}) {
    const out = mindArena.askPersona(payload);
    if (out.deflected) {
      meshStore.recordRedTeamDeflection();
    }
    return out;
  }

  return Object.freeze({
    meshStore,
    podBay,
    mindArena,
    getMissionStatus,
    runPodBayChallenge,
    askNousgent,
    simulateBisect: podBay.simulateScrewdriverVsBisect,
    enlistRig: meshStore.enlistCitizenRig,
    listMissions: meshStore.listMissions,
    submitClearSignVote: meshStore.submitClearSignVote,
    recordPlaneHit: meshStore.recordPlaneHit,
    renderFlightDossierSvg: meshStore.renderFlightDossierSvg,
    renderPrometheusMetrics: (liveEcosystem = null) => {
      const lb = meshStore.getLeaderboardSnapshot();
      const missions = meshStore.listMissions();
      const sealedCount = missions.filter((m) => m.status === 'CHIP0043_QUORUM_SEALED').length;
      const bari = bariAndOrgans.computeBoundedAsiReadinessIndex(
        buildBariOptionsFromEcosystem(liveEcosystem, lb.totalActiveNodes, sealedCount)
      );
      return meshStore.renderPrometheusMetrics(bari);
    },
    close: meshStore.close
  });
}

module.exports = Object.freeze({
  ...bariAndOrgans,
  ...podBayRedteam,
  ...morphicMesh,
  ...personaMindArena,
  getObservatoryTelemetry,
  buildBariOptionsFromEcosystem,
  createNousgentEngine
});
