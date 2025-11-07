// PriceHub/Server/scraper/amazonScraper.js
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Puppeteer setup with Stealth Plugin to avoid bot detection
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
 * Scrapes product data from Amazon based on the search query.
 * @param {string} query The search term (e.g., "laptops", "smartphones").
 * @returns {Promise<Array<Object>>} Array of product objects.
 */
async function scrapeAmazon(query) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox", 
            "--disable-setuid-sandbox", 
            "--disable-blink-features=AutomationControlled",
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ],
    });

    const page = await browser.newPage();
    
    // Set User-Agent for anti-detection
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    
    const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
    console.log(`\n🔍 Searching Amazon for "${query}": ${searchUrl}`);

    // Set realistic headers 
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
    });

    try {
        await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    } catch (error) {
        console.error("❌ Error navigating to Amazon search page:", error.message);
        await browser.close();
        return [];
    }

    // 🛠️ Main Card Selector: This works across most product types due to the data-asin attribute.
    const CARD_SELECTOR = 'div[data-asin]:not([data-asin=""])';

    try {
        await page.waitForSelector(CARD_SELECTOR, { timeout: 25000 });
    } catch (error) {
        console.log("⚠️ Amazon product cards not found in time. Check the selector or if blocked.");
        await browser.close();
        return [];
    }

    // Scroll down to load more products (Lazy loading support)
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight/2)");
    await delay(2000); 

    const products = await page.evaluate((selector) => {
        const productCards = document.querySelectorAll(selector);
        const data = [];

        productCards.forEach(card => {
            
            // --- 1. NAME (Combined Logic) ---
            let name = 
                card.querySelector("h2 span")?.innerText?.trim() || // Standard product span (Laptops/Mobiles)
                card.querySelector(".a-size-medium.a-color-base.a-text-normal")?.innerText?.trim() || // Alternative text size for some items
                null;
            
            // Fallback: If primary name is missing, try combining brand and title (e.g., Clothing/Watches)
            if (!name) {
                 const brandEl = card.querySelector("h2 span.a-size-base-plus.a-color-base") || card.querySelector(".a-size-mini.s-line-clamp-1 .a-size-base-plus.a-color-base");
                 const productEl = card.querySelector("h2 span.a-size-base-plus.a-color-base.a-text-normal");
                 if (brandEl && productEl) {
                     name = `${brandEl.innerText.trim()} ${productEl.innerText.trim()}`;
                 }
            }
            
            // --- 2. PRICE (Combined Logic) ---
            // Priority 1: The hidden price (.a-offscreen) is the most reliable way to get the actual discounted price.
            let price = card.querySelector(".a-price .a-offscreen")?.innerText;
            
            // Fallback: The visible whole price part (for sponsored or non-standard list views)
            if (!price) {
                const wholePart = card.querySelector(".a-price-whole")?.innerText;
                const symbol = card.querySelector(".a-price-symbol")?.innerText;
                if (wholePart && symbol) {
                    price = symbol + wholePart;
                }
            }

            // --- 3. LINK ---
            // Try different link wrappers for various card layouts
            const linkEl = card.querySelector(
                "a.a-link-normal.s-no-outline, a.a-link-normal.s-line-clamp-2, a.a-link-normal.s-underline-text"
            );
            const link = linkEl ? linkEl.href : null;

            // --- 4. IMAGE ---
            // Check src first, then data-lazy-src
            const imageEl = card.querySelector("img.s-image");
            const image = imageEl?.getAttribute("src") || imageEl?.getAttribute("data-lazy-src") || null;

            if (name && price && link) {
                // Remove currency symbol and comma for clean, numeric storage
                const cleanPrice = price.replace(/[₹$,]/g, '').trim(); 
                
                data.push({
                    platform: "Amazon",
                    name: name,
                    price: cleanPrice, 
                    image: image,
                    link: link,
                });
            }
        });

        return data;
    }, CARD_SELECTOR);

    console.log(`✅ Amazon scraping complete. Found ${products.length} product(s) for "${query}".`);
    await browser.close();
    return products;
}

// 🛠️ ES Module Export
export { scrapeAmazon };