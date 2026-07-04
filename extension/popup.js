const API_URL = 'http://localhost:3000/api/scan';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high:     '#f59e0b',
  medium:   '#eab308',
  low:      '#10b981',
};

function getScoreColor(score) {
  if (score >= 70) return '#ef4444';
  if (score >= 40) return '#f59e0b';
  if (score >= 20) return '#eab308';
  return '#10b981';
}

function getScoreLabel(score) {
  if (score >= 80) return 'Extremely Evil';
  if (score >= 60) return 'Very Manipulative';
  if (score >= 40) return 'Somewhat Shady';
  if (score >= 20) return 'Minor Issues';
  return 'Mostly Clean';
}

function showLoading(msg) {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('loading').querySelector
    ? (document.getElementById('loading').innerHTML = `<div class="spinner"></div><div>${msg || 'Scanning page…'}</div>`)
    : null;
  document.getElementById('results').style.display = 'none';
}

function renderResults(data) {
  document.getElementById('loading').style.display = 'none';
  const resultsEl = document.getElementById('results');
  resultsEl.style.display = 'block';

  const score    = data.susScore ?? 0;
  const color    = getScoreColor(score);
  const label    = getScoreLabel(score);
  const patterns = data.patterns ?? [];
  const top      = patterns.slice(0, 5);

  let html = `
    <div class="score-row">
      <div>
        <div class="score-value" style="color:${color}">${score}</div>
        <div class="score-label">out of 100</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:12px;font-weight:600;color:${color}">${label}</div>
        <div style="font-size:10px;color:#6b7280">${patterns.length} pattern${patterns.length !== 1 ? 's' : ''} found</div>
      </div>
    </div>`;

  if (patterns.length === 0) {
    html += `<div class="empty">✅ No dark patterns detected!</div>`;
  } else {
    html += `<div style="font-size:10px;color:#6b7280;margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Top Patterns</div>`;
    for (const p of top) {
      const c = SEVERITY_COLORS[p.severity] || '#6b7280';
      html += `
        <div class="pattern-item">
          <div class="severity-dot" style="background:${c}"></div>
          <div class="pattern-desc">
            <span class="badge-tag" style="background:${c}20;color:${c}">${p.severity}</span>
            <span style="margin-left:4px">${p.description.slice(0, 85)}${p.description.length > 85 ? '…' : ''}</span>
          </div>
        </div>`;
    }
    if (patterns.length > 5) {
      html += `<div style="text-align:center;font-size:11px;color:#6b7280;margin-top:4px">+${patterns.length - 5} more patterns</div>`;
    }
  }

  if (data.warning) {
    html += `<div style="font-size:10px;color:#f59e0b;margin-top:8px;padding:6px 8px;background:#f59e0b15;border-radius:6px;border:1px solid #f59e0b30">${data.warning}</div>`;
  }

  html += `<a href="http://localhost:3000" target="_blank" class="cta-btn">Open Full Report →</a>`;
  resultsEl.innerHTML = html;
}

function renderError(msg) {
  document.getElementById('loading').style.display = 'none';
  const resultsEl = document.getElementById('results');
  resultsEl.style.display = 'block';
  resultsEl.innerHTML = `
    <div class="empty">
      <div style="font-size:20px;margin-bottom:6px">⚠️</div>
      <div style="font-size:12px;margin-bottom:4px">Could not scan this page.</div>
      <div style="font-size:10px;color:#6b7280">${msg || 'Make sure the app is running at localhost:3000'}</div>
    </div>
    <a href="http://localhost:3000" target="_blank" class="cta-btn">Open Web App →</a>`;
}

// ── Main flow ─────────────────────────────────────────────────────────────────

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const tab = tabs[0];
  if (!tab?.id) { renderError('No active tab found.'); return; }

  // Skip un-scannable pages
  const url = tab.url || '';
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
    renderError('Cannot scan browser internal pages.');
    return;
  }

  // 1. Check background cache first (instant if content.js already ran)
  chrome.runtime.sendMessage({ type: 'GET_CACHED_RESULT', tabId: tab.id }, async (cached) => {
    if (cached?.data) {
      renderResults(cached.data);
      return;
    }

    // 2. No cache — grab HTML from the page and scan directly from the popup
    showLoading('Reading page…');
    try {
      const [frameResult] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Annotate opt-out elements with computed styles before sending
          const UNSUB_RE = /unsubscribe|opt[\s-]?out|cancel\s+subscri|stop\s+(receiving|emails)|manage\s+(preference|subscri|notif)|email\s+(preference|setting)/i;
          const HREF_RE  = /unsubscribe|optout|opt-out|cancel|preferences|email-settings/i;

          document.querySelectorAll('a,button,span,p,small,label,input').forEach(el => {
            try {
              const text = (el.textContent || '').toLowerCase();
              const href = (el.getAttribute('href') || '').toLowerCase();
              if (!UNSUB_RE.test(text) && !HREF_RE.test(href)) return;
              const cs = window.getComputedStyle(el);
              el.setAttribute('data-dpd-color',    cs.color);
              el.setAttribute('data-dpd-bg',       cs.backgroundColor);
              el.setAttribute('data-dpd-fontsize', cs.fontSize);
              el.setAttribute('data-dpd-display',  cs.display);
              el.setAttribute('data-dpd-visibility', cs.visibility);
              el.setAttribute('data-dpd-opacity',  cs.opacity);
              el.setAttribute('data-dpd-textdec',  cs.textDecoration);
              const rect = el.getBoundingClientRect();
              el.setAttribute('data-dpd-offscreen', (rect.width === 0 && rect.height === 0) ? '1' : '0');
            } catch {}
          });
          return document.documentElement.outerHTML;
        },
      });

      if (!frameResult?.result) {
        renderError('Could not read page content. Try refreshing the page.');
        return;
      }

      const html = frameResult.result.slice(0, 500000);
      showLoading('Analysing dark patterns…');

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, url }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        renderError(err.error || `API error ${res.status}`);
        return;
      }

      const data = await res.json();

      // Cache it in background
      chrome.runtime.sendMessage({
        type: 'SCAN_COMPLETE',
        score: data.susScore,
        patterns: data.patterns,
        totalPatterns: data.totalPatterns,
        url,
      });

      renderResults(data);

    } catch (err) {
      if (err.message?.includes('fetch')) {
        renderError('API not reachable. Is the app running at localhost:3000?');
      } else if (err.message?.includes('Cannot access')) {
        renderError('Cannot access this page type. Try a regular website.');
      } else {
        renderError(err.message || 'Unexpected error');
      }
    }
  });
});
