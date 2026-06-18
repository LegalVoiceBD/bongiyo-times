const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

async function runBot() {
  console.log("🚀 মেগা লটারি বট কাজ শুরু করেছে...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

/* // ভবিষ্যতে ডাটাবেস ফুল হওয়ার কাছাকাছি এলে এই কমেন্ট উঠিয়ে চালু করতে পারবেন:
  // ৬ মাসের পুরোনো অটো-স্ক্র্যাপ খবর ডিলিট
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    await supabase.from('news').delete().lt('created_at', sixMonthsAgo.toISOString()).is('is_custom', null); 
  } catch (err) {
    console.error("Cleanup error:", err.message);
  }
*/

  const allSources = [
    // --- বাংলাদেশ ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/bangladesh', domain: 'prothomalo.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/national', domain: 'jugantor.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/country', domain: 'ittefaq.com.bd', defaultCategory: 'বাংলাদেশ' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/national', domain: 'kalerkantho.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Samakal', url: 'https://samakal.com/bangladesh', domain: 'samakal.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/national', domain: 'bd-pratidin.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Nayadiganta', url: 'https://www.dailynayadiganta.com/national', domain: 'dailynayadiganta.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Inqilab', url: 'https://dailyinqilab.com/national', domain: 'dailyinqilab.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Dhaka Post', url: 'https://www.dhakapost.com/national', domain: 'dhakapost.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Jagonews24', url: 'https://www.jagonews24.com/national', domain: 'jagonews24.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'BDNews24', url: 'https://bangla.bdnews24.com/samagrabangladesh', domain: 'bdnews24.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Jamuna TV', url: 'https://www.jamuna.tv/all-bangladesh', domain: 'jamuna.tv', defaultCategory: 'বাংলাদেশ' },
    
    // --- আন্তর্জাতিক ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/world', domain: 'prothomalo.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/international', domain: 'jugantor.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/world-news', domain: 'ittefaq.com.bd', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/world', domain: 'kalerkantho.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Samakal', url: 'https://samakal.com/international', domain: 'samakal.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/international', domain: 'bd-pratidin.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Dhaka Post', url: 'https://www.dhakapost.com/international', domain: 'dhakapost.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Jagonews24', url: 'https://www.jagonews24.com/international', domain: 'jagonews24.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'BBC Bangla', url: 'https://www.bbc.com/bengali', domain: 'bbc.com', defaultCategory: 'আন্তর্জাতিক' },
    
    // --- খেলাধুলা ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/sports', domain: 'prothomalo.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/sports', domain: 'jugantor.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/sports', domain: 'ittefaq.com.bd', defaultCategory: 'খেলাধুলা' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/sport', domain: 'kalerkantho.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Samakal', url: 'https://samakal.com/sports', domain: 'samakal.com', defaultCategory: 'খেলাধুলা' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/sports', domain: 'bd-pratidin.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Dhaka Post', url: 'https://www.dhakapost.com/sports', domain: 'dhakapost.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Jagonews24', url: 'https://www.jagonews24.com/sports', domain: 'jagonews24.com', defaultCategory: 'খেলাধুলা' },
    { name: 'TBS News', url: 'https://www.tbsnews.net/bangla/sports', domain: 'tbsnews.net', defaultCategory: 'খেলাধুলা' },
    
    // --- বিনোদন ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/entertainment', domain: 'prothomalo.com', defaultCategory: 'বিনোদন' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/entertainment', domain: 'jugantor.com', defaultCategory: 'বিনোদন' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/entertainment', domain: 'ittefaq.com.bd', defaultCategory: 'বিনোদন' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/entertainment', domain: 'kalerkantho.com', defaultCategory: 'বিনোদন' },
    { name: 'Samakal', url: 'https://samakal.com/entertainment', domain: 'samakal.com', defaultCategory: 'বিনোদন' },
    { name: 'Dhaka Post', url: 'https://www.dhakapost.com/entertainment', domain: 'dhakapost.com', defaultCategory: 'বিনোদন' },
    { name: 'Jagonews24', url: 'https://www.jagonews24.com/entertainment', domain: 'jagonews24.com', defaultCategory: 'বিনোদন' },
    
    // --- বাণিজ্য ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/business', domain: 'prothomalo.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/economics', domain: 'jugantor.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/business', domain: 'ittefaq.com.bd', defaultCategory: 'বাণিজ্য' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/business', domain: 'kalerkantho.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Samakal', url: 'https://samakal.com/economics', domain: 'samakal.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Dhaka Post', url: 'https://www.dhakapost.com/economy', domain: 'dhakapost.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Jagonews24', url: 'https://www.jagonews24.com/economy', domain: 'jagonews24.com', defaultCategory: 'বাণিজ্য' },
    { name: 'TBS News', url: 'https://www.tbsnews.net/bangla/economy', domain: 'tbsnews.net', defaultCategory: 'বাণিজ্য' },
    
    // --- আইন-আদালত ---
    { name: 'Jugantor', url: 'https://www.jugantor.com/law-and-justice', domain: 'jugantor.com', defaultCategory: 'আইন-আদালত' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/law-and-court', domain: 'ittefaq.com.bd', defaultCategory: 'আইন-আদালত' },
    { name: 'Dhaka Post', url: 'https://www.dhakapost.com/law-courts', domain: 'dhakapost.com', defaultCategory: 'আইন-আদালত' },
    { name: 'Jagonews24', url: 'https://www.jagonews24.com/law-courts', domain: 'jagonews24.com', defaultCategory: 'আইন-আদালত' },
    { name: 'Bangla Tribune', url: 'https://www.banglatribune.com/law-and-crime', domain: 'banglatribune.com', defaultCategory: 'আইন-আদালত' },
    { name: 'Somoy TV', url: 'https://www.somoynews.tv/categories/আইন-ও-আদালত', domain: 'somoynews.tv', defaultCategory: 'আইন-আদালত' },
    { name: 'Kalbela', url: 'https://www.kalbela.com/legal-advice', domain: 'kalbela.com', defaultCategory: 'আইন-আদালত' },
    
    // --- শিক্ষা ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/education', domain: 'prothomalo.com', defaultCategory: 'শিক্ষা' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/campus', domain: 'jugantor.com', defaultCategory: 'শিক্ষা' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/education', domain: 'ittefaq.com.bd', defaultCategory: 'শিক্ষা' },
    { name: 'Dhaka Post', url: 'https://www.dhakapost.com/education', domain: 'dhakapost.com', defaultCategory: 'শিক্ষা' },
    { name: 'Jagonews24', url: 'https://www.jagonews24.com/campus', domain: 'jagonews24.com', defaultCategory: 'শিক্ষা' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/education', domain: 'bd-pratidin.com', defaultCategory: 'শিক্ষা' },
    
    // --- প্রযুক্তি ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/technology', domain: 'prothomalo.com', defaultCategory: 'প্রযুক্তি' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/tech', domain: 'jugantor.com', defaultCategory: 'প্রযুক্তি' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/science-and-technology', domain: 'ittefaq.com.bd', defaultCategory: 'প্রযুক্তি' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/info-tech', domain: 'kalerkantho.com', defaultCategory: 'প্রযুক্তি' },
    { name: 'Dhaka Post', url: 'https://www.dhakapost.com/technology', domain: 'dhakapost.com', defaultCategory: 'প্রযুক্তি' },
    { name: 'Jagonews24', url: 'https://www.jagonews24.com/technology', domain: 'jagonews24.com', defaultCategory: 'প্রযুক্তি' },
    { name: 'UNB', url: 'https://unb.com.bd/bangla/category/7/বিজ্ঞান-ও-প্রযুক্তি', domain: 'unb.com.bd', defaultCategory: 'প্রযুক্তি' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/tech-world', domain: 'bd-pratidin.com', defaultCategory: 'প্রযুক্তি' },
    
    // --- ধর্ম ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/religion', domain: 'prothomalo.com', defaultCategory: 'ধর্ম' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/islam-and-life', domain: 'jugantor.com', defaultCategory: 'ধর্ম' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/islam', domain: 'ittefaq.com.bd', defaultCategory: 'ধর্ম' },
    { name: 'Kaler Kantho', url: 'https://www.kalerkantho.com/online/Islamic-lifestylie', domain: 'kalerkantho.com', defaultCategory: 'ধর্ম' },
    { name: 'Dhaka Post', url: 'https://www.dhakapost.com/religion', domain: 'dhakapost.com', defaultCategory: 'ধর্ম' },
    { name: 'Jagonews24', url: 'https://www.jagonews24.com/religion', domain: 'jagonews24.com', defaultCategory: 'ধর্ম' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/islam', domain: 'bd-pratidin.com', defaultCategory: 'ধর্ম' },

    // --- জীবনযাপন ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/lifestyle', domain: 'prothomalo.com', defaultCategory: 'জীবনযাপন' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/life', domain: 'bd-pratidin.com', defaultCategory: 'জীবনযাপন' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/lifestyle', domain: 'jugantor.com', defaultCategory: 'জীবনযাপন' },
    { name: 'Ittefaq', url: 'https://www.ittefaq.com.bd/lifestyle', domain: 'ittefaq.com.bd', defaultCategory: 'জীবনযাপন' },
    { name: 'UNB', url: 'https://unb.com.bd/bangla/category/9/লাইফস্টাইল', domain: 'unb.com.bd', defaultCategory: 'জীবনযাপন' },
    
    // --- চাকরি ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/chakri', domain: 'prothomalo.com', defaultCategory: 'চাকরি' },
    { name: 'Manobkantha', url: 'https://manobkantha.com.bd/articlelist/41/job', domain: 'manobkantha.com.bd', defaultCategory: 'চাকরি' },
    { name: 'Kalbela', url: 'https://www.kalbela.com/job-news', domain: 'kalbela.com', defaultCategory: 'চাকরি' },
    { name: 'Shomoyer Alo', url: 'https://www.shomoyeralo.com/menu/296', domain: 'shomoyeralo.com', defaultCategory: 'চাকরি' },
    { name: 'Jugantor', url: 'https://www.jugantor.com/job-seek', domain: 'jugantor.com', defaultCategory: 'চাকরি' },
    
    // --- রাজনীতি ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/politics', domain: 'prothomalo.com', defaultCategory: 'রাজনীতি' },
    { name: 'BD Pratidin', url: 'https://www.bd-pratidin.com/current-politics', domain: 'bd-pratidin.com', defaultCategory: 'রাজনীতি' },
    { name: 'Kalbela', url: 'https://www.kalbela.com/politics', domain: 'kalbela.com', defaultCategory: 'রাজনীতি' },
    
    // --- হাস্যরস ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/fun', domain: 'prothomalo.com', defaultCategory: 'হাস্যরস' },
    
    // --- ফিচার ---
    { name: 'Prothom Alo', url: 'https://www.prothomalo.com/onnoalo/treatise', domain: 'prothomalo.com', defaultCategory: 'ফিচার' },
    { name: 'Shomoyer Alo', url: 'https://www.shomoyeralo.com/menu/335', domain: 'shomoyeralo.com', defaultCategory: 'ফিচার' },
    { name: 'Amader Shomoy', url: 'https://dainikamadershomoy.com/category/all/feature', domain: 'dainikamadershomoy.com', defaultCategory: 'ফিচার' }
  ];

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const sourcesToScrape = shuffleArray([...allSources]).slice(0, 30);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  };

  // টাইটেল থেকে পত্রিকার নাম রিমুভ করার ফাংশন
  function cleanTitle(rawTitle) {
    if (!rawTitle) return '';
    let text = rawTitle;
    
    // UNB এবং অন্যান্য ব্র্যান্ড নাম যুক্ত করা হলো
    const brandNames = [
      'প্রথম আলো', 'Prothom Alo', 'যুগান্তর', 'Jugantor', 'ইত্তেফাক', 'Ittefaq',
      'কালের কণ্ঠ', 'কালের কন্ঠ', 'Kaler Kantho', 'সমকাল', 'Samakal',
      'বাংলাদেশ প্রতিদিন', 'BD Pratidin', 'নয়া দিগন্ত', 'Nayadiganta',
      'ইনকিলাব', 'Inqilab', 'ঢাকা পোস্ট', 'Dhaka Post', 'জাগো নিউজ', 'জাগোনিউজ২৪',
      'Jagonews24', 'বিডিনিউজ টোয়েন্টিফোর', 'বিডিনিউজ টোয়েন্টিফোর ডটকম', 'BDNews24', 'যমুনা টিভি', 'Jamuna TV',
      'বিবিসি বাংলা', 'BBC Bangla', 'টিবিএস', 'TBS News', 'The Business Standard',
      'বাংলা ট্রিবিউন', 'Bangla Tribune', 'সময় সংবাদ', 'সময় টিভি', 'Somoy TV', 'Somoy News',
      'কালবেলা', 'Kalbela', 'মানবকণ্ঠ', 'Manobkantha', 'সময়ের আলো', 'Shomoyer Alo', 
      'আমাদের সময়', 'Amader Shomoy', 'ইউএনবি', 'UNB', 'United News Bangladesh'
    ];

    brandNames.forEach(brand => {
      const regex = new RegExp(`[\\|\\-\\–\\—]*\\s*${brand}\\s*[\\|\\-\\–\\—]*`, 'gi');
      text = text.replace(regex, '');
    });

    return text.replace(/[\s\|\-\–\\—]+$/, '').trim();
  }

  // স্ট্রিক্ট ইউআরএল ব্ল্যাকলিস্ট
  function isStrictlyValid(url, expectedCategory) {
    const lowerUrl = url.toLowerCase();
    
    const generalBadWords = ['tag', 'author', 'video', 'topic', 'page', 'login', 'archive', 'photo', 'gallery', 'country', 'city', 'probash', 'editorial', 'opinion'];
    if (generalBadWords.some(word => lowerUrl.includes(`/${word}`))) return false;
    
    if (!/\d/.test(lowerUrl)) return false;

    if (expectedCategory === 'ধর্ম') {
       if (!lowerUrl.includes('islam') && !lowerUrl.includes('religion')) {
          return false;
       }
    }

    const categoryBlacklist = {
      'বাংলাদেশ': ['world', 'international', 'sport', 'khela', 'entertainment', 'binodon', 'tech', 'business', 'economy', 'islam', 'religion', 'campus', 'education', 'lifestyle', 'politics', 'fun', 'chakri'],
      'আন্তর্জাতিক': ['bangladesh', 'national', 'sport', 'khela', 'entertainment', 'binodon', 'tech', 'business', 'economy', 'islam', 'religion', 'campus', 'education', 'lifestyle', 'politics', 'fun', 'chakri'],
      'খেলাধুলা': ['bangladesh', 'national', 'world', 'international', 'entertainment', 'binodon', 'tech', 'business', 'economy', 'islam', 'religion', 'campus', 'education', 'lifestyle', 'politics', 'fun', 'chakri'],
      'বিনোদন': ['bangladesh', 'national', 'world', 'international', 'sport', 'khela', 'tech', 'business', 'economy', 'islam', 'religion', 'campus', 'education', 'lifestyle', 'politics', 'fun', 'chakri'],
      'বাণিজ্য': ['bangladesh', 'national', 'world', 'international', 'sport', 'khela', 'entertainment', 'binodon', 'tech', 'islam', 'religion', 'campus', 'education', 'lifestyle', 'politics', 'fun', 'chakri'],
      'আইন-আদালত': ['sport', 'khela', 'entertainment', 'binodon', 'tech', 'business', 'economy', 'islam', 'religion', 'campus', 'education', 'lifestyle', 'fun', 'chakri'],
      'শিক্ষা': ['bangladesh', 'national', 'world', 'international', 'sport', 'khela', 'entertainment', 'binodon', 'tech', 'business', 'economy', 'islam', 'religion', 'lifestyle', 'politics', 'fun', 'chakri'],
      'প্রযুক্তি': ['bangladesh', 'national', 'world', 'international', 'sport', 'khela', 'entertainment', 'binodon', 'business', 'economy', 'islam', 'religion', 'campus', 'education', 'lifestyle', 'politics', 'fun', 'chakri'],
      'ধর্ম': ['bangladesh', 'national', 'world', 'international', 'sport', 'khela', 'entertainment', 'binodon', 'tech', 'business', 'economy', 'campus', 'education', 'lifestyle', 'politics', 'fun', 'chakri'],
      'জীবনযাপন': ['bangladesh', 'national', 'world', 'international', 'sport', 'khela', 'tech', 'business', 'economy', 'islam', 'religion', 'campus', 'education', 'politics', 'fun', 'chakri'],
      'চাকরি': ['bangladesh', 'national', 'world', 'international', 'sport', 'khela', 'entertainment', 'binodon', 'tech', 'islam', 'religion', 'lifestyle', 'politics', 'fun'],
      'রাজনীতি': ['world', 'international', 'sport', 'khela', 'entertainment', 'binodon', 'tech', 'business', 'economy', 'islam', 'religion', 'campus', 'education', 'lifestyle', 'fun', 'chakri'],
      'হাস্যরস': ['bangladesh', 'national', 'world', 'international', 'sport', 'khela', 'tech', 'business', 'economy', 'islam', 'religion', 'campus', 'education', 'lifestyle', 'politics', 'chakri'],
      'ফিচার': ['world', 'international', 'sport', 'khela', 'tech', 'business', 'economy', 'islam', 'religion', 'politics', 'fun', 'chakri']
    };

    const blockedWords = categoryBlacklist[expectedCategory] || [];
    if (blockedWords.some(word => lowerUrl.includes(`/${word}`))) return false;

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
        if (href && href.length > 40 && isStrictlyValid(href, source.defaultCategory)) {
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

        // H1 ট্যাগ যোগ করা হলো, কারণ অনেক সাইটে (যেমন UNB) og:title এ ডিফল্ট স্লোগান থাকে
        let rawTitle = article$('meta[property="og:title"]').attr('content') || article$('h1').first().text().trim() || article$('title').text();
        
        // --- UNB বা অন্য কোনো সাইটের ডিফল্ট স্লোগান ব্লকার ---
        const invalidTitlePhrases = [
           'United News Bangladesh',
           'Latest online Bangladesh news',
           'Access Denied',
           '404 Not Found'
        ];
        
        if (invalidTitlePhrases.some(phrase => rawTitle.includes(phrase))) {
           continue; // এটি কোনো খবর নয়, তাই পরের লিংকে চলে যাবে
        }
        // --------------------------------------------------------

        // এখানে title ক্লিন করা হচ্ছে
        let title = cleanTitle(rawTitle);
        
        let snippet = article$('meta[property="og:description"]').attr('content') || article$('meta[name="description"]').attr('content') || "বিস্তারিত পড়তে মূল খবরে ক্লিক করুন...";
        
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
              console.log(`✅ সেভ হয়েছে [${source.defaultCategory}]: ${title.substring(0, 35)}...`);
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
