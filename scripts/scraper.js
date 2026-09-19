const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// ================================================================
// Bongiyo Times - Direct Source News Aggregator
// ------------------------------------------------
// 1. সরাসরি সংশ্লিষ্ট সংবাদমাধ্যম থেকে খবর সংগ্রহ করবে
// 2. Original headline নেবে
// 3. Original article image নেবে
// 4. Short description/snippet নেবে
// 5. Publisher-এর বাংলা নাম save করবে
// 6. Original article URL save করবে
// 7. Gemini দিয়ে rewrite করবে না
// 8. AI image generate করবে না
// 9. Google News শুধু hidden backup discovery হিসেবে ব্যবহার হবে
//    Google News-এর কোনো item সরাসরি database-এ publish হবে না
// ================================================================


// ================================================================
// 1. SUPABASE CONFIGURATION
// ================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase environment variables are missing.');
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ================================================================
// 2. SCRAPER CONFIGURATION
// ================================================================

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/153.0.0.0 Safari/537.36';

const REQUEST_HEADERS = {
  'User-Agent': USER_AGENT,

  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,' +
    'image/avif,image/webp,*/*;q=0.8',

  'Accept-Language':
    'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7',

  'Cache-Control': 'no-cache',

  Pragma: 'no-cache'
};


// প্রতি GitHub Action run-এ সর্বোচ্চ কতটি news publish হবে
const MAX_ARTICLES_PER_RUN =
  Number(process.env.MAX_ARTICLES_PER_RUN || 24);


// একটি source থেকে সর্বোচ্চ কতটি
const MAX_ARTICLES_PER_SOURCE =
  Number(process.env.MAX_ARTICLES_PER_SOURCE || 4);


// প্রতিটি newspaper page থেকে সর্বোচ্চ কতটি candidate link দেখা হবে
const MAX_CANDIDATE_LINKS_PER_SOURCE =
  Number(
    process.env.MAX_CANDIDATE_LINKS_PER_SOURCE || 30
  );


// খুব পুরোনো news publish না করার জন্য
const MAX_ARTICLE_AGE_HOURS =
  Number(
    process.env.MAX_ARTICLE_AGE_HOURS || 72
  );


// Request timeout
const REQUEST_TIMEOUT_MS =
  Number(
    process.env.REQUEST_TIMEOUT_MS || 18000
  );


// Image না থাকলে defaultভাবে article publish হবে না
// এর ফলে homepage-এ blank placeholder কমবে
const REQUIRE_IMAGE =
  String(
    process.env.REQUIRE_NEWS_IMAGE || 'true'
  ).toLowerCase() !== 'false';


// Google News public source নয়
// শুধু direct source link কম পেলে discovery backup
const ENABLE_GOOGLE_NEWS_BACKUP =
  String(
    process.env.ENABLE_GOOGLE_NEWS_BACKUP || 'true'
  ).toLowerCase() !== 'false';


const delay = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));


// ================================================================
// 3. NATIONAL NEWS SOURCES
// ================================================================

const SOURCES = [

  {
    name: 'Prothom Alo',
    bnName: 'প্রথম আলো',
    url: 'https://www.prothomalo.com/',
    domain: 'prothomalo.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'Kaler Kantho',
    bnName: 'কালের কণ্ঠ',
    url: 'https://www.kalerkantho.com/',
    domain: 'kalerkantho.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'Jugantor',
    bnName: 'যুগান্তর',
    url: 'https://www.jugantor.com/',
    domain: 'jugantor.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'Ittefaq',
    bnName: 'দৈনিক ইত্তেফাক',
    url: 'https://www.ittefaq.com.bd/',
    domain: 'ittefaq.com.bd',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'Samakal',
    bnName: 'সমকাল',
    url: 'https://samakal.com/',
    domain: 'samakal.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'Bangladesh Pratidin',
    bnName: 'বাংলাদেশ প্রতিদিন',
    url: 'https://www.bd-pratidin.com/',
    domain: 'bd-pratidin.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'Dhaka Post',
    bnName: 'ঢাকা পোস্ট',
    url: 'https://www.dhakapost.com/',
    domain: 'dhakapost.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'Jago News 24',
    bnName: 'জাগো নিউজ২৪',
    url: 'https://www.jagonews24.com/',
    domain: 'jagonews24.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'Bangla Tribune',
    bnName: 'বাংলা ট্রিবিউন',
    url: 'https://www.banglatribune.com/',
    domain: 'banglatribune.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'BanglaNews24',
    bnName: 'বাংলানিউজ২৪ ডটকম',
    url: 'https://www.banglanews24.com/',
    domain: 'banglanews24.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'BDNews24',
    bnName: 'বিডিনিউজ টোয়েন্টিফোর ডটকম',
    url: 'https://bangla.bdnews24.com/',
    domain: 'bdnews24.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'Daily Inqilab',
    bnName: 'দৈনিক ইনকিলাব',
    url: 'https://dailyinqilab.com/',
    domain: 'dailyinqilab.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'Naya Diganta',
    bnName: 'নয়া দিগন্ত',
    url: 'https://www.dailynayadiganta.com/',
    domain: 'dailynayadiganta.com',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'The Daily Star Bangla',
    bnName: 'দ্য ডেইলি স্টার বাংলা',
    url: 'https://bangla.thedailystar.net/',
    domain: 'thedailystar.net',
    defaultCategory: 'বাংলাদেশ'
  },

  {
    name: 'TBS Bangla',
    bnName: 'দ্য বিজনেস স্ট্যান্ডার্ড বাংলা',
    url: 'https://www.tbsnews.net/bangla',
    domain: 'tbsnews.net',
    defaultCategory: 'বাণিজ্য'
  }

];


// ================================================================
// 4. TEXT CLEANER
// ================================================================

function cleanText(value = '') {

  return String(value)

    .replace(/\u00a0/g, ' ')

    .replace(/[\t\r\n]+/g, ' ')

    .replace(/\s{2,}/g, ' ')

    .trim();

}


function stripHtml(value = '') {

  if (!value) return '';

  const $ =
    cheerio.load(
      `<div>${value}</div>`
    );

  return cleanText(
    $('div').text()
  );

}


// ================================================================
// 5. URL CLEANING
// ================================================================

function removeTrackingParams(rawUrl) {

  try {

    const u =
      new URL(rawUrl);

    const badParams = [

      'utm_source',

      'utm_medium',

      'utm_campaign',

      'utm_term',

      'utm_content',

      'fbclid',

      'gclid',

      'mc_cid',

      'mc_eid'

    ];

    badParams.forEach(
      p => u.searchParams.delete(p)
    );

    u.hash = '';

    return u.toString();

  } catch {

    return rawUrl;

  }

}


function absoluteUrl(
  raw,
  baseUrl
) {

  if (!raw)
    return '';

  const value =
    cleanText(raw);

  if (!value)
    return '';

  if (
    value.startsWith('data:') ||
    value.startsWith('javascript:')
  ) {

    return '';

  }

  try {

    return removeTrackingParams(

      new URL(
        value,
        baseUrl
      ).toString()

    );

  } catch {

    return '';

  }

}


// ================================================================
// 6. DOMAIN CHECK
// ================================================================

function hostMatches(
  url,
  expectedDomain
) {

  try {

    const host =
      new URL(url)
        .hostname
        .replace(/^www\./, '')
        .toLowerCase();

    const expected =
      expectedDomain
        .replace(/^www\./, '')
        .toLowerCase();

    return (
      host === expected ||
      host.endsWith(
        `.${expected}`
      )
    );

  } catch {

    return false;

  }

}


// ================================================================
// 7. EVENT HASH
// ================================================================

function normalizeTitleForHash(
  title
) {

  return cleanText(title)

    .toLowerCase()

    .replace(
      /[“”‘’'"`]/g,
      ''
    )

    .replace(
      /[^\p{L}\p{N}\s]/gu,
      ' '
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();

}


function createEventHash(
  title
) {

  const normalized =
    normalizeTitleForHash(title);

  return crypto

    .createHash('sha256')

    .update(normalized)

    .digest('hex');

}


// ================================================================
// 8. FETCH WITH TIMEOUT
// ================================================================

async function fetchWithTimeout(
  url,
  options = {}
) {

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

  try {

    return await fetch(
      url,
      {

        ...options,

        headers: {

          ...REQUEST_HEADERS,

          ...(options.headers || {})

        },

        signal:
          controller.signal,

        redirect:
          'follow'

      }
    );

  } finally {

    clearTimeout(timeout);

  }

}


// ================================================================
// 9. FETCH HTML
// ================================================================

async function fetchHtml(
  url
) {

  try {

    const response =
      await fetchWithTimeout(url);

    if (!response.ok) {

      console.log(
        `⚠️ HTTP ${response.status}: ${url}`
      );

      return null;

    }

    const type =
      response.headers.get(
        'content-type'
      ) || '';

    if (

      !type.includes(
        'text/html'
      ) &&

      !type.includes(
        'application/xhtml+xml'
      )

    ) {

      return null;

    }

    return {

      html:
        await response.text(),

      finalUrl:
        removeTrackingParams(
          response.url || url
        )

    };

  } catch (error) {

    console.log(
      `⚠️ Fetch failed: ${url} | ${error.message}`
    );

    return null;

  }

}


// ================================================================
// 10. ARTICLE LINK FILTER
// ================================================================

function isLikelyArticleUrl(
  url,
  source
) {

  if (
    !url ||
    !hostMatches(
      url,
      source.domain
    )
  ) {

    return false;

  }

  const lower =
    url.toLowerCase();

  const blockedSegments = [

    '/tag/',

    '/tags/',

    '/author/',

    '/authors/',

    '/category/',

    '/categories/',

    '/topic/',

    '/topics/',

    '/archive/',

    '/archives/',

    '/search',

    '/login',

    '/signup',

    '/privacy',

    '/terms',

    '/contact',

    '/about',

    '/photo/',

    '/photos/',

    '/video/',

    '/videos/',

    '/live/',

    '/epaper',

    '/e-paper',

    '/pdf/'

  ];

  if (
    blockedSegments.some(
      segment =>
        lower.includes(segment)
    )
  ) {

    return false;

  }


  try {

    const u =
      new URL(url);

    const parts =
      u.pathname
        .split('/')
        .filter(Boolean);

    if (
      parts.length < 1
    ) {

      return false;

    }

    if (
      u.pathname === '/' ||
      u.pathname.length < 8
    ) {

      return false;

    }

  } catch {

    return false;

  }


  // Most news URLs contain either numeric ID/date
  // or a fairly long slug/path

  return (

    /\d/.test(lower) ||

    lower.length >= 55

  );

}


// ================================================================
// 11. COLLECT DIRECT ARTICLE LINKS
// ================================================================

function collectDirectLinks(
  html,
  pageUrl,
  source
) {

  const $ =
    cheerio.load(html);

  const seen =
    new Set();

  const links =
    [];

  $('a[href]').each(
    (_, el) => {

      const href =
        $(el).attr('href');

      const url =
        absoluteUrl(
          href,
          pageUrl
        );

      if (!url)
        return;

      if (
        !isLikelyArticleUrl(
          url,
          source
        )
      ) {

        return;

      }

      if (
        seen.has(url)
      ) {

        return;

      }

      seen.add(url);

      links.push(url);

    }
  );

  return links.slice(
    0,
    MAX_CANDIDATE_LINKS_PER_SOURCE
  );

}


// ================================================================
// 12. GOOGLE NEWS
//     INTERNAL DISCOVERY BACKUP ONLY
// ================================================================

async function discoverFromGoogleNews(
  source
) {

  if (
    !ENABLE_GOOGLE_NEWS_BACKUP
  ) {

    return [];

  }

  const query =
    encodeURIComponent(
      `site:${source.domain}`
    );

  const rssUrl =
    `https://news.google.com/rss/search?q=${query}` +
    `&hl=bn&gl=BD&ceid=BD:bn`;

  try {

    const response =
      await fetchWithTimeout(
        rssUrl,
        {

          headers: {

            Accept:
              'application/rss+xml,' +
              'application/xml,' +
              'text/xml;q=0.9,*/*;q=0.8'

          }

        }
      );

    if (!response.ok)
      return [];

    const xml =
      await response.text();

    const $ =
      cheerio.load(
        xml,
        {
          xmlMode: true
        }
      );

    const googleLinks =
      [];

    $('item').each(
      (_, item) => {

        if (
          googleLinks.length >= 10
        ) {

          return;

        }

        const link =
          cleanText(
            $(item)
              .find('link')
              .first()
              .text()
          );

        if (link) {

          googleLinks.push(link);

        }

      }
    );


    const resolved =
      [];


    for (
      const googleUrl
      of googleLinks
    ) {

      try {

        const response2 =
          await fetchWithTimeout(
            googleUrl,
            {

              headers: {

                Accept:
                  'text/html,*/*'

              }

            }
          );


        const finalUrl =
          removeTrackingParams(
            response2.url || ''
          );


        if (
          finalUrl &&

          hostMatches(
            finalUrl,
            source.domain
          )
        ) {

          if (

            !resolved.includes(
              finalUrl
            ) &&

            isLikelyArticleUrl(
              finalUrl,
              source
            )

          ) {

            resolved.push(
              finalUrl
            );

          }

        }

      } catch {

        // Backup discovery only.
        // Ignore failures.

      }


      if (
        resolved.length >= 6
      ) {

        break;

      }


      await delay(250);

    }


    return resolved;

  } catch {

    return [];

  }

}


// ================================================================
// 13. META TAG HELPER
// ================================================================

function getMeta(
  $,
  keys
) {

  for (
    const key
    of keys
  ) {

    const selectors = [

      `meta[property="${key}"]`,

      `meta[name="${key}"]`,

      `meta[itemprop="${key}"]`

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
        cleanText(value)
      ) {

        return cleanText(
          value
        );

      }

    }

  }

  return '';

}


// ================================================================
// 14. JSON-LD PARSER
// ================================================================

function getJsonLdObjects(
  $
) {

  const objects =
    [];


  $(
    'script[type="application/ld+json"]'
  ).each(
    (_, el) => {

      const raw =
        $(el)
          .contents()
          .text()
          .trim();

      if (!raw)
        return;


      try {

        const parsed =
          JSON.parse(raw);

        if (
          Array.isArray(parsed)
        ) {

          objects.push(
            ...parsed
          );

        } else {

          objects.push(
            parsed
          );

        }

      } catch {

        // malformed JSON-LD ignored

      }

    }
  );


  const flattened =
    [];


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

    flattened.push(value);

    if (
      value['@graph']
    ) {

      walk(
        value['@graph']
      );

    }

  }


  objects.forEach(walk);


  return flattened;

}


// ================================================================
// 15. FIND JSON-LD ARTICLE OBJECT
// ================================================================

function pickJsonLdArticle(
  $
) {

  const all =
    getJsonLdObjects($);


  const wantedTypes =
    new Set([

      'NewsArticle',

      'Article',

      'ReportageNewsArticle',

      'LiveBlogPosting'

    ]);


  return (

    all.find(
      obj => {

        const type =
          obj['@type'];


        if (
          Array.isArray(type)
        ) {

          return type.some(
            t =>
              wantedTypes.has(t)
          );

        }


        return wantedTypes.has(
          type
        );

      }
    ) || null

  );

}


// ================================================================
// 16. JSON-LD IMAGE
// ================================================================

function extractJsonLdImage(
  article,
  baseUrl
) {

  if (
    !article ||
    !article.image
  ) {

    return '';

  }


  const image =
    article.image;


  let raw =
    '';


  if (
    typeof image === 'string'
  ) {

    raw =
      image;

  }


  else if (
    Array.isArray(image)
  ) {

    const first =
      image[0];


    if (
      typeof first === 'string'
    ) {

      raw =
        first;

    }


    else if (
      first &&
      typeof first === 'object'
    ) {

      raw =
        first.url ||
        first.contentUrl ||
        '';

    }

  }


  else if (
    typeof image === 'object'
  ) {

    raw =
      image.url ||
      image.contentUrl ||
      '';

  }


  return absoluteUrl(
    raw,
    baseUrl
  );

}


// ================================================================
// 17. INVALID IMAGE FILTER
// ================================================================

function isBadImageUrl(
  url
) {

  if (!url)
    return true;


  const lower =
    url.toLowerCase();


  if (
    lower.startsWith(
      'data:'
    )
  ) {

    return true;

  }


  if (
    lower.endsWith(
      '.svg'
    )
  ) {

    return true;

  }


  const badWords = [

    'logo',

    'favicon',

    'avatar',

    'author',

    'profile',

    'placeholder',

    'default',

    'sprite',

    'icon',

    'loading',

    'blank',

    'ads',

    'advertisement',

    'banner'

  ];


  return badWords.some(
    word =>
      lower.includes(word)
  );

}


// ================================================================
// 18. EXTRACT IMAGE FROM IMG ELEMENT
// ================================================================

function imageFromElement(
  $,
  el,
  baseUrl
) {

  const candidates = [

    $(el).attr(
      'data-src'
    ),

    $(el).attr(
      'data-lazy-src'
    ),

    $(el).attr(
      'data-original'
    ),

    $(el).attr(
      'data-image'
    ),

    $(el).attr(
      'src'
    )

  ];


  const srcset =

    $(el).attr(
      'srcset'
    ) ||

    $(el).attr(
      'data-srcset'
    );


  if (srcset) {

    const parts =
      srcset

        .split(',')

        .map(
          part =>
            cleanText(part)
              .split(' ')[0]
        )

        .filter(Boolean);


    if (
      parts.length
    ) {

      candidates.unshift(
        parts[
          parts.length - 1
        ]
      );

    }

  }


  for (
    const candidate
    of candidates
  ) {

    const url =
      absoluteUrl(
        candidate,
        baseUrl
      );


    if (
      url &&
      !isBadImageUrl(url)
    ) {

      return url;

    }

  }


  return '';

}


// ================================================================
// 19. EXTRACT MAIN ARTICLE IMAGE
// ================================================================

function extractImage(
  $,
  article,
  baseUrl
) {

  // ------------------------------------
  // Priority 1:
  // JSON-LD article image
  // ------------------------------------

  const jsonLdImage =
    extractJsonLdImage(
      article,
      baseUrl
    );


  if (
    jsonLdImage &&
    !isBadImageUrl(
      jsonLdImage
    )
  ) {

    return jsonLdImage;

  }


  // ------------------------------------
  // Priority 2:
  // OpenGraph / Twitter
  // ------------------------------------

  const metaCandidates = [

    getMeta(
      $,
      ['og:image:secure_url']
    ),

    getMeta(
      $,
      ['og:image']
    ),

    getMeta(
      $,
      ['twitter:image']
    ),

    getMeta(
      $,
      ['twitter:image:src']
    )

  ];


  for (
    const candidate
    of metaCandidates
  ) {

    const url =
      absoluteUrl(
        candidate,
        baseUrl
      );


    if (
      url &&
      !isBadImageUrl(url)
    ) {

      return url;

    }

  }


  // ------------------------------------
  // Priority 3:
  // Actual article images
  // ------------------------------------

  const selectors = [

    'article figure img',

    'article img',

    'main figure img',

    'main img',

    '.article-body figure img',

    '.article-body img',

    '.news-content figure img',

    '.news-content img',

    '.story-content img',

    '.details-content img',

    '.post-content img'

  ];


  for (
    const selector
    of selectors
  ) {

    const elements =
      $(selector)
        .toArray();


    for (
      const el
      of elements
    ) {

      const url =
        imageFromElement(
          $,
          el,
          baseUrl
        );


      if (url) {

        return url;

      }

    }

  }


  return '';

}


// ================================================================
// 20. EXTRACT TITLE
// ================================================================

function extractTitle(
  $,
  article
) {

  const jsonTitle =

    article &&
    (
      article.headline ||
      article.name
    )

      ?

      cleanText(
        article.headline ||
        article.name
      )

      :

      '';


  const title =

    jsonTitle ||

    getMeta(
      $,
      ['og:title']
    ) ||

    getMeta(
      $,
      ['twitter:title']
    ) ||

    cleanText(
      $('article h1')
        .first()
        .text()
    ) ||

    cleanText(
      $('main h1')
        .first()
        .text()
    ) ||

    cleanText(
      $('h1')
        .first()
        .text()
    ) ||

    cleanText(
      $('title')
        .first()
        .text()
    );


  // common:
  // Headline | Prothom Alo
  // Headline - Newspaper name
  // suffix remove

  return cleanText(

    title.replace(

      /\s+[|–—-]\s+[^|–—-]{2,40}$/u,

      ''

    )

  );

}


// ================================================================
// 21. EXTRACT DESCRIPTION
// ================================================================

function extractDescription(
  $,
  article
) {

  const jsonDescription =

    article &&
    article.description

      ?

      stripHtml(
        article.description
      )

      :

      '';


  const metaDescription =

    jsonDescription ||

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
    metaDescription &&
    metaDescription.length >= 40
  ) {

    return cleanText(
      metaDescription
    );

  }


  const selectors = [

    'article p',

    'main article p',

    '.article-body p',

    '.news-content p',

    '.story-content p',

    '.details-content p',

    '.post-content p',

    'main p'

  ];


  const paragraphs =
    [];


  for (
    const selector
    of selectors
  ) {

    $(selector).each(
      (_, el) => {

        const text =
          cleanText(
            $(el).text()
          );


        if (

          text.length >= 45 &&

          text.length <= 500

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


  return cleanText(

    paragraphs

      .slice(
        0,
        2
      )

      .join(' ')

  );

}


// ================================================================
// 22. PUBLISHED DATE
// ================================================================

function parseDateValue(
  value
) {

  if (!value)
    return null;


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date;

}


function extractPublishedAt(
  $,
  article
) {

  const candidates = [

    article &&
      article.datePublished,

    article &&
      article.dateCreated,

    getMeta(
      $,
      ['article:published_time']
    ),

    getMeta(
      $,
      ['datePublished']
    ),

    getMeta(
      $,
      ['date']
    ),

    $('time[datetime]')
      .first()
      .attr('datetime')

  ];


  for (
    const candidate
    of candidates
  ) {

    const date =
      parseDateValue(
        candidate
      );


    if (date) {

      return date;

    }

  }


  return null;

}


// ================================================================
// 23. OLD NEWS FILTER
// ================================================================

function isTooOld(
  date
) {

  if (!date)
    return false;


  const ageMs =
    Date.now() -
    date.getTime();


  // future timestamp হলে
  // old হিসেবে ধরবে না

  if (
    ageMs < 0
  ) {

    return false;

  }


  return (

    ageMs >

    MAX_ARTICLE_AGE_HOURS *
      60 *
      60 *
      1000

  );

}


// ================================================================
// 24. CATEGORY CLASSIFICATION
//     WITHOUT AI
// ================================================================

const CATEGORY_RULES = [

  {
    category:
      'খেলাধুলা',

    words: [

      'ক্রিকেট',

      'ফুটবল',

      'খেলা',

      'ম্যাচ',

      'টেস্ট',

      'ওয়ানডে',

      'টি-টোয়েন্টি',

      'বিসিবি',

      'ফিফা',

      'বিশ্বকাপ',

      'চ্যাম্পিয়ন',

      'গোল',

      'টুর্নামেন্ট'

    ]
  },


  {
    category:
      'বাণিজ্য',

    words: [

      'ব্যাংক',

      'শেয়ারবাজার',

      'পুঁজিবাজার',

      'অর্থনীতি',

      'বাণিজ্য',

      'ডলার',

      'রপ্তানি',

      'আমদানি',

      'মূল্যস্ফীতি',

      'বাজেট',

      'রাজস্ব',

      'ঋণ',

      'ব্যবসা'

    ]
  },


  {
    category:
      'রাজনীতি',

    words: [

      'বিএনপি',

      'আওয়ামী লীগ',

      'জামায়াত',

      'নির্বাচন',

      'ভোট',

      'রাজনীতি',

      'রাজনৈতিক',

      'সংসদ',

      'দলীয়',

      'প্রার্থী',

      'কমিশন'

    ]
  },


  {
    category:
      'আন্তর্জাতিক',

    words: [

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

      'বিশ্ব'

    ]
  },


  {
    category:
      'আইন-আদালত',

    words: [

      'আদালত',

      'হাইকোর্ট',

      'সুপ্রিম কোর্ট',

      'আপিল বিভাগ',

      'মামলা',

      'জামিন',

      'রিমান্ড',

      'বিচারক',

      'আইনজীবী',

      'ট্রাইব্যুনাল',

      'রায়'

    ]
  },


  {
    category:
      'প্রযুক্তি',

    words: [

      'প্রযুক্তি',

      'স্মার্টফোন',

      'মোবাইল',

      'ইন্টারনেট',

      'ফেসবুক',

      'গুগল',

      'মাইক্রোসফট',

      'কৃত্রিম বুদ্ধিমত্তা',

      'এআই',

      'সাইবার',

      'অ্যাপ'

    ]
  },


  {
    category:
      'বিনোদন',

    words: [

      'সিনেমা',

      'অভিনেতা',

      'অভিনেত্রী',

      'নায়ক',

      'নায়িকা',

      'গায়ক',

      'গায়িকা',

      'নাটক',

      'বিনোদন',

      'চলচ্চিত্র',

      'বলিউড',

      'হলিউড'

    ]
  },


  {
    category:
      'শিক্ষা',

    words: [

      'বিশ্ববিদ্যালয়',

      'শিক্ষা',

      'স্কুল',

      'কলেজ',

      'শিক্ষার্থী',

      'পরীক্ষা',

      'এইচএসসি',

      'এসএসসি',

      'ভর্তি',

      'শিক্ষক'

    ]
  },


  {
    category:
      'চাকরি',

    words: [

      'চাকরি',

      'নিয়োগ',

      'পদে আবেদন',

      'ক্যারিয়ার',

      'বেতন',

      'পদসংখ্যা'

    ]
  },


  {
    category:
      'ধর্ম',

    words: [

      'ইসলাম',

      'হজ',

      'ওমরাহ',

      'মসজিদ',

      'কোরআন',

      'রমজান',

      'পূজা',

      'মন্দির',

      'ধর্ম'

    ]
  },


  {
    category:
      'জীবনযাপন',

    words: [

      'স্বাস্থ্য',

      'জীবনযাপন',

      'খাদ্য',

      'রেসিপি',

      'ফ্যাশন',

      'ভ্রমণ',

      'লাইফস্টাইল'

    ]
  }

];


// ================================================================
// 25. DETECT CATEGORY
// ================================================================

function detectCategory(
  title,
  description,
  fallback
) {

  const haystack =
    `${title} ${description}`
      .toLowerCase();


  let bestCategory =
    fallback ||
    'বাংলাদেশ';


  let bestScore =
    0;


  for (
    const rule
    of CATEGORY_RULES
  ) {

    let score =
      0;


    for (
      const word
      of rule.words
    ) {

      if (
        haystack.includes(
          word.toLowerCase()
        )
      ) {

        score++;

      }

    }


    if (
      score >
      bestScore
    ) {

      bestScore =
        score;

      bestCategory =
        rule.category;

    }

  }


  return bestCategory;

}


// ================================================================
// 26. IMPORTANCE SCORE
// ================================================================

function calculateImportance(
  title,
  category
) {

  const text =
    title.toLowerCase();


  let score =
    5;


  const highWords = [

    'প্রধানমন্ত্রী',

    'রাষ্ট্রপতি',

    'জাতীয়',

    'নির্বাচন',

    'আদালত',

    'হাইকোর্ট',

    'সুপ্রিম কোর্ট',

    'দুর্ঘটনা',

    'আগুন',

    'ভূমিকম্প',

    'বন্যা',

    'ঘূর্ণিঝড়',

    'মৃত্যু',

    'নিহত',

    'গ্রেপ্তার',

    'বাজেট',

    'রেকর্ড'

  ];


  highWords.forEach(
    word => {

      if (
        text.includes(word)
      ) {

        score += 1;

      }

    }
  );


  if (
    [

      'বাংলাদেশ',

      'রাজনীতি',

      'আন্তর্জাতিক',

      'আইন-আদালত'

    ].includes(
      category
    )
  ) {

    score += 1;

  }


  return Math.max(

    1,

    Math.min(
      10,
      score
    )

  );

}


// ================================================================
// 27. BREAKING NEWS DETECTION
// ================================================================

function isBreakingTitle(
  title
) {

  const text =
    title.toLowerCase();


  const words = [

    'এইমাত্র',

    'জরুরি',

    'ব্রেকিং',

    'নিহত',

    'ভূমিকম্প',

    'আগুন',

    'বিস্ফোরণ',

    'ঘূর্ণিঝড়',

    'গ্রেপ্তার',

    'পদত্যাগ'

  ];


  return words.some(
    word =>
      text.includes(word)
  );

}


// ================================================================
// 28. EXTRACT COMPLETE ARTICLE METADATA
// ================================================================

async function extractArticle(
  url,
  source
) {

  const fetched =
    await fetchHtml(url);


  if (!fetched)
    return null;


  const finalUrl =
    fetched.finalUrl ||
    url;


  if (
    !hostMatches(
      finalUrl,
      source.domain
    )
  ) {

    return null;

  }


  const $ =
    cheerio.load(
      fetched.html
    );


  const articleJson =
    pickJsonLdArticle($);


  // ----------------------------------
  // TITLE
  // ----------------------------------

  const title =
    extractTitle(
      $,
      articleJson
    );


  if (

    !title ||

    title.length < 12 ||

    title.length > 240

  ) {

    return null;

  }


  // ----------------------------------
  // SHORT DESCRIPTION
  // ----------------------------------

  const description =
    extractDescription(
      $,
      articleJson
    );


  // ----------------------------------
  // IMAGE
  // ----------------------------------

  const imageUrl =
    extractImage(
      $,
      articleJson,
      finalUrl
    );


  // ----------------------------------
  // PUBLISHED DATE
  // ----------------------------------

  const publishedAt =
    extractPublishedAt(
      $,
      articleJson
    );


  // ----------------------------------
  // OLD ARTICLE FILTER
  // ----------------------------------

  if (
    publishedAt &&
    isTooOld(
      publishedAt
    )
  ) {

    console.log(

      `🕓 পুরোনো সংবাদ, স্কিপ: ` +

      `${title.substring(
        0,
        55
      )}...`

    );

    return null;

  }


  // ----------------------------------
  // IMAGE REQUIRED
  // ----------------------------------

  if (
    REQUIRE_IMAGE &&
    !imageUrl
  ) {

    console.log(

      `🖼️ ছবি পাওয়া যায়নি, স্কিপ: ` +

      `${title.substring(
        0,
        60
      )}...`

    );

    return null;

  }


  // ----------------------------------
  // CATEGORY
  // ----------------------------------

  const category =
    detectCategory(

      title,

      description,

      source.defaultCategory

    );


  // ----------------------------------
  // IMPORTANCE
  // ----------------------------------

  const importance =
    calculateImportance(

      title,

      category

    );


  // ----------------------------------
  // SNIPPET
  // ----------------------------------

  const fallbackDescription =
    `${source.bnName}-এ প্রকাশিত এই সংবাদটির ` +
    `বিস্তারিত জানতে মূল সংবাদে ক্লিক করুন।`;


  const finalDescription =
    description ||
    fallbackDescription;


  const snippetBase =
    description ||
    `${source.bnName}-এ প্রকাশিত সংবাদ।`;


  const snippet =

    snippetBase.substring(
      0,
      220
    ) +

    (
      snippetBase.length >
      220

        ?

        '…'

        :

        ''
    );


  return {

    title,

    content:
      finalDescription,

    snippet,

    image_url:
      imageUrl ||
      null,

    source_url:
      finalUrl,

    source_name:
      source.bnName,

    category,

    image_source:
      source.bnName,

    is_published:
      true,

    is_custom:
      false,

    is_lead:
      importance >= 8,

    importance_score:
      importance,

    editorial_score:
      Math.min(
        100,
        60 +
        importance * 4
      ),

    breaking_news:
      isBreakingTitle(title),

    event_hash:
      createEventHash(title),

    event_type:
      category,

    publishedAt

  };

}


// ================================================================
// 29. DATABASE DUPLICATE CHECK
// ================================================================

async function alreadyExists(
  article
) {

  // ----------------------------------
  // Check original URL
  // ----------------------------------

  const {

    count:
      byUrl,

    error:
      urlError

  } =

    await supabase

      .from('news')

      .select(
        '*',
        {
          count: 'exact',
          head: true
        }
      )

      .eq(
        'source_url',
        article.source_url
      );


  if (
    urlError
  ) {

    console.log(

      `⚠️ URL duplicate check error: ` +

      `${urlError.message}`

    );

  }


  if (
    (byUrl || 0) > 0
  ) {

    return true;

  }


  // ----------------------------------
  // Check normalized headline hash
  // ----------------------------------

  const {

    count:
      byHash,

    error:
      hashError

  } =

    await supabase

      .from('news')

      .select(
        '*',
        {
          count: 'exact',
          head: true
        }
      )

      .eq(
        'event_hash',
        article.event_hash
      );


  if (
    hashError
  ) {

    console.log(

      `⚠️ Hash duplicate check error: ` +

      `${hashError.message}`

    );

  }


  return (
    (byHash || 0) > 0
  );

}


// ================================================================
// 30. INSERT ARTICLE
// ================================================================

async function insertArticle(
  article
) {

  // IMPORTANT:
  // Only existing database fields are used here.
  // No new Supabase column is required.

  const row = {

    title:
      article.title,

    content:
      article.content,

    snippet:
      article.snippet,

    image_url:
      article.image_url,

    source_url:
      article.source_url,

    source_name:
      article.source_name,

    category:
      article.category,

    image_source:
      article.image_source,

    is_published:
      article.is_published,

    is_custom:
      article.is_custom,

    is_lead:
      article.is_lead,

    importance_score:
      article.importance_score,

    editorial_score:
      article.editorial_score,

    breaking_news:
      article.breaking_news,

    event_hash:
      article.event_hash,

    event_type:
      article.event_type

  };


  const {
    error
  } =

    await supabase

      .from('news')

      .insert([
        row
      ]);


  return error;

}


// ================================================================
// 31. PROCESS ONE NEWS SOURCE
// ================================================================

async function processSource(
  source,
  remainingBudget
) {

  console.log(

    `\n📰 সরাসরি স্ক্র্যাপ হচ্ছে: ` +

    `${source.bnName}`

  );


  // ----------------------------------
  // Newspaper homepage fetch
  // ----------------------------------

  const home =
    await fetchHtml(
      source.url
    );


  if (!home) {

    console.log(

      `⚠️ ${source.bnName}: ` +

      `source page পাওয়া যায়নি।`

    );

    return 0;

  }


  // ----------------------------------
  // Collect direct links
  // ----------------------------------

  let links =
    collectDirectLinks(

      home.html,

      home.finalUrl ||
      source.url,

      source

    );


  console.log(

    `🔗 ${source.bnName}: ` +

    `${links.length} direct candidate link পাওয়া গেছে।`

  );


  // ----------------------------------
  // Hidden Google News backup
  // ----------------------------------

  if (

    links.length < 5 &&

    ENABLE_GOOGLE_NEWS_BACKUP

  ) {

    console.log(

      `🔎 ${source.bnName}: ` +

      `direct link কম, hidden Google News ` +

      `discovery চেষ্টা হচ্ছে...`

    );


    const backupLinks =
      await discoverFromGoogleNews(
        source
      );


    links = [

      ...new Set([

        ...links,

        ...backupLinks

      ])

    ];


    console.log(

      `🔗 Backup-এর পর total candidate: ` +

      `${links.length}`

    );

  }


  if (
    !links.length
  ) {

    console.log(

      `⚠️ ${source.bnName}: ` +

      `usable article link পাওয়া যায়নি।`

    );

    return 0;

  }


  let published =
    0;


  const sourceLimit =
    Math.min(

      MAX_ARTICLES_PER_SOURCE,

      remainingBudget

    );


  // ----------------------------------
  // Process candidate article links
  // ----------------------------------

  for (
    const link
    of links
  ) {

    if (
      published >=
      sourceLimit
    ) {

      break;

    }


    try {

      const article =
        await extractArticle(

          link,

          source

        );


      if (!article)
        continue;


      // ------------------------------
      // Duplicate check
      // ------------------------------

      if (
        await alreadyExists(
          article
        )
      ) {

        console.log(

          `⏭️ ডুপ্লিকেট: ` +

          `${article.title.substring(
            0,
            55
          )}...`

        );

        continue;

      }


      // ------------------------------
      // Insert into Supabase
      // ------------------------------

      const insertError =
        await insertArticle(
          article
        );


      if (
        insertError
      ) {

        console.error(

          `❌ Supabase insert error: ` +

          `${insertError.message}`

        );

        continue;

      }


      published++;


      console.log(

        `✅ পাবলিশ: ` +

        `[${article.category}] ` +

        `${article.title.substring(
          0,
          65
        )}` +

        `${
          article.title.length > 65

            ?

            '...'

            :

            ''
        }` +

        ` | ${article.source_name}`

      );


      await delay(800);

    }

    catch (
      error
    ) {

      console.log(

        `⚠️ Article processing error: ` +

        `${error.message}`

      );

    }

  }


  console.log(

    `📌 ${source.bnName}: ` +

    `${published}টি নতুন সংবাদ publish হয়েছে।`

  );


  return published;

}


// ================================================================
// 32. MAIN BOT
// ================================================================

async function runBot() {

  console.log(

    '🚀 বঙ্গীয় টাইমস Direct-Source Aggregator শুরু হয়েছে...'

  );


  console.log(

    `🖼️ ছবি বাধ্যতামূলক: ` +

    `${REQUIRE_IMAGE ? 'হ্যাঁ' : 'না'}`

  );


  console.log(

    `📰 সর্বোচ্চ সংবাদ/রান: ` +

    `${MAX_ARTICLES_PER_RUN}`

  );


  console.log(

    `🕓 সর্বোচ্চ article age: ` +

    `${MAX_ARTICLE_AGE_HOURS} ঘণ্টা`

  );


  let totalPublished =
    0;


  // ==============================================================
  // SOURCE ROTATION
  //
  // প্রতিবার একই newspaper প্রথমে না আসার জন্য
  // প্রতিদিন source order rotate হবে।
  // ==============================================================

  const todaySeed =
    Math.floor(

      Date.now() /

      (
        24 *
        60 *
        60 *
        1000
      )

    );


  const rotateIndex =
    todaySeed %
    SOURCES.length;


  const rotatedSources = [

    ...SOURCES.slice(
      rotateIndex
    ),

    ...SOURCES.slice(
      0,
      rotateIndex
    )

  ];


  // ==============================================================
  // RUN ALL SOURCES
  // ==============================================================

  for (
    const source
    of rotatedSources
  ) {

    if (
      totalPublished >=
      MAX_ARTICLES_PER_RUN
    ) {

      break;

    }


    try {

      const remainingBudget =

        MAX_ARTICLES_PER_RUN -

        totalPublished;


      const count =
        await processSource(

          source,

          remainingBudget

        );


      totalPublished +=
        count;

    }

    catch (
      error
    ) {

      console.error(

        `❌ ${source.bnName} ` +

        `ক্র্যাশ করেছে: ` +

        `${error.message}`

      );

    }


    await delay(1200);

  }


  // ==============================================================
  // FINAL RESULT
  // ==============================================================

  console.log(

    `\n🎉 কাজ শেষ। ` +

    `মোট নতুন সংবাদ: ` +

    `${totalPublished}`

  );


  if (
    totalPublished === 0
  ) {

    console.log(

      'ℹ️ নতুন সংবাদ ০ হলে সম্ভাব্য কারণ:\n' +

      '1. সব সংবাদ আগেই database-এ আছে\n' +

      '2. newspaper-এর HTML layout বদলেছে\n' +

      '3. article image পাওয়া যায়নি\n' +

      '4. article 72 ঘণ্টার বেশি পুরোনো\n' +

      '5. Supabase insert policy block করছে\n' +

      '6. website anti-bot protection ব্যবহার করছে'

    );

  }

}


// ================================================================
// 33. START BOT
// ================================================================

runBot()

  .catch(
    error => {

      console.error(

        '❌ Fatal scraper error:',

        error

      );

      process.exit(1);

    }
  );
