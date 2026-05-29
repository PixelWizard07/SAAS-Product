const { newPage } = require('../browser');
const logger = require('../logger');

const scrapeReturns = async (browser, cookies) => {
  const page = await newPage(browser, cookies);
  try {
    await page.goto('https://supplier.meesho.com/returns', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('tr, [class*="return"]', { timeout: 15000 });
    const returns = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('tr[class*="row"], [class*="return-item"]').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length < 3) return;
        const img = row.querySelector('img');
        items.push({
          returnId: cells[0]?.innerText?.trim() || '',
          orderId: cells[1]?.innerText?.trim() || '',
          productName: cells[2]?.innerText?.trim() || '',
          returnReason: cells[3]?.innerText?.trim() || '',
          status: cells[4]?.innerText?.trim() || 'Initiated',
          buyerName: cells[5]?.innerText?.trim() || '',
          productImage: img?.src || '',
        });
      });
      return items;
    });
    logger.info(`Scraped ${returns.length} returns`);
    return returns;
  } catch (err) {
    logger.error('Returns scrape failed:', err.message);
    return [];
  } finally {
    await page.close();
  }
};

const scrapeOtp = async (browser, cookies, orderId) => {
  const page = await newPage(browser, cookies);
  try {
    await page.goto(`https://supplier.meesho.com/returns?orderId=${orderId}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[class*="otp"], input[readonly][maxlength="6"]', { timeout: 15000 });
    const otp = await page.evaluate(() => {
      const el = document.querySelector('[class*="otp"] span, input[readonly][maxlength="6"]');
      return el?.innerText?.trim() || el?.value?.trim() || null;
    });
    return otp;
  } catch (err) {
    logger.error('OTP scrape failed:', err.message);
    return null;
  } finally {
    await page.close();
  }
};

module.exports = { scrapeReturns, scrapeOtp };
