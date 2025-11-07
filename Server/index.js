// index.js (in Server folder)
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config"; 

// Saare scraping functions ko import karo
import { scrapeAmazon } from "./scraper/amazonScraper.js";
import { scrapeFlipkart } from "./scraper/flipkartScraper.js";
import { scrapeMeesho } from "./scraper/meeshoScraper.js";
import { scrapeMyntra } from "./scraper/myntraScraper.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pricehub";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Product Schema and Model ---
const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, 
  platform: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  link: { type: String },
  searchQuery: { type: String, required: true },
  searchPlatforms: { type: String, required: true }, // Added platforms for caching key
  searchedAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', productSchema);

// Helper object to map platform names to their scraping functions
const scraperMap = {
  amazon: scrapeAmazon,
  flipkart: scrapeFlipkart,
  meesho: scrapeMeesho,
  myntra: scrapeMyntra,
};

// --- Helper Functions (saveProducts remains largely the same, but includes searchPlatforms) ---
const saveProducts = async (products, platform, query, platformsString, startId, step) => {
  const productsToSave = products.map((product, index) => {
    let cleanPrice = product.price.toString().replace(/[$,₹]/g, '').trim();
    cleanPrice = parseFloat(cleanPrice) || 0; 

    return {
        ...product,
        price: cleanPrice,
        searchQuery: query.toLowerCase(),
        searchPlatforms: platformsString, // Store combined platforms
        id: startId + index * step, 
    };
  }).filter(p => p.price > 0 && p.name);

  if (productsToSave.length === 0) {
    console.log(`⚠️ No valid data to insert from ${platform}.`);
    return [];
  }

  // Rewrite existing data for this exact query and platform combo
  try {
     // Delete old data before inserting new data (ensures rewrite)
     await Product.deleteMany({ searchQuery: query.toLowerCase(), searchPlatforms: platformsString });
     
     const docs = await Product.insertMany(productsToSave, { ordered: false });
     console.log(`💾 Successfully inserted ${docs.length} products from ${platform} (Rewrite complete).`);
     return productsToSave;
  } catch (err) {
     const insertedCount = err.result?.nInserted || 0;
     console.log(`⚠️ Inserted ${insertedCount} products from ${platform}. Potential duplicates skipped.`);
     return productsToSave; 
  }
};


// 1. Main Search Endpoint (/api/search)
app.get("/api/search", async (req, res) => {
  const query = req.query.q?.toLowerCase(); 
  const platformsString = req.query.platforms; 
  
  if (!query || !platformsString) {
    return res.status(400).json({ error: "Missing required parameters: q (query) and platforms" });
  }
  
  const platforms = platformsString.split(',').map(p => p.trim().toLowerCase()).slice(0, 2);
  const cacheKey = `${query}_${platformsString}`; 
  
  // --- Caching/Freshness Check ---
  // Agar same query pichle 5 minutes mein search kiya gaya hai, to scraping skip karo.
  const CACHE_DURATION_MINUTES = 5; 
  const CACHE_CUTOFF = new Date(Date.now() - CACHE_DURATION_MINUTES * 60 * 1000);

  try {
    // Check MongoDB if we have recent results for this exact search/platform combo
    const recentResult = await Product.findOne({ 
      searchQuery: query, 
      searchPlatforms: platformsString,
      searchedAt: { $gte: CACHE_CUTOFF } 
    }).sort({ searchedAt: -1 });

    if (recentResult) {
        // 🛠️ FETCH ONLY: Data is fresh, scraping skip karo aur DB se fetch karo
        console.log(`\n⏳ Cache Hit for "${query}" on ${platformsString}. Skipping scraping.`);
        
        const cachedProducts = await Product.find({ 
            searchQuery: query, 
            searchPlatforms: platformsString
        }).sort({ id: 1 }); // Sort by ID for interleaving
        
        const finalResults = cachedProducts.map(({ id, platform, name, price, image, link }) => ({
            id, platform, name, price, image, link
        }));

        return res.json(finalResults);
    }
    
    // --- Scraping (Cache Miss/Expired) ---
    console.log(`\nStarting sequential search (Cache Miss/Expired) for "${query}" on: ${platforms.join(' and ')}`);

    const [platform1, platform2] = platforms;
    let allProducts = [];

    // 1. Scraping Platform 1 (Sequential)
    const scraper1 = scraperMap[platform1];
    if (scraper1) {
      console.log(`   -> Scraping ${platform1} (1st platform)...`);
      const p1Products = await scraper1(query); 
      // 🛠️ Store with platformsString argument added
      const savedP1 = await saveProducts(p1Products, platform1, query, platformsString, 1, 2); 
      allProducts.push(...savedP1);
    }

    // 2. Scraping Platform 2 (Sequential)
    const scraper2 = scraperMap[platform2];
    if (scraper2) {
      console.log(`   -> Scraping ${platform2} (2nd platform)...`);
      const p2Products = await scraper2(query); 
       // 🛠️ Store with platformsString argument added
      const savedP2 = await saveProducts(p2Products, platform2, query, platformsString, 2, 2);
      allProducts.push(...savedP2);
    }
    
    // Sort all products by the custom ID (1, 2, 3, 4, ...) for interleaving
    allProducts.sort((a, b) => a.id - b.id);

    // Filter and project only necessary fields for the response
    const finalResults = allProducts.map(({ id, platform, name, price, image, link }) => ({
        id, platform, name, price, image, link
    }));

    console.log(`✅ Search complete. Total products returned: ${finalResults.length}`);
    res.json(finalResults);
  } catch (error) {
    console.error("❌ Critical Search/Scraping Error:", error);
    res.status(500).json({ error: "A critical error occurred during scraping and saving data." });
  }
});


// 2. Home Page Random Products Endpoint (/api/products/home)
app.get("/api/products/home", async (req, res) => {
  // Use a fixed pair for stability as requested (Flipkart & Meesho) [cite: 25]
  const platforms = ['amazon', 'flipkart']; 
  const categories = ["smartphones", "laptops", "headphones", "tshirts", "bags", "shoes"]; // 6 categories
  let homeProducts = [];

  try {
    // Randomly choose ONE platform for single API call optimization
    const randomPlatformName = platforms[Math.floor(Math.random() * platforms.length)];
    const scraper = scraperMap[randomPlatformName];
    
    if (!scraper) {
        console.error("❌ Home page scraper function is missing for:", randomPlatformName);
        return res.status(500).json({ error: "Home page scraper not available." });
    }

    // Sequentially scrape for 5 fixed categories (5 rows)
    console.log(`\nStarting Home Page scrape on single platform: ${randomPlatformName}`);
    
    for (const category of categories) {
        let categoryProducts = [];
        try {
             // Scrape once per category on the chosen platform (Sequential scrape)
            categoryProducts = await scraper(category); 
            console.log(`   -> Fetched ${categoryProducts.length} for ${category} from ${randomPlatformName}.`);
        } catch (scrapeError) {
             // 🛠️ FIX: Agar koi ek category/site fail ho jaye, toh hum skip karke aage badhenge, server crash nahi hoga.
            console.error(`⚠️ Scraping failed for category ${category} on ${randomPlatformName}:`, scrapeError.message);
            continue; // Skip this category and proceed to the next one
        }
        
        // Take top 5 cheapest products
        const top5 = categoryProducts
            .filter(p => p.price && p.name) 
            .map(p => ({
                ...p,
                price: parseFloat(p.price.toString().replace(/[$,₹]/g, '').trim()),
            }))
            .sort((a, b) => a.price - b.price) // Sort by price ascending
            .slice(0, 5) 

        homeProducts.push({
            category: category,
            platform: randomPlatformName,
            products: top5,
        });
    }

    res.json(homeProducts);

  } catch (error) {
    // Agar main try block mein koi critical error aaye
    console.error("❌ Critical Home Page Scraping Error:", error);
    res.status(500).json({ error: "Failed to fetch home page products due to a critical error." });
  }
});


// 3. User Search History Endpoint (For Recent Searches)
app.get("/api/user/history", async (req, res) => {
    // Aggregation to find the last 4 unique search queries
    try {
        const history = await Product.aggregate([
            { $group: { _id: "$searchQuery", latest: { $max: "$searchedAt" } } },
            { $sort: { latest: -1 } },
            { $limit: 4 }, // Maximum 4 rows of recent search 
            { $project: { _id: 0, query: "$_id" } }
        ]);

        res.json(history.map(item => item.query));
    } catch (error) {
        console.error("❌ Fetching search history error:", error);
        res.status(500).json({ error: "Failed to retrieve search history." });
    }
});


app.listen(PORT, () => {
  console.log(`\n✅ Server is running on http://localhost:${PORT}`);
});