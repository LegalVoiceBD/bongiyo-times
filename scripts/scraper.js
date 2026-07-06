const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

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

// =========================================================================
// Gemini Vision Validation for AI Generate
// =========================================================================
async function validateAIImageWithGemini(buffer, newsContext) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
        You are a strict QA bot for a news publication. Analyze this AI-generated image meant for news context: "${newsContext}".
        Rate it from 0 to 100 based on these criteria:
        1. NO Text, NO Letters, NO Watermarks, NO Fake Logos (deduct 50 points if any found).
        2. NO Human faces, body parts, or crowds (deduct 50 points if found, as this is strictly for abstract/object/symbolic images).
        3. NO Distorted/Melted objects.
        Return ONLY a raw JSON format: {"score": 95}
        `;
        const imagePart = {
            inlineData: { data: buffer.toString("base64"), mimeType: "image/jpeg" }
        };
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        const match = responseText.match(/\{[\s\S]*\}/);
        const data = JSON.parse(match[0]);
        console.log(`👁️ ভিশন এআই স্কোর: ${data.score}/100`);
        return data.score || 0;
    } catch (e) { 
        return 90; // Fallback pass if Gemini API fails
    }
}

// =========================================================================
// Image Generation using Gemini 2.5 Flash API
// =========================================================================
async function generateAndUploadImage(imagePrompt) {
  let attempts = 0;
  const maxAttempts = 2; // ফেইল করলে পুনরায় চেষ্টা করবে

  while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`🎨 ইমেজ জেনারেট হচ্ছে (Gemini API) - Attempt ${attempts}...`);
        
        // প্রম্পট স্টাইলিং (খবরের জন্য - strictly no humans, no text, highly symbolic)
        const styleSuffix = ", Ultra realistic, Photojournalism style but highly symbolic, Abstract representation, High quality macro photography, Natural lighting, Real press photograph style, NO TEXT, NO LETTERS, NO WATERMARK, NO LOGO, NO HUMANS, NO FACES, NO CROWDS, ONLY OBJECTS AND SCENERY.";
        const finalPrompt = imagePrompt + styleSuffix;
        
        // Gemini API URL 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        // Request Payload
        const payload = {
            contents: [{
                parts: [{ text: finalPrompt }]
            }],
            generationConfig: {
                responseModalities: ["IMAGE"]
            }
        };

        const imageRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!imageRes.ok) throw new Error("Gemini Image fetch failed");
        
        const data = await imageRes.json();
        
        // Base64 ডেটা এক্সট্রাক্ট করা
        const base64Data = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!base64Data) throw new Error("No image data found in Gemini response");

        // Base64 কে Buffer এ রূপান্তর করা
        const buffer = Buffer.from(base64Data, 'base64');

        // Validation Step (ভিজ্যুয়াল চেক)
        const validationScore = await validateAIImageWithGemini(buffer, imagePrompt);
        
        if (validationScore >= 90) {
            return new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'bongiyotimes_auto', timeout: 60000 }, 
                (error, result) => {
                  if (error) { resolve(null); } 
                  else { resolve(result.secure_url); }
                }
              );
              uploadStream.end(buffer);
            });
        } else {
            console.log(`⚠️ ইমেজ কোয়ালিটি খারাপ (Score: ${validationScore}), আবার চেষ্টা করা হচ্ছে...`);
        }
      } catch (error) { 
          console.error("Gemini Image Gen error:", error.message);
          if (error.message.includes('429')) await delay(5000);
      }
  }
  return null;
}

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

// =========================================================================
// Main Bot Engine
// =========================================================================
async function runBot() {
  console.log("🚀 মেগা লটারি বট কাজ শুরু করেছে (V12: Fully AI Generated Image Pipeline)...");

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
    { name: 'Jagonews24', bnName: 'জাগো নিউজ', url: 'https://www.jagonews24.com/national', domain: 'jagonews24.com', defaultCategory: 'বাংলাদেশ' }
  ];

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const tier1Config = [
    { name: 'Prothom Alo', category: 'বাংলাদেশ' },
    { name: 'Prothom Alo', category: 'রাজনীতি' },
    { name: 'BBC Bangla', category: 'আন্তর্জাতিক' },
    { name: 'Jugantor', category: 'বাংলাদেশ' },
    { name: 'Ittefaq', category: 'বাংলাদেশ' },
    { name: 'BD Pratidin', category: 'রাজনীতি' }
  ];

  const tier1Sources = allSources.filter(source =>
    tier1Config.some(item => item.name === source.name && item.category === source.defaultCategory)
  );
  const remainingSources = allSources.filter(source =>
    !tier1Config.some(item => item.name === source.name && item.category === source.defaultCategory)
  );

  const shuffledRemaining = shuffleArray([...remainingSources]);
  const sourceCounter = {};
  const randomSelectedSources = [];

  for (const source of shuffledRemaining) {
    sourceCounter[source.name] = sourceCounter[source.name] || 0;
    if (sourceCounter[source.name] >= 2) continue;
    randomSelectedSources.push(source);
    sourceCounter[source.name]++;
    if (randomSelectedSources.length >= 12) break;
  }

  const sourcesToScrape = [...tier1Sources, ...randomSelectedSources];
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
  
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

      const topLinks = links.slice(0, 25); 
      
      for (let link of topLinks) {
        if (processedArticlesCount >= MAX_ARTICLES_PER_RUN) break;

        try {
          const cleanUrl = new URL(link);
          cleanUrl.search = "";
          link = cleanUrl.toString();
        } catch (e) {}

        const { count: existingUrlCount } = await supabase
          .from('news')
          .select('*', { count: 'exact', head: true })
          .eq('source_url', link);
          
        if (existingUrlCount > 0) continue;

        const articleRes = await fetch(link, { headers });
        const articleHtml = await articleRes.text();
        const article$ = cheerio.load(articleHtml);

        let extractedImageUrl = 
            article$('meta[property="og:image"]').attr('content') ||
            article$('meta[property="twitter:image"]').attr('content') ||
            article$('meta[name="twitter:image"]').attr('content');

        let geminiImagePart = null;
        if (extractedImageUrl) {
            geminiImagePart = await fetchImageForGemini(extractedImageUrl);
        }

        let fullTextArray = [];
        const contentSelectors = ['article', 'main', '.story', '.news-content', '.entry-content', '.post-content', '.article-body', '.content', '.details', '.details-content', '.newsDetails', '.post-details'];
        let contentFound = false;

        for (const selector of contentSelectors) {
            if (article$(selector).length > 0) {
                article$(selector).find('footer, .author, .related, .advertisement, script, style, .social-share, aside, nav, figure, figcaption, .recommended, .more-news, .share, .ads, iframe, noscript').remove();
                
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
            
            // =========================================================================
            // STRICT PROMPT FOR DIRECT AI IMAGE GENERATION
            // =========================================================================
            const prompt = `
            তুমি একজন আন্তর্জাতিক মানের সিনিয়র সাংবাদিক, অনুসন্ধানী রিপোর্টার এবং নিউজ এডিটর। 

            ========================
            প্রথম ধাপ: সংবাদ যাচাই ও Event Hash
            ========================
            ১. Privacy Policy, Advertisement, Opinion, Blog, Category, Archive ইত্যাদি হলে বাতিল করবে।
            ২. Duplicate Event Check: নিচের সাম্প্রতিক সংবাদগুলোর সাথে যদি এই সংবাদটি হুবহু একই ঘটনার হয় (Title, Snippet, Hash এবং Entities মিলিয়ে), তাহলে অবশ্যই রিটার্ন করবে: {"skip": true}
            
            সাম্প্রতিক সংবাদ কনটেক্সট:
            ${recentContext}

            ========================
            দ্বিতীয় ধাপ: সংবাদ তৈরি ও ক্যাটাগরি
            ========================
            - প্রথম বাক্যে ন্যাচারালভাবে সোর্সের ক্রেডিট যুক্ত করবে: (যেমন: <a href='${link}' target='_blank' style='color:#0056b3;text-decoration:underline;'>${source.bnName}</a>)
            - পুরো সংবাদ নিজের ভাষায় পুনর্লিখন করবে। কোনো HTML ট্যাগ নয়, শুধু \\n\\n।

            ========================
            Step 3: IMAGE PROMPT GENERATION (STRICT RULES)
            ========================
            We generate all images using an AI Image Generator. You MUST write a strong, detailed image prompt in English based on the core theme of the news.
            1. STRICTLY NO HUMANS: Do not include any person, crowd, face, or body parts in the prompt.
            2. STRICTLY NO TEXT: The prompt must explicitly avoid words, letters, logos, or signs.
            3. SYMBOLIC & ABSTRACT: Create a symbolic representation of the news using objects, environments, lighting, and metaphors. (e.g., instead of a politician, use a glowing gavel on a wooden desk with a flag blurred in the background; instead of a criminal, use handcuffs on cold concrete).
            4. BE DETAILED: Specify lighting, camera angle, textures, and mood.

            ========================
            Step 4: JSON Output Format
            ========================
            {
              "skip": false,
              "title": "নতুন সংবাদ শিরোনাম",
              "content": "সম্পূর্ণ সংবাদ",
              "true_category": "সঠিক ক্যাটাগরি",
              "image_prompt": "A highly detailed, symbolic English prompt for AI generation. Focus on objects, mood, and lighting. NO HUMANS, NO TEXT.",
              "importance_score": 9,
              "editorial_score": 92,
              "breaking_news": true,
              "event_type": "Politics",
              "entity": ["Entity 1"],
              "location": ["Dhaka"],
              "person": ["Person 1"]
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
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found in response");
            const rewrittenData = JSON.parse(jsonMatch[0]);

            if (rewrittenData.skip) continue; 

            const loc = (rewrittenData.location || []).join(',');
            const per = (rewrittenData.person || []).join(',');
            const eventHashStr = `${rewrittenData.event_type || ''}|${loc}|${per}|${rewrittenData.title}`.toLowerCase().trim();
            const generatedEventHash = crypto.createHash('md5').update(eventHashStr).digest('hex');
            rewrittenData.event_hash = generatedEventHash;

            const actualCategory = rewrittenData.true_category || source.defaultCategory;
            const requiredScore = minimumScore[actualCategory] || 7;

            if ((rewrittenData.importance_score || 0) < requiredScore) continue;

            publishedCount[actualCategory] = publishedCount[actualCategory] || 0;
            if (publishedCount[actualCategory] >= (CATEGORY_LIMITS[actualCategory] || 1)) continue;

            let finalImageUrl = defaultPlaceholder;
            let imageSourceCredit = "বঙ্গীয় টাইমস"; // Default credit for fallback stock image
            
            const hashCheckPromise = supabase
              .from('news')
              .select('*', { head: true, count: 'exact' })
              .eq('event_hash', generatedEventHash);

            let imagePromise = Promise.resolve(null);

            // =========================================================================
            // Integrated AI Image Execution 
            // =========================================================================
            if (rewrittenData.image_prompt) {
                imagePromise = generateAndUploadImage(rewrittenData.image_prompt).then(aiUrl => {
                    if (aiUrl) {
                        return { url: aiUrl, credit: "এআই জেনারেটেড" };
                    }
                    return null;
                });
            }

            const [{ count: hashCount }, resolvedImage] = await Promise.all([
                hashCheckPromise,
                imagePromise
            ]);

            if (hashCount > 0) {
                console.log(`⏭️ একই ঘটনার সংবাদ (Event Hash) ডাটাবেসে পাওয়া গেছে। স্কিপ করা হলো।`);
                continue;
            }
            
            if (resolvedImage && resolvedImage.url) {
                finalImageUrl = resolvedImage.url;
                imageSourceCredit = resolvedImage.credit;
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
              event_hash: rewrittenData.event_hash,
              event_type: rewrittenData.event_type || 'General'
            }]);

            if (insertError) {
                console.error("❌ সুপাবেজ ডাটাবেস এরর:", insertError.message);
            } else {
                console.log(`✅ পাবলিশ: [${actualCategory}] ${rewrittenData.title.substring(0, 30)}... | Image: ${imageSourceCredit}`);
                publishedCount[actualCategory]++; 
                processedArticlesCount++;
            }
            
            await delay(10000); 

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
