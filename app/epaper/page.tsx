import React from 'react';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 60; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default async function EPaperPage() {
  // পত্রিকার প্রথম পাতা ভরার জন্য ১৪টি খবর আনা হচ্ছে
  const { data: newsItems } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(14);

  const news = newsItems || [];
  
  // নিউজপেপার গ্রিড অনুযায়ী খবর ভাগ করা
  const leadNews = news[0]; // প্রধান খবর (মাঝখানে বড় করে থাকবে)
  const leftSideNews = news.slice(1, 3); // বাম কলামের খবর
  const rightSideNews = news.slice(3, 5); // ডান কলামের খবর
  const bottomNews = news.slice(5, 13); // নিচের দিকের খবর

  return (
    <div className="min-h-screen bg-[#d1d5db] flex flex-col items-center print:bg-white overflow-x-hidden">
      
      {/* ই-পেপার ডাউনলোড বাটন */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        <button 
          onClick="window.print()" 
          className="bg-[#b91c1c] text-white px-5 py-3 rounded-md shadow-2xl font-bold text-[16px] flex items-center gap-2 hover:bg-red-800 transition border border-red-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          প্রিন্ট / সেভ করুন
        </button>
      </div>

      {/* 
        অটো-জুম কন্টেইনার: এই কোডটি মোবাইল স্ক্রিনে পুরো পত্রিকাকে পিডিএফের মতো ফিট করে দেবে। 
        পত্রিকাটি সবসময় ১০০০ পিক্সেল চওড়া থাকবে।
      */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.maateen.me/kalpurush/font.css');
        body { font-family: 'Kalpurush', Arial, sans-serif !important; }
        @page { size: A3; margin: 10mm; }
        
        .epaper-container {
           width: 1000px;
           background: white;
           margin: 20px auto;
           padding: 25px;
           box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        
        @media screen and (max-width: 1000px) {
           .epaper-container {
              zoom: calc(100vw / 1000);
              margin: 0;
              box-shadow: none;
           }
        }
        
        @media print {
           .epaper-container { zoom: 1; margin: 0; padding: 0; box-shadow: none; }
        }
      `}} />

      {/* --- ই-পেপার মূল ক্যানভাস (১০০০ পিক্সেল ফিক্সড) --- */}
      <main className="epaper-container">
        
        {/* --- ১. পত্রিকার হেডার (নয়া দিগন্ত/প্রথম আলো স্টাইল) --- */}
        <header className="mb-4">
          <div className="flex justify-between items-center mb-3">
            
            {/* বাম দিকের ইয়ার (Ear Box) */}
            <div className="w-[200px] border border-gray-400 p-2 text-center">
               <p className="text-[13px] font-bold text-gray-800 leading-snug">
                 সর্বশেষ খবরের জন্য ভিজিট করুন<br/>
                 <span className="text-[#b91c1c] text-[15px]">www.bongiyotimes.com</span>
               </p>
            </div>

            {/* মাঝখানের মূল লোগো */}
            <div className="relative z-10 flex items-baseline justify-center px-4">
               <h1 className="text-[60px] font-extrabold text-[#b91c1c] leading-none tracking-tight" style={{ transform: 'scaleY(1.05)' }}>
                  বঙ্গীয়
               </h1>
               <div className="relative ml-2.5">
                  <div className="absolute -top-[18px] left-[5px] w-[40px] z-0 opacity-95">
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
                  <h1 className="relative z-10 text-[60px] font-extrabold text-[#333333] leading-none tracking-tight" style={{ transform: 'scaleY(1.05)' }}>
                    টাইমস
                  </h1>
               </div>
            </div>

            {/* ডান দিকের ইয়ার (Ear Box) - প্রকাশের তথ্য */}
            <div className="w-[200px] text-right text-[13px] font-bold text-gray-800 leading-tight">
               <p className="text-[14px]">ঢাকা</p>
               <p>{new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long' }).format(new Date())}, {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}</p>
               <p className="mt-1">সম্পাদক: মো: আজাদুর রহমান</p>
            </div>
            
          </div>
          
          {/* নীল রঙের স্ট্রিপ (প্রথম আলোর মতো) */}
          <div className="bg-[#1e3a8a] text-white py-1 px-4 flex justify-between items-center border-y-[3px] border-black">
             <div className="text-[14px] font-bold">আজকের প্রধান সংবাদ ও হেডলাইন ডাইজেস্ট</div>
             <div className="text-[14px] font-bold">পৃষ্ঠা ১ | মূল্য ১০ টাকা</div>
          </div>
        </header>

        {/* --- ২. মূল খবর সেকশন (৪ কলামের পত্রিকা লেআউট) --- */}
        <div className="grid grid-cols-4 gap-5 border-b-[4px] border-double border-black pb-6 mb-6">
           
           {/* বাম কলাম (১ম কলাম) */}
           <div className="col-span-1 flex flex-col gap-5 border-r border-gray-400 pr-5">
              {leftSideNews.map((item: any) => (
                 <div key={item.id} className="border-b border-gray-300 pb-4 last:border-0 last:pb-0">
                    <span className="text-[#b91c1c] font-bold text-[12px] uppercase block mb-1">■ {item.category}</span>
                    <h2 className="text-[22px] font-bold text-black leading-[1.2] mb-2 hover:text-[#104f96]">
                       <a href={item.is_custom ? `/news/${item.id}` : item.source_url} target="_blank">{item.title}</a>
                    </h2>
                    <img src={item.image_url} alt={item.title} className="w-full h-[130px] object-cover grayscale print:grayscale-0 border border-gray-200" />
                 </div>
              ))}
           </div>

           {/* মাঝের লিড নিউজ (২য় ও ৩য় কলাম মিলিয়ে বিশাল খবর) */}
           {leadNews && (
             <div className="col-span-2 px-2 flex flex-col items-center">
                <span className="text-white bg-[#b91c1c] font-bold text-[13px] px-3 py-0.5 rounded-sm mb-3">{leadNews.category}</span>
                <h1 className="text-[46px] font-extrabold text-[#b91c1c] leading-[1.15] mb-4 text-center tracking-tight">
                   <a href={leadNews.is_custom ? `/news/${leadNews.id}` : leadNews.source_url} target="_blank">{leadNews.title}</a>
                </h1>
                <div className="w-full relative">
                   <img src={leadNews.image_url} alt={leadNews.title} className="w-full h-[320px] object-cover border border-gray-300 grayscale print:grayscale-0" />
                   <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[11px] px-2 py-0.5 font-bold">ছবি: {leadNews.source_name || 'সংগৃহীত'}</div>
                </div>
             </div>
           )}

           {/* ডান কলাম (৪র্থ কলাম) */}
           <div className="col-span-1 flex flex-col gap-5 border-l border-gray-400 pl-5">
              {rightSideNews.map((item: any) => (
                 <div key={item.id} className="border-b border-gray-300 pb-4">
                    <span className="text-[#b91c1c] font-bold text-[12px] uppercase block mb-1">■ {item.category}</span>
                    <h2 className="text-[22px] font-bold text-black leading-[1.2] mb-2 hover:text-[#104f96]">
                       <a href={item.is_custom ? `/news/${item.id}` : item.source_url} target="_blank">{item.title}</a>
                    </h2>
                    <img src={item.image_url} alt={item.title} className="w-full h-[130px] object-cover grayscale print:grayscale-0 border border-gray-200" />
                 </div>
              ))}
              
              {/* পত্রিকার মতো একটি ফেক বিজ্ঞাপন স্লট */}
              <div className="w-full h-[100px] border-[2px] border-dashed border-gray-400 flex items-center justify-center bg-gray-100">
                 <span className="text-gray-400 font-bold text-[14px]">বিজ্ঞাপন স্পেস</span>
              </div>
           </div>
           
        </div>

        {/* --- ৩. নিচের সেকশন (আরও ৮টি খবর ৪ কলামে) --- */}
        <div className="grid grid-cols-4 gap-x-6 gap-y-6">
           {bottomNews.map((item: any, index: number) => (
              <div key={item.id} className={`flex flex-col group ${index % 4 !== 3 ? 'border-r border-gray-300 pr-6' : ''}`}>
                 <img src={item.image_url} alt={item.title} className="w-full h-[120px] object-cover mb-2 border border-gray-200 grayscale print:grayscale-0" />
                 <span className="text-gray-500 font-bold text-[11px] mb-1">{item.source_name || 'সংগৃহীত'}</span>
                 <h3 className="text-[19px] font-bold text-black leading-[1.25] group-hover:text-[#b91c1c]">
                    <a href={item.is_custom ? `/news/${item.id}` : item.source_url} target="_blank">{item.title}</a>
                 </h3>
              </div>
           ))}
        </div>

        {/* --- ৪. প্রিন্ট ফুটার --- */}
        <div className="mt-8 border-t-[2px] border-black pt-3 flex justify-between items-center text-[12px] font-bold text-gray-700">
           <div>সম্পাদক ও প্রকাশক কর্তৃক বঙ্গীয় টাইমস প্রকাশনা থেকে প্রকাশিত।</div>
           <div>যোগাযোগ: ০১৬**** | ইমেইল: bongiyotimes@gmail.com</div>
        </div>

      </main>
    </div>
  );
}
