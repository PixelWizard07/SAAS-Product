const { newPage } = require('../browser');
const logger = require('../logger');

const scrapeOrders = async (browser, cookies) => {
  const page = await newPage(browser, cookies);
  const orders = [];
  try {
    await page.goto('https://supplier.meesho.com/orders/active', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('[class*="order"], [data-testid*="order"], table tbody tr', { timeout: 15000 });
    const rows = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('tr[class*="row"], [class*="order-item"], [class*="OrderRow"]').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, [class*="cell"]'));
        if (cells.length < 3) return;
        const img = row.querySelector('img');
        items.push({
          orderId: cells[0]?.innerText?.trim() || '',
          productName: cells[1]?.innerText?.trim() || '',
          status: cells[cells.length - 1]?.innerText?.trim() || '',
          productImage: img?.src || img?.dataset?.src || '',
          buyerName: cells[2]?.innerText?.trim() || '',
          price: parseFloat((cells[3]?.innerText || '0').replace(/[^0-9.]/g, '')) || 0,
        });
      });
      return items;
    });
    orders.push(...rows);
    logger.info(`Scraped ${orders.length} orders`);
    return orders;
  } catch (err) {
    logger.error('Orders scrape failed:', err.message);
    return [];
  } finally {
    await page.close();
  }
};

module.exports = { scrapeOrders };
