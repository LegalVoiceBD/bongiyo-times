import React from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Viewport } from 'next';

export const revalidate = 60; 

// ১. এই কমান্ডটি মোবাইল ব্রাউজারকে বাধ্য করবে পাতাকে ১১৫০ পিক্সেল হিসেবে রেন্ডার করতে।
export const viewport: Viewport = {
  width: 1150,
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default async function EPaperPage() {
  const { data: newsItems } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(14);

  const news = newsItems || [];
  
  const leadNews = news.slice(0, 2);
  const gridNews = news.slice(2, 14);

  return (
    // overflow-x-auto দেওয়া হয়েছে যাতে জুম বা স্ক্রোল করা যায়
    <div className="min-h-screen bg-[#d1d5db] print:bg-white overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      
      {/* প্রিন্ট ও ডাউনলোড বাটন */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 print:hidden">
        <a 
          href="javascript:window.print()" 
          className="bg-[#b91c1c] text-white px-6 py-3 rounded-full shadow-[0_10px_25px_rgba(185,28,28,0.4)] font-bold text-[16px] flex items-center gap-2 hover:bg-red-800 transition whitespace-nowrap border-[2px] border-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          ই-পেপার সেভ / ডাউনলোড করুন
        </a>
      </div>

      {/* --- ই-পেপার মূল ক্যানভাস (পাথরের মতো ফিক্সড ১১৫০ পিক্সেল) --- */}
      {/* inline CSS ব্যবহার করা হয়েছে যাতে কোনো গ্লোবাল ডিজাইন এটিকে ভাঙতে না পারে */}
      <div 
        style={{ width: '1150px', minWidth: '1150px', margin: '30px auto', backgroundColor: 'white' }} 
        className="p-10 shadow-[0_0_40px_rgba(0,0,0,0.15)] print:shadow-none print:w-full print:min-w-0 print:my-0 print:p-0 shrink-0"
      >
        
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.maateen.me/kalpurush/font.css');
          body { font-family: 'Kalpurush', Arial, sans-serif !important; }
          @page { size: A3; margin: 10mm; }
        `}} />

        {/* --- পত্রিকার হেডার --- */}
        <header className="border-b-[4px] border-double border-black pb-3 mb-6">
          <div className="flex justify-between items-end mb-3">
            
            {/* বাম দিকের তথ্য (ফিক্সড সাইজ) */}
            <div style={{ width: '250px' }} className="text-[14px] font-bold text-gray-700 leading-tight shrink-0">
              <p>ঢাকা</p>
              <p>{new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long' }).format(new Date())}, {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}</p>
              <p className="mt-0.5 text-[#b91c1c]">এক নজরে শিরোনাম সংস্করণ</p>
            </div>

            {/* কাস্টম হাফ-সূর্য লোগো */}
            <div className="shrink-0 flex items-baseline justify-center px-4">
               <h1 className="text-[65px] font-extrabold text-[#b91c1c] leading-none tracking-tight" style={{ transform: 'scaleY(1.05)' }}>
                  বঙ্গীয়
               </h1>
               <div className="relative ml-3">
                  <div className="absolute -top-[22px] left-[6px] w-[45px] z-0 opacity-95">
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
                  <h1 className="relative z-10 text-[65px] font-extrabold text-[#333333] leading-none tracking-tight" style={{ transform: 'scaleY(1.05)' }}>
                    টাইমস
                  </h1>
               </div>
            </div>

            {/* ডান দিকের তথ্য (ফিক্সড সাইজ) */}
            <div style={{ width: '250px' }} className="text-[14px] font-bold text-gray-700 text-right leading-tight shrink-0">
              <p>সম্পাদক ও প্রকাশক</p>
              <p className="text-black text-[16px]">অ্যাডভোকেট মো: আজাদুর রহমান</p>
              <p className="mt-0.5 text-[#b91c1c]">হেডলাইন ডাইজেস্ট</p>
            </div>
            
          </div>
          
          <div className="bg-black text-white text-[15px] py-1 px-4 flex justify-between font-bold">
            <span>আজকের শীর্ষ সংবাদ: ছবি ও শিরোনামে</span>
            <span>www.bongiyotimes.com</span>
          </div>
        </header>

        {/* --- টপ সেকশন: ২টি বড় খবর (সবসময় ২ কলাম থাকবে) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }} className="mb-8 border-b-[2px] border-black pb-8">
          {leadNews.map((item: any) => (
            <div key={item.id} className="flex flex-col group border border-gray-100 p-2 shadow-sm bg-gray-50/50">
               <img src={item.image_url} alt={item.title} className="w-full h-[320px] object-cover mb-3 border border-gray-300 grayscale print:grayscale-0" />
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[#b91c1c] font-bold text-[14px] uppercase tracking-wider">■ {item.category || 'সর্বশেষ'}</span>
                  <span className="text-gray-500 text-[12px] font-bold bg-gray-200 px-2 py-0.5 rounded-full">{item.source_name || 'সংগৃহীত'}</span>
               </div>
               <h2 className="text-[36px] font-extrabold text-black leading-[1.15] group-hover:text-[#104f96]">
                  <a href={item.is_custom ? `/news/${item.id}` : item.source_url} target="_blank">{item.title}</a>
               </h2>
            </div>
          ))}
        </div>

        {/* --- গ্রিড সেকশন: ১২টি ছোট খবর (সবসময় ৪ কলাম থাকবে) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {gridNews.map((item: any) => (
            <div key={item.id} className="flex flex-col group">
               <img src={item.image_url} alt={item.title} className="w-full h-[150px] object-cover mb-3 border border-gray-200 grayscale print:grayscale-0" />
               <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[#b91c1c] font-bold text-[12px] uppercase tracking-wider">■ {item.category || 'সর্বশেষ'}</span>
               </div>
               <h3 className="text-[22px] font-extrabold text-[#222] leading-[1.2] group-hover:text-[#104f96]">
                  <a href={item.is_custom ? `/news/${item.id}` : item.source_url} target="_blank">{item.title}</a>
               </h3>
            </div>
          ))}
        </div>

        {/* প্রিন্ট ফুটার */}
        <div className="mt-12 border-t-[2px] border-black pt-3 text-center text-[13.5px] font-bold text-gray-500 pb-2">
          বঙ্গীয় টাইমস হেডলাইন ডাইজেস্ট কর্তৃক সংকলিত ও প্রকাশিত। বিস্তারিত খবর পড়তে ভিজিট করুন: <span className="text-black">www.bongiyotimes.com</span>
        </div>

      </div>
    </div>
  );
}
