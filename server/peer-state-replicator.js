'use strict';

/**
 * ============================================================================
 * NOUSGENT Intra-StatefulSet SQLite WAL CRDT Replicator (`server/peer-state-replicator.js`)
 * - Eliminates split-brain state divergence across StatefulSet replicas (`nousgent-web-0..N`),
 *   where each pod mounts an isolated `ReadWriteOnce` SQLite PVC.
 * - Discovers sibling pods via Kubernetes headless Service DNS (`NOUSGENT_PEER_HEADLESS_DNS`)
 *   or explicit `NOUSGENT_PEER_URLS`, authenticating every frame with `HMAC-SHA256`
 *   using `NOUSGENT_SIGNING_SECRET` (`Secret/nousgent-secrets`).
 * - Performs eager write push (`broadcastLocalMutation`) before mutating HTTP responses return,
 *   plus startup and periodic anti-entropy full reconciliation (`reconcileWithPeers`).
 * ============================================================================
 */

const crypto = require('node:crypto');
const dns = require('node:dns');
const http = require('node:http');
const https = require('node:https');
const os = require('node:os');

const PLACEHOLDER_SECRET = 'REPLACE_AT_DEPLOY_TIME_WITH_256_BIT_CSPRNG';
const MAX_CLOCK_SKEW_MS = 60_000;

function sha256Hex(rawStr) {
  return crypto.createHash('sha256').update(String(rawStr || ''), 'utf8').digest('hex');
}

function getLocalIpv4Set() {
  const out = new Set(['127.0.0.1', '0.0.0.0']);
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    if (!Array.isArray(entries)) continue;
    for (const net of entries) {
      if (net && (net.family === 'IPv4' || net.family === 4) && net.address) {
        out.add(net.address);
      }
    }
  }
  return out;
}

function createPeerStateReplicator(options = {}) {
  const engine = options.engine;
  const env = options.env || process.env;
  const onPeerMerged = typeof options.onPeerMerged === 'function' ? options.onPeerMerged : null;
  const getLocalPort = typeof options.getLocalPort === 'function' ? options.getLocalPort : () => Number(env.PORT || 3000);
  const podId = String(env.NOUSGENT_POD_ID || os.hostname() || 'nousgent-web-local').trim();
  const signingSecret = String(env.NOUSGENT_SIGNING_SECRET || '').trim();
  const headlessDns = String(env.NOUSGENT_PEER_HEADLESS_DNS || '').trim();
  const peerPort = Number(env.NOUSGENT_PEER_PORT || env.PORT || 3000);
  const explicitPeers = String(env.NOUSGENT_PEER_URLS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const secretValid = signingSecret.length >= 16 && signingSecret !== PLACEHOLDER_SECRET;
  const enabled = Boolean(engine) && secretValid && Boolean(headlessDns || explicitPeers.length > 0);

  let intervalHandle = null;
  const startupTimers = [];

  function signPeerRequest(method, timestampStr, rawBodyStr = '') {
    const bodyDigest = sha256Hex(rawBodyStr);
    return crypto
      .createHmac('sha256', signingSecret)
      .update(`${String(method).toUpperCase()}:${timestampStr}:${bodyDigest}`, 'utf8')
      .digest('hex');
  }

  function verifyPeerRequest(req, rawBodyStr = '') {
    if (!secretValid) return false;
    const tsHeader = String(req.headers['x-nousgent-peer-timestamp'] || '').trim();
    const sigHeader = String(req.headers['x-nousgent-peer-signature'] || '').trim().toLowerCase();
    if (!/^\d{10,16}$/.test(tsHeader) || !/^[0-9a-f]{64}$/.test(sigHeader)) {
      return false;
    }
    const tsMs = Number(tsHeader);
    if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > MAX_CLOCK_SKEW_MS) {
      return false;
    }
    const expectedHex = signPeerRequest(req.method || 'GET', tsHeader, rawBodyStr);
    return crypto.timingSafeEqual(Buffer.from(sigHeader, 'hex'), Buffer.from(expectedHex, 'hex'));
  }

  async function resolveSiblingBaseUrls() {
    if (!enabled) return [];
    const localPort = getLocalPort();
    const urls = new Set();

    for (const base of explicitPeers) {
      try {
        const parsed = new URL(base);
        const effPort = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80));
        const isLoopbackSelf =
          (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') && effPort === localPort;
        if (!isLoopbackSelf) {
          urls.add(base);
        }
      } catch {
        /* ignore malformed explicit peer URL */
      }
    }

    if (headlessDns) {
      try {
        const ips = await dns.promises.resolve4(headlessDns);
        const selfIps = getLocalIpv4Set();
        for (const ip of ips) {
          if (!selfIps.has(ip)) {
            urls.add(`http://${ip}:${peerPort}`);
          }
        }
      } catch {
        /* headless DNS may transiently have 0 ready records during initial rollout */
      }
    }

    return [...urls];
  }

  function sendSignedPeerHttp(baseUrl, method, bodyObj = null, timeoutMs = 1200) {
    return new Promise((resolve) => {
      try {
        const target = new URL('/api/internal/peer-sync', baseUrl);
        const lib = target.protocol === 'https:' ? https : http;
        const rawBody = bodyObj ? JSON.stringify(bodyObj) : '';
        const tsStr = String(Date.now());
        const sigHex = signPeerRequest(method, tsStr, rawBody);

        const req = lib.request(
          {
            protocol: target.protocol,
            hostname: target.hostname,
            port: target.port || (target.protocol === 'https:' ? 443 : 80),
            path: target.pathname,
            method,
            timeout: timeoutMs,
            headers: {
              'X-Nousgent-Peer-Id': podId,
              'X-Nousgent-Peer-Timestamp': tsStr,
              'X-Nousgent-Peer-Signature': sigHex,
              ...(rawBody
                ? {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': String(Buffer.byteLength(rawBody))
                  }
                : {})
            }
          },
          (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
                } catch {
                  resolve(null);
                }
              } else {
                resolve(null);
              }
            });
          }
        );
        req.on('timeout', () => {
          req.destroy();
          resolve(null);
        });
        req.on('error', () => resolve(null));
        if (rawBody) req.write(rawBody);
        req.end();
      } catch {
        resolve(null);
      }
    });
  }

  async function broadcastLocalMutation(meta = {}) {
    if (!enabled) return { syncedPeers: 0 };
    const peers = await resolveSiblingBaseUrls();
    if (peers.length === 0) return { syncedPeers: 0 };
    const payload = {
      podId,
      reason: String(meta.reason || 'peer_sync'),
      forceUpstreamRefresh: Boolean(meta.forceUpstreamRefresh),
      snapshot: engine.exportReplicaSnapshot()
    };
    const results = await Promise.all(peers.map((peerUrl) => sendSignedPeerHttp(peerUrl, 'POST', payload, 1500)));
    return {
      syncedPeers: results.filter(Boolean).length
    };
  }

  async function reconcileWithPeers() {
    if (!enabled) return { pulledPeers: 0, pushedPeers: 0 };
    const peers = await resolveSiblingBaseUrls();
    if (peers.length === 0) return { pulledPeers: 0, pushedPeers: 0 };

    const pulled = await Promise.all(peers.map((peerUrl) => sendSignedPeerHttp(peerUrl, 'GET', null, 1500)));
    let pulledPeers = 0;
    for (const item of pulled) {
      if (item && item.snapshot) {
        engine.mergeReplicaSnapshot(item.snapshot);
        pulledPeers += 1;
      }
    }
    if (pulledPeers > 0 && onPeerMerged) {
      onPeerMerged({ reason: 'peer_anti_entropy', forceUpstreamRefresh: false });
    }

    const convergedPayload = {
      podId,
      reason: 'peer_anti_entropy',
      forceUpstreamRefresh: false,
      snapshot: engine.exportReplicaSnapshot()
    };
    const pushed = await Promise.all(
      peers.map((peerUrl) => sendSignedPeerHttp(peerUrl, 'POST', convergedPayload, 1500))
    );
    return {
      pulledPeers,
      pushedPeers: pushed.filter(Boolean).length
    };
  }

  function startBackgroundSync(intervalMs = 10_000) {
    if (!enabled || intervalHandle) return;
    for (const delayMs of [1000, 5000]) {
      const t = setTimeout(() => {
        void reconcileWithPeers();
      }, delayMs);
      t.unref?.();
      startupTimers.push(t);
    }
    intervalHandle = setInterval(() => {
      void reconcileWithPeers();
    }, intervalMs);
    intervalHandle.unref?.();
  }

  function stopBackgroundSync() {
    for (const t of startupTimers.splice(0)) {
      clearTimeout(t);
    }
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  }

  return Object.freeze({
    podId,
    enabled,
    verifyPeerRequest,
    broadcastLocalMutation,
    reconcileWithPeers,
    startBackgroundSync,
    stopBackgroundSync
  });
}

module.exports = Object.freeze({
  createPeerStateReplicator
});
