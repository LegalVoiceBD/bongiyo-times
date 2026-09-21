import React from 'react';
import { createClient } from '@supabase/supabase-js';
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
  image_license?: string | null;
  image_rights?: string | null;
  image_permission?: boolean | null;
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

function isOwnOrLicensedNews(news: NewsItem | null | undefined) {
  if (!news) return false;
  if (news.is_custom === true) return true;

  const source = getNewsSource(news);
  if (source === 'বঙ্গীয় টাইমস' || source === 'বঙ্গীয় টাইমস') return true;
  if (news.image_permission === true) return true;

  const rights = String(news.image_license || news.image_rights || '').toLowerCase();
  return [
    'licensed',
    'permission',
    'permitted',
    'public domain',
    'cc0',
    'creative commons',
    'নিজস্ব',
    'অনুমোদিত',
  ].some((token) => rights.includes(token));
}

function getNewsSnippet(news: NewsItem | null | undefined) {
  if (!news) return '';

  if (isOwnOrLicensedNews(news)) {
    const raw = String(news.snippet || news.description || news.summary || news.excerpt || '');
    return cleanDisplayText(raw).slice(0, 360);
  }

  const title = getNewsTitle(news);
  const source = getNewsSource(news);
  if (!title) return `${source}-এর মূল প্রতিবেদনে বিস্তারিত তথ্য পাওয়া যাবে।`;
  return `${source}-এর প্রতিবেদনে “${title}” বিষয়ে তথ্য প্রকাশিত হয়েছে। বিস্তারিত পড়তে মূল উৎসে যান।`;
}

function getNewsImage(news: NewsItem | null | undefined): string {
  if (!news || !isOwnOrLicensedNews(news)) return '';
  const image = typeof news.image_url === 'string' ? news.image_url.trim() : '';
  return /^https?:\/\//i.test(image) ? image : '';
}

const CODE_VISUAL_THEMES: Record<string, {
  bg: string;
  accent: string;
  soft: string;
  ink: string;
}> = {
  'বাংলাদেশ': { bg: '#f4f0e8', accent: '#b42318', soft: '#ead9cf', ink: '#2b2722' },
  'রাজনীতি': { bg: '#f3eee8', accent: '#8f1d18', soft: '#e6d2ca', ink: '#2a2421' },
  'আন্তর্জাতিক': { bg: '#edf2f5', accent: '#305b78', soft: '#d8e3ea', ink: '#20323f' },
  'অর্থনীতি': { bg: '#eef3ef', accent: '#38634d', soft: '#d8e5dc', ink: '#23362a' },
  'বাণিজ্য': { bg: '#eef3ef', accent: '#38634d', soft: '#d8e5dc', ink: '#23362a' },
  'খেলাধুলা': { bg: '#eef3e9', accent: '#4d6b34', soft: '#dbe6d0', ink: '#2b3822' },
  'বিনোদন': { bg: '#f5eff2', accent: '#8a405d', soft: '#e8d7df', ink: '#3b2831' },
  'আইন-আদালত': { bg: '#f1eff5', accent: '#5b4c7c', soft: '#dfdaea', ink: '#312d3e' },
  'শিক্ষা': { bg: '#eef3f7', accent: '#38658b', soft: '#d8e4ed', ink: '#253744' },
  'প্রযুক্তি': { bg: '#edf4f4', accent: '#31706d', soft: '#d4e7e5', ink: '#223b3a' },
  'স্বাস্থ্য': { bg: '#f3f0ed', accent: '#8a5244', soft: '#e6d9d3', ink: '#382b27' },
  'জীবনযাপন': { bg: '#f3f1e9', accent: '#7b6a38', soft: '#e6e0cc', ink: '#39331f' },
  'চাকরি': { bg: '#eef1f3', accent: '#4d6070', soft: '#dce3e8', ink: '#29333b' },
  'প্রবাস': { bg: '#eef2f6', accent: '#466989', soft: '#dae4ed', ink: '#283947' },
  'পরিবেশ': { bg: '#edf3ec', accent: '#4f7045', soft: '#d8e6d5', ink: '#2c3b28' },
  'কৃষি': { bg: '#f0f3e8', accent: '#61773a', soft: '#dfe7ca', ink: '#303923' },
  'বিজ্ঞান': { bg: '#eff1f7', accent: '#4f5f8d', soft: '#dce1ef', ink: '#2c3248' },
  'সংস্কৃতি': { bg: '#f5f0e8', accent: '#9a6138', soft: '#eadbc9', ink: '#3d2e22' },
  'ধর্ম': { bg: '#eef3ef', accent: '#4e6f59', soft: '#d9e6dd', ink: '#29372e' },
  'ফিচার': { bg: '#f4f0eb', accent: '#86614a', soft: '#e6d9cf', ink: '#382e28' },
  'সাহিত্য': { bg: '#f5f1ec', accent: '#7b5a49', soft: '#e8ddd4', ink: '#382e29' },
  'হাস্যরস': { bg: '#f4f1e9', accent: '#88702f', soft: '#e9e1c8', ink: '#3d351f' },
};

function getCodeVisualTheme(news: NewsItem | null | undefined) {
  const category = String(news?.category || 'বাংলাদেশ').trim();
  return CODE_VISUAL_THEMES[category] || CODE_VISUAL_THEMES['বাংলাদেশ'];
}

function getVisualVariant(news: NewsItem | null | undefined) {
  const text = `${news?.id || ''}-${getNewsTitle(news)}-${news?.category || ''}`;
  let total = 0;
  for (let i = 0; i < text.length; i += 1) total = (total + text.charCodeAt(i) * (i + 3)) % 997;
  return total % 4;
}

function getVisualDensity(className: string) {
  const compactTokens = ['w-[68px]', 'w-[74px]', 'w-[78px]', 'w-[92px]', 'h-[52px]', 'h-[62px]'];
  const smallTokens = ['w-[102px]', 'w-[104px]', 'w-[112px]', 'w-[116px]', 'w-[128px]', 'h-[74px]', 'h-[78px]', 'h-[92px]'];

  if (compactTokens.some((token) => className.includes(token))) return 'tiny';
  if (smallTokens.some((token) => className.includes(token))) return 'small';
  return 'regular';
}

function CodeNewsVisual({
  news,
  className,
  density = 'regular',
}: {
  news: NewsItem | null | undefined;
  className: string;
  density?: 'regular' | 'small' | 'tiny';
}) {
  const theme = getCodeVisualTheme(news);
  const variant = getVisualVariant(news);
  const category = String(news?.category || 'সর্বশেষ').trim();
  const source = getNewsSource(news);
  const isTiny = density === 'tiny';
  const isSmall = density === 'small';

  const backgroundImage = [
    `linear-gradient(135deg, ${theme.bg} 0%, ${theme.soft} 100%)`,
    `repeating-linear-gradient(135deg, transparent 0 14px, ${theme.accent}08 14px 15px)`,
    `linear-gradient(90deg, transparent 0 49.2%, ${theme.accent}12 49.2% 50.8%, transparent 50.8% 100%)`,
  ].join(',');

  const shellClass = isTiny
    ? 'p-[6px]'
    : isSmall
      ? 'p-[8px]'
      : 'p-[clamp(12px,2.15vw,24px)]';

  const categoryClass = isTiny
    ? 'text-[10.5px] leading-[1.02] tracking-[-0.025em]'
    : isSmall
      ? 'text-[15px] leading-[1.05] tracking-[-0.03em]'
      : 'text-[clamp(18px,3vw,33px)] leading-none tracking-[-0.035em]';

  const sourceClass = isTiny
    ? 'mt-0.5 text-[7px] leading-[1.25]'
    : isSmall
      ? 'mt-1 text-[8.5px] leading-[1.35]'
      : 'mt-2 text-[clamp(10px,1.2vw,12.5px)] leading-[1.5]';

  return (
    <div
      className={`${className} relative isolate overflow-hidden border border-[#e2ddd5]`}
      style={{ backgroundColor: theme.bg, backgroundImage }}
      aria-label={`${source} — ${category} সংবাদ`}
    >
      <div
        className={`absolute rounded-full border ${isTiny ? '-right-[22%] -top-[30%] h-[70%] w-[70%]' : isSmall ? '-right-[13%] -top-[24%] h-[62%] w-[62%]' : variant % 2 === 0 ? '-right-[9%] -top-[18%] h-[58%] w-[58%]' : '-left-[12%] -bottom-[22%] h-[62%] w-[62%]'}`}
        style={{ borderColor: `${theme.accent}2e`, backgroundColor: `${theme.accent}09` }}
      />
      <div
        className={`absolute ${isTiny ? 'left-[8%] top-[10%] h-[1.5px] w-[28%]' : variant < 2 ? 'right-[7%] top-[12%] h-[2px] w-[36%]' : 'left-[7%] bottom-[14%] h-[2px] w-[40%]'}`}
        style={{ backgroundColor: `${theme.accent}80` }}
      />
      {!isTiny ? (
        <div
          className={`absolute ${isSmall ? 'right-[8%] bottom-[10%] text-[54px]' : variant === 1 || variant === 3 ? 'right-[10%] bottom-[12%] text-[clamp(38px,8vw,92px)]' : 'left-[8%] top-[12%] text-[clamp(38px,8vw,92px)]'} font-black leading-none opacity-[0.05]`}
          style={{ color: theme.ink }}
        >
          {category.slice(0, 2)}
        </div>
      ) : null}

      <div className={`relative z-10 flex h-full w-full flex-col justify-between ${shellClass}`}>
        <div className="flex items-center gap-1.5">
          <span className={`${isTiny ? 'h-1.5 w-1.5' : 'h-2 w-2'} rounded-full`} style={{ backgroundColor: theme.accent }} />
          <span className={`${isTiny ? 'text-[6.3px] tracking-[0.08em]' : isSmall ? 'text-[7px] tracking-[0.1em]' : 'text-[9px] tracking-[0.15em]'} font-black uppercase`} style={{ color: theme.accent }}>
            {isTiny ? 'সংবাদ' : 'সংবাদসংগ্রহ'}
          </span>
        </div>

        <div className="min-w-0">
          <div className={`${categoryClass} font-black`} style={{ color: theme.ink }}>
            {isTiny && category.length > 9 ? `${category.slice(0, 8)}…` : category}
          </div>
          <div className={`max-w-[96%] ${isTiny ? 'line-clamp-1' : 'line-clamp-2'} font-semibold ${sourceClass}`} style={{ color: `${theme.ink}b0` }}>
            {isTiny ? source : source}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`${isTiny ? 'text-[6.2px]' : isSmall ? 'text-[7px]' : 'text-[8.7px]'} font-semibold tracking-[0.035em]`} style={{ color: `${theme.ink}82` }}>
            {isTiny ? 'মূল উৎস' : 'মূল প্রতিবেদনে বিস্তারিত'}
          </span>
          <span className={`${isTiny ? 'text-[9px]' : isSmall ? 'text-[11px]' : 'text-[15px]'} font-black`} style={{ color: theme.accent }}>↗</span>
        </div>
      </div>
    </div>
  );
}

function NewsImage({ news, className }: { news: NewsItem | null | undefined; className: string }) {
  const src = getNewsImage(news);
  if (src) {
    return <SafeImage src={src} alt={getNewsTitle(news)} className={className} />;
  }

  return <CodeNewsVisual news={news} className={className} density={getVisualDensity(className)} />;
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


const CATEGORY_RULES: Record<string, { native: string[]; keywords: string[]; fallback?: string[] }> = {
  'বাংলাদেশ': {
    native: ['বাংলাদেশ'],
    keywords: ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'সিলেট', 'বরিশাল', 'রংপুর', 'ময়মনসিংহ', 'জেলা', 'উপজেলা'],
  },
  'রাজনীতি': {
    native: ['রাজনীতি'],
    keywords: ['বিএনপি', 'আওয়ামী লীগ', 'জামায়াত', 'নির্বাচন', 'ভোট', 'সংসদ', 'রাজনৈতিক', 'দলীয়'],
  },
  'আন্তর্জাতিক': {
    native: ['আন্তর্জাতিক'],
    keywords: ['যুক্তরাষ্ট্র', 'ভারত', 'চীন', 'রাশিয়া', 'ইউক্রেন', 'গাজা', 'ইসরায়েল', 'জাতিসংঘ', 'পাকিস্তান', 'বিশ্ব'],
  },
  'অর্থনীতি': {
    native: ['বাণিজ্য', 'অর্থনীতি'],
    keywords: ['ব্যাংক', 'ডলার', 'অর্থনীতি', 'বাজার', 'বাণিজ্য', 'শেয়ারবাজার', 'পুঁজিবাজার', 'বাজেট', 'রপ্তানি', 'আমদানি', 'মূল্যস্ফীতি', 'ঋণ'],
  },
  'খেলাধুলা': {
    native: ['খেলাধুলা'],
    keywords: ['ক্রিকেট', 'ফুটবল', 'ম্যাচ', 'খেলা', 'বিশ্বকাপ', 'ফিফা', 'বিসিবি', 'টেস্ট', 'ওয়ানডে', 'টি-টোয়েন্টি'],
  },
  'বিনোদন': {
    native: ['বিনোদন'],
    keywords: ['সিনেমা', 'চলচ্চিত্র', 'অভিনেতা', 'অভিনেত্রী', 'নাটক', 'গায়ক', 'গায়িকা', 'বলিউড', 'হলিউড'],
  },
  'আইন-আদালত': {
    native: ['আইন-আদালত'],
    keywords: ['আদালত', 'হাইকোর্ট', 'সুপ্রিম কোর্ট', 'মামলা', 'জামিন', 'রিমান্ড', 'রায়', 'আইনজীবী', 'ট্রাইব্যুনাল'],
  },
  'শিক্ষা': {
    native: ['শিক্ষা'],
    keywords: ['বিশ্ববিদ্যালয়', 'কলেজ', 'স্কুল', 'শিক্ষার্থী', 'পরীক্ষা', 'ভর্তি', 'শিক্ষক', 'এইচএসসি', 'এসএসসি'],
  },
  'প্রযুক্তি': {
    native: ['প্রযুক্তি'],
    keywords: ['প্রযুক্তি', 'কৃত্রিম বুদ্ধিমত্তা', 'এআই', 'ইন্টারনেট', 'গুগল', 'মাইক্রোসফট', 'স্মার্টফোন', 'সাইবার', 'অ্যাপ'],
  },
  'স্বাস্থ্য': {
    native: ['স্বাস্থ্য'],
    keywords: ['স্বাস্থ্য', 'চিকিৎসা', 'হাসপাতাল', 'চিকিৎসক', 'ডাক্তার', 'রোগ', 'ডেঙ্গু', 'ক্যানসার', 'ওষুধ', 'ভ্যাকসিন', 'সংক্রমণ'],
    fallback: ['জীবনযাপন'],
  },
  'জীবনযাপন': {
    native: ['জীবনযাপন'],
    keywords: ['জীবনযাপন', 'লাইফস্টাইল', 'খাদ্য', 'রেসিপি', 'ফ্যাশন', 'সম্পর্ক', 'পরিবার', 'ভ্রমণ'],
  },
  'চাকরি': {
    native: ['চাকরি'],
    keywords: ['চাকরি', 'নিয়োগ', 'ক্যারিয়ার', 'বেতন', 'আবেদন', 'পদসংখ্যা'],
  },
  'প্রবাস': {
    native: ['প্রবাস'],
    keywords: ['প্রবাস', 'প্রবাসী', 'অভিবাসী', 'অভিবাসন', 'রেমিট্যান্স', 'ভিসা', 'বিদেশে বাংলাদেশি'],
    fallback: ['আন্তর্জাতিক'],
  },
  'পরিবেশ': {
    native: ['পরিবেশ'],
    keywords: ['পরিবেশ', 'জলবায়ু', 'দূষণ', 'বায়ুদূষণ', 'নদী', 'বন্যা', 'ঘূর্ণিঝড়', 'তাপপ্রবাহ', 'বন', 'বন্যপ্রাণী'],
    fallback: ['বাংলাদেশ'],
  },
  'কৃষি': {
    native: ['কৃষি'],
    keywords: ['কৃষি', 'কৃষক', 'ফসল', 'ধান', 'চাল', 'গম', 'ভুট্টা', 'পাট', 'সবজি', 'ফল', 'বীজ', 'সার', 'সেচ', 'মৎস্য', 'পোলট্রি', 'খামার', 'কৃষি গবেষণা', 'কৃষি মন্ত্রণালয়'],
    fallback: [],
  },
  'বিজ্ঞান': {
    native: ['বিজ্ঞান'],
    keywords: ['বিজ্ঞান', 'গবেষণা', 'মহাকাশ', 'নাসা', 'উপগ্রহ', 'জ্যোতির্বিজ্ঞান', 'আবিষ্কার'],
    fallback: ['প্রযুক্তি'],
  },
  'সংস্কৃতি': {
    native: ['সংস্কৃতি'],
    keywords: ['সংস্কৃতি', 'শিল্পকলা', 'নাট্য', 'চিত্রকলা', 'সংগীত', 'উৎসব', 'ঐতিহ্য'],
    fallback: ['সাহিত্য', 'বিনোদন'],
  },
  'মতামত': {
    native: ['মতামত'],
    keywords: ['মতামত', 'বিশ্লেষণ', 'কলাম', 'সম্পাদকীয়'],
  },
  'ফিচার': {
    native: ['ফিচার'],
    keywords: ['ফিচার', 'বিশেষ প্রতিবেদন', 'বিশেষ আয়োজন'],
    fallback: ['জীবনযাপন'],
  },
  'ধর্ম': {
    native: ['ধর্ম'],
    keywords: ['ধর্ম', 'ইসলাম', 'হজ', 'ওমরাহ', 'মসজিদ', 'কোরআন', 'পূজা', 'মন্দির', 'রমজান'],
  },
  'সাহিত্য': {
    native: ['সাহিত্য'],
    keywords: ['সাহিত্য', 'কবিতা', 'গল্প', 'উপন্যাস', 'লেখক', 'বই'],
    fallback: ['ফিচার'],
  },
  'হাস্যরস': {
    native: ['হাস্যরস'],
    keywords: ['হাস্যরস', 'রসিকতা', 'ব্যঙ্গ'],
    fallback: ['বিনোদন'],
  },
  'আইন ও পরামর্শ': {
    native: ['আইন ও পরামর্শ'],
    keywords: ['আইনি পরামর্শ', 'আইন ও পরামর্শ', 'আইনজীবীর পরামর্শ', 'আইনি সহায়তা'],
    fallback: ['আইন-আদালত'],
  },
};

const PRIMARY_MENU_CATEGORIES = [
  'সর্বশেষ',
  'বাংলাদেশ',
  'রাজনীতি',
  'আন্তর্জাতিক',
  'অর্থনীতি',
  'খেলাধুলা',
  'বিনোদন',
  'আইন-আদালত',
  'শিক্ষা',
  'প্রযুক্তি',
];

const SECONDARY_MENU_CATEGORIES = [
  'মতামত',
  'স্বাস্থ্য',
  'জীবনযাপন',
  'চাকরি',
  'প্রবাস',
  'পরিবেশ',
  'কৃষি',
  'বিজ্ঞান',
  'সংস্কৃতি',
  'ধর্ম',
  'ফিচার',
  'সাহিত্য',
  'হাস্যরস',
  'আইন ও পরামর্শ',
];

function newsIdentity(news: NewsItem) {
  return String(news.source_url || news.original_url || news.article_url || news.url || news.link || news.id);
}

function dedupeNews(items: NewsItem[]) {
  const seen = new Set<string>();
  return items.filter((news) => {
    const key = newsIdentity(news);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function newsMatchesCategory(news: NewsItem, category: string) {
  const rule = CATEGORY_RULES[category];
  if (!rule) return String(news.category || '').includes(category);

  const nativeCategory = String(news.category || '').toLowerCase();
  if (rule.native.some((name) => nativeCategory.includes(name.toLowerCase()))) return true;

  const text = cleanDisplayText(`${getNewsTitle(news)} ${getNewsSnippet(news)} ${news.category || ''}`).toLowerCase();
  return rule.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function getCategoryItems(pool: NewsItem[], category: string, limit = 8) {
  const result: NewsItem[] = [];
  const seen = new Set<string>();

  const addMatches = (targetCategory: string) => {
    for (const news of pool) {
      if (result.length >= limit) break;
      if (!newsMatchesCategory(news, targetCategory)) continue;
      const key = newsIdentity(news);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(news);
    }
  };

  addMatches(category);

  if (result.length === 0) {
    const fallbacks = CATEGORY_RULES[category]?.fallback || [];
    for (const fallback of fallbacks) {
      if (result.length >= limit) break;
      addMatches(fallback);
      if (result.length > 0) break;
    }
  }

  return result.slice(0, limit);
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
    <div className="relative mb-4 flex items-end justify-between border-b border-[#d9d4cc] pb-2.5">
      <div className="flex items-center gap-2.5">
        <span className="h-[18px] w-[3px] rounded-full bg-[#b42318]" />
        <h2 className="text-[20px] font-black leading-none tracking-[-0.02em] text-[#171717] md:text-[22px]">{title}</h2>
      </div>
      <a href={href} className="text-[11.8px] font-bold text-[#777169] transition hover:text-[#b42318]">আরও খবর →</a>
      <span className="absolute bottom-[-1px] left-0 h-[2px] w-[56px] bg-[#b42318]" />
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


function MiniCategoryPanel({ title, items }: { title: string; items: NewsItem[] }) {
  const lead = items[0];
  const rest = items.slice(1, 3);

  return (
    <section className="min-w-0 border-t border-[#d8d3cb] pt-4">
      <div className="mb-3 flex items-center justify-between">
        <a href={`/?category=${encodeURIComponent(title)}`} className="text-[18px] font-black text-[#1d1b18] transition hover:text-[#b42318]">{title}</a>
        <a href={`/?category=${encodeURIComponent(title)}`} className="text-[11px] font-bold text-[#8a847c] hover:text-[#b42318]">আরও →</a>
      </div>
      {lead ? (
        <>
          <NewsLink news={lead} className="group grid grid-cols-[112px_1fr] gap-3 border-b border-[#e7e2da] pb-3">
            <NewsImage news={lead} className="h-[78px] w-[112px] rounded-[2px] object-cover" />
            <div className="min-w-0 self-center">
              <h3 className="line-clamp-2 text-[15.5px] font-black leading-[1.42] text-[#25221f] transition group-hover:text-[#b42318]">{getNewsTitle(lead)}</h3>
              <MetaLine news={lead} className="mt-1" />
            </div>
          </NewsLink>
          <div className="mt-2">
            {rest.map((news) => <CompactStoryRow key={news.id} news={news} showImage={false} />)}
          </div>
        </>
      ) : (
        <div className="py-5 text-[12px] text-[#9b958d]">এই বিভাগের সংবাদ সংগ্রহ হচ্ছে...</div>
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
  };
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const activeCategory = searchParams.category ? searchParams.category.trim() : '';
  const searchQuery = searchParams.q ? searchParams.q.trim() : '';
  const currentPage = Math.max(1, parseInt(searchParams.page || '1') || 1);
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
  } else {
    // Category pages are filtered intelligently in memory so virtual national
    // sections such as স্বাস্থ্য/প্রবাস/পরিবেশ also work without schema changes.
    query = query.limit(activeCategory ? 320 : 180);
  }

  const { data: newsItems, count: rawCount } = await query;
  const dbNews = (newsItems || []) as NewsItem[];

  let allNews: NewsItem[] = [];
  let effectiveCount = rawCount || 0;

  if (searchQuery) {
    allNews = dbNews.slice(0, limitPerPage);
  } else if (activeCategory) {
    const categoryMatches = getCategoryItems(dbNews, activeCategory, 320);
    effectiveCount = categoryMatches.length;
    allNews = categoryMatches.slice(startRow, endRow + 1);
  } else {
    allNews = dbNews.slice(0, 180);
    effectiveCount = allNews.length;
  }

  const totalPages = Math.max(1, Math.ceil(effectiveCount / limitPerPage));
  const latestNews = allNews.slice(0, 6);
  const popularNews = buildPopularNews(allNews, 6);

  const frontPool = [...(activeCategory || searchQuery ? dbNews : allNews)].slice(0, 40);
  const leadAllowedCategories = ['বাংলাদেশ', 'রাজনীতি', 'আন্তর্জাতিক'];
  const leadIndex = frontPool.findIndex((news) =>
    leadAllowedCategories.some((category) => news.category?.includes(category) ?? false)
  );
  const leadNews = leadIndex >= 0 ? frontPool[leadIndex] : frontPool[0] || null;
  const otherFront = frontPool.filter((news) => !leadNews || String(news.id) !== String(leadNews.id));

  const headerNews = otherFront.slice(0, 3);
  const tickerNews = frontPool.slice(0, 12);
  const centerLead = otherFront[3] || null;
  const centerList = otherFront.slice(4, 7);
  const selectedNews = otherFront.slice(7, 11);
  const leadSupportNews = otherFront.slice(11, 13);

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

  const categoryPool = dedupeNews([
    ...dbNews,
    ...bdNews,
    ...intlNews,
    ...politicsNews,
    ...opinionNews,
    ...sportsNews,
    ...businessNews,
    ...entertainmentNews,
    ...lawNews,
    ...lifestyleNews,
    ...eduNews,
    ...jobsNews,
    ...techNews,
    ...featureNews,
    ...hasyroshNews,
    ...religionNews,
    ...lawAndAdviceNews,
    ...literatureNews,
  ]);

  const economyNews = businessNews.length ? businessNews : getCategoryItems(categoryPool, 'অর্থনীতি', 8);
  const healthNews = getCategoryItems(categoryPool, 'স্বাস্থ্য', 6);
  const diasporaNews = getCategoryItems(categoryPool, 'প্রবাস', 6);
  const environmentNews = getCategoryItems(categoryPool, 'পরিবেশ', 6);
  const agricultureNews = getCategoryItems(categoryPool, 'কৃষি', 6);
  const scienceNews = getCategoryItems(categoryPool, 'বিজ্ঞান', 6);
  const cultureNews = getCategoryItems(categoryPool, 'সংস্কৃতি', 6);


  const nowDhaka = new Date();
  const todayFull = new Intl.DateTimeFormat('bn-BD', {
    timeZone: 'Asia/Dhaka',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(nowDhaka);
  const todayWeekday = new Intl.DateTimeFormat('bn-BD', {
    timeZone: 'Asia/Dhaka',
    weekday: 'long',
  }).format(nowDhaka);
  const todayDateShort = new Intl.DateTimeFormat('bn-BD', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(nowDhaka);

  return (
    <div className="min-h-screen bg-white text-[#20201e] antialiased">
      <style>{`
        @keyframes btTickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .bt-ticker-track {
          animation: btTickerScroll 56s linear infinite;
          will-change: transform;
        }
        .bt-ticker:hover .bt-ticker-track {
          animation-play-state: paused;
        }
        ::selection {
          background: #b42318;
          color: white;
        }
        .bt-soft-rule {
          background: linear-gradient(90deg, #b42318 0 54px, #ded9d1 54px 100%);
        }
        @media (prefers-reduced-motion: reduce) {
          .bt-ticker-track { animation: none; }
        }
      `}</style>
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

            <div className="ml-auto shrink-0 text-right md:hidden">
              <p className="text-[12px] font-black leading-tight text-[#27231f]">{todayWeekday}</p>
              <p className="mt-1 text-[10.5px] font-medium leading-tight text-[#777169]">{todayDateShort}</p>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-50 border-b border-[#dcd7d0] bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-[47px] max-w-[1240px] items-center gap-4 px-4">
            <nav className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto whitespace-nowrap text-[14.5px] font-bold text-[#272521] md:gap-6 md:text-[15.5px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <a href="/" className={`flex h-[47px] items-center border-b-[3px] transition hover:text-[#b42318] ${!activeCategory && !searchQuery ? 'border-[#b42318] text-[#b42318]' : 'border-transparent'}`}>প্রচ্ছদ</a>
              {PRIMARY_MENU_CATEGORIES.map((cat) => (
                <a
                  key={cat}
                  href={cat === 'সর্বশেষ' ? '/' : `/?category=${encodeURIComponent(cat)}`}
                  className={`flex h-[47px] items-center border-b-[3px] transition hover:text-[#b42318] ${activeCategory === cat ? 'border-[#b42318] text-[#b42318]' : 'border-transparent'}`}
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
                  className="h-9 w-[190px] border border-[#ded9d1] bg-[#faf9f7] pl-3 pr-9 text-[13px] outline-none transition focus:border-[#9a958d] focus:bg-white lg:w-[225px]"
                />
                <button type="submit" className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-[#6f6a63]" aria-label="খবর খুঁজুন">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </button>
              </div>
            </form>
          </div>

          <div className="border-t border-[#eee9e2] bg-[#fbfaf8]">
            <nav className="mx-auto flex min-h-[34px] max-w-[1240px] items-center gap-x-5 overflow-x-auto whitespace-nowrap px-4 text-[12.5px] font-bold text-[#5b5650] md:flex-wrap md:justify-start md:gap-y-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SECONDARY_MENU_CATEGORIES.map((cat) => (
                <a
                  key={cat}
                  href={`/?category=${encodeURIComponent(cat)}`}
                  className={`flex h-[34px] items-center border-b-2 transition hover:text-[#b42318] ${activeCategory === cat ? 'border-[#b42318] text-[#b42318]' : 'border-transparent'}`}
                >
                  {cat}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="bt-ticker border-b border-[#e7e2da] bg-[#faf9f7]">
          <div className="mx-auto flex h-[39px] max-w-[1240px] items-center gap-3 overflow-hidden px-4">
            <span className="z-10 shrink-0 border-r border-[#d6d1c9] bg-[#faf9f7] pr-3 text-[12px] font-black text-[#b42318]">সর্বশেষ শিরোনাম</span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="bt-ticker-track flex w-max items-center whitespace-nowrap text-[12.5px]">
                {[...tickerNews, ...tickerNews].map((news, index) => (
                  <NewsLink key={`${news.id}-${index}`} news={news} className="group mr-7 flex items-center gap-2 text-[#3f3b36] transition hover:text-[#b42318]">
                    <span className="h-1.5 w-1.5 shrink-0 bg-[#b42318]" />
                    <span className="max-w-[420px] overflow-hidden text-ellipsis">{getNewsTitle(news)}</span>
                  </NewsLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

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
                  <span className="text-[12px] text-[#8a847c]">{effectiveCount || allNews.length}টি সংবাদ</span>
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
                          <p className="mt-3 line-clamp-5 max-w-[95%] text-[14.5px] leading-[1.72] text-[#625d57] md:text-[15px]">{getNewsSnippet(leadNews)}</p>
                        ) : null}
                        <MetaLine news={leadNews} className="mt-3" />
                      </div>
                    </NewsLink>
                  ) : null}

                  {leadSupportNews.length ? (
                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#e5e0d8] pt-4 sm:grid-cols-2 lg:grid-cols-1">
                      {leadSupportNews.map((news) => (
                        <NewsLink key={news.id} news={news} className="group grid grid-cols-[104px_1fr] gap-3 rounded-[2px] bg-[#fbfaf8] p-2.5 transition hover:bg-[#f7f4ef]">
                          <NewsImage news={news} className="h-[74px] w-[104px] rounded-[2px] object-cover" />
                          <div className="min-w-0 self-center">
                            <h3 className="line-clamp-2 text-[14.5px] font-black leading-[1.42] text-[#27241f] transition group-hover:text-[#b42318]">{getNewsTitle(news)}</h3>
                            {getNewsSnippet(news) ? <p className="mt-1 line-clamp-2 text-[11.5px] leading-[1.5] text-[#777169]">{getNewsSnippet(news)}</p> : null}
                            <MetaLine news={news} className="mt-1" />
                          </div>
                        </NewsLink>
                      ))}
                    </div>
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
                <CategoryPanel title="অর্থনীতি" items={economyNews} />
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

            <section className="mx-auto max-w-[1240px] px-4 pb-6">
              <div className="mb-1 flex items-center justify-between border-t border-[#d8d3cb] pt-5">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#b42318]">আরও বিভাগ</p>
                  <h2 className="mt-1 text-[22px] font-black text-[#1c1a17]">স্বাস্থ্য, প্রবাস, পরিবেশ, কৃষি, বিজ্ঞান ও সংস্কৃতি</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-7 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <MiniCategoryPanel title="স্বাস্থ্য" items={healthNews} />
                <MiniCategoryPanel title="প্রবাস" items={diasporaNews} />
                <MiniCategoryPanel title="পরিবেশ" items={environmentNews} />
                <MiniCategoryPanel title="কৃষি" items={agricultureNews} />
                <MiniCategoryPanel title="বিজ্ঞান" items={scienceNews} />
                <MiniCategoryPanel title="সংস্কৃতি" items={cultureNews} />
              </div>
            </section>

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

      <footer className="mt-4 border-t-[3px] border-[#171717] bg-[#f7f5f1]">
        <div className="mx-auto max-w-[1240px] px-4 py-8">
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.35fr_.85fr_.85fr_1.05fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="text-[28px] font-black tracking-[-0.045em] text-[#171717]">বঙ্গীয় টাইমস</div>
                <span className="h-1.5 w-1.5 rounded-full bg-[#b42318]" />
              </div>
              <p className="mt-2 max-w-[560px] text-[12.5px] leading-6 text-[#6b665f]">
                বাংলাদেশ ও বিশ্বের গুরুত্বপূর্ণ সংবাদকে দ্রুত, সংক্ষিপ্ত ও উৎসভিত্তিকভাবে পাঠকের সামনে উপস্থাপন করে বঙ্গীয় টাইমস। তৃতীয় পক্ষের সংবাদে উৎসের পরিচয় ও মূল লিংক স্পষ্টভাবে দেখানো হয়।
              </p>

              <div className="mt-4 border-l-[3px] border-[#b42318] bg-white px-4 py-3.5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                <p className="text-[10.5px] font-black uppercase tracking-[0.15em] text-[#8a847c]">সম্পাদক</p>
                <p className="mt-1 text-[16.5px] font-black tracking-[-0.02em] text-[#171717]">এডভোকেট মোঃ আজাদুর রহমান</p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 border-b border-[#ded9d1] pb-2 text-[11.5px] font-black uppercase tracking-[0.12em] text-[#38342f]">প্রধান বিভাগ</h3>
              <div className="grid grid-cols-1 gap-y-2 text-[12.3px] text-[#625d57]">
                {['বাংলাদেশ', 'রাজনীতি', 'আন্তর্জাতিক', 'অর্থনীতি', 'খেলাধুলা', 'আইন-আদালত'].map((cat) => (
                  <a key={cat} href={`/?category=${encodeURIComponent(cat)}`} className="transition hover:translate-x-0.5 hover:text-[#b42318]">{cat}</a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 border-b border-[#ded9d1] pb-2 text-[11.5px] font-black uppercase tracking-[0.12em] text-[#38342f]">আরও বিভাগ</h3>
              <div className="grid grid-cols-1 gap-y-2 text-[12.3px] text-[#625d57]">
                {['শিক্ষা', 'প্রযুক্তি', 'স্বাস্থ্য', 'কৃষি', 'প্রবাস', 'পরিবেশ'].map((cat) => (
                  <a key={cat} href={`/?category=${encodeURIComponent(cat)}`} className="transition hover:translate-x-0.5 hover:text-[#b42318]">{cat}</a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 border-b border-[#ded9d1] pb-2 text-[11.5px] font-black uppercase tracking-[0.12em] text-[#38342f]">প্রকাশনা নীতি</h3>
              <div className="space-y-2 text-[11.8px] leading-5.5 text-[#6d6861]">
                <p>বঙ্গীয় টাইমস একটি সংবাদসংগ্রাহক ও লিংক-ডিসকভারি প্ল্যাটফর্ম।</p>
                <p>তৃতীয় পক্ষের পূর্ণ প্রতিবেদন পুনঃপ্রকাশ না করে শিরোনাম, উৎস ও সীমিত পরিচিতি দেখানো হয়।</p>
                <p>মূল প্রতিবেদন পড়তে সংশ্লিষ্ট প্রকাশকের লিংক নতুন ট্যাবে খোলে।</p>
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-[2px] border border-[#ded9d1] bg-white px-4 py-4 md:px-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-8">
              <div className="max-w-[820px]">
                <h3 className="text-[11.5px] font-black uppercase tracking-[0.12em] text-[#38342f]">সংবাদ উৎস, স্বত্বনীতি ও সংশোধন</h3>
                <p className="mt-2 text-[11.7px] leading-6 text-[#716b64]">
                  তৃতীয় পক্ষের লেখা, ছবি, লোগো, ট্রেডমার্ক ও অন্যান্য স্বত্ব সংশ্লিষ্ট প্রকাশক বা অধিকারধারীর। অনুমতি বা প্রযোজ্য লাইসেন্স ছাড়া তৃতীয় পক্ষের ছবি বঙ্গীয় টাইমসে পুনঃপ্রকাশ করা হয় না। কোনো প্রকাশক বা অধিকারধারীর আপত্তি, সংশোধন অথবা অপসারণের অনুরোধ থাকলে অফিসিয়াল যোগাযোগ মাধ্যমে জানালে বিষয়টি যথাযথভাবে পর্যালোচনা করা হবে।
                </p>
              </div>
              <div className="shrink-0 border-l-0 border-[#e2ddd5] md:border-l md:pl-6">
                <p className="text-[10.5px] font-black uppercase tracking-[0.13em] text-[#8a847c]">পাঠ নীতি</p>
                <p className="mt-1 max-w-[250px] text-[11.7px] leading-5.5 text-[#716b64]">তৃতীয় পক্ষের সংবাদে ক্লিক করলে মূল উৎস নতুন ট্যাবে খুলবে।</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-[#d9d4cc] pt-4 text-[11.2px] text-[#8a847c] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} বঙ্গীয় টাইমস। নিজস্ব কনটেন্টে সর্বস্বত্ব সংরক্ষিত।</p>
            <p>স্বচ্ছ উৎস • সংক্ষিপ্ত উপস্থাপনা • মূল প্রতিবেদনে সরাসরি লিংক</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
