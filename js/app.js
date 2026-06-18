const state = {
  query: '',
  activePhase: 'first-visit',
  allExpanded: false
};

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
  if (phase.parts) {
    for (const part of phase.parts) {
      for (const group of part.groups) {
        for (const section of group.sections) {
          count += section.items.length;
        }
      }
    }
  } else if (phase.sections) {
    for (const section of phase.sections) {
      count += section.items.length;
    }
  }
  return count;
}

function matchItem(item, sectionTitle, groupTitle, partTitle) {
  const q = normalize(state.query);
  if (!q) return true;
  return normalize(item.q).includes(q)
    || normalize(item.hint).includes(q)
    || normalize(sectionTitle).includes(q)
    || (groupTitle && normalize(groupTitle).includes(q))
    || (partTitle && normalize(partTitle).includes(q));
}

function getFilteredParts(phase) {
  const results = [];
  if (!phase.parts) return results;

  for (const part of phase.parts) {
    const filteredGroups = [];
    for (const group of part.groups) {
      const filteredSections = [];
      for (const section of group.sections) {
        const matched = section.items.filter(item =>
          matchItem(item, section.title, group.title || '', part.title)
        );
        if (matched.length > 0) {
          filteredSections.push({ ...section, items: matched });
        }
      }
      if (filteredSections.length > 0) {
        filteredGroups.push({ ...group, sections: filteredSections });
      }
    }
    if (filteredGroups.length > 0) {
      results.push({ ...part, groups: filteredGroups });
    }
  }
  return results;
}

function getFilteredSections(phase) {
  const results = [];
  if (!phase.sections) return results;

  for (const section of phase.sections) {
    const matched = section.items.filter(item =>
      matchItem(item, section.title, section.group || '', '')
    );
    if (matched.length > 0) {
      results.push({ ...section, items: matched, _group: section.group || null });
    }
  }
  return results;
}

function buildTabBar() {
  let html = '<nav class="phase-tabs" role="tablist">';
  for (const phase of phases) {
    const active = phase.id === state.activePhase ? ' active' : '';
    const total = getTotalItems(phase);
    html += `<button class="phase-tab${active}" role="tab" data-phase="${phase.id}" aria-selected="${phase.id === state.activePhase}">
      <span class="tab-phase">${escapeHtml(phase.title)}</span>
      <span class="tab-count">${total}项</span>
    </button>`;
  }
  html += '</nav>';
  return html;
}

function buildStats(phase) {
  const total = getTotalItems(phase);
  const phaseData = phases.find(p => p.id === state.activePhase);
  let nowMatched = 0;
  let nowSections = 0;
  let totalSections = 0;

  if (phaseData && phaseData.parts) {
    const filtered = getFilteredParts(phaseData);
    for (const part of filtered) {
      for (const group of part.groups) {
        for (const section of group.sections) {
          nowMatched += section.items.length;
          nowSections++;
        }
      }
    }
    for (const part of phaseData.parts) {
      for (const group of part.groups) {
        totalSections += group.sections.length;
      }
    }
  } else if (phaseData && phaseData.sections) {
    const filtered = getFilteredSections(phaseData);
    nowMatched = filtered.reduce((sum, s) => sum + s.items.length, 0);
    nowSections = filtered.length;
    totalSections = phaseData.sections.length;
  }

  let html = '<div class="stat-grid">';
  html += `<div class="stat-card tone-dark">
    <span class="stat-value">${total}</span>
    <span class="stat-label">检查项总数</span>
  </div>`;
  html += `<div class="stat-card tone-blue">
    <span class="stat-value">${nowSections} / ${totalSections}</span>
    <span class="stat-label">检查区域</span>
  </div>`;
  html += `<div class="stat-card tone-amber">
    <span class="stat-value">${nowMatched}</span>
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
    <div class="search-input-row">
      <input type="search" id="searchInput" placeholder="${escapeHtml(state.activePhase === 'first-visit' ? '如「插座」「空调」「噪声」…' : state.activePhase === 'second-visit' ? '如「空鼓」「实测」「灰区」…' : '如「押金」「验收」「拍照」…')}" value="${escapeHtml(state.query)}" autocomplete="off">
      <button class="search-btn" id="searchBtn" title="搜索（回车也可）">搜索</button>
    </div>
  </div>`;
  html += '</div>';

  html += '<div class="result-bar">';
  html += `<span>${escapeHtml(phase.subtitle)}</span>`;
  html += '<div class="result-actions">';
  html += `<button class="text-button" id="toggleAllBtn">${state.allExpanded ? '▾ 全部收起' : '▸ 全部展开'}</button>`;
  if (state.query) {
    html += '<button class="text-button" id="clearBtn">✕ 清除搜索</button>';
  }
  html += '</div>';
  html += '</div>';
  html += '</div>';
  return html;
}

function buildItems(items, isContract) {
  if (isContract) {
    let html = '<div class="contract-list">';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      html += `<div class="contract-item">
        <div class="contract-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="contract-body">
          <p class="contract-q">${escapeHtml(item.q)}</p>
          <p class="check-hint">${escapeHtml(item.hint)}</p>
        </div>
      </div>`;
    }
    html += '</div>';
    return html;
  }

  let html = '<div class="check-list">';
  let lastSub = undefined;
  for (const item of items) {
    if (item.sub !== undefined && item.sub !== lastSub) {
      if (item.sub) {
        html += `<div class="item-sub">${escapeHtml(item.sub)}</div>`;
      }
      lastSub = item.sub;
    }
    html += `<div class="check-item${item.sub ? ' has-sub' : ''}">
      <p class="check-q">${escapeHtml(item.q)}</p>
      <p class="check-hint">${escapeHtml(item.hint)}</p>
    </div>`;
  }
  html += '</div>';
  return html;
}

function buildSectionCard(section, isContract, defaultOpen) {
  const openClass = defaultOpen ? ' open' : ' collapsed';

  let html = `<section class="check-section${openClass}" data-section="${escapeHtml(section.title)}">`;
  html += '<div class="section-header">';
  html += '<div class="section-header-left">';
  html += `<h2>${escapeHtml(section.title)}</h2>`;
  if (section.role) {
    html += `<span class="role-badge">${escapeHtml(section.role)}</span>`;
  }
  html += '</div>';
  html += '<div class="section-header-right">';
  html += `<span class="section-count">${section.items.length} 项</span>`;
  html += '<span class="section-arrow">▸</span>';
  html += '</div>';
  html += '</div>';

  html += '<div class="section-body">';

  if (section.note) {
    html += `<div class="section-note">${escapeHtml(section.note)}</div>`;
  }

  html += buildItems(section.items, isContract);
  html += '</div>';
  html += '</section>';
  return html;
}

function buildPartsView(phase) {
  const filteredParts = getFilteredParts(phase);
  const isContract = false;

  let html = '';
  for (const part of filteredParts) {
    html += `<div class="part-header">
      <h2 class="part-title">${escapeHtml(part.title)}</h2>
    </div>`;

    for (const group of part.groups) {
      if (group.title) {
        html += '<div class="group-header">';
        html += `<span class="group-title">${escapeHtml(group.title)}</span>`;
        if (group.role) {
          html += `<span class="group-role">${escapeHtml(group.role)}</span>`;
        }
        html += '</div>';
      }
      if (group.note) {
        html += `<div class="group-note">${escapeHtml(group.note)}</div>`;
      }
      for (const section of group.sections) {
        html += buildSectionCard(section, isContract, state.allExpanded);
      }
    }
  }
  return html;
}

function buildFlatView(phase) {
  const filteredSections = getFilteredSections(phase);
  const isContract = state.activePhase === 'contract';

  let html = '';
  let lastGroup = null;

  for (const section of filteredSections) {
    if (section._group && section._group !== lastGroup) {
      html += `<div class="group-header">
        <span class="group-title">${escapeHtml(section._group)}</span>
      </div>`;
      lastGroup = section._group;
    } else if (!section._group) {
      lastGroup = null;
    }

    html += buildSectionCard(section, isContract, state.allExpanded);
  }
  return html;
}

function buildPhaseContent(phase) {
  let html = buildStats(phase);
  html += buildControls(phase);

  const phaseData = phases.find(p => p.id === state.activePhase);
  if (!phaseData) return html;

  if (phaseData.parts) {
    const filtered = getFilteredParts(phaseData);
    if (filtered.length === 0) {
      html += `<div class="empty-state">
        <p style="font-size:1.1rem;font-weight:800;color:var(--text)">没有匹配的检查项</p>
        <p>试试其他关键词</p>
      </div>`;
    } else {
      html += buildPartsView(phaseData);
    }
  } else if (phaseData.sections) {
    const filtered = getFilteredSections(phaseData);
    if (filtered.length === 0) {
      html += `<div class="empty-state">
        <p style="font-size:1.1rem;font-weight:800;color:var(--text)">没有匹配的检查项</p>
        <p>试试其他关键词</p>
      </div>`;
    } else {
      html += buildFlatView(phaseData);
    }
  }

  return html;
}

function setupAccordion() {
  const sectionHeaders = document.querySelectorAll('.section-header');
  for (const header of sectionHeaders) {
    header.addEventListener('click', () => {
      const section = header.parentElement;
      const wasOpen = section.classList.contains('open');

      section.classList.toggle('open');
      section.classList.toggle('collapsed');

      const body = section.querySelector('.section-body');
      if (section.classList.contains('open')) {
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        body.style.maxHeight = '0px';
      }
    });
  }

  const bodyEls = document.querySelectorAll('.section-body');
  for (const body of bodyEls) {
    const section = body.parentElement;
    if (section.classList.contains('open')) {
      body.style.maxHeight = body.scrollHeight + 'px';
    } else {
      body.style.maxHeight = '0px';
    }
  }
}

function setupToggleAll() {
  const btn = document.getElementById('toggleAllBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    state.allExpanded = !state.allExpanded;
    const sections = document.querySelectorAll('.check-section');
    for (const section of sections) {
      const body = section.querySelector('.section-body');
      if (state.allExpanded) {
        section.classList.add('open');
        section.classList.remove('collapsed');
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        section.classList.remove('open');
        section.classList.add('collapsed');
        body.style.maxHeight = '0px';
      }
    }
    btn.textContent = state.allExpanded ? '▾ 全部收起' : '▸ 全部展开';
  });
}

function renderApp() {
  const app = document.getElementById('app');
  const phase = phases.find(p => p.id === state.activePhase) || phases[0];

  let html = buildTabBar();
  html += '<div class="phase-panel">';
  html += buildPhaseContent(phase);
  html += '</div>';

  app.innerHTML = html;

  setupAccordion();
  setupToggleAll();

  const tabs = document.querySelectorAll('.phase-tab');
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      state.activePhase = tab.dataset.phase;
      state.query = '';
      state.allExpanded = false;
      renderApp();
    });
  }

  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  function doSearch() {
    const val = searchInput.value.trim();
    if (val !== state.query) {
      state.query = val;
      state.allExpanded = !!val;
      renderApp();
    }
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        doSearch();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      doSearch();
    });
  }

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.query = '';
      state.allExpanded = false;
      renderApp();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
