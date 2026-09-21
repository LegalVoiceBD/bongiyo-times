'use client';

import React, { useMemo, useState } from 'react';

type NewsItem = {
  id: string | number;
  title?: string | null;
  headline?: string | null;
  original_title?: string | null;
  source_title?: string | null;
  source_name?: string | null;
  publisher?: string | null;
  source?: string | null;
  source_url?: string | null;
  original_url?: string | null;
  article_url?: string | null;
  url?: string | null;
  link?: string | null;
  original_link?: string | null;
  news_url?: string | null;
  image_url?: string | null;
  image_license?: string | null;
  image_rights?: string | null;
  image_permission?: boolean | null;
  created_at?: string | null;
  is_custom?: boolean | null;
  [key: string]: any;
};

type Props = {
  latestList?: NewsItem[];
  popularList?: NewsItem[];
};

function cleanText(value?: string | null) {
  return String(value || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/www\.\S+/gi, ' ')
    .replace(/#[\p{L}\p{N}_-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTitle(news: NewsItem) {
  return cleanText(
    news.original_title ||
      news.source_title ||
      news.headline ||
      news.title ||
      'শিরোনাম পাওয়া যায়নি'
  );
}

function getSource(news: NewsItem) {
  return cleanText(news.source_name || news.publisher || news.source || '');
}

function getHref(news: NewsItem) {
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

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function canUseImage(news: NewsItem) {
  if (news.is_custom === true) return true;
  const source = getSource(news);
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

function getImage(news: NewsItem) {
  if (!canUseImage(news)) return '';
  const value = String(news.image_url || '').trim();
  return /^https?:\/\//i.test(value) ? value : '';
}

const MINI_VISUAL_THEMES: Record<string, { bg: string; accent: string; ink: string }> = {
  'বাংলাদেশ': { bg: '#f4f0e8', accent: '#b42318', ink: '#2b2722' },
  'রাজনীতি': { bg: '#f3eee8', accent: '#8f1d18', ink: '#2a2421' },
  'আন্তর্জাতিক': { bg: '#edf2f5', accent: '#305b78', ink: '#20323f' },
  'বাণিজ্য': { bg: '#eef3ef', accent: '#38634d', ink: '#23362a' },
  'অর্থনীতি': { bg: '#eef3ef', accent: '#38634d', ink: '#23362a' },
  'খেলাধুলা': { bg: '#eef3e9', accent: '#4d6b34', ink: '#2b3822' },
  'বিনোদন': { bg: '#f5eff2', accent: '#8a405d', ink: '#3b2831' },
  'আইন-আদালত': { bg: '#f1eff5', accent: '#5b4c7c', ink: '#312d3e' },
  'শিক্ষা': { bg: '#eef3f7', accent: '#38658b', ink: '#253744' },
  'প্রযুক্তি': { bg: '#edf4f4', accent: '#31706d', ink: '#223b3a' },
  'কৃষি': { bg: '#f0f3e8', accent: '#61773a', ink: '#303923' },
};

function MiniCodeVisual({ news }: { news: NewsItem }) {
  const category = String(news.category || 'সর্বশেষ').trim();
  const theme = MINI_VISUAL_THEMES[category] || MINI_VISUAL_THEMES['বাংলাদেশ'];
  const shortLabel = category.length > 8 ? `${category.slice(0, 7)}…` : category;

  return (
    <div
      className="relative flex h-[58px] w-[86px] shrink-0 overflow-hidden rounded-[2px] border border-[#e7e2da] p-[5px]"
      style={{
        backgroundColor: theme.bg,
        backgroundImage: `linear-gradient(135deg, ${theme.bg}, ${theme.accent}16)`,
      }}
    >
      <div className="absolute -right-[15px] -top-[16px] h-[38px] w-[38px] rounded-full border" style={{ borderColor: `${theme.accent}35` }} />
      <div className="absolute left-[6px] top-[8px] h-[1.5px] w-[20px]" style={{ backgroundColor: `${theme.accent}88` }} />
      <div className="relative z-10 flex w-full flex-col justify-between">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
          <span className="text-[6.1px] font-black uppercase tracking-[0.08em]" style={{ color: theme.accent }}>সংবাদ</span>
        </div>
        <div>
          <div className="line-clamp-1 text-[9.6px] font-black leading-none tracking-[-0.025em]" style={{ color: theme.ink }}>{shortLabel}</div>
          <div className="mt-1 text-[6.2px] font-semibold leading-none" style={{ color: `${theme.ink}90` }}>মূল উৎস ↗</div>
        </div>
        <div className="text-[6.2px] font-semibold leading-none" style={{ color: `${theme.ink}70` }}>বিস্তারিত</div>
      </div>
    </div>
  );
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return 'এইমাত্র';
  if (diffMinutes < 60) return `${diffMinutes} মিনিট আগে`;
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;

  return date.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function StoryRow({
  news,
  index,
  showRank,
}: {
  news: NewsItem;
  index: number;
  showRank: boolean;
}) {
  const href = getHref(news);
  const external = isExternal(href);
  const title = getTitle(news);
  const source = getSource(news);
  const time = formatDateTime(news.created_at);
  const image = getImage(news);

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="group grid grid-cols-[1fr_auto] gap-3 border-b border-[#e9e5de] py-3 last:border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b42318]/30"
      aria-label={`${title}${external ? ' — মূল উৎস নতুন ট্যাবে খুলবে' : ''}`}
    >
      <div className="min-w-0">
        <div className="flex items-start gap-2">
          {showRank ? (
            <span className="mt-[2px] min-w-5 shrink-0 text-center text-[18px] font-black leading-none text-[#b42318]">{index + 1}</span>
          ) : null}
          <h3 className="line-clamp-2 text-[14.5px] font-bold leading-[1.45] text-[#24211e] transition group-hover:text-[#b42318]">
            {title}
          </h3>
        </div>

        {(source || time) ? (
          <div className={`mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[10.8px] leading-5 text-[#817b73] ${showRank ? 'pl-7' : ''}`}>
            {source ? <span className="font-semibold text-[#625d57]">{source}</span> : null}
            {source && time ? <span>•</span> : null}
            {time ? <span>{time}</span> : null}
            {external ? <span className="text-[#b42318]">↗</span> : null}
          </div>
        ) : null}
      </div>

      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-[58px] w-[86px] shrink-0 rounded-[2px] border border-[#ece8e1] object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <MiniCodeVisual news={news} />
      )}
    </a>
  );
}

export default function ClientTabs({ latestList = [], popularList = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');

  const activeList = useMemo(
    () => (activeTab === 'latest' ? latestList : popularList).slice(0, 6),
    [activeTab, latestList, popularList]
  );

  return (
    <section className="border-t-[3px] border-[#171717] bg-white" aria-label="সাম্প্রতিক ও জনপ্রিয় সংবাদ">
      <div className="flex items-center border-b border-[#ddd8d0]" role="tablist" aria-label="সংবাদ তালিকা">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'latest'}
          onClick={() => setActiveTab('latest')}
          className={`relative flex-1 px-2 py-2.5 text-[14px] font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b42318]/30 ${
            activeTab === 'latest' ? 'text-[#171717]' : 'text-[#807a72] hover:text-[#171717]'
          }`}
        >
          সাম্প্রতিক
          {activeTab === 'latest' ? <span className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-[#b42318]" /> : null}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'popular'}
          onClick={() => setActiveTab('popular')}
          className={`relative flex-1 px-2 py-2.5 text-[14px] font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b42318]/30 ${
            activeTab === 'popular' ? 'text-[#171717]' : 'text-[#807a72] hover:text-[#171717]'
          }`}
        >
          জনপ্রিয়
          {activeTab === 'popular' ? <span className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-[#b42318]" /> : null}
        </button>
      </div>

      <div role="tabpanel">
        {activeList.length === 0 ? (
          <div className="py-8 text-center text-[12.5px] text-[#99938b]">কোনো সংবাদ পাওয়া যায়নি।</div>
        ) : (
          activeList.map((news, index) => (
            <StoryRow key={`${news.id}-${index}`} news={news} index={index} showRank={activeTab === 'popular'} />
          ))
        )}
      </div>
    </section>
  );
}
