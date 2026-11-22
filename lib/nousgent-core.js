'use strict';

const bariAndOrgans = require('./modules/bari-and-organs.js');
const podBayRedteam = require('./modules/pod-bay-redteam.js');
const morphicMesh = require('./modules/morphic-mesh-and-missions.js');
const cbrain = require('../packages/cbrain/lib/cbrain-core.js');

function getObservatoryTelemetry() {
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
    primaryMerkleRoot: chron.primaryMerkleRoot,
    peakFrameRateFps: 60
  });
}

function createNousgentEngine(options = {}) {
  const meshStore = morphicMesh.createMorphicMeshStore(options);
  const podBay = podBayRedteam.createPodBayDefenseBench();

  function getMissionStatus() {
    const lb = meshStore.getLeaderboardSnapshot();
    const missions = meshStore.listMissions();
    const sealedCount = missions.filter((m) => m.status === 'CHIP0043_QUORUM_SEALED').length;
    const bari = bariAndOrgans.computeBoundedAsiReadinessIndex({
      enlistedNodesCount: lb.totalActiveNodes,
      completedQuorumsCount: sealedCount
    });
    const planes = meshStore.getPlaneTelemetry();
    return Object.freeze({
      status: 'ok',
      protocol: 'NOUSGENT-BOUNDED-ASI-v1.0',
      bari,
      planes,
      leaderboard: lb,
      missions,
      observatory: getObservatoryTelemetry()
    });
  }

  function runPodBayChallenge(payload = {}) {
    const res = podBay.evaluateChallenge(payload);
    if (res.deflected) {
      meshStore.recordRedTeamDeflection();
    }
    return res;
  }

  return Object.freeze({
    meshStore,
    podBay,
    getMissionStatus,
    runPodBayChallenge,
    simulateBisect: podBay.simulateScrewdriverVsBisect,
    enlistRig: meshStore.enlistCitizenRig,
    listMissions: meshStore.listMissions,
    submitClearSignVote: meshStore.submitClearSignVote,
    recordPlaneHit: meshStore.recordPlaneHit,
    renderFlightDossierSvg: meshStore.renderFlightDossierSvg,
    renderPrometheusMetrics: () => {
      const lb = meshStore.getLeaderboardSnapshot();
      const bari = bariAndOrgans.computeBoundedAsiReadinessIndex({ enlistedNodesCount: lb.totalActiveNodes });
      return meshStore.renderPrometheusMetrics(bari);
    },
    close: meshStore.close
  });
}

module.exports = Object.freeze({
  ...bariAndOrgans,
  ...podBayRedteam,
  ...morphicMesh,
  getObservatoryTelemetry,
  createNousgentEngine
});
