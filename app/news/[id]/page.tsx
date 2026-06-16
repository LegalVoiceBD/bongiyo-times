import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

// ডাটাবেস ক্র্যাশ রোধ করার জন্য revalidate 0 এর বদলে 60 (১ মিনিট) করে দেওয়া হলো। 
// চাইলে আপনি 0 রাখতে পারেন, তবে প্রফেশনাল সাইটে 60 রাখা উত্তম।
export const revalidate = 60;

// সুপাবেজ ক্লায়েন্ট সেটআপ
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// ডাইনামিক মেটাডেটা জেনারেট করার কোড (সোশ্যাল মিডিয়ায় লিংক শেয়ার করলে ছবি ও টাইটেল দেখানোর জন্য)
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: news } = await supabase
    .from('news')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!news) {
    return { title: 'খবর পাওয়া যায়নি | বঙ্গীয় টাইমস' };
  }

  return {
    title: `${news.title} | বঙ্গীয় টাইমস`,
    description: news.snippet,
    openGraph: {
      title: news.title,
      description: news.snippet,
      url: `https://www.bongiyotimes.com/news/${news.id}`,
      siteName: 'বঙ্গীয় টাইমস',
      images: [
        {
          url: news.image_url,
          width: 1200,
          height: 630,
          alt: news.title,
        },
      ],
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

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

export default async function NewsDetail({ params }: { params: { id: string } }) {

  const { data: news } = await supabase.from('news').select('*').eq('id', params.id).single();

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

      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <a href="/" className="flex flex-col items-center md:items-start shrink-0">
            <h1 className="text-4xl md:text-5xl font-extrabold text-red-700 tracking-tighter">বঙ্গীয় <span className="text-black">টাইমস</span></h1>
          </a>
          
          <form method="GET" action="/" className="w-full md:w-[350px] flex items-center border border-gray-300 rounded-sm overflow-hidden shadow-sm">
             <input type="text" name="q" placeholder="খবর খুঁজুন..." className="w-full px-4 py-2 text-sm outline-none font-bold" required />
             <button type="submit" className="bg-red-700 text-white px-4 py-2 font-bold hover:bg-red-800 transition">সার্চ</button>
          </form>

        </div>
        <div className="border-t border-gray-200 shadow-sm sticky top-0 z-50 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 overflow-x-auto scrollbar-hide">
            <nav className="flex items-center min-w-max py-2 md:py-3 text-[16px] font-bold text-gray-800 gap-5">
              <a href="/" className="hover:text-red-600 transition border-r border-gray-300 pr-5">প্রচ্ছদ</a>
              {menuCategories.map((cat, index) => (
                <a key={index} href={`/?category=${cat}`} className="hover:text-red-600 transition">{cat}</a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-[#f8f9fa] border-b border-gray-200">
         <div className="max-w-[1200px] mx-auto px-4 py-2 text-sm text-gray-500 flex gap-2 font-bold items-center">
            <a href="/" className="hover:text-red-600">প্রচ্ছদ</a> 
            <span className="text-gray-400">❯</span>
            <a href={`/?category=${news.category}`} className="hover:text-red-600 text-red-700">{news.category}</a>
         </div>
      </div>

      {/* Main Content Layout */}
      <main className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         <article className="lg:col-span-8">
            <h1 className="text-[32px] md:text-[42px] font-extrabold leading-tight text-gray-900 mb-6">{news.title}</h1>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-y border-gray-200 py-3 mb-6 bg-gray-50 px-2 rounded-sm">
               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm font-bold text-gray-600">
                  <span className="bg-red-50 px-3 py-1 rounded text-red-700 border border-red-100 flex items-center w-max">
                     <span className="mr-1">✍️</span> {news.source_name || 'বঙ্গীয় টাইমস'}
                  </span>
                  <span className="hidden sm:block text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                     <span>🕒</span> প্রকাশিত: {formatDateTime(news.created_at)}
                  </span>
               </div>
               
               {/* Professional Social Share Buttons */}
               <div className="flex items-center gap-2">
                  <span className="text-[13px] text-gray-500 font-bold mr-1">শেয়ার করুন:</span>
                  
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noopener noreferrer" title="Share on Facebook"
                     className="bg-[#1877f2] text-white w-8 h-8 flex items-center justify-center rounded-sm hover:opacity-90 transition">
                     <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>

                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(news.title + " \n\nবিস্তারিত পড়ুন: " + currentUrl)}`} target="_blank" rel="noopener noreferrer" title="Share on WhatsApp"
                     className="bg-[#25d366] text-white w-8 h-8 flex items-center justify-center rounded-sm hover:opacity-90 transition">
                     <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 0C5.383 0 0 5.383 0 12.031c0 2.628.847 5.066 2.274 7.07L.707 23.293l4.316-1.524A11.97 11.97 0 0012.031 24c6.648 0 12.031-5.383 12.031-12.031S18.679 0 12.031 0zm0 21.969c-2.127 0-4.14-.543-5.908-1.503l-.423-.231-3.13 1.104 1.125-3.085-.251-.433A9.92 9.92 0 012.062 12.03C2.062 6.529 6.53 2.063 12.03 2.063c5.501 0 9.969 4.466 9.969 9.968 0 5.502-4.468 9.969-9.969 9.969z"/><path d="M17.472 14.391c-.275-.138-1.625-.802-1.876-.893-.25-.091-.432-.138-.613.138-.182.275-.708.893-.867 1.075-.16.183-.32.206-.594.069-.275-.138-1.158-.427-2.204-1.356-.813-.722-1.36-1.614-1.52-1.89-.16-.275-.017-.425.121-.563.124-.124.275-.321.413-.482.138-.16.184-.275.276-.459.092-.183.046-.344-.023-.482-.069-.138-.613-1.479-.84-2.025-.221-.532-.444-.459-.613-.468-.16-.008-.344-.009-.527-.009-.184 0-.482.069-.733.344-.25.275-.957.935-.957 2.279 0 1.344.98 2.645 1.117 2.828.138.183 1.93 2.946 4.674 4.129 2.744 1.183 2.744.79 3.248.745.503-.046 1.625-.664 1.854-1.308.23-.645.23-1.196.16-1.308-.07-.113-.254-.182-.529-.321z"/></svg>
                  </a>

                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(news.title)}`} target="_blank" rel="noopener noreferrer" title="Share on X"
                     className="bg-black text-white w-8 h-8 flex items-center justify-center rounded-sm hover:opacity-90 transition">
                     <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
               </div>
            </div>
            
            <figure className="mb-8">
               <img src={news.image_url} alt={news.title} className="w-full h-auto max-h-[550px] object-cover rounded-sm shadow-sm border border-gray-100" />
               <figcaption className="text-sm text-gray-500 mt-2 italic text-center">ছবি: সংগৃহীত</figcaption>
            </figure>
            
            <div className="text-[19px] md:text-[21px] leading-loose text-[#2b2b2b] whitespace-pre-wrap font-medium">
               {news.content || news.snippet}
               {!news.content && (
                  <p className="mt-8 font-bold text-red-700">
                     <a href={news.source_url} target="_blank" className="hover:underline">বিস্তারিত পড়তে মূল লিংকে ক্লিক করুন ❯</a>
                  </p>
               )}
            </div>

            <div className="mt-12 pt-6 border-t border-gray-200 flex flex-wrap gap-3 items-center">
               <span className="font-bold text-gray-500 text-sm uppercase tracking-wider">ট্যাগস:</span>
               <a href={`/?category=${news.category}`} className="bg-gray-100 border border-gray-200 text-gray-700 px-4 py-1.5 rounded-sm text-sm font-bold hover:bg-red-50 hover:text-red-700 transition">{news.category}</a>
               <span className="bg-gray-100 border border-gray-200 text-gray-700 px-4 py-1.5 rounded-sm text-sm font-bold">{news.source_name || 'নিউজ'}</span>
            </div>
         </article>

         <aside className="lg:col-span-4">
            <div className="w-full h-[250px] bg-gray-100 border border-gray-200 flex flex-col items-center justify-center rounded-sm mb-8 text-gray-400 font-bold sticky top-24">
               <span className="text-xs mb-2">বিজ্ঞাপন</span>
               <span className="text-lg text-black text-center px-4">আপনার বিজ্ঞাপন<br/>এখানে দিন</span>
            </div>

            <div className="bg-white border-t-4 border-black shadow-sm p-5 mt-8">
               <h3 className="text-[22px] font-extrabold mb-5 text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <span className="text-red-600">■</span> আরও খবর
               </h3>
               <div className="flex flex-col gap-5">
                  {relatedNews.map((rel: any) => (
                     <a href={`/news/${rel.id}`} key={rel.id} className="group flex gap-4 items-start border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                        <div className="flex-1">
                           <h4 className="text-[17px] font-bold text-gray-800 group-hover:text-red-700 leading-snug">
                              {rel.title}
                           </h4>
                           <p className="text-[12px] text-gray-500 mt-2 font-bold">{formatDateTime(rel.created_at)}</p>
                        </div>
                        <img src={rel.image_url} alt={rel.title} className="w-[100px] h-[75px] object-cover rounded-sm shrink-0 border border-gray-100" />
                     </a>
                  ))}
               </div>
            </div>
         </aside>

      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-gray-300 mt-12 border-t-4 border-red-700">
        <div className="max-w-[1200px] mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-4">বঙ্গীয় <span className="text-red-600">টাইমস</span></h2>
              <p className="text-sm leading-relaxed text-gray-400">সত্য, সাহস ও বস্তুনিষ্ঠ সাংবাদিকতার এক অবিচল কণ্ঠস্বর। বাংলাদেশ ও সারা বিশ্বের সর্বশেষ সংবাদ সবার আগে পৌঁছে দিতে আমরা অঙ্গীকারবদ্ধ।</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 inline-block">সম্পাদকীয় ও প্রকাশনা</h3>
              <p className="text-sm mb-2"><span className="text-gray-500">সম্পাদক ও প্রকাশক:</span> <br/><span className="text-base font-bold text-white">মো: আজাদুর রহমান</span></p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 inline-block">যোগাযোগ</h3>
              <p className="text-sm mb-2 hover:text-white cursor-pointer transition">ইমেইল: news@bongiyotimes.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
