import React from 'react';
import { createClient } from '@supabase/supabase-js';
import ClientTabs from './components/ClientTabs';
import SafeImage from './components/SafeImage';
import LocationFilter from './components/LocationFilter';
export const revalidate = 60;

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

  const { data: newsItems } = await query;
  const allNews = newsItems || [];

  // --- Hero Section Data ---
  const headerNews = allNews.slice(0, 3);
  const leadNews = allNews[3];            
  const subLeadGridNews = allNews.slice(4, 10); 
  const leftSideNews = allNews.slice(10, 17);   
  
  // --- Category Data Mapping (Live Fetch) ---
  const fetchDirectCategory = async (catName: string, amt: number) => {
    const { data } = await supabase
      .from('news')
      .select('*')
      .eq('category', catName)
      .order('created_at', { ascending: false })
      .limit(amt);
    return data || [];
  };

  const bdNews = await fetchDirectCategory('বাংলাদেশ', 8);
  const intlNews = await fetchDirectCategory('আন্তর্জাতিক', 7);
  const politicsNews = await fetchDirectCategory('রাজনীতি', 7); 
  const opinionNews = await fetchDirectCategory('মতামত', 5); 
  const sportsNews = await fetchDirectCategory('খেলাধুলা', 5); 
  const businessNews = await fetchDirectCategory('বাণিজ্য', 4); 
  const entertainmentNews = await fetchDirectCategory('বিনোদন', 7); 
  const lawNews = await fetchDirectCategory('আইন-আদালত', 7);
  const lifestyleNews = await fetchDirectCategory('জীবনযাপন', 4);
  const eduNews = await fetchDirectCategory('শিক্ষা', 4);
  const jobsNews = await fetchDirectCategory('চাকরি', 4);
  const techNews = await fetchDirectCategory('প্রযুক্তি', 4);
  const featureNews = await fetchDirectCategory('ফিচার', 4); 
  const hasyroshNews = await fetchDirectCategory('হাস্যরস', 4);
  const religionNews = await fetchDirectCategory('ধর্ম', 8);

  const menuCategories = ["সর্বশেষ", "বাংলাদেশ", "রাজনীতি", "আন্তর্জাতিক", "মতামত", "খেলাধুলা", "বাণিজ্য", "বিনোদন", "আইন-আদালত", "জীবনযাপন", "শিক্ষা", "চাকরি", "প্র প্রযুক্তি", "ফিচার", "হাস্যরস"];

  return (
    <div className="min-h-screen bg-white text-[#333] tracking-tight">
      
   {/* Header Section */}
      <header className="bg-white">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Mobile Date */}
          <div className="md:hidden text-center text-[13px] text-gray-500 w-full mb-[-5px] font-bold">
            {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
          </div>

          {/* লোগো, স্লোগান ও তারিখ সেকশন */}
          <div className="shrink-0 flex items-center md:gap-4">
             <a href="/" className="group flex flex-col justify-center">
               
               {/* কাস্টমাইজড লোগো সেকশন - প্রথম আলোর হুবহু স্টাইল */}
               <div className="flex items-end justify-center mt-2 md:mt-3">
                 
                 {/* প্রথম শব্দ: বঙ্গীয় */}
                 <span className="text-[38px] md:text-[48px] font-black text-[#111] leading-none tracking-tighter z-10 relative" style={{ textShadow: '2px 0 0 #fff' }}>
                   বঙ্গীয়
                 </span>

                 {/* মাঝখানের লাল বৃত্ত (সূর্য-ঘড়ি) */}
                 <div className="relative -mx-[2px] md:-mx-[4px] mb-[18px] md:mb-[22px] z-0">
                   <div className="w-[26px] h-[26px] md:w-[32px] md:h-[32px] bg-[#ef3324] rounded-full flex items-center justify-center relative">
                     
                     {/* সূর্যের ৫টি রশ্মি (Sun Rays) */}
                     <div className="absolute -top-[4px] md:-top-[5px] left-1/2 -translate-x-1/2 w-[2px] md:w-[2.5px] h-[4px] md:h-[5px] bg-[#ef3324] rounded-t-sm"></div>
                     <div className="absolute -top-[1px] md:-top-[2px] -right-[3px] md:-right-[4px] w-[2px] md:w-[2.5px] h-[4px] md:h-[5px] bg-[#ef3324] rotate-[45deg] rounded-t-sm"></div>
                     <div className="absolute -top-[1px] md:-top-[2px] -left-[3px] md:-left-[4px] w-[2px] md:w-[2.5px] h-[4px] md:h-[5px] bg-[#ef3324] rotate-[-45deg] rounded-t-sm"></div>
                     <div className="absolute top-[7px] md:top-[8px] -right-[4px] md:-right-[5px] w-[2px] md:w-[2.5px] h-[4px] md:h-[5px] bg-[#ef3324] rotate-[75deg] rounded-t-sm"></div>
                     <div className="absolute top-[7px] md:top-[8px] -left-[4px] md:-left-[5px] w-[2px] md:w-[2.5px] h-[4px] md:h-[5px] bg-[#ef3324] rotate-[-75deg] rounded-t-sm"></div>
                     
                     {/* ঘড়ির সাদা কাঁটা (White Clock Hands) */}
                     <div className="absolute w-[3px] md:w-[4px] h-[3px] md:h-[4px] bg-white rounded-full z-10"></div>
                     <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-[1.5px] md:w-[2px] h-[35%] bg-white origin-bottom animate-[spin_4s_linear_infinite] z-10"></div>
                     <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-[2px] md:w-[2.5px] h-[25%] bg-white origin-bottom rotate-[60deg] animate-[spin_24s_linear_infinite] z-10"></div>
                   </div>
                 </div>

                 {/* দ্বিতীয় শব্দ: টাইমস */}
                 <span className="text-[38px] md:text-[48px] font-black text-[#111] leading-none tracking-tighter z-10 relative" style={{ textShadow: '-2px 0 0 #fff' }}>
                   টাইমস
                 </span>

               </div>
               
               {/* স্লোগান (শুধুমাত্র পিসিতে দেখাবে) */}
               <span className="hidden md:block text-[14px] font-bold text-gray-600 tracking-wide mt-1 text-center">
                 সত্য ও সাহসের প্রতিচ্ছবি
               </span>
             </a>
             
             {/* তারিখ (প্রথম আলোর মতো দুই লাইনে, শুধুমাত্র পিসিতে দেখাবে) */}
             <div className="hidden md:flex flex-col border-l-[2px] border-gray-300 pl-4 ml-4 justify-center h-12 mt-1">
                <span className="text-[13.5px] text-gray-600 font-bold leading-tight">
                   {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long' }).format(new Date())}
                </span>
                <span className="text-[13.5px] text-gray-600 font-bold leading-tight mt-0.5">
                   {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
                </span>
             </div>
          </div>
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
          <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center h-12 relative overflow-hidden">
            
            {/* মেনু লিংকস */}
            <div className="flex-1 min-w-0 h-full flex items-center pr-4">
               <nav className="flex items-center gap-5 md:gap-6 lg:gap-7 overflow-x-auto text-[17px] lg:text-[19px] font-bold text-black w-full pb-1 custom-scrollbar tracking-wide">
                 <a href="/" className="h-12 flex items-center transition-colors hover:text-[#104f96] whitespace-nowrap shrink-0">প্রচ্ছদ</a>
                 {menuCategories.map((cat, index) => (
                   <a 
                     key={index} 
                     href={`/?category=${cat}`} 
                     className={`hover:text-[#104f96] whitespace-nowrap shrink-0 ${typeof activeCategory !== 'undefined' && activeCategory === cat ? 'text-[#104f96] border-b-[3px] border-[#104f96] h-12 flex items-center' : 'h-12 flex items-center transition-colors'}`}
                   >
                      {cat}
                   </a>
                 ))}
               </nav>
            </div>
            
            {/* প্রফেশনাল সার্চ অপশন */}
            <div className="hidden md:flex items-center border-l border-gray-200 pl-5 h-full shrink-0 bg-white z-10">
               <form action="/" method="GET" className="relative flex items-center group">
                  <input 
                     type="text" 
                     name="q" 
                     defaultValue={typeof searchQuery !== 'undefined' ? searchQuery : ''} 
                     placeholder="খবর খুঁজুন..." 
                     className="w-48 lg:w-64 pl-4 pr-10 py-1.5 bg-[#f4f7fc] border border-transparent focus:border-[#104f96] focus:bg-white text-[15px] rounded-full outline-none transition-all duration-300 placeholder-gray-500 font-normal text-gray-800 shadow-inner" 
                     required
                  />
                  <button type="submit" className="absolute right-3 text-gray-400 group-hover:text-[#104f96] focus:text-[#104f96] transition-colors flex items-center justify-center cursor-pointer">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                     </svg>
                  </button>
               </form>
            </div>
            
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-[1200px] mx-auto px-4 mt-6 pb-10">
        
        {activeCategory === 'বাংলাদেশ' && searchQuery ? (
            /* --- প্রথম আলোর মতো এলাকার খবরের সার্চ রেজাল্ট পেজ --- */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-3">
                  <h1 className="text-[32px] md:text-[36px] font-bold text-red-600 mb-6 border-b border-gray-200 pb-2">{searchQuery}</h1>
                  <div className="mb-6">
                     <h3 className="text-[18px] font-bold text-[#104f96] mb-4">আমার এলাকার খবর</h3>
                     <LocationFilter layout="vertical" />
                  </div>
               </div>
               
               <div className="lg:col-span-6">
                  {allNews.length === 0 ? (
                     <div className="text-gray-400 py-10 text-center font-bold">এই এলাকার কোনো খবর পাওয়া যায়নি।</div>
                  ) : (
                     <div className="flex flex-col gap-6">
                        {allNews.map(news => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex gap-4 border-b border-gray-200 pb-6 last:border-0">
                              <div className="flex-1">
                                 <h3 className="text-xl font-bold group-hover:text-[#104f96] leading-snug text-gray-900">{news.title}</h3>
                                 <p className="text-[14px] text-gray-600 mt-2 line-clamp-2">{news.snippet}</p>
                                 <p className="text-[13px] text-gray-500 mt-3">{formatDateTime(news.created_at)}</p>
                              </div>
                              <SafeImage src={news.image_url} alt={news.title} className="w-[120px] h-[90px] md:w-[200px] md:h-[130px] object-cover rounded-sm border border-gray-100 shrink-0" />
                           </a>
                        ))}
                     </div>
                  )}
               </div>
               
               {/* Google AdSense Space */}
               <div className="lg:col-span-3 hidden lg:block">
                  <div className="w-full min-h-[400px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-sm">
                     <span className="text-sm font-bold text-gray-400">বিজ্ঞাপন</span>
                  </div>
               </div>
            </div>
            
        ) : activeCategory === 'বাংলাদেশ' ? (
            /* --- বাংলাদেশ ক্যাটাগরির মূল পেজ --- */
            <div className="mb-10 border-b border-gray-300 pb-8">
               <div className="flex items-center mb-5 border-b-[2px] border-gray-200 pb-2">
                  <h2 className="text-[22px] font-bold text-gray-900">বাংলাদেশ</h2>
               </div>

               <div className="bg-[#f4f7fc] border border-[#e2e8f0] p-4 sm:p-5 rounded-sm mb-6">
                  <div className="flex items-center gap-2 mb-4">
                     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                     <h3 className="text-[18px] font-bold text-[#104f96]">আমার এলাকার খবর</h3>
                  </div>
                  <LocationFilter layout="horizontal" />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {bdNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-10 col-span-4">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <>
                        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                           {bdNews.slice(0, 6).map((news) => (
                              <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex flex-col">
                                 <div className="overflow-hidden mb-3">
                                    <SafeImage src={news.image_url} alt={news.title} className="w-full h-[150px] object-cover group-hover:scale-105 transition duration-300 border border-gray-100" />
                                 </div>
                                 <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-[#104f96] leading-snug">{news.title}</h3>
                                 <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                              </a>
                           ))}
                        </div>
                        <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200 pt-5 lg:pt-0 lg:pl-6 flex flex-col gap-5">
                           {bdNews.slice(6, 10).map((news) => (
                              <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block border-b border-gray-100 pb-4 last:border-0">
                                 <h3 className="text-[16px] font-bold text-gray-900 group-hover:text-[#104f96] leading-snug">{news.title}</h3>
                                 <p className="text-[13px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                              </a>
                           ))}
                        </div>
                     </>
                  )}
               </div>
            </div>
            
        ) : (activeCategory || searchQuery) ? (
            /* --- অন্যান্য সাধারণ সার্চ রেজাল্ট --- */
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                       {allNews.map(news => (
                          <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex gap-4 border-b border-gray-200 pb-4">
                             <div className="flex-1">
                                <h3 className="text-xl font-bold group-hover:text-[#104f96] leading-snug">{news.title}</h3>
                                <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                             </div>
                             <SafeImage src={news.image_url} alt={news.title} className="w-[100px] h-[75px] sm:w-[120px] sm:h-[80px] object-cover rounded-sm" />
                          </a>
                       ))}
                    </div>
                 )}
              </div>
              <div className="hidden md:block col-span-1">
                 {/* Google AdSense Space */}
                 <div className="w-full min-h-[600px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-sm sticky top-20">
                    <span className="text-sm font-bold text-gray-400">বিজ্ঞাপন</span>
                 </div>
              </div>
           </div>
        ) : (
          <>
            {/* Top Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-b border-gray-300 pb-6 mb-8">
              
              {/* বাম পাশের খবর (মোবাইলে ২য় পজিশনে, পিসিতে ১ম পজিশনে) */}
              <div className="order-2 lg:order-1 lg:col-span-3 flex flex-col divide-y divide-gray-200 lg:pr-4 border-b lg:border-b-0 pb-6 lg:pb-0 lg:border-r border-gray-300">
                {leftSideNews.map((news, idx) => (
                  <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group block ${idx !== 0 ? 'pt-3' : 'pb-3'}`}>
                    {idx === 0 && <p className="text-red-600 font-bold text-sm mb-1">{news.category} •</p>}
                    {idx === 0 && <SafeImage src={news.image_url} alt={news.title} className="w-full h-[200px] sm:h-[140px] object-cover mb-2 rounded-sm" />}
                    <h3 className={`font-bold text-[#1a1a1a] group-hover:text-blue-600 leading-snug ${idx === 0 ? 'text-2xl lg:text-[26px]' : 'text-lg lg:text-xl'}`}>{news.title}</h3>
                    <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                  </a>
                ))}
              </div>

              {/* লিড নিউজ বা বড় খবর (মোবাইলে ১ম পজিশনে, পিসিতে ২য় পজিশনে) */}
              <div className="order-1 lg:order-2 lg:col-span-6 lg:px-4 border-b lg:border-b-0 pb-6 lg:pb-0 lg:border-r border-gray-300">
                {leadNews && (
                  <a href={leadNews.is_custom ? `/news/${leadNews.id}` : leadNews.source_url} target="_blank" className="group block border-b border-gray-200 pb-4 mb-4">
                    <SafeImage src={leadNews.image_url} alt={leadNews.title} className="w-full h-[220px] sm:h-[320px] object-cover mb-3 rounded-sm" />
                    <h1 className="text-3xl lg:text-[34px] font-extrabold leading-tight text-[#1a1a1a] group-hover:text-blue-600">{leadNews.title}</h1>
                    <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(leadNews.created_at)}</p>
                  </a>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                  {subLeadGridNews.map((news, idx) => (
                    <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} 
                       className={`group flex gap-3 ${idx < 2 ? 'border-b border-gray-200 pb-4 mb-0' : 'pt-0'} ${idx % 2 === 0 ? 'sm:border-r border-gray-200 sm:pr-4' : 'sm:pl-4'}`}>
                       <div className="flex-1">
                          <h3 className="text-lg font-bold text-[#1a1a1a] group-hover:text-blue-600 leading-snug">{news.title}</h3>
                          <p className="text-[12px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                       </div>
                       <SafeImage src={news.image_url} alt={news.title} className="w-[80px] h-[55px] object-cover rounded-sm" />
                    </a>
                  ))}
                </div>
              </div>

              {/* ডানপাশের সেকশন (সর্বশেষ/জনপ্রিয় এবং বিজ্ঞাপন) */}
              <div className="order-3 lg:order-3 lg:col-span-3">
                 {/* Google AdSense Space */}
                 <div className="w-full min-h-[250px] bg-gray-50 border border-gray-200 flex flex-col justify-center items-center rounded-sm mb-6">
                    <span className="text-sm font-bold text-gray-400">বিজ্ঞাপন</span>
                 </div>
                 <ClientTabs latestList={allNews.slice(0, 5)} popularList={allNews.slice(5, 10)} />
              </div>
            </div>

            {/* বাংলাদেশ ক্যাটাগরি - প্রথম আলোর মতো লেআউট */}
            <div className="mb-10 border-b border-gray-300 pb-8">
               <div className="flex items-center mb-5 border-b-[2px] border-gray-200 pb-2">
                  <a href="/?category=বাংলাদেশ" className="text-[22px] font-bold text-gray-900 hover:text-[#104f96]">বাংলাদেশ</a>
               </div>

               {/* আমার এলাকার খবর - ফিল্টার (Prothom Alo Style) */}
               <div className="bg-[#f4f7fc] border border-[#e2e8f0] p-4 sm:p-5 rounded-sm mb-6">
                  <div className="flex items-center gap-2 mb-4">
                     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                     <h3 className="text-[18px] font-bold text-[#104f96]">আমার এলাকার খবর</h3>
                  </div>
                  <LocationFilter layout="horizontal" />
               </div>

               {/* নিউজ গ্রিড */}
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {bdNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-10 col-span-4">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <>
                        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                           {bdNews.slice(0, 6).map((news) => (
                              <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex flex-col">
                                 <div className="overflow-hidden mb-3">
                                    <SafeImage src={news.image_url} alt={news.title} className="w-full h-[150px] object-cover group-hover:scale-105 transition duration-300 border border-gray-100" />
                                 </div>
                                 <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-[#104f96] leading-snug">{news.title}</h3>
                                 <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                              </a>
                           ))}
                        </div>
                        <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200 pt-5 lg:pt-0 lg:pl-6 flex flex-col gap-5">
                           {bdNews.slice(6, 10).map((news) => (
                              <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block border-b border-gray-100 pb-4 last:border-0">
                                 <h3 className="text-[16px] font-bold text-gray-900 group-hover:text-[#104f96] leading-snug">{news.title}</h3>
                                 <p className="text-[13px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                              </a>
                           ))}
                        </div>
                     </>
                  )}
               </div>
            </div>

            {/* আন্তর্জাতিক ও আইন-আদালত (৭টি করে নিউজ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 mb-8 border-b border-gray-300 pb-8">
               {/* আন্তর্জাতিক */}
               <div className="bg-[#f4fdfa] p-4 sm:p-5 border-t-[4px] border-[#4bd396] rounded-sm min-h-[250px]">
                  <div className="mb-5 border-b border-[#bbf2d8] pb-2">
                     <a href="/?category=আন্তর্জাতিক" className="text-2xl font-extrabold text-[#2db97a] hover:text-[#188a56] tracking-tight">আন্তর্জাতিক <span className="text-[#4bd396] ml-1">❯</span></a>
                  </div>
                  
                  {intlNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-6">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                        <div className="col-span-1 border-b sm:border-b-0 sm:border-r border-[#bbf2d8] pb-5 sm:pb-0 sm:pr-4 flex flex-col">
                           {intlNews[0] && (
                              <a href={intlNews[0].is_custom ? `/news/${intlNews[0].id}` : intlNews[0].source_url} target="_blank" className="group block mb-4">
                                 <SafeImage src={intlNews[0].image_url} alt={intlNews[0].title} className="w-full h-[180px] sm:h-[140px] object-cover mb-3 sm:mb-2 rounded-sm" />
                                 <h3 className="text-xl lg:text-[22px] font-bold group-hover:text-[#2db97a] leading-snug">{intlNews[0].title}</h3>
                                 <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(intlNews[0].created_at)}</p>
                              </a>
                           )}
                           
                           <div className="mt-auto space-y-4 pt-3 border-t border-[#bbf2d8]">
                              {intlNews[1] && (
                                 <a href={intlNews[1].is_custom ? `/news/${intlNews[1].id}` : intlNews[1].source_url} target="_blank" className="group block">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#2db97a] leading-snug">
                                       <span className="text-[#2db97a] mr-1">■</span> {intlNews[1].title}
                                    </h3>
                                 </a>
                              )}
                              {intlNews[2] && (
                                 <a href={intlNews[2].is_custom ? `/news/${intlNews[2].id}` : intlNews[2].source_url} target="_blank" className="group block">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#2db97a] leading-snug">
                                       <span className="text-[#2db97a] mr-1">■</span> {intlNews[2].title}
                                    </h3>
                                 </a>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#bbf2d8]">
                           {intlNews.slice(3, 7).map((news, idx) => (
                              <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-base lg:text-[17px] font-bold group-hover:text-[#2db97a] leading-snug">{news.title}</h3>
                                    <p className="text-[12px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                                 </div>
                                 <SafeImage src={news.image_url} alt={news.title} className="w-[70px] h-[60px] object-cover rounded-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* আইন-আদালত */}
               <div className="bg-[#fcf5f5] p-4 sm:p-5 border-t-[4px] border-[#e85b5b] rounded-sm min-h-[250px]">
                  <div className="mb-5 border-b border-[#fbcbcb] pb-2">
                     <a href="/?category=আইন-আদালত" className="text-2xl font-extrabold text-[#d73f3f] hover:text-[#b02222] tracking-tight">আইন-আদালত <span className="text-[#e85b5b] ml-1">❯</span></a>
                  </div>
                  {lawNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-6">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                        <div className="col-span-1 border-b sm:border-b-0 sm:border-r border-[#fbcbcb] pb-5 sm:pb-0 sm:pr-4 flex flex-col">
                           {lawNews[0] && (
                              <a href={lawNews[0].is_custom ? `/news/${lawNews[0].id}` : lawNews[0].source_url} target="_blank" className="group block mb-4">
                                 <SafeImage src={lawNews[0].image_url} alt={lawNews[0].title} className="w-full h-[180px] sm:h-[140px] object-cover mb-3 sm:mb-2 rounded-sm" />
                                 <h3 className="text-xl lg:text-[22px] font-bold group-hover:text-[#d73f3f] leading-snug">{lawNews[0].title}</h3>
                                 <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(lawNews[0].created_at)}</p>
                              </a>
                           )}
                           <div className="mt-auto space-y-4 pt-3 border-t border-[#fbcbcb]">
                              {lawNews[1] && (
                                 <a href={lawNews[1].is_custom ? `/news/${lawNews[1].id}` : lawNews[1].source_url} target="_blank" className="group block">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#d73f3f] leading-snug">
                                       <span className="text-[#d73f3f] mr-1">■</span> {lawNews[1].title}
                                    </h3>
                                 </a>
                              )}
                              {lawNews[2] && (
                                 <a href={lawNews[2].is_custom ? `/news/${lawNews[2].id}` : lawNews[2].source_url} target="_blank" className="group block">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#d73f3f] leading-snug">
                                       <span className="text-[#d73f3f] mr-1">■</span> {lawNews[2].title}
                                    </h3>
                                 </a>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#fbcbcb]">
                           {lawNews.slice(3, 7).map((news, idx) => (
                              <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-base lg:text-[17px] font-bold group-hover:text-[#d73f3f] leading-snug">{news.title}</h3>
                                    <p className="text-[12px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                                 </div>
                                 <SafeImage src={news.image_url} alt={news.title} className="w-[70px] h-[60px] object-cover rounded-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* মতামত */}
            <div className="mb-8 border-b border-gray-300 pb-8 min-h-[300px]">
               <div className="border-t-[3px] border-black pt-2 mb-6">
                  <a href="/?category=মতামত" className="text-2xl font-extrabold hover:text-blue-600">মতামত <span className="text-red-600 ml-1">❯</span></a>
               </div>
               {opinionNews.length === 0 ? (
                  <div className="text-gray-400 text-center py-10">খবর আপডেট হচ্ছে...</div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6">
                     {opinionNews[0] && (
                     <div className="md:col-span-5 lg:col-span-4">
                        <a href={opinionNews[0].is_custom ? `/news/${opinionNews[0].id}` : opinionNews[0].source_url} target="_blank" className="group flex flex-col h-full border border-gray-300 p-4 sm:p-5 hover:shadow-sm transition">
                           <h3 className="text-xl lg:text-2xl font-bold leading-snug mb-3">
                              <span className="bg-[#11233f] text-[#fcd105] px-2 py-1 mr-2 text-[15px] inline-block mb-1">মতামত •</span>
                              <span className="group-hover:text-blue-600">{opinionNews[0].title}</span>
                           </h3>
                           <p className="text-[15px] text-gray-600 flex-1 line-clamp-4 mt-1">
                              {opinionNews[0].title} প্রসঙ্গে আরও বিস্তারিত পড়তে লিংকে ক্লিক করুন।
                           </p>
                           <p className="text-[14px] text-gray-800 mt-4 font-bold">{opinionNews[0].source_name || 'নিবন্ধকার'}</p>
                        </a>
                     </div>
                     )}
                     <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between divide-y divide-gray-200">
                        {opinionNews.slice(1, 5).map((news, idx) => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group flex gap-4 sm:gap-5 items-center ${idx === 0 ? 'pb-4' : 'py-4'} last:pb-0`}>
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#e6e6e6] flex items-center justify-center shrink-0">
                                 <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                              </div>
                              <div className="flex-1">
                                 <h3 className="text-lg lg:text-[19px] font-bold group-hover:text-blue-600 leading-snug">
                                    <span className="text-red-600 mr-1">মতামত •</span>{news.title}
                                 </h3>
                                 <p className="text-[13px] text-gray-500 mt-1">লেখা: {news.source_name || 'নিবন্ধকার'}</p>
                              </div>
                           </a>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            {/* জীবনযাপন */}
            <div className="mb-8 border-b border-gray-300 pb-8 min-h-[250px]">
               <div className="border-t-[3px] border-black pt-2 mb-6">
                  <a href="/?category=জীবনযাপন" className="text-2xl font-extrabold hover:text-blue-600">জীবনযাপন <span className="text-red-600 ml-1">❯</span></a>
               </div>
               {lifestyleNews.length === 0 ? (
                  <div className="text-gray-400 text-center py-10">খবর আপডেট হচ্ছে...</div>
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
                     {lifestyleNews.map((news) => (
                        <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block">
                           <SafeImage src={news.image_url} alt={news.title} className="w-full h-[200px] lg:h-[160px] object-cover mb-3 rounded-sm" />
                           <h3 className="text-[19px] lg:text-xl font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                           <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(news.created_at)}</p>
                        </a>
                     ))}
                  </div>
               )}
            </div>

            {/* বিনোদন ও রাজনীতি (৭টি করে নিউজ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 mb-8 border-b border-gray-300 pb-8">
               {/* বিনোদন */}
               <div className="bg-[#eef5fa] p-4 sm:p-5 border-t-[4px] border-[#5293c4] rounded-sm min-h-[250px]">
                  <div className="mb-5 border-b border-[#c8dceb] pb-2">
                     <a href="/?category=বিনোদন" className="text-2xl font-extrabold text-[#5293c4] hover:text-blue-600 tracking-tight">বিনোদন <span className="text-red-500 ml-1">❯</span></a>
                  </div>
                  {entertainmentNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-6">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                        <div className="col-span-1 border-b sm:border-b-0 sm:border-r border-[#c8dceb] pb-5 sm:pb-0 sm:pr-4 flex flex-col">
                           {entertainmentNews[0] && (
                              <a href={entertainmentNews[0].is_custom ? `/news/${entertainmentNews[0].id}` : entertainmentNews[0].source_url} target="_blank" className="group block mb-4">
                                 <SafeImage src={entertainmentNews[0].image_url} alt={entertainmentNews[0].title} className="w-full h-[180px] sm:h-[140px] object-cover mb-3 sm:mb-2 rounded-sm" />
                                 <h3 className="text-xl lg:text-[22px] font-bold group-hover:text-blue-600 leading-snug">{entertainmentNews[0].title}</h3>
                                 <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(entertainmentNews[0].created_at)}</p>
                              </a>
                           )}
                           <div className="mt-auto space-y-4 pt-3 border-t border-[#c8dceb]">
                              {entertainmentNews[1] && (
                                 <a href={entertainmentNews[1].is_custom ? `/news/${entertainmentNews[1].id}` : entertainmentNews[1].source_url} target="_blank" className="group block">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 leading-snug">
                                       <span className="text-[#5293c4] mr-1">■</span> {entertainmentNews[1].title}
                                    </h3>
                                 </a>
                              )}
                              {entertainmentNews[2] && (
                                 <a href={entertainmentNews[2].is_custom ? `/news/${entertainmentNews[2].id}` : entertainmentNews[2].source_url} target="_blank" className="group block">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 leading-snug">
                                       <span className="text-[#5293c4] mr-1">■</span> {entertainmentNews[2].title}
                                    </h3>
                                 </a>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#c8dceb]">
                           {entertainmentNews.slice(3, 7).map((news, idx) => (
                              <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-base lg:text-[17px] font-bold group-hover:text-blue-600 leading-snug">{news.title}</h3>
                                    <p className="text-[12px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                                 </div>
                                 <SafeImage src={news.image_url} alt={news.title} className="w-[70px] h-[60px] object-cover rounded-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* রাজনীতি */}
               <div className="bg-[#fcfaf5] p-4 sm:p-5 border-t-[4px] border-[#d4b072] rounded-sm min-h-[250px]">
                  <div className="mb-5 border-b border-[#e8dfce] pb-2">
                     <a href="/?category=রাজনীতি" className="text-2xl font-extrabold text-[#e05e3b] hover:text-[#d4b072] tracking-tight">রাজনীতি <span className="text-[#d4b072] ml-1">❯</span></a>
                  </div>
                  {politicsNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-6">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                        <div className="col-span-1 border-b sm:border-b-0 sm:border-r border-[#e8dfce] pb-5 sm:pb-0 sm:pr-4 flex flex-col">
                           {politicsNews[0] && (
                              <a href={politicsNews[0].is_custom ? `/news/${politicsNews[0].id}` : politicsNews[0].source_url} target="_blank" className="group block mb-4">
                                 <SafeImage src={politicsNews[0].image_url} alt={politicsNews[0].title} className="w-full h-[180px] sm:h-[140px] object-cover mb-3 sm:mb-2 rounded-sm" />
                                 <h3 className="text-xl lg:text-[22px] font-bold group-hover:text-[#e05e3b] leading-snug">{politicsNews[0].title}</h3>
                                 <p className="text-[13px] text-gray-500 mt-2">{formatDateTime(politicsNews[0].created_at)}</p>
                              </a>
                           )}
                           <div className="mt-auto space-y-4 pt-3 border-t border-[#e8dfce]">
                              {politicsNews[1] && (
                                 <a href={politicsNews[1].is_custom ? `/news/${politicsNews[1].id}` : politicsNews[1].source_url} target="_blank" className="group block">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#e05e3b] leading-snug">
                                       <span className="text-[#d4b072] mr-1">■</span> {politicsNews[1].title}
                                    </h3>
                                 </a>
                              )}
                              {politicsNews[2] && (
                                 <a href={politicsNews[2].is_custom ? `/news/${politicsNews[2].id}` : politicsNews[2].source_url} target="_blank" className="group block">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#e05e3b] leading-snug">
                                       <span className="text-[#d4b072] mr-1">■</span> {politicsNews[2].title}
                                    </h3>
                                 </a>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#e8dfce]">
                           {politicsNews.slice(3, 7).map((news, idx) => (
                              <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-base lg:text-[17px] font-bold group-hover:text-[#e05e3b] leading-snug">{news.title}</h3>
                                    <p className="text-[12px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                                 </div>
                                 <SafeImage src={news.image_url} alt={news.title} className="w-[70px] h-[60px] object-cover rounded-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* শিক্ষা, চাকরি, প্রযুক্তি, বাণিজ্য */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 lg:divide-x divide-gray-200 mb-8 border-b border-gray-300 pb-8">
               
               {/* শিক্ষা */}
               <div className="lg:pr-4 min-h-[200px]">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=শিক্ষা" className="text-2xl font-extrabold hover:text-blue-600">শিক্ষা <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {eduNews.length === 0 ? <div className="text-gray-400 py-4">খবর আপডেট হচ্ছে...</div> : (
                     <div className="flex flex-col gap-3">
                        {eduNews[0] && (
                           <a href={eduNews[0].is_custom ? `/news/${eduNews[0].id}` : eduNews[0].source_url} target="_blank" className="group block mb-2 border-b border-gray-200 pb-3">
                              <SafeImage src={eduNews[0].image_url} alt={eduNews[0].title} className="w-full h-[150px] sm:h-[130px] object-cover mb-3 rounded-sm" />
                              <h3 className="text-xl font-bold group-hover:text-blue-600 leading-snug">{eduNews[0].title}</h3>
                           </a>
                        )}
                        {eduNews.slice(1, 4).map(news => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block">
                              <h3 className="text-[17px] font-bold group-hover:text-blue-600 leading-snug">■ {news.title}</h3>
                           </a>
                        ))}
                     </div>
                  )}
               </div>

               {/* চাকরি */}
               <div className="lg:px-4 min-h-[200px]">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=চাকরি" className="text-2xl font-extrabold hover:text-blue-600">চাকরি <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {jobsNews.length === 0 ? <div className="text-gray-400 py-4">খবর আপডেট হচ্ছে...</div> : (
                     <div className="flex flex-col gap-3">
                        {jobsNews[0] && (
                           <a href={jobsNews[0].is_custom ? `/news/${jobsNews[0].id}` : jobsNews[0].source_url} target="_blank" className="group block mb-2 border-b border-gray-200 pb-3">
                              <SafeImage src={jobsNews[0].image_url} alt={jobsNews[0].title} className="w-full h-[150px] sm:h-[130px] object-cover mb-3 rounded-sm" />
                              <h3 className="text-xl font-bold group-hover:text-blue-600 leading-snug">{jobsNews[0].title}</h3>
                           </a>
                        )}
                        {jobsNews.slice(1, 4).map(news => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block">
                              <h3 className="text-[17px] font-bold group-hover:text-blue-600 leading-snug">■ {news.title}</h3>
                           </a>
                        ))}
                     </div>
                  )}
               </div>

               {/* প্রযুক্তি */}
               <div className="lg:px-4 min-h-[200px]">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=প্রযুক্তি" className="text-2xl font-extrabold hover:text-blue-600">প্রযুক্তি <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {techNews.length === 0 ? <div className="text-gray-400 py-4">খবর আপডেট হচ্ছে...</div> : (
                     <div className="flex flex-col gap-3">
                        {techNews[0] && (
                           <a href={techNews[0].is_custom ? `/news/${techNews[0].id}` : techNews[0].source_url} target="_blank" className="group block mb-2 border-b border-gray-200 pb-3">
                              <SafeImage src={techNews[0].image_url} alt={techNews[0].title} className="w-full h-[150px] sm:h-[130px] object-cover mb-3 rounded-sm" />
                              <h3 className="text-xl font-bold group-hover:text-blue-600 leading-snug">{techNews[0].title}</h3>
                           </a>
                        )}
                        {techNews.slice(1, 4).map(news => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block">
                              <h3 className="text-[17px] font-bold group-hover:text-blue-600 leading-snug">■ {news.title}</h3>
                           </a>
                        ))}
                     </div>
                  )}
               </div>

               {/* বাণিজ্য */}
               <div className="lg:pl-4 min-h-[200px]">
                  <div className="border-t-[3px] border-black pt-2 mb-5">
                     <a href="/?category=বাণিজ্য" className="text-2xl font-extrabold hover:text-blue-600">বাণিজ্য <span className="text-red-600 ml-1">❯</span></a>
                  </div>
                  {businessNews.length === 0 ? <div className="text-gray-400 py-4">খবর আপডেট হচ্ছে...</div> : (
                     <div className="flex flex-col gap-3">
                        {businessNews[0] && (
                           <a href={businessNews[0].is_custom ? `/news/${businessNews[0].id}` : businessNews[0].source_url} target="_blank" className="group block mb-2 border-b border-gray-200 pb-3">
                              <SafeImage src={businessNews[0].image_url} alt={businessNews[0].title} className="w-full h-[150px] sm:h-[130px] object-cover mb-3 rounded-sm" />
                              <h3 className="text-xl font-bold group-hover:text-blue-600 leading-snug">{businessNews[0].title}</h3>
                           </a>
                        )}
                        {businessNews.slice(1, 4).map(news => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group block">
                              <h3 className="text-[17px] font-bold group-hover:text-blue-600 leading-snug">■ {news.title}</h3>
                           </a>
                        ))}
                     </div>
                  )}
               </div>

            </div>

            {/* খেলাধুলা */}
            <div className="mb-8 bg-[#fff5f5] p-5 sm:p-6 rounded-md border border-[#fbd5d5] shadow-sm min-h-[350px]">
               <div className="border-b-[2px] border-red-600 pb-2 mb-6">
                  <a href="/?category=খেলাধুলা" className="text-2xl font-extrabold text-red-700 hover:text-red-500">খেলাধুলা <span className="text-red-500 ml-1">❯</span></a>
               </div>
               {sportsNews.length === 0 ? (
                  <div className="text-gray-400 text-center py-10">খবর আপডেট হচ্ছে...</div>
               ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                     <div className="flex flex-col gap-5 lg:col-span-1">
                        {sportsNews.slice(1, 3).map((news) => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex flex-col bg-white p-3 rounded shadow-sm border border-[#fca5a5] hover:border-red-500 transition">
                              <SafeImage src={news.image_url} alt={news.title} className="w-full h-[120px] object-cover mb-2 rounded-sm" />
                              <h3 className="text-[17px] font-bold group-hover:text-red-600 leading-snug">{news.title}</h3>
                           </a>
                        ))}
                     </div>
                     <div className="lg:col-span-2">
                        {sportsNews[0] && (
                           <a href={sportsNews[0].is_custom ? `/news/${sportsNews[0].id}` : sportsNews[0].source_url} target="_blank" className="group block h-full bg-white p-4 rounded shadow-sm border border-[#fca5a5] hover:border-red-500 transition relative">
                              <SafeImage src={sportsNews[0].image_url} alt={sportsNews[0].title} className="w-full h-[250px] sm:h-[320px] object-cover mb-4 rounded-sm" />
                              <h3 className="text-3xl lg:text-[32px] font-extrabold text-gray-900 group-hover:text-red-600 leading-tight">{sportsNews[0].title}</h3>
                              <p className="text-[14px] text-gray-600 mt-2">{formatDateTime(sportsNews[0].created_at)}</p>
                           </a>
                        )}
                     </div>
                     <div className="flex flex-col gap-5 lg:col-span-1">
                        {sportsNews.slice(3, 5).map((news) => (
                           <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="group flex flex-col bg-white p-3 rounded shadow-sm border border-[#fca5a5] hover:border-red-500 transition">
                              <SafeImage src={news.image_url} alt={news.title} className="w-full h-[120px] object-cover mb-2 rounded-sm" />
                              <h3 className="text-[17px] font-bold group-hover:text-red-600 leading-snug">{news.title}</h3>
                           </a>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            {/* হাস্যরস & ফিচার */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4 border-b border-gray-300 pb-8">
               {/* হাস্যরস */}
               <div className="border border-[#c1dff0] bg-white rounded-sm overflow-hidden min-h-[300px]">
                  <div className="bg-[#eef6fc] px-4 py-3 flex items-center border-b border-[#c1dff0]">
                     <a href="/?category=হাস্যরস" className="text-[26px] font-black text-[#006699] hover:text-blue-800">হাস্য<span className="text-red-500">+</span>রস</a>
                  </div>
                  {hasyroshNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-20">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:border-r border-[#c1dff0] sm:pr-6">
                           {hasyroshNews[0] && (
                              <a href={hasyroshNews[0].is_custom ? `/news/${hasyroshNews[0].id}` : hasyroshNews[0].source_url} target="_blank" className="group block">
                                 <SafeImage src={hasyroshNews[0].image_url} alt={hasyroshNews[0].title} className="w-full h-[200px] object-cover mb-3 rounded-sm shadow-sm" />
                                 <h3 className="text-2xl font-bold text-gray-800 group-hover:text-[#006699] leading-snug">{hasyroshNews[0].title}</h3>
                                 <p className="text-[14px] text-gray-500 mt-2">{formatDateTime(hasyroshNews[0].created_at)}</p>
                              </a>
                           )}
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#c1dff0] justify-center">
                           {hasyroshNews.slice(1, 4).map((news, idx) => (
                              <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group flex items-center justify-between gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1 pr-2">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#006699] leading-snug">{news.title}</h3>
                                 </div>
                                 <SafeImage src={news.image_url} alt={news.title} className="w-[80px] h-[60px] object-cover rounded-sm shadow-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* ফিচার */}
               <div className="border border-[#e8dfce] bg-[#fdfaf5] rounded-sm overflow-hidden min-h-[300px]">
                  <div className="flex justify-start items-center py-4 px-4 border-b-2 border-[#d4b072]">
                     <a href="/?category=ফিচার" className="text-[26px] font-bold text-[#966b22] tracking-wider hover:text-yellow-700">ফিচার</a>
                  </div>
                  {featureNews.length === 0 ? (
                     <div className="text-gray-400 text-center py-20">খবর আপডেট হচ্ছে...</div>
                  ) : (
                     <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:border-r border-[#e8dfce] sm:pr-6">
                           {featureNews[0] && (
                              <a href={featureNews[0].is_custom ? `/news/${featureNews[0].id}` : featureNews[0].source_url} target="_blank" className="group block">
                                 <SafeImage src={featureNews[0].image_url} alt={featureNews[0].title} className="w-full h-[200px] object-cover mb-3 rounded-sm shadow-sm" />
                                 <h3 className="text-2xl font-bold text-gray-900 group-hover:text-[#966b22] leading-snug">{featureNews[0].title}</h3>
                                 <p className="text-[14px] text-gray-500 mt-2 line-clamp-2">ফিচারের বিশেষ আয়োজন সম্পর্কে বিস্তারিত পড়তে ক্লিক করুন।</p>
                              </a>
                           )}
                        </div>
                        <div className="flex flex-col gap-4 divide-y divide-[#e8dfce] justify-center">
                           {featureNews.slice(1, 4).map((news, idx) => (
                              <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className={`group flex gap-3 ${idx !== 0 ? 'pt-4' : ''}`}>
                                 <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#966b22] leading-snug">{news.title}</h3>
                                    <p className="text-[12px] text-gray-500 mt-1">{formatDateTime(news.created_at)}</p>
                                 </div>
                                 <SafeImage src={news.image_url} alt={news.title} className="w-[70px] h-[70px] object-cover rounded-sm shadow-sm shrink-0" />
                              </a>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* ধর্ম (bdnews24 Slider Style) */}
            <div className="mb-6 pt-4">
               <div className="flex items-center justify-between border-b border-gray-200 mb-6">
                  <h2 className="text-2xl font-extrabold text-[#1a1a1a] border-b-[3px] border-red-600 pb-1 -mb-[2px]">ধর্ম</h2>
                  <a href="/?category=ধর্ম" className="text-[14px] text-gray-500 hover:text-red-600 font-bold">সব খবর ❯</a>
               </div>
               
               {religionNews.length === 0 ? (
                  <div className="text-gray-400 text-center py-10">খবর আপডেট হচ্ছে...</div>
               ) : (
                  <div className="flex overflow-x-auto gap-5 pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
                     {religionNews.map((news) => (
                        <a href={news.is_custom ? `/news/${news.id}` : news.source_url} target="_blank" key={news.id} className="min-w-[240px] md:min-w-[280px] w-[240px] md:w-[280px] snap-start group shrink-0 block">
                           <div className="overflow-hidden rounded-sm mb-3">
                              <SafeImage src={news.image_url} alt={news.title} className="w-full h-[150px] md:h-[160px] object-cover transform group-hover:scale-105 transition duration-500 ease-in-out" />
                           </div>
                           <h3 className="text-[19px] font-bold text-gray-900 group-hover:text-red-600 leading-snug">{news.title}</h3>
                        </a>
                     ))}
                  </div>
               )}
            </div>

          </>
        )}
      </main>

          {/* Footer Section */}
      <footer className="bg-white border-t-4 border-red-700 mt-12 pt-8 pb-6 text-black text-center shadow-inner">
        <div className="max-w-[1200px] mx-auto px-4">
          
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5 text-[15px] md:text-[17px] font-bold mb-6 border-b border-gray-300 pb-4">
             <a href="/" className="hover:text-red-700 transition">প্রচ্ছদ</a> <span className="text-gray-300">|</span>
             <a href="/privacy" className="hover:text-red-700 transition">গোপনীয়তার নীতি</a> <span className="text-gray-300">|</span>
             <a href="/terms" className="hover:text-red-700 transition">শর্তাবলি</a> <span className="text-gray-300">|</span>
             <a href="/contact" className="hover:text-red-700 transition text-[#104f96]">বিজ্ঞাপন</a> <span className="text-gray-300">|</span>
             <a href="/contact" className="hover:text-red-700 transition">যোগাযোগ</a>
          </div>

          <div className="mb-6">
             <p className="text-[17px] md:text-[18px] font-bold text-gray-900 leading-snug">
               <span className="block md:inline">সম্পাদক ও প্রকাশক :</span> 
               <span className="block md:inline md:ml-1">অ্যাডভোকেট মো: আজাদুর রহমান</span>
             </p>
             <div className="text-[14px] md:text-[15px] text-gray-700 font-bold mt-3 flex flex-col md:flex-row justify-center items-center gap-1.5 md:gap-3">
               <span>মোবাইল: <a href="tel:09696790279" className="text-red-700 hover:underline">০৯৬৯৬ ৭৯০২৭৯</a></span> 
               <span className="hidden md:inline text-gray-300">|</span> 
               <span>ইমেইল: <a href="mailto:bongiyotimes@gmail.com" className="hover:underline text-[#104f96]">bongiyotimes@gmail.com</a></span>
             </div>
          </div>

          <div className="border-t border-gray-300 pt-5">
             <p className="text-[13px] md:text-[15px] leading-relaxed text-gray-800 font-medium max-w-4xl mx-auto mb-3">
               বাংলাদেশ ও বিশ্বের সকল খবর, ব্রেকিং নিউজ, লাইভ নিউজ, রাজনীতি, বাণিজ্য, খেলা, বিনোদনসহ সকল সর্বশেষ সংবাদ সবার আগে পড়তে ক্লিক করুন বঙ্গীয় টাইমস ডট কম।
             </p>
             <p className="text-[13px] md:text-[14px] text-gray-500 font-bold">&copy; {new Date().getFullYear()} বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
          </div>
          
        </div>
      </footer>
    </div>
  );
}
