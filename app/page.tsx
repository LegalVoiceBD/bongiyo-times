import React from 'react';
import { createClient } from '@supabase/supabase-js';

// ওয়েবসাইট যেন প্রতিবার রিলোড দিলে নতুন খবর দেখায়, তার নির্দেশ
export const revalidate = 0;

export default async function Home() {
  // সুপাবেজ থেকে খবর টেনে আনার কোড
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  // ডাটাবেস থেকে শেষের ২০টি তাজা খবর আনা হচ্ছে
  const { data: newsItems } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  // যদি ডাটাবেস খালি থাকে
  if (!newsItems || newsItems.length === 0) {
    return <div className="text-center p-20 text-2xl font-bold">খবর লোড হচ্ছে... দয়া করে অপেক্ষা করুন।</div>;
  }

  // খবরগুলোকে সুন্দর করে সাজানোর জন্য ভাগ করা
  const leadNews = newsItems[0]; // সবচেয়ে উপরের বড় খবর
  const subNews = newsItems.slice(1, 3); // তার নিচের দুটি মাঝারি খবর
  const gridNews = newsItems.slice(3); // বাকি সব ছোট খবর

  const categories = ["সর্বশেষ", "বাংলাদেশ", "আন্তর্জাতিক", "খেলাধুলা", "বিনোদন", "বাণিজ্য", "প্রযুক্তি", "মতামত"];

  return (
    <div className="min-h-screen bg-gray-50 text-black pb-10">
      
      {/* ----------------- Header Section ----------------- */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-red-700 tracking-tight">
              বঙ্গীয় <span className="text-black">টাইমস</span>
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1 font-semibold">সত্য ও সাহসের প্রতিচ্ছবি</p>
          </div>
          
          <div className="mt-3 md:mt-0 flex items-center gap-4">
            <button className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-1.5 md:py-2 text-sm md:text-base font-bold rounded shadow-sm transition border border-gray-300">
              ই-পেপার
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="border-t border-gray-300">
          <div className="max-w-6xl mx-auto px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <nav className="flex items-center gap-4 md:gap-6 py-2 md:py-3 text-base md:text-lg font-bold text-gray-800">
              {categories.map((cat, index) => (
                <a key={index} href="#" className="hover:text-red-600 transition">
                  {cat}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ----------------- Main Content Section ----------------- */}
      <main className="max-w-6xl mx-auto px-0 md:px-4 mt-2 md:mt-6">
        <div className="bg-[#0b3d6e] text-white p-4 md:p-6 md:rounded-t-md">
          {/* Lead News Image and Title */}
          <a href={leadNews.source_url} target="_blank" rel="noopener noreferrer" className="cursor-pointer group block">
            <div className="text-center mb-3 md:mb-4 border-b border-blue-800 pb-2 md:pb-3 flex justify-center items-center gap-2">
               <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">{leadNews.source_name}</span>
               <h2 className="text-xl md:text-2xl font-bold">প্রধান খবর</h2>
            </div>
            <div className="overflow-hidden rounded shadow-lg">
              <img 
                src={leadNews.image_url} 
                alt={leadNews.title} 
                className="w-full h-[220px] md:h-[500px] object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <h2 className="text-2xl md:text-5xl font-bold mt-3 md:mt-4 leading-snug md:leading-tight group-hover:text-gray-300 transition">
              {leadNews.title}
            </h2>
            <p className="mt-3 text-gray-300 text-sm md:text-base line-clamp-2">{leadNews.snippet}</p>
          </a>

          {/* Sub Lead News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8 border-t border-blue-800 pt-4 md:pt-6">
            {subNews.map((news) => (
              <a href={news.source_url} target="_blank" rel="noopener noreferrer" key={news.id} className="cursor-pointer group flex flex-col">
                <div className="overflow-hidden rounded relative">
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded z-10">{news.source_name}</span>
                  <img 
                    src={news.image_url} 
                    alt={news.title} 
                    className="w-full h-[180px] md:h-[250px] object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mt-3 leading-snug group-hover:text-gray-300 transition">
                  {news.title}
                </h3>
              </a>
            ))}
          </div>
        </div>

        {/* Additional Newspaper Sections */}
        <div className="bg-white p-4 md:p-6 shadow-md md:rounded-b-md border border-t-0 border-gray-200 mt-0">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {gridNews.map((news) => (
                 <a href={news.source_url} target="_blank" rel="noopener noreferrer" key={news.id} className="flex gap-3 md:gap-4 items-start border-b border-gray-100 pb-3 md:pb-4 cursor-pointer group">
                    <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 overflow-hidden rounded border border-gray-200">
                       <img 
                         src={news.image_url} 
                         alt={news.title}
                         className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                       />
                    </div>
                    <div>
                      <span className="text-red-600 text-xs font-bold mb-1 block">{news.source_name}</span>
                      <h4 className="text-base md:text-lg font-bold text-gray-800 group-hover:text-red-600 transition line-clamp-3 leading-snug">
                        {news.title}
                      </h4>
                    </div>
                 </a>
              ))}
           </div>
        </div>
      </main>

      {/* ----------------- Footer Section ----------------- */}
      <footer className="max-w-6xl mx-auto px-4 mt-8 md:mt-12 mb-6 text-center text-gray-500 text-xs md:text-sm font-bold">
        <p>&copy; ২০২৬ বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
    </div>
  );
}
