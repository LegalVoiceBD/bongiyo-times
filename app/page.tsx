import React from 'react';
import { createClient } from '@supabase/supabase-js';
import ClientTabs from './components/ClientTabs';
import SafeImage from './components/SafeImage';

export const revalidate = 0;

function formatTimeOnly(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default async function Home({ searchParams }: { searchParams: { category?: string, tab?: string, page?: string, q?: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const activeCategory = searchParams.category || '';
  const searchQuery = searchParams.q || '';
  const currentPage = parseInt(searchParams.page || '1');
  const limitPerPage = 20; 
  const startRow = (currentPage - 1) * limitPerPage;
  const endRow = startRow + limitPerPage - 1;

  // IMPORTANT: Added .eq('is_custom', true) to ONLY fetch manually uploaded news
  let query = supabase.from('news').select('*', { count: 'exact' }).eq('is_custom', true).order('created_at', { ascending: false });
  
  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`).range(startRow, endRow);
  } else if (activeCategory) {
    query = query.eq('category', activeCategory).range(startRow, endRow);
  } else {
    query = query.limit(150); 
  }

  const { data: newsItems, count } = await query;
  const totalPages = count ? Math.ceil(count / limitPerPage) : 1;
  const allNews = newsItems || [];

  const leadNews = allNews[0];
  const leftSideNews = allNews.slice(1, 4);
  const rightSideNews = allNews.slice(4, 8);
  
  // Custom Category Filters
  const opinionNews = allNews.filter(n => n.category === 'মতামত').slice(0, 6);
  const entertainmentNews = allNews.filter(n => n.category === 'বিনোদন').slice(0, 5);
  const eduNews = allNews.filter(n => n.category === 'শিক্ষা' || n.title.includes('শিক্ষা')).slice(0, 5);
  const humorNews = allNews.filter(n => n.category === 'হাস্যরস').slice(0, 5);
  const jobNews = allNews.filter(n => n.category === 'চাকরি' || n.category === 'চাকুরি').slice(0, 5);
  const lawNews = allNews.filter(n => n.category === 'আইন-আদালত').slice(0, 6);

  // Updated Menu Categories
  const menuCategories = ["সর্বশেষ", "মতামত", "শিক্ষা", "হাস্যরস", "বিনোদন", "আইন-আদালত", "চাকরি"];

  return (
    <div className="min-h-screen bg-white text-black font-serif">
      
      {/* 1. Exact Prothom Alo Header */}
      <header className="bg-white pt-3 md:pt-5 pb-0">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center md:items-end pb-3">
          
          <a href="/" className="flex flex-col shrink-0 mb-4 md:mb-0">
            <h1 className="text-5xl md:text-6xl font-extrabold text-black tracking-tighter" style={{ fontFamily: 'serif' }}>বঙ্গীয় <span className="text-red-600">টাইমস</span></h1>
          </a>

          <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-2">
             <div className="text-[15px] text-gray-700 flex flex-wrap justify-center md:justify-end items-center gap-4 font-sans font-medium">
                <span className="cursor-pointer hover:text-blue-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> 
                  খুঁজুন
                </span>
                <span className="cursor-pointer hover:text-blue-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                  ই-পেপার
                </span>
                <span className="bg-red-50 text-red-700 px-3 py-1 cursor-pointer font-bold border border-red-100">Eng</span>
                <span className="cursor-pointer hover:text-blue-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Login
                </span>
             </div>
             <div className="text-gray-500 text-sm font-sans mt-1">
                ঢাকা | {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
          </div>
        </div>
        
        {/* Exact Nav Bar */}
        <div className="border-y border-gray-300 shadow-sm sticky top-0 z-50 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 overflow-x-auto scrollbar-hide">
            <nav className="flex items-center justify-center md:justify-start min-w-max py-2.5 text-[15px] font-bold text-gray-800 gap-5 md:gap-6 font-sans">
              <a href="/" className="hover:text-blue-600 transition">প্রচ্ছদ</a>
              {menuCategories.map((cat, index) => (
                <a key={index} href={`/?category=${cat}`} className={`hover:text-blue-600 transition ${activeCategory === cat ? 'text-blue-600' : ''}`}>{cat}</a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* HEADER ADSENSE */}
      <div className="max-w-[1200px] mx-auto px-4 my-4 flex justify-center">
        <div className="w-full md:w-[728px] overflow-hidden flex justify-center bg-gray-50 items-center min-h-[90px]">
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6625131155258287" crossOrigin="anonymous"></script>
          <ins className="adsbygoogle"
               style={{display:"block", width:"100%"}}
               data-ad-client="ca-pub-6625131155258287"
               data-ad-slot="7589682146"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          <script dangerouslySetInnerHTML={{ __html: '(window.adsbygoogle = window.adsbygoogle || []).push({});' }}></script>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-4 pb-10">
        {(activeCategory || searchQuery) ? (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
              <div className="col-span-1 md:col-span-3">
                 <div className="border-b-[3px] border-black mb-4 pb-1">
                    <h2 className="text-xl md:text-2xl font-bold text-blue-800 font-sans">
                       {searchQuery ? `"${searchQuery}" এর সার্চ রেজাল্ট` : `${activeCategory} এর সব খবর`}
                    </h2>
                 </div>
                 {allNews.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 font-bold text-lg font-sans">এই ক্যাটাগরিতে এখনো কোনো মৌলিক খবর প্রকাশ করা হয়নি।</div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                       {allNews.map(news => (
                          <a href={news.is_custom ? `/news/${news.id}` : news.source_url} key={news.id} className="group flex flex-col gap-2 pb-4 border-b border-gray-200">
                             <SafeImage src={news.image_url} alt={news.title} className="w-full h-40 object-cover rounded-sm" />
                             <h3 className="text-lg font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                             <p className="text-[12px] text-gray-500 font-sans mt-auto pt-1">{formatTimeOnly(news.created_at)}</p>
                          </a>
                       ))}
                    </div>
                 )}
              </div>
              <div className="hidden md:block col-span-1 border-l border-gray-200 pl-4">
                 {/* Sidebar Vertical AdSense */}
                 <div className="w-full bg-gray-50 overflow-hidden flex justify-center sticky top-20 min-h-[600px]">
                    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6625131155258287" crossOrigin="anonymous"></script>
                    <ins className="adsbygoogle"
                         style={{display:"block", width:"100%"}}
                         data-ad-client="ca-pub-6625131155258287"
                         data-ad-slot="4963518807"
                         data-ad-format="auto"
                         data-full-width-responsive="true"></ins>
                    <script dangerouslySetInnerHTML={{ __html: '(window.adsbygoogle = window.adsbygoogle || []).push({});' }}></script>
                 </div>
              </div>
           </div>
        ) : (
          <>
            {/* 3. HERO SECTION - EXACT PA LAYOUT */}
            {leadNews && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-gray-300 pb-5 mb-6">
                
                {/* Left Column */}
                <div className="lg:col-span-3 lg:border-r border-gray-300 lg:pr-5 flex flex-col divide-y divide-gray-200">
                  {leftSideNews.map(news => (
                    <a href={news.is_custom ? `/news/${news.id}` : news.source_url} key={news.id} className="group py-3 first:pt-0 block">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 leading-tight mb-2">{news.title}</h3>
                      <p className="text-xs text-gray-500 font-sans">{formatTimeOnly(news.created_at)}</p>
                    </a>
                  ))}
                </div>
                
                {/* Center Column (Big Lead News) */}
                <a href={leadNews.is_custom ? `/news/${leadNews.id}` : leadNews.source_url} className="lg:col-span-6 group block px-0 lg:px-5 py-4 lg:py-0 border-y lg:border-0 border-gray-200 my-4 lg:my-0">
                  <SafeImage src={leadNews.image_url} alt={leadNews.title} className="w-full h-[250px] md:h-[350px] object-cover rounded-sm mb-3" />
                  <div className="flex items-center gap-2 mb-1">
                     <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                     <span className="text-red-600 font-bold text-[15px] font-sans">সর্বশেষ</span>
                  </div>
                  <h1 className="text-3xl md:text-[40px] font-bold leading-tight text-gray-900 group-hover:text-blue-600 transition mb-3">{leadNews.title}</h1>
                  <p className="text-[16px] text-gray-700 leading-relaxed font-sans line-clamp-3">{leadNews.snippet}</p>
                  <p className="text-xs text-gray-500 font-sans mt-3">{formatTimeOnly(leadNews.created_at)}</p>
                </a>
                
                {/* Right Column (Thumbnails right side) */}
                <div className="lg:col-span-3 lg:border-l border-gray-300 lg:pl-5 flex flex-col divide-y divide-gray-200">
                  {rightSideNews.map(news => (
                    <a href={news.is_custom ? `/news/${news.id}` : news.source_url} key={news.id} className="group py-3 first:pt-0 flex gap-4 items-start">
                      <div className="flex-1">
                         <h3 className="text-[16px] font-bold text-gray-900 group-hover:text-blue-600 leading-tight mb-2">{news.title}</h3>
                         <p className="text-[11px] text-gray-500 font-sans">{formatTimeOnly(news.created_at)}</p>
                      </div>
                      <SafeImage src={news.image_url} alt={news.title} className="w-[100px] h-[65px] object-cover shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* MAIN BODY GRID: 9 Col Left + 3 Col Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-gray-300 pb-8 mb-8">
              
              {/* LEFT HUGE CONTENT AREA (9 Cols) */}
              <div className="lg:col-span-9 lg:border-r border-gray-300 lg:pr-6 flex flex-col gap-8">
                
                {/* --- OPINION (মতামত) SECTION --- */}
                <div>
                   <div className="border-t-[3px] border-black pt-1 mb-4">
                      <a href="/?category=মতামত" className="text-[22px] font-bold text-gray-900 flex items-center font-sans hover:text-blue-600 cursor-pointer w-max">মতামত <span className="text-red-500 ml-2 font-bold text-lg">❯</span></a>
                   </div>
                   {opinionNews.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <a href={opinionNews[0]?.is_custom ? `/news/${opinionNews[0]?.id}` : opinionNews[0]?.source_url} className="group col-span-1 md:col-span-2 border-b md:border-b-0 border-gray-200 pb-4 md:pb-0 md:border-r pr-0 md:pr-6">
                         <SafeImage src={opinionNews[0]?.image_url} alt={opinionNews[0]?.title} className="w-full h-[280px] object-cover mb-3" />
                         <h3 className="text-[26px] font-bold text-gray-900 group-hover:text-blue-600 leading-tight mb-2">{opinionNews[0]?.title}</h3>
                         <p className="text-[15px] text-gray-700 font-sans line-clamp-2">{opinionNews[0]?.snippet}</p>
                      </a>
                      
                      <div className="flex flex-col divide-y divide-gray-200 col-span-1">
                        {opinionNews.slice(1, 5).map(news => (
                          <a href={news.is_custom ? `/news/${news.id}` : news.source_url} key={news.id} className="group py-3 first:pt-0">
                             <h3 className="text-[16px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                             <p className="text-[11px] text-gray-500 font-sans mt-2">{formatTimeOnly(news.created_at)}</p>
                          </a>
                        ))}
                      </div>
                   </div>
                   ) : (
                       <p className="text-gray-400 text-sm italic">এই ক্যাটাগরিতে এখনো কোনো কন্টেন্ট নেই।</p>
                   )}
                </div>

                {/* --- ENTERTAINMENT & EDUCATION (2 cols inside 9 cols) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-300 pt-5">
                   {/* বিনোদন */}
                   <div className="border-b md:border-b-0 md:border-r border-gray-300 md:pr-6 pb-6 md:pb-0">
                      <div className="border-t-[3px] border-black pt-1 mb-4">
                         <a href="/?category=বিনোদন" className="text-[22px] font-bold text-gray-900 flex items-center font-sans hover:text-blue-600 cursor-pointer w-max">বিনোদন <span className="text-red-500 ml-2 font-bold text-lg">❯</span></a>
                      </div>
                      <div className="flex flex-col divide-y divide-gray-200">
                         {entertainmentNews[0] && (
                            <a href={entertainmentNews[0].is_custom ? `/news/${entertainmentNews[0].id}` : entertainmentNews[0].source_url} className="group pb-4 block">
                               <SafeImage src={entertainmentNews[0].image_url} alt={entertainmentNews[0].title} className="w-full h-[180px] object-cover mb-3" />
                               <h3 className="text-[20px] font-bold text-gray-900 group-hover:text-blue-600 leading-snug mb-2">{entertainmentNews[0].title}</h3>
                               <p className="text-[14px] text-gray-700 font-sans line-clamp-2">{entertainmentNews[0].snippet}</p>
                            </a>
                         )}
                         {entertainmentNews.slice(1, 4).map(news => (
                            <a href={news.is_custom ? `/news/${news.id}` : news.source_url} key={news.id} className="group py-3 flex gap-4 items-start">
                               <div className="flex-1">
                                  <h3 className="text-[15px] font-bold text-gray-800 group-hover:text-blue-600 leading-snug mb-1">{news.title}</h3>
                               </div>
                               <SafeImage src={news.image_url} alt={news.title} className="w-[90px] h-[60px] object-cover shrink-0" />
                            </a>
                         ))}
                      </div>
                   </div>
                   
                   {/* শিক্ষা */}
                   <div>
                      <div className="border-t-[3px] border-black pt-1 mb-4">
                         <a href="/?category=শিক্ষা" className="text-[22px] font-bold text-gray-900 flex items-center font-sans hover:text-blue-600 cursor-pointer w-max">শিক্ষা <span className="text-red-500 ml-2 font-bold text-lg">❯</span></a>
                      </div>
                      <div className="flex flex-col divide-y divide-gray-200">
                         {eduNews[0] && (
                            <a href={eduNews[0].is_custom ? `/news/${eduNews[0].id}` : eduNews[0].source_url} className="group pb-4 block">
                               <SafeImage src={eduNews[0].image_url} alt={eduNews[0].title} className="w-full h-[180px] object-cover mb-3" />
                               <h3 className="text-[20px] font-bold text-gray-900 group-hover:text-blue-600 leading-snug mb-2">{eduNews[0].title}</h3>
                               <p className="text-[14px] text-gray-700 font-sans line-clamp-2">{eduNews[0].snippet}</p>
                            </a>
                         )}
                         {eduNews.slice(1, 4).map(news => (
                            <a href={news.is_custom ? `/news/${news.id}` : news.source_url} key={news.id} className="group py-3 flex gap-4 items-start">
                               <div className="flex-1">
                                  <h3 className="text-[15px] font-bold text-gray-800 group-hover:text-blue-600 leading-snug mb-1">{news.title}</h3>
                               </div>
                               <SafeImage src={news.image_url} alt={news.title} className="w-[90px] h-[60px] object-cover shrink-0" />
                            </a>
                         ))}
                      </div>
                   </div>
                </div>

                {/* --- HUMOR & JOBS (Grid) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-300 pt-5">
                   {/* হাস্যরস */}
                   <div className="border-b md:border-b-0 md:border-r border-gray-300 md:pr-6 pb-6 md:pb-0">
                      <div className="border-t-[3px] border-black pt-1 mb-4">
                         <a href="/?category=হাস্যরস" className="text-[22px] font-bold text-gray-900 flex items-center font-sans hover:text-blue-600 cursor-pointer w-max">হাস্যরস <span className="text-red-500 ml-2 font-bold text-lg">❯</span></a>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         {humorNews.slice(0,4).map(news => (
                            <a href={news.is_custom ? `/news/${news.id}` : news.source_url} key={news.id} className="group block">
                               <SafeImage src={news.image_url} alt={news.title} className="w-full h-[100px] object-cover mb-2" />
                               <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-blue-600 leading-snug">{news.title}</h3>
                            </a>
                         ))}
                      </div>
                   </div>
                   
                   {/* চাকরি */}
                   <div>
                      <div className="border-t-[3px] border-black pt-1 mb-4">
                         <a href="/?category=চাকরি" className="text-[22px] font-bold text-gray-900 flex items-center font-sans hover:text-blue-600 cursor-pointer w-max">চাকরি <span className="text-red-500 ml-2 font-bold text-lg">❯</span></a>
                      </div>
                      <div className="flex flex-col divide-y divide-gray-200">
                         {jobNews.slice(0, 4).map(news => (
                            <a href={news.is_custom ? `/news/${news.id}` : news.source_url} key={news.id} className="group py-3 first:pt-0 flex gap-4 items-center">
                               <SafeImage src={news.image_url} alt={news.title} className="w-[120px] h-[75px] object-cover shrink-0" />
                               <div className="flex-1">
                                  <h3 className="text-[16px] font-bold text-gray-800 group-hover:text-blue-600 leading-snug">{news.title}</h3>
                               </div>
                            </a>
                         ))}
                      </div>
                   </div>
                </div>

              </div> {/* END OF LEFT 9 COLS */}

              {/* RIGHT SIDEBAR (3 Cols) */}
              <div className="lg:col-span-3 lg:pl-6 flex flex-col gap-6">
                 {/* Pothito / Alochito Tabs */}
                 <div className="border border-gray-200 bg-white">
                    <ClientTabs latestList={allNews.slice(0, 7)} popularList={allNews.slice(1, 8)} />
                 </div>
                 
                 {/* Sidebar Square AdSense Block */}
                 <div className="w-full bg-gray-50 flex flex-col items-center py-2 border-y border-gray-200">
                    <div className="w-full overflow-hidden flex justify-center min-h-[250px]">
                        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6625131155258287" crossOrigin="anonymous"></script>
                        <ins className="adsbygoogle"
                             style={{display:"block", width:"100%"}}
                             data-ad-client="ca-pub-6625131155258287"
                             data-ad-slot="6232073291"
                             data-ad-format="auto"
                             data-full-width-responsive="true"></ins>
                        <script dangerouslySetInnerHTML={{ __html: '(window.adsbygoogle = window.adsbygoogle || []).push({});' }}></script>
                    </div>
                 </div>

                 {/* Sidebar Law & Court Section */}
                 <div>
                    <div className="border-t-[3px] border-black pt-1 mb-3">
                       <a href="/?category=আইন-আদালত" className="text-xl font-bold text-gray-900 font-sans flex items-center hover:text-blue-600 cursor-pointer">আইন-আদালত <span className="text-red-500 ml-2 font-bold text-lg">❯</span></a>
                    </div>
                    <div className="flex flex-col divide-y divide-gray-200">
                       {lawNews.slice(0, 6).map(news => (
                         <a href={news.is_custom ? `/news/${news.id}` : news.source_url} key={news.id} className="group py-3 first:pt-0 flex gap-3 items-center">
                           <div className="flex-1">
                              <h3 className="text-[15px] font-bold text-gray-800 group-hover:text-blue-600 leading-snug">{news.title}</h3>
                           </div>
                           <SafeImage src={news.image_url} alt={news.title} className="w-[80px] h-[55px] object-cover shrink-0" />
                         </a>
                       ))}
                    </div>
                 </div>

              </div>
            </div>

          </>
        )}
      </main>

      <footer className="bg-[#1a1a1a] text-gray-300 mt-8 border-t-[5px] border-red-700 font-sans">
        <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-4 font-serif">বঙ্গীয় <span className="text-red-600">টাইমস</span></h2>
              <p className="text-sm leading-relaxed text-gray-400">সত্য, সাহস ও বস্তুনিষ্ঠ সাংবাদিকতার এক অবিচল কণ্ঠস্বর। আমাদের নিজস্ব প্রতিনিধি ও পাঠকদের পাঠানো মৌলিক কন্টেন্টে সাজানো নির্ভুল সংবাদমাধ্যম।</p>
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
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-[13px] text-gray-500 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
            <div className="flex gap-4 mt-3 md:mt-0">
               <a href="/terms" className="hover:text-white cursor-pointer">শর্তাবলি</a>
               <a href="/privacy-policy" className="hover:text-white cursor-pointer">গোপনীয়তা নীতি</a>
               <a href="/about-us" className="hover:text-white cursor-pointer">আমাদের সম্পর্কে</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
