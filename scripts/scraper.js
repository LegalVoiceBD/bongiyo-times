const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cloudinary = require('cloudinary').v2;

// ১. কনফিগারেশন সেটআপ
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ২. হেল্পার ফাংশন: বটের কাজ কিছুক্ষণ থামিয়ে রাখার জন্য (Rate Limit এড়াতে)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBot() {
  console.log("🚀 মেগা লটারি বট কাজ শুরু করেছে...");

  const allSources = [
    // --- বাংলাদেশ ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/bangladesh', domain: 'prothomalo.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/national', domain: 'jugantor.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/country', domain: 'ittefaq.com.bd', defaultCategory: 'বাংলাদেশ' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/national', domain: 'kalerkantho.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Samakal', url: 'https://samakal.com/bangladesh', domain: 'samakal.com', defaultCategory: 'বাংলাদেশ' },
    
    // --- আন্তর্জাতিক ---
    { name: 'BBC Bangla', url: 'https://www.bbc.com/bengali', domain: 'bbc.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/world', domain: 'prothomalo.com', defaultCategory: 'আন্তর্জাতিক' },
    
    // --- খেলাধুলা ---
    { name: 'Jugantor', url: 'https://www.jugantor.com/sports', domain: 'jugantor.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/sports', domain: 'prothomalo.com', defaultCategory: 'খেলাধুলা' },
    
    // --- বিনোদন ---
    { name: 'Samakal', url: 'https://samakal.com/entertainment', domain: 'samakal.com', defaultCategory: 'বিনোদন' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/entertainment', domain: 'ittefaq.com.bd', defaultCategory: 'বিনোদন' },
    
    // --- প্রযুক্তি ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/technology', domain: 'prothomalo.com', defaultCategory: 'প্রযুক্তি' }
  ];

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const sourcesToScrape = shuffleArray([...allSources]).slice(0, 15);
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  // স্ট্রিক্ট ইউআরএল ভ্যালিডেশন
  function isStrictlyValid(url, expectedCategory) {
    const lowerUrl = url.toLowerCase();
    const generalBadWords = ['tag', 'author', 'video', 'topic', 'page', 'login', 'archive', 'photo'];
    if (generalBadWords.some(word => lowerUrl.includes(`/${word}`))) return false;
    if (!/\d/.test(lowerUrl)) return false;
    return true;
  }

  let processedArticlesCount = 0;
  const MAX_ARTICLES_PER_RUN = 10; // এক রানে সর্বোচ্চ ১০টি নিউজ নিবে

  for (let source of sourcesToScrape) {
    if (processedArticlesCount >= MAX_ARTICLES_PER_RUN) break;

    console.log(`\n👉 স্ক্র্যাপ হচ্ছে: ${source.name} (${source.defaultCategory})`);
    try {
      const response = await fetch(source.url, { headers });
      if (!response.ok) continue;
      
      const html = await response.text();
      const $ = cheerio.load(html);
      let links = [];
      
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && href.length > 40 && isStrictlyValid(href, source.defaultCategory)) {
          if (href.startsWith('/')) href = `https://www.${source.domain}${href}`;
          if (href.includes(source.domain) && !links.includes(href)) {
            links.push(href);
          }
        }
      });

      const topLinks = links.slice(0, 2); // প্রতিটি সোর্স থেকে ২টি করে লিংক নিবে
      
      for (let link of topLinks) {
        if (processedArticlesCount >= MAX_ARTICLES_PER_RUN) break;

        // চেক করুন এই URL আগে সেভ করা হয়েছে কিনা
        const { data: existingUrl } = await supabase.from('news').select('id').eq('source_url', link);
        if (existingUrl && existingUrl.length > 0) {
            console.log(`⚠️ খবরটি আগে থেকেই ডাটাবেসে আছে, স্কিপ করা হলো।`);
            continue;
        }

        const articleRes = await fetch(link, { headers });
        const articleHtml = await articleRes.text();
        const article$ = cheerio.load(articleHtml);

        // পুরো খবরের টেক্সট বের করা
        const fullTextArray = [];
        article$('p').each((i, el) => {
          const text = article$(el).text().trim();
          if (text.length > 30) fullTextArray.push(text);
        });
        const fullText = fullTextArray.join('\n');

        if (fullText.length < 300) {
            console.log(`⚠️ খবরটি খুব ছোট, স্কিপ করা হলো।`);
            continue; 
        }

        let original_image_url = article$('meta[property="og:image"]').attr('content');
        if (original_image_url && original_image_url.startsWith('/')) {
            original_image_url = `https://${source.domain}${original_image_url}`;
        }

        if (fullText && original_image_url) {
          console.log(`🧠 জেমিনি এপিআই দিয়ে বিশ্লেষণ শুরু হচ্ছে...`);
          
          try {
            // ১. জেমিনি প্রম্পট
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
            তুমি একজন প্রফেশনাল সাংবাদিক এবং নিউজ বিশ্লেষক। নিচে একটি খবরের মূল অংশ দেওয়া হলো। তোমার কাজ হলো খবরটিকে নিজের ভাষায় বিশ্লেষণ করে নতুনভাবে লেখা।
            
            শর্তসমূহ:
            ১. খবরের প্রথম লাইনেই মূল পত্রিকার নাম উল্লেখ করে স্বাভাবিকভাবে লিখতে হবে। যেমন: "আজকের ${source.name} পত্রিকায় প্রকাশিত একটি খবরে বলা হয়েছে যে..." বা "সম্প্রতি ${source.name} এর একটি প্রতিবেদনে জানা গেছে..."।
            ২. খবরটির একটি নতুন, ইউনিক এবং আকর্ষণীয় শিরোনাম দিতে হবে।
            ৩. খবরের মূল তথ্য ঠিক রেখে একটি সুন্দর বিশ্লেষণমূলক বিস্তারিত অংশ লিখতে হবে।
            ৪. পুরো লেখাটি অবশ্যই শুদ্ধ বাংলায় হবে।
            ৫. আউটপুটটি শুধুমাত্র JSON ফরম্যাটে দিবে। অন্য কোনো টেক্সট বা মার্কডাউন কোড ব্লক (যেমন \`\`\`json) ব্যবহার করবে না। 
            অবশ্যই এই JSON স্ট্রাকচার ফলো করবে: {"title": "নতুন শিরোনাম", "content": "পুরো খবরের বিস্তারিত টেক্সট"}
            
            মূল খবর:
            ${fullText}
            `;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text();
            
            // JSON ক্লিনিং
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const rewrittenData = JSON.parse(responseText);

            // ২. ক্লাউডিনারিতে ছবি আপলোড
            console.log(`☁️ ক্লাউডিনারিতে ছবি আপলোড হচ্ছে...`);
            let cloudinaryImageUrl = original_image_url;
            try {
                const uploadResult = await cloudinary.uploader.upload(original_image_url, {
                    folder: 'bongiyo_times',
                });
                cloudinaryImageUrl = uploadResult.secure_url;
            } catch (imgError) {
                console.error("❌ ক্লাউডিনারি আপলোড ফেইল করেছে, অরিজিনাল ছবি ব্যবহার করা হচ্ছে।");
            }

            // ৩. সুপাবেজে ডেটা সেভ
            await supabase.from('news').insert([{
              title: rewrittenData.title,
              content: rewrittenData.content, // পুরো খবর
              snippet: rewrittenData.content.substring(0, 150) + "...", // খবরের প্রথম ১৫০ অক্ষর
              image_url: cloudinaryImageUrl,
              source_url: link,
              source_name: source.name,
              category: source.defaultCategory,
              image_source: `ছবি সংগৃহীত: ${source.name}`
            }]);
            
            console.log(`✅ সেভ হয়েছে: ${rewrittenData.title.substring(0, 40)}...`);
            processedArticlesCount++;
            
            // এপিআই লিমিট এড়াতে ৮ সেকেন্ড অপেক্ষা
            await delay(8000); 

          } catch (apiError) {
            console.error("❌ জেমিনি বা সুপাবেজ এরর:", apiError.message);
          }
        }
      }
    } catch (err) {
      console.error(`❌ ${source.name} ক্র্যাশ করেছে:`, err.message);
    }
  }
  console.log(`\n🎉 বটের কাজ সফলভাবে শেষ! মোট প্রসেস করা নিউজ: ${processedArticlesCount}`);
}

runBot();
