'use strict';
/**
 * MeeshoHub Sync — Content Script
 * Runs on supplier.meesho.com — scrapes data from the page and XHR responses,
 * then sends it to the MeeshoHub backend API.
 */

let capturedData = {
  orders: [],
  returns: [],
  products: [],
  payments: [],
};

// ── Intercept XHR/fetch responses ──────────────────────────────────────────

const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  try {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const clone = response.clone();
    const text = await clone.text();
    const json = JSON.parse(text);
    processApiResponse(url, json);
  } catch {}
  return response;
};

const origXHROpen = XMLHttpRequest.prototype.open;
const origXHRSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function(method, url) {
  this._url = url;
  return origXHROpen.apply(this, arguments);
};
XMLHttpRequest.prototype.send = function() {
  this.addEventListener('load', function() {
    try {
      const json = JSON.parse(this.responseText);
      processApiResponse(this._url || '', json);
    } catch {}
  });
  return origXHRSend.apply(this, arguments);
};

function processApiResponse(url, json) {
  if (!url || !json) return;
  const u = url.toLowerCase();

  // Orders
  if (u.includes('order') && !u.includes('return')) {
    const orders = extractArray(json, isOrderItem);
    if (orders.length) {
      capturedData.orders.push(...orders.map(normalizeOrder));
      capturedData.orders = dedup(capturedData.orders, 'orderId');
    }
  }
  // Returns
  if (u.includes('return') || u.includes('rto')) {
    const returns = extractArray(json, isReturnItem);
    if (returns.length) {
      capturedData.returns.push(...returns.map(normalizeReturn));
      capturedData.returns = dedup(capturedData.returns, 'returnId');
    }
  }
  // Products / Inventory / Catalog
  if (u.includes('catalog') || u.includes('product') || u.includes('inventory')) {
    const products = extractArray(json, isProductItem);
    if (products.length) {
      capturedData.products.push(...products.map(normalizeProduct));
      capturedData.products = dedup(capturedData.products, 'catalogId');
    }
  }
  // Payments
  if (u.includes('payment') || u.includes('transaction') || u.includes('settlement')) {
    const payments = extractArray(json, isPaymentItem);
    if (payments.length) {
      capturedData.payments.push(...payments.map(normalizePayment));
      capturedData.payments = dedup(capturedData.payments, 'paymentId');
    }
  }
}

// ── Shape detectors ────────────────────────────────────────────────────────

function isOrderItem(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj) &&
    (obj.sub_order_number || obj.order_id || obj.orderId || obj.subOrderId) &&
    (obj.product_name || obj.productName || obj.name);
}

function isReturnItem(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj) &&
    (obj.return_id || obj.returnId) &&
    (obj.product_name || obj.productName || obj.name);
}

function isProductItem(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj) &&
    (obj.catalog_id || obj.catalogId) &&
    (obj.catalog_name || obj.name || obj.product_name);
}

function isPaymentItem(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj) &&
    (obj.payment_id || obj.paymentId || obj.transaction_id || obj.transactionId) &&
    (obj.amount !== undefined || obj.net_amount !== undefined);
}

// ── Deep-collect arrays from JSON ──────────────────────────────────────────

function extractArray(obj, predicate, results = []) {
  if (!obj || typeof obj !== 'object') return results;
  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (predicate(item)) results.push(item);
      else extractArray(item, predicate, results);
    });
  } else {
    if (predicate(obj)) results.push(obj);
    else Object.values(obj).forEach(v => extractArray(v, predicate, results));
  }
  return results;
}

function dedup(arr, key) {
  const seen = new Set();
  return arr.filter(item => {
    const k = item[key];
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ── Normalizers ────────────────────────────────────────────────────────────

function normalizeOrder(raw) {
  const status = (() => {
    const s = String(raw.status || raw.order_status || '').toLowerCase();
    if (s.includes('hold')) return 'On Hold';
    if (s.includes('pending') || s.includes('new') || s.includes('confirm')) return 'Pending';
    if (s.includes('ready') || s.includes('dispatch')) return 'Ready to Ship';
    if (s.includes('ship') || s.includes('transit')) return 'Shipped';
    if (s.includes('deliver')) return 'Delivered';
    if (s.includes('cancel')) return 'Cancelled';
    return 'Pending';
  })();
  return {
    orderId: String(raw.order_id || raw.orderId || raw.sub_order_number || ''),
    subOrderId: String(raw.sub_order_number || raw.subOrderId || raw.sub_order_id || ''),
    productName: raw.product_name || raw.productName || raw.name || '',
    sku: raw.sku || raw.sku_id || '',
    variant: raw.variation || raw.variant || raw.size || 'Free Size',
    price: Number(raw.price || raw.selling_price || raw.amount || 0),
    quantity: Number(raw.quantity || raw.qty || 1),
    paymentMode: String(raw.payment_mode || 'Prepaid').toUpperCase().includes('COD') ? 'COD' : 'Prepaid',
    status,
    buyerName: raw.customer_name || raw.buyer_name || '',
    buyerAddress: [raw.city, raw.state].filter(Boolean).join(', ') || raw.address || '',
    orderDate: raw.order_date || raw.created_at || new Date().toISOString(),
    shipByDate: raw.ship_by_date || raw.expected_dispatch_date || null,
    productImage: raw.product_image || raw.image_url || '',
    isAd: !!(raw.is_ad || raw.ad_order),
  };
}

function normalizeReturn(raw) {
  return {
    returnId: String(raw.return_id || raw.returnId || raw.id || ''),
    orderId: String(raw.order_id || raw.orderId || ''),
    productName: raw.product_name || raw.productName || raw.name || '',
    returnReason: raw.reason || raw.return_reason || '',
    status: raw.status || raw.return_status || 'Initiated',
    buyerName: raw.customer_name || raw.buyer_name || '',
    otp: raw.otp || raw.pickup_otp || null,
    productImage: raw.product_image || raw.image_url || '',
    returnDate: raw.return_date || raw.created_at || new Date().toISOString(),
  };
}

function normalizeProduct(raw) {
  return {
    catalogId: String(raw.catalog_id || raw.catalogId || raw.id || ''),
    name: raw.catalog_name || raw.name || raw.product_name || '',
    sku: raw.sku || raw.sku_id || '',
    price: Number(raw.price || raw.selling_price || 0),
    mrp: Number(raw.mrp || raw.original_price || 0),
    stock: Number(raw.stock || raw.inventory || raw.quantity || 0),
    category: raw.category || '',
    imageUrl: raw.image_url || raw.product_image || '',
  };
}

function normalizePayment(raw) {
  return {
    paymentId: String(raw.payment_id || raw.paymentId || raw.transaction_id || raw.id || ''),
    transactionId: String(raw.transaction_id || raw.transactionId || ''),
    amount: Math.abs(Number(raw.amount || raw.net_amount || 0)),
    type: Number(raw.amount || 0) >= 0 ? 'credit' : 'debit',
    description: raw.description || raw.details || 'Order settlement',
    date: raw.payment_date || raw.date || raw.created_at || new Date().toISOString(),
    status: raw.status || 'completed',
    utr: raw.utr || raw.neft_id || '',
  };
}

// ── DOM scraping fallback ──────────────────────────────────────────────────

function scrapeOrdersFromDOM() {
  const orders = [];
  const rows = document.querySelectorAll('[class*="order-row"], [class*="OrderRow"], [data-order-id]');
  rows.forEach(row => {
    const orderId = row.dataset.orderId || row.querySelector('[class*="order-id"]')?.textContent?.trim();
    const productName = row.querySelector('[class*="product-name"], [class*="ProductName"]')?.textContent?.trim();
    const price = row.querySelector('[class*="price"], [class*="Price"]')?.textContent?.replace(/[^0-9.]/g, '');
    const status = row.querySelector('[class*="status"], [class*="Status"]')?.textContent?.trim();
    if (orderId && productName) {
      orders.push(normalizeOrder({ order_id: orderId, product_name: productName, price, status }));
    }
  });
  return orders;
}

// ── Send data to MeeshoHub API ─────────────────────────────────────────────

async function sendToMeeshoHub(apiUrl, token, accountId, data) {
  const stats = { orders: 0, returns: 0, products: 0, payments: 0 };
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const base = apiUrl.replace(/\/$/, '');

  const send = async (endpoint, items, key) => {
    if (!items.length) return;
    try {
      const res = await fetch(`${base}/api/v1/${endpoint}/bulk`, {
        method: 'POST', headers,
        body: JSON.stringify({ accountId, items }),
      });
      if (res.ok) {
        const d = await res.json();
        stats[key] = d.count || items.length;
      }
    } catch {}
  };

  await Promise.all([
    send('orders', data.orders, 'orders'),
    send('returns', data.returns, 'returns'),
    send('products', data.products, 'products'),
    send('payments', data.payments, 'payments'),
  ]);

  return stats;
}

// ── Message listener ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'scrapeCurrent' || msg.action === 'scrapeAll') {
    const { token, apiUrl, accountId } = msg;

    // Also try DOM scraping as fallback
    const domOrders = scrapeOrdersFromDOM();
    if (domOrders.length) {
      capturedData.orders.push(...domOrders);
      capturedData.orders = dedup(capturedData.orders, 'orderId');
    }

    if (!capturedData.orders.length && !capturedData.returns.length &&
        !capturedData.products.length && !capturedData.payments.length) {
      // Navigate to trigger data load
      sendResponse({ error: 'No data captured yet. Please browse to the Orders, Returns, Products, and Payments pages on supplier.meesho.com first, then sync.' });
      return true;
    }

    sendToMeeshoHub(apiUrl, token, accountId, capturedData)
      .then(stats => {
        // Clear after successful send
        capturedData = { orders: [], returns: [], products: [], payments: [] };
        sendResponse({ stats });
      })
      .catch(err => sendResponse({ error: err.message }));

    return true; // async response
  }
});

// Notify that content script is ready
console.log('[MeeshoHub] Content script loaded on', window.location.href);
