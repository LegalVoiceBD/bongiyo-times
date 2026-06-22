import React from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Viewport } from 'next';

export const revalidate = 60; 

// মোবাইল ব্রাউজারকে বাধ্য করবে পাতাকে ১১৫০ পিক্সেল হিসেবে রেন্ডার করতে (জুম ফিচার)
export const viewport: Viewport = {
  width: 1150,
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default async function EPaperPage() {
  // ৪টি হেডার নিউজ + ২টি লিড নিউজ + ১২টি গ্রিড নিউজ = মোট ১৮টি খবর
  const { data: newsItems } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(18);

  const news = newsItems || [];
  
  // খবরের বিভাজন
  const topStripNews = news.slice(0, 4);
  const leadNews = news.slice(4, 6);
  const gridNews = news.slice(6, 18);

  return (
    // overflow-x-auto দেওয়া হয়েছে যাতে জুম বা স্ক্রোল করা যায়
    <div className="min-h-screen bg-[#d1d5db] print:bg-white overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      
      {/* প্রিন্ট ও ডাউনলোড বাটন */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 print:hidden">
        <a 
          href="javascript:window.print()" 
          className="bg-[#1e3a8a] text-white px-6 py-3 rounded-full shadow-[0_10px_25px_rgba(30,58,138,0.4)] font-bold text-[16px] flex items-center gap-2 hover:bg-blue-900 transition whitespace-nowrap border-[2px] border-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          ই-পেপার সেভ / ডাউনলোড করুন
        </a>
      </div>

      {/* --- ই-পেপার মূল ক্যানভাস (পাথরের মতো ফিক্সড ১১৫০ পিক্সেল) --- */}
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

        {/* --- ১. হেডারের ওপরের ৪টি কালারফুল নিউজের স্ট্রিপ (প্রথম আলোর মতো) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="mb-4 pb-4 border-b-[2px] border-black">
          {topStripNews.map((item: any) => (
            <a href={item.is_custom ? `/news/${item.id}` : item.source_url} target="_blank" key={item.id} className="flex gap-3 items-center group">
               <img src={item.image_url} alt={item.title} className="w-[85px] h-[60px] object-cover border border-gray-200 shadow-sm" />
               <div className="flex-1">
                  <span className="text-[#b91c1c] text-[11px] font-bold uppercase block mb-0.5">■ {item.category || 'সর্বশেষ'}</span>
                  <h3 className="text-[14px] font-bold text-gray-900 leading-tight group-hover:text-[#104f96] line-clamp-2">{item.title}</h3>
               </div>
            </a>
          ))}
        </div>

        {/* --- ২. মূল পত্রিকার হেডার --- */}
        <header className="border-b-[4px] border-double border-black pb-3 mb-6">
          <div className="flex justify-between items-end mb-3">
            
            {/* বাম দিকের তথ্য (তারিখ দিয়ে ভরাট করা) */}
            <div style={{ width: '280px' }} className="text-[14.5px] font-bold text-gray-700 leading-snug shrink-0">
              <p className="text-black text-[16px]">ঢাকা</p>
              <p>{new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}</p>
              <p className="text-gray-600 mt-0.5">৮ আষাঢ় ১৪৩৩ • ৬ মহররম ১৪৪৮</p>
            </div>

            {/* অরিজিনাল ঘুরন্ত ঘড়ি লোগো (বঙ্গীয় [ঘড়ি] ইমস) */}
            <div className="shrink-0 flex items-center justify-center px-4">
               <h1 className="text-[65px] font-extrabold flex items-center tracking-tighter" style={{ transform: 'scaleY(1.05)' }}>
                 <span className="text-[#b91c1c]">বঙ্গীয়</span>
                 
                 <div className="relative flex items-center justify-center w-[45px] h-[45px] mx-1.5 mt-2">
                   <div className="absolute inset-0 rounded-full border-[3.5px] border-[#b91c1c]"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute w-[5px] h-[5px] bg-[#b91c1c] rounded-full"></div>
                      <div className="absolute w-[2px] h-[35%] bg-[#b91c1c] origin-bottom bottom-1/2 rounded-t-full animate-[spin_4s_linear_infinite]"></div>
                      <div className="absolute w-[3px] h-[25%] bg-[#b91c1c] origin-bottom bottom-1/2 rounded-t-full animate-[spin_24s_linear_infinite] rotate-[45deg]"></div>
                   </div>
                   <span className="relative z-10 text-black text-[34px] font-black leading-none pt-1" style={{ textShadow: '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff' }}>টা</span>
                 </div>
                 
                 <span className="text-black">ইমস</span>
               </h1>
            </div>

            {/* ডান দিকের তথ্য */}
            <div style={{ width: '280px' }} className="text-[14.5px] font-bold text-gray-700 text-right leading-snug shrink-0">
              <p className="text-black text-[16px]">অ্যাডভোকেট মো: আজাদুর রহমান</p>
              <p>সম্পাদক ও প্রকাশক</p>
              <p className="mt-0.5 text-[#1e3a8a]">কালারফুল ই-পেপার সংস্করণ</p>
            </div>
            
          </div>
          
          <div className="bg-[#1e3a8a] text-white text-[15px] py-1 px-4 flex justify-between items-center font-bold">
            <span>আজকের প্রধান সংবাদ ও হেডলাইন ডাইজেস্ট</span>
            <span>মূল্য: ১০ টাকা | পৃষ্ঠা: ১২</span>
          </div>
        </header>

        {/* --- ৩. লিড সেকশন: ২টি বড় খবর (সবসময় ২ কলাম থাকবে) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }} className="mb-8 border-b-[2px] border-black pb-8">
          {leadNews.map((item: any) => (
            <div key={item.id} className="flex flex-col group p-3 bg-gray-50 border border-gray-200 shadow-sm">
               <div className="relative">
                 <img src={item.image_url} alt={item.title} className="w-full h-[320px] object-cover mb-3 border border-gray-300" />
                 <span className="absolute top-2 right-2 bg-black/70 text-white text-[11px] font-bold px-2 py-1 rounded-sm">
                   ছবি: {item.source_name || 'সংগৃহীত'}
                 </span>
               </div>
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[#b91c1c] font-bold text-[14px] uppercase tracking-wider">■ {item.category || 'সর্বশেষ'}</span>
               </div>
               <h2 className="text-[38px] font-extrabold text-black leading-[1.15] group-hover:text-[#104f96]">
                  <a href={item.is_custom ? `/news/${item.id}` : item.source_url} target="_blank">{item.title}</a>
               </h2>
            </div>
          ))}
        </div>

        {/* --- ৪. গ্রিড সেকশন: ১২টি ছোট খবর (সবসময় ৪ কলাম থাকবে) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {gridNews.map((item: any) => (
            <div key={item.id} className="flex flex-col group border-b border-gray-100 pb-3">
               <img src={item.image_url} alt={item.title} className="w-full h-[160px] object-cover mb-3 border border-gray-200 shadow-sm" />
               <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[#1e3a8a] font-bold text-[12px] uppercase tracking-wider">■ {item.category || 'সর্বশেষ'}</span>
               </div>
               <h3 className="text-[22px] font-extrabold text-[#222] leading-[1.25] group-hover:text-[#b91c1c]">
                  <a href={item.is_custom ? `/news/${item.id}` : item.source_url} target="_blank">{item.title}</a>
               </h3>
            </div>
          ))}
        </div>

        {/* --- ৫. প্রিন্ট ফুটার --- */}
        <div className="mt-12 border-t-[2px] border-black pt-3 text-center text-[13.5px] font-bold text-gray-600 pb-2 flex justify-between px-2">
          <span>বঙ্গীয় টাইমস পাবলিকেশন্স কর্তৃক সংকলিত ও প্রকাশিত। সর্বস্বত্ব সংরক্ষিত।</span>
          <span>বিস্তারিত খবর পড়তে ভিজিট করুন: <strong className="text-black">www.bongiyotimes.com</strong></span>
        </div>

      </div>
    </div>
  );
}
