// Run after page loads
(function () {
  if (window.__darkPatternDetectorInjected) return;
  window.__darkPatternDetectorInjected = true;

  const html = document.documentElement.outerHTML;
  const url = window.location.href;

  // Skip extension pages and local files
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('file://')) {
    return;
  }

  // Throttle: don't scan the same URL twice
  chrome.runtime.sendMessage({
    type: 'SCAN_PAGE',
    html: html.slice(0, 200000), // Cap at 200KB
    url,
    tabId: undefined, // Background uses sender.tab.id
  }, (response) => {
    if (chrome.runtime.lastError) return;
    if (response?.success && response.data) {
      // Optionally inject a subtle score badge into the DOM
      injectScoreBadge(response.data.evilScore);
    }
  });
})();

function injectScoreBadge(score) {
  if (score < 10) return; // Don't show badge for clean sites

  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#eab308';

  const badge = document.createElement('div');
  badge.id = '__dpd-badge';
  badge.style.cssText = `
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 2147483647;
    background: #0a0a0f;
    border: 1px solid ${color};
    border-radius: 12px;
    padding: 6px 10px;
    font-family: -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: ${color};
    box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 8px ${color}40;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    user-select: none;
    transition: opacity 0.2s;
  `;
  badge.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
    Evil: ${score}/100
  `;

  badge.title = `Dark Pattern Detector: Evil Score ${score}/100. Click to dismiss.`;
  badge.addEventListener('click', () => badge.remove());

  // Auto-hide after 8 seconds
  setTimeout(() => {
    badge.style.opacity = '0';
    setTimeout(() => badge.remove(), 200);
  }, 8000);

  document.body.appendChild(badge);
}
