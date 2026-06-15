import React from 'react';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

export default async function NewsDetail({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );

  const { data: news } = await supabase.from('news').select('*').eq('id', params.id).single();

  if (!news) {
    return <div className="text-center p-20 text-2xl font-bold">খবরটি পাওয়া যায়নি অথবা ডিলিট করা হয়েছে।</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Simple Header */}
      <header className="bg-white border-b border-red-700 py-4 text-center">
         <a href="/" className="text-4xl font-extrabold text-red-700">বঙ্গীয় <span className="text-black">টাইমস</span></a>
      </header>

      <main className="max-w-[800px] mx-auto px-4 py-10">
         <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-4">{news.title}</h1>
         <div className="flex items-center gap-3 text-sm text-gray-600 mb-6 border-b border-gray-200 pb-4">
            <span className="font-bold text-red-700">{news.source_name}</span>
            <span>|</span>
            <span>{new Date(news.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
         </div>
         
         <img src={news.image_url} alt={news.title} className="w-full h-auto max-h-[500px] object-cover rounded-sm mb-8 shadow-sm" />
         
         <div className="text-lg md:text-xl leading-relaxed text-gray-800 whitespace-pre-wrap">
            {news.content || news.snippet}
         </div>
         
         <div className="mt-12 text-center">
            <a href="/" className="bg-red-700 text-white px-6 py-2 rounded shadow font-bold hover:bg-red-800 transition">« প্রচ্ছদে ফিরে যান</a>
         </div>
      </main>
    </div>
  );
}
