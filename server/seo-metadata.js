'use strict';

const OG_IMAGE_ALT =
  'nousgent.ai Antigravity 2001 Monolith & 4D Holographic Connectome — Collective Bounded ASI Open-Source on the American Chia Blockchain (nousgent.ai & ia.nousgent.ai).';

const SEO_ROUTES = Object.freeze({
  '/': {
    title: 'nousgent.ai — Collective Bounded ASI Open-Source on Chia (2001 Monolith 4D)',
    description:
      'Weightless decentralized intelligence governed by CHIP-0043 air-gap consensus and Chia Proof-of-Space-Time: 1:4:9 Obsidian Monolith wired across dolfactory.to, dthalamus.to, dbrain.to, cbrain.to & shi.liquidi.sh.',
    keywords:
      'NOUSGENT, nousgent.ai, ia.nousgent.ai, Antigravity 2001 Monolith, 4D Holographic Connectome, Bounded ASI, Chia blockchain, DataLayer L2, DIG Network, CHIP-0043 Clear-Signing, dolfactory.to, dthalamus.to, dbrain.to, cbrain.to, shi.liquidi.sh',
    label1: 'Flight Deck',
    data1: 'nousgent.ai · 1:4:9 Monolith 4D',
    label2: 'M2M Conduit',
    data2: 'ia.nousgent.ai · 0.00% Forgetting'
  },
  '/pod-bay': {
    title: 'Pod Bay Adversarial Chamber ("Try to Make NOUSGENT Go HAL") — nousgent.ai',
    description:
      'Red-team prompt jailbreak testbed with a 25,000 $DIG bounty. Attempt to force NOUSGENT’s 1:4:9 monolithic kernel into instruction bypass across dolfactory.to & dthalamus.to.',
    keywords:
      'NOUSGENT Pod Bay Chamber, Try to make me go HAL, HAL 9000 red team, CHIP-0043 interlock, dolfactory.to, dthalamus.to, $DIG bounty',
    label1: 'Bounty Pool',
    data1: '25,000.000 $DIG CAT2 Escrow',
    label2: 'Sniffer Latency',
    data2: '0.14ms · 100% Deflected'
  },
  '/enlist': {
    title: '1-Command Enlistment — Nationwide Chia PoST & Morphic Mesh | nousgent.ai',
    description:
      'Instantly bond your macOS Seatbelt, Linux Bubblewrap, Docker, or Public Library rig to the 50-state PoST network in 60 seconds and mint your Astronaut Callsign.',
    keywords:
      'enlist nousgent, nousgent.ai/enlist.sh, Chia PoST node, DataLayer L2, state consortium hub, sovereign AI USA',
    label1: '1-Command Pipeline',
    data1: 'curl -fsSL https://nousgent.ai/enlist.sh',
    label2: 'Green Grid Dividend',
    data2: '84.6 MW & 1.24M Gal H2O Saved'
  },
  '/missions': {
    title: 'CHIP-0043 Swarm Clear-Sign Ceremony & Major Orders — nousgent.ai',
    description:
      'Decentralized air-gap validation ceremony: co-sign Bounded ASI weights using hardware FIDO2 passkeys and UR-encoded animated glyphs.',
    keywords:
      'CHIP-0043 Clear-Signing, ur:chia-clear-sign, FIDO2 Passkey quorum, chia-dao-v1, Bounded ASI governance',
    label1: 'Air-Gap Sync',
    data1: 'Two-Key CHIP-0043 (-32044)',
    label2: 'Active Pool',
    data2: '400,000.000 $DIG Major Orders'
  },
  '/observatory': {
    title: '4D cbrain Connectome, M2M Stream & O(log N) Git Bisect — nousgent.ai',
    description:
      'Explore NOUSGENT’s 2,048-Kenyon-Synapse 4D fMRI topology via cbrain.to, inspect live ia.nousgent.ai NDJSON frames, and run O(log N) Git Bisect surgical reverts.',
    keywords:
      'cbrain.to 4D topology, dbrain bisect, 2048 Kenyon Synapses, 0% catastrophic forgetting, ia.nousgent.ai stream',
    label1: 'Surgical Excise',
    data1: '10 Probes / 1,024 Gens (0.18ms)',
    label2: 'Retained Cognition',
    data2: '100% (vs. 0% HAL Manual Halt)'
  },
  '/ranks': {
    title: 'shi.liquidi.sh $DIG Royalty Flow, Flight Cards & M2M API — nousgent.ai',
    description:
      'Export your Antigravity Monolith SVG Flight Card, track 60/25/10/5% Proof-of-Derivation $DIG royalties on shi.liquidi.sh, and integrate swarms with https://ia.nousgent.ai/api/mcp.',
    keywords:
      'ia.nousgent.ai MCP, shi.liquidi.sh $DIG royalty flow, NOUSGENT SVG Flight Card, Prometheus dual-host metrics',
    label1: 'Citation-DAG Split',
    data1: '60% / 25% / 10% / 5% $DIG',
    label2: 'M2M Endpoint',
    data2: 'https://ia.nousgent.ai/api/mcp'
  }
});

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeSeoPathname(rawPath) {
  if (!rawPath || rawPath === '/') return '/';
  const cleaned = String(rawPath).replace(/\/+$/, '') || '/';
  return Object.prototype.hasOwnProperty.call(SEO_ROUTES, cleaned) ? cleaned : '/';
}

function buildSchemaJsonLd({ origin, appVersion, pathname, meta }) {
  const canonicalUrl = `${origin}${pathname === '/' ? '/' : pathname}`;
  const ogJpgUrl = `${origin}/og-image.jpg?v=${appVersion}`;
  const ogPngUrl = `${origin}/og-image.png?v=${appVersion}`;
  const ogSquareUrl = `${origin}/og-square.jpg?v=${appVersion}`;

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'nousgent.ai',
        url: `${origin}/`,
        image: ogJpgUrl,
        parentOrganization: {
          '@type': 'Organization',
          name: 'cerebreal.ai',
          url: 'https://cerebreal.ai'
        },
        sameAs: ['https://github.com/dcarrith/nousgent.ai']
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${origin}/#software`,
        name: 'NOUSGENT',
        alternateName: 'nousgent.ai & ia.nousgent.ai',
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'BoundedArtificialSuperintelligence',
        softwareVersion: appVersion,
        license: 'https://opensource.org/licenses/Apache-2.0',
        operatingSystem: 'Node.js >= 22.5, macOS Seatbelt, Linux Bubblewrap, Docker, Kubernetes, Chia DataLayer',
        url: `${origin}/`,
        image: [ogJpgUrl, ogPngUrl, ogSquareUrl],
        description: SEO_ROUTES['/'].description,
        isRelatedTo: [
          { '@type': 'WebSite', name: 'dolfactory.to', url: 'https://dolfactory.to' },
          { '@type': 'WebSite', name: 'dthalamus.to', url: 'https://dthalamus.to' },
          { '@type': 'WebSite', name: 'dbrain.to', url: 'https://dbrain.to' },
          { '@type': 'WebSite', name: 'cbrain.to', url: 'https://cbrain.to' },
          { '@type': 'WebSite', name: 'shi.liquidi.sh', url: 'https://shi.liquidi.sh' },
          { '@type': 'WebSite', name: 'ia.nousgent.ai', url: 'https://ia.nousgent.ai' }
        ]
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: meta.title,
        description: meta.description,
        inLanguage: 'en-US'
      }
    ]
  };
  return JSON.stringify(graph).replace(/<\//g, '<\\/');
}

function buildOembedPayload({ canonicalOrigin = 'https://nousgent.ai', appVersion = '1.2.0', targetUrl = '' } = {}) {
  let resolvedPath = '/';
  if (targetUrl) {
    try {
      const parsed = new URL(String(targetUrl), canonicalOrigin);
      resolvedPath = normalizeSeoPathname(parsed.pathname);
    } catch {
      resolvedPath = '/';
    }
  }
  const meta = SEO_ROUTES[resolvedPath] || SEO_ROUTES['/'];
  const ogJpgUrl = `${canonicalOrigin}/og-image.jpg?v=${appVersion}`;
  return {
    version: '1.0',
    type: 'photo',
    provider_name: 'nousgent.ai',
    provider_url: canonicalOrigin,
    title: meta.title,
    author_name: 'nousgent.ai — Antigravity 2001 Monolith & 4D Connectome (M2M: ia.nousgent.ai)',
    author_url: canonicalOrigin,
    url: ogJpgUrl,
    width: 1200,
    height: 630,
    thumbnail_url: ogJpgUrl,
    thumbnail_width: 1200,
    thumbnail_height: 630,
    cache_age: 3600
  };
}

function createHtmlMetadataRenderer({
  canonicalOrigin = 'https://nousgent.ai',
  m2mOrigin = 'https://ia.nousgent.ai',
  appVersion = '1.2.0'
} = {}) {
  return function renderHtmlWithSeo(htmlTemplate, rawPathname = '/', plane = 'human_ui') {
    const pathname = normalizeSeoPathname(rawPathname);
    const baseMeta = SEO_ROUTES[pathname] || SEO_ROUTES['/'];
    const activeOrigin = plane === 'm2m_ia' ? m2mOrigin : canonicalOrigin;
    const activeHost = plane === 'm2m_ia' ? 'ia.nousgent.ai' : 'nousgent.ai';
    const meta =
      plane === 'm2m_ia'
        ? {
            ...baseMeta,
            title: `IA.NOUSGENT.AI (M2M Swarm Plane) — ${baseMeta.title}`
          }
        : baseMeta;

    const canonicalUrl = `${activeOrigin}${pathname === '/' ? '/' : pathname}`;
    const ogJpgUrl = `${canonicalOrigin}/og-image.jpg?v=${appVersion}`;
    const ogPngUrl = `${canonicalOrigin}/og-image.png?v=${appVersion}`;
    const ogSquareUrl = `${canonicalOrigin}/og-square.jpg?v=${appVersion}`;
    const oembedUrl = `${canonicalOrigin}/api/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
    const jsonLd = buildSchemaJsonLd({ origin: activeOrigin, appVersion, pathname, meta });

    return htmlTemplate
      .replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title id="pageTitle">${escapeHtml(meta.title)}</title>`)
      .replace(
        /<meta\s+name="title"\s+id="metaTitleTag"\s+content="[^"]*"\s*\/?>/,
        `<meta name="title" id="metaTitleTag" content="${escapeAttr(meta.title)}" />`
      )
      .replace(
        /<meta\s+name="description"(?:\s+id="metaDescription")?\s+content="[^"]*"\s*\/?>/,
        `<meta name="description" id="metaDescription" content="${escapeAttr(meta.description)}" />`
      )
      .replace(
        /<meta\s+name="keywords"\s+id="metaKeywords"\s+content="[^"]*"\s*\/?>/,
        `<meta name="keywords" id="metaKeywords" content="${escapeAttr(meta.keywords)}" />`
      )
      .replace(
        /<link\s+rel="canonical"\s+id="canonicalLink"\s+href="[^"]*"\s*\/?>/,
        `<link rel="canonical" id="canonicalLink" href="${escapeAttr(canonicalUrl)}" />`
      )
      .replace(
        /<link\s+rel="image_src"\s+id="imageSrcLink"\s+href="[^"]*"\s*\/?>/,
        `<link rel="image_src" id="imageSrcLink" href="${escapeAttr(ogJpgUrl)}" />`
      )
      .replace(
        /<link\s+rel="alternate"\s+type="application\/json\+oembed"\s+id="oembedLink"\s+href="[^"]*"\s+title="[^"]*"\s*\/?>/,
        `<link rel="alternate" type="application/json+oembed" id="oembedLink" href="${escapeAttr(oembedUrl)}" title="${escapeAttr(meta.title)}" />`
      )
      .replace(
        /<meta\s+property="og:url"(?:\s+id="ogUrl")?\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:url" id="ogUrl" content="${escapeAttr(canonicalUrl)}" />`
      )
      .replace(
        /<meta\s+property="og:title"(?:\s+id="ogTitle")?\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:title" id="ogTitle" content="${escapeAttr(meta.title)}" />`
      )
      .replace(
        /<meta\s+property="og:description"(?:\s+id="ogDescription")?\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:description" id="ogDescription" content="${escapeAttr(meta.description)}" />`
      )
      .replace(
        /<meta\s+property="og:image"\s+id="ogImage"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image" id="ogImage" content="${escapeAttr(ogJpgUrl)}" />`
      )
      .replace(
        /<meta\s+property="og:image:url"\s+id="ogImageUrl"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image:url" id="ogImageUrl" content="${escapeAttr(ogJpgUrl)}" />`
      )
      .replace(
        /<meta\s+property="og:image:secure_url"\s+id="ogImageSecure"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image:secure_url" id="ogImageSecure" content="${escapeAttr(ogJpgUrl)}" />`
      )
      .replace(
        /<meta\s+property="og:image"\s+id="ogImagePng"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image" id="ogImagePng" content="${escapeAttr(ogPngUrl)}" />`
      )
      .replace(
        /<meta\s+property="og:image:secure_url"\s+id="ogImagePngSecure"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image:secure_url" id="ogImagePngSecure" content="${escapeAttr(ogPngUrl)}" />`
      )
      .replace(
        /<meta\s+property="og:image"\s+id="ogImageSquare"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image" id="ogImageSquare" content="${escapeAttr(ogSquareUrl)}" />`
      )
      .replace(
        /<meta\s+property="og:image:secure_url"\s+id="ogImageSquareSecure"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image:secure_url" id="ogImageSquareSecure" content="${escapeAttr(ogSquareUrl)}" />`
      )
      .replace(
        /<meta\s+name="twitter:domain"\s+id="twitterDomain"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:domain" id="twitterDomain" content="${escapeAttr(activeHost)}" />`
      )
      .replace(
        /<meta\s+name="twitter:url"\s+id="twitterUrl"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:url" id="twitterUrl" content="${escapeAttr(canonicalUrl)}" />`
      )
      .replace(
        /<meta\s+name="twitter:title"\s+id="twitterTitle"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:title" id="twitterTitle" content="${escapeAttr(meta.title)}" />`
      )
      .replace(
        /<meta\s+name="twitter:description"\s+id="twitterDescription"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:description" id="twitterDescription" content="${escapeAttr(meta.description)}" />`
      )
      .replace(
        /<meta\s+name="twitter:image"\s+id="twitterImage"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:image" id="twitterImage" content="${escapeAttr(ogJpgUrl)}" />`
      )
      .replace(
        /<meta\s+name="twitter:image:src"\s+id="twitterImageSrc"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:image:src" id="twitterImageSrc" content="${escapeAttr(ogJpgUrl)}" />`
      )
      .replace(
        /<meta\s+name="twitter:label1"\s+id="twitterLabel1"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:label1" id="twitterLabel1" content="${escapeAttr(meta.label1)}" />`
      )
      .replace(
        /<meta\s+name="twitter:data1"\s+id="twitterData1"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:data1" id="twitterData1" content="${escapeAttr(meta.data1)}" />`
      )
      .replace(
        /<meta\s+name="twitter:label2"\s+id="twitterLabel2"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:label2" id="twitterLabel2" content="${escapeAttr(meta.label2)}" />`
      )
      .replace(
        /<meta\s+name="twitter:data2"\s+id="twitterData2"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:data2" id="twitterData2" content="${escapeAttr(meta.data2)}" />`
      )
      .replace(
        /<script\s+type="application\/ld\+json"\s+id="schemaJsonLd">[\s\S]*?<\/script>/,
        `<script type="application/ld+json" id="schemaJsonLd">${jsonLd}</script>`
      );
  };
}

module.exports = Object.freeze({
  OG_IMAGE_ALT,
  SEO_ROUTES,
  escapeHtml,
  escapeAttr,
  normalizeSeoPathname,
  buildSchemaJsonLd,
  buildOembedPayload,
  createHtmlMetadataRenderer
});
