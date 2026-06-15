import React from 'react';

export default function Home() {
  // ডামি নিউজ ডাটা
  const leadNews = {
    category: "বিশ্বকাপ ফুটবল ২০২৬",
    title: "নেদারল্যান্ডসের বিপক্ষে ২-২ গোলে ড্র জাপানের",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Football_in_Bloomington%2C_Indiana%2C_1996.jpg/1200px-Football_in_Bloomington%2C_Indiana%2C_1996.jpg",
  };

  const subNews = [
    {
      id: 1,
      title: "জাপানের দুর্দান্ত জবাব, নেদারল্যান্ডসের বিপক্ষে সমতায় ফেরা",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Soccerball.svg/600px-Soccerball.svg.png",
    },
    {
      id: 2,
      title: "সেভেন আপের দুঃসহ স্মৃতি: ১২ বছর পর 'বন্ধু' পেল ব্রাজিল",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Football_in_flight.jpg/600px-Football_in_flight.jpg",
    },
  ];

  const categories = [
    "প্রচ্ছদ", "মতামত", "আইন-আদালত", "অপরাধ", "স্বাস্থ্য", "ধর্ম", "রাজধানী", "আন্তর্জাতিক", "খেলাধুলা", "বিনোদন"
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-black pb-10">
      
      {/* ----------------- Header Section ----------------- */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-red-700 tracking-tight">
              বঙ্গীয় <span className="text-black">টাইমস</span>
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1 font-semibold">সত্য ও সাহসের প্রতিচ্ছবি</p>
          </div>
          
          <div className="mt-3 md:mt-0 flex items-center gap-4">
            <div className="text-sm text-gray-600 font-bold border-r border-gray-300 pr-4 hidden md:block">
              ঢাকা, সোমবার, ১৫ জুন ২০২৬
            </div>
            <button className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-1.5 md:py-2 text-sm md:text-base font-bold rounded shadow-sm transition border border-gray-300">
              ই-পেপার
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="border-t border-gray-300">
          <div className="max-w-6xl mx-auto px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <nav className="flex items-center gap-4 md:gap-6 py-2 md:py-3 text-base md:text-lg font-bold text-gray-800">
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
      <main className="max-w-6xl mx-auto px-0 md:px-4 mt-2 md:mt-6">
        <div className="bg-[#0b3d6e] text-white p-4 md:p-6 md:rounded-t-md">
          {/* Lead News Category Title */}
          <div className="text-center mb-3 md:mb-4 border-b border-blue-800 pb-2 md:pb-3">
             <h2 className="text-2xl md:text-4xl font-bold">{leadNews.category}</h2>
          </div>

          {/* Lead News Image and Title */}
          <div className="cursor-pointer group">
            <div className="overflow-hidden rounded shadow-lg">
              <img 
                src={leadNews.imageUrl} 
                alt="Lead News" 
                className="w-full h-[220px] md:h-[500px] object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <h2 className="text-2xl md:text-5xl font-bold mt-3 md:mt-4 leading-snug md:leading-tight group-hover:text-gray-300 transition">
              {leadNews.title}
            </h2>
          </div>

          {/* Sub Lead News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8 border-t border-blue-800 pt-4 md:pt-6">
            {subNews.map((news) => (
              <div key={news.id} className="cursor-pointer group flex flex-col">
                <div className="overflow-hidden rounded">
                  <img 
                    src={news.imageUrl} 
                    alt={news.title} 
                    className="w-full h-[180px] md:h-[250px] object-cover group-hover:scale-105 transition duration-500"
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
        <div className="bg-white p-4 md:p-6 shadow-md md:rounded-b-md border border-t-0 border-gray-200 mt-0">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                 <div key={item} className="flex gap-3 md:gap-4 items-start border-b border-gray-100 pb-3 md:pb-4 cursor-pointer group">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-200 flex-shrink-0 rounded flex items-center justify-center text-xs text-gray-500 font-bold border border-gray-300">
                      খবরের ছবি
                    </div>
                    <h4 className="text-base md:text-lg font-bold text-gray-800 group-hover:text-red-600 transition line-clamp-3 leading-snug">
                      জাতীয় নির্বাচনের নতুন তারিখ ঘোষণা, প্রস্তুতি শুরু নির্বাচন কমিশনের
                    </h4>
                 </div>
              ))}
           </div>
        </div>
      </main>

      {/* ----------------- Footer Section ----------------- */}
      <footer className="max-w-6xl mx-auto px-4 mt-8 md:mt-12 mb-6 text-center text-gray-500 text-xs md:text-sm font-bold">
        <p>&copy; ২০২৬ বঙ্গীয় টাইমস। সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
    </div>
  );
}
