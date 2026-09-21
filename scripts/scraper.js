const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// ================================================================
// BONGIYO TIMES
// Google News discovery -> original publisher metadata/image -> Supabase
// Includes a dedicated Google News agriculture feed so the কৃষি section
// is populated with agriculture stories instead of generic Bangladesh news.
// ================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase environment variables are missing.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/153.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': USER_AGENT,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,' +
    'image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 18000);
const MAX_ARTICLES_PER_RUN = Number(process.env.MAX_ARTICLES_PER_RUN || 28);
const MAX_ITEMS_TO_INSPECT = Number(process.env.MAX_ITEMS_TO_INSPECT || 120);
const MAX_ARTICLE_AGE_HOURS = Number(process.env.MAX_ARTICLE_AGE_HOURS || 48);
const REQUIRE_IMAGE =
  String(process.env.REQUIRE_NEWS_IMAGE || 'true').toLowerCase() !== 'false';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ================================================================
// APPROVED NATIONAL PUBLISHERS
// ================================================================

const PUBLISHERS = [
  {
    bnName: 'প্রথম আলো',
    domains: ['prothomalo.com'],
    aliases: ['prothom alo', 'প্রথম আলো'],
    home: 'https://www.prothomalo.com/',
  },
  {
    bnName: 'কালের কণ্ঠ',
    domains: ['kalerkantho.com'],
    aliases: ['kaler kantho', 'kalerkantho', 'কালের কণ্ঠ'],
    home: 'https://www.kalerkantho.com/',
  },
  {
    bnName: 'যুগান্তর',
    domains: ['jugantor.com'],
    aliases: ['jugantor', 'যুগান্তর'],
    home: 'https://www.jugantor.com/',
  },
  {
    bnName: 'দৈনিক ইত্তেফাক',
    domains: ['ittefaq.com.bd'],
    aliases: ['ittefaq', 'the daily ittefaq', 'ইত্তেফাক', 'দৈনিক ইত্তেফাক'],
    home: 'https://www.ittefaq.com.bd/',
  },
  {
    bnName: 'সমকাল',
    domains: ['samakal.com'],
    aliases: ['samakal', 'সমকাল'],
    home: 'https://samakal.com/',
  },
  {
    bnName: 'বাংলাদেশ প্রতিদিন',
    domains: ['bd-pratidin.com'],
    aliases: ['bangladesh pratidin', 'bd-pratidin', 'বাংলাদেশ প্রতিদিন'],
    home: 'https://www.bd-pratidin.com/',
  },
  {
    bnName: 'ঢাকা পোস্ট',
    domains: ['dhakapost.com'],
    aliases: ['dhaka post', 'dhakapost', 'ঢাকা পোস্ট'],
    home: 'https://www.dhakapost.com/',
  },
  {
    bnName: 'জাগো নিউজ২৪',
    domains: ['jagonews24.com'],
    aliases: [
      'jago news 24',
      'jagonews24',
      'jago news',
      'জাগো নিউজ',
      'জাগো নিউজ২৪',
    ],
    home: 'https://www.jagonews24.com/',
  },
  {
    bnName: 'বাংলা ট্রিবিউন',
    domains: ['banglatribune.com'],
    aliases: ['bangla tribune', 'বাংলা ট্রিবিউন'],
    home: 'https://www.banglatribune.com/',
  },
  {
    bnName: 'বাংলানিউজ২৪ ডটকম',
    domains: ['banglanews24.com'],
    aliases: [
      'banglanews24',
      'banglanews24.com',
      'বাংলানিউজ২৪',
      'বাংলানিউজ',
    ],
    home: 'https://www.banglanews24.com/',
  },
  {
    bnName: 'বিডিনিউজ টোয়েন্টিফোর ডটকম',
    domains: ['bdnews24.com'],
    aliases: [
      'bdnews24',
      'bdnews24.com',
      'বিডিনিউজ',
      'বিডিনিউজ টোয়েন্টিফোর',
    ],
    home: 'https://bangla.bdnews24.com/',
  },
  {
    bnName: 'দৈনিক ইনকিলাব',
    domains: ['dailyinqilab.com'],
    aliases: ['daily inqilab', 'inqilab', 'ইনকিলাব', 'দৈনিক ইনকিলাব'],
    home: 'https://dailyinqilab.com/',
  },
  {
    bnName: 'নয়া দিগন্ত',
    domains: ['dailynayadiganta.com'],
    aliases: [
      'naya diganta',
      'nayadiganta',
      'daily naya diganta',
      'নয়া দিগন্ত',
      'নয়াদিগন্ত',
    ],
    home: 'https://www.dailynayadiganta.com/',
  },
  {
    bnName: 'দ্য ডেইলি স্টার',
    domains: ['thedailystar.net'],
    aliases: ['the daily star', 'daily star', 'দ্য ডেইলি স্টার'],
    home: 'https://bangla.thedailystar.net/',
  },
  {
    bnName: 'দ্য বিজনেস স্ট্যান্ডার্ড',
    domains: ['tbsnews.net'],
    aliases: [
      'the business standard',
      'tbs news',
      'tbsnews',
      'দ্য বিজনেস স্ট্যান্ডার্ড',
    ],
    home: 'https://www.tbsnews.net/bangla',
  },
  {
    bnName: 'ঢাকা ট্রিবিউন',
    domains: ['dhakatribune.com'],
    aliases: ['dhaka tribune', 'ঢাকা ট্রিবিউন'],
    home: 'https://www.dhakatribune.com/',
  },
  {
    bnName: 'ইউএনবি',
    domains: ['unb.com.bd'],
    aliases: ['unb', 'united news of bangladesh', 'ইউএনবি'],
    home: 'https://unb.com.bd/',
  },
];

// ================================================================
// BASIC HELPERS
// ================================================================

function clean(value = '') {
  return String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function lower(value = '') {
  return clean(value).toLowerCase();
}

function stripHtml(value = '') {
  if (!value) return '';
  const $ = cheerio.load(`<div>${value}</div>`);
  return clean($('div').text());
}

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function absoluteUrl(raw, base) {
  if (!raw) return '';

  const value = clean(raw);

  if (
    !value ||
    value.startsWith('data:') ||
    value.startsWith('javascript:')
  ) {
    return '';
  }

  try {
    const url = new URL(value, base);

    [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
    ].forEach((key) => url.searchParams.delete(key));

    url.hash = '';

    return url.toString();
  } catch {
    return '';
  }
}

// ================================================================
// PUBLISHER DETECTION
// ================================================================

function findPublisherByName(name = '') {
  const normalized = lower(name);

  if (!normalized) return null;

  return (
    PUBLISHERS.find((publisher) =>
      publisher.aliases.some((alias) => {
        const a = lower(alias);

        return (
          normalized === a ||
          normalized.includes(a) ||
          a.includes(normalized)
        );
      })
    ) || null
  );
}

function findPublisherByUrl(rawUrl = '') {
  try {
    const hostname = new URL(rawUrl)
      .hostname
      .replace(/^www\./, '')
      .toLowerCase();

    return (
      PUBLISHERS.find((publisher) =>
        publisher.domains.some(
          (domain) =>
            hostname === domain ||
            hostname.endsWith(`.${domain}`)
        )
      ) || null
    );
  } catch {
    return null;
  }
}

// ================================================================
// RSS TITLE CLEANING
// ================================================================

function cleanRssTitle(title, sourceName) {
  let finalTitle = clean(title);

  if (sourceName) {
    finalTitle = finalTitle.replace(
      new RegExp(
        `\\s[-–—|:]\\s*${escapeRegExp(sourceName)}\\s*$`,
        'iu'
      ),
      ''
    );
  }

  return clean(finalTitle);
}

// ================================================================
// EVENT HASH
// ================================================================

function normalizeTitleForHash(title) {
  return lower(title)
    .replace(/[“”‘’'"`]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createEventHash(title, sourceName) {
  return crypto
    .createHash('sha256')
    .update(
      `${lower(sourceName)}|${normalizeTitleForHash(title)}`
    )
    .digest('hex');
}

// ================================================================
// TITLE SIMILARITY
// ================================================================

function tokenize(value) {
  return lower(value)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

function titleSimilarity(first, second) {
  const a = new Set(tokenize(first));
  const b = new Set(tokenize(second));

  if (!a.size || !b.size) return 0;

  let common = 0;

  for (const token of a) {
    if (b.has(token)) common++;
  }

  return (
    common /
    Math.min(
      a.size,
      b.size
    )
  );
}

// ================================================================
// FETCH
// ================================================================

async function fetchWithTimeout(
  url,
  options = {}
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

  try {
    return await fetch(
      url,
      {
        ...options,

        redirect:
          'follow',

        headers: {
          ...HEADERS,
          ...(options.headers || {}),
        },

        signal:
          controller.signal,
      }
    );
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(
  url,
  options = {}
) {
  try {
    const response =
      await fetchWithTimeout(
        url,
        options
      );

    if (!response.ok) {
      return null;
    }

    return {
      text:
        await response.text(),

      finalUrl:
        response.url || url,

      status:
        response.status,
    };
  } catch (error) {
    console.log(
      `⚠️ Fetch failed: ${error.message}`
    );

    return null;
  }
}

// ================================================================
// GOOGLE NEWS FEEDS
// Agriculture is a dedicated feed and has higher processing priority.
// ================================================================

const GOOGLE_FEEDS = [
  {
    category:
      'কৃষি',

    priority:
      3,

    query:
      'বাংলাদেশ কৃষি কৃষক ফসল ধান চাল গম পাট সবজি ফল বীজ সার সেচ মৎস্য খামার পোলট্রি কৃষি মন্ত্রণালয় when:2d',
  },

  {
    category:
      'কৃষি',

    priority:
      3,

    query:
      'বাংলাদেশ কৃষি গবেষণা কৃষি প্রযুক্তি কৃষিপণ্য কৃষিবাজার when:2d',
  },

  {
    category:
      'বাংলাদেশ',

    priority:
      1,

    url:
      'https://news.google.com/rss?hl=bn&gl=BD&ceid=BD:bn',
  },

  {
    category:
      'বাংলাদেশ',

    priority:
      1,

    query:
      'বাংলাদেশ when:1d',
  },

  {
    category:
      'রাজনীতি',

    priority:
      1,

    query:
      'বাংলাদেশ রাজনীতি নির্বাচন সংসদ when:1d',
  },

  {
    category:
      'আন্তর্জাতিক',

    priority:
      1,

    query:
      'বিশ্ব আন্তর্জাতিক when:1d',
  },

  {
    category:
      'খেলাধুলা',

    priority:
      1,

    query:
      'ক্রিকেট ফুটবল খেলাধুলা when:1d',
  },

  {
    category:
      'বাণিজ্য',

    priority:
      1,

    query:
      'অর্থনীতি বাণিজ্য ব্যাংক শেয়ারবাজার when:1d',
  },

  {
    category:
      'আইন-আদালত',

    priority:
      1,

    query:
      'আদালত হাইকোর্ট সুপ্রিম কোর্ট মামলা when:1d',
  },

  {
    category:
      'প্রযুক্তি',

    priority:
      1,

    query:
      'প্রযুক্তি ইন্টারনেট কৃত্রিম বুদ্ধিমত্তা when:1d',
  },

  {
    category:
      'বিনোদন',

    priority:
      1,

    query:
      'বিনোদন চলচ্চিত্র নাটক when:1d',
  },

  {
    category:
      'শিক্ষা',

    priority:
      1,

    query:
      'শিক্ষা বিশ্ববিদ্যালয় পরীক্ষা when:1d',
  },
];

function feedUrl(feed) {
  return (
    feed.url ||
    `https://news.google.com/rss/search?q=${encodeURIComponent(
      feed.query
    )}&hl=bn&gl=BD&ceid=BD:bn`
  );
}

// ================================================================
// COLLECT GOOGLE NEWS ITEMS
// ================================================================

async function collectGoogleNewsItems() {
  const items = [];
  const seen = new Set();

  for (const feed of GOOGLE_FEEDS) {
    const fetched =
      await fetchText(
        feedUrl(feed),
        {
          headers: {
            Accept:
              'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
          },
        }
      );

    if (!fetched) {
      continue;
    }

    const $ =
      cheerio.load(
        fetched.text,
        {
          xmlMode:
            true,
        }
      );

    $('item').each(
      (_, element) => {
        if (
          items.length >=
          MAX_ITEMS_TO_INSPECT * 2
        ) {
          return;
        }

        const node =
          $(element);

        const sourceName =
          clean(
            node
              .find('source')
              .first()
              .text()
          );

        const publisher =
          findPublisherByName(
            sourceName
          );

        if (!publisher) {
          return;
        }

        const googleUrl =
          clean(
            node
              .find('link')
              .first()
              .text()
          );

        const title =
          cleanRssTitle(
            node
              .find('title')
              .first()
              .text(),
            sourceName
          );

        if (
          !googleUrl ||
          title.length < 10
        ) {
          return;
        }

        const key =
          `${publisher.bnName}|${lower(title)}`;

        if (seen.has(key)) {
          return;
        }

        seen.add(key);

        const date =
          new Date(
            clean(
              node
                .find('pubDate')
                .first()
                .text()
            )
          );

        items.push({
          title,
          googleUrl,
          publisher,
          categoryHint:
            feed.category,
          priority:
            Number(
              feed.priority || 1
            ),
          googlePubDate:
            Number.isNaN(
              date.getTime()
            )
              ? null
              : date,
        });
      }
    );

    await delay(180);
  }

  items.sort(
    (a, b) => {
      const priorityDiff =
        (b.priority || 1) -
        (a.priority || 1);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return (
        (b.googlePubDate?.getTime() || 0) -
        (a.googlePubDate?.getTime() || 0)
      );
    }
  );

  return items.slice(
    0,
    MAX_ITEMS_TO_INSPECT
  );
}

// ================================================================
// GOOGLE NEWS URL RESOLVER
// ================================================================

const googleDecodeCache =
  new Map();

function googleArticleId(
  rawUrl
) {
  try {
    const url =
      new URL(
        rawUrl
      );

    if (
      url.hostname !==
      'news.google.com'
    ) {
      return '';
    }

    const parts =
      url.pathname
        .split('/')
        .filter(Boolean);

    const idx =
      parts.findIndex(
        (part) =>
          part === 'articles' ||
          part === 'read'
      );

    if (
      idx >= 0 &&
      parts[idx + 1]
    ) {
      return parts[idx + 1];
    }

    return (
      parts[
        parts.length - 1
      ] || ''
    );
  } catch {
    return '';
  }
}

function tryOfflineGoogleDecode(
  id
) {
  try {
    const base64 =
      id
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    let buffer =
      Buffer.from(
        base64 +
          '='.repeat(
            (
              4 -
              (base64.length % 4)
            ) % 4
          ),
        'base64'
      );

    const prefix =
      Buffer.from(
        [
          0x08,
          0x13,
          0x22,
        ]
      );

    const suffix =
      Buffer.from(
        [
          0xd2,
          0x01,
          0x00,
        ]
      );

    if (
      buffer
        .subarray(0, 3)
        .equals(prefix)
    ) {
      buffer =
        buffer.subarray(3);
    }

    if (
      buffer.length >= 3 &&
      buffer
        .subarray(
          buffer.length - 3
        )
        .equals(suffix)
    ) {
      buffer =
        buffer.subarray(
          0,
          buffer.length - 3
        );
    }

    let pos = 0;
    let length = 0;
    let shift = 0;

    while (
      pos < buffer.length &&
      shift <= 28
    ) {
      const byte =
        buffer[pos++];

      length |=
        (byte & 0x7f) << shift;

      if (!(byte & 0x80)) {
        break;
      }

      shift += 7;
    }

    if (
      length <= 0 ||
      pos + length >
        buffer.length
    ) {
      return '';
    }

    const text =
      buffer
        .subarray(
          pos,
          pos + length
        )
        .toString('utf8');

    return /^https?:\/\//i.test(
      text
    )
      ? text
      : '';
  } catch {
    return '';
  }
}

function parseBatchExecuteResponse(
  text
) {
  const raw =
    String(text);

  const candidates =
    [];

  const cleaned =
    raw
      .replace(
        /^\)\]\}'\s*/,
        ''
      )
      .trim();

  if (cleaned) {
    candidates.push(
      cleaned
    );
  }

  for (
    const block
    of raw.split('\n\n')
  ) {
    const piece =
      block
        .replace(
          /^\)\]\}'\s*/,
          ''
        )
        .trim();

    if (piece) {
      candidates.push(
        piece
      );
    }
  }

  for (
    const line
    of raw.split('\n')
  ) {
    const piece =
      line
        .replace(
          /^\)\]\}'\s*/,
          ''
        )
        .trim();

    if (
      piece.startsWith('[')
    ) {
      candidates.push(
        piece
      );
    }
  }

  for (
    const candidate
    of candidates
  ) {
    const jsonStart =
      candidate.indexOf('[');

    if (jsonStart < 0) {
      continue;
    }

    try {
      const parsed =
        JSON.parse(
          candidate.slice(
            jsonStart
          )
        );

      if (
        Array.isArray(parsed) &&
        parsed[0] &&
        typeof parsed[0][2] ===
          'string'
      ) {
        const inner =
          JSON.parse(
            parsed[0][2]
          );

        if (
          Array.isArray(inner) &&
          typeof inner[1] ===
            'string'
        ) {
          return inner[1];
        }
      }

      if (
        Array.isArray(parsed) &&
        Array.isArray(
          parsed[0]
        ) &&
        parsed[0][0] &&
        typeof parsed[0][0][2] ===
          'string'
      ) {
        const inner =
          JSON.parse(
            parsed[0][0][2]
          );

        if (
          Array.isArray(inner) &&
          typeof inner[1] ===
            'string'
        ) {
          return inner[1];
        }
      }
    } catch {
      // try next candidate
    }
  }

  const rawMatch =
    raw.match(
      /\[\\"garturlres\\",\\"(https?:\\\/\\\/[^"]+)/i
    );

  if (rawMatch) {
    return rawMatch[1]
      .replace(/\\\//g, '/')
      .replace(
        /\\u003d/g,
        '='
      )
      .replace(
        /\\u0026/g,
        '&'
      );
  }

  return '';
}

async function decodeWithDataP(
  googleUrl
) {
  const fetched =
    await fetchText(
      googleUrl,
      {
        headers: {
          Referer:
            'https://news.google.com/',
        },
      }
    );

  if (!fetched) {
    return '';
  }

  const $ =
    cheerio.load(
      fetched.text
    );

  const dataP =
    $('c-wiz[data-p]')
      .first()
      .attr('data-p');

  if (!dataP) {
    return '';
  }

  let obj;

  try {
    obj =
      JSON.parse(
        dataP.replace(
          '%.@.',
          '["garturlreq",'
        )
      );
  } catch {
    return '';
  }

  if (
    !Array.isArray(obj) ||
    obj.length < 8
  ) {
    return '';
  }

  const shortened =
    obj
      .slice(0, -6)
      .concat(
        obj.slice(-2)
      );

  const rpc = [
    'Fbv4je',
    JSON.stringify(
      shortened
    ),
    null,
    'generic',
  ];

  const body =
    new URLSearchParams({
      'f.req':
        JSON.stringify([
          [rpc],
        ]),
    }).toString();

  const response =
    await fetchWithTimeout(
      'https://news.google.com/_/DotsSplashUi/data/batchexecute',
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded;charset=UTF-8',

          Referer:
            'https://news.google.com/',
        },

        body,
      }
    );

  if (!response.ok) {
    return '';
  }

  return parseBatchExecuteResponse(
    await response.text()
  );
}

async function decodeWithSignedParams(
  googleUrl,
  articleId
) {
  const pages = [
    googleUrl,

    `https://news.google.com/articles/${articleId}?hl=en-US&gl=US&ceid=US:en`,

    `https://news.google.com/rss/articles/${articleId}?hl=en-US&gl=US&ceid=US:en`,
  ];

  for (
    const pageUrl
    of pages
  ) {
    const fetched =
      await fetchText(
        pageUrl,
        {
          headers: {
            Referer:
              'https://news.google.com/',
          },
        }
      );

    if (!fetched) {
      continue;
    }

    const $ =
      cheerio.load(
        fetched.text
      );

    let node =
      $(
        `div[data-n-a-id="${articleId}"][data-n-a-sg][data-n-a-ts]`
      ).first();

    if (!node.length) {
      node =
        $(
          'c-wiz > div[data-n-a-sg][data-n-a-ts]'
        ).first();
    }

    if (!node.length) {
      continue;
    }

    const dataId =
      node.attr(
        'data-n-a-id'
      ) || articleId;

    const signature =
      node.attr(
        'data-n-a-sg'
      );

    const timestamp =
      node.attr(
        'data-n-a-ts'
      );

    if (
      !signature ||
      !timestamp
    ) {
      continue;
    }

    const req = [
      'garturlreq',

      [
        [
          'X',
          'X',
          ['X', 'X'],
          null,
          null,
          1,
          1,
          'US:en',
          null,
          1,
          null,
          null,
          null,
          null,
          null,
          0,
          1,
        ],

        'X',
        'X',
        1,
        [1, 1, 1],
        1,
        1,
        null,
        0,
        0,
        null,
        0,
      ],

      dataId,
      Number(timestamp),
      signature,
    ];

    const rpc = [
      'Fbv4je',
      JSON.stringify(req),
      null,
      'generic',
    ];

    const body =
      new URLSearchParams({
        'f.req':
          JSON.stringify([
            [rpc],
          ]),
      }).toString();

    const response =
      await fetchWithTimeout(
        'https://news.google.com/_/DotsSplashUi/data/batchexecute',
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded;charset=UTF-8',

            Referer:
              'https://news.google.com/',
          },

          body,
        }
      );

    if (!response.ok) {
      continue;
    }

    const decoded =
      parseBatchExecuteResponse(
        await response.text()
      );

    if (decoded) {
      return decoded;
    }
  }

  return '';
}

async function decodeWithLegacyBatch(
  articleId
) {
  const s =
    '[[["Fbv4je","[\\"garturlreq\\",[[\\"en-US\\",\\"US\\",[\\"FINANCE_TOP_INDICES\\",\\"WEB_TEST_1_0_0\\"],null,null,1,1,\\"US:en\\",null,180,null,null,null,null,null,0,null,null,[1608992183,723341000]],\\"en-US\\",\\"US\\",1,[2,3,4,8],1,0,\\"655000234\\",0,0,null,0],\\"' +
    articleId +
    '\\"]",null,"generic"]]]';

  const response =
    await fetchWithTimeout(
      'https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je',
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded;charset=utf-8',

          Referer:
            'https://news.google.com/',
        },

        body:
          `f.req=${encodeURIComponent(s)}`,
      }
    );

  if (!response.ok) {
    return '';
  }

  return parseBatchExecuteResponse(
    await response.text()
  );
}

// ================================================================
// ARTICLE URL VALIDATION
// ================================================================

function isLikelyArticleHref(
  url,
  publisher
) {
  if (
    !url ||
    !findPublisherByUrl(url)
  ) {
    return false;
  }

  const lowerUrl =
    url.toLowerCase();

  const bad = [
    '/tag/',
    '/tags/',
    '/topic/',
    '/topics/',
    '/category/',
    '/categories/',
    '/archive/',
    '/archives/',
    '/author/',
    '/authors/',
    '/photo/',
    '/photos/',
    '/video/',
    '/videos/',
    '/search',
    '/epaper',
    '/e-paper',
  ];

  if (
    bad.some(
      (part) =>
        lowerUrl.includes(part)
    )
  ) {
    return false;
  }

  return (
    findPublisherByUrl(url)?.bnName ===
    publisher.bnName
  );
}

// ================================================================
// PUBLISHER HOMEPAGE TITLE MATCH FALLBACK
// ================================================================

async function findPublisherUrlByTitle(
  item
) {
  const fetched =
    await fetchText(
      item.publisher.home
    );

  if (!fetched) {
    return '';
  }

  const $ =
    cheerio.load(
      fetched.text
    );

  let best = {
    url: '',
    score: 0,
  };

  $('a[href]').each(
    (_, el) => {
      const anchorText =
        clean(
          $(el).text()
        );

      if (
        anchorText.length < 8
      ) {
        return;
      }

      const url =
        absoluteUrl(
          $(el).attr('href'),
          fetched.finalUrl ||
            item.publisher.home
        );

      if (
        !isLikelyArticleHref(
          url,
          item.publisher
        )
      ) {
        return;
      }

      const score =
        titleSimilarity(
          anchorText,
          item.title
        );

      if (
        score >
        best.score
      ) {
        best = {
          url,
          score,
        };
      }
    }
  );

  return (
    best.score >= 0.58
      ? best.url
      : ''
  );
}

// ================================================================
// MASTER GOOGLE URL RESOLVER
// ================================================================

async function resolveGoogleUrl(
  item
) {
  const rawUrl =
    item.googleUrl;

  if (
    !rawUrl.includes(
      'news.google.com/'
    )
  ) {
    return rawUrl;
  }

  if (
    googleDecodeCache.has(
      rawUrl
    )
  ) {
    return googleDecodeCache.get(
      rawUrl
    );
  }

  const articleId =
    googleArticleId(
      rawUrl
    );

  if (!articleId) {
    return '';
  }

  const offline =
    tryOfflineGoogleDecode(
      articleId
    );

  if (
    offline &&
    findPublisherByUrl(
      offline
    )?.bnName ===
      item.publisher.bnName
  ) {
    googleDecodeCache.set(
      rawUrl,
      offline
    );

    console.log(
      `🔓 Google URL resolved → ${new URL(offline).hostname}`
    );

    return offline;
  }

  const methods = [
    async () =>
      decodeWithDataP(
        rawUrl
      ),

    async () =>
      decodeWithSignedParams(
        rawUrl,
        articleId
      ),

    async () =>
      decodeWithLegacyBatch(
        articleId
      ),

    async () =>
      findPublisherUrlByTitle(
        item
      ),
  ];

  for (
    const method
    of methods
  ) {
    try {
      const decoded =
        await method();

      if (
        decoded &&
        findPublisherByUrl(
          decoded
        )?.bnName ===
          item.publisher.bnName
      ) {
        googleDecodeCache.set(
          rawUrl,
          decoded
        );

        console.log(
          `🔓 Google URL resolved → ${new URL(decoded).hostname}`
        );

        return decoded;
      }
    } catch {
      // try next method
    }
  }

  console.log(
    `⚠️ Google URL resolve failed: ${item.publisher.bnName}`
  );

  return '';
}

// ================================================================
// ARTICLE METADATA
// ================================================================

function getMeta(
  $,
  names
) {
  for (
    const name
    of names
  ) {
    const selectors = [
      `meta[property="${name}"]`,
      `meta[name="${name}"]`,
      `meta[itemprop="${name}"]`,
    ];

    for (
      const selector
      of selectors
    ) {
      const value =
        $(selector)
          .first()
          .attr('content');

      if (
        value &&
        clean(value)
      ) {
        return clean(value);
      }
    }
  }

  return '';
}

// ================================================================
// JSON-LD
// ================================================================

function jsonLdNodes(
  $
) {
  const output = [];

  function walk(
    value
  ) {
    if (
      !value ||
      typeof value !== 'object'
    ) {
      return;
    }

    if (
      Array.isArray(value)
    ) {
      value.forEach(walk);
      return;
    }

    output.push(value);

    if (
      value['@graph']
    ) {
      walk(
        value['@graph']
      );
    }
  }

  $(
    'script[type="application/ld+json"]'
  ).each(
    (_, element) => {
      const raw =
        $(element)
          .contents()
          .text()
          .trim();

      if (!raw) {
        return;
      }

      try {
        walk(
          JSON.parse(raw)
        );
      } catch {
        // ignore invalid JSON-LD
      }
    }
  );

  return output;
}

function articleJsonLd(
  $
) {
  const types =
    new Set([
      'NewsArticle',
      'Article',
      'ReportageNewsArticle',
      'LiveBlogPosting',
    ]);

  return (
    jsonLdNodes($).find(
      (node) => {
        const type =
          node['@type'];

        return Array.isArray(type)
          ? type.some(
              (x) =>
                types.has(x)
            )
          : types.has(type);
      }
    ) || null
  );
}

function canonicalUrl(
  $,
  pageUrl
) {
  return (
    absoluteUrl(
      $(
        'link[rel="canonical"]'
      )
        .first()
        .attr('href'),
      pageUrl
    ) || pageUrl
  );
}

// ================================================================
// ARTICLE TITLE
// ================================================================

function articleTitle(
  $,
  json,
  rssTitle
) {
  const title =
    clean(
      json?.headline ||
        json?.name ||
        ''
    ) ||
    getMeta(
      $,
      ['og:title']
    ) ||
    getMeta(
      $,
      ['twitter:title']
    ) ||
    clean(
      $('article h1')
        .first()
        .text()
    ) ||
    clean(
      $('main h1')
        .first()
        .text()
    ) ||
    clean(
      $('h1')
        .first()
        .text()
    ) ||
    clean(rssTitle);

  return clean(
    title.replace(
      /\s+[|–—-]\s+[^|–—-]{2,45}$/u,
      ''
    )
  );
}

// ================================================================
// ARTICLE DESCRIPTION
// ================================================================

function articleDescription(
  $,
  json
) {
  const meta =
    clean(
      json?.description ||
        ''
    ) ||
    getMeta(
      $,
      ['og:description']
    ) ||
    getMeta(
      $,
      ['twitter:description']
    ) ||
    getMeta(
      $,
      ['description']
    );

  if (
    meta.length >= 35
  ) {
    return stripHtml(
      meta
    );
  }

  const paragraphs =
    [];

  const selectors = [
    'article p',
    '[class*="article"] p',
    '[class*="story"] p',
    '[class*="details"] p',
    'main p',
  ];

  for (
    const selector
    of selectors
  ) {
    $(selector).each(
      (_, element) => {
        const text =
          clean(
            $(element)
              .text()
          );

        if (
          text.length >= 45 &&
          text.length <= 700
        ) {
          paragraphs.push(
            text
          );
        }
      }
    );

    if (
      paragraphs.length
    ) {
      break;
    }
  }

  return clean(
    paragraphs
      .slice(0, 2)
      .join(' ')
  );
}

// ================================================================
// ARTICLE DATE
// ================================================================

function parseDate(
  value
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function publishedAt(
  $,
  json,
  rssDate
) {
  const values = [
    json?.datePublished,
    json?.dateCreated,

    getMeta(
      $,
      ['article:published_time']
    ),

    getMeta(
      $,
      ['datePublished']
    ),

    $(
      'time[datetime]'
    )
      .first()
      .attr('datetime'),
  ];

  for (
    const value
    of values
  ) {
    const date =
      parseDate(value);

    if (date) {
      return date;
    }
  }

  return rssDate || null;
}

// ================================================================
// LANDING / TOPIC PAGE FILTER
// ================================================================

const BLOCKED_PAGE_PATHS = [
  '/tag/',
  '/tags/',
  '/topic/',
  '/topics/',
  '/category/',
  '/categories/',
  '/archive/',
  '/archives/',
  '/author/',
  '/authors/',
  '/photo/',
  '/photos/',
  '/video/',
  '/videos/',
  '/search',
  '/epaper',
  '/e-paper',
];

const KNOWN_BAD_TOPIC_TITLES =
  new Set([
    'করোনাভাইরাস মহামারী',
    'মুজিব শতবর্ষ',
    'সমগ্র বাংলাদেশ',
    'বাজেট ২০২৬-২৭',
  ]);

function isLandingOrTopicPage(
  pageUrl,
  $,
  articleJson,
  pageTitle,
  googleNewsTitle
) {
  try {
    const pathname =
      new URL(pageUrl)
        .pathname
        .toLowerCase();

    if (
      BLOCKED_PAGE_PATHS.some(
        (part) =>
          pathname.includes(
            part
          )
      )
    ) {
      return true;
    }

    if (
      KNOWN_BAD_TOPIC_TITLES.has(
        clean(pageTitle)
      )
    ) {
      return true;
    }

    const hasArticleSignal =
      Boolean(articleJson) ||
      $('article').length > 0;

    const hasPublishedSignal =
      Boolean(
        articleJson?.datePublished ||
          getMeta(
            $,
            [
              'article:published_time',
              'datePublished',
            ]
          ) ||
          $(
            'time[datetime]'
          )
            .first()
            .attr('datetime')
      );

    if (
      !hasArticleSignal &&
      !hasPublishedSignal
    ) {
      return true;
    }

    return (
      titleSimilarity(
        pageTitle,
        googleNewsTitle
      ) < 0.34
    );
  } catch {
    return true;
  }
}

// ================================================================
// IMAGE SELECTION
// ================================================================

const BAD_IMAGE_WORDS = [
  'logo',
  'favicon',
  'brand',
  'branding',
  'avatar',
  'author',
  'profile',
  'placeholder',
  'default-image',
  'default_image',
  'no-image',
  'no_image',
  'sprite',
  'icon',
  'loading',
  'blank',
  'advertisement',
  '/ads/',
  'social-share',
  'share-icon',
];

function badImage(
  url
) {
  if (!url) {
    return true;
  }

  const value =
    url.toLowerCase();

  return (
    value.startsWith(
      'data:'
    ) ||
    /\.(svg|gif)(\?|$)/i.test(
      value
    ) ||
    BAD_IMAGE_WORDS.some(
      (word) =>
        value.includes(word)
    )
  );
}

function dimension(
  value
) {
  const number =
    parseInt(
      String(
        value || ''
      ).replace(
        /[^0-9]/g,
        ''
      ),
      10
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

function imageFromElement(
  $,
  element,
  base
) {
  const node =
    $(element);

  const values = [
    node.attr('data-src'),
    node.attr('data-lazy-src'),
    node.attr('data-original'),
    node.attr('data-image'),
    node.attr('src'),
  ];

  const srcset =
    node.attr('srcset') ||
    node.attr('data-srcset');

  if (srcset) {
    values.unshift(
      ...srcset
        .split(',')
        .map(
          (item) =>
            clean(item)
              .split(/\s+/)[0]
        )
        .filter(Boolean)
        .reverse()
    );
  }

  for (
    const raw
    of values
  ) {
    const url =
      absoluteUrl(
        raw,
        base
      );

    if (
      url &&
      !badImage(url)
    ) {
      return {
        url,

        alt:
          clean(
            node.attr('alt') ||
              node.attr('title') ||
              ''
          ),

        width:
          dimension(
            node.attr('width')
          ),

        height:
          dimension(
            node.attr('height')
          ),
      };
    }
  }

  return null;
}

// ================================================================
// JSON-LD IMAGES
// ================================================================

function addJsonImages(
  output,
  json,
  base
) {
  if (!json?.image) {
    return;
  }

  const images =
    Array.isArray(
      json.image
    )
      ? json.image
      : [json.image];

  for (
    const image
    of images
  ) {
    let raw = '';
    let width = 0;
    let height = 0;
    let alt = '';

    if (
      typeof image ===
      'string'
    ) {
      raw = image;
    } else if (
      image &&
      typeof image ===
        'object'
    ) {
      raw =
        image.url ||
        image.contentUrl ||
        '';

      width =
        dimension(
          image.width?.value ??
            image.width
        );

      height =
        dimension(
          image.height?.value ??
            image.height
        );

      alt =
        clean(
          image.caption ||
            image.name ||
            image.description ||
            ''
        );
    }

    const url =
      absoluteUrl(
        raw,
        base
      );

    if (url) {
      output.push({
        url,
        score: 112,
        width,
        height,
        alt,
        kind: 'jsonld',
      });
    }
  }
}

function titleOverlap(
  title,
  alt
) {
  const titleTokens =
    new Set(
      tokenize(title)
        .filter(
          (x) =>
            x.length >= 3
        )
    );

  return tokenize(alt)
    .filter(
      (x) =>
        x.length >= 3 &&
        titleTokens.has(x)
    )
    .length;
}

// ================================================================
// SMART IMAGE SELECTION
// ================================================================

function bestImage(
  $,
  json,
  base,
  title,
  publisher,
  imageUseCounts
) {
  const output = [];

  const strongSelectors = [
    'article figure img',
    'article picture img',
    '[class*="article"] figure img',
    '[class*="article"] picture img',
    '[class*="story"] figure img',
    '[class*="story"] picture img',
    '[class*="details"] figure img',
    'main figure img',
    'main picture img',
  ];

  for (
    const selector
    of strongSelectors
  ) {
    $(selector).each(
      (_, element) => {
        const image =
          imageFromElement(
            $,
            element,
            base
          );

        if (image) {
          output.push({
            ...image,
            score: 140,
            kind:
              'article-dom',
          });
        }
      }
    );
  }

  const bodySelectors = [
    'article img',
    '[class*="article"] img',
    '[class*="story"] img',
    'main img',
  ];

  for (
    const selector
    of bodySelectors
  ) {
    $(selector)
      .slice(0, 15)
      .each(
        (_, element) => {
          const node =
            $(element);

          if (
            node.closest(
              'header,nav,aside,footer'
            ).length
          ) {
            return;
          }

          const image =
            imageFromElement(
              $,
              element,
              base
            );

          if (image) {
            output.push({
              ...image,
              score: 105,
              kind:
                'body-dom',
            });
          }
        }
      );
  }

  addJsonImages(
    output,
    json,
    base
  );

  const ogWidth =
    dimension(
      getMeta(
        $,
        ['og:image:width']
      )
    );

  const ogHeight =
    dimension(
      getMeta(
        $,
        ['og:image:height']
      )
    );

  const ogAlt =
    getMeta(
      $,
      ['og:image:alt']
    );

  const metadataImages = [
    [
      getMeta(
        $,
        ['og:image:secure_url']
      ),
      100,
      ogWidth,
      ogHeight,
      ogAlt,
    ],

    [
      getMeta(
        $,
        ['og:image']
      ),
      98,
      ogWidth,
      ogHeight,
      ogAlt,
    ],

    [
      getMeta(
        $,
        ['twitter:image']
      ),
      92,
      0,
      0,
      getMeta(
        $,
        ['twitter:image:alt']
      ),
    ],

    [
      $(
        'link[rel="image_src"]'
      )
        .first()
        .attr('href'),
      88,
      0,
      0,
      '',
    ],
  ];

  for (
    const candidate
    of metadataImages
  ) {
    const url =
      absoluteUrl(
        candidate[0],
        base
      );

    if (url) {
      output.push({
        url,

        score:
          candidate[1],

        width:
          candidate[2],

        height:
          candidate[3],

        alt:
          candidate[4],

        kind:
          'meta',
      });
    }
  }

  const merged =
    new Map();

  for (
    const candidate
    of output
  ) {
    if (
      !candidate.url ||
      badImage(
        candidate.url
      )
    ) {
      continue;
    }

    if (
      !merged.has(
        candidate.url
      ) ||
      candidate.score >
        merged.get(
          candidate.url
        ).score
    ) {
      merged.set(
        candidate.url,
        candidate
      );
    }
  }

  const publisherText =
    lower(
      [
        publisher?.bnName,
        ...(
          publisher?.aliases ||
          []
        ),
      ].join(' ')
    );

  const scored =
    [...merged.values()]
      .map(
        (candidate) => {
          let score =
            candidate.score;

          const alt =
            lower(
              candidate.alt ||
                ''
            );

          const overlap =
            titleOverlap(
              title,
              candidate.alt ||
                ''
            );

          if (
            candidate.width >= 600 &&
            candidate.height >= 300
          ) {
            score += 25;
          }

          if (
            candidate.width &&
            candidate.height &&
            (
              candidate.width < 280 ||
              candidate.height < 150
            )
          ) {
            score -= 120;
          }

          score +=
            Math.min(
              overlap * 12,
              36
            );

          if (
            alt &&
            publisherText.includes(
              alt
            ) &&
            overlap === 0
          ) {
            score -= 110;
          }

          if (
            /\/static\/.*(logo|brand)/i.test(
              candidate.url
            )
          ) {
            score -= 150;
          }

          const used =
            imageUseCounts.get(
              candidate.url
            ) || 0;

          if (used >= 2) {
            score -= 160;
          } else if (
            used === 1
          ) {
            score -= 35;
          }

          return {
            ...candidate,
            finalScore:
              score,
          };
        }
      )
      .sort(
        (a, b) =>
          b.finalScore -
          a.finalScore
      );

  return (
    scored.find(
      (candidate) =>
        candidate.finalScore >=
        70
    )?.url || ''
  );
}

// ================================================================
// CATEGORY DETECTION
// ================================================================

const AGRICULTURE_WORDS = [
  'কৃষি',
  'কৃষক',
  'ফসল',
  'ধান',
  'চাল',
  'গম',
  'ভুট্টা',
  'পাট',
  'সবজি',
  'ফল',
  'বীজ',
  'সার',
  'সেচ',
  'মৎস্য',
  'মাছ চাষ',
  'পোলট্রি',
  'খামার',
  'কৃষিপণ্য',
  'কৃষিবাজার',
  'কৃষি গবেষণা',
  'কৃষি মন্ত্রণালয়',
];

const CATEGORY_RULES = [
  [
    'কৃষি',
    AGRICULTURE_WORDS,
  ],

  [
    'খেলাধুলা',
    [
      'ক্রিকেট',
      'ফুটবল',
      'ম্যাচ',
      'টেস্ট',
      'ওয়ানডে',
      'টি-টোয়েন্টি',
      'বিশ্বকাপ',
      'বিসিবি',
      'ফিফা',
    ],
  ],

  [
    'বাণিজ্য',
    [
      'ব্যাংক',
      'অর্থনীতি',
      'বাণিজ্য',
      'শেয়ারবাজার',
      'পুঁজিবাজার',
      'ডলার',
      'রপ্তানি',
      'আমদানি',
      'বাজেট',
      'ঋণ',
    ],
  ],

  [
    'রাজনীতি',
    [
      'বিএনপি',
      'আওয়ামী লীগ',
      'জামায়াত',
      'নির্বাচন',
      'ভোট',
      'রাজনীতি',
      'সংসদ',
      'প্রার্থী',
    ],
  ],

  [
    'আইন-আদালত',
    [
      'আদালত',
      'হাইকোর্ট',
      'সুপ্রিম কোর্ট',
      'আপিল বিভাগ',
      'মামলা',
      'জামিন',
      'রিমান্ড',
      'রায়',
      'ট্রাইব্যুনাল',
    ],
  ],

  [
    'প্রযুক্তি',
    [
      'প্রযুক্তি',
      'স্মার্টফোন',
      'ইন্টারনেট',
      'গুগল',
      'মাইক্রোসফট',
      'কৃত্রিম বুদ্ধিমত্তা',
      'এআই',
      'সাইবার',
    ],
  ],

  [
    'বিনোদন',
    [
      'সিনেমা',
      'অভিনেতা',
      'অভিনেত্রী',
      'নায়ক',
      'নায়িকা',
      'নাটক',
      'চলচ্চিত্র',
      'বলিউড',
      'হলিউড',
    ],
  ],

  [
    'শিক্ষা',
    [
      'বিশ্ববিদ্যালয়',
      'শিক্ষা',
      'স্কুল',
      'কলেজ',
      'শিক্ষার্থী',
      'পরীক্ষা',
      'ভর্তি',
      'শিক্ষক',
    ],
  ],

  [
    'চাকরি',
    [
      'চাকরি',
      'নিয়োগ',
      'ক্যারিয়ার',
      'বেতন',
      'পদসংখ্যা',
    ],
  ],

  [
    'ধর্ম',
    [
      'ইসলাম',
      'হজ',
      'ওমরাহ',
      'মসজিদ',
      'কোরআন',
      'রমজান',
      'পূজা',
      'মন্দির',
      'ধর্ম',
    ],
  ],

  [
    'জীবনযাপন',
    [
      'স্বাস্থ্য',
      'জীবনযাপন',
      'খাদ্য',
      'রেসিপি',
      'ফ্যাশন',
      'ভ্রমণ',
      'লাইফস্টাইল',
    ],
  ],

  [
    'আন্তর্জাতিক',
    [
      'যুক্তরাষ্ট্র',
      'ভারত',
      'চীন',
      'রাশিয়া',
      'ইউক্রেন',
      'গাজা',
      'ইসরায়েল',
      'পাকিস্তান',
      'জাতিসংঘ',
      'ট্রাম্প',
      'মোদি',
      'ইরান',
      'নেপাল',
      'মিয়ানমার',
    ],
  ],
];

// ================================================================
// STRICT AGRICULTURE CHECK
// ================================================================

function hasAgricultureSignal(
  title,
  description
) {
  const text =
    lower(
      `${title} ${description}`
    );

  return AGRICULTURE_WORDS.some(
    (word) =>
      text.includes(
        lower(word)
      )
  );
}

// ================================================================
// CATEGORY DETECTION
// ================================================================

function detectCategory(
  title,
  description,
  hint = 'বাংলাদেশ'
) {
  const text =
    lower(
      `${title} ${description}`
    );

  if (
    hint === 'কৃষি' &&
    hasAgricultureSignal(
      title,
      description
    )
  ) {
    return 'কৃষি';
  }

  let best =
    hint;

  let bestScore =
    0;

  for (
    const [
      category,
      words,
    ]
    of CATEGORY_RULES
  ) {
    const score =
      words.reduce(
        (
          sum,
          word
        ) =>
          sum +
          (
            text.includes(
              lower(word)
            )
              ? 1
              : 0
          ),
        0
      );

    if (
      score >
      bestScore
    ) {
      bestScore =
        score;

      best =
        category;
    }
  }

  return best;
}

// ================================================================
// CATEGORY LIMITS
// ================================================================

const CATEGORY_LIMITS = {
  বাংলাদেশ: 7,
  রাজনীতি: 4,
  আন্তর্জাতিক: 3,
  'আইন-আদালত': 3,
  বাণিজ্য: 3,
  খেলাধুলা: 3,
  কৃষি: 4,
  বিনোদন: 2,
  প্রযুক্তি: 2,
  শিক্ষা: 2,
  চাকরি: 1,
  ধর্ম: 1,
  জীবনযাপন: 1,
};

// ================================================================
// ARTICLE AGE
// ================================================================

function tooOld(
  date
) {
  if (!date) {
    return false;
  }

  const diff =
    Date.now() -
    date.getTime();

  return (
    diff >= 0 &&
    diff >
      MAX_ARTICLE_AGE_HOURS *
        3600000
  );
}

// ================================================================
// IMPORTANCE SCORE
// ================================================================

function importance(
  title,
  category
) {
  let score =
    [
      'বাংলাদেশ',
      'রাজনীতি',
      'আন্তর্জাতিক',
      'আইন-আদালত',
    ].includes(category)
      ? 7
      : 6;

  const words = [
    'প্রধানমন্ত্রী',
    'রাষ্ট্রপতি',
    'নির্বাচন',
    'হাইকোর্ট',
    'সুপ্রিম কোর্ট',
    'আগুন',
    'বিস্ফোরণ',
    'ভূমিকম্প',
    'বন্যা',
    'নিহত',
    'গ্রেপ্তার',
    'বাজেট',
  ];

  for (
    const word
    of words
  ) {
    if (
      lower(title).includes(
        lower(word)
      )
    ) {
      score++;
    }
  }

  return Math.min(
    10,
    score
  );
}

// ================================================================
// ARTICLE EXTRACTION
// ================================================================

async function extractArticle(
  item,
  imageUseCounts
) {
  const resolved =
    await resolveGoogleUrl(
      item
    );

  if (!resolved) {
    return null;
  }

  const publisher =
    findPublisherByUrl(
      resolved
    );

  if (
    !publisher ||
    publisher.bnName !==
      item.publisher.bnName
  ) {
    return null;
  }

  const fetched =
    await fetchText(
      resolved
    );

  if (!fetched) {
    return null;
  }

  const $ =
    cheerio.load(
      fetched.text
    );

  const pageUrl =
    canonicalUrl(
      $,
      fetched.finalUrl ||
        resolved
    );

  const finalPublisher =
    findPublisherByUrl(
      pageUrl
    ) || publisher;

  if (
    finalPublisher.bnName !==
    item.publisher.bnName
  ) {
    return null;
  }

  const json =
    articleJsonLd(
      $
    );

  const title =
    articleTitle(
      $,
      json,
      item.title
    );

  if (
    !title ||
    title.length < 10 ||
    title.length > 260
  ) {
    return null;
  }

  if (
    isLandingOrTopicPage(
      pageUrl,
      $,
      json,
      title,
      item.title
    )
  ) {
    console.log(
      `⏭️ Topic/landing page reject: ${title.substring(
        0,
        65
      )}...`
    );

    return null;
  }

  const description =
    articleDescription(
      $,
      json
    );

  const date =
    publishedAt(
      $,
      json,
      item.googlePubDate
    );

  if (
    date &&
    tooOld(date)
  ) {
    return null;
  }

  // Agriculture feed is strict:
  // no agriculture signal = reject
  // instead of mislabelling.

  if (
    item.categoryHint ===
      'কৃষি' &&
    !hasAgricultureSignal(
      title,
      description
    )
  ) {
    console.log(
      `🌾 কৃষি নয়, স্কিপ: ${title.substring(
        0,
        65
      )}...`
    );

    return null;
  }

  const image =
    bestImage(
      $,
      json,
      pageUrl,
      title,
      finalPublisher,
      imageUseCounts
    );

  if (
    REQUIRE_IMAGE &&
    !image
  ) {
    console.log(
      `🖼️ Story image পাওয়া যায়নি: ${title.substring(
        0,
        60
      )}...`
    );

    return null;
  }

  const category =
    detectCategory(
      title,
      description,
      item.categoryHint
    );

  const importanceScore =
    importance(
      title,
      category
    );

  const snippetBase =
    description ||
    `${finalPublisher.bnName}-এ প্রকাশিত সংবাদ।`;

  return {
    title,

    content:
      description ||
      `${finalPublisher.bnName}-এ প্রকাশিত সংবাদটির বিস্তারিত জানতে শিরোনামে ক্লিক করুন।`,

    snippet:
      snippetBase.length > 220
        ? `${snippetBase.substring(
            0,
            220
          )}…`
        : snippetBase,

    image_url:
      image || null,

    source_url:
      pageUrl,

    source_name:
      finalPublisher.bnName,

    category,

    image_source:
      finalPublisher.bnName,

    is_published:
      true,

    is_custom:
      false,

    is_lead:
      importanceScore >= 9,

    importance_score:
      importanceScore,

    editorial_score:
      Math.min(
        100,
        68 +
          importanceScore * 3
      ),

    breaking_news:
      false,

    event_hash:
      createEventHash(
        title,
        finalPublisher.bnName
      ),

    event_type:
      category,

    created_at:
      (
        date ||
        new Date()
      ).toISOString(),
  };
}

// ================================================================
// DUPLICATE CHECK
// ================================================================

async function exists(
  article
) {
  const {
    count:
      urlCount,
  } =
    await supabase
      .from('news')
      .select(
        '*',
        {
          count:
            'exact',
          head:
            true,
        }
      )
      .eq(
        'source_url',
        article.source_url
      );

  if (
    (urlCount || 0) > 0
  ) {
    return true;
  }

  const {
    count:
      hashCount,
  } =
    await supabase
      .from('news')
      .select(
        '*',
        {
          count:
            'exact',
          head:
            true,
        }
      )
      .eq(
        'event_hash',
        article.event_hash
      );

  return (
    (hashCount || 0) > 0
  );
}

// ================================================================
// OLD BAD TOPIC CARDS CLEANUP
// ================================================================

async function hideKnownBadLegacyCards() {
  const badTitles = [
    'করোনাভাইরাস মহামারী',
    'মুজিব শতবর্ষ',
    'সমগ্র বাংলাদেশ',
    'বাজেট ২০২৬-২৭',
  ];

  try {
    const {
      data,
      error,
    } =
      await supabase
        .from('news')
        .select(
          'id,title'
        )
        .eq(
          'is_custom',
          false
        )
        .eq(
          'is_published',
          true
        )
        .in(
          'title',
          badTitles
        );

    if (
      error ||
      !data?.length
    ) {
      return;
    }

    const ids =
      data.map(
        (row) => row.id
      );

    const {
      error:
        updateError,
    } =
      await supabase
        .from('news')
        .update({
          is_published:
            false,
        })
        .in(
          'id',
          ids
        );

    if (!updateError) {
      console.log(
        `🧹 ${ids.length}টি পুরোনো ভুল topic card hide করা হয়েছে।`
      );
    }
  } catch (error) {
    console.log(
      `⚠️ Cleanup skipped: ${error.message}`
    );
  }
}

// ================================================================
// MAIN
// ================================================================

async function runBot() {
  console.log(
    '🚀 বঙ্গীয় টাইমস Google News Discovery Aggregator শুরু...'
  );

  console.log(
    '🔎 Discovery = Google News RSS'
  );

  console.log(
    '🌾 Agriculture fallback = ON (dedicated Google News feeds)'
  );

  console.log(
    '🖼️ Image = Original publisher article'
  );

  console.log(
    '✍️ Gemini rewrite = OFF'
  );

  await hideKnownBadLegacyCards();

  const items =
    await collectGoogleNewsItems();

  console.log(
    `\n📰 অনুমোদিত Google News candidate: ${items.length}`
  );

  const imageUseCounts =
    new Map();

  const categoryCounts =
    {};

  let published = 0;
  let inspected = 0;

  for (
    const item
    of items
  ) {
    if (
      published >=
        MAX_ARTICLES_PER_RUN ||
      inspected >=
        MAX_ITEMS_TO_INSPECT
    ) {
      break;
    }

    inspected++;

    try {
      console.log(
        `\n➡️ ${item.publisher.bnName}: ${item.title.substring(
          0,
          72
        )}...`
      );

      const article =
        await extractArticle(
          item,
          imageUseCounts
        );

      if (!article) {
        continue;
      }

      const limit =
        CATEGORY_LIMITS[
          article.category
        ] || 2;

      categoryCounts[
        article.category
      ] =
        categoryCounts[
          article.category
        ] || 0;

      if (
        categoryCounts[
          article.category
        ] >= limit
      ) {
        continue;
      }

      if (
        await exists(
          article
        )
      ) {
        console.log(
          '⏭️ ডুপ্লিকেট, স্কিপ।'
        );

        continue;
      }

      const {
        error,
      } =
        await supabase
          .from('news')
          .insert([
            article,
          ]);

      if (error) {
        console.error(
          `❌ Supabase insert error: ${error.message}`
        );

        continue;
      }

      if (
        article.image_url
      ) {
        imageUseCounts.set(
          article.image_url,
          (
            imageUseCounts.get(
              article.image_url
            ) || 0
          ) + 1
        );
      }

      categoryCounts[
        article.category
      ]++;

      published++;

      console.log(
        `✅ পাবলিশ: [${article.category}] ${article.title.substring(
          0,
          60
        )}... | ${article.source_name}`
      );

      await delay(420);
    } catch (error) {
      console.log(
        `⚠️ Candidate failed: ${error.message}`
      );
    }
  }

  console.log(
    `\n🎉 কাজ শেষ। মোট নতুন সংবাদ: ${published}`
  );

  console.log(
    `🌾 কৃষি প্রকাশ: ${categoryCounts['কৃষি'] || 0}`
  );

  if (!published) {
    console.log(
      'ℹ️ ০ হলে সম্ভাব্য কারণ: সব খবর duplicate, publisher page block করেছে, Google URL resolve হয়নি, বা usable lead image পাওয়া যায়নি।'
    );
  }
}

// ================================================================
// START
// ================================================================

runBot().catch(
  (error) => {
    console.error(
      '❌ Fatal scraper error:',
      error
    );

    process.exit(1);
  }
);
