import React from 'react';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

export default async function Home({ searchParams }: { searchParams: { category?: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  // ইউজার মেনু থেকে যেই ক্যাটাগরিতে ক্লিক করবে, সেটি ধরবে (ডিফল্ট: সর্বশেষ)
  const activeCategory = searchParams.category || 'সর্বশেষ';

  // ডাটাবেস থেকে খবর আনার কোড (ক্যাটাগরি অনুযায়ী ফিল্টার করা)
  let query = supabase.from('news').select('*').order('created_at', { ascending: false }).limit(40);
  
  if (activeCategory !== 'সর্বশেষ') {
    query = query.eq('category', activeCategory);
  }

  const { data: newsItems } = await query;

  const categories = ["সর্বশেষ", "বাংলাদেশ", "আন্তর্জাতিক", "খেলাধুলা", "বিনোদন", "বাণিজ্য", "প্রযুক্তি", "আইন-আদালত", "ধর্ম"];

  return (
    <div className="min-h-screen bg-gray-50 text-black flex flex-col">
      
      {/* ----------------- Premium Header Section ----------------- */}
      <header className="bg-white">
        {/* Top Dark Bar */}
        <div className="bg-[#0b3d6e] text-white py-1.5 px-4 text-xs md:text-sm font-medium">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <span>ঢাকা, বাংলাদেশ</span>
            <span className="hidden md:inline-block">সত্য ও সাহসের প্রতিচ্ছবি</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-red-400">ফেসবুক</a>
              <a href="#" className="hover:text-red-400">ইউটিউব</a>
            </div>
          </div>
        </div>

        {/* Logo Area */}
        <div className="max-w-6xl mx-auto px-4 py-5 md:py-8 flex flex-col md:flex-row items-center justify-between border-b border-gray-200">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold text-red-700 tracking-tight drop-shadow-sm">
              বঙ্গীয় <span className="text-black">টাইমস</span>
            </h1>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button className="bg-red-700 hover:bg-red-800 text-white px-5 py-2 font-bold rounded shadow transition">
              আজকের ই-পেপার
            </button>
          </div>
        </div>

        {/* Interactive Navigation Menu */}
        <div className="bg-white sticky top-0 z-50 shadow-md border-b-2 border-red-700">
          <div className="max-w-6xl mx-auto px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <nav className="flex items-center gap-6 py-3 text-lg font-bold text-gray-800">
              {categories.map((cat, index) => (
                <a 
                  key={index} 
                  href={`/?category=${cat}`} 
                  className={`transition px-1 pb-1 ${activeCategory === cat ? 'text-red-700 border-b-4 border-red-700' : 'hover:text-red-600'}`}
                >
                  {cat}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ----------------- Main Content Section ----------------- */}
      <main className="max-w-6xl mx-auto px-0 md:px-4 mt-6 flex-grow w-full">
        {(!newsItems || newsItems.length === 0) ? (
           <div className="text-center p-20 text-2xl font-bold text-gray-500 bg-white rounded shadow-sm border border-gray-200">
              "{activeCategory}" ক্যাটাগরিতে এই মুহূর্তে কোনো খবর নেই।
           </div>
        ) : (
          <>
            <div className="bg-[#0b3d6e] text-white p-4 md:p-6 md:rounded-t-md shadow-lg">
              <div className="mb-4 border-b border-blue-800 pb-3 flex items-center justify-between">
                 <h2 className="text-2xl font-bold border-l-4 border-red-500 pl-3">{activeCategory} - প্রধান খবর</h2>
              </div>
              
              <a href={newsItems[0]?.source_url} target="_blank" rel="noopener noreferrer" className="cursor-pointer group block">
                <div className="relative overflow-hidden rounded shadow-xl">
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-xs px-3 py-1 rounded shadow-md z-10">{newsItems[0]?.source_name}</span>
                  <img src={newsItems[0]?.image_url} alt={newsItems[0]?.title} className="w-full h-[250px] md:h-[450px] object-cover group-hover:scale-105 transition duration-700" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 md:p-6">
                    <h2 className="text-2xl md:text-5xl font-bold leading-tight group-hover:text-gray-300 transition text-white drop-shadow-md">{newsItems[0]?.title}</h2>
                  </div>
                </div>
              </a>

              {newsItems.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-blue-800 pt-6">
                  {newsItems.slice(1, 3).map((news) => (
                    <a href={news.source_url} target="_blank" rel="noopener noreferrer" key={news.id} className="cursor-pointer group flex flex-col">
                      <div className="overflow-hidden rounded relative shadow-md">
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded z-10">{news.source_name}</span>
                        <img src={news.image_url} alt={news.title} className="w-full h-[200px] object-cover group-hover:scale-105 transition duration-500" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold mt-3 leading-snug group-hover:text-gray-300 transition">{news.title}</h3>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {newsItems.length > 3 && (
              <div className="bg-white p-4 md:p-6 shadow-lg md:rounded-b-md border border-t-0 border-gray-200">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newsItems.slice(3).map((news) => (
                       <a href={news.source_url} target="_blank" rel="noopener noreferrer" key={news.id} className="flex gap-4 items-start border-b border-gray-100 pb-4 cursor-pointer group hover:bg-gray-50 p-2 rounded transition">
                          <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded shadow-sm border border-gray-200">
                             <img src={news.image_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                          </div>
                          <div>
                            <span className="text-red-700 text-xs font-bold mb-1 block">{news.source_name}</span>
                            <h4 className="text-base md:text-lg font-bold text-gray-800 group-hover:text-red-700 transition line-clamp-3 leading-snug">{news.title}</h4>
                          </div>
                       </a>
                    ))}
                 </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Professional Footer Section */}
      <footer className="bg-[#1a1a1a] text-gray-300 mt-12 border-t-4 border-red-700">
        <div className="max-w-6xl mx-auto px-4 py-10">
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
