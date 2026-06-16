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
  const [activeTab, setActiveTab] = useState('add'); 
  
  // New News States
  const [title, setTitle] = useState('');
  const [snippet, setSnippet] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('মতামত');
  const [sourceName, setSourceName] = useState('বঙ্গীয় টাইমস');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);

  // Internal Search State inside Admin Panel
  const [searchTerm, setSearchTerm] = useState('');
  const [myNews, setMyNews] = useState<any[]>([]);

  // Password Settings States
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState('');

  const allCategories = ["বাংলাদেশ", "আন্তর্জাতিক", "রাজনীতি", "মতামত", "খেলাধুলা", "বাণিজ্য", "বিনোদন", "আইন-আদালত", "জীবনযাপন", "শিক্ষা", "চাকরি", "প্রযুক্তি", "ধর্ম", "ফিচার", "হাস্যরস"];
  
  useEffect(() => {
    const loggedInUser = localStorage.getItem('bongiyo_admin');
    if (loggedInUser) setUser(JSON.parse(loggedInUser));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from('editors').select('*').eq('email', email).eq('password', password).single();
    if (data) {
      localStorage.setItem('bongiyo_admin', JSON.stringify(data));
      setUser(data);
    } else {
      alert('ভুল ইমেইল বা পাসওয়ার্ড!');
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

  // এডিট বাটনে ক্লিক করলে এই ফাংশন কাজ করবে
  const handleEditClick = (newsItem: any) => {
    setEditingId(newsItem.id);
    setTitle(newsItem.title);
    setSnippet(newsItem.snippet || '');
    setContent(newsItem.content || '');
    setCategory(newsItem.category);
    setSourceName(newsItem.source_name || '');
    setImageUrl(newsItem.image_url || '');
    setActiveTab('add'); // ফর্ম ট্যাবে নিয়ে যাবে
    setMessage('');
  };

  // ফর্ম রিসেট করার ফাংশন
  const resetForm = () => {
    setEditingId(null);
    setTitle(''); setSnippet(''); setContent(''); setImageUrl('');
    setSourceName('বঙ্গীয় টাইমস'); setCategory('মতামত');
    setMessage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setMessage('ছবি আপলোড হচ্ছে...');
    
    const formData = new FormData();
    formData.append('file', file);
    // Cloudinary Unsigned Preset Name
    formData.append('upload_preset', 'bongiyo_unsigned'); 

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dfgfvfvmk/image/upload', {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        setMessage('✅ ছবি সফলভাবে আপলোড হয়েছে!');
      } else {
        alert('Cloudinary Error: ' + (data.error?.message || 'Unknown error occurred.'));
        setMessage('❌ ছবি আপলোডে সমস্যা হয়েছে।');
      }
    } catch (error) {
      alert('Network Error: ছবি আপলোড করা সম্ভব হয়নি।');
      setMessage('❌ ইন্টারনেট বা সার্ভার সমস্যা।');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(editingId ? 'আপডেট হচ্ছে...' : 'পাবলিশ হচ্ছে...');

    if (editingId) {
      // ডেটা আপডেট লজিক
      const { error } = await supabase.from('news').update({
        title, snippet, content, category, source_name: sourceName, image_url: imageUrl
      }).eq('id', editingId);

      if (error) {
        setMessage('এরর: ' + error.message);
      } else {
        setMessage('✅ সফলভাবে আপডেট হয়েছে!');
        resetForm(); // এডিট শেষে ফর্ম ক্লিয়ার
      }
    } else {
      // নতুন ডেটা ইনসার্ট লজিক
      const { data, error } = await supabase.from('news').insert([{
        title, snippet, content, category, source_name: sourceName, image_url: imageUrl, source_url: '#', is_custom: true
      }]).select();

      if (error) {
        setMessage('এরর: ' + error.message);
      } else if (data && data.length > 0) {
        await supabase.from('news').update({ source_url: `/news/${data[0].id}` }).eq('id', data[0].id);
        setMessage('✅ সফলভাবে পাবলিশ হয়েছে!');
        resetForm();
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
       setPassMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
       return;
    }
    const { error } = await supabase.from('editors').update({ password: newPassword }).eq('id', user.id);
    if (!error) {
       setPassMessage('✅ পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');
       setNewPassword('');
    } else {
       setPassMessage('সমস্যা হয়েছে: ' + error.message);
    }
  };

  const filteredNews = myNews.filter(news => 
     news.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     news.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6]">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-lg shadow-2xl w-full max-w-md border-t-4 border-red-700">
          <div className="text-center mb-8">
             <h2 className="text-4xl font-extrabold text-red-700">বঙ্গীয় <span className="text-black">টাইমস</span></h2>
             <p className="text-gray-500 font-bold mt-2">সুরক্ষিত অ্যাডমিন প্যানেল</p>
          </div>
          <input type="email" placeholder="অ্যাডমিন ইমেইল" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-3 mb-4 rounded font-bold focus:outline-none focus:ring-2 focus:ring-red-200" required />
          <input type="password" placeholder="পাসওয়ার্ড" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border p-3 mb-8 rounded font-bold focus:outline-none focus:ring-2 focus:ring-red-200" required />
          <button className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded shadow transition">নিরাপদ লগইন</button>
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
              <p className="text-sm text-gray-500 font-bold mt-1">লগইন আইডি: {user.email}</p>
           </div>
           <button onClick={() => { localStorage.removeItem('bongiyo_admin'); window.location.reload(); }} className="bg-gray-200 px-4 py-2 rounded text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-700">লগআউট</button>
        </div>

        <div className="flex gap-4 mb-6">
           <button onClick={() => { setActiveTab('add'); resetForm(); }} className={`px-6 py-2 font-bold rounded transition ${activeTab==='add' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {editingId ? 'খবর এডিট' : 'নতুন খবর'}
           </button>
           <button onClick={() => setActiveTab('manage')} className={`px-6 py-2 font-bold rounded transition ${activeTab==='manage' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>খবর ম্যানেজ ও সার্চ</button>
           <button onClick={() => setActiveTab('settings')} className={`px-6 py-2 font-bold rounded transition ${activeTab==='settings' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>সিকিউরিটি</button>
        </div>

        {activeTab === 'add' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required type="text" placeholder="শিরোনাম" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-3 rounded font-bold focus:outline-none focus:ring-2 focus:ring-red-200" />
            <textarea required placeholder="হোমপেজের জন্য সারাংশ স্নিপেট" value={snippet} onChange={(e) => setSnippet(e.target.value)} className="w-full border p-3 rounded h-16 focus:outline-none focus:ring-2 focus:ring-red-200" />
            <textarea required placeholder="খবরের পুরো বিস্তারিত বিবরণ (এখানে প্যারাগ্রাফ করে লিখুন)" value={content} onChange={(e) => setContent(e.target.value)} className="w-full border p-3 rounded h-40 focus:outline-none focus:ring-2 focus:ring-red-200" />
            <div className="grid grid-cols-2 gap-4">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="border p-3 rounded font-bold">
                {allCategories.map((cat, idx) => <option key={idx}>{cat}</option>)}
              </select>
              <input required type="text" placeholder="সূত্র/লেখক" value={sourceName} onChange={(e) => setSourceName(e.target.value)} className="border p-3 rounded font-bold" />
            </div>
            
            <div className="border border-gray-300 p-6 rounded bg-gray-50 text-center">
               <label className="block font-bold mb-4 text-gray-700">ছবি আপলোড (Cloudinary)</label>
               <input type="file" onChange={handleImageUpload} className="mb-2 text-sm block mx-auto" />
               <p className="text-gray-400 text-sm my-2">- অথবা সরাসরি ছবির ইউআরএল দিন -</p>
               <input type="text" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border p-2 rounded text-sm mb-4 outline-none focus:border-red-400" />
               
               {imageUrl && (
                  <div className="mt-4 border p-2 bg-white rounded shadow-sm inline-block">
                     <p className="text-xs font-bold text-green-600 mb-2">ছবির প্রিভিউ:</p>
                     <img src={imageUrl} alt="Preview" className="w-48 h-32 object-cover rounded mx-auto" />
                  </div>
               )}
            </div>

            {message && <div className={`p-3 font-bold text-center rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-800'}`}>{message}</div>}
            
            <div className="flex gap-4">
               <button type="submit" disabled={isUploading || !imageUrl || !title} className="flex-1 bg-red-700 text-white font-bold text-lg py-3 rounded hover:bg-red-800 disabled:bg-gray-400 transition">
                  {isUploading ? 'ছবি আপলোড হচ্ছে...' : (editingId ? 'আপডেট করুন' : 'পাবলিশ করুন')}
               </button>
               {editingId && (
                  <button type="button" onClick={resetForm} className="bg-gray-500 text-white font-bold text-lg py-3 px-6 rounded hover:bg-gray-600 transition">
                     বাতিল
                  </button>
               )}
            </div>
          </form>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-4">
             <div className="mb-4">
                <input type="text" placeholder="আপনার আপলোড করা নিউজের শিরোনাম টাইপ করে খুঁজুন..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border-2 border-red-700 p-3 rounded font-bold focus:outline-none bg-red-50/30" />
             </div>
             {filteredNews.length === 0 ? <p className="text-center text-gray-500 py-10 font-bold">কোনো ম্যাচিং খবর পাওয়া যায়নি।</p> : null}
             {filteredNews.map(news => (
                <div key={news.id} className="flex flex-col md:flex-row justify-between md:items-center border p-4 rounded bg-gray-50 gap-4 hover:shadow-sm">
                   <div>
                      <h3 className="font-bold text-lg text-gray-800">{news.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{new Date(news.created_at).toLocaleDateString('bn-BD')} | ক্যাটাগরি: <span className="text-red-700 font-bold">{news.category}</span></p>
                   </div>
                   <div className="flex gap-2 shrink-0">
                      <a href={news.source_url} target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold shadow">দেখুন</a>
                      <button onClick={() => handleEditClick(news)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-bold shadow">এডিট</button>
                      <button onClick={() => handleDelete(news.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold shadow">ডিলিট</button>
                   </div>
                </div>
             ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-gray-50 p-6 border rounded shadow-inner max-w-lg mx-auto mt-4">
             <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">সুরক্ষা পাসওয়ার্ড পরিবর্তন</h2>
             <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <div>
                   <label className="block font-bold text-sm text-gray-600 mb-1">নতুন শক্তিশালী পাসওয়ার্ড</label>
                   <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="কমপক্ষে ৬ অক্ষরের স্ট্রং পাসওয়ার্ড দিন" className="w-full border p-3 rounded focus:outline-none" required />
                </div>
                {passMessage && <div className={`p-2 text-center text-sm font-bold rounded ${passMessage.includes('✅') ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>{passMessage}</div>}
                <button type="submit" className="bg-gray-800 text-white font-bold py-2 rounded hover:bg-black transition">সেভ করুন</button>
             </form>
          </div>
        )}

      </div>
    </div>
  );
}
