'use strict';

const $ = id => document.getElementById(id);

async function getSettings() {
  return new Promise(resolve => chrome.storage.local.get(['apiUrl', 'token', 'accountId', 'lastSync', 'syncStats'], resolve));
}

async function saveSettings(data) {
  return new Promise(resolve => chrome.storage.local.set(data, resolve));
}

function renderNotMeesho() {
  document.getElementById('content').innerHTML = `
    <div class="not-meesho">
      <div class="icon">🏪</div>
      <p style="font-weight:600;color:#1e293b;margin-bottom:6px;">Open Meesho Supplier Panel</p>
      <p>Navigate to supplier.meesho.com to start syncing your data to MeeshoHub.</p>
      <a href="https://supplier.meesho.com" target="_blank" style="display:inline-block;margin-top:12px;background:#6366f1;color:white;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">Open Supplier Panel →</a>
    </div>
  `;
}

async function renderMain(settings, isMeesho) {
  const { apiUrl = 'https://meeshohub-backend.vercel.app', token = '', accountId = '', lastSync, syncStats } = settings;
  const connected = !!token;

  document.getElementById('content').innerHTML = `
    <div class="section">
      <div class="status-card">
        <div class="label">Backend Connection</div>
        <div class="value">
          <span class="status-dot ${connected ? 'dot-green' : 'dot-red'}"></span>
          ${connected ? 'Connected to MeeshoHub' : 'Not logged in'}
        </div>
      </div>
      ${isMeesho ? `
      <div class="status-card">
        <div class="label">Meesho Panel</div>
        <div class="value"><span class="status-dot dot-green"></span>Active — ready to sync</div>
      </div>` : ''}
    </div>

    ${!connected ? `
    <div class="section">
      <div class="section-title">Login to MeeshoHub</div>
      <input class="input" id="apiUrl" placeholder="Backend URL" value="${apiUrl}" style="margin-bottom:8px;" />
      <input class="input" id="emailInput" placeholder="Email" style="margin-bottom:8px;" />
      <input class="input" id="passInput" type="password" placeholder="Password" style="margin-bottom:8px;" />
      <button class="btn btn-primary" id="loginBtn">Login to MeeshoHub</button>
    </div>` : `
    <div class="section">
      <div class="section-title">Sync Data</div>
      ${isMeesho ? `
        <button class="btn btn-primary" id="syncBtn">⟳ Sync This Page Data</button>
        <button class="btn btn-primary" id="syncAllBtn" style="margin-top:8px;background:#059669;">⟳ Sync All Pages (Full Sync)</button>
      ` : `
        <p style="font-size:12px;color:#64748b;text-align:center;padding:8px;">Open supplier.meesho.com to sync</p>
        <a href="https://supplier.meesho.com" target="_blank" style="display:block;text-align:center;margin-top:8px;">
          <button class="btn btn-outline">Open Meesho Panel</button>
        </a>
      `}
      <button class="btn btn-outline" id="logoutBtn">Logout</button>
    </div>
    ${syncStats ? `
    <div class="section">
      <div class="section-title">Last Sync Results</div>
      <div class="stats">
        <div class="stat"><div class="num">${syncStats.orders || 0}</div><div class="lbl">Orders</div></div>
        <div class="stat"><div class="num">${syncStats.returns || 0}</div><div class="lbl">Returns</div></div>
        <div class="stat"><div class="num">${syncStats.products || 0}</div><div class="lbl">Products</div></div>
        <div class="stat"><div class="num">${syncStats.payments || 0}</div><div class="lbl">Payments</div></div>
      </div>
      ${lastSync ? `<p style="font-size:10px;color:#94a3b8;text-align:center;margin-top:6px;">Last synced: ${new Date(lastSync).toLocaleString()}</p>` : ''}
    </div>` : ''}
    `}

    <div id="logArea"></div>
  `;

  // Attach events
  if (!connected) {
    document.getElementById('loginBtn')?.addEventListener('click', doLogin);
  } else {
    document.getElementById('syncBtn')?.addEventListener('click', () => doSync(false));
    document.getElementById('syncAllBtn')?.addEventListener('click', () => doSync(true));
    document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
  }
}

function addLog(msg, type = 'info') {
  let logArea = document.getElementById('logArea');
  if (!logArea) return;
  if (!logArea.querySelector('.log')) {
    logArea.innerHTML = '<div class="log" id="logBox"></div>';
  }
  const box = document.getElementById('logBox');
  const p = document.createElement('p');
  p.className = type;
  p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  box.appendChild(p);
  box.scrollTop = box.scrollHeight;
}

async function doLogin() {
  const btn = document.getElementById('loginBtn');
  const apiUrl = document.getElementById('apiUrl').value.trim().replace(/\/$/, '');
  const email = document.getElementById('emailInput').value.trim();
  const pass = document.getElementById('passInput').value;
  if (!email || !pass) { addLog('Enter email and password', 'error'); return; }

  btn.disabled = true;
  btn.textContent = 'Logging in…';
  addLog('Connecting to MeeshoHub…', 'info');

  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    // Get accounts
    const accRes = await fetch(`${apiUrl}/api/v1/accounts`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    const accounts = await accRes.json();
    const accountId = Array.isArray(accounts) && accounts.length > 0 ? accounts[0]._id : '';

    await saveSettings({ apiUrl, token: data.token, accountId, user: data.user });
    addLog('✅ Logged in successfully!', 'success');
    setTimeout(() => init(), 1000);
  } catch (err) {
    addLog(`❌ ${err.message}`, 'error');
    btn.disabled = false;
    btn.textContent = 'Login to MeeshoHub';
  }
}

async function doLogout() {
  await saveSettings({ token: '', accountId: '' });
  init();
}

async function doSync(fullSync) {
  const settings = await getSettings();
  const { apiUrl = 'https://meeshohub-backend.vercel.app', token, accountId } = settings;

  const btn = document.getElementById(fullSync ? 'syncAllBtn' : 'syncBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Syncing…'; }

  addLog(fullSync ? 'Starting full sync…' : 'Syncing current page…', 'info');

  try {
    // Ask content script to scrape the page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const result = await chrome.tabs.sendMessage(tab.id, {
      action: fullSync ? 'scrapeAll' : 'scrapeCurrent',
      token,
      apiUrl,
      accountId,
    });

    if (result?.error) throw new Error(result.error);

    const stats = result?.stats || {};
    await saveSettings({ lastSync: new Date().toISOString(), syncStats: stats });
    addLog(`✅ Synced! Orders: ${stats.orders || 0}, Returns: ${stats.returns || 0}, Products: ${stats.products || 0}`, 'success');
    setTimeout(() => init(), 1500);
  } catch (err) {
    addLog(`❌ ${err.message}`, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = fullSync ? '⟳ Sync All Pages (Full Sync)' : '⟳ Sync This Page Data'; }
  }
}

async function init() {
  const settings = await getSettings();

  // Check if current tab is Meesho supplier panel
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isMeesho = tab?.url?.includes('supplier.meesho.com');

  if (!settings.token && !isMeesho) {
    renderNotMeesho();
    return;
  }

  renderMain(settings, isMeesho);
}

document.addEventListener('DOMContentLoaded', init);
