// PriceHub/Server/scraper/myntraScraper.js
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const puppeteer = puppeteerExtra;
puppeteer.use(StealthPlugin());

/**
 * Utility function to wait for a specified number of milliseconds (ms).
 * @param {number} ms - Milliseconds to wait.
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scrapes product data from Myntra based on the search query.
 * @param {string} query The search term (e.g., "men shirt").
 * @returns {Promise<Array<Object>>} Array of product objects.
 */
async function scrapeMyntra(query) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox", 
      "--disable-setuid-sandbox", 
      "--disable-blink-features=AutomationControlled" // Anti-detection measure
    ],
  });

  const page = await browser.newPage();
  
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  
  const searchUrl = `https://www.myntra.com/${encodeURIComponent(query)}`;
  console.log("🔍 Searching Myntra:", searchUrl);

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
  });

  // Increased timeout for Myntra as it's slow
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

  const CARD_SELECTOR = ".product-base";
  try {
    await page.waitForSelector(CARD_SELECTOR, { timeout: 25000 });
  } catch (error) {
    console.log("⚠️ Product cards not found in time. Check the search URL or selector.");
    await browser.close();
    return [];
  }

  // Scroll down to load more products
  await page.evaluate("window.scrollTo(0, document.body.scrollHeight/2)");
  await delay(2000); 

  const products = await page.evaluate((selector) => {
    const productCards = document.querySelectorAll(selector);
    const data = [];

    productCards.forEach(card => {
      // 1. Name & Brand
      const brand = card.querySelector(".product-brand")?.innerText || '';
      const name = card.querySelector(".product-product")?.innerText || '';
      const fullName = (brand + ' ' + name).trim();

      // 2. Price
      const discountedPrice = card.querySelector(".product-discountedPrice")?.innerText;
      const finalPrice = discountedPrice || card.querySelector(".product-price")?.innerText || null;
        
      // 3. Link
      const linkEl = card.querySelector("a")?.href;
      const link = linkEl
          ? linkEl.startsWith("http")
            ? linkEl
            : "https://www.myntra.com/" + linkEl.replace(/^\/+/, '')
          : null;

      // 🛠️ CORRECTED IMAGE LOGIC: Targeting <source> srcset for high-res URL
      let image = null;
      const sourceEl = card.querySelector("picture source");
      if (sourceEl) {
          const srcset = sourceEl.getAttribute("srcset");
          if (srcset) {
              // Extract the 2.0x resolution URL from the srcset string
              const match = srcset.match(/https:\/\/[^\s,]+ 2\.0x/);
              if (match) {
                  // Clean up the match to get the URL only
                  image = match[0].replace(' 2.0x', '').trim();
              }
          }
      }

      // Fallback to basic src/data-src if srcset extraction fails
      if (!image) {
          image = card.querySelector("img")?.getAttribute("src") ||
                  card.querySelector("img")?.getAttribute("data-src") ||
                  null;
      }
      // Myntra also adds 'dpr_2,q_60' to the main image URL, so we can try cleaning that up for a higher quality version if needed.
      // For now, focusing on srcset for best results.
      
      if (fullName && finalPrice && link) {
        const cleanPrice = finalPrice.replace(/Rs\.\s*/, '').replace(/,/g, '').trim(); 
        
        data.push({
          platform: "Myntra",
          name: fullName,
          price: cleanPrice,
          image,
          link,
        });
      }
    });

    return data;
  }, CARD_SELECTOR);

  console.log(`✅ Myntra products found: ${products.length}`);
  await browser.close();
  return products;
}

export { scrapeMyntra };