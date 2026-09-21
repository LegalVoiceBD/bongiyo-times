const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// ================================================================
// BONGIYO TIMES — COPYRIGHT-RISK-REDUCED NEWS AGGREGATOR
// Google News discovery -> original publisher URL -> metadata -> Supabase
// Third-party article text/images are NOT republished.
// ================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    '❌ Supabase environment variables are missing.'
  );

  process.exit(1);
}

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/153.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent':
    USER_AGENT,

  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

  'Accept-Language':
    'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7',

  'Cache-Control':
    'no-cache',

  Pragma:
    'no-cache',
};

const REQUEST_TIMEOUT_MS =
  Number(
    process.env.REQUEST_TIMEOUT_MS ||
      18000
  );

const MAX_ARTICLES_PER_RUN =
  Number(
    process.env.MAX_ARTICLES_PER_RUN ||
      32
  );

const MAX_ITEMS_TO_INSPECT =
  Number(
    process.env.MAX_ITEMS_TO_INSPECT ||
      160
  );

const MAX_ARTICLE_AGE_HOURS =
  Number(
    process.env.MAX_ARTICLE_AGE_HOURS ||
      72
  );

const delay =
  (ms) =>
    new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          ms
        )
    );


// ================================================================
// APPROVED PUBLISHERS
// ================================================================

const PUBLISHERS = [

  {
    bnName:
      'প্রথম আলো',

    domains: [
      'prothomalo.com'
    ],

    aliases: [
      'prothom alo',
      'প্রথম আলো'
    ],

    home:
      'https://www.prothomalo.com/',
  },


  {
    bnName:
      'কালের কণ্ঠ',

    domains: [
      'kalerkantho.com'
    ],

    aliases: [
      'kaler kantho',
      'kalerkantho',
      'কালের কণ্ঠ'
    ],

    home:
      'https://www.kalerkantho.com/',
  },


  {
    bnName:
      'যুগান্তর',

    domains: [
      'jugantor.com'
    ],

    aliases: [
      'jugantor',
      'যুগান্তর'
    ],

    home:
      'https://www.jugantor.com/',
  },


  {
    bnName:
      'দৈনিক ইত্তেফাক',

    domains: [
      'ittefaq.com.bd'
    ],

    aliases: [
      'ittefaq',
      'the daily ittefaq',
      'ইত্তেফাক',
      'দৈনিক ইত্তেফাক'
    ],

    home:
      'https://www.ittefaq.com.bd/',
  },


  {
    bnName:
      'সমকাল',

    domains: [
      'samakal.com'
    ],

    aliases: [
      'samakal',
      'সমকাল'
    ],

    home:
      'https://samakal.com/',
  },


  {
    bnName:
      'বাংলাদেশ প্রতিদিন',

    domains: [
      'bd-pratidin.com'
    ],

    aliases: [
      'bangladesh pratidin',
      'bd-pratidin',
      'বাংলাদেশ প্রতিদিন'
    ],

    home:
      'https://www.bd-pratidin.com/',
  },


  {
    bnName:
      'ঢাকা পোস্ট',

    domains: [
      'dhakapost.com'
    ],

    aliases: [
      'dhaka post',
      'dhakapost',
      'ঢাকা পোস্ট'
    ],

    home:
      'https://www.dhakapost.com/',
  },


  {
    bnName:
      'জাগো নিউজ২৪',

    domains: [
      'jagonews24.com'
    ],

    aliases: [
      'jago news 24',
      'jagonews24',
      'jago news',
      'জাগো নিউজ',
      'জাগো নিউজ২৪'
    ],

    home:
      'https://www.jagonews24.com/',
  },


  {
    bnName:
      'বাংলা ট্রিবিউন',

    domains: [
      'banglatribune.com'
    ],

    aliases: [
      'bangla tribune',
      'বাংলা ট্রিবিউন'
    ],

    home:
      'https://www.banglatribune.com/',
  },


  {
    bnName:
      'বাংলানিউজ২৪ ডটকম',

    domains: [
      'banglanews24.com'
    ],

    aliases: [
      'banglanews24',
      'banglanews24.com',
      'বাংলানিউজ২৪',
      'বাংলানিউজ'
    ],

    home:
      'https://www.banglanews24.com/',
  },


  {
    bnName:
      'বিডিনিউজ টোয়েন্টিফোর ডটকম',

    domains: [
      'bdnews24.com'
    ],

    aliases: [
      'bdnews24',
      'bdnews24.com',
      'বিডিনিউজ',
      'বিডিনিউজ টোয়েন্টিফোর'
    ],

    home:
      'https://bangla.bdnews24.com/',
  },


  {
    bnName:
      'দৈনিক ইনকিলাব',

    domains: [
      'dailyinqilab.com'
    ],

    aliases: [
      'daily inqilab',
      'inqilab',
      'ইনকিলাব',
      'দৈনিক ইনকিলাব'
    ],

    home:
      'https://dailyinqilab.com/',
  },


  {
    bnName:
      'নয়া দিগন্ত',

    domains: [
      'dailynayadiganta.com'
    ],

    aliases: [
      'naya diganta',
      'nayadiganta',
      'daily naya diganta',
      'নয়া দিগন্ত',
      'নয়াদিগন্ত'
    ],

    home:
      'https://www.dailynayadiganta.com/',
  },


  {
    bnName:
      'দ্য ডেইলি স্টার',

    domains: [
      'thedailystar.net'
    ],

    aliases: [
      'the daily star',
      'daily star',
      'দ্য ডেইলি স্টার'
    ],

    home:
      'https://bangla.thedailystar.net/',
  },


  {
    bnName:
      'দ্য বিজনেস স্ট্যান্ডার্ড',

    domains: [
      'tbsnews.net'
    ],

    aliases: [
      'the business standard',
      'tbs news',
      'tbsnews',
      'দ্য বিজনেস স্ট্যান্ডার্ড'
    ],

    home:
      'https://www.tbsnews.net/bangla',
  },


  {
    bnName:
      'ঢাকা ট্রিবিউন',

    domains: [
      'dhakatribune.com'
    ],

    aliases: [
      'dhaka tribune',
      'ঢাকা ট্রিবিউন'
    ],

    home:
      'https://www.dhakatribune.com/',
  },


  {
    bnName:
      'ইউএনবি',

    domains: [
      'unb.com.bd'
    ],

    aliases: [
      'unb',
      'united news of bangladesh',
      'ইউএনবি'
    ],

    home:
      'https://unb.com.bd/',
  },

];


// ================================================================
// HELPERS
// ================================================================

function clean(
  value = ''
) {

  return String(value)

    .replace(
      /\u00a0/g,
      ' '
    )

    .replace(
      /[\t\r\n]+/g,
      ' '
    )

    .replace(
      /\s{2,}/g,
      ' '
    )

    .trim();

}


function lower(
  value = ''
) {

  return clean(value)
    .toLowerCase();

}


function escapeRegExp(
  value = ''
) {

  return String(value)
    .replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

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
      'gclid',

    ].forEach(
      (key) =>
        url.searchParams.delete(
          key
        )
    );


    url.hash =
      '';


    return url.toString();

  }

  catch {

    return '';

  }

}


// ================================================================
// PUBLISHER DETECTION
// ================================================================

function findPublisherByName(
  name = ''
) {

  const value =
    lower(name);


  if (!value)
    return null;


  return (

    PUBLISHERS.find(
      (publisher) =>

        publisher.aliases.some(
          (alias) => {

            const a =
              lower(alias);


            return (
              value === a ||
              value.includes(a) ||
              a.includes(value)
            );

          }
        )

    ) ||

    null

  );

}


function findPublisherByUrl(
  rawUrl = ''
) {

  try {

    const host =
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
              host === domain ||
              host.endsWith(
                `.${domain}`
              )
          )

      ) ||

      null

    );

  }

  catch {

    return null;

  }

}


// ================================================================
// TITLE HELPERS
// ================================================================

function cleanRssTitle(
  title,
  sourceName
) {

  let value =
    clean(title);


  if (
    sourceName
  ) {

    value =
      value.replace(

        new RegExp(
          `\\s[-–—|:]\\s*${escapeRegExp(sourceName)}\\s*$`,
          'iu'
        ),

        ''

      );

  }


  return clean(value);

}


function normalizedTitle(
  title
) {

  return lower(title)

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
  title,
  sourceName
) {

  return crypto

    .createHash(
      'sha256'
    )

    .update(
      `${lower(sourceName)}|${normalizedTitle(title)}`
    )

    .digest(
      'hex'
    );

}


function tokenize(
  value
) {

  return lower(value)

    .replace(
      /[^\p{L}\p{N}\s]/gu,
      ' '
    )

    .split(
      /\s+/
    )

    .filter(
      (token) =>
        token.length >= 2
    );

}


function titleSimilarity(
  a,
  b
) {

  const left =
    new Set(
      tokenize(a)
    );


  const right =
    new Set(
      tokenize(b)
    );


  if (
    !left.size ||
    !right.size
  ) {

    return 0;

  }


  let common =
    0;


  for (
    const token
    of left
  ) {

    if (
      right.has(
        token
      )
    ) {

      common++;

    }

  }


  return (
    common /
    Math.min(
      left.size,
      right.size
    )
  );

}


// ================================================================
// NETWORK
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
          ),

        },

        signal:
          controller.signal,

      }
    );

  }

  finally {

    clearTimeout(
      timer
    );

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
        url,

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


// ================================================================
// GOOGLE NEWS FEEDS
// Agriculture is prioritised.
// More sections are included so homepage categories stay populated.
// ================================================================

const GOOGLE_FEEDS = [

  {
    category:
      'কৃষি',

    priority:
      4,

    query:
      'বাংলাদেশ কৃষি কৃষক ফসল ধান চাল গম ভুট্টা পাট সবজি ফল বীজ সার সেচ কৃষি মন্ত্রণালয় when:2d',
  },


  {
    category:
      'কৃষি',

    priority:
      4,

    query:
      'বাংলাদেশ মৎস্য মাছ চাষ পোলট্রি খামার কৃষি গবেষণা কৃষি প্রযুক্তি কৃষিপণ্য কৃষিবাজার when:2d',
  },


  {
    category:
      'বাংলাদেশ',

    priority:
      2,

    url:
      'https://news.google.com/rss?hl=bn&gl=BD&ceid=BD:bn',
  },


  {
    category:
      'বাংলাদেশ',

    priority:
      2,

    query:
      'বাংলাদেশ জাতীয় সংবাদ when:1d',
  },


  {
    category:
      'রাজনীতি',

    priority:
      2,

    query:
      'বাংলাদেশ রাজনীতি নির্বাচন সংসদ রাজনৈতিক দল when:1d',
  },


  {
    category:
      'আন্তর্জাতিক',

    priority:
      2,

    query:
      'বিশ্ব আন্তর্জাতিক জাতিসংঘ এশিয়া ইউরোপ আমেরিকা when:1d',
  },


  {
    category:
      'বাণিজ্য',

    priority:
      2,

    query:
      'বাংলাদেশ অর্থনীতি বাণিজ্য ব্যাংক শেয়ারবাজার ব্যবসা when:1d',
  },


  {
    category:
      'খেলাধুলা',

    priority:
      2,

    query:
      'বাংলাদেশ ক্রিকেট ফুটবল খেলাধুলা when:1d',
  },


  {
    category:
      'বিনোদন',

    priority:
      1,

    query:
      'বাংলাদেশ বিনোদন চলচ্চিত্র নাটক সংগীত when:2d',
  },


  {
    category:
      'আইন-আদালত',

    priority:
      2,

    query:
      'বাংলাদেশ আদালত হাইকোর্ট সুপ্রিম কোর্ট মামলা আইন when:2d',
  },


  {
    category:
      'শিক্ষা',

    priority:
      1,

    query:
      'বাংলাদেশ শিক্ষা বিশ্ববিদ্যালয় স্কুল কলেজ পরীক্ষা when:2d',
  },


  {
    category:
      'প্রযুক্তি',

    priority:
      1,

    query:
      'বাংলাদেশ প্রযুক্তি ইন্টারনেট সাইবার এআই when:2d',
  },


  {
    category:
      'স্বাস্থ্য',

    priority:
      1,

    query:
      'বাংলাদেশ স্বাস্থ্য চিকিৎসা হাসপাতাল রোগ when:2d',
  },


  {
    category:
      'জীবনযাপন',

    priority:
      1,

    query:
      'বাংলাদেশ জীবনযাপন খাদ্য ভ্রমণ ফ্যাশন when:3d',
  },


  {
    category:
      'চাকরি',

    priority:
      1,

    query:
      'বাংলাদেশ চাকরি নিয়োগ ক্যারিয়ার when:3d',
  },


  {
    category:
      'প্রবাস',

    priority:
      1,

    query:
      'বাংলাদেশ প্রবাসী অভিবাসন বিদেশে বাংলাদেশি when:2d',
  },


  {
    category:
      'পরিবেশ',

    priority:
      1,

    query:
      'বাংলাদেশ পরিবেশ জলবায়ু দূষণ নদী বন বন্যপ্রাণী when:2d',
  },


  {
    category:
      'বিজ্ঞান',

    priority:
      1,

    query:
      'বাংলাদেশ বিজ্ঞান গবেষণা মহাকাশ আবিষ্কার when:3d',
  },


  {
    category:
      'সংস্কৃতি',

    priority:
      1,

    query:
      'বাংলাদেশ সংস্কৃতি শিল্প ঐতিহ্য উৎসব when:3d',
  },


  {
    category:
      'ধর্ম',

    priority:
      1,

    query:
      'বাংলাদেশ ধর্ম ইসলাম হিন্দু বৌদ্ধ খ্রিস্টান when:3d',
  },

];


function feedUrl(
  feed
) {

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

  const items =
    [];


  const seen =
    new Set();


  for (
    const feed
    of GOOGLE_FEEDS
  ) {

    const fetched =
      await fetchText(

        feedUrl(
          feed
        ),

        {

          headers: {

            Accept:
              'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',

          },

        }

      );


    if (
      !fetched
    ) {

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
      (
        _,
        element
      ) => {

        if (
          items.length >=
          MAX_ITEMS_TO_INSPECT *
            3
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


        if (
          !publisher
        ) {

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


        if (
          seen.has(
            key
          )
        ) {

          return;

        }


        seen.add(
          key
        );


        const rawDate =
          clean(
            node
              .find('pubDate')
              .first()
              .text()
          );


        const parsedDate =
          rawDate
            ? new Date(
                rawDate
              )
            : null;


        items.push(
          {

            title,

            googleUrl,

            publisher,

            categoryHint:
              feed.category,

            priority:
              Number(
                feed.priority ||
                  1
              ),

            googlePubDate:
              parsedDate &&
              !Number.isNaN(
                parsedDate.getTime()
              )
                ? parsedDate
                : null,

          }
        );

      }
    );


    await delay(
      160
    );

  }


  items.sort(
    (
      a,
      b
    ) => {

      const priorityDiff =
        (
          b.priority ||
          1
        ) -
        (
          a.priority ||
          1
        );


      if (
        priorityDiff !== 0
      ) {

        return priorityDiff;

      }


      return (
        (
          b.googlePubDate?.getTime() ||
          0
        ) -
        (
          a.googlePubDate?.getTime() ||
          0
        )
      );

    }
  );


  return items.slice(
    0,
    MAX_ITEMS_TO_INSPECT
  );

}


// ================================================================
// GOOGLE NEWS URL RESOLUTION
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


    const index =
      parts.findIndex(
        (part) =>
          part ===
            'articles' ||
          part ===
            'read'
      );


    if (
      index >= 0 &&
      parts[
        index + 1
      ]
    ) {

      return parts[
        index + 1
      ];

    }


    return (
      parts[
        parts.length - 1
      ] ||
      ''
    );

  }

  catch {

    return '';

  }

}


// ================================================================
// OLD / OFFLINE GOOGLE DECODER
// ================================================================

function tryOfflineGoogleDecode(
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
            (
              base64.length %
              4
            )
          ) %
          4
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
          buffer.length -
            3
        )
        .equals(
          suffix
        )

    ) {

      buffer =
        buffer.subarray(
          0,
          buffer.length -
            3
        );

    }


    let position =
      0;


    let length =
      0;


    let shift =
      0;


    while (

      position <
        buffer.length &&

      shift <=
        28

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


      shift +=
        7;

    }


    if (

      length <=
        0 ||

      position +
        length >
        buffer.length

    ) {

      return '';

    }


    const text =
      buffer
        .subarray(
          position,
          position + length
        )
        .toString(
          'utf8'
        );


    return (
      /^https?:\/\//i.test(
        text
      )
        ? text
        : ''
    );

  }

  catch {

    return '';

  }

}


// ================================================================
// GOOGLE BATCHEXECUTE RESPONSE
// ================================================================

function parseBatchExecuteResponse(
  text
) {

  const raw =
    String(
      text
    );


  const candidates =
    [];


  const cleaned =
    raw
      .replace(
        /^\)\]\}'\s*/,
        ''
      )
      .trim();


  if (
    cleaned
  ) {

    candidates.push(
      cleaned
    );

  }


  for (
    const block
    of raw.split(
      '\n\n'
    )
  ) {

    const piece =
      block
        .replace(
          /^\)\]\}'\s*/,
          ''
        )
        .trim();


    if (
      piece
    ) {

      candidates.push(
        piece
      );

    }

  }


  for (
    const line
    of raw.split(
      '\n'
    )
  ) {

    const piece =
      line
        .replace(
          /^\)\]\}'\s*/,
          ''
        )
        .trim();


    if (
      piece.startsWith(
        '['
      )
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

    const start =
      candidate.indexOf(
        '['
      );


    if (
      start < 0
    ) {

      continue;

    }


    try {

      const parsed =
        JSON.parse(
          candidate.slice(
            start
          )
        );


      const rows =
        Array.isArray(
          parsed[0]
        )
          ? parsed[0]
          : parsed;


      for (
        const row
        of rows
      ) {

        if (
          !Array.isArray(
            row
          ) ||
          typeof row[2] !==
            'string'
        ) {

          continue;

        }


        try {

          const inner =
            JSON.parse(
              row[2]
            );


          if (

            Array.isArray(
              inner
            ) &&

            inner[0] ===
              'garturlres' &&

            typeof inner[1] ===
              'string'

          ) {

            return inner[1];

          }

        }

        catch {

          // continue

        }

      }

    }

    catch {

      // continue

    }

  }


  const match =
    raw.match(
      /\[\\"garturlres\\",\\"(https?:\\\/\\\/[^"]+)/i
    );


  if (
    !match
  ) {

    return '';

  }


  return match[1]

    .replace(
      /\\\//g,
      '/'
    )

    .replace(
      /\\u003d/g,
      '='
    )

    .replace(
      /\\u0026/g,
      '&'
    );

}


// ================================================================
// GOOGLE DATA-P DECODER
// ================================================================

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


  if (
    !fetched
  ) {

    return '';

  }


  const $ =
    cheerio.load(
      fetched.text
    );


  const dataP =
    $(
      'c-wiz[data-p]'
    )
      .first()
      .attr(
        'data-p'
      );


  if (
    !dataP
  ) {

    return '';

  }


  let requestObject;


  try {

    requestObject =
      JSON.parse(

        dataP.replace(
          '%.@.',
          '["garturlreq",'
        )

      );

  }

  catch {

    return '';

  }


  if (

    !Array.isArray(
      requestObject
    ) ||

    requestObject.length <
      8

  ) {

    return '';

  }


  const compact =
    requestObject
      .slice(
        0,
        -6
      )
      .concat(
        requestObject.slice(
          -2
        )
      );


  const rpc = [

    'Fbv4je',

    JSON.stringify(
      compact
    ),

    null,

    'generic',

  ];


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

        body:
          new URLSearchParams(
            {

              'f.req':
                JSON.stringify(
                  [
                    [
                      rpc
                    ]
                  ]
                ),

            }
          ).toString(),

      }

    );


  if (
    !response.ok
  ) {

    return '';

  }


  return parseBatchExecuteResponse(
    await response.text()
  );

}


// ================================================================
// SIGNED GOOGLE URL DECODER
// ================================================================

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


    if (
      !fetched
    ) {

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


    if (
      !node.length
    ) {

      node =
        $(
          'c-wiz > div[data-n-a-sg][data-n-a-ts]'
        ).first();

    }


    if (
      !node.length
    ) {

      continue;

    }


    const dataId =
      node.attr(
        'data-n-a-id'
      ) ||
      articleId;


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


    const request = [

      'garturlreq',

      [

        [
          'X',
          'X',
          [
            'X',
            'X'
          ],
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

        [
          1,
          1,
          1
        ],

        1,

        1,

        null,

        0,

        0,

        null,

        0,

      ],

      dataId,

      Number(
        timestamp
      ),

      signature,

    ];


    const rpc = [

      'Fbv4je',

      JSON.stringify(
        request
      ),

      null,

      'generic',

    ];


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

          body:
            new URLSearchParams(
              {

                'f.req':
                  JSON.stringify(
                    [
                      [
                        rpc
                      ]
                    ]
                  ),

              }
            ).toString(),

        }

      );


    if (
      !response.ok
    ) {

      continue;

    }


    const decoded =
      parseBatchExecuteResponse(
        await response.text()
      );


    if (
      decoded
    ) {

      return decoded;

    }

  }


  return '';

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
    !findPublisherByUrl(
      url
    )
  ) {

    return false;

  }


  const value =
    url.toLowerCase();


  const blocked = [

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
    blocked.some(
      (part) =>
        value.includes(
          part
        )
    )
  ) {

    return false;

  }


  return (
    findPublisherByUrl(
      url
    )?.bnName ===
    publisher.bnName
  );

}


// ================================================================
// PUBLISHER HOMEPAGE TITLE FALLBACK
// ================================================================

async function findPublisherUrlByTitle(
  item
) {

  const fetched =
    await fetchText(
      item.publisher.home
    );


  if (
    !fetched
  ) {

    return '';

  }


  const $ =
    cheerio.load(
      fetched.text
    );


  let best = {

    url:
      '',

    score:
      0,

  };


  $('a[href]').each(
    (
      _,
      element
    ) => {

      const anchorText =
        clean(
          $(element)
            .text()
        );


      if (
        anchorText.length <
        8
      ) {

        return;

      }


      const url =
        absoluteUrl(

          $(element)
            .attr(
              'href'
            ),

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
    best.score >=
      0.58

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


  if (
    !articleId
  ) {

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

    () =>
      decodeWithDataP(
        rawUrl
      ),

    () =>
      decodeWithSignedParams(
        rawUrl,
        articleId
      ),

    () =>
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

    }

    catch {

      // try next resolver

    }

  }


  console.log(
    `⚠️ Google URL resolve failed: ${item.publisher.bnName}`
  );


  return '';

}


// ================================================================
// ORIGINAL ARTICLE METADATA
// Used for validation/date/category only.
// Publisher body/description is not stored publicly.
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
          .attr(
            'content'
          );


      if (
        value &&
        clean(value)
      ) {

        return clean(
          value
        );

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

  const output =
    [];


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
      value[
        '@graph'
      ]
    ) {

      walk(
        value[
          '@graph'
        ]
      );

    }

  }


  $(
    'script[type="application/ld+json"]'
  ).each(
    (
      _,
      element
    ) => {

      const raw =
        $(element)
          .contents()
          .text()
          .trim();


      if (
        !raw
      ) {

        return;

      }


      try {

        walk(
          JSON.parse(
            raw
          )
        );

      }

      catch {

        // invalid JSON-LD ignored

      }

    }
  );


  return output;

}


function articleJsonLd(
  $
) {

  const allowed =
    new Set(
      [
        'NewsArticle',
        'Article',
        'ReportageNewsArticle',
        'LiveBlogPosting',
      ]
    );


  return (

    jsonLdNodes(
      $
    )
      .find(
        (
          node
        ) => {

          const type =
            node[
              '@type'
            ];


          return (
            Array.isArray(
              type
            )

              ? type.some(
                  (
                    value
                  ) =>
                    allowed.has(
                      value
                    )
                )

              : allowed.has(
                  type
                )
          );

        }
      ) ||

    null

  );

}


// ================================================================
// CANONICAL URL
// ================================================================

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
      [
        'og:title'
      ]
    ) ||

    getMeta(
      $,
      [
        'twitter:title'
      ]
    ) ||

    clean(
      $(
        'article h1'
      )
        .first()
        .text()
    ) ||

    clean(
      $(
        'main h1'
      )
        .first()
        .text()
    ) ||

    clean(
      $(
        'h1'
      )
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


// ================================================================
// ARTICLE CONTEXT
// Only used internally for classification.
// It is NOT stored as the public article body.
// ================================================================

function articleContext(
  $,
  json
) {

  const description =

    clean(
      json?.description ||
      ''
    ) ||

    getMeta(
      $,
      [
        'og:description'
      ]
    ) ||

    getMeta(
      $,
      [
        'twitter:description'
      ]
    ) ||

    getMeta(
      $,
      [
        'description'
      ]
    );


  if (
    description
  ) {

    return description;

  }


  const firstParagraph =
    clean(

      $(
        'article p, [class*="article"] p, [class*="story"] p, main p'
      )

        .filter(
          (
            _,
            element
          ) =>
            clean(
              $(element)
                .text()
            ).length >=
            40
        )

        .first()
        .text()

    );


  return firstParagraph;

}


// ================================================================
// PUBLISHED DATE
// ================================================================

function parseDate(
  value
) {

  if (
    !value
  ) {

    return null;

  }


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
      [
        'article:published_time'
      ]
    ),

    getMeta(
      $,
      [
        'datePublished'
      ]
    ),

    $(
      'time[datetime]'
    )
      .first()
      .attr(
        'datetime'
      ),

  ];


  for (
    const value
    of values
  ) {

    const date =
      parseDate(
        value
      );


    if (
      date
    ) {

      return date;

    }

  }


  return (
    rssDate ||
    null
  );

}


// ================================================================
// TOPIC / LANDING PAGE FILTER
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
  new Set(
    [
      'করোনাভাইরাস মহামারী',
      'মুজিব শতবর্ষ',
      'সমগ্র বাংলাদেশ',
      'বাজেট ২০২৬-২৭',
    ]
  );


function isLandingOrTopicPage(
  pageUrl,
  $,
  articleJson,
  pageTitle,
  rssTitle
) {

  try {

    const pathname =
      new URL(
        pageUrl
      )
        .pathname
        .toLowerCase();


    if (
      BLOCKED_PAGE_PATHS.some(
        (
          part
        ) =>
          pathname.includes(
            part
          )
      )
    ) {

      return true;

    }


    if (
      KNOWN_BAD_TOPIC_TITLES.has(
        clean(
          pageTitle
        )
      )
    ) {

      return true;

    }


    const hasArticleSignal =
      Boolean(
        articleJson
      ) ||
      $(
        'article'
      ).length >
        0;


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
          .attr(
            'datetime'
          )

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
        rssTitle
      ) <
      0.34
    );

  }

  catch {

    return true;

  }

}


// ================================================================
// CATEGORY DETECTION
// ================================================================

const CATEGORY_RULES = {

  কৃষি: [

    'কৃষি',
    'কৃষক',
    'ফসল',
    'ধান',
    'চাল',
    'গম',
    'ভুট্টা',
    'পাট',
    'সবজি',
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

  ],


  খেলাধুলা: [

    'ক্রিকেট',
    'ফুটবল',
    'ম্যাচ',
    'টেস্ট',
    'ওয়ানডে',
    'বিশ্বকাপ',
    'বিসিবি',
    'ফিফা',

  ],


  বাণিজ্য: [

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
    'ব্যবসা',

  ],


  রাজনীতি: [

    'বিএনপি',
    'আওয়ামী লীগ',
    'জামায়াত',
    'নির্বাচন',
    'ভোট',
    'রাজনীতি',
    'সংসদ',
    'প্রার্থী',

  ],


  'আইন-আদালত': [

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


  প্রযুক্তি: [

    'প্রযুক্তি',
    'স্মার্টফোন',
    'ইন্টারনেট',
    'গুগল',
    'মাইক্রোসফট',
    'কৃত্রিম বুদ্ধিমত্তা',
    'এআই',
    'সাইবার',

  ],


  বিনোদন: [

    'সিনেমা',
    'অভিনেতা',
    'অভিনেত্রী',
    'নায়ক',
    'নায়িকা',
    'নাটক',
    'চলচ্চিত্র',
    'বলিউড',
    'হলিউড',
    'সংগীত',

  ],


  শিক্ষা: [

    'বিশ্ববিদ্যালয়',
    'শিক্ষা',
    'স্কুল',
    'কলেজ',
    'শিক্ষার্থী',
    'পরীক্ষা',
    'ভর্তি',
    'শিক্ষক',

  ],


  চাকরি: [

    'চাকরি',
    'নিয়োগ',
    'ক্যারিয়ার',
    'বেতন',
    'পদসংখ্যা',

  ],


  স্বাস্থ্য: [

    'স্বাস্থ্য',
    'চিকিৎসা',
    'হাসপাতাল',
    'চিকিৎসক',
    'রোগ',
    'ওষুধ',

  ],


  প্রবাস: [

    'প্রবাস',
    'প্রবাসী',
    'অভিবাসন',
    'রেমিট্যান্স',
    'বিদেশে বাংলাদেশি',

  ],


  পরিবেশ: [

    'পরিবেশ',
    'জলবায়ু',
    'দূষণ',
    'নদী',
    'বন',
    'বন্যপ্রাণী',
    'ঘূর্ণিঝড়',
    'তাপপ্রবাহ',

  ],


  বিজ্ঞান: [

    'বিজ্ঞান',
    'গবেষণা',
    'মহাকাশ',
    'উপগ্রহ',
    'আবিষ্কার',
    'বিজ্ঞানী',

  ],


  সংস্কৃতি: [

    'সংস্কৃতি',
    'শিল্প',
    'ঐতিহ্য',
    'উৎসব',
    'চিত্রকলা',
    'নৃত্য',

  ],


  ধর্ম: [

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


  জীবনযাপন: [

    'জীবনযাপন',
    'খাদ্য',
    'রেসিপি',
    'ফ্যাশন',
    'ভ্রমণ',
    'লাইফস্টাইল',

  ],


  আন্তর্জাতিক: [

    'যুক্তরাষ্ট্র',
    'ভারত',
    'চীন',
    'রাশিয়া',
    'ইউক্রেন',
    'গাজা',
    'ইসরায়েল',
    'পাকিস্তান',
    'জাতিসংঘ',
    'ইরান',
    'নেপাল',
    'মিয়ানমার',

  ],

};


function hasCategorySignal(
  category,
  title,
  context
) {

  const words =
    CATEGORY_RULES[
      category
    ] ||
    [];


  const text =
    lower(
      `${title} ${context}`
    );


  return words.some(
    (
      word
    ) =>
      text.includes(
        lower(
          word
        )
      )
  );

}


function detectCategory(
  title,
  context,
  hint = 'বাংলাদেশ'
) {

  const text =
    lower(
      `${title} ${context}`
    );


  if (

    CATEGORY_RULES[
      hint
    ] &&

    hasCategorySignal(
      hint,
      title,
      context
    )

  ) {

    return hint;

  }


  let best =
    hint ===
      'কৃষি'

      ? 'বাংলাদেশ'

      : hint;


  let bestScore =
    0;


  for (
    const [
      category,
      words
    ]
    of Object.entries(
      CATEGORY_RULES
    )
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
              lower(
                word
              )
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

  বাংলাদেশ:
    7,

  রাজনীতি:
    4,

  আন্তর্জাতিক:
    4,

  'আইন-আদালত':
    3,

  বাণিজ্য:
    4,

  খেলাধুলা:
    4,

  কৃষি:
    4,

  বিনোদন:
    3,

  প্রযুক্তি:
    3,

  শিক্ষা:
    3,

  স্বাস্থ্য:
    3,

  জীবনযাপন:
    2,

  চাকরি:
    2,

  প্রবাস:
    3,

  পরিবেশ:
    3,

  বিজ্ঞান:
    2,

  সংস্কৃতি:
    2,

  ধর্ম:
    2,

};


// ================================================================
// ARTICLE AGE
// ================================================================

function tooOld(
  date
) {

  if (
    !date
  ) {

    return false;

  }


  const age =
    Date.now() -
    date.getTime();


  return (
    age >=
      0 &&

    age >
      MAX_ARTICLE_AGE_HOURS *
      60 *
      60 *
      1000
  );

}


// ================================================================
// IMPORTANCE
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
    ]
      .includes(
        category
      )

      ? 7

      : 6;


  const importantWords = [

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
    of importantWords
  ) {

    if (
      lower(
        title
      )
        .includes(
          lower(
            word
          )
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
// EXTRACT ARTICLE
// ================================================================

async function extractArticle(
  item
) {

  const resolved =
    await resolveGoogleUrl(
      item
    );


  if (
    !resolved
  ) {

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


  if (
    !fetched
  ) {

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
    ) ||

    publisher;


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

    title.length <
      10 ||

    title.length >
      260

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


  const context =
    articleContext(
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


  // Strict agriculture filtering.

  if (

    item.categoryHint ===
      'কৃষি' &&

    !hasCategorySignal(
      'কৃষি',
      title,
      context
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


  const category =
    detectCategory(
      title,
      context,
      item.categoryHint
    );


  const importanceScore =
    importance(
      title,
      category
    );


  /*
    IMPORTANT:

    Publisher-এর paragraph, article body বা meta-description
    database-এর public content হিসেবে save করা হচ্ছে না।

    কেবল একটি neutral aggregator preview তৈরি করা হচ্ছে।
  */

  const safePreview =

    `${finalPublisher.bnName}-এর প্রতিবেদনে “${title}” বিষয়ে তথ্য প্রকাশিত হয়েছে। ` +

    'বিস্তারিত জানতে মূল প্রতিবেদনে যান।';


  return {

    title,


    content:
      safePreview,


    snippet:

      safePreview.length >
        220

        ?

        `${safePreview.substring(
          0,
          220
        )}…`

        :

        safePreview,


    /*
      Third-party image deliberately OFF.

      Homepage code-generated editorial visual দেখাবে।
    */

    image_url:
      null,


    image_source:
      null,


    source_url:
      pageUrl,


    source_name:
      finalPublisher.bnName,


    category,


    is_published:
      true,


    is_custom:
      false,


    is_lead:
      importanceScore >=
      9,


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
      )
        .toISOString(),

  };

}


// ================================================================
// DUPLICATE CHECK
// ================================================================

async function alreadyExists(
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
    (
      urlCount ||
      0
    ) >
    0
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
    (
      hashCount ||
      0
    ) >
    0
  );

}


// ================================================================
// CLEAN OLD BAD TOPIC CARDS
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
      error
    } =

      await supabase

        .from(
          'news'
        )

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
        (
          row
        ) =>
          row.id
      );


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
            is_published:
              false,
          }
        )

        .in(
          'id',
          ids
        );


    if (
      !updateError
    ) {

      console.log(
        `🧹 ${ids.length}টি পুরোনো ভুল topic card hide করা হয়েছে।`
      );

    }

  }

  catch (
    error
  ) {

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
    '🚀 বঙ্গীয় টাইমস Aggregator শুরু...'
  );


  console.log(
    '🔎 Discovery = Google News RSS'
  );


  console.log(
    '🔗 Destination = original publisher'
  );


  console.log(
    '🌾 Agriculture = dedicated Google News feeds + strict filter'
  );


  console.log(
    '🖼️ Third-party publisher images = OFF'
  );


  console.log(
    '🎨 Frontend visual = code-generated editorial artwork'
  );


  console.log(
    '📝 Publisher article body/meta description = NOT republished'
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


  const categoryCounts =
    {};


  let published =
    0;


  let inspected =
    0;


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
          item
        );


      if (
        !article
      ) {

        continue;

      }


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
        await alreadyExists(
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


      await delay(
        400
      );

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
    `\n🎉 কাজ শেষ। মোট নতুন সংবাদ: ${published}`
  );


  console.log(
    `🌾 কৃষি প্রকাশ: ${categoryCounts['কৃষি'] || 0}`
  );


  if (
    !published
  ) {

    console.log(

      'ℹ️ ০ হলে সম্ভাব্য কারণ: ' +

      'সব খবর duplicate, ' +

      'Google URL resolve হয়নি, ' +

      'publisher page block করেছে, ' +

      'অথবা সব candidate validation-এ বাদ গেছে।'

    );

  }

}


// ================================================================
// START
// ================================================================

runBot()

  .catch(
    (
      error
    ) => {

      console.error(
        '❌ Fatal scraper error:',
        error
      );


      process.exit(
        1
      );

    }
  );
