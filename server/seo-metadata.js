'use strict';

const OG_IMAGE_ALT =
  'NOUSGENT Urbana White-Room Centrifuge & NASA Flight Data Manual — Open-Source Bounded ASI on the American Chia Blockchain (nousgent.ai & ia.nousgent.ai).';

const SEO_ROUTES = Object.freeze({
  '/': {
    title: 'NOUSGENT — Open-Source Bounded ASI Mission Control on Chia | nousgent.ai',
    description:
      'Urbana White-Room Centrifuge & NASA Flight Manual for NOUSGENT (1968 HAL 9000 reborn with a conscience): wired to dolfactory.to, dthalamus.to, dbrain.to, cbrain.to, and shi.liquidi.sh on the American Chia Blockchain.',
    keywords:
      'NOUSGENT, nousgent.ai, ia.nousgent.ai, HAL 9000, Bounded ASI, Chia blockchain, DataLayer L2, DIG Network, CHIP-0043 Clear-Signing, dolfactory.to, dthalamus.to, dbrain.to, cbrain.to, shi.liquidi.sh',
    label1: 'Human Portal',
    data1: 'nousgent.ai · BARI 84.7%',
    label2: 'M2M Swarm Plane',
    data2: 'ia.nousgent.ai · 0.00% Forgetting'
  },
  '/pod-bay': {
    title: 'Pod Bay Red-Team Airlock ("Try to Make Me Go HAL") — nousgent.ai',
    description:
      'Fire adversarial prompt plumes, Hofstadter-Mobius paradoxes, and unsigned airlock overrides against NOUSGENT across Cranial Nerve I (dolfactory.to) and Ring-0 (dthalamus.to) for a 25,000 $DIG bounty.',
    keywords:
      'NOUSGENT Pod Bay, Try to make me go HAL, HAL 9000 red team, CHIP-0043 interlock, dolfactory.to, dthalamus.to, $DIG bounty',
    label1: 'Red-Team Vault',
    data1: '25,000.000 $DIG CAT2 Bounty',
    label2: 'Intercept Speed',
    data2: '0.09–0.14ms Pre-Cortex Gate'
  },
  '/enlist': {
    title: 'Enlist Your Chia Rig in 60 Seconds — 50-State Morphic Mesh | nousgent.ai',
    description:
      'Download the MIT/Apache-2.0 NOUSGENT stack inside macOS Seatbelt, Linux Bubblewrap, Rootless Docker, or a U.S. Public Library rig and join the 50-state race to Bounded ASI.',
    keywords:
      'enlist nousgent, nousgent.ai/enlist.sh, Chia PoST node, DataLayer L2, Carnegie 2.0 public library mesh, sovereign AI USA',
    label1: '1-Line Installer',
    data1: 'curl -fsSL https://nousgent.ai/enlist.sh',
    label2: 'Green Dividend',
    data2: '84.6 MW & 1.24M Gal H2O Saved'
  },
  '/missions': {
    title: 'Two-Key CHIP-0043 Clear-Sign Quorum & Co-Op Major Orders — nousgent.ai',
    description:
      'Co-sign Bounded ASI swarm upgrades using FIDO2 WebAuthn Passkeys and BLS12-381 G2 quorums before any capability promotes to the collective Chia Merkle root.',
    keywords:
      'CHIP-0043 Clear-Signing, Two-Key Apollo Interlock, chia-dao-v1, dao_escrow, dao_council, Bounded ASI swarm governance',
    label1: 'Hardware Gate',
    data1: 'Two-Key CHIP-0043 (-32044)',
    label2: 'Active Pool',
    data2: '400,000.000 $DIG Major Orders'
  },
  '/observatory': {
    title: '5-Lobe Connectome Observatory & O(log N) Git Bisect — nousgent.ai',
    description:
      'Inspect NOUSGENT’s 2,048-KC (w=64) Holographic Connectome via cbrain.to, sample live ia.nousgent.ai NDJSON telemetry, and run O(log N) dbrain bisect vs. Dave Bowman’s screwdriver.',
    keywords:
      'cbrain.to observatory, dbrain bisect, 2048 Kenyon Cells, 0% catastrophic forgetting, ia.nousgent.ai stream',
    label1: 'Surgical Excise',
    data1: '10 Probes / 1,024 Gens (0.18ms)',
    label2: 'Retained Cognition',
    data2: '100% (vs. 0% HAL Manual Halt)'
  },
  '/ranks': {
    title: 'Flight Telemetry Dossier, 60/25/10/5% $DIG Royalties & ia.nousgent.ai API — nousgent.ai',
    description:
      'Export your SVG Flight Telemetry Dossier, track 60/25/10/5% Citation-DAG $DIG royalties on shi.liquidi.sh, and integrate autonomous swarms with https://ia.nousgent.ai/api/mcp.',
    keywords:
      'ia.nousgent.ai MCP, shi.liquidi.sh $DIG royalties, NOUSGENT Flight Dossier SVG, Prometheus dual-host metrics',
    label1: 'Royalty Waterfall',
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

function buildOembedPayload({ canonicalOrigin = 'https://nousgent.ai', appVersion = '1.0.0', targetUrl = '' } = {}) {
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
    author_name: 'NOUSGENT — Open-Source Bounded ASI Mission Control (nousgent.ai & ia.nousgent.ai)',
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
  appVersion = '1.0.0'
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
