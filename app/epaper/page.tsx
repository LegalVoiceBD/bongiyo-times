import React from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Viewport } from 'next';
import Script from 'next/script';

export const revalidate = 60; 

// ক্যানভাস সাইজ: ৯২২ x ১১৫২ (Scale x2 করলে ১৮৪৪ x ২৩০৪ পিক্সেল হবে)
export const viewport: Viewport = {
  width: 922,
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// লেখা কাটার হাত থেকে বাঁচানোর জন্য কাস্টম ট্রাঙ্কেট ফাংশন
const truncateText = (str: string, maxLen: number) => {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
};

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
    <div className="min-h-screen bg-[#d1d5db] print:bg-white flex justify-center py-8 print:py-0 overflow-x-auto">
      
      {/* html2canvas লাইব্রেরি */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" strategy="lazyOnload" />
      
      <Script id="download-handler" strategy="lazyOnload">
        {`
          setTimeout(() => {
            document.getElementById('print-btn')?.addEventListener('click', () => {
               window.print();
            });

            document.getElementById('download-btn')?.addEventListener('click', () => {
               if (typeof window.html2canvas === 'undefined') {
                 alert('সিস্টেম প্রস্তুত হচ্ছে... একটু পর আবার ক্লিক করুন।');
                 return;
               }
               
               const btn = document.getElementById('download-btn');
               const originalText = btn.innerHTML;
               btn.innerHTML = 'উচ্চ মানের ইমেজ তৈরি হচ্ছে ⏳...';
               
               const element = document.getElementById('epaper-canvas');
               
               // ইমেজ প্রসেসিং কনফিগারেশন (CORS এনাবল করা হয়েছে যাতে ছবি সাদা না আসে)
               window.html2canvas(element, { 
                  scale: 2, 
                  useCORS: true,
                  backgroundColor: '#ffffff',
                  logging: false
               }).then(canvas => {
                  const link = document.createElement('a');
                  const dateInfo = new Date().toISOString().split('T')[0];
                  link.download = 'Bongiyo-Times-' + dateInfo + '.jpg';
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
          ফেসবুক সাইজ ইমেজ ডাউনলোড (1844x2304)
        </button>
      </div>

      {/* --- ই-পেপার মূল ক্যানভাস (Perfect 4:5 Aspect Ratio for Facebook) --- */}
      <div 
        id="epaper-canvas"
        style={{ width: '922px', height: '1152px', backgroundColor: '#ffffff', boxSizing: 'border-box', padding: '24px', display: 'flex', flexDirection: 'column' }} 
        className="shadow-[0_0_40px_rgba(0,0,0,0.15)] print:shadow-none shrink-0"
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.maateen.me/kalpurush/font.css');
          body { font-family: 'Kalpurush', Arial, sans-serif !important; }
        `}} />

        {/* --- ১. হেডারের ওপরের ৪টি নিউজের স্ট্রিপ --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', height: '75px', borderBottom: '2px solid black', paddingBottom: '12px', marginBottom: '16px' }}>
          {topStripNews.map((item: any) => (
            <div key={item.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
               <img src={item.image_url} alt="" loading="eager" style={{ width: '65px', height: '45px', objectFit: 'cover', border: '1px solid #d1d5db', filter: 'grayscale(100%)' }} />
               <div style={{ flex: 1 }}>
                  <span style={{ color: '#b91c1c', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>■ {item.category || 'সর্বশেষ'}</span>
                  <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#111827', lineHeight: '1.3', margin: 0 }}>
                    {truncateText(item.title, 45)}
                  </h3>
               </div>
            </div>
          ))}
        </div>

        {/* --- ২. মূল পত্রিকার হেডার --- */}
        <header style={{ height: '100px', borderBottom: '4px double black', paddingBottom: '10px', marginBottom: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            
            <div style={{ width: '240px', fontSize: '12px', fontWeight: 'bold', color: '#374151', lineHeight: '1.4' }}>
              <p style={{ color: 'black', fontSize: '14px', margin: 0 }}>ঢাকা</p>
              <p style={{ margin: 0 }}>{new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}</p>
              <p style={{ margin: 0 }}>৮ আষাঢ় ১৪৩৩ • ৬ মহররম ১৪৪৮</p>
            </div>

            {/* লোগো: Bulletproof ফ্লেক্সবক্স ডিজাইন (কখনো ভাঙবে না) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ fontSize: '50px', fontWeight: 'bold', color: '#b91c1c', letterSpacing: '-1px' }}>বঙ্গীয়</span>
               
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #b91c1c', margin: '0 10px', backgroundColor: 'white' }}>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: 'black', paddingTop: '4px' }}>টা</span>
               </div>
               
               <span style={{ fontSize: '50px', fontWeight: 'bold', color: 'black', letterSpacing: '-1px' }}>ইমস</span>
            </div>

            <div style={{ width: '240px', fontSize: '12px', fontWeight: 'bold', color: '#374151', textAlign: 'right', lineHeight: '1.4' }}>
              <p style={{ color: 'black', fontSize: '14px', margin: 0 }}>অ্যাডভোকেট মো: আজাদুর রহমান</p>
              <p style={{ margin: 0 }}>সম্পাদক ও প্রকাশক</p>
              <p style={{ margin: 0 }}>অনলাইন ডাইজেস্ট সংস্করণ</p>
            </div>
            
          </div>
          
          <div style={{ backgroundColor: 'black', color: 'white', fontSize: '13px', padding: '4px 16px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '10px' }}>
            <span>আজকের শীর্ষ সংবাদ: ছবি ও শিরোনামে</span>
            <span>www.bongiyotimes.com</span>
          </div>
        </header>

        {/* --- ৩. লিড সেকশন: ২টি বড় খবর --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', height: '320px', borderBottom: '2px solid black', paddingBottom: '16px', marginBottom: '16px' }}>
          {leadNews.map((item: any) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', padding: '10px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
               <div style={{ position: 'relative' }}>
                 <img src={item.image_url} alt="" loading="eager" style={{ width: '100%', height: '190px', objectFit: 'cover', marginBottom: '10px', border: '1px solid #d1d5db', filter: 'grayscale(100%)' }} />
                 <span style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px' }}>
                   ছবি: {item.source_name || 'সংগৃহীত'}
                 </span>
               </div>
               <span style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>■ {item.category || 'সর্বশেষ'}</span>
               <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'black', lineHeight: '1.2', margin: 0 }}>
                  {truncateText(item.title, 65)}
               </h2>
            </div>
          ))}
        </div>

        {/* --- ৪. গ্রিড সেকশন: ১২টি ছোট খবর (৪ কলামে) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 24px', flex: 1 }}>
          {gridNews.map((item: any) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
               <img src={item.image_url} alt="" loading="eager" style={{ width: '100%', height: '100px', objectFit: 'cover', marginBottom: '8px', border: '1px solid #e5e7eb', filter: 'grayscale(100%)' }} />
               <span style={{ color: '#b91c1c', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>■ {item.category || 'সর্বশেষ'}</span>
               <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#111827', lineHeight: '1.3', margin: 0 }}>
                  {truncateText(item.title, 55)}
               </h3>
            </div>
          ))}
        </div>

        {/* --- ৫. সেন্ট্রাল ফুটার --- */}
        <div style={{ height: '25px', marginTop: '12px', borderTop: '2px solid black', paddingTop: '8px', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', color: '#6b7280' }}>
          বঙ্গীয় টাইমস অনলাইন ডাইজেস্ট সংস্করণ কর্তৃক সংকলিত ও প্রকাশিত। বিস্তারিত খবর পড়তে ভিজিট করুন: <span style={{ color: 'black' }}>www.bongiyotimes.com</span>
        </div>

      </div>
    </div>
  );
}
