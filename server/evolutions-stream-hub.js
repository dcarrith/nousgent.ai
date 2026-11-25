'use strict';

/**
 * ============================================================================
 * NOUSGENT Real-Time Evolutions Streamable HTTP Hub (`server/evolutions-stream-hub.js`)
 * - Streams newline-delimited JSON (`application/x-ndjson; charset=utf-8`)
 *   with `X-Accel-Buffering: no` so NGINX Ingress flushes frames immediately
 *   without breaking static/OpenGraph `Content-Length` responses.
 * - Unifies BOTH autonomous M2M evolutions (upstream `dbrain.to` `.dig` mints,
 *   `ia.nousgent.ai/api/mcp` mutations, `ESS1` swarm seed pulses, off-leaf
 *   blocked regressive edits) AND manual human evolutions (Teach `.dig` mints,
 *   Evolve promotions, DAO proposals/votes, Two-Key sign-offs, blind-spot quests)
 *   into a chronological newest-first `recentEvolutions` feed across all pods.
 * - Emits 15s keepalive heartbeat frames so connections never hit NGINX's 60s
 *   `proxy-read-timeout`.
 * ============================================================================
 */

const crypto = require('node:crypto');

function formatGovernanceStatus(status) {
  if (status === 'CHIP0043_QUORUM_SEALED') return { label: 'Sealed', tone: 'pistachio' };
  if (status === 'DAO_APPROVED_AWAITING_SIGNING') return { label: 'Sign-Off', tone: 'jade' };
  if (status === 'DAO_VOTING_OPEN') return { label: 'Voting', tone: 'bronze' };
  if (status === 'ACTIVE_SWARM_HARVEST') return { label: 'Active', tone: 'pistachio' };
  return { label: 'Pending', tone: 'bronze' };
}

function isAutonomousProposerDid(did) {
  const clean = String(did || '').toLowerCase();
  return /(?:nousgent|aegis|swarm|agent|mcp|autonomous)/.test(clean);
}

function parseSortableEpochMs(isoStr, fallbackOrder = 0) {
  const parsed = isoStr ? Date.parse(String(isoStr)) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  // Deterministic fallback for mock/test records lacking an explicit ISO timestamp
  return 1_767_225_600_000 + Math.max(0, Number(fallbackOrder || 0)) * 1000;
}

function buildRecentEvolutionsFeed({
  recentCapsules = [],
  missions = [],
  blindSpotQuests = [],
  rejectedEdits = [],
  esSeedPulses = [],
  limit = 10
} = {}) {
  const candidates = [];
  const fallbackSeeds = [];

  for (const cap of recentCapsules) {
    if (!cap || !cap.title) continue;
    const isHuman =
      cap.origin === 'human' ||
      (Array.isArray(cap.tags) && cap.tags.some((t) => String(t).toLowerCase() === 'teach-nousgent'));
    const origin = isHuman ? 'human' : 'autonomous';
    const lobeRaw = String(cap.lobe || 'semantic');
    const lobeLabel = lobeRaw.charAt(0).toUpperCase() + lobeRaw.slice(1);
    const rootShort =
      cap.merkleRoot && String(cap.merkleRoot).length > 14
        ? `${String(cap.merkleRoot).slice(0, 8)}…${String(cap.merkleRoot).slice(-4)}`
        : String(cap.id || '');
    const detailText =
      cap.summary && String(cap.summary).trim().length > 0
        ? String(cap.summary).trim()
        : `Verified ${lobeLabel.toLowerCase()} memory capsule anchored into NOUSGENT's append-only Second Brain.`;
    const generation = Number(cap.generation || 0);
    candidates.push({
      key: `cap-${cap.id || cap.title}`,
      kind: 'capsule',
      origin,
      badge: generation > 0 ? `Gen #${generation}` : 'Minted',
      badgeTone: isHuman ? 'jade' : 'pistachio',
      kindLabel: `${isHuman ? 'Human' : 'Auto'} · ${lobeLabel}`,
      title: String(cap.title).trim(),
      details: detailText,
      metaLine: `${cap.authorName || (isHuman ? 'Citizen Contributor' : 'Autonomous Agent')}${cap.priceDig ? ` · ${cap.priceDig}` : ''} · ${rootShort}`,
      timestamp: String(cap.timestamp || ''),
      sortMs: parseSortableEpochMs(cap.timestamp, generation),
      sortTie: generation,
      externalHref: cap.capsuleUrl || undefined
    });
  }

  for (const m of missions) {
    if (!m || !m.title) continue;
    const isUntouchedSeed =
      String(m.missionId || '').startsWith('NGT-ORDER-') &&
      Number(m.quorumSignatures || 0) === 0 &&
      Number(m.dao?.voterCount || 0) === 0;
    const proposerDid = String(m.dao?.proposerDid || '');
    const hasHumanSignoff = Number(m.quorumSignatures || 0) > 0;
    const origin = !hasHumanSignoff && isAutonomousProposerDid(proposerDid) ? 'autonomous' : 'human';
    const st = formatGovernanceStatus(m.status);
    const ts = String(m.updatedAt || m.createdAt || '');
    const entry = {
      key: `mission-${m.missionId}`,
      kind: 'governance',
      origin,
      badge: st.label,
      badgeTone: st.tone,
      kindLabel: `${origin === 'human' ? 'Human' : 'Auto'} · ${m.quorumSignatures}/${m.quorumTarget} Keys`,
      title: String(m.title).trim(),
      details: String(m.summary || 'Capability upgrade queued for voting and two-key human sign-off.').trim(),
      metaLine: `${m.missionId} · ${m.dao?.votesForDig || '0.000'} For · ${m.rewardDig} $DIG`,
      timestamp: ts,
      sortMs: parseSortableEpochMs(ts, Number(m.quorumSignatures || 0)),
      sortTie: Number(m.quorumSignatures || 0),
      internalHref: `/missions?mission=${encodeURIComponent(String(m.missionId))}`
    };
    if (isUntouchedSeed) {
      fallbackSeeds.push(entry);
    } else {
      candidates.push(entry);
    }
  }

  for (const seed of esSeedPulses) {
    if (!seed || !seed.eventId) continue;
    const specLabel = String(seed.specialization || 'spec:universal').replace(/^spec:/i, '');
    const zVal = Number(seed.zScore || 0);
    const zFmt = `${zVal >= 0 ? '+' : ''}${zVal.toFixed(2)}`;
    const epoch = Number(seed.epoch || 1);
    candidates.push({
      key: `seed-${seed.eventId}`,
      kind: 'es_seed',
      origin: 'autonomous',
      badge: `Epoch #${epoch}`,
      badgeTone: 'pistachio',
      kindLabel: 'Auto · Sleep ES',
      title: `89B ESS1 Seed (${specLabel} · z=${zFmt})`,
      details: `Verified VNO pheromone seed (${String(seed.seedHex || '').slice(0, 10)}…) accepted into cohort dopamine replay.`,
      metaLine: `${seed.eventId} · ${String(seed.senderDid || 'swarm-peer').slice(0, 24)}`,
      timestamp: String(seed.timestamp || ''),
      sortMs: parseSortableEpochMs(seed.timestamp, epoch),
      sortTie: epoch,
      internalHref: '/evolve'
    });
  }

  for (const q of blindSpotQuests) {
    if (!q || !q.questId || q.daoMissionId) continue;
    const origin = q.answerMode === 'LOCAL_HALO_FRONTIER_SYNTHESIS' ? 'autonomous' : 'human';
    candidates.push({
      key: `quest-${q.questId}`,
      kind: 'quest',
      origin,
      badge: `+${q.estimatedGainPct}% Est.`,
      badgeTone: 'jade',
      kindLabel: `${origin === 'human' ? 'Human' : 'Auto'} · Quest`,
      title: `Quest: ${String(q.prompt || '').trim()}`,
      details: `Uncharted ${String(q.lobe || 'semantic')} capability gap (${Number(q.hitCount || 1)}× demand) queued for .dig synthesis.`,
      metaLine: `${q.questId} · ${q.rewardDig} $DIG bounty`,
      timestamp: String(q.updatedAt || ''),
      sortMs: parseSortableEpochMs(q.updatedAt, Number(q.hitCount || 1)),
      sortTie: Number(q.hitCount || 1),
      internalHref: '/evolve'
    });
  }

  for (const rej of rejectedEdits) {
    if (!rej || !rej.rejectionId) continue;
    const isHuman = /citizenteacher|human/i.test(String(rej.authorDid || ''));
    const origin = isHuman ? 'human' : 'autonomous';
    const hurtCount = Array.isArray(rej.hurtCheckIds) ? rej.hurtCheckIds.length : 0;
    candidates.push({
      key: `guard-${rej.rejectionId}`,
      kind: 'guard_block',
      origin,
      badge: 'Blocked',
      badgeTone: 'bronze',
      kindLabel: `${isHuman ? 'Human' : 'Auto'} · Guard`,
      title: `Blocked: ${String(rej.title || rej.rejectionId).trim()}`,
      details:
        rej.reason === 'LOOPHOLE_SPIKE_VETOED'
          ? 'Brittle loophole spike vetoed by Gaussian stability check and logged off-leaf.'
          : `Blocked ${hurtCount} regression${hurtCount === 1 ? '' : 's'} and shared off-leaf so nodes do not retry it.`,
      metaLine: `${rej.rejectionId} · ${rej.reason}`,
      timestamp: String(rej.createdAtIso || ''),
      sortMs: parseSortableEpochMs(rej.createdAtIso, 0),
      sortTie: 0,
      internalHref: '/evolve'
    });
  }

  candidates.sort((a, b) => b.sortMs - a.sortMs || b.sortTie - a.sortTie || b.key.localeCompare(a.key));

  const seenTitles = new Set();
  const output = [];
  for (const item of [...candidates, ...(candidates.length < 6 ? fallbackSeeds : [])]) {
    const norm = item.title.trim().toLowerCase();
    if (!norm || seenTitles.has(norm)) continue;
    seenTitles.add(norm);
    output.push({
      key: item.key,
      kind: item.kind,
      origin: item.origin,
      badge: item.badge,
      badgeTone: item.badgeTone,
      kindLabel: item.kindLabel,
      title: item.title,
      details: item.details,
      metaLine: item.metaLine,
      timestamp: item.timestamp,
      ...(item.internalHref ? { internalHref: item.internalHref } : {}),
      ...(item.externalHref ? { externalHref: item.externalHref } : {})
    });
    if (output.length >= limit) break;
  }

  return output;
}

function computeEvolutionsDigest(payload) {
  const compact = {
    gen: payload.dbrainGeneration,
    total: payload.liveCapsulesTotal,
    brains: payload.morphicFieldBrainsActive,
    organs: payload.organsReachableCount,
    frozen: payload.frozenServeGeneration,
    esCount: payload.esSeedPulsesCount,
    caps: (payload.recentCapsules || []).map((c) => `${c.id}:${c.generation}:${c.priceDig || ''}`),
    missions: (payload.missions || []).map(
      (m) =>
        `${m.missionId}:${m.status}:${m.quorumSignatures}:${m.dao?.votesForMojos || '0'}:${m.dao?.votesAgainstMojos || '0'}:${m.updatedAt || ''}`
    ),
    quests: (payload.blindSpotQuests || []).map((q) => `${q.questId}:${q.hitCount}:${q.status}`),
    rej: (payload.rejectedEdits || []).map((r) => r.rejectionId),
    evo: (payload.recentEvolutions || []).map((e) => `${e.key}:${e.badge}:${e.metaLine}`)
  };
  return crypto.createHash('sha256').update(JSON.stringify(compact), 'utf8').digest('hex').slice(0, 20);
}

function createEvolutionsStreamHub({ engine, liveClient, pollIntervalMs = 4000, heartbeatIntervalMs = 15000 } = {}) {
  const clients = new Set();
  let lastDigest = '';
  let pollTimer = null;
  let heartbeatTimer = null;
  let broadcastInFlight = null;
  let pendingRebroadcast = null;
  let seqCounter = 0;

  async function buildEvolutionsPayload({ forceRefresh = false, lightweightPoll = false, reason = 'snapshot' } = {}) {
    let liveEco = {};
    if (liveClient) {
      if (lightweightPoll && typeof liveClient.refreshDbrainEvolutions === 'function') {
        liveEco = await liveClient.refreshDbrainEvolutions({ forceFullRefresh: false });
      } else if (forceRefresh && typeof liveClient.refreshDbrainEvolutions === 'function') {
        liveEco = await liveClient.refreshDbrainEvolutions({ forceFullRefresh: false });
      } else if (typeof liveClient.getLiveSnapshot === 'function') {
        liveEco = await liveClient.getLiveSnapshot({ forceRefresh });
      }
    }

    const missionStatus =
      engine && typeof engine.getMissionStatus === 'function' ? engine.getMissionStatus(liveEco) : {};
    const dbrain = (liveEco && liveEco.dbrain) || {};
    const dthalamus = (liveEco && liveEco.dthalamus) || {};
    const dolfactory = (liveEco && liveEco.dolfactory) || {};
    const liquidish = (liveEco && liveEco.liquidish) || {};
    const missions = Array.isArray(missionStatus.missions)
      ? missionStatus.missions
      : engine && typeof engine.listMissions === 'function'
        ? engine.listMissions()
        : [];
    const blindSpotQuests = Array.isArray(missionStatus.blindSpotQuests) ? missionStatus.blindSpotQuests : [];
    const rejectedEdits = Array.isArray(missionStatus.rejectedEdits) ? missionStatus.rejectedEdits : [];
    const esSeedPulses = Array.isArray(missionStatus.esSeedPulses) ? missionStatus.esSeedPulses : [];
    const recentCapsules = Array.isArray(dbrain.recentCapsules) ? dbrain.recentCapsules : [];

    const recentEvolutions = buildRecentEvolutionsFeed({
      recentCapsules,
      missions,
      blindSpotQuests,
      rejectedEdits,
      esSeedPulses,
      limit: 10
    });

    const payload = {
      type: 'evolutions',
      reason,
      ts: new Date().toISOString(),
      bariScorePct: Number(missionStatus.bari?.bariScorePct || 0),
      organsReachableCount: Number(liveEco?.organsReachableCount || 0),
      dbrainGeneration: Number(dbrain.primaryGeneration || 0),
      morphicFieldBrainsActive: Number(dbrain.activeMorphicBrainsCount || 0),
      l1DiscoveredStoresTotal: Number(dbrain.l1DiscoveredStoresTotal || 0),
      liveCapsulesTotal: Number(dbrain.liveCapsulesTotal || 0),
      verifiedDataLayerRoot: String(dbrain.verifiedMerkleRoot || ''),
      dthalamusActiveLeases: Number(dthalamus.activeLeasesCount || 0),
      dolfactoryReceptors: Number(dolfactory.totalReceptors || 0),
      liquidishOrderbookCount: Number(liquidish.orderbookAvailableCount || 0),
      liquidishLiveCapsulesListed: Number(liquidish.liveCapsulesListed || 0),
      liquidishSettledSwaps: Number(liquidish.settledSwapsCount || 0),
      royaltiesStreamedDig: String(liquidish.royaltiesStreamedDig || '0.000 $DIG'),
      frozenServeGeneration: Number(missionStatus.frozenServe?.pinnedGeneration || dbrain.primaryGeneration || 1),
      esSeedPulsesCount: esSeedPulses.length,
      recentCapsules,
      missions,
      blindSpotQuests,
      rejectedEdits,
      recentEvolutions
    };
    const digest = computeEvolutionsDigest(payload);
    return { payload: { ...payload, digest }, digest };
  }

  function writeNdjsonFrame(client, frameObj) {
    if (client.closed || client.res.writableEnded || client.res.destroyed) {
      removeClient(client);
      return;
    }
    try {
      client.seq += 1;
      const line = JSON.stringify({ seq: client.seq, ...frameObj }) + '\n';
      client.res.write(line);
      if (client.maxFrames > 0 && client.seq >= client.maxFrames) {
        removeClient(client);
        client.res.end();
      }
    } catch {
      removeClient(client);
    }
  }

  function startTimersIfNeeded() {
    if (clients.size === 0) return;
    if (!pollTimer) {
      pollTimer = setInterval(() => {
        void checkAndBroadcast({
          forceRefresh: false,
          lightweightPoll: true,
          reason: 'morphic_poll',
          onlyIfChanged: true
        });
      }, pollIntervalMs);
      if (typeof pollTimer.unref === 'function') pollTimer.unref();
    }
    if (!heartbeatTimer) {
      heartbeatTimer = setInterval(() => {
        if (clients.size === 0) {
          stopTimersIfIdle();
          return;
        }
        const now = new Date().toISOString();
        for (const client of clients) {
          writeNdjsonFrame(client, { type: 'heartbeat', ts: now });
        }
      }, heartbeatIntervalMs);
      if (typeof heartbeatTimer.unref === 'function') heartbeatTimer.unref();
    }
  }

  function stopTimersIfIdle() {
    if (clients.size > 0) return;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function removeClient(client) {
    if (!client || client.closed) return;
    client.closed = true;
    clients.delete(client);
    stopTimersIfIdle();
  }

  async function checkAndBroadcast({
    forceRefresh = false,
    lightweightPoll = false,
    reason = 'update',
    onlyIfChanged = false
  } = {}) {
    if (clients.size === 0) return false;
    if (broadcastInFlight) {
      pendingRebroadcast = {
        forceRefresh: Boolean((pendingRebroadcast && pendingRebroadcast.forceRefresh) || forceRefresh),
        lightweightPoll: Boolean((pendingRebroadcast && pendingRebroadcast.lightweightPoll) || lightweightPoll),
        reason,
        onlyIfChanged: Boolean(pendingRebroadcast ? pendingRebroadcast.onlyIfChanged && onlyIfChanged : onlyIfChanged)
      };
      return broadcastInFlight;
    }

    broadcastInFlight = (async () => {
      try {
        const { payload, digest } = await buildEvolutionsPayload({ forceRefresh, lightweightPoll, reason });
        if (onlyIfChanged && digest === lastDigest) {
          return false;
        }
        lastDigest = digest;
        seqCounter += 1;
        for (const client of clients) {
          writeNdjsonFrame(client, { ...payload, globalSeq: seqCounter });
        }
        return true;
      } catch {
        return false;
      } finally {
        broadcastInFlight = null;
        if (pendingRebroadcast && clients.size > 0) {
          const next = pendingRebroadcast;
          pendingRebroadcast = null;
          void checkAndBroadcast(next);
        } else {
          pendingRebroadcast = null;
        }
      }
    })();

    return broadcastInFlight;
  }

  function notifyEvolutionChanged(
    reason = 'mutation',
    { forceUpstreamRefresh = false, onlyIfChanged = false } = {}
  ) {
    if (clients.size === 0) {
      if (forceUpstreamRefresh && liveClient && typeof liveClient.invalidateCache === 'function') {
        liveClient.invalidateCache();
      }
      return;
    }
    void checkAndBroadcast({
      forceRefresh: forceUpstreamRefresh,
      lightweightPoll: forceUpstreamRefresh,
      reason,
      onlyIfChanged
    });
  }

  async function handleStreamRequest(req, res, { setSecurityHeaders, pathname, activePlane, maxFrames = 0 } = {}) {
    if (typeof setSecurityHeaders === 'function') {
      setSecurityHeaders(res, pathname, activePlane);
    }
    if (req.socket && typeof req.socket.setNoDelay === 'function') {
      req.socket.setNoDelay(true);
    }
    res.writeHead(200, {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const initial = await buildEvolutionsPayload({ forceRefresh: false, reason: 'initial' });
    lastDigest = initial.digest;

    const client = {
      res,
      seq: 0,
      maxFrames: Number.isFinite(maxFrames) && maxFrames > 0 ? Math.floor(maxFrames) : 0,
      closed: false
    };

    writeNdjsonFrame(client, { ...initial.payload, globalSeq: seqCounter });

    if (client.closed) {
      return;
    }

    clients.add(client);
    startTimersIfNeeded();

    const onDisconnect = () => {
      removeClient(client);
    };
    req.on('close', onDisconnect);
    req.on('aborted', onDisconnect);
    res.on('close', onDisconnect);
    res.on('error', onDisconnect);
  }

  function closeAll() {
    for (const client of clients) {
      client.closed = true;
      try {
        client.res.end();
      } catch {
        /* ignore */
      }
    }
    clients.clear();
    stopTimersIfIdle();
  }

  return Object.freeze({
    handleStreamRequest,
    notifyEvolutionChanged,
    closeAll,
    getClientCount: () => clients.size
  });
}

module.exports = Object.freeze({
  buildRecentEvolutionsFeed,
  createEvolutionsStreamHub
});
