'use strict';

/**
 * ============================================================================
 * NOUSGENT Real-Time Evolutions Streamable HTTP Hub (`server/evolutions-stream-hub.js`)
 * - Streams newline-delimited JSON (`application/x-ndjson; charset=utf-8`)
 *   with `X-Accel-Buffering: no` so NGINX Ingress flushes frames immediately
 *   without breaking static/OpenGraph `Content-Length` responses.
 * - Pushes real-time evolution frames on:
 *   1. Local pod mutations (Teach mint, Evolve promote, DAO proposal/vote, Two-Key sign-off)
 *   2. Sibling StatefulSet pod CRDT syncs (`/api/internal/peer-sync`)
 *   3. Upstream `dbrain.to` Morphic Field generation / `.dig` capsule changes
 * - Emits 15s keepalive heartbeat frames so connections never hit NGINX's 60s
 *   `proxy-read-timeout`.
 * ============================================================================
 */

const crypto = require('node:crypto');

function computeEvolutionsDigest(payload) {
  const compact = {
    gen: payload.dbrainGeneration,
    total: payload.liveCapsulesTotal,
    caps: (payload.recentCapsules || []).map((c) => `${c.id}:${c.generation}:${c.priceDig || ''}`),
    missions: (payload.missions || []).map(
      (m) =>
        `${m.missionId}:${m.status}:${m.quorumSignatures}:${m.dao?.votesForMojos || '0'}:${m.dao?.votesAgainstMojos || '0'}`
    )
  };
  return crypto.createHash('sha256').update(JSON.stringify(compact), 'utf8').digest('hex').slice(0, 20);
}

function createEvolutionsStreamHub({ engine, liveClient, pollIntervalMs = 3500, heartbeatIntervalMs = 15000 } = {}) {
  const clients = new Set();
  let lastDigest = '';
  let pollTimer = null;
  let heartbeatTimer = null;
  let broadcastInFlight = null;
  let seqCounter = 0;

  async function buildEvolutionsPayload({ forceRefresh = false, reason = 'snapshot' } = {}) {
    if (forceRefresh && liveClient && typeof liveClient.invalidateCache === 'function') {
      liveClient.invalidateCache();
    }
    const liveEco = liveClient ? await liveClient.getLiveSnapshot({ forceRefresh }) : {};
    const dbrain = (liveEco && liveEco.dbrain) || {};
    const missions = engine && typeof engine.listMissions === 'function' ? engine.listMissions() : [];
    const payload = {
      type: 'evolutions',
      reason,
      ts: new Date().toISOString(),
      dbrainGeneration: Number(dbrain.primaryGeneration || 0),
      liveCapsulesTotal: Number(dbrain.liveCapsulesTotal || 0),
      verifiedDataLayerRoot: String(dbrain.verifiedMerkleRoot || ''),
      recentCapsules: Array.isArray(dbrain.recentCapsules) ? dbrain.recentCapsules : [],
      missions
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
        void checkAndBroadcast({ forceRefresh: true, reason: 'morphic_poll', onlyIfChanged: true });
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

  async function checkAndBroadcast({ forceRefresh = false, reason = 'update', onlyIfChanged = false } = {}) {
    if (clients.size === 0) return false;
    if (broadcastInFlight) return broadcastInFlight;

    broadcastInFlight = (async () => {
      try {
        const { payload, digest } = await buildEvolutionsPayload({ forceRefresh, reason });
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
      }
    })();

    return broadcastInFlight;
  }

  function notifyEvolutionChanged(reason = 'mutation', { forceUpstreamRefresh = false } = {}) {
    if (forceUpstreamRefresh && liveClient && typeof liveClient.invalidateCache === 'function') {
      liveClient.invalidateCache();
    }
    if (clients.size === 0) return;
    void checkAndBroadcast({
      forceRefresh: forceUpstreamRefresh,
      reason,
      onlyIfChanged: false
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
  createEvolutionsStreamHub
});
