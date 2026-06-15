import React from 'react';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

export default async function NewsDetail({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  // খবরটি আনা হচ্ছে
  const { data: news } = await supabase.from('news').select('*').eq('id', params.id).single();

  // সম্পর্কিত অন্যান্য খবর (একই ক্যাটাগরির)
  let relatedNews: any[] = [];
  if (news) {
     const { data } = await supabase.from('news').select('*').eq('category', news.category).neq('id', news.id).order('created_at', { ascending: false }).limit(6);
     relatedNews = data || [];
  }

  if (!news) {
    return <div className="text-center p-20 text-2xl font-bold mt-20">খবরটি পাওয়া যায়নি অথবা মুছে ফেলা হয়েছে।</div>;
  }

  const menuCategories = ["সর্বশেষ", "বাংলাদেশ", "রাজনীতি", "আন্তর্জাতিক", "খেলাধুলা", "বাণিজ্য", "বিনোদন", "মতামত"];

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <a href="/" className="flex flex-col items-center md:items-start shrink-0">
            <h1 className="text-4xl md:text-5xl font-extrabold text-red-700 tracking-tighter">বঙ্গীয় <span className="text-black">টাইমস</span></h1>
          </a>
          <nav className="flex items-center flex-wrap justify-center gap-3 md:gap-6 text-sm md:text-base font-bold text-gray-700">
              <a href="/" className="hover:text-red-600 transition">প্রচ্ছদ</a>
              {menuCategories.map((cat, idx) => (
                <a key={idx} href={`/?category=${cat}`} className="hover:text-red-600 transition">{cat}</a>
              ))}
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 py-3 text-sm text-gray-500 border-b border-gray-100 flex gap-2 font-bold">
         <a href="/" className="hover:text-red-600">প্রচ্ছদ</a> <span>»</span>
         <a href={`/?category=${news.category}`} className="hover:text-red-600 text-red-700">{news.category}</a>
      </div>

      {/* Main Content Layout (Left 8 Cols, Right 4 Cols) */}
      <main className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* Read Area (Left Side) */}
         <article className="lg:col-span-8">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">{news.title}</h1>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-y border-gray-200 py-3 mb-8">
               <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <span className="bg-gray-100 px-3 py-1 rounded text-red-700">{news.source_name}</span>
                  <span>|</span>
                  <span>প্রকাশিত: {formatDateTime(news.created_at)}</span>
               </div>
               
               {/* Dummy Social Share */}
               <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 font-bold">শেয়ার:</span>
                  <button className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs hover:bg-blue-700">fb</button>
                  <button className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs hover:bg-green-600">wa</button>
                  <button className="bg-blue-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs hover:bg-blue-500">tw</button>
               </div>
            </div>
            
            <img src={news.image_url} alt={news.title} className="w-full h-auto max-h-[500px] object-cover rounded-sm mb-8 shadow-sm" />
            
            {/* The Actual News Content */}
            <div className="text-lg md:text-xl leading-relaxed text-gray-800 whitespace-pre-wrap font-serif">
               {news.content || news.snippet}
            </div>

            {/* Tags area */}
            <div className="mt-10 pt-6 border-t border-gray-200 flex gap-3 items-center">
               <span className="font-bold text-gray-500">বিষয়:</span>
               <a href={`/?category=${news.category}`} className="bg-gray-100 text-gray-700 px-4 py-1 rounded-full text-sm font-bold hover:bg-gray-200">{news.category}</a>
            </div>
         </article>

         {/* Sidebar (Right Side) */}
         <aside className="lg:col-span-4">
            {/* Ad Banner */}
            <div className="w-full h-[250px] bg-gray-100 border border-gray-200 flex flex-col items-center justify-center rounded-sm mb-10 text-gray-400 font-bold">
               বিজ্ঞাপন স্পেস (৩০০ x ২৫০)
            </div>

            {/* Related News */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-4">
               <h3 className="text-xl font-bold border-l-4 border-red-700 pl-3 mb-6 text-gray-900">সম্পর্কিত খবর</h3>
               <div className="flex flex-col gap-4">
                  {relatedNews.map((rel: any) => (
                     <a href={`/news/${rel.id}`} key={rel.id} className="group flex gap-4 items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <img src={rel.image_url} alt={rel.title} className="w-20 h-16 object-cover rounded-sm shrink-0" />
                        <h4 className="text-[15px] font-bold text-gray-800 group-hover:text-red-700 leading-snug line-clamp-3">
                           {rel.title}
                        </h4>
                     </a>
                  ))}
               </div>
            </div>
         </aside>

      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-gray-300 mt-12 border-t-4 border-red-700 py-10 text-center">
         <h2 className="text-3xl font-extrabold text-white mb-2">বঙ্গীয় <span className="text-red-600">টাইমস</span></h2>
         <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
    </div>
  );
}
