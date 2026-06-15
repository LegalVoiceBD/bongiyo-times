import React from 'react';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

// বাংলা তারিখ ও সময় দেখানোর ফাংশন
function getBengaliDate() {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date().toLocaleDateString('bn-BD', options);
  return date;
}

// ডাটাবেসের সময়কে বাংলায় রূপান্তর
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function Home({ searchParams }: { searchParams: { category?: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const activeCategory = searchParams.category || '';

  // একবারে ১০০টি খবর আনা হচ্ছে যাতে সব ক্যাটাগরিতে ভাগ করে দেওয়া যায়
  let query = supabase.from('news').select('*').order('created_at', { ascending: false }).limit(100);
  if (activeCategory) {
    query = query.eq('category', activeCategory);
  }
  const { data: newsItems } = await query;

  // খবরগুলোকে ক্যাটাগরি অনুযায়ী আলাদা করা হচ্ছে
  const allNews = newsItems || [];
  const leadNews = allNews[0];
  const subLeadNews = allNews.slice(1, 4);
  
  const bangladeshNews = allNews.filter(n => n.category === 'বাংলাদেশ').slice(0, 5);
  const internationalNews = allNews.filter(n => n.category === 'আন্তর্জাতিক').slice(0, 4);
  const sportsNews = allNews.filter(n => n.category === 'খেলাধুলা').slice(0, 4);
  const entertainmentNews = allNews.filter(n => n.category === 'বিনোদন').slice(0, 4);

  // কাস্টম মতামত (যেহেতু এগুলো বট আনবে না, তাই ম্যানুয়ালি দেওয়া হলো)
  const opinionNews = [
    { id: 1, title: 'ডিজিটাল যুগে সাংবাদিকতার নতুন চ্যালেঞ্জ ও সম্ভাবনা', author: 'মো: আজাদুর রহমান', image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=400&auto=format&fit=crop' },
    { id: 2, title: 'বৈশ্বিক অর্থনীতিতে নতুন মেরুকরণ: আমাদের প্রস্তুতি কতটুকু?', author: 'ড. সালেহ উদ্দিন', image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=400&auto=format&fit=crop' }
  ];

  const menuCategories = ["সর্বশেষ", "বাংলাদেশ", "আন্তর্জাতিক", "খেলাধুলা", "বিনোদন", "বাণিজ্য", "প্রযুক্তি", "আইন-আদালত", "মতামত"];

  return (
    <div className="min-h-screen bg-[#f9fafb] text-black font-sans">
      
      {/* ----------------- Header Section ----------------- */}
      <header className="bg-white">
        {/* Top Date Bar */}
        <div className="border-b border-gray-200 py-1 text-sm text-gray-600">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span>ঢাকা</span>
              <span className="hidden md:inline">|</span>
              <span>{getBengaliDate()}</span>
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-red-700 transition">ফেসবুক</a>
              <a href="#" className="hover:text-red-700 transition">ইউটিউব</a>
            </div>
          </div>
        </div>

        {/* Logo Area */}
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex justify-center md:justify-start items-center">
          <a href="/" className="flex flex-col items-center md:items-start">
            <h1 className="text-5xl md:text-6xl font-extrabold text-red-700 tracking-tighter">
              বঙ্গীয় <span className="text-black">টাইমস</span>
            </h1>
            <p className="text-gray-500 mt-1 font-medium tracking-wide">সত্য ও সাহসের প্রতিচ্ছবি</p>
          </a>
        </div>

        {/* Navigation Menu */}
        <div className="bg-[#0b3d6e] text-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <nav className="flex items-center gap-6 md:gap-8 py-3 text-base md:text-lg font-bold">
              <a href="/" className="hover:text-red-300 transition">প্রচ্ছদ</a>
              {menuCategories.map((cat, index) => (
                <a key={index} href={`/?category=${cat}`} className="hover:text-red-300 transition">
                  {cat}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ----------------- Main Content ----------------- */}
      <main className="max-w-7xl mx-auto px-4 mt-6 md:mt-8 pb-10">
        
        {/* Category Page Handler */}
        {activeCategory ? (
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="col-span-full border-b-2 border-red-700 mb-4 pb-2">
                 <h2 className="text-3xl font-bold text-[#0b3d6e]">{activeCategory}</h2>
              </div>
              {allNews.map(news => (
                 <a href={news.source_url} target="_blank" key={news.id} className="group border border-gray-200 bg-white p-3 rounded hover:shadow-md transition">
                    <img src={news.image_url} alt={news.title} className="w-full h-48 object-cover mb-3 rounded" />
                    <span className="text-xs text-red-600 font-bold">{news.source_name}</span>
                    <h3 className="text-lg font-bold mt-1 group-hover:text-red-700 leading-snug">{news.title}</h3>
                    <p className="text-xs text-gray-500 mt-2">{formatDate(news.created_at)}</p>
                 </a>
              ))}
           </div>
        ) : (
          /* Homepage Layout */
          <>
            {/* Hero Section (1 Lead + 3 Sub-lead) */}
            {leadNews && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
                {/* Main Lead */}
                <a href={leadNews.source_url} target="_blank" className="lg:col-span-8 group relative overflow-hidden rounded bg-white shadow-sm border border-gray-200 block">
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-xs px-3 py-1 rounded-sm z-10 font-bold">{leadNews.source_name}</div>
                  <img src={leadNews.image_url} alt={leadNews.title} className="w-full h-[300px] md:h-[450px] object-cover group-hover:scale-105 transition duration-700" />
                  <div className="p-4 md:p-6 bg-white border-t-4 border-[#0b3d6e]">
                    <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 group-hover:text-red-700 transition">{leadNews.title}</h2>
                    <p className="mt-3 text-gray-600 text-lg line-clamp-2">{leadNews.snippet}</p>
                    <p className="text-sm text-gray-400 mt-3">{formatDate(leadNews.created_at)}</p>
                  </div>
                </a>

                {/* Sub Leads */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {subLeadNews.map(news => (
                    <a href={news.source_url} target="_blank" key={news.id} className="flex gap-4 group bg-white p-3 rounded shadow-sm border border-gray-200 items-start hover:bg-gray-50 transition">
                      <img src={news.image_url} alt={news.title} className="w-28 h-24 object-cover rounded" />
                      <div>
                        <span className="text-xs text-red-600 font-bold">{news.source_name}</span>
                        <h3 className="text-lg font-bold mt-1 text-gray-800 leading-snug group-hover:text-red-700 line-clamp-3">{news.title}</h3>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Middle Columns (Bangladesh, Sports, Opinion) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Column 1: Bangladesh */}
              <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
                <div className="border-b-2 border-red-700 mb-4 pb-2 flex justify-between items-end">
                  <h2 className="text-xl font-bold text-[#0b3d6e]">বাংলাদেশ</h2>
                  <a href="/?category=বাংলাদেশ" className="text-sm text-red-600 hover:underline">সব খবর »</a>
                </div>
                {bangladeshNews.map((news, idx) => (
                  <a href={news.source_url} target="_blank" key={news.id} className={`block group ${idx !== 0 ? 'border-t border-gray-100 pt-3 mt-3' : ''}`}>
                    {idx === 0 && <img src={news.image_url} className="w-full h-40 object-cover rounded mb-2" />}
                    <h3 className="text-base font-bold text-gray-800 group-hover:text-red-700 leading-snug">{news.title}</h3>
                  </a>
                ))}
              </div>

              {/* Column 2: Sports & Entertainment */}
              <div className="flex flex-col gap-8">
                <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
                  <div className="border-b-2 border-red-700 mb-4 pb-2">
                    <h2 className="text-xl font-bold text-[#0b3d6e]">খেলাধুলা</h2>
                  </div>
                  {sportsNews.map((news, idx) => (
                    <a href={news.source_url} target="_blank" key={news.id} className={`flex gap-3 group items-center ${idx !== 0 ? 'border-t border-gray-100 pt-3 mt-3' : ''}`}>
                      <img src={news.image_url} className="w-20 h-16 object-cover rounded" />
                      <h3 className="text-sm font-bold text-gray-800 group-hover:text-red-700 leading-snug line-clamp-2">{news.title}</h3>
                    </a>
                  ))}
                </div>

                <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
                  <div className="border-b-2 border-red-700 mb-4 pb-2">
                    <h2 className="text-xl font-bold text-[#0b3d6e]">বিনোদন</h2>
                  </div>
                  {entertainmentNews.map((news, idx) => (
                    <a href={news.source_url} target="_blank" key={news.id} className={`block group ${idx !== 0 ? 'border-t border-gray-100 pt-2 mt-2' : ''}`}>
                      <h3 className="text-sm font-bold text-gray-800 group-hover:text-red-700 leading-snug">{news.title}</h3>
                    </a>
                  ))}
                </div>
              </div>

              {/* Column 3: Custom Opinion (মতামত) */}
              <div className="bg-gray-100 p-4 border border-gray-200 rounded shadow-sm">
                <div className="border-b-2 border-red-700 mb-4 pb-2 text-center">
                  <h2 className="text-xl font-bold text-[#0b3d6e]">মতামত</h2>
                </div>
                {opinionNews.map(opinion => (
                  <div key={opinion.id} className="mb-6 bg-white p-3 rounded shadow-sm text-center">
                    <img src={opinion.image_url} alt={opinion.author} className="w-16 h-16 object-cover rounded-full mx-auto border-2 border-red-600 -mt-8 bg-white" />
                    <h3 className="text-base font-bold text-gray-900 mt-2 hover:text-red-700 cursor-pointer">{opinion.title}</h3>
                    <p className="text-sm text-red-600 font-bold mt-1">— {opinion.author}</p>
                  </div>
                ))}
              </div>
              
            </div>
          </>
        )}
      </main>

      {/* ----------------- Footer ----------------- */}
      <footer className="bg-[#1a1a1a] text-gray-300 mt-12 border-t-4 border-red-700">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-4">বঙ্গীয় <span className="text-red-600">টাইমস</span></h2>
              <p className="text-sm leading-relaxed text-gray-400">
                সত্য, সাহস ও বস্তুনিষ্ঠ সাংবাদিকতার এক অবিচল কণ্ঠস্বর। বাংলাদেশ ও সারা বিশ্বের সর্বশেষ সংবাদ সবার আগে পৌঁছে দিতে আমরা অঙ্গীকারবদ্ধ।
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 inline-block">সম্পাদকীয় ও প্রকাশনা</h3>
              <p className="text-sm mb-2"><span className="text-gray-500">সম্পাদক ও প্রকাশক:</span> <br/><span className="text-base font-bold text-white">মো: আজাদুর রহমান</span></p>
              <p className="text-sm mt-3"><span className="text-gray-500">প্রধান কার্যালয়:</span> <br/>ঢাকা, বাংলাদেশ</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 inline-block">যোগাযোগ</h3>
              <p className="text-sm mb-2 hover:text-white cursor-pointer transition">ইমেইল: news@bongiyotimes.com</p>
              <p className="text-sm hover:text-white cursor-pointer transition">বিজ্ঞাপন: ads@bongiyotimes.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
