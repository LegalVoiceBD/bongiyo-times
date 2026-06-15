import React from 'react';
import { createClient } from '@supabase/supabase-js';
import ClientTabs from './components/ClientTabs';
import SafeImage from './components/SafeImage';

export const revalidate = 0;

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  const d = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  const t = date.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${d}, ${t}`;
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

  let query = supabase.from('news').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  
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
  const rightSideNews = allNews.slice(4, 7);
  
  const nationalNews = allNews.filter(n => n.category === 'বাংলাদেশ' || n.category === 'জাতীয়' || n.category === 'সারাদেশ').slice(0, 5);
  const worldNews = allNews.filter(n => n.category === 'আন্তর্জাতিক' || n.category === 'বিশ্ব').slice(0, 5);
  const entertainmentNews = allNews.filter(n => n.category === 'বিনোদন').slice(0, 5);
  const techNews = allNews.filter(n => n.category === 'প্রযুক্তি').slice(0, 4);
  const businessNews = allNews.filter(n => n.category === 'বাণিজ্য').slice(0, 5);
  const lawNews = allNews.filter(n => n.category === 'আইন-আদালত').slice(0, 5);
  const religionNews = allNews.filter(n => n.category === 'ধর্ম').slice(0, 4);
  const sportsNews = allNews.filter(n => n.category === 'খেলাধুলা').slice(0, 5);
  const eduNews = allNews.filter(n => n.category === 'শিক্ষা' || n.title.includes('শিক্ষা')).slice(0, 4);

  const menuCategories = ["সর্বশেষ", "বাংলাদেশ", "রাজনীতি", "বিশ্ব", "বাণিজ্য", "মতামত", "খেলা", "বিনোদন", "চাকরি", "জীবনযাপন", "ভিডিও", "আইন-আদালত", "শিক্ষা", "প্রযুক্তি", "ধর্ম"];

  return (
    <div className="min-h-screen bg-white text-black font-serif">
      {/* 1. Prothom Alo Style Header */}
      <header className="bg-white">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="flex flex-col shrink-0">
            <h1 className="text-4xl md:text-5xl font-extrabold text-red-700 tracking-tighter">বঙ্গীয় <span className="text-black">টাইমস</span></h1>
          </a>
          <div className="hidden md:flex flex-col items-end gap-1">
             <div className="text-sm text-gray-600 flex items-center gap-3 font-sans">
                <span className="cursor-pointer hover:text-red-700">🔍 খুঁজুন</span>
                <span className="border-l border-gray-300 pl-3 cursor-pointer hover:text-red-700">📅 ই-পেপার</span>
                <span className="border-l border-gray-300 pl-3 font-bold cursor-pointer hover:text-red-700">Eng</span>
                <span className="border-l border-gray-300 pl-3 cursor-pointer hover:text-red-700">👤 Login</span>
             </div>
             <p className="text-xs text-gray-500 mt-2">ঢাকা | {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        
        {/* 2. Compact Navigation Bar */}
        <div className="border-y border-gray-200 shadow-sm sticky top-0 z-50 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 overflow-x-auto scrollbar-hide">
            <nav className="flex items-center min-w-max py-2 text-[15px] font-bold text-gray-800 gap-4 md:gap-5 font-sans">
              <a href="/" className="hover:text-red-600 transition">প্রচ্ছদ</a>
              {menuCategories.map((cat, index) => (
                <a key={index} href={`/?category=${cat}`} className={`hover:text-red-600 transition ${activeCategory === cat ? 'text-red-600' : ''}`}>{cat}</a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 mt-4 pb-8">
        {(activeCategory || searchQuery) ? (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-1 md:col-span-3">
                 <div className="border-b-[3px] border-black mb-4 pb-1">
                    <h2 className="text-xl md:text-2xl font-bold text-red-700">
                       {searchQuery ? `"${searchQuery}" এর সার্চ রেজাল্ট` : `${activeCategory} এর সব খবর`}
                    </h2>
                 </div>
                 {allNews.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 font-bold text-lg font-sans">কোনো খবর পাওয়া যায়নি।</div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                       {allNews.map(news => (
                          <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex flex-col gap-2 pb-4 border-b border-gray-200">
                             <SafeImage src={news.image_url} alt={news.title} className="w-full h-36 rounded-sm" />
                             <h3 className="text-[17px] font-bold group-hover:text-red-700 leading-snug">{news.title}</h3>
                             <p className="text-[12px] text-gray-500 font-sans">{formatDateTime(news.created_at)}</p>
                          </a>
                       ))}
                    </div>
                 )}
              </div>
              <div className="hidden md:block col-span-1 border-l border-gray-200 pl-4">
                 <div className="w-full bg-gray-50 border border-gray-100 flex flex-col items-center pt-1 pb-2 sticky top-16">
                    <span className="text-[10px] text-gray-400 mb-1 font-sans">- বিজ্ঞাপন -</span>
                    <div className="w-full overflow-hidden flex justify-center">
                        <ins className="adsbygoogle"
                             style={{ display: "block", width: "100%" }}
                             data-ad-client="ca-pub-6625131155258287"
                             data-ad-slot="4963518807"
                             data-ad-format="auto"
                             data-full-width-responsive="true"></ins>
                        <script dangerouslySetInnerHTML={{ __html: '(window.adsbygoogle = window.adsbygoogle || []).push({});' }}></script>
                    </div>
                 </div>
              </div>
           </div>
        ) : (
          <>
            {/* 3. Prothom Alo Style 3-Column Hero Section */}
            {leadNews && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-gray-300 pb-4 mb-6">
                {/* Left Column (News List) */}
                <div className="lg:col-span-3 lg:border-r border-gray-300 lg:pr-4 flex flex-col divide-y divide-gray-200">
                  {leftSideNews.map(news => (
                    <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group py-3 first:pt-0 block">
                      <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-red-700 leading-tight mb-2">{news.title}</h3>
                      <p className="text-xs text-gray-500 font-sans">{formatDateTime(news.created_at)}</p>
                    </a>
                  ))}
                </div>
                
                {/* Center Column (Lead News) */}
                <a href={leadNews.is_custom ? `/news/${leadNews.id}` : leadNews.source_url} target="_blank" className="lg:col-span-6 group block px-0 lg:px-4 py-4 lg:py-0 border-y lg:border-0 border-gray-200 my-4 lg:my-0">
                  <SafeImage src={leadNews.image_url} alt={leadNews.title} className="w-full h-[220px] md:h-[320px] rounded-sm mb-3" />
                  <div className="flex items-center gap-2 mb-1">
                     <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                     <span className="text-red-600 font-bold text-sm font-sans">সরাসরি</span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-extrabold leading-tight text-gray-900 group-hover:text-red-700 transition mb-2">{leadNews.title}</h1>
                  <p className="text-[15px] text-gray-700 leading-relaxed line-clamp-3">{leadNews.snippet}</p>
                </a>
                
                {/* Right Column (News with images) */}
                <div className="lg:col-span-3 lg:border-l border-gray-300 lg:pl-4 flex flex-col divide-y divide-gray-200">
                  {rightSideNews.map(news => (
                    <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group py-3 first:pt-0 flex gap-3 items-start">
                      <div className="flex-1">
                         <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-red-700 leading-tight">{news.title}</h3>
                      </div>
                      <SafeImage src={news.image_url} alt={news.title} className="w-20 h-16 rounded-sm shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Main Body: Left Content + Right Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              <div className="lg:col-span-9 flex flex-col gap-6">
                
                {/* Bangladesh Section */}
                <div>
                   <div className="border-t-[3px] border-black pt-1 mb-4 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-900">বাংলাদেশ <span className="text-red-600 font-sans">❯</span></h2>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {nationalNews.slice(0,3).map(news => (
                        <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex flex-col gap-2">
                           <SafeImage src={news.image_url} alt={news.title} className="w-full h-36 rounded-sm" />
                           <h3 className="text-[17px] font-bold group-hover:text-red-700 leading-snug">{news.title}</h3>
                        </a>
                      ))}
                   </div>
                </div>

                {/* Horizontal In-Article AdSense Block */}
                <div className="w-full bg-gray-50 border border-gray-100 flex flex-col items-center pt-1 pb-2">
                  <span className="text-[10px] text-gray-400 mb-1 font-sans">- বিজ্ঞাপন -</span>
                  <div className="w-full overflow-hidden flex justify-center">
                    <ins className="adsbygoogle"
                         style={{ display: "block", width: "100%" }}
                         data-ad-client="ca-pub-6625131155258287"
                         data-ad-slot="7589682146"
                         data-ad-format="auto"
                         data-full-width-responsive="true"></ins>
                    <script dangerouslySetInnerHTML={{ __html: '(window.adsbygoogle = window.adsbygoogle || []).push({});' }}></script>
                  </div>
                </div>

                {/* Entertainment & Tech (2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-300 pt-5">
                   <div>
                      <div className="border-t-[3px] border-black pt-1 mb-4">
                         <h2 className="text-xl font-bold text-gray-900">বিনোদন <span className="text-red-600 font-sans">❯</span></h2>
                      </div>
                      <div className="flex flex-col divide-y divide-gray-200">
                         {entertainmentNews[0] && (
                            <a href={entertainmentNews[0].is_custom ? `/news/${entertainmentNews[0].id}` : entertainmentNews[0].source_url} target="_blank" className="group pb-3 block">
                               <SafeImage src={entertainmentNews[0].image_url} alt={entertainmentNews[0].title} className="w-full h-[180px] object-cover rounded-sm mb-2" />
                               <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-700 leading-snug">{entertainmentNews[0].title}</h3>
                            </a>
                         )}
                         {entertainmentNews.slice(1, 4).map(news => (
                            <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group py-3 flex gap-3 items-start">
                               <div className="flex-1"><h3 className="text-[15px] font-bold text-gray-800 group-hover:text-red-700 leading-snug line-clamp-2">{news.title}</h3></div>
                               <SafeImage src={news.image_url} alt={news.title} className="w-20 h-14 object-cover rounded-sm shrink-0" />
                            </a>
                         ))}
                      </div>
                   </div>
                   
                   <div>
                      <div className="border-t-[3px] border-black pt-1 mb-4">
                         <h2 className="text-xl font-bold text-gray-900">প্রযুক্তি <span className="text-red-600 font-sans">❯</span></h2>
                      </div>
                      <div className="flex flex-col divide-y divide-gray-200">
                         {techNews[0] && (
                            <a href={techNews[0].is_custom ? `/news/${techNews[0].id}` : techNews[0].source_url} target="_blank" className="group pb-3 block">
                               <SafeImage src={techNews[0].image_url} alt={techNews[0].title} className="w-full h-[180px] object-cover rounded-sm mb-2" />
                               <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-700 leading-snug">{techNews[0].title}</h3>
                            </a>
                         )}
                         {techNews.slice(1, 4).map(news => (
                            <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group py-3 flex gap-3 items-start">
                               <div className="flex-1"><h3 className="text-[15px] font-bold text-gray-800 group-hover:text-red-700 leading-snug line-clamp-2">{news.title}</h3></div>
                               <SafeImage src={news.image_url} alt={news.title} className="w-20 h-14 object-cover rounded-sm shrink-0" />
                            </a>
                         ))}
                      </div>
                   </div>
                </div>

              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-3 border-l border-gray-200 lg:pl-4 flex flex-col gap-6">
                 {/* Sidebar Tabs */}
                 <div className="border border-gray-200 bg-white">
                    <ClientTabs latestList={allNews.slice(5, 12)} popularList={allNews.slice(15, 22)} />
                 </div>
                 
                 {/* Sidebar Square AdSense Block */}
                 <div className="w-full bg-gray-50 border border-gray-100 flex flex-col items-center pt-1 pb-2">
                    <span className="text-[10px] text-gray-400 mb-1 font-sans">- বিজ্ঞাপন -</span>
                    <div className="w-full overflow-hidden flex justify-center">
                        <ins className="adsbygoogle"
                             style={{ display: "block", width: "100%" }}
                             data-ad-client="ca-pub-6625131155258287"
                             data-ad-slot="6232073291"
                             data-ad-format="auto"
                             data-full-width-responsive="true"></ins>
                        <script dangerouslySetInnerHTML={{ __html: '(window.adsbygoogle = window.adsbygoogle || []).push({});' }}></script>
                    </div>
                 </div>

                 {/* Sidebar Law Section */}
                 <div>
                    <div className="border-t-[3px] border-black pt-1 mb-3">
                       <h2 className="text-lg font-bold text-gray-900">আইন-আদালত <span className="text-red-600 font-sans">❯</span></h2>
                    </div>
                    <div className="flex flex-col divide-y divide-gray-200">
                       {lawNews.slice(0, 4).map(news => (
                         <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group py-2 flex flex-col gap-1">
                           <h3 className="text-[15px] font-bold text-gray-800 group-hover:text-red-700 leading-snug">{news.title}</h3>
                         </a>
                       ))}
                    </div>
                 </div>
              </div>
            </div>

            {/* 5. Full Width Sections (Sports, World, Education, Religion) */}
            <div className="flex flex-col gap-8 mb-10">
               
               {/* Sports Section */}
               <div className="border-t-[3px] border-black pt-2">
                  <div className="mb-4 flex justify-between items-center">
                     <h2 className="text-2xl font-bold text-gray-900">খেলা <span className="text-red-600 font-sans">❯</span></h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                     {sportsNews.slice(0,4).map((news, idx) => (
                       <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group flex flex-col gap-2 py-4 md:py-0 ${idx !== 0 ? 'md:pl-5' : ''}`}>
                          <SafeImage src={news.image_url} alt={news.title} className="w-full h-32 object-cover rounded-sm" />
                          <h3 className="text-[16px] font-bold text-gray-900 group-hover:text-red-700 leading-snug">{news.title}</h3>
                       </a>
                     ))}
                  </div>
               </div>

               {/* World Section */}
               <div className="border-t-[3px] border-black pt-2 bg-slate-50 px-4 pb-4">
                  <div className="mb-4 mt-2 flex justify-between items-center">
                     <h2 className="text-2xl font-bold text-gray-900">আন্তর্জাতিক <span className="text-red-600 font-sans">❯</span></h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                     {worldNews.slice(0,4).map(news => (
                       <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group bg-white p-2 border border-gray-200 flex flex-col gap-2">
                          <SafeImage src={news.image_url} alt={news.title} className="w-full h-28 object-cover rounded-sm" />
                          <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-red-700 leading-snug">{news.title}</h3>
                       </a>
                     ))}
                  </div>
               </div>

               {/* Education & Religion (2 Columns split) */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-t-[3px] border-black pt-2">
                     <h2 className="text-xl font-bold text-gray-900 mb-4">শিক্ষা <span className="text-red-600 font-sans">❯</span></h2>
                     <div className="grid grid-cols-2 gap-4">
                        {eduNews.slice(0,4).map(news => (
                          <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex flex-col gap-2">
                             <SafeImage src={news.image_url} alt={news.title} className="w-full h-24 object-cover rounded-sm" />
                             <h3 className="text-[14px] font-bold text-gray-800 group-hover:text-red-700 leading-snug line-clamp-3">{news.title}</h3>
                          </a>
                        ))}
                     </div>
                  </div>
                  <div className="border-t-[3px] border-black pt-2">
                     <h2 className="text-xl font-bold text-gray-900 mb-4">ধর্ম <span className="text-red-600 font-sans">❯</span></h2>
                     <div className="grid grid-cols-2 gap-4">
                        {religionNews.slice(0,4).map(news => (
                          <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex flex-col gap-2">
                             <SafeImage src={news.image_url} alt={news.title} className="w-full h-24 object-cover rounded-sm" />
                             <h3 className="text-[14px] font-bold text-gray-800 group-hover:text-red-700 leading-snug line-clamp-3">{news.title}</h3>
                          </a>
                        ))}
                     </div>
                  </div>
               </div>

            </div>

            {/* Bottom Horizon AdSense Block */}
            <div className="w-full bg-gray-50 border border-gray-100 flex flex-col items-center pt-1 pb-2 mt-4">
              <span className="text-[10px] text-gray-400 mb-1 font-sans">- বিজ্ঞাপন -</span>
              <div className="w-full overflow-hidden flex justify-center">
                <ins className="adsbygoogle"
                     style={{ display: "block", width: "100%" }}
                     data-ad-client="ca-pub-6625131155258287"
                     data-ad-slot="7589682146"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
                <script dangerouslySetInnerHTML={{ __html: '(window.adsbygoogle = window.adsbygoogle || []).push({});' }}></script>
              </div>
            </div>

          </>
        )}
      </main>

      <footer className="bg-[#1a1a1a] text-gray-300 mt-8 border-t-4 border-red-700 font-sans">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-4 font-serif">বঙ্গীয় <span className="text-red-600">টাইমস</span></h2>
              <p className="text-sm leading-relaxed text-gray-400">সত্য, সাহস ও বস্তুনিষ্ঠ সাংবাদিকতার এক অবিচল কণ্ঠস্বর। বাংলাদেশ ও সারা বিশ্বের সর্বশেষ সংবাদ সবার আগে পৌঁছে দিতে আমরা অঙ্গীকারবদ্ধ।</p>
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
          <div className="border-t border-gray-800 mt-6 pt-5 text-center text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
