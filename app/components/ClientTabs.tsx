'use client';

import React, { useState } from 'react';

type NewsItem = {
  id: string | number;

  title?: string | null;
  headline?: string | null;
  original_title?: string | null;

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

  created_at?: string | null;

  image_url?: string | null;

  is_custom?: boolean | null;

  [key: string]: any;
};


type Props = {
  latestList?: NewsItem[];
  popularList?: NewsItem[];
};


// ================================================================
// TITLE
// ================================================================

function getTitle(news: NewsItem) {
  return (
    news.title ||
    news.headline ||
    news.original_title ||
    'শিরোনাম পাওয়া যায়নি'
  );
}


// ================================================================
// SOURCE NAME
// ================================================================

function getSourceName(news: NewsItem) {
  const name =
    news.source_name ||
    news.publisher ||
    news.source ||
    '';

  return String(name).trim();
}


// ================================================================
// DATE / TIME
// ================================================================

function formatDateTime(dateString?: string | null) {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs =
    Date.now() - date.getTime();

  const diffMinutes =
    Math.max(
      0,
      Math.floor(diffMs / 60000)
    );

  const diffHours =
    Math.floor(diffMinutes / 60);


  if (diffMinutes < 1) {
    return 'এইমাত্র';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} মিনিট আগে`;
  }

  if (diffHours < 24) {
    return `${diffHours} ঘণ্টা আগে`;
  }

  return date.toLocaleDateString(
    'bn-BD',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  );
}


// ================================================================
// CORRECT NEWS LINK
//
// Auto aggregated news:
//     source_url → original newspaper
//
// Custom Bongiyo Times news:
//     /news/id
// ================================================================

function getNewsHref(news: NewsItem) {
  const candidates = [
    news.source_url,
    news.original_url,
    news.article_url,
    news.url,
    news.link,
    news.original_link,
    news.news_url
  ];


  for (const candidate of candidates) {
    if (
      typeof candidate !== 'string'
    ) {
      continue;
    }

    const value =
      candidate.trim();

    if (
      /^https?:\/\//i.test(value)
    ) {
      return value;
    }
  }


  return `/news/${news.id}`;
}


// ================================================================
// EXTERNAL URL?
// ================================================================

function isExternalUrl(href: string) {
  return /^https?:\/\//i.test(href);
}


// ================================================================
// ONE NEWS ROW
// ================================================================

function NewsRow({
  news,
  rank,
  popular
}: {
  news: NewsItem;
  rank: number;
  popular: boolean;
}) {

  const href =
    getNewsHref(news);

  const external =
    isExternalUrl(href);

  const source =
    getSourceName(news);

  const time =
    formatDateTime(
      news.created_at
    );


  return (
    <a
      href={href}
      target={
        external
          ? '_blank'
          : undefined
      }
      rel={
        external
          ? 'noopener noreferrer'
          : undefined
      }
      className="
        group
        flex
        gap-3
        py-4
        border-b
        border-gray-200
        last:border-b-0
        hover:bg-gray-50
        transition-colors
      "
    >

      {/* Popular ranking */}
      {popular && (
        <div
          className="
            shrink-0
            w-8
            h-8
            rounded-full
            bg-[#104f96]
            text-white
            flex
            items-center
            justify-center
            font-bold
            text-[14px]
            mt-0.5
          "
        >
          {rank}
        </div>
      )}


      <div className="min-w-0 flex-1">

        <h3
          className="
            text-[15px]
            md:text-[16px]
            font-bold
            leading-[1.45]
            text-[#222]
            group-hover:text-[#104f96]
            transition-colors
          "
        >
          {getTitle(news)}
        </h3>


        {(source || time) && (
          <div
            className="
              flex
              items-center
              flex-wrap
              gap-1
              text-[12px]
              text-gray-500
              mt-2
            "
          >

            {source && (
              <span>
                {source}
              </span>
            )}

            {source && time && (
              <span>
                •
              </span>
            )}

            {time && (
              <span>
                {time}
              </span>
            )}

          </div>
        )}

      </div>


      {/* External-link indicator */}
      {external && (
        <div
          className="
            shrink-0
            text-gray-300
            group-hover:text-[#104f96]
            mt-1
          "
          aria-hidden="true"
        >
          ↗
        </div>
      )}

    </a>
  );
}


// ================================================================
// CLIENT TABS
// ================================================================

export default function ClientTabs({
  latestList = [],
  popularList = []
}: Props) {

  const [
    activeTab,
    setActiveTab
  ] =
    useState<
      'latest' |
      'popular'
    >(
      'latest'
    );


  const activeList =
    activeTab === 'latest'
      ? latestList
      : popularList;


  return (
    <section
      className="
        border-t-[3px]
        border-black
        bg-white
      "
    >

      {/* TAB HEADER */}
      <div
        className="
          flex
          items-center
          border-b
          border-gray-200
        "
      >

        <button
          type="button"
          onClick={() =>
            setActiveTab(
              'latest'
            )
          }
          className={`
            relative
            flex-1
            py-3
            text-[16px]
            font-bold
            transition-colors

            ${
              activeTab ===
              'latest'

                ? 'text-[#104f96]'

                : 'text-gray-600 hover:text-black'
            }
          `}
        >
          সাম্প্রতিক

          {activeTab ===
            'latest' && (
            <span
              className="
                absolute
                left-0
                right-0
                bottom-[-1px]
                h-[3px]
                bg-[#104f96]
              "
            />
          )}

        </button>


        <button
          type="button"
          onClick={() =>
            setActiveTab(
              'popular'
            )
          }
          className={`
            relative
            flex-1
            py-3
            text-[16px]
            font-bold
            transition-colors

            ${
              activeTab ===
              'popular'

                ? 'text-[#104f96]'

                : 'text-gray-600 hover:text-black'
            }
          `}
        >
          জনপ্রিয়

          {activeTab ===
            'popular' && (
            <span
              className="
                absolute
                left-0
                right-0
                bottom-[-1px]
                h-[3px]
                bg-[#104f96]
              "
            />
          )}

        </button>

      </div>


      {/* NEWS LIST */}
      <div>

        {activeList.length === 0 ? (

          <div
            className="
              text-center
              text-gray-400
              py-8
              text-[14px]
            "
          >
            কোনো সংবাদ পাওয়া যায়নি।
          </div>

        ) : (

          activeList.map(
            (
              news,
              index
            ) => (

              <NewsRow
                key={
                  `${news.id}-${index}`
                }
                news={news}
                rank={
                  index + 1
                }
                popular={
                  activeTab ===
                  'popular'
                }
              />

            )
          )

        )}

      </div>

    </section>
  );
}
