// content.js — runs on every page, grabs real DOM and sends to your API

const API_URL = 'http://localhost:3000/api/scan';

async function scanPage() {
  const html = document.documentElement.outerHTML;
  const url = window.location.href;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, url })  // sends real rendered HTML
    });

    const data = await res.json();

    // Send score to background script to update badge
    chrome.runtime.sendMessage({
      type: 'SCAN_COMPLETE',
      score: data.evilScore,
      patterns: data.patterns,
      url
    });

    // Inject a small floating badge on the page
    injectBadge(data.evilScore, data.totalPatterns);

  } catch (err) {
    console.error('[DarkPatternDetector] scan failed:', err);
  }
}

function injectBadge(score, patternCount) {
  // Remove existing badge if any
  const existing = document.getElementById('dpd-badge');
  if (existing) existing.remove();

  const color = score >= 60 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#22c55e';
  const label = score >= 60 ? '⚠ HIGH RISK' : score >= 30 ? '⚡ MODERATE' : '✓ CLEAN';

  const badge = document.createElement('div');
  badge.id = 'dpd-badge';
  badge.innerHTML = `
    <div style="font-size:11px;font-weight:700;color:white;">${label}</div>
    <div style="font-size:20px;font-weight:900;color:white;line-height:1;">${score}</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.8);">Evil Score</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.7);">${patternCount} patterns</div>
  `;
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    background: ${color};
    border-radius: 12px;
    padding: 10px 14px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    cursor: pointer;
    font-family: -apple-system, sans-serif;
    min-width: 90px;
    transition: transform 0.2s;
  `;
  badge.title = 'Click to open Dark Pattern Detector';
  badge.onclick = () => window.open('http://localhost:3000', '_blank');
  badge.onmouseenter = () => badge.style.transform = 'scale(1.05)';
  badge.onmouseleave = () => badge.style.transform = 'scale(1)';

  document.body.appendChild(badge);
}

// Run after page is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scanPage);
} else {
  scanPage();
}