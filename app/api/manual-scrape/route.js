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
তুমি একজন আন্তর্জাতিক মানের সিনিয়র সাংবাদিক, অনুসন্ধানী রিপোর্টার এবং নিউজ এডিটর। নিচে একটি ওয়েবপেজ থেকে সংগৃহীত টেক্সট দেওয়া হয়েছে।

========================
প্রথম ধাপ: সংবাদ যাচাই (Mandatory Validation)
========================

প্রথমে নিচের বিষয়গুলো কঠোরভাবে যাচাই করবে।

১. এটি যদি নিম্নোক্ত যেকোনো ধরনের লেখা হয় তাহলে বাতিল করবে:
- Privacy Policy
- Terms & Conditions
- About Us
- Contact
- Disclaimer
- Advertisement
- Cookie Policy
- Editorial Policy
- মতামত বা Opinion
- ব্লগ
- ক্যাটাগরি পেজ
- আর্কাইভ
- ট্যাগ পেজ
- নেভিগেশন বা ওয়েবসাইটের সাধারণ লেখা

২. টেক্সটটি যদি একাধিক সম্পর্কহীন খবরের শিরোনাম বা নিউজের মিশ্রণ (Mixed Headlines) হয় তাহলে বাতিল করবে।

৩. নিচের সাম্প্রতিক সংবাদগুলোর সাথে যদি একই ঘটনা, একই শিরোনাম অথবা একই সংবাদ পুনরাবৃত্তি হয় তাহলে বাতিল করবে।

সাম্প্রতিক সংবাদ:
[${recentTitles}]

উপরের যেকোনো একটি শর্ত সত্য হলে শুধুমাত্র এই JSON রিটার্ন করবে:

{"skip": true}

এর বাইরে আর কোনো লেখা দেবে না।

========================
দ্বিতীয় ধাপ: সংবাদ তৈরি
========================

যদি এটি একটি নতুন, নির্ভরযোগ্য এবং সম্পূর্ণ সংবাদ হয়, তাহলে নিচের নিয়মগুলো কঠোরভাবে অনুসরণ করবে।

### ১. শিরোনাম (Title)

- শিরোনাম হবে জাতীয় দৈনিক পত্রিকার প্রথম পাতার মানের।
- সংক্ষিপ্ত, শক্তিশালী, তথ্যসমৃদ্ধ এবং আকর্ষণীয় হবে।
- Clickbait করা যাবে না।
- কোলন (:), ড্যাশ (-), পাইপ (|) বা দুই ভাগে বিভক্ত শিরোনাম ব্যবহার করা যাবে না।
- শিরোনামে অতিরঞ্জিত বিশেষণ ব্যবহার করবে না।

### ২. ভূমিকা (Intro)

প্রথম অনুচ্ছেদটি হবে সম্পূর্ণ নতুনভাবে লেখা।

খবরের শুরুতেই স্বাভাবিকভাবে সোর্স উল্লেখ করবে।

এই HTML ট্যাগটি অপরিবর্তিতভাবে ব্যবহার করবে:

<a href='${link}' target='_blank' style='color:#0056b3;text-decoration:underline;'>${source.bnName}</a>

এই <a> ট্যাগ ছাড়া অন্য কোনো HTML ব্যবহার করা যাবে না।

### ৩. মূল প্রতিবেদন

- পুরো সংবাদ নিজের ভাষায় পুনর্লিখন করবে।
- মূল তথ্য বিকৃত করা যাবে না।
- কোনো তথ্য বানানো যাবে না।
- কোনো অনুমান যোগ করা যাবে না।
- কোনো রাজনৈতিক বা ব্যক্তিগত পক্ষপাত থাকবে না।
- সাংবাদিকতার নিরপেক্ষতা বজায় রাখতে হবে।
- প্রতিটি অনুচ্ছেদ আলাদা করতে শুধুমাত্র \\n\\n ব্যবহার করবে।
- <p>, <div>, <br>, Markdown বা অন্য কোনো HTML ব্যবহার করা যাবে না।
- "ছবি সংগৃহীত" বা অনুরূপ কোনো বাক্য যোগ করা যাবে না।

========================
========================
তৃতীয় ধাপ: AI Image Prompt
========================

image_prompt অবশ্যই ইংরেজিতে লিখবে।

এটি AI Image Generator-এর জন্য Professional Editorial Image Prompt হবে।

সর্বোচ্চ ৩০০ অক্ষরের মধ্যে লিখবে।

নিচের নিয়মগুলো বাধ্যতামূলক:

✔ ছবিটিকে কোনোভাবেই ধূসর বা অনুজ্জ্বল (grayish/dull) করা যাবে না। ছবিটিকে অত্যন্ত ঝকঝকে, রঙিন (Colorful) এবং মডার্ন ফটোগ্রাফির মতো করতে প্রম্পটের শেষে এই কিওয়ার্ডগুলো অবশ্যই যুক্ত করবে: "Vibrant colors, modern digital photography, bright natural daylight, ultra-clear, vivid color palette, high contrast, 8k resolution, award-winning photojournalism, sharp focus."

✔ **খুবই জরুরি:** কোনো মানুষের হাতের ক্লোজ-আপ, আঙুল বা হাত দিয়ে কোনো কাগজ/সার্টিফিকেট ধরে রাখার দৃশ্য প্রম্পটে একদমই দেবে না (কারণ AI হাতের গঠন ঠিকমতো বানাতে পারে না)। 

✔ **বিকল্প দৃশ্য:** শিক্ষার খবরের ক্ষেত্রে 'টেবিলের ওপর রাখা চশমা ও বই', অপরাধের ক্ষেত্রে 'অন্ধকার রাস্তায় পুলিশের গাড়ির লাল-নীল আলো', বিনোদনের ক্ষেত্রে 'একটি খালি ডিরেক্টরস চেয়ার বা সিনেমাটিক স্পটলাইট' — এ ধরনের নিরাপদ এবং টেক্সট-বিহীন (Text-free) দৃশ্য বর্ণনা করবে।

✔ প্রম্পটে "cinematic lighting", "moody" বা "faded" জাতীয় শব্দ ব্যবহার করবে না।

✔ ছবিটি হবে সম্পূর্ণ প্রতীকী (Symbolic) কিন্তু একটি কংক্রিট দৃশ্য (Concrete Scene)। কোনো আজগুবি বা ভাসমান বস্তু তৈরি করবে না।

✔ বাস্তব ঘটনাকে বিভ্রান্তিকরভাবে পুনর্নির্মাণ করবে না।

✔ যদি কোনো ব্যক্তি বা প্রতিষ্ঠান নিয়ে সংবাদ হয়, তাহলে তাদের মুখ, পরিচয় বা নির্দিষ্ট চেহারা দেখাবে না। কোনো রাজনৈতিক নেতা, অভিনেতা, ক্রীড়াবিদ বা সেলিব্রিটির নাম লিখবে না।

✔ Generic মানুষ (খুব দূরের শট), silhouette, cityscape, infrastructure, objects on desk, courtroom gavel, police lights, hospital corridor, school building, agriculture, technology ইত্যাদি প্রতীকী কিন্তু অত্যন্ত কালারফুল ও রিয়ালিস্টিক উপস্থাপনা ব্যবহার করবে।

✔ ছবিতে কোনো Text, Typography, Caption, Watermark, Logo, Banner, Signboard, Number বা লেখা থাকবে না।

✔ No blood, No injuries, No dead body, No violence, No weapon, No graphic content, No disturbing scene, No misleading reconstruction.

✔ Google AdSense Safe, Editorial Safe, Family Friendly.
========================
চতুর্থ ধাপ: JSON Output
========================

শুধুমাত্র Valid JSON রিটার্ন করবে।

অন্য কোনো ব্যাখ্যা লিখবে না।

Output Format:

{
  "skip": false,
  "title": "নতুন সংবাদ শিরোনাম",
  "content": "সম্পূর্ণ সংবাদ",
  "image_prompt": "Professional symbolic editorial AI image prompt in English"
}

========================
মূল সংবাদ
========================

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
