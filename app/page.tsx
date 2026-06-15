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
  
  // Custom categories matching exact menu names
  const getCategoryNews = (catName: string, fallbackStartIndex: number, count: number) => {
     let catNews = allNews.filter(n => n.category === catName).slice(0, count);
     if (catNews.length < count) catNews = [...catNews, ...allNews.slice(fallbackStartIndex, fallbackStartIndex + (count - catNews.length))];
     return catNews;
  };

  const bdNews = getCategoryNews('বাংলাদেশ', 10, 4);
  const lifestyleNews = getCategoryNews('জীবনযাপন', 15, 4);
  const entertainmentNews = getCategoryNews('বিনোদন', 20, 3); 
  const politicsNews = getCategoryNews('রাজনীতি', 25, 3); 
  const eduNews = getCategoryNews('শিক্ষা', 30, 2);
  const jobsNews = getCategoryNews('চাকরি', 35, 2);
  const techNews = getCategoryNews('প্রযুক্তি', 40, 2);
  const businessNews = getCategoryNews('বাণিজ্য', 45, 2); 

  const menuCategories = ["সর্বশেষ", "বাংলাদেশ", "রাজনীতি", "আন্তর্জাতিক", "খেলাধুলা", "বাণিজ্য", "বিনোদন", "আইন-আদালত", "জীবনযাপন", "শিক্ষা", "চাকরি", "প্রযুক্তি"];

  return (
    <div className="min-h-screen bg-white text-[#333] tracking-tight">
      {/* Import Kalpurush Font */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.maateen.me/kalpurush/font.css');
        body { font-family: 'Kalpurush', Arial, sans-serif !important; }
      `}} />

      <header className="bg-white">
        {/* Top Header Section (Logo + 3 News) */}
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <a href="/" className="shrink-0 flex items-center">
             <h1 className="text-4xl font-bold text-black flex items-center gap-1">
                বঙ্গীয় <span className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl mt-1 shadow-sm">টা</span> ইমস
             </h1>
          </a>
          
          {/* Header News is hidden on small mobile screens to keep it clean, visible on large screens */}
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
        <div className="border-t border-b border-gray-300 sticky top-0 z-50 bg-white shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center h-12">
            <nav className="flex items-center gap-5 overflow-x-auto scrollbar-hide text-[16px] font-bold text-black flex-1">
              {menuCategories.map((cat, index) => (
                <a key={index} href={`/?category=${cat}`} className={`hover:text-blue-600 whitespace-nowrap ${activeCategory === cat ? 'text-blue-600 border-b-[3px] border-blue-600 h-12 flex items-center' : 'h-12 flex items-center transition-colors'}`}>
                   {cat}
                </a>
              ))}
            </nav>
            
            {/* Right Side Nav Items */}
            <div className="hidden md:flex items-center gap-4 border-l border-gray-300 pl-4 h-full text-[15px] font-bold">
               <form action="/" method="GET" className="flex items-center gap-2">
                  <input type="text" name="q" defaultValue={searchQuery} placeholder="খবর খুঁজুন..." className="border border-gray-300 px-2 py-1 text-sm rounded outline-none focus:border-blue-500 w-32 font-normal"/>
                  <button type="submit" className="hover:text-blue-600 flex items-center gap-1 cursor-pointer"><span className="text-lg">🔍</span> খুঁজুন</button>
               </form>
               <div className="border-l border-gray-300 h-6 mx-1"></div>
               <a href="https://www.bongiyotimes.com/bongiyo-secret-panel" className="hover:text-blue-600 flex items-center gap-1 transition-colors"><span className="text-lg">👤</span> Login</a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-[1200px] mx-auto px-4 mt-6 pb-10">
        
        {(activeCategory || searchQuery) ? (
            /* Category / Search Results View - 1 Col on Mobile, 2 Col on Small, 3 Col on Medium */
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
                      {/* Grid forced to 1 column on mobile, 2 columns on tablet(sm) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                         {allNews.map(news => (
                            <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex gap-4 border-b border-gray-200 pb-4">
                               <div className="flex-1">
                                  <h3 className="text-[18px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                                  <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                               </div>
                               <SafeImage src={news.image_url} alt={news.title} className="w-[100px] h-[75px] sm:w-[120px] sm:h-[80px] object-cover rounded-sm" />
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
          /* Homepage View */
          <>
            {/* Top Row - Mobile Friendly Stacking */}
            {leadNews && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-b border-gray-300 pb-6 mb-8">
                
                {/* Left News List - Vertical on all devices */}
                <div className="lg:col-span-3 flex flex-col divide-y divide-gray-200 lg:pr-4 border-b lg:border-b-0 pb-6 lg:pb-0 lg:border-r border-gray-300">
                  {leftSideNews.map((news, idx) => (
                    <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group block ${idx !== 0 ? 'pt-3' : 'pb-3'}`}>
                      {idx === 0 && <p className="text-red-600 font-bold text-[15px] mb-1">{news.category} •</p>}
                      {idx === 0 && <SafeImage src={news.image_url} alt={news.title} className="w-full h-[200px] sm:h-[140px] object-cover mb-2 rounded-sm" />}
                      <h3 className={`font-bold text-[#1a1a1a] group-hover:text-blue-600 leading-snug ${idx === 0 ? 'text-[22px] sm:text-[20px]' : 'text-[18px] sm:text-[17px]'}`}>{news.title}</h3>
                      <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                    </a>
                  ))}
                </div>

                {/* Center Lead News */}
                <div className="lg:col-span-6 lg:pr-4 border-b lg:border-b-0 pb-6 lg:pb-0 lg:border-r border-gray-300">
                  <a href={leadNews.is_custom ? `/news/${leadNews.id}` : leadNews.source_url} target="_blank" className="group block border-b border-gray-300 pb-4 mb-4">
                    <SafeImage src={leadNews.image_url} alt={leadNews.title} className="w-full h-[220px] sm:h-[320px] object-cover mb-3 rounded-sm" />
                    <h1 className="text-[26px] sm:text-[28px] font-bold leading-tight text-[#1a1a1a] group-hover:text-blue-600">{leadNews.title}</h1>
                    <p className="text-[15px] text-gray-600 mt-2 line-clamp-2">বিস্তারিত জানতে ক্লিক করুন। {leadNews.source_name} থেকে সংগৃহীত।</p>
                    <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(leadNews.created_at)}</p>
                  </a>
                  
                  {/* SubLeadNews - 1 Col on Mobile, 2 Col on Tablet/Desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
                    {subLeadNews.map((news, idx) => (
                      <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group block ${idx !== 0 ? 'pt-4 sm:pt-0 sm:pl-4' : ''}`}>
                         <h3 className="text-[18px] sm:text-[17px] font-bold text-[#1a1a1a] group-hover:text-blue-600 leading-snug">{news.title}</h3>
                         <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Right Area - Ad & Tabs */}
                <div className="lg:col-span-3">
                   <div className="w-full h-[250px] bg-gray-100 border border-gray-200 flex flex-col justify-center items-center text-gray-400 mb-6">
                      <span className="text-xs">বিজ্ঞাপন</span>
                      <span className="text-lg text-black mt-2 font-bold text-center px-4">KONKA ফ্রিজ<br/>১৪০টিরও বেশি দেশে</span>
                   </div>
                   <ClientTabs latestList={allNews.slice(0, 5)} popularList={allNews.slice(5, 10)} />
                </div>
              </div>
            )}

            {/* NEW LAYOUT 1: বাংলাদেশ */}
            <div className="mb-8 border-b border-gray-300 pb-8">
               <div className="border-t-[3px] border-black pt-2 mb-6">
                  <a href="/?category=বাংলাদেশ" className="text-[22px] font-bold hover:text-blue-600">বাংলাদেশ <span className="text-red-600 ml-1">❯</span></a>
               </div>

               {/* 1 Col Mobile, 2 Col Tablet+ */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6">
                  {/* Left Big Lead */}
                  {bdNews[0] && (
                     <a href={bdNews[0].is_custom ? `/news/${bdNews[0].id}` : bdNews[0].source_url} target="_blank" className="group block">
                        <SafeImage src={bdNews[0].image_url} alt={bdNews[0].title} className="w-full h-[220px] md:h-[300px] object-cover mb-3 rounded-sm" />
                        <h3 className="text-[22px] sm:text-[24px] font-bold group-hover:text-blue-600 leading-snug">{bdNews[0].title}</h3>
                        <p className="text-[15px] text-gray-600 mt-2 line-clamp-3">প্রতীকী ছবি হিসেবে খবরটির বিস্তারিত জানতে লিংকে ক্লিক করে সম্পূর্ণ সংবাদটি পড়ুন।</p>
                        <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(bdNews[0].created_at)}</p>
                     </a>
                  )}
                  {/* Right List - Ensure gap-y handles spacing instead of paddings */}
                  <div className="flex flex-col gap-5 divide-y divide-gray-200">
                     {bdNews.slice(1, 4).map((news, idx) => (
                        <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group flex gap-3 sm:gap-4 ${idx !== 0 ? 'pt-5' : ''}`}>
                           <div className="flex-1">
                              <h3 className="text-[17px] sm:text-[18px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                              <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                           </div>
                           <SafeImage src={news.image_url} alt={news.title} className="w-[110px] h-[80px] sm:w-[140px] sm:h-[90px] object-cover rounded-sm" />
                        </a>
                     ))}
                  </div>
               </div>
            </div>

            {/* NEW LAYOUT 2: জীবনযাপন */}
            <div className="mb-8 border-b border-gray-300 pb-8">
               <div className="border-t-[3px] border-black pt-2 mb-6">
                  <a href="/?category=জীবনযাপন" className="text-[22px] font-bold hover:text-blue-600">জীবনযাপন <span className="text-red-600 ml-1">❯</span></a>
               </div>
               {/* 1 Col Mobile, 2 Col Tablet, 4 Col Desktop. No complex borders to keep mobile completely clean */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                  {lifestyleNews.map((news, idx) => (
                     <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block">
                        <SafeImage src={news.image_url} alt={news.title} className="w-full h-[200px] lg:h-[160px] object-cover mb-3 rounded-sm" />
                        <h3 className="text-[18px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                        <p className="text-[15px] text-gray-600 mt-2 line-clamp-3">আপনার দৈনন্দিন জীবনের নানা বিষয়ে বিস্তারিত জানতে এই সংবাদটি পড়ুন। বিস্তারিত ভেতরে দেওয়া আছে।</p>
                        <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                     </a>
                  ))}
               </div>
            </div>

            {/* NEW LAYOUT 3: বিনোদন & রাজনীতি */}
            {/* 1 Col Mobile, 2 Col Tablet+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 mb-8 border-b border-gray-300 pb-8">
               
               {/* Left Box - বিনোদন */}
               <div className="bg-[#eef5fa] p-4 sm:p-5 border-t-[4px] border-[#5293c4] rounded-sm">
                  <div className="mb-5 border-b border-[#c8dceb] pb-2">
                     <a href="/?category=বিনোদন" className="text-[22px] font-extrabold text-[#5293c4] hover:text-blue-600 tracking-tight">বিনোদন <span className="text-red-500 ml-1">❯</span></a>
                  </div>
                  {/* 1 Col on Mobile (stacked), 2 Col on sm (side-by-side) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                     {entertainmentNews[0] && (
                        <a href={entertainmentNews[0].is_custom ? `/news/${entertainmentNews[0].id}` : entertainmentNews[0].source_url} target="_blank" className="group block col-span-1 border-b sm:border-b-0 sm:border-r border-[#c8dceb] pb-5 sm:pb-0 sm:pr-4">
                           <SafeImage src={entertainmentNews[0].image_url} alt={entertainmentNews[0].title} className="w-full h-[180px] sm:h-[140px] object-cover mb-3 sm:mb-2 rounded-sm" />
                           <h3 className="text-[18px] sm:text-[17px] font-bold group-hover:text-blue-600 leading-snug">{entertainmentNews[0].title}</h3>
                           <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(entertainmentNews[0].created_at)}</p>
                        </a>
                     )}
                     <div className="flex flex-col gap-4 divide-y divide-[#c8dceb]">
                        {entertainmentNews.slice(1, 3).map((news, idx) => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                              <div className="flex-1">
                                 <h3 className="text-[16px] sm:text-[15px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                                 <p className="text-[12px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                              </div>
                              <SafeImage src={news.image_url} alt={news.title} className="w-[70px] h-[60px] object-cover rounded-sm" />
                           </a>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Right Box - রাজনীতি */}
               <div className="bg-[#fcfaf5] p-4 sm:p-5 border-t-[4px] border-[#d4b072] rounded-sm">
                  <div className="mb-5 border-b border-[#e8dfce] pb-2">
                     <a href="/?category=রাজনীতি" className="text-[22px] font-extrabold text-[#e05e3b] hover:text-[#d4b072] tracking-tight">রাজনীতি <span className="text-[#d4b072] ml-1">❯</span></a>
                  </div>
                  {/* 1 Col on Mobile (stacked), 2 Col on sm (side-by-side) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                     {politicsNews[0] && (
                        <a href={politicsNews[0].is_custom ? `/news/${politicsNews[0].id}` : politicsNews[0].source_url} target="_blank" className="group block col-span-1 border-b sm:border-b-0 sm:border-r border-[#e8dfce] pb-5 sm:pb-0 sm:pr-4">
                           <SafeImage src={politicsNews[0].image_url} alt={politicsNews[0].title} className="w-full h-[180px] sm:h-[140px] object-cover mb-3 sm:mb-2 rounded-sm" />
                           <h3 className="text-[18px] sm:text-[17px] font-bold group-hover:text-[#e05e3b] leading-snug">{politicsNews[0].title}</h3>
                           <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(politicsNews[0].created_at)}</p>
                        </a>
                     )}
                     <div className="flex flex-col gap-4 divide-y divide-[#e8dfce]">
                        {politicsNews.slice(1, 3).map((news, idx) => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                              <div className="flex-1">
                                 <h3 className="text-[16px] sm:text-[15px] font-bold group-hover:text-[#e05e3b] leading-snug">{news.title}</h3>
                                 <p className="text-[12px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                              </div>
                              <SafeImage src={news.image_url} alt={news.title} className="w-[70px] h-[60px] object-cover rounded-sm" />
                           </a>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* NEW LAYOUT 4: শিক্ষা, চাকরি, প্রযুক্তি, বাণিজ্য */}
            {/* 1 Col Mobile, 2 Col Tablet, 4 Col Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 lg:divide-x divide-gray-200 mb-8 border-b border-gray-300 pb-8">
               
               {/* শিক্ষা */}
               <div className="lg:pr-4">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=শিক্ষা" className="text-[22px] font-bold hover:text-blue-600">শিক্ষা <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {eduNews[0] && (
                     <a href={eduNews[0].is_custom ? `/news/${eduNews[0].id}` : eduNews[0].source_url} target="_blank" className="group block mb-5 border-b border-gray-200 pb-4">
                        <SafeImage src={eduNews[0].image_url} alt={eduNews[0].title} className="w-full h-[200px] sm:h-[130px] object-cover mb-3 rounded-sm" />
                        <h3 className="text-[18px] font-bold group-hover:text-blue-600 leading-snug">{eduNews[0].title}</h3>
                        <p className="text-[14px] text-gray-600 mt-2 line-clamp-2">শিক্ষাবিষয়ক সর্বশেষ আপডেট জানতে ক্লিক করুন।</p>
                     </a>
                  )}
                  {eduNews[1] && (
                     <a href={eduNews[1].is_custom ? `/news/${eduNews[1].id}` : eduNews[1].source_url} target="_blank" className="group block">
                        <h3 className="text-[16px] sm:text-[15px] font-bold group-hover:text-blue-600 leading-snug">{eduNews[1].title}</h3>
                     </a>
                  )}
               </div>

               {/* চাকরি */}
               <div className="lg:px-4">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=চাকরি" className="text-[22px] font-bold hover:text-blue-600">চাকরি <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {jobsNews[0] && (
                     <a href={jobsNews[0].is_custom ? `/news/${jobsNews[0].id}` : jobsNews[0].source_url} target="_blank" className="group block mb-5 border-b border-gray-200 pb-4">
                        <SafeImage src={jobsNews[0].image_url} alt={jobsNews[0].title} className="w-full h-[200px] sm:h-[130px] object-cover mb-3 rounded-sm" />
                        <h3 className="text-[18px] font-bold group-hover:text-blue-600 leading-snug">{jobsNews[0].title}</h3>
                        <p className="text-[14px] text-gray-600 mt-2 line-clamp-2">ক্যারিয়ার ও চাকরির নতুন খবর জানতে ক্লিক করুন।</p>
                     </a>
                  )}
                  {jobsNews[1] && (
                     <a href={jobsNews[1].is_custom ? `/news/${jobsNews[1].id}` : jobsNews[1].source_url} target="_blank" className="group block">
                        <h3 className="text-[16px] sm:text-[15px] font-bold group-hover:text-blue-600 leading-snug">{jobsNews[1].title}</h3>
                     </a>
                  )}
               </div>

               {/* প্রযুক্তি */}
               <div className="lg:px-4">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=প্রযুক্তি" className="text-[22px] font-bold hover:text-blue-600">প্রযুক্তি <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {techNews[0] && (
                     <a href={techNews[0].is_custom ? `/news/${techNews[0].id}` : techNews[0].source_url} target="_blank" className="group block mb-5 border-b border-gray-200 pb-4">
                        <SafeImage src={techNews[0].image_url} alt={techNews[0].title} className="w-full h-[200px] sm:h-[130px] object-cover mb-3 rounded-sm" />
                        <h3 className="text-[18px] font-bold group-hover:text-blue-600 leading-snug">{techNews[0].title}</h3>
                        <p className="text-[14px] text-gray-600 mt-2 line-clamp-2">প্রযুক্তি বিশ্বের নতুন সব আপডেট ও চমকপ্রদ খবর।</p>
                     </a>
                  )}
                  {techNews[1] && (
                     <a href={techNews[1].is_custom ? `/news/${techNews[1].id}` : techNews[1].source_url} target="_blank" className="group block">
                        <h3 className="text-[16px] sm:text-[15px] font-bold group-hover:text-blue-600 leading-snug">{techNews[1].title}</h3>
                     </a>
                  )}
               </div>

               {/* বাণিজ্য */}
               <div className="lg:pl-4">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=বাণিজ্য" className="text-[22px] font-bold hover:text-blue-600">বাণিজ্য <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {businessNews[0] && (
                     <a href={businessNews[0].is_custom ? `/news/${businessNews[0].id}` : businessNews[0].source_url} target="_blank" className="group block mb-5 border-b border-gray-200 pb-4">
                        <SafeImage src={businessNews[0].image_url} alt={businessNews[0].title} className="w-full h-[200px] sm:h-[130px] object-cover mb-3 rounded-sm" />
                        <h3 className="text-[18px] font-bold group-hover:text-blue-600 leading-snug text-blue-600">{businessNews[0].title}</h3>
                        <p className="text-[14px] text-gray-600 mt-2 line-clamp-2">অর্থনীতি ও বাণিজ্য সম্পর্কিত সর্বশেষ খবর।</p>
                     </a>
                  )}
                  {businessNews[1] && (
                     <a href={businessNews[1].is_custom ? `/news/${businessNews[1].id}` : businessNews[1].source_url} target="_blank" className="group block">
                        <h3 className="text-[16px] sm:text-[15px] font-bold group-hover:text-blue-600 leading-snug">{businessNews[1].title}</h3>
                     </a>
                  )}
               </div>

            </div>

          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-gray-300 mt-12 border-t-4 border-red-700">
        <div className="max-w-[1200px] mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-4">বঙ্গীয় <span className="text-red-600">টাইমস</span></h2>
              <p className="text-sm leading-relaxed text-gray-400">সত্য, সাহস ও বস্তুনিষ্ঠ সাংবাদিকতার এক অবিচল কণ্ঠস্বর। বাংলাদেশ ও সারা বিশ্বের সর্বশেষ সংবাদ সবার আগে পৌঁছে দিতে আমরা অঙ্গীকারবদ্ধ।</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 inline-block">সম্পাদকীয় ও প্রকাশনা</h3>
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
