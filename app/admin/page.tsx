"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'manage'
  
  // Form States
  const [title, setTitle] = useState('');
  const [snippet, setSnippet] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('মতামত');
  const [sourceName, setSourceName] = useState('বঙ্গীয় টাইমস');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Manage News States
  const [myNews, setMyNews] = useState<any[]>([]);

  const allCategories = ["সর্বশেষ", "বাংলাদেশ", "জাতীয়", "রাজনীতি", "সারাদেশ", "আন্তর্জাতিক", "বিশ্ব", "খেলাধুলা", "শিক্ষা", "বাণিজ্য", "বিনোদন", "মতামত", "আইন-আদালত", "প্রযুক্তি", "ধর্ম"];

  useEffect(() => {
    const loggedInUser = localStorage.getItem('bongiyo_admin');
    if (loggedInUser) setUser(JSON.parse(loggedInUser));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('editors').select('*').eq('email', email).eq('password', password).single();
    if (data) {
      localStorage.setItem('bongiyo_admin', JSON.stringify(data));
      setUser(data);
    } else {
      alert('ভুল ইমেইল বা পাসওয়ার্ড!');
    }
  };

  const fetchMyNews = async () => {
    const { data } = await supabase.from('news').select('*').eq('is_custom', true).order('created_at', { ascending: false });
    if (data) setMyNews(data);
  };

  useEffect(() => {
    if (user && activeTab === 'manage') fetchMyNews();
  }, [user, activeTab]);

  const handleDelete = async (id: number) => {
    if (confirm('আপনি কি নিশ্চিত যে খবরটি ডিলিট করতে চান?')) {
      await supabase.from('news').delete().eq('id', id);
      fetchMyNews();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'YOUR_UPLOAD_PRESET'); // এখানে ক্লাউডিনারি প্রিসেট দিন

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dfgfvfvmk/image/upload', {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      if (data.secure_url) setImageUrl(data.secure_url);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('পাবলিশ হচ্ছে...');

    // খবর সেভ করা এবং ID ফেরত নেওয়া
    const { data, error } = await supabase.from('news').insert([{
      title, snippet, content, category, source_name: sourceName, image_url: imageUrl, source_url: '#', is_custom: true
    }]).select();

    if (error) {
      setMessage('এরর: ' + error.message);
    } else if (data && data.length > 0) {
      // সেভ হওয়ার পর আসল লিংক আপডেট করা
      await supabase.from('news').update({ source_url: `/news/${data[0].id}` }).eq('id', data[0].id);
      setMessage('✅ সফলভাবে পাবলিশ হয়েছে!');
      setTitle(''); setSnippet(''); setContent(''); setImageUrl('');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96 border-t-4 border-red-700">
          <h2 className="text-2xl font-bold text-center mb-6 text-red-700">অ্যাডমিন লগইন</h2>
          <input type="email" placeholder="ইমেইল" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-2 mb-4 rounded" required />
          <input type="password" placeholder="পাসওয়ার্ড" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border p-2 mb-6 rounded" required />
          <button className="w-full bg-red-700 text-white font-bold py-2 rounded">লগইন</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-xl border-t-4 border-red-700">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
           <div>
              <h1 className="text-3xl font-extrabold text-red-700">কন্ট্রোল প্যানেল</h1>
              <p className="text-sm text-gray-500 font-bold mt-1">স্বাগতম, {user.email}</p>
           </div>
           <button onClick={() => { localStorage.removeItem('bongiyo_admin'); window.location.reload(); }} className="bg-gray-200 px-4 py-2 rounded text-sm font-bold text-gray-700 hover:bg-gray-300">লগআউট</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
           <button onClick={() => setActiveTab('add')} className={`px-6 py-2 font-bold rounded ${activeTab==='add' ? 'bg-red-700 text-white' : 'bg-gray-200 text-gray-700'}`}>নতুন খবর</button>
           <button onClick={() => setActiveTab('manage')} className={`px-6 py-2 font-bold rounded ${activeTab==='manage' ? 'bg-red-700 text-white' : 'bg-gray-200 text-gray-700'}`}>আমার খবর ম্যানেজ</button>
        </div>

        {activeTab === 'add' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required type="text" placeholder="শিরোনাম" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-3 rounded font-bold" />
            <textarea required placeholder="হোমপেজের জন্য স্নিপেট (ছোট সারাংশ)" value={snippet} onChange={(e) => setSnippet(e.target.value)} className="w-full border p-3 rounded h-16" />
            <textarea required placeholder="খবরের পুরো বিস্তারিত (এখানে প্যারাগ্রাফ করে লিখুন)" value={content} onChange={(e) => setContent(e.target.value)} className="w-full border p-3 rounded h-40" />
            
            <div className="grid grid-cols-2 gap-4">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="border p-3 rounded font-bold">
                {allCategories.map((cat, idx) => <option key={idx}>{cat}</option>)}
              </select>
              <input required type="text" placeholder="সূত্র/লেখক" value={sourceName} onChange={(e) => setSourceName(e.target.value)} className="border p-3 rounded" />
            </div>

            <div className="border p-4 rounded bg-gray-50">
               <label className="block font-bold mb-2">ছবি আপলোড</label>
               <input type="file" onChange={handleImageUpload} className="mb-2" />
               <input type="text" placeholder="অথবা সরাসরি লিংক দিন" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border p-2 rounded text-sm" />
               {isUploading && <span className="text-blue-500 text-sm ml-2">আপলোড হচ্ছে...</span>}
            </div>

            {message && <div className="p-3 bg-blue-50 text-blue-800 font-bold text-center rounded">{message}</div>}
            <button type="submit" disabled={isUploading || !imageUrl} className="w-full bg-red-700 text-white font-bold text-lg py-3 rounded hover:bg-red-800">পাবলিশ করুন</button>
          </form>
        ) : (
          <div className="space-y-4">
             {myNews.length === 0 ? <p className="text-center text-gray-500 py-10">আপনার কোনো পাবলিশ করা খবর নেই।</p> : null}
             {myNews.map(news => (
                <div key={news.id} className="flex justify-between items-center border p-4 rounded bg-gray-50">
                   <div>
                      <h3 className="font-bold text-lg text-gray-800">{news.title}</h3>
                      <p className="text-sm text-gray-500">{new Date(news.created_at).toLocaleDateString()} | ক্যাটাগরি: {news.category}</p>
                   </div>
                   <div className="flex gap-2">
                      <a href={news.source_url} target="_blank" className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">দেখুন</a>
                      <button onClick={() => handleDelete(news.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">ডিলিট</button>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
