require('dotenv').config();
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Gemini API

// Gemini ইনিশিয়ালাইজ করা
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runAIBot() {
  console.log("🚀 Gemini AI বিশ্লেষণধর্মী নিউজ এজেন্ট কাজ শুরু করেছে...");

  const allSources = [
    // --- বাংলাদেশ ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/bangladesh', domain: 'prothomalo.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/national', domain: 'jugantor.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/country', domain: 'ittefaq.com.bd', defaultCategory: 'বাংলাদেশ' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/national', domain: 'bd-pratidin.com', defaultCategory: 'বাংলাদেশ' },
    
    // --- আন্তর্জাতিক ---
    { name: 'BBC Bangla', url: 'https://www.bbc.com/bengali', domain: 'bbc.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/world', domain: 'prothomalo.com', defaultCategory: 'আন্তর্জাতিক' },
    
    // --- খেলাধুলা ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/sports', domain: 'prothomalo.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/sports', domain: 'jugantor.com', defaultCategory: 'খেলাধুলা' },

    // --- বাণিজ্য ---
    { name: 'Dhaka Post', url: 'https://www.dhakapost.com/economy', domain: 'dhakapost.com', defaultCategory: 'বাণিজ্য' },
    { name: 'TBS News', url: 'https://www.tbsnews.net/bangla/economy', domain: 'tbsnews.net', defaultCategory: 'বাণিজ্য' }
  ];

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // API লিমিট যেন ক্রস না করে তাই প্রতিবার ৫টি সোর্স থেকে ডাটা নেবে
  const sourcesToScrape = shuffleArray([...allSources]).slice(0, 5);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  for (let source of sourcesToScrape) {
    console.log(`\n👉 ডাটা খুঁজছে: ${source.name} (${source.defaultCategory})`);
    try {
      const response = await fetch(source.url, { headers });
      if (!response.ok) continue;
      
      const html = await response.text();
      const $ = cheerio.load(html);
      let links = [];
      
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && href.length > 40 && href.includes(source.domain) && !links.includes(href)) {
          links.push(href);
        }
      });

      // Gemini API এর স্প্যাম লিমিট এড়াতে প্রতি সোর্স থেকে ২টি খবর প্রসেস করা হবে
      const topLinks = links.slice(0, 2); 
      
      for (let link of topLinks) {
        const articleRes = await fetch(link, { headers });
        const articleHtml = await articleRes.text();
        const article$ = cheerio.load(articleHtml);

        let title = article$('meta[property="og:title"]').attr('content') || article$('h1').first().text().trim() || article$('title').text();
        let image_url = article$('meta[property="og:image"]').attr('content');
        if (image_url && image_url.startsWith('/')) {
            image_url = `https://${source.domain}${image_url}`;
        }
        
        let rawArticleText = '';
        article$('p').each((i, el) => {
            rawArticleText += article$(el).text() + '\n';
        });

        if (title && rawArticleText.length > 300) {
          const { data: existing } = await supabase.from('news').select('id').eq('title', title);
          
          if (existing.length === 0) {
            console.log(`🧠 Gemini AI নিউজ জেনারেট করছে: ${title.substring(0, 30)}...`);
            
            const prompt = `
            তুমি একজন প্রফেশনাল এবং বিশ্লেষণধর্মী নিউজ এডিটর। নিচের কাঁচা খবরটি পড়ে সম্পূর্ণ ভিন্ন আঙ্গিকে, নতুন শব্দে একটি বিশ্লেষণধর্মী নিউজ তৈরি করো। খবরটি হুবহু কপি করা যাবে না। 
            
            নিচের সাব-হেডিংগুলো ব্যবহার করে আউটপুট দিবে (HTML ফরম্যাটে):
            <h3>প্রেক্ষাপট:</h3>
            <p>[খবরের মূল সারাংশ]</p>
            <h3>প্রধান চিত্র:</h3>
            <p>[মূল ঘটনা]</p>
            <h3>আমাদের পর্যবেক্ষণ ও ঘটনার পেছনের সত্য:</h3>
            <p>[তোমার নিজস্ব লজিক্যাল বিশ্লেষণ]</p>
            <h3>গুরুত্বপূর্ণ তথ্যসমূহ:</h3>
            <ul><li>[পয়েন্ট ১]</li><li>[পয়েন্ট ২]</li></ul>
            <p><br><strong>তথ্যসূত্র ও কৃতজ্ঞতা:</strong> এই প্রতিবেদনটি তৈরিতে বিভিন্ন জাতীয় দৈনিক এবং ${source.name} এর প্রকাশিত তথ্যের সহায়তা নেওয়া হয়েছে।</p>
            
            কাঁচা খবর:
            ${rawArticleText.substring(0, 2500)}
            `;

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const aiGeneratedContent = result.response.text();

            let cleanSnippet = aiGeneratedContent.replace(/<[^>]*>?/gm, '').substring(0, 150) + "...";

            await supabase.from('news').insert([{
              title: title,
              snippet: cleanSnippet,
              content: aiGeneratedContent,
              image_url: image_url,
              source_url: link,
              source_name: "বঙ্গীয় টাইমস ডেস্ক",
              category: source.defaultCategory,
              is_custom: true // এআই নিউজ হিসেবে মার্ক করা হলো
            }]);
            console.log(`✅ AI নিউজ সফলভাবে পাবলিশ হয়েছে!`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ ${source.name} ক্র্যাশ করেছে:`, err.message);
    }
  }
  console.log("\n🎉 Gemini AI বটের কাজ সফলভাবে শেষ!");
}

runAIBot();
