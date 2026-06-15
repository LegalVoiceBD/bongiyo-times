const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

async function runBot() {
  console.log("🚀 স্মার্ট বট কাজ শুরু করেছে...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const sources = [
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/collection/latest', domain: 'prothomalo.com' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/all-latest-news', domain: 'jugantor.com' },
    { name: 'Somoy TV', url: 'https://www.somoynews.tv/latest', domain: 'somoynews.tv' },
    { name: 'BBC Bangla', url: 'https://www.bbc.com/bengali', domain: 'bbc.com' }
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  };

  // লিংক থেকে ক্যাটাগরি বোঝার ম্যাজিক ফাংশন
  function getCategoryFromUrl(url) {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('sports') || lowerUrl.includes('khela')) return 'খেলাধুলা';
    if (lowerUrl.includes('entertainment') || lowerUrl.includes('binodon')) return 'বিনোদন';
    if (lowerUrl.includes('bangladesh') || lowerUrl.includes('national')) return 'বাংলাদেশ';
    if (lowerUrl.includes('international') || lowerUrl.includes('world')) return 'আন্তর্জাতিক';
    if (lowerUrl.includes('politics')) return 'রাজনীতি';
    if (lowerUrl.includes('business') || lowerUrl.includes('economy')) return 'বাণিজ্য';
    if (lowerUrl.includes('technology') || lowerUrl.includes('tech') || lowerUrl.includes('it')) return 'প্রযুক্তি';
    return 'সর্বশেষ';
  }

  for (let source of sources) {
    console.log(`\n👉 খবর খোঁজা হচ্ছে: ${source.name}`);
    try {
      const response = await fetch(source.url, { headers });
      const html = await response.text();
      const $ = cheerio.load(html);
      let links = [];
      
      // ফালতু লিংক বাদ দিয়ে শুধু আসল খবরের লিংক নেওয়া (যেগুলোর সাইজ বড়)
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && href.length > 45 && !href.includes('tag') && !href.includes('category') && !href.includes('author') && !href.includes('video')) {
          if (href.startsWith('/')) href = `https://www.${source.domain}${href}`;
          if (href.includes(source.domain) && !links.includes(href)) {
            links.push(href);
          }
        }
      });

      const topLinks = links.slice(0, 4); // প্রতি সাইট থেকে ৪টি খবর
      
      for (let link of topLinks) {
        const articleRes = await fetch(link, { headers });
        const articleHtml = await articleRes.text();
        const article$ = cheerio.load(articleHtml);

        let title = article$('meta[property="og:title"]').attr('content') || article$('title').text();
        let snippet = article$('meta[property="og:description"]').attr('content') || article$('meta[name="description"]').attr('content') || "বিস্তারিত পড়তে মূল খবরে ক্লিক করুন...";
        let image_url = article$('meta[property="og:image"]').attr('content');
        
        // খবরের টাইটেল যদি ফালতু হয়, তবে স্কিপ করবে
        if (title && image_url && !title.includes('আজকের খবর') && !title.includes('ব্রেকিং নিউজ')) {
          
          const newsCategory = getCategoryFromUrl(link);
          
          const { data: existing } = await supabase.from('news').select('id').eq('title', title);
          
          if (existing.length === 0) {
            await supabase.from('news').insert([{
              title: title,
              snippet: snippet.substring(0, 150) + "...",
              image_url: image_url,
              source_url: link,
              source_name: source.name,
              category: newsCategory // এখানে ক্যাটাগরি সেভ হচ্ছে
            }]);
            console.log(`✅ সেভ হয়েছে (${newsCategory}): ${title.substring(0, 40)}...`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ ${source.name} থেকে খবর আনতে সমস্যা:`, err.message);
    }
  }
  console.log("\n🎉 বটের কাজ শেষ!");
}

runBot();
