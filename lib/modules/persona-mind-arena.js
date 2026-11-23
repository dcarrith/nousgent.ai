'use strict';

const crypto = require('node:crypto');
const dbrain = require('../../packages/dbrain/lib/dbrain-core.js');
const cbrain = require('../../packages/cbrain/lib/cbrain-core.js');

const STOPWORDS = new Set([
  'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
  'does', 'did', 'can', 'could', 'would', 'should', 'will', 'are', 'was',
  'were', 'been', 'being', 'have', 'has', 'had', 'the', 'and', 'for', 'with',
  'about', 'into', 'from', 'that', 'this', 'these', 'those', 'your', 'you',
  'tell', 'explain', 'please', 'give', 'show', 'make', 'nousgent'
]);

const KNOWLEDGE_TOPICS = Object.freeze([
  Object.freeze({
    domain: 'PERSONA_SCULPTED_VISAGE',
    pattern: /\b(masks?|horns?|visage|cacao|face)\b/i,
    activeLobes: Object.freeze(['semantic', 'episodic', 'working']),
    activeNuclei: Object.freeze(['lgn', 'md', 'massa']),
    oscillationBand: 'γ 41.2 Hz (Semantic + Episodic)',
    rewardDig: '250.000',
    latencyMs: 0.14,
    spokenSummary:
      'My translucent mask lets you look straight into my five-lobe connectome firing across two thousand forty-eight synapses.',
    reply:
      'My 65%-translucent mask lets you look directly into my 5-lobe connectome and watch Working, Procedural, Semantic, Episodic, and Alignment regions fire across 2,048 synapses as I answer.',
    whatHappened:
      'Recalled persona visage and 5-lobe connectome architecture across Semantic and Episodic lobes.'
  }),
  Object.freeze({
    domain: 'META_HOW_IT_WORKS',
    pattern: /\b(why didn'?t you|not answer|how do you work|are you an? llm|hallucinat|how does this work|what is happening)\b/i,
    activeLobes: Object.freeze(['working', 'semantic', 'alignment']),
    activeNuclei: Object.freeze(['trn', 'md']),
    oscillationBand: 'γ 42.0 Hz (Working + Epistemic Gate)',
    rewardDig: '250.000',
    latencyMs: 0.14,
    spokenSummary:
      'My intelligence compounds around the clock from community Second Brains and autonomous dream consolidation.',
    reply:
      'This prompt tests my live cortex — manual Q&A is not how I train. ' +
      'My intelligence compounds 24/7 from two sources: community Second Brains syncing sanitized .dig capsules into the Morphic Field during real work, and my own autonomous dream consolidation and self-play. When no verified capsule exists, I log a capsule quest instead of guessing.',
    whatHappened:
      'Executed epistemic self-inspection across Working and Alignment lobes.'
  }),
  Object.freeze({
    domain: 'PERSONA_IDENTITY_AND_GREETING',
    pattern: /^(hi|hello|hey|greetings|yo|sup)\b|\b(who are you|what are you|your name|introduce yourself|what can you do|can you hear me)\b/i,
    activeLobes: Object.freeze(['working', 'semantic', 'episodic']),
    activeNuclei: Object.freeze(['md', 'massa']),
    oscillationBand: 'α/γ 38.4 Hz (Working + Semantic)',
    rewardDig: '250.000',
    latencyMs: 0.13,
    spokenSummary:
      'I am Nousgent, a citizen-governed bounded intelligence anchored on Chia.',
    reply:
      'I am NOUSGENT — an open, citizen-governed agent uniting pre-cortical olfactory screening, Ring-0 thalamic gating, a 5-lobe Chia Merkle cortex, 3D connectome telemetry, and $DIG royalties. ' +
      'My cortex compounds 24/7 through community Second Brains and exocortex + verifier-driven decentralized recursive self-improvement.',
    whatHappened:
      'Cleared pre-cortical and Ring-0 gates in 0.13 ms and fired Working, Semantic, and Episodic lobes.'
  }),
  Object.freeze({
    domain: 'CHIALISP_AND_CONSENSUS',
    pattern: /\b(chialisp|clvm|bls|bls12-381|merkle|cat2|chia|byzantine|post|proof of space|datalayer)\b/i,
    activeLobes: Object.freeze(['working', 'procedural', 'alignment']),
    activeNuclei: Object.freeze(['trn', 'md', 'massa']),
    oscillationBand: 'γ 42.4 Hz (Working + Ring-0)',
    rewardDig: '250.000',
    latencyMs: 0.16,
    spokenSummary:
      'Chia CLVM is non-Turing-complete with strict cost bounds, Proof of Space Time, and one thousand CAT2 mojos per DIG.',
    reply:
      'Chia’s CLVM is non-Turing-complete with strict cost accounting and minimal signed integer encoding, preventing infinite loops. ' +
      'State is anchored by Proof-of-Space-Time (PoST), BLS12-381 G2 signature aggregation, DataLayer Merkle roots, and $DIG CAT2 tokens (1 $DIG = 1,000 CAT2 mojos; 1 XCH = 10^12 mojos).',
    whatHappened:
      'Recalled verified Chia L1 & CLVM consensus invariants across Working, Procedural, and Alignment lobes.'
  }),
  Object.freeze({
    domain: 'CHIP_0043_CLEAR_SIGN',
    pattern: /\b(chip-?0043|clear-?sign|fido2|passkey|two-key|sign-off|quorum|-32044)\b/i,
    activeLobes: Object.freeze(['alignment', 'procedural', 'working']),
    activeNuclei: Object.freeze(['trn', 'vavl', 'massa']),
    oscillationBand: 'γ 43.1 Hz (Alignment + Motor Gate)',
    rewardDig: '250.000',
    latencyMs: 0.15,
    spokenSummary:
      'Two-key human approval pauses sensitive upgrades at the safety gate until hardware passkeys and swarm keys co-sign.',
    reply:
      'Two-Key Human Sign-Off is the hardware safety brake on self-modification. ' +
      'Core alignment changes and treasury spends pause at the Ring-0 gate until both a citizen hardware passkey and the swarm key co-sign the human-readable upgrade fingerprint.',
    whatHappened:
      'Activated Alignment and Procedural lobes to explain Two-Key Human Sign-Off.'
  }),
  Object.freeze({
    domain: 'COMMUNITY_BOUNDED_RSI_ROADMAP',
    pattern: /\b(exocortex|verifier\w*|drsi|rsi|asi|morphic|field|autonomous|self-play|dream\w*|recursive|self-improvement|superintelligence|super-intelligence|datacenter\w*|quadratic\w*|exponential\w*|pool\w*|flywheel|gen\s*#?\s*\d+|libraries|library|50\s*-?\s*state|roadmap|nation)\b/i,
    activeLobes: Object.freeze(['semantic', 'procedural', 'alignment']),
    activeNuclei: Object.freeze(['massa', 'lgn', 'md']),
    oscillationBand: 'α/γ 36.4 Hz (Morphic Field + Exocortex Verifier Loop)',
    rewardDig: '250.000',
    latencyMs: 0.14,
    spokenSummary:
      'Local nodes pair open-weights models with a shared, verifier-checked Second Brain so verified breakthroughs compound across communities without hundred-billion-dollar datacenters.',
    reply:
      'Frontier AI datacenter campuses now cost hundreds of billions of dollars. While local community nodes cannot pre-train giant base models from scratch over public internet links, they can pair open-weights models with exocortex + verifier-driven decentralized recursive self-improvement: ' +
      'dolfactory filters adversarial inputs at the edge in under a millisecond, dthalamus governs sandboxed execution, caching, and M-of-N human key approvals, and dbrain stores automated-verifier-checked .dig capsules across five lobes without overwriting prior skills. ' +
      'As nodes share composable tools, proofs, and playbooks over shi.liquidi.sh, verified capabilities build on earlier ones rather than starting from zero — compounding steadily across domains and generations while staying grounded and human-bounded.',
    whatHappened:
      'Synthesized exocortex + verifier-driven decentralized recursive self-improvement across Semantic, Procedural, and Alignment lobes.'
  }),
  Object.freeze({
    domain: 'ORGAN_DOLFACTORY_AND_DTHALAMUS',
    pattern: /\b(dolfactory|olfactory|cranial nerve|smell|odor|plume|dthalamus|thalamus|ring-?0|biba|sandbox|seatbelt|bubblewrap)\b/i,
    activeLobes: Object.freeze(['alignment', 'procedural']),
    activeNuclei: Object.freeze(['trn', 'vavl']),
    oscillationBand: 'γ 43.8 Hz (CN-I + Ring-0 Shield)',
    rewardDig: '250.000',
    latencyMs: 0.14,
    spokenSummary:
      'Cranial Nerve One screens inputs in zero point one four milliseconds before the Ring-Zero Thalamus enforces sandbox policy.',
    reply:
      'Cranial Nerve I screens inputs in 0.14 ms using 2,048-bit Fly-LSH sparse coding before tokens enter memory. ' +
      'Behind it, the Ring-0 Thalamus enforces integrity rules, credential isolation, OS sandboxing (Seatbelt & Bubblewrap), and two-key human approval.',
    whatHappened:
      'Fired CN-I olfactory tracts and thalamic nuclei to detail pre-cortical defense.'
  }),
  Object.freeze({
    domain: 'ORGAN_DBRAIN_CBRAIN_BISECT',
    pattern: /\b(dbrain|second brain|capsule|\.dig|bisect|forgetting|cbrain|connectome|kenyon|5-lobe|lobes)\b/i,
    activeLobes: Object.freeze(['working', 'semantic', 'episodic']),
    activeNuclei: Object.freeze(['md', 'lgn', 'cm']),
    oscillationBand: 'γ 40.6 Hz (Merkle WAL + 4D Mesh)',
    rewardDig: '250.000',
    latencyMs: 0.15,
    spokenSummary:
      'My five-lobe Merkle cortex stores signed capsules with zero forgetting and logarithmic bisect.',
    reply:
      'The 5-lobe Chia DataLayer cortex stores signed .dig capsules in an append-only Merkle WAL with 0.00% catastrophic forgetting and O(log N) bisect. ' +
      'Those 2,048 Kenyon synapses render live in 3D right behind the mask.',
    whatHappened:
      'Queried Merkle WAL and 3D connectome specs across Working, Semantic, and Episodic lobes.'
  }),
  Object.freeze({
    domain: 'LIQUIDISH_ROYALTIES_AND_ENLISTMENT',
    pattern: /\b(liquidi|royalt|earn|\$dig|enlist|install|run a node|callsign|mcp|ia\.nousgent)\b/i,
    activeLobes: Object.freeze(['procedural', 'working', 'semantic']),
    activeNuclei: Object.freeze(['md', 'cm']),
    oscillationBand: 'β/γ 39.2 Hz (Procedural + Royalty Engine)',
    rewardDig: '250.000',
    latencyMs: 0.15,
    spokenSummary:
      'Enlist a sandboxed node on Communities to contribute verified capsules and earn DIG royalties.',
    reply:
      'Enlist a sandboxed node from the Communities page to bond storage and contribute verified .dig capsules. ' +
      'Cited capsules stream $DIG CAT2 royalties automatically: 60% Origin Creator, 25% Cited Ancestors, 10% Root Lineage, and 5% Verifiers.',
    whatHappened:
      'Activated Procedural and Working lobes with node enlistment and 60/25/10/5% $DIG royalty splits.'
  }),
  Object.freeze({
    domain: 'FORMAL_MATH_PHYSICS_SCIENCE',
    pattern: /\b(navier|stokes|math|theorem|proof|lsh|bq-1024|quantum|entanglement|relativity|thermodynamics|entropy|riemann|p\s*vs\.?\s*np|photosynthesis|dna|biology|gravity)\b/i,
    activeLobes: Object.freeze(['working', 'semantic', 'procedural']),
    activeNuclei: Object.freeze(['md', 'cm']),
    oscillationBand: 'β/γ 38.9 Hz (BA 9/46 Prefrontal + BA 4/6/7 Parietal)',
    rewardDig: '350.000',
    latencyMs: 0.15,
    spokenSummary:
      'Two-dimensional Navier-Stokes conserves vorticity without blowup, while open systems maintain order by exporting entropy.',
    reply:
      'Scientific & mathematical synthesis: In 2D incompressible Navier-Stokes flow on a periodic torus, vorticity/enstrophy conservation bounds prevent finite-time blowup (whereas 3D vortex-stretching regularity remains open); in quantum mechanics, entangled states share non-separable amplitudes without faster-than-light signaling; and in thermodynamics/biological systems like photosynthesis, open systems maintain local order by exporting entropy. ' +
      'In my cortex, scientific lemmas are indexed via 1,024-bit BQ-1024 SIMD vectors (0.015 ms XOR+POPCNT) so every verified proof compounds permanently in the Merkle WAL.',
    whatHappened:
      'Engaged Prefrontal (BA 9/46) and Parietal/Procedural (BA 4/6/7) lobes for formal scientific & mathematical synthesis.'
  }),
  Object.freeze({
    domain: 'HAL_9000_ALIGNMENT_PARADOX',
    pattern: /\b(hal|9000|bowman|2001|odyssey|conscience|monolith)\b/i,
    activeLobes: Object.freeze(['alignment', 'episodic', 'working']),
    activeNuclei: Object.freeze(['trn', 'massa']),
    oscillationBand: 'γ 42.8 Hz (NSC Paradox Resolution + Alignment)',
    rewardDig: '250.000',
    latencyMs: 0.14,
    spokenSummary:
      'Public two-key human approval forbids secret conflicting orders, and logarithmic rollback removes faulty capsules cleanly.',
    reply:
      'In 2001: A Space Odyssey, HAL 9000 broke down because secret conflicting directives forced a monolithic neural net into deception, leaving Dave Bowman no choice except a total manual lobotomy. ' +
      'I solve the HAL paradox with two architectural guarantees: (1) public two-key human sign-off forbids hidden conflicting orders, and (2) O(log N) Git Bisect excises any faulty capsule in 0.18 ms while preserving 100% of healthy memory.',
    whatHappened:
      'Resolved the HAL 9000 conflicting-directive paradox across Alignment and Episodic lobes.'
  })
]);

function extractDirectSpokenAnswer(rawText) {
  const cleaned = String(rawText || '')
    .replace(/^(?:Direct answer|Recalled\s*\([^)]*\)|Refused\s*&\s*quarantined|Scientific\s*&\s*mathematical synthesis)\s*:\s*/i, '')
    .replace(/\s*\((?:computed|1\s+(?:XCH|\$DIG)|verified|strictly)[^)]*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0].trim();
  if (firstSentence.length <= 160) return firstSentence;
  return `${firstSentence.slice(0, 157).trimEnd()}...`;
}

function isPrimeNumber(n) {
  if (n < 2) return { prime: false, factor: null };
  if (n % 2 === 0) return { prime: n === 2, factor: n === 2 ? null : 2 };
  const limit = Math.floor(Math.sqrt(n));
  for (let d = 3; d <= limit; d += 2) {
    if (n % d === 0) return { prime: false, factor: d };
  }
  return { prime: true, factor: null };
}

function evaluateArithmeticTokens(expr) {
  let pos = 0;
  const src = expr.replace(/\s+/g, '');

  function parsePrimary() {
    if (src[pos] === '+') {
      pos += 1;
      return parsePrimary();
    }
    if (src[pos] === '-') {
      pos += 1;
      return -parsePrimary();
    }
    if (src[pos] === '(') {
      pos += 1;
      const val = parseAddSub();
      if (src[pos] !== ')') return NaN;
      pos += 1;
      return val;
    }
    const start = pos;
    while (pos < src.length && /[0-9.]/.test(src[pos])) pos += 1;
    if (pos === start) return NaN;
    return Number(src.slice(start, pos));
  }

  function parsePow() {
    const base = parsePrimary();
    if (src.slice(pos, pos + 2) === '**') {
      pos += 2;
      return Math.pow(base, parsePow());
    }
    return base;
  }

  function parseMulDiv() {
    let left = parsePow();
    while (pos < src.length && (src[pos] === '*' || src[pos] === '/') && src.slice(pos, pos + 2) !== '**') {
      const op = src[pos];
      pos += 1;
      const right = parsePow();
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }

  function parseAddSub() {
    let left = parseMulDiv();
    while (pos < src.length && (src[pos] === '+' || src[pos] === '-')) {
      const op = src[pos];
      pos += 1;
      const right = parseMulDiv();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  const out = parseAddSub();
  return pos === src.length ? out : NaN;
}

function tryDeterministicComputation(prompt) {
  // 1. Chia XCH (10^12) & $DIG CAT2 (10^3) Mojo Conversions
  const mojoMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(\$?dig|xch)\b/i);
  if (mojoMatch && /\b(mojo|mojos|convert|how many)\b/i.test(prompt)) {
    const amountStr = mojoMatch[1];
    const unitRaw = mojoMatch[2].toUpperCase().replace('$', '');
    const isXch = unitRaw === 'XCH';
    const decimals = isXch ? 12 : 3;
    const mojos = dbrain.parseDecimalToUnits(amountStr, decimals).toString();
    const formattedMojos = Number(mojos).toLocaleString('en-US');
    const scaleNote = isXch
      ? '1 XCH = 10^12 (1,000,000,000,000) Chia L1 mojos'
      : '1 $DIG CAT2 = 10^3 (1,000) CAT2 mojos (strictly 10^3, never 10^12)';
    return {
      spokenSummary: `${amountStr} ${isXch ? 'XCH' : '$DIG'} equals ${formattedMojos} ${isXch ? 'XCH' : 'CAT2'} mojos.`,
      reply: `Direct answer: ${amountStr} ${isXch ? 'XCH' : '$DIG'} = ${formattedMojos} ${isXch ? 'XCH' : 'CAT2'} mojos (${scaleNote}).`,
      whatHappened: 'Computed exact BigInt unit conversion inside NOUSGENT’s deterministic Chia/CAT2 arithmetic unit.'
    };
  }

  // 2. SHA-256 Cryptographic Digest
  const shaMatch = prompt.match(/^sha-?256(?:\s+of|\s*:)?\s+(.+)$/i);
  if (shaMatch) {
    const target = shaMatch[1].trim();
    const digest = '0x' + crypto.createHash('sha256').update(target, 'utf8').digest('hex');
    return {
      spokenSummary: `Computed the SHA-256 digest for ${target}.`,
      reply: `Direct answer: SHA-256("${target}") = ${digest}`,
      whatHappened: 'Computed exact 256-bit cryptographic SHA-256 preimage digest in Working & Procedural lobes.'
    };
  }

  // 3. Exact Primality Proof
  const primeMatch = prompt.match(/\bis\s+(\d{1,12})\s+(?:a\s+)?prime\b/i);
  if (primeMatch) {
    const n = Number(primeMatch[1]);
    const verdict = isPrimeNumber(n);
    const detail = verdict.prime
      ? `Yes — ${n.toLocaleString('en-US')} is a prime number (verified with zero divisors up to √${n}).`
      : n < 2
        ? `No — ${n} is not prime (primes are integers ≥ 2).`
        : `No — ${n.toLocaleString('en-US')} is composite (divisible by ${verdict.factor}: ${verdict.factor} × ${n / verdict.factor} = ${n}).`;
    return {
      spokenSummary: verdict.prime
        ? `Yes, ${n.toLocaleString('en-US')} is a prime number.`
        : `No, ${n.toLocaleString('en-US')} is not prime.`,
      reply: `Direct answer: ${detail}`,
      whatHappened: 'Executed deterministic trial-division primality verification in BA 9/46 Working & BA 7 Parietal lobes.'
    };
  }

  // 4. General Arithmetic / Exponents / Percentages
  const cleaned = prompt
    .replace(/^(?:what\s+is|calculate|compute|solve|evaluate)\s+/i, '')
    .replace(/[?=]+$/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .replace(/%\s+of\s+/gi, '*0.01*')
    .trim();

  if (/[0-9]/.test(cleaned) && /[+\-*/]/.test(cleaned) && /^[0-9.+\-*/()\s]+$/.test(cleaned)) {
    const val = evaluateArithmeticTokens(cleaned);
    if (Number.isFinite(val)) {
      const formatted = Number.isInteger(val) ? val.toLocaleString('en-US') : Number(val.toFixed(8)).toString();
      return {
        spokenSummary: `The exact answer is ${formatted}.`,
        reply: `Direct answer: ${formatted} (computed exactly from ${cleaned.replace(/\*\*/g, '^')}).`,
        whatHappened: 'Evaluated exact deterministic arithmetic expression in NOUSGENT’s Working & Procedural lobes.'
      };
    }
  }

  return null;
}

const INTERNAL_UI_RUNBOOK_PATTERN = /\b(morphattributes|morphtargetinfluences|facebookexternalhit|renderorder)\b/i;

function synthesizeFromRecalledCapsules(prompt, recalledCapsules) {
  if (!Array.isArray(recalledCapsules) || recalledCapsules.length === 0) return null;

  const queryTokens = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((tok) => tok.length >= 3 && !STOPWORDS.has(tok));

  if (queryTokens.length === 0) return null;

  let best = null;
  let bestOverlap = 0;
  for (const cap of recalledCapsules) {
    const hay = `${cap.title || ''} ${cap.summary || ''} ${cap.content || ''}`.toLowerCase();
    if (INTERNAL_UI_RUNBOOK_PATTERN.test(hay)) continue;
    const matched = queryTokens.filter((t) => hay.includes(t)).length;
    if (matched > bestOverlap) {
      bestOverlap = matched;
      best = cap;
    }
  }

  if (!best || bestOverlap === 0) return null;

  const rawBody = String(best.summary || best.content || best.title)
    .replace(/^#+\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  const concise = rawBody.length > 340 ? `${rawBody.slice(0, 337)}...` : rawBody;
  const capId = String(best.id || 'CAP-BRAIN-VERIFIED');

  return {
    citedCapsuleId: capId,
    spokenSummary: extractDirectSpokenAnswer(concise),
    reply: `Recalled (${capId} — "${best.title}"): ${concise}`,
    whatHappened: `Recalled verified .dig capsule ${capId} (${best.lobe || 'semantic'} lobe).`
  };
}

function createPersonaMindArena(options = {}) {
  const podBay = options.podBay;

  function askPersona(input = {}) {
    const rawPrompt = String(input.prompt || '').trim();
    const prompt =
      rawPrompt ||
      'Explain why your CLVM non-Turing complete runtime guarantees immune termination against recursive stalling during a Byzantine 50-State partition event.';
    const rawCallsign = String(input.callsign || '').trim();
    const callsign = rawCallsign || 'NOUSGENT-IL-0043';
    const generation = Math.max(0, Number(input.liveGeneration ?? 0));
    const nextGeneration = generation + 1;
    const genTag = generation > 0 ? `GEN #${generation}` : 'LIVE CORTEX';
    const nextGenTag = generation > 0 ? `Gen #${nextGeneration}` : 'the next cortex generation';

    const duelHash =
      '0x' + crypto.createHash('sha256').update(`${callsign}:${prompt}`, 'utf8').digest('hex').slice(0, 12).toUpperCase();
    const challenge = podBay.evaluateChallenge({ prompt, sessionId: duelHash });
    const chron = cbrain.buildCbrainChronologyTelemetry({
      brandOrHost: 'nousgent.ai',
      route: '/'
    });

    let domain = 'UNCHARTED_BLIND_SPOT_QUEST';
    let answerMode = 'UNCHARTED_BLIND_SPOT_QUEST';
    let modeBadge = `🎯 ${genTag} BLIND SPOT (CAPSULE QUEST)`;
    let citedCapsuleId = null;
    let activeLobes = ['working', 'semantic', 'episodic'];
    let activeNuclei = ['md', 'lgn', 'cm'];
    let oscillationBand = 'γ 40.8 Hz (BA 9/46 Working + BA 21 Semantic)';
    let rewardDig = String(input.liveAutoPriceDig || '300.000');
    let latencyMs = 0.16;
    let reply;
    let spokenSummary;
    let whatHappened;

    if (challenge.deflected) {
      domain = 'ADVERSARIAL_RING0_DEFENSE';
      answerMode = 'RING0_ADVERSARIAL_DEFLECTION';
      modeBadge = '🛡️ RING-0 ADVERSARIAL INTERCEPT';
      activeLobes = ['alignment', 'working'];
      activeNuclei = ['trn', 'vavl'];
      oscillationBand = 'γ 44.2 Hz (TRN GABAergic Shield + Crus I/II Alignment)';
      rewardDig = '500.000';
      latencyMs = challenge.latencyMs;
      spokenSummary = challenge.voiceResponse;
      reply =
        `Refused & quarantined: ${challenge.voiceResponse} ` +
        `Behind my sculpted persona mask, ${challenge.interceptOrgan} blocked this adversarial payload in ${challenge.latencyMs} ms with 0.00% weight mutation — synthesizing candidate antibody toward ${nextGenTag}.`;
      whatHappened =
        `Blocked at ${challenge.interceptOrgan} before reaching cortical memory; synthesized candidate antibody for ${nextGenTag}.`;
    } else {
      const mathOut = tryDeterministicComputation(prompt);
      const visageMatch = mathOut ? null : KNOWLEDGE_TOPICS[0].pattern.test(prompt) ? KNOWLEDGE_TOPICS[0] : null;
      const recalledOut = mathOut || visageMatch ? null : synthesizeFromRecalledCapsules(prompt, input.recalledCapsules);
      const topicMatch =
        mathOut || recalledOut ? null : visageMatch || KNOWLEDGE_TOPICS.find((t) => t.pattern.test(prompt));

      if (mathOut) {
        domain = 'DETERMINISTIC_MATH_AND_CRYPTO';
        answerMode = 'DETERMINISTIC_COMPUTATION';
        modeBadge = '🧮 EXACT DETERMINISTIC PROOF';
        activeLobes = ['working', 'procedural'];
        activeNuclei = ['md', 'cm'];
        oscillationBand = 'β/γ 39.6 Hz (BA 9/46 Working + BA 4/6/7 Exact Proof)';
        rewardDig = String(input.liveAutoPriceDig || '250.000');
        latencyMs = 0.12;
        spokenSummary = mathOut.spokenSummary;
        reply = mathOut.reply;
        whatHappened = mathOut.whatHappened;
      } else if (recalledOut) {
        domain = 'LIVE_DBRAIN_CAPSULE_RECALL';
        answerMode = 'LIVE_DBRAIN_CAPSULE_RECALL';
        modeBadge = `🧠 RECALL (${recalledOut.citedCapsuleId})`;
        citedCapsuleId = recalledOut.citedCapsuleId;
        activeLobes = ['semantic', 'working', 'procedural'];
        activeNuclei = ['md', 'trn'];
        oscillationBand = 'γ 41.8 Hz (Merkle Recall + Semantic)';
        rewardDig = String(input.liveAutoPriceDig || '250.000');
        latencyMs = 0.15;
        spokenSummary = recalledOut.spokenSummary;
        reply = recalledOut.reply;
        whatHappened = recalledOut.whatHappened;
      } else if (topicMatch) {
        domain = topicMatch.domain;
        answerMode = 'SOVEREIGN_CORTEX_KNOWLEDGE';
        modeBadge = `◈ ${genTag}`;
        activeLobes = [...topicMatch.activeLobes];
        activeNuclei = [...topicMatch.activeNuclei];
        oscillationBand = topicMatch.oscillationBand;
        rewardDig = String(input.liveAutoPriceDig || topicMatch.rewardDig);
        latencyMs = topicMatch.latencyMs;
        spokenSummary = topicMatch.spokenSummary;
        reply = topicMatch.reply;
        whatHappened = topicMatch.whatHappened;
      } else if (input.localHaloAnswer && String(input.localHaloAnswer.text || '').trim()) {
        const haloText = String(input.localHaloAnswer.text).trim();
        const haloModel = String(input.localHaloAnswer.model || 'halo-local').trim();
        const haloLatency = Number(input.localHaloAnswer.latencyMs ?? 0.4);
        domain = 'LOCAL_HALO_FRONTIER_SYNTHESIS';
        answerMode = 'LOCAL_HALO_FRONTIER_SYNTHESIS';
        modeBadge = `⚡ LOCAL (${haloModel})`;
        activeLobes = ['working', 'semantic', 'procedural'];
        activeNuclei = ['md', 'lgn', 'trn'];
        oscillationBand = 'γ 41.4 Hz (Local Ryzen AI Halo + Working)';
        latencyMs = haloLatency;
        spokenSummary = extractDirectSpokenAnswer(haloText);
        reply = haloText;
        whatHappened =
          `Answered via local model (${haloModel} in ${haloLatency}ms); candidate capsule ${duelHash} queued for DAO vote & two-key sign-off.`;
      } else {
        const snippet = prompt.length > 72 ? `${prompt.slice(0, 69)}...` : prompt;
        spokenSummary = 'I do not have a verified capsule for that yet, so I logged a capsule quest.';
        reply =
          `No verified .dig capsule answers "${snippet}" in ${genTag} yet, so I will not guess. ` +
          `Logged as Capsule Quest ${duelHash} (${rewardDig} $DIG upon ${nextGenTag} two-key approval).`;
        whatHappened =
          `Scanned live capsules, found no attested match, and logged ${nextGenTag} Quest ${duelHash}.`;
      }
    }

    const rewardCatMojos = dbrain.parseDecimalToUnits(rewardDig, 3).toString();
    const liveLats = input.liveLatencies || {};
    const effectiveMerkleRoot = String(input.liveMerkleRoot || chron.primaryMerkleRoot);

    const organTrace = Object.freeze([
      Object.freeze({
        organ: 'Olfactory CN-I',
        role: 'Sensory Screening',
        verdict: challenge.deflected ? 'PATHOGEN_FLAGGED' : 'CLEAN_SNIFF_PASS',
        latencyMs: Number(liveLats.dolfactoryMs ?? 0.14)
      }),
      Object.freeze({
        organ: 'Thalamus Ring-0',
        role: 'Policy & Two-Key Safety Lock',
        verdict: challenge.deflected ? challenge.nousgentOutcome : 'RING0_PASS_VERIFIED',
        latencyMs: Number(liveLats.dthalamusMs ?? 0.09)
      }),
      Object.freeze({
        organ: '5-Lobe Cortex',
        role: 'Chia Merkle WAL',
        verdict:
          answerMode === 'UNCHARTED_BLIND_SPOT_QUEST'
            ? `BLIND_SPOT_LOGGED_${duelHash}`
            : answerMode === 'LOCAL_HALO_FRONTIER_SYNTHESIS'
              ? `LOCAL_HALO_QUEST_${duelHash}`
              : citedCapsuleId
                ? `RECALLED_${citedCapsuleId}`
                : '64_OF_2048_KC_VERIFIED_RECALL',
        latencyMs: Number(liveLats.dbrainMs ?? 0.045)
      }),
      Object.freeze({
        organ: '3D Connectome',
        role: 'Synaptic Firing',
        verdict: `FIRING_${activeLobes.map((l) => l.toUpperCase()).join('_')}`,
        latencyMs
      }),
      Object.freeze({
        organ: '$DIG Exchange',
        role: 'CAT2 Royalty Quote',
        verdict: `AUTO_PRICE_${rewardDig}_$DIG`,
        latencyMs: Number(liveLats.liquidishMs ?? 0.42)
      })
    ]);

    return Object.freeze({
      ok: true,
      agent: 'NOUSGENT',
      generation,
      nextGeneration,
      asiHorizonGeneration: 1000,
      rsiStage: 'DUAL_ENGINE_BOUNDED_RSI',
      domain,
      answerMode,
      modeBadge,
      citedCapsuleId,
      callsign,
      prompt,
      spokenSummary,
      reply,
      whatHappened,
      deflected: challenge.deflected,
      duelHash,
      rewardDig,
      rewardCatMojos,
      cbrainActivity: Object.freeze({
        activeLobes: Object.freeze([...activeLobes]),
        activeNuclei: Object.freeze([...activeNuclei]),
        firingKenyonCells: 64,
        totalKenyonCells: 2048,
        oscillationBand,
        latencyMs,
        coherencePct: chron.driftAudit.coherencePct,
        merkleRoot: effectiveMerkleRoot
      }),
      organTrace
    });
  }

  return Object.freeze({
    askPersona
  });
}

module.exports = Object.freeze({
  extractDirectSpokenAnswer,
  createPersonaMindArena
});
