// PriceHub/Server/scraper/flipkartScraper.js
import puppeteer from "puppeteer";

export async function scrapeFlipkart(query) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
  console.log(`🔍 Searching Flipkart for: ${query}`);

  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

  // 🛠️ ROBUST CARD SELECTOR: Combining selectors for Electronics, Fashion/Shoes, and Headphones/Accessories.
  const CARD_SELECTOR = 
    "div.tUxRFH, div._1AtVbE, div._1sdMkc.LFEi7Z, div.slAVV4"; // All possible card wrappers

  // Wait for at least one card type to load
  try {
     // A common fallback is often better for waitForSelector
     await page.waitForSelector("div[data-tkid]", { timeout: 30000 }); 
  } catch (e) {
     console.log("⚠️ No product cards loaded in time on Flipkart.");
     await browser.close();
     return [];
  }

  const products = await page.evaluate((selector) => {
    const productCards = document.querySelectorAll(selector);
    const data = [];

    productCards.forEach(card => {
      // 1. NAME SELECTORS (Most variations)
      const name =
        card.querySelector(".KzDlHZ")?.innerText ||        // Electronics/General
        card.querySelector("a.IRpwTa")?.innerText ||       // General link title
        card.querySelector("a.s1Q9rs")?.innerText ||       // Small card title
        card.querySelector(".WKTcLC")?.title ||           // T-shirt/Shoes title (from card.html)
        card.querySelector(".WKTcLC")?.innerText ||        // T-shirt name text
        card.querySelector(".wjcEIp")?.title ||           // Headphone title (from card.html)
        card.querySelector(".wjcEIp")?.innerText ||        // Headphone name text
        null;

      // 2. PRICE SELECTORS (Most variations)
      const price =
        card.querySelector(".Nx9bqj")?.innerText ||       // Primary discounted price
        card.querySelector("._30jeq3")?.innerText ||       // Alternate price class
        null;

      // 3. LINK SELECTORS
      // Priority 1: Main product link element
      const linkEl = 
        card.querySelector("a.rPDeLR")?.href ||           // T-shirt/Shoes wrapping link
        card.querySelector("a.VJA3rP")?.href ||           // Headphone wrapping link
        card.querySelector("a[href*='/p/']")?.href ||     // Fallback to any direct product link
        card.querySelector("a")?.href;                    // Fallback to any inner link

      const link = linkEl
        ? linkEl.startsWith("http")
          ? linkEl
          : "https://www.flipkart.com" + linkEl
        : null;

      // 4. IMAGE SELECTORS
      const image =
        card.querySelector("img")?.getAttribute("src") ||
        card.querySelector("img")?.getAttribute("data-src") ||
        card.querySelector("img")?.getAttribute("loading='eager'") || // Headphone image
        null;

      if (name && price) {
        data.push({ platform: "Flipkart", name, price, image, link: link });
      }
    });

    return data;
  }, CARD_SELECTOR);

  console.log(`✅ Flipkart products found: ${products.length}`);
  await browser.close();
  return products;
}
// Function is exported via 'export async function'
