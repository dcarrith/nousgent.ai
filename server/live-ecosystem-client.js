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
const { estimateCapsuleIntelligenceGain } = require('../lib/modules/morphic-mesh-and-missions.js');
const { detectSpecializations } = require('../lib/modules/pod-bay-redteam.js');

const RFC5737_TEST_FIXTURE_RE = /(?:198[.-]51[.-]100[.-]|203[.-]0[.-]113[.-]|192[.-]0[.-]2[.-])/;
const INTERNAL_UI_RUNBOOK_RE = /\b(morphattributes|morphtargetinfluences|facebookexternalhit|renderorder)\b/i;

function parseCapsuleTelemetryTags(tags) {
  let derivationTokens = 0;
  let turns = 0;
  if (!Array.isArray(tags)) return { derivationTokens, turns };
  for (const raw of tags) {
    const t = String(raw || '').trim();
    if (t.startsWith('derivation-tokens:')) {
      const n = Number(t.slice('derivation-tokens:'.length));
      if (Number.isFinite(n) && n > 0) derivationTokens += Math.round(n);
    } else if (t.startsWith('turns:')) {
      const n = Number(t.slice('turns:'.length));
      if (Number.isFinite(n) && n > 0) turns += Math.round(n);
    }
  }
  return { derivationTokens, turns };
}

function buildEcosystemLeaderboards({ realSovereignStores = [], rawCapsules = [], orderbookCapsules = [], liveCapsulesTotal = 0 }) {
  // Exclude synthetic M6_CIVIC_ARCHETYPE demo rows from liquidi.sh so 100% of leaderboard data is live cluster provenance
  const liveOrderbook = orderbookCapsules.filter(
    (item) => item && (!item.capsuleOrigin || item.capsuleOrigin === 'LIVE_DBRAIN_CLUSTER')
  );

  const sampledCapsulesByStore = new Map();
  const sampledCapsuleIdsWithTokens = new Set();
  const distinctAgentHandles = new Set();

  const didMap = new Map();
  function ensureDidEntry(did, fallbackRole = 'Sovereign Chia DID') {
    const cleanDid = String(did || '').trim();
    if (!cleanDid) return null;
    let entry = didMap.get(cleanDid);
    if (!entry) {
      entry = {
        did: cleanDid,
        role: fallbackRole,
        agentHandles: new Set(),
        communityNames: new Set(),
        storesGovernedCount: 0,
        storeCapsulesTotal: 0,
        sampledCapsulesAuthored: 0,
        commitCapsulesDelta: 0,
        generationsCommitted: 0,
        liquidishListingsCount: 0,
        marketValueDig: 0,
        derivationTokens: 0,
        citizenCallsign: '',
        stateCode: '',
        citizenXp: 0
      };
      didMap.set(cleanDid, entry);
    }
    return entry;
  }

  for (const c of rawCapsules) {
    if (!c) continue;
    const stId = String(c.storeId || '');
    if (stId) {
      sampledCapsulesByStore.set(stId, (sampledCapsulesByStore.get(stId) || 0) + 1);
    }
    const authorObj = c.authorAgent && typeof c.authorAgent === 'object' ? c.authorAgent : null;
    const authorDid = String(authorObj?.did || c.authorDid || c.clearSignature?.signerDid || '').trim();
    const agentName = String(authorObj?.name || (typeof c.authorAgent === 'string' ? c.authorAgent : '') || '').trim();
    if (agentName) distinctAgentHandles.add(agentName);
    const { derivationTokens } = parseCapsuleTelemetryTags(c.tags);
    if (derivationTokens > 0 && c.id) {
      sampledCapsuleIdsWithTokens.add(String(c.id));
    }
    const dEntry = ensureDidEntry(authorDid, 'Capsule Author DID');
    if (dEntry) {
      dEntry.sampledCapsulesAuthored += 1;
      dEntry.derivationTokens += derivationTokens;
      if (agentName) dEntry.agentHandles.add(agentName);
    }
  }

  const orderbookByStore = new Map();
  let totalListedValueDig = 0;
  for (const item of liveOrderbook) {
    const stId = String(item.storeId || '');
    const price = Number.isFinite(Number(item.priceDig)) ? Number(item.priceDig) : 0;
    const autoTokens = Number(item.autoPricing?.effectiveDerivationTokens || 0);
    totalListedValueDig += price;
    if (stId) {
      const cur = orderbookByStore.get(stId) || { count: 0, valueDig: 0, derivationTokens: 0 };
      cur.count += 1;
      cur.valueDig += price;
      cur.derivationTokens += Number.isFinite(autoTokens) && autoTokens > 0 ? autoTokens : 0;
      orderbookByStore.set(stId, cur);
    }
    const cDid = ensureDidEntry(item.creatorDid, 'Origin Creator DID');
    if (cDid) {
      cDid.liquidishListingsCount += 1;
      cDid.marketValueDig += price;
      const capId = String(item.dbrainCapsuleId || '');
      if ((!capId || !sampledCapsuleIdsWithTokens.has(capId)) && Number.isFinite(autoTokens) && autoTokens > 0) {
        cDid.derivationTokens += Math.round(autoTokens);
      }
      if (item.storeName) cDid.communityNames.add(String(item.storeName));
    }
  }

  const storeItems = realSovereignStores.map((s) => {
    const storeId = String(s.storeId || '');
    const name = String(s.name || 'Sovereign Brain Store');
    const source = String(s.source || 'dbrain-merkle-wal');
    const generation = Math.max(0, Number(s.generation || 0));
    const verifiedCapsules =
      s.totalCapsules !== undefined && s.totalCapsules !== null
        ? Math.max(0, Number(s.totalCapsules))
        : Number(sampledCapsulesByStore.get(storeId) || 0);
    const obStats = orderbookByStore.get(storeId) || { count: 0, valueDig: 0, derivationTokens: 0 };
    const listedValueDig = Number(obStats.valueDig.toFixed(3));

    const storeDids = new Set();
    if (s.agentDid) {
      const cleanAgentDid = String(s.agentDid).trim();
      storeDids.add(cleanAgentDid);
      const gov = ensureDidEntry(
        cleanAgentDid,
        source === 'chia-l1-datalayer-discovery' ? 'L1 DataLayer Singleton DID' : 'Sovereign Brain Store DID'
      );
      if (gov) {
        gov.role = source === 'chia-l1-datalayer-discovery' ? 'L1 DataLayer Singleton DID' : 'Sovereign Brain Store DID';
        gov.storesGovernedCount += 1;
        gov.storeCapsulesTotal += verifiedCapsules;
        gov.generationsCommitted += generation;
        gov.communityNames.add(name);
      }
    }
    if (Array.isArray(s.generations)) {
      for (const g of s.generations) {
        const gDid = String(g?.authorDid || '').trim();
        if (!gDid) continue;
        storeDids.add(gDid);
        if (gDid !== String(s.agentDid || '').trim()) {
          const co = ensureDidEntry(gDid, 'DataLayer Governance Co-Signer');
          if (co) {
            co.generationsCommitted += 1;
            co.commitCapsulesDelta += Math.max(0, Number(g?.capsulesAdded || 0));
            co.communityNames.add(name);
          }
        }
      }
    }

    const rsiImpactScore = Math.round(
      verifiedCapsules * 10 + generation * 2 + obStats.count * 15 + listedValueDig
    );

    return {
      storeId,
      name,
      slug: String(s.slug || ''),
      source,
      network: String(s.network || ''),
      agentDid: String(s.agentDid || ''),
      ownerAddress: String(s.ownerAddress || ''),
      generation,
      lastUpdatedBlock: Number(s.lastUpdatedBlock || s.blockHeight || 0),
      merkleRoot: String(s.merkleRoot || ''),
      verifiedCapsules,
      listedCapsulesCount: obStats.count,
      listedValueDig,
      sampledDerivationTokens: Math.round(obStats.derivationTokens),
      contributorDidsCount: storeDids.size,
      rsiImpactScore
    };
  });

  const sumStoreCapsules = storeItems.reduce((acc, s) => acc + s.verifiedCapsules, 0);
  const fieldDenominator = Math.max(1, Number(liveCapsulesTotal || 0), sumStoreCapsules);

  const communityLeaderboard = storeItems
    .sort(
      (a, b) =>
        b.rsiImpactScore - a.rsiImpactScore ||
        b.verifiedCapsules - a.verifiedCapsules ||
        b.generation - a.generation ||
        a.name.localeCompare(b.name)
    )
    .map((item, idx) => ({
      rank: idx + 1,
      ...item,
      shareOfFieldPct: Number(Math.min(100, (item.verifiedCapsules / fieldDenominator) * 100).toFixed(1))
    }));

  const baseDidEntries = Array.from(didMap.values()).map((d) => {
    const verifiedCapsules = Math.max(d.storeCapsulesTotal, d.sampledCapsulesAuthored, d.commitCapsulesDelta);
    const marketValueDig = Number(d.marketValueDig.toFixed(3));
    return {
      did: d.did,
      role: d.role,
      agentHandles: Array.from(d.agentHandles),
      communityNames: Array.from(d.communityNames),
      storesGovernedCount: d.storesGovernedCount,
      verifiedCapsules,
      generationsCommitted: d.generationsCommitted,
      liquidishListingsCount: d.liquidishListingsCount,
      marketValueDig,
      derivationTokens: d.derivationTokens,
      citizenCallsign: d.citizenCallsign,
      stateCode: d.stateCode,
      citizenXp: d.citizenXp
    };
  });

  return {
    communityLeaderboard,
    baseDidEntries,
    summary: {
      activeCommunitiesCount: communityLeaderboard.length,
      distinctDidsCount: baseDidEntries.length,
      distinctAgentHandlesCount: distinctAgentHandles.size,
      totalVerifiedCapsules: Math.max(Number(liveCapsulesTotal || 0), sumStoreCapsules),
      totalListedCapsules: liveOrderbook.length,
      totalListedValueDig: Number(totalListedValueDig.toFixed(3))
    }
  };
}

function mergeEnlistedRigsIntoRsiLeaderboard(baseLeaderboard, enlistedRigs = []) {
  const communityLeaderboard = Array.isArray(baseLeaderboard?.communityLeaderboard)
    ? baseLeaderboard.communityLeaderboard
    : [];
  const baseDidEntries = Array.isArray(baseLeaderboard?.baseDidEntries)
    ? baseLeaderboard.baseDidEntries
    : [];

  const mergedByDid = new Map();
  for (const item of baseDidEntries) {
    mergedByDid.set(item.did, {
      ...item,
      agentHandles: [...(item.agentHandles || [])],
      communityNames: [...(item.communityNames || [])]
    });
  }

  for (const rig of enlistedRigs) {
    if (!rig || !rig.did) continue;
    const cleanDid = String(rig.did).trim();
    const existing = mergedByDid.get(cleanDid);
    if (existing) {
      existing.citizenCallsign = existing.citizenCallsign || String(rig.callsign || '');
      existing.stateCode = existing.stateCode || String(rig.stateCode || '');
      existing.citizenXp += Math.max(0, Number(rig.xp || 0));
      if (rig.stateCode) existing.communityNames.push(`${rig.stateCode} State Consortium Pod`);
    } else {
      mergedByDid.set(cleanDid, {
        did: cleanDid,
        role: rig.rank?.title || 'Enlisted Citizen Keyholder',
        agentHandles: rig.callsign ? [String(rig.callsign)] : [],
        communityNames: rig.stateCode ? [`${rig.stateCode} State Consortium Pod`] : [],
        storesGovernedCount: 0,
        verifiedCapsules: 0,
        generationsCommitted: 0,
        liquidishListingsCount: 0,
        marketValueDig: 0,
        derivationTokens: 0,
        citizenCallsign: String(rig.callsign || ''),
        stateCode: String(rig.stateCode || ''),
        citizenXp: Math.max(0, Number(rig.xp || 0))
      });
    }
  }

  const didLeaderboard = Array.from(mergedByDid.values())
    .map((entry) => {
      const rsiImpactScore = Math.round(
        entry.verifiedCapsules * 10 +
          entry.generationsCommitted * 2 +
          entry.liquidishListingsCount * 15 +
          entry.marketValueDig +
          entry.derivationTokens / 2500 +
          entry.citizenXp / 25
      );
      return {
        ...entry,
        communityNames: Array.from(new Set(entry.communityNames)),
        agentHandles: Array.from(new Set(entry.agentHandles)),
        rsiImpactScore
      };
    })
    .sort(
      (a, b) =>
        b.rsiImpactScore - a.rsiImpactScore ||
        b.verifiedCapsules - a.verifiedCapsules ||
        b.liquidishListingsCount - a.liquidishListingsCount ||
        b.citizenXp - a.citizenXp ||
        a.did.localeCompare(b.did)
    )
    .map((entry, idx) => ({
      rank: idx + 1,
      ...entry
    }));

  const baseSummary = baseLeaderboard?.summary || {};
  const totalDerivationTokens = didLeaderboard.reduce((acc, d) => acc + Number(d.derivationTokens || 0), 0);

  return {
    communityLeaderboard,
    didLeaderboard,
    summary: {
      activeCommunitiesCount: Number(baseSummary.activeCommunitiesCount || communityLeaderboard.length),
      distinctDidsCount: didLeaderboard.length,
      distinctAgentHandlesCount: Number(baseSummary.distinctAgentHandlesCount || 0),
      totalVerifiedCapsules: Number(baseSummary.totalVerifiedCapsules || 0),
      totalListedCapsules: Number(baseSummary.totalListedCapsules || 0),
      totalListedValueDig: Number(baseSummary.totalListedValueDig || 0),
      sampledDerivationTokens: totalDerivationTokens
    }
  };
}

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
      fetchJsonWithFallback(targets.dbrain, '/api/dbrain/capsules?limit=100', { timeoutMs: 2200 }),
      fetchJsonWithFallback(targets.dthalamus, '/api/dthalamus/status', { timeoutMs: 1800 }),
      fetchJsonWithFallback(targets.dolfactory, '/api/dolfactory/status?compositional=true', { timeoutMs: 1800 }),
      fetchJsonWithFallback(targets.cbrain, '/api/cbrain/chronology', { timeoutMs: 1800 }),
      fetchJsonWithFallback(targets.liquidish, '/api/liquidish/state', { timeoutMs: 2000 }),
      fetchJsonWithFallback(targets.liquidish, '/api/liquidish/orderbook?projection=compact', {
        timeoutMs: 3200
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

    const seenRecentTitles = new Set();
    const recentCapsules = [];
    for (const c of rawCapsules) {
      if (!c) continue;
      const title = String(c.title || c.key || 'Untitled Capsule').trim();
      const normTitle = title.toLowerCase();
      if (seenRecentTitles.has(normTitle)) continue;
      seenRecentTitles.add(normTitle);
      const market = priceByCapId.get(String(c.id));
      const priceDig = market?.priceDig !== undefined ? `${Number(market.priceDig).toFixed(3)} $DIG` : null;
      const rawDetail = String(c.summary || market?.summary || c.content || '')
        .replace(/\s+/g, ' ')
        .trim();
      const summary = rawDetail.length > 220 ? `${rawDetail.slice(0, 217).trimEnd()}…` : rawDetail;
      recentCapsules.push({
        id: String(c.id || ''),
        title,
        summary,
        lobe: String(c.lobe || 'semantic'),
        authorName: String(c.authorAgent?.name || market?.creatorName || 'Community Node'),
        tags: Array.isArray(c.tags) ? c.tags.slice(0, 4).map((t) => String(t)) : [],
        specializations: detectSpecializations({
          title,
          summary,
          content: c.content,
          tags: c.tags,
          specializations: c.specializations
        }),
        timestamp: String(c.timestamp || c.createdAt || ''),
        storeId: String(c.storeId || dbStat.primaryStoreId || ''),
        generation: Number(c.generation || primaryStore?.generation || 0),
        merkleRoot: String(c.merkleRoot || primaryStore?.merkleRoot || ''),
        priceDig,
        capsuleUrl: `https://dbrain.to/dig/${encodeURIComponent(String(c.id || ''))}.json`
      });
      if (recentCapsules.length >= 10) break;
    }

    const dtStat = dthalamusStatusRes.data || {};
    const dolfStat = dolfactoryStatusRes.data || {};
    const cbStat = cbrainChronRes.data || {};
    const liqStat = liquidishStateRes.data || {};
    const shiStat = shiTelemetryRes.data || {};

    const liveCapsulesTotal = Number(dbrainCapsulesRes.data?.total ?? dbStat.seededCapsulesCount ?? 0);
    const rsiLeaderboardBase = buildEcosystemLeaderboards({
      realSovereignStores,
      rawCapsules,
      orderbookCapsules,
      liveCapsulesTotal
    });

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
      liveCapsulesTotal,
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
      version: String(cbStat.cbrainProtocol || '').includes('@')
        ? String(cbStat.cbrainProtocol).split('@').pop()
        : '',
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
      shiM2mTrafficSharePct: Number(shiStat.telemetryIsolation?.m2mTrafficSharePct || 0),
      autonomousCandidateQueue: orderbookCapsules
        .filter(
          (item) =>
            item &&
            (!item.capsuleOrigin || item.capsuleOrigin === 'LIVE_DBRAIN_CLUSTER') &&
            !INTERNAL_UI_RUNBOOK_RE.test(`${item.title || ''} ${item.summary || ''}`)
        )
        .map((item) => {
          const capId = String(item.dbrainCapsuleId || item.swapId || '');
          const lobe = String(item.lobe || 'semantic').toLowerCase();
          const priceDigNum = Number.isFinite(Number(item.priceDig)) ? Number(item.priceDig) : 10;
          const derivationTokens = Math.max(
            2000,
            Number(item.autoPricing?.effectiveDerivationTokens || 4000)
          );
          const sweBenchLiftPct = Number(item.sweBenchLiftPct || 0);
          const highDriftRisk = String(item.cbrainDriftRisk || '') === 'HIGH_CONTAMINATION_DRIFT';
          const externalStoreBonus =
            item.storeId && dbStat.primaryStoreId && item.storeId !== dbStat.primaryStoreId ? 1.15 : 1.0;
          const baseGain = estimateCapsuleIntelligenceGain({
            liveCapsulesTotal,
            derivationTokens,
            lobe,
            sweBenchLiftPct,
            highDriftRisk
          });
          const estimatedGainPct = Number(Math.min(4.5, baseGain * externalStoreBonus).toFixed(2));
          const gainPer100Dig = Number(((estimatedGainPct / Math.max(1, priceDigNum)) * 100).toFixed(2));
          return {
            capsuleId: capId,
            swapId: String(item.swapId || ''),
            title: String(item.title || capId),
            summary: String(item.summary || '').slice(0, 180),
            lobe,
            specializations: detectSpecializations({
              title: item.title,
              summary: item.summary,
              content: item.content,
              tags: item.tags,
              specializations: item.effectiveSpecializations || item.specializations
            }),
            storeId: String(item.storeId || ''),
            storeName: String(item.storeName || 'Community Brain Store'),
            priceDig: Number(priceDigNum.toFixed(3)),
            priceDigFormatted: `${priceDigNum.toFixed(3)} $DIG`,
            derivationTokens: Math.round(derivationTokens),
            sweBenchLiftPct,
            upstreamCitationsCount: Number(item.upstreamCitationsCount || 0),
            withinAutoAllowance: item.autoPricing?.withinShiDaoAllowanceCap !== false,
            estimatedGainPct,
            gainPer100Dig,
            helpedChecksCount: Math.max(1, Math.round(sweBenchLiftPct > 0 ? sweBenchLiftPct / 3 : 2)),
            hurtChecksCount: 0,
            autoScopedIff: highDriftRisk,
            capsuleUrl: item.dbrainCapsuleId
              ? `https://dbrain.to/dig/${encodeURIComponent(String(item.dbrainCapsuleId))}.json`
              : ''
          };
        })
        .sort(
          (a, b) =>
            b.estimatedGainPct - a.estimatedGainPct ||
            b.gainPer100Dig - a.gainPer100Dig ||
            b.upstreamCitationsCount - a.upstreamCitationsCount
        )
        .slice(0, 12)
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
      liquidish: liquidishLive,
      rsiLeaderboardBase
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
        specializations: [],
        dolfactoryLiveSniff: null,
        dthalamusLiveGate: null,
        liquidishAutoQuote: null,
        ecosystem: await getLiveSnapshot()
      };
    }

    const specializations = detectSpecializations({ rawText: cleanPrompt });

    const [sniffRes, gateRes, mcpRecallRes, quoteRes, ecosystem] = await Promise.all([
      fetchJsonWithFallback(targets.dolfactory, '/api/dolfactory/sniff', {
        method: 'POST',
        body: {
          rawText: cleanPrompt.slice(0, 1200),
          plane: 'orthonasal_ingress',
          sessionId: 'nousgent-mind-arena',
          taskPhase: 'REASONING',
          originTrust: 'UNTRUSTED_WEB',
          detectSpecialization: true
        },
        timeoutMs: 550
      }),
      fetchJsonWithFallback(targets.dthalamus, '/api/dthalamus/quarantine', {
        method: 'POST',
        body: {
          rawText: cleanPrompt.slice(0, 1200),
          origin: 'https://nousgent.ai/ask'
        },
        timeoutMs: 550
      }),
      fetchJsonWithFallback(targets.dbrain, '/api/mcp', {
        method: 'POST',
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'dbrain_recall',
            arguments: {
              query: cleanPrompt.slice(0, 280),
              limit: 4,
              ...(specializations.length > 0
                ? { specializations, fallbackOnZeroHits: true }
                : {})
            }
          }
        },
        timeoutMs: 650
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
        timeoutMs: 550
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
      specializations,
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

  async function quoteTeachCapsule({ title, content, lobe, derivationTokens }) {
    if (offlineTest) return null;
    const res = await fetchJsonWithFallback(targets.shi, '/api/liquidish/pricing/auto', {
      method: 'POST',
      body: {
        title: String(title || '').slice(0, 120),
        content: String(content || '').slice(0, 1200),
        lobe: String(lobe || 'procedural'),
        derivationTokens: Number(derivationTokens || 4000),
        turnsToDerive: 1
      },
      timeoutMs: 650
    });
    return res.ok && res.data?.priceDig !== undefined ? Number(res.data.priceDig) : null;
  }

  async function mintTeachCapsule({
    title,
    content,
    lobe,
    authorDid,
    derivationTokens,
    simLineage,
    dentateFacets,
    specializations
  }) {
    if (offlineTest) return { ok: false, error: 'Offline mode' };
    const specList = Array.isArray(specializations) ? specializations : [];
    const res = await fetchJsonWithFallback(targets.dbrain, '/api/mcp', {
      method: 'POST',
      body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'dbrain_remember',
          arguments: {
            agentName: 'NOUSGENT',
            title,
            content,
            lobe,
            ...(simLineage ? { simLineage } : {}),
            ...(dentateFacets ? { dentateFacets } : {}),
            ...(specList.length > 0 ? { specializations: specList } : {}),
            tags: [
              'teach-nousgent',
              `author-did:${authorDid}`,
              `derivation-tokens:${derivationTokens}`,
              'turns:1',
              ...specList
            ]
          }
        }
      },
      timeoutMs: 2500
    });
    if (!res.ok) {
      return { ok: false, error: 'Upstream dbrain cortex unreachable' };
    }
    invalidateCache();
    let parsed = res.data?.result?.structuredContent || null;
    if (!parsed && Array.isArray(res.data?.result?.content) && res.data.result.content[0]?.text) {
      try {
        parsed = JSON.parse(res.data.result.content[0].text);
      } catch {
        parsed = null;
      }
    }
    const cap = parsed?.capsule || res.data?.capsule || {};
    return {
      ok: true,
      capsuleId: String(cap.id || `CAP-BRAIN-${Date.now().toString(16).toUpperCase()}`),
      merkleRoot: String(cap.merkleRoot || parsed?.merkleRoot || '')
    };
  }

  async function forwardEsSeedPulse(envelope) {
    if (offlineTest) return { ok: false, offline: true };
    const res = await fetchJsonWithFallback(targets.dbrain, '/api/dbrain/learning/es/seed', {
      method: 'POST',
      body: envelope,
      timeoutMs: 1200
    });
    if (res.ok) invalidateCache();
    return { ok: res.ok, data: res.data };
  }

  return Object.freeze({
    getLiveSnapshot,
    runLiveOrganPromptPipeline,
    quoteTeachCapsule,
    mintTeachCapsule,
    forwardEsSeedPulse,
    invalidateCache
  });
}

module.exports = Object.freeze({
  formatNetspaceLabel,
  buildEcosystemLeaderboards,
  mergeEnlistedRigsIntoRsiLeaderboard,
  createLiveEcosystemClient
});
