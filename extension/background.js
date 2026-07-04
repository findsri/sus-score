const API_URL = 'http://localhost:3000';

// Cache: tabId -> scan result
const scanCache = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // ── content.js completed a scan and is reporting the result ───────────────
  if (message.type === 'SCAN_COMPLETE') {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    const result = {
      evilScore: message.score ?? 0,
      patterns: message.patterns ?? [],
      totalPatterns: message.totalPatterns ?? 0,
      url: message.url,
    };

    scanCache.set(tabId, result);

    const score = result.evilScore;
    const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
    const text  = score > 0 ? String(score) : '';

    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color, tabId });
    chrome.action.setTitle({ title: `Evil Score: ${score}/100 — ${result.totalPatterns} dark patterns`, tabId });
    return;
  }

  // ── popup.js asking for the cached result for a tab ───────────────────────
  if (message.type === 'GET_CACHED_RESULT') {
    sendResponse({ data: scanCache.get(message.tabId) ?? null });
    return true;
  }

  // ── popup.js triggering a fresh scan (fallback if content script missed) ──
  if (message.type === 'SCAN_PAGE') {
    const { html, url } = message;
    const tabId = sender.tab?.id ?? message.tabId;

    if (scanCache.has(tabId)) {
      sendResponse({ success: true, data: scanCache.get(tabId) });
      return true;
    }

    fetch(`${API_URL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, url }),
    })
      .then(r => r.json())
      .then(data => {
        if (tabId) {
          scanCache.set(tabId, data);
          const score = data.evilScore ?? 0;
          const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
          chrome.action.setBadgeText({ text: score > 0 ? String(score) : '', tabId });
          chrome.action.setBadgeBackgroundColor({ color, tabId });
          chrome.action.setTitle({ title: `Evil Score: ${score}/100`, tabId });
        }
        sendResponse({ success: true, data });
      })
      .catch(err => sendResponse({ success: false, error: err.message }));

    return true; // async
  }
});

// Clear cache + badge when tab navigates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    scanCache.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
