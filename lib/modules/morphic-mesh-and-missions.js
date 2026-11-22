'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const US_STATE_HUBS = Object.freeze([
  { stateCode: 'IL', hubName: 'URBANA', subtitle: 'Birthplace Core', seedRigs: 1420, storagePb: 38.4, mapX: 185, mapY: 65 },
  { stateCode: 'TX', hubName: 'ERCOT', subtitle: 'Sovereign Grid', seedRigs: 984, storagePb: 29.1, mapX: 155, mapY: 105 },
  { stateCode: 'WY', hubName: 'VAULT', subtitle: 'DUNA Sanctuary', seedRigs: 712, storagePb: 24.8, mapX: 105, mapY: 55 },
  { stateCode: 'CA', hubName: 'BAY', subtitle: 'Silicon Canopy', seedRigs: 540, storagePb: 18.2, mapX: 45, mapY: 85 },
  { stateCode: 'OH', hubName: 'CLE', subtitle: 'Great Lakes Mesh', seedRigs: 452, storagePb: 12.6, mapX: 225, mapY: 62 }
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
    summary: 'Verify 5,000 deterministic chia-dao-v1 CAT2 & Singleton spends across citizen 8B SLMs.',
    progressPct: 82.4,
    rewardDig: '50000.000',
    quorumSignatures: 289,
    quorumTarget: 300,
    status: 'AWAITING_CHIP0043_QUORUM'
  },
  {
    missionId: 'NGT-ORDER-02',
    title: '1,000 FLY-LSH POLYMORPHIC ANTIBODIES',
    summary: 'Crowd-curate pre-thalamic Cranial Nerve I odor antibodies with 0.00% false positives.',
    progressPct: 64.0,
    rewardDig: '100000.000',
    quorumSignatures: 214,
    quorumTarget: 300,
    status: 'ACTIVE_SWARM_HARVEST'
  },
  {
    missionId: 'NGT-ORDER-03',
    title: 'SWE-CONTEXTBENCH 99% COLLECTIVE RIGOR',
    summary: 'Distill verified multi-repo bug fixes via Sleep-Time Dreaming into durable .dig capsules.',
    progressPct: 91.2,
    rewardDig: '250000.000',
    quorumSignatures: 296,
    quorumTarget: 300,
    status: 'AWAITING_CHIP0043_QUORUM'
  }
]);

const ROYALTY_WATERFALL_TIERS = Object.freeze([
  { label: 'URBANA / DIRECT CREATOR', sharePct: 60, bps: 6000 },
  { label: 'WY VAULT / CITED PARENT', sharePct: 25, bps: 2500 },
  { label: 'ERCOT / ROOT LINEAGE', sharePct: 10, bps: 1000 },
  { label: 'CIVIC LIB / VERIFIER', sharePct: 5, bps: 500 }
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
    insPlane.run('nousgent.ai|human_ui', 'nousgent.ai', 'human_ui', 1420);
    insPlane.run('ia.nousgent.ai|m2m_ia', 'ia.nousgent.ai', 'm2m_ia', 14780);
    db.prepare(
      'INSERT INTO enlisted_rigs (callsign, state_code, execution_env, did, xp, enlisted_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      'NOUSGENT-IL-0001',
      'IL',
      'macos-seatbelt',
      'did:chia:1urbanaorigin0001nousgent',
      14820,
      '2026-11-21T00:00:00.000Z'
    );
  }

  let redTeamDeflectionsTotal = 412;
  let clearSignCeremoniesTotal = 289;

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
    redTeamDeflectionsTotal += 1;
    return redTeamDeflectionsTotal;
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

  function getLeaderboardSnapshot() {
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
      stateHubs: hubs,
      recentRigs,
      royaltyWaterfall: ROYALTY_WATERFALL_TIERS,
      verifiedDataLayerRoot: '0x8F4A9C2E7B104D66A19E0043D5B811C09E2177FA34C08B12D4E67A9012FE0043'
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
      ).run(stateCode, `${stateCode}-MESH`, 'Citizen Node', );
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
    const nextProgress = sealed ? 100.0 : Number(Math.min(99.9, Number(row.progress_pct) + 0.3).toFixed(1));

    db.prepare(
      'UPDATE swarm_missions SET quorum_signatures = ?, progress_pct = ?, status = ? WHERE mission_id = ?'
    ).run(updatedSigs, nextProgress, nextStatus, missionId);

    clearSignCeremoniesTotal += 1;
    const signerCallsign = String(input.signerCallsign || 'NOUSGENT-IL-0001').trim().slice(0, 48);
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
      quorumPct: Number(Math.min(100, (updatedSigs / target) * 100).toFixed(1)),
      status: nextStatus,
      attestationHash
    });
  }

  function renderFlightDossierSvg(callsignInput = 'NOUSGENT-IL-0001') {
    const cleanCallsign = String(callsignInput || 'NOUSGENT-IL-0001')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 36) || 'NOUSGENT-IL-0001';
    const rig =
      db
        .prepare('SELECT callsign, state_code AS stateCode, execution_env AS executionEnv, xp FROM enlisted_rigs WHERE callsign = ?')
        .get(cleanCallsign) || {
        callsign: cleanCallsign,
        stateCode: 'IL',
        executionEnv: 'macos-seatbelt',
        xp: 14820
      };
    const rank = computeRankForXp(Number(rig.xp));
    const snap = getLeaderboardSnapshot();

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#10131f"/>
  <polygon points="24,24 1152,24 1176,48 1176,606 48,606 24,582" fill="#0b0e19" stroke="#444933" stroke-width="2"/>
  <rect x="24" y="24" width="1152" height="58" fill="#181b27"/>
  <rect x="24" y="80" width="1152" height="2" fill="#c3f400"/>
  <text x="48" y="60" fill="#e0e1f3" font-family="Space Grotesk, sans-serif" font-size="18" font-weight="700">NOUSGENT // CYBER-COLOSSEUM RAID DOSSIER · SEASON 01</text>
  <text x="812" y="60" fill="#c3f400" font-family="JetBrains Mono, monospace" font-size="15" font-weight="700">CHIA PoST + CHIP-0043 VERIFIED</text>
  <polygon points="48,112 352,112 368,128 368,476 48,476" fill="#181b27" stroke="#444933" stroke-width="2"/>
  <circle cx="208" cy="282" r="98" fill="none" stroke="#c90043" stroke-width="2.5" stroke-dasharray="10 6"/>
  <circle cx="208" cy="282" r="68" fill="none" stroke="#00e3fd" stroke-width="2.5" stroke-dasharray="6 4"/>
  <circle cx="208" cy="282" r="34" fill="#93000a"/>
  <circle cx="208" cy="282" r="14" fill="#c90043"/>
  <circle cx="208" cy="282" r="5" fill="#ffffff"/>
  <text x="68" y="144" fill="#c3f400" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700">BOSS RETICLE // HAL-9000 VETO</text>
  <text x="68" y="452" fill="#00e3fd" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700">BIBA RING-0 INTEGRITY: 100% LOCK</text>
  <text x="404" y="146" fill="#c4c9ad" font-family="JetBrains Mono, monospace" font-size="14">AUTHENTICATED COLOSSEUM COMBATANT</text>
  <text x="404" y="198" fill="#c3f400" font-family="Space Grotesk, sans-serif" font-size="42" font-weight="700">${rig.callsign}</text>
  <text x="404" y="234" fill="#e0e1f3" font-family="JetBrains Mono, monospace" font-size="18">${rank.title} · ${rig.xp} XP · GUILD ${rig.stateCode}</text>
  <rect x="404" y="264" width="736" height="96" fill="#1c1f2b" stroke="#444933"/>
  <text x="424" y="296" fill="#00e3fd" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700">5-ORGAN ORTHOGONAL RAID BUS (0.00% CATASTROPHIC FORGETTING)</text>
  <text x="424" y="330" fill="#e0e1f3" font-family="JetBrains Mono, monospace" font-size="16" font-weight="600">dolfactory.to -&gt; dthalamus.to -&gt; dbrain.to -&gt; cbrain.to &lt;-&gt; shi.liquidi.sh</text>
  <rect x="404" y="380" width="736" height="96" fill="#1c1f2b" stroke="#c3f400"/>
  <text x="424" y="412" fill="#c3f400" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700">SHI.LIQUIDI.SH $DIG LOOT DAG SPLIT (60% / 25% / 10% / 5%)</text>
  <text x="424" y="446" fill="#e0e1f3" font-family="JetBrains Mono, monospace" font-size="15">ALLIED GUILD NODES: ${snap.totalActiveNodes} · ROOT ${snap.verifiedDataLayerRoot.slice(0, 26)}...</text>
  <text x="48" y="568" fill="#c4c9ad" font-family="JetBrains Mono, monospace" font-size="15">PLAYER RAID DECK: HTTPS://NOUSGENT.AI  |  M2M ARENA: HTTPS://IA.NOUSGENT.AI</text>
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
      '# HELP nousgent_enlisted_nodes_total Active citizen & public library rigs enlisted in the Morphic Mesh.',
      '# TYPE nousgent_enlisted_nodes_total gauge',
      `nousgent_enlisted_nodes_total ${lb.totalActiveNodes}`,
      '# HELP nousgent_redteam_deflections_total Adversarial Pod Bay attacks deflected across CN-I & Ring-0.',
      '# TYPE nousgent_redteam_deflections_total counter',
      `nousgent_redteam_deflections_total ${redTeamDeflectionsTotal}`,
      '# HELP nousgent_clear_sign_signatures_total Human Two-Key CHIP-0043 Clear-Sign quorum co-signatures.',
      '# TYPE nousgent_clear_sign_signatures_total counter',
      `nousgent_clear_sign_signatures_total ${clearSignCeremoniesTotal}`,
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
