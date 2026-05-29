const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-web-security',
  '--window-size=1280,800',
];

const launchBrowser = async () => {
  return puppeteer.launch({
    headless: process.env.SCRAPER_HEADLESS !== 'false' ? 'new' : false,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: LAUNCH_ARGS,
    defaultViewport: { width: 1280, height: 800 },
  });
};

const newPage = async (browser, cookies = null) => {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  if (cookies) await page.setCookie(...cookies);
  return page;
};

module.exports = { launchBrowser, newPage };
