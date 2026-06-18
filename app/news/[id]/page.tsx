import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: news } = await supabase.from('news').select('*').eq('id', params.id).single();

  if (!news) return { title: 'খবর পাওয়া যায়নি | বঙ্গীয় টাইমস' };

  return {
    title: `${news.title} | বঙ্গীয় টাইমস`,
    description: news.snippet,
    openGraph: {
      title: news.title,
      description: news.snippet,
      url: `https://www.bongiyotimes.com/news/${news.id}`,
      siteName: 'বঙ্গীয় টাইমস',
      images: [{ url: news.image_url, width: 1200, height: 630, alt: news.title }],
      locale: 'bn_BD',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: news.title,
      description: news.snippet,
      images: [news.image_url],
    },
  };
}

function formatProthomAloDate(dateString: string) {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false };
  return date.toLocaleDateString('bn-BD', options).replace(',', ' •');
}

export default async function NewsDetail({ params }: { params: { id: string } }) {

  const { data: news } = await supabase.from('news').select('*').eq('id', params.id).single();
  const { data: latestForHeader } = await supabase.from('news').select('*').order('created_at', { ascending: false }).limit(3);
  const headerNews = latestForHeader || [];

  let relatedNews: any[] = [];
  if (news) {
     const { data } = await supabase.from('news').select('*').eq('category', news.category).neq('id', news.id).order('created_at', { ascending: false }).limit(6);
     relatedNews = data || [];
  }

  if (!news) {
    return <div className="text-center p-20 text-2xl font-bold mt-20">খবরটি পাওয়া যায়নি অথবা মুছে ফেলা হয়েছে।</div>;
  }

  const menuCategories = ["সর্বশেষ", "বাংলাদেশ", "রাজনীতি", "আন্তর্জাতিক", "মতামত", "খেলাধুলা", "বাণিজ্য", "বিনোদন", "আইন-আদালত", "জীবনযাপন", "শিক্ষা", "চাকরি", "প্রযুক্তি", "ফিচার", "হাস্যরস"];
  const currentUrl = `https://www.bongiyotimes.com/news/${news.id}`;

  return (
    <div className="min-h-screen bg-white text-black tracking-tight">
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.maateen.me/kalpurush/font.css');
        body { font-family: 'Kalpurush', Arial, sans-serif !important; }
      `}} />

      {/* Header Section */}
      <header className="bg-white">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="md:hidden text-center text-[13px] text-gray-500 w-full mb-[-10px] font-bold">
            {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
          </div>

          <div className="shrink-0 flex items-center">
             <a href="/" className="group">
               <h1 className="text-4xl md:text-[42px] font-extrabold text-black flex items-center tracking-tighter">
                 বঙ্গীয়
                 <div className="relative flex items-center justify-center w-[36px] h-[36px] md:w-[44px] md:h-[44px] mx-1">
                   <div className="absolute inset-0 rounded-full border-[2.5px] md:border-[3px] border-red-600"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute w-[5px] h-[5px] bg-red-600 rounded-full"></div>
                      <div className="absolute w-[2px] h-[35%] bg-red-600 origin-bottom bottom-1/2 rounded-t-full animate-[spin_4s_linear_infinite]"></div>
                      <div className="absolute w-[2.5px] h-[25%] bg-red-600 origin-bottom bottom-1/2 rounded-t-full animate-[spin_24s_linear_infinite] rotate-[45deg]"></div>
                   </div>
                   <span className="relative z-10 text-black text-[26px] md:text-[32px] font-black leading-none pt-1" style={{ textShadow: '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff' }}>টা</span>
                 </div>
                 ইমস
               </h1>
             </a>
             <span className="hidden md:block text-[14px] text-gray-500 border-l-[2px] border-gray-300 pl-3 ml-3 mt-1 font-bold">
                {new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
             </span>
          </div>
          
          <div className="hidden lg:flex divide-x divide-gray-300">
             {headerNews.map((hn: any, index: number) => (
                <a href={hn.is_custom ? `/news/${hn.id}` : hn.source_url} target="_blank" key={index} className="flex gap-3 px-4 w-[250px] group">
                   <div className="flex-1">
                      <p className="text-xs text-red-600 mb-1">■ {hn.category}</p>
                      <h3 className="text-[15px] leading-tight font-semibold group-hover:text-[#104f96] line-clamp-2">{hn.title}</h3>
                   </div>
                   <img src={hn.image_url} alt={hn.title} className="w-16 h-16 object-cover border border-gray-100" />
                </a>
             ))}
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="border-t border-b border-gray-300 sticky top-0 z-50 bg-white shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center h-12 relative overflow-hidden">
            
            <div className="flex-1 min-w-0 h-full flex items-center pr-4">
               <nav className="flex items-center gap-5 md:gap-6 lg:gap-7 overflow-x-auto text-[17px] lg:text-[19px] font-bold text-black w-full pb-1 custom-scrollbar tracking-wide">
                 <a href="/" className="h-12 flex items-center transition-colors hover:text-[#104f96] whitespace-nowrap shrink-0">প্রচ্ছদ</a>
                 {menuCategories.map((cat, index) => (
                   <a 
                     key={index} 
                     href={`/?category=${cat}`} 
                     className={`hover:text-[#104f96] whitespace-nowrap shrink-0 ${news.category === cat ? 'text-[#104f96] border-b-[3px] border-[#104f96] h-12 flex items-center' : 'h-12 flex items-center transition-colors'}`}
                   >
                      {cat}
                   </a>
                 ))}
               </nav>
            </div>
            
            {/* প্রফেশনাল সার্চ অপশন */}
            <div className="hidden md:flex items-center border-l border-gray-200 pl-5 h-full shrink-0 bg-white z-10">
               <form action="/" method="GET" className="relative flex items-center group">
                  <input 
                     type="text" 
                     name="q" 
                     placeholder="খবর খুঁজুন..." 
                     className="w-48 lg:w-64 pl-4 pr-10 py-1.5 bg-[#f4f7fc] border border-transparent focus:border-[#104f96] focus:bg-white text-[15px] rounded-full outline-none transition-all duration-300 placeholder-gray-500 font-normal text-gray-800 shadow-inner" 
                     required
                  />
                  <button type="submit" className="absolute right-3 text-gray-400 group-hover:text-[#104f96] focus:text-[#104f96] transition-colors flex items-center justify-center cursor-pointer">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                     </svg>
                  </button>
               </form>
            </div>
            
          </div>
        </div>
      </header>

      {/* Prothom Alo Style Breadcrumb */}
      <div className="max-w-[1200px] mx-auto px-4 py-4 text-[15px] font-bold text-gray-500 flex gap-2 items-center">
         <a href="/" className="hover:text-[#104f96]">প্রচ্ছদ</a> 
         <span className="text-gray-400">❯</span>
         <a href={`/?category=${news.category}`} className="hover:text-[#104f96] text-black">{news.category}</a>
      </div>

      {/* Main Article Content */}
      <main className="max-w-[1200px] mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         <article className="lg:col-span-8">
            <h1 className="text-[32px] md:text-[44px] font-extrabold leading-[1.25] text-gray-900 mb-5">{news.title}</h1>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-y border-gray-200 py-3 mb-6">
               <div className="flex flex-col text-[15px] text-gray-600">
                  <span className="font-bold text-gray-800">{news.source_name || 'নিজস্ব প্রতিবেদক'}</span>
                  <span>প্রকাশ: {formatProthomAloDate(news.created_at)}</span>
               </div>
               
               {/* Minimal Social Share Buttons */}
               <div className="flex items-center gap-3">
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noopener noreferrer" 
                     className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:text-[#1877f2] hover:border-[#1877f2] transition">
                     <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(news.title + " \n\nবিস্তারিত পড়ুন: " + currentUrl)}`} target="_blank" rel="noopener noreferrer" 
                     className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:text-[#25d366] hover:border-[#25d366] transition">
                     <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 0C5.383 0 0 5.383 0 12.031c0 2.628.847 5.066 2.274 7.07L.707 23.293l4.316-1.524A11.97 11.97 0 0012.031 24c6.648 0 12.031-5.383 12.031-12.031S18.679 0 12.031 0zm0 21.969c-2.127 0-4.14-.543-5.908-1.503l-.423-.231-3.13 1.104 1.125-3.085-.251-.433A9.92 9.92 0 012.062 12.03C2.062 6.529 6.53 2.063 12.03 2.063c5.501 0 9.969 4.466 9.969 9.968 0 5.502-4.468 9.969-9.969 9.969z"/><path d="M17.472 14.391c-.275-.138-1.625-.802-1.876-.893-.25-.091-.432-.138-.613.138-.182.275-.708.893-.867 1.075-.16.183-.32.206-.594.069-.275-.138-1.158-.427-2.204-1.356-.813-.722-1.36-1.614-1.52-1.89-.16-.275-.017-.425.121-.563.124-.124.275-.321.413-.482.138-.16.184-.275.276-.459.092-.183.046-.344-.023-.482-.069-.138-.613-1.479-.84-2.025-.221-.532-.444-.459-.613-.468-.16-.008-.344-.009-.527-.009-.184 0-.482.069-.733.344-.25.275-.957.935-.957 2.279 0 1.344.98 2.645 1.117 2.828.138.183 1.93 2.946 4.674 4.129 2.744 1.183 2.744.79 3.248.745.503-.046 1.625-.664 1.854-1.308.23-.645.23-1.196.16-1.308-.07-.113-.254-.182-.529-.321z"/></svg>
                  </a>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(news.title)}`} target="_blank" rel="noopener noreferrer" 
                     className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:text-black hover:border-black transition">
                     <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
               </div>
            </div>
            
            <figure className="mb-8">
               <img src={news.image_url} alt={news.title} className="w-full h-auto max-h-[600px] object-cover" />
               {news.image_source && (
                  <figcaption className="text-[14px] text-gray-500 mt-3 flex items-center gap-1">
                     <span className="font-bold">ছবি:</span> {news.image_source}
                  </figcaption>
               )}
            </figure>
            
            <div className="text-[20px] md:text-[22px] leading-[1.9] text-[#333333] whitespace-pre-wrap">
               {news.content || news.snippet}
               {!news.content && (
                  <p className="mt-8 font-bold text-[#104f96]">
                     <a href={news.source_url} target="_blank" className="hover:underline">বিস্তারিত পড়তে মূল লিংকে ক্লিক করুন ❯</a>
                  </p>
               )}
            </div>
         </article>

         {/* Sidebar Content */}
         <aside className="lg:col-span-4 lg:pl-4">
            <div className="w-full min-h-[250px] bg-gray-50 border border-gray-200 flex flex-col items-center justify-center mb-8 text-gray-400 font-bold">
               <span className="text-xs mb-2">বিজ্ঞাপন</span>
            </div>

            <div className="mt-8">
               <div className="border-b-[2px] border-black pb-2 mb-5">
                  <h3 className="text-[20px] font-bold text-gray-900">আরও খবর</h3>
               </div>
               <div className="flex flex-col gap-5">
                  {relatedNews.map((rel: any) => (
                     <a href={`/news/${rel.id}`} key={rel.id} className="group flex gap-4 items-start border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                        <div className="flex-1">
                           <h4 className="text-[17px] font-bold text-gray-800 group-hover:text-[#104f96] leading-snug">
                              {rel.title}
                           </h4>
                           <p className="text-[13px] text-gray-500 mt-2">{formatProthomAloDate(rel.created_at).split(' •')[0]}</p>
                        </div>
                        <img src={rel.image_url} alt={rel.title} className="w-[110px] h-[75px] object-cover shrink-0 border border-gray-100" />
                     </a>
                  ))}
               </div>
            </div>
         </aside>

      </main>

     {/* Footer Section */}
      <footer className="bg-white border-t-4 border-red-700 mt-12 pt-8 pb-6 text-black text-center shadow-inner">
        <div className="max-w-[1200px] mx-auto px-4">
          
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5 text-[15px] md:text-[17px] font-bold mb-6 border-b border-gray-300 pb-4">
             <a href="/" className="hover:text-red-700 transition">প্রচ্ছদ</a> <span className="text-gray-300">|</span>
             <a href="/privacy" className="hover:text-red-700 transition">গোপনীয়তার নীতি</a> <span className="text-gray-300">|</span>
             <a href="/terms" className="hover:text-red-700 transition">শর্তাবলি</a> <span className="text-gray-300">|</span>
             <a href="/contact" className="hover:text-red-700 transition text-[#104f96]">বিজ্ঞাপন</a> <span className="text-gray-300">|</span>
             <a href="/contact" className="hover:text-red-700 transition">যোগাযোগ</a>
          </div>

          <div className="mb-6">
             <p className="text-[17px] md:text-[18px] font-bold text-gray-900 leading-snug">
               <span className="block md:inline">সম্পাদক ও প্রকাশক :</span> 
               <span className="block md:inline md:ml-1">অ্যাডভোকেট মো: আজাদুর রহমান</span>
             </p>
             <div className="text-[14px] md:text-[15px] text-gray-700 font-bold mt-3 flex flex-col md:flex-row justify-center items-center gap-1.5 md:gap-3">
               <span>মোবাইল: <a href="tel:09696790279" className="text-red-700 hover:underline">০৯৬৯৬ ৭৯০২৭৯</a></span> 
               <span className="hidden md:inline text-gray-300">|</span> 
               <span>ইমেইল: <a href="mailto:bongiyotimes@gmail.com" className="hover:underline text-[#104f96]">bongiyotimes@gmail.com</a></span>
             </div>
          </div>

          <div className="border-t border-gray-300 pt-5">
             <p className="text-[13px] md:text-[15px] leading-relaxed text-gray-800 font-medium max-w-4xl mx-auto mb-3">
               বাংলাদেশ ও বিশ্বের সকল খবর, ব্রেকিং নিউজ, লাইভ নিউজ, রাজনীতি, বাণিজ্য, খেলা, বিনোদনসহ সকল সর্বশেষ সংবাদ সবার আগে পড়তে ক্লিক করুন বঙ্গীয় টাইমস ডট কম।
             </p>
             <p className="text-[13px] md:text-[14px] text-gray-500 font-bold">&copy; {new Date().getFullYear()} বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
          </div>
          
        </div>
      </footer>
    </div>
  );
}
