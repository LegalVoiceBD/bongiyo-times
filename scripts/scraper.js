const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

async function runBot() {
  console.log("🚀 ক্যাটাগরি-নির্ভর স্মার্ট বট কাজ শুরু করেছে...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // আপনার দেওয়া নির্দিষ্ট লিংকগুলো এখানে যুক্ত করা হয়েছে (সাথে হার্ডকোডেড ক্যাটাগরি)
  const sources = [
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/online/todaynews', domain: 'bd-pratidin.com', defaultCategory: 'সর্বশেষ' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/national', domain: 'bd-pratidin.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/special/recent', domain: 'kalerkantho.com', defaultCategory: 'সর্বশেষ' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/national', domain: 'kalerkantho.com', defaultCategory: 'বাংলাদেশ' },
     { name: 'Prothom Alo', url: 'https://www.prothomalo.com/bangladesh', domain: 'prothomalo.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/collection/latest', domain: 'prothomalo.com', defaultCategory: 'সর্বশেষ' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/all-latest-news', domain: 'jugantor.com', defaultCategory: 'সর্বশেষ' },
    { name: 'BBC Bangla', url: 'https://www.bbc.com/bengali', domain: 'bbc.com', defaultCategory: 'আন্তর্জাতিক' }
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  };

  // লিংক থেকে ক্যাটাগরি বোঝার ম্যাজিক ফাংশন (যদি defaultCategory না দেওয়া থাকে)
  function getCategoryFromUrl(url) {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('sports') || lowerUrl.includes('khela')) return 'খেলাধুলা';
    if (lowerUrl.includes('entertainment') || lowerUrl.includes('binodon')) return 'বিনোদন';
    if (lowerUrl.includes('business') || lowerUrl.includes('economy')) return 'বাণিজ্য';
    return 'সর্বশেষ';
  }

  function isRealArticle(url) {
    const lowerUrl = url.toLowerCase();
    const badWords = ['tag', 'category', 'author', 'video', 'topic', 'page', 'login', 'archive', 'photo', 'gallery'];
    if (badWords.some(word => lowerUrl.includes(word))) return false;
    if (!/\d/.test(lowerUrl)) return false; 
    return true;
  }

  for (let source of sources) {
    console.log(`\n👉 স্ক্র্যাপ হচ্ছে: ${source.name} (${source.defaultCategory})`);
    try {
      const response = await fetch(source.url, { headers });
      if (!response.ok) {
        console.log(`⚠️ সাইট ব্লক করেছে (Status: ${response.status})`);
        continue;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      let links = [];
      
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && href.length > 40 && isRealArticle(href)) {
          if (href.startsWith('/')) href = `https://www.${source.domain}${href}`;
          if (href.includes(source.domain) && !links.includes(href)) {
            links.push(href);
          }
        }
      });

      const topLinks = links.slice(0, 3); // প্রতি পেজ থেকে ৩টি করে টাটকা নিউজ
      
      for (let link of topLinks) {
        const articleRes = await fetch(link, { headers });
        const articleHtml = await articleRes.text();
        const article$ = cheerio.load(articleHtml);

        let title = article$('meta[property="og:title"]').attr('content') || article$('title').text();
        let snippet = article$('meta[property="og:description"]').attr('content') || article$('meta[name="description"]').attr('content') || "বিস্তারিত পড়তে মূল খবরে ক্লিক করুন...";
        let image_url = article$('meta[property="og:image"]').attr('content');
        
        if (title && image_url) {
          const wordCount = title.trim().split(/\s+/).length;
          
          if (!title.includes('404') && wordCount > 4) {
            
            // যদি সোর্সে ক্যাটাগরি বলা থাকে সেটা নেবে, না হলে লিংক থেকে বুঝার চেষ্টা করবে
            const newsCategory = source.defaultCategory || getCategoryFromUrl(link);
            const { data: existing } = await supabase.from('news').select('id').eq('title', title);
            
            if (existing.length === 0) {
              await supabase.from('news').insert([{
                title: title,
                snippet: snippet.substring(0, 150) + "...",
                image_url: image_url,
                source_url: link,
                source_name: source.name,
                category: newsCategory
              }]);
              console.log(`✅ সেভ হয়েছে [${newsCategory}]: ${title.substring(0, 35)}...`);
            }
          }
        }
      }
    } catch (err) {
      console.error(`❌ ${source.name} ক্র্যাশ করেছে:`, err.message);
    }
  }
  console.log("\n🎉 বটের কাজ সফলভাবে শেষ!");
}

runBot();
