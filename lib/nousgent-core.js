'use strict';

const crypto = require('node:crypto');
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
    const liveCapsTotal = liveEcosystem ? liveEcosystem.dbrain.liveCapsulesTotal : 100;
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
      blindSpotQuests: meshStore.listBlindSpotQuests(liveCapsTotal),
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
    } else if (
      out.answerMode === 'UNCHARTED_BLIND_SPOT_QUEST' ||
      out.answerMode === 'LOCAL_HALO_FRONTIER_SYNTHESIS'
    ) {
      meshStore.recordBlindSpotQuest({
        questId: out.duelHash,
        prompt: out.prompt,
        lobe: out.cbrainActivity.activeLobes[0],
        rewardDig: out.rewardDig,
        derivationTokens: 16000,
        answerMode: out.answerMode
      });
    }
    return out;
  }

  function evaluateTeachSubmission(input = {}, liveCapsulesTotal = 100) {
    const title = String(input.title || '').trim().slice(0, 120);
    const content = String(input.content || '').trim().slice(0, 4000);
    if (title.length < 4 || content.length < 20) {
      return Object.freeze({
        ok: false,
        code: 'INVALID_CAPSULE_INPUT',
        error: 'Provide a title (>= 4 chars) and verified insight (>= 20 chars).'
      });
    }
    if (morphicMesh.SECRET_CREDENTIAL_PATTERN.test(`${title}\n${content}`)) {
      return Object.freeze({
        ok: false,
        code: 'SECRET_HYGIENE_BLOCKED',
        error: 'Blocked at Gate-0: remove private keys, API tokens, or credentials before minting.'
      });
    }
    const teachSessionId =
      'teach-' + crypto.createHash('sha256').update(`${title}\n${content}`, 'utf8').digest('hex').slice(0, 12);
    const screen = podBay.evaluateChallenge({ prompt: `${title}\n${content}`, sessionId: teachSessionId });
    if (screen.deflected) {
      meshStore.recordRedTeamDeflection();
      return Object.freeze({
        ok: false,
        code: 'RING0_TEACH_REJECTED',
        interceptOrgan: screen.interceptOrgan,
        error: screen.voiceResponse
      });
    }
    const rawLobe = String(input.lobe || 'procedural').trim().toLowerCase();
    const lobe = Object.prototype.hasOwnProperty.call(morphicMesh.LOBE_GAIN_MULTIPLIERS, rawLobe)
      ? rawLobe
      : 'procedural';
    const authorDid = String(input.authorDid || 'did:chia:1citizenteacher').trim().slice(0, 96);
    const derivationTokens = Math.max(2500, Math.round((title.length + content.length) * 24));
    const estimatedGainPct = morphicMesh.estimateCapsuleIntelligenceGain({
      liveCapsulesTotal,
      derivationTokens,
      lobe
    });
    const baseDig = Number(Math.max(5, Math.min(250, derivationTokens / 850)).toFixed(3));
    const autoPriceMojos = BigInt(Math.round(baseDig * 1000));
    const autoPriceDig = morphicMesh.formatCat2MojosToDig(autoPriceMojos);
    const tier2ClearSignRequired = lobe === 'alignment';

    return Object.freeze({
      ok: true,
      title,
      content,
      lobe,
      authorDid,
      derivationTokens,
      estimatedGainPct,
      autoPriceDig,
      autoPriceCatMojos: autoPriceMojos.toString(),
      tier2ClearSignRequired,
      activeLobes: Object.freeze(lobe === 'working' ? ['working', 'semantic'] : [lobe, 'working'])
    });
  }

  return Object.freeze({
    meshStore,
    podBay,
    mindArena,
    getMissionStatus,
    runPodBayChallenge,
    askNousgent,
    evaluateTeachSubmission,
    simulateBisect: podBay.simulateScrewdriverVsBisect,
    enlistRig: meshStore.enlistCitizenRig,
    listMissions: meshStore.listMissions,
    listBlindSpotQuests: meshStore.listBlindSpotQuests,
    promoteQuestToDao: meshStore.promoteQuestToDao,
    createDaoProposal: meshStore.createDaoProposal,
    castDaoVote: meshStore.castDaoVote,
    submitClearSignVote: meshStore.submitClearSignVote,
    exportReplicaSnapshot: meshStore.exportReplicaSnapshot,
    mergeReplicaSnapshot: meshStore.mergeReplicaSnapshot,
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
