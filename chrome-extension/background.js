'use strict';
/**
 * MeeshoHub Background Service Worker
 * Orchestrates auto-navigation across all Meesho pages for full data sync
 */

const MEESHO_PAGES = [
  { url: 'https://supplier.meesho.com/orders/new_orders',        type: 'orders',   label: 'New Orders' },
  { url: 'https://supplier.meesho.com/orders/on_hold',           type: 'orders',   label: 'On Hold Orders' },
  { url: 'https://supplier.meesho.com/orders/ready_to_dispatch', type: 'orders',   label: 'Ready to Ship' },
  { url: 'https://supplier.meesho.com/orders/shipped',           type: 'orders',   label: 'Shipped Orders' },
  { url: 'https://supplier.meesho.com/orders/cancelled',         type: 'orders',   label: 'Cancelled Orders' },
  { url: 'https://supplier.meesho.com/returns/all',              type: 'returns',  label: 'Returns' },
  { url: 'https://supplier.meesho.com/catalog/products',         type: 'products', label: 'Products' },
  { url: 'https://supplier.meesho.com/payments',                 type: 'payments', label: 'Payments' },
];

let syncState = {
  running: false,
  currentPage: 0,
  totalPages: MEESHO_PAGES.length,
  log: [],
  stats: { orders: 0, returns: 0, products: 0, payments: 0 },
};

function addLog(msg, type = 'info') {
  syncState.log.push({ msg, type, time: new Date().toLocaleTimeString() });
  if (syncState.log.length > 50) syncState.log.shift();
  // Notify popup if open
  chrome.runtime.sendMessage({ action: 'syncUpdate', state: syncState }).catch(() => {});
}

async function getSettings() {
  return new Promise(resolve => chrome.storage.local.get(
    ['apiUrl', 'token', 'accountId', 'accounts', 'selectedAccount'], resolve
  ));
}

async function waitForPageLoad(tabId, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Page load timeout')), timeoutMs);
    chrome.tabs.onUpdated.addListener(function listener(tid, info) {
      if (tid === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(timeout);
        setTimeout(resolve, 3000); // wait 3s for XHR to fire after page load
      }
    });
  });
}

async function scrapePageData(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (window.__meeshohubData) {
          const d = { ...window.__meeshohubData };
          window.__meeshohubData = { orders: [], returns: [], products: [], payments: [] };
          return d;
        }
        return { orders: [], returns: [], products: [], payments: [] };
      },
    });
    return results?.[0]?.result || { orders: [], returns: [], products: [], payments: [] };
  } catch {
    return { orders: [], returns: [], products: [], payments: [] };
  }
}

async function pushData(apiUrl, token, accountId, data) {
  const base = apiUrl.replace(/\/$/, '').replace(/\/api\/v1$/, '');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const results = { orders: 0, returns: 0, products: 0, payments: 0 };

  const push = async (endpoint, items, key) => {
    if (!items || !items.length) return;
    try {
      const res = await fetch(`${base}/api/v1/${endpoint}/bulk`, {
        method: 'POST', headers,
        body: JSON.stringify({ accountId, items }),
      });
      if (res.ok) {
        const d = await res.json();
        results[key] = (results[key] || 0) + (d.count || items.length);
        addLog(`✅ ${results[key]} ${key} saved`, 'success');
      } else {
        const e = await res.text();
        addLog(`⚠ ${endpoint} push failed: ${e.slice(0, 80)}`, 'error');
      }
    } catch (err) {
      addLog(`⚠ ${endpoint}: ${err.message}`, 'error');
    }
  };

  await push('orders', data.orders, 'orders');
  await push('returns', data.returns, 'returns');
  await push('products', data.products, 'products');
  await push('payments', data.payments, 'payments');

  return results;
}

async function markSyncComplete(apiUrl, token, accountId) {
  const base = apiUrl.replace(/\/$/, '').replace(/\/api\/v1$/, '');
  try {
    await fetch(`${base}/api/v1/payments/sync-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accountId }),
    });
  } catch {}
}

// Main sync orchestrator
async function startFullSync() {
  if (syncState.running) return;

  const settings = await getSettings();
  const { apiUrl = 'https://meeshohub-backend.vercel.app', token, accountId } = settings;

  if (!token || !accountId) {
    addLog('❌ Not logged in. Open extension popup and login first.', 'error');
    return;
  }

  syncState = {
    running: true,
    currentPage: 0,
    totalPages: MEESHO_PAGES.length,
    log: [],
    stats: { orders: 0, returns: 0, products: 0, payments: 0 },
  };

  addLog('🚀 Starting full Meesho sync…', 'info');

  // Find or create a Meesho tab
  let tabs = await chrome.tabs.query({ url: 'https://supplier.meesho.com/*' });
  let tab;
  if (tabs.length > 0) {
    tab = tabs[0];
  } else {
    tab = await chrome.tabs.create({ url: 'https://supplier.meesho.com', active: false });
    await waitForPageLoad(tab.id);
  }

  const allData = { orders: [], returns: [], products: [], payments: [] };

  for (let i = 0; i < MEESHO_PAGES.length; i++) {
    const page = MEESHO_PAGES[i];
    syncState.currentPage = i + 1;
    addLog(`📄 Navigating to ${page.label}…`, 'info');

    try {
      // Navigate to page
      await chrome.tabs.update(tab.id, { url: page.url });
      await waitForPageLoad(tab.id, 20000);

      // Collect data captured by content script
      const pageData = await scrapePageData(tab.id);

      // Merge
      allData.orders.push(...(pageData.orders || []));
      allData.returns.push(...(pageData.returns || []));
      allData.products.push(...(pageData.products || []));
      allData.payments.push(...(pageData.payments || []));

      addLog(`  Got ${pageData.orders?.length || 0} orders, ${pageData.returns?.length || 0} returns`, 'info');
    } catch (err) {
      addLog(`⚠ ${page.label}: ${err.message}`, 'error');
    }
  }

  // Dedup
  const dedup = (arr, key) => {
    const seen = new Set();
    return (arr || []).filter(x => { const k = x[key]; if (!k || seen.has(k)) return false; seen.add(k); return true; });
  };
  allData.orders   = dedup(allData.orders, 'orderId');
  allData.returns  = dedup(allData.returns, 'returnId');
  allData.products = dedup(allData.products, 'catalogId');
  allData.payments = dedup(allData.payments, 'paymentId');

  addLog(`📊 Total: ${allData.orders.length} orders, ${allData.returns.length} returns, ${allData.products.length} products, ${allData.payments.length} payments`, 'info');

  // Push to MeeshoHub
  addLog('📤 Pushing to MeeshoHub database…', 'info');
  const results = await pushData(apiUrl, token, accountId, allData);
  syncState.stats = results;

  await markSyncComplete(apiUrl, token, accountId);
  await chrome.storage.local.set({ lastSync: new Date().toISOString(), syncStats: results });

  syncState.running = false;
  addLog('🎉 Sync complete! Open MeeshoHub to see your data.', 'success');
  chrome.runtime.sendMessage({ action: 'syncComplete', stats: results }).catch(() => {});
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'startSync') {
    startFullSync();
    sendResponse({ started: true });
    return true;
  }
  if (msg.action === 'getSyncState') {
    sendResponse(syncState);
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[MeeshoHub] Extension v2.0 installed');
});
