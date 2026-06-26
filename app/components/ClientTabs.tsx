"use client";
import React, { useState } from 'react';

export default function ClientTabs({ latestList, popularList }: { latestList: any[], popularList: any[] }) {
  const [activeTab, setActiveTab] = useState('latest');
  
  const currentList = activeTab === 'latest' ? latestList : popularList;

  return (
    <>
      <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('latest')}
            className={`flex-1 py-2 text-center font-bold transition outline-none ${activeTab === 'latest' ? 'text-red-700 border-b-2 border-red-700 bg-red-50' : 'text-gray-500 hover:text-black'}`}
          >
            সর্বশেষ
          </button>
          <button 
            onClick={() => setActiveTab('popular')}
            className={`flex-1 py-2 text-center font-bold transition outline-none ${activeTab === 'popular' ? 'text-red-700 border-b-2 border-red-700 bg-red-50' : 'text-gray-500 hover:text-black'}`}
          >
            জনপ্রিয়
          </button>
      </div>
      <div className="p-4 flex flex-col gap-4">
          {currentList.map((news, idx) => (
             /* এখানে href লিংকে পরিবর্তন করা হয়েছে */
             <a href={`/news/${news.id}`} key={news.id} className="flex gap-4 group items-start border-b border-gray-100 pb-3 last:border-0">
                <span className="text-3xl font-extrabold text-red-100 group-hover:text-red-200 transition mt-[-5px]">
                   {['১','২','৩','৪','৫','৬','৭'][idx]}
                </span>
                <h3 className="text-[15px] font-bold text-gray-800 group-hover:text-red-700 leading-snug">
                   {news.title}
                </h3>
             </a>
          ))}
      </div>
    </>
  );
}
