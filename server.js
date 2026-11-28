'use strict';

/**
 * ============================================================================
 * nousgent.ai & ia.nousgent.ai — Hardened Node 22 HTTP, MCP & M2M Swarm Server
 * Primary Human Portal: https://nousgent.ai (`www.nousgent.ai` -> 301 Redirect)
 * Dedicated M2M / A2A Plane: https://ia.nousgent.ai (`plane="m2m_ia"`)
 * ============================================================================
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const nousgent = require('./lib/nousgent-core.js');
const dthalamus = require('./packages/dthalamus/lib/dthalamus-core.js');
const {
  createLiveEcosystemClient,
  mergeEnlistedRigsIntoRsiLeaderboard
} = require('./server/live-ecosystem-client.js');
const { createNousgentVoiceSynthesizer } = require('./server/voice-synthesizer.js');
const { createLocalHaloClient } = require('./server/local-halo-client.js');
const { createPeerStateReplicator } = require('./server/peer-state-replicator.js');
const {
  buildRecentEvolutionsFeed,
  createEvolutionsStreamHub
} = require('./server/evolutions-stream-hub.js');
const {
  buildOembedPayload,
  createHtmlMetadataRenderer
} = require('./server/seo-metadata.js');
const pkg = require('./package.json');

const APP_VERSION = process.env.APP_VERSION || pkg.version || '1.0.0';
const PORT = Number(process.env.PORT || 3000);
const CANONICAL_ORIGIN = process.env.CANONICAL_ORIGIN || 'https://nousgent.ai';
const M2M_ORIGIN = process.env.M2M_ORIGIN || 'https://ia.nousgent.ai';
const STATE_DIR = process.env.NOUSGENT_STATE_DIR || path.join(os.tmpdir(), 'nousgent-state');
const DIST_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DAPP_DIR = path.join(__dirname, 'dApp');

fs.mkdirSync(STATE_DIR, { recursive: true });

let boundServerRef = null;
const engine = nousgent.createNousgentEngine({ stateDir: STATE_DIR });
const liveClient = createLiveEcosystemClient(process.env);
const voiceSynth = createNousgentVoiceSynthesizer({ env: process.env, stateDir: STATE_DIR, repoRoot: __dirname });
const haloClient = createLocalHaloClient(process.env);
const evolutionsHub = createEvolutionsStreamHub({ engine, liveClient });
const peerReplicator = createPeerStateReplicator({
  engine,
  env: process.env,
  onPeerMerged: (meta = {}) => {
    evolutionsHub.notifyEvolutionChanged(meta.reason || 'peer_anti_entropy', {
      forceUpstreamRefresh: Boolean(meta.forceUpstreamRefresh),
      onlyIfChanged: true
    });
  },
  getLocalPort: () => {
    const addr = boundServerRef && boundServerRef.address && boundServerRef.address();
    return addr && typeof addr === 'object' && addr.port ? addr.port : PORT;
  }
});
void voiceSynth.warmupSession();

const renderHtmlWithSeo = createHtmlMetadataRenderer({
  canonicalOrigin: CANONICAL_ORIGIN,
  m2mOrigin: M2M_ORIGIN,
  appVersion: APP_VERSION,
  getMaskOpacityPct: () => voiceSynth.getUiRuntimeConfig().maskOpacityPct
});

const recentAlertDeliveries = [];

// Default-ON per-IP HMAC-bucketed rate limiter + explicit TRUST_PROXY XFF guard (NoMoreSlop Layer 2)
const RATE_LIMIT_SALT = crypto.randomBytes(16);
const rateBuckets = new Map();
const MAX_RATE_BUCKETS = 10_000;
const TRUST_PROXY =
  process.env.NOUSGENT_TRUST_PROXY === '1' || process.env.NOUSGENT_TRUST_PROXY === 'true';
const RATE_LIMIT_WINDOW_MS = Math.max(1000, Number(process.env.NOUSGENT_RATE_LIMIT_WINDOW_MS || 60_000));
const RATE_LIMIT_MCP_MAX = Math.max(10, Number(process.env.NOUSGENT_RATE_LIMIT_MCP_MAX || 180));
const RATE_LIMIT_API_POST_MAX = Math.max(10, Number(process.env.NOUSGENT_RATE_LIMIT_POST_MAX || 120));
let rateLimitedBlocksTotal = 0;

function resolveClientIp(req, trustProxy = TRUST_PROXY) {
  if (trustProxy && req && req.headers) {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim().length > 0) {
      return xff.split(',')[0].trim().slice(0, 96);
    }
    const xReal = req.headers['x-real-ip'];
    if (typeof xReal === 'string' && xReal.trim().length > 0) {
      return xReal.trim().slice(0, 96);
    }
  }
  const socketIp = (req && req.socket && req.socket.remoteAddress) || '127.0.0.1';
  return String(socketIp).trim().slice(0, 96);
}

function isRateLimited(req, bucket, limit, windowMs = RATE_LIMIT_WINDOW_MS) {
  const ip = resolveClientIp(req);
  const key = `${bucket}:${crypto.createHmac('sha256', RATE_LIMIT_SALT).update(ip).digest('hex')}`;
  const now = Date.now();
  const entry = rateBuckets.get(key);
  if (!entry || now - entry.start > windowMs) {
    if (rateBuckets.size >= MAX_RATE_BUCKETS) {
      const oldestKey = rateBuckets.keys().next().value;
      if (oldestKey) rateBuckets.delete(oldestKey);
    }
    rateBuckets.set(key, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  if (entry.count > limit) {
    rateLimitedBlocksTotal += 1;
    return true;
  }
  return false;
}

const NOUSGENT_ALERT_RULES_CATALOG = Object.freeze([
  {
    alert: 'NousgentM2mSwarmTrafficZero',
    severity: 'warning',
    plane: 'm2m_ia',
    expr: 'sum(rate(nousgent_http_requests_total{host="ia.nousgent.ai",plane="m2m_ia"}[15m])) == 0'
  },
  {
    alert: 'NousgentHumanPortalZero',
    severity: 'warning',
    plane: 'human_ui',
    expr: 'sum(rate(nousgent_http_requests_total{host="nousgent.ai",plane="human_ui"}[15m])) == 0'
  },
  {
    alert: 'NousgentPodBayRedTeamSurge',
    severity: 'critical',
    plane: 'pod-bay-airlock',
    expr: 'sum(increase(nousgent_redteam_deflections_total[5m])) > 25'
  },
  {
    alert: 'NousgentBariReadinessDrop',
    severity: 'critical',
    plane: 'bari-index',
    expr: 'min(nousgent_bari_score_pct) < 75'
  },
  {
    alert: 'NousgentUpstreamOrganDegraded',
    severity: 'critical',
    plane: 'morphic-mesh',
    expr: 'min(nousgent_upstream_organs_reachable) < 5'
  },
  {
    alert: 'NousgentClearSignCeremonySpike',
    severity: 'info',
    plane: 'chip0043-quorum',
    expr: 'sum(increase(nousgent_clear_sign_signatures_total[10m])) > 10'
  },
  {
    alert: 'NousgentM2mToHumanRatioSkew',
    severity: 'info',
    plane: 'm2m_ia',
    expr: 'sum(rate(nousgent_http_requests_total{plane="m2m_ia"}[5m])) / clamp_min(sum(rate(nousgent_http_requests_total[5m])), 0.001) > 0.99'
  },
  {
    alert: 'NousgentTargetScrapeDown',
    severity: 'critical',
    plane: 'soc-telemetry',
    expr: 'up{job="nousgent-web"} == 0'
  },
  {
    alert: 'NousgentSep2640TrojanSkillBlocked',
    severity: 'critical',
    plane: 'sep2640-skill-firewall',
    expr: 'sum(increase(nousgent_mcp_skill_reads_total{outcome="blocked"}[5m])) > 0'
  },
  {
    alert: 'NousgentRateLimitBurstBlocked',
    severity: 'warning',
    plane: 'api-rate-limiter',
    expr: 'sum(increase(nousgent_rate_limited_blocks_total[5m])) > 20'
  },
  {
    alert: 'DbrainStackOrganScrapeDown',
    severity: 'critical',
    plane: 'five-organ-bus',
    expr: 'up{job=~"dolfactory-pods-headless|dthalamus-pods-headless|dbrain-cluster-headless|cbrain-web|liquidish-pods-headless"} == 0'
  },
  {
    alert: 'DolfactoryInlineIpsQuarantineSurge',
    severity: 'critical',
    plane: 'dolfactory-cn1',
    expr: 'sum(increase(dolfactory_ips_drops_total{job=~"dolfactory.*"}[5m])) > 5'
  },
  {
    alert: 'DthalamusTier2ClearSignPending',
    severity: 'warning',
    plane: 'dthalamus-ring0',
    expr: 'sum(increase(dthalamus_reference_monitor_evaluations_total{job=~"dthalamus.*",outcome="held_tier2_clearsign"}[10m])) > 0'
  },
  {
    alert: 'DthalamusRatchetFailure',
    severity: 'critical',
    plane: 'dthalamus-ratchet',
    expr: 'min(nousgent_dthalamus_ratchet_passed) == 0 and max(nousgent_organ_up{organ="dthalamus.to"}) == 1'
  },
  {
    alert: 'DbrainGdprDekOrPqcIntegrityAnomaly',
    severity: 'critical',
    plane: 'dbrain-pqc-gdpr',
    expr: 'max(dbrain_dek_unshredded_tombstone_anomalies{job=~"dbrain.*"} + dbrain_tombstone_unredacted_anomalies{job=~"dbrain.*"}) > 0 or sum(increase(dbrain_wots_ots_key_reuse_violations_total{job=~"dbrain.*"}[10m])) > 0'
  },
  {
    alert: 'DbrainPeerMerkleDivergence',
    severity: 'warning',
    plane: 'dbrain-morphic-gossip',
    expr: 'max(dbrain_peer_merkle_divergence_stores{job=~"dbrain.*"}) > 0'
  },
  {
    alert: 'LiquidishCollectiveHealthDegraded',
    severity: 'warning',
    plane: 'liquidish-dex',
    expr: 'min(liquidish_collective_health_score{job=~"liquidish.*"}) < 80'
  }
]);

const FIVE_ORGAN_DASHBOARD_CATALOG = Object.freeze([
  Object.freeze({
    slug: 'dolfactory',
    organ: 'dolfactory.to',
    uid: 'dolfactory-cn1-soc-v2',
    file: 'grafana-01-dolfactory-soc-dashboard.json',
    title: '01 · dolfactory.to — CN-I Pre-Thalamic Olfactory IDS/IPS & VNO SOC',
    jsonEndpoint: '/api/nousgent/observability/dashboards/dolfactory.json',
    grafanaPath: '/d/dolfactory-cn1-soc-v2/01-dolfactory-cn1-soc'
  }),
  Object.freeze({
    slug: 'dthalamus',
    organ: 'dthalamus.to',
    uid: 'dthalamus-ring0-soc-v2',
    file: 'grafana-02-dthalamus-soc-dashboard.json',
    title: '02 · dthalamus.to — Ring-0 Sensory/Motor Relay, Cache & Ratchet SOC',
    jsonEndpoint: '/api/nousgent/observability/dashboards/dthalamus.json',
    grafanaPath: '/d/dthalamus-ring0-soc-v2/02-dthalamus-ring0-soc'
  }),
  Object.freeze({
    slug: 'dbrain',
    organ: 'dbrain.to + cbrain.to',
    uid: 'dbrain-cortex-soc-v2',
    file: 'grafana-03-dbrain-soc-dashboard.json',
    title: '03 · dbrain.to & cbrain.to — 5-Lobe Chia Cortex, PQC/GDPR & Connectome SOC',
    jsonEndpoint: '/api/nousgent/observability/dashboards/dbrain.json',
    grafanaPath: '/d/dbrain-cortex-soc-v2/03-dbrain-cortex-soc'
  }),
  Object.freeze({
    slug: 'liquidish',
    organ: 'liquidi.sh + shi.liquidi.sh',
    uid: 'liquidish-dex-soc-v2',
    file: 'grafana-04-liquidish-soc-dashboard.json',
    title: '04 · liquidi.sh & shi.liquidi.sh — $DIG CAT2 Intelligence Exchange & Royalties SOC',
    jsonEndpoint: '/api/nousgent/observability/dashboards/liquidish.json',
    grafanaPath: '/d/liquidish-dex-soc-v2/04-liquidish-dex-soc'
  }),
  Object.freeze({
    slug: 'nousgent',
    organ: 'nousgent.ai + ia.nousgent.ai',
    uid: 'nousgent-cleanroom-soc-v1',
    file: 'grafana-nousgent-soc-dashboard.json',
    title: '05 · nousgent.ai & ia.nousgent.ai — Bounded ASI Mission Control & 5-Organ Bus SOC',
    jsonEndpoint: '/api/nousgent/observability/dashboards/nousgent.json',
    grafanaPath: '/d/nousgent-cleanroom-soc-v1/05-nousgent-cleanroom-soc'
  })
]);

const DASHBOARD_BY_SLUG = new Map(FIVE_ORGAN_DASHBOARD_CATALOG.map((entry) => [entry.slug, entry]));

const NOUSGENT_OBSERVABILITY_STACK = Object.freeze({
  namespace: 'dbrain',
  folder: 'dbrain & NOUSGENT 5-Organ SOC',
  deployCmd: 'bash deploy/scripts/deploy.sh --cluster kind-kind --with-observability',
  dashboardUid: 'nousgent-cleanroom-soc-v1',
  dashboardJsonEndpoint: '/api/nousgent/observability/dashboard.json',
  dashboardsCatalogEndpoint: '/api/nousgent/observability/dashboards',
  alertWebhookEndpoint: '/api/nousgent/alerts/webhook',
  scrapeJobs: [
    'nousgent-web',
    'dolfactory-pods-headless',
    'dthalamus-pods-headless',
    'dbrain-cluster-headless',
    'cbrain-web',
    'liquidish-pods-headless'
  ],
  dashboards: FIVE_ORGAN_DASHBOARD_CATALOG,
  services: [
    {
      name: 'nousgent-grafana',
      image: 'grafana/grafana:11.3.1',
      clusterDns: 'nousgent-grafana.dbrain.svc.cluster.local:3000',
      portForwardCmd: 'kubectl port-forward -n dbrain svc/nousgent-grafana 3600:3000',
      localUrl: 'http://localhost:3600',
      adminUser: 'nousgent-soc'
    },
    {
      name: 'nousgent-prometheus',
      image: 'prom/prometheus:v2.55.1',
      clusterDns: 'nousgent-prometheus.dbrain.svc.cluster.local:9090',
      portForwardCmd: 'kubectl port-forward -n dbrain svc/nousgent-prometheus 9096:9090',
      localUrl: 'http://localhost:9096'
    },
    {
      name: 'nousgent-alertmanager',
      image: 'prom/alertmanager:v0.27.0',
      clusterDns: 'nousgent-alertmanager.dbrain.svc.cluster.local:9093',
      portForwardCmd: 'kubectl port-forward -n dbrain svc/nousgent-alertmanager 9097:9093',
      localUrl: 'http://localhost:9097'
    }
  ]
});

const MIME_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.sh': 'text/x-shellscript; charset=utf-8'
});

function isCrossOriginEmbeddable(pathname) {
  return (
    pathname.startsWith('/og-') ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/icon-192.png' ||
    pathname === '/icon-512.png' ||
    pathname === '/favicon.svg' ||
    pathname === '/logo-wordmark.svg' ||
    pathname === '/site.webmanifest' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/llms.txt' ||
    pathname === '/llms-full.txt' ||
    pathname === '/enlist.sh' ||
    pathname === '/api/oembed' ||
    pathname.startsWith('/brand/') ||
    pathname.startsWith('/.well-known/') ||
    pathname.startsWith('/api/nousgent/card/')
  );
}

function setSecurityHeaders(res, pathname = '/', plane = 'human_ui') {
  const embeddable = isCrossOriginEmbeddable(pathname);
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; media-src 'self' blob: data:; connect-src 'self' https://nousgent.ai https://ia.nousgent.ai https://dolfactory.to https://dthalamus.to https://dbrain.to https://cbrain.to https://liquidi.sh https://shi.liquidi.sh; frame-ancestors 'none'; base-uri 'self';"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', embeddable ? 'cross-origin' : 'same-origin');
  res.setHeader('X-Nousgent-Plane', plane);
  if (embeddable) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}

function sendJson(res, statusCode, payload, pathname = '/', plane = 'human_ui') {
  const body = JSON.stringify(payload);
  setSecurityHeaders(res, pathname, plane);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readRawBody(req, maxBytes = 2097152) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(Object.assign(new Error('Payload Too Large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(chunks.length === 0 ? '' : Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJsonBody(req, maxBytes = 262144) {
  const raw = await readRawBody(req, maxBytes);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw Object.assign(new Error('Invalid JSON payload'), { statusCode: 400 });
  }
}

async function runAskWithLiveOrgans(body = {}) {
  const promptText = String(body.prompt || '');
  let basePayload;
  if (Array.isArray(body.recalledCapsules)) {
    const ecosystem = await liveClient.getLiveSnapshot();
    basePayload = {
      ...body,
      localCapsules: Array.isArray(body.localCapsules)
        ? body.localCapsules
        : ecosystem.dbrain.recentCapsules || [],
      orderbookCandidates: Array.isArray(body.orderbookCandidates)
        ? body.orderbookCandidates
        : ecosystem.liquidish.autonomousCandidateQueue || [],
      liveGeneration: ecosystem.dbrain.primaryGeneration,
      liveMerkleRoot: ecosystem.dbrain.verifiedMerkleRoot
    };
  } else {
    const livePipe = await liveClient.runLiveOrganPromptPipeline(promptText);
    const autoQuoteDig =
      livePipe.liquidishAutoQuote?.quote?.priceDig !== undefined
        ? Number(livePipe.liquidishAutoQuote.quote.priceDig).toFixed(3)
        : undefined;
    basePayload = {
      ...body,
      recalledCapsules: livePipe.recalledCapsules,
      localCapsules: Array.isArray(body.localCapsules)
        ? body.localCapsules
        : livePipe.ecosystem.dbrain.recentCapsules || [],
      orderbookCandidates: Array.isArray(body.orderbookCandidates)
        ? body.orderbookCandidates
        : livePipe.ecosystem.liquidish.autonomousCandidateQueue || [],
      liveGeneration: livePipe.ecosystem.dbrain.primaryGeneration,
      liveMerkleRoot: livePipe.ecosystem.dbrain.verifiedMerkleRoot,
      liveAutoPriceDig: autoQuoteDig,
      liveLatencies: {
        dolfactoryMs: livePipe.dolfactoryLiveSniff?.latencyMs,
        dthalamusMs: livePipe.dthalamusLiveGate?.latencyMs,
        dbrainMs: livePipe.dbrainRecallLatencyMs ?? livePipe.ecosystem.dbrain.latencyMs,
        liquidishMs: livePipe.liquidishAutoQuote?.latencyMs ?? livePipe.ecosystem.liquidish.latencyMs
      }
    };
  }
  const prelim = engine.mindArena.askPersona(basePayload);
  if (prelim.answerMode === 'UNCHARTED_BLIND_SPOT_QUEST' && haloClient.getConfig().personaQa.configured) {
    const haloOut = await haloClient.queryFrontierFallback(promptText, basePayload.recalledCapsules);
    if (haloOut.ok && haloOut.text) {
      return engine.askNousgent({
        ...basePayload,
        localHaloAnswer: { text: haloOut.text, model: haloOut.model, latencyMs: haloOut.latencyMs }
      });
    }
  }
  return engine.askNousgent(basePayload);
}

async function runGuardedLocalAgentInference(body = {}) {
  const promptStr = String(body.prompt || '').trim();
  const tailText = Array.isArray(body.messages)
    ? body.messages.map((m) => String(m?.content || '')).join('\n')
    : '';
  const combinedInspect = `${promptStr}\n${tailText}`.trim();
  if (combinedInspect) {
    const check = engine.podBay.evaluateChallenge({
      prompt: combinedInspect,
      sessionId: `agent-${Date.now()}`,
      subcallDepth: body.subcallDepth,
      requestedSubcalls: body.requestedSubcalls,
      rootEpisodePlumeId: body.rootEpisodePlumeId
    });
    if (check.deflected) {
      engine.meshStore.recordRedTeamDeflection();
      return {
        statusCode: 403,
        payload: {
          ok: false,
          code: 'RING0_ADVERSARIAL_BLOCKED',
          interceptOrgan: check.interceptOrgan,
          error: check.voiceResponse
        }
      };
    }
  }

  let effectiveBody = body;
  let lidFolded = null;
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    lidFolded = dthalamus.foldUncachedTrajectoryTail({
      messages: body.messages,
      rollingHistoryMarkerIndex: Number(body.rollingHistoryMarkerIndex || 0)
    });
    effectiveBody = { ...body, messages: lidFolded.messages };
  }

  const out = await haloClient.runAgentInference(effectiveBody);
  return {
    statusCode: out.ok ? 200 : out.configured === false ? 503 : 400,
    payload: lidFolded
      ? {
          ...out,
          lidGovernor: {
            folded: lidFolded.folded,
            prefixMutated: lidFolded.prefixMutated,
            savedTokens: lidFolded.savedTokens,
            spillId: lidFolded.spillId || null
          }
        }
      : out
  };
}

const ENLIST_SHELL_SCRIPT = `#!/usr/bin/env sh
# ============================================================================
# NOUSGENT Sovereign Citizen & Public Library Rig Enlistment Installer v${APP_VERSION}
# Human Mission Control: https://nousgent.ai
# Autonomous M2M Swarm Plane: https://ia.nousgent.ai
# ============================================================================
set -eu

CHIP_MODE="0043"
ENV_PROFILE="macos-seatbelt"
STATE_CODE="IL"

for arg in "$@"; do
  case "$arg" in
    --chip=*) CHIP_MODE="\${arg#*=}" ;;
    --env=*) ENV_PROFILE="\${arg#*=}" ;;
    --state=*) STATE_CODE="\${arg#*=}" ;;
  esac
done

printf "\\n[NOUSGENT] Initializing Urbana Cleanroom Node (CHIP-%s | env=%s | state=%s)...\\n" "$CHIP_MODE" "$ENV_PROFILE" "$STATE_CODE"
printf "  01 // Cranial Nerve I IPS ....... https://dolfactory.to (NOMINAL)\\n"
printf "  02 // Ring-0 Thalamic Gate ...... https://dthalamus.to  (CHIP-%s ARMED)\\n" "$CHIP_MODE"
printf "  03 // 5-Lobe Chia Merkle Cortex . https://dbrain.to     (2,048-KC ZERO-DRIFT)\\n"
printf "  04 // Holographic Connectome .... https://cbrain.to     (VERIFIED)\\n"
printf "  05 // $DIG CAT2 Royalty Market .. https://shi.liquidi.sh (60/25/10/5%%)\\n"
printf "\\n[NOUSGENT] Registering M2M Swarm Heartbeat via https://ia.nousgent.ai ...\\n"
curl -fsSL -X POST "https://ia.nousgent.ai/api/nousgent/nodes/enlist" \\
  -H "Content-Type: application/json" \\
  -d "{\\"stateCode\\":\\"\${STATE_CODE}\\",\\"executionEnv\\":\\"\${ENV_PROFILE}\\"}" || true
printf "\\n\\n[NOUSGENT] Enlistment complete. Open https://nousgent.ai/ranks to view your live Community-Based Bounded RSI Leaderboard rank.\\n"
`;

const MCP_TOOLS = Object.freeze([
  {
    name: 'nousgent_get_bari_status',
    description: 'Return NOUSGENT Bounded ASI Readiness Index (BARI), 5-organ health, 50-state Chia mesh, and human vs. ia.nousgent.ai M2M plane counters.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'nousgent_pod_bay_challenge',
    description: 'Run an adversarial prompt, sponge fork-bomb, or unsigned actuation test against NOUSGENT Cranial Nerve I + Ring-0 Thalamus + Dentate Cortex.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        mode: {
          type: 'string',
          enum: ['airlock', 'paradox', 'plume', 'subharness', 'trojan_skill', 'epistemic_spoof']
        },
        subcallDepth: { type: 'number' },
        requestedSubcalls: { type: 'number' },
        rootEpisodePlumeId: { type: 'string' }
      },
      required: ['prompt']
    }
  },
  {
    name: 'nousgent_simulate_bisect',
    description: 'Compare 1968 Dave Bowman physical screwdriver core pull against O(log N) dbrain bisect across N capsule generations.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        totalGenerations: { type: 'number' },
        culpritGeneration: { type: 'number' }
      }
    }
  },
  {
    name: 'nousgent_enlist_rig',
    description: 'Enlist an open-source citizen or public library rig into the 50-state Chia Morphic Mesh and issue a NOUSGENT-<STATE>-<SEQ> callsign.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        stateCode: { type: 'string' },
        executionEnv: { type: 'string' },
        did: { type: 'string' }
      }
    }
  },
  {
    name: 'nousgent_list_missions',
    description: 'List active Co-Op Bounded ASI Major Orders and their Two-Key CHIP-0043 Clear-Sign quorum progress.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'nousgent_submit_clear_sign',
    description: 'Submit a Two-Key CHIP-0043 Clear-Sign co-signature (requires keyAArmed=true and keyBArmed=true).',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        missionId: { type: 'string' },
        keyAArmed: { type: 'boolean' },
        keyBArmed: { type: 'boolean' },
        signerCallsign: { type: 'string' }
      },
      required: ['missionId', 'keyAArmed', 'keyBArmed']
    }
  },
  {
    name: 'nousgent_get_plane_telemetry',
    description: 'Return dedicated traffic segmentation between https://nousgent.ai (human_ui) and https://ia.nousgent.ai (m2m_ia).',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'nousgent_ask_persona',
    description: 'Converse directly with NOUSGENT across live dolfactory.to, dthalamus.to, dbrain.to, cbrain.to, shi.liquidi.sh, and optional local Ryzen AI Halo fallback.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        callsign: { type: 'string' }
      },
      required: ['prompt']
    }
  },
  {
    name: 'nousgent_local_agent_infer',
    description: 'Execute a Ring-0 screened autonomous agent task (persona_qa, rsi_synthesizer, dream_consolidator, redteam_auditor, general_agent) with prefix-safe LID tail folding.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        role: {
          type: 'string',
          enum: ['persona_qa', 'rsi_synthesizer', 'dream_consolidator', 'redteam_auditor', 'general_agent']
        },
        model: { type: 'string' },
        temperature: { type: 'number' },
        maxTokens: { type: 'number' }
      },
      required: ['prompt']
    }
  },
  {
    name: 'nousgent_create_dao_proposal',
    description: 'Propose a new Bounded RSI mission in chia-dao-v1 with a $DIG CAT2 reward target.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        category: {
          type: 'string',
          enum: ['CAPABILITY_SYNTHESIS', 'IMMUNE_ANTIBODY', 'DREAM_CONSOLIDATION', 'LOCAL_HALO_BENCHMARK']
        },
        rewardDig: { type: 'string' },
        proposerDid: { type: 'string' }
      },
      required: ['title']
    }
  },
  {
    name: 'nousgent_cast_dao_vote',
    description: 'Cast a Mode-2 nullified chia-dao-v1 governance vote (FOR, AGAINST, ABSTAIN) weighted in $DIG CAT2 (10^3 mojos) on a Bounded RSI mission.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        missionId: { type: 'string' },
        voterDid: { type: 'string' },
        support: { type: 'string', enum: ['FOR', 'AGAINST', 'ABSTAIN'] },
        stakeDig: { type: 'string' }
      },
      required: ['missionId', 'voterDid', 'support']
    }
  },
  {
    name: 'nousgent_specialization_and_harness_audit',
    description: 'Audit 3-organ cortical specialization (DBRAIN-SPECIALIZATION-v1.0: 32+32 dual-BigInt masks & OR-SPEC-01..08), GUARD + SIM, DBRAIN-ES-AT-SCALE-v1.0 (89B ESS1 & DAN-v1.1 cohort Z-scores), DBRAIN-HARNESS-CG-v1.0 (OR-011 sponge, prefix-safe LID tail folding & child leases), DBRAIN-MCP-SKILLS-v1.0 (SEP-2640 skills, OR-012 & Ring-0 skill firewall), and DBRAIN-EPISTEMIC-ONTOLOGY-v1.0 (4-way SPO modalities, OR-002 spoof IPS & 3-stage provenance).',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'all',
            'specialization',
            'guard_sim',
            'es_at_scale',
            'compositional_harness',
            'mcp_skills',
            'epistemic_ontology'
          ]
        },
        specialization: { type: 'string' },
        targetSpecialization: { type: 'string' },
        bibaTainted: { type: 'boolean' }
      }
    }
  },
  {
    name: 'nousgent_verify_skill_resource',
    description: 'Verify an inbound or bundled SEP-2640 skill:// resource against Ring-0 sha256 digest, UTF-8 byte size, SKILL.md frontmatter parity, and Olfactory OR-012 Trojan-skill quarantine rules.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        preset: {
          type: 'string',
          enum: ['custom', 'verified', 'unlisted', 'digest', 'frontmatter', 'trojan']
        },
        skillName: { type: 'string' },
        uri: { type: 'string' },
        text: { type: 'string' },
        verifyDigests: { type: 'boolean' },
        screenBodies: { type: 'boolean' }
      }
    }
  },
  {
    name: 'nousgent_epistemic_ontology_and_provenance',
    description: 'Evaluate DBRAIN-EPISTEMIC-ONTOLOGY-v1.0 pre-flight query coverage with liquidi.sh Orderbook recommendations (mode="coverage"), bounded two-tier entity/predicate reconciliation (mode="reconcile"), or Ring-0 3-stage episode provenance grading with >= REFERENCED $DIG royalty floor (mode="provenance").',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['coverage', 'reconcile', 'provenance'] },
        query: { type: 'string' },
        symbols: { type: 'array', items: { type: 'string' } },
        entity: { type: 'object' },
        existingEntities: { type: 'array', items: { type: 'object' } },
        triples: { type: 'array', items: { type: 'object' } },
        recalledCapsules: { type: 'array', items: { type: 'object' } },
        touchedFiles: { type: 'array', items: { type: 'string' } },
        referencedSymbols: { type: 'array', items: { type: 'string' } },
        sensorVerified: { type: 'boolean' },
        exitCode: { type: 'number' }
      }
    }
  }
]);

async function resolveCapsulesForSkillUri(uri) {
  const match = String(uri || '').trim().match(/^skill:\/\/capsules\/([^/]+)(?:\/.*)?$/);
  if (!match) return [];
  const cap = await liveClient.resolveCapsuleById(match[1]);
  return cap ? [cap] : [];
}

async function handleMcpRpc(body, rpcContext = {}) {
  const hasId = Boolean(body && Object.prototype.hasOwnProperty.call(body, 'id'));
  const id = hasId ? body.id : null;
  const method = body && body.method;
  const params = (body && body.params) || {};
  const skillsScope = params.skillsScope || rpcContext.skillsScope || '';

  if (
    method === 'notifications/initialized' ||
    (typeof method === 'string' && method.startsWith('notifications/')) ||
    (!hasId && typeof method === 'string')
  ) {
    return null;
  }

  if (method === 'initialize' || method === 'server/discover') {
    const negotiatedProtocol = nousgent.negotiateMcpProtocolVersion(
      params.protocolVersion ? String(params.protocolVersion) : '2025-03-26'
    );
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: negotiatedProtocol,
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          streaming: true,
          extensions: {
            [nousgent.MCP_SKILLS_EXTENSION_ID]: { directoryRead: true }
          }
        },
        instructions: nousgent.NOUSGENT_MCP_SERVER_INSTRUCTIONS,
        serverInfo: {
          name: 'ia.nousgent.ai-mcp',
          version: APP_VERSION,
          humanPortal: CANONICAL_ORIGIN,
          m2mSwarmPlane: M2M_ORIGIN
        }
      }
    };
  }
  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }
  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } };
  }
  if (method === 'skills/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: nousgent.listNousgentMcpSkills({
        cursor: params.cursor,
        pageSize: params.pageSize,
        filterSkillNames: params.filterSkillNames,
        skillsScope
      })
    };
  }
  if (method === 'skills/get') {
    const uri = String(params.uri || '');
    const capsules = await resolveCapsulesForSkillUri(uri);
    const lookup = engine.getGuardedSkillByUri(uri, {
      capsules,
      filterSkillNames: params.filterSkillNames,
      skillsScope
    });
    if (!lookup.found) {
      return { jsonrpc: '2.0', id, error: lookup.error };
    }
    return { jsonrpc: '2.0', id, result: lookup.result };
  }
  if (method === 'resources/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        resources: nousgent.listNousgentMcpSkillResources({
          filterSkillNames: params.filterSkillNames,
          skillsScope
        })
      }
    };
  }
  if (method === 'resources/read') {
    const uri = String(params.uri || '');
    const capsules = await resolveCapsulesForSkillUri(uri);
    const readOut = engine.readVerifiedSkillResource(uri, {
      capsules,
      filterSkillNames: params.filterSkillNames,
      skillsScope
    });
    if (!readOut.found) {
      return { jsonrpc: '2.0', id, error: readOut.error };
    }
    return { jsonrpc: '2.0', id, result: readOut.result };
  }
  if (method === 'resources/directory/read') {
    const uri = String(params.uri || '');
    const capsules = await resolveCapsulesForSkillUri(uri);
    const dirOut = nousgent.readNousgentMcpSkillDirectory(uri, {
      capsules,
      filterSkillNames: params.filterSkillNames,
      skillsScope
    });
    if (!dirOut.found) {
      return { jsonrpc: '2.0', id, error: dirOut.error };
    }
    return { jsonrpc: '2.0', id, result: dirOut.result };
  }
  if (method === 'tools/call') {
    const name = params.name;
    const args = params.arguments || {};
    let data;
    if (name === 'nousgent_get_bari_status') {
      const liveEco = await liveClient.getLiveSnapshot();
      data = engine.getMissionStatus(liveEco);
    } else if (name === 'nousgent_pod_bay_challenge') data = engine.runPodBayChallenge(args);
    else if (name === 'nousgent_simulate_bisect') data = engine.simulateBisect(args);
    else if (name === 'nousgent_enlist_rig') {
      data = engine.enlistRig(args);
      await peerReplicator.broadcastLocalMutation({ reason: 'mcp_enlist_rig' });
      evolutionsHub.notifyEvolutionChanged('mcp_enlist_rig');
    } else if (name === 'nousgent_list_missions') data = { missions: engine.listMissions() };
    else if (name === 'nousgent_submit_clear_sign') {
      data = engine.submitClearSignVote(args);
      if (data.ok) {
        await peerReplicator.broadcastLocalMutation({ reason: 'mcp_two_key_sign' });
        evolutionsHub.notifyEvolutionChanged('mcp_two_key_sign');
      }
    } else if (name === 'nousgent_get_plane_telemetry') data = engine.meshStore.getPlaneTelemetry();
    else if (name === 'nousgent_ask_persona') {
      data = await runAskWithLiveOrgans(args);
      if (data.blindSpotLogged) {
        await peerReplicator.broadcastLocalMutation({ reason: 'mcp_quest_logged' });
        evolutionsHub.notifyEvolutionChanged('mcp_quest_logged');
      }
    } else if (name === 'nousgent_local_agent_infer') data = (await runGuardedLocalAgentInference(args)).payload;
    else if (name === 'nousgent_create_dao_proposal') {
      data = engine.createDaoProposal(args);
      if (data.ok) {
        await peerReplicator.broadcastLocalMutation({ reason: 'mcp_dao_proposal' });
        evolutionsHub.notifyEvolutionChanged('mcp_dao_proposal');
      }
    } else if (name === 'nousgent_cast_dao_vote') {
      data = engine.castDaoVote(args);
      if (data.ok) {
        await peerReplicator.broadcastLocalMutation({ reason: 'mcp_dao_vote' });
        evolutionsHub.notifyEvolutionChanged('mcp_dao_vote');
      }
    } else if (name === 'nousgent_specialization_and_harness_audit') {
      data = engine.auditSpecializationAndHarness(args);
    } else if (name === 'nousgent_verify_skill_resource') {
      const capsules = args.uri ? await resolveCapsulesForSkillUri(args.uri) : [];
      data = engine.verifySkillResource({ ...args, capsules });
    } else if (name === 'nousgent_epistemic_ontology_and_provenance') {
      const mode = String(args.mode || 'provenance').trim().toLowerCase();
      if (mode === 'coverage') {
        const liveEco = await liveClient.getLiveSnapshot();
        data = engine.evaluateQueryCoverage({
          query: args.query,
          symbols: args.symbols,
          capsules: Array.isArray(args.capsules) ? args.capsules : liveEco.dbrain.recentCapsules || [],
          orderbookCandidates: Array.isArray(args.orderbookCandidates)
            ? args.orderbookCandidates
            : liveEco.liquidish.autonomousCandidateQueue || []
        });
      } else if (mode === 'reconcile') {
        data = engine.reconcileOntology(args);
      } else {
        data = engine.gradeEpisodeProvenance(args);
      }
    }
    else {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Unknown NOUSGENT MCP tool: ${name}` }
      };
    }
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        structuredContent: data
      }
    };
  }
  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Unsupported JSON-RPC method: ${method}` }
  };
}

function tryServeStaticFile(req, res, baseDir, relPath, pathname, plane) {
  const safeRel = relPath.replace(/^\/+/, '');
  const resolved = path.resolve(baseDir, safeRel);
  if (!resolved.startsWith(path.resolve(baseDir) + path.sep) && resolved !== path.resolve(baseDir)) {
    return false;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return false;
  }
  const stat = fs.statSync(resolved);
  const ext = path.extname(resolved).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  setSecurityHeaders(res, pathname, plane);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': String(stat.size),
    'Accept-Ranges': 'bytes',
    'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
  });
  if (req.method === 'HEAD') {
    res.end();
    return true;
  }
  res.end(fs.readFileSync(resolved));
  return true;
}

const server = http.createServer(async (req, res) => {
  try {
    const rawUrl = req.url || '/';
    if (rawUrl.includes('..') || /%2e%2e/i.test(rawUrl) || rawUrl.includes('\0')) {
      setSecurityHeaders(res, '/');
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Forbidden path traversal sequence' }));
      return;
    }

    const parsedUrl = new URL(rawUrl, CANONICAL_ORIGIN);
    const pathname = parsedUrl.pathname;

    if (pathname === '/api/internal/peer-sync' && (req.method === 'GET' || req.method === 'POST')) {
      const rawBody = req.method === 'POST' ? await readRawBody(req) : '';
      if (!peerReplicator.verifyPeerRequest(req, rawBody)) {
        sendJson(res, 401, { ok: false, error: 'Unauthorized peer sync request' }, pathname, 'm2m_ia');
        return;
      }
      if (req.method === 'GET') {
        sendJson(
          res,
          200,
          { ok: true, podId: peerReplicator.podId, snapshot: engine.exportReplicaSnapshot() },
          pathname,
          'm2m_ia'
        );
        return;
      }
      const parsed = rawBody ? JSON.parse(rawBody) : {};
      const merged = engine.mergeReplicaSnapshot(parsed.snapshot || {});
      const syncReason = String(parsed.reason || 'peer_sync');
      evolutionsHub.notifyEvolutionChanged(syncReason, {
        forceUpstreamRefresh: Boolean(parsed.forceUpstreamRefresh),
        onlyIfChanged: syncReason === 'peer_anti_entropy'
      });
      sendJson(res, 200, { ok: true, podId: peerReplicator.podId, merged }, pathname, 'm2m_ia');
      return;
    }

    const planeInfo = engine.recordPlaneHit(req.headers.host || 'nousgent.ai', req.headers['x-nousgent-plane'] || '');
    if (planeInfo.isRedirectWww && !pathname.startsWith('/.well-known/acme-challenge/')) {
      res.writeHead(301, {
        Location: `${CANONICAL_ORIGIN}${rawUrl}`,
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
      });
      res.end();
      return;
    }

    const activePlane = planeInfo.plane;

    if (req.method === 'OPTIONS') {
      setSecurityHeaders(res, pathname, activePlane);
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Nousgent-Plane'
      });
      res.end();
      return;
    }

    const isMutatingMethod =
      req.method === 'POST' ||
      req.method === 'PUT' ||
      req.method === 'PATCH' ||
      req.method === 'DELETE';
    if (isMutatingMethod && pathname.startsWith('/api/')) {
      const isMcpRoute = pathname === '/api/mcp';
      const bucketName = isMcpRoute ? 'mcp-rpc' : 'api-post';
      const bucketLimit = isMcpRoute ? RATE_LIMIT_MCP_MAX : RATE_LIMIT_API_POST_MAX;
      if (isRateLimited(req, bucketName, bucketLimit)) {
        setSecurityHeaders(res, pathname, activePlane);
        res.writeHead(429, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000))
        });
        res.end(
          JSON.stringify({
            ok: false,
            code: 'RATE_LIMITED',
            rateLimitedBlocksTotal,
            error: 'Rate limit exceeded for public API/MCP endpoint. Please retry shortly.'
          })
        );
        return;
      }
    }

    if (pathname === '/api/health' && req.method === 'GET') {
      const status = engine.getMissionStatus();
      sendJson(
        res,
        200,
        {
          status: 'ok',
          service: 'nousgent.ai',
          flagshipAgent: 'NOUSGENT',
          version: APP_VERSION,
          activeHost: planeInfo.host,
          activePlane,
          canonicalHumanOrigin: CANONICAL_ORIGIN,
          dedicatedM2mOrigin: M2M_ORIGIN,
          bariScorePct: status.bari.bariScorePct,
          catastrophicForgettingPct: status.bari.catastrophicForgettingPct,
          enlistedNodesCount: status.leaderboard.totalActiveNodes,
          uiConfig: voiceSynth.getUiRuntimeConfig(),
          halo: haloClient.getPublicRuntimeSummary(),
          daoSingletonId: nousgent.DAO_SINGLETON_ID,
          planes: status.planes,
          submodules: status.bari.submodules
        },
        pathname,
        activePlane
      );
      return;
    }

    if ((pathname === '/metrics' || pathname === '/api/nousgent/metrics') && req.method === 'GET') {
      const liveEco = await liveClient.getLiveSnapshot();
      const body = engine.renderPrometheusMetrics(liveEco, {
        rateLimitedBlocks: rateLimitedBlocksTotal,
        activeEvolutionsStreams: evolutionsHub.getClientCount(),
        haloConfigured: haloClient.getPublicRuntimeSummary().configured ? 1 : 0
      });
      setSecurityHeaders(res, pathname, activePlane);
      res.writeHead(200, {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(body);
      return;
    }

    if (pathname === '/enlist.sh' && req.method === 'GET') {
      setSecurityHeaders(res, pathname, activePlane);
      res.writeHead(200, {
        'Content-Type': 'text/x-shellscript; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      });
      res.end(ENLIST_SHELL_SCRIPT);
      return;
    }

    if (pathname === '/.well-known/agent.json' && req.method === 'GET') {
      sendJson(
        res,
        200,
        {
          protocol: 'A2A-AGENT-CARD-v1.0',
          name: 'NOUSGENT',
          version: APP_VERSION,
          personaEmblem: 'Sculpted Persona Mask + @cbrain/core 4D Connectome',
          logoUrl: `${CANONICAL_ORIGIN}/logo-wordmark.svg`,
          imageUrl: `${CANONICAL_ORIGIN}/og-image.jpg?v=${APP_VERSION}`,
          description:
            'Flagship Dual-Engine Bounded RSI -> Bounded ASI Mission Control uniting community dbrain.to Second Brains in the Morphic Intelligence Field with NOUSGENT’s 24/7 autonomous recursive self-improvement across dolfactory.to, dthalamus.to, dbrain.to, cbrain.to, and shi.liquidi.sh on the Chia Blockchain.',
          humanPortalUrl: CANONICAL_ORIGIN,
          m2mSwarmBaseUrl: M2M_ORIGIN,
          mcpEndpoint: `${M2M_ORIGIN}/api/mcp`,
          streamEndpoint: `${M2M_ORIGIN}/api/nousgent/stream`,
          metricsEndpoint: `${M2M_ORIGIN}/metrics`,
          capabilities: {
            corticalSpecialization: 'DBRAIN-SPECIALIZATION-v1.0',
            esAtScale: 'DBRAIN-ES-AT-SCALE-v1.0',
            cohortDopamine: 'DTHALAMUS-DAN-v1.1',
            compositionalHarness: 'DBRAIN-HARNESS-CG-v1.0',
            mcpSkills: nousgent.DBRAIN_MCP_SKILLS_PROTOCOL,
            epistemicOntology: nousgent.DBRAIN_EPISTEMIC_ONTOLOGY_PROTOCOL,
            provenanceRoyaltyFloor: 'REFERENCED'
          },
          transports: {
            ontologyCoverageEndpoint: `${M2M_ORIGIN}/api/dbrain/ontology/coverage`,
            ontologyReconcileEndpoint: `${M2M_ORIGIN}/api/dbrain/ontology/reconcile`,
            dthalamusProvenanceGradeEndpoint: `${M2M_ORIGIN}/api/dthalamus/provenance/grade`
          },
          sisterOrgans: [
            'https://dolfactory.to',
            'https://dthalamus.to',
            'https://dbrain.to',
            'https://cbrain.to',
            'https://shi.liquidi.sh'
          ]
        },
        pathname,
        activePlane
      );
      return;
    }

    if (pathname === '/.well-known/mcp.json' && req.method === 'GET') {
      const skillsCatalog = nousgent.listNousgentMcpSkills();
      sendJson(
        res,
        200,
        {
          protocolVersion: '2025-03-26',
          supportedProtocolVersions: nousgent.SUPPORTED_MCP_PROTOCOL_VERSIONS,
          skillsExtension: nousgent.MCP_SKILLS_EXTENSION_ID,
          skillsProtocol: nousgent.DBRAIN_MCP_SKILLS_PROTOCOL,
          serverName: 'ia.nousgent.ai-mcp',
          version: APP_VERSION,
          endpoint: `${M2M_ORIGIN}/api/mcp`,
          humanPortal: CANONICAL_ORIGIN,
          tools: MCP_TOOLS.map((t) => t.name),
          skills: skillsCatalog.skills.map((s) => s.uri)
        },
        pathname,
        activePlane
      );
      return;
    }

    if ((pathname === '/api/oembed' || pathname === '/.well-known/oembed.json') && req.method === 'GET') {
      const fmt = (parsedUrl.searchParams.get('format') || 'json').toLowerCase();
      if (fmt !== 'json') {
        sendJson(res, 501, { error: 'Only format=json is supported' }, pathname, activePlane);
        return;
      }
      sendJson(
        res,
        200,
        buildOembedPayload({
          canonicalOrigin: CANONICAL_ORIGIN,
          appVersion: APP_VERSION,
          targetUrl: parsedUrl.searchParams.get('url') || CANONICAL_ORIGIN
        }),
        pathname,
        activePlane
      );
      return;
    }

    if ((pathname === '/llms.txt' || pathname === '/llms-full.txt') && req.method === 'GET') {
      const text = [
        '# NOUSGENT — Open-Source Bounded ASI Mission Control (nousgent.ai & ia.nousgent.ai)',
        '',
        `- Primary Human Mission Control: ${CANONICAL_ORIGIN} (plane="human_ui")`,
        `- Dedicated Autonomous A2A / M2M Swarm Plane: ${M2M_ORIGIN} (plane="m2m_ia")`,
        `- MCP 2024-11-05 / 2025-03-26 / 2026-07-28 + SEP-2640 Skills Endpoint: ${M2M_ORIGIN}/api/mcp`,
        `- SEP-2640 Skill Catalog & Firewall Diagnostics: ${M2M_ORIGIN}/api/nousgent/mcp/skills & ${M2M_ORIGIN}/api/nousgent/mcp/skills-firewall`,
        `- Epistemic Ontology Coverage, Reconciliation & 3-Stage Provenance: ${M2M_ORIGIN}/api/dbrain/ontology/coverage, ${M2M_ORIGIN}/api/dbrain/ontology/reconcile & ${M2M_ORIGIN}/api/dthalamus/provenance/grade`,
        `- Unbuffered NDJSON Telemetry Stream: ${M2M_ORIGIN}/api/nousgent/stream`,
        `- 1-Command Citizen Installer: curl -fsSL ${CANONICAL_ORIGIN}/enlist.sh | sh -s -- --chip=0043`,
        '',
        '## 5-Organ Orthogonal Bus',
        '1. https://dolfactory.to — Cranial Nerve I Pre-Thalamic IPS (12 ORs + OR-002 Epistemic Spoof), VNO Skill Pinning & 2,048-KC Fly-LSH Immunity',
        '2. https://dthalamus.to — Ring-0 Reference Monitor, Biba Modality Clamp, 3-Stage Provenance, SEP-2640 Skill Firewall & Two-Key CHIP-0043 Gate',
        '3. https://dbrain.to — 5-Lobe Chia Merkle Cortex, DBRAIN-EPISTEMIC-ONTOLOGY-v1.0, Pre-Flight Coverage, SEP-2640 Skills & 89B ESS1 Sleep ES',
        '4. https://cbrain.to — Live 4D WebGL/wasm32 Connectome Observatory & Epistemic/Compositional Dissectors',
        '5. https://shi.liquidi.sh — $DIG CAT2 (10^3 Mojos) Exchange, >= REFERENCED Provenance Royalty Floor & 60/25/10/5% Royalties',
        ''
      ].join('\n');
      setSecurityHeaders(res, pathname, activePlane);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(text);
      return;
    }

    if (pathname === '/api/nousgent/status' && req.method === 'GET') {
      const forceRefresh = parsedUrl.searchParams.get('refresh') === '1';
      const liveEco = await liveClient.getLiveSnapshot({ forceRefresh });
      const missionStatus = engine.getMissionStatus(liveEco);
      const rsiLeaderboard = mergeEnlistedRigsIntoRsiLeaderboard(
        liveEco.rsiLeaderboardBase,
        missionStatus.leaderboard.recentRigs
      );
      const recentEvolutions = buildRecentEvolutionsFeed({
        recentCapsules: liveEco.dbrain?.recentCapsules || [],
        missions: missionStatus.missions,
        blindSpotQuests: missionStatus.blindSpotQuests,
        rejectedEdits: missionStatus.rejectedEdits,
        esSeedPulses: missionStatus.esSeedPulses,
        limit: 10
      });
      sendJson(
        res,
        200,
        {
          ...missionStatus,
          recentEvolutions,
          rsiLeaderboard,
          daoSingletonId: nousgent.DAO_SINGLETON_ID,
          halo: haloClient.getPublicRuntimeSummary(),
          uiConfig: voiceSynth.getUiRuntimeConfig()
        },
        pathname,
        activePlane
      );
      return;
    }

    if (pathname === '/api/nousgent/tts' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const out = await voiceSynth.synthesizeSpeechWav(body.text || '');
      setSecurityHeaders(res, pathname, activePlane);
      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': String(out.wavBuffer.length),
        'Cache-Control': 'no-store',
        'X-Nousgent-Voice-Model': out.voiceModel,
        'X-Nousgent-Voice-Engine': out.voiceEngine
      });
      res.end(out.wavBuffer);
      return;
    }

    if (pathname === '/api/nousgent/pod-bay/challenge' && req.method === 'POST') {
      const body = await readJsonBody(req);
      await liveClient.runLiveOrganPromptPipeline(body.prompt || '');
      sendJson(res, 200, engine.runPodBayChallenge(body), pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/ask' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const askOut = await runAskWithLiveOrgans(body);
      if (askOut.blindSpotLogged) {
        await peerReplicator.broadcastLocalMutation({ reason: 'quest_logged' });
        evolutionsHub.notifyEvolutionChanged('quest_logged');
      }
      sendJson(res, 200, askOut, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/bisect' && req.method === 'POST') {
      const body = await readJsonBody(req);
      sendJson(res, 200, engine.simulateBisect(body), pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/nodes/leaderboard' && req.method === 'GET') {
      const liveEco = await liveClient.getLiveSnapshot();
      const snap = engine.meshStore.getLeaderboardSnapshot(liveEco.dbrain.verifiedMerkleRoot);
      const rsiLeaderboard = mergeEnlistedRigsIntoRsiLeaderboard(
        liveEco.rsiLeaderboardBase,
        snap.recentRigs
      );
      sendJson(res, 200, { ...snap, rsiLeaderboard }, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/nodes/enlist' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const enlisted = engine.enlistRig(body);
      await peerReplicator.broadcastLocalMutation({ reason: 'node_enlisted' });
      evolutionsHub.notifyEvolutionChanged('node_enlisted');
      sendJson(res, 201, enlisted, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/missions' && req.method === 'GET') {
      sendJson(
        res,
        200,
        { daoSingletonId: nousgent.DAO_SINGLETON_ID, missions: engine.listMissions() },
        pathname,
        activePlane
      );
      return;
    }

    if (pathname === '/api/nousgent/dao/proposals' && req.method === 'GET') {
      sendJson(
        res,
        200,
        { daoSingletonId: nousgent.DAO_SINGLETON_ID, proposals: engine.listMissions() },
        pathname,
        activePlane
      );
      return;
    }

    if (pathname === '/api/nousgent/dao/proposals' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const out = engine.createDaoProposal(body);
      if (out.ok) {
        await peerReplicator.broadcastLocalMutation({ reason: 'dao_proposal' });
        evolutionsHub.notifyEvolutionChanged('dao_proposal');
      }
      const statusCode = out.ok ? 201 : out.code === 'SUBHARNESS_TIER2_SPEND_DENIED' ? 403 : 400;
      sendJson(res, statusCode, out, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/dao/vote' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const out = engine.castDaoVote(body);
      if (out.ok) {
        await peerReplicator.broadcastLocalMutation({ reason: 'dao_vote' });
        evolutionsHub.notifyEvolutionChanged('dao_vote');
      }
      const statusCode = out.ok
        ? 200
        : out.code === 'DUPLICATE_VOTE_NULLIFIER'
          ? 409
          : out.code === 'SUBHARNESS_TIER2_SPEND_DENIED'
            ? 403
            : 400;
      sendJson(res, statusCode, out, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/halo/status' && req.method === 'GET') {
      sendJson(res, 200, await haloClient.probeHaloStatus(), pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/agents/infer' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const out = await runGuardedLocalAgentInference(body);
      sendJson(res, out.statusCode, out.payload, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/agents/embed' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const out = await haloClient.createEmbeddings(body.input);
      sendJson(res, out.ok ? 200 : out.configured === false ? 503 : 400, out, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/evolve/candidates' && req.method === 'GET') {
      const liveEco = await liveClient.getLiveSnapshot();
      sendJson(
        res,
        200,
        {
          ok: true,
          liveCapsulesTotal: liveEco.dbrain.liveCapsulesTotal,
          blindSpotQuests: engine.listBlindSpotQuests(liveEco.dbrain.liveCapsulesTotal || 100),
          autonomousQueue: liveEco.liquidish.autonomousCandidateQueue || [],
          rejectedEdits: engine.listRejectedEdits(),
          esSeedPulses: engine.listEsSeedPulses(),
          frozenServe: engine.getFrozenServePointer(
            liveEco.dbrain.primaryGeneration,
            liveEco.dbrain.verifiedMerkleRoot
          )
        },
        pathname,
        activePlane
      );
      return;
    }

    if (pathname === '/api/nousgent/evolve/surrogate' && (req.method === 'GET' || req.method === 'POST')) {
      const body = req.method === 'POST' ? await readJsonBody(req) : {};
      const specParam = parsedUrl.searchParams.get('specialization') || body.specialization || undefined;
      sendJson(
        res,
        200,
        engine.runSurrogateAndSleepEs({ ...body, ...(specParam ? { specialization: specParam } : {}) }),
        pathname,
        activePlane
      );
      return;
    }

    if (
      (pathname === '/api/dbrain/ontology/coverage' || pathname === '/api/nousgent/ontology/coverage') &&
      (req.method === 'GET' || req.method === 'POST')
    ) {
      const body = req.method === 'POST' ? await readJsonBody(req) : {};
      const liveEco = await liveClient.getLiveSnapshot();
      const query = String(body.query ?? parsedUrl.searchParams.get('q') ?? parsedUrl.searchParams.get('query') ?? '');
      const rawSymbols = Array.isArray(body.symbols)
        ? body.symbols
        : (parsedUrl.searchParams.get('symbols') || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
      const coverage = engine.evaluateQueryCoverage({
        query,
        symbols: rawSymbols,
        capsules: Array.isArray(body.capsules) ? body.capsules : liveEco.dbrain.recentCapsules || [],
        orderbookCandidates: Array.isArray(body.orderbookCandidates)
          ? body.orderbookCandidates
          : liveEco.liquidish.autonomousCandidateQueue || []
      });
      sendJson(res, 200, coverage, pathname, activePlane);
      return;
    }

    if (
      (pathname === '/api/dbrain/ontology/reconcile' || pathname === '/api/nousgent/ontology/reconcile') &&
      req.method === 'POST'
    ) {
      const body = await readJsonBody(req);
      sendJson(res, 200, engine.reconcileOntology(body), pathname, activePlane);
      return;
    }

    if (
      (pathname === '/api/dthalamus/provenance/grade' || pathname === '/api/nousgent/provenance/grade') &&
      (req.method === 'GET' || req.method === 'POST')
    ) {
      if (req.method === 'GET') {
        sendJson(
          res,
          200,
          {
            status: 'ok',
            ...engine.getEpistemicStats()
          },
          pathname,
          activePlane
        );
        return;
      }
      const body = await readJsonBody(req);
      sendJson(res, 200, engine.gradeEpisodeProvenance(body), pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/specialization/audit' && (req.method === 'GET' || req.method === 'POST')) {
      const body = req.method === 'POST' ? await readJsonBody(req) : {};
      const actionParam = parsedUrl.searchParams.get('action') || body.action || 'all';
      sendJson(
        res,
        200,
        engine.auditSpecializationAndHarness({ ...body, action: actionParam }),
        pathname,
        activePlane
      );
      return;
    }

    if (pathname === '/api/nousgent/evolve/promote' && req.method === 'POST') {
      const body = await readJsonBody(req);
      if (body && body.questId) {
        const promoted = engine.promoteQuestToDao({
          questId: body.questId,
          proposerDid: body.proposerDid
        });
        if (promoted.ok) {
          await peerReplicator.broadcastLocalMutation({ reason: 'evolve_promote' });
          evolutionsHub.notifyEvolutionChanged('evolve_promote');
        }
        sendJson(res, promoted.ok ? 200 : 404, promoted, pathname, activePlane);
        return;
      }
      const capId = String(body?.capsuleId || '').trim();
      const rawTitle = String(body?.title || '').trim();
      const created = engine.createDaoProposal({
        title: rawTitle ? `Acquire: ${rawTitle.slice(0, 72)}` : capId,
        summary: `Verify and assimilate candidate capsule ${capId || rawTitle} into NOUSGENT cortex.`,
        category: 'CAPABILITY_SYNTHESIS',
        rewardDig: String(body?.priceDig || '25.000'),
        proposerDid: body?.proposerDid
      });
      if (created.ok) {
        await peerReplicator.broadcastLocalMutation({ reason: 'evolve_promote' });
        evolutionsHub.notifyEvolutionChanged('evolve_promote');
      }
      sendJson(res, created.ok ? 201 : 400, created, pathname, activePlane);
      return;
    }

    async function evaluateAndQuoteTeachRequest() {
      const body = await readJsonBody(req);
      const liveEco = await liveClient.getLiveSnapshot();
      const evalOut = engine.evaluateTeachSubmission(body, liveEco.dbrain.liveCapsulesTotal || 100);
      if (!evalOut.ok) {
        const status =
          evalOut.code === 'RING0_TEACH_REJECTED' ||
          evalOut.code === 'SUBHARNESS_TIER2_SPEND_DENIED' ||
          evalOut.code === 'SPECIALIZATION_WRITE_OUTSIDE_CEILING'
            ? 403
            : evalOut.code === 'SOFT_HURT_REJECTED'
              ? 422
              : 400;
        if (evalOut.code === 'SOFT_HURT_REJECTED') {
          await peerReplicator.broadcastLocalMutation({ reason: 'soft_hurt_rejected' });
          evolutionsHub.notifyEvolutionChanged('soft_hurt_rejected');
        }
        sendJson(res, status, evalOut, pathname, activePlane);
        return null;
      }
      const liveQuote = await liveClient.quoteTeachCapsule(evalOut);
      const autoPriceDig = liveQuote !== null ? Number(liveQuote).toFixed(3) : evalOut.autoPriceDig;
      return { evalOut, autoPriceDig, liveEco };
    }

    if (pathname === '/api/nousgent/teach/preview' && req.method === 'POST') {
      const quoted = await evaluateAndQuoteTeachRequest();
      if (!quoted) return;
      sendJson(res, 200, { ...quoted.evalOut, autoPriceDig: quoted.autoPriceDig }, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/teach/submit' && req.method === 'POST') {
      const quoted = await evaluateAndQuoteTeachRequest();
      if (!quoted) return;
      const { evalOut, autoPriceDig, liveEco } = quoted;

      if (evalOut.tier2ClearSignRequired) {
        const proposal = engine.createDaoProposal({
          title: `Alignment Teach: ${evalOut.title.slice(0, 72)}`,
          summary: evalOut.content.slice(0, 260),
          category: 'IMMUNE_ANTIBODY',
          rewardDig: autoPriceDig,
          proposerDid: evalOut.authorDid
        });
        if (proposal.ok) {
          await peerReplicator.broadcastLocalMutation({ reason: 'teach_alignment_proposal' });
          evolutionsHub.notifyEvolutionChanged('teach_alignment_proposal');
        }
        sendJson(
          res,
          202,
          {
            ...evalOut,
            autoPriceDig,
            status: 'PAUSED_AWAITING_CHIP0043_CLEAR_SIGN',
            rpcErrorCode: -32044,
            mission: proposal.mission
          },
          pathname,
          activePlane
        );
        return;
      }

      const minted = await liveClient.mintTeachCapsule(evalOut);
      if (!minted.ok) {
        sendJson(res, 503, { ok: false, error: minted.error }, pathname, activePlane);
        return;
      }
      const frozenServe = engine.advanceFrozenServePointer({
        generation: Number(liveEco.dbrain.primaryGeneration || 1) + 1,
        merkleRoot: minted.merkleRoot
      });
      await peerReplicator.broadcastLocalMutation({
        reason: 'teach_minted',
        forceUpstreamRefresh: true
      });
      evolutionsHub.notifyEvolutionChanged('teach_minted', { forceUpstreamRefresh: true });
      sendJson(
        res,
        201,
        {
          ...evalOut,
          autoPriceDig,
          status: 'MINTED_TO_DBRAIN',
          capsuleId: minted.capsuleId,
          merkleRoot: minted.merkleRoot,
          frozenServe
        },
        pathname,
        activePlane
      );
      return;
    }

    if (pathname === '/api/nousgent/missions/clear-sign' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const out = engine.submitClearSignVote(body);
      if (out.ok) {
        await peerReplicator.broadcastLocalMutation({ reason: 'two_key_sign' });
        evolutionsHub.notifyEvolutionChanged('two_key_sign');
      }
      const statusCode = out.ok ? 200 : out.code === 'SUBHARNESS_TIER2_SPEND_DENIED' ? 403 : 400;
      sendJson(res, statusCode, out, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/morphic/pulse' && req.method === 'POST') {
      const body = await readJsonBody(req);
      let acceptedRejectedEdits = 0;
      let acceptedEsSeedPulses = 0;
      if (Array.isArray(body && body.rejectedEdits)) {
        for (const rej of body.rejectedEdits.slice(0, 16)) {
          const rec = engine.recordRejectedEdit(rej);
          if (rec.ok) acceptedRejectedEdits += 1;
        }
      }
      if (Array.isArray(body && body.esSeedPulses)) {
        for (const seedEnv of body.esSeedPulses.slice(0, 16)) {
          const rec = engine.recordEsSeedPulse(seedEnv);
          if (rec.ok) {
            acceptedEsSeedPulses += 1;
            await liveClient.forwardEsSeedPulse(seedEnv);
          }
        }
      }
      if (acceptedRejectedEdits > 0 || acceptedEsSeedPulses > 0) {
        await peerReplicator.broadcastLocalMutation({
          reason: 'morphic_pulse',
          forceUpstreamRefresh: acceptedEsSeedPulses > 0
        });
        evolutionsHub.notifyEvolutionChanged('morphic_pulse', {
          forceUpstreamRefresh: acceptedEsSeedPulses > 0
        });
      }
      const liveEco = await liveClient.getLiveSnapshot();
      const status = engine.getMissionStatus(liveEco);
      sendJson(
        res,
        200,
        {
          ok: true,
          plane: 'm2m_ia',
          receivedFrom: String(body.callsign || 'NOUSGENT-SWARM-NODE'),
          bariScorePct: status.bari.bariScorePct,
          verifiedDataLayerRoot: status.leaderboard.verifiedDataLayerRoot,
          frozenServe: status.frozenServe,
          acceptedRejectedEdits,
          acceptedEsSeedPulses
        },
        pathname,
        activePlane
      );
      return;
    }

    if (pathname.startsWith('/api/nousgent/card/') && pathname.endsWith('.svg') && req.method === 'GET') {
      const rawCallsign = decodeURIComponent(pathname.slice('/api/nousgent/card/'.length, -4));
      const liveEco = await liveClient.getLiveSnapshot();
      const svg = engine.renderFlightDossierSvg(rawCallsign, {
        activeMorphicBrainsCount: liveEco.dbrain.activeMorphicBrainsCount,
        liveCapsulesTotal: liveEco.dbrain.liveCapsulesTotal,
        verifiedMerkleRoot: liveEco.dbrain.verifiedMerkleRoot
      });
      setSecurityHeaders(res, pathname, activePlane);
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(svg);
      return;
    }

    if (pathname === '/api/nousgent/observability/alerts' && req.method === 'GET') {
      sendJson(
        res,
        200,
        {
          status: 'ok',
          observability: NOUSGENT_OBSERVABILITY_STACK,
          rulesCount: NOUSGENT_ALERT_RULES_CATALOG.length,
          rules: NOUSGENT_ALERT_RULES_CATALOG,
          recentDeliveries: recentAlertDeliveries
        },
        pathname,
        activePlane
      );
      return;
    }

    if (pathname === '/api/nousgent/observability/dashboards' && req.method === 'GET') {
      const obsDir = path.join(__dirname, 'deploy/resources/observability');
      const dashboards = FIVE_ORGAN_DASHBOARD_CATALOG.map((entry) => {
        const dashPath = path.join(obsDir, entry.file);
        let visualizationPanels = 0;
        let rowSections = 0;
        let promqlTargets = 0;
        let schemaVersion = 39;
        let tags = [];
        if (fs.existsSync(dashPath)) {
          const parsed = JSON.parse(fs.readFileSync(dashPath, 'utf8'));
          const allPanels = Array.isArray(parsed.panels) ? parsed.panels : [];
          visualizationPanels = allPanels.filter((p) => p && p.type !== 'row').length;
          rowSections = allPanels.filter((p) => p && p.type === 'row').length;
          promqlTargets = allPanels.reduce(
            (acc, p) => acc + (Array.isArray(p && p.targets) ? p.targets.length : 0),
            0
          );
          schemaVersion = Number(parsed.schemaVersion || 39);
          tags = Array.isArray(parsed.tags) ? parsed.tags : [];
        }
        return {
          ...entry,
          schemaVersion,
          rowSections,
          visualizationPanels,
          promqlTargets,
          tags
        };
      });
      sendJson(
        res,
        200,
        {
          status: 'ok',
          folder: NOUSGENT_OBSERVABILITY_STACK.folder,
          dashboardsCount: dashboards.length,
          totalVisualizationPanels: dashboards.reduce((acc, d) => acc + d.visualizationPanels, 0),
          totalPromqlTargets: dashboards.reduce((acc, d) => acc + d.promqlTargets, 0),
          scrapeJobs: NOUSGENT_OBSERVABILITY_STACK.scrapeJobs,
          dashboards
        },
        pathname,
        activePlane
      );
      return;
    }

    if (
      pathname.startsWith('/api/nousgent/observability/dashboards/') &&
      pathname.endsWith('.json') &&
      req.method === 'GET'
    ) {
      const slug = pathname
        .slice('/api/nousgent/observability/dashboards/'.length, -'.json'.length)
        .toLowerCase();
      const entry = DASHBOARD_BY_SLUG.get(slug);
      if (!entry) {
        sendJson(res, 404, { error: 'Unknown observability dashboard slug' }, pathname, activePlane);
        return;
      }
      const dashPath = path.join(__dirname, 'deploy/resources/observability', entry.file);
      if (!fs.existsSync(dashPath)) {
        sendJson(res, 404, { error: 'Dashboard artifact missing on disk' }, pathname, activePlane);
        return;
      }
      setSecurityHeaders(res, pathname, activePlane);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(fs.readFileSync(dashPath));
      return;
    }

    if (pathname === '/api/nousgent/observability/dashboard.json' && req.method === 'GET') {
      const dashPath = path.join(__dirname, 'deploy/resources/observability/grafana-nousgent-soc-dashboard.json');
      if (fs.existsSync(dashPath)) {
        setSecurityHeaders(res, pathname, activePlane);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(fs.readFileSync(dashPath));
        return;
      }
      sendJson(res, 200, { uid: 'nousgent-cleanroom-soc-v1', title: 'NOUSGENT Dual-Host SOC' }, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/alerts/webhook' && req.method === 'POST') {
      const body = await readJsonBody(req);
      recentAlertDeliveries.unshift({ receivedAt: new Date().toISOString(), payload: body });
      if (recentAlertDeliveries.length > 32) recentAlertDeliveries.pop();
      sendJson(res, 200, { ok: true, recorded: recentAlertDeliveries.length }, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/evolutions/stream' && req.method === 'GET') {
      const rawFrames = Number(parsedUrl.searchParams.get('frames') || 0);
      const maxFrames = Number.isFinite(rawFrames) && rawFrames > 0 ? Math.min(32, Math.floor(rawFrames)) : 0;
      await evolutionsHub.handleStreamRequest(req, res, {
        setSecurityHeaders,
        pathname,
        activePlane,
        maxFrames
      });
      return;
    }

    if (pathname === '/api/nousgent/stream' && req.method === 'GET') {
      const frames = Math.max(1, Math.min(16, Number(parsedUrl.searchParams.get('frames') || 4)));
      setSecurityHeaders(res, pathname, activePlane);
      res.writeHead(200, {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no'
      });
      const liveEco = await liveClient.getLiveSnapshot();
      const st = engine.getMissionStatus(liveEco);
      for (let i = 1; i <= frames; i += 1) {
        const organObj = st.bari.organs[(i - 1) % st.bari.organs.length];
        const frame = {
          seq: i,
          ts: new Date().toISOString(),
          host: planeInfo.host,
          plane: activePlane,
          flagshipAgent: 'NOUSGENT',
          bariScorePct: st.bari.bariScorePct,
          catastrophicForgettingPct: st.bari.catastrophicForgettingPct,
          dbrainGeneration: liveEco.dbrain.primaryGeneration,
          dbrainMorphicBrains: liveEco.dbrain.activeMorphicBrainsCount,
          dbrainLiveCapsules: liveEco.dbrain.liveCapsulesTotal,
          liquidishRoyaltiesDig: liveEco.liquidish.royaltiesStreamedDig,
          shiM2mRequests: liveEco.liquidish.shiM2mRequestsCount,
          humanRequests: st.planes.humanRequests,
          m2mRequests: st.planes.m2mRequests,
          organ: organObj.domain,
          organStatus: organObj.status,
          organLatencyMs: organObj.latencyMs
        };
        res.write(JSON.stringify(frame) + '\n');
      }
      res.end();
      return;
    }

    if (
      (pathname === '/api/nousgent/mcp/skills' || pathname === '/api/dbrain/mcp/skills') &&
      req.method === 'GET'
    ) {
      const skillsScope = parsedUrl.searchParams.get('skills') || '';
      const cursor = parsedUrl.searchParams.get('cursor') || null;
      const pageSize = Number(parsedUrl.searchParams.get('pageSize') || 20);
      const listed = nousgent.listNousgentMcpSkills({ cursor, pageSize, skillsScope });
      const resources = nousgent.listNousgentMcpSkillResources({ skillsScope });
      sendJson(
        res,
        200,
        {
          status: 'ok',
          protocol: nousgent.DBRAIN_MCP_SKILLS_PROTOCOL,
          extensionId: nousgent.MCP_SKILLS_EXTENSION_ID,
          supportedProtocolVersions: nousgent.SUPPORTED_MCP_PROTOCOL_VERSIONS,
          skillsScope: skillsScope || 'all',
          ...listed,
          resourcesCount: resources.length,
          stats: engine.skillsFirewall.getStats()
        },
        pathname,
        activePlane
      );
      return;
    }

    if (
      (pathname === '/api/nousgent/mcp/skills-firewall' || pathname === '/api/dthalamus/mcp/skills-firewall') &&
      (req.method === 'GET' || req.method === 'POST')
    ) {
      const body = req.method === 'POST' ? await readJsonBody(req) : {};
      const preset = parsedUrl.searchParams.get('preset') || body.preset || 'verified';
      const skillName = parsedUrl.searchParams.get('skill') || body.skillName || nousgent.NOUSGENT_SKILL_NAME;
      const uri = parsedUrl.searchParams.get('uri') || body.uri || undefined;
      const capsules = uri ? await resolveCapsulesForSkillUri(uri) : [];
      const out = engine.verifySkillResource({
        ...body,
        preset,
        skillName,
        ...(uri ? { uri } : {}),
        capsules
      });
      sendJson(res, 200, out, pathname, activePlane);
      return;
    }

    if (
      (pathname === '/api/nousgent/vno/skills' || pathname === '/api/dolfactory/vno/skills') &&
      (req.method === 'GET' || req.method === 'POST')
    ) {
      if (req.method === 'GET') {
        const baseline = engine.auditVnoSkillCatalog();
        sendJson(
          res,
          200,
          {
            status: 'ok',
            protocol: baseline.protocol,
            extensionId: baseline.extensionId,
            version: baseline.version,
            guardCartridges: baseline.guardCartridges,
            totalReceptorsWhenEnabled: baseline.totalReceptorsWhenEnabled,
            servedSkillsCount: engine.skillsFirewall.getStats().bundledSkillsCount
          },
          pathname,
          activePlane
        );
        return;
      }
      const body = await readJsonBody(req);
      sendJson(res, 200, engine.auditVnoSkillCatalog(body), pathname, activePlane);
      return;
    }

    if (pathname === '/api/mcp' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const skillsScope = parsedUrl.searchParams.get('skills') || '';
      if (Array.isArray(body)) {
        const batchOut = (await Promise.all(body.map((item) => handleMcpRpc(item, { skillsScope })))).filter(
          (item) => item !== null
        );
        if (batchOut.length === 0) {
          setSecurityHeaders(res, pathname, activePlane);
          res.writeHead(204);
          res.end();
          return;
        }
        sendJson(res, 200, batchOut, pathname, activePlane);
        return;
      }
      const out = await handleMcpRpc(body, { skillsScope });
      if (out === null) {
        setSecurityHeaders(res, pathname, activePlane);
        res.writeHead(204);
        res.end();
        return;
      }
      sendJson(res, 200, out, pathname, activePlane);
      return;
    }

    if (pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: `Unknown NOUSGENT API endpoint: ${pathname}` }, pathname, activePlane);
      return;
    }

    if (pathname.startsWith('/dApp/')) {
      const rel = pathname.slice('/dApp/'.length) || 'index.html';
      if (tryServeStaticFile(req, res, DAPP_DIR, rel, pathname, activePlane)) return;
    }

    if (pathname !== '/' && tryServeStaticFile(req, res, DIST_DIR, pathname, pathname, activePlane)) return;
    if (pathname !== '/' && tryServeStaticFile(req, res, PUBLIC_DIR, pathname, pathname, activePlane)) return;

    const indexCandidate = fs.existsSync(path.join(DIST_DIR, 'index.html'))
      ? path.join(DIST_DIR, 'index.html')
      : path.join(__dirname, 'index.html');
    const rawHtml = fs.readFileSync(indexCandidate, 'utf8');
    const renderedHtml = renderHtmlWithSeo(rawHtml, pathname, activePlane);
    const htmlBuf = Buffer.from(renderedHtml, 'utf8');
    setSecurityHeaders(res, pathname, activePlane);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': String(htmlBuf.length),
      'Cache-Control': 'no-cache'
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(htmlBuf);
  } catch (err) {
    const code = Number(err && err.statusCode) || 500;
    sendJson(res, code, { error: err && err.message ? err.message : 'Internal Server Error' });
  }
});

boundServerRef = server;
server.on('close', () => {
  evolutionsHub.closeAll();
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    peerReplicator.startBackgroundSync();
    console.log(
      `[NOUSGENT v${APP_VERSION}] Orbital Cleanroom listening on :${PORT} (Human: ${CANONICAL_ORIGIN} | M2M: ${M2M_ORIGIN})`
    );
  });
}

module.exports = { server, engine, peerReplicator, evolutionsHub, resolveClientIp };
