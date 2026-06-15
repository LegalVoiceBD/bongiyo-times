const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

async function runBot() {
  console.log("বট কাজ শুরু করেছে...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // আমরা এবার যুগান্তর পত্রিকা দিয়ে টেস্ট করব
  const targetUrl = 'https://www.jugantor.com/sports'; 
  const sourceName = 'Jugantor';

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    };

    console.log("পত্রিকার সাইটে প্রবেশ করা হচ্ছে...");
    const response = await fetch(targetUrl, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let links = [];
    
    // হোমপেজ থেকে খবরের লিংকগুলো খুঁজে বের করা
    $('a').each((i, el) => {
      let href = $(el).attr('href');
      // যুগান্তরের খেলার নিউজের লিংকে সাধারণত sports থাকে
      if (href && href.includes('/sports/') && href.length > 20 && !links.includes(href)) {
        links.push(href.startsWith('http') ? href : `https://www.jugantor.com${href}`);
      }
    });

    console.log(`মোট ${links.length} টি সম্ভাব্য লিংক পাওয়া গেছে।`);
    const topLinks = links.slice(0, 3);
    
    if(topLinks.length === 0) {
         console.log("❌ কোনো খবরের লিংক পাওয়া যায়নি।");
         return;
    }

    for (let link of topLinks) {
      console.log(`খবর পড়া হচ্ছে: ${link}`);
      const articleRes = await fetch(link, { headers });
      const articleHtml = await articleRes.text();
      const article$ = cheerio.load(articleHtml);

      // মেটা ট্যাগ থেকে ডাটা নেওয়া (ফলব্যাক সহ)
      let title = article$('meta[property="og:title"]').attr('content') || article$('title').text();
      let snippet = article$('meta[property="og:description"]').attr('content') || article$('meta[name="description"]').attr('content') || "বিস্তারিত জানতে ক্লিক করুন...";
      let image_url = article$('meta[property="og:image"]').attr('content');

      if (title && image_url) {
        // ডাটাবেসে সেভ করা
        const { data, error } = await supabase.from('news').insert([
          {
            title: title,
            snippet: snippet.substring(0, 150) + "...",
            image_url: image_url,
            source_url: link,
            source_name: sourceName
          }
        ]);

        if (error) {
          console.log(`❌ সেভ করতে সমস্যা:`, error.message);
        } else {
          console.log(`✅ সফলভাবে ডাটাবেসে যুক্ত হয়েছে: ${title}`);
        }
      } else {
         console.log(`⚠️ এই লিংকে হেডলাইন বা ছবি পাওয়া যায়নি।`);
      }
    }
    console.log("🎉 বটের কাজ সফলভাবে শেষ হয়েছে!");
  } catch (err) {
    console.error("❌ বট ক্র্যাশ করেছে:", err.message);
  }
}

runBot();
