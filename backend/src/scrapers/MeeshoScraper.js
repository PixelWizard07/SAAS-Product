'use strict';
/**
 * MeeshoScraper — Puppeteer-based browser automation for supplier.meesho.com
 *
 * Architecture:
 * - Launches headless Chrome per-account (reuses browser across requests via sessionMap)
 * - Intercepts XHR/fetch responses to capture Meesho's internal API JSON
 * - Falls back to DOM extraction when API interception misses data
 * - Stores session cookies in DB (AES-256 encrypted field) to survive restarts
 * - All public methods are async and throw on unrecoverable errors
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const SUPPLIER_URL = 'https://supplier.meesho.com';

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-background-networking',
  '--disable-extensions',
  '--window-size=1366,768',
];

// Tab → URL path mappings for Meesho supplier panel
const ORDER_TAB_PATHS = {
  new:          '/orders/new_orders',
  pending:      '/orders/new_orders',
  on_hold:      '/orders/on_hold',
  ready_to_ship:'/orders/ready_to_dispatch',
  shipped:      '/orders/shipped',
  cancelled:    '/orders/cancelled',
};

// Singleton browser pool per accountId so we don't spawn redundant instances
const browserPool = new Map(); // accountId → { browser, lastUsed }

const getBrowser = async (accountId) => {
  const entry = browserPool.get(accountId);
  if (entry) {
    try {
      // Check if browser is still alive
      const pages = await entry.browser.pages();
      if (pages.length >= 0) {
        entry.lastUsed = Date.now();
        return entry.browser;
      }
    } catch {
      browserPool.delete(accountId);
    }
  }
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: LAUNCH_ARGS,
    defaultViewport: { width: 1366, height: 768 },
    timeout: 60000,
  });
  browserPool.set(accountId, { browser, lastUsed: Date.now() });
  return browser;
};

// Clean up browsers idle for more than 10 minutes
setInterval(() => {
  for (const [id, entry] of browserPool.entries()) {
    if (Date.now() - entry.lastUsed > 10 * 60 * 1000) {
      entry.browser.close().catch(() => {});
      browserPool.delete(id);
    }
  }
}, 5 * 60 * 1000);

class MeeshoScraper {
  constructor({ accountId, phone, password, sessionCookies }) {
    this.accountId = accountId;
    this.phone = phone;
    this.password = password;
    this.storedCookies = sessionCookies || null;
    this.browser = null;
    this._interceptedData = {};
  }

  async _getBrowser() {
    this.browser = await getBrowser(this.accountId);
    return this.browser;
  }

  async _newPage(cookies = null) {
    const browser = await this._getBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    if (cookies && cookies.length) {
      await page.setCookie(...cookies);
    }
    return page;
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  async login() {
    const page = await this._newPage();
    try {
      await page.goto(`${SUPPLIER_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

      // Phone number step
      const phoneSelectors = ['input[type="tel"]', 'input[name="phone"]', 'input[placeholder*="phone" i]', 'input[placeholder*="mobile" i]', 'input[placeholder*="number" i]'];
      let phoneInput = null;
      for (const sel of phoneSelectors) {
        phoneInput = await page.$(sel);
        if (phoneInput) break;
      }
      if (!phoneInput) throw new Error('Phone input not found on Meesho login page');
      await phoneInput.click({ clickCount: 3 });
      await phoneInput.type(this.phone, { delay: 60 });

      // Click Continue / Next
      const continueBtn = await page.$('button[type="submit"]') || await page.$('button');
      if (continueBtn) await continueBtn.click();
      await page.waitForTimeout(2000);

      // Password step
      const passInput = await page.$('input[type="password"]');
      if (passInput) {
        await passInput.type(this.password, { delay: 60 });
        const loginBtn = await page.$('button[type="submit"]') || await page.$('button');
        if (loginBtn) await loginBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 25000 }).catch(() => {});
      }

      const url = page.url();
      if (url.includes('/login') || url.includes('/verify')) {
        throw new Error('Login failed — invalid credentials or OTP required');
      }

      const cookies = await page.cookies();
      this.storedCookies = cookies;
      return cookies;
    } finally {
      await page.close().catch(() => {});
    }
  }

  async _ensureSession() {
    if (!this.storedCookies || !this.storedCookies.length) {
      this.storedCookies = await this.login();
      return;
    }
    // Quick session check — hit the dashboard and see if we're redirected to login
    const page = await this._newPage(this.storedCookies);
    try {
      await page.goto(`${SUPPLIER_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (page.url().includes('/login')) {
        await page.close();
        this.storedCookies = await this.login();
      }
    } catch {
      // Network/timeout — proceed with existing cookies
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── DATA INTERCEPTION ────────────────────────────────────────────────────

  async _pageWithIntercept(path, dataCollector) {
    await this._ensureSession();
    const page = await this._newPage(this.storedCookies);
    const collected = {};

    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      if (status !== 200) return;
      if (!url.includes('meesho.com') && !url.includes('meesho.io')) return;
      if (!url.match(/\/(api|v[0-9]|orders|returns|products|catalog|payments|supplier)/i)) return;
      try {
        const ct = response.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const json = await response.json();
        dataCollector(url, json, collected);
      } catch {}
    });

    try {
      await page.goto(`${SUPPLIER_URL}${path}`, { waitUntil: 'networkidle2', timeout: 35000 });
      await page.waitForTimeout(3000);
    } finally {
      await page.close().catch(() => {});
    }
    return collected;
  }

  // ─── ORDERS ──────────────────────────────────────────────────────────────

  async scrapeOrders() {
    await this._ensureSession();
    const allOrders = [];
    const tabs = ['new_orders', 'ready_to_dispatch', 'on_hold', 'shipped', 'cancelled'];

    for (const tab of tabs) {
      const page = await this._newPage(this.storedCookies);
      const tabOrders = [];

      page.on('response', async (response) => {
        const url = response.url();
        if (!url.includes('meesho') || response.status() !== 200) return;
        if (!url.match(/order/i)) return;
        try {
          const ct = response.headers()['content-type'] || '';
          if (!ct.includes('json')) return;
          const json = await response.json();
          const rows = extractOrdersFromJson(json, tab);
          tabOrders.push(...rows);
        } catch {}
      });

      try {
        await page.goto(`${SUPPLIER_URL}/orders/${tab}`, { waitUntil: 'networkidle2', timeout: 35000 });
        await page.waitForTimeout(4000);

        // DOM fallback if interception yielded nothing
        if (tabOrders.length === 0) {
          const domOrders = await extractOrdersFromDOM(page, tab);
          tabOrders.push(...domOrders);
        }
      } catch (err) {
        console.error(`[MeeshoScraper] Orders tab ${tab} failed:`, err.message);
      } finally {
        await page.close().catch(() => {});
      }

      allOrders.push(...tabOrders);
    }

    return allOrders;
  }

  // ─── RETURNS ─────────────────────────────────────────────────────────────

  async scrapeReturns() {
    await this._ensureSession();
    const returns = [];
    const page = await this._newPage(this.storedCookies);

    page.on('response', async (response) => {
      const url = response.url();
      if (!url.includes('meesho') || response.status() !== 200) return;
      if (!url.match(/return/i)) return;
      try {
        const ct = response.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const json = await response.json();
        const rows = extractReturnsFromJson(json);
        returns.push(...rows);
      } catch {}
    });

    try {
      await page.goto(`${SUPPLIER_URL}/returns`, { waitUntil: 'networkidle2', timeout: 35000 });
      await page.waitForTimeout(4000);
      if (returns.length === 0) {
        const domReturns = await extractReturnsFromDOM(page);
        returns.push(...domReturns);
      }
    } finally {
      await page.close().catch(() => {});
    }
    return returns;
  }

  // ─── PRODUCTS ────────────────────────────────────────────────────────────

  async scrapeProducts() {
    await this._ensureSession();
    const products = [];
    const page = await this._newPage(this.storedCookies);

    page.on('response', async (response) => {
      const url = response.url();
      if (!url.includes('meesho') || response.status() !== 200) return;
      if (!url.match(/catalog|product|listing/i)) return;
      try {
        const ct = response.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const json = await response.json();
        const rows = extractProductsFromJson(json);
        products.push(...rows);
      } catch {}
    });

    try {
      await page.goto(`${SUPPLIER_URL}/catalog/products`, { waitUntil: 'networkidle2', timeout: 35000 });
      await page.waitForTimeout(4000);
      if (products.length === 0) {
        const domProducts = await extractProductsFromDOM(page);
        products.push(...domProducts);
      }
    } finally {
      await page.close().catch(() => {});
    }
    return products;
  }

  // ─── PAYMENTS ────────────────────────────────────────────────────────────

  async scrapePayments() {
    await this._ensureSession();
    const payments = [];
    const page = await this._newPage(this.storedCookies);

    page.on('response', async (response) => {
      const url = response.url();
      if (!url.includes('meesho') || response.status() !== 200) return;
      if (!url.match(/payment|payout|remittance/i)) return;
      try {
        const ct = response.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const json = await response.json();
        const rows = extractPaymentsFromJson(json);
        payments.push(...rows);
      } catch {}
    });

    try {
      await page.goto(`${SUPPLIER_URL}/payments`, { waitUntil: 'networkidle2', timeout: 35000 });
      await page.waitForTimeout(4000);
      if (payments.length === 0) {
        const domPayments = await extractPaymentsFromDOM(page);
        payments.push(...domPayments);
      }
    } finally {
      await page.close().catch(() => {});
    }
    return payments;
  }

  // ─── INVENTORY ───────────────────────────────────────────────────────────

  async scrapeInventory() {
    await this._ensureSession();
    const catalogs = [];
    const page = await this._newPage(this.storedCookies);

    page.on('response', async (response) => {
      const url = response.url();
      if (!url.includes('meesho') || response.status() !== 200) return;
      if (!url.match(/inventory|catalog|listing/i)) return;
      try {
        const ct = response.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const json = await response.json();
        const rows = this._extractInventoryFromJson(json);
        catalogs.push(...rows);
      } catch {}
    });

    try {
      await page.goto(`${SUPPLIER_URL}/inventory`, { waitUntil: 'networkidle2', timeout: 35000 });
      await sleep(4000);
      if (catalogs.length === 0) {
        const rows = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('[data-testid*="catalog"], [class*="catalog" i]').forEach(el => {
            const name = el.querySelector('[class*="name" i], h3, h4')?.textContent?.trim();
            const id = el.querySelector('[class*="catalogId" i], [class*="catalog-id" i]')?.textContent?.trim();
            if (name) results.push({ name, catalogId: id || '', skus: [] });
          });
          return results;
        });
        catalogs.push(...rows);
      }
    } finally {
      await page.close().catch(() => {});
    }
    return catalogs;
  }

  _extractInventoryFromJson(json) {
    const results = [];
    const tryExtract = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) { obj.forEach(tryExtract); return; }
      if (obj.catalog_id || obj.catalogId) {
        results.push({
          catalogId: String(obj.catalog_id || obj.catalogId || ''),
          name: obj.name || obj.catalog_name || '',
          category: obj.category || '',
          skus: (obj.skus || obj.products || []).map(s => ({
            sku: s.sku || s.sku_id || '',
            name: s.name || s.product_name || '',
            variation: s.variation || s.size || 'Free Size',
            stock: s.stock || s.inventory || 0,
            price: s.price || s.selling_price || 0,
            styleId: s.style_id || '',
          })),
        });
        return;
      }
      Object.values(obj).forEach(v => { if (typeof v === 'object') tryExtract(v); });
    };
    tryExtract(json);
    return results;
  }

  // ─── ADVERTISEMENTS ───────────────────────────────────────────────────────

  async scrapeAds() {
    await this._ensureSession();
    const ads = [];
    const page = await this._newPage(this.storedCookies);

    page.on('response', async (response) => {
      const url = response.url();
      if (!url.includes('meesho') || response.status() !== 200) return;
      if (!url.match(/ad|campaign|advertisement/i)) return;
      try {
        const ct = response.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const json = await response.json();
        const rows = this._extractAdsFromJson(json);
        ads.push(...rows);
      } catch {}
    });

    try {
      await page.goto(`${SUPPLIER_URL}/advertisement`, { waitUntil: 'networkidle2', timeout: 35000 });
      await sleep(4000);
      if (ads.length === 0) {
        const rows = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('[data-testid*="campaign"], [class*="campaign" i]').forEach(el => {
            const name = el.querySelector('[class*="name" i]')?.textContent?.trim();
            if (name) results.push({ name, status: 'LIVE', budget: 0, budgetUtilized: 0 });
          });
          return results;
        });
        ads.push(...rows);
      }
    } finally {
      await page.close().catch(() => {});
    }
    return ads;
  }

  _extractAdsFromJson(json) {
    const results = [];
    const tryExtract = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) { obj.forEach(tryExtract); return; }
      if (obj.campaign_id || obj.campaignId || obj.ad_id) {
        results.push({
          campaignId: String(obj.campaign_id || obj.campaignId || obj.ad_id || ''),
          name: obj.name || obj.campaign_name || '',
          status: obj.status || 'LIVE',
          budget: obj.budget || obj.daily_budget || 0,
          budgetUtilized: obj.budget_utilized || obj.spend || 0,
          impressions: obj.impressions || 0,
          clicks: obj.clicks || 0,
          orders: obj.orders || obj.order_count || 0,
          revenue: obj.revenue || 0,
          roi: obj.roi || obj.roas || 0,
          startDate: obj.start_date || obj.startDate || '',
          endDate: obj.end_date || obj.endDate || '',
        });
        return;
      }
      Object.values(obj).forEach(v => { if (typeof v === 'object') tryExtract(v); });
    };
    tryExtract(json);
    return results;
  }

  // ─── RETURN OTP ──────────────────────────────────────────────────────────

  async scrapeReturnOTP(returnId) {
    await this._ensureSession();
    const page = await this._newPage(this.storedCookies);
    try {
      await page.goto(`${SUPPLIER_URL}/returns?returnId=${returnId}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);
      const otp = await page.evaluate(() => {
        const selectors = [
          '[data-testid*="otp"]',
          '[class*="otp" i]',
          'input[readonly][maxlength="6"]',
          'span[class*="OTP" i]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) return el.innerText?.trim() || el.value?.trim() || null;
        }
        // Search text containing 6-digit OTP pattern
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const m = node.textContent.match(/\b(\d{6})\b/);
          if (m && node.parentElement?.className?.toLowerCase().includes('otp')) return m[1];
        }
        return null;
      });
      return otp;
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── ACTIONS ─────────────────────────────────────────────────────────────

  async acceptOrder(subOrderId) {
    await this._ensureSession();
    const page = await this._newPage(this.storedCookies);
    try {
      await page.goto(`${SUPPLIER_URL}/orders/new_orders`, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Find row with this sub-order ID and click Accept
      const clicked = await page.evaluate((sid) => {
        const rows = document.querySelectorAll('tr, [class*="row" i], [class*="order-item" i]');
        for (const row of rows) {
          if (row.textContent.includes(sid)) {
            const btn = row.querySelector('button');
            const btns = row.querySelectorAll('button');
            for (const b of btns) {
              if (b.textContent.trim().toLowerCase().includes('accept')) {
                b.click();
                return true;
              }
            }
          }
        }
        return false;
      }, subOrderId);

      await page.waitForTimeout(2000);
      return clicked;
    } finally {
      await page.close().catch(() => {});
    }
  }

  async cancelOrder(subOrderId, reason = 'Seller cancelled') {
    await this._ensureSession();
    const page = await this._newPage(this.storedCookies);
    try {
      await page.goto(`${SUPPLIER_URL}/orders/new_orders`, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);

      const clicked = await page.evaluate((sid, rsn) => {
        const rows = document.querySelectorAll('tr, [class*="row" i], [class*="order-item" i]');
        for (const row of rows) {
          if (row.textContent.includes(sid)) {
            const btns = row.querySelectorAll('button');
            for (const b of btns) {
              if (b.textContent.trim().toLowerCase().includes('cancel')) {
                b.click();
                return true;
              }
            }
          }
        }
        return false;
      }, subOrderId, reason);

      await page.waitForTimeout(2000);
      // Handle cancel reason modal if it appeared
      await page.evaluate((rsn) => {
        const modal = document.querySelector('[role="dialog"], [class*="modal" i], [class*="dialog" i]');
        if (modal) {
          const sel = modal.querySelector('select');
          if (sel) sel.value = rsn;
          const confirmBtn = Array.from(modal.querySelectorAll('button')).find(b =>
            b.textContent.trim().toLowerCase().includes('confirm') || b.textContent.trim().toLowerCase().includes('cancel order')
          );
          if (confirmBtn) confirmBtn.click();
        }
      }, reason);

      await page.waitForTimeout(1500);
      return clicked;
    } finally {
      await page.close().catch(() => {});
    }
  }

  async downloadLabel(subOrderId) {
    await this._ensureSession();
    const page = await this._newPage(this.storedCookies);
    let labelHtml = null;

    page.on('response', async (response) => {
      const url = response.url();
      if (!url.match(/label|manifest|shipping/i)) return;
      try {
        const ct = response.headers()['content-type'] || '';
        if (ct.includes('html') || ct.includes('pdf')) {
          labelHtml = await response.text();
        }
      } catch {}
    });

    try {
      await page.goto(`${SUPPLIER_URL}/orders/ready_to_dispatch`, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);

      await page.evaluate((sid) => {
        const rows = document.querySelectorAll('tr, [class*="row" i], [class*="order-item" i]');
        for (const row of rows) {
          if (row.textContent.includes(sid)) {
            const btns = row.querySelectorAll('button, a');
            for (const b of btns) {
              const txt = b.textContent.trim().toLowerCase();
              if (txt.includes('label') || txt.includes('download')) {
                b.click();
                return true;
              }
            }
          }
        }
        return false;
      }, subOrderId);

      await page.waitForTimeout(3000);

      // If no intercepted label, try to get page content of any opened label page
      if (!labelHtml) {
        const pages = await this.browser.pages();
        const labelPage = pages.find(p => p.url().match(/label|manifest|shipping/i));
        if (labelPage) {
          labelHtml = await labelPage.content();
          await labelPage.close().catch(() => {});
        }
      }

      return labelHtml;
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── PROFILE ─────────────────────────────────────────────────────────────

  async scrapeProfile() {
    await this._ensureSession();
    const page = await this._newPage(this.storedCookies);
    try {
      await page.goto(`${SUPPLIER_URL}/profile`, { waitUntil: 'networkidle2', timeout: 25000 });
      await page.waitForTimeout(2000);
      return await page.evaluate(() => {
        const name = document.querySelector('[class*="shop-name" i], [class*="shopName" i], h1, h2')?.innerText?.trim() || '';
        const img = document.querySelector('[class*="profile-pic" i] img, [class*="avatar" i] img')?.src || '';
        return { shopName: name, profilePicture: img };
      });
    } catch {
      return {};
    } finally {
      await page.close().catch(() => {});
    }
  }

  getCookies() {
    return this.storedCookies;
  }
}

// ─── JSON EXTRACTORS ───────────────────────────────────────────────────────

function extractOrdersFromJson(json, tab) {
  const results = [];
  const statusMap = {
    new_orders: 'Pending',
    ready_to_dispatch: 'Ready to Ship',
    on_hold: 'On Hold',
    shipped: 'Shipped',
    cancelled: 'Cancelled',
  };
  const defaultStatus = statusMap[tab] || 'Pending';

  const walk = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }

    // Look for order-shaped objects
    if (obj.sub_order_id || obj.subOrderId || obj.order_id) {
      const o = normalizeOrder(obj, defaultStatus);
      if (o) results.push(o);
      return;
    }
    Object.values(obj).forEach(walk);
  };
  walk(json);
  return results;
}

function normalizeOrder(raw, defaultStatus) {
  const orderId = raw.order_id || raw.orderId || raw.id || '';
  const subOrderId = raw.sub_order_id || raw.subOrderId || `${orderId}_1`;
  if (!orderId && !subOrderId) return null;

  return {
    orderId: String(orderId),
    subOrderId: String(subOrderId),
    productName: raw.product_name || raw.productName || raw.name || raw.catalog_name || 'Product',
    productImage: raw.product_image || raw.productImage || raw.image_url || raw.thumbnail || '',
    sku: raw.sku || raw.sku_id || raw.skuId || '',
    variant: raw.size || raw.variant || raw.color || 'Free Size',
    quantity: Number(raw.quantity || raw.qty || 1),
    buyerName: raw.buyer_name || raw.buyerName || raw.customer_name || 'Customer',
    buyerAddress: raw.buyer_address || raw.buyerAddress || raw.shipping_address || '',
    buyerPhone: raw.buyer_phone || raw.buyerPhone || '',
    price: parseFloat(raw.price || raw.amount || raw.total_price || 0),
    paymentMode: (raw.payment_mode || raw.paymentMode || raw.payment_type || 'Prepaid').includes('COD') ? 'COD' : 'Prepaid',
    status: raw.status || defaultStatus,
    shipByDate: raw.ship_by_date || raw.shipByDate || raw.dispatch_date || null,
    orderDate: raw.order_date || raw.orderDate || raw.created_at || new Date().toISOString(),
    isAd: !!(raw.is_ad || raw.isAd || raw.ad_order),
    labelStatus: raw.label_status || 'none',
  };
}

function extractReturnsFromJson(json) {
  const results = [];
  const walk = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.return_id || obj.returnId) {
      results.push(normalizeReturn(obj));
      return;
    }
    Object.values(obj).forEach(walk);
  };
  walk(json);
  return results;
}

function normalizeReturn(raw) {
  return {
    returnId: String(raw.return_id || raw.returnId || raw.id || ''),
    orderId: String(raw.order_id || raw.orderId || ''),
    subOrderId: String(raw.sub_order_id || raw.subOrderId || ''),
    productName: raw.product_name || raw.productName || raw.name || 'Product',
    productImage: raw.product_image || raw.productImage || '',
    returnReason: raw.return_reason || raw.returnReason || raw.reason || 'Customer request',
    status: raw.status || 'Initiated',
    buyerName: raw.buyer_name || raw.buyerName || '',
    otp: raw.otp || raw.pickup_otp || raw.pickupOtp || null,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

function extractProductsFromJson(json) {
  const results = [];
  const walk = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.catalog_id || obj.catalogId || (obj.sku && obj.name)) {
      results.push({
        catalogId: String(obj.catalog_id || obj.catalogId || obj.id || ''),
        name: obj.name || obj.catalog_name || obj.catalogName || 'Product',
        sku: obj.sku || obj.sku_id || '',
        category: obj.category || obj.sub_category || '',
        price: parseFloat(obj.price || obj.selling_price || 0),
        mrp: parseFloat(obj.mrp || obj.market_price || 0),
        stock: parseInt(obj.stock || obj.inventory || 0),
        status: obj.status || 'active',
        images: (obj.images || obj.product_images || []).map(i => (typeof i === 'string' ? i : i.url || i.src || '')),
      });
      return;
    }
    Object.values(obj).forEach(walk);
  };
  walk(json);
  return results;
}

function extractPaymentsFromJson(json) {
  const results = [];
  const walk = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj.payment_id || obj.paymentId || obj.transaction_id) {
      results.push({
        paymentId: String(obj.payment_id || obj.paymentId || obj.transaction_id || ''),
        amount: parseFloat(obj.amount || obj.payout_amount || 0),
        status: obj.status || 'Pending',
        mode: obj.mode || obj.payment_mode || 'Bank Transfer',
        date: obj.payment_date || obj.date || obj.created_at || new Date().toISOString(),
        description: obj.description || obj.remarks || '',
        utr: obj.utr || obj.utr_number || '',
      });
      return;
    }
    Object.values(obj).forEach(walk);
  };
  walk(json);
  return results;
}

// ─── DOM FALLBACKS ─────────────────────────────────────────────────────────

async function extractOrdersFromDOM(page, tab) {
  const statusMap = { new_orders: 'Pending', ready_to_dispatch: 'Ready to Ship', on_hold: 'On Hold', shipped: 'Shipped', cancelled: 'Cancelled' };
  const status = statusMap[tab] || 'Pending';
  return page.evaluate((status) => {
    const orders = [];
    const rows = document.querySelectorAll('tr, [class*="OrderRow"], [class*="order-row" i]');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td, [class*="cell" i]');
      if (cells.length < 3) return;
      const img = row.querySelector('img');
      const texts = Array.from(cells).map(c => c.innerText?.trim() || '');
      const orderId = texts.find(t => /^\d{10,}/.test(t)) || `ORD${Date.now()}`;
      orders.push({
        orderId,
        subOrderId: orderId + '_1',
        productName: texts[1] || texts[0] || 'Product',
        productImage: img?.src || '',
        sku: texts.find(t => t.startsWith('SKU')) || '',
        variant: 'Free Size',
        quantity: 1,
        buyerName: texts[2] || 'Customer',
        buyerAddress: '',
        price: parseFloat(texts.find(t => /^\d+(\.\d+)?$/.test(t)) || '0'),
        paymentMode: texts.some(t => t.includes('COD')) ? 'COD' : 'Prepaid',
        status,
        shipByDate: null,
        orderDate: new Date().toISOString(),
        isAd: false,
        labelStatus: 'none',
      });
    });
    return orders;
  }, status);
}

async function extractReturnsFromDOM(page) {
  return page.evaluate(() => {
    const returns = [];
    const rows = document.querySelectorAll('tr, [class*="return" i]');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 2) return;
      const texts = Array.from(cells).map(c => c.innerText?.trim() || '');
      const id = texts.find(t => /^\d{5,}/.test(t));
      if (!id) return;
      returns.push({
        returnId: id,
        orderId: texts[1] || '',
        productName: texts[2] || 'Product',
        productImage: row.querySelector('img')?.src || '',
        returnReason: texts[3] || 'Customer request',
        status: texts[4] || 'Initiated',
        buyerName: texts[5] || '',
        otp: null,
      });
    });
    return returns;
  });
}

async function extractProductsFromDOM(page) {
  return page.evaluate(() => {
    const products = [];
    const rows = document.querySelectorAll('tr, [class*="product-row" i], [class*="catalog-row" i]');
    rows.forEach(row => {
      const img = row.querySelector('img');
      const cells = row.querySelectorAll('td, [class*="cell" i]');
      if (cells.length < 2) return;
      const texts = Array.from(cells).map(c => c.innerText?.trim() || '');
      products.push({
        catalogId: texts.find(t => /^\d{5,}/.test(t)) || '',
        name: texts[1] || 'Product',
        sku: texts.find(t => t.startsWith('SKU')) || '',
        price: parseFloat(texts.find(t => /^\d+(\.\d+)?$/.test(t)) || '0'),
        mrp: 0,
        stock: 0,
        status: 'active',
        images: img ? [img.src] : [],
      });
    });
    return products;
  });
}

async function extractPaymentsFromDOM(page) {
  return page.evaluate(() => {
    const payments = [];
    const rows = document.querySelectorAll('tr, [class*="payment-row" i]');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 2) return;
      const texts = Array.from(cells).map(c => c.innerText?.trim() || '');
      const amount = texts.find(t => /^\d/.test(t));
      if (!amount) return;
      payments.push({
        paymentId: `PAY${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        amount: parseFloat(amount.replace(/[^0-9.]/g, '')),
        status: texts.find(t => /paid|pending|process/i.test(t)) || 'Pending',
        mode: 'Bank Transfer',
        date: new Date().toISOString(),
        description: '',
        utr: '',
      });
    });
    return payments;
  });
}

module.exports = { MeeshoScraper };
