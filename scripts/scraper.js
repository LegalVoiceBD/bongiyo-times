const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

async function runBot() {
  console.log("🚀 মেগা বট কাজ শুরু করেছে...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // শীর্ষ ৩০টি জাতীয় গণমাধ্যমের লিস্ট
  const sources = [
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/collection/latest', domain: 'prothomalo.com' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/all-latest-news', domain: 'jugantor.com' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online', domain: 'kalerkantho.com' },
    { name: 'Somoy TV', url: 'https://www.somoynews.tv/latest', domain: 'somoynews.tv' },
    { name: 'BBC Bangla', url: 'https://www.bbc.com/bengali', domain: 'bbc.com' },
    { name: 'BDNews24', url: 'https://bangla.bdnews24.com/', domain: 'bdnews24.com' },
    { name: 'Daily Star Bangla', url: 'https://bangla.thedailystar.net/', domain: 'thedailystar.net' },
    { name: 'Samakal', url: 'https://samakal.com/latest-news', domain: 'samakal.com' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/latest-news', domain: 'ittefaq.com.bd' },
    { name: 'Jamuna TV', url: 'https://www.jamuna.tv/news', domain: 'jamuna.tv' },
    { name: 'Channel i', url: 'https://www.channelionline.com/latest-news/', domain: 'channelionline.com' },
    { name: 'NTV Online', url: 'https://www.ntvbd.com/latest-news', domain: 'ntvbd.com' },
    { name: 'Bangla Tribune', url: 'https://www.banglatribune.com/latest-news', domain: 'banglatribune.com' },
    { name: 'Jagonews24', url: 'https://www.jagonews24.com/latest-news', domain: 'jagonews24.com' },
    { name: 'Dhaka Post', url: 'https://www.dhakapost.com/latest-news', domain: 'dhakapost.com' },
    { name: 'Bhorer Kagoj', url: 'https://www.bhorerkagoj.com/latest-news', domain: 'bhorerkagoj.com' },
    { name: 'Amader Shomoy', url: 'https://www.dainikamadershomoy.com/latest-news', domain: 'dainikamadershomoy.com' },
    { name: 'Desh Rupantor', url: 'https://www.deshrupantor.com/latest-news', domain: 'deshrupantor.com' },
    { name: 'Inqilab', url: 'https://www.dailyinqilab.com/latest-news', domain: 'dailyinqilab.com' },
    { name: 'Nayadiganta', url: 'https://www.dailynayadiganta.com/latest-news', domain: 'dailynayadiganta.com' },
    { name: 'RTV Online', url: 'https://www.rtvonline.com/latest', domain: 'rtvonline.com' },
    { name: 'Independent TV', url: 'https://www.independent24.com/latest', domain: 'independent24.com' },
    { name: 'DBC News', url: 'https://dbcnews.tv/latest', domain: 'dbcnews.tv' },
    { name: 'Ekattor TV', url: 'https://ekattor.tv/latest-news', domain: 'ekattor.tv' },
    { name: 'Banglanews24', url: 'https://www.banglanews24.com/', domain: 'banglanews24.com' },
    { name: 'Manab Zamin', url: 'https://mzamin.com/latest-news.php', domain: 'mzamin.com' },
    { name: ' বণিক বার্তা', url: 'https://bonikbarta.net/latest-news', domain: 'bonikbarta.net' },
    { name: 'Dhaka Tribune', url: 'https://www.dhakatribune.com/latest-news', domain: 'dhakatribune.com' },
    { name: 'Daily Sun', url: 'https://www.daily-sun.com/latest', domain: 'daily-sun.com' },
    { name: 'Anandabazar', url: 'https://www.anandabazar.com/', domain: 'anandabazar.com' }
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  };

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
      
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && href.length > 45 && !href.includes('tag') && !href.includes('category') && !href.includes('author') && !href.includes('video')) {
          if (href.startsWith('/')) href = `https://www.${source.domain}${href}`;
          if (href.includes(source.domain) && !links.includes(href)) {
            links.push(href);
          }
        }
      });

      const topLinks = links.slice(0, 3); // লোড ব্যালেন্স করার জন্য ৩টি করে নেওয়া হলো (মোট ৯০টি নিউজ প্রতিবার)
      
      for (let link of topLinks) {
        const articleRes = await fetch(link, { headers });
        const articleHtml = await articleRes.text();
        const article$ = cheerio.load(articleHtml);

        let title = article$('meta[property="og:title"]').attr('content') || article$('title').text();
        let snippet = article$('meta[property="og:description"]').attr('content') || article$('meta[name="description"]').attr('content') || "বিস্তারিত পড়তে মূল খবরে ক্লিক করুন...";
        let image_url = article$('meta[property="og:image"]').attr('content');
        
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
              category: newsCategory
            }]);
            console.log(`✅ সেভ হয়েছে: ${title.substring(0, 40)}...`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ ${source.name} থেকে খবর আনতে সমস্যা:`, err.message);
    }
  }
  console.log("\n🎉 মেগা বটের কাজ শেষ!");
}

runBot();
