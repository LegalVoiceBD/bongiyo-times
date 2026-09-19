const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

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
  'Accept-Language':
    'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache'
};

const REQUEST_TIMEOUT_MS =
  Number(process.env.REQUEST_TIMEOUT_MS || 18000);

const MAX_ARTICLES_PER_RUN =
  Number(process.env.MAX_ARTICLES_PER_RUN || 24);

const MAX_ITEMS_TO_INSPECT =
  Number(process.env.MAX_ITEMS_TO_INSPECT || 100);

const MAX_ARTICLE_AGE_HOURS =
  Number(process.env.MAX_ARTICLE_AGE_HOURS || 48);

const REPAIR_RECENT_LIMIT =
  Number(process.env.REPAIR_RECENT_LIMIT || 30);

const REQUIRE_IMAGE =
  String(
    process.env.REQUIRE_NEWS_IMAGE || 'true'
  ).toLowerCase() !== 'false';

const delay = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );


// ================================================================
// APPROVED NATIONAL PUBLISHERS
// ================================================================

const PUBLISHERS = [

  [
    'প্রথম আলো',
    ['prothomalo.com'],
    [
      'prothom alo',
      'প্রথম আলো'
    ]
  ],

  [
    'কালের কণ্ঠ',
    ['kalerkantho.com'],
    [
      'kaler kantho',
      'kalerkantho',
      'কালের কণ্ঠ'
    ]
  ],

  [
    'যুগান্তর',
    ['jugantor.com'],
    [
      'jugantor',
      'যুগান্তর'
    ]
  ],

  [
    'দৈনিক ইত্তেফাক',
    ['ittefaq.com.bd'],
    [
      'ittefaq',
      'the daily ittefaq',
      'দৈনিক ইত্তেফাক',
      'ইত্তেফাক'
    ]
  ],

  [
    'সমকাল',
    ['samakal.com'],
    [
      'samakal',
      'সমকাল'
    ]
  ],

  [
    'বাংলাদেশ প্রতিদিন',
    ['bd-pratidin.com'],
    [
      'bangladesh pratidin',
      'bd-pratidin',
      'বাংলাদেশ প্রতিদিন'
    ]
  ],

  [
    'ঢাকা পোস্ট',
    ['dhakapost.com'],
    [
      'dhaka post',
      'dhakapost',
      'ঢাকা পোস্ট'
    ]
  ],

  [
    'জাগো নিউজ২৪',
    ['jagonews24.com'],
    [
      'jago news 24',
      'jagonews24',
      'jago news',
      'জাগো নিউজ',
      'জাগো নিউজ২৪'
    ]
  ],

  [
    'বাংলা ট্রিবিউন',
    ['banglatribune.com'],
    [
      'bangla tribune',
      'বাংলা ট্রিবিউন'
    ]
  ],

  [
    'বাংলানিউজ২৪ ডটকম',
    ['banglanews24.com'],
    [
      'banglanews24',
      'banglanews24.com',
      'বাংলানিউজ২৪',
      'বাংলানিউজ'
    ]
  ],

  [
    'বিডিনিউজ টোয়েন্টিফোর ডটকম',
    ['bdnews24.com'],
    [
      'bdnews24',
      'bdnews24.com',
      'বিডিনিউজ',
      'বিডিনিউজ টোয়েন্টিফোর'
    ]
  ],

  [
    'দৈনিক ইনকিলাব',
    ['dailyinqilab.com'],
    [
      'daily inqilab',
      'inqilab',
      'দৈনিক ইনকিলাব',
      'ইনকিলাব'
    ]
  ],

  [
    'নয়া দিগন্ত',
    ['dailynayadiganta.com'],
    [
      'naya diganta',
      'nayadiganta',
      'daily naya diganta',
      'নয়া দিগন্ত',
      'নয়াদিগন্ত'
    ]
  ],

  [
    'দ্য ডেইলি স্টার',
    ['thedailystar.net'],
    [
      'the daily star',
      'daily star',
      'দ্য ডেইলি স্টার'
    ]
  ],

  [
    'দ্য বিজনেস স্ট্যান্ডার্ড',
    ['tbsnews.net'],
    [
      'the business standard',
      'tbs news',
      'tbsnews',
      'দ্য বিজনেস স্ট্যান্ডার্ড'
    ]
  ],

  [
    'ঢাকা ট্রিবিউন',
    ['dhakatribune.com'],
    [
      'dhaka tribune',
      'ঢাকা ট্রিবিউন'
    ]
  ],

  [
    'ইউএনবি',
    ['unb.com.bd'],
    [
      'unb',
      'united news of bangladesh',
      'ইউএনবি'
    ]
  ]

].map(
  ([bnName, domains, aliases]) => ({
    bnName,
    domains,
    aliases
  })
);


// ================================================================
// TEXT HELPERS
// ================================================================

function clean(value = '') {

  return String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

}


function lower(value = '') {

  return clean(value)
    .toLowerCase();

}


function stripHtml(value = '') {

  if (!value) return '';

  const $ =
    cheerio.load(
      `<div>${value}</div>`
    );

  return clean(
    $('div').text()
  );

}


function escapeRegExp(value = '') {

  return String(value)
    .replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

}


function cleanRssTitle(
  title,
  sourceName
) {

  let finalTitle =
    clean(title);

  if (sourceName) {

    finalTitle =
      finalTitle.replace(

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
// PUBLISHER DETECTION
// ================================================================

function findPublisherByName(
  name = ''
) {

  const normalized =
    lower(name);

  if (!normalized)
    return null;


  return (

    PUBLISHERS.find(
      (publisher) =>

        publisher.aliases.some(
          (alias) => {

            const a =
              lower(alias);

            return (
              normalized === a ||
              normalized.includes(a) ||
              a.includes(normalized)
            );

          }
        )

    ) || null

  );

}


function findPublisherByUrl(
  rawUrl = ''
) {

  try {

    const hostname =
      new URL(rawUrl)
        .hostname
        .replace(
          /^www\./,
          ''
        )
        .toLowerCase();


    return (

      PUBLISHERS.find(
        (publisher) =>

          publisher.domains.some(
            (domain) =>
              hostname === domain ||
              hostname.endsWith(
                `.${domain}`
              )
          )

      ) || null

    );

  }

  catch {

    return null;

  }

}


// ================================================================
// FETCH HELPERS
// ================================================================

async function fetchWithTimeout(
  url,
  options = {}
) {

  const controller =
    new AbortController();


  const timer =
    setTimeout(
      () =>
        controller.abort(),
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

          ...(
            options.headers ||
            {}
          )

        },

        signal:
          controller.signal

      }
    );

  }

  finally {

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


    if (
      !response.ok
    ) {

      return null;

    }


    return {

      text:
        await response.text(),

      finalUrl:
        response.url ||
        url

    };

  }

  catch (
    error
  ) {

    console.log(
      `⚠️ Fetch failed: ${error.message}`
    );

    return null;

  }

}


function absoluteUrl(
  raw,
  base
) {

  if (!raw)
    return '';


  const value =
    clean(raw);


  if (
    !value ||
    value.startsWith(
      'data:'
    ) ||
    value.startsWith(
      'javascript:'
    )
  ) {

    return '';

  }


  try {

    const url =
      new URL(
        value,
        base
      );


    [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid'

    ].forEach(
      (key) =>
        url.searchParams.delete(
          key
        )
    );


    url.hash = '';


    return url.toString();

  }

  catch {

    return '';

  }

}


// ================================================================
// GOOGLE NEWS DISCOVERY FEEDS
// ================================================================

const GOOGLE_FEEDS = [

  {
    category:
      'বাংলাদেশ',

    url:
      'https://news.google.com/rss?hl=bn&gl=BD&ceid=BD:bn'
  },

  {
    category:
      'বাংলাদেশ',

    query:
      'বাংলাদেশ when:1d'
  },

  {
    category:
      'রাজনীতি',

    query:
      'বাংলাদেশ রাজনীতি নির্বাচন সংসদ when:1d'
  },

  {
    category:
      'আন্তর্জাতিক',

    query:
      'বিশ্ব আন্তর্জাতিক when:1d'
  },

  {
    category:
      'খেলাধুলা',

    query:
      'ক্রিকেট ফুটবল খেলাধুলা when:1d'
  },

  {
    category:
      'বাণিজ্য',

    query:
      'অর্থনীতি বাণিজ্য ব্যাংক শেয়ারবাজার when:1d'
  },

  {
    category:
      'আইন-আদালত',

    query:
      'আদালত হাইকোর্ট সুপ্রিম কোর্ট মামলা when:1d'
  },

  {
    category:
      'প্রযুক্তি',

    query:
      'প্রযুক্তি ইন্টারনেট কৃত্রিম বুদ্ধিমত্তা when:1d'
  },

  {
    category:
      'বিনোদন',

    query:
      'বিনোদন চলচ্চিত্র নাটক when:1d'
  },

  {
    category:
      'শিক্ষা',

    query:
      'শিক্ষা বিশ্ববিদ্যালয় পরীক্ষা when:1d'
  }

];


function feedUrl(
  feed
) {

  return (

    feed.url ||

    `https://news.google.com/rss/search?q=${encodeURIComponent(feed.query)}&hl=bn&gl=BD&ceid=BD:bn`

  );

}


async function collectGoogleNewsItems() {

  const items = [];

  const seen =
    new Set();


  for (
    const feed
    of GOOGLE_FEEDS
  ) {

    const fetched =
      await fetchText(

        feedUrl(feed),

        {

          headers: {

            Accept:
              'application/rss+xml,' +
              'application/xml,' +
              'text/xml;q=0.9,*/*;q=0.8'

          }

        }

      );


    if (!fetched)
      continue;


    const $ =
      cheerio.load(
        fetched.text,
        {
          xmlMode: true
        }
      );


    $('item').each(
      (_, element) => {

        if (
          items.length >=
          MAX_ITEMS_TO_INSPECT
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


        if (!publisher)
          return;


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


        if (
          seen.has(key)
        ) {

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

          googlePubDate:

            Number.isNaN(
              date.getTime()
            )

              ? null

              : date

        });

      }
    );


    await delay(250);

  }


  items.sort(
    (a, b) =>

      (
        b.googlePubDate?.getTime() ||
        0
      ) -

      (
        a.googlePubDate?.getTime() ||
        0
      )
  );


  return items.slice(
    0,
    MAX_ITEMS_TO_INSPECT
  );

}


// ================================================================
// GOOGLE NEWS URL DECODER
// ================================================================

function unescapeGoogle(
  value
) {

  try {

    return JSON.parse(
      `"${value}"`
    );

  }

  catch {

    return value
      .replace(
        /\\u003d/g,
        '='
      )
      .replace(
        /\\u0026/g,
        '&'
      )
      .replace(
        /\\u002f/gi,
        '/'
      )
      .replace(
        /\\\//g,
        '/'
      );

  }

}


async function decodeViaBatch(
  id
) {

  const request =

    '[[["Fbv4je","[\\"garturlreq\\",[[\\"en-US\\",\\"US\\",[\\"FINANCE_TOP_INDICES\\",\\"WEB_TEST_1_0_0\\"],null,null,1,1,\\"US:en\\",null,180,null,null,null,null,null,0,null,null,[1608992183,723341000]],\\"en-US\\",\\"US\\",1,[2,3,4,8],1,0,\\"655000234\\",0,0,null,0],\\"' +

    id +

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
            'https://news.google.com/'

        },

        body:
          `f.req=${encodeURIComponent(request)}`

      }

    );


  if (
    !response.ok
  ) {

    throw new Error(
      `Google decoder HTTP ${response.status}`
    );

  }


  const text =
    await response.text();


  const marker =
    '[\\"garturlres\\",\\"';


  const index =
    text.indexOf(
      marker
    );


  if (
    index < 0
  ) {

    throw new Error(
      'Google decoder marker not found'
    );

  }


  const rest =
    text.slice(
      index +
      marker.length
    );


  const end =
    rest.indexOf(
      '\\",'
    );


  if (
    end < 0
  ) {

    throw new Error(
      'Google decoder URL end not found'
    );

  }


  return unescapeGoogle(
    rest.slice(
      0,
      end
    )
  );

}


function decodeOldId(
  id
) {

  try {

    const base64 =
      id
        .replace(
          /-/g,
          '+'
        )
        .replace(
          /_/g,
          '/'
        );


    let buffer =
      Buffer.from(

        base64 +

        '='.repeat(
          (
            4 -
            base64.length % 4
          ) % 4
        ),

        'base64'

      );


    const prefix =
      Buffer.from(
        [
          0x08,
          0x13,
          0x22
        ]
      );


    const suffix =
      Buffer.from(
        [
          0xd2,
          0x01,
          0x00
        ]
      );


    if (
      buffer
        .subarray(
          0,
          3
        )
        .equals(
          prefix
        )
    ) {

      buffer =
        buffer.subarray(
          3
        );

    }


    if (

      buffer.length >= 3 &&

      buffer
        .subarray(
          buffer.length - 3
        )
        .equals(
          suffix
        )

    ) {

      buffer =
        buffer.subarray(
          0,
          buffer.length - 3
        );

    }


    let position = 0;

    let length = 0;

    let shift = 0;


    while (

      position <
        buffer.length &&

      shift <= 28

    ) {

      const byte =
        buffer[
          position++
        ];


      length |=
        (
          byte &
          0x7f
        ) <<
        shift;


      if (
        !(
          byte &
          0x80
        )
      ) {

        break;

      }


      shift += 7;

    }


    if (

      length <= 0 ||

      position +
        length >
        buffer.length

    ) {

      return '';

    }


    return buffer
      .subarray(
        position,
        position + length
      )
      .toString(
        'utf8'
      );

  }

  catch {

    return '';

  }

}


async function resolveGoogleUrl(
  url
) {

  try {

    const parsed =
      new URL(url);


    if (
      parsed.hostname !==
      'news.google.com'
    ) {

      return url;

    }


    const parts =
      parsed.pathname
        .split('/')
        .filter(Boolean);


    const articleIndex =
      parts.lastIndexOf(
        'articles'
      );


    if (

      articleIndex < 0 ||

      !parts[
        articleIndex + 1
      ]

    ) {

      return url;

    }


    const id =
      parts[
        articleIndex + 1
      ];


    const oldDecoded =
      decodeOldId(id);


    if (
      /^https?:\/\//i.test(
        oldDecoded
      )
    ) {

      return oldDecoded;

    }


    const decoded =
      await decodeViaBatch(
        id
      );


    return (

      /^https?:\/\//i.test(
        decoded
      )

        ? decoded

        : url

    );

  }

  catch (
    error
  ) {

    console.log(
      `⚠️ Google URL decode failed: ${error.message}`
    );

    return url;

  }

}


// ================================================================
// META + JSON-LD
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

      `meta[itemprop="${name}"]`

    ];


    for (
      const selector
      of selectors
    ) {

      const value =
        $(selector)
          .first()
          .attr(
            'content'
          );


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


function jsonLdNodes(
  $
) {

  const output = [];


  function walk(
    value
  ) {

    if (
      !value ||
      typeof value !==
        'object'
    ) {

      return;

    }


    if (
      Array.isArray(
        value
      )
    ) {

      value.forEach(
        walk
      );

      return;

    }


    output.push(
      value
    );


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


      if (!raw)
        return;


      try {

        walk(
          JSON.parse(
            raw
          )
        );

      }

      catch {

      }

    }
  );


  return output;

}


function articleJsonLd(
  $
) {

  const types =
    new Set(
      [
        'NewsArticle',
        'Article',
        'ReportageNewsArticle',
        'LiveBlogPosting'
      ]
    );


  return (

    jsonLdNodes($)
      .find(
        (node) => {

          const type =
            node['@type'];


          return (

            Array.isArray(
              type
            )

              ?

              type.some(
                (value) =>
                  types.has(
                    value
                  )
              )

              :

              types.has(
                type
              )

          );

        }
      ) ||

    null

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
        .attr(
          'href'
        ),

      pageUrl

    ) ||

    pageUrl

  );

}


// ================================================================
// ARTICLE TITLE + DESCRIPTION
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

    clean(
      rssTitle
    );


  return clean(

    title.replace(
      /\s+[|–—-]\s+[^|–—-]{2,45}$/u,
      ''
    )

  );

}


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


  const paragraphs = [];


  const selectors = [

    'article p',

    '[class*="article"] p',

    '[class*="story"] p',

    '[class*="details"] p',

    'main p'

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
      .slice(
        0,
        2
      )
      .join(
        ' '
      )

  );

}


// ================================================================
// ARTICLE DATE
// ================================================================

function parseDate(
  value
) {

  if (!value)
    return null;


  const date =
    new Date(
      value
    );


  return (

    Number.isNaN(
      date.getTime()
    )

      ? null

      : date

  );

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
      .attr(
        'datetime'
      )

  ];


  for (
    const value
    of values
  ) {

    const date =
      parseDate(
        value
      );


    if (date)
      return date;

  }


  return rssDate || null;

}


// ================================================================
// SMART IMAGE SELECTION
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

  'share-icon'

];


function badImage(
  url
) {

  if (!url)
    return true;


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
        value.includes(
          word
        )
    )

  );

}


function dimension(
  value
) {

  const number =
    parseInt(

      String(
        value ||
        ''
      ).replace(
        /[^0-9]/g,
        ''
      ),

      10

    );


  return (

    Number.isFinite(
      number
    )

      ? number

      : 0

  );

}


function titleOverlap(
  title,
  alt
) {

  const getTokens =
    (value) =>

      lower(value)
        .replace(
          /[^\p{L}\p{N}\s]/gu,
          ' '
        )
        .split(
          /\s+/
        )
        .filter(
          (token) =>
            token.length >= 3
        );


  const titleTokens =
    new Set(
      getTokens(
        title
      )
    );


  return getTokens(
    alt
  ).filter(
    (token) =>
      titleTokens.has(
        token
      )
  ).length;

}


function imageFromElement(
  $,
  element,
  base
) {

  const node =
    $(element);


  const values = [

    node.attr(
      'data-src'
    ),

    node.attr(
      'data-lazy-src'
    ),

    node.attr(
      'data-original'
    ),

    node.attr(
      'data-image'
    ),

    node.attr(
      'src'
    )

  ];


  const srcset =

    node.attr(
      'srcset'
    ) ||

    node.attr(
      'data-srcset'
    );


  if (
    srcset
  ) {

    values.unshift(

      ...srcset
        .split(',')
        .map(
          (item) =>
            clean(item)
              .split(
                /\s+/
              )[0]
        )
        .filter(
          Boolean
        )
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
      !badImage(
        url
      )
    ) {

      return {

        url,

        alt:
          clean(

            node.attr(
              'alt'
            ) ||

            node.attr(
              'title'
            ) ||

            ''

          ),

        width:
          dimension(
            node.attr(
              'width'
            )
          ),

        height:
          dimension(
            node.attr(
              'height'
            )
          )

      };

    }

  }


  return null;

}


function addJsonImages(
  output,
  json,
  base
) {

  if (
    !json?.image
  ) {

    return;

  }


  const images =

    Array.isArray(
      json.image
    )

      ? json.image

      : [
          json.image
        ];


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

      raw =
        image;

    }

    else if (
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


    if (
      url
    ) {

      output.push(
        {

          url,

          score: 112,

          width,

          height,

          alt,

          kind:
            'jsonld'

        }
      );

    }

  }

}


function bestImage(
  $,
  json,
  base,
  title,
  publisher,
  imageUseCounts
) {

  const output = [];


  // ------------------------------------------------
  // Highest priority:
  // actual article/figure images
  // ------------------------------------------------

  const strongSelectors = [

    'article figure img',

    'article picture img',

    '[class*="article"] figure img',

    '[class*="article"] picture img',

    '[class*="story"] figure img',

    '[class*="story"] picture img',

    '[class*="details"] figure img',

    'main figure img',

    'main picture img'

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


        if (
          image
        ) {

          output.push(
            {

              ...image,

              score: 140,

              kind:
                'article-dom'

            }
          );

        }

      }
    );

  }


  // ------------------------------------------------
  // Normal article/main images
  // ------------------------------------------------

  const bodySelectors = [

    'article img',

    '[class*="article"] img',

    '[class*="story"] img',

    'main img'

  ];


  for (
    const selector
    of bodySelectors
  ) {

    $(selector)
      .slice(
        0,
        12
      )
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


          if (
            image
          ) {

            output.push(
              {

                ...image,

                score: 105,

                kind:
                  'body-dom'

              }
            );

          }

        }
      );

  }


  // ------------------------------------------------
  // Schema.org / JSON-LD
  // ------------------------------------------------

  addJsonImages(
    output,
    json,
    base
  );


  // ------------------------------------------------
  // og:image is now fallback,
  // NOT automatically the first choice
  // ------------------------------------------------

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
      ogAlt
    ],

    [
      getMeta(
        $,
        ['og:image']
      ),
      98,
      ogWidth,
      ogHeight,
      ogAlt
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
      )
    ],

    [
      $(
        'link[rel="image_src"]'
      )
        .first()
        .attr(
          'href'
        ),
      88,
      0,
      0,
      ''
    ]

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


    if (
      url
    ) {

      output.push(
        {

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
            'meta'

        }
      );

    }

  }


  // ------------------------------------------------
  // Deduplicate candidates
  // ------------------------------------------------

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
        )
      ].join(
        ' '
      )

    );


  const scored =
    [
      ...merged.values()
    ]
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


          // Large images are more likely
          // to be real news photos.
          if (

            candidate.width >= 600 &&

            candidate.height >= 300

          ) {

            score += 25;

          }


          // Small assets are usually
          // icons/logos.
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


          // ALT related to title =
          // strong positive evidence.
          score +=
            Math.min(
              overlap * 12,
              36
            );


          // ALT is basically the
          // publisher name = likely logo.
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


          // The same exact image appearing
          // in many different stories is
          // probably a site placeholder.
          const used =
            imageUseCounts.get(
              candidate.url
            ) ||
            0;


          if (
            used >= 2
          ) {

            score -= 160;

          }

          else if (
            used === 1
          ) {

            score -= 35;

          }


          return {

            ...candidate,

            finalScore:
              score

          };

        }
      )
      .sort(
        (a, b) =>
          b.finalScore -
          a.finalScore
      );


  const winner =
    scored.find(
      (candidate) =>
        candidate.finalScore >= 70
    );


  return (
    winner?.url ||
    ''
  );

}


// ================================================================
// CATEGORY DETECTION
// ================================================================

const CATEGORY_RULES = [

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
      'ফিফা'
    ]
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
      'ঋণ'
    ]
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
      'প্রার্থী'
    ]
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
      'ট্রাইব্যুনাল'
    ]
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
      'সাইবার'
    ]
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
      'হলিউড'
    ]
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
      'শিক্ষক'
    ]
  ],

  [
    'চাকরি',
    [
      'চাকরি',
      'নিয়োগ',
      'ক্যারিয়ার',
      'বেতন',
      'পদসংখ্যা'
    ]
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
      'ধর্ম'
    ]
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
      'লাইফস্টাইল'
    ]
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
      'মিয়ানমার'
    ]
  ]

];


function detectCategory(
  title,
  description,
  hint = 'বাংলাদেশ'
) {

  const text =
    lower(
      `${title} ${description}`
    );


  let best =
    hint;


  let bestScore =
    0;


  for (
    const [
      category,
      words
    ]
    of CATEGORY_RULES
  ) {

    const score =
      words.reduce(

        (
          total,
          word
        ) =>

          total +

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


const CATEGORY_LIMITS = {

  'বাংলাদেশ': 7,

  'রাজনীতি': 4,

  'আন্তর্জাতিক': 3,

  'আইন-আদালত': 3,

  'বাণিজ্য': 3,

  'খেলাধুলা': 3,

  'বিনোদন': 2,

  'প্রযুক্তি': 2,

  'শিক্ষা': 2,

  'চাকরি': 1,

  'ধর্ম': 1,

  'জীবনযাপন': 1

};


// ================================================================
// HASH / AGE / IMPORTANCE
// ================================================================

function hashFor(
  title,
  source
) {

  const key =
    lower(title)
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


  return crypto
    .createHash(
      'sha256'
    )
    .update(
      `${source}|${key}`
    )
    .digest(
      'hex'
    );

}


function tooOld(
  date
) {

  if (!date)
    return false;


  const difference =
    Date.now() -
    date.getTime();


  return (

    difference >= 0 &&

    difference >

      MAX_ARTICLE_AGE_HOURS *

      3600000

  );

}


function importance(
  title,
  category
) {

  let score =

    [
      'বাংলাদেশ',
      'রাজনীতি',
      'আন্তর্জাতিক',
      'আইন-আদালত'

    ].includes(
      category
    )

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

    'বাজেট'

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
// ORIGINAL ARTICLE EXTRACTION
// ================================================================

async function extractArticle(
  item,
  imageUseCounts
) {

  const resolved =
    await resolveGoogleUrl(
      item.googleUrl
    );


  const publisher =
    findPublisherByUrl(
      resolved
    ) ||

    item.publisher;


  // Never publish random/unapproved sites.
  if (

    !publisher ||

    !findPublisherByUrl(
      resolved
    )

  ) {

    return null;

  }


  const fetched =
    await fetchText(
      resolved
    );


  if (!fetched)
    return null;


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
    ) ||

    publisher;


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
    tooOld(
      date
    )
  ) {

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

      `🖼️ Story image পাওয়া যায়নি: ` +

      `${title.substring(
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

        ?

        `${snippetBase.substring(
          0,
          220
        )}…`

        :

        snippetBase,

    image_url:
      image ||
      null,

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
        importanceScore *
        3
      ),

    breaking_news:
      false,

    event_hash:
      hashFor(
        title,
        finalPublisher.bnName
      ),

    event_type:
      category,

    created_at:
      (
        date ||
        new Date()
      ).toISOString()

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
      urlCount
  } =

    await supabase
      .from(
        'news'
      )
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
    (
      urlCount ||
      0
    ) > 0
  ) {

    return true;

  }


  const {
    count:
      hashCount
  } =

    await supabase
      .from(
        'news'
      )
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


  return (
    (
      hashCount ||
      0
    ) > 0
  );

}


// ================================================================
// REPAIR ALREADY-SAVED BAD THUMBNAILS
// ================================================================

async function repairRecentImages(
  imageUseCounts
) {

  console.log(
    '\n🛠️ সাম্প্রতিক ভুল logo/thumbnail repair শুরু...'
  );


  const {
    data,
    error
  } =

    await supabase
      .from(
        'news'
      )
      .select(
        'id,title,source_url,source_name,image_url,is_custom,created_at'
      )
      .eq(
        'is_custom',
        false
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .limit(
        REPAIR_RECENT_LIMIT
      );


  if (
    error ||
    !data?.length
  ) {

    if (
      error
    ) {

      console.log(
        `⚠️ Repair query failed: ${error.message}`
      );

    }


    return;

  }


  let repaired =
    0;


  for (
    const row
    of data
  ) {

    try {

      if (
        !row.source_url
      ) {

        continue;

      }


      let url =
        row.source_url;


      if (
        url.includes(
          'news.google.com/'
        )
      ) {

        url =
          await resolveGoogleUrl(
            url
          );

      }


      const publisher =

        findPublisherByUrl(
          url
        ) ||

        findPublisherByName(
          row.source_name ||
          ''
        );


      if (

        !publisher ||

        !findPublisherByUrl(
          url
        )

      ) {

        continue;

      }


      const fetched =
        await fetchText(
          url
        );


      if (!fetched)
        continue;


      const $ =
        cheerio.load(
          fetched.text
        );


      const pageUrl =
        canonicalUrl(

          $,

          fetched.finalUrl ||
          url

        );


      const json =
        articleJsonLd(
          $
        );


      const title =
        articleTitle(

          $,

          json,

          row.title

        );


      const image =
        bestImage(

          $,

          json,

          pageUrl,

          title ||
          row.title,

          publisher,

          imageUseCounts

        );


      if (

        !image ||

        image ===
          row.image_url

      ) {

        continue;

      }


      const {
        error:
          updateError
      } =

        await supabase
          .from(
            'news'
          )
          .update(
            {

              image_url:
                image,

              image_source:
                publisher.bnName,

              source_name:
                publisher.bnName,

              source_url:
                pageUrl

            }
          )
          .eq(
            'id',
            row.id
          );


      if (
        !updateError
      ) {

        repaired++;


        imageUseCounts.set(

          image,

          (
            imageUseCounts.get(
              image
            ) ||
            0
          ) +
          1

        );


        console.log(

          `✅ Thumbnail repaired: ` +

          `${row.title.substring(
            0,
            55
          )}...`

        );

      }

    }

    catch (
      error
    ) {

      console.log(
        `⚠️ Repair skip: ${error.message}`
      );

    }


    await delay(200);

  }


  console.log(

    `🛠️ Repair শেষ: ` +

    `${repaired}টি thumbnail আপডেট।`

  );

}


// ================================================================
// MAIN
// ================================================================

async function runBot() {

  console.log(
    '🚀 বঙ্গীয় টাইমস Google News Discovery Aggregator শুরু...'
  );


  console.log(
    '🔎 Discovery = Google News'
  );


  console.log(
    '🖼️ Image = Original Publisher Article'
  );


  console.log(
    '✍️ Gemini Rewrite = OFF'
  );


  const imageUseCounts =
    new Map();


  // First repair existing bad thumbnails
  await repairRecentImages(
    imageUseCounts
  );


  // Then discover latest news
  const items =
    await collectGoogleNewsItems();


  console.log(

    `\n📰 অনুমোদিত Google News candidate: ` +

    `${items.length}`

  );


  let published =
    0;


  let inspected =
    0;


  const categoryCounts = {};


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

        `\n➡️ ${item.publisher.bnName}: ` +

        `${item.title.substring(
          0,
          72
        )}...`

      );


      const article =
        await extractArticle(

          item,

          imageUseCounts

        );


      if (!article)
        continue;


      const limit =

        CATEGORY_LIMITS[
          article.category
        ] ||

        2;


      categoryCounts[
        article.category
      ] =

        categoryCounts[
          article.category
        ] ||

        0;


      if (

        categoryCounts[
          article.category
        ] >=
        limit

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
        error
      } =

        await supabase
          .from(
            'news'
          )
          .insert(
            [
              article
            ]
          );


      if (
        error
      ) {

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
            ) ||
            0
          ) +
          1

        );

      }


      categoryCounts[
        article.category
      ]++;


      published++;


      console.log(

        `✅ পাবলিশ: ` +

        `[${article.category}] ` +

        `${article.title.substring(
          0,
          60
        )}... | ` +

        `${article.source_name}`

      );


      await delay(450);

    }

    catch (
      error
    ) {

      console.log(
        `⚠️ Candidate failed: ${error.message}`
      );

    }

  }


  console.log(

    `\n🎉 কাজ শেষ। ` +

    `মোট নতুন সংবাদ: ` +

    `${published}`

  );


  if (
    !published
  ) {

    console.log(

      'ℹ️ ০ হলে সম্ভাব্য কারণ: ' +

      'সব খবর duplicate, ' +

      'Google URL decode ব্যর্থ, ' +

      'publisher bot-block করেছে, ' +

      'বা usable lead image পাওয়া যায়নি।'

    );

  }

}


runBot()
  .catch(
    (error) => {

      console.error(
        '❌ Fatal scraper error:',
        error
      );

      process.exit(1);

    }
  );
