"use client";
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function AdminDashboard() {
  const [title, setTitle] = useState('');
  const [snippet, setSnippet] = useState('');
  const [category, setCategory] = useState('মতামত');
  const [sourceName, setSourceName] = useState('বঙ্গীয় টাইমস');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  // আপনার দেওয়া সব ক্যাটাগরি লিস্ট
  const allCategories = [
    "সর্বশেষ", "বাংলাদেশ", "জাতীয়", "রাজনীতি", "সারাদেশ", "আন্তর্জাতিক", "বিশ্ব", 
    "খেলাধুলা", "শিক্ষা", "বাণিজ্য", "বিনোদন", "মতামত", "আইন-আদালত", "প্রযুক্তি", "ধর্ম"
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'bongiyo_times'); // ক্লাউডিনারি প্রিসেট

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dfgfvfvmk/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        setMessage('ছবি সফলভাবে আপলোড হয়েছে!');
      }
    } catch (err) {
      setMessage('ছবি আপলোড ফেইল করেছে।');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('খবর সেভ হচ্ছে...');

    const { error } = await supabase.from('news').insert([{
      title,
      snippet,
      category,
      source_name: sourceName,
      image_url: imageUrl,
      source_url: '#',
      is_custom: true
    }]);

    if (error) {
      setMessage('এরর: ' + error.message);
    } else {
      setMessage('✅ খবর সফলভাবে পাবলিশ হয়েছে!');
      setTitle(''); setSnippet(''); setImageUrl('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-xl border-t-4 border-red-700">
        
        <div className="text-center mb-8 border-b border-gray-200 pb-6">
           <h1 className="text-4xl font-extrabold text-red-700 tracking-tight">বঙ্গীয় <span className="text-black">টাইমস</span></h1>
           <p className="text-gray-500 mt-2 font-bold text-lg">অ্যাডমিন কন্ট্রোল প্যানেল</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-bold text-gray-800 mb-2">শিরোনাম</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 p-3 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 transition" placeholder="খবরের শিরোনাম লিখুন" />
          </div>

          <div>
            <label className="block text-base font-bold text-gray-800 mb-2">বিস্তারিত (স্নিপেট)</label>
            <textarea required value={snippet} onChange={(e) => setSnippet(e.target.value)} className="w-full border border-gray-300 p-3 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 transition h-32" placeholder="খবরের কিছু অংশ বা বিস্তারিত লিখুন" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-bold text-gray-800 mb-2">ক্যাটাগরি</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 p-3 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition font-bold">
                {allCategories.map((cat, idx) => (
                   <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-base font-bold text-gray-800 mb-2">লেখকের নাম / সূত্র</label>
              <input required type="text" value={sourceName} onChange={(e) => setSourceName(e.target.value)} className="w-full border border-gray-300 p-3 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition font-bold text-red-700" />
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center bg-[#fafafa]">
             <label className="block text-base font-bold text-gray-800 mb-4">ছবি আপলোড করুন (Cloudinary)</label>
             <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-4 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer w-full max-w-xs mx-auto" />
             
             {isUploading && <p className="text-blue-600 text-sm font-bold animate-pulse">ছবি আপলোড হচ্ছে... অপেক্ষা করুন</p>}
             
             <div className="mt-4 flex flex-col md:flex-row items-center gap-3">
                <span className="text-gray-500 text-sm font-bold whitespace-nowrap">অথবা সরাসরি লিংক দিন:</span>
                <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border border-gray-300 p-2 text-sm rounded focus:outline-none focus:border-red-400" placeholder="https://..." />
             </div>

             {imageUrl && (
                <div className="mt-4">
                   <p className="text-xs text-green-600 font-bold mb-1">ছবির প্রিভিউ:</p>
                   <img src={imageUrl} alt="Preview" className="w-32 h-20 object-cover mx-auto rounded shadow-sm border border-gray-200" />
                </div>
             )}
          </div>

          {message && <div className={`p-4 rounded text-center font-bold text-lg shadow-sm ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message}</div>}

          <button type="submit" disabled={isUploading || !imageUrl || !title || !snippet} className="w-full bg-red-700 hover:bg-red-800 text-white font-extrabold text-xl py-4 rounded shadow-md transition transform hover:-translate-y-1 disabled:bg-gray-400 disabled:transform-none disabled:shadow-none mt-4">
            পাবলিশ করুন
          </button>
        </form>
      </div>
    </div>
  );
}
