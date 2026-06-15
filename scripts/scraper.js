const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

async function runBot() {
  console.log("🚀 মেগা লটারি বট কাজ শুরু করেছে...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // =========================================================================
  // নতুন ফিচার: ৬ মাসের পুরোনো অটো-স্ক্র্যাপ করা খবর ডিলিট করা
  // =========================================================================
  try {
    console.log("🧹 ৬ মাসের পুরোনো কপি করা খবর খোঁজা হচ্ছে...");
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // is_custom null মানে হলো এটি আপনার আপলোড করা নয়, বরং বটের আনা খবর
    const { error: deleteError } = await supabase
      .from('news')
      .delete()
      .lt('created_at', sixMonthsAgo.toISOString())
      .is('is_custom', null); 

    if (deleteError) {
      console.error("❌ পুরোনো খবর ডিলিট করতে সমস্যা:", deleteError.message);
    } else {
      console.log("✅ ডাটাবেস ক্লিনআপ সম্পন্ন! আপনার নিজের খবরগুলো ১০০% সুরক্ষিত আছে।");
    }
  } catch (err) {
    console.error("❌ ক্লিনআপ সিস্টেমে এরর:", err.message);
  }
  // =========================================================================

  const allSources = [
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/bangladesh', domain: 'prothomalo.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/sports', domain: 'prothomalo.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/world', domain: 'prothomalo.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/entertainment', domain: 'prothomalo.com', defaultCategory: 'বিনোদন' },
    { name: 'Manab Zamin', url: 'https://www.mzamin.com/category/অনলাইন', domain: 'mzamin.com', defaultCategory: 'সর্বশেষ' },
    { name: 'Manab Zamin', url: 'https://www.mzamin.com/category/বাংলারজমিন', domain: 'mzamin.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Samakal', url: 'https://samakal.com/latest/news', domain: 'samakal.com', defaultCategory: 'সর্বশেষ' },
    { name: 'Samakal', url: 'https://samakal.com/bangladesh', domain: 'samakal.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Samakal', url: 'https://samakal.com/economics', domain: 'samakal.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Samakal', url: 'https://samakal.com/sports', domain: 'samakal.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Samakal', url: 'https://samakal.com/international', domain: 'samakal.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Samakal', url: 'https://samakal.com/entertainment', domain: 'samakal.com', defaultCategory: 'বিনোদন' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/economy', domain: 'bd-pratidin.com', defaultCategory: 'বাণিজ্য' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/entertainment', domain: 'bd-pratidin.com', defaultCategory: 'বিনোদন' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/islam', domain: 'bd-pratidin.com', defaultCategory: 'ধর্ম' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/national', domain: 'bd-pratidin.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Inqilab', url: 'https://dailyinqilab.com/national', domain: 'dailyinqilab.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Inqilab', url: 'https://dailyinqilab.com/international', domain: 'dailyinqilab.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/sport', domain: 'kalerkantho.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/national', domain: 'kalerkantho.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/Islamic-lifestylie', domain: 'kalerkantho.com', defaultCategory: 'ধর্ম' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/world', domain: 'kalerkantho.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/business', domain: 'kalerkantho.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/latest-news', domain: 'ittefaq.com.bd', defaultCategory: 'সর্বশেষ' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/country', domain: 'ittefaq.com.bd', defaultCategory: 'বাংলাদেশ' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/law-and-court', domain: 'ittefaq.com.bd', defaultCategory: 'আইন-আদালত' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/world-news', domain: 'ittefaq.com.bd', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/sports', domain: 'ittefaq.com.bd', defaultCategory: 'খেলাধুলা' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/entertainment', domain: 'ittefaq.com.bd', defaultCategory: 'বিনোদন' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/business', domain: 'ittefaq.com.bd', defaultCategory: 'বাণিজ্য' },
    { name: 'Sangram', url: 'https://dailysangram.com/latest/', domain: 'dailysangram.com', defaultCategory: 'সর্বশেষ' },
    { name: 'Sangram', url: 'https://dailysangram.com/bangladesh/', domain: 'dailysangram.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Manobkantha', url: 'https://manobkantha.com.bd/articlelist/4/national', domain: 'manobkantha.com.bd', defaultCategory: 'বাংলাদেশ' },
    { name: 'Manobkantha', url: 'https://manobkantha.com.bd/articlelist/8/entertainment', domain: 'manobkantha.com.bd', defaultCategory: 'বিনোদন' },
    { name: 'Manobkantha', url: 'https://manobkantha.com.bd/articlelist/9/sports', domain: 'manobkantha.com.bd', defaultCategory: 'খেলাধুলা' },
    { name: 'Manobkantha', url: 'https://manobkantha.com.bd/articlelist/14/religion', domain: 'manobkantha.com.bd', defaultCategory: 'ধর্ম' },
    { name: 'Kalbela', url: 'https://www.kalbela.com/national', domain: 'kalbela.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Kalbela', url: 'https://www.kalbela.com/sports', domain: 'kalbela.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Kalbela', url: 'https://www.kalbela.com/business-news', domain: 'kalbela.com', defaultCategory: 'বাণিজ্য' },
    { name: 'TBS News', url: 'https://www.tbsnews.net/bangla/', domain: 'tbsnews.net', defaultCategory: 'সর্বশেষ' },
    { name: 'TBS News', url: 'https://www.tbsnews.net/bangla/sports', domain: 'tbsnews.net', defaultCategory: 'খেলাধুলা' },
    { name: 'TBS News', url: 'https://www.tbsnews.net/bangla/entertainment', domain: 'tbsnews.net', defaultCategory: 'বিনোদন' },
    { name: 'BDNews24', url: 'https://bangla.bdnews24.com/samagrabangladesh', domain: 'bdnews24.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Jagonews24', url: 'https://www.jagonews24.com/latest-news', domain: 'jagonews24.com', defaultCategory: 'সর্বশেষ' },
    { name: 'Amader Shomoy', url: 'https://dainikamadershomoy.com/latest/all', domain: 'dainikamadershomoy.com', defaultCategory: 'সর্বশেষ' },
    { name: 'Bangla Tribune', url: 'https://www.banglatribune.com/আজকের-খবর', domain: 'banglatribune.com', defaultCategory: 'সর্বশেষ' },
    { name: 'Bangla Tribune', url: 'https://www.banglatribune.com/law-and-crime', domain: 'banglatribune.com', defaultCategory: 'আইন-আদালত' },
    { name: 'Somoy TV', url: 'https://www.somoynews.tv/categories/বাংলাদেশ', domain: 'somoynews.tv', defaultCategory: 'বাংলাদেশ' },
    { name: 'Somoy TV', url: 'https://www.somoynews.tv/categories/খেলা', domain: 'somoynews.tv', defaultCategory: 'খেলাধুলা' },
    { name: 'Somoy TV', url: 'https://www.somoynews.tv/categories/বিনোদন-ও-লাইফস্টাইল', domain: 'somoynews.tv', defaultCategory: 'বিনোদন' },
    { name: 'Jamuna TV', url: 'https://www.jamuna.tv/all-bangladesh', domain: 'jamuna.tv', defaultCategory: 'বাংলাদেশ' },
    { name: 'Jamuna TV', url: 'https://www.jamuna.tv/sports', domain: 'jamuna.tv', defaultCategory: 'খেলাধুলা' },
    { name: 'Channel i', url: 'https://www.channelionline.com/category/bangladesh/', domain: 'channelionline.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Channel i', url: 'https://www.channelionline.com/sports/', domain: 'channelionline.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Ekattor TV', url: 'https://ekattor.tv/latest-news', domain: 'ekattor.tv', defaultCategory: 'সর্বশেষ' },
    { name: 'Channel 24', url: 'https://www.channel24bd.tv/latest', domain: 'channel24bd.tv', defaultCategory: 'সর্বশেষ' },
    { name: 'ATN News', url: 'https://www.atnnewstv.com/national', domain: 'atnnewstv.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Anandabazar', url: 'https://www.anandabazar.com/world', domain: 'anandabazar.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'BBC Bangla', url: 'https://www.bbc.com/bengali', domain: 'bbc.com', defaultCategory: 'আন্তর্জাতিক' }
  ];

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const sourcesToScrape = shuffleArray([...allSources]).slice(0, 25);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  };

  function isRealArticle(url) {
    const lowerUrl = url.toLowerCase();
    const badWords = ['tag', 'category', 'author', 'video', 'topic', 'page', 'login', 'archive', 'photo', 'gallery'];
    if (badWords.some(word => lowerUrl.includes(word))) return false;
    if (!/\d/.test(lowerUrl)) return false; 
    return true;
  }

  for (let source of sourcesToScrape) {
    console.log(`\n👉 স্ক্র্যাপ হচ্ছে: ${source.name} (${source.defaultCategory})`);
    try {
      const response = await fetch(source.url, { headers });
      if (!response.ok) continue;
      
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

      const topLinks = links.slice(0, 5); 
      
      for (let link of topLinks) {
        const articleRes = await fetch(link, { headers });
        const articleHtml = await articleRes.text();
        const article$ = cheerio.load(articleHtml);

        let title = article$('meta[property="og:title"]').attr('content') || article$('title').text();
        let snippet = article$('meta[property="og:description"]').attr('content') || article$('meta[name="description"]').attr('content') || "বিস্তারিত পড়তে মূল খবরে ক্লিক করুন...";
        
        let image_url = article$('meta[property="og:image"]').attr('content') || article$('meta[name="twitter:image"]').attr('content');
        if (image_url && image_url.startsWith('/')) {
            image_url = `https://${source.domain}${image_url}`;
        }
        
        if (title && image_url) {
          const wordCount = title.trim().split(/\s+/).length;
          if (!title.includes('404') && wordCount > 4) {
            const { data: existing } = await supabase.from('news').select('id').eq('title', title);
            
            if (existing.length === 0) {
              await supabase.from('news').insert([{
                title: title,
                snippet: snippet.substring(0, 150) + "...",
                image_url: image_url,
                source_url: link,
                source_name: source.name,
                category: source.defaultCategory
              }]);
              console.log(`✅ সেভ হয়েছে [${source.defaultCategory}]: ${title.substring(0, 35)}...`);
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
