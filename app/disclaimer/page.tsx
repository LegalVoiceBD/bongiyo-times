import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'কপিরাইট পলিসি ও দায়মুক্তি | বঙ্গীয় টাইমস',
  description: 'বঙ্গীয় টাইমস-এর কপিরাইট পলিসি, ব্যবহারের শর্তাবলি এবং ডিসক্লেইমার।',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#f4f7fc] text-[#333333] tracking-tight pb-16">
      {/* কালপুরুষ ফন্ট ইমপোর্ট */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.maateen.me/kalpurush/font.css');
        body { font-family: 'Kalpurush', Arial, sans-serif !important; }
      `}} />

      {/* Page Header */}
      <div className="bg-white border-b-4 border-red-700 shadow-sm py-10">
        <div className="max-w-[900px] mx-auto px-4 text-center">
          <h1 className="text-[32px] md:text-[40px] font-extrabold text-gray-900 mb-3">
            কপিরাইট পলিসি ও <span className="text-red-700">দায়মুক্তি</span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-gray-500 font-medium">
            সর্বশেষ আপডেট: {new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-4 mt-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-10 text-[17px] md:text-[19px] leading-[1.8] text-justify space-y-10">

          {/* সূচনা */}
          <section>
            <p className="text-gray-700">
              <strong className="text-red-700">বঙ্গীয় টাইমস (Bongiyo Times)</strong>-এ আপনাকে স্বাগতম। আমাদের ওয়েবসাইটটি ব্যবহার করার পূর্বে অনুগ্রহ করে নিচের শর্তাবলি, কপিরাইট পলিসি এবং দায়মুক্তির (Disclaimer) বিবৃতিগুলো মনোযোগ সহকারে পড়ুন। আমাদের সাইট ভিজিট বা ব্যবহার করার অর্থ হলো আপনি এই শর্তাবলির সাথে সম্পূর্ণভাবে একমত।
            </p>
          </section>

          {/* কপিরাইট পলিসি */}
          <section>
            <h2 className="text-[22px] md:text-[26px] font-bold text-[#104f96] border-b-2 border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <span className="bg-[#104f96] w-2 h-6 inline-block rounded-sm"></span>
              কপিরাইট এবং ফেয়ার ইউজ পলিসি (Fair Use)
            </h2>
            <p className="text-gray-700 mb-4">
              বঙ্গীয় টাইমস একটি স্বাধীন বিশ্লেষণধর্মী নিউজ পোর্টাল। আমাদের নিজস্ব প্রতিবেদক এবং সম্পাদকীয় পর্ষদ কর্তৃক তৈরিকৃত সকল কাস্টম সংবাদ, প্রবন্ধ, ছবি এবং গ্রাফিক্সের সর্বস্বত্ব <strong className="text-gray-900">বঙ্গীয় টাইমস</strong> কর্তৃক সংরক্ষিত।
            </p>
            <div className="bg-blue-50 border-l-[4px] border-blue-600 p-4 rounded-r-md">
              <h3 className="font-bold text-gray-900 mb-2">সংবাদ বিশ্লেষণ ও সোর্স ক্রেডিট:</h3>
              <p className="text-gray-700 text-[16px]">
                আমরা দেশ-বিদেশের বিভিন্ন স্বনামধন্য গণমাধ্যমের প্রকাশিত সংবাদের বস্তুনিষ্ঠ এবং নিরপেক্ষ বিশ্লেষণ আমাদের পাঠকদের জন্য তুলে ধরি। আন্তর্জাতিক <strong className="text-blue-800">"Fair Use Policy" (ন্যায্য ব্যবহার নীতি)</strong> অনুযায়ী সংবাদ সমালোচনা এবং বিশ্লেষণের উদ্দেশ্যে আমরা তৃতীয় পক্ষের সংবাদের সারাংশ ব্যবহার করে থাকি। প্রতিটি বিশ্লেষণধর্মী খবরের সাথে মূল গণমাধ্যমের নাম এবং খবরের সরাসরি লিংক (Source Link) সুস্পষ্টভাবে যুক্ত করা হয়, যাতে মূল প্রকাশকের কপিরাইট লঙ্ঘিত না হয় এবং তারা যথাযথ ক্রেডিট পান।
              </p>
            </div>
            <p className="text-gray-700 mt-4 text-[16px]">
              এরপরও যদি কোনো মূল প্রকাশক বা কর্তৃপক্ষের আমাদের কোনো বিশ্লেষণ বা কন্টেন্ট নিয়ে আপত্তি থাকে, তবে উপযুক্ত প্রমাণসহ আমাদের সাথে যোগাযোগ করার অনুরোধ করা হলো। অভিযোগ প্রমাণিত হলে আমরা দ্রুততম সময়ের মধ্যে উক্ত কন্টেন্ট অপসারণ বা সংশোধন করতে বাধ্য থাকব।
            </p>
          </section>

          {/* দায়মুক্তি বা ডিসক্লেইমার */}
          <section>
            <h2 className="text-[22px] md:text-[26px] font-bold text-red-700 border-b-2 border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <span className="bg-red-700 w-2 h-6 inline-block rounded-sm"></span>
              দায়মুক্তি (Disclaimer)
            </h2>
            <ul className="list-disc pl-5 space-y-4 text-gray-700">
              <li>
                <strong>তথ্যের যথার্থতা:</strong> আমরা সর্বোচ্চ সতর্কতা এবং অত্যাধুনিক প্রযুক্তির সাহায্যে সংবাদের সঠিকতা যাচাই ও বিশ্লেষণ করার চেষ্টা করি। তবে, কোনো সংবাদের শতভাগ নির্ভুলতা বা পূর্ণাঙ্গতার নিশ্চয়তা বঙ্গীয় টাইমস প্রদান করে না। পাঠকদের যেকোনো তথ্যের ওপর ভিত্তি করে সিদ্ধান্ত নেওয়ার আগে নিজ দায়িত্বে তা যাচাই করার পরামর্শ দেওয়া হলো।
              </li>
              <li>
                <strong>তৃতীয় পক্ষের ওয়েবসাইট:</strong> আমাদের পোর্টালে বিভিন্ন মূল খবরের রেফারেন্স হিসেবে এক্সটার্নাল লিংক (External Links) দেওয়া থাকে। সেসব থার্ড-পার্টি ওয়েবসাইটের কনটেন্ট, প্রাইভেসি পলিসি বা তাদের কোনো কর্মকাণ্ডের জন্য বঙ্গীয় টাইমস দায়ী নয়।
              </li>
              <li>
                <strong>পরামর্শমূলক কনটেন্ট:</strong> আমাদের ওয়েবসাইটের "আইন ও পরামর্শ" অথবা "স্বাস্থ্য" ক্যাটাগরিতে প্রকাশিত সংবাদ বা নিবন্ধগুলো কেবলই সাধারণ তথ্য প্রদানের উদ্দেশ্যে। এটিকে কোনোভাবেই পেশাদার আইনি, চিকিৎসা বা বিশেষজ্ঞ পরামর্শ হিসেবে গ্রহণ করা যাবে না। প্রয়োজনে সংশ্লিষ্ট পেশাদার বিশেষজ্ঞের পরামর্শ নিন।
              </li>
              <li>
                <strong>মতামত ও মন্তব্য:</strong> কলামিস্ট, অতিথি লেখক বা মন্তব্যের ঘরে পাঠকদের নিজস্ব মতামতের জন্য বঙ্গীয় টাইমস বা এর সম্পাদকীয় পর্ষদ কোনোভাবেই দায়ী থাকবে না। এটি লেখকের একান্তই নিজস্ব দৃষ্টিভঙ্গি।
              </li>
            </ul>
          </section>

          {/* প্রযুক্তি ও এআই ব্যবহার */}
          <section>
            <h2 className="text-[22px] md:text-[26px] font-bold text-gray-800 border-b-2 border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <span className="bg-gray-800 w-2 h-6 inline-block rounded-sm"></span>
              উন্নত প্রযুক্তির ব্যবহার
            </h2>
            <p className="text-gray-700">
              পাঠকদের কাছে দ্রুত ও নির্ভুলভাবে সংবাদের সারাংশ এবং নিরপেক্ষ বিশ্লেষণ পৌঁছে দিতে বঙ্গীয় টাইমস নিজস্ব সিস্টেম এবং আধুনিক আর্টিফিশিয়াল ইন্টেলিজেন্স (AI) বা কৃত্রিম বুদ্ধিমত্তার সহায়তা নিয়ে থাকে। তবে যেকোনো সংবাদ প্রকাশের চূড়ান্ত সিদ্ধান্ত এবং মান নিয়ন্ত্রণের দায়িত্ব আমাদের সম্পাদকীয় পর্ষদের ওপর ন্যাস্ত থাকে।
            </p>
          </section>

          {/* যোগাযোগ */}
          <section className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center mt-8">
            <h3 className="text-[20px] font-bold text-gray-900 mb-2">যোগাযোগ করুন</h3>
            <p className="text-gray-600 mb-4 text-[16px]">কপিরাইট বা আমাদের পলিসি সংক্রান্ত যেকোনো প্রয়োজনে সরাসরি আমাদের সাথে যোগাযোগ করুন:</p>
            <div className="font-bold text-[18px] text-[#104f96] space-y-1">
              <p>সম্পাদক: অ্যাডভোকেট মো: আজাদুর রহমান</p>
              <p>ইমেইল: <a href="mailto:bongiyotimes@gmail.com" className="hover:underline hover:text-red-700 transition">bongiyotimes@gmail.com</a></p>
              <p>মোবাইল: <a href="tel:09696790279" className="hover:underline hover:text-red-700 transition">০৯৬৯৬ ৭৯০২৭৯</a></p>
            </div>
          </section>

        </div>
      </div>
      
    </div>
  );
}
