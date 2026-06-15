/*!
 * MeeshoHub Security Shield
 * Prevents inspection, copying source, and unauthorized access
 */
(function () {
  'use strict';

  // ── 1. Console warning (like Facebook) ─────────────────────────────────
  const style1 = 'color:#ef4444;font-size:28px;font-weight:900;';
  const style2 = 'color:#1e293b;font-size:14px;';
  console.log('%c⚠ Stop!', style1);
  console.log('%cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam and will give them access to your account.', style2);
  console.log('%cMeeshoHub Security Team', 'color:#6366f1;font-size:12px;font-weight:600;');

  // ── 2. Disable right-click context menu ────────────────────────────────
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  // ── 3. Disable keyboard shortcuts for DevTools / View Source ───────────
  document.addEventListener('keydown', function (e) {
    // F12
    if (e.key === 'F12') { e.preventDefault(); return false; }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
      e.preventDefault(); return false;
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault(); return false;
    }
    // Ctrl+S (Save page)
    if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault(); return false;
    }
    // Ctrl+A (Select all) — optional
    // Ctrl+P (Print)
    if (e.ctrlKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault(); return false;
    }
  });

  // ── 4. Disable text selection on non-input elements ────────────────────
  document.addEventListener('selectstart', function (e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  });

  // ── 5. DevTools detection — size-based ─────────────────────────────────
  let devtoolsOpen = false;
  const threshold = 160;

  function checkDevTools() {
    const widthDiff  = window.outerWidth  - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > threshold || heightDiff > threshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        handleDevToolsOpen();
      }
    } else {
      devtoolsOpen = false;
    }
  }

  function handleDevToolsOpen() {
    // Redirect to a warning page or blur content
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
        min-height:100vh;background:#0f172a;color:white;font-family:sans-serif;text-align:center;padding:20px;">
        <div style="font-size:64px;margin-bottom:16px;">🔒</div>
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Access Blocked</h1>
        <p style="color:#94a3b8;font-size:14px;max-width:400px;line-height:1.6;">
          Developer tools are not allowed on this platform for security reasons.
          Please close DevTools and refresh the page to continue.
        </p>
        <button onclick="location.reload()"
          style="margin-top:24px;padding:10px 24px;background:#6366f1;color:white;
          border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
          Reload Page
        </button>
      </div>
    `;
  }

  setInterval(checkDevTools, 1000);

  // ── 6. Debugger trick — slows down automated analysis ──────────────────
  // Runs in a worker so it doesn't block UI
  function devtoolsDebuggerCheck() {
    const start = new Date();
    // eslint-disable-next-line no-debugger
    debugger;
    const end = new Date();
    if (end - start > 100) {
      handleDevToolsOpen();
    }
  }

  // Only run debugger check in production
  if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    setInterval(devtoolsDebuggerCheck, 3000);
  }

  // ── 7. Disable drag of images ───────────────────────────────────────────
  document.addEventListener('dragstart', function (e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });

  // ── 8. Watermark — invisible fingerprint in DOM ─────────────────────────
  function injectWatermark() {
    const wm = document.createElement('div');
    wm.setAttribute('data-wm', btoa(navigator.userAgent + Date.now()));
    wm.style.cssText = 'position:fixed;opacity:0;pointer-events:none;z-index:-1;';
    document.body?.appendChild(wm);
  }
  if (document.body) injectWatermark();
  else document.addEventListener('DOMContentLoaded', injectWatermark);

})();
