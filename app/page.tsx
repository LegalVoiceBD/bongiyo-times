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
  is_custom?: boolean | null;
  importance_score?: number | null;
  editorial_score?: number | null;
  breaking_news?: boolean | null;
  view_count?: number | null;
  click_count?: number | null;
  [key: string]: any;
};

const BRAND_RED = '#b42318';
const BRAND_DARK = '#171717';

function formatDateTime(dateString?: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'এইমাত্র';
  if (diffMins < 60) return `${diffMins} মিনিট আগে`;
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;

  return date.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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
  const found = publisherFromDomain(sourceHomeUrl) || publisherFromDomain(articleUrl) || publisherFromName(rawName);
  if (found) return found.bn;

  const raw = String(rawName || '').trim();
  if (raw === 'বঙ্গীয় টাইমস' || raw === 'বঙ্গীয় টাইমস') return 'বঙ্গীয় টাইমস';
  if (/[\u0980-\u09FF]/.test(raw)) return raw;
  return raw || 'সংবাদ উৎস';
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

  if ((rawName === 'বঙ্গীয় টাইমস' || rawName === 'বঙ্গীয় টাইমস') && publisherFromDomain(articleUrl)) {
    return resolveBanglaPublisherName('', null, articleUrl);
  }

  return resolveBanglaPublisherName(rawName, news.source_home_url, articleUrl);
}

function getNewsSnippet(news: NewsItem | null | undefined) {
  if (!news) return '';
  const raw = String(news.snippet || news.description || news.summary || news.excerpt || '');
  return cleanDisplayText(raw).slice(0, 360);
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
    <div className={`${className} flex items-center justify-center overflow-hidden border border-[#e7e3dc] bg-[#f7f5f1]`}>
      <div className="max-w-full px-3 text-center">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a7a29a]">সংবাদ</div>
        <div className="mt-1 line-clamp-2 text-[12px] font-bold leading-snug text-[#6d6963]">{getNewsSource(news)}</div>
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

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function NewsLink({
  news,
  className = '',
  children,
  ariaLabel,
}: {
  news: NewsItem;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const href = getNewsHref(news);
  const external = isExternalHref(href);

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={className}
      aria-label={ariaLabel || getNewsTitle(news)}
    >
      {children}
    </a>
  );
}

function formatNewsMeta(news: NewsItem | null | undefined) {
  if (!news) return '';
  const source = getNewsSource(news);
  const time = formatDateTime(news.created_at);
  return [source, time].filter(Boolean).join(' • ');
}

function getPopularityScore(news: NewsItem) {
  const views = Number(news.view_count || 0);
  const clicks = Number(news.click_count || 0);
  const importance = Number(news.importance_score || 0);
  const editorial = Number(news.editorial_score || 0);
  const breakingBoost = news.breaking_news ? 80 : 0;
  const createdAt = news.created_at ? new Date(news.created_at).getTime() : 0;
  const ageHours = createdAt > 0 ? Math.max(0, (Date.now() - createdAt) / 3600000) : 72;
  const freshnessBoost = Math.max(0, 72 - Math.min(ageHours, 72));

  return (views * 100) + (clicks * 40) + (importance * 12) + editorial + breakingBoost + freshnessBoost;
}

function buildPopularNews(newsList: NewsItem[], limit = 6) {
  const seen = new Set<string>();

  return [...newsList]
    .filter((news) => {
      const key = String(news.source_url || news.original_url || news.article_url || news.url || news.link || news.id);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
    .slice(0, limit);
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

    if (!inserted && error && urlColumns.some((column) => isMissingColumnError(error, column))) {
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

function MetaLine({ news, className = '' }: { news: NewsItem; className?: string }) {
  return (
    <p className={`text-[11.5px] leading-5 text-[#7a756e] ${className}`}>
      <span className="font-semibold text-[#5f5a54]">{getNewsSource(news)}</span>
      {news.created_at ? <span> • {formatDateTime(news.created_at)}</span> : null}
    </p>
  );
}

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-end justify-between border-b border-[#d9d4cc] pb-2">
      <div className="flex items-center gap-3">
        <span className="h-5 w-[4px] rounded-full bg-[#b42318]" />
        <h2 className="text-[21px] font-black leading-none tracking-[-0.02em] text-[#171717] md:text-[23px]">{title}</h2>
      </div>
      <a href={href} className="text-[12.5px] font-bold text-[#6f6a63] transition hover:text-[#b42318]">আরও খবর →</a>
    </div>
  );
}

function CompactStoryRow({
  news,
  showImage = true,
  showSnippet = false,
  imageClassName = 'h-[78px] w-[116px]',
}: {
  news: NewsItem;
  showImage?: boolean;
  showSnippet?: boolean;
  imageClassName?: string;
}) {
  return (
    <NewsLink news={news} className="group grid grid-cols-[1fr_auto] gap-3 border-b border-[#ece8e1] py-3 first:pt-0 last:border-0 last:pb-0">
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-[1.45] text-[#24221f] transition group-hover:text-[#b42318] md:text-[16px]">
          {getNewsTitle(news)}
        </h3>
        {showSnippet && getNewsSnippet(news) ? (
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.6] text-[#6f6a63]">{getNewsSnippet(news)}</p>
        ) : null}
        <MetaLine news={news} className="mt-1.5" />
      </div>
      {showImage ? (
        <NewsImage news={news} className={`${imageClassName} shrink-0 rounded-[2px] object-cover`} />
      ) : null}
    </NewsLink>
  );
}

function CategoryPanel({ title, items }: { title: string; items: NewsItem[] }) {
  const lead = items[0];
  const rest = items.slice(1, 5);

  return (
    <section className="min-w-0">
      <SectionHeading title={title} href={`/?category=${encodeURIComponent(title)}`} />
      {!lead ? (
        <div className="py-8 text-center text-[13px] text-[#9b958d]">খবর আপডেট হচ্ছে...</div>
      ) : (
        <>
          <NewsLink news={lead} className="group mb-3 grid grid-cols-[44%_1fr] gap-4 border-b border-[#e5e0d8] pb-4">
            <NewsImage news={lead} className="h-full min-h-[150px] w-full rounded-[2px] object-cover" />
            <div className="min-w-0 self-center">
              <h3 className="text-[19px] font-black leading-[1.35] text-[#1f1d1a] transition group-hover:text-[#b42318] md:text-[20px]">
                {getNewsTitle(lead)}
              </h3>
              {getNewsSnippet(lead) ? (
                <p className="mt-2 line-clamp-3 text-[13px] leading-[1.65] text-[#68635d]">{getNewsSnippet(lead)}</p>
              ) : null}
              <MetaLine news={lead} className="mt-2" />
            </div>
          </NewsLink>
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-x-5">
            {rest.map((news) => (
              <CompactStoryRow key={news.id} news={news} showImage={false} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function AdBox({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex w-full items-center justify-center border border-[#ece8e1] bg-[#faf9f7] text-[11px] font-bold tracking-[0.12em] text-[#b1aca4] ${compact ? 'min-h-[110px]' : 'min-h-[170px]'}`}>
      বিজ্ঞাপন
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  activeCategory,
  searchQuery,
}: {
  currentPage: number;
  totalPages: number;
  activeCategory: string;
  searchQuery: string;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (searchQuery) params.set('q', searchQuery);
    params.set('page', String(page));
    return `/?${params.toString()}`;
  };

  return (
    <div className="mt-7 flex items-center justify-center gap-2">
      {currentPage > 1 ? (
        <a href={buildHref(currentPage - 1)} className="border border-[#d6d1c9] px-4 py-2 text-[13px] font-bold text-[#3d3934] transition hover:border-[#b42318] hover:text-[#b42318]">← পূর্ববর্তী</a>
      ) : null}
      <span className="bg-[#171717] px-4 py-2 text-[13px] font-bold text-white">{currentPage}</span>
      {currentPage < totalPages ? (
        <a href={buildHref(currentPage + 1)} className="border border-[#d6d1c9] px-4 py-2 text-[13px] font-bold text-[#3d3934] transition hover:border-[#b42318] hover:text-[#b42318]">পরবর্তী →</a>
      ) : null}
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: {
    category?: string;
    tab?: string;
    page?: string;
    q?: string;
    upload?: string;
    upload_status?: string;
    upload_error?: string;
  };
}) {
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

  let query = supabase
    .from('news')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`).range(startRow, endRow);
  } else if (activeCategory) {
    query = query.ilike('category', `%${activeCategory}%`).range(startRow, endRow);
  } else {
    query = query.limit(160);
  }

  const { data: newsItems, count } = await query;
  const dbNews = (newsItems || []) as NewsItem[];
  const allNews = (activeCategory || searchQuery) ? dbNews.slice(0, limitPerPage) : dbNews.slice(0, 160);
  const totalPages = count ? Math.max(1, Math.ceil(count / limitPerPage)) : 1;
  const latestNews = allNews.slice(0, 6);
  const popularNews = buildPopularNews(allNews, 6);

  const frontPool = [...allNews].slice(0, 34);
  const leadAllowedCategories = ['বাংলাদেশ', 'রাজনীতি', 'আন্তর্জাতিক'];
  const leadIndex = frontPool.findIndex((news) =>
    leadAllowedCategories.some((category) => news.category?.includes(category) ?? false)
  );
  const leadNews = leadIndex >= 0 ? frontPool[leadIndex] : frontPool[0] || null;
  const otherFront = frontPool.filter((news) => !leadNews || String(news.id) !== String(leadNews.id));

  const headerNews = otherFront.slice(0, 3);
  const tickerNews = frontPool.slice(0, 9);
  const centerLead = otherFront[3] || null;
  const centerList = otherFront.slice(4, 7);
  const selectedNews = otherFront.slice(7, 11);

  const fetchDirectCategory = async (catName: string, amt: number) => {
    const { data } = await supabase
      .from('news')
      .select('*')
      .ilike('category', `%${catName}%`)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(amt);

    return ((data || []) as NewsItem[]).slice(0, amt);
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
    fetchDirectCategory('বাংলাদেশ', 12),
    fetchDirectCategory('আন্তর্জাতিক', 8),
    fetchDirectCategory('রাজনীতি', 8),
    fetchDirectCategory('মতামত', 6),
    fetchDirectCategory('খেলাধুলা', 8),
    fetchDirectCategory('বাণিজ্য', 8),
    fetchDirectCategory('বিনোদন', 8),
    fetchDirectCategory('আইন-আদালত', 8),
    fetchDirectCategory('জীবনযাপন', 6),
    fetchDirectCategory('শিক্ষা', 6),
    fetchDirectCategory('চাকরি', 5),
    fetchDirectCategory('প্রযুক্তি', 6),
    fetchDirectCategory('ফিচার', 6),
    fetchDirectCategory('হাস্যরস', 5),
    fetchDirectCategory('ধর্ম', 6),
    fetchDirectCategory('আইন ও পরামর্শ', 6),
    fetchDirectCategory('সাহিত্য', 6),
  ]);

  const menuCategories = [
    'সর্বশেষ',
    'বাংলাদেশ',
    'রাজনীতি',
    'আন্তর্জাতিক',
    'মতামত',
    'খেলাধুলা',
    'বাণিজ্য',
    'বিনোদন',
    'আইন-আদালত',
    'জীবনযাপন',
    'শিক্ষা',
    'চাকরি',
    'প্রযুক্তি',
    'ফিচার',
    'হাস্যরস',
    'আইন ও পরামর্শ',
    'সাহিত্য',
  ];

  const todayFull = new Intl.DateTimeFormat('bn-BD', {
    timeZone: 'Asia/Dhaka',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-white text-[#20201e] antialiased">
      <header className="bg-white">
        <div className="border-b border-[#ebe7e0]">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-4 py-3 md:py-4">
            <div className="flex min-w-0 items-center gap-4">
              <a href="/" className="shrink-0" aria-label="বঙ্গীয় টাইমস প্রচ্ছদ">
                <div className="flex items-center text-[34px] font-black leading-none tracking-[-0.055em] text-black md:text-[42px]">
                  <span>বঙ্গীয়</span>
                  <span className="mx-1 inline-flex h-[35px] w-[35px] items-center justify-center rounded-full border-[2.5px] border-[#c6251d] text-[22px] font-black tracking-normal text-black md:h-[42px] md:w-[42px] md:text-[27px]">টা</span>
                  <span>ইমস</span>
                </div>
                <p className="mt-1 text-[11px] font-semibold tracking-[0.07em] text-[#6d6963] md:text-[12px]">সত্য ও সাহসের প্রতিচ্ছবি</p>
              </a>

              <div className="hidden border-l border-[#d8d2ca] pl-4 md:block">
                <p className="text-[12px] font-bold text-[#55514c]">{todayFull}</p>
                <p className="mt-1 text-[11px] text-[#8c867f]">বাংলাদেশ • সর্বশেষ সংবাদ এক জায়গায়</p>
              </div>
            </div>

            <div className="hidden min-w-0 flex-1 grid-cols-3 divide-x divide-[#ebe7e0] lg:grid">
              {headerNews.map((news) => (
                <NewsLink key={news.id} news={news} className="group grid min-w-0 grid-cols-[1fr_68px] gap-3 px-4 first:pl-0 last:pr-0">
                  <div className="min-w-0">
                    <p className="mb-1 text-[10.5px] font-bold text-[#b42318]">{news.category || 'সর্বশেষ'} <span className="font-normal text-[#8b857e]">• {getNewsSource(news)}</span></p>
                    <h3 className="line-clamp-2 text-[14px] font-bold leading-[1.35] text-[#282622] transition group-hover:text-[#b42318]">{getNewsTitle(news)}</h3>
                  </div>
                  <NewsImage news={news} className="h-[52px] w-[68px] rounded-[2px] object-cover" />
                </NewsLink>
              ))}
            </div>

            <a href="/?upload=1" className="hidden shrink-0 border border-[#b42318] px-3 py-2 text-[12px] font-bold text-[#b42318] transition hover:bg-[#b42318] hover:text-white sm:block">নিজস্ব সংবাদ +</a>
          </div>
        </div>

        <div className="sticky top-0 z-50 border-b border-[#dcd7d0] bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-[48px] max-w-[1240px] items-center gap-4 px-4">
            <nav className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto whitespace-nowrap text-[15px] font-bold text-[#272521] md:gap-6 md:text-[16px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <a href="/" className={`flex h-[48px] items-center border-b-[3px] transition hover:text-[#b42318] ${!activeCategory && !searchQuery ? 'border-[#b42318] text-[#b42318]' : 'border-transparent'}`}>প্রচ্ছদ</a>
              {menuCategories.map((cat) => (
                <a
                  key={cat}
                  href={cat === 'সর্বশেষ' ? '/' : `/?category=${encodeURIComponent(cat)}`}
                  className={`flex h-[48px] items-center border-b-[3px] transition hover:text-[#b42318] ${activeCategory === cat ? 'border-[#b42318] text-[#b42318]' : 'border-transparent'}`}
                >
                  {cat}
                </a>
              ))}
            </nav>

            <form action="/" method="GET" className="hidden shrink-0 md:block">
              <div className="relative">
                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="খবর খুঁজুন..."
                  className="h-9 w-[210px] border border-[#ded9d1] bg-[#faf9f7] pl-3 pr-9 text-[13px] outline-none transition focus:border-[#9a958d] focus:bg-white lg:w-[250px]"
                />
                <button type="submit" className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-[#6f6a63]" aria-label="খবর খুঁজুন">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="border-b border-[#e7e2da] bg-[#faf9f7]">
          <div className="mx-auto flex h-[39px] max-w-[1240px] items-center gap-3 overflow-hidden px-4">
            <span className="shrink-0 border-r border-[#d6d1c9] pr-3 text-[12px] font-black text-[#b42318]">শিরোনাম</span>
            <div className="flex min-w-0 items-center gap-5 overflow-x-auto whitespace-nowrap text-[12.5px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tickerNews.map((news) => (
                <NewsLink key={news.id} news={news} className="group flex items-center gap-2 text-[#3f3b36] transition hover:text-[#b42318]">
                  <span className="h-1.5 w-1.5 shrink-0 bg-[#b42318]" />
                  <span className="max-w-[360px] overflow-hidden text-ellipsis">{getNewsTitle(news)}</span>
                </NewsLink>
              ))}
            </div>
          </div>
        </div>
      </header>

      {showUpload ? (
        <section className="border-b border-[#e5e0d8] bg-[#fbfaf8]">
          <div className="mx-auto max-w-[1240px] px-4 py-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[21px] font-black text-[#171717]">নিজস্ব সংবাদ প্রকাশ</h2>
                <p className="mt-1 text-[12.5px] text-[#777169]">নিজস্ব প্রতিবেদন বা অনুমোদিত উৎসের সংবাদ যোগ করুন।</p>
              </div>
              <a href="/" className="text-[13px] font-bold text-[#6f6a63] hover:text-[#b42318]">বন্ধ করুন ×</a>
            </div>

            {uploadStatus === 'success' ? (
              <div className="mb-4 border border-[#b9dfc6] bg-[#f2fbf5] px-4 py-3 text-[13px] font-bold text-[#23663a]">সংবাদ সফলভাবে প্রকাশ হয়েছে।</div>
            ) : null}
            {uploadStatus === 'missing_title' ? (
              <div className="mb-4 border border-[#f0c6c2] bg-[#fff5f4] px-4 py-3 text-[13px] font-bold text-[#a52a20]">শিরোনাম অবশ্যই দিতে হবে।</div>
            ) : null}
            {uploadStatus === 'config_error' ? (
              <div className="mb-4 border border-[#f0c6c2] bg-[#fff5f4] px-4 py-3 text-[13px] font-bold text-[#a52a20]">Supabase configuration পাওয়া যায়নি।</div>
            ) : null}
            {uploadStatus === 'error' ? (
              <div className="mb-4 border border-[#f0c6c2] bg-[#fff5f4] px-4 py-3 text-[13px] text-[#a52a20]">প্রকাশ করা যায়নি। {uploadError ? decodeURIComponent(uploadError) : ''}</div>
            ) : null}

            <form action={publishCustomNews} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label htmlFor="title" className="mb-1.5 block text-[12px] font-bold text-[#4a4641]">শিরোনাম *</label>
                <input id="title" name="title" required maxLength={220} className="h-10 w-full border border-[#d9d4cc] bg-white px-3 text-[14px] outline-none focus:border-[#9a958d]" />
              </div>
              <div>
                <label htmlFor="category" className="mb-1.5 block text-[12px] font-bold text-[#4a4641]">বিভাগ</label>
                <select id="category" name="category" defaultValue="বাংলাদেশ" className="h-10 w-full border border-[#d9d4cc] bg-white px-3 text-[14px] outline-none focus:border-[#9a958d]">
                  {menuCategories.filter((cat) => cat !== 'সর্বশেষ').map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="source_name" className="mb-1.5 block text-[12px] font-bold text-[#4a4641]">উৎস/লেখক</label>
                <input id="source_name" name="source_name" defaultValue="বঙ্গীয় টাইমস" maxLength={120} className="h-10 w-full border border-[#d9d4cc] bg-white px-3 text-[14px] outline-none focus:border-[#9a958d]" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="image_url" className="mb-1.5 block text-[12px] font-bold text-[#4a4641]">ছবির URL</label>
                <input id="image_url" name="image_url" type="text" placeholder="https://..." className="h-10 w-full border border-[#d9d4cc] bg-white px-3 text-[13px] outline-none focus:border-[#9a958d]" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="source_url" className="mb-1.5 block text-[12px] font-bold text-[#4a4641]">মূল সংবাদ/উৎসের URL</label>
                <input id="source_url" name="source_url" type="text" placeholder="https://..." className="h-10 w-full border border-[#d9d4cc] bg-white px-3 text-[13px] outline-none focus:border-[#9a958d]" />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label htmlFor="snippet" className="mb-1.5 block text-[12px] font-bold text-[#4a4641]">সংক্ষিপ্তসার</label>
                <textarea id="snippet" name="snippet" rows={3} maxLength={1200} className="w-full border border-[#d9d4cc] bg-white px-3 py-2.5 text-[14px] leading-6 outline-none focus:border-[#9a958d]" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="h-[68px] w-full bg-[#171717] px-5 text-[14px] font-bold text-white transition hover:bg-[#b42318]">প্রকাশ করুন</button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <main>
        {(activeCategory || searchQuery) ? (
          <div className="mx-auto max-w-[1240px] px-4 py-6">
            {activeCategory === 'বাংলাদেশ' ? (
              <div className="mb-5 border border-[#e4dfd7] bg-[#faf9f7] p-4">
                <div className="mb-3 flex items-center gap-2 text-[15px] font-black text-[#2c2925]">
                  <span className="text-[#b42318]">⌖</span>
                  আমার এলাকার খবর
                </div>
                <LocationFilter layout="horizontal" />
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
              <section className="lg:col-span-9">
                <div className="mb-5 flex items-end justify-between border-b-2 border-[#171717] pb-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#b42318]">বঙ্গীয় টাইমস</p>
                    <h1 className="mt-1 text-[26px] font-black leading-tight text-[#171717] md:text-[31px]">
                      {searchQuery ? `“${searchQuery}” এর ফলাফল` : activeCategory}
                    </h1>
                  </div>
                  <span className="text-[12px] text-[#8a847c]">{count || allNews.length}টি সংবাদ</span>
                </div>

                {allNews.length === 0 ? (
                  <div className="border border-[#e5e0d8] py-16 text-center text-[15px] font-bold text-[#8f8981]">কোনো সংবাদ পাওয়া যায়নি।</div>
                ) : (
                  <div className="divide-y divide-[#e7e2da]">
                    {allNews.map((news) => (
                      <NewsLink key={news.id} news={news} className="group grid grid-cols-[1fr_128px] gap-4 py-4 first:pt-0 sm:grid-cols-[1fr_190px] sm:gap-5">
                        <div className="min-w-0 self-center">
                          <p className="mb-1 text-[11px] font-bold text-[#b42318]">{news.category || 'সর্বশেষ'}</p>
                          <h2 className="text-[19px] font-black leading-[1.38] text-[#211f1c] transition group-hover:text-[#b42318] md:text-[22px]">{getNewsTitle(news)}</h2>
                          {getNewsSnippet(news) ? (
                            <p className="mt-2 line-clamp-3 text-[13.5px] leading-[1.7] text-[#68635d]">{getNewsSnippet(news)}</p>
                          ) : null}
                          <MetaLine news={news} className="mt-2" />
                        </div>
                        <NewsImage news={news} className="h-[92px] w-[128px] rounded-[2px] object-cover sm:h-[122px] sm:w-[190px]" />
                      </NewsLink>
                    ))}
                  </div>
                )}

                <Pagination currentPage={currentPage} totalPages={totalPages} activeCategory={activeCategory} searchQuery={searchQuery} />
              </section>

              <aside className="space-y-5 lg:col-span-3">
                <ClientTabs latestList={latestNews} popularList={popularNews} />
                <AdBox />
              </aside>
            </div>
          </div>
        ) : (
          <>
            <section className="mx-auto max-w-[1240px] px-4 py-5">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="lg:col-span-6 lg:border-r lg:border-[#e4dfd7] lg:pr-5">
                  {leadNews ? (
                    <NewsLink news={leadNews} className="group block">
                      <NewsImage news={leadNews} className="aspect-[16/9] w-full rounded-[2px] object-cover" />
                      <div className="pt-3">
                        <p className="mb-1.5 text-[11px] font-black text-[#b42318]">{leadNews.category || 'প্রধান সংবাদ'}</p>
                        <h1 className="text-[29px] font-black leading-[1.28] tracking-[-0.02em] text-[#181715] transition group-hover:text-[#b42318] md:text-[34px] lg:text-[36px]">
                          {getNewsTitle(leadNews)}
                        </h1>
                        {getNewsSnippet(leadNews) ? (
                          <p className="mt-3 line-clamp-4 max-w-[95%] text-[14.5px] leading-[1.72] text-[#625d57] md:text-[15px]">{getNewsSnippet(leadNews)}</p>
                        ) : null}
                        <MetaLine news={leadNews} className="mt-3" />
                      </div>
                    </NewsLink>
                  ) : null}
                </div>

                <div className="lg:col-span-3 lg:border-r lg:border-[#e4dfd7] lg:pr-5">
                  {centerLead ? (
                    <NewsLink news={centerLead} className="group mb-4 block border-b border-[#e5e0d8] pb-4">
                      <NewsImage news={centerLead} className="aspect-[16/10] w-full rounded-[2px] object-cover" />
                      <h2 className="mt-3 text-[20px] font-black leading-[1.35] text-[#1f1d1a] transition group-hover:text-[#b42318] md:text-[22px]">{getNewsTitle(centerLead)}</h2>
                      {getNewsSnippet(centerLead) ? (
                        <p className="mt-2 line-clamp-3 text-[13px] leading-[1.65] text-[#6d6861]">{getNewsSnippet(centerLead)}</p>
                      ) : null}
                      <MetaLine news={centerLead} className="mt-2" />
                    </NewsLink>
                  ) : null}
                  <div>
                    {centerList.map((news) => (
                      <CompactStoryRow key={news.id} news={news} showImage={false} />
                    ))}
                  </div>
                </div>

                <aside className="lg:col-span-3">
                  <ClientTabs latestList={latestNews} popularList={popularNews} />
                  <div className="mt-4"><AdBox compact /></div>
                </aside>
              </div>
            </section>

            {selectedNews.length ? (
              <section className="border-y border-[#e5e0d8] bg-[#faf9f7]">
                <div className="mx-auto max-w-[1240px] px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[16px] font-black text-[#211f1c]">নির্বাচিত সংবাদ</h2>
                    <a href="/" className="text-[11.5px] font-bold text-[#8a847c] hover:text-[#b42318]">সর্বশেষ সব খবর →</a>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[#ded9d1]">
                    {selectedNews.map((news, index) => (
                      <NewsLink key={news.id} news={news} className={`group grid grid-cols-[102px_1fr] gap-3 ${index > 0 ? 'lg:pl-4' : ''}`}>
                        <NewsImage news={news} className="h-[78px] w-[102px] rounded-[2px] object-cover" />
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-[15px] font-black leading-[1.4] text-[#26231f] transition group-hover:text-[#b42318]">{getNewsTitle(news)}</h3>
                          <MetaLine news={news} className="mt-1.5" />
                        </div>
                      </NewsLink>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <section className="mx-auto max-w-[1240px] px-4 py-5">
              <div className="border border-[#e4dfd7] bg-[#fbfaf8] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[15px] font-black text-[#292622]"><span className="text-[#b42318]">⌖</span> আমার এলাকার খবর</div>
                  <a href="/?category=বাংলাদেশ" className="text-[11.5px] font-bold text-[#7a756e] hover:text-[#b42318]">সারাদেশ →</a>
                </div>
                <LocationFilter layout="horizontal" />
              </div>
            </section>

            <section className="mx-auto max-w-[1240px] px-4 pb-6">
              <SectionHeading title="বাংলাদেশ" href="/?category=বাংলাদেশ" />
              {bdNews.length ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                  <NewsLink news={bdNews[0]} className="group lg:col-span-5 lg:border-r lg:border-[#e5e0d8] lg:pr-5">
                    <NewsImage news={bdNews[0]} className="aspect-[16/10] w-full rounded-[2px] object-cover" />
                    <h3 className="mt-3 text-[24px] font-black leading-[1.32] text-[#1f1d1a] transition group-hover:text-[#b42318] md:text-[27px]">{getNewsTitle(bdNews[0])}</h3>
                    {getNewsSnippet(bdNews[0]) ? <p className="mt-2 line-clamp-3 text-[13.5px] leading-[1.7] text-[#68635d]">{getNewsSnippet(bdNews[0])}</p> : null}
                    <MetaLine news={bdNews[0]} className="mt-2" />
                  </NewsLink>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:border-r lg:border-[#e5e0d8] lg:pr-5">
                    {bdNews.slice(1, 3).map((news) => (
                      <NewsLink key={news.id} news={news} className="group grid grid-cols-[42%_1fr] gap-3 border-b border-[#e7e2da] pb-4 last:border-0 last:pb-0">
                        <NewsImage news={news} className="h-full min-h-[116px] w-full rounded-[2px] object-cover" />
                        <div className="min-w-0 self-center">
                          <h3 className="text-[17px] font-black leading-[1.4] text-[#24211e] transition group-hover:text-[#b42318]">{getNewsTitle(news)}</h3>
                          {getNewsSnippet(news) ? <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.6] text-[#6f6a63]">{getNewsSnippet(news)}</p> : null}
                          <MetaLine news={news} className="mt-1.5" />
                        </div>
                      </NewsLink>
                    ))}
                  </div>

                  <div className="lg:col-span-3">
                    {bdNews.slice(3, 8).map((news) => (
                      <CompactStoryRow key={news.id} news={news} showImage={false} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-[13px] text-[#9b958d]">খবর আপডেট হচ্ছে...</div>
              )}
            </section>

            <div className="mx-auto max-w-[1240px] px-4 pb-6">
              <div className="grid grid-cols-1 gap-7 border-t border-[#d8d3cb] pt-5 lg:grid-cols-2 lg:gap-8">
                <CategoryPanel title="রাজনীতি" items={politicsNews} />
                <CategoryPanel title="আন্তর্জাতিক" items={intlNews} />
              </div>
            </div>

            <div className="mx-auto max-w-[1240px] px-4 pb-6">
              <div className="grid grid-cols-1 gap-7 border-t border-[#d8d3cb] pt-5 lg:grid-cols-2 lg:gap-8">
                <CategoryPanel title="আইন-আদালত" items={lawNews} />
                <CategoryPanel title="বাণিজ্য" items={businessNews} />
              </div>
            </div>

            <div className="mx-auto max-w-[1240px] px-4 pb-6">
              <div className="grid grid-cols-1 gap-7 border-t border-[#d8d3cb] pt-5 lg:grid-cols-2 lg:gap-8">
                <CategoryPanel title="খেলাধুলা" items={sportsNews} />
                <CategoryPanel title="বিনোদন" items={entertainmentNews} />
              </div>
            </div>

            <div className="mx-auto max-w-[1240px] px-4 pb-6">
              <div className="grid grid-cols-1 gap-7 border-t border-[#d8d3cb] pt-5 lg:grid-cols-2 lg:gap-8">
                <CategoryPanel title="প্রযুক্তি" items={techNews} />
                <CategoryPanel title="শিক্ষা" items={eduNews} />
              </div>
            </div>

            <section className="border-y border-[#ded9d1] bg-[#faf9f7]">
              <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-6 px-4 py-5 lg:grid-cols-3">
                <div>
                  <SectionHeading title="মতামত" href="/?category=মতামত" />
                  {opinionNews.length ? opinionNews.slice(0, 4).map((news, index) => (
                    <NewsLink key={news.id} news={news} className="group block border-b border-[#dfdad2] py-3 first:pt-0 last:border-0 last:pb-0">
                      <p className="mb-1 text-[10.5px] font-black text-[#b42318]">মতামত {index === 0 ? '• নির্বাচিত' : ''}</p>
                      <h3 className={`font-black leading-[1.4] text-[#24211e] transition group-hover:text-[#b42318] ${index === 0 ? 'text-[20px]' : 'text-[15.5px]'}`}>{getNewsTitle(news)}</h3>
                      {index === 0 && getNewsSnippet(news) ? <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-[1.65] text-[#6e6962]">{getNewsSnippet(news)}</p> : null}
                      <MetaLine news={news} className="mt-1.5" />
                    </NewsLink>
                  )) : <div className="py-6 text-center text-[13px] text-[#9b958d]">খবর আপডেট হচ্ছে...</div>}
                </div>

                <div>
                  <SectionHeading title="ফিচার" href="/?category=ফিচার" />
                  {featureNews[0] ? (
                    <NewsLink news={featureNews[0]} className="group block">
                      <NewsImage news={featureNews[0]} className="aspect-[16/9] w-full rounded-[2px] object-cover" />
                      <h3 className="mt-3 text-[20px] font-black leading-[1.38] text-[#24211e] transition group-hover:text-[#b42318]">{getNewsTitle(featureNews[0])}</h3>
                      {getNewsSnippet(featureNews[0]) ? <p className="mt-2 line-clamp-3 text-[12.5px] leading-[1.65] text-[#6e6962]">{getNewsSnippet(featureNews[0])}</p> : null}
                      <MetaLine news={featureNews[0]} className="mt-2" />
                    </NewsLink>
                  ) : null}
                  <div className="mt-3">
                    {featureNews.slice(1, 3).map((news) => <CompactStoryRow key={news.id} news={news} showImage={false} />)}
                  </div>
                </div>

                <div>
                  <SectionHeading title="জীবনযাপন" href="/?category=জীবনযাপন" />
                  {lifestyleNews.slice(0, 4).map((news, index) => (
                    <CompactStoryRow key={news.id} news={news} showImage imageClassName={index === 0 ? 'h-[92px] w-[126px]' : 'h-[70px] w-[102px]'} showSnippet={index === 0} />
                  ))}
                </div>
              </div>
            </section>

            <section className="mx-auto max-w-[1240px] px-4 py-6">
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: 'চাকরি', items: jobsNews },
                  { title: 'ধর্ম', items: religionNews },
                  { title: 'আইন ও পরামর্শ', items: lawAndAdviceNews },
                  { title: 'সাহিত্য', items: literatureNews },
                ].map(({ title, items }) => (
                  <div key={title} className="min-w-0">
                    <SectionHeading title={title} href={`/?category=${encodeURIComponent(title)}`} />
                    {items[0] ? (
                      <NewsLink news={items[0]} className="group block border-b border-[#e5e0d8] pb-3">
                        <NewsImage news={items[0]} className="aspect-[16/10] w-full rounded-[2px] object-cover" />
                        <h3 className="mt-2.5 text-[17px] font-black leading-[1.4] text-[#25221f] transition group-hover:text-[#b42318]">{getNewsTitle(items[0])}</h3>
                        {getNewsSnippet(items[0]) ? <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.6] text-[#6f6a63]">{getNewsSnippet(items[0])}</p> : null}
                        <MetaLine news={items[0]} className="mt-1.5" />
                      </NewsLink>
                    ) : null}
                    <div className="mt-2">
                      {items.slice(1, 3).map((news) => <CompactStoryRow key={news.id} news={news} showImage={false} />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {hasyroshNews.length ? (
              <section className="mx-auto max-w-[1240px] px-4 pb-6">
                <div className="border-t border-[#d8d3cb] pt-5">
                  <SectionHeading title="হাস্যরস" href="/?category=হাস্যরস" />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {hasyroshNews.slice(0, 4).map((news) => (
                      <NewsLink key={news.id} news={news} className="group block">
                        <NewsImage news={news} className="aspect-[16/9] w-full rounded-[2px] object-cover" />
                        <h3 className="mt-2.5 line-clamp-2 text-[16px] font-black leading-[1.42] text-[#282521] transition group-hover:text-[#b42318]">{getNewsTitle(news)}</h3>
                        <MetaLine news={news} className="mt-1.5" />
                      </NewsLink>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>

      <footer className="mt-2 border-t-[3px] border-[#171717] bg-[#f8f6f2]">
        <div className="mx-auto max-w-[1240px] px-4 py-7">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.25fr_1fr_1fr]">
            <div>
              <div className="text-[28px] font-black tracking-[-0.04em] text-[#171717]">বঙ্গীয় টাইমস</div>
              <p className="mt-2 max-w-[520px] text-[12.5px] leading-6 text-[#6d6861]">
                বাংলাদেশ ও বিশ্বের গুরুত্বপূর্ণ সংবাদ, বিশ্লেষণ ও নির্বাচিত প্রতিবেদন—মূল উৎসের স্বচ্ছ ক্রেডিটসহ এক জায়গায়।
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-[12px] font-black uppercase tracking-[0.12em] text-[#38342f]">বিভাগ</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12.5px] text-[#66615a]">
                {['বাংলাদেশ', 'রাজনীতি', 'আন্তর্জাতিক', 'খেলাধুলা', 'বাণিজ্য', 'আইন-আদালত'].map((cat) => (
                  <a key={cat} href={`/?category=${encodeURIComponent(cat)}`} className="hover:text-[#b42318]">{cat}</a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-[12px] font-black uppercase tracking-[0.12em] text-[#38342f]">আরও</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12.5px] text-[#66615a]">
                <a href="/?upload=1" className="hover:text-[#b42318]">নিজস্ব সংবাদ</a>
                <a href="/?category=মতামত" className="hover:text-[#b42318]">মতামত</a>
                <a href="/?category=ফিচার" className="hover:text-[#b42318]">ফিচার</a>
                <a href="/?category=সাহিত্য" className="hover:text-[#b42318]">সাহিত্য</a>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 border-t border-[#ded9d1] pt-4 text-[11.5px] text-[#8b857e] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
            <p>সংবাদে ক্লিক করলে মূল উৎস নতুন ট্যাবে খুলবে; নিজস্ব সংবাদ এই সাইটেই থাকবে।</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
