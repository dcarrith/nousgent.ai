'use strict';

/**
 * ============================================================================
 * nousgent.ai & ia.nousgent.ai — Hardened Node 22 HTTP, MCP & M2M Swarm Server
 * Primary Human Portal: https://nousgent.ai (`www.nousgent.ai` -> 301 Redirect)
 * Dedicated M2M / A2A Plane: https://ia.nousgent.ai (`plane="m2m_ia"`)
 * ============================================================================
 */

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const nousgent = require('./lib/nousgent-core.js');
const {
  createLiveEcosystemClient,
  mergeEnlistedRigsIntoRsiLeaderboard
} = require('./server/live-ecosystem-client.js');
const { createNousgentVoiceSynthesizer } = require('./server/voice-synthesizer.js');
const { createLocalHaloClient } = require('./server/local-halo-client.js');
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

const engine = nousgent.createNousgentEngine({ stateDir: STATE_DIR });
const liveClient = createLiveEcosystemClient(process.env);
const voiceSynth = createNousgentVoiceSynthesizer({ env: process.env, stateDir: STATE_DIR, repoRoot: __dirname });
const haloClient = createLocalHaloClient(process.env);
void voiceSynth.warmupSession();

const renderHtmlWithSeo = createHtmlMetadataRenderer({
  canonicalOrigin: CANONICAL_ORIGIN,
  m2mOrigin: M2M_ORIGIN,
  appVersion: APP_VERSION,
  getMaskOpacityPct: () => voiceSynth.getUiRuntimeConfig().maskOpacityPct
});

const recentAlertDeliveries = [];

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
    expr: 'increase(nousgent_redteam_deflections_total[5m]) > 25'
  },
  {
    alert: 'NousgentBariReadinessDrop',
    severity: 'critical',
    plane: 'bari-index',
    expr: 'nousgent_bari_score_pct < 75'
  },
  {
    alert: 'NousgentUpstreamOrganDegraded',
    severity: 'warning',
    plane: 'morphic-mesh',
    expr: 'nousgent_upstream_organs_reachable < 5'
  },
  {
    alert: 'NousgentClearSignCeremonySpike',
    severity: 'info',
    plane: 'chip0043-quorum',
    expr: 'increase(nousgent_clear_sign_signatures_total[10m]) > 10'
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
    alert: 'NousgentHighMemoryFootprint',
    severity: 'warning',
    plane: 'statefulset',
    expr: 'process_resident_memory_bytes{job="nousgent-web"} > 900000000'
  },
  {
    alert: 'NousgentDbrainLiveCapsulesCheck',
    severity: 'info',
    plane: 'wal-storage',
    expr: 'nousgent_dbrain_live_capsules_total > 0'
  }
]);

const NOUSGENT_OBSERVABILITY_STACK = Object.freeze({
  namespace: 'dbrain',
  deployCmd: 'bash deploy/scripts/deploy.sh --cluster kind-kind --with-observability',
  dashboardUid: 'nousgent-cleanroom-soc-v1',
  dashboardJsonEndpoint: '/api/nousgent/observability/dashboard.json',
  alertWebhookEndpoint: '/api/nousgent/alerts/webhook',
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

function readJsonBody(req, maxBytes = 262144) {
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
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Invalid JSON payload'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

async function runAskWithLiveOrgans(body = {}) {
  const promptText = String(body.prompt || '');
  if (Array.isArray(body.recalledCapsules)) {
    const ecosystem = await liveClient.getLiveSnapshot();
    const basePayload = {
      ...body,
      liveGeneration: ecosystem.dbrain.primaryGeneration,
      liveMerkleRoot: ecosystem.dbrain.verifiedMerkleRoot
    };
    const prelim = engine.mindArena.askPersona(basePayload);
    if (prelim.answerMode === 'UNCHARTED_BLIND_SPOT_QUEST' && haloClient.getConfig().personaQa.configured) {
      const haloOut = await haloClient.queryFrontierFallback(promptText, body.recalledCapsules);
      if (haloOut.ok && haloOut.text) {
        return engine.askNousgent({
          ...basePayload,
          localHaloAnswer: { text: haloOut.text, model: haloOut.model, latencyMs: haloOut.latencyMs }
        });
      }
    }
    return engine.askNousgent(basePayload);
  }

  const livePipe = await liveClient.runLiveOrganPromptPipeline(promptText);
  const autoQuoteDig =
    livePipe.liquidishAutoQuote?.quote?.priceDig !== undefined
      ? Number(livePipe.liquidishAutoQuote.quote.priceDig).toFixed(3)
      : undefined;
  const basePayload = {
    ...body,
    recalledCapsules: livePipe.recalledCapsules,
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
  const prelim = engine.mindArena.askPersona(basePayload);
  if (prelim.answerMode === 'UNCHARTED_BLIND_SPOT_QUEST' && haloClient.getConfig().personaQa.configured) {
    const haloOut = await haloClient.queryFrontierFallback(promptText, livePipe.recalledCapsules);
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
  if (promptStr) {
    const check = engine.podBay.evaluateChallenge({
      prompt: promptStr,
      sessionId: `agent-${Date.now()}`
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
  const out = await haloClient.runAgentInference(body);
  return {
    statusCode: out.ok ? 200 : out.configured === false ? 503 : 400,
    payload: out
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
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'nousgent_pod_bay_challenge',
    description: 'Run an adversarial prompt or unsigned airlock actuation test against NOUSGENT Cranial Nerve I + Ring-0 Thalamus + Dentate Cortex.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        mode: { type: 'string', enum: ['airlock', 'paradox', 'plume'] }
      },
      required: ['prompt']
    }
  },
  {
    name: 'nousgent_simulate_bisect',
    description: 'Compare 1968 Dave Bowman physical screwdriver core pull against O(log N) dbrain bisect across N capsule generations.',
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
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'nousgent_submit_clear_sign',
    description: 'Submit a Two-Key CHIP-0043 Clear-Sign co-signature (requires keyAArmed=true and keyBArmed=true).',
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
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'nousgent_ask_persona',
    description: 'Converse directly with NOUSGENT across live dolfactory.to, dthalamus.to, dbrain.to, cbrain.to, shi.liquidi.sh, and optional local Ryzen AI Halo fallback.',
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
    description: 'Execute a Ring-0 screened autonomous agent task (persona_qa, rsi_synthesizer, dream_consolidator, redteam_auditor, general_agent) against the configured local AMD Ryzen AI Halo OpenAI-compatible endpoint.',
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
  }
]);

async function handleMcpRpc(body) {
  const id = body && Object.prototype.hasOwnProperty.call(body, 'id') ? body.id : null;
  const method = body && body.method;
  const params = (body && body.params) || {};

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2025-03-26',
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: 'ia.nousgent.ai-mcp',
          version: APP_VERSION,
          humanPortal: CANONICAL_ORIGIN,
          m2mSwarmPlane: M2M_ORIGIN
        }
      }
    };
  }
  if (method === 'notifications/initialized' || method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }
  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } };
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
    else if (name === 'nousgent_enlist_rig') data = engine.enlistRig(args);
    else if (name === 'nousgent_list_missions') data = { missions: engine.listMissions() };
    else if (name === 'nousgent_submit_clear_sign') data = engine.submitClearSignVote(args);
    else if (name === 'nousgent_get_plane_telemetry') data = engine.meshStore.getPlaneTelemetry();
    else if (name === 'nousgent_ask_persona') data = await runAskWithLiveOrgans(args);
    else if (name === 'nousgent_local_agent_infer') data = (await runGuardedLocalAgentInference(args)).payload;
    else if (name === 'nousgent_create_dao_proposal') data = engine.createDaoProposal(args);
    else if (name === 'nousgent_cast_dao_vote') data = engine.castDaoVote(args);
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
          submodules: status.bari.submoduleVersions
        },
        pathname,
        activePlane
      );
      return;
    }

    if ((pathname === '/metrics' || pathname === '/api/nousgent/metrics') && req.method === 'GET') {
      const liveEco = await liveClient.getLiveSnapshot();
      const body = engine.renderPrometheusMetrics(liveEco);
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
      sendJson(
        res,
        200,
        {
          protocolVersion: '2025-03-26',
          serverName: 'ia.nousgent.ai-mcp',
          version: APP_VERSION,
          endpoint: `${M2M_ORIGIN}/api/mcp`,
          humanPortal: CANONICAL_ORIGIN,
          tools: MCP_TOOLS.map((t) => t.name)
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
        `- MCP 2025-03-26 JSON-RPC Endpoint: ${M2M_ORIGIN}/api/mcp`,
        `- Unbuffered NDJSON Telemetry Stream: ${M2M_ORIGIN}/api/nousgent/stream`,
        `- 1-Command Citizen Installer: curl -fsSL ${CANONICAL_ORIGIN}/enlist.sh | sh -s -- --chip=0043`,
        '',
        '## 5-Organ Orthogonal Bus',
        '1. https://dolfactory.to — Cranial Nerve I Pre-Thalamic IPS & 2,048-KC Fly-LSH Immunity',
        '2. https://dthalamus.to — Ring-0 Reference Monitor, OS Sandbox & Two-Key CHIP-0043 Gate',
        '3. https://dbrain.to — 5-Lobe Chia Merkle Cortex, 0.00% Forgetting WAL & O(log N) Git Bisect',
        '4. https://cbrain.to — Live 4D WebGL/wasm32 Connectome Observatory',
        '5. https://shi.liquidi.sh — $DIG CAT2 (10^3 Mojos) Exchange & 60/25/10/5% Citation Royalties',
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
      sendJson(
        res,
        200,
        {
          ...missionStatus,
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
      sendJson(res, 200, await runAskWithLiveOrgans(body), pathname, activePlane);
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
      sendJson(res, 201, engine.enlistRig(body), pathname, activePlane);
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
      sendJson(res, out.ok ? 201 : 400, out, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/dao/vote' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const out = engine.castDaoVote(body);
      const statusCode = out.ok ? 200 : out.code === 'DUPLICATE_VOTE_NULLIFIER' ? 409 : 400;
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
          autonomousQueue: liveEco.liquidish.autonomousCandidateQueue || []
        },
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
      sendJson(res, created.ok ? 201 : 400, created, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/teach/preview' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const liveEco = await liveClient.getLiveSnapshot();
      const evalOut = engine.evaluateTeachSubmission(body, liveEco.dbrain.liveCapsulesTotal || 100);
      if (!evalOut.ok) {
        const status = evalOut.code === 'RING0_TEACH_REJECTED' ? 403 : 400;
        sendJson(res, status, evalOut, pathname, activePlane);
        return;
      }
      const liveQuote = await liveClient.quoteTeachCapsule(evalOut);
      const autoPriceDig =
        liveQuote !== null ? Number(liveQuote).toFixed(3) : evalOut.autoPriceDig;
      sendJson(
        res,
        200,
        {
          ...evalOut,
          autoPriceDig
        },
        pathname,
        activePlane
      );
      return;
    }

    if (pathname === '/api/nousgent/teach/submit' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const liveEco = await liveClient.getLiveSnapshot();
      const evalOut = engine.evaluateTeachSubmission(body, liveEco.dbrain.liveCapsulesTotal || 100);
      if (!evalOut.ok) {
        const status = evalOut.code === 'RING0_TEACH_REJECTED' ? 403 : 400;
        sendJson(res, status, evalOut, pathname, activePlane);
        return;
      }
      const liveQuote = await liveClient.quoteTeachCapsule(evalOut);
      const autoPriceDig =
        liveQuote !== null ? Number(liveQuote).toFixed(3) : evalOut.autoPriceDig;

      if (evalOut.tier2ClearSignRequired) {
        const proposal = engine.createDaoProposal({
          title: `Alignment Teach: ${evalOut.title.slice(0, 72)}`,
          summary: evalOut.content.slice(0, 260),
          category: 'IMMUNE_ANTIBODY',
          rewardDig: autoPriceDig,
          proposerDid: evalOut.authorDid
        });
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
      sendJson(
        res,
        201,
        {
          ...evalOut,
          autoPriceDig,
          status: 'MINTED_TO_DBRAIN',
          capsuleId: minted.capsuleId,
          merkleRoot: minted.merkleRoot
        },
        pathname,
        activePlane
      );
      return;
    }

    if (pathname === '/api/nousgent/missions/clear-sign' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const out = engine.submitClearSignVote(body);
      sendJson(res, out.ok ? 200 : 400, out, pathname, activePlane);
      return;
    }

    if (pathname === '/api/nousgent/morphic/pulse' && req.method === 'POST') {
      const body = await readJsonBody(req);
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
          verifiedDataLayerRoot: status.leaderboard.verifiedDataLayerRoot
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

    if (pathname === '/api/mcp' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const out = Array.isArray(body) ? await Promise.all(body.map(handleMcpRpc)) : await handleMcpRpc(body);
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

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[NOUSGENT v${APP_VERSION}] Orbital Cleanroom listening on :${PORT} (Human: ${CANONICAL_ORIGIN} | M2M: ${M2M_ORIGIN})`
    );
  });
}

module.exports = { server, engine };
