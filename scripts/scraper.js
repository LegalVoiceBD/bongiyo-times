const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ১. Unsplash থেকে ছবি খোঁজার ফাংশন
async function searchUnsplash(keyword) {
  try {
    const url = `https://api.unsplash.com/search/photos?page=1&per_page=1&query=${encodeURIComponent(keyword)}&orientation=landscape&client_id=${process.env.UNSPLASH_ACCESS_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.results && data.results.length > 0) return data.results[0].urls.regular; 
    return null;
  } catch (error) { return null; }
}

// ২. Pexels থেকে ছবি খোঁজার ফাংশন
async function searchPexels(keyword) {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1&orientation=landscape`;
    const response = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY } });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.photos && data.photos.length > 0) return data.photos[0].src.landscape || data.photos[0].src.large; 
    return null;
  } catch (error) { return null; }
}

// ৩. Pixabay থেকে ছবি খোঁজার ফাংশন
async function searchPixabay(keyword) {
  try {
    const url = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(keyword)}&image_type=photo&orientation=horizontal&per_page=3`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.hits && data.hits.length > 0) return data.hits[0].largeImageURL; 
    return null;
  } catch (error) { return null; }
}

// ৪. AI Image Generate (FLUX)
async function generateAndUploadImage(imagePrompt) {
  try {
    console.log(`🎨 ইমেজ জেনারেট হচ্ছে (FLUX Model)...`);
    const encodedPrompt = encodeURIComponent(imagePrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1280&height=720&enhance=true&nologo=true&safe=true&seed=-1`;

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error("Image fetch failed");
    
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'bongiyotimes_auto' }, 
        (error, result) => {
          if (error) { resolve(null); } 
          else { resolve(result.secure_url); }
        }
      );
      uploadStream.end(buffer);
    });
  } catch (error) { return null; }
}

// ৫. Vision AI এর জন্য ইমেজ বাফার
async function fetchImageForGemini(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
            inlineData: {
                data: buffer.toString("base64"),
                mimeType: response.headers.get("content-type") || "image/jpeg"
            }
        };
    } catch (e) { return null; }
}

async function runBot() {
  console.log("🚀 মেগা লটারি বট কাজ শুরু করেছে (V6: Editorial Image Engine v3 & Advanced Extraction)...");

  const defaultPlaceholder = 'https://res.cloudinary.com/dfgfvfvmk/image/upload/v1782535304/Gemini_Generated_Image_tjtfn3tjtfn3tjtf_syqfrx.jpg';

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

  // ======================================================================
// REFORM 1: Professional Tier-1 + Random + Source Diversity Selection
// ======================================================================

// Tier-1 (শুধু গুরুত্বপূর্ণ ক্যাটাগরি)
const tier1Config = [
  { name: 'Prothom Alo', category: 'বাংলাদেশ' },
  { name: 'Prothom Alo', category: 'রাজনীতি' },

  { name: 'BBC Bangla', category: 'আন্তর্জাতিক' },

  { name: 'Jugantor', category: 'বাংলাদেশ' },

  { name: 'Ittefaq', category: 'বাংলাদেশ' },

  { name: 'BD Pratidin', category: 'রাজনীতি' },

  { name: 'Inqilab', category: 'বাংলাদেশ' },

  { name: 'Nayadiganta', category: 'বাংলাদেশ' }
];

// Tier-1 সোর্স নির্বাচন
const tier1Sources = allSources.filter(source =>
  tier1Config.some(item =>
    item.name === source.name &&
    item.category === source.defaultCategory
  )
);

// Tier-1 বাদে বাকি সোর্স
const remainingSources = allSources.filter(source =>
  !tier1Config.some(item =>
    item.name === source.name &&
    item.category === source.defaultCategory
  )
);

// Shuffle
const shuffledRemaining = shuffleArray([...remainingSources]);

// ======================================================================
// Source Diversity
// একই পত্রিকা থেকে সর্বোচ্চ ২টি ক্যাটাগরি নেওয়া হবে
// ======================================================================

const sourceCounter = {};
const randomSelectedSources = [];

for (const source of shuffledRemaining) {

  sourceCounter[source.name] = sourceCounter[source.name] || 0;

  if (sourceCounter[source.name] >= 2) {
    continue;
  }

  randomSelectedSources.push(source);
  sourceCounter[source.name]++;

  if (randomSelectedSources.length >= 12) {
    break;
  }
}

// ======================================================================
// Final Scraping List
// ======================================================================

const sourcesToScrape = [
  ...tier1Sources,
  ...randomSelectedSources
];

console.log(
  `📰 Tier-1: ${tier1Sources.length}, Random: ${randomSelectedSources.length}, Total: ${sourcesToScrape.length}`
);

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};
  function isStrictlyValid(url) {
    const lowerUrl = url.toLowerCase();
    const generalBadWords = ['tag', 'author', 'video', 'topic', 'page', 'login', 'archive', 'photo', 'category', 'privacy', 'terms', 'about', 'contact'];
    if (generalBadWords.some(word => lowerUrl.includes(`/${word}`))) return false;
    if (!/\d/.test(lowerUrl)) return false; 
    return true;
  }

  let processedArticlesCount = 0;
  const publishedCount = {};
  const MAX_ARTICLES_PER_RUN = 16;

  const CATEGORY_LIMITS = {
    'বাংলাদেশ': 4, 'রাজনীতি': 2, 'আন্তর্জাতিক': 2, 'আইন-আদালত': 2,
    'বাণিজ্য': 1, 'খেলাধুলা': 1, 'বিনোদন': 1, 'প্রযুক্তি': 1,
    'শিক্ষা': 1, 'ধর্ম': 1, 'জীবনযাপন': 1, 'চাকরি': 1, 'ফিচার': 1
  };

  const minimumScore = {
    'বাংলাদেশ': 8, 'রাজনীতি': 8, 'আন্তর্জাতিক': 8, 'আইন-আদালত': 8,
    'বাণিজ্য': 7, 'খেলাধুলা': 6, 'প্রযুক্তি': 6, 'শিক্ষা': 6,
    'চাকরি': 6, 'বিনোদন': 5, 'জীবনযাপন': 5, 'ধর্ম': 5, 'ফিচার': 4
  };
  
  // --- REFORM 3, 4, 5: Event Hash & Duplicate Context ---
  const { data: recentNewsRecords } = await supabase
    .from('news')
    .select('title, snippet, category, event_hash') 
    .order('created_at', { ascending: false })
    .limit(40);
    
  const recentContext = recentNewsRecords 
    ? recentNewsRecords.map(n => `[${n.category}] Title: ${n.title} | Snippet: ${n.snippet || ''} | Hash: ${n.event_hash || 'N/A'}`).join('\n') 
    : '';

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

      // --- REFORM 6: Slicing Updated to 25 ---
      const topLinks = links.slice(0, 25); 
      
      for (let link of topLinks) {
        if (processedArticlesCount >= MAX_ARTICLES_PER_RUN) break;

        const { data: existingUrl } = await supabase.from('news').select('id').eq('source_url', link);
        if (existingUrl && existingUrl.length > 0) continue;

        const articleRes = await fetch(link, { headers });
        const articleHtml = await articleRes.text();
        const article$ = cheerio.load(articleHtml);

        const ogImageUrl = article$('meta[property="og:image"]').attr('content');
        let geminiImagePart = null;
        if (ogImageUrl) {
            geminiImagePart = await fetchImageForGemini(ogImageUrl);
        }

        // --- REFORM 2: Smart & Strict Article Extraction (Updated Selectors) ---
        let fullTextArray = [];
        const contentSelectors = ['article', 'main', '.story', '.news-content', '.entry-content', '.post-content', '.article-body', '.content', '.details', '.details-content', '.newsDetails', '.post-details'];
        let contentFound = false;

        for (const selector of contentSelectors) {
            if (article$(selector).length > 0) {
                // exclude unwanted elements specifically inside the main wrapper
                article$(selector).find('footer, .author, .related, .advertisement, script, style, .social-share').remove();
                article$(selector).find('p').each((i, el) => {
                    const text = article$(el).text().trim();
                    if (text.length > 30) fullTextArray.push(text);
                });
                if (fullTextArray.length > 0) {
                    contentFound = true;
                    break;
                }
            }
        }

        // Fallback
        if (!contentFound) {
            article$('p').each((i, el) => {
                const text = article$(el).text().trim();
                if (text.length > 30) fullTextArray.push(text);
            });
        }

        const fullText = fullTextArray.join('\n');
        if (fullText.length < 300) continue; 

        if (fullText) {
          console.log(`🧠 জেমিনি বিশ্লেষণ করছে (${link})...`);
          
          try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
            
            const prompt = `
            তুমি একজন আন্তর্জাতিক মানের সিনিয়র সাংবাদিক, অনুসন্ধানী রিপোর্টার এবং নিউজ এডিটর। 

            ========================
            প্রথম ধাপ: সংবাদ যাচাই ও Event Hash (CRITICAL)
            ========================
            ১. Privacy Policy, Advertisement, Opinion, Blog, Category, Archive ইত্যাদি হলে বাতিল করবে।
            ২. Mixed Content / Multiple unrelated news: If the webpage contains multiple unrelated news, extract ONLY ONE most important news. Ignore sidebar, related news, footer, advertisement, header.
            ৩. Duplicate Event Check: নিচের সাম্প্রতিক সংবাদগুলোর সাথে যদি এই সংবাদটি হুবহু একই ঘটনার হয় (Title, Snippet, Hash এবং Entities মিলিয়ে), তাহলে অবশ্যই রিটার্ন করবে: {"skip": true}
            
            সাম্প্রতিক সংবাদ কনটেক্সট:
            ${recentContext}

            ========================
            দ্বিতীয় ধাপ: সংবাদ তৈরি ও ক্যাটাগরি
            ========================
            - শিরোনাম হবে জাতীয় পত্রিকার মানের, কোনো ক্লিকবেট নয়।
            - প্রথম বাক্যে ন্যাচারালভাবে সোর্সের ক্রেডিট যুক্ত করবে: (যেমন: <a href='${link}' target='_blank' style='color:#0056b3;text-decoration:underline;'>${source.bnName}</a>)
            - পুরো সংবাদ নিজের ভাষায় পুনর্লিখন করবে। কোনো HTML ট্যাগ নয়, শুধু \\n\\n।
            - Never classify a news strictly by source URL. Read the content. Ignore sidebars. Select strictly from: [বাংলাদেশ, রাজনীতি, আন্তর্জাতিক, আইন-আদালত, বাণিজ্য, খেলাধুলা, বিনোদন, শিক্ষা, প্রযুক্তি, ধর্ম, জীবনযাপন, চাকরি, ফিচার, হাস্যরস]।

            ========================
            তৃতীয় ধাপ: Editorial Score Engine & Entities
            ========================
            - importance_score (1-10): 10=National breaking, 9=Major event, 8=Govt decision/Accident, 7=Economy, 6=Sports/Tech, 5=Entertainment, 1-4=Minor/Feature.
            - editorial_score (1-100): A granular score for homepage ranking. 95+ for PM resignation, 80 for major policy, 50 for regular sports, 20 for minor feature.
            - breaking_news (boolean): যদি প্রধানমন্ত্রী, রাষ্ট্রপতি, সুপ্রিম কোর্টের ঐতিহাসিক রায়, নির্বাচন, বড় দুর্ঘটনা, যুদ্ধ, প্রাকৃতিক দুর্যোগ, অর্থনৈতিক নীতি, জাতীয় নিরাপত্তা বা আন্তর্জাতিক সংকট সম্পর্কিত হয়, তাহলে true।
            - event_hash: A snake_case unique identifier for this event.
            - event_type: A short string (e.g., "Politics", "Accident", "Economy").
            - country_context: "Bangladesh", "International", or specific country name.
            - entity: Extract main entities (e.g. "Muhammad Yunus", "Army", "President", "Election Commission"). Array of strings.
            - location: Extract main locations. Array of strings.
            - person: Extract main persons. Array of strings.
            - organization: Extract main organizations. Array of strings.

            ========================
            Step 4: Image Strategy Engine (CRITICAL)
            ========================
            Evaluate the news and strictly return ONE of these "image_strategy" values:
            - "original": If it's a very specific news (accident, personal event) where AI/Stock might mislead.
            - "bangladesh_context": For Bangladesh politics, Govt, President, PM, Army, Police, Court, Election. 
              **CRITICAL:** Always create prompts specifically describing real Bangladeshi places/objects. Never describe generic parliament, generic court, generic government office. Always include: "Bangladesh, Dhaka, South Asian architecture, Bangladesh flag (if appropriate), No foreign buildings, No western architecture, No European style, No foreign military uniforms, No foreign police uniforms, Editorial documentary photography, Realistic, 8k, No text, No watermark".
            - "landmark": For specific iconic places in Bangladesh like "High Court", "National Parliament". (Use similar strict Bangladesh-specific prompt as bangladesh_context).
            - "stock": ONLY for Nature, Weather, Economy, Tech, Lifestyle, Education, Health, Food, Travel, Animals, Science. **Must include country in search_keyword if related to a specific country (e.g., "Bangladesh economy", "Dhaka traffic").**
            - "symbolic" or "ai_generate": For general topics where a generated image works. (Note: ONLY for 'symbolic' strategy, you must add "Do NOT include any human faces, eyes, hands, limbs, or body parts" to the image_prompt).

            WARNING: Strictly DO NOT use "stock" strategy for Politics, Government, President, PM, Army, Police, Court, Accident, Crime, Fire, War, Conflict.

            ========================
            Step 5: JSON Output Format
            ========================
            {
              "skip": false,
              "title": "নতুন সংবাদ শিরোনাম",
              "content": "সম্পূর্ণ সংবাদ",
              "true_category": "সঠিক ক্যাটাগরি",
              "image_strategy": "original",
              "country_context": "Bangladesh",
              "search_keyword": "keyword or null",
              "image_prompt": "prompt or null",
              "importance_score": 9,
              "editorial_score": 92,
              "breaking_news": true,
              "event_hash": "bd_election_schedule_2026",
              "event_type": "Politics",
              "entity": ["Entity 1", "Entity 2"],
              "location": ["Dhaka"],
              "person": ["Person 1"],
              "organization": ["Org 1"]
            }

            ========================
            মূল সংবাদ
            ========================
            ${fullText}
            `;

            const geminiPayload = geminiImagePart ? [prompt, geminiImagePart] : [prompt];
            
            let result;
            try {
                result = await model.generateContent(geminiPayload);
            } catch (geminiError) {
                if (geminiError.message.includes('429') || geminiError.message.includes('quota')) {
                    await delay(6000);
                    result = await model.generateContent(geminiPayload);
                } else if (geminiError.message.includes('503')) {
                    await delay(10000);
                    result = await model.generateContent(geminiPayload);
                } else {
                    throw geminiError;
                }
            }

            let responseText = result.response.text();
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const rewrittenData = JSON.parse(responseText);

            if (rewrittenData.skip) {
                console.log(`⏭️ Duplicate Event বা Invalid খবর স্কিপ করা হয়েছে।`);
                continue; 
            }

            const actualCategory = rewrittenData.true_category || source.defaultCategory;
            const requiredScore = minimumScore[actualCategory] || 7;

            if ((rewrittenData.importance_score || 0) < requiredScore) {
                console.log(`⏭️ Low importance for ${actualCategory} (${rewrittenData.importance_score} < ${requiredScore}) - Skipped`);
                continue;
            }

            publishedCount[actualCategory] = publishedCount[actualCategory] || 0;
            if (publishedCount[actualCategory] >= (CATEGORY_LIMITS[actualCategory] || 1)) {
                console.log(`⏭️ ${actualCategory} limit reached`);
                continue;
            }

            // Image Selection Strategy V3
            let finalImageUrl = defaultPlaceholder;
            let imageSourceCredit = "বঙ্গীয় টাইমস";
            const strategy = rewrittenData.image_strategy || "original";

            if (strategy === "original") {
                if (ogImageUrl) {
                    finalImageUrl = ogImageUrl;
                    imageSourceCredit = "মূল ওয়েবসাইট";
                } else if (rewrittenData.image_prompt) {
                     const fluxUrl = await generateAndUploadImage(rewrittenData.image_prompt);
                     if (fluxUrl) { finalImageUrl = fluxUrl; imageSourceCredit = "এআই জেনারেটেড"; }
                }
            }
            else if (strategy === "stock" && rewrittenData.search_keyword) {
                let stockUrl = await searchUnsplash(rewrittenData.search_keyword);
                if (!stockUrl) stockUrl = await searchPexels(rewrittenData.search_keyword);
                if (!stockUrl) stockUrl = await searchPixabay(rewrittenData.search_keyword);

                if (stockUrl) {
                    finalImageUrl = stockUrl;
                    imageSourceCredit = "সংগৃহীত (প্রতীকী)";
                } else if (rewrittenData.image_prompt) {
                    const fluxUrl = await generateAndUploadImage(rewrittenData.image_prompt);
                    if (fluxUrl) {
                        finalImageUrl = fluxUrl;
                        imageSourceCredit = "এআই জেনারেটেড";
                    }
                }
            }
            else if ((strategy === "bangladesh_context" || strategy === "landmark" || strategy === "symbolic" || strategy === "ai_generate") && rewrittenData.image_prompt) {
                const fluxUrl = await generateAndUploadImage(rewrittenData.image_prompt);
                if (fluxUrl) {
                     finalImageUrl = fluxUrl;
                     imageSourceCredit = "এআই জেনারেটেড";
                } else if (ogImageUrl) {
                     finalImageUrl = ogImageUrl;
                     imageSourceCredit = "মূল ওয়েবসাইট";
                }
            }
            else if (ogImageUrl) {
                finalImageUrl = ogImageUrl;
                imageSourceCredit = "মূল ওয়েবসাইট";
            }

            const isLeadNews = (rewrittenData.importance_score >= 9);
            const isBreakingNews = rewrittenData.breaking_news || false;

            const { error: insertError } = await supabase.from('news').insert([{
              title: rewrittenData.title,
              content: rewrittenData.content,
              snippet: rewrittenData.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + "...", 
              image_url: finalImageUrl, 
              source_url: link,
              source_name: 'বঙ্গীয় টাইমস', 
              category: actualCategory, 
              image_source: imageSourceCredit, 
              is_published: true, 
              is_custom: false,
              is_lead: isLeadNews,
              importance_score: rewrittenData.importance_score || 0,
              editorial_score: rewrittenData.editorial_score || 0,
              breaking_news: isBreakingNews,
              event_hash: rewrittenData.event_hash || null,
              event_type: rewrittenData.event_type || 'General'
            }]);

            if (insertError) {
                console.error("❌ সুপাবেজ ডাটাবেস এরর:", insertError.message);
            } else {
                console.log(`✅ পাবলিশ: [${actualCategory}] ${rewrittenData.title.substring(0, 30)}... | Ed.Score: ${rewrittenData.editorial_score} | Hash: ${rewrittenData.event_hash}`);
                publishedCount[actualCategory]++; 
                processedArticlesCount++;
            }
            
            await delay(10000); // 10s delay to respect Gemini & Cloudinary rate limits

          } catch (apiError) {
            console.error("❌ জেমিনি বা JSON পার্সিং এরর:", apiError.message);
            await delay(5000);
          }
        }
      }
    } catch (err) {
      console.error(`❌ ${source.bnName} ক্র্যাশ করেছে:`, err.message);
    }
  }
  console.log(`\n🎉 বটের কাজ সফল! মোট পাবলিশ: ${processedArticlesCount}`);
}

runBot();


/* ==========================================================================
   HOMEPAGE / EDITORIAL QUERIES (To use in your Next.js/Frontend API)
   ==========================================================================
   
   // ১. Homepage Sorting by Editorial Score (Smart Sort)
   async function getHomepageNews() {
     const { data, error } = await supabase
       .from('news')
       .select('*')
       .eq('is_published', true)
       .order('editorial_score', { ascending: false }) // Primary Sort by Editorial Engine
       .order('created_at', { ascending: false })      // Secondary Sort by Time
       .limit(20);
     return data;
   }

   // ২. Lead Section Query (Top Breaking/Important News where is_lead = true)
   async function getLeadNews() {
     const { data, error } = await supabase
       .from('news')
       .select('*')
       .eq('is_published', true)
       .eq('is_lead', true)
       .order('editorial_score', { ascending: false })
       .limit(6);
     return data;
   }

   // ৩. Breaking News Ticker / Hero Query
   async function getBreakingNews() {
     const { data, error } = await supabase
       .from('news')
       .select('title, category, created_at, slug')
       .eq('is_published', true)
       .eq('breaking_news', true)
       .order('created_at', { ascending: false })
       .limit(5);
     return data;
   }
========================================================================== */
