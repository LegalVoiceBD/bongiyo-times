import React from 'react';

export const metadata = {
  title: 'ব্যবহারের শর্তাবলি | বঙ্গীয় টাইমস',
};

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-[800px] mx-auto bg-white p-8 md:p-12 shadow-sm border-t-4 border-red-700 rounded-sm">
        <h1 className="text-3xl font-extrabold mb-6 border-b pb-4">ব্যবহারের শর্তাবলি (Terms & Conditions)</h1>
        
        <div className="text-lg leading-relaxed text-gray-800 space-y-6">
          <p><strong>বঙ্গীয় টাইমস</strong> ওয়েবসাইট ব্যবহার করার অর্থ হলো আপনি নিচের শর্তাবলি মেনে নিয়েছেন।</p>
          
          <div>
            <h3 className="font-bold text-xl mb-2 text-red-700">১. কপিরাইট ও মেধাস্বত্ব</h3>
            <p>এই ওয়েবসাইটের সকল খবর, ফিচার, ছবি, লোগো এবং গ্রাফিক্সের কপিরাইট 'বঙ্গীয় টাইমস' কর্তৃক সম্পূর্ণভাবে সংরক্ষিত। কর্তৃপক্ষের লিখিত অনুমতি ব্যতীত আমাদের কোনো সংবাদ, ছবি বা কনটেন্ট অন্য কোনো ওয়েবসাইট, পত্রিকা বা মাধ্যমে আংশিক বা সম্পূর্ণ প্রকাশ করা সম্পূর্ণ বেআইনি।</p>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-2 text-red-700">২. ব্যবহারকারীর মন্তব্য</h3>
            <p>খবরের নিচে পাঠকদের মত প্রকাশের সুযোগ রয়েছে। তবে মন্তব্যের ক্ষেত্রে শালীনতা বজায় রাখা বাধ্যতামূলক। কোনো প্রকার আপত্তিকর, অশালীন, ধর্মীয় বিদ্বেষমূলক বা রাষ্ট্রবিরোধী মন্তব্যের জন্য মন্তব্যকারী নিজেই দায়ী থাকবেন। কর্তৃপক্ষ যেকোনো মন্তব্য মুছে ফেলার অধিকার সংরক্ষণ করে।</p>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-2 text-red-700">৩. তথ্যের সঠিকতা</h3>
            <p>আমরা সর্বোচ্চ সতর্কতার সাথে বস্তুনিষ্ঠ সংবাদ পরিবেশন করার চেষ্টা করি। তবে অনিচ্ছাকৃত কোনো ভুল বা তথ্যের অসঙ্গতির কারণে কোনো ব্যক্তি বা প্রতিষ্ঠানের ক্ষতি হলে বঙ্গীয় টাইমস আইনিভাবে দায়ী থাকবে না।</p>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t text-center">
           <a href="/" className="bg-red-700 text-white px-6 py-2 rounded font-bold hover:bg-red-800 transition">প্রচ্ছদে ফিরে যান</a>
        </div>
      </div>
    </div>
  );
}
