// PriceHub/Server/scraper/meeshoScraper.js
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const puppeteer = puppeteerExtra;
puppeteer.use(StealthPlugin());

// Utility function to replace deprecated page.waitForTimeout
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeMeesho(query) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  const searchUrl = `https://www.meesho.com/search?q=${encodeURIComponent(query)}`;
  console.log("🔍 Searching Meesho:", searchUrl);

  await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 0 });

  // 🛠️ Updated Card Container Selector: Using data-testid for stability OR the highly specific class
  const CARD_SELECTOR = 'div[data-testid^="product-card"], div.NewProductCardstyled__CardStyled-sc-6y2tys-0';
  
  try {
    // Wait for EITHER of the selectors to load
    await page.waitForSelector(CARD_SELECTOR.split(',')[0], { timeout: 20000 })
      .catch(() => page.waitForSelector(CARD_SELECTOR.split(',')[1], { timeout: 20000 }));
  } catch {
    console.log("⚠️ Product cards not found in time.");
  }

  // Scroll down for more products
  let lastHeight = 0;
  for (let i = 0; i < 3; i++) { // Optimized: Reduced scrolls to save resources
    const newHeight = await page.evaluate("document.body.scrollHeight");
    if (newHeight === lastHeight) break;
    lastHeight = newHeight;
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await delay(1500); // Wait reduced
  }

  // 🛠️ FIX: CARD_SELECTOR ko page.evaluate mein pass kiya gaya
  const products = await page.evaluate((selector) => {
    // Collect cards using both potential selectors
    const cards = document.querySelectorAll(selector);
    const data = [];

    cards.forEach((card) => {
      // Product Name 
      const name =
        card.querySelector("p.ejhQZU")?.innerText ||
        card.querySelector("p")?.innerText || 
        null;

      // Product Price
      const price =
        card.querySelector("h5.dwCrSh")?.innerText ||
        card.querySelector("h5")?.innerText ||
        null;

      // Image
      const image =
        card.querySelector("img")?.src ||
        card.querySelector("img")?.getAttribute("data-src") ||
        null;

      // Link
      const linkEl = 
          card.closest("a")?.getAttribute("href") || 
          card.querySelector("a[href]")?.getAttribute("href") || 
          null;
      
      const link = linkEl
        ? linkEl.startsWith("http")
          ? linkEl
          : "https://www.meesho.com" + linkEl
        : null;

      if (name && price && link) { 
        data.push({
          platform: "Meesho",
          name: name.trim(), 
          price: price.trim(), 
          image,
          link,
        });
      }
    });

    return data;
  }, CARD_SELECTOR); // 🛠️ FIX: Argument passed here

  console.log(`✅ Meesho products found: ${products.length}`);
  await browser.close();
  return products;
}

// 🛠️ ES Module Export
export { scrapeMeesho };