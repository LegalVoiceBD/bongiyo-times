import React from 'react';
import { createClient } from '@supabase/supabase-js';
import ClientTabs from './components/ClientTabs';
import SafeImage from './components/SafeImage';

export const revalidate = 0;

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 60) return `${diffMins} মিনিট আগে`;
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
  
  return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
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
  
  const hasKeywords = (text: string, words: string[]) => words.some(w => text.includes(w));
  const sportsWords = ['বিশ্বকাপ', 'ম্যাচ', 'ফুটবল', 'ক্রিকেট', 'রোনালদো', 'মেসি', 'ফিফা', 'উয়েফা', 'গোল', 'উইকেট', 'ইয়ামাল', 'স্পেন', 'ব্রাজিল', 'আর্জেন্টিনা', 'টি-টোয়েন্টি'];
  const intlWords = ['রাশিয়া', 'ইউক্রেন', 'পুতিন', 'বাইডেন', 'ট্রাম্প', 'গাজা', 'ইসরায়েল', 'হামাস', 'যুক্তরাষ্ট্র', 'চীন', 'ফ্রান্স'];
  const generalGarbage = ['এইচএসসি', 'পরীক্ষা', 'ফলাফল', 'নিহত', 'গ্রেপ্তার', 'আদালত'];

  // Data mapping for blocks
  const headerNews = allNews.slice(0, 3);
  const leadNews = allNews[3];
  const subLeadNews = allNews.slice(4, 6);
  const leftSideNews = allNews.slice(6, 9);
  const nationalNews = allNews.filter(n => (n.category === 'বাংলাদেশ' || n.category === 'জাতীয়' || n.category === 'সারাদেশ') && !hasKeywords(n.title, sportsWords) && !hasKeywords(n.title, intlWords)).slice(0, 5);
  const worldNews = allNews.filter(n => n.category === 'আন্তর্জাতিক' || n.category === 'বিশ্ব').slice(0, 4);
  const entertainmentNews = allNews.filter(n => n.category === 'বিনোদন').slice(0, 5);
  const techNews = allNews.filter(n => n.category === 'প্রযুক্তি').slice(0, 4);
  const businessNews = allNews.filter(n => n.category === 'বাণিজ্য').slice(0, 4);
  const lawNews = allNews.filter(n => n.category === 'আইন-আদালত').slice(0, 5);
  const religionNews = allNews.filter(n => n.category === 'ধর্ম' && !hasKeywords(n.title, sportsWords) && !hasKeywords(n.title, intlWords) && !hasKeywords(n.title, generalGarbage)).slice(0, 4);
  const sportsNews = allNews.filter(n => n.category === 'খেলাধুলা').slice(0, 5);
  const eduNews = allNews.filter(n => n.category === 'শিক্ষা' || n.title.includes('শিক্ষা')).slice(0, 4);

  const opinionNews = [
    { id: 1, title: 'প্রধানমন্ত্রীর প্রতি এক উদ্বিগ্ন নাগরিকের খোলা চিঠি', author: 'ড. সালেহ উদ্দিন', image_url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=200' },
    { id: 2, title: 'বিশ্বকাপে বর্ণবাদ ও নৈরাশ্যের ছায়া', author: 'মো: আজাদুর রহমান', image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=200' }
  ];

  const menuCategories = ["সর্বশেষ", "বাংলাদেশ", "রাজনীতি", "আন্তর্জাতিক", "খেলাধুলা", "বাণিজ্য", "বিনোদন", "আইন-আদালত", "শিক্ষা", "প্রযুক্তি", "ধর্ম"];

  return (
    <div className="min-h-screen bg-white text-[#333] tracking-tight">
      {/* Import Kalpurush Font */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.maateen.me/kalpurush/font.css');
        body { font-family: 'Kalpurush', Arial, sans-serif !important; }
        .border-split { border-right: 1px solid #e5e7eb; }
        .border-split:last-child { border-right: none; }
      `}} />

      <header className="bg-white">
        {/* Top Header Section (Logo + 3 News) */}
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="shrink-0 flex items-center">
             <h1 className="text-4xl font-bold text-black flex items-center gap-1">
                বঙ্গীয় <span className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl mt-1 shadow-sm">টা</span> ইমস
             </h1>
          </a>
          
          <div className="hidden lg:flex divide-x divide-gray-300">
             {headerNews.map((news, index) => (
                <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={index} className="flex gap-3 px-4 w-[250px] group">
                   <div className="flex-1">
                      <p className="text-xs text-red-600 mb-1">■ {news.category}</p>
                      <h3 className="text-[15px] leading-tight font-semibold group-hover:text-blue-600 line-clamp-2">{news.title}</h3>
                   </div>
                   <SafeImage src={news.image_url} alt={news.title} className="w-16 h-16 object-cover border border-gray-100" />
                </a>
             ))}
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="border-t border-b border-gray-300 sticky top-0 z-50 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center h-12">
            <nav className="flex items-center gap-5 overflow-x-auto scrollbar-hide text-[16px] font-bold text-black">
              {menuCategories.map((cat, index) => (
                <a key={index} href={`/?category=${cat}`} className={`hover:text-blue-600 whitespace-nowrap ${activeCategory === cat ? 'text-blue-600 border-b-[3px] border-blue-600 h-12 flex items-center' : 'h-12 flex items-center'}`}>
                   {cat}
                </a>
              ))}
            </nav>
            
            {/* Right Side Nav Items */}
            <div className="hidden md:flex items-center gap-4 border-l border-gray-300 pl-4 h-full text-[15px] font-bold">
               <button className="hover:text-blue-600 flex items-center gap-1"><span className="text-lg">🔍</span> খুঁজুন</button>
               <button className="hover:text-blue-600 flex items-center gap-1"><span className="text-lg">📰</span> ই-পেপার</button>
               <div className="bg-red-50 text-red-800 px-2 py-0.5 border border-red-100 text-sm">Eng</div>
               <button className="hover:text-blue-600 flex items-center gap-1"><span className="text-lg">👤</span> Login</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-[1200px] mx-auto px-4 mt-6 pb-10">
        
        {/* Banner Ad Space */}
        <div className="w-full max-w-[970px] mx-auto h-[90px] bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm mb-6">
           <span>পাকিস্তান আন্দোলন - আলতাফ পারভেজ (Banner Ad 970x90)</span>
        </div>

        {(activeCategory || searchQuery) ? (
            /* Category / Search Results View */
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-1 md:col-span-3">
                 <div className="border-b-[3px] border-black mb-4 pb-1">
                    <h2 className="text-[22px] font-bold flex items-center gap-2">
                       {searchQuery ? `"${searchQuery}" এর সার্চ রেজাল্ট` : activeCategory}
                    </h2>
                 </div>
                 {allNews.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 font-bold text-lg">কোনো খবর পাওয়া যায়নি।</div>
                 ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                         {allNews.map(news => (
                            <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex gap-4 border-b border-gray-200 pb-4">
                               <div className="flex-1">
                                  <h3 className="text-[18px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                                  <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                               </div>
                               <SafeImage src={news.image_url} alt={news.title} className="w-[120px] h-[80px] object-cover" />
                            </a>
                         ))}
                      </div>
                      {totalPages > 1 && (
                         <div className="flex justify-center items-center gap-2 mt-10">
                            {currentPage > 1 && <a href={`/?${searchQuery ? `q=${searchQuery}` : `category=${activeCategory}`}&page=${currentPage - 1}`} className="border border-gray-300 px-4 py-1 hover:bg-gray-50 transition">« আগের পাতা</a>}
                            <span className="bg-blue-600 text-white px-4 py-1">{currentPage}</span>
                            {currentPage < totalPages && <a href={`/?${searchQuery ? `q=${searchQuery}` : `category=${activeCategory}`}&page=${currentPage + 1}`} className="border border-gray-300 px-4 py-1 hover:bg-gray-50 transition">পরের পাতা »</a>}
                         </div>
                      )}
                    </>
                 )}
              </div>
              <div className="hidden md:block col-span-1">
                 <div className="w-[300px] h-[600px] bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm sticky top-20">
                    <span>Sidebar Ad (300x600)</span>
                 </div>
              </div>
           </div>
        ) : (
          /* Homepage View (Prothom Alo Layout) */
          <>
            {/* Top Row - 3 Columns Layout */}
            {leadNews && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-b border-gray-300 pb-6 mb-6">
                
                {/* Left Column */}
                <div className="lg:col-span-3 flex flex-col divide-y divide-gray-200 pr-4 lg:border-r border-gray-300">
                  {leftSideNews.map((news, idx) => (
                    <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group block ${idx !== 0 ? 'pt-3' : 'pb-3'}`}>
                      {idx === 0 && <p className="text-red-600 font-bold text-[15px] mb-1">{news.category} •</p>}
                      {idx === 0 && <SafeImage src={news.image_url} alt={news.title} className="w-full h-[140px] object-cover mb-2" />}
                      <h3 className={`font-bold text-[#1a1a1a] group-hover:text-blue-600 leading-snug ${idx === 0 ? 'text-[20px]' : 'text-[17px]'}`}>{news.title}</h3>
                      <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                    </a>
                  ))}
                </div>

                {/* Center Column (Lead News) */}
                <div className="lg:col-span-6 pr-4 lg:border-r border-gray-300">
                  <a href={leadNews.is_custom ? `/news/${leadNews.id}` : leadNews.source_url} target="_blank" className="group block border-b border-gray-300 pb-4 mb-4">
                    <SafeImage src={leadNews.image_url} alt={leadNews.title} className="w-full h-[320px] object-cover mb-3" />
                    <h1 className="text-[28px] font-bold leading-tight text-[#1a1a1a] group-hover:text-blue-600">{leadNews.title}</h1>
                    <p className="text-[15px] text-gray-600 mt-2 line-clamp-2">বিস্তারিত জানতে ক্লিক করুন। {leadNews.source_name} থেকে সংগৃহীত।</p>
                    <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(leadNews.created_at)}</p>
                  </a>
                  <div className="grid grid-cols-2 gap-4 divide-x divide-gray-300">
                    {subLeadNews.map((news, idx) => (
                      <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group block ${idx !== 0 ? 'pl-4' : ''}`}>
                         <h3 className="text-[17px] font-bold text-[#1a1a1a] group-hover:text-blue-600 leading-snug">{news.title}</h3>
                         <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Right Column (Sidebar Tabs & Ad) */}
                <div className="lg:col-span-3">
                   {/* Sidebar Ad 300x250 */}
                   <div className="w-full h-[250px] bg-gray-100 border border-gray-200 flex flex-col justify-center items-center text-gray-400 mb-6">
                      <span className="text-xs">বিজ্ঞাপন</span>
                      <span className="text-lg text-black mt-2 font-bold text-center px-4">KONKA ফ্রিজ<br/>১৪০টিরও বেশি দেশে</span>
                   </div>
                   {/* Custom Client Tabs (Latest/Popular) */}
                   <ClientTabs latestList={allNews.slice(0, 5)} popularList={allNews.slice(5, 10)} />
                </div>
              </div>
            )}

            {/* In-Article Ad */}
            <div className="w-full h-[90px] bg-gray-100 border border-gray-200 flex flex-col justify-center items-center text-gray-400 mb-8">
               <span className="text-xs">বিজ্ঞাপন</span>
            </div>

            {/* Category Blocks Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 border-b border-gray-300 pb-8">
               
               {/* Left Block (col-8) */}
               <div className="lg:col-span-8">
                  {/* বাংলাদেশ ক্যাটেগরি */}
                  <div className="border-t-[3px] border-black pt-2 mb-4 flex justify-between items-center">
                     <a href="/?category=বাংলাদেশ" className="text-[20px] font-bold hover:text-blue-600">বাংলাদেশ <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-x divide-gray-200">
                     {/* 1st Col of BD */}
                     <div className="flex flex-col gap-4">
                        {nationalNews[0] && (
                           <a href={nationalNews[0].is_custom ? `/news/${nationalNews[0].id}` : nationalNews[0].source_url} target="_blank" className="group block border-b border-gray-200 pb-4">
                              <SafeImage src={nationalNews[0].image_url} alt={nationalNews[0].title} className="w-full h-[200px] object-cover mb-2" />
                              <h3 className="text-[22px] font-bold group-hover:text-blue-600 leading-snug">{nationalNews[0].title}</h3>
                           </a>
                        )}
                        {nationalNews.slice(1, 3).map(news => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block border-b border-gray-200 pb-3 last:border-0">
                              <h3 className="text-[17px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                           </a>
                        ))}
                     </div>
                     
                     {/* 2nd Col of BD */}
                     <div className="pl-6 flex flex-col gap-4">
                        {nationalNews.slice(3, 6).map(news => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex gap-3 border-b border-gray-200 pb-4">
                              <div className="flex-1">
                                 <h3 className="text-[16px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                                 <p className="text-[12px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                              </div>
                              <SafeImage src={news.image_url} alt={news.title} className="w-[100px] h-[70px] object-cover" />
                           </a>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Right Block (col-4) - মতামত */}
               <div className="lg:col-span-4 pl-4 lg:border-l border-gray-300">
                  <div className="border-t-[3px] border-black pt-2 mb-4 flex justify-between items-center">
                     <span className="text-[20px] font-bold">মতামত</span>
                  </div>
                  <div className="flex flex-col gap-4 divide-y divide-gray-200">
                     {opinionNews.map(opinion => (
                        <a key={opinion.id} href="#" className="group flex gap-3 pt-4 first:pt-0">
                           <div className="flex-1">
                              <p className="text-[13px] text-red-600 mb-1">{opinion.author}</p>
                              <h3 className="text-[17px] font-bold group-hover:text-blue-600 leading-snug">{opinion.title}</h3>
                           </div>
                           <img src={opinion.image_url} className="w-16 h-16 rounded-full object-cover border border-gray-200" />
                        </a>
                     ))}
                  </div>

                  {/* আইন আদালত */}
                  <div className="border-t-[3px] border-black pt-2 mb-4 mt-8 flex justify-between items-center">
                     <a href="/?category=আইন-আদালত" className="text-[20px] font-bold hover:text-blue-600">আইন-আদালত <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  <div className="flex flex-col gap-4 divide-y divide-gray-200">
                     {lawNews.slice(0,3).map(news => (
                        <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block pt-3 first:pt-0">
                           <h3 className="text-[16px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                        </a>
                     ))}
                  </div>
               </div>
            </div>

            {/* Entertainment & Tech Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 border-b border-gray-300 pb-8">
               {/* বিনোদন */}
               <div>
                  <div className="border-t-[3px] border-black pt-2 mb-4 flex justify-between items-center">
                     <a href="/?category=বিনোদন" className="text-[20px] font-bold hover:text-blue-600">বিনোদন <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  <div className="grid grid-cols-2 gap-4 divide-x divide-gray-200">
                     {entertainmentNews[0] && (
                        <a href={entertainmentNews[0].is_custom ? `/news/${entertainmentNews[0].id}` : entertainmentNews[0].source_url} target="_blank" className="group block">
                           <SafeImage src={entertainmentNews[0].image_url} alt={entertainmentNews[0].title} className="w-full h-[150px] object-cover mb-2" />
                           <h3 className="text-[18px] font-bold group-hover:text-blue-600 leading-snug">{entertainmentNews[0].title}</h3>
                        </a>
                     )}
                     <div className="pl-4 flex flex-col gap-4 divide-y divide-gray-200">
                        {entertainmentNews.slice(1, 4).map(news => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex gap-2 pt-3 first:pt-0">
                              <div className="flex-1">
                                 <h3 className="text-[15px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                              </div>
                              <SafeImage src={news.image_url} alt={news.title} className="w-[80px] h-[60px] object-cover" />
                           </a>
                        ))}
                     </div>
                  </div>
               </div>

               {/* প্রযুক্তি */}
               <div>
                  <div className="border-t-[3px] border-black pt-2 mb-4 flex justify-between items-center">
                     <a href="/?category=প্রযুক্তি" className="text-[20px] font-bold hover:text-blue-600">প্রযুক্তি <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  <div className="grid grid-cols-2 gap-4 divide-x divide-gray-200">
                     {techNews[0] && (
                        <a href={techNews[0].is_custom ? `/news/${techNews[0].id}` : techNews[0].source_url} target="_blank" className="group block">
                           <SafeImage src={techNews[0].image_url} alt={techNews[0].title} className="w-full h-[150px] object-cover mb-2" />
                           <h3 className="text-[18px] font-bold group-hover:text-blue-600 leading-snug">{techNews[0].title}</h3>
                        </a>
                     )}
                     <div className="pl-4 flex flex-col gap-4 divide-y divide-gray-200">
                        {techNews.slice(1, 4).map(news => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex gap-2 pt-3 first:pt-0">
                              <div className="flex-1">
                                 <h3 className="text-[15px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                              </div>
                              <SafeImage src={news.image_url} alt={news.title} className="w-[80px] h-[60px] object-cover" />
                           </a>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* 4 Column Bottom Blocks (World, Sports, Edu, Religion) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-x divide-gray-200">
               {/* আন্তর্জাতিক */}
               <div className="px-2">
                  <div className="border-t-[3px] border-black pt-2 mb-4">
                     <a href="/?category=আন্তর্জাতিক" className="text-[20px] font-bold hover:text-blue-600">আন্তর্জাতিক <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {worldNews[0] && (
                     <a href={worldNews[0].is_custom ? `/news/${worldNews[0].id}` : worldNews[0].source_url} target="_blank" className="group block mb-4 border-b border-gray-200 pb-3">
                        <SafeImage src={worldNews[0].image_url} alt={worldNews[0].title} className="w-full h-[120px] object-cover mb-2" />
                        <h3 className="text-[17px] font-bold group-hover:text-blue-600 leading-snug">{worldNews[0].title}</h3>
                     </a>
                  )}
                  <div className="flex flex-col gap-3 divide-y divide-gray-200">
                     {worldNews.slice(1, 4).map(news => (
                        <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block pt-3">
                           <h3 className="text-[15px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                        </a>
                     ))}
                  </div>
               </div>

               {/* খেলাধুলা */}
               <div className="pl-6 pr-2">
                  <div className="border-t-[3px] border-black pt-2 mb-4">
                     <a href="/?category=খেলাধুলা" className="text-[20px] font-bold hover:text-blue-600">খেলা <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {sportsNews[0] && (
                     <a href={sportsNews[0].is_custom ? `/news/${sportsNews[0].id}` : sportsNews[0].source_url} target="_blank" className="group block mb-4 border-b border-gray-200 pb-3">
                        <SafeImage src={sportsNews[0].image_url} alt={sportsNews[0].title} className="w-full h-[120px] object-cover mb-2" />
                        <h3 className="text-[17px] font-bold group-hover:text-blue-600 leading-snug">{sportsNews[0].title}</h3>
                     </a>
                  )}
                  <div className="flex flex-col gap-3 divide-y divide-gray-200">
                     {sportsNews.slice(1, 4).map(news => (
                        <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block pt-3">
                           <h3 className="text-[15px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                        </a>
                     ))}
                  </div>
               </div>

               {/* বাণিজ্য */}
               <div className="pl-6 pr-2">
                  <div className="border-t-[3px] border-black pt-2 mb-4">
                     <a href="/?category=বাণিজ্য" className="text-[20px] font-bold hover:text-blue-600">বাণিজ্য <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {businessNews[0] && (
                     <a href={businessNews[0].is_custom ? `/news/${businessNews[0].id}` : businessNews[0].source_url} target="_blank" className="group block mb-4 border-b border-gray-200 pb-3">
                        <SafeImage src={businessNews[0].image_url} alt={businessNews[0].title} className="w-full h-[120px] object-cover mb-2" />
                        <h3 className="text-[17px] font-bold group-hover:text-blue-600 leading-snug">{businessNews[0].title}</h3>
                     </a>
                  )}
                  <div className="flex flex-col gap-3 divide-y divide-gray-200">
                     {businessNews.slice(1, 4).map(news => (
                        <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block pt-3">
                           <h3 className="text-[15px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                        </a>
                     ))}
                  </div>
               </div>

               {/* ধর্ম */}
               <div className="pl-6">
                  <div className="border-t-[3px] border-black pt-2 mb-4">
                     <a href="/?category=ধর্ম" className="text-[20px] font-bold hover:text-blue-600">ধর্ম <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {religionNews[0] && (
                     <a href={religionNews[0].is_custom ? `/news/${religionNews[0].id}` : religionNews[0].source_url} target="_blank" className="group block mb-4 border-b border-gray-200 pb-3">
                        <SafeImage src={religionNews[0].image_url} alt={religionNews[0].title} className="w-full h-[120px] object-cover mb-2" />
                        <h3 className="text-[17px] font-bold group-hover:text-blue-600 leading-snug">{religionNews[0].title}</h3>
                     </a>
                  )}
                  <div className="flex flex-col gap-3 divide-y divide-gray-200">
                     {religionNews.slice(1, 4).map(news => (
                        <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block pt-3">
                           <h3 className="text-[15px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                        </a>
                     ))}
                  </div>
               </div>
            </div>

          </>
        )}
      </main>

      {/* Footer Design Matching Prothom Alo's clean style */}
      <footer className="bg-[#f2f2f2] border-t border-gray-300 mt-12 py-10">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-black mb-4">বঙ্গীয়<span className="text-red-600">টাইমস</span></h1>
          <div className="flex flex-wrap justify-center gap-4 text-[15px] font-bold text-gray-700 mb-6">
             <a href="#" className="hover:text-blue-600">আমাদের সম্পর্কে</a>
             <a href="#" className="hover:text-blue-600">যোগাযোগ</a>
             <a href="#" className="hover:text-blue-600">বিজ্ঞাপন</a>
             <a href="#" className="hover:text-blue-600">শর্তাবলি</a>
             <a href="#" className="hover:text-blue-600">গোপনীয়তা নীতি</a>
          </div>
          <p className="text-[14px] text-gray-600 mb-2">স্বত্ব © {new Date().getFullYear()} বঙ্গীয় টাইমস</p>
          <p className="text-[14px] text-gray-500">সম্পাদক ও প্রকাশক: <span className="font-bold">মো: আজাদুর রহমান</span></p>
        </div>
      </footer>
    </div>
  );
}
