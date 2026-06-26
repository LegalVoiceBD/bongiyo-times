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
  const [imageSource, setImageSource] = useState('বঙ্গীয় টাইমস'); // ডিফল্ট ক্যাপশন ফিক্সড করা হলো
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);

  // Search and Manage States
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
    
    // সরাসরি টেবিল খোঁজার বদলে আমাদের তৈরি করা সিকিউর ফাংশন (RPC) কল করা হচ্ছে
    const { data, error } = await supabase.rpc('admin_login', { 
        p_email: email, 
        p_password: password 
    });

    if (error) {
      console.error("লগিন এরর:", error.message);
      alert('সার্ভার সমস্যা, আবার চেষ্টা করুন।');
      return;
    }

    if (data && data.length > 0) {
      const loggedInUser = data[0];
      localStorage.setItem('bongiyo_admin', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } else {
      alert('ভুল ইমেইল বা পাসওয়ার্ড!');
    }
  };

  const fetchMyNews = async () => {
    if (!user) return;
    
    let query = supabase.from('news').select('*').order('created_at', { ascending: false });
    
    // যদি ইউজার জার্নালিস্ট হয়, তবে সে শুধু তার নিজের নিউজ দেখতে পারবে। 
    // অ্যাডমিন বা এডিটর হলে সবার নিউজ দেখতে পারবে।
    if (user.role === 'journalist') {
      query = query.eq('author_email', user.email);
    }
    
    const { data } = await query;
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

  const handleEditClick = (newsItem: any) => {
    setEditingId(newsItem.id);
    setTitle(newsItem.title);
    setSnippet(newsItem.snippet || '');
    setContent(newsItem.content || '');
    setCategory(newsItem.category);
    setSourceName(newsItem.source_name || '');
    setImageUrl(newsItem.image_url || '');
    // যদি ডাটাবেসে ছবির সোর্স না থাকে, তবে বাই ডিফল্ট "বঙ্গীয় টাইমস" দেখাবে
    setImageSource(newsItem.image_source || 'বঙ্গীয় টাইমস'); 
    setActiveTab('add'); 
    setMessage('');
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle(''); setSnippet(''); setContent(''); setImageUrl(''); 
    setImageSource('বঙ্গীয় টাইমস'); // নতুন নিউজ লেখার সময়ও ডিফল্ট থাকবে
    setSourceName(user?.role === 'journalist' ? user.name || 'প্রতিনিধি' : 'বঙ্গীয় টাইমস'); 
    setCategory('মতামত');
    setMessage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxFileSizeMB = 1; 
    const fileSizeInMB = file.size / (1024 * 1024);

    if (fileSizeInMB > maxFileSizeMB) {
      alert(`❌ ছবির সাইজ অনেক বড়!\n\nআপনার ছবির সাইজ: ${fileSizeInMB.toFixed(2)} MB.\nদয়া করে ${maxFileSizeMB} MB এর চেয়ে ছোট ছবি আপলোড করুন।`);
      e.target.value = ''; 
      return; 
    }

    setIsUploading(true);
    setMessage('ছবি আপলোড হচ্ছে...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'bongiyo_unsigned'); 

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
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
    
    // জার্নালিস্ট হলে নিউজ বাই ডিফল্ট ড্রাফট/আনপাবলিশড থাকবে
    const isPublished = user?.role === 'admin' || user?.role === 'editor' ? true : false;
    
    setMessage(editingId ? 'আপডেট হচ্ছে...' : (isPublished ? 'পাবলিশ হচ্ছে...' : 'এডিটরের কাছে পাঠানো হচ্ছে...'));

    const newsData = {
      title, 
      snippet, 
      content, 
      category, 
      source_name: sourceName, 
      image_url: imageUrl, 
      image_source: imageSource,
      is_published: isPublished,
      author_email: user.email
    };

    if (editingId) {
      const { error } = await supabase.from('news').update(newsData).eq('id', editingId);

      if (error) {
        setMessage('এরর: ' + error.message);
      } else {
        setMessage('✅ সফলভাবে আপডেট হয়েছে!');
        resetForm(); 
      }
    } else {
      const { data, error } = await supabase.from('news').insert([{
        ...newsData,
        source_url: '#', 
        is_custom: true
      }]).select();

      if (error) {
        setMessage('এরর: ' + error.message);
      } else if (data && data.length > 0) {
        await supabase.from('news').update({ source_url: `/news/${data[0].id}` }).eq('id', data[0].id);
        setMessage(isPublished ? '✅ সফলভাবে পাবলিশ হয়েছে!' : '✅ এডিটরের কাছে সফলভাবে পাঠানো হয়েছে!');
        resetForm();
      }
    }
  };

  const handlePublishToggle = async (newsItem: any) => {
    if (user.role !== 'admin' && user.role !== 'editor') return;
    
    const confirmMsg = newsItem.is_published ? 'খবরটি আনপাবলিশ (ড্রাফট) করতে চান?' : 'খবরটি সবার জন্য পাবলিশ করতে চান?';
    if (!confirm(confirmMsg)) return;

    const { error } = await supabase.from('news').update({ is_published: !newsItem.is_published }).eq('id', newsItem.id);
    if (!error) fetchMyNews();
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
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6] px-4">
        <form onSubmit={handleLogin} className="bg-white p-8 md:p-10 rounded-lg shadow-2xl w-full max-w-md border-t-4 border-red-700">
          <div className="text-center mb-8">
             <h2 className="text-3xl md:text-4xl font-extrabold text-red-700">বঙ্গীয় <span className="text-black">টাইমস</span></h2>
             <p className="text-gray-500 font-bold mt-2 text-sm md:text-base">সুরক্ষিত প্যানেল</p>
          </div>
          <input type="email" placeholder="ইমেইল আইডি" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-3 mb-4 rounded font-bold focus:outline-none focus:ring-2 focus:ring-red-200" required />
          <input type="password" placeholder="পাসওয়ার্ড" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border p-3 mb-8 rounded font-bold focus:outline-none focus:ring-2 focus:ring-red-200" required />
          <button className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded shadow transition">লগইন</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] py-6 md:py-10 px-2 md:px-4">
      <div className="max-w-5xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow-xl border-t-4 border-red-700">
        
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b pb-4 gap-4 sm:gap-0">
           <div className="text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-extrabold text-red-700">কন্ট্রোল প্যানেল</h1>
              <p className="text-xs md:text-sm text-gray-500 font-bold mt-1">লগইন আইডি: {user.email} <span className="uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] ml-2">{user.role || 'Journalist'}</span></p>
           </div>
           <button onClick={() => { localStorage.removeItem('bongiyo_admin'); window.location.reload(); }} className="bg-gray-200 px-4 py-2 rounded text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-700 transition">লগআউট</button>
        </div>

        {/* Tab Buttons - Mobile Friendly Wrap */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-6 justify-center sm:justify-start">
           <button onClick={() => { setActiveTab('add'); resetForm(); }} className={`px-4 md:px-6 py-2 text-sm md:text-base font-bold rounded transition ${activeTab==='add' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {editingId ? 'খবর এডিট' : 'নতুন খবর'}
           </button>
           <button onClick={() => setActiveTab('manage')} className={`px-4 md:px-6 py-2 text-sm md:text-base font-bold rounded transition ${activeTab==='manage' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              খবর ম্যানেজ {user.role === 'admin' || user.role === 'editor' ? 'ও ড্রাফট' : ''}
           </button>
           <button onClick={() => setActiveTab('settings')} className={`px-4 md:px-6 py-2 text-sm md:text-base font-bold rounded transition ${activeTab==='settings' ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>সিকিউরিটি</button>
        </div>

        {activeTab === 'add' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required type="text" placeholder="শিরোনাম" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-3 rounded font-bold focus:outline-none focus:ring-2 focus:ring-red-200" />
            <textarea required placeholder="হোমপেজের জন্য সারাংশ স্নিপেট" value={snippet} onChange={(e) => setSnippet(e.target.value)} className="w-full border p-3 rounded h-16 focus:outline-none focus:ring-2 focus:ring-red-200 text-sm md:text-base" />
            <textarea required placeholder="খবরের পুরো বিস্তারিত বিবরণ (এখানে প্যারাগ্রাফ করে লিখুন)" value={content} onChange={(e) => setContent(e.target.value)} className="w-full border p-3 rounded h-40 md:h-52 focus:outline-none focus:ring-2 focus:ring-red-200" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="border p-3 rounded font-bold bg-white w-full text-sm md:text-base">
                {allCategories.map((cat, idx) => <option key={idx}>{cat}</option>)}
              </select>
              <input required type="text" placeholder="সূত্র/প্রতিনিধির নাম" value={sourceName} onChange={(e) => setSourceName(e.target.value)} className="border p-3 rounded font-bold w-full text-sm md:text-base" />
              <input type="text" placeholder="ছবির ক্যাপশন/উৎস (যেমন: সংগৃহীত)" value={imageSource} onChange={(e) => setImageSource(e.target.value)} className="border p-3 rounded font-bold w-full text-sm md:text-base" />
            </div>
            
            <div className="border border-gray-300 p-4 md:p-6 rounded bg-gray-50 text-center">
               <label className="block font-bold mb-3 md:mb-4 text-gray-700 text-sm md:text-base">ছবি আপলোড (Cloudinary)</label>
               <input type="file" onChange={handleImageUpload} className="mb-2 text-xs md:text-sm block mx-auto w-full md:w-auto" />
               <p className="text-gray-400 text-xs md:text-sm my-2">- অথবা সরাসরি ছবির ইউআরএল দিন -</p>
               <input type="text" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border p-2 rounded text-xs md:text-sm mb-4 outline-none focus:border-red-400" />
               
               {imageUrl && (
                  <div className="mt-2 md:mt-4 border p-2 bg-white rounded shadow-sm inline-block">
                     <p className="text-[10px] md:text-xs font-bold text-green-600 mb-2">ছবির প্রিভিউ:</p>
                     <img src={imageUrl} alt="Preview" className="w-32 h-24 md:w-48 md:h-32 object-cover rounded mx-auto" />
                  </div>
               )}
            </div>

            {message && <div className={`p-3 text-sm md:text-base font-bold text-center rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-800'}`}>{message}</div>}
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
               <button type="submit" disabled={isUploading || !imageUrl || !title} className="flex-1 bg-red-700 text-white font-bold text-base md:text-lg py-3 rounded hover:bg-red-800 disabled:bg-gray-400 transition shadow-sm">
                  {isUploading ? 'ছবি আপলোড হচ্ছে...' : (
                    editingId ? 'আপডেট করুন' : (user?.role === 'admin' || user?.role === 'editor' ? 'পাবলিশ করুন' : 'সেন্ড টু এডিটর')
                  )}
               </button>
               {editingId && (
                  <button type="button" onClick={resetForm} className="bg-gray-500 text-white font-bold text-base md:text-lg py-3 px-6 rounded hover:bg-gray-600 transition shadow-sm">
                     বাতিল
                  </button>
               )}
            </div>
          </form>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-4">
             <div className="mb-4">
                <input type="text" placeholder="শিরোনাম বা ক্যাটাগরি দিয়ে খুঁজুন..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border-2 border-red-700 p-2 md:p-3 rounded text-sm md:text-base font-bold focus:outline-none bg-red-50/30" />
             </div>
             {filteredNews.length === 0 ? <p className="text-center text-gray-500 py-10 font-bold">কোনো খবর পাওয়া যায়নি।</p> : null}
             
             <div className="flex flex-col gap-3 md:gap-4">
               {filteredNews.map(news => (
                  <div key={news.id} className={`flex flex-col lg:flex-row justify-between lg:items-center border p-3 md:p-4 rounded gap-3 md:gap-4 hover:shadow-sm transition ${!news.is_published ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'}`}>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded text-white ${news.is_published ? 'bg-green-600' : 'bg-orange-500'}`}>
                            {news.is_published ? 'পাবলিশড' : 'পেন্ডিং / ড্রাফট'}
                          </span>
                          <span className="text-[10px] md:text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">{news.category}</span>
                        </div>
                        <h3 className="font-bold text-base md:text-lg text-gray-800 leading-snug mb-1">{news.title}</h3>
                        <p className="text-xs text-gray-500 font-medium">
                          {new Date(news.created_at).toLocaleDateString('bn-BD')} 
                          {(user.role === 'admin' || user.role === 'editor') && news.author_email && (
                            <span className="ml-2 border-l pl-2 border-gray-300">প্রেরক: <span className="text-blue-600">{news.author_email}</span></span>
                          )}
                        </p>
                     </div>
                     <div className="flex flex-wrap gap-2 shrink-0">
                        {news.is_published && (
                          <a href={news.source_url} target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded text-xs md:text-sm font-bold shadow text-center flex-1 sm:flex-none">দেখুন</a>
                        )}
                        <button onClick={() => handleEditClick(news)} className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 md:px-4 md:py-2 rounded text-xs md:text-sm font-bold shadow text-center flex-1 sm:flex-none">এডিট</button>
                        
                        {(user.role === 'admin' || user.role === 'editor') && (
                          <button onClick={() => handlePublishToggle(news)} className={`${news.is_published ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'} text-white px-3 py-1.5 md:px-4 md:py-2 rounded text-xs md:text-sm font-bold shadow text-center flex-1 sm:flex-none`}>
                            {news.is_published ? 'ড্রাফট করুন' : 'পাবলিশ করুন'}
                          </button>
                        )}
                        
                        <button onClick={() => handleDelete(news.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded text-xs md:text-sm font-bold shadow text-center flex-1 sm:flex-none">ডিলিট</button>
                     </div>
                  </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-gray-50 p-4 md:p-6 border rounded shadow-inner max-w-lg mx-auto mt-4">
             <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 border-b pb-2">সুরক্ষা পাসওয়ার্ড পরিবর্তন</h2>
             <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <div>
                   <label className="block font-bold text-xs md:text-sm text-gray-600 mb-1">নতুন শক্তিশালী পাসওয়ার্ড</label>
                   <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="কমপক্ষে ৬ অক্ষরের স্ট্রং পাসওয়ার্ড দিন" className="w-full border p-2 md:p-3 rounded focus:outline-none text-sm md:text-base" required />
                </div>
                {passMessage && <div className={`p-2 text-center text-xs md:text-sm font-bold rounded ${passMessage.includes('✅') ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>{passMessage}</div>}
                <button type="submit" className="bg-gray-800 text-white font-bold py-2 md:py-2.5 rounded hover:bg-black transition text-sm md:text-base shadow-sm">সেভ করুন</button>
             </form>
          </div>
        )}

      </div>
    </div>
  );
}
