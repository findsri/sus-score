const API_URL = 'http://localhost:4000';

// Cache: tabId -> scan result
const scanCache = new Map();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_PAGE') {
    const { html, url, tabId } = message;

    // Check cache first
    if (scanCache.has(tabId)) {
      sendResponse({ success: true, data: scanCache.get(tabId) });
      return true;
    }

    // Call the API
    fetch(`${API_URL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, url, takeScreenshot: false }),
    })
      .then(r => r.json())
      .then(data => {
        scanCache.set(tabId, data);

        // Update badge
        const score = data.evilScore ?? 0;
        const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
        chrome.action.setBadgeText({ text: String(score), tabId });
        chrome.action.setBadgeBackgroundColor({ color, tabId });
        chrome.action.setTitle({ title: `Evil Score: ${score}/100`, tabId });

        sendResponse({ success: true, data });
      })
      .catch(err => {
        console.error('Scan failed:', err);
        sendResponse({ success: false, error: err.message });
      });

    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_CACHED_RESULT') {
    const { tabId } = message;
    sendResponse({ data: scanCache.get(tabId) ?? null });
    return true;
  }
});

// Clear cache when tab navigates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    scanCache.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
