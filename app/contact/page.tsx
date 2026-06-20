import React from 'react';

export const metadata = {
  title: 'যোগাযোগ ও বিজ্ঞাপন | বঙ্গীয় টাইমস',
};

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-[800px] mx-auto bg-white p-8 md:p-12 shadow-sm border-t-4 border-red-700 rounded-sm text-center">
        <h1 className="text-3xl font-extrabold mb-6 border-b pb-4">যোগাযোগ ও বিজ্ঞাপন</h1>
        
        <div className="text-lg leading-relaxed text-gray-800 space-y-6">
          <p className="font-bold text-xl">সংবাদ, ফিচার বা যেকোনো মতামতের জন্য আমাদের সাথে যোগাযোগ করুন। এছাড়া আপনার প্রতিষ্ঠানের বিজ্ঞাপনের জন্য আমাদের মার্কেটিং বিভাগের সাথে কথা বলতে পারেন।</p>
          
          <div className="bg-gray-100 p-6 rounded-md inline-block text-left border border-gray-200 mt-6">
            <h3 className="font-bold text-2xl mb-4 text-red-700 border-b-2 border-red-200 pb-2 inline-block">প্রধান কার্যালয়</h3>
            <p className="font-bold text-xl mb-2">অ্যাডভোকেট মো: আজাদুর রহমান</p>
            <p className="text-gray-600 mb-4">সম্পাদক</p>
            
            <div className="space-y-3 text-lg">
               <p><span className="font-bold mr-2">ঠিকানা:</span> ২৫/১ কোর্ট হাউজ স্ট্রিট, নাহার কমপ্লেক্স, <br/>রুম নং ডি-৬, কোতয়ালী, ঢাকা-১১০০।</p>
               <p><span className="font-bold mr-2">মোবাইল:</span> <a href="tel:09696790279" className="text-blue-600 font-bold hover:underline">০৯৬৯৬ ৭৯০২৭৯</a></p>
               <p><span className="font-bold mr-2">ইমেইল:</span> <a href="mailto:bongiyotimes@gmail.com" className="text-blue-600 font-bold hover:underline">bongiyotimes@gmail.com</a></p>
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t">
           <a href="/" className="bg-red-700 text-white px-6 py-2 rounded font-bold hover:bg-red-800 transition">প্রচ্ছদে ফিরে যান</a>
        </div>
      </div>
    </div>
  );
}
