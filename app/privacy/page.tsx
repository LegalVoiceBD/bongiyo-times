import React from 'react';

export const metadata = {
  title: 'গোপনীয়তার নীতি | বঙ্গীয় টাইমস',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-[800px] mx-auto bg-white p-8 md:p-12 shadow-sm border-t-4 border-red-700 rounded-sm">
        <h1 className="text-3xl font-extrabold mb-6 border-b pb-4">গোপনীয়তার নীতি (Privacy Policy)</h1>
        
        <div className="text-lg leading-relaxed text-gray-800 space-y-6">
          <p><strong>বঙ্গীয় টাইমস</strong>-এ আপনার তথ্যের গোপনীয়তা আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ। আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখি তা এখানে বর্ণনা করা হলো।</p>
          
          <div>
            <h3 className="font-bold text-xl mb-2 text-red-700">১. তথ্য সংগ্রহ</h3>
            <p>আপনি যখন আমাদের ওয়েবসাইট ভিজিট করেন, তখন আমরা আপনার ব্রাউজারের ধরন, আইপি ঠিকানা, ভিজিটের সময় এবং কুকিজের মাধ্যমে কিছু সাধারণ ডেটা সংগ্রহ করতে পারি। এটি আমাদের ওয়েবসাইটের সেবার মান উন্নয়নে সাহায্য করে।</p>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-2 text-red-700">২. কুকিজ (Cookies) এর ব্যবহার</h3>
            <p>ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে এবং নিবন্ধিত পাঠকদের লগইন তথ্য মনে রাখতে আমরা কুকিজ ব্যবহার করি। আপনি চাইলে আপনার ব্রাউজার সেটিংস থেকে কুকিজ বন্ধ করতে পারেন।</p>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-2 text-red-700">৩. তথ্যের নিরাপত্তা ও শেয়ারিং</h3>
            <p>আপনার ব্যক্তিগত তথ্য (যেমন ইমেইল বা ফোন নম্বর) আমরা কোনো তৃতীয় পক্ষের কাছে বিক্রি বা শেয়ার করি না। তবে রাষ্ট্রীয় বা আইনি প্রয়োজনে আইন-শৃঙ্খলা রক্ষাকারী বাহিনীকে তথ্য প্রদান করতে আমরা বাধ্য থাকি।</p>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-2 text-red-700">৪. থার্ড-পার্টি লিংক ও বিজ্ঞাপন</h3>
            <p>আমাদের ওয়েবসাইটে গুগল বা অন্যান্য বিজ্ঞাপন সংস্থার বিজ্ঞাপন থাকতে পারে। এসব থার্ড-পার্টি ওয়েবসাইটের নিজস্ব গোপনীয়তার নীতি রয়েছে, যার জন্য বঙ্গীয় টাইমস দায়ী নয়।</p>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t text-center">
           <a href="/" className="bg-red-700 text-white px-6 py-2 rounded font-bold hover:bg-red-800 transition">প্রচ্ছদে ফিরে যান</a>
        </div>
      </div>
    </div>
  );
}
