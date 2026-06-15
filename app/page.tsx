import React from 'react';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  // লিমিট ২০ থেকে বাড়িয়ে ৪০ করা হলো
  const { data: newsItems } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(40);

  if (!newsItems || newsItems.length === 0) {
    return <div className="text-center p-20 text-2xl font-bold">খবর লোড হচ্ছে... দয়া করে অপেক্ষা করুন।</div>;
  }

  const leadNews = newsItems[0]; 
  const subNews = newsItems.slice(1, 3); 
  const gridNews = newsItems.slice(3); 

  const categories = ["সর্বশেষ", "বাংলাদেশ", "আন্তর্জাতিক", "খেলাধুলা", "বিনোদন", "বাণিজ্য", "প্রযুক্তি", "মতামত"];

  return (
    <div className="min-h-screen bg-gray-50 text-black flex flex-col">
      
      {/* Header Section */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-red-700 tracking-tight">
              বঙ্গীয় <span className="text-black">টাইমস</span>
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1 font-semibold">সত্য ও সাহসের প্রতিচ্ছবি</p>
          </div>
          
          <div className="mt-3 md:mt-0 flex items-center gap-4">
            <button className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-1.5 font-bold rounded shadow-sm border border-gray-300">
              ই-পেপার
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="border-t border-gray-300 bg-white sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <nav className="flex items-center gap-6 py-3 text-lg font-bold text-gray-800">
              {categories.map((cat, index) => (
                <a key={index} href="#" className="hover:text-red-600 transition">{cat}</a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-0 md:px-4 mt-4 flex-grow">
        <div className="bg-[#0b3d6e] text-white p-4 md:p-6 md:rounded-t-md">
          <a href={leadNews.source_url} target="_blank" rel="noopener noreferrer" className="cursor-pointer group block">
            <div className="text-center mb-4 border-b border-blue-800 pb-3 flex justify-center items-center gap-2">
               <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">{leadNews.source_name}</span>
               <h2 className="text-2xl font-bold">প্রধান খবর</h2>
            </div>
            <div className="overflow-hidden rounded shadow-lg">
              <img src={leadNews.image_url} alt={leadNews.title} className="w-full h-[220px] md:h-[450px] object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 leading-tight group-hover:text-gray-300 transition">{leadNews.title}</h2>
            <p className="mt-3 text-gray-300 line-clamp-2">{leadNews.snippet}</p>
          </a>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t border-blue-800 pt-6">
            {subNews.map((news) => (
              <a href={news.source_url} target="_blank" rel="noopener noreferrer" key={news.id} className="cursor-pointer group flex flex-col">
                <div className="overflow-hidden rounded relative">
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded z-10">{news.source_name}</span>
                  <img src={news.image_url} alt={news.title} className="w-full h-[200px] object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <h3 className="text-2xl font-bold mt-3 leading-snug group-hover:text-gray-300 transition">{news.title}</h3>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 shadow-md md:rounded-b-md border border-t-0 border-gray-200">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {gridNews.map((news) => (
                 <a href={news.source_url} target="_blank" rel="noopener noreferrer" key={news.id} className="flex gap-4 items-start border-b border-gray-100 pb-4 cursor-pointer group">
                    <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded border border-gray-200">
                       <img src={news.image_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                    </div>
                    <div>
                      <span className="text-red-600 text-xs font-bold mb-1 block">{news.source_name}</span>
                      <h4 className="text-lg font-bold text-gray-800 group-hover:text-red-600 transition line-clamp-3 leading-snug">{news.title}</h4>
                    </div>
                 </a>
              ))}
           </div>
        </div>
      </main>

      {/* Professional Footer Section */}
      <footer className="bg-[#1a1a1a] text-gray-300 mt-12 border-t-4 border-red-700">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            
            {/* Column 1: Identity */}
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-4">বঙ্গীয় <span className="text-red-600">টাইমস</span></h2>
              <p className="text-sm leading-relaxed text-gray-400">
                সত্য, সাহস ও বস্তুনিষ্ঠ সাংবাদিকতার এক অবিচল কণ্ঠস্বর। বাংলাদেশ ও সারা বিশ্বের সর্বশেষ সংবাদ সবার আগে পৌঁছে দিতে আমরা অঙ্গীকারবদ্ধ।
              </p>
            </div>

            {/* Column 2: Editorial Info */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 inline-block">সম্পাদকীয় ও প্রকাশনা</h3>
              <p className="text-sm mb-2"><span className="text-gray-500">সম্পাদক ও প্রকাশক:</span> <br/><span className="text-base font-bold text-white">মো: আজাদুর রহমান</span></p>
              <p className="text-sm mt-3"><span className="text-gray-500">প্রধান কার্যালয়:</span> <br/>ঢাকা, বাংলাদেশ</p>
            </div>

            {/* Column 3: Contact & Legal */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 inline-block">যোগাযোগ</h3>
              <p className="text-sm mb-2 hover:text-white cursor-pointer transition">ইমেইল: news@bongiyotimes.com</p>
              <p className="text-sm hover:text-white cursor-pointer transition">বিজ্ঞাপন: ads@bongiyotimes.com</p>
              <div className="mt-4 flex justify-center md:justify-start gap-4 text-sm font-semibold">
                 <a href="#" className="hover:text-red-500 transition">গোপনীয়তা নীতি</a>
                 <span>|</span>
                 <a href="#" className="hover:text-red-500 transition">শর্তাবলি</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত। এই ওয়েবসাইটের কোনো লেখা, ছবি বা ভিডিও অনুমতি ছাড়া ব্যবহার বেআইনি।</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
