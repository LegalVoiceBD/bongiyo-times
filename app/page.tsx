import React from 'react';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

// বাংলা তারিখ ও সময় দেখানোর ফাংশন (কালবেলার মতো)
function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  const d = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  const t = date.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `🕒 ${d}, ${t}`;
}

export default async function Home({ searchParams }: { searchParams: { category?: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const activeCategory = searchParams.category || '';

  // একবারে ১০০টি খবর আনা হচ্ছে
  let query = supabase.from('news').select('*').order('created_at', { ascending: false }).limit(100);
  if (activeCategory) {
    query = query.eq('category', activeCategory);
  }
  const { data: newsItems } = await query;

  const allNews = newsItems || [];
  
  // হিরো সেকশনের খবর ভাগ করা (মাঝখানে ১টি বড়, দুই পাশে ২টি করে ছোট)
  const leadNews = allNews[0];
  const leftSideNews = allNews.slice(1, 3);
  const rightSideNews = allNews.slice(3, 5);
  
  // বডি সেকশনের খবর ভাগ করা
  const nationalNews = allNews.filter(n => n.category === 'বাংলাদেশ' || n.category === 'জাতীয়').slice(0, 4);
  const worldNews = allNews.filter(n => n.category === 'আন্তর্জাতিক').slice(0, 4);
  const sportsNews = allNews.filter(n => n.category === 'খেলাধুলা').slice(0, 3);
  const latestList = allNews.slice(5, 12); // ডানপাশের সর্বশেষ লিস্টের জন্য

  // মতামত (কাস্টম)
  const opinionNews = [
    { id: 1, title: 'প্রধানমন্ত্রীর প্রতি এক উদ্বিগ্ন নাগরিকের খোলা চিঠি', author: 'ড. সালেহ উদ্দিন', image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=200' },
    { id: 2, title: 'বিশ্বকাপে বর্ণবাদ ও নৈরাশ্যের ছায়া', author: 'মো: আজাদুর রহমান', image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=200' }
  ];

  // আপনার দেওয়া সব ক্যাটাগরি
  const menuCategories = ["সর্বশেষ", "জাতীয়", "রাজনীতি", "সারাদেশ", "বিশ্ব", "খেলাধুলা", "শিক্ষা", "বাণিজ্য", "বিনোদন", "মতামত", "আইন-আদালত", "প্রযুক্তি", "ধর্ম"];

  return (
    <div className="min-h-screen bg-white text-black">
      
      {/* ----------------- Header Section (Kalbela Style) ----------------- */}
      <header className="bg-white border-b border-gray-200">
        
        {/* Top Bar */}
        <div className="border-b border-gray-100 py-1 text-sm text-gray-600 bg-gray-50">
          <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <span className="text-red-700 font-bold border border-red-700 px-2 py-0.5 rounded-sm">ব</span>
                <span>ঢাকা | {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
             </div>
             <div className="hidden md:flex gap-4 font-bold">
                <a href="#" className="hover:text-red-700">ফেসবুক</a>
                <a href="#" className="hover:text-red-700">ইউটিউব</a>
             </div>
          </div>
        </div>

        {/* Logo & Ad Banner Area (Solves the empty space issue) */}
        <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <a href="/" className="flex flex-col items-center md:items-start shrink-0">
            <h1 className="text-5xl md:text-6xl font-extrabold text-red-700 tracking-tighter" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
              বঙ্গীয় <span className="text-black">টাইমস</span>
            </h1>
            <p className="text-gray-500 text-sm md:text-base mt-1 italic">সত্য ও সাহসের প্রতিচ্ছবি</p>
          </a>
          
          {/* Dummy Ad Banner */}
          <div className="w-full md:w-[728px] h-[90px] bg-green-600 text-white flex flex-col justify-center items-center rounded-sm shadow-inner cursor-pointer hover:bg-green-700 transition">
             <h3 className="text-xl md:text-2xl font-bold">আপনার ব্যবসার বিজ্ঞাপন দিন</h3>
             <p className="text-sm">যোগাযোগ: ads@bongiyotimes.com</p>
          </div>
        </div>

        {/* Main Navigation Menu */}
        <div className="border-t border-gray-200 shadow-sm sticky top-0 z-50 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 overflow-x-auto scrollbar-hide">
            <nav className="flex items-center justify-between min-w-max py-3 text-lg font-bold text-gray-800 gap-6">
              <a href="/" className="hover:text-red-600 transition">প্রচ্ছদ</a>
              {menuCategories.map((cat, index) => (
                <a key={index} href={`/?category=${cat}`} className={`hover:text-red-600 transition ${activeCategory === cat ? 'text-red-600 border-b-2 border-red-600 pb-1' : ''}`}>
                  {cat}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ----------------- Main Content ----------------- */}
      <main className="max-w-[1200px] mx-auto px-4 mt-6 pb-10">
        
        {/* Category Pages */}
        {activeCategory ? (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-1 md:col-span-3 border-r pr-0 md:pr-6">
                 <div className="border-b-2 border-red-700 mb-4 pb-2">
                    <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2">
                       <span className="bg-red-700 w-3 h-3 rounded-full"></span> {activeCategory}
                    </h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {allNews.map(news => (
                       <a href={news.source_url} target="_blank" key={news.id} className="group flex flex-col gap-2 border-b border-gray-100 pb-4">
                          <img src={news.image_url} alt={news.title} className="w-full h-48 object-cover rounded-sm group-hover:opacity-90 transition" />
                          <h3 className="text-xl font-bold mt-1 group-hover:text-red-700 leading-snug">{news.title}</h3>
                          <p className="text-xs text-gray-500">{formatDateTime(news.created_at)}</p>
                       </a>
                    ))}
                 </div>
              </div>
              {/* Right Sidebar */}
              <div className="col-span-1">
                 <img src="https://via.placeholder.com/300x600.png?text=Ad+Space" alt="Ad" className="w-full mb-6" />
              </div>
           </div>
        ) : (
          /* Homepage Layout */
          <>
            {/* 1. Hero Section (Small Left - BIG Middle - Small Right) */}
            {leadNews && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10 border-b border-gray-300 pb-8">
                
                {/* Left Side (2 Small News) */}
                <div className="hidden lg:flex flex-col gap-6 border-r border-gray-200 pr-4">
                  {leftSideNews.map(news => (
                    <a href={news.source_url} target="_blank" key={news.id} className="group block">
                      <img src={news.image_url} alt={news.title} className="w-full h-32 object-cover rounded-sm mb-2" />
                      <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-red-700 leading-tight">{news.title}</h3>
                      <p className="text-[11px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                    </a>
                  ))}
                </div>

                {/* Middle (Big Lead News) */}
                <a href={leadNews.source_url} target="_blank" className="lg:col-span-2 group relative overflow-hidden block px-0 md:px-2">
                  <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-gray-900 group-hover:text-red-700 transition mb-3 text-center">
                    {leadNews.title}
                  </h1>
                  <img src={leadNews.image_url} alt={leadNews.title} className="w-full h-[250px] md:h-[350px] object-cover rounded-sm" />
                  <p className="text-xs text-gray-500 mt-2 text-center">{formatDateTime(leadNews.created_at)} | <span className="text-red-600 font-bold">{leadNews.source_name}</span></p>
                </a>

                {/* Right Side (2 Small News) */}
                <div className="hidden lg:flex flex-col gap-6 border-l border-gray-200 pl-4">
                  {rightSideNews.map(news => (
                    <a href={news.source_url} target="_blank" key={news.id} className="group block">
                      <img src={news.image_url} alt={news.title} className="w-full h-32 object-cover rounded-sm mb-2" />
                      <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-red-700 leading-tight">{news.title}</h3>
                      <p className="text-[11px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Body Section (3 Columns like Kalbela) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Column 1: National & World (Left) - Span 8 */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                
                {/* National Section */}
                <div>
                   <div className="border-b-2 border-black mb-4 flex justify-between items-end pb-1">
                      <h2 className="text-xl font-bold flex items-center gap-2"><span className="text-red-700">■</span> জাতীয়</h2>
                      <a href="/?category=জাতীয়" className="text-sm font-bold hover:text-red-600">সব খবর »</a>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Big Card */}
                      {nationalNews[0] && (
                        <a href={nationalNews[0].source_url} target="_blank" className="group">
                           <img src={nationalNews[0].image_url} className="w-full h-48 object-cover rounded-sm mb-3" />
                           <h3 className="text-2xl font-bold group-hover:text-red-700 leading-snug">{nationalNews[0].title}</h3>
                           <p className="text-xs text-gray-500 mt-2">{formatDateTime(nationalNews[0].created_at)}</p>
                        </a>
                      )}
                      {/* Right Small List */}
                      <div className="flex flex-col gap-4">
                        {nationalNews.slice(1).map(news => (
                          <a href={news.source_url} target="_blank" key={news.id} className="group flex gap-3 border-b border-gray-100 pb-3">
                             <h3 className="text-[16px] font-bold group-hover:text-red-700 leading-snug flex-1">{news.title}</h3>
                             <p className="text-[10px] text-gray-400 mt-1 whitespace-nowrap">{formatDateTime(news.created_at)}</p>
                          </a>
                        ))}
                      </div>
                   </div>
                </div>

                {/* World Section */}
                <div>
                   <div className="border-b-2 border-black mb-4 flex justify-between items-end pb-1">
                      <h2 className="text-xl font-bold flex items-center gap-2"><span className="text-red-700">■</span> বিশ্ব</h2>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {worldNews.map(news => (
                        <a href={news.source_url} target="_blank" key={news.id} className="group block">
                           <img src={news.image_url} className="w-full h-24 object-cover rounded-sm mb-2" />
                           <h3 className="text-[15px] font-bold group-hover:text-red-700 leading-snug line-clamp-3">{news.title}</h3>
                        </a>
                      ))}
                   </div>
                </div>

                {/* Opinion & Sports (2 cols within the left area) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
                   {/* Opinion */}
                   <div className="bg-[#fdf9f4] p-4 border border-gray-200 rounded-sm">
                      <h2 className="text-lg font-bold text-red-700 border-b border-red-200 mb-4 pb-2">মতামত</h2>
                      {opinionNews.map(opinion => (
                        <div key={opinion.id} className="flex gap-4 items-center bg-white p-3 mb-3 border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition cursor-pointer">
                           <img src={opinion.image_url} className="w-14 h-14 object-cover rounded-full border border-gray-300" />
                           <div>
                              <h3 className="text-sm font-bold text-gray-900 leading-snug hover:text-red-700">{opinion.title}</h3>
                              <p className="text-xs text-red-600 mt-1">{opinion.author}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   {/* Sports */}
                   <div>
                      <h2 className="text-lg font-bold border-b-2 border-black mb-4 pb-1">খেলাধুলা</h2>
                      {sportsNews.map((news, idx) => (
                        <a href={news.source_url} target="_blank" key={news.id} className={`flex gap-3 group items-center ${idx !== 0 ? 'border-t border-gray-100 pt-3 mt-3' : ''}`}>
                          <img src={news.image_url} className="w-20 h-16 object-cover rounded-sm" />
                          <h3 className="text-sm font-bold text-gray-800 group-hover:text-red-700 leading-snug line-clamp-2">{news.title}</h3>
                        </a>
                      ))}
                   </div>
                </div>

              </div>

              {/* Column 2: Latest News Sidebar (Right) - Span 4 */}
              <div className="lg:col-span-4">
                 <div className="border border-gray-200 bg-white">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                       <button className="flex-1 py-2 text-center font-bold text-red-700 border-b-2 border-red-700">সর্বশেষ</button>
                       <button className="flex-1 py-2 text-center font-bold text-gray-500 hover:text-black">জনপ্রিয়</button>
                    </div>
                    {/* List with big numbers */}
                    <div className="p-4 flex flex-col gap-4">
                       {latestList.map((news, idx) => (
                          <a href={news.source_url} target="_blank" key={news.id} className="flex gap-4 group items-start border-b border-gray-100 pb-4 last:border-0">
                             <span className="text-4xl font-extrabold text-gray-200 group-hover:text-red-100 transition mt-[-5px]">
                                {['১','২','৩','৪','৫','৬','৭'][idx]}
                             </span>
                             <h3 className="text-[15px] font-bold text-gray-800 group-hover:text-red-700 leading-snug">
                                {news.title}
                             </h3>
                          </a>
                       ))}
                    </div>
                 </div>
                 
                 {/* Sidebar Ad */}
                 <div className="mt-8">
                    <img src="https://via.placeholder.com/300x250.png?text=Ad+Space" alt="Ad" className="w-full border border-gray-200" />
                 </div>
              </div>

            </div>
          </>
        )}
      </main>

      {/* ----------------- Minimal Professional Footer ----------------- */}
      <footer className="bg-[#1a1a1a] text-gray-400 py-10 mt-10 border-t-4 border-red-700">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-center md:text-left">
              <h2 className="text-3xl font-extrabold text-white mb-2">বঙ্গীয় <span className="text-red-600">টাইমস</span></h2>
              <p className="text-sm">সম্পাদক ও প্রকাশক: <span className="text-white font-bold">মো: আজাদুর রহমান</span></p>
           </div>
           <div className="text-center md:text-right text-sm">
              <p className="mb-1">ইমেইল: news@bongiyotimes.com</p>
              <p>&copy; {new Date().getFullYear()} বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
           </div>
        </div>
      </footer>
    </div>
  );
}
