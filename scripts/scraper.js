const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

async function runBot() {
  console.log("বট কাজ শুরু করেছে...");

  // সুপাবেজ কানেকশন চেক করা
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("❌ Error: Supabase URL বা Key পাওয়া যায়নি! GitHub Secrets চেক করুন।");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const targetUrl = 'https://www.prothomalo.com/sports'; 
  const sourceName = 'Prothom Alo';

  try {
    // পত্রিকাগুলো যেন বুঝতে না পারে যে এটা বট, তাই সাধারণ ব্রাউজারের পরিচয় দেওয়া হলো
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    };

    const response = await fetch(targetUrl, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let links = [];
    
    // হোমপেজ থেকে খবরের লিংকগুলো খুঁজে বের করা
    $('a').each((i, el) => {
      let href = $(el).attr('href');
      if (href && href.includes('/sports/') && !links.includes(href)) {
        links.push(href.startsWith('http') ? href : `https://www.prothomalo.com${href}`);
      }
    });

    const topLinks = links.slice(0, 3);
    
    if(topLinks.length === 0) {
         console.log("❌ কোনো খবরের লিংক পাওয়া যায়নি।");
         return;
    }

    for (let link of topLinks) {
      const articleRes = await fetch(link, { headers });
      const articleHtml = await articleRes.text();
      const article$ = cheerio.load(articleHtml);

      // মেটা ট্যাগ থেকে গুগল নিউজের স্টাইলে হেডলাইন, ছবি ও স্নিপেট কপি করা
      const title = article$('meta[property="og:title"]').attr('content');
      const snippet = article$('meta[property="og:description"]').attr('content') || article$('meta[name="description"]').attr('content');
      const image_url = article$('meta[property="og:image"]').attr('content');

      if (title && image_url) {
        // ডাটাবেসে সেভ করা
        const { data, error } = await supabase.from('news').insert([
          {
            title: title,
            snippet: snippet ? snippet.substring(0, 150) + "..." : "বিস্তারিত জানতে ক্লিক করুন...",
            image_url: image_url,
            source_url: link,
            source_name: sourceName
          }
        ]);

        if (error) {
          console.log(`❌ সেভ করতে সমস্যা (${title}):`, error.message);
        } else {
          console.log(`✅ সফলভাবে যুক্ত হয়েছে: ${title}`);
        }
      }
    }
    console.log("🎉 বটের কাজ সফলভাবে শেষ হয়েছে!");
  } catch (err) {
    console.error("❌ বট ক্র্যাশ করেছে:", err.message);
    process.exit(1);
  }
}

runBot();
