const { newPage } = require('../browser');
const logger = require('../logger');

const SUPPLIER_URL = 'https://supplier.meesho.com';

const login = async (browser, phone, password) => {
  const page = await newPage(browser);
  try {
    await page.goto(`${SUPPLIER_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('input[type="tel"], input[name="phone"], input[placeholder*="mobile"], input[placeholder*="phone"]', { timeout: 10000 });
    const phoneInput = await page.$('input[type="tel"]') || await page.$('input[name="phone"]') || await page.$('input[placeholder*="mobile"]');
    if (!phoneInput) throw new Error('Phone input not found');
    await phoneInput.type(phone, { delay: 50 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    const passInput = await page.$('input[type="password"]');
    if (passInput) {
      await passInput.type(password, { delay: 50 });
      await page.keyboard.press('Enter');
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
    const cookies = await page.cookies();
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      throw new Error('Login failed — check credentials or OTP required');
    }
    logger.info(`Login successful for ${phone}`);
    return cookies;
  } finally {
    await page.close();
  }
};

module.exports = { login };
