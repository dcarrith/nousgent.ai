#!/usr/bin/env node
/**
 * Builds the content-addressed static `dApp/` bundle (`https://nousgent.ai/dApp/`)
 * with SHA-256 `dig-manifest.json` from `dist/`.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DAPP = path.join(ROOT, 'dApp');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

if (!fs.existsSync(DIST)) {
  throw new Error('dist/ not found — run `npm run build` before `npm run build:dapp`.');
}

fs.rmSync(DAPP, { recursive: true, force: true });
fs.cpSync(DIST, DAPP, { recursive: true });

const dappIndex = path.join(DAPP, 'index.html');
if (fs.existsSync(dappIndex)) {
  const html = fs
    .readFileSync(dappIndex, 'utf8')
    .replace(
      /(src|href)="\/(assets\/|logo-wordmark[^"]*|favicon[^"]*|apple-touch-icon[^"]*|site\.webmanifest)/g,
      '$1="./$2'
    );
  fs.writeFileSync(dappIndex, html, 'utf8');
}

function collectFiles(dir, base = dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) collectFiles(full, base, acc);
    else acc.push(path.relative(base, full).replace(/\\/g, '/'));
  }
  return acc.sort();
}

const files = collectFiles(DAPP);
const fileEntries = files.map((rel) => {
  const buf = fs.readFileSync(path.join(DAPP, rel));
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  return { path: rel, bytes: buf.byteLength, sha256 };
});
const treeSha256 = crypto
  .createHash('sha256')
  .update(fileEntries.map((f) => `${f.path}:${f.sha256}`).join('\n'))
  .digest('hex');

const manifest = {
  protocol: 'DIG-DAPP-MANIFEST-v1',
  name: 'nousgent.ai',
  version: pkg.version,
  canonicalOrigin: 'https://nousgent.ai',
  m2mSwarmOrigin: 'https://ia.nousgent.ai',
  sisterOrgans: {
    olfactory: 'https://dolfactory.to',
    thalamus: 'https://dthalamus.to',
    cortex: 'https://dbrain.to',
    observatory: 'https://cbrain.to',
    exchange: 'https://shi.liquidi.sh'
  },
  builtAt: new Date().toISOString(),
  contentAddressing: {
    manifestTreeSha256: `0x${treeSha256}`,
    totalFiles: fileEntries.length,
    totalBytes: fileEntries.reduce((s, f) => s + f.bytes, 0)
  },
  files: fileEntries
};

fs.writeFileSync(path.join(DAPP, 'dig-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(
  `[build:dapp] nousgent.ai dApp v${pkg.version}: ${fileEntries.length} files (tree 0x${treeSha256.slice(0, 12)}...) -> dApp/`
);
