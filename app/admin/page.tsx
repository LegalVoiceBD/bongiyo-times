"use client";
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// সুপাবেজ কানেকশন
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

  // ক্লাউডিনারি (Cloudinary) ইমেজ আপলোড ফাংশন
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'YOUR_UPLOAD_PRESET'); // এখানে ক্লাউডিনারি প্রিসেট বসাতে হবে

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload', {
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

  // ডাটাবেসে সেভ করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('খবর সেভ হচ্ছে...');

    const { error } = await supabase.from('news').insert([{
      title,
      snippet,
      category,
      source_name: sourceName,
      image_url: imageUrl,
      source_url: '#', // নিজের নিউজের জন্য হ্যাশ বা অন্য পেইজ লিংক
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
    <div className="min-h-screen bg-gray-100 p-4 md:p-10 font-sans">
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg border-t-4 border-red-700">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-2">কন্ট্রোল প্যানেল</h1>
        <p className="text-center text-gray-500 mb-8">নতুন খবর বা মতামত যুক্ত করুন</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">শিরোনাম</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-red-500" placeholder="খবরের শিরোনাম লিখুন" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">বিস্তারিত (স্নিপেট)</label>
            <textarea required value={snippet} onChange={(e) => setSnippet(e.target.value)} className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-red-500 h-24" placeholder="খবরের কিছু অংশ বা বিস্তারিত লিখুন" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ক্যাটাগরি</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-red-500">
                <option>মতামত</option>
                <option>বাংলাদেশ</option>
                <option>আন্তর্জাতিক</option>
                <option>খেলাধুলা</option>
                <option>সম্পাদকীয়</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">লেখকের নাম / সূত্র</label>
              <input required type="text" value={sourceName} onChange={(e) => setSourceName(e.target.value)} className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-red-500" />
            </div>
          </div>

          <div className="border border-dashed border-gray-400 p-4 rounded text-center bg-gray-50">
             <label className="block text-sm font-bold text-gray-700 mb-2">ছবি আপলোড করুন (Cloudinary)</label>
             <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-3 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
             {isUploading && <p className="text-blue-600 text-sm">ছবি আপলোড হচ্ছে... অপেক্ষা করুন</p>}
             
             <div className="mt-2 flex items-center gap-2">
                <span className="text-gray-400 text-xs">অথবা সরাসরি লিংক দিন:</span>
                <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="flex-1 border border-gray-300 p-2 text-sm rounded focus:outline-none" placeholder="https://..." />
             </div>
          </div>

          {message && <div className={`p-3 rounded font-bold text-center ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

          <button type="submit" disabled={isUploading || !imageUrl} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold text-lg py-3 rounded shadow transition disabled:bg-gray-400">
            পাবলিশ করুন
          </button>
        </form>
      </div>
    </div>
  );
}
