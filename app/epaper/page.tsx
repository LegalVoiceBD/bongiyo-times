import React from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Viewport } from 'next';
import Script from 'next/script';

export const revalidate = 60; 

// মোবাইল ব্রাউজারকে বাধ্য করবে পাতাকে ১১৫০ পিক্সেল হিসেবে রেন্ডার করতে (যাতে জুম করে পড়া যায়)
export const viewport: Viewport = {
  width: 1150,
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default async function EPaperPage() {
  // মোট ১৪টি খবর আনা হচ্ছে (২টি লিড + ১২টি গ্রিড)
  const { data: newsItems } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(14);

  const news = newsItems || [];
  
  const leadNews = news.slice(0, 2);
  const gridNews = news.slice(2, 14);

  return (
    <div className="min-h-screen bg-[#d1d5db] print:bg-white flex justify-center py-8 print:py-0 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      
      {/* html2canvas লাইব্রেরি */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" strategy="lazyOnload" />
      
      <Script id="download-handler" strategy="lazyOnload">
        {`
          setTimeout(() => {
            // প্রিন্ট বাটন
            document.getElementById('print-btn')?.addEventListener('click', () => {
               window.print();
            });

            // হাই-রেজ্যুলেশন ইমেজ ডাউনলোড বাটন
            document.getElementById('download-btn')?.addEventListener('click', () => {
               if (typeof window.html2canvas === 'undefined') {
                 alert('সিস্টেম প্রস্তুত হচ্ছে... ২ সেকেন্ড পর আবার ক্লিক করুন।');
                 return;
               }
               
               const btn = document.getElementById('download-btn');
               const originalText = btn.innerHTML;
               btn.innerHTML = 'উচ্চ মানের ইমেজ তৈরি হচ্ছে ⏳...';
               
               const element = document.getElementById('epaper-canvas');
               
               // ইমেজ প্রসেসিং কনফিগারেশন (Scale 2 মানে অত্যন্ত ক্লিয়ার ছবি)
               window.html2canvas(element, { 
                  scale: 2, 
                  useCORS: true,
                  backgroundColor: '#ffffff',
                  logging: false
               }).then(canvas => {
                  const link = document.createElement('a');
                  const dateInfo = new Date().toISOString().split('T')[0];
                  link.download = 'Bongiyo-Times-ePaper-' + dateInfo + '.jpg';
                  link.href = canvas.toDataURL('image/jpeg', 0.95);
                  link.click();
                  btn.innerHTML = originalText;
               }).catch(err => {
                  console.error('Error:', err);
                  btn.innerHTML = originalText;
                  alert('ইমেজ তৈরি করতে সমস্যা হয়েছে। পেজটি একবার রিলোড দিন।');
               });
            });
          }, 1500);
        `}
      </Script>

      {/* --- ভাসমান বাটন --- */}
      <div className="fixed bottom-6 z-50 print:hidden flex gap-3 shadow-[0_10px_25px_rgba(0,0,0,0.3)] bg-white p-2 rounded-full border border-gray-300">
        <button id="print-btn" className="bg-gray-700 text-white px-5 py-2.5 rounded-full font-bold text-[14px] flex items-center gap-2 hover:bg-gray-900 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          প্রিন্ট করুন
        </button>
        <button id="download-btn" className="bg-[#b91c1c] text-white px-6 py-2.5 rounded-full font-bold text-[14px] flex items-center gap-2 hover:bg-red-800 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          ই-পেপার ইমেজ ডাউনলোড
        </button>
      </div>

      {/* --- ই-পেপার মূল ক্যানভাস (অরিজিনাল ১১৫০ পিক্সেল) --- */}
      <div 
        id="epaper-canvas"
        style={{ width: '1150px', backgroundColor: '#ffffff', boxSizing: 'border-box' }} 
        className="p-10 shadow-[0_0_40px_rgba(0,0,0,0.15)] print:shadow-none shrink-0"
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.maateen.me/kalpurush/font.css');
          body { font-family: 'Kalpurush', Arial, sans-serif !important; }
        `}} />

        {/* --- ১. মূল পত্রিকার হেডার --- */}
        <header className="border-b-[4px] border-double border-black pb-3 mb-6">
          <div className="flex justify-between items-end mb-3">
            
            {/* বাম দিকের তথ্য (পরিপূর্ণ তারিখ) */}
            <div style={{ width: '280px' }} className="text-[14.5px] font-bold text-gray-700 leading-snug shrink-0">
              <p className="text-black text-[16px]">ঢাকা</p>
              <p>{new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long' }).format(new Date())}, {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}</p>
              <p className="text-gray-500 mt-0.5">৮ আষাঢ় ১৪৩৩ • ৬ মহররম ১৪৪৮</p>
            </div>

            {/* সলিড লোগো: কোনো আইকন বা ঘড়ি নেই, শুধু মোটা টেক্সট */}
            <div className="shrink-0 flex items-center justify-center px-4">
               <h1 className="text-[75px] font-black tracking-tighter" style={{ transform: 'scaleY(1.1)' }}>
                 <span className="text-[#b91c1c]">বঙ্গীয়</span>
                 <span className="text-black ml-4">টাইমস</span>
               </h1>
            </div>

            {/* ডান দিকের তথ্য */}
            <div style={{ width: '280px' }} className="text-[14.5px] font-bold text-gray-700 text-right leading-snug shrink-0">
              <p className="text-black text-[16px]">অ্যাডভোকেট মো: আজাদুর রহমান</p>
              <p>সম্পাদক ও প্রকাশক</p>
              <p className="mt-0.5 text-gray-500">অনলাইন ডাইজেস্ট সংস্করণ</p>
            </div>
            
          </div>
          
          <div className="bg-black text-white text-[15px] py-1.5 px-4 flex justify-between items-center font-bold">
            <span>আজকের শীর্ষ সংবাদ: ছবি ও শিরোনামে</span>
            <span>www.bongiyotimes.com</span>
          </div>
        </header>

        {/* --- ২. লিড সেকশন: ২টি বড় খবর --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }} className="mb-8 border-b-[2px] border-black pb-8">
          {leadNews.map((item: any) => (
            <div key={item.id} className="flex flex-col group p-3 bg-gray-50 border border-gray-200 shadow-sm">
               <div className="relative">
                 <img src={item.image_url} alt="" crossOrigin="anonymous" loading="eager" className="w-full h-[320px] object-cover mb-3 border border-gray-300 grayscale print:grayscale-0" />
                 <span className="absolute top-2 right-2 bg-black/70 text-white text-[12px] font-bold px-2 py-1 rounded-sm">
                   ছবি: {item.source_name || 'সংগৃহীত'}
                 </span>
               </div>
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[#b91c1c] font-bold text-[14px] uppercase tracking-wider">■ {item.category || 'সর্বশেষ'}</span>
               </div>
               {/* ফুল নিউজ টাইটেল (কোনো ট্রাঙ্কেশন নেই) */}
               <h2 className="text-[36px] font-extrabold text-black leading-[1.15] group-hover:text-gray-600">
                  {item.title}
               </h2>
            </div>
          ))}
        </div>

        {/* --- ৩. গ্রিড সেকশন: ১২টি ছোট খবর (৪ কলামে) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {gridNews.map((item: any) => (
            <div key={item.id} className="flex flex-col group border-b border-gray-100 pb-3">
               <img src={item.image_url} alt="" crossOrigin="anonymous" loading="eager" className="w-full h-[160px] object-cover mb-3 border border-gray-200 shadow-sm grayscale print:grayscale-0" />
               <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[#b91c1c] font-bold text-[12px] uppercase tracking-wider">■ {item.category || 'সর্বশেষ'}</span>
               </div>
               {/* ফুল নিউজ টাইটেল (কোনো ট্রাঙ্কেশন নেই) */}
               <h3 className="text-[22px] font-extrabold text-[#222] leading-[1.25] group-hover:text-gray-600">
                  {item.title}
               </h3>
            </div>
          ))}
        </div>

        {/* --- ৪. সেন্ট্রাল ফুটার (স্ক্রিনশটের মতো এক লাইনে) --- */}
        <div className="mt-10 border-t-[2px] border-black pt-3 text-center text-[13px] font-bold text-gray-500 pb-2">
          বঙ্গীয় টাইমস অনলাইন ডাইজেস্ট সংস্করণ কর্তৃক সংকলিত ও প্রকাশিত। বিস্তারিত খবর পড়তে ভিজিট করুন: <span className="text-black">www.bongiyotimes.com</span>
        </div>

      </div>
    </div>
  );
}
