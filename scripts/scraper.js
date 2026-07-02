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
    console.log(`🔍 Unsplash-এ ছবি খোঁজা হচ্ছে: ${keyword}`);
    const url = `https://api.unsplash.com/search/photos?page=1&per_page=1&query=${encodeURIComponent(keyword)}&orientation=landscape&client_id=${process.env.UNSPLASH_ACCESS_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.results && data.results.length > 0) return data.results[0].urls.regular; 
    return null;
  } catch (error) {
    return null;
  }
}

// ২. Pexels থেকে ছবি খোঁজার ফাংশন
async function searchPexels(keyword) {
  try {
    console.log(`🔍 Pexels-এ ছবি খোঁজা হচ্ছে: ${keyword}`);
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1&orientation=landscape`;
    const response = await fetch(url, {
      headers: { Authorization: process.env.PEXELS_API_KEY }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.photos && data.photos.length > 0) return data.photos[0].src.landscape || data.photos[0].src.large; 
    return null;
  } catch (error) {
    return null;
  }
}

// ৩. Pixabay থেকে ছবি খোঁজার ফাংশন
async function searchPixabay(keyword) {
  try {
    console.log(`🔍 Pixabay-তে ছবি খোঁজা হচ্ছে: ${keyword}`);
    const url = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(keyword)}&image_type=photo&orientation=horizontal&per_page=3`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.hits && data.hits.length > 0) return data.hits[0].largeImageURL; 
    return null;
  } catch (error) {
    return null;
  }
}

// ৪. AI Image Generate (FLUX) এবং Cloudinary তে Upload করার ফাংশন
async function generateAndUploadImage(imagePrompt) {
  try {
    console.log(`🎨 ইমেজ জেনারেট হচ্ছে (FLUX Model) প্রম্পট দিয়ে...`);
    
    // Pollinations AI-এর উন্নত FLUX মডেল, 1280x720 রেজ্যুলেশন এবং এনহ্যান্সমেন্ট ব্যবহার
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
          if (error) {
            console.error("❌ Cloudinary Upload Error:", error);
            resolve(null);
          } else {
            console.log("✅ ছবি ক্লাউডিনারিতে আপলোড সফল!");
            resolve(result.secure_url);
          }
        }
      );
      uploadStream.end(buffer);
    });

  } catch (error) {
    console.error("❌ ইমেজ জেনারেট বা আপলোড করতে সমস্যা হয়েছে:", error.message);
    return null;
  }
}

// ৫. মূল নিউজের ছবি Base64 এ কনভার্ট করার ফাংশন (Gemini Vision এর জন্য)
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
    } catch (e) {
        return null;
    }
}

async function runBot() {
  console.log("🚀 মেগা লটারি বট কাজ শুরু করেছে (Vision AI + Stock Search + AI Redraw)...");

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

 // --- নতুন ও প্রফেশনাল সোর্স ফিল্টারিং লজিক ---
  const coreCategories = ['বাংলাদেশ', 'রাজনীতি', 'আন্তর্জাতিক', 'খেলাধুলা', 'বাণিজ্য','আইন-আদালত'];
  
  const coreSources = allSources.filter(src => coreCategories.includes(src.defaultCategory));
  const otherSources = allSources.filter(src => !coreCategories.includes(src.defaultCategory));

  const selectedCore = shuffleArray([...coreSources]).slice(0, 10);
  const selectedOthers = shuffleArray([...otherSources]).slice(0, 5);

  const sourcesToScrape = [...selectedCore, ...selectedOthers];
  shuffleArray(sourcesToScrape);
  
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
  // ----------------------------------------------

  function isStrictlyValid(url) {
    const lowerUrl = url.toLowerCase();
    const generalBadWords = ['tag', 'author', 'video', 'topic', 'page', 'login', 'archive', 'photo', 'category', 'privacy', 'terms', 'about', 'contact'];
    if (generalBadWords.some(word => lowerUrl.includes(`/${word}`))) return false;
    if (!/\d/.test(lowerUrl)) return false; 
    return true;
  }

  let processedArticlesCount = 0;
  const MAX_ARTICLES_PER_RUN = 10; 
  
  const { data: recentNewsRecords } = await supabase.from('news').select('title').order('created_at', { ascending: false }).limit(30);
  const recentTitles = recentNewsRecords ? recentNewsRecords.map(n => n.title).join(' | ') : '';

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

        // 🖼️ মূল নিউজের ফিচার ইমেজ (og:image) সংগ্রহ করা
        const ogImageUrl = article$('meta[property="og:image"]').attr('content');
        let geminiImagePart = null;
        if (ogImageUrl) {
            console.log(`📸 মূল নিউজের ছবি সংগ্রহ করা হয়েছে, জেমিনি ভিশন দিয়ে রেড-ড্র করা হবে...`);
            geminiImagePart = await fetchImageForGemini(ogImageUrl);
        }

        const fullTextArray = [];
        article$('p').each((i, el) => {
          const text = article$(el).text().trim();
          if (text.length > 30) fullTextArray.push(text);
        });
        const fullText = fullTextArray.join('\n');

        if (fullText.length < 300) continue; 

        if (fullText) {
          console.log(`🧠 জেমিনি ভিশন এপিআই দিয়ে বিশ্লেষণ ও রেড-ড্র প্রম্পট তৈরি শুরু হচ্ছে...`);
          
          try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
            
const prompt = `
তুমি একজন আন্তর্জাতিক মানের সিনিয়র সাংবাদিক, অনুসন্ধানী রিপোর্টার এবং নিউজ এডিটর। নিচে একটি ওয়েবপেজ থেকে সংগৃহীত টেক্সট দেওয়া হয়েছে এবং সাথে মূল খবরের ছবিটিও (যদি পাওয়া যায়) সংযুক্ত করা হয়েছে।

========================
প্রথম ধাপ: সংবাদ যাচাই (Mandatory Validation)
========================

প্রথমে নিচের বিষয়গুলো কঠোরভাবে যাচাই করবে।

১. এটি যদি নিম্নোক্ত যেকোনো ধরনের লেখা হয় তাহলে বাতিল করবে:
- Privacy Policy
- Terms & Conditions
- About Us
- Contact
- Disclaimer
- Advertisement
- Cookie Policy
- Editorial Policy
- মতামত বা Opinion
- ব্লগ
- ক্যাটাগরি পেজ
- আর্কাইভ
- ট্যাগ পেজ
- নেভিগেশন বা ওয়েবসাইটের সাধারণ লেখা

২. টেক্সটটি যদি একাধিক সম্পর্কহীন খবরের শিরোনাম বা নিউজের মিশ্রণ (Mixed Headlines) হয় তাহলে বাতিল করবে।

৩. নিচের সাম্প্রতিক সংবাদগুলোর সাথে যদি একই ঘটনা, একই শিরোনাম অথবা একই সংবাদ পুনরাবৃত্তি হয় তাহলে বাতিল করবে।

সাম্প্রতিক সংবাদ:
[${recentTitles}]

উপরের যেকোনো একটি শর্ত সত্য হলে শুধুমাত্র এই JSON রিটার্ন করবে:

{"skip": true}

এর বাইরে আর কোনো লেখা দেবে না।

========================
দ্বিতীয় ধাপ: সংবাদ তৈরি
========================

যদি এটি একটি নতুন, নির্ভরযোগ্য এবং সম্পূর্ণ সংবাদ হয়, তাহলে নিচের নিয়মগুলো কঠোরভাবে অনুসরণ করবে।

### ১. শিরোনাম (Title)
- শিরোনাম হবে জাতীয় দৈনিক পত্রিকার প্রথম পাতার মানের।
- সংক্ষিপ্ত, শক্তিশালী, তথ্যসমৃদ্ধ এবং আকর্ষণীয় হবে।
- Clickbait করা যাবে না।
- কোলন (:), ড্যাশ (-), পাইপ (|) বা দুই ভাগে বিভক্ত শিরোনাম ব্যবহার করা যাবে না।
- শিরোনামে অতিরঞ্জিত বিশেষণ ব্যবহার করবে না।

### ২. ভূমিকা (Intro)
- প্রথম অনুচ্ছেদটি হবে সম্পূর্ণ নতুনভাবে লেখা।
- খবরের একদম প্রথম বাক্যের ভেতরেই খুব সাবলীলভাবে সোর্সের ক্রেডিট যুক্ত করবে (যেমন: "সম্প্রতি <a href='${link}' target='_blank' style='color:#0056b3;text-decoration:underline;'>${source.bnName}</a>-এর একটি প্রতিবেদনে বলা হয়েছে..." অথবা "...এমনটাই জানিয়েছে <a href='${link}' target='_blank' style='color:#0056b3;text-decoration:underline;'>${source.bnName}</a>")।
- লিংকের ঠিক আগে বা পরে কোনো অযাচিত ডট (.), কমা (,) বা স্পেস দিয়ে বাক্যের ফ্লো নষ্ট করবে না। বাক্যটি যেন পড়ার সময় একদম ন্যাচারাল বা মানুষের লেখার মতো মনে হয়।
- এই <a> ট্যাগ ছাড়া অন্য কোনো HTML ব্যবহার করা যাবে না এবং ট্যাগটি হুবহু ব্যবহার করবে।

### ৩. মূল প্রতিবেদন
- পুরো সংবাদ নিজের ভাষায় পুনর্লিখন করবে।
- মূল তথ্য বিকৃত করা যাবে না।
- কোনো তথ্য বানানো যাবে না।
- কোনো অনুমান যোগ করা যাবে না।
- কোনো রাজনৈতিক বা ব্যক্তিগত পক্ষপাত থাকবে না।
- সাংবাদিকতার নিরপেক্ষতা বজায় রাখতে হবে।
- প্রতিটি অনুচ্ছেদ আলাদা করতে শুধুমাত্র \\n\\n ব্যবহার করবে।
- <p>, <div>, <br>, Markdown বা অন্য কোনো HTML ব্যবহার করা যাবে না।
- "ছবি সংগৃহীত" বা অনুরূপ কোনো বাক্য যোগ করা যাবে না।

========================
তৃতীয় ধাপ: Image Sourcing & Fallback AI Prompt
========================
১. search_keyword: Unsplash, Pexels এবং Pixabay-তে স্টক ছবি খোঁজার জন্য খবরের থিম অনুযায়ী সর্বোচ্চ ১-২ শব্দের একটি নিখুঁত ইংরেজি কিওয়ার্ড দাও (যেমন: "hospital", "police", "money", "court")। 
২. image_prompt: যদি স্টক সাইটে ছবি না পাওয়া যায়, তবে AI (FLUX) দিয়ে সম্পূর্ণ কপিরাইট-মুক্ত ছবি জেনারেট করার জন্য প্রম্পট তৈরি করো।

AI Image Prompt নিয়মাবলী:
- Write image_prompt in English only. Max 300 characters.
- প্রম্পটের শুরুতেই লিখবে: "Realistic editorial news photograph of..."
- WARNING: কোনোভাবেই কোনো মানুষের চেহারা (Face), চোখ, হাত, পেট বা শরীরের কোনো অঙ্গ-প্রত্যঙ্গ (Body parts/Anatomy) প্রম্পটে রাখা যাবে না। 
- মানুষের পরিবর্তে খবরের সাথে সম্পর্কিত প্রতীকী অবজেক্ট (Objects) এবং পরিবেশ (Environment) ব্যবহার করবে। (যেমন: হাসপাতালের খবর হলে স্টেথোস্কোপ, আইনের খবর হলে হাতুড়ি, বিনোদনের খবর হলে সিনেমাটিক ক্যামেরা বা লাল গালিচা)।
- ছবিতে কোনো Text, Typography, Logo, Watermark বা লেখা প্রম্পটে রাখবে না।
- No blood, No violence, No body horror, No distorted faces. Google AdSense Safe.
- প্রম্পটের শেষে হুবহু এই কিওয়ার্ডগুলো যুক্ত করবে: "editorial news photography, documentary photography, professional DSLR, realistic perspective, authentic environment, wide-angle composition, empty scene without people, natural lighting, ultra realistic, high detail, 8k"

========================
চতুর্থ ধাপ: JSON Output
========================

Output Format:
{
  "skip": false,
  "title": "নতুন সংবাদ শিরোনাম",
  "content": "সম্পূর্ণ সংবাদ",
  "search_keyword": "keyword for stock sites",
  "image_prompt": "Professional symbolic object-based editorial AI image prompt in English"
}

========================
মূল সংবাদ
========================
${fullText}
`;

            // 💡 যদি ছবি পাওয়া যায়, তবে টেক্সটের সাথে ছবিও জেমিনিকে পাঠানো হবে
            const geminiPayload = geminiImagePart ? [prompt, geminiImagePart] : [prompt];
            
            let result;
            try {
                result = await model.generateContent(geminiPayload);
            } catch (geminiError) {
                if (geminiError.message.includes('429') || geminiError.message.includes('quota')) {
                    console.log('⏳ কোটা লিমিট শেষ, ৬ সেকেন্ড অপেক্ষা করে আবার চেষ্টা করা হচ্ছে...');
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
                console.log(`⏭️ খবরটি স্কিপ করা হয়েছে।`);
                continue; 
            }

           // 🎨 ইমেজ হান্টিং এবং ফলব্যাক এআই জেনারেশন ফ্লো
            let finalImageUrl = defaultPlaceholder;
            let imageSourceCredit = "বঙ্গীয় টাইমস";

            if (rewrittenData.search_keyword) {
                // ১. প্রথমে Unsplash এ খুঁজবে
                let stockUrl = await searchUnsplash(rewrittenData.search_keyword);
                
                // ২. না পেলে Pexels এ খুঁজবে
                if (!stockUrl) {
                    stockUrl = await searchPexels(rewrittenData.search_keyword);
                }

                // ৩. না পেলে Pixabay তে খুঁজবে
                if (!stockUrl) {
                    stockUrl = await searchPixabay(rewrittenData.search_keyword);
                }

                // ৪. যদি স্টক সাইটে পাওয়া যায়
                if (stockUrl) {
                    finalImageUrl = stockUrl;
                    imageSourceCredit = "সংগৃহীত (প্রতীকী)"; // <-- এখান থেকে 'ছবি:' বাদ দেওয়া হয়েছে
                } 
                // ৫. স্টক সাইটেও না পেলে AI দিয়ে জেনারেট করবে
                else if (rewrittenData.image_prompt) {
                    console.log("⚠️ স্টক সাইটে ছবি পাওয়া যায়নি। AI (FLUX) দিয়ে অবজেক্ট-ভিত্তিক ছবি জেনারেট করা হচ্ছে...");
                    const fluxUrl = await generateAndUploadImage(rewrittenData.image_prompt);
                    if (fluxUrl) {
                        finalImageUrl = fluxUrl;
                        imageSourceCredit = "এআই জেনারেটেড"; // <-- এখান থেকে 'ছবি:' বাদ দেওয়া হয়েছে
                    }
                }
            } else if (rewrittenData.image_prompt) {
                 // Fallback if no search_keyword but image_prompt exists
                 const fluxUrl = await generateAndUploadImage(rewrittenData.image_prompt);
                 if (fluxUrl) {
                     finalImageUrl = fluxUrl;
                     imageSourceCredit = "এআই জেনারেটেড"; // <-- এখান থেকে 'ছবি:' বাদ দেওয়া হয়েছে
                 }
            }

            // ডাটাবেসে সেভ করা
            const { error: insertError } = await supabase.from('news').insert([{
              title: rewrittenData.title,
              content: rewrittenData.content,
              snippet: rewrittenData.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + "...", 
              image_url: finalImageUrl, 
              source_url: link,
              source_name: 'বঙ্গীয় টাইমস', 
              category: source.defaultCategory,
              image_source: imageSourceCredit, 
              is_published: true, 
              is_custom: false 
            }]);
            if (insertError) {
                console.error("❌ সুপাবেজ ডাটাবেস এরর:", insertError.message);
            } else {
                console.log(`✅ সফলভাবে পাবলিশ হয়েছে: ${rewrittenData.title.substring(0, 40)}...`);
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
  console.log(`\n🎉 বটের কাজ সফলভাবে শেষ! মোট পাবলিশ করা নিউজ: ${processedArticlesCount}`);
}

runBot();
