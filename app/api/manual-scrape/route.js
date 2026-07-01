// app/api/manual-scrape/route.js
import { NextResponse } from 'next/server';
import cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cloudinary from 'cloudinary';

// Cloudinary Config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Image Upload Helper
async function generateAndUploadImage(imagePrompt) {
  try {
    const encodedPrompt = encodeURIComponent(imagePrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=675&nologo=true`;
    
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error("Image fetch failed");
    
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder: 'bongiyotimes_manual' }, 
        (error, result) => {
          if (error) resolve(null);
          else resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // 1. Fetch HTML and extract text
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const fullTextArray = [];
    $('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 30) fullTextArray.push(text);
    });
    const fullText = fullTextArray.join('\n');

    if (fullText.length < 300) {
      return NextResponse.json({ error: "খবরটি অনেক ছোট বা পড়া যাচ্ছে না।" }, { status: 400 });
    }

    // 2. Gemini Analysis (আপনার ফাইনাল প্রম্পটটি এখানে ব্যবহার করা হয়েছে)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      তুমি একজন আন্তর্জাতিক মানের সিনিয়র সাংবাদিক এবং নিউজ এডিটর। নিচে একটি ওয়েবপেজ থেকে সংগৃহীত টেক্সট দেওয়া হলো।
      
      যদি এটি Privacy Policy, Terms, বা কোনো অসংলগ্ন লেখা হয়, তবে আউটপুট দাও: {"skip": true}
      
      আর যদি এটি খবর হয়, তবে নিচের নিয়মে JSON আউটপুট দাও:
      ১. title: জাতীয় দৈনিকের মানের শিরোনাম (কোলন বা ড্যাশ ছাড়া)।
      ২. content: নিজের ভাষায় পুনর্লিখন করবে। সোর্স লিংক হিসেবে <a href='${url}' target='_blank' style='color:#0056b3;text-decoration:underline;'>সংশ্লিষ্ট সংবাদমাধ্যম</a> ব্যবহার করবে প্রথম প্যারায়।
      ৩. image_prompt: খবরের উপর ভিত্তি করে ইংরেজিতে প্রম্পট (সর্বোচ্চ ৩০০ অক্ষর)। শেষে "Vibrant colors, modern digital photography, bright natural daylight, ultra-clear, vivid color palette, high contrast, 8k resolution, award-winning photojournalism, sharp focus." যুক্ত করবে। কোনো মানুষের হাত, আঙুল, কাগজ ধরার দৃশ্য, চেহারা, নির্দিষ্ট ব্যক্তির নাম বা Text থাকবে না। সম্পূর্ণ প্রতীকী ও নিরাপদ দৃশ্য হবে।
      
      Output Format:
      {"skip": false, "title": "নতুন সংবাদ শিরোনাম", "content": "সম্পূর্ণ সংবাদ", "image_prompt": "Prompt"}

      মূল সংবাদ:
      ${fullText}
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const rewrittenData = JSON.parse(responseText);

    if (rewrittenData.skip) {
      return NextResponse.json({ error: "এটি কোনো উপযুক্ত সংবাদ নয়।" }, { status: 400 });
    }

    // 3. AI Image Generation
    let finalImageUrl = 'https://res.cloudinary.com/.../default.jpg'; // আপনার ডিফল্ট ইমেজ লিংক দিন
    if (rewrittenData.image_prompt) {
      const uploadedImageUrl = await generateAndUploadImage(rewrittenData.image_prompt);
      if (uploadedImageUrl) finalImageUrl = uploadedImageUrl;
    }

    // 4. Save to Supabase as DRAFT (is_published: false)
    const { data, error: insertError } = await supabase.from('news').insert([{
      title: rewrittenData.title,
      content: rewrittenData.content,
      snippet: rewrittenData.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + "...", 
      image_url: finalImageUrl,
      source_url: url,
      source_name: 'বঙ্গীয় টাইমস',
      category: 'সর্বশেষ', // বা ড্রপডাউন থেকে ডাইনামিক ক্যাটাগরি নিতে পারেন
      image_source: 'এআই জেনারেটেড',
      is_published: false, // ⚠️ ড্রাফট হিসেবে সেভ হবে
      is_custom: true
    }]).select();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, message: "খবরটি সফলভাবে ড্রাফট করা হয়েছে!", data: data[0] });

  } catch (error) {
    console.error("Manual Scrape Error:", error);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
