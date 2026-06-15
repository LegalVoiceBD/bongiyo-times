import React from 'react';

export default function Home() {
  // ডামি নিউজ ডাটা (আপাতত ডিজাইনের জন্য, পরে এগুলো সুপাবেজ থেকে অটোমেটিক আসবে)
  const leadNews = {
    category: "বিশ্বকাপ ফুটবল ২০২৬",
    title: "নেদারল্যান্ডসের বিপক্ষে ২-২ গোলে ড্র জাপানের",
    imageUrl: "https://images.unsplash.com/photo-1518605368461-1ee12523fac3?q=80&w=1200&auto=format&fit=crop",
  };

  const subNews = [
    {
      id: 1,
      title: "জাপানের দুর্দান্ত জবাব, নেদারল্যান্ডসের বিপক্ষে সমতায় ফেরা",
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbb1925536?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "সেভেন আপের দুঃসহ স্মৃতি: ১২ বছর পর 'বন্ধু' পেল ব্রাজিল",
      imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=600&auto=format&fit=crop",
    },
  ];

  const categories = [
    "প্রচ্ছদ", "মতামত", "আইন-আদালত", "অপরাধ", "স্বাস্থ্য", "ধর্ম", "রাজধানী", "আন্তর্জাতিক", "খেলাধুলা", "বিনোদন"
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans pb-10">
      
      {/* ----------------- Header Section ----------------- */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-4xl md:text-5xl font-extrabold text-red-700 tracking-tight">
              বঙ্গীয় <span className="text-black">টাইমস</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">সত্য ও সাহসের প্রতিচ্ছবি</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <div className="text-sm text-gray-600 font-medium border-r border-gray-300 pr-4 hidden md:block">
              ঢাকা, সোমবার, ১৫ জুন ২০২৬
            </div>
            <button className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 font-bold rounded shadow-sm transition">
              ই-পেপার
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="border-t border-gray-300">
          <div className="max-w-6xl mx-auto px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <nav className="flex items-center gap-6 py-3 text-lg font-bold text-gray-800">
              {categories.map((cat, index) => (
                <a key={index} href="#" className="hover:text-red-600 transition">
                  {cat}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ----------------- Main Content Section ----------------- */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-[#0b3d6e] text-white p-4 md:p-6 rounded-t-md">
          {/* Lead News Category Title */}
          <div className="text-center mb-4 border-b border-blue-800 pb-3">
             <h2 className="text-3xl md:text-4xl font-bold">{leadNews.category}</h2>
          </div>

          {/* Lead News Image and Title */}
          <div className="cursor-pointer group">
            <div className="overflow-hidden rounded shadow-lg">
              <img 
                src={leadNews.imageUrl} 
                alt="Lead News" 
                className="w-full h-[300px] md:h-[500px] object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 leading-tight group-hover:text-gray-300 transition">
              {leadNews.title}
            </h2>
          </div>

          {/* Sub Lead News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t border-blue-800 pt-6">
            {subNews.map((news) => (
              <div key={news.id} className="cursor-pointer group">
                <div className="overflow-hidden rounded">
                  <img 
                    src={news.imageUrl} 
                    alt={news.title} 
                    className="w-full h-[200px] object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mt-3 leading-snug group-hover:text-gray-300 transition">
                  {news.title}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Newspaper Sections */}
        <div className="bg-white p-4 md:p-6 shadow-md rounded-b-md border border-t-0 border-gray-200 mt-0">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                 <div key={item} className="flex gap-4 items-center border-b border-gray-100 pb-4 cursor-pointer group">
                    <img 
                      src={`https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=150&auto=format&fit=crop&sig=${item}`} 
                      className="w-24 h-24 object-cover rounded"
                      alt="Thumbnail"
                    />
                    <h4 className="text-lg font-bold text-gray-800 group-hover:text-red-600 transition line-clamp-3">
                      জাতীয় নির্বাচনের নতুন তারিখ ঘোষণা, প্রস্তুতি শুরু নির্বাচন কমিশনের
                    </h4>
                 </div>
              ))}
           </div>
        </div>
      </main>

      {/* ----------------- Footer Section ----------------- */}
      <footer className="max-w-6xl mx-auto px-4 mt-12 text-center text-gray-500 text-sm">
        <p>&copy; ২০২৬ বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
    </div>
  );
}
