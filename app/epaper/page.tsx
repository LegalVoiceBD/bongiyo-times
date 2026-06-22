import React from 'react';

export default function Home() {
  // উদাহরণস্বরূপ ডাইনামিক ডেটা (যা পরবর্তীতে সুপাবেজ থেকে fetch করা যাবে)
  const leadNews = {
    title: "নেইমার! কোনো ব্যাপারই না: হুংকার স্কটল্যান্ডের ডিফেন্ডারের",
    category: "খেলাধুলা",
    source: "BD Pratidin",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60", // স্যাম্পল ইমেজ
    summary: "আসন্ন ম্যাচে নেইমারকে আটকানো কোনো কঠিন কাজ হবে না বলে মন্তব্য করেছেন স্কটল্যান্ডের তারকা ডিফেন্ডার। তিনি জানান, দলগত প্রচেষ্টায় যেকোনো আক্রমণভাগের খেলোয়াড়কে প্রতিহত করা সম্ভব..."
  };

  const otherNews = [
    { id: 1, title: "প্রধানমন্ত্রীকে লালগালিচা সংবর্ধনা: আনোয়ার ইব্রাহিমের সাথে বৈঠক", category: "জাতীয়" },
    { id: 2, title: "ইলিয়াসকে 'হজমের' কথা ফোনে জানান জিয়াউল: চাঞ্চল্যকর জবানবন্দি", category: "রাজনীতি" },
    { id: 3, title: "বছরে এলএনজি আমদানিতে ব্যয় ৪৭ হাজার কোটি টাকা", category: "অর্থনীতি" },
    { id: 4, title: "মধ্যপ্রাচ্যে শ্রমবাজারের সঙ্গে গুরুত্ব পাবে বিনিয়োগ ও বাণিজ্য", category: "আন্তর্জাতিক" }
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#111111] antialiased">
      
      {/* ক্লাসিক নিউজপেপার হেডার সেকশন */}
      <header className="bg-white border-b-4 border-double border-black max-w-7xl mx-auto px-4 py-4 mt-2">
        
        {/* টপ মেটা ইনফো (মোবাইলে সিঙ্গেল কলাম, ডেক্সটপে ৩ কলামে ভাগ হবে) */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center border-b border-gray-300 pb-3 text-xs md:text-sm text-gray-600 gap-4 text-center md:text-left">
          
          {/* বাম কলাম: স্থান ও তারিখ */}
          <div>
            <p className="font-bold text-gray-800 text-sm">ঢাকা</p>
            <p className="font-medium">সোমবার, ২২ জুন, ২০২৬</p>
            <p className="text-gray-400 text-[10px] mt-0.5">এক নজরে শিরোনাম সংস্করণ</p>
          </div>
          
          {/* মাঝের কলাম: লোগো (প্রথম আলোর আদলে ক্লাসিক টেক্সট বা ইমেজ) */}
          <div className="text-center">
            <a href="/" className="text-3xl md:text-5xl font-black tracking-tight block select-none">
              <span className="text-black">বঙ্গীয়</span> <span className="text-[#b30000]">টাইমস</span>
            </a>
          </div>
          
          {/* ডান কলাম: সম্পাদক পরিচিতি */}
          <div className="md:text-right text-xs">
            <p className="font-medium text-gray-500">সম্পাদক ও প্রকাশক</p>
            <p className="font-bold text-gray-900 text-sm">এডভোকেট মো: আজাদুর রহমান</p>
            <p className="text-[#b30000] font-bold text-[10px] tracking-widest mt-0.5 uppercase">হেডলাইন ডাইজেস্ট</p>
          </div>
        </div>
        
        {/* ব্ল্যাক ব্যানার নিউজ টিকার */}
        <div className="bg-black text-white text-center py-2 px-4 mt-3 text-xs md:text-sm font-semibold tracking-wide flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>আজকের শীর্ষ সংবাদ: ছবি ও শিরোনামে</span>
          <span className="text-gray-400 text-xs hover:text-white transition-colors">www.bongiyotimes.com</span>
        </div>
      </header>

      {/* মূল নিউজ গ্রিড লেআউট */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white p-4 md:p-6 border border-gray-200 shadow-sm">
          
          {/* লিড নিউজ এরিয়া (ডেক্সটপে ৪ ভাগের ৩ ভাগ জায়গা নেবে) */}
          <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-gray-200 pb-6 lg:pb-0 lg:pr-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="bg-[#b30000] text-white px-2 py-0.5 text-xs font-bold rounded-sm">
                {leadNews.category}
              </span>
              <span className="text-gray-500 text-xs font-medium">উৎস: {leadNews.source}</span>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-black leading-tight text-black mb-4 hover:text-[#0056b3] cursor-pointer transition-colors">
              {leadNews.title}
            </h1>
            
            {/* ইমেজ কন্টেইনার (মোবাইলে ওভারফ্লো বা জুম রোধ করতে aspect-ratio সেট করা) */}
            <div className="relative w-full aspect-video md:aspect-[21/9] overflow-hidden bg-gray-100 border border-gray-200 mb-4 rounded-sm">
              <img 
                src={leadNews.imageUrl} 
                alt="Lead Feature" 
                className="w-full h-full object-cover block hover:scale-101 transition-transform duration-300"
              />
            </div>
            
            <p className="text-gray-700 text-sm md:text-base leading-relaxed font-normal text-justify">
              {leadNews.summary}
            </p>
          </div>

          {/* সাইডবার: অন্যান্য এগ্রিগেটেড নিউজ (১ ভাগ জায়গা নেবে) */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-base font-black border-b-2 border-black pb-1 text-black tracking-wide uppercase mb-3">
                সর্বশেষ আপডেট
              </h2>
              
              {/* নিউজ লিস্ট */}
              <div className="divide-y divide-gray-100">
                {otherNews.map((news) => (
                  <div key={news.id} className="py-3 first:pt-0 last:pb-0 group cursor-pointer">
                    <span className="text-[10px] font-bold text-[#b30000] block uppercase tracking-wide mb-1">
                      {news.category}
                    </span>
                    <h3 className="text-sm md:text-base font-bold text-gray-950 group-hover:text-[#0056b3] transition-colors leading-snug">
                      {news.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
            
            {/* ডাউনলোড/সেভ অ্যাকশন বক্স */}
            <div className="bg-[#b30000] text-white p-4 text-center rounded-sm shadow-sm mt-auto">
              <p className="text-xs font-medium mb-2.5">আজকের সংস্করণটি অফলাইনে সংরক্ষণ করুন</p>
              <button className="w-full bg-white text-[#b30000] font-bold text-xs py-2 px-4 rounded-sm shadow-sm hover:bg-gray-50 active:scale-98 transition-all flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                ই-পেপার সেভ / ডাউনলোড করুন
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ফুটার সেকশন */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} বঙ্গীয় টাইমস. সর্বস্বত্ব সংরক্ষিত।</p>
        <p className="mt-1 text-[10px] text-gray-300">Powered by Next.js, Supabase & Vercel</p>
      </footer>
    </div>
  );
}
