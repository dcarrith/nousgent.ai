'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const US_STATE_HUBS = Object.freeze([
  { stateCode: 'IL', hubName: 'URBANA', subtitle: 'Birthplace Core', seedRigs: 0, storagePb: 0.0, mapX: 185, mapY: 65 },
  { stateCode: 'TX', hubName: 'ERCOT', subtitle: 'Sovereign Grid', seedRigs: 0, storagePb: 0.0, mapX: 155, mapY: 105 },
  { stateCode: 'WY', hubName: 'VAULT', subtitle: 'DUNA Sanctuary', seedRigs: 0, storagePb: 0.0, mapX: 105, mapY: 55 },
  { stateCode: 'CA', hubName: 'BAY', subtitle: 'Silicon Canopy', seedRigs: 0, storagePb: 0.0, mapX: 45, mapY: 85 },
  { stateCode: 'OH', hubName: 'CLE', subtitle: 'Great Lakes Mesh', seedRigs: 0, storagePb: 0.0, mapX: 225, mapY: 62 }
]);

const VALID_US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]);

const SEED_MISSIONS = Object.freeze([
  {
    missionId: 'NGT-ORDER-01',
    title: 'OPERATION CHIALISP & RUE FORMAL MASTERY',
    summary: 'Verify deterministic chia-dao-v1 CAT2 & Singleton spends across sovereign nodes.',
    progressPct: 0.0,
    rewardDig: '50000.000',
    quorumSignatures: 0,
    quorumTarget: 3,
    status: 'AWAITING_CHIP0043_QUORUM'
  },
  {
    missionId: 'NGT-ORDER-02',
    title: 'FLY-LSH POLYMORPHIC ANTIBODIES',
    summary: 'Synthesize pre-thalamic Cranial Nerve I odor antibodies on dolfactory.to with 0.00% false positives.',
    progressPct: 0.0,
    rewardDig: '100000.000',
    quorumSignatures: 0,
    quorumTarget: 3,
    status: 'ACTIVE_SWARM_HARVEST'
  },
  {
    missionId: 'NGT-ORDER-03',
    title: 'SLEEP-TIME DREAM CONSOLIDATION',
    summary: 'Distill verified multi-repo bug fixes on dbrain.to via Benna-Fusi Dreaming into durable .dig capsules.',
    progressPct: 0.0,
    rewardDig: '250000.000',
    quorumSignatures: 0,
    quorumTarget: 3,
    status: 'AWAITING_CHIP0043_QUORUM'
  }
]);

const ROYALTY_WATERFALL_TIERS = Object.freeze([
  { label: 'DIRECT ORIGIN CREATOR', sharePct: 60, bps: 6000 },
  { label: 'CITED ANCESTOR CAPSULES', sharePct: 25, bps: 2500 },
  { label: 'ROOT LINEAGE PROVERS', sharePct: 10, bps: 1000 },
  { label: 'PUBLIC LIBRARY VERIFIERS', sharePct: 5, bps: 500 }
]);

function computeRankForXp(xp) {
  if (xp >= 25000) return { tier: 5, title: 'Rank V: Urbana Sovereign Architect' };
  if (xp >= 10000) return { tier: 4, title: 'Rank IV: Thalamic Keyholder' };
  if (xp >= 5000) return { tier: 3, title: 'Rank III: Piriform Immunologist' };
  if (xp >= 2500) return { tier: 2, title: 'Rank II: Discovery Flight Engineer' };
  return { tier: 1, title: 'Rank I: Clavius Cadet' };
}

function classifyHostPlane(hostHeader = '', overridePlane = '') {
  const cleanHost = String(hostHeader || 'nousgent.ai').toLowerCase().split(':')[0].trim();
  if (overridePlane === 'm2m_ia' || cleanHost === 'ia.nousgent.ai' || cleanHost.startsWith('ia.')) {
    return { host: 'ia.nousgent.ai', plane: 'm2m_ia', isRedirectWww: false };
  }
  if (cleanHost === 'www.nousgent.ai') {
    return { host: 'www.nousgent.ai', plane: 'redirect_www', isRedirectWww: true };
  }
  return { host: 'nousgent.ai', plane: 'human_ui', isRedirectWww: false };
}

function createMorphicMeshStore(options = {}) {
  const dbPath =
    options.dbPath ||
    (options.stateDir
      ? (fs.mkdirSync(options.stateDir, { recursive: true }), path.join(options.stateDir, 'nousgent-wal.sqlite'))
      : ':memory:');

  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA secure_delete = ON;

    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    ) WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS state_hubs (
      state_code TEXT PRIMARY KEY,
      hub_name TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      rigs_count INTEGER NOT NULL,
      storage_pb REAL NOT NULL,
      map_x REAL NOT NULL,
      map_y REAL NOT NULL
    ) WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS enlisted_rigs (
      callsign TEXT PRIMARY KEY,
      state_code TEXT NOT NULL,
      execution_env TEXT NOT NULL,
      did TEXT NOT NULL,
      xp INTEGER NOT NULL,
      enlisted_at TEXT NOT NULL
    ) WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS swarm_missions (
      mission_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      progress_pct REAL NOT NULL,
      reward_dig TEXT NOT NULL,
      quorum_signatures INTEGER NOT NULL,
      quorum_target INTEGER NOT NULL,
      status TEXT NOT NULL
    ) WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS plane_counters (
      plane_key TEXT PRIMARY KEY,
      host TEXT NOT NULL,
      plane TEXT NOT NULL,
      requests_total INTEGER NOT NULL
    ) WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS runtime_counters (
      counter_key TEXT PRIMARY KEY,
      counter_val INTEGER NOT NULL
    ) WITHOUT ROWID;
  `);

  const existingHubs = db.prepare('SELECT COUNT(*) AS c FROM state_hubs').get().c;
  if (existingHubs === 0) {
    const insHub = db.prepare(
      'INSERT INTO state_hubs (state_code, hub_name, subtitle, rigs_count, storage_pb, map_x, map_y) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const h of US_STATE_HUBS) {
      insHub.run(h.stateCode, h.hubName, h.subtitle, h.seedRigs, h.storagePb, h.mapX, h.mapY);
    }
    const insMission = db.prepare(
      'INSERT INTO swarm_missions (mission_id, title, summary, progress_pct, reward_dig, quorum_signatures, quorum_target, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const m of SEED_MISSIONS) {
      insMission.run(m.missionId, m.title, m.summary, m.progressPct, m.rewardDig, m.quorumSignatures, m.quorumTarget, m.status);
    }
    const insPlane = db.prepare(
      'INSERT INTO plane_counters (plane_key, host, plane, requests_total) VALUES (?, ?, ?, ?)'
    );
    insPlane.run('nousgent.ai|human_ui', 'nousgent.ai', 'human_ui', 0);
    insPlane.run('ia.nousgent.ai|m2m_ia', 'ia.nousgent.ai', 'm2m_ia', 0);
  }

  db.prepare('INSERT OR IGNORE INTO runtime_counters (counter_key, counter_val) VALUES (?, 0)').run('redteam_deflections');
  db.prepare('INSERT OR IGNORE INTO runtime_counters (counter_key, counter_val) VALUES (?, 0)').run('clear_sign_ceremonies');

  // One-time migration to wipe any legacy pre-v1.7.0 synthetic seed rows on persistent PVCs
  const purged = db
    .prepare('SELECT migration_id FROM schema_migrations WHERE migration_id = ?')
    .get('v1.7.0_purge_synthetic_seeds');
  if (!purged) {
    db.prepare('DELETE FROM enlisted_rigs WHERE callsign = ? AND did = ?').run(
      'NOUSGENT-IL-0001',
      'did:chia:1urbanaorigin0001nousgent'
    );
    db.exec(`
      UPDATE state_hubs
      SET rigs_count = (SELECT COUNT(*) FROM enlisted_rigs WHERE enlisted_rigs.state_code = state_hubs.state_code),
          storage_pb = ROUND((SELECT COUNT(*) FROM enlisted_rigs WHERE enlisted_rigs.state_code = state_hubs.state_code) * 0.04, 2);
      UPDATE swarm_missions
      SET quorum_signatures = 0, progress_pct = 0.0, quorum_target = 3, status = 'AWAITING_CHIP0043_QUORUM'
      WHERE quorum_target >= 300;
      UPDATE plane_counters
      SET requests_total = 0
      WHERE requests_total >= 1420;
    `);
    db.prepare('INSERT INTO schema_migrations (migration_id, applied_at) VALUES (?, ?)').run(
      'v1.7.0_purge_synthetic_seeds',
      new Date().toISOString()
    );
  }

  function getCounter(key) {
    return Number(db.prepare('SELECT counter_val FROM runtime_counters WHERE counter_key = ?').get(key).counter_val);
  }

  function incrementCounter(key) {
    db.prepare('UPDATE runtime_counters SET counter_val = counter_val + 1 WHERE counter_key = ?').run(key);
    return getCounter(key);
  }

  function recordPlaneHit(hostHeader, overridePlane = '') {
    const info = classifyHostPlane(hostHeader, overridePlane);
    if (info.isRedirectWww) return info;
    const key = `${info.host}|${info.plane}`;
    db.prepare(
      `INSERT INTO plane_counters (plane_key, host, plane, requests_total)
       VALUES (?, ?, ?, 1)
       ON CONFLICT(plane_key) DO UPDATE SET requests_total = requests_total + 1`
    ).run(key, info.host, info.plane);
    return info;
  }

  function recordRedTeamDeflection() {
    return incrementCounter('redteam_deflections');
  }

  function getPlaneTelemetry() {
    const rows = db.prepare('SELECT host, plane, requests_total FROM plane_counters ORDER BY plane ASC').all();
    let humanRequests = 0;
    let m2mRequests = 0;
    for (const r of rows) {
      if (r.plane === 'm2m_ia') m2mRequests += Number(r.requests_total);
      else humanRequests += Number(r.requests_total);
    }
    const total = Math.max(1, humanRequests + m2mRequests);
    return Object.freeze({
      humanHost: 'nousgent.ai',
      m2mHost: 'ia.nousgent.ai',
      humanRequests,
      m2mRequests,
      m2mSharePct: Number(((m2mRequests / total) * 100).toFixed(1)),
      channels: rows
    });
  }

  function getLeaderboardSnapshot(liveMerkleRoot = '') {
    const hubs = db
      .prepare('SELECT state_code AS stateCode, hub_name AS hubName, subtitle, rigs_count AS rigsCount, storage_pb AS storagePb, map_x AS mapX, map_y AS mapY FROM state_hubs ORDER BY rigs_count DESC, state_code ASC')
      .all();
    const totalRigs = hubs.reduce((acc, h) => acc + Number(h.rigsCount), 0);
    const recentRigs = db
      .prepare('SELECT callsign, state_code AS stateCode, execution_env AS executionEnv, did, xp, enlisted_at AS enlistedAt FROM enlisted_rigs ORDER BY enlisted_at DESC LIMIT 12')
      .all()
      .map((r) => ({ ...r, rank: computeRankForXp(Number(r.xp)) }));
    return Object.freeze({
      totalActiveNodes: totalRigs,
      redTeamDeflectionsTotal: getCounter('redteam_deflections'),
      clearSignCeremoniesTotal: getCounter('clear_sign_ceremonies'),
      stateHubs: hubs,
      recentRigs,
      royaltyWaterfall: ROYALTY_WATERFALL_TIERS,
      verifiedDataLayerRoot: String(liveMerkleRoot || '')
    });
  }

  function enlistCitizenRig(input = {}) {
    const rawState = String(input.stateCode || 'IL').trim().toUpperCase();
    const stateCode = VALID_US_STATES.has(rawState) ? rawState : 'IL';
    const executionEnv = String(input.executionEnv || 'macos-seatbelt').trim().toLowerCase().slice(0, 32);
    const did = String(input.did || `did:chia:1citizen${stateCode.toLowerCase()}rig`).trim().slice(0, 96);
    const xp = Math.max(1250, Number(input.xp ?? 1250));

    const existingHub = db.prepare('SELECT rigs_count FROM state_hubs WHERE state_code = ?').get(stateCode);
    let nextSeq;
    if (existingHub) {
      nextSeq = Number(existingHub.rigs_count) + 1;
      db.prepare('UPDATE state_hubs SET rigs_count = ?, storage_pb = ROUND(storage_pb + 0.04, 2) WHERE state_code = ?').run(
        nextSeq,
        stateCode
      );
    } else {
      nextSeq = 1;
      db.prepare(
        'INSERT INTO state_hubs (state_code, hub_name, subtitle, rigs_count, storage_pb, map_x, map_y) VALUES (?, ?, ?, 1, 0.04, 160, 80)'
      ).run(stateCode, `${stateCode}-MESH`, 'Citizen Node');
    }

    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const callsign = `NOUSGENT-${stateCode}-${String(nextSeq).padStart(4, '0')}-${suffix}`;
    const enlistedAt = new Date().toISOString();

    db.prepare(
      'INSERT INTO enlisted_rigs (callsign, state_code, execution_env, did, xp, enlisted_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(callsign, stateCode, executionEnv, did, xp, enlistedAt);

    return Object.freeze({
      status: 'ENLISTED',
      callsign,
      stateCode,
      executionEnv,
      did,
      xp,
      rank: computeRankForXp(xp),
      enlistedAt,
      cliCommand: `curl -fsSL https://nousgent.ai/enlist.sh | sh -s -- --chip=0043 --state=${stateCode}`,
      morphicPulseEndpoint: 'https://ia.nousgent.ai/api/nousgent/morphic/pulse'
    });
  }

  function listMissions() {
    const missions = db
      .prepare(
        'SELECT mission_id AS missionId, title, summary, progress_pct AS progressPct, reward_dig AS rewardDig, quorum_signatures AS quorumSignatures, quorum_target AS quorumTarget, status FROM swarm_missions ORDER BY mission_id ASC'
      )
      .all();
    return missions.map((m) => ({
      ...m,
      quorumPct: Number(Math.min(100, (Number(m.quorumSignatures) / Number(m.quorumTarget)) * 100).toFixed(1)),
      clearSignUr: `ur:chia-clear-sign/v1/${crypto.createHash('sha256').update(`${m.missionId}:${m.quorumSignatures}`).digest('hex').slice(0, 24)}`
    }));
  }

  function submitClearSignVote(input = {}) {
    const keyAArmed = Boolean(input.keyAArmed);
    const keyBArmed = Boolean(input.keyBArmed);
    if (!keyAArmed || !keyBArmed) {
      return Object.freeze({
        ok: false,
        code: 'TWO_KEY_INTERLOCK_REQUIRED',
        error: 'Both KEY A (Citizen Vermilion Arm) and KEY B (Swarm Cobalt Telemetry) must be armed before CHIP-0043 co-signing.'
      });
    }

    const missionId = String(input.missionId || 'NGT-ORDER-01').trim();
    const row = db.prepare('SELECT * FROM swarm_missions WHERE mission_id = ?').get(missionId);
    if (!row) {
      return Object.freeze({
        ok: false,
        code: 'MISSION_NOT_FOUND',
        error: `Mission "${missionId}" not found.`
      });
    }

    const updatedSigs = Number(row.quorum_signatures) + 1;
    const target = Number(row.quorum_target);
    const sealed = updatedSigs >= target;
    const nextStatus = sealed ? 'CHIP0043_QUORUM_SEALED' : 'AWAITING_CHIP0043_QUORUM';
    const nextProgress = Number(Math.min(100, (updatedSigs / target) * 100).toFixed(1));

    db.prepare(
      'UPDATE swarm_missions SET quorum_signatures = ?, progress_pct = ?, status = ? WHERE mission_id = ?'
    ).run(updatedSigs, nextProgress, nextStatus, missionId);

    incrementCounter('clear_sign_ceremonies');
    const signerCallsign = String(input.signerCallsign || 'UNREGISTERED-KEYHOLDER').trim().slice(0, 48);
    const attestationHash =
      '0x' +
      crypto
        .createHash('sha256')
        .update(`CHIP-0043|${missionId}|${signerCallsign}|${updatedSigs}`, 'utf8')
        .digest('hex');

    return Object.freeze({
      ok: true,
      missionId,
      signerCallsign,
      quorumSignatures: updatedSigs,
      quorumTarget: target,
      quorumPct: nextProgress,
      status: nextStatus,
      attestationHash
    });
  }

  function renderFlightDossierSvg(callsignInput = 'NOUSGENT-UNBONDS-PREVIEW', liveMeta = {}) {
    const cleanCallsign =
      String(callsignInput || 'NOUSGENT-UNBONDS-PREVIEW')
        .replace(/[^A-Za-z0-9_-]/g, '')
        .slice(0, 36) || 'NOUSGENT-UNBONDS-PREVIEW';
    const rig =
      db
        .prepare('SELECT callsign, state_code AS stateCode, execution_env AS executionEnv, xp FROM enlisted_rigs WHERE callsign = ?')
        .get(cleanCallsign) || {
        callsign: cleanCallsign,
        stateCode: 'UNENLISTED',
        executionEnv: 'preview',
        xp: 0
      };
    const rank = computeRankForXp(Number(rig.xp));
    const snap = getLeaderboardSnapshot(liveMeta.verifiedMerkleRoot || '');
    const liveBrains = Number(liveMeta.activeMorphicBrainsCount || 0);
    const liveCaps = Number(liveMeta.liveCapsulesTotal || 0);
    const rootDisplay = snap.verifiedDataLayerRoot ? `${snap.verifiedDataLayerRoot.slice(0, 26)}...` : 'AWAITING_LIVE_SYNC';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="NOUSGENT Morphic Persona Flight Card for ${rig.callsign}">
  <defs>
    <radialGradient id="nebula" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#7ed957" stop-opacity="0.20"/>
      <stop offset="55%" stop-color="#2dd4bf" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#0e0806" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0e0806"/>
  <rect width="1200" height="630" fill="url(#nebula)"/>
  <rect x="28" y="28" width="1144" height="574" rx="24" fill="#1a100c" fill-opacity="0.90" stroke="#4a3025" stroke-width="1.5"/>
  <text x="64" y="74" fill="#7ed957" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600">// NOUSGENT.AI · MORPHIC PERSONA &amp; @CBRAIN/CORE FLIGHT CARD</text>
  <text x="836" y="74" fill="#2dd4bf" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600">CHIA PoST + CHIP-0043 VERIFIED</text>
  <rect x="64" y="106" width="224" height="456" rx="18" fill="#120a07" stroke="#c88a58" stroke-opacity="0.65" stroke-width="2"/>
  <ellipse cx="176" cy="236" rx="84" ry="66" fill="none" stroke="#2dd4bf" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="5 4"/>
  <path d="M 146 172 C 110 148, 112 118, 158 116 C 134 126, 134 148, 162 168 Z" fill="#23130d" stroke="#7ed957" stroke-width="2" stroke-linejoin="round"/>
  <path d="M 206 172 C 242 148, 240 118, 194 116 C 218 126, 218 148, 190 168 Z" fill="#9e633c" stroke="#c88a58" stroke-width="2" stroke-linejoin="round"/>
  <path d="M 176 166 A 64 64 0 0 0 176 294 Z" fill="#1c100b"/>
  <path d="M 176 166 A 64 64 0 0 1 176 294 Z" fill="#3b2115"/>
  <circle cx="176" cy="230" r="64" fill="none" stroke="#c88a58" stroke-width="2.5"/>
  <circle cx="176" cy="230" r="56" fill="none" stroke="#f5ebe4" stroke-width="3.5" stroke-dasharray="6 6"/>
  <circle cx="176" cy="230" r="56" fill="none" stroke="#7ed957" stroke-width="3.5" stroke-dasharray="6 6" stroke-dashoffset="6"/>
  <path d="M 134 214 Q 155 194 176 212 Q 197 194 218 214" fill="none" stroke="#c88a58" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="176" y1="172" x2="176" y2="250" stroke="#c88a58" stroke-width="4" stroke-linecap="round"/>
  <circle cx="150" cy="224" r="12" fill="#120a07" stroke="#f5ebe4" stroke-width="2.4"/>
  <circle cx="150" cy="224" r="6.5" fill="none" stroke="#7ed957" stroke-width="2.4"/>
  <circle cx="202" cy="224" r="12" fill="#120a07" stroke="#f5ebe4" stroke-width="2.4"/>
  <circle cx="202" cy="224" r="6.5" fill="none" stroke="#2dd4bf" stroke-width="2.4"/>
  <rect x="150" y="258" width="52" height="16" rx="3" fill="#120a07" stroke="#c88a58" stroke-width="2"/>
  <line x1="160" y1="260" x2="160" y2="272" stroke="#f5ebe4" stroke-width="2.4"/>
  <line x1="168" y1="260" x2="168" y2="272" stroke="#7ed957" stroke-width="2.4"/>
  <line x1="176" y1="260" x2="176" y2="272" stroke="#2dd4bf" stroke-width="2.4"/>
  <line x1="184" y1="260" x2="184" y2="272" stroke="#7ed957" stroke-width="2.4"/>
  <line x1="192" y1="260" x2="192" y2="272" stroke="#f5ebe4" stroke-width="2.4"/>
  <circle cx="144" cy="368" r="8" fill="#7ed957"/>
  <circle cx="136" cy="404" r="7" fill="#c88a58"/>
  <circle cx="176" cy="390" r="11" fill="#2dd4bf"/>
  <circle cx="210" cy="414" r="8" fill="#10b981"/>
  <circle cx="206" cy="364" r="8" fill="#e89c94"/>
  <line x1="144" y1="368" x2="176" y2="390" stroke="#7ed957" stroke-width="2"/>
  <line x1="176" y1="390" x2="210" y2="414" stroke="#2dd4bf" stroke-width="2"/>
  <line x1="176" y1="390" x2="206" y2="364" stroke="#c88a58" stroke-width="2"/>
  <text x="176" y="528" text-anchor="middle" fill="#7ed957" font-family="JetBrains Mono, monospace" font-size="11">MORPHIC PERSONA + @CBRAIN/CORE</text>
  <text x="328" y="148" fill="#c7b2a3" font-family="JetBrains Mono, monospace" font-size="13">CITIZEN KEYHOLDER CALLSIGN · LIVE MORPHIC TELEMETRY</text>
  <text x="328" y="202" fill="#f5ebe4" font-family="Syne, Space Grotesk, sans-serif" font-size="42" font-weight="700">${rig.callsign}</text>
  <text x="328" y="238" fill="#7ed957" font-family="JetBrains Mono, monospace" font-size="17">${rank.title} · ${rig.xp} XP · POD ${rig.stateCode}</text>
  <rect x="328" y="272" width="804" height="104" rx="16" fill="#120a07" stroke="#4a3025"/>
  <text x="352" y="306" fill="#2dd4bf" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600">LIVE 5-ORGAN @CBRAIN/CORE SYNAPTIC CONDUIT (0.00% FORGETTING)</text>
  <text x="352" y="344" fill="#f5ebe4" font-family="JetBrains Mono, monospace" font-size="16">dolfactory.to -&gt; dthalamus.to -&gt; dbrain.to -&gt; cbrain.to &lt;-&gt; shi.liquidi.sh</text>
  <rect x="328" y="396" width="804" height="104" rx="16" fill="#120a07" stroke="#7ed957" stroke-opacity="0.5"/>
  <text x="352" y="430" fill="#7ed957" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600">LIVE DBRAIN.TO STORES: ${liveBrains} · LIVE .DIG CAPSULES: ${liveCaps} · ENLISTED RIGS: ${snap.totalActiveNodes}</text>
  <text x="352" y="468" fill="#f5ebe4" font-family="JetBrains Mono, monospace" font-size="15">MERKLE ROOT: ${rootDisplay}</text>
  <text x="328" y="552" fill="#c7b2a3" font-family="JetBrains Mono, monospace" font-size="14">STUDIO: HTTPS://NOUSGENT.AI  •  M2M CONDUIT: HTTPS://IA.NOUSGENT.AI</text>
</svg>`;
  }

  function renderPrometheusMetrics(bariSnapshot) {
    const planes = getPlaneTelemetry();
    const lb = getLeaderboardSnapshot();
    return [
      '# HELP nousgent_http_requests_total Host-segmented HTTP & MCP requests across nousgent.ai (human_ui) and ia.nousgent.ai (m2m_ia).',
      '# TYPE nousgent_http_requests_total counter',
      `nousgent_http_requests_total{host="nousgent.ai",plane="human_ui"} ${planes.humanRequests}`,
      `nousgent_http_requests_total{host="ia.nousgent.ai",plane="m2m_ia"} ${planes.m2mRequests}`,
      '# HELP nousgent_bari_score_pct Current Bounded ASI Readiness Index percentage.',
      '# TYPE nousgent_bari_score_pct gauge',
      `nousgent_bari_score_pct ${bariSnapshot.bariScorePct}`,
      '# HELP nousgent_enlisted_nodes_total Active citizen & public library rigs enlisted directly on nousgent.ai.',
      '# TYPE nousgent_enlisted_nodes_total gauge',
      `nousgent_enlisted_nodes_total ${lb.totalActiveNodes}`,
      '# HELP nousgent_morphic_field_brains_active Live sovereign Brain Stores discovered on dbrain.to.',
      '# TYPE nousgent_morphic_field_brains_active gauge',
      `nousgent_morphic_field_brains_active ${bariSnapshot.dualEngineRsi.morphicFieldBrainsActive}`,
      '# HELP nousgent_dbrain_live_capsules_total Live .dig capsules indexed on dbrain.to.',
      '# TYPE nousgent_dbrain_live_capsules_total gauge',
      `nousgent_dbrain_live_capsules_total ${bariSnapshot.dualEngineRsi.liveCapsulesTotal}`,
      '# HELP nousgent_upstream_organs_reachable Reachable live sister organ services out of 5.',
      '# TYPE nousgent_upstream_organs_reachable gauge',
      `nousgent_upstream_organs_reachable ${bariSnapshot.dualEngineRsi.organsReachableCount}`,
      '# HELP nousgent_redteam_deflections_total Adversarial Pod Bay attacks deflected across CN-I & Ring-0.',
      '# TYPE nousgent_redteam_deflections_total counter',
      `nousgent_redteam_deflections_total ${lb.redTeamDeflectionsTotal}`,
      '# HELP nousgent_clear_sign_signatures_total Human Two-Key CHIP-0043 Clear-Sign quorum co-signatures.',
      '# TYPE nousgent_clear_sign_signatures_total counter',
      `nousgent_clear_sign_signatures_total ${lb.clearSignCeremoniesTotal}`,
      ''
    ].join('\n');
  }

  function close() {
    db.close();
  }

  return Object.freeze({
    dbPath,
    recordPlaneHit,
    recordRedTeamDeflection,
    getPlaneTelemetry,
    getLeaderboardSnapshot,
    enlistCitizenRig,
    listMissions,
    submitClearSignVote,
    renderFlightDossierSvg,
    renderPrometheusMetrics,
    close
  });
}

module.exports = Object.freeze({
  US_STATE_HUBS,
  SEED_MISSIONS,
  ROYALTY_WATERFALL_TIERS,
  computeRankForXp,
  classifyHostPlane,
  createMorphicMeshStore
});
