import React from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Viewport } from 'next';
import Script from 'next/script';

export const revalidate = 60; 

// মোবাইল ব্রাউজারকে ৯২২ পিক্সেল হিসেবে রেন্ডার করতে বাধ্য করবে
export const viewport: Viewport = {
  width: 922,
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
    .limit(18);

  const news = newsItems || [];
  
  const topStripNews = news.slice(0, 4);
  const leadNews = news.slice(4, 6);
  const gridNews = news.slice(6, 18);

  return (
    <div className="min-h-screen bg-[#d1d5db] print:bg-white flex justify-center overflow-x-auto py-8 print:py-0" style={{ WebkitOverflowScrolling: 'touch' }}>
      
      {/* HTML to Image Converter Script */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" strategy="lazyOnload" />
      
      <Script id="download-handler" strategy="lazyOnload">
        {`
          setTimeout(() => {
            // প্রিন্ট বাটন
            document.getElementById('print-btn')?.addEventListener('click', () => {
               window.print();
            });

            // ইমেজ ডাউনলোড বাটন (1844x2304 Output Size)
            document.getElementById('download-btn')?.addEventListener('click', () => {
               if (typeof window.html2canvas === 'undefined') {
                 alert('সিস্টেম লোড হচ্ছে... ২ সেকেন্ড পর আবার ক্লিক করুন।');
                 return;
               }
               
               const btn = document.getElementById('download-btn');
               const originalText = btn.innerHTML;
               btn.innerHTML = 'ইমেজ তৈরি হচ্ছে... ⏳';
               
               const element = document.getElementById('epaper-canvas');
               
               // Scale: 2 ব্যবহার করায় 922x1152 পিক্সেলের ক্যানভাসটি 1844x2304 পিক্সেলে সেভ হবে
               window.html2canvas(element, { 
                  scale: 2, 
                  useCORS: true,
                  allowTaint: false,
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
                  alert('ইমেজ তৈরি করতে সমস্যা হয়েছে। পেজটি রিলোড দিয়ে আবার চেষ্টা করুন।');
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
          ফেসবুক সাইজ ইমেজ ডাউনলোড (1844x2304)
        </button>
      </div>

      {/* --- ই-পেপার মূল ক্যানভাস (Facebook Aspect Ratio - 4:5 Mapping) --- */}
      {/* 922px width x 1152px height (Scale x2 = 1844 x 2304) */}
      <div 
        id="epaper-canvas"
        style={{ width: '922px', height: '1152px', backgroundColor: 'white', boxSizing: 'border-box' }} 
        className="p-6 shadow-[0_0_40px_rgba(0,0,0,0.15)] print:shadow-none shrink-0 flex flex-col"
      >
        
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.maateen.me/kalpurush/font.css');
          body { font-family: 'Kalpurush', Arial, sans-serif !important; }
        `}} />

        {/* --- ১. হেডারের ওপরের ৪টি নিউজের স্ট্রিপ --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="h-[60px] mb-4 pb-3 border-b-[2px] border-black shrink-0">
          {topStripNews.map((item: any) => (
            <div key={item.id} className="flex gap-2 items-start overflow-hidden">
               <img src={item.image_url} alt="" crossOrigin="anonymous" className="w-[65px] h-[45px] object-cover border border-gray-300 shadow-sm grayscale print:grayscale-0 shrink-0" />
               <div className="flex-1 flex flex-col justify-start">
                  <span className="text-[#b91c1c] text-[10px] font-bold uppercase block leading-none mb-0.5">■ {item.category || 'সর্বশেষ'}</span>
                  {/* টেক্সট কাটা ফিক্সড: ফিক্সড হাইট ও ওভারফ্লো হিডেন */}
                  <h3 className="text-[12.5px] font-bold text-gray-900 leading-[1.3] overflow-hidden" style={{ height: '32px' }}>
                    {item.title}
                  </h3>
               </div>
            </div>
          ))}
        </div>

        {/* --- ২. মূল পত্রিকার হেডার --- */}
        <header className="h-[95px] border-b-[4px] border-double border-black pb-2 mb-4 shrink-0 flex flex-col justify-between">
          <div className="flex justify-between items-end">
            
            <div style={{ width: '240px' }} className="text-[12px] font-bold text-gray-700 leading-snug shrink-0">
              <p className="text-black text-[14px]">ঢাকা</p>
              <p>{new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}</p>
              <p className="text-gray-500 mt-0.5">৮ আষাঢ় ১৪৩৩ • ৬ মহররম ১৪৪৮</p>
            </div>

            {/* লোগো ফিক্সড: html2canvas এর জন্য সম্পূর্ণ SVG ব্যবহার করা হয়েছে */}
            <div className="shrink-0 flex items-center justify-center px-4">
               <h1 className="text-[52px] font-extrabold flex items-center tracking-tighter" style={{ transform: 'scaleY(1.05)' }}>
                 <span className="text-[#b91c1c]">বঙ্গীয়</span>
                 
                 <div className="relative flex items-center justify-center w-[46px] h-[46px] mx-1.5 mt-1.5">
                    {/* SVG Clock Base */}
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                       <circle cx="50" cy="50" r="46" fill="none" stroke="#b91c1c" strokeWidth="8" />
                       <circle cx="50" cy="50" r="6" fill="#b91c1c" />
                       {/* ঘড়ির কাঁটা (স্থির) */}
                       <line x1="50" y1="50" x2="50" y2="22" stroke="#b91c1c" strokeWidth="6" strokeLinecap="round" />
                       <line x1="50" y1="50" x2="68" y2="68" stroke="#b91c1c" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                    <span className="relative z-10 text-black text-[34px] font-black leading-none pt-1" style={{ textShadow: '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff' }}>টা</span>
                 </div>
                 
                 <span className="text-black">ইমস</span>
               </h1>
            </div>

            <div style={{ width: '240px' }} className="text-[12px] font-bold text-gray-700 text-right leading-snug shrink-0">
              <p className="text-black text-[14px]">অ্যাডভোকেট মো: আজাদুর রহমান</p>
              <p>সম্পাদক ও প্রকাশক</p>
              <p className="mt-0.5 text-gray-500">অনলাইন ডাইজেস্ট সংস্করণ</p>
            </div>
            
          </div>
          
          <div className="bg-black text-white text-[13px] py-1 px-4 flex justify-between items-center font-bold">
            <span>আজকের শীর্ষ সংবাদ: ছবি ও শিরোনামে</span>
            <span>www.bongiyotimes.com</span>
          </div>
        </header>

        {/* --- ৩. লিড সেকশন: ২টি বড় খবর --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }} className="h-[280px] mb-5 border-b-[2px] border-black pb-5 shrink-0">
          {leadNews.map((item: any) => (
            <div key={item.id} className="flex flex-col group p-2.5 bg-gray-50 border border-gray-200 h-full overflow-hidden">
               <div className="relative shrink-0">
                 <img src={item.image_url} alt="" crossOrigin="anonymous" className="w-full h-[180px] object-cover mb-2.5 border border-gray-300 grayscale print:grayscale-0" />
                 <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                   ছবি: {item.source_name || 'সংগৃহীত'}
                 </span>
               </div>
               <span className="text-[#b91c1c] font-bold text-[12px] uppercase tracking-wider mb-1 block">■ {item.category || 'সর্বশেষ'}</span>
               <h2 className="text-[26px] font-extrabold text-black leading-[1.2] overflow-hidden" style={{ height: '62px' }}>
                  {item.title}
               </h2>
            </div>
          ))}
        </div>

        {/* --- ৪. গ্রিড সেকশন: ১২টি ছোট খবর (৪ কলামে) --- */}
        <div className="flex-1 overflow-hidden" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px', alignContent: 'start' }}>
          {gridNews.map((item: any) => (
            <div key={item.id} className="flex flex-col border-b border-gray-100 pb-2">
               <img src={item.image_url} alt="" crossOrigin="anonymous" className="w-full h-[100px] object-cover mb-2 border border-gray-200 grayscale print:grayscale-0 shrink-0" />
               <span className="text-[#b91c1c] font-bold text-[11px] uppercase tracking-wider mb-1 block shrink-0">■ {item.category || 'সর্বশেষ'}</span>
               {/* টেক্সট ফিক্সড: সর্ব্বোচ্চ ৩ লাইন দেখাবে */}
               <h3 className="text-[16px] font-extrabold text-[#222] leading-[1.25] overflow-hidden" style={{ height: '60px' }}>
                  {item.title}
               </h3>
            </div>
          ))}
        </div>

        {/* --- ৫. সেন্ট্রাল ফুটার --- */}
        <div className="h-[30px] mt-3 border-t-[2px] border-black pt-1.5 text-center text-[11.5px] font-bold text-gray-500 shrink-0">
          বঙ্গীয় টাইমস অনলাইন ডাইজেস্ট সংস্করণ কর্তৃক সংকলিত ও প্রকাশিত। বিস্তারিত খবর পড়তে ভিজিট করুন: <span className="text-black">www.bongiyotimes.com</span>
        </div>

      </div>
    </div>
  );
}
