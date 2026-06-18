const state = {
  query: '',
  activePhase: 'screening'
};

let searchTimer = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

function getTotalItems(phase) {
  let count = 0;
  for (const section of phase.sections) {
    count += section.items.length;
  }
  return count;
}

function getFilteredSections(phase) {
  const q = normalize(state.query);
  if (!q) return phase.sections.map(s => ({ ...s, items: s.items, matchedCount: s.items.length }));

  return phase.sections.map(section => {
    const matched = section.items.filter(item => {
      const inQ = normalize(item.q).includes(q);
      const inHint = normalize(item.hint).includes(q);
      const inTitle = normalize(section.title).includes(q);
      return inQ || inHint || inTitle;
    });
    return { ...section, items: matched, matchedCount: matched.length };
  }).filter(s => s.items.length > 0);
}

function buildTabBar() {
  let html = '<nav class="phase-tabs" role="tablist">';
  for (const phase of phases) {
    const active = phase.id === state.activePhase ? ' active' : '';
    const total = getTotalItems(phase);
    html += `<button class="phase-tab${active}" role="tab" data-phase="${phase.id}" aria-selected="${phase.id === state.activePhase}">
      <span class="tab-phase">${escapeHtml(phase.title)}</span>
      <span class="tab-label">${escapeHtml(phase.label)}</span>
      <span class="tab-count">${total}项</span>
    </button>`;
  }
  html += '</nav>';
  return html;
}

function buildStats(phase, filtered) {
  const total = getTotalItems(phase);
  const matched = filtered.reduce((sum, s) => sum + s.items.length, 0);
  const sectionCount = filtered.length;

  let html = '<div class="stat-grid">';
  html += `<div class="stat-card tone-dark">
    <span class="stat-value">${total}</span>
    <span class="stat-label">本阶段检查项</span>
  </div>`;
  html += `<div class="stat-card tone-blue">
    <span class="stat-value">${sectionCount}</span>
    <span class="stat-label">检查区域</span>
  </div>`;
  html += `<div class="stat-card tone-amber">
    <span class="stat-value">${matched}</span>
    <span class="stat-label">当前匹配</span>
  </div>`;
  html += '</div>';
  return html;
}

function buildControls(phase) {
  let html = '<div class="controls">';
  html += '<div class="search-row">';
  html += `<div class="search-box">
    <span>搜索检查项</span>
    <input type="search" id="searchInput" placeholder="${escapeHtml(phase.id === 'screening' ? '如「地铁」「押金」「宠物」…' : phase.id === 'inspection' ? '如「插座」「漏水」「空调」…' : '如「押金」「验收」「违约金」…')}" value="${escapeHtml(state.query)}" autocomplete="off">
  </div>`;
  html += '</div>';

  html += '<div class="result-bar">';
  html += `<span>${escapeHtml(phase.label)} · ${escapeHtml(phase.subtitle)}</span>`;
  if (state.query) {
    html += '<button class="text-button" id="clearBtn">✕ 清除搜索</button>';
  }
  html += '</div>';
  html += '</div>';
  return html;
}

function buildPhaseContent(phase) {
  const filtered = getFilteredSections(phase);

  let html = buildStats(phase, filtered);
  html += buildControls(phase);

  if (filtered.length === 0) {
    html += `<div class="empty-state">
      <p style="font-size:1.1rem;font-weight:800;color:var(--text)">没有匹配的检查项</p>
      <p>试试其他关键词</p>
    </div>`;
    return html;
  }

  for (const section of filtered) {
    const itemCount = section.items.length;
    html += `<section class="check-section">
      <div class="section-header">
        <h2>${escapeHtml(section.title)}</h2>
        <span class="section-count">${itemCount} 项</span>
      </div>`;

    if (phase.id === 'contract') {
      html += '<div class="contract-list">';
      for (let i = 0; i < section.items.length; i++) {
        const item = section.items[i];
        html += `<div class="contract-item">
          <div class="contract-num">${String(i + 1).padStart(2, '0')}</div>
          <div class="contract-body">
            <p class="contract-q">${escapeHtml(item.q)}</p>
            <p class="check-hint">${escapeHtml(item.hint)}</p>
          </div>
        </div>`;
      }
      html += '</div>';
    } else {
      html += '<div class="check-list">';
      for (const item of section.items) {
        html += `<div class="check-item">
          <p class="check-q">${escapeHtml(item.q)}</p>
          <p class="check-hint">${escapeHtml(item.hint)}</p>
        </div>`;
      }
      html += '</div>';
    }

    html += '</section>';
  }

  return html;
}

function renderApp() {
  const app = document.getElementById('app');
  const phase = phases.find(p => p.id === state.activePhase) || phases[0];

  let html = buildTabBar();
  html += '<div class="phase-panel">';
  html += buildPhaseContent(phase);
  html += '</div>';

  app.innerHTML = html;

  const tabs = document.querySelectorAll('.phase-tab');
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      state.activePhase = tab.dataset.phase;
      state.query = '';
      renderApp();
    });
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', event => {
      state.query = event.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => renderApp(), 200);
    });
    if (state.query) {
      const len = state.query.length;
      searchInput.setSelectionRange(len, len);
    }
  }

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.query = '';
      renderApp();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
