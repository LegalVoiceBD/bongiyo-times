import React from 'react';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 60; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default async function EPaperPage() {
  // শুধু শিরোনাম ও ছবির জন্য ১৪টি লেটেস্ট খবর আনা হচ্ছে
  const { data: newsItems } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(14);

  const news = newsItems || [];
  
  // লেআউট ভাগ করা: ২টি বড় খবর এবং ১২টি ছোট খবর
  const leadNews = news.slice(0, 2);
  const gridNews = news.slice(2, 14);

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white flex flex-col items-center">
      
      {/* প্রিন্ট ও ডাউনলোড বাটন */}
      <div className="fixed bottom-8 right-8 z-50 print:hidden">
        <a 
          href="javascript:window.print()" 
          className="bg-[#b91c1c] text-white px-6 py-3 rounded-full shadow-2xl font-bold text-lg flex items-center gap-2 hover:bg-red-800 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          ই-পেপার সেভ / ডাউনলোড করুন
        </a>
      </div>

      {/* ই-পেপার ক্যানভাস */}
      <main className="w-full max-w-[1150px] bg-white text-black p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.1)] print:shadow-none print:w-full print:max-w-none print:p-0">
        
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.maateen.me/kalpurush/font.css');
          body { font-family: 'Kalpurush', Arial, sans-serif !important; }
          @page { size: A3; margin: 10mm; }
        `}} />

        {/* --- পত্রিকার প্রফেশনাল হেডার --- */}
        <header className="border-b-[4px] border-double border-black pb-3 mb-5">
          <div className="flex justify-between items-end mb-2">
            
            <div className="text-[12px] font-bold text-gray-700 leading-tight">
              <p>ঢাকা</p>
              <p>{new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long' }).format(new Date())}, {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}</p>
              <p className="mt-0.5">এক নজরে শিরোনাম সংস্করণ</p>
            </div>

            {/* কাস্টম হাফ-সূর্য লোগো (অক্ষত রাখা হয়েছে) */}
            <div className="relative z-10 flex items-baseline justify-center px-4">
               <h1 className="text-[50px] md:text-[60px] font-extrabold text-[#b91c1c] leading-none tracking-tight" style={{ transform: 'scaleY(1.05)' }}>
                  বঙ্গীয়
               </h1>
               <div className="relative ml-2.5">
                  <div className="absolute -top-[16px] md:-top-[20px] left-[6px] w-[35px] md:w-[42px] z-0 opacity-95">
                     <svg viewBox="0 0 100 70" className="w-full h-auto">
                        <line x1="20" y1="35" x2="8" y2="25" stroke="#b91c1c" strokeWidth="4.5" strokeLinecap="round"/>
                        <line x1="35" y1="18" x2="24" y2="6" stroke="#b91c1c" strokeWidth="4.5" strokeLinecap="round"/>
                        <line x1="50" y1="12" x2="50" y2="0" stroke="#b91c1c" strokeWidth="4.5" strokeLinecap="round"/>
                        <line x1="65" y1="18" x2="76" y2="6" stroke="#b91c1c" strokeWidth="4.5" strokeLinecap="round"/>
                        <line x1="80" y1="35" x2="92" y2="25" stroke="#b91c1c" strokeWidth="4.5" strokeLinecap="round"/>
                        <path d="M 10 60 A 40 40 0 0 1 90 60 Q 50 42 10 60 Z" fill="#b91c1c"/>
                        <circle cx="50" cy="51" r="3.5" fill="#ffffff" />
                        <line x1="50" y1="51" x2="40" y2="43" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round"/>
                        <line x1="50" y1="51" x2="57" y2="38" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
                     </svg>
                  </div>
                  <h1 className="relative z-10 text-[50px] md:text-[60px] font-extrabold text-[#333333] leading-none tracking-tight" style={{ transform: 'scaleY(1.05)' }}>
                    টাইমস
                  </h1>
               </div>
            </div>

            <div className="text-[12px] font-bold text-gray-700 text-right leading-tight">
              <p>সম্পাদক ও প্রকাশক</p>
              <p className="text-black text-[14px]">অ্যাডভোকেট মো: আজাদুর রহমান</p>
              <p className="mt-0.5 text-[#b91c1c]">হেডলাইন ডাইজেস্ট</p>
            </div>
            
          </div>
          
          <div className="bg-black text-white text-[13.5px] py-1 px-4 flex justify-between font-bold">
            <span>আজকের শীর্ষ সংবাদ: ছবি ও শিরোনামে</span>
            <span>www.bongiyotimes.com</span>
          </div>
        </header>

        {/* --- টপ সেকশন: ২টি বড় খবর (Lead News) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b-[2px] border-black pb-8">
          {leadNews.map((item: any) => (
            <div key={item.id} className="flex flex-col group border border-gray-100 p-2 shadow-sm bg-gray-50/50">
               <img src={item.image_url} alt={item.title} className="w-full h-[250px] md:h-[300px] object-cover mb-3 border border-gray-300" />
               <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[#b91c1c] font-bold text-[13px] uppercase tracking-wider">■ {item.category}</span>
                  <span className="text-gray-500 text-[11px] font-bold bg-gray-200 px-2 py-0.5 rounded-full">{item.source_name || 'সংগৃহীত'}</span>
               </div>
               <h2 className="text-[28px] md:text-[34px] font-extrabold text-black leading-[1.15] group-hover:text-[#104f96]">
                  <a href={item.is_custom ? `/news/${item.id}` : item.source_url} target="_blank">{item.title}</a>
               </h2>
            </div>
          ))}
        </div>

        {/* --- গ্রিড সেকশন: ১২টি ছোট খবর (৪ কলামে) --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
          {gridNews.map((item: any) => (
            <div key={item.id} className="flex flex-col group">
               <img src={item.image_url} alt={item.title} className="w-full h-[130px] md:h-[160px] object-cover mb-2 border border-gray-200" />
               <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[#b91c1c] font-bold text-[11px] uppercase tracking-wider">■ {item.category}</span>
               </div>
               <h3 className="text-[18px] md:text-[21px] font-extrabold text-[#222] leading-[1.2] group-hover:text-[#104f96]">
                  <a href={item.is_custom ? `/news/${item.id}` : item.source_url} target="_blank">{item.title}</a>
               </h3>
            </div>
          ))}
        </div>

        {/* প্রিন্ট ফুটার */}
        <div className="mt-10 border-t-[2px] border-black pt-3 text-center text-[12px] font-bold text-gray-500 pb-2">
          বঙ্গীয় টাইমস হেডলাইন ডাইজেস্ট কর্তৃক সংকলিত ও প্রকাশিত। বিস্তারিত খবর পড়তে ভিজিট করুন: <span className="text-black">www.bongiyotimes.com</span>
        </div>

      </main>
    </div>
  );
}
