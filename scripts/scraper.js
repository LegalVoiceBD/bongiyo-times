const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

async function runBot() {
  console.log("🚀 ইউনিভার্সাল বট কাজ শুরু করেছে...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // আপনার পছন্দের সব গণমাধ্যমের লিস্ট (এখানে আপনি পরে আরও যোগ করতে পারবেন)
  const sources = [
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/collection/latest', domain: 'prothomalo.com' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/all-latest-news', domain: 'jugantor.com' },
    { name: 'Somoy TV', url: 'https://www.somoynews.tv/latest', domain: 'somoynews.tv' },
    { name: 'BBC Bangla', url: 'https://www.bbc.com/bengali', domain: 'bbc.com' },
    { name: 'Anandabazar', url: 'https://www.anandabazar.com/', domain: 'anandabazar.com' }
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  };

  for (let source of sources) {
    console.log(`\n👉 খবর খোঁজা হচ্ছে: ${source.name}`);
    try {
      const response = await fetch(source.url, { headers });
      const html = await response.text();
      const $ = cheerio.load(html);
      let links = [];
      
      // ওই পত্রিকার সব লিংকের মধ্য থেকে শুধু আসল খবরের লিংকগুলো ছেঁকে বের করা
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && href.length > 30 && !href.includes('facebook') && !href.includes('video')) {
          if (href.startsWith('/')) href = `https://www.${source.domain}${href}`;
          if (href.includes(source.domain) && !links.includes(href)) {
            links.push(href);
          }
        }
      });

      // প্রতি পত্রিকা থেকে দ্রুত ৩টি করে টাটকা খবর নেওয়া হচ্ছে
      const topLinks = links.slice(0, 3);
      
      for (let link of topLinks) {
        const articleRes = await fetch(link, { headers });
        const articleHtml = await articleRes.text();
        const article$ = cheerio.load(articleHtml);

        // মেটা ট্যাগ থেকে আসল খবর চুরি করা (গুগল নিউজের স্টাইল)
        let title = article$('meta[property="og:title"]').attr('content') || article$('title').text();
        let snippet = article$('meta[property="og:description"]').attr('content') || article$('meta[name="description"]').attr('content') || "বিস্তারিত পড়তে মূল খবরে ক্লিক করুন...";
        let image_url = article$('meta[property="og:image"]').attr('content');

        if (title && image_url) {
          // ডাটাবেসে ডুপ্লিকেট খবর আছে কি না চেক করা
          const { data: existing } = await supabase.from('news').select('id').eq('title', title);
          
          if (existing.length === 0) {
            await supabase.from('news').insert([{
              title: title,
              snippet: snippet.substring(0, 150) + "...",
              image_url: image_url,
              source_url: link,
              source_name: source.name
            }]);
            console.log(`✅ সেভ হয়েছে: ${title.substring(0, 40)}...`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ ${source.name} থেকে খবর আনতে সমস্যা:`, err.message);
    }
  }
  console.log("\n🎉 বটের কাজ সফলভাবে শেষ হয়েছে!");
}

runBot();
