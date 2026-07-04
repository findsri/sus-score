const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#10b981',
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

function renderResults(data) {
  const resultsEl = document.getElementById('results');
  const loadingEl = document.getElementById('loading');

  loadingEl.style.display = 'none';
  resultsEl.style.display = 'block';

  const score = data.evilScore ?? 0;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const patterns = data.patterns ?? [];
  const topPatterns = patterns.slice(0, 5);

  let html = `
    <div class="score-row">
      <div>
        <div class="score-value" style="color: ${color}">${score}</div>
        <div class="score-label">out of 100</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:12px; font-weight:600; color:${color}">${label}</div>
        <div style="font-size:10px; color:#6b7280">${patterns.length} pattern${patterns.length !== 1 ? 's' : ''} found</div>
      </div>
    </div>
  `;

  if (patterns.length === 0) {
    html += `<div class="empty">✅ No dark patterns detected on this page!</div>`;
  } else {
    html += `<div style="font-size:10px; color:#6b7280; margin-bottom:8px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em">Top Patterns</div>`;
    for (const p of topPatterns) {
      const sColor = SEVERITY_COLORS[p.severity] || '#6b7280';
      html += `
        <div class="pattern-item">
          <div class="severity-dot" style="background:${sColor}"></div>
          <div class="pattern-desc">
            <span class="badge-tag" style="background:${sColor}20; color:${sColor}">${p.severity}</span>
            <span style="margin-left:4px">${p.description.slice(0, 80)}${p.description.length > 80 ? '…' : ''}</span>
          </div>
        </div>
      `;
    }
    if (patterns.length > 5) {
      html += `<div style="text-align:center; font-size:11px; color:#6b7280; margin-top:4px">+${patterns.length - 5} more patterns</div>`;
    }
  }

  html += `<a href="http://localhost:3000" target="_blank" class="cta-btn">Open Full Report →</a>`;

  resultsEl.innerHTML = html;
}

function renderError() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('results').style.display = 'block';
  document.getElementById('results').innerHTML = `
    <div class="empty">
      <div style="font-size:20px;margin-bottom:6px">⚠️</div>
      <div style="font-size:12px;margin-bottom:8px">Could not scan this page.</div>
      <div style="font-size:10px;color:#6b7280">Make sure the API server is running at localhost:3000</div>
    </div>
    <a href="http://localhost:3000" target="_blank" class="cta-btn">Open Web App →</a>
  `;
}

// Get current tab and check for cached result
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (!tab) { renderError(); return; }

  chrome.runtime.sendMessage(
    { type: 'GET_CACHED_RESULT', tabId: tab.id },
    (response) => {
      if (response?.data) {
        renderResults(response.data);
      } else {
        // No cache — request a new scan
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.documentElement.outerHTML,
        }, (results) => {
          if (chrome.runtime.lastError || !results?.[0]?.result) {
            renderError();
            return;
          }
          chrome.runtime.sendMessage({
            type: 'SCAN_PAGE',
            html: results[0].result.slice(0, 200000),
            url: tab.url,
          }, (res) => {
            if (res?.success) {
              renderResults(res.data);
            } else {
              renderError();
            }
          });
        });
      }
    }
  );
});
