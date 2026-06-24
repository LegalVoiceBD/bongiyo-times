require('dotenv').config();
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runAIBot() {
  console.log("🚀 Gemini AI বিশ্লেষণধর্মী নিউজ এজেন্ট কাজ শুরু করেছে...");

  const allSources = [
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/bangladesh', domain: 'prothomalo.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/national', domain: 'jugantor.com', defaultCategory: 'বাংলাদেশ' }
  ];

  const headers = { 'User-Agent': 'Mozilla/5.0' };

  for (let source of allSources) {
    try {
      const response = await fetch(source.url, { headers });
      const html = await response.text();
      const $ = cheerio.load(html);
      
      let links = [];
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && href.length > 40 && href.includes(source.domain) && !links.includes(href)) {
          links.push(href);
        }
      });

      const topLinks = links.slice(0, 1); // পরীক্ষার জন্য ১টি লিংক
      
      for (let link of topLinks) {
        const articleRes = await fetch(link, { headers });
        const articleHtml = await articleRes.text();
        const article$ = cheerio.load(articleHtml);

        let title = article$('h1').first().text().trim();
        let image_url = article$('meta[property="og:image"]').attr('content');
        let rawArticleText = article$('p').text().substring(0, 2000);

        if (title && rawArticleText.length > 200) {
          console.log(`🧠 AI নিউজ জেনারেট করছে: ${title.substring(0, 20)}...`);
          
          const prompt = `নিচের খবরটি নিয়ে একটি বিশ্লেষণধর্মী নিউজ লেখো। নিচের ফরম্যাটে HTML আউটপুট দিবে: 
          <h3>প্রেক্ষাপট:</h3>... <h3>প্রধান চিত্র:</h3>... <h3>আমাদের পর্যবেক্ষণ ও ঘটনার পেছনের সত্য:</h3>... <h3>গুরুত্বপূর্ণ তথ্যসমূহ:</h3><ul><li>...</li></ul> <p>তথ্যসূত্র: ${source.name}</p> 
          খবর: ${rawArticleText}`;

          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent(prompt);
          const aiContent = result.response.text();

          // ইনসার্ট করার সময় ডাটাবেজের সব কলাম চেক করা
          const { data, error } = await supabase.from('news').insert([{
            title: title,
            snippet: aiContent.replace(/<[^>]*>?/gm, '').substring(0, 100) + "...",
            content: aiContent,
            image_url: image_url,
            source_url: link,
            source_name: "বঙ্গীয় টাইমস ডেস্ক",
            category: source.defaultCategory,
            is_custom: true,
            is_published: false // ড্রাফট হিসেবে সেভ হবে
          }]);

          if (error) {
            console.error("❌ ডাটাবেজ ইনসার্ট এরর:", error);
          } else {
            console.log("✅ নিউজ সফলভাবে ড্রাফট হয়েছে!");
          }
        }
      }
    } catch (err) {
      console.error(`❌ এরর:`, err.message);
    }
  }
}

runAIBot();
