const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBot() {
  console.log("🚀 মেগা লটারি বট কাজ শুরু করেছে (Draft Mode with Rate Limit Handler)...");

  const defaultPlaceholder = 'https://res.cloudinary.com/dfgfvfvmk/image/upload/v1782535304/Gemini_Generated_Image_tjtfn3tjtfn3tjtf_syqfrx.jpg';

  // বাংলা নাম (bnName) যুক্ত করা হয়েছে
  const allSources = [
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/bangladesh', domain: 'prothomalo.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Jugantor', bnName: 'যুগান্তর', url: 'https://www.jugantor.com/national', domain: 'jugantor.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Ittefaq', bnName: 'ইত্তেফাক', url: 'https://www.ittefaq.com.bd/country', domain: 'ittefaq.com.bd', defaultCategory: 'বাংলাদেশ' },
    { name: 'Kaler Kantho', bnName: 'কালের কণ্ঠ', url: 'https://www.kalerkantho.com/online/national', domain: 'kalerkantho.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Samakal', bnName: 'সমকাল', url: 'https://samakal.com/bangladesh', domain: 'samakal.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'BD Pratidin', bnName: 'বাংলাদেশ প্রতিদিন', url: 'https://www.bd-pratidin.com/national', domain: 'bd-pratidin.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Nayadiganta', bnName: 'নয়া দিগন্ত', url: 'https://www.dailynayadiganta.com/national', domain: 'dailynayadiganta.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Inqilab', bnName: 'ইনকিলাব', url: 'https://dailyinqilab.com/national', domain: 'dailyinqilab.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Dhaka Post', bnName: 'ঢাকা পোস্ট', url: 'https://www.dhakapost.com/national', domain: 'dhakapost.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Jagonews24', bnName: 'জাগো নিউজ', url: 'https://www.jagonews24.com/national', domain: 'jagonews24.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'BDNews24', bnName: 'বিডিনিউজ টোয়েন্টিফোর', url: 'https://bangla.bdnews24.com/samagrabangladesh', domain: 'bdnews24.com', defaultCategory: 'বাংলাদেশ' },
    { name: 'Jamuna TV', bnName: 'যমুনা টিভি', url: 'https://www.jamuna.tv/all-bangladesh', domain: 'jamuna.tv', defaultCategory: 'বাংলাদেশ' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/world', domain: 'prothomalo.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Jugantor', bnName: 'যুগান্তর', url: 'https://www.jugantor.com/international', domain: 'jugantor.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Ittefaq', bnName: 'ইত্তেফাক', url: 'https://www.ittefaq.com.bd/world-news', domain: 'ittefaq.com.bd', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Kaler Kantho', bnName: 'কালের কণ্ঠ', url: 'https://www.kalerkantho.com/online/world', domain: 'kalerkantho.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Samakal', bnName: 'সমকাল', url: 'https://samakal.com/international', domain: 'samakal.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'BD Pratidin', bnName: 'বাংলাদেশ প্রতিদিন', url: 'https://www.bd-pratidin.com/international', domain: 'bd-pratidin.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Dhaka Post', bnName: 'ঢাকা পোস্ট', url: 'https://www.dhakapost.com/international', domain: 'dhakapost.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Jagonews24', bnName: 'জাগো নিউজ', url: 'https://www.jagonews24.com/international', domain: 'jagonews24.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'BBC Bangla', bnName: 'বিবিসি বাংলা', url: 'https://www.bbc.com/bengali', domain: 'bbc.com', defaultCategory: 'আন্তর্জাতিক' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/sports', domain: 'prothomalo.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Jugantor', bnName: 'যুগান্তর', url: 'https://www.jugantor.com/sports', domain: 'jugantor.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Ittefaq', bnName: 'ইত্তেফাক', url: 'https://www.ittefaq.com.bd/sports', domain: 'ittefaq.com.bd', defaultCategory: 'খেলাধুলা' },
    { name: 'Kaler Kantho', bnName: 'কালের কণ্ঠ', url: 'https://www.kalerkantho.com/online/sport', domain: 'kalerkantho.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Samakal', bnName: 'সমকাল', url: 'https://samakal.com/sports', domain: 'samakal.com', defaultCategory: 'খেলাধুলা' },
    { name: 'BD Pratidin', bnName: 'বাংলাদেশ প্রতিদিন', url: 'https://www.bd-pratidin.com/sports', domain: 'bd-pratidin.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Dhaka Post', bnName: 'ঢাকা পোস্ট', url: 'https://www.dhakapost.com/sports', domain: 'dhakapost.com', defaultCategory: 'খেলাধুলা' },
    { name: 'Jagonews24', bnName: 'জাগো নিউজ', url: 'https://www.jagonews24.com/sports', domain: 'jagonews24.com', defaultCategory: 'খেলাধুলা' },
    { name: 'TBS News', bnName: 'টিবিএস নিউজ', url: 'https://www.tbsnews.net/bangla/sports', domain: 'tbsnews.net', defaultCategory: 'খেলাধুলা' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/entertainment', domain: 'prothomalo.com', defaultCategory: 'বিনোদন' },
    { name: 'Jugantor', bnName: 'যুগান্তর', url: 'https://www.jugantor.com/entertainment', domain: 'jugantor.com', defaultCategory: 'বিনোদন' },
    { name: 'Ittefaq', bnName: 'ইত্তেফাক', url: 'https://www.ittefaq.com.bd/entertainment', domain: 'ittefaq.com.bd', defaultCategory: 'বিনোদন' },
    { name: 'Kaler Kantho', bnName: 'কালের কণ্ঠ', url: 'https://www.kalerkantho.com/online/entertainment', domain: 'kalerkantho.com', defaultCategory: 'বিনোদন' },
    { name: 'Samakal', bnName: 'সমকাল', url: 'https://samakal.com/entertainment', domain: 'samakal.com', defaultCategory: 'বিনোদন' },
    { name: 'Dhaka Post', bnName: 'ঢাকা পোস্ট', url: 'https://www.dhakapost.com/entertainment', domain: 'dhakapost.com', defaultCategory: 'বিনোদন' },
    { name: 'Jagonews24', bnName: 'জাগো নিউজ', url: 'https://www.jagonews24.com/entertainment', domain: 'jagonews24.com', defaultCategory: 'বিনোদন' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/business', domain: 'prothomalo.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Jugantor', bnName: 'যুগান্তর', url: 'https://www.jugantor.com/economics', domain: 'jugantor.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Ittefaq', bnName: 'ইত্তেফাক', url: 'https://www.ittefaq.com.bd/business', domain: 'ittefaq.com.bd', defaultCategory: 'বাণিজ্য' },
    { name: 'Kaler Kantho', bnName: 'কালের কণ্ঠ', url: 'https://www.kalerkantho.com/online/business', domain: 'kalerkantho.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Samakal', bnName: 'সমকাল', url: 'https://samakal.com/economics', domain: 'samakal.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Dhaka Post', bnName: 'ঢাকা পোস্ট', url: 'https://www.dhakapost.com/economy', domain: 'dhakapost.com', defaultCategory: 'বাণিজ্য' },
    { name: 'Jagonews24', bnName: 'জাগো নিউজ', url: 'https://www.jagonews24.com/economy', domain: 'jagonews24.com', defaultCategory: 'বাণিজ্য' },
    { name: 'TBS News', bnName: 'টিবিএস নিউজ', url: 'https://www.tbsnews.net/bangla/economy', domain: 'tbsnews.net', defaultCategory: 'বাণিজ্য' },
    { name: 'Jugantor', bnName: 'যুগান্তর', url: 'https://www.jugantor.com/law-and-justice', domain: 'jugantor.com', defaultCategory: 'আইন-আদালত' },
    { name: 'Ittefaq', bnName: 'ইত্তেফাক', url: 'https://www.ittefaq.com.bd/law-and-court', domain: 'ittefaq.com.bd', defaultCategory: 'আইন-আদালত' },
    { name: 'Dhaka Post', bnName: 'ঢাকা পোস্ট', url: 'https://www.dhakapost.com/law-courts', domain: 'dhakapost.com', defaultCategory: 'আইন-আদালত' },
    { name: 'Jagonews24', bnName: 'জাগো নিউজ', url: 'https://www.jagonews24.com/law-courts', domain: 'jagonews24.com', defaultCategory: 'আইন-আদালত' },
    { name: 'Bangla Tribune', bnName: 'বাংলা ট্রিবিউন', url: 'https://www.banglatribune.com/law-and-crime', domain: 'banglatribune.com', defaultCategory: 'আইন-আদালত' },
    { name: 'Somoy TV', bnName: 'সময় টিভি', url: 'https://www.somoynews.tv/categories/আইন-ও-আদালত', domain: 'somoynews.tv', defaultCategory: 'আইন-আদালত' },
    { name: 'Kalbela', bnName: 'কালবেলা', url: 'https://www.kalbela.com/legal-advice', domain: 'kalbela.com', defaultCategory: 'আইন-আদালত' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/education', domain: 'prothomalo.com', defaultCategory: 'শিক্ষা' },
    { name: 'Jugantor', bnName: 'যুগান্তর', url: 'https://www.jugantor.com/campus', domain: 'jugantor.com', defaultCategory: 'শিক্ষা' },
    { name: 'Ittefaq', bnName: 'ইত্তেফাক', url: 'https://www.ittefaq.com.bd/education', domain: 'ittefaq.com.bd', defaultCategory: 'শিক্ষা' },
    { name: 'Dhaka Post', bnName: 'ঢাকা পোস্ট', url: 'https://www.dhakapost.com/education', domain: 'dhakapost.com', defaultCategory: 'শিক্ষা' },
    { name: 'Jagonews24', bnName: 'জাগো নিউজ', url: 'https://www.jagonews24.com/campus', domain: 'jagonews24.com', defaultCategory: 'শিক্ষা' },
    { name: 'BD Pratidin', bnName: 'বাংলাদেশ প্রতিদিন', url: 'https://www.bd-pratidin.com/education', domain: 'bd-pratidin.com', defaultCategory: 'শিক্ষা' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/technology', domain: 'prothomalo.com', defaultCategory: 'প্রযুক্তি' },
    { name: 'Jugantor', bnName: 'যুগান্তর', url: 'https://www.jugantor.com/tech', domain: 'jugantor.com', defaultCategory: 'প্রযুক্তি' },
    { name: 'Ittefaq', bnName: 'ইত্তেফাক', url: 'https://www.ittefaq.com.bd/science-and-technology', domain: 'ittefaq.com.bd', defaultCategory: 'প্রযুক্তি' },
    { name: 'Kaler Kantho', bnName: 'কালের কণ্ঠ', url: 'https://www.kalerkantho.com/online/info-tech', domain: 'kalerkantho.com', defaultCategory: 'প্রযুক্তি' },
    { name: 'Dhaka Post', bnName: 'ঢাকা পোস্ট', url: 'https://www.dhakapost.com/technology', domain: 'dhakapost.com', defaultCategory: 'প্রযুক্তি' },
    { name: 'Jagonews24', bnName: 'জাগো নিউজ', url: 'https://www.jagonews24.com/technology', domain: 'jagonews24.com', defaultCategory: 'প্রযুক্তি' },
    { name: 'UNB', bnName: 'ইউএনবি', url: 'https://unb.com.bd/bangla/category/7/বিজ্ঞান-ও-প্রযুক্তি', domain: 'unb.com.bd', defaultCategory: 'প্রযুক্তি' },
    { name: 'BD Pratidin', bnName: 'বাংলাদেশ প্রতিদিন', url: 'https://www.bd-pratidin.com/tech-world', domain: 'bd-pratidin.com', defaultCategory: 'প্রযুক্তি' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/religion', domain: 'prothomalo.com', defaultCategory: 'ধর্ম' },
    { name: 'Jugantor', bnName: 'যুগান্তর', url: 'https://www.jugantor.com/islam-and-life', domain: 'jugantor.com', defaultCategory: 'ধর্ম' },
    { name: 'Ittefaq', bnName: 'ইত্তেফাক', url: 'https://www.ittefaq.com.bd/islam', domain: 'ittefaq.com.bd', defaultCategory: 'ধর্ম' },
    { name: 'Kaler Kantho', bnName: 'কালের কণ্ঠ', url: 'https://www.kalerkantho.com/online/Islamic-lifestylie', domain: 'kalerkantho.com', defaultCategory: 'ধর্ম' },
    { name: 'Dhaka Post', bnName: 'ঢাকা পোস্ট', url: 'https://www.dhakapost.com/religion', domain: 'dhakapost.com', defaultCategory: 'ধর্ম' },
    { name: 'Jagonews24', bnName: 'জাগো নিউজ', url: 'https://www.jagonews24.com/religion', domain: 'jagonews24.com', defaultCategory: 'ধর্ম' },
    { name: 'BD Pratidin', bnName: 'বাংলাদেশ প্রতিদিন', url: 'https://www.bd-pratidin.com/islam', domain: 'bd-pratidin.com', defaultCategory: 'ধর্ম' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/lifestyle', domain: 'prothomalo.com', defaultCategory: 'জীবনযাপন' },
    { name: 'BD Pratidin', bnName: 'বাংলাদেশ প্রতিদিন', url: 'https://www.bd-pratidin.com/life', domain: 'bd-pratidin.com', defaultCategory: 'জীবনযাপন' },
    { name: 'Jugantor', bnName: 'যুগান্তর', url: 'https://www.jugantor.com/lifestyle', domain: 'jugantor.com', defaultCategory: 'জীবনযাপন' },
    { name: 'Ittefaq', bnName: 'ইত্তেফাক', url: 'https://www.ittefaq.com.bd/lifestyle', domain: 'ittefaq.com.bd', defaultCategory: 'জীবনযাপন' },
    { name: 'UNB', bnName: 'ইউএনবি', url: 'https://unb.com.bd/bangla/category/9/লাইফস্টাইল', domain: 'unb.com.bd', defaultCategory: 'জীবনযাপন' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/chakri', domain: 'prothomalo.com', defaultCategory: 'চাকরি' },
    { name: 'Manobkantha', bnName: 'মানবকণ্ঠ', url: 'https://manobkantha.com.bd/articlelist/41/job', domain: 'manobkantha.com.bd', defaultCategory: 'চাকরি' },
    { name: 'Kalbela', bnName: 'কালবেলা', url: 'https://www.kalbela.com/job-news', domain: 'kalbela.com', defaultCategory: 'চাকরি' },
    { name: 'Shomoyer Alo', bnName: 'সময়ের আলো', url: 'https://www.shomoyeralo.com/menu/296', domain: 'shomoyeralo.com', defaultCategory: 'চাকরি' },
    { name: 'Jugantor', bnName: 'যুগান্তর', url: 'https://www.jugantor.com/job-seek', domain: 'jugantor.com', defaultCategory: 'চাকরি' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/politics', domain: 'prothomalo.com', defaultCategory: 'রাজনীতি' },
    { name: 'BD Pratidin', bnName: 'বাংলাদেশ প্রতিদিন', url: 'https://www.bd-pratidin.com/current-politics', domain: 'bd-pratidin.com', defaultCategory: 'রাজনীতি' },
    { name: 'Kalbela', bnName: 'কালবেলা', url: 'https://www.kalbela.com/politics', domain: 'kalbela.com', defaultCategory: 'রাজনীতি' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/fun', domain: 'prothomalo.com', defaultCategory: 'হাস্যরস' },
    { name: 'Prothom Alo', bnName: 'প্রথম আলো', url: 'https://www.prothomalo.com/onnoalo/treatise', domain: 'prothomalo.com', defaultCategory: 'ফিচার' },
    { name: 'Shomoyer Alo', bnName: 'সময়ের আলো', url: 'https://www.shomoyeralo.com/menu/335', domain: 'shomoyeralo.com', defaultCategory: 'ফিচার' },
    { name: 'Amader Shomoy', bnName: 'আমাদের সময়', url: 'https://dainikamadershomoy.com/category/all/feature', domain: 'dainikamadershomoy.com', defaultCategory: 'ফিচার' }
  ];

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const sourcesToScrape = shuffleArray([...allSources]).slice(0, 15);
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

  function isStrictlyValid(url) {
    const lowerUrl = url.toLowerCase();
    const generalBadWords = ['tag', 'author', 'video', 'topic', 'page', 'login', 'archive', 'photo'];
    if (generalBadWords.some(word => lowerUrl.includes(`/${word}`))) return false;
    if (!/\d/.test(lowerUrl)) return false;
    return true;
  }

  let processedArticlesCount = 0;
  const MAX_ARTICLES_PER_RUN = 10; 
  
  const todayBn = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  for (let source of sourcesToScrape) {
    if (processedArticlesCount >= MAX_ARTICLES_PER_RUN) break;

    console.log(`\n👉 স্ক্র্যাপ হচ্ছে: ${source.bnName} (${source.defaultCategory})`);
    try {
      const response = await fetch(source.url, { headers });
      if (!response.ok) continue;
      
      const html = await response.text();
      const $ = cheerio.load(html);
      let links = [];
      
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && href.length > 40 && isStrictlyValid(href)) {
          if (href.startsWith('/')) href = `https://www.${source.domain}${href}`;
          if (href.includes(source.domain) && !links.includes(href)) {
            links.push(href);
          }
        }
      });

      const topLinks = links.slice(0, 2); 
      
      for (let link of topLinks) {
        if (processedArticlesCount >= MAX_ARTICLES_PER_RUN) break;

        const { data: existingUrl } = await supabase.from('news').select('id').eq('source_url', link);
        if (existingUrl && existingUrl.length > 0) continue;

        const articleRes = await fetch(link, { headers });
        const articleHtml = await articleRes.text();
        const article$ = cheerio.load(articleHtml);

        const fullTextArray = [];
        article$('p').each((i, el) => {
          const text = article$(el).text().trim();
          if (text.length > 30) fullTextArray.push(text);
        });
        const fullText = fullTextArray.join('\n');

        if (fullText.length < 300) continue; 

        if (fullText) {
          console.log(`🧠 জেমিনি এপিআই দিয়ে বিশ্লেষণ শুরু হচ্ছে...`);
          
          try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
            
            // প্রম্পট আপডেট: অ্যাডমিন প্যানেল ক্লিন রাখতে কোনো HTML ট্যাগ ব্যবহার করা হয়নি
            const prompt = `
           তুমি একজন টপ প্রফেশনাল এবং বিশ্লেষণধর্মী সাংবাদিক (যেমন- বিবিসি বাংলা বা নেত্র নিউজ)। নিচে একটি খবরের মূল অংশ দেওয়া হলো। তোমার কাজ হলো খবরটিকে সম্পূর্ণ নিজের ভাষায়, বস্তুনিষ্ঠভাবে এবং গভীরভাবে পর্যালোচনা করে নতুনভাবে বিশ্লেষণধর্মী নিউজ লেখা।
            
            শর্তসমূহ:
            ১. খবরের শিরোনামে কোনোভাবেই মূল পত্রিকার নাম (যেমন- ${source.bnName}) থাকবে না। একদম ফ্রেশ, ইউনিক, বিশ্লেষণধর্মী শিরোনাম দিবে।
            ২. খবরের প্রথম প্যারাগ্রাফ ঠিক এই ফরম্যাটে শুরু করতে হবে: 
            "[খবরের মূল বিষয় বা থিম] নিয়ে <a href='${link}' target='_blank' style='color: #0056b3; text-decoration: underline;'>${source.bnName} পত্রিকা একটি খবর প্রকাশ করেছে</a>। এই খবরে বলা হয়েছে,..." 
            (নির্দেশনা: এখানে [খবরের মূল বিষয় বা থিম] এর জায়গায় তুমি নিজে খবরটি পড়ে মূল বিষয়টি একটি ছোট বাক্যাংশে বসাবে। যেমন- "অন্তর্বর্তী সরকারের আমলে সেবা খাতে দুর্নীতি", "কোটা সংস্কার আন্দোলন", "নতুন পে-স্কেল" ইত্যাদি। এই ফরম্যাটটি হুবহু অনুসরণ করবে।)
            ৩. খবরের মূল তথ্য ঠিক রেখে বিশ্লেষণমূলক অংশ লিখবে। কোনো <p>, <div> বা HTML ট্যাগ ব্যবহার করবে না (শুধুমাত্র উপরের লিংকের <a> ট্যাগটি ছাড়া)। প্রতিটি প্যারাগ্রাফ আলাদা করতে ডাবল এন্টার (\\n\\n) ব্যবহার করবে। 
            ৪. পুরো লেখাটি অবশ্যই শুদ্ধ বাংলায় হতে হবে এবং খবরের শেষে কোনোভাবেই "ছবি সংগৃহীত" বা এ ধরনের কোনো অতিরিক্ত লাইন যুক্ত করা যাবে না।
            ৫. কোন ভুল বা কাল্পনিক তথ্য দেয়া যাবে না। শুধু নিউজটাকে নিরপেক্ষভাবে বিশ্লেষণ করবে। এমনভাবে নিজস্ব ভাষায় লিখবে যাতে কপি মনে না হয়।  
            ৬. আউটপুটটি শুধুমাত্র JSON ফরম্যাটে দিবে: {"title": "নতুন শিরোনাম", "content": "পুরো খবরের বিস্তারিত ক্লিন টেক্সট"}
            
            মূল খবর:
            ${fullText}
            `;

            let result;
            try {
                result = await model.generateContent(prompt);
            } catch (geminiError) {
                if (geminiError.message.includes('429') || geminiError.message.includes('quota')) {
                    console.log('⏳ কোটা লিমিট শেষ বা সার্ভার ব্যস্ত, ৬ সেকেন্ড অপেক্ষা করে আবার চেষ্টা করা হচ্ছে...');
                    await delay(6000);
                    result = await model.generateContent(prompt);
                } else if (geminiError.message.includes('503')) {
                    console.log('⏳ সার্ভার বিজি, ১০ সেকেন্ড পর আবার চেষ্টা করছি...');
                    await delay(10000);
                    result = await model.generateContent(prompt);
                } else {
                    throw geminiError;
                }
            }

            let responseText = result.response.text();
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const rewrittenData = JSON.parse(responseText);

           // অটো নিউজ সরাসরি পাবলিশ হবে এবং ডিফল্ট ছবি ও ক্যাপশন বসবে
            const { error: insertError } = await supabase.from('news').insert([{
              title: rewrittenData.title,
              content: rewrittenData.content,
              snippet: rewrittenData.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + "...", 
              image_url: defaultPlaceholder, 
              source_url: link,
              source_name: 'বঙ্গীয় টাইমস', 
              category: source.defaultCategory,
              image_source: 'বঙ্গীয় টাইমস', // <--- ক্যাপশনে বঙ্গীয় টাইমস সেট করা হলো
              is_published: true, // <--- এটি true করার ফলে সরাসরি পাবলিশ হয়ে যাবে
              is_custom: false 
            }]);
            if (insertError) {
                console.error("❌ সুপাবেজ ডাটাবেস এরর:", insertError.message);
            } else {
                console.log(`✅ সফলভাবে ড্রাফট হিসেবে সেভ হয়েছে: ${rewrittenData.title.substring(0, 40)}...`);
                processedArticlesCount++;
            }
            
            await delay(10000);

          } catch (apiError) {
            console.error("❌ জেমিনি বা অন্য এরর:", apiError.message);
            await delay(5000);
          }
        }
      }
    } catch (err) {
      console.error(`❌ ${source.bnName} ক্র্যাশ করেছে:`, err.message);
    }
  }
  console.log(`\n🎉 বটের কাজ সফলভাবে শেষ! মোট ড্রাফট করা নিউজ: ${processedArticlesCount}`);
}

runBot();
