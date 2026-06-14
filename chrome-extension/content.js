'use strict';
/**
 * MeeshoHub Content Script — runs on supplier.meesho.com
 * Intercepts ALL XHR/fetch responses and stores structured data
 * in window.__meeshohubData so background.js can collect it.
 */

if (!window.__meeshohubData) {
  window.__meeshohubData = { orders: [], returns: [], products: [], payments: [] };
}

// ── Intercept fetch ────────────────────────────────────────────────────────
const _origFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await _origFetch.apply(this, args);
  try {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    const clone = response.clone();
    clone.json().then(json => processResponse(url, json)).catch(() => {});
  } catch {}
  return response;
};

// ── Intercept XHR ─────────────────────────────────────────────────────────
const _origOpen = XMLHttpRequest.prototype.open;
const _origSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function(method, url) {
  this._mhUrl = url;
  return _origOpen.apply(this, arguments);
};
XMLHttpRequest.prototype.send = function() {
  this.addEventListener('load', function() {
    try {
      const json = JSON.parse(this.responseText);
      processResponse(this._mhUrl || '', json);
    } catch {}
  });
  return _origSend.apply(this, arguments);
};

// ── Process API response ───────────────────────────────────────────────────
function processResponse(url, json) {
  if (!url || !json || typeof json !== 'object') return;
  const u = url.toLowerCase();

  // Skip non-Meesho or non-data URLs
  if (!u.includes('meesho') && !u.includes('supplier')) return;

  if (u.includes('order') && !u.includes('return')) {
    const items = deepCollect(json, isOrder);
    if (items.length) {
      const normalized = items.map(normalizeOrder).filter(o => o.orderId);
      window.__meeshohubData.orders.push(...normalized);
      window.__meeshohubData.orders = dedup(window.__meeshohubData.orders, 'orderId');
      console.log(`[MeeshoHub] Captured ${normalized.length} orders from ${url}`);
    }
  }

  if (u.includes('return') || u.includes('rto')) {
    const items = deepCollect(json, isReturn);
    if (items.length) {
      const normalized = items.map(normalizeReturn).filter(r => r.returnId);
      window.__meeshohubData.returns.push(...normalized);
      window.__meeshohubData.returns = dedup(window.__meeshohubData.returns, 'returnId');
      console.log(`[MeeshoHub] Captured ${normalized.length} returns`);
    }
  }

  if (u.includes('catalog') || u.includes('product') || u.includes('inventory') || u.includes('listing')) {
    const items = deepCollect(json, isProduct);
    if (items.length) {
      const normalized = items.map(normalizeProduct).filter(p => p.catalogId);
      window.__meeshohubData.products.push(...normalized);
      window.__meeshohubData.products = dedup(window.__meeshohubData.products, 'catalogId');
      console.log(`[MeeshoHub] Captured ${normalized.length} products`);
    }
  }

  if (u.includes('payment') || u.includes('transaction') || u.includes('settlement') || u.includes('ledger')) {
    const items = deepCollect(json, isPayment);
    if (items.length) {
      const normalized = items.map(normalizePayment).filter(p => p.paymentId);
      window.__meeshohubData.payments.push(...normalized);
      window.__meeshohubData.payments = dedup(window.__meeshohubData.payments, 'paymentId');
      console.log(`[MeeshoHub] Captured ${normalized.length} payments`);
    }
  }
}

// ── Shape detectors ────────────────────────────────────────────────────────
function isOrder(o) {
  return o && typeof o === 'object' && !Array.isArray(o) &&
    (o.sub_order_number || o.order_id || o.orderId || o.subOrderId) &&
    (o.product_name || o.productName || o.name);
}
function isReturn(o) {
  return o && typeof o === 'object' && !Array.isArray(o) &&
    (o.return_id || o.returnId) &&
    (o.product_name || o.productName || o.name || o.return_reason);
}
function isProduct(o) {
  return o && typeof o === 'object' && !Array.isArray(o) &&
    (o.catalog_id || o.catalogId) &&
    (o.catalog_name || o.name || o.product_name);
}
function isPayment(o) {
  return o && typeof o === 'object' && !Array.isArray(o) &&
    (o.payment_id || o.paymentId || o.transaction_id || o.neft_id) &&
    (o.amount !== undefined || o.net_amount !== undefined || o.credit_amount !== undefined);
}

// ── Deep collect ───────────────────────────────────────────────────────────
function deepCollect(obj, pred, results = []) {
  if (!obj || typeof obj !== 'object') return results;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (pred(item)) results.push(item);
      else deepCollect(item, pred, results);
    }
  } else {
    if (pred(obj)) results.push(obj);
    else for (const v of Object.values(obj)) deepCollect(v, pred, results);
  }
  return results;
}

function dedup(arr, key) {
  const seen = new Set();
  return arr.filter(x => { const k = x[key]; if (!k || seen.has(k)) return false; seen.add(k); return true; });
}

// ── Normalizers ────────────────────────────────────────────────────────────
function normalizeOrder(r) {
  const s = String(r.status || r.order_status || r.state || '').toLowerCase();
  const status = s.includes('hold') ? 'On Hold'
    : s.includes('pending') || s.includes('new') || s.includes('confirm') ? 'Pending'
    : s.includes('ready') || s.includes('dispatch') ? 'Ready to Ship'
    : s.includes('ship') || s.includes('transit') ? 'Shipped'
    : s.includes('deliver') ? 'Delivered'
    : s.includes('cancel') ? 'Cancelled'
    : 'Pending';
  return {
    orderId:      String(r.order_id || r.orderId || r.sub_order_number || ''),
    subOrderId:   String(r.sub_order_number || r.subOrderId || r.sub_order_id || r.order_id || ''),
    productName:  r.product_name || r.productName || r.name || '',
    sku:          r.sku || r.sku_id || r.seller_sku || '',
    variant:      r.variation || r.variant || r.size || 'Free Size',
    price:        Number(r.price || r.selling_price || r.amount || 0),
    quantity:     Number(r.quantity || r.qty || 1),
    paymentMode:  String(r.payment_mode || 'Prepaid').toUpperCase().includes('COD') ? 'COD' : 'Prepaid',
    status,
    buyerName:    r.customer_name || r.buyer_name || r.buyerName || '',
    buyerAddress: [r.city, r.state].filter(Boolean).join(', ') || r.address || r.delivery_address || '',
    orderDate:    r.order_date || r.orderDate || r.created_at || new Date().toISOString(),
    shipByDate:   r.ship_by_date || r.shipByDate || r.expected_dispatch_date || null,
    productImage: r.product_image || r.productImage || r.image_url || '',
    isAd:         !!(r.is_ad || r.isAd || r.ad_order),
  };
}

function normalizeReturn(r) {
  return {
    returnId:     String(r.return_id || r.returnId || r.id || ''),
    orderId:      String(r.order_id || r.orderId || ''),
    productName:  r.product_name || r.productName || r.name || '',
    returnReason: r.reason || r.return_reason || r.returnReason || '',
    status:       r.status || r.return_status || 'Initiated',
    buyerName:    r.customer_name || r.buyer_name || r.buyerName || '',
    otp:          r.otp || r.pickup_otp || null,
    productImage: r.product_image || r.image_url || '',
    returnDate:   r.return_date || r.returnDate || r.created_at || new Date().toISOString(),
  };
}

function normalizeProduct(r) {
  return {
    catalogId:  String(r.catalog_id || r.catalogId || r.id || ''),
    name:       r.catalog_name || r.name || r.product_name || '',
    sku:        r.sku || r.sku_id || '',
    price:      Number(r.price || r.selling_price || 0),
    mrp:        Number(r.mrp || r.original_price || 0),
    stock:      Number(r.stock || r.inventory || r.quantity_available || 0),
    category:   r.category || r.primary_category || '',
    imageUrl:   r.image_url || r.product_image || '',
    isActive:   r.active !== false && r.status !== 'inactive',
  };
}

function normalizePayment(r) {
  const amt = Number(r.amount || r.net_amount || r.credit_amount || r.debit_amount || 0);
  return {
    paymentId:     String(r.payment_id || r.paymentId || r.transaction_id || r.neft_id || r.id || ''),
    transactionId: String(r.transaction_id || r.transactionId || r.neft_id || ''),
    amount:        Math.abs(amt),
    type:          (r.type === 'debit' || r.debit_amount > 0 || amt < 0) ? 'debit' : 'credit',
    description:   r.description || r.details || r.narration || 'Order settlement',
    date:          r.payment_date || r.date || r.created_at || new Date().toISOString(),
    status:        r.status || 'completed',
    utr:           r.utr || r.neft_id || r.reference_number || '',
  };
}

console.log('[MeeshoHub] Content script v2.0 ready on', window.location.pathname);
