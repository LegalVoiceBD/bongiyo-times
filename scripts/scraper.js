const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

// সুপাবেজ কানেকশন
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runBot() {
  console.log("বট কাজ শুরু করেছে...");
  
  // উদাহরণ হিসেবে প্রথম আলোর খেলাধুলার পেজ দেওয়া হলো (আপনি পরে যেকোনো পত্রিকার লিংক দিতে পারবেন)
  const targetUrl = 'https://www.prothomalo.com/sports'; 
  const sourceName = 'Prothom Alo';

  try {
    const response = await fetch(targetUrl);
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

    // দ্রুত কাজের জন্য প্রথম ৩টি খবর নেওয়া হলো
    const topLinks = links.slice(0, 3);

    for (let link of topLinks) {
      const articleRes = await fetch(link);
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
          console.log("খবর সেভ করতে সমস্যা হয়েছে:", error.message);
        } else {
          console.log("সফলভাবে যুক্ত হয়েছে:", title);
        }
      }
    }
    console.log("বটের কাজ সফলভাবে শেষ হয়েছে!");
  } catch (err) {
    console.error("বট ক্র্যাশ করেছে:", err.message);
  }
}

runBot();
