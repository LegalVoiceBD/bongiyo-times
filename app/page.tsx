import React from 'react';
import { createClient } from '@supabase/supabase-js';
import ClientTabs from './components/ClientTabs';

export const revalidate = 0;

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  const d = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  const t = date.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `🕒 ${d}, ${t}`;
}

export default async function Home({ searchParams }: { searchParams: { category?: string, tab?: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const activeCategory = searchParams.category || '';

  let query = supabase.from('news').select('*').order('created_at', { ascending: false }).limit(200);
  if (activeCategory) {
    query = query.eq('category', activeCategory);
  }
  const { data: newsItems } = await query;

  const allNews = newsItems || [];
  
  // -------------------------------------------------------------
  // স্মার্ট কিওয়ার্ড গার্ড (ভুল ক্যাটাগরির খবর আটকানোর স্বয়ংক্রিয় সিস্টেম)
  // -------------------------------------------------------------
  const hasKeywords = (text: string, words: string[]) => words.some(w => text.includes(w));
  
  const sportsWords = ['বিশ্বকাপ', 'ম্যাচ', 'ফুটবল', 'ক্রিকেট', 'রোনালদো', 'মেসি', 'ফিফা', 'উয়েফা', 'কোপা', 'গোল', 'উইকেট', 'ইয়ামাল', 'স্পেন', 'ব্রাজিল', 'আর্জেন্টিনা', 'টি-টোয়েন্টি', 'স্টেডিয়াম'];
  const intlWords = ['রাশিয়া', 'ইউক্রেন', 'পুতিন', 'বাইডেন', 'ট্রাম্প', 'গাজা', 'ইসরায়েল', 'হামাস', 'ড্রোন', 'নেতানিয়াহু', 'হোয়াইট হাউস', 'যুক্তরাষ্ট্র', 'চীন', 'ফ্রান্স', 'যুক্তরাজ্য'];
  const generalGarbage = ['এইচএসসি', 'পরীক্ষা', 'ফলাফল', 'নিহত', 'গ্রেপ্তার', 'আদালত'];

  // হিরো সেকশন
  const leadNews = allNews[0];
  const leftSideNews = allNews.slice(1, 3);
  const rightSideNews = allNews.slice(3, 5);
  
  // ক্যাটাগরি ফিল্টারিং উইথ স্মার্ট গার্ড
  const nationalNews = allNews.filter(n => 
    (n.category === 'বাংলাদেশ' || n.category === 'জাতীয়' || n.category === 'সারাদেশ') 
    && !hasKeywords(n.title, sportsWords) 
    && !hasKeywords(n.title, intlWords)
  ).slice(0, 5);
  
  const worldNews = allNews.filter(n => n.category === 'আন্তর্জাতিক' || n.category === 'বিশ্ব').slice(0, 4);
  const sportsNews = allNews.filter(n => n.category === 'খেলাধুলা').slice(0, 4);
  const entertainmentNews = allNews.filter(n => n.category === 'বিনোদন').slice(0, 5);
  const techNews = allNews.filter(n => n.category === 'প্রযুক্তি').slice(0, 4);
  const businessNews = allNews.filter(n => n.category === 'বাণিজ্য').slice(0, 5);
  const lawNews = allNews.filter(n => n.category === 'আইন-আদালত').slice(0, 5);
  
  const religionNews = allNews.filter(n => 
    n.category === 'ধর্ম' 
    && !hasKeywords(n.title, sportsWords) 
    && !hasKeywords(n.title, intlWords) 
    && !hasKeywords(n.title, generalGarbage)
  ).slice(0, 4);

  const opinionNews = [
    { id: 1, title: 'প্রধানমন্ত্রীর প্রতি এক উদ্বিগ্ন নাগরিকের খোলা চিঠি', author: 'ড. সালেহ উদ্দিন', image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=200' },
    { id: 2, title: 'বিশ্বকাপে বর্ণবাদ ও নৈরাশ্যের ছায়া', author: 'মো: আজাদুর রহমান', image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=200' }
  ];

  const menuCategories = ["সর্বশেষ", "বাংলাদেশ", "রাজনীতি", "আন্তর্জাতিক", "খেলাধুলা", "বাণিজ্য", "বিনোদন", "আইন-আদালত", "প্রযুক্তি", "ধর্ম", "মতামত"];

  const SafeImage = ({ src, alt, className }: { src: string, alt: string, className: string }) => (
    <div className={`relative bg-gray-50 flex items-center justify-center overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] select-none">
        <span className="text-xl md:text-3xl font-extrabold text-gray-900 transform -rotate-12 whitespace-nowrap">বঙ্গীয় টাইমস</span>
      </div>
      {src && <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover z-10" />}
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black">
      
      {/* ----------------- Header Section ----------------- */}
      <header className="bg-white border-b border-gray-200">
        <div className="border-b border-gray-100 py-1.5 text-xs md:text-sm text-gray-600 bg-gray-50">
          <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <span className="text-red-700 font-bold border border-red-700 px-2 py-0.5 rounded-sm">ব</span>
                <span>ঢাকা | {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
             </div>
             <div className="flex gap-4 font-bold">
                <a href="#" className="hover:text-red-700">ফেসবুক</a>
                <a href="#" className="hover:text-red-700">ইউটিউব</a>
             </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <a href="/" className="flex flex-col items-center md:items-start shrink-0">
            <h1 className="text-5xl md:text-6xl font-extrabold text-red-700 tracking-tighter" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
              বঙ্গীয় <span className="text-black">টাইমস</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1 italic font-semibold">সত্য ও সাহসের প্রতিচ্ছবি</p>
          </a>
          
          <div className="w-full md:w-[728px] h-[70px] md:h-[90px] bg-gradient-to-r from-red-50 to-red-100 border border-red-200 flex flex-col justify-center items-center rounded-sm shadow-sm cursor-pointer hover:bg-red-200 transition">
             <h3 className="text-lg md:text-2xl font-bold text-red-900">বিজ্ঞাপন দিন</h3>
             <p className="text-xs md:text-sm text-red-700 font-semibold">ads@bongiyotimes.com</p>
          </div>
        </div>

        <div className="border-t border-gray-200 shadow-sm sticky top-0 z-50 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 overflow-x-auto scrollbar-hide">
            <nav className="flex items-center min-w-max py-2 md:py-3 text-base md:text-lg font-bold text-gray-800 gap-5 md:gap-6">
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
      <main className="max-w-[1200px] mx-auto px-4 mt-4 md:mt-6 pb-10">
        
        {activeCategory ? (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-1 md:col-span-3">
                 <div className="border-b-2 border-red-700 mb-4 pb-2">
                    <h2 className="text-xl md:text-2xl font-bold text-red-700 flex items-center gap-2">
                       <span className="bg-red-700 w-3 h-3 rounded-full"></span> {activeCategory} এর সব খবর
                    </h2>
                 </div>
                 {allNews.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 font-bold text-lg">এই ক্যাটাগরিতে কোনো খবর পাওয়া যায়নি।</div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                       {allNews.map(news => (
                          <a href={news.source_url} target="_blank" key={news.id} className="group flex flex-col gap-2 border border-gray-100 p-3 rounded shadow-sm hover:shadow-md bg-white">
                             <SafeImage src={news.image_url} alt={news.title} className="w-full h-40 md:h-48 rounded-sm" />
                             <span className="text-xs text-red-600 font-bold mt-2">{news.source_name}</span>
                             <h3 className="text-lg md:text-xl font-bold group-hover:text-red-700 leading-snug">{news.title}</h3>
                             <p className="text-[11px] text-gray-500">{formatDateTime(news.created_at)}</p>
                          </a>
                       ))}
                    </div>
                 )}
              </div>
              <div className="hidden md:block col-span-1">
                 <div className="w-full h-[600px] bg-gradient-to-b from-gray-50 to-gray-200 border border-gray-300 flex items-center justify-center text-gray-400 font-bold text-xl rounded">বিজ্ঞাপন</div>
              </div>
           </div>
        ) : (
          <>
            {/* 1. Hero Section */}
            {leadNews && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10 border-b border-gray-300 pb-6 md:pb-8">
                <div className="hidden lg:flex flex-col gap-6 border-r border-gray-200 pr-4">
                  {leftSideNews.map(news => (
                    <a href={news.source_url} target="_blank" key={news.id} className="group block">
                      <SafeImage src={news.image_url} alt={news.title} className="w-full h-32 rounded-sm mb-2" />
                      <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-red-700 leading-tight">{news.title}</h3>
                    </a>
                  ))}
                </div>

                <a href={leadNews.source_url} target="_blank" className="lg:col-span-2 group relative overflow-hidden block">
                  <h1 className="text-2xl md:text-4xl font-extrabold leading-tight text-gray-900 group-hover:text-red-700 transition mb-3 text-center px-2">
                    {leadNews.title}
                  </h1>
                  <SafeImage src={leadNews.image_url} alt={leadNews.title} className="w-full h-[220px] md:h-[350px] rounded-sm" />
                  <p className="text-xs text-gray-500 mt-2 text-center">{formatDateTime(leadNews.created_at)} | <span className="text-red-600 font-bold">{leadNews.source_name}</span></p>
                </a>

                {/* Mobile Sub-leads */}
                <div className="flex lg:hidden flex-col gap-4 mt-4">
                   {[...leftSideNews, ...rightSideNews].slice(0,2).map(news => (
                      <a href={news.source_url} target="_blank" key={news.id} className="flex gap-3 group items-center border-b border-gray-100 pb-3">
                         <SafeImage src={news.image_url} alt={news.title} className="w-24 h-20 rounded-sm shrink-0" />
                         <h3 className="text-sm font-bold text-gray-900 group-hover:text-red-700 leading-snug">{news.title}</h3>
                      </a>
                   ))}
                </div>

                <div className="hidden lg:flex flex-col gap-6 border-l border-gray-200 pl-4">
                  {rightSideNews.map(news => (
                    <a href={news.source_url} target="_blank" key={news.id} className="group block">
                      <SafeImage src={news.image_url} alt={news.title} className="w-full h-32 rounded-sm mb-2" />
                      <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-red-700 leading-tight">{news.title}</h3>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Primary Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 border-b border-gray-200 pb-10">
              <div className="lg:col-span-8 flex flex-col gap-8">
                
                {/* National */}
                <div>
                   <div className="border-b-[3px] border-black mb-4 flex justify-between items-center pb-1">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">বাংলাদেশ <span className="text-red-600 text-[18px]">❯</span></h2>
                      <a href="/?category=বাংলাদেশ" className="text-sm font-bold text-gray-500 hover:text-red-600">সব খবর »</a>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {nationalNews[0] && (
                        <a href={nationalNews[0].source_url} target="_blank" className="group">
                           <SafeImage src={nationalNews[0].image_url} alt={nationalNews[0].title} className="w-full h-48 rounded-sm mb-3" />
                           <h3 className="text-xl md:text-2xl font-bold group-hover:text-red-700 leading-snug">{nationalNews[0].title}</h3>
                        </a>
                      )}
                      <div className="flex flex-col gap-4">
                        {nationalNews.slice(1).map(news => (
                          <a href={news.source_url} target="_blank" key={news.id} className="group flex gap-3 border-b border-gray-100 pb-3">
                             <h3 className="text-[16px] font-bold group-hover:text-red-700 leading-snug flex-1">{news.title}</h3>
                          </a>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
                   {/* Opinion */}
                   <div className="bg-[#fdf9f4] p-4 border border-gray-200 rounded-sm">
                      <h2 className="text-lg font-bold text-red-700 border-b border-red-200 mb-4 pb-2">মতামত</h2>
                      {opinionNews.map(opinion => (
                        <div key={opinion.id} className="flex gap-4 items-center bg-white p-3 mb-3 border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition cursor-pointer">
                           <img src={opinion.image_url} className="w-14 h-14 object-cover rounded-full border border-gray-300 shrink-0" />
                           <div>
                              <h3 className="text-sm font-bold text-gray-900 leading-snug hover:text-red-700">{opinion.title}</h3>
                              <p className="text-xs text-red-600 mt-1">{opinion.author}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   {/* Sports */}
                   <div>
                      <div className="border-b-[3px] border-black mb-4 flex justify-between items-center pb-1">
                         <h2 className="text-xl font-bold text-gray-900">খেলাধুলা <span className="text-red-600 text-[18px]">❯</span></h2>
                         <a href="/?category=খেলাধুলা" className="text-sm font-bold text-gray-500 hover:text-red-600">সব খবর »</a>
                      </div>
                      {sportsNews.map((news, idx) => (
                        <a href={news.source_url} target="_blank" key={news.id} className={`flex gap-3 group items-center ${idx !== 0 ? 'border-t border-gray-100 pt-3 mt-3' : ''}`}>
                          <SafeImage src={news.image_url} alt={news.title} className="w-20 h-16 rounded-sm shrink-0" />
                          <h3 className="text-[15px] font-bold text-gray-800 group-hover:text-red-700 leading-snug line-clamp-2">{news.title}</h3>
                        </a>
                      ))}
                   </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-4">
                 <div className="border border-gray-200 bg-white shadow-sm rounded-sm">
                    <ClientTabs latestList={allNews.slice(5, 12)} popularList={allNews.slice(15, 22)} />
                 </div>
                 
                 <div className="mt-8 w-full h-[250px] bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 flex flex-col justify-center items-center rounded-sm shadow-sm">
                    <h3 className="text-xl font-bold text-blue-900">বিজ্ঞাপন স্পেস</h3>
                    <p className="text-sm text-blue-700">ads@bongiyotimes.com</p>
                 </div>
              </div>
            </div>

            {/* 3. Entertainment Block */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 border-b border-gray-200 pb-10">
               <div className="lg:col-span-8">
                  <div className="border-b-[3px] border-black mb-4 flex justify-between items-center pb-1">
                     <h2 className="text-xl md:text-2xl font-bold text-gray-900">বিনোদন <span className="text-red-600 text-[18px]">❯</span></h2>
                     <a href="/?category=বিনোদন" className="text-sm font-bold text-gray-500 hover:text-red-600">সব খবর »</a>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {entertainmentNews[0] && (
                        <a href={entertainmentNews[0].source_url} target="_blank" className="group block">
                           <SafeImage src={entertainmentNews[0].image_url} alt={entertainmentNews[0].title} className="w-full h-[220px] object-cover rounded-sm mb-3" />
                           <h3 className="text-2xl font-bold text-gray-900 group-hover:text-red-700 leading-snug">{entertainmentNews[0].title}</h3>
                        </a>
                     )}
                     <div className="flex flex-col justify-between gap-4">
                        {entertainmentNews.slice(1, 5).map(news => (
                           <a href={news.source_url} target="_blank" key={news.id} className="group flex gap-4 items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                              <div className="flex-1">
                                 <h3 className="text-[16px] font-bold text-gray-800 group-hover:text-red-700 leading-snug line-clamp-2">{news.title}</h3>
                                 <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(news.created_at)}</p>
                              </div>
                              <SafeImage src={news.image_url} alt={news.title} className="w-24 h-16 object-cover rounded-sm shrink-0" />
                           </a>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Tech */}
               <div className="lg:col-span-4">
                  <div className="border-b-[3px] border-black mb-4 flex justify-between items-center pb-1">
                     <h2 className="text-xl font-bold text-gray-900">প্রযুক্তি <span className="text-red-600 text-[18px]">❯</span></h2>
                  </div>
                  {techNews[0] && (
                     <a href={techNews[0].source_url} target="_blank" className="group block mb-4 border-b border-gray-100 pb-4">
                        <SafeImage src={techNews[0].image_url} alt={techNews[0].title} className="w-full h-40 object-cover rounded-sm mb-2" />
                        <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-red-700 leading-snug">{techNews[0].title}</h3>
                     </a>
                  )}
                  <div className="flex flex-col gap-3">
                     {techNews.slice(1, 4).map(news => (
                        <a href={news.source_url} target="_blank" key={news.id} className="group block border-b border-gray-100 pb-3 last:border-0">
                           <h3 className="text-[15px] font-bold text-gray-800 group-hover:text-red-700 leading-snug">{news.title}</h3>
                        </a>
                     ))}
                  </div>
               </div>
            </div>

            {/* 4. Business & Law Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
               {businessNews.length > 0 && (
                 <div>
                    <div className="mb-6 flex justify-between items-center">
                       <h2 className="text-xl md:text-2xl font-bold border-l-[5px] border-red-600 pl-3 text-gray-900">বাণিজ্য</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       {businessNews[0] && (
                         <a href={businessNews[0].source_url} target="_blank" className="group block">
                            <SafeImage src={businessNews[0].image_url} alt={businessNews[0].title} className="w-full h-36 object-cover rounded-sm mb-3" />
                            <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-red-700 leading-snug">{businessNews[0].title}</h3>
                         </a>
                       )}
                       <div className="flex flex-col gap-4">
                          {businessNews.slice(1, 4).map(news => (
                             <a href={news.source_url} target="_blank" key={news.id} className="group flex gap-3 items-start border-b border-gray-100 pb-3 last:border-0">
                                <SafeImage src={news.image_url} alt={news.title} className="w-20 h-14 object-cover rounded-sm shrink-0" />
                                <h3 className="text-[14px] font-bold text-gray-800 group-hover:text-red-700 leading-snug">{news.title}</h3>
                             </a>
                          ))}
                       </div>
                    </div>
                 </div>
               )}
               
               {lawNews.length > 0 && (
                 <div>
                    <div className="mb-6 flex justify-between items-center">
                       <h2 className="text-xl md:text-2xl font-bold border-l-[5px] border-red-600 pl-3 text-gray-900">আইন-আদালত</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       {lawNews[0] && (
                         <a href={lawNews[0].source_url} target="_blank" className="group block">
                            <SafeImage src={lawNews[0].image_url} alt={lawNews[0].title} className="w-full h-36 object-cover rounded-sm mb-3" />
                            <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-red-700 leading-snug">{lawNews[0].title}</h3>
                         </a>
                       )}
                       <div className="flex flex-col gap-4">
                          {lawNews.slice(1, 4).map(news => (
                             <a href={news.source_url} target="_blank" key={news.id} className="group flex gap-3 items-start border-b border-gray-100 pb-3 last:border-0">
                                <SafeImage src={news.image_url} alt={news.title} className="w-20 h-14 object-cover rounded-sm shrink-0" />
                                <h3 className="text-[14px] font-bold text-gray-800 group-hover:text-red-700 leading-snug">{news.title}</h3>
                             </a>
                          ))}
                       </div>
                    </div>
                 </div>
               )}
            </div>

            {/* 5. Religion Block */}
            {religionNews.length > 0 && (
               <div className="mb-10 border border-gray-200 bg-gray-50 p-4 rounded-sm">
                  <div className="border-b border-gray-300 mb-4 pb-2">
                     <h2 className="text-xl font-bold text-gray-900 border-l-[5px] border-green-600 pl-2">ধর্ম</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     {religionNews.map(news => (
                       <a href={news.source_url} target="_blank" key={news.id} className="group block bg-white p-2 rounded shadow-sm hover:shadow-md transition">
                          <SafeImage src={news.image_url} alt={news.title} className="w-full h-28 object-cover rounded-sm mb-2" />
                          <h3 className="text-[15px] font-bold text-gray-800 group-hover:text-green-700 leading-snug line-clamp-3">{news.title}</h3>
                       </a>
                     ))}
                  </div>
               </div>
            )}

          </>
        )}
      </main>

      {/* ----------------- Footer ----------------- */}
      <footer className="bg-[#1a1a1a] text-gray-300 mt-12 border-t-4 border-red-700">
        <div className="max-w-[1200px] mx-auto px-4 py-10">
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
