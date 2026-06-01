'use strict';
/**
 * MeeshoScraper — Puppeteer browser automation for supplier.meesho.com
 *
 * - Launches one headless Chrome per Meesho account (pooled, idle-closed after 10 min)
 * - Intercepts all XHR/fetch responses → extracts structured JSON
 * - Falls back to DOM scraping if network interception yields nothing
 * - Session cookies stored in DB (encrypted) to avoid re-login on every sync
 * - All public methods throw on unrecoverable errors; callers handle fallback
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
  '--ignore-certificate-errors',
  '--window-size=1366,768',
];

// Browser pool: one browser instance per accountId
const browserPool = new Map(); // accountId → { browser, lastUsed }

// Close browsers idle for > 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of browserPool) {
    if (now - entry.lastUsed > 10 * 60 * 1000) {
      entry.browser.close().catch(() => {});
      browserPool.delete(id);
    }
  }
}, 60 * 1000);

const getBrowser = async (accountId) => {
  const entry = browserPool.get(accountId);
  if (entry) {
    try {
      await entry.browser.pages(); // throws if browser is dead
      entry.lastUsed = Date.now();
      return entry.browser;
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── JSON extraction helpers ──────────────────────────────────────────────────

/**
 * Walk any JSON object/array and collect items matching a shape predicate.
 */
function deepCollect(obj, predicate, results = []) {
  if (!obj || typeof obj !== 'object') return results;
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (predicate(item)) results.push(item);
      else deepCollect(item, predicate, results);
    });
  } else {
    if (predicate(obj)) results.push(obj);
    else Object.values(obj).forEach(v => deepCollect(v, predicate, results));
  }
  return results;
}

function normalizeOrder(raw) {
  const id = raw.id || raw.order_id || raw.orderId || raw.sub_order_number || '';
  const subId = raw.sub_order_id || raw.subOrderId || raw.sub_order_number || `${id}_1`;
  const status = raw.status || raw.order_status || '';
  const meeshoStatus = (() => {
    const s = String(status).toLowerCase();
    if (s.includes('hold')) return 'On Hold';
    if (s.includes('pending') || s.includes('new') || s.includes('confirm')) return 'Pending';
    if (s.includes('ready') || s.includes('dispatch') || s.includes('label')) return 'Ready to Ship';
    if (s.includes('ship') || s.includes('transit')) return 'Shipped';
    if (s.includes('deliver')) return 'Delivered';
    if (s.includes('cancel')) return 'Cancelled';
    return status || 'Pending';
  })();

  return {
    orderId: String(id),
    subOrderId: String(subId),
    productName: raw.product_name || raw.productName || raw.name || '',
    sku: raw.sku || raw.sku_id || raw.seller_sku || '',
    variant: raw.variation || raw.variant || raw.size || 'Free Size',
    price: Number(raw.price || raw.selling_price || raw.amount || 0),
    quantity: Number(raw.quantity || raw.qty || 1),
    paymentMode: (raw.payment_mode || raw.paymentMode || 'Prepaid').toUpperCase().includes('COD') ? 'COD' : 'Prepaid',
    status: meeshoStatus,
    buyerName: raw.customer_name || raw.buyerName || raw.buyer_name || '',
    buyerAddress: [raw.city, raw.state].filter(Boolean).join(', ') || raw.address || '',
    orderDate: raw.order_date || raw.orderDate || raw.created_at || new Date().toISOString(),
    shipByDate: raw.ship_by_date || raw.shipByDate || raw.expected_dispatch_date || null,
    labelStatus: raw.label_status || raw.labelStatus || 'none',
    isAd: !!(raw.is_ad || raw.isAd || raw.ad_order),
    productImage: raw.product_image || raw.productImage || raw.image_url || '',
  };
}

function normalizeReturn(raw) {
  return {
    returnId: String(raw.return_id || raw.returnId || raw.id || ''),
    orderId: String(raw.order_id || raw.orderId || ''),
    productName: raw.product_name || raw.productName || raw.name || '',
    returnReason: raw.reason || raw.return_reason || raw.returnReason || '',
    status: raw.status || raw.return_status || 'Initiated',
    buyerName: raw.customer_name || raw.buyerName || raw.buyer_name || '',
    otp: raw.otp || raw.pickup_otp || null,
    otpGeneratedAt: raw.otp_generated_at || null,
    productImage: raw.product_image || raw.image_url || '',
    returnDate: raw.return_date || raw.returnDate || raw.created_at || new Date().toISOString(),
  };
}

function normalizeProduct(raw) {
  return {
    catalogId: String(raw.catalog_id || raw.catalogId || raw.id || ''),
    name: raw.name || raw.catalog_name || raw.product_name || '',
    sku: raw.sku || raw.sku_id || '',
    price: Number(raw.price || raw.selling_price || 0),
    mrp: Number(raw.mrp || raw.original_price || 0),
    stock: Number(raw.stock || raw.inventory || raw.quantity || 0),
    category: raw.category || '',
    status: raw.status || 'active',
    imageUrl: raw.image_url || raw.product_image || '',
  };
}

function normalizePayment(raw) {
  return {
    paymentId: String(raw.payment_id || raw.paymentId || raw.transaction_id || raw.id || ''),
    transactionId: String(raw.transaction_id || raw.transactionId || ''),
    amount: Number(raw.amount || raw.net_amount || 0),
    type: Number(raw.amount || 0) >= 0 ? 'credit' : 'debit',
    description: raw.description || raw.details || 'Order settlement',
    date: raw.payment_date || raw.date || raw.created_at || new Date().toISOString(),
    status: raw.status || 'completed',
    utr: raw.utr || raw.neft_id || '',
  };
}

// ─── MeeshoScraper class ──────────────────────────────────────────────────────

class MeeshoScraper {
  constructor({ accountId, phone, password, sessionCookies = null }) {
    this.accountId = accountId;
    this.phone = phone;
    this.password = password;
    this.storedCookies = sessionCookies;
  }

  async _newPage(cookies = null) {
    const browser = await getBrowser(this.accountId);
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    if (cookies && cookies.length) {
      await page.setCookie(...cookies).catch(() => {});
    }
    return page;
  }

  getCookies() {
    return this.storedCookies;
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  async login() {
    const page = await this._newPage();
    try {
      console.log(`[Scraper:${this.accountId}] Navigating to login page…`);
      await page.goto(`${SUPPLIER_URL}/login`, { waitUntil: 'networkidle2', timeout: 45000 });
      await sleep(2000);

      // ── Step 1: Enter phone number ──
      const phoneSelectors = [
        'input[type="tel"]',
        'input[name="phone"]',
        'input[placeholder*="phone" i]',
        'input[placeholder*="mobile" i]',
        'input[placeholder*="number" i]',
        'input[placeholder*="10-digit" i]',
      ];
      let phoneInput = null;
      for (const sel of phoneSelectors) {
        phoneInput = await page.$(sel);
        if (phoneInput) { console.log(`[Scraper] Phone input found: ${sel}`); break; }
      }
      if (!phoneInput) {
        // Try to find any visible text input
        phoneInput = await page.evaluateHandle(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.find(i => i.type !== 'password' && !i.hidden && i.offsetParent !== null);
        });
        const el = phoneInput.asElement ? phoneInput.asElement() : null;
        if (!el) throw new Error('No phone input found on Meesho login page');
        phoneInput = el;
      }

      await phoneInput.click({ clickCount: 3 });
      await phoneInput.type(this.phone, { delay: 80 });
      await sleep(500);

      // Click Continue/Next button
      const clicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => /continue|next|proceed|login/i.test(b.textContent));
        if (btn) { btn.click(); return true; }
        const submit = document.querySelector('button[type="submit"]');
        if (submit) { submit.click(); return true; }
        return false;
      });
      if (!clicked) throw new Error('Continue button not found');
      await sleep(2500);

      // ── Step 2: Enter password (if shown) or handle OTP ──
      const passInput = await page.$('input[type="password"]');
      if (passInput) {
        console.log(`[Scraper:${this.accountId}] Password step…`);
        await passInput.click({ clickCount: 3 });
        await passInput.type(this.password, { delay: 80 });
        await sleep(300);

        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => /login|sign.?in|submit/i.test(b.textContent));
          if (btn) btn.click();
          else document.querySelector('button[type="submit"]')?.click();
        });
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
          sleep(15000),
        ]).catch(() => {});
      } else {
        // Might be OTP flow — wait for redirect
        console.log(`[Scraper:${this.accountId}] OTP flow detected — waiting…`);
        await sleep(5000);
      }

      const url = page.url();
      console.log(`[Scraper:${this.accountId}] After login URL: ${url}`);

      if (url.includes('/login') || url.includes('/verify') || url.includes('/otp')) {
        throw new Error('Login failed — invalid credentials or OTP verification required. Please check phone/password.');
      }

      const cookies = await page.cookies();
      this.storedCookies = cookies;
      console.log(`[Scraper:${this.accountId}] Login successful, ${cookies.length} cookies saved`);
      return cookies;
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── SESSION CHECK ────────────────────────────────────────────────────────

  async _ensureSession() {
    // Try existing cookies first
    if (this.storedCookies && this.storedCookies.length > 0) {
      const page = await this._newPage(this.storedCookies);
      try {
        await page.goto(`${SUPPLIER_URL}/orders/new_orders`, {
          waitUntil: 'domcontentloaded', timeout: 20000,
        });
        await sleep(1500);
        const url = page.url();
        if (!url.includes('/login') && !url.includes('/verify')) {
          console.log(`[Scraper:${this.accountId}] Session valid (cookie reuse)`);
          await page.close().catch(() => {});
          return; // session OK
        }
      } catch {}
      await page.close().catch(() => {});
    }
    // Need fresh login
    console.log(`[Scraper:${this.accountId}] Session expired — logging in…`);
    await this.login();
  }

  // ─── COLLECT NETWORK RESPONSES ─────────────────────────────────────────────

  /**
   * Navigate to a URL and collect all JSON responses whose URLs match a pattern.
   * Waits `waitMs` after navigation for XHR calls to complete.
   */
  async _collectNetworkData(url, urlPattern, waitMs = 5000) {
    await this._ensureSession();
    const collected = [];
    const page = await this._newPage(this.storedCookies);

    page.on('response', async (res) => {
      try {
        const resUrl = res.url();
        if (!urlPattern.test(resUrl)) return;
        if (res.status() !== 200) return;
        const ct = res.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const json = await res.json().catch(() => null);
        if (json) collected.push(json);
      } catch {}
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 });
      await sleep(waitMs);
      return { page, collected };
    } catch (err) {
      await page.close().catch(() => {});
      throw err;
    }
  }

  // ─── ORDERS ───────────────────────────────────────────────────────────────

  async scrapeOrders() {
    await this._ensureSession();
    const allOrders = [];
    const tabs = [
      { path: 'new_orders',        status: 'Pending' },
      { path: 'on_hold',           status: 'On Hold' },
      { path: 'ready_to_dispatch', status: 'Ready to Ship' },
      { path: 'shipped',           status: 'Shipped' },
      { path: 'cancelled',         status: 'Cancelled' },
    ];

    for (const tab of tabs) {
      const tabUrl = `${SUPPLIER_URL}/orders/${tab.path}`;
      console.log(`[Scraper:${this.accountId}] Scraping orders tab: ${tab.path}`);
      const collected = [];
      const page = await this._newPage(this.storedCookies);

      page.on('response', async (res) => {
        try {
          const u = res.url();
          if (!/meesho/i.test(u) || res.status() !== 200) return;
          if (!/order|supplier/i.test(u)) return;
          const ct = res.headers()['content-type'] || '';
          if (!ct.includes('json')) return;
          const json = await res.json().catch(() => null);
          if (json) collected.push(json);
        } catch {}
      });

      try {
        await page.goto(tabUrl, { waitUntil: 'networkidle2', timeout: 40000 });
        await sleep(5000);

        // Parse from intercepted XHR
        let orders = [];
        for (const json of collected) {
          const found = deepCollect(json, obj =>
            (obj.order_id || obj.orderId || obj.sub_order_number) && (obj.status || obj.order_status)
          );
          orders.push(...found);
        }

        // DOM fallback if no XHR data
        if (orders.length === 0) {
          console.log(`[Scraper:${this.accountId}] DOM fallback for ${tab.path}`);
          orders = await page.evaluate((defaultStatus) => {
            const rows = [];
            // Try table rows
            document.querySelectorAll('tr[data-testid], tr.order-row, tbody tr').forEach(row => {
              const cells = Array.from(row.querySelectorAll('td'));
              if (cells.length < 3) return;
              const idEl = row.querySelector('[class*="order" i], [class*="sub-order" i]');
              const nameEl = row.querySelector('[class*="product" i], [class*="name" i]');
              rows.push({
                order_id: idEl?.textContent?.trim() || cells[0]?.textContent?.trim() || '',
                product_name: nameEl?.textContent?.trim() || cells[1]?.textContent?.trim() || '',
                status: defaultStatus,
              });
            });
            return rows;
          }, tab.status);
        }

        // Tag with default status for this tab
        const normalized = orders.map(o => ({ ...normalizeOrder(o), status: normalizeOrder(o).status || tab.status }));
        allOrders.push(...normalized.filter(o => o.orderId));
        console.log(`[Scraper:${this.accountId}] Tab ${tab.path}: ${normalized.length} orders`);
      } catch (err) {
        console.error(`[Scraper:${this.accountId}] Error on tab ${tab.path}:`, err.message);
      } finally {
        await page.close().catch(() => {});
      }
    }

    // Save fresh cookies
    const browser = await getBrowser(this.accountId);
    const pages = await browser.pages();
    if (pages.length) {
      this.storedCookies = await pages[0].cookies().catch(() => this.storedCookies);
    }

    console.log(`[Scraper:${this.accountId}] Total orders scraped: ${allOrders.length}`);
    return allOrders;
  }

  // ─── RETURNS ─────────────────────────────────────────────────────────────

  async scrapeReturns() {
    console.log(`[Scraper:${this.accountId}] Scraping returns…`);
    const collected = [];
    const page = await this._newPage(this.storedCookies);

    page.on('response', async (res) => {
      try {
        const u = res.url();
        if (!/meesho/i.test(u) || res.status() !== 200) return;
        if (!/return|rto/i.test(u)) return;
        const ct = res.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const json = await res.json().catch(() => null);
        if (json) collected.push(json);
      } catch {}
    });

    try {
      await page.goto(`${SUPPLIER_URL}/returns`, { waitUntil: 'networkidle2', timeout: 40000 });
      await sleep(5000);

      let returns = [];
      for (const json of collected) {
        const found = deepCollect(json, obj => obj.return_id || obj.returnId);
        returns.push(...found);
      }

      if (returns.length === 0) {
        returns = await page.evaluate(() => {
          const rows = [];
          document.querySelectorAll('[data-testid*="return"], tr').forEach(row => {
            const idEl = row.querySelector('[class*="return-id" i], [class*="returnId" i]');
            const prodEl = row.querySelector('[class*="product" i]');
            if (idEl) {
              rows.push({
                return_id: idEl.textContent.trim(),
                product_name: prodEl?.textContent?.trim() || '',
                status: 'Initiated',
              });
            }
          });
          return rows;
        });
      }

      const normalized = returns.map(normalizeReturn).filter(r => r.returnId);
      console.log(`[Scraper:${this.accountId}] Returns scraped: ${normalized.length}`);
      return normalized;
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── INVENTORY ────────────────────────────────────────────────────────────

  async scrapeInventory() {
    console.log(`[Scraper:${this.accountId}] Scraping inventory…`);
    const collected = [];
    const page = await this._newPage(this.storedCookies);

    page.on('response', async (res) => {
      try {
        const u = res.url();
        if (!/meesho/i.test(u) || res.status() !== 200) return;
        if (!/catalog|inventory|listing|product/i.test(u)) return;
        const ct = res.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const json = await res.json().catch(() => null);
        if (json) collected.push(json);
      } catch {}
    });

    try {
      await page.goto(`${SUPPLIER_URL}/inventory`, { waitUntil: 'networkidle2', timeout: 40000 });
      await sleep(5000);

      let products = [];
      for (const json of collected) {
        const found = deepCollect(json, obj => obj.catalog_id || obj.catalogId || (obj.sku && obj.name));
        products.push(...found);
      }

      if (products.length === 0) {
        products = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('[class*="catalog" i], [data-testid*="catalog"]').forEach(el => {
            const name = el.querySelector('h3,h4,[class*="name" i]')?.textContent?.trim();
            const id = el.querySelector('[class*="catalogId" i],[class*="catalog-id" i]')?.textContent?.trim()?.replace(/\D/g, '');
            if (name || id) results.push({ catalog_id: id || '', name: name || '' });
          });
          return results;
        });
      }

      const normalized = products.map(normalizeProduct).filter(p => p.catalogId || p.name);
      console.log(`[Scraper:${this.accountId}] Inventory scraped: ${normalized.length}`);
      return normalized;
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── PAYMENTS ─────────────────────────────────────────────────────────────

  async scrapePayments() {
    console.log(`[Scraper:${this.accountId}] Scraping payments…`);
    const collected = [];
    const page = await this._newPage(this.storedCookies);

    page.on('response', async (res) => {
      try {
        const u = res.url();
        if (!/meesho/i.test(u) || res.status() !== 200) return;
        if (!/payment|payout|remittance|settlement/i.test(u)) return;
        const ct = res.headers()['content-type'] || '';
        if (!ct.includes('json')) return;
        const json = await res.json().catch(() => null);
        if (json) collected.push(json);
      } catch {}
    });

    try {
      await page.goto(`${SUPPLIER_URL}/payments`, { waitUntil: 'networkidle2', timeout: 40000 });
      await sleep(5000);

      let payments = [];
      for (const json of collected) {
        const found = deepCollect(json, obj =>
          (obj.payment_id || obj.paymentId || obj.transaction_id) && (obj.amount !== undefined)
        );
        payments.push(...found);
      }

      if (payments.length === 0) {
        payments = await page.evaluate(() => {
          const rows = [];
          document.querySelectorAll('tr, [class*="payment-row" i]').forEach(row => {
            const amtEl = row.querySelector('[class*="amount" i]');
            const idEl = row.querySelector('[class*="id" i], [class*="transaction" i]');
            if (amtEl) {
              const amtText = amtEl.textContent.replace(/[^0-9.-]/g, '');
              rows.push({
                payment_id: idEl?.textContent?.trim() || `DOM-${Date.now()}`,
                amount: parseFloat(amtText) || 0,
                description: 'Order settlement',
              });
            }
          });
          return rows;
        });
      }

      const normalized = payments.map(normalizePayment).filter(p => p.paymentId);
      console.log(`[Scraper:${this.accountId}] Payments scraped: ${normalized.length}`);
      return normalized;
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── ACCEPT ORDER ─────────────────────────────────────────────────────────

  async acceptOrder(subOrderId) {
    await this._ensureSession();
    const page = await this._newPage(this.storedCookies);
    try {
      await page.goto(`${SUPPLIER_URL}/orders/new_orders`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);

      const accepted = await page.evaluate((sid) => {
        // Find the row containing this sub-order ID
        const rows = Array.from(document.querySelectorAll('tr, [class*="order-row" i]'));
        for (const row of rows) {
          if (row.textContent.includes(sid)) {
            const acceptBtn = Array.from(row.querySelectorAll('button')).find(b =>
              /accept/i.test(b.textContent)
            );
            if (acceptBtn) { acceptBtn.click(); return true; }
          }
        }
        // Try global Accept button if only one order visible
        const btn = Array.from(document.querySelectorAll('button')).find(b => /accept/i.test(b.textContent));
        if (btn) { btn.click(); return true; }
        return false;
      }, subOrderId);

      if (!accepted) throw new Error(`Accept button not found for sub-order ${subOrderId}`);
      await sleep(2000);
      return true;
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── CANCEL ORDER ─────────────────────────────────────────────────────────

  async cancelOrder(subOrderId, reason = 'Seller cancelled') {
    await this._ensureSession();
    const page = await this._newPage(this.storedCookies);
    try {
      await page.goto(`${SUPPLIER_URL}/orders/new_orders`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);

      await page.evaluate((sid) => {
        const rows = Array.from(document.querySelectorAll('tr, [class*="order-row" i]'));
        for (const row of rows) {
          if (row.textContent.includes(sid)) {
            const btn = Array.from(row.querySelectorAll('button')).find(b => /cancel/i.test(b.textContent));
            if (btn) { btn.click(); return; }
          }
        }
      }, subOrderId);

      await sleep(1500);

      // Handle cancel modal/reason
      await page.evaluate((rsn) => {
        const select = document.querySelector('select[name*="reason" i], select[class*="reason" i]');
        const textarea = document.querySelector('textarea, input[type="text"][placeholder*="reason" i]');
        if (select) select.value = select.options[1]?.value || select.options[0]?.value;
        if (textarea) textarea.value = rsn;
        const confirmBtn = Array.from(document.querySelectorAll('button')).find(b =>
          /confirm|submit|yes|cancel.?order/i.test(b.textContent)
        );
        if (confirmBtn) confirmBtn.click();
      }, reason);

      await sleep(2000);
      return true;
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── DOWNLOAD LABEL ───────────────────────────────────────────────────────

  async downloadLabel(subOrderId) {
    await this._ensureSession();
    let labelHtml = null;
    const page = await this._newPage(this.storedCookies);

    page.on('response', async (res) => {
      try {
        const u = res.url();
        if (!/label|shipping.?slip/i.test(u)) return;
        const ct = res.headers()['content-type'] || '';
        if (ct.includes('html') || ct.includes('pdf')) {
          labelHtml = await res.text().catch(() => null);
        } else if (ct.includes('json')) {
          const json = await res.json().catch(() => null);
          if (json?.label_html || json?.labelHtml) {
            labelHtml = json.label_html || json.labelHtml;
          }
        }
      } catch {}
    });

    try {
      await page.goto(`${SUPPLIER_URL}/orders/ready_to_dispatch`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);

      await page.evaluate((sid) => {
        const rows = Array.from(document.querySelectorAll('tr, [class*="order-row" i]'));
        for (const row of rows) {
          if (row.textContent.includes(sid)) {
            const btn = Array.from(row.querySelectorAll('button')).find(b =>
              /label|print|download/i.test(b.textContent)
            );
            if (btn) { btn.click(); return; }
          }
        }
        // Click first Label button if only one order
        const btn = Array.from(document.querySelectorAll('button')).find(b => /label|print/i.test(b.textContent));
        if (btn) btn.click();
      }, subOrderId);

      await sleep(4000);
      return labelHtml;
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── RETURN OTP ───────────────────────────────────────────────────────────

  async scrapeReturnOTP(returnId) {
    await this._ensureSession();
    const page = await this._newPage(this.storedCookies);
    try {
      await page.goto(`${SUPPLIER_URL}/returns`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);

      const otp = await page.evaluate((rid) => {
        const selectors = [
          '[data-testid*="otp"]',
          '[class*="otp" i]',
          'input[readonly][maxlength="6"]',
          'span[class*="OTP" i]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el?.textContent?.match(/\d{4,6}/)) return el.textContent.trim();
          if (el?.value?.match(/\d{4,6}/)) return el.value.trim();
        }
        // Walk all text for 6-digit code near "OTP"
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (/\botp\b/i.test(node.parentElement?.textContent)) {
            const match = node.textContent.match(/\b\d{6}\b/);
            if (match) return match[0];
          }
        }
        return null;
      }, returnId);

      return otp;
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── PROFILE ──────────────────────────────────────────────────────────────

  async scrapeProfile() {
    await this._ensureSession();
    const page = await this._newPage(this.storedCookies);
    try {
      await page.goto(`${SUPPLIER_URL}/profile`, { waitUntil: 'networkidle2', timeout: 25000 });
      await sleep(2000);
      return await page.evaluate(() => {
        const name = document.querySelector('[class*="shop-name" i],[class*="shopName" i],[class*="supplier-name" i]')?.textContent?.trim()
          || document.querySelector('h1,h2')?.textContent?.trim() || '';
        const pic = document.querySelector('[class*="profile" i] img,[class*="avatar" i] img')?.src || '';
        return { shopName: name, profilePicture: pic };
      });
    } finally {
      await page.close().catch(() => {});
    }
  }

  // ─── CLOSE ────────────────────────────────────────────────────────────────

  async close() {
    const entry = browserPool.get(this.accountId);
    if (entry) {
      await entry.browser.close().catch(() => {});
      browserPool.delete(this.accountId);
    }
  }
}

module.exports = { MeeshoScraper };
