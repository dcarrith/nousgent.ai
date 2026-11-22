#!/usr/bin/env node
/**
 * nousgent.ai & ia.nousgent.ai Semantic Versioning (SemVer 2.0.0) Lockstep Manager
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;

function parseSemver(v) {
  const clean = String(v || '').trim().replace(/^v/, '');
  const m = SEMVER_REGEX.exec(clean);
  if (!m) throw new Error(`Invalid SemVer: "${v}"`);
  return { raw: clean, major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

function bump(curStr, kind) {
  const c = parseSemver(curStr);
  if (kind === 'major') return `${c.major + 1}.0.0`;
  if (kind === 'minor') return `${c.major}.${c.minor + 1}.0`;
  if (kind === 'patch') return `${c.major}.${c.minor}.${c.patch + 1}`;
  throw new Error(`Unknown bump kind: ${kind}`);
}

function readJson(rel) {
  const full = path.join(ROOT, rel);
  return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8')) : null;
}

function writeJson(rel, obj) {
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function syncAll(targetStr) {
  const { raw: v } = parseSemver(targetStr);
  const pkg = readJson('package.json');
  if (pkg) {
    pkg.version = v;
    writeJson('package.json', pkg);
  }
  const lock = readJson('package-lock.json');
  if (lock) {
    lock.version = v;
    if (lock.packages && lock.packages['']) lock.packages[''].version = v;
    writeJson('package-lock.json', lock);
  }
  for (const rel of ['deploy/resources/Dockerfile', '.agent/skills/nousgent-deployer/resources/Dockerfile']) {
    const f = path.join(ROOT, rel);
    if (fs.existsSync(f)) {
      const txt = fs.readFileSync(f, 'utf8').replace(/^ARG\s+APP_VERSION=[^\s]+$/m, `ARG APP_VERSION=${v}`);
      fs.writeFileSync(f, txt, 'utf8');
    }
  }
  for (const rel of ['deploy/resources/k8s/01-configmap.yaml', '.agent/skills/nousgent-deployer/resources/k8s/01-configmap.yaml']) {
    const f = path.join(ROOT, rel);
    if (fs.existsSync(f)) {
      const txt = fs
        .readFileSync(f, 'utf8')
        .replace(/app\.kubernetes\.io\/version:\s*"[^"]+"/g, `app.kubernetes.io/version: "${v}"`)
        .replace(/APP_VERSION:\s*"[^"]+"/g, `APP_VERSION: "${v}"`);
      fs.writeFileSync(f, txt, 'utf8');
    }
  }
  for (const rel of ['deploy/resources/k8s/10-deployment-web.yaml', '.agent/skills/nousgent-deployer/resources/k8s/10-deployment-web.yaml']) {
    const f = path.join(ROOT, rel);
    if (fs.existsSync(f)) {
      const txt = fs
        .readFileSync(f, 'utf8')
        .replace(/app\.kubernetes\.io\/version:\s*"[^"]+"/g, `app.kubernetes.io/version: "${v}"`)
        .replace(/image:\s*nousgent-web:[^\s]+/g, `image: nousgent-web:${v}`);
      fs.writeFileSync(f, txt, 'utf8');
    }
  }
  const dapp = readJson('dApp/dig-manifest.json');
  if (dapp) {
    dapp.version = v;
    writeJson('dApp/dig-manifest.json', dapp);
  }
  return v;
}

const args = process.argv.slice(2);
const cmd = args[0] || 'status';
const pkg = readJson('package.json');

if (cmd === 'status') {
  const v = pkg.version;
  const checks = [
    ['package.json', pkg.version],
    [
      'deploy/resources/Dockerfile',
      fs.existsSync(path.join(ROOT, 'deploy/resources/Dockerfile'))
        ? (fs.readFileSync(path.join(ROOT, 'deploy/resources/Dockerfile'), 'utf8').match(/^ARG\s+APP_VERSION=([^\s]+)$/m) || [])[1]
        : null
    ],
    [
      'deploy/resources/k8s/01-configmap.yaml',
      fs.existsSync(path.join(ROOT, 'deploy/resources/k8s/01-configmap.yaml'))
        ? (fs.readFileSync(path.join(ROOT, 'deploy/resources/k8s/01-configmap.yaml'), 'utf8').match(/APP_VERSION:\s*"([^"]+)"/) || [])[1]
        : null
    ],
    [
      'deploy/resources/k8s/10-deployment-web.yaml',
      fs.existsSync(path.join(ROOT, 'deploy/resources/k8s/10-deployment-web.yaml'))
        ? (fs.readFileSync(path.join(ROOT, 'deploy/resources/k8s/10-deployment-web.yaml'), 'utf8').match(/image:\s*nousgent-web:([^\s]+)/) || [])[1]
        : null
    ]
  ];
  let okAll = true;
  for (const [name, actual] of checks) {
    const ok = actual === v;
    if (!ok) okAll = false;
    console.log(`  ${ok ? '✓' : '✗'} ${name.padEnd(44)} ${actual || 'MISSING'}`);
  }
  if (!okAll && args.includes('--verify')) process.exit(1);
} else if (cmd === 'sync') {
  console.log(`✓ Synced nousgent.ai v${syncAll(pkg.version)}`);
} else if (cmd === 'patch' || cmd === 'minor' || cmd === 'major') {
  const next = syncAll(bump(pkg.version, cmd));
  console.log(`✓ Bumped nousgent.ai: v${pkg.version} -> v${next}`);
}
