import React from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Viewport } from 'next';
import Script from 'next/script';

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

  // আজকের বারের নাম বের করা (যেমন: সোমবার, মঙ্গলবার)
  const today = new Date();
  const dayName = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long' }).format(today);

  return (
    // overflow-x-auto দেওয়া হয়েছে যাতে জুম বা স্ক্রোল করা যায়
    <div className="min-h-screen bg-[#d1d5db] print:bg-white overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      
      {/* HTML to Image Converter Script */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" strategy="lazyOnload" />
      
      <Script id="download-handler" strategy="lazyOnload">
        {`
          setTimeout(() => {
            // প্রিন্ট বাটন ফাংশন
            document.getElementById('print-btn')?.addEventListener('click', () => {
               window.print();
            });

            // ইমেজ ডাউনলোড বাটন ফাংশন
            document.getElementById('download-btn')?.addEventListener('click', () => {
               if (typeof window.html2canvas === 'undefined') {
                 alert('সিস্টেম প্রস্তুত হচ্ছে... একটু পর আবার ক্লিক করুন।');
                 return;
               }
               
               const btn = document.getElementById('download-btn');
               const originalText = btn.innerHTML;
               btn.innerHTML = 'ইমেজ তৈরি হচ্ছে... ⏳';
               
               const element = document.getElementById('epaper-canvas');
               
               // High Quality Canvas Rendering
               window.html2canvas(element, { 
                  scale: 2, 
                  useCORS: true,
                  backgroundColor: '#ffffff'
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

      {/* প্রিন্ট ও ডাউনলোড বাটন */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 print:hidden flex gap-3">
        <button 
          id="print-btn"
          className="bg-gray-700 text-white px-5 py-2.5 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.3)] font-bold text-[15px] flex items-center gap-2 hover:bg-gray-900 transition whitespace-nowrap border-[2px] border-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          প্রিন্ট করুন
        </button>
        <button 
          id="download-btn"
          className="bg-[#b91c1c] text-white px-6 py-2.5 rounded-full shadow-[0_10px_25px_rgba(185,28,28,0.4)] font-bold text-[15px] flex items-center gap-2 hover:bg-red-800 transition whitespace-nowrap border-[2px] border-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          হাই-কোয়ালিটি ইমেজ ডাউনলোড
        </button>
      </div>

      {/* --- ই-পেপার মূল ক্যানভাস (পাথরের মতো ফিক্সড ১১৫০ পিক্সেল) --- */}
      <div 
        id="epaper-canvas"
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
            
            {/* বাম দিকের তথ্য */}
            <div style={{ width: '250px' }} className="text-[14px] font-bold text-gray-700 leading-tight shrink-0">
              <p className="text-black text-[15px]">ঢাকা</p>
              <p>{dayName}, {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'long', day: 'numeric' }).format(today)}</p>
              <p className="mt-0.5 text-[#b91c1c]">৮ আষাঢ় ১৪৩৩ • ৬ মহররম ১৪৪৮</p>
            </div>

            {/* লোগো এবং অটোমেটিক বারের নাম */}
            <div className="shrink-0 flex flex-col items-center justify-center px-4">
               {/* দিনের নামসহ অটোমেটিক ডায়নামিক টেক্সট */}
               <span className="text-gray-600 font-bold text-[14px] tracking-[0.15em] mb-1.5 uppercase">
                  {dayName}ের প্রধান প্রধান খবরের শিরোনাম
               </span>
               <h1 className="text-[65px] font-black leading-none tracking-tight" style={{ transform: 'scaleY(1.05)' }}>
                  <span className="text-[#b91c1c]">বঙ্গীয়</span>
                  <span className="text-[#111827] ml-3">টাইমস</span>
               </h1>
            </div>

            {/* ডান দিকের তথ্য */}
            <div style={{ width: '250px' }} className="text-[14px] font-bold text-gray-700 text-right leading-tight shrink-0">
              <p>সম্পাদক</p>
              <p className="text-black text-[16px]">অ্যাডভোকেট মো: আজাদুর রহমান</p>
              <p className="mt-0.5 text-[#b91c1c]">হেডলাইন ডাইজেস্ট</p>
            </div>
            
          </div>
          
          <div className="bg-black text-white text-[15px] py-1 px-4 flex justify-between font-bold">
            <span>আজকের শীর্ষ সংবাদ: ছবি ও শিরোনামে</span>
            <span>www.bongiyotimes.com</span>
          </div>
        </header>

        {/* --- টপ সেকশন: ২টি বড় খবর --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }} className="mb-8 border-b-[2px] border-black pb-8">
          {leadNews.map((item: any) => (
            <div key={item.id} className="flex flex-col group border border-gray-100 p-2 shadow-sm bg-gray-50/50">
               <img src={item.image_url} alt={item.title} crossOrigin="anonymous" loading="eager" className="w-full h-[320px] object-cover mb-3 border border-gray-300 grayscale print:grayscale-0" />
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

        {/* --- গ্রিড সেকশন: ১২টি ছোট খবর --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {gridNews.map((item: any) => (
            <div key={item.id} className="flex flex-col group">
               <img src={item.image_url} alt={item.title} crossOrigin="anonymous" loading="eager" className="w-full h-[150px] object-cover mb-3 border border-gray-200 grayscale print:grayscale-0" />
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
