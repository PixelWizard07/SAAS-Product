'use strict';

async function store(data) {
  return new Promise(r => chrome.storage.local.set(data, r));
}
async function load(keys) {
  return new Promise(r => chrome.storage.local.get(keys, r));
}

// ── Render: Login Screen ───────────────────────────────────────────────────
function renderLogin(apiUrl = 'https://meeshohub-backend.vercel.app') {
  document.getElementById('body').innerHTML = `
    <div class="info-box">
      🔗 Connect to your MeeshoHub account to start syncing data from the Meesho supplier panel.
    </div>
    <div class="card">
      <div class="card-title">MeeshoHub Backend URL</div>
      <input class="input" id="apiUrl" value="${apiUrl}" placeholder="https://meeshohub-backend.vercel.app" />
    </div>
    <div class="card">
      <div class="card-title">Login to MeeshoHub</div>
      <input class="input" id="email" placeholder="Email address" type="email" />
      <input class="input" id="pass" placeholder="Password" type="password" style="margin-top:6px" />
      <button class="btn btn-primary" id="loginBtn" style="margin-top:10px">Login</button>
    </div>
    <div id="logArea"></div>
  `;
  document.getElementById('loginBtn').addEventListener('click', doLogin);
}

// ── Render: Main Screen ────────────────────────────────────────────────────
function renderMain(settings, syncState) {
  const { accounts = [], selectedAccount, lastSync, syncStats } = settings;
  const acc = accounts.find(a => a._id === selectedAccount) || accounts[0];
  const running = syncState?.running;

  document.getElementById('body').innerHTML = `
    ${accounts.length > 1 ? `
    <div class="card">
      <div class="card-title">Active Account</div>
      <select class="account-select" id="accountSelect">
        ${accounts.map(a => `<option value="${a._id}" ${a._id === selectedAccount ? 'selected' : ''}>${a.nickname || a.shopName || a.phone}</option>`).join('')}
      </select>
    </div>` : `
    <div class="card">
      <div class="status-row">
        <div class="dot dot-green"></div>
        <span class="status-label">Connected to MeeshoHub</span>
        <span class="status-val">${acc?.nickname || acc?.phone || 'Account'}</span>
      </div>
      <div class="status-row">
        <div class="dot dot-${running ? 'yellow' : 'green'}"></div>
        <span class="status-label">${running ? 'Syncing…' : 'Ready to sync'}</span>
        ${lastSync ? `<span class="status-val">${new Date(lastSync).toLocaleDateString()}</span>` : ''}
      </div>
    </div>`}

    ${running ? `
    <div class="card">
      <div class="card-title">Sync in Progress</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(((syncState.currentPage||0)/8)*100)}%"></div></div>
      <p style="font-size:11px;color:#64748b;text-align:center">Page ${syncState.currentPage||0} of ${syncState.totalPages||8}</p>
      <div id="logBox" class="log-box">
        ${(syncState.log||[]).slice(-8).map(l => `<div class="log-line ${l.type}">[${l.time}] ${l.msg}</div>`).join('')}
      </div>
    </div>` : `
    <div class="card">
      <div class="card-title">Sync Meesho Data</div>
      <button class="btn btn-green" id="syncBtn">⟳ Full Sync — All Pages Auto</button>
      <p style="font-size:10px;color:#94a3b8;margin-top:8px;text-align:center;line-height:1.5">
        Automatically navigates through Orders, Returns,<br>Products &amp; Payments pages and saves all data.
      </p>
    </div>`}

    ${syncStats ? `
    <div class="card">
      <div class="card-title">Last Sync Results</div>
      <div class="stats-grid">
        <div class="stat"><div class="stat-num">${syncStats.orders||0}</div><div class="stat-lbl">Orders</div></div>
        <div class="stat"><div class="stat-num">${syncStats.returns||0}</div><div class="stat-lbl">Returns</div></div>
        <div class="stat"><div class="stat-num">${syncStats.products||0}</div><div class="stat-lbl">Products</div></div>
        <div class="stat"><div class="stat-num">${syncStats.payments||0}</div><div class="stat-lbl">Payments</div></div>
      </div>
      ${lastSync ? `<p style="font-size:10px;color:#94a3b8;text-align:center;margin-top:8px">Last synced: ${new Date(lastSync).toLocaleString()}</p>` : ''}
    </div>` : ''}

    <button class="btn btn-danger" id="logoutBtn">Logout</button>
    <div id="logArea"></div>
  `;

  document.getElementById('accountSelect')?.addEventListener('change', async e => {
    await store({ selectedAccount: e.target.value, accountId: e.target.value });
  });

  document.getElementById('syncBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('syncBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Starting sync…'; }
    chrome.runtime.sendMessage({ action: 'startSync' });
    setTimeout(init, 1000);
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await store({ token: '', accountId: '', accounts: [], selectedAccount: '' });
    init();
  });
}

// ── Login ──────────────────────────────────────────────────────────────────
async function doLogin() {
  const btn = document.getElementById('loginBtn');
  const apiUrl = document.getElementById('apiUrl').value.trim().replace(/\/$/, '').replace(/\/api\/v1$/, '');
  const email  = document.getElementById('email').value.trim();
  const pass   = document.getElementById('pass').value;

  if (!email || !pass) { addLog('Enter email and password', 'error'); return; }

  btn.disabled = true; btn.textContent = 'Logging in…';
  addLog('Connecting to MeeshoHub…', 'info');

  try {
    const res  = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    addLog('Fetching your Meesho accounts…', 'info');

    // Load accounts
    const accRes  = await fetch(`${apiUrl}/api/v1/accounts`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    const accounts = await accRes.json();
    const accList  = Array.isArray(accounts) ? accounts : [];
    const firstId  = accList[0]?._id || '';

    await store({ apiUrl, token: data.token, accountId: firstId, selectedAccount: firstId, accounts: accList, user: data.user });

    addLog(`✅ Logged in! Found ${accList.length} account(s).`, 'success');
    setTimeout(init, 1200);
  } catch (err) {
    addLog(`❌ ${err.message}`, 'error');
    btn.disabled = false; btn.textContent = 'Login';
  }
}

function addLog(msg, type = 'info') {
  let area = document.getElementById('logArea');
  if (!area) return;
  if (!area.querySelector('.log-box')) {
    area.innerHTML = '<div class="log-box" id="logBox"></div>';
  }
  const box = document.getElementById('logBox');
  const div = document.createElement('div');
  div.className = `log-line ${type}`;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  const settings = await load(['apiUrl', 'token', 'accountId', 'accounts', 'selectedAccount', 'lastSync', 'syncStats']);

  if (!settings.token) {
    renderLogin(settings.apiUrl);
    return;
  }

  // Get sync state from background
  chrome.runtime.sendMessage({ action: 'getSyncState' }, (syncState) => {
    renderMain(settings, syncState || {});
  });
}

// Listen for live updates from background during sync
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'syncUpdate' || msg.action === 'syncComplete') {
    init();
  }
});

document.addEventListener('DOMContentLoaded', init);
