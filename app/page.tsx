import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import ClientTabs from './components/ClientTabs';
import SafeImage from './components/SafeImage';
import LocationFilter from './components/LocationFilter';
export const revalidate = 60;

type NewsItem = {
  id: string | number;
  title?: string | null;
  original_title?: string | null;
  source_title?: string | null;
  headline?: string | null;
  category?: string | null;
  created_at?: string | null;
  image_url?: string | null;
  snippet?: string | null;
  description?: string | null;
  summary?: string | null;
  excerpt?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  source_home_url?: string | null;
  original_url?: string | null;
  url?: string | null;
  link?: string | null;
  article_url?: string | null;
  is_published?: boolean | null;
  [key: string]: any;
};

function formatDateTime(dateString?: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 60) return `${diffMins} মিনিট আগে`;
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;

  return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}

const NATIONAL_PUBLISHERS = [
  { bn: 'প্রথম আলো', aliases: ['prothom alo', 'প্রথম আলো'], domains: ['prothomalo.com'] },
  { bn: 'কালের কণ্ঠ', aliases: ['kaler kantho', 'কালের কণ্ঠ'], domains: ['kalerkantho.com'] },
  { bn: 'যুগান্তর', aliases: ['jugantor', 'যুগান্তর'], domains: ['jugantor.com'] },
  { bn: 'দৈনিক ইত্তেফাক', aliases: ['ittefaq', 'the daily ittefaq', 'দৈনিক ইত্তেফাক', 'ইত্তেফাক'], domains: ['ittefaq.com.bd'] },
  { bn: 'সমকাল', aliases: ['samakal', 'সমকাল'], domains: ['samakal.com'] },
  { bn: 'বাংলাদেশ প্রতিদিন', aliases: ['bd pratidin', 'bangladesh pratidin', 'বাংলাদেশ প্রতিদিন'], domains: ['bd-pratidin.com'] },
  { bn: 'বিডিনিউজ টোয়েন্টিফোর ডটকম', aliases: ['bdnews24.com', 'bdnews24', 'বিডিনিউজ২৪', 'বিডিনিউজ টোয়েন্টিফোর ডটকম'], domains: ['bdnews24.com'] },
  { bn: 'বাংলানিউজ২৪ ডটকম', aliases: ['banglanews24.com', 'banglanews24', 'বাংলানিউজ২৪', 'বাংলানিউজ২৪ ডটকম'], domains: ['banglanews24.com'] },
  { bn: 'জাগো নিউজ২৪', aliases: ['jagonews24', 'jago news 24', 'jago news', 'জাগো নিউজ', 'জাগো নিউজ২৪'], domains: ['jagonews24.com'] },
  { bn: 'ঢাকা পোস্ট', aliases: ['dhaka post', 'ঢাকা পোস্ট'], domains: ['dhakapost.com'] },
  { bn: 'দৈনিক ইনকিলাব', aliases: ['inqilab', 'daily inqilab', 'দৈনিক ইনকিলাব', 'ইনকিলাব'], domains: ['dailyinqilab.com'] },
  { bn: 'নয়া দিগন্ত', aliases: ['naya diganta', 'daily naya diganta', 'nayadiganta', 'নয়া দিগন্ত', 'নয়াদিগন্ত'], domains: ['dailynayadiganta.com'] },
  { bn: 'দ্য ডেইলি স্টার', aliases: ['the daily star', 'daily star', 'দ্য ডেইলি স্টার'], domains: ['thedailystar.net'] },
  { bn: 'ঢাকা ট্রিবিউন', aliases: ['dhaka tribune', 'ঢাকা ট্রিবিউন'], domains: ['dhakatribune.com'] },
  { bn: 'দ্য বিজনেস স্ট্যান্ডার্ড', aliases: ['the business standard', 'business standard', 'দ্য বিজনেস স্ট্যান্ডার্ড'], domains: ['tbsnews.net'] },
  { bn: 'বাংলা ট্রিবিউন', aliases: ['bangla tribune', 'বাংলা ট্রিবিউন'], domains: ['banglatribune.com'] },
  { bn: 'সময় সংবাদ', aliases: ['somoy news', 'somoy tv', 'সময় সংবাদ', 'সময় টিভি'], domains: ['somoynews.tv'] },
  { bn: 'যমুনা টেলিভিশন', aliases: ['jamuna tv', 'jamuna television', 'যমুনা টিভি', 'যমুনা টেলিভিশন'], domains: ['jamuna.tv'] },
  { bn: 'চ্যানেল ২৪', aliases: ['channel 24', 'channel24', 'চ্যানেল ২৪'], domains: ['channel24bd.tv'] },
  { bn: 'ইন্ডিপেনডেন্ট টেলিভিশন', aliases: ['independent television', 'independent tv', 'ইন্ডিপেনডেন্ট টেলিভিশন'], domains: ['independent24.com'] },
  { bn: 'একাত্তর টেলিভিশন', aliases: ['ekattor tv', '71 tv', 'একাত্তর টিভি', 'একাত্তর টেলিভিশন'], domains: ['ekattor.tv'] },
  { bn: 'এনটিভি অনলাইন', aliases: ['ntv online', 'ntv', 'এনটিভি অনলাইন'], domains: ['ntvbd.com'] },
  { bn: 'আরটিভি নিউজ', aliases: ['rtv online', 'rtv news', 'আরটিভি', 'আরটিভি নিউজ'], domains: ['rtvonline.com'] },
  { bn: 'নেত্র নিউজ', aliases: ['netra news', 'নেত্র নিউজ'], domains: ['netra.news'] },
];

function cleanDisplayText(value: string) {
  return String(value || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/www\.\S+/gi, ' ')
    .replace(/#[\p{L}\p{N}_-]+/gu, ' ')
    .replace(/\s*\|\s*$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeHostname(value?: string | null) {
  if (!value) return '';
  try {
    return new URL(value).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function publisherFromDomain(url?: string | null) {
  const host = safeHostname(url);
  if (!host) return null;
  return NATIONAL_PUBLISHERS.find((publisher) =>
    publisher.domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
  ) || null;
}

function publisherFromName(value?: string | null) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  return NATIONAL_PUBLISHERS.find((publisher) =>
    publisher.aliases.some((alias) => raw === alias.toLowerCase() || raw.includes(alias.toLowerCase()))
  ) || null;
}

function resolveBanglaPublisherName(rawName?: string | null, sourceHomeUrl?: string | null, articleUrl?: string | null) {
  const byDomain = publisherFromDomain(sourceHomeUrl) || publisherFromDomain(articleUrl);
  const byName = publisherFromName(rawName);
  const found = byDomain || byName;
  if (found) return found.bn;

  const raw = String(rawName || '').trim();
  if (raw === 'বঙ্গীয় টাইমস' || raw === 'বঙ্গীয় টাইমস') return 'বঙ্গীয় টাইমস';
  if (/[\u0980-\u09FF]/.test(raw)) return raw;
  return raw || 'সংবাদ উৎস';
}

function isNationalPublisher(rawName?: string | null, sourceHomeUrl?: string | null) {
  return Boolean(publisherFromDomain(sourceHomeUrl) || publisherFromName(rawName));
}

function getNewsTitle(news: NewsItem | null | undefined) {
  if (!news) return '';
  return cleanDisplayText(String(
    news.original_title ||
    news.source_title ||
    news.headline ||
    news.title ||
    ''
  ));
}

function getNewsSource(news: NewsItem | null | undefined) {
  if (!news) return 'সংবাদ উৎস';
  const rawName = String(news.source_name || news.publisher || news.source || '').trim();
  const articleUrl = String(news.original_url || news.article_url || news.url || news.link || news.source_url || '').trim();

  // Old scraper rows used “বঙ্গীয় টাইমস” as source_name even when the article
  // belonged to another publisher. Prefer the publisher domain in that case.
  if ((rawName === 'বঙ্গীয় টাইমস' || rawName === 'বঙ্গীয় টাইমস') && publisherFromDomain(articleUrl)) {
    return resolveBanglaPublisherName('', null, articleUrl);
  }

  return resolveBanglaPublisherName(rawName, news.source_home_url, articleUrl);
}

function getNewsSnippet(news: NewsItem | null | undefined) {
  if (!news) return '';
  const raw = String(news.snippet || news.description || news.summary || news.excerpt || '');
  return cleanDisplayText(raw).slice(0, 260);
}

function getNewsImage(news: NewsItem | null | undefined): string {
  if (!news) return '';
  const image = typeof news.image_url === 'string' ? news.image_url.trim() : '';
  return /^https?:\/\//i.test(image) ? image : '';
}

function NewsImage({ news, className }: { news: NewsItem | null | undefined; className: string }) {
  const src = getNewsImage(news);
  if (src) {
    return <SafeImage src={src} alt={getNewsTitle(news)} className={className} />;
  }

  return (
    <div className={`${className} bg-[#f3f5f7] border border-gray-200 flex items-center justify-center overflow-hidden`}>
      <div className="px-3 text-center">
        <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-[#104f96] text-white flex items-center justify-center text-sm font-bold">বি</div>
        <span className="text-[12px] md:text-[13px] font-bold text-gray-500 leading-snug">{getNewsSource(news)}</span>
      </div>
    </div>
  );
}

function getNewsHref(news: NewsItem | null | undefined) {
  if (!news) return '#';
  const candidates = [
    news.source_url,
    news.original_url,
    news.article_url,
    news.url,
    news.link,
    news.original_link,
    news.news_url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const value = candidate.trim();
    if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  }

  return `/news/${news.id}`;
}

function formatNewsMeta(news: NewsItem | null | undefined) {
  if (!news) return '';
  const source = getNewsSource(news);
  const time = formatDateTime(news.created_at);
  return [source, time].filter(Boolean).join(' • ');
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripHtml(value: string) {
  return decodeXmlEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readXmlTag(block: string, tag: string) {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(pattern);
  return match ? decodeXmlEntities(match[1]).trim() : '';
}

function readXmlTagAttribute(block: string, tag: string, attribute: string) {
  const pattern = new RegExp(`<${tag}[^>]*\\s${attribute}=["']([^"']+)["'][^>]*>`, 'i');
  const match = block.match(pattern);
  return match ? decodeXmlEntities(match[1]).trim() : '';
}

function extractRssImage(block: string, description: string) {
  const candidates = [
    block.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1],
    block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1],
    block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\//i)?.[1],
    description.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1],
  ];

  for (const candidate of candidates) {
    if (candidate && /^https?:\/\//i.test(candidate)) return decodeXmlEntities(candidate);
  }
  return '';
}

function simpleHash(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function cleanGoogleNewsTitle(rawTitle: string, sourceName: string) {
  const title = rawTitle.trim();
  if (!sourceName) return cleanDisplayText(title);
  const escaped = sourceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return cleanDisplayText(title.replace(new RegExp(`\\s+-\\s+${escaped}\\s*$`, 'i'), ''));
}

function parseGoogleNewsRss(xml: string, category: string, limit: number): NewsItem[] {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  const items: NewsItem[] = [];

  for (const block of blocks) {
    if (items.length >= limit) break;

    const rawTitle = readXmlTag(block, 'title');
    const sourceRawName = readXmlTag(block, 'source') || '';
    const sourceHomeUrl = readXmlTagAttribute(block, 'source', 'url');

    // Keep the live fallback focused on established Bangladeshi national outlets.
    if (!isNationalPublisher(sourceRawName, sourceHomeUrl)) continue;

    const sourceName = resolveBanglaPublisherName(sourceRawName, sourceHomeUrl);
    const link = readXmlTag(block, 'link');
    const descriptionHtml = readXmlTag(block, 'description');
    const publishedRaw = readXmlTag(block, 'pubDate');
    const parsedDate = publishedRaw ? new Date(publishedRaw) : new Date();
    const createdAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
    const title = cleanGoogleNewsTitle(rawTitle, sourceRawName);

    if (!title || !link) continue;

    items.push({
      id: `gnews-${simpleHash(link || `${title}-${createdAt}`)}`,
      title,
      original_title: title,
      category: category || 'সর্বশেষ',
      created_at: createdAt,
      image_url: extractRssImage(block, descriptionHtml),
      snippet: cleanDisplayText(stripHtml(descriptionHtml)).slice(0, 220),
      source_name: sourceName,
      source_home_url: sourceHomeUrl,
      source_url: link,
      is_published: true,
      feed_source: 'google-news-rss',
    });
  }

  return items;
}

async function fetchGoogleNewsFeed(query: string, category: string, limit = 40): Promise<NewsItem[]> {
  const cleanQuery = query.trim();
  const url = cleanQuery
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(cleanQuery)}&hl=bn&gl=BD&ceid=BD:bn`
    : 'https://news.google.com/rss?hl=bn&gl=BD&ceid=BD:bn';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BongiyoTimes/1.0; +https://bongiyo-times.vercel.app)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 600 },
    });

    if (!response.ok) return [];
    const xml = await response.text();
    return parseGoogleNewsRss(xml, category, limit);
  } catch (error) {
    console.error('Google News RSS fetch failed:', error);
    return [];
  }
}

function mergeNews(...lists: NewsItem[][]): NewsItem[] {
  const map = new Map<string, NewsItem>();

  for (const list of lists) {
    for (const item of list) {
      if (!item) continue;
      const title = getNewsTitle(item).toLowerCase().replace(/\s+/g, ' ').trim();
      const href = getNewsHref(item).toLowerCase().trim();
      const key = href.startsWith('http') ? href : `${title}|${getNewsSource(item).toLowerCase()}`;
      if (!key || map.has(key)) continue;
      map.set(key, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

function isFreshEnough(items: NewsItem[], minutes = 90) {
  if (!items.length) return false;
  const newest = items.reduce((max, item) => {
    const time = item.created_at ? new Date(item.created_at).getTime() : 0;
    return Math.max(max, Number.isNaN(time) ? 0 : time);
  }, 0);
  return newest > 0 && Date.now() - newest <= minutes * 60 * 1000;
}

function normalizeOptionalUrl(value: FormDataEntryValue | null) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text)) return text;
  return `https://${text}`;
}

function isMissingColumnError(error: any, column: string) {
  const message = String(error?.message || '').toLowerCase();
  const target = column.toLowerCase();
  return message.includes(target) && (message.includes('column') || message.includes('schema cache'));
}

async function publishCustomNews(formData: FormData) {
  'use server';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    redirect('/?upload=1&upload_status=config_error');
  }

  const title = String(formData.get('title') || '').trim();
  const category = String(formData.get('category') || 'বাংলাদেশ').trim();
  const snippet = String(formData.get('snippet') || '').trim();
  const sourceName = String(formData.get('source_name') || 'বঙ্গীয় টাইমস').trim();
  const imageUrl = normalizeOptionalUrl(formData.get('image_url'));
  const sourceUrl = normalizeOptionalUrl(formData.get('source_url'));

  if (!title) {
    redirect('/?upload=1&upload_status=missing_title');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const basePayload: Record<string, any> = {
    title,
    category,
    snippet: snippet || null,
    source_name: sourceName || 'বঙ্গীয় টাইমস',
    image_url: imageUrl || null,
    is_published: true,
    created_at: new Date().toISOString(),
  };

  let error: any = null;

  if (sourceUrl) {
    const urlColumns = ['source_url', 'url', 'original_url'];
    let inserted = false;

    for (const column of urlColumns) {
      const result = await supabase.from('news').insert({ ...basePayload, [column]: sourceUrl });
      if (!result.error) {
        inserted = true;
        error = null;
        break;
      }

      if (isMissingColumnError(result.error, column)) {
        error = result.error;
        continue;
      }

      error = result.error;
      break;
    }

    if (!inserted && error && ['source_url', 'url', 'original_url'].some((column) => isMissingColumnError(error, column))) {
      const fallback = await supabase.from('news').insert(basePayload);
      error = fallback.error;
    }
  } else {
    const result = await supabase.from('news').insert(basePayload);
    error = result.error;
  }

  if (error) {
    const message = encodeURIComponent(String(error.message || 'Unknown upload error').slice(0, 220));
    redirect(`/?upload=1&upload_status=error&upload_error=${message}`);
  }

  revalidatePath('/');
  redirect('/?upload=1&upload_status=success');
}

export default async function Home({ searchParams }: { searchParams: { category?: string, tab?: string, page?: string, q?: string, upload?: string, upload_status?: string, upload_error?: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const activeCategory = searchParams.category ? searchParams.category.trim() : '';
  const searchQuery = searchParams.q ? searchParams.q.trim() : '';
  const currentPage = Math.max(1, parseInt(searchParams.page || '1') || 1);
  const showUpload = searchParams.upload === '1';
  const uploadStatus = searchParams.upload_status || '';
  const uploadError = searchParams.upload_error || '';
  const limitPerPage = 20; 
  const startRow = (currentPage - 1) * limitPerPage;
  const endRow = startRow + limitPerPage - 1;

  let query = supabase.from('news').select('*', { count: 'exact' }).eq('is_published', true).order('created_at', { ascending: false });
  
  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`).range(startRow, endRow);
  } else if (activeCategory) {
    query = query.ilike('category', `%${activeCategory}%`).range(startRow, endRow);
  } else {
    query = query.limit(150); 
  }

  const { data: newsItems, count } = await query;
  const dbNews = (newsItems || []) as NewsItem[];

  const liveQuery = searchQuery || activeCategory;
  const liveCategory = activeCategory || (searchQuery ? 'সার্চ' : 'সর্বশেষ');
  const liveNews = currentPage === 1
    ? await fetchGoogleNewsFeed(liveQuery, liveCategory, activeCategory || searchQuery ? 40 : 90)
    : [];

  const mergedMainNews = mergeNews(dbNews, liveNews);
  const allNews = (activeCategory || searchQuery)
    ? mergedMainNews.slice(0, limitPerPage)
    : mergedMainNews.slice(0, 150);

  const totalPages = count ? Math.max(1, Math.ceil(count / limitPerPage)) : 1;

  // --- Hero Section Data (Updated Layout Allocations) ---
  let remainingNews = [...allNews];
  const headerNews = remainingNews.splice(0, 3);
  const topHighlightNews = remainingNews.splice(0, 4); 

  // লিড নিউজের জন্য নির্দিষ্ট ক্যাটাগরি ফিল্টার (বাংলাদেশ, রাজনীতি, আন্তর্জাতিক)
  const leadAllowedCategories = ['বাংলাদেশ', 'রাজনীতি', 'আন্তর্জাতিক'];
  const leadIndex = remainingNews.findIndex((n) =>
    leadAllowedCategories.some((cat) => n.category?.includes(cat) ?? false)
  );

  let leadNews = null;
  if (leadIndex !== -1) {
    // নির্দিষ্ট ক্যাটাগরি পেলে সেটি লিড নিউজ হিসেবে সেট হবে
    leadNews = remainingNews.splice(leadIndex, 1)[0];
  } else {
    // যদি ওই ৩টি ক্যাটাগরির কোনো নিউজ না থাকে, তবে ডিফল্ট প্রথমটি নিবে
    leadNews = remainingNews.length > 0 ? remainingNews.shift() : null;
  }

  const underLeadNews = remainingNews.splice(0, 5); // লিড নিউজের নিচের নিউজ
  const middleTopNews = remainingNews.length > 0 ? remainingNews.shift() : null;
  const middleListNews = remainingNews.splice(0, 10); // মিডল কলাম
  const rightSideNews = remainingNews.splice(0, 5); // ডানপাশের কলাম
  
  // --- Category Data Mapping (Supabase + Google News RSS fallback) ---
  const fetchDirectCategory = async (catName: string, amt: number) => {
    const { data } = await supabase
      .from('news')
      .select('*')
      .ilike('category', `%${catName}%`)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(amt);

    const dbItems = (data || []) as NewsItem[];

    // If the scraper is already supplying fresh rows, keep using them.
    // If it is empty/stale, fall back to Google News RSS without rewriting the article.
    if (dbItems.length >= amt && isFreshEnough(dbItems, 90)) {
      return dbItems.slice(0, amt);
    }

    const liveItems = await fetchGoogleNewsFeed(catName, catName, Math.max(amt * 2, 10));
    return mergeNews(dbItems, liveItems).slice(0, amt);
  };

  const [
    bdNews,
    intlNews,
    politicsNews,
    opinionNews,
    sportsNews,
    businessNews,
    entertainmentNews,
    lawNews,
    lifestyleNews,
    eduNews,
    jobsNews,
    techNews,
    featureNews,
    hasyroshNews,
    religionNews,
    lawAndAdviceNews,
    literatureNews,
  ] = await Promise.all([
    fetchDirectCategory('বাংলাদেশ', 11),
    fetchDirectCategory('আন্তর্জাতিক', 7),
    fetchDirectCategory('রাজনীতি', 7),
    fetchDirectCategory('মতামত', 5),
    fetchDirectCategory('খেলাধুলা', 5),
    fetchDirectCategory('বাণিজ্য', 4),
    fetchDirectCategory('বিনোদন', 7),
    fetchDirectCategory('আইন-আদালত', 7),
    fetchDirectCategory('জীবনযাপন', 4),
    fetchDirectCategory('শিক্ষা', 4),
    fetchDirectCategory('চাকরি', 4),
    fetchDirectCategory('প্রযুক্তি', 4),
    fetchDirectCategory('ফিচার', 4),
    fetchDirectCategory('হাস্যরস', 4),
    fetchDirectCategory('ধর্ম', 8),
    fetchDirectCategory('আইন ও পরামর্শ', 7),
    fetchDirectCategory('সাহিত্য', 7),
  ]);

  const menuCategories = ["সর্বশেষ", "বাংলাদেশ", "রাজনীতি", "আন্তর্জাতিক", "মতামত", "খেলাধুলা", "বাণিজ্য", "বিনোদন", "আইন-আদালত", "জীবনযাপন", "শিক্ষা", "চাকরি", "প্রযুক্তি", "ফিচার", "হাস্যরস", "আইন ও পরামর্শ", "সাহিত্য"];

  return (
    <div className="min-h-screen bg-white text-[#333] tracking-tight">
      
 {/* Header Section */}
 <header className="bg-white">
  <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
    
    {/* Mobile Date */}
    <div className="md:hidden text-center text-[14px] text-gray-500 w-full mb-[-10px] font-bold">
      {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
    </div>

    {/* লোগো ও তারিখ সেকশন */}
    <div className="shrink-0 flex items-center">
       <a href="/" className="group flex flex-col">
         <h1 className="text-4xl md:text-[42px] font-extrabold text-black flex items-center tracking-tighter">
           বঙ্গীয়
           <div className="relative flex items-center justify-center w-[36px] h-[36px] md:w-[44px] md:h-[44px] mx-1">
             <div className="absolute inset-0 rounded-full border-[2.5px] md:border-[3px] border-red-600"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-[5px] h-[5px] bg-red-600 rounded-full"></div>
                <div className="absolute w-[2px] h-[35%] bg-red-600 origin-bottom bottom-1/2 rounded-t-full animate-[spin_4s_linear_infinite]"></div>
                <div className="absolute w-[2.5px] h-[25%] bg-red-600 origin-bottom bottom-1/2 rounded-t-full animate-[spin_24s_linear_infinite] rotate-[45deg]"></div>
             </div>
             <span 
               className="relative z-10 text-black text-[26px] md:text-[32px] font-black leading-none pt-1"
               style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}
             >
               টা
             </span>
           </div>
           ইমস
         </h1>
         {/* স্লোগান */}
         <span className="hidden md:block text-[14px] font-bold text-gray-600 tracking-wide mt-1">
           সত্য ও সাহসের প্রতিচ্ছবি
         </span>
       </a>
       
       {/* ডেস্কটপ তারিখ */}
       <div className="hidden md:flex flex-col border-l-[2px] border-gray-300 pl-4 ml-4 justify-center h-12 mt-1">
         <span className="text-[13.5px] text-gray-600 font-bold leading-tight">
            {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long' }).format(new Date())}
         </span>
         <span className="text-[13.5px] text-gray-600 font-bold leading-tight mt-0.5">
            {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
         </span>
       </div>
    </div>

    {/* রাইট সাইড মেনু / Header News */}
    <div className="hidden lg:flex divide-x divide-gray-300">
       {headerNews.map((news, index) => (
          <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={index} className="flex gap-3 px-4 w-[250px] group">
             <div className="flex-1">
                <p className="text-xs text-red-600 mb-1">■ {news.category} <span className="text-gray-500 font-normal">• {getNewsSource(news)}</span></p>
                <h3 className="text-[15px] leading-tight font-semibold group-hover:text-blue-600 line-clamp-2">{getNewsTitle(news)}</h3>
             </div>
             <NewsImage news={news} className="w-16 h-16 object-cover border border-gray-100" />
          </a>
       ))}
    </div>

  </div>


        {/* Navigation Bar */}
        <div className="border-t border-b border-gray-300 sticky top-0 z-50 bg-white shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center h-12 relative overflow-hidden">
            
            {/* মেনু লিংকস */}
            <div className="flex-1 min-w-0 h-full flex items-center pr-4">
               <nav className="flex items-center gap-5 md:gap-6 lg:gap-7 overflow-x-auto text-[16px] md:text-[17px] lg:text-[18px] font-bold text-black w-full pb-1 custom-scrollbar tracking-wide">
                 <a href="/" className="h-12 flex items-center transition-colors hover:text-[#104f96] whitespace-nowrap shrink-0">প্রচ্ছদ</a>
                 {menuCategories.map((cat, index) => (
                   <a 
                     key={index} 
                     href={cat === "সর্বশেষ" ? "/" : `/?category=${cat}`} 
                     className={`hover:text-[#104f96] whitespace-nowrap shrink-0 ${typeof activeCategory !== 'undefined' && activeCategory === cat ? 'text-[#104f96] border-b-[3px] border-[#104f96] h-12 flex items-center' : 'h-12 flex items-center transition-colors'}`}
                   >
                      {cat}
                   </a>
                 ))}
                 <a
                   href="/?upload=1"
                   className={`h-12 flex items-center whitespace-nowrap shrink-0 px-3 rounded-md font-bold transition-colors ${showUpload ? 'text-white bg-[#104f96]' : 'text-[#104f96] hover:bg-[#eef5ff]'}`}
                 >
                   + নিজস্ব সংবাদ
                 </a>
               </nav>
            </div>
            
            {/* প্রফেশনাল সার্চ অপশন */}
            <div className="hidden md:flex items-center border-l border-gray-200 pl-5 h-full shrink-0 bg-white z-10">
               <form action="/" method="GET" className="relative flex items-center group">
                  <input 
                     type="text" 
                     name="q" 
                     defaultValue={typeof searchQuery !== 'undefined' ? searchQuery : ''} 
                     placeholder="খবর খুঁজুন..." 
                     className="w-48 lg:w-64 pl-4 pr-10 py-1.5 bg-[#f4f7fc] border border-transparent focus:border-[#104f96] focus:bg-white text-[15px] rounded-full outline-none transition-all duration-300 placeholder-gray-500 font-normal text-gray-800 shadow-inner" 
                     required
                  />
                  <button type="submit" className="absolute right-3 text-gray-400 group-hover:text-[#104f96] focus:text-[#104f96] transition-colors flex items-center justify-center cursor-pointer">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                     </svg>
                  </button>
               </form>
            </div>
            
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="mt-0 pb-10">

        {showUpload && (
          <section className="max-w-[1000px] mx-auto px-4 pt-6 pb-2">
            <div className="border border-[#dbe5f0] bg-[#f8fbff] rounded-md shadow-sm overflow-hidden">
              <div className="bg-[#104f96] text-white px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[21px] md:text-[24px] font-bold">নিজস্ব সংবাদ প্রকাশ</h2>
                  <p className="text-[13px] md:text-[14px] text-blue-100 mt-1">নিজস্ব সংবাদ বা কোনো উৎসের সংবাদ-লিংক ম্যানুয়ালি যোগ করুন।</p>
                </div>
                <a href="/" className="text-[14px] font-bold bg-white/15 hover:bg-white/25 px-3 py-2 rounded">বন্ধ করুন</a>
              </div>

              <div className="p-5 md:p-6">
                {uploadStatus === 'success' && (
                  <div className="mb-5 border border-green-200 bg-green-50 text-green-800 px-4 py-3 rounded font-bold text-[14px]">
                    সংবাদ সফলভাবে প্রকাশ হয়েছে।
                  </div>
                )}
                {uploadStatus === 'missing_title' && (
                  <div className="mb-5 border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 rounded font-bold text-[14px]">
                    সংবাদ শিরোনাম অবশ্যই দিতে হবে।
                  </div>
                )}
                {uploadStatus === 'config_error' && (
                  <div className="mb-5 border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded text-[14px]">
                    Supabase configuration পাওয়া যায়নি।
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="mb-5 border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded text-[14px] break-words">
                    সংবাদ প্রকাশ করা যায়নি{uploadError ? `: ${uploadError}` : '।'}
                  </div>
                )}

                <form action={publishCustomNews} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-[14px] font-bold mb-2">সংবাদ শিরোনাম *</label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      maxLength={250}
                      placeholder="সংবাদের মূল শিরোনাম লিখুন"
                      className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#104f96] bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-[14px] font-bold mb-2">বিভাগ *</label>
                    <select id="category" name="category" defaultValue="বাংলাদেশ" className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#104f96] bg-white">
                      {menuCategories.filter((cat) => cat !== 'সর্বশেষ').map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="source_name" className="block text-[14px] font-bold mb-2">উৎসের নাম</label>
                    <input
                      id="source_name"
                      name="source_name"
                      type="text"
                      defaultValue="বঙ্গীয় টাইমস"
                      maxLength={120}
                      className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#104f96] bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="source_url" className="block text-[14px] font-bold mb-2">মূল সংবাদ/উৎসের লিংক</label>
                    <input
                      id="source_url"
                      name="source_url"
                      type="text"
                      placeholder="https://example.com/news/..."
                      className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#104f96] bg-white"
                    />
                    <p className="text-[12px] text-gray-500 mt-1">লিংক দিলে পাঠক সরাসরি মূল উৎসে যাবে। ফাঁকা রাখলে আপনার সাইটের নিজস্ব নিউজ পেজ খোলা হবে।</p>
                  </div>

                  <div>
                    <label htmlFor="image_url" className="block text-[14px] font-bold mb-2">ছবির URL</label>
                    <input
                      id="image_url"
                      name="image_url"
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#104f96] bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="snippet" className="block text-[14px] font-bold mb-2">সংক্ষিপ্ত বিবরণ</label>
                    <textarea
                      id="snippet"
                      name="snippet"
                      rows={4}
                      maxLength={1200}
                      placeholder="২–৪ লাইনের সংক্ষিপ্ত বিবরণ লিখুন। অন্য উৎসের পুরো লেখা কপি না করে ছোট preview দিন।"
                      className="w-full border border-gray-300 rounded px-4 py-3 outline-none focus:border-[#104f96] bg-white resize-y"
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 pt-4">
                    <p className="text-[12px] md:text-[13px] text-gray-500">Google News-এর মতো: শিরোনাম + ছোট preview + উৎসের নাম + মূল লিংক।</p>
                    <button type="submit" className="bg-[#104f96] hover:bg-[#0b3d78] text-white font-bold px-6 py-3 rounded transition-colors">
                      সংবাদ প্রকাশ করুন
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}
        
        {activeCategory === 'বাংলাদেশ' && searchQuery ? (
            /* --- প্রথম আলোর মতো এলাকার খবরের সার্চ রেজাল্ট পেজ --- */
            <div className="max-w-[1200px] mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-3">
                  <h1 className="text-[24px] md:text-[28px] font-bold text-red-600 mb-6 border-b border-gray-200 pb-2">{searchQuery}</h1>
                  <div className="mb-6">
                     <h3 className="text-[18px] font-bold text-[#104f96] mb-4">আমার এলাকার খবর</h3>
                     <LocationFilter layout="vertical" />
                  </div>
               </div>
               
               <div className="lg:col-span-6">
                  {allNews.length === 0 ? (
                     <div className="text-gray-400 py-10 text-center font-bold">এই এলাকার কোনো খবর পাওয়া যায়নি।</div>
                  ) : (
                     <div className="flex flex-col gap-6">
                        {allNews.map(news => (
                           <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group flex gap-4 border-b border-gray-200 pb-6 last:border-0">
                              <div className="flex-1">
                                 <h3 className="text-[18px] md:text-[20px] font-bold group-hover:text-[#104f96] leading-snug text-[#1a1a1a]">{getNewsTitle(news)}</h3>
                                 <p className="text-[14px] text-gray-600 mt-2 line-clamp-2 leading-relaxed">{getNewsSnippet(news)}</p>
                                 <p className="text-[13px] text-gray-400 mt-3">{formatNewsMeta(news)}</p>
                              </div>
                              <NewsImage news={news} className="w-[120px] h-[90px] md:w-[180px] md:h-[120px] aspect-video object-cover rounded-sm border border-gray-100 shrink-0" />
                           </a>
                        ))}
                     </div>
                  )}

                  {/* Pagination Component for Area News */}
                  {allNews.length > 0 && totalPages > 1 && (
                     <div className="flex justify-center mt-10 mb-2 gap-3">
                        {currentPage > 1 && (
                           <a href={`/?category=বাংলাদেশ&q=${searchQuery}&page=${currentPage - 1}`} className="px-5 py-2 border border-[#104f96] text-[#104f96] rounded-full hover:bg-[#104f96] hover:text-white transition font-bold">পূর্ববর্তী</a>
                        )}
                        <div className="px-5 py-2 bg-[#104f96] text-white rounded-full font-bold">{currentPage}</div>
                        {currentPage < totalPages && (
                           <a href={`/?category=বাংলাদেশ&q=${searchQuery}&page=${currentPage + 1}`} className="px-5 py-2 border border-[#104f96] text-[#104f96] rounded-full hover:bg-[#104f96] hover:text-white transition font-bold">পরবর্তী</a>
                        )}
                     </div>
                  )}
               </div>
               
               {/* Google AdSense Space */}
               <div className="lg:col-span-3 hidden lg:block">
                  <div className="w-full min-h-[400px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-sm">
                     <span className="text-sm font-bold text-gray-400">বিজ্ঞাপন</span>
                  </div>
               </div>
            </div>
            
        ) : activeCategory === 'বাংলাদেশ' ? (
            /* --- বাংলাদেশ ক্যাটাগরির মূল পেজ --- */
            <div className="max-w-[1200px] mx-auto px-4 mt-6 mb-10 border-b border-gray-300 pb-8">
               <div className="flex items-center mb-5 border-b-[2px] border-gray-200 pb-2">
                  <h2 className="text-[20px] lg:text-[22px] font-bold text-gray-900">বাংলাদেশ</h2>
               </div>

               <div className="bg-[#f4f7fc] border border-[#e2e8f0] p-4 sm:p-5 rounded-sm mb-6">
                  <div className="flex items-center gap-2 mb-4">
                     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                     <h3 className="text-[18px] font-bold text-[#104f96]">আমার এলাকার খবর</h3>
                  </div>
                  <LocationFilter layout="horizontal" />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {allNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-10 col-span-4">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <>
                        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                           {allNews.slice(0, 12).map((news) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group flex flex-col">
                                 <div className="overflow-hidden mb-3">
                                    <NewsImage news={news} className="w-full aspect-video object-cover group-hover:scale-105 transition duration-300 border border-gray-100 rounded-sm" />
                                 </div>
                                 <h3 className="text-[17px] md:text-[18px] font-bold text-[#1a1a1a] group-hover:text-[#104f96] leading-snug">{getNewsTitle(news)}</h3>
                                 <p className="text-[12px] md:text-[13px] text-gray-400 mt-2">{formatNewsMeta(news)}</p>
                              </a>
                           ))}
                        </div>
                        <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200 pt-5 lg:pt-0 lg:pl-6 flex flex-col gap-5">
                           {allNews.slice(12, 20).map((news) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group block border-b border-gray-100 pb-4 last:border-0">
                                 <h3 className="text-[15px] lg:text-[16px] font-bold text-[#1a1a1a] group-hover:text-[#104f96] leading-snug">{getNewsTitle(news)}</h3>
                                 <p className="text-[12px] md:text-[13px] text-gray-400 mt-1.5">{formatNewsMeta(news)}</p>
                              </a>
                           ))}
                        </div>
                     </>
                  )}
               </div>

               {/* Pagination Component for BD */}
               {allNews.length > 0 && totalPages > 1 && (
                  <div className="flex justify-center mt-10 mb-2 gap-3">
                     {currentPage > 1 && (
                        <a href={`/?category=বাংলাদেশ&page=${currentPage - 1}`} className="px-5 py-2 border border-[#104f96] text-[#104f96] rounded-full hover:bg-[#104f96] hover:text-white transition font-bold">পূর্ববর্তী</a>
                     )}
                     <div className="px-5 py-2 bg-[#104f96] text-white rounded-full font-bold">{currentPage}</div>
                     {currentPage < totalPages && (
                        <a href={`/?category=বাংলাদেশ&page=${currentPage + 1}`} className="px-5 py-2 border border-[#104f96] text-[#104f96] rounded-full hover:bg-[#104f96] hover:text-white transition font-bold">পরবর্তী</a>
                     )}
                  </div>
               )}
            </div>
            
        ) : (activeCategory || searchQuery) ? (
            /* --- অন্যান্য সাধারণ সার্চ রেজাল্ট --- */
            <div className="max-w-[1200px] mx-auto px-4 mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-1 md:col-span-3">
                 <div className="border-b-[3px] border-black mb-4 pb-1">
                    <h2 className="text-[20px] md:text-[22px] font-bold flex items-center gap-2">
                       {searchQuery ? `"${searchQuery}" এর সার্চ রেজাল্ট` : activeCategory}
                    </h2>
                 </div>
                 {allNews.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 font-bold text-[18px]">কোনো খবর পাওয়া যায়নি।</div>
                 ) : (
                    <>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                          {allNews.map(news => (
                             <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group flex gap-4 border-b border-gray-200 pb-4">
                                <div className="flex-1">
                                   <h3 className="text-[17px] md:text-[18px] lg:text-[20px] font-bold group-hover:text-[#104f96] leading-snug text-[#1a1a1a]">{getNewsTitle(news)}</h3>
                                   <p className="text-[12px] md:text-[13px] text-gray-400 mt-2">{formatNewsMeta(news)}</p>
                                </div>
                                <NewsImage news={news} className="w-[100px] sm:w-[120px] aspect-video object-cover rounded-sm" />
                             </a>
                          ))}
                       </div>
                       
                       {/* Pagination Component */}
                       {totalPages > 1 && (
                          <div className="flex justify-center mt-10 mb-6 gap-3">
                             {currentPage > 1 && (
                                <a href={`/?${activeCategory ? `category=${activeCategory}&` : ''}${searchQuery ? `q=${searchQuery}&` : ''}page=${currentPage - 1}`} className="px-5 py-2 border border-[#104f96] text-[#104f96] rounded-full hover:bg-[#104f96] hover:text-white transition font-bold">পূর্ববর্তী</a>
                             )}
                             <div className="px-5 py-2 bg-[#104f96] text-white rounded-full font-bold">{currentPage}</div>
                             {currentPage < totalPages && (
                                <a href={`/?${activeCategory ? `category=${activeCategory}&` : ''}${searchQuery ? `q=${searchQuery}&` : ''}page=${currentPage + 1}`} className="px-5 py-2 border border-[#104f96] text-[#104f96] rounded-full hover:bg-[#104f96] hover:text-white transition font-bold">পরবর্তী</a>
                             )}
                          </div>
                       )}
                    </>
                 )}
              </div>
              <div className="hidden md:block col-span-1">
                 {/* Google AdSense Space */}
                 <div className="w-full min-h-[600px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-sm sticky top-20">
                    <span className="text-sm font-bold text-gray-400">বিজ্ঞাপন</span>
                 </div>
              </div>
            </div>
        ) : (
          <>
            {/* --- Top Highlight Section (Under Menu) --- */}
            <div className="bg-[#f2efe9] py-6 mb-8 border-b border-gray-200">
              <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {topHighlightNews.map(news => (
                  <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group block transition">
                    <NewsImage news={news} className="w-full aspect-video object-cover mb-3 border border-gray-200/50 rounded-sm" />
                    <h3 className="font-bold text-[16px] md:text-[17px] text-[#1a1a1a] group-hover:text-[#104f96] leading-snug line-clamp-3">{getNewsTitle(news)}</h3>
                    <p className="text-[12px] text-gray-500 mt-1.5">{formatNewsMeta(news)}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* --- Main Hero Grid Section --- */}
            <div className="max-w-[1200px] mx-auto px-4 pb-6 border-b border-gray-300 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* Left: Lead News (col-span-5) */}
                <div className="lg:col-span-5 flex flex-col lg:border-r border-gray-300 lg:pr-6">
                   {leadNews && (
                     <a href={getNewsHref(leadNews)} target="_blank" rel="noopener noreferrer" className="group block mb-6 border-b border-gray-200 pb-6">
                       <h1 className="text-[28px] md:text-[32px] font-bold leading-[1.35] text-[#1a1a1a] group-hover:text-[#104f96] mb-4">{getNewsTitle(leadNews)}</h1>
                       <NewsImage news={leadNews} className="w-full aspect-video object-cover mb-4 rounded-sm border border-gray-100" />
                       <p className="text-[15px] md:text-[16px] text-gray-600 leading-[1.65] line-clamp-4">{leadNews.snippet}</p>
                       <p className="text-[13px] text-gray-400 mt-3">{formatNewsMeta(leadNews)}</p>
                     </a>
                   )}
                   <div className="flex flex-col gap-5">
                     {underLeadNews.map((news, idx) => (
                       <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group flex gap-4 border-b border-gray-200 pb-5 last:border-0 last:pb-0">
                         <div className="flex-1">
                           <h3 className="text-[18px] md:text-[19px] font-bold text-[#1a1a1a] group-hover:text-[#104f96] leading-snug">{getNewsTitle(news)}</h3>
                           <p className="text-[14px] text-gray-600 mt-2 line-clamp-2 leading-relaxed">{getNewsSnippet(news)}</p>
                           <p className="text-[12px] text-gray-400 mt-2">{formatNewsMeta(news)}</p>
                         </div>
                         <NewsImage news={news} className="w-[120px] sm:w-[130px] aspect-video object-cover shrink-0 rounded-sm border border-gray-100" />
                       </a>
                     ))}
                   </div>
                </div>

                {/* Middle Column (col-span-4) */}
                <div className="lg:col-span-4 flex flex-col lg:border-r border-gray-300 lg:pr-6">
                   {middleTopNews && (
                     <a href={getNewsHref(middleTopNews)} target="_blank" rel="noopener noreferrer" className="group block mb-6 border-b border-gray-200 pb-6">
                       <NewsImage news={middleTopNews} className="w-full aspect-video object-cover mb-4 rounded-sm border border-gray-100" />
                       <h2 className="text-[20px] md:text-[22px] font-bold text-[#1a1a1a] group-hover:text-[#104f96] leading-snug mb-3">{getNewsTitle(middleTopNews)}</h2>
                       <p className="text-[14px] md:text-[15px] text-gray-600 leading-[1.65] line-clamp-3">{middleTopNews.snippet}</p>
                       <p className="text-[13px] text-gray-400 mt-3">{formatNewsMeta(middleTopNews)}</p>
                     </a>
                   )}
                   <div className="flex flex-col gap-4 divide-y divide-gray-200">
                     {middleListNews.map((news, idx) => (
                       <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className={`group block ${idx !== 0 ? 'pt-4' : ''}`}>
                         <h3 className="text-[16px] md:text-[17px] font-bold text-[#1a1a1a] group-hover:text-[#104f96] leading-snug">{getNewsTitle(news)}</h3>
                         <p className="text-[12px] text-gray-400 mt-2">{formatNewsMeta(news)}</p>
                       </a>
                     ))}
                   </div>
                </div>

                {/* Right Column (col-span-3) */}
                <div className="lg:col-span-3 flex flex-col">
                   <div className="flex flex-col gap-5 divide-y divide-gray-200 mb-6">
                     {rightSideNews.map((news, idx) => (
                       <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className={`group flex gap-3 items-start ${idx !== 0 ? 'pt-5' : ''}`}>
                         <div className="flex-1">
                           <h3 className="text-[15px] md:text-[16px] font-bold text-[#1a1a1a] group-hover:text-[#104f96] leading-snug">{getNewsTitle(news)}</h3>
                           <p className="text-[12px] text-gray-400 mt-1.5">{formatNewsMeta(news)}</p>
                         </div>
                         <NewsImage news={news} className="w-[85px] sm:w-[95px] aspect-video object-cover shrink-0 rounded-sm border border-gray-100" />
                       </a>
                     ))}
                   </div>
                   
                   {/* Ad Placeholder */}
                   <div className="w-full min-h-[250px] bg-gray-50 border border-gray-200 flex flex-col justify-center items-center rounded-sm mb-6">
                      <span className="text-sm font-bold text-gray-400">বিজ্ঞাপন</span>
                   </div>
                   <ClientTabs latestList={allNews.slice(0, 5)} popularList={allNews.slice(5, 10)} />
                </div>

              </div>
            </div>

            {/* বাংলাদেশ ক্যাটাগরি */}
            <div className="max-w-[1200px] mx-auto px-4 mb-10 border-b border-gray-300 pb-8">
               <div className="flex items-center mb-5 border-b-[2px] border-gray-200 pb-2">
                  <a href="/?category=বাংলাদেশ" className="text-[20px] lg:text-[22px] font-bold text-gray-900 hover:text-[#104f96]">বাংলাদেশ</a>
               </div>

               <div className="bg-[#f4f7fc] border border-[#e2e8f0] p-4 sm:p-5 rounded-sm mb-6">
                  <div className="flex items-center gap-2 mb-4">
                     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                     <h3 className="text-[18px] font-bold text-[#104f96]">আমার এলাকার খবর</h3>
                  </div>
                  <LocationFilter layout="horizontal" />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {bdNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-10 col-span-4">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <>
                        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                           {bdNews.slice(0, 6).map((news) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group flex flex-col">
                                 <div className="overflow-hidden mb-3">
                                    <NewsImage news={news} className="w-full aspect-video object-cover group-hover:scale-105 transition duration-300 border border-gray-100 rounded-sm" />
                                 </div>
                                 <h3 className="text-[17px] md:text-[18px] font-bold text-[#1a1a1a] group-hover:text-[#104f96] leading-snug">{getNewsTitle(news)}</h3>
                                 <p className="text-[12px] md:text-[13px] text-gray-400 mt-2">{formatNewsMeta(news)}</p>
                              </a>
                           ))}
                        </div>
                        <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200 pt-5 lg:pt-0 lg:pl-6 flex flex-col gap-5">
                           {bdNews.slice(6, 10).map((news) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group block border-b border-gray-100 pb-4 last:border-0">
                                 <h3 className="text-[15px] lg:text-[16px] font-bold text-[#1a1a1a] group-hover:text-[#104f96] leading-snug">{getNewsTitle(news)}</h3>
                                 <p className="text-[12px] md:text-[13px] text-gray-400 mt-1.5">{formatNewsMeta(news)}</p>
                              </a>
                           ))}
                        </div>
                     </>
                  )}
               </div>
            </div>

            {/* আন্তর্জাতিক ও আইন-আদালত */}
            <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 mb-8 border-b border-gray-300 pb-8">
               {/* আন্তর্জাতিক */}
               <div className="bg-[#f4fdfa] p-4 sm:p-5 border-t-[4px] border-[#4bd396] rounded-sm min-h-[250px]">
                  <div className="mb-5 border-b border-[#bbf2d8] pb-2">
                     <a href="/?category=আন্তর্জাতিক" className="text-[20px] font-bold text-[#2db97a] hover:text-[#188a56] tracking-tight">আন্তর্জাতিক <span className="text-[#4bd396] ml-1">❯</span></a>
                  </div>
                  
                  {intlNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-6">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                        <div className="col-span-1 border-b sm:border-b-0 sm:border-r border-[#bbf2d8] pb-5 sm:pb-0 sm:pr-4 flex flex-col">
                           {intlNews[0] && (
                              <a href={getNewsHref(intlNews[0])} target="_blank" rel="noopener noreferrer" className="group block mb-4">
                                 <NewsImage news={intlNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm" />
                                 <h3 className="text-[18px] lg:text-[20px] font-bold group-hover:text-[#2db97a] leading-snug">{getNewsTitle(intlNews[0])}</h3>
                                 <p className="text-[13px] md:text-[14px] text-gray-600 mt-2 line-clamp-2 leading-relaxed">{intlNews[0].snippet}</p>
                                <p className="text-[12px] md:text-[13px] text-gray-500 mt-2">{formatNewsMeta(intlNews[0])}</p>
                              </a>
                           )}
                           
                           <div className="mt-auto space-y-4 pt-3 border-t border-[#bbf2d8]">
                              {intlNews[1] && (
                                 <a href={getNewsHref(intlNews[1])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#2db97a] leading-snug">
                                       <span className="text-[#2db97a] mr-1">■</span> {getNewsTitle(intlNews[1])}
                                    </h3>
                                 </a>
                              )}
                              {intlNews[2] && (
                                 <a href={getNewsHref(intlNews[2])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#2db97a] leading-snug">
                                       <span className="text-[#2db97a] mr-1">■</span> {getNewsTitle(intlNews[2])}
                                    </h3>
                                 </a>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#bbf2d8]">
                           {intlNews.slice(3, 7).map((news, idx) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold group-hover:text-[#2db97a] leading-snug">{getNewsTitle(news)}</h3>
                                    <p className="text-[12px] md:text-[13px] text-gray-500 mt-1.5">{formatNewsMeta(news)}</p>
                                 </div>
                                 <NewsImage news={news} className="w-[70px] aspect-video object-cover rounded-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* আইন-আদালত */}
               <div className="bg-[#fcf5f5] p-4 sm:p-5 border-t-[4px] border-[#e85b5b] rounded-sm min-h-[250px]">
                  <div className="mb-5 border-b border-[#fbcbcb] pb-2">
                     <a href="/?category=আইন-আদালত" className="text-[20px] font-bold text-[#d73f3f] hover:text-[#b02222] tracking-tight">আইন-আদালত <span className="text-[#e85b5b] ml-1">❯</span></a>
                  </div>
                  {lawNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-6">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                        <div className="col-span-1 border-b sm:border-b-0 sm:border-r border-[#fbcbcb] pb-5 sm:pb-0 sm:pr-4 flex flex-col">
                           {lawNews[0] && (
                              <a href={getNewsHref(lawNews[0])} target="_blank" rel="noopener noreferrer" className="group block mb-4">
                                 <NewsImage news={lawNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm" />
                                 <h3 className="text-[18px] lg:text-[20px] font-bold group-hover:text-[#d73f3f] leading-snug">{getNewsTitle(lawNews[0])}</h3>
                                <p className="text-[13px] md:text-[14px] text-gray-600 mt-2 line-clamp-2 leading-relaxed">{lawNews[0].snippet}</p>
                                <p className="text-[12px] md:text-[13px] text-gray-500 mt-2">{formatNewsMeta(lawNews[0])}</p>
                              </a>
                           )}
                           <div className="mt-auto space-y-4 pt-3 border-t border-[#fbcbcb]">
                              {lawNews[1] && (
                                 <a href={getNewsHref(lawNews[1])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#d73f3f] leading-snug">
                                       <span className="text-[#d73f3f] mr-1">■</span> {getNewsTitle(lawNews[1])}
                                    </h3>
                                 </a>
                              )}
                              {lawNews[2] && (
                                 <a href={getNewsHref(lawNews[2])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#d73f3f] leading-snug">
                                       <span className="text-[#d73f3f] mr-1">■</span> {getNewsTitle(lawNews[2])}
                                    </h3>
                                 </a>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#fbcbcb]">
                           {lawNews.slice(3, 7).map((news, idx) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold group-hover:text-[#d73f3f] leading-snug">{getNewsTitle(news)}</h3>
                                    <p className="text-[12px] md:text-[13px] text-gray-500 mt-1.5">{formatNewsMeta(news)}</p>
                                 </div>
                                 <NewsImage news={news} className="w-[70px] aspect-video object-cover rounded-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* মতামত */}
            <div className="max-w-[1200px] mx-auto px-4 mb-8 border-b border-gray-300 pb-8 min-h-[300px]">
               <div className="border-t-[3px] border-black pt-2 mb-6">
                  <a href="/?category=মতামত" className="text-[20px] font-bold hover:text-blue-600">মতামত <span className="text-red-600 ml-1">❯</span></a>
               </div>
               {opinionNews.length === 0 ? (
                  <div className="text-gray-400 text-center py-10">খবর আপডেট হচ্ছে...</div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6">
                     {opinionNews[0] && (
                     <div className="md:col-span-5 lg:col-span-4">
                        <a href={getNewsHref(opinionNews[0])} target="_blank" rel="noopener noreferrer" className="group flex flex-col h-full border border-gray-200 p-4 sm:p-5 hover:shadow-sm transition rounded-sm">
                           <h3 className="text-[18px] lg:text-[20px] font-bold leading-snug mb-3">
                              <span className="bg-[#11233f] text-[#fcd105] px-2 py-1 mr-2 text-[13px] inline-block mb-1">মতামত •</span>
                              <span className="group-hover:text-blue-600">{getNewsTitle(opinionNews[0])}</span>
                           </h3>
                           <p className="text-[14px] lg:text-[15px] text-gray-600 flex-1 line-clamp-4 mt-1">
                              {getNewsTitle(opinionNews[0])} প্রসঙ্গে আরও বিস্তারিত পড়তে লিংকে ক্লিক করুন।
                           </p>
                           <p className="text-[13px] text-gray-800 mt-4 font-bold">{opinionNews[0].source_name || 'নিবন্ধকার'}</p>
                        </a>
                     </div>
                     )}
                     <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between divide-y divide-gray-200">
                        {opinionNews.slice(1, 5).map((news, idx) => (
                           <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className={`group flex gap-4 sm:gap-5 items-center ${idx === 0 ? 'pb-4' : 'py-4'} last:pb-0`}>
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#e6e6e6] flex items-center justify-center shrink-0">
                                 <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                              </div>
                              <div className="flex-1">
                                 <h3 className="text-[16px] md:text-[17px] font-bold group-hover:text-blue-600 leading-snug">
                                    <span className="text-red-600 mr-1">মতামত •</span>{getNewsTitle(news)}
                                 </h3>
                                 <p className="text-[12px] md:text-[13px] text-gray-500 mt-1.5">লেখা: {news.source_name || 'নিবন্ধকার'}</p>
                              </div>
                           </a>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            {/* জীবনযাপন */}
            <div className="max-w-[1200px] mx-auto px-4 mb-8 border-b border-gray-300 pb-8 min-h-[250px]">
               <div className="border-t-[3px] border-black pt-2 mb-6">
                  <a href="/?category=জীবনযাপন" className="text-[20px] font-bold hover:text-blue-600">জীবনযাপন <span className="text-red-600 ml-1">❯</span></a>
               </div>
               {lifestyleNews.length === 0 ? (
                  <div className="text-gray-400 text-center py-10">খবর আপডেট হচ্ছে...</div>
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                     {lifestyleNews.map((news) => (
                        <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group block">
                           <NewsImage news={news} className="w-full aspect-video object-cover mb-3 rounded-sm border border-gray-100" />
                           <h3 className="text-[17px] md:text-[18px] font-bold group-hover:text-blue-600 leading-snug text-[#1a1a1a]">{getNewsTitle(news)}</h3>
                           <p className="text-[12px] md:text-[13px] text-gray-500 mt-2">{formatNewsMeta(news)}</p>
                        </a>
                     ))}
                  </div>
               )}
            </div>

            {/* বিনোদন ও রাজনীতি */}
            <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 mb-8 border-b border-gray-300 pb-8">
               {/* বিনোদন */}
               <div className="bg-[#eef5fa] p-4 sm:p-5 border-t-[4px] border-[#5293c4] rounded-sm min-h-[250px]">
                  <div className="mb-5 border-b border-[#c8dceb] pb-2">
                     <a href="/?category=বিনোদন" className="text-[20px] font-bold text-[#5293c4] hover:text-blue-600 tracking-tight">বিনোদন <span className="text-red-500 ml-1">❯</span></a>
                  </div>
                  {entertainmentNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-6">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                        <div className="col-span-1 border-b sm:border-b-0 sm:border-r border-[#c8dceb] pb-5 sm:pb-0 sm:pr-4 flex flex-col">
                           {entertainmentNews[0] && (
                              <a href={getNewsHref(entertainmentNews[0])} target="_blank" rel="noopener noreferrer" className="group block mb-4">
                                 <NewsImage news={entertainmentNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm" />
                                 <h3 className="text-[18px] lg:text-[20px] font-bold group-hover:text-blue-600 leading-snug">{getNewsTitle(entertainmentNews[0])}</h3>
                                 <p className="text-[12px] md:text-[13px] text-gray-500 mt-2">{formatNewsMeta(entertainmentNews[0])}</p>
                              </a>
                           )}
                           <div className="mt-auto space-y-4 pt-3 border-t border-[#c8dceb]">
                              {entertainmentNews[1] && (
                                 <a href={getNewsHref(entertainmentNews[1])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-blue-600 leading-snug">
                                       <span className="text-[#5293c4] mr-1">■</span> {getNewsTitle(entertainmentNews[1])}
                                    </h3>
                                 </a>
                              )}
                              {entertainmentNews[2] && (
                                 <a href={getNewsHref(entertainmentNews[2])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-blue-600 leading-snug">
                                       <span className="text-[#5293c4] mr-1">■</span> {getNewsTitle(entertainmentNews[2])}
                                    </h3>
                                 </a>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#c8dceb]">
                           {entertainmentNews.slice(3, 7).map((news, idx) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold group-hover:text-blue-600 leading-snug">{getNewsTitle(news)}</h3>
                                    <p className="text-[12px] md:text-[13px] text-gray-500 mt-1.5">{formatNewsMeta(news)}</p>
                                 </div>
                                 <NewsImage news={news} className="w-[70px] aspect-video object-cover rounded-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* রাজনীতি */}
               <div className="bg-[#fcfaf5] p-4 sm:p-5 border-t-[4px] border-[#d4b072] rounded-sm min-h-[250px]">
                  <div className="mb-5 border-b border-[#e8dfce] pb-2">
                     <a href="/?category=রাজনীতি" className="text-[20px] font-bold text-[#e05e3b] hover:text-[#d4b072] tracking-tight">রাজনীতি <span className="text-[#d4b072] ml-1">❯</span></a>
                  </div>
                  {politicsNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-6">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                        <div className="col-span-1 border-b sm:border-b-0 sm:border-r border-[#e8dfce] pb-5 sm:pb-0 sm:pr-4 flex flex-col">
                           {politicsNews[0] && (
                              <a href={getNewsHref(politicsNews[0])} target="_blank" rel="noopener noreferrer" className="group block mb-4">
                                 <NewsImage news={politicsNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm" />
                                 <h3 className="text-[18px] lg:text-[20px] font-bold group-hover:text-[#e05e3b] leading-snug">{getNewsTitle(politicsNews[0])}</h3>
                                 <p className="text-[12px] md:text-[13px] text-gray-500 mt-2">{formatNewsMeta(politicsNews[0])}</p>
                              </a>
                           )}
                           <div className="mt-auto space-y-4 pt-3 border-t border-[#e8dfce]">
                              {politicsNews[1] && (
                                 <a href={getNewsHref(politicsNews[1])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#e05e3b] leading-snug">
                                       <span className="text-[#d4b072] mr-1">■</span> {getNewsTitle(politicsNews[1])}
                                    </h3>
                                 </a>
                              )}
                              {politicsNews[2] && (
                                 <a href={getNewsHref(politicsNews[2])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#e05e3b] leading-snug">
                                       <span className="text-[#d4b072] mr-1">■</span> {getNewsTitle(politicsNews[2])}
                                    </h3>
                                 </a>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#e8dfce]">
                           {politicsNews.slice(3, 7).map((news, idx) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold group-hover:text-[#e05e3b] leading-snug">{getNewsTitle(news)}</h3>
                                    <p className="text-[12px] md:text-[13px] text-gray-500 mt-1.5">{formatNewsMeta(news)}</p>
                                 </div>
                                 <NewsImage news={news} className="w-[70px] aspect-video object-cover rounded-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* শিক্ষা, চাকরি, প্রযুক্তি, বাণিজ্য */}
            <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 lg:divide-x divide-gray-200 mb-8 border-b border-gray-300 pb-8">
               
               {/* শিক্ষা */}
               <div className="lg:pr-4 min-h-[200px]">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=শিক্ষা" className="text-[20px] font-bold hover:text-blue-600">শিক্ষা <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {eduNews.length === 0 ? <div className="text-gray-400 py-4">খবর আপডেট হচ্ছে...</div> : (
                     <div className="flex flex-col gap-3">
                        {eduNews[0] && (
                           <a href={getNewsHref(eduNews[0])} target="_blank" rel="noopener noreferrer" className="group block mb-2 border-b border-gray-200 pb-3">
                              <NewsImage news={eduNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm border border-gray-100" />
                              <h3 className="text-[17px] lg:text-[18px] font-bold group-hover:text-[#104f96] leading-snug">{getNewsTitle(eduNews[0])}</h3>
                           </a>
                        )}
                        {eduNews.slice(1, 4).map(news => (
                           <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group block">
                              <h3 className="text-[15px] lg:text-[16px] font-bold group-hover:text-[#104f96] leading-snug">■ {getNewsTitle(news)}</h3>
                           </a>
                        ))}
                     </div>
                  )}
               </div>

               {/* চাকরি */}
               <div className="lg:px-4 min-h-[200px]">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=চাকরি" className="text-[20px] font-bold hover:text-blue-600">চাকরি <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {jobsNews.length === 0 ? <div className="text-gray-400 py-4">খবর আপডেট হচ্ছে...</div> : (
                     <div className="flex flex-col gap-3">
                        {jobsNews[0] && (
                           <a href={getNewsHref(jobsNews[0])} target="_blank" rel="noopener noreferrer" className="group block mb-2 border-b border-gray-200 pb-3">
                              <NewsImage news={jobsNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm border border-gray-100" />
                              <h3 className="text-[17px] lg:text-[18px] font-bold group-hover:text-[#104f96] leading-snug">{getNewsTitle(jobsNews[0])}</h3>
                           </a>
                        )}
                        {jobsNews.slice(1, 4).map(news => (
                           <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group block">
                              <h3 className="text-[15px] lg:text-[16px] font-bold group-hover:text-[#104f96] leading-snug">■ {getNewsTitle(news)}</h3>
                           </a>
                        ))}
                     </div>
                  )}
               </div>

               {/* প্রযুক্তি */}
               <div className="lg:px-4 min-h-[200px]">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=প্রযুক্তি" className="text-[20px] font-bold hover:text-blue-600">প্রযুক্তি <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {techNews.length === 0 ? <div className="text-gray-400 py-4">খবর আপডেট হচ্ছে...</div> : (
                     <div className="flex flex-col gap-3">
                        {techNews[0] && (
                           <a href={getNewsHref(techNews[0])} target="_blank" rel="noopener noreferrer" className="group block mb-2 border-b border-gray-200 pb-3">
                              <NewsImage news={techNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm border border-gray-100" />
                              <h3 className="text-[17px] lg:text-[18px] font-bold group-hover:text-[#104f96] leading-snug">{getNewsTitle(techNews[0])}</h3>
                           </a>
                        )}
                        {techNews.slice(1, 4).map(news => (
                           <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group block">
                              <h3 className="text-[15px] lg:text-[16px] font-bold group-hover:text-[#104f96] leading-snug">■ {getNewsTitle(news)}</h3>
                           </a>
                        ))}
                     </div>
                  )}
               </div>

               {/* বাণিজ্য */}
               <div className="lg:pl-4 min-h-[200px]">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=বাণিজ্য" className="text-[20px] font-bold hover:text-blue-600">বাণিজ্য <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {businessNews.length === 0 ? <div className="text-gray-400 py-4">খবর আপডেট হচ্ছে...</div> : (
                     <div className="flex flex-col gap-3">
                        {businessNews[0] && (
                           <a href={getNewsHref(businessNews[0])} target="_blank" rel="noopener noreferrer" className="group block mb-2 border-b border-gray-200 pb-3">
                              <NewsImage news={businessNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm border border-gray-100" />
                              <h3 className="text-[17px] lg:text-[18px] font-bold group-hover:text-[#104f96] leading-snug">{getNewsTitle(businessNews[0])}</h3>
                           </a>
                        )}
                        {businessNews.slice(1, 4).map(news => (
                           <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group block">
                              <h3 className="text-[15px] lg:text-[16px] font-bold group-hover:text-[#104f96] leading-snug">■ {getNewsTitle(news)}</h3>
                           </a>
                        ))}
                     </div>
                  )}
               </div>

            </div>

            {/* খেলাধুলা */}
            <div className="max-w-[1200px] mx-auto px-4 mb-8 bg-[#fff5f5] p-4 sm:p-6 rounded-md border border-[#fbd5d5] shadow-sm min-h-[350px]">
               <div className="border-b-[2px] border-red-600 pb-2 mb-6">
                  <a href="/?category=খেলাধুলা" className="text-[20px] font-bold text-red-700 hover:text-red-500">খেলাধুলা <span className="text-red-500 ml-1">❯</span></a>
               </div>
               {sportsNews.length === 0 ? (
                  <div className="text-gray-400 text-center py-10">খবর আপডেট হচ্ছে...</div>
               ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                     <div className="flex flex-col gap-5 lg:col-span-1">
                        {sportsNews.slice(1, 3).map((news) => (
                           <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group flex flex-col bg-white p-3 rounded shadow-sm border border-[#fca5a5] hover:border-red-500 transition">
                              <NewsImage news={news} className="w-full aspect-video object-cover mb-2 rounded-sm" />
                              <h3 className="text-[16px] lg:text-[17px] font-bold group-hover:text-red-600 leading-snug">{getNewsTitle(news)}</h3>
                           </a>
                        ))}
                     </div>
                     <div className="lg:col-span-2">
                        {sportsNews[0] && (
                           <a href={getNewsHref(sportsNews[0])} target="_blank" rel="noopener noreferrer" className="group block h-full bg-white p-4 rounded shadow-sm border border-[#fca5a5] hover:border-red-500 transition relative">
                              <NewsImage news={sportsNews[0]} className="w-full aspect-video object-cover mb-4 rounded-sm border border-gray-100" />
                              <h3 className="text-[20px] md:text-[24px] font-bold text-gray-900 group-hover:text-red-600 leading-[1.3]">{getNewsTitle(sportsNews[0])}</h3>
                              <p className="text-[13px] md:text-[14px] text-gray-600 mt-2">{formatNewsMeta(sportsNews[0])}</p>
                           </a>
                        )}
                     </div>
                     <div className="flex flex-col gap-5 lg:col-span-1">
                        {sportsNews.slice(3, 5).map((news) => (
                           <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="group flex flex-col bg-white p-3 rounded shadow-sm border border-[#fca5a5] hover:border-red-500 transition">
                              <NewsImage news={news} className="w-full aspect-video object-cover mb-2 rounded-sm" />
                              <h3 className="text-[16px] lg:text-[17px] font-bold group-hover:text-red-600 leading-snug">{getNewsTitle(news)}</h3>
                           </a>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            {/* হাস্যরস & ফিচার */}
            <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4 border-b border-gray-300 pb-8">
               {/* হাস্যরস */}
               <div className="border border-[#c1dff0] bg-white rounded-sm overflow-hidden min-h-[300px]">
                  <div className="bg-[#eef6fc] px-4 py-3 flex items-center border-b border-[#c1dff0]">
                     <a href="/?category=হাস্যরস" className="text-[20px] font-bold text-[#006699] hover:text-blue-800">হাস্য<span className="text-red-500">+</span>রস</a>
                  </div>
                  {hasyroshNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-20">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:border-r border-[#c1dff0] sm:pr-6">
                           {hasyroshNews[0] && (
                              <a href={getNewsHref(hasyroshNews[0])} target="_blank" rel="noopener noreferrer" className="group block">
                                 <NewsImage news={hasyroshNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm shadow-sm" />
                                 <h3 className="text-[18px] md:text-[20px] font-bold text-gray-800 group-hover:text-[#006699] leading-snug">{getNewsTitle(hasyroshNews[0])}</h3>
                                 <p className="text-[12px] md:text-[13px] text-gray-500 mt-2">{formatNewsMeta(hasyroshNews[0])}</p>
                              </a>
                           )}
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#c1dff0] justify-center">
                           {hasyroshNews.slice(1, 4).map((news, idx) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className={`group flex items-center justify-between gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1 pr-2">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#006699] leading-snug">{getNewsTitle(news)}</h3>
                                 </div>
                                 <NewsImage news={news} className="w-[70px] aspect-video object-cover rounded-sm shadow-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* ফিচার */}
               <div className="border border-[#e8dfce] bg-[#fdfaf5] rounded-sm overflow-hidden min-h-[300px]">
                  <div className="flex justify-start items-center py-4 px-4 border-b-2 border-[#d4b072]">
                     <a href="/?category=ফিচার" className="text-[20px] font-bold text-[#966b22] hover:text-yellow-700">ফিচার</a>
                  </div>
                  {featureNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-20">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:border-r border-[#e8dfce] sm:pr-6">
                           {featureNews[0] && (
                              <a href={getNewsHref(featureNews[0])} target="_blank" rel="noopener noreferrer" className="group block">
                                 <NewsImage news={featureNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm shadow-sm" />
                                 <h3 className="text-[18px] md:text-[20px] font-bold text-gray-900 group-hover:text-[#966b22] leading-snug">{getNewsTitle(featureNews[0])}</h3>
                                 <p className="text-[13px] text-gray-500 mt-2 line-clamp-2">ফিচারের বিশেষ আয়োজন সম্পর্কে বিস্তারিত পড়তে ক্লিক করুন।</p>
                              </a>
                           )}
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#e8dfce] justify-center">
                           {featureNews.slice(1, 4).map((news, idx) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#966b22] leading-snug">{getNewsTitle(news)}</h3>
                                    <p className="text-[12px] md:text-[13px] text-gray-500 mt-1.5">{formatNewsMeta(news)}</p>
                                 </div>
                                 <NewsImage news={news} className="w-[70px] aspect-video object-cover rounded-sm shadow-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* ধর্ম (bdnews24 Slider Style) */}
            <div className="max-w-[1200px] mx-auto px-4 mb-6 pt-4">
               <div className="flex items-center justify-between border-b border-gray-200 mb-6">
                  <h2 className="text-[20px] font-bold text-[#1a1a1a] border-b-[3px] border-red-600 pb-1 -mb-[2px]">ধর্ম</h2>
                  <a href="/?category=ধর্ম" className="text-[14px] md:text-[15px] text-gray-500 hover:text-red-600 font-bold">সব খবর ❯</a>
               </div>
               
               {religionNews.length === 0 ? (
                  <div className="text-gray-400 text-center py-10">খবর আপডেট হচ্ছে...</div>
               ) : (
                  <div className="flex overflow-x-auto gap-5 pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
                     {religionNews.map((news) => (
                        <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className="min-w-[220px] md:min-w-[260px] w-[220px] md:w-[260px] snap-start group shrink-0 block">
                           <div className="overflow-hidden rounded-sm mb-3">
                              <NewsImage news={news} className="w-full aspect-video object-cover transform group-hover:scale-105 transition duration-500 ease-in-out border border-gray-100" />
                           </div>
                           <h3 className="text-[16px] md:text-[17px] lg:text-[18px] font-bold text-[#1a1a1a] group-hover:text-red-600 leading-snug">{getNewsTitle(news)}</h3>
                        </a>
                     ))}
                  </div>
               )}
            </div>

            {/* আইন ও পরামর্শ ও সাহিত্য */}
            <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 mb-8 border-b border-gray-300 pb-8">
               {/* আইন ও পরামর্শ */}
               <div className="bg-[#f4f6fb] p-4 sm:p-5 border-t-[4px] border-[#4c71a3] rounded-sm min-h-[250px]">
                  <div className="mb-5 border-b border-[#c8d4e6] pb-2">
                     <a href="/?category=আইন ও পরামর্শ" className="text-[20px] font-bold text-[#355580] hover:text-[#1d3557] tracking-tight">আইন ও পরামর্শ <span className="text-[#4c71a3] ml-1">❯</span></a>
                  </div>
                  {lawAndAdviceNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-6">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                        <div className="col-span-1 border-b sm:border-b-0 sm:border-r border-[#c8d4e6] pb-5 sm:pb-0 sm:pr-4 flex flex-col">
                           {lawAndAdviceNews[0] && (
                              <a href={getNewsHref(lawAndAdviceNews[0])} target="_blank" rel="noopener noreferrer" className="group block mb-4">
                                 <NewsImage news={lawAndAdviceNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm" />
                                 <h3 className="text-[18px] lg:text-[20px] font-bold group-hover:text-[#355580] leading-snug">{getNewsTitle(lawAndAdviceNews[0])}</h3>
                                 <p className="text-[12px] md:text-[13px] text-gray-500 mt-2">{formatNewsMeta(lawAndAdviceNews[0])}</p>
                              </a>
                           )}
                           <div className="mt-auto space-y-4 pt-3 border-t border-[#c8d4e6]">
                              {lawAndAdviceNews[1] && (
                                 <a href={getNewsHref(lawAndAdviceNews[1])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#355580] leading-snug">
                                       <span className="text-[#4c71a3] mr-1">■</span> {getNewsTitle(lawAndAdviceNews[1])}
                                    </h3>
                                 </a>
                              )}
                              {lawAndAdviceNews[2] && (
                                 <a href={getNewsHref(lawAndAdviceNews[2])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#355580] leading-snug">
                                       <span className="text-[#4c71a3] mr-1">■</span> {getNewsTitle(lawAndAdviceNews[2])}
                                    </h3>
                                 </a>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#c8d4e6]">
                           {lawAndAdviceNews.slice(3, 7).map((news, idx) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold group-hover:text-[#355580] leading-snug">{getNewsTitle(news)}</h3>
                                    <p className="text-[12px] md:text-[13px] text-gray-500 mt-1.5">{formatNewsMeta(news)}</p>
                                 </div>
                                 <NewsImage news={news} className="w-[70px] aspect-video object-cover rounded-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* সাহিত্য */}
               <div className="bg-[#f0fbf7] p-4 sm:p-5 border-t-[4px] border-[#3cb395] rounded-sm min-h-[250px]">
                  <div className="mb-5 border-b border-[#bce8db] pb-2">
                     <a href="/?category=সাহিত্য" className="text-[20px] font-bold text-[#258c73] hover:text-[#165c4b] tracking-tight">সাহিত্য <span className="text-[#3cb395] ml-1">❯</span></a>
                  </div>
                  {literatureNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-6">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                        <div className="col-span-1 border-b sm:border-b-0 sm:border-r border-[#bce8db] pb-5 sm:pb-0 sm:pr-4 flex flex-col">
                           {literatureNews[0] && (
                              <a href={getNewsHref(literatureNews[0])} target="_blank" rel="noopener noreferrer" className="group block mb-4">
                                 <NewsImage news={literatureNews[0]} className="w-full aspect-video object-cover mb-3 rounded-sm" />
                                 <h3 className="text-[18px] lg:text-[20px] font-bold group-hover:text-[#258c73] leading-snug">{getNewsTitle(literatureNews[0])}</h3>
                                 <p className="text-[12px] md:text-[13px] text-gray-500 mt-2">{formatNewsMeta(literatureNews[0])}</p>
                              </a>
                           )}
                           <div className="mt-auto space-y-4 pt-3 border-t border-[#bce8db]">
                              {literatureNews[1] && (
                                 <a href={getNewsHref(literatureNews[1])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#258c73] leading-snug">
                                       <span className="text-[#3cb395] mr-1">■</span> {getNewsTitle(literatureNews[1])}
                                    </h3>
                                 </a>
                              )}
                              {literatureNews[2] && (
                                 <a href={getNewsHref(literatureNews[2])} target="_blank" rel="noopener noreferrer" className="group block">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold text-gray-800 group-hover:text-[#258c73] leading-snug">
                                       <span className="text-[#3cb395] mr-1">■</span> {getNewsTitle(literatureNews[2])}
                                    </h3>
                                 </a>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#bce8db]">
                           {literatureNews.slice(3, 7).map((news, idx) => (
                              <a href={getNewsHref(news)} target="_blank" rel="noopener noreferrer" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-[15px] lg:text-[16px] font-bold group-hover:text-[#258c73] leading-snug">{getNewsTitle(news)}</h3>
                                    <p className="text-[12px] md:text-[13px] text-gray-500 mt-1.5">{formatNewsMeta(news)}</p>
                                 </div>
                                 <NewsImage news={news} className="w-[70px] aspect-video object-cover rounded-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>

          </>
        )}
      </main>

          {/* Footer Section */}
      <footer className="bg-white border-t-4 border-red-700 mt-12 pt-8 pb-6 text-black text-center shadow-inner">
        <div className="max-w-[1200px] mx-auto px-4">
          
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5 text-[15px] md:text-[17px] font-bold mb-6 border-b border-gray-300 pb-4">
             <a href="/" className="hover:text-red-700 transition">প্রচ্ছদ</a> <span className="text-gray-300">|</span>
             <a href="/privacy" className="hover:text-red-700 transition">গোপনীয়তার নীতি</a> <span className="text-gray-300">|</span>
             <a href="/terms" className="hover:text-red-700 transition">শর্তাবলি</a> <span className="text-gray-300">|</span>
             <a href="/disclaimer" className="hover:text-red-700 transition">ডিসক্লেইমার</a> <span className="text-gray-300">|</span>
             <a href="/contact" className="hover:text-red-700 transition text-[#104f96]">বিজ্ঞাপন</a> <span className="text-gray-300">|</span>
             <a href="/contact" className="hover:text-red-700 transition">যোগাযোগ</a>
          </div>

          <div className="mb-6">
             <p className="text-[17px] md:text-[18px] font-bold text-gray-900 leading-snug">
               <span className="block md:inline">সম্পাদক:</span> 
               <span className="block md:inline md:ml-1">অ্যাডভোকেট মো: আজাদুর রহমান</span>
             </p>
             <div className="text-[14px] md:text-[15px] text-gray-700 font-bold mt-3 flex flex-col md:flex-row justify-center items-center gap-1.5 md:gap-3">
               <span>মোবাইল: <a href="tel:09696790279" className="text-red-700 hover:underline">০৯৬৯৬ ৭৯০২৭৯</a></span> 
               <span className="hidden md:inline text-gray-300">|</span> 
               <span>ইমেইল: <a href="mailto:bongiyotimes@gmail.com" className="hover:underline text-[#104f96]">bongiyotimes@gmail.com</a></span>
             </div>
          </div>

          <div className="border-t border-gray-300 pt-5">
             <p className="text-[14px] md:text-[15px] leading-relaxed text-gray-800 font-medium max-w-4xl mx-auto mb-3">
               বাংলাদেশ ও বিশ্বের সকল খবর, ব্রেকিং নিউজ, লাইভ নিউজ, রাজনীতি, বাণিজ্য, খেলা, বিনোদনসহ সকল সর্বশেষ সংবাদ সবার আগে পড়তে ক্লিক করুন বঙ্গীয় টাইমস ডট কম।
             </p>
             <p className="text-[13px] md:text-[14px] text-gray-500 font-bold">&copy; {new Date().getFullYear()} বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
          </div>
          
        </div>
      </footer>
    </div>
  );
}
