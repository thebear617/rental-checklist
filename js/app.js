const state = {
  query: '',
  category: '全部'
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

function matchItem(item, query, category) {
  const q = normalize(query);

  let catMatch = true;
  let subcatMatch = true;
  let itemMatch = true;

  if (category !== '全部') {
    catMatch = item._category === category;
  }

  if (q) {
    subcatMatch = normalize(item._subcategory).includes(q);
    itemMatch = normalize(item.name).includes(q) || normalize(item.desc).includes(q);
  }

  return catMatch && (q ? (subcatMatch || itemMatch) : true);
}

function flattenData(data) {
  const flat = [];
  for (const cat of data) {
    for (const sub of cat.subcategories) {
      for (const item of sub.items) {
        flat.push({
          ...item,
          _category: cat.category,
          _subcategory: sub.name
        });
      }
    }
  }
  return flat;
}

function getCategoryStats(data, flat) {
  const counts = {};
  for (const item of flat) {
    counts[item._category] = (counts[item._category] || 0) + 1;
  }
  return data.map(cat => ({
    name: cat.category,
    total: counts[cat.category] || 0
  }));
}

function getFilteredData() {
  const flat = flattenData(checklistData);
  const filtered = flat.filter(item => matchItem(item, state.query, state.category));
  return { flat, filtered };
}

function buildTable(flat, filtered) {
  if (filtered.length === 0) {
    return `<div class="empty-state">
      <p style="font-size:1.1rem;font-weight:800;color:var(--text)">没有匹配的检查项</p>
      <p>试试其他关键词或筛选条件</p>
    </div>`;
  }

  const categoryNames = [...new Set(checklistData.map(c => c.category))];
  const visibleCategories = [...new Set(filtered.map(f => f._category))]
    .sort((a, b) => categoryNames.indexOf(a) - categoryNames.indexOf(b));

  let rows = '';
  for (const catName of visibleCategories) {
    const catData = checklistData.find(c => c.category === catName);
    if (!catData) continue;

    const catItems = filtered.filter(f => f._category === catName);
    let catFirst = true;

    for (const sub of catData.subcategories) {
      const subItems = catItems.filter(f => f._subcategory === sub.name);
      if (subItems.length === 0) continue;

      let subFirst = true;
      for (const item of subItems) {
        const isCatRow = catFirst;
        const isSubRow = subFirst;

        rows += '<tr>';
        if (isCatRow) {
          rows += `<td class="cat-cell" rowspan="${catItems.length}">${escapeHtml(catName)}</td>`;
        }
        if (isSubRow) {
          rows += `<td class="subcat-cell" rowspan="${subItems.length}">${escapeHtml(sub.name)}</td>`;
        }
        rows += `<td><span class="item-name">${escapeHtml(item.name)}</span>：<span class="item-desc">${escapeHtml(item.desc)}</span></td>`;
        rows += '</tr>';

        catFirst = false;
        subFirst = false;
      }
    }
  }

  return `<div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>分类</th>
          <th>项目</th>
          <th>检查要点与判断标准</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function renderApp() {
  const app = document.getElementById('app');
  const { flat, filtered } = getFilteredData();

  const categories = ['全部', ...checklistData.map(c => c.category)];
  const catStats = getCategoryStats(checklistData, flat);

  const totalItems = flat.length;
  const matchedItems = filtered.length;

  let html = '';

  html += '<div class="stat-grid">';
  html += `<div class="stat-card tone-dark">
    <span class="stat-value">${totalItems}</span>
    <span class="stat-label">检查项总数</span>
  </div>`;
  html += `<div class="stat-card tone-blue">
    <span class="stat-value">${catStats.length}</span>
    <span class="stat-label">分类数</span>
  </div>`;
  html += `<div class="stat-card tone-amber">
    <span class="stat-value">${matchedItems}</span>
    <span class="stat-label">当前匹配</span>
  </div>`;

  const selectedCat = state.category === '全部'
    ? catStats
    : catStats.filter(c => c.name === state.category);
  for (const cat of selectedCat) {
    const catFiltered = filtered.filter(f => f._category === cat.name).length;
    html += `<div class="stat-card tone-green">
      <span class="stat-value">${catFiltered}</span>
      <span class="stat-label">${escapeHtml(cat.name)}</span>
    </div>`;
  }
  html += '</div>';

  html += '<div class="controls">';
  html += '<div class="search-row">';
  html += `<div class="search-box">
    <span>搜索检查项</span>
    <input type="search" id="searchInput" placeholder="输入关键词，如"插座"、"马桶"、"噪音"..." value="${escapeHtml(state.query)}" autocomplete="off">
  </div>`;
  html += '<div class="filter-field">';
  html += '<span>分类筛选</span>';
  html += `<select id="categorySelect">`;
  for (const cat of categories) {
    const selected = cat === state.category ? ' selected' : '';
    html += `<option value="${escapeHtml(cat)}"${selected}>${escapeHtml(cat)}</option>`;
  }
  html += '</select>';
  html += '</div>';
  html += '</div>';

  html += '<div class="result-bar">';
  html += `<span>共 <strong>${matchedItems}</strong> / ${totalItems} 项</span>`;
  if (state.query || state.category !== '全部') {
    html += '<button class="text-button" id="clearBtn">✕ 清除筛选</button>';
  }
  html += '</div>';
  html += '</div>';

  html += buildTable(flat, filtered);

  app.innerHTML = html;

  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categorySelect');
  const clearBtn = document.getElementById('clearBtn');

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

  if (categorySelect) {
    categorySelect.addEventListener('change', event => {
      state.category = event.target.value;
      renderApp();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.query = '';
      state.category = '全部';
      renderApp();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
