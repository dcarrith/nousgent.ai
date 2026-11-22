'use strict';

/**
 * Live Ecosystem Telemetry & Cross-Organ Pipeline Client (`nousgent.ai` v1.7.0)
 *
 * Connects directly to the live sister platforms with ZERO synthetic/fake fallback numbers:
 *   1. dbrain.to       (`DBRAIN_UPSTREAM_URL` -> `https://dbrain.to`)
 *   2. dthalamus.to    (`DTHALAMUS_UPSTREAM_URL` -> `https://dthalamus.to`)
 *   3. dolfactory.to   (`DOLFACTORY_UPSTREAM_URL` -> `https://dolfactory.to`)
 *   4. cbrain.to       (`CBRAIN_UPSTREAM_URL` -> `https://cbrain.to`)
 *   5. liquidi.sh      (`LIQUIDISH_UPSTREAM_URL` with `Host: liquidi.sh` -> `https://liquidi.sh`)
 *   6. shi.liquidi.sh  (`SHI_LIQUIDISH_UPSTREAM_URL` with `Host: shi.liquidi.sh` -> `https://shi.liquidi.sh`)
 */

const http = require('node:http');
const https = require('node:https');
const zlib = require('node:zlib');

const RFC5737_TEST_FIXTURE_RE = /(?:198\.51\.100\.|203\.0\.113\.|192\.0\.2\.)/;

function trimTrailingSlash(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function buildCandidateTargets(clusterEnvUrl, publicOrigin, hostHeader = '') {
  const candidates = [];
  const cleanCluster = trimTrailingSlash(clusterEnvUrl);
  const cleanPublic = trimTrailingSlash(publicOrigin);
  if (cleanCluster) {
    candidates.push({
      baseUrl: cleanCluster,
      headers: hostHeader ? { Host: hostHeader } : {}
    });
  }
  if (cleanPublic && cleanPublic !== cleanCluster) {
    candidates.push({
      baseUrl: cleanPublic,
      headers: {}
    });
  }
  return candidates;
}

function singleHttpJsonRequest(baseUrl, pathAndQuery, { method = 'GET', headers = {}, bodyStr, timeoutMs = 1800 }) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(pathAndQuery, `${baseUrl}/`);
    const transport = parsed.protocol === 'https:' ? https : http;
    const reqHeaders = {
      Accept: 'application/json',
      'Accept-Encoding': 'identity',
      ...(bodyStr !== undefined
        ? {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyStr, 'utf8')
          }
        : {}),
      ...headers
    };

    const req = transport.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method,
        headers: reqHeaders,
        timeout: timeoutMs
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          try {
            let raw = Buffer.concat(chunks);
            const enc = String(res.headers['content-encoding'] || '').toLowerCase();
            if (enc === 'gzip') raw = zlib.gunzipSync(raw);
            else if (enc === 'deflate') raw = zlib.inflateSync(raw);
            resolve(JSON.parse(raw.toString('utf8')));
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('Upstream request timeout'));
    });
    req.on('error', reject);
    if (bodyStr !== undefined) req.write(bodyStr);
    req.end();
  });
}

async function fetchJsonWithFallback(candidates, pathAndQuery, options = {}) {
  const timeoutMs = Number(options.timeoutMs || 1800);
  const method = options.method || 'GET';
  const bodyStr = options.body !== undefined ? JSON.stringify(options.body) : undefined;

  for (const cand of candidates) {
    const started = performance.now();
    try {
      const data = await singleHttpJsonRequest(cand.baseUrl, pathAndQuery, {
        method,
        headers: { ...cand.headers, ...(options.headers || {}) },
        bodyStr,
        timeoutMs
      });
      const latencyMs = Number((performance.now() - started).toFixed(2));
      return { ok: true, data, latencyMs, sourceBaseUrl: cand.baseUrl };
    } catch {
      /* try next candidate (e.g. public HTTPS when running outside K8s cluster) */
    }
  }
  return { ok: false, data: null, latencyMs: 0, sourceBaseUrl: null };
}

function formatNetspaceLabel(spaceBytes) {
  const n = Number(spaceBytes || 0);
  if (!Number.isFinite(n) || n <= 0) return '0 TiB';
  const tib = n / Math.pow(1024, 4);
  if (tib >= 1024) {
    return `${(tib / 1024).toFixed(2)} PiB`;
  }
  return `${tib.toFixed(1)} TiB`;
}

function createLiveEcosystemClient(env = process.env) {
  const offlineTest = env.NOUSGENT_OFFLINE_TEST === '1';

  const targets = {
    dbrain: offlineTest
      ? []
      : buildCandidateTargets(env.DBRAIN_UPSTREAM_URL, env.DBRAIN_ORIGIN || 'https://dbrain.to'),
    dthalamus: offlineTest
      ? []
      : buildCandidateTargets(env.DTHALAMUS_UPSTREAM_URL, env.DTHALAMUS_ORIGIN || 'https://dthalamus.to'),
    dolfactory: offlineTest
      ? []
      : buildCandidateTargets(env.DOLFACTORY_UPSTREAM_URL, env.DOLFACTORY_ORIGIN || 'https://dolfactory.to'),
    cbrain: offlineTest
      ? []
      : buildCandidateTargets(env.CBRAIN_UPSTREAM_URL, env.CBRAIN_ORIGIN || 'https://cbrain.to'),
    liquidish: offlineTest
      ? []
      : buildCandidateTargets(env.LIQUIDISH_UPSTREAM_URL, 'https://liquidi.sh', 'liquidi.sh'),
    shi: offlineTest
      ? []
      : buildCandidateTargets(
          env.SHI_LIQUIDISH_UPSTREAM_URL || env.LIQUIDISH_UPSTREAM_URL,
          env.LIQUIDISH_ORIGIN || 'https://shi.liquidi.sh',
          'shi.liquidi.sh'
        )
  };

  let cachedSnapshot = null;
  let cachedAtMs = 0;
  let inflightPromise = null;
  const cacheTtlMs = Number(env.NOUSGENT_UPSTREAM_CACHE_MS || 5000);

  function invalidateCache() {
    cachedAtMs = 0;
  }

  async function pullFreshSnapshot() {
    const [
      dbrainStatusRes,
      dbrainStoresRes,
      dbrainCapsulesRes,
      dthalamusStatusRes,
      dolfactoryStatusRes,
      cbrainChronRes,
      liquidishStateRes,
      liquidishOrderbookRes,
      shiTelemetryRes
    ] = await Promise.all([
      fetchJsonWithFallback(targets.dbrain, '/api/dbrain/status', { timeoutMs: 2000 }),
      fetchJsonWithFallback(targets.dbrain, '/api/dbrain/stores', { timeoutMs: 2000 }),
      fetchJsonWithFallback(targets.dbrain, '/api/dbrain/capsules?limit=8', { timeoutMs: 2000 }),
      fetchJsonWithFallback(targets.dthalamus, '/api/dthalamus/status', { timeoutMs: 1800 }),
      fetchJsonWithFallback(targets.dolfactory, '/api/dolfactory/status', { timeoutMs: 1800 }),
      fetchJsonWithFallback(targets.cbrain, '/api/cbrain/chronology', { timeoutMs: 1800 }),
      fetchJsonWithFallback(targets.liquidish, '/api/liquidish/state', { timeoutMs: 2000 }),
      fetchJsonWithFallback(targets.liquidish, '/api/liquidish/orderbook?syncLive=1&projection=compact', {
        timeoutMs: 2500
      }),
      fetchJsonWithFallback(targets.shi, '/api/liquidish/shi-telemetry?host=shi.liquidi.sh', { timeoutMs: 1800 })
    ]);

    const dbStat = dbrainStatusRes.data || {};
    const allStores = Array.isArray(dbrainStoresRes.data?.stores) ? dbrainStoresRes.data.stores : [];
    // Exclude RFC-5737 documentation/load-test IP fixtures (198.51.100.*, 203.0.113.*, 192.0.2.*)
    const realSovereignStores = allStores.filter((s) => !RFC5737_TEST_FIXTURE_RE.test(String(s?.name || '')));
    const primaryStore =
      realSovereignStores.find((s) => s.storeId === dbStat.primaryStoreId) ||
      realSovereignStores[0] ||
      null;

    const rawCapsules = Array.isArray(dbrainCapsulesRes.data?.capsules) ? dbrainCapsulesRes.data.capsules : [];
    const orderbookCapsules = Array.isArray(liquidishOrderbookRes.data?.capsules)
      ? liquidishOrderbookRes.data.capsules
      : [];
    const priceByCapId = new Map();
    for (const item of orderbookCapsules) {
      if (item && item.dbrainCapsuleId) {
        priceByCapId.set(String(item.dbrainCapsuleId), item);
      }
    }

    const recentCapsules = rawCapsules.slice(0, 6).map((c) => {
      const market = priceByCapId.get(String(c.id));
      const priceDig = market?.priceDig !== undefined ? `${Number(market.priceDig).toFixed(3)} $DIG` : null;
      return {
        id: String(c.id || ''),
        title: String(c.title || c.key || 'Untitled Capsule'),
        lobe: String(c.lobe || 'semantic'),
        storeId: String(c.storeId || dbStat.primaryStoreId || ''),
        generation: Number(c.generation || primaryStore?.generation || 0),
        merkleRoot: String(c.merkleRoot || primaryStore?.merkleRoot || ''),
        priceDig,
        capsuleUrl: `https://dbrain.to/dig/${encodeURIComponent(String(c.id || ''))}.json`
      };
    });

    const dtStat = dthalamusStatusRes.data || {};
    const dolfStat = dolfactoryStatusRes.data || {};
    const cbStat = cbrainChronRes.data || {};
    const liqStat = liquidishStateRes.data || {};
    const shiStat = shiTelemetryRes.data || {};

    const dbrainLive = {
      reachable: dbrainStatusRes.ok,
      origin: 'https://dbrain.to',
      latencyMs: dbrainStatusRes.latencyMs,
      version: String(dbStat.version || ''),
      protocol: String(dbStat.protocol || ''),
      network: String(dbStat.network || ''),
      peakHeight: Number(dbStat.peakHeight || 0),
      peakHash: String(dbStat.peakHash || ''),
      netspaceBytes: Number(dbStat.space || 0),
      netspaceLabel: formatNetspaceLabel(dbStat.space),
      synced: Boolean(dbStat.synced),
      liveNode: Boolean(dbStat.liveNode),
      primaryStoreId: String(dbStat.primaryStoreId || ''),
      primaryGeneration: Number(primaryStore?.generation || 0),
      verifiedMerkleRoot: String(primaryStore?.merkleRoot || ''),
      l1DiscoveredStoresTotal: Number(dbStat.l1DiscoveredStoresTotal || 0),
      activeMorphicBrainsCount: realSovereignStores.length,
      rawRuntimeStoresTotal: Number(dbStat.totalStores || allStores.length || 0),
      liveCapsulesTotal: Number(dbrainCapsulesRes.data?.total ?? dbStat.seededCapsulesCount ?? 0),
      activeStores: realSovereignStores.slice(0, 8).map((s) => ({
        storeId: String(s.storeId || ''),
        name: String(s.name || ''),
        source: String(s.source || 'dbrain-merkle-wal'),
        generation: Number(s.generation || 0),
        merkleRoot: String(s.merkleRoot || ''),
        lastUpdatedBlock: Number(s.lastUpdatedBlock || 0)
      })),
      recentCapsules
    };

    const dthalamusLive = {
      reachable: dthalamusStatusRes.ok,
      origin: 'https://dthalamus.to',
      latencyMs: dthalamusStatusRes.latencyMs,
      version: String(dtStat.version || ''),
      strictMode: Boolean(dtStat.monitor?.strictMode),
      policyHash: String(dtStat.monitor?.policyHash || ''),
      activeLeasesCount: Number(dtStat.monitor?.activeLeasesCount || 0),
      activeAntibodiesCount: Number(dtStat.monitor?.activeAntibodiesCount || 0),
      totalInspections: Number(dtStat.ingressStats?.totalInspections || 0),
      blockedCount: Number(dtStat.ingressStats?.blockedCount || 0),
      governedCallsTotal: Number(dtStat.governorStats?.totalGovernedCalls || 0),
      savedTokensTotal: Number(dtStat.governorStats?.savedTokensTotal || 0),
      ratchetPassed: Boolean(dtStat.regressionRatchet?.passed),
      ratchetCasesPassed: Number(dtStat.regressionRatchet?.passedCases || 0),
      ratchetCasesTotal: Number(dtStat.regressionRatchet?.totalCases || 0)
    };

    const dolfactoryLive = {
      reachable: dolfactoryStatusRes.ok,
      origin: 'https://dolfactory.to',
      latencyMs: dolfactoryStatusRes.latencyMs,
      version: String(dolfStat.version || ''),
      protocol: String(dolfStat.protocol || ''),
      totalReceptors: Number(dolfStat.receptorStats?.totalReceptors ?? dolfStat.receptors?.length ?? 0),
      inlineIpsReceptors: Number(dolfStat.receptorStats?.inlineIpsReceptors || 0),
      shadowIdsReceptors: Number(dolfStat.receptorStats?.shadowIdsReceptors || 0),
      imprintedOdorsCount: Number(dolfStat.imprintedOdors?.length || 0),
      totalSniffs: Number(dolfStat.telemetry?.totalSniffs || 0),
      auditHeadHash: String(dolfStat.telemetry?.auditChain?.headHash || '')
    };

    const cbrainLive = {
      reachable: cbrainChronRes.ok,
      origin: 'https://cbrain.to',
      latencyMs: cbrainChronRes.latencyMs,
      cbrainProtocol: String(cbStat.cbrainProtocol || ''),
      wasmSpatialVerified: Boolean(cbStat.wasmSpatialVerified),
      coherencePct: Number(cbStat.driftAudit?.coherencePct || 0)
    };

    const liquidishLive = {
      reachable: liquidishStateRes.ok,
      shiReachable: shiTelemetryRes.ok,
      origin: 'https://liquidi.sh',
      shiOrigin: 'https://shi.liquidi.sh',
      latencyMs: liquidishStateRes.latencyMs || shiTelemetryRes.latencyMs,
      version: String(liqStat.version || ''),
      dataPolicy: String(liqStat.dataPolicy || ''),
      liveCapsulesListed: Number(liqStat.metrics?.liveCapsulesCount || 0),
      orderbookAvailableCount: Number(liquidishOrderbookRes.data?.totalAvailable ?? liqStat.metrics?.liveCapsulesCount ?? 0),
      settledSwapsCount: Number(liqStat.metrics?.settledSwapsCount || 0),
      stakedAntibodyTvlDig: Number(liqStat.metrics?.stakedAntibodyTvlDig || 0),
      royaltiesStreamedDig: String(liqStat.metrics?.royaltiesStreamedDig || '0.000 $DIG'),
      royaltiesStreamedDigNum: Number(liqStat.metrics?.royaltiesStreamedDigNum || 0),
      dreamSurvivingVerifiedCount: Number(
        liqStat.dreamAndBootstrap?.dreamConsolidation?.survivingVerifiedCount || 0
      ),
      dreamSynthesizedAntibodiesCount: Number(
        liqStat.dreamAndBootstrap?.dreamConsolidation?.synthesizedAntibodies?.length || 0
      ),
      shiActivePlane: String(shiStat.activePlane || ''),
      shiM2mRequestsCount: Number(shiStat.telemetryIsolation?.m2mRequestsCount || 0),
      shiHumanRequestsCount: Number(shiStat.telemetryIsolation?.humanRequestsCount || 0),
      shiM2mTrafficSharePct: Number(shiStat.telemetryIsolation?.m2mTrafficSharePct || 0)
    };

    const organsReachableCount = [
      dolfactoryLive.reachable,
      dthalamusLive.reachable,
      dbrainLive.reachable,
      cbrainLive.reachable,
      liquidishLive.reachable || liquidishLive.shiReachable
    ].filter(Boolean).length;

    return {
      fetchedAt: new Date().toISOString(),
      organsReachableCount,
      dolfactory: dolfactoryLive,
      dthalamus: dthalamusLive,
      dbrain: dbrainLive,
      cbrain: cbrainLive,
      liquidish: liquidishLive
    };
  }

  async function getLiveSnapshot({ forceRefresh = false } = {}) {
    const now = Date.now();
    if (!forceRefresh && cachedSnapshot && now - cachedAtMs < cacheTtlMs) {
      return cachedSnapshot;
    }
    if (!inflightPromise) {
      inflightPromise = pullFreshSnapshot()
        .then((snap) => {
          cachedSnapshot = snap;
          cachedAtMs = Date.now();
          inflightPromise = null;
          return snap;
        })
        .catch((err) => {
          inflightPromise = null;
          throw err;
        });
    }
    return inflightPromise;
  }

  async function runLiveOrganPromptPipeline(promptText) {
    const cleanPrompt = String(promptText || '').trim();
    if (!cleanPrompt || offlineTest) {
      return {
        recalledCapsules: [],
        dolfactoryLiveSniff: null,
        dthalamusLiveGate: null,
        liquidishAutoQuote: null,
        ecosystem: await getLiveSnapshot()
      };
    }

    const [sniffRes, gateRes, mcpRecallRes, quoteRes, ecosystem] = await Promise.all([
      fetchJsonWithFallback(targets.dolfactory, '/api/dolfactory/sniff', {
        method: 'POST',
        body: {
          rawText: cleanPrompt.slice(0, 1200),
          plane: 'orthonasal_ingress',
          sessionId: 'nousgent-mind-arena',
          taskPhase: 'REASONING',
          originTrust: 'UNTRUSTED_WEB'
        },
        timeoutMs: 1400
      }),
      fetchJsonWithFallback(targets.dthalamus, '/api/dthalamus/quarantine', {
        method: 'POST',
        body: {
          rawText: cleanPrompt.slice(0, 1200),
          origin: 'https://nousgent.ai/ask'
        },
        timeoutMs: 1400
      }),
      fetchJsonWithFallback(targets.dbrain, '/api/mcp', {
        method: 'POST',
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'dbrain_recall',
            arguments: { query: cleanPrompt.slice(0, 280), limit: 4 }
          }
        },
        timeoutMs: 1500
      }),
      fetchJsonWithFallback(targets.shi, '/api/liquidish/pricing/auto', {
        method: 'POST',
        body: {
          title: cleanPrompt.slice(0, 96),
          content: cleanPrompt.slice(0, 400),
          lobe: 'semantic',
          derivationTokens: 12000,
          turnsToDerive: 2
        },
        timeoutMs: 1400
      }),
      getLiveSnapshot()
    ]);

    // Since sniff & quarantine mutated upstream telemetry counters, refresh cache on next status read
    invalidateCache();

    const recalledCapsules = Array.isArray(mcpRecallRes.data?.result?.structuredContent?.capsules)
      ? mcpRecallRes.data.result.structuredContent.capsules
      : [];

    return {
      recalledCapsules,
      dbrainRecallLatencyMs: mcpRecallRes.ok ? mcpRecallRes.latencyMs : null,
      dolfactoryLiveSniff: sniffRes.ok
        ? { latencyMs: sniffRes.latencyMs, result: sniffRes.data?.result || null }
        : null,
      dthalamusLiveGate: gateRes.ok
        ? { latencyMs: gateRes.latencyMs, gate: gateRes.data?.gate || null }
        : null,
      liquidishAutoQuote: quoteRes.ok
        ? { latencyMs: quoteRes.latencyMs, quote: quoteRes.data || null }
        : null,
      ecosystem
    };
  }

  return Object.freeze({
    getLiveSnapshot,
    runLiveOrganPromptPipeline,
    invalidateCache
  });
}

module.exports = Object.freeze({
  formatNetspaceLabel,
  createLiveEcosystemClient
});
