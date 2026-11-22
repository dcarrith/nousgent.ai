'use strict';

const OG_IMAGE_ALT =
  'NOUSGENT — Sculpted 3D persona mask and 5-lobe connectome for the Morphic Intelligence Field and autonomous Bounded RSI on Chia.';

const SEO_ROUTES = Object.freeze({
  '/': {
    title: 'NOUSGENT — Morphic Intelligence Field & Bounded RSI on Chia',
    description:
      'Community Second Brains compound verified .dig memory in the Morphic Intelligence Field alongside 24/7 autonomous Bounded RSI on Chia.',
    keywords:
      'NOUSGENT, Morphic Intelligence Field, Autonomous Bounded RSI, Community Second Brains, Chia blockchain, DataLayer, DIG Network, CHIP-0043',
    label1: 'Architecture',
    data1: 'Community Brains + Autonomous RSI',
    label2: 'Retention',
    data2: '0.00% Forgetting · CHIP-0043'
  },
  '/pod-bay': {
    title: 'Redteam — NOUSGENT',
    description:
      'Test adversarial prompts, conflicting directives, and unsigned actuation against pre-cortical and Ring-0 guards.',
    keywords:
      'NOUSGENT Redteam, prompt injection testbed, CHIP-0043 interlock, Ring-0 defense, $DIG bounty',
    label1: 'Bounty',
    data1: '25,000 $DIG Escrow',
    label2: 'Gate Latency',
    data2: '0.14ms · 100% Deflected'
  },
  '/enlist': {
    title: 'Communities — NOUSGENT',
    description:
      'Connect a sandboxed node or community Second Brain to contribute verified .dig capsules and Chia PoST storage.',
    keywords:
      'NOUSGENT Communities, Chia PoST node, DataLayer, Second Brain, CHIP-0043',
    label1: 'Sandbox',
    data1: 'Seatbelt · Bubblewrap · Docker',
    label2: 'Royalties',
    data2: '60% / 25% / 10% / 5% $DIG'
  },
  '/missions': {
    title: 'Signing — NOUSGENT',
    description:
      'Co-sign constitutional upgrades and DAO escrows with hardware FIDO2 passkeys under Two-Key CHIP-0043.',
    keywords:
      'CHIP-0043 Clear-Signing, FIDO2 Passkey quorum, chia-dao-v1, Bounded RSI governance',
    label1: 'Protocol',
    data1: 'Two-Key CHIP-0043 (-32044)',
    label2: 'Escrow',
    data2: '400,000 $DIG'
  },
  '/ranks': {
    title: 'Leaderboard — NOUSGENT',
    description:
      'Live intelligence contributions across community Brain Stores, Chia DIDs, and regional pods.',
    keywords:
      'NOUSGENT Leaderboard, Community-Based Bounded RSI, Chia DID rankings, Morphic Intelligence Field',
    label1: 'Ranked By',
    data1: 'Communities · Chia DIDs · Pods',
    label2: 'Royalties',
    data2: '60% / 25% / 10% / 5% $DIG'
  },
  '/leaderboard': {
    title: 'Leaderboard — NOUSGENT',
    description:
      'Live intelligence contributions across community Brain Stores, Chia DIDs, and regional pods.',
    keywords:
      'NOUSGENT Leaderboard, Community-Based Bounded RSI, Chia DID rankings, Morphic Intelligence Field',
    label1: 'Ranked By',
    data1: 'Communities · Chia DIDs · Pods',
    label2: 'Royalties',
    data2: '60% / 25% / 10% / 5% $DIG'
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
  const logoUrl = `${origin}/logo-wordmark.svg?v=${appVersion}`;
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
        logo: logoUrl,
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
        applicationSubCategory: 'CommunityBoundedRecursiveSelfImprovement',
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

function buildOembedPayload({ canonicalOrigin = 'https://nousgent.ai', appVersion = '1.10.0', targetUrl = '' } = {}) {
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
    provider_name: 'NOUSGENT',
    provider_url: canonicalOrigin,
    title: meta.title,
    author_name: 'NOUSGENT — Collective Bounded RSI',
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
  appVersion = '1.10.0',
  getMaskOpacityPct = () => 65
} = {}) {
  return function renderHtmlWithSeo(htmlTemplate, rawPathname = '/', plane = 'human_ui') {
    const pathname = normalizeSeoPathname(rawPathname);
    const baseMeta = SEO_ROUTES[pathname] || SEO_ROUTES['/'];
    const activeOrigin = plane === 'm2m_ia' ? m2mOrigin : canonicalOrigin;
    const activeHost = plane === 'm2m_ia' ? 'ia.nousgent.ai' : 'nousgent.ai';
    const maskOpacityPct = Math.max(0, Math.min(100, Number(getMaskOpacityPct() ?? 65)));
    const meta =
      plane === 'm2m_ia'
        ? {
            ...baseMeta,
            title: `IA.NOUSGENT.AI (M2M Swarm Plane) — ${baseMeta.title}`
          }
        : baseMeta;

    const canonicalUrl = `${activeOrigin}${pathname === '/' ? '/' : pathname}`;
    const ogJpgUrl = `${canonicalOrigin}/og-image.jpg?v=${appVersion}`;
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
        /<meta\s+property="og:image:secure_url"\s+id="ogImageSecure"\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image:secure_url" id="ogImageSecure" content="${escapeAttr(ogJpgUrl)}" />`
      )
      .replace(
        /<meta\s+property="og:image:alt"(?:\s+id="ogImageAlt")?\s+content="[^"]*"\s*\/?>/,
        `<meta property="og:image:alt" id="ogImageAlt" content="${escapeAttr(OG_IMAGE_ALT)}" />`
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
        /<meta\s+name="twitter:image:alt"\s+id="twitterImageAlt"\s+content="[^"]*"\s*\/?>/,
        `<meta name="twitter:image:alt" id="twitterImageAlt" content="${escapeAttr(OG_IMAGE_ALT)}" />`
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
        /<meta\s+name="nousgent:mask-opacity-pct"\s+id="nousgentMaskOpacityMeta"\s+content="[^"]*"\s*\/?>/,
        `<meta name="nousgent:mask-opacity-pct" id="nousgentMaskOpacityMeta" content="${escapeAttr(String(maskOpacityPct))}" />`
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
