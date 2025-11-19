import { state } from '../state.js';

function createCard(equipment) {
  const card = document.createElement('article');
  card.className = 'catalog-card';
  card.innerHTML = `
    <img src="${equipment.image}" alt="${equipment.name}" loading="lazy" />
    <div class="badge">${equipment.category}</div>
    <h3 style="margin:6px 0;">${equipment.name}</h3>
    <p>${equipment.description}</p>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong>${equipment.pricePerDay.toLocaleString('ru-RU')} ₽/сут</strong>
      <span style="color:var(--color-text-muted);">${equipment.rating} ★ (${equipment.reviews})</span>
    </div>
    <div style="display:flex;gap:var(--space-sm);">
      <button class="btn btn-secondary" data-action="view">Подробнее</button>
      <button class="btn btn-primary" data-action="book">Бронь</button>
    </div>
  `;
  card.querySelector('[data-action="view"]').addEventListener('click', () => {
    window.location.hash = `#/item/${equipment.id}`;
  });
  card.querySelector('[data-action="book"]').addEventListener('click', () => {
    window.location.hash = `#/item/${equipment.id}`;
  });
  return card;
}

function renderCatalog({ query }) {
  const container = document.createElement('div');
  container.className = 'main-container';
  const savedFilters = typeof sessionStorage !== 'undefined'
    ? {
        category: sessionStorage.getItem('catalogCategory') || '',
        location: sessionStorage.getItem('catalogLocation') || '',
        search: sessionStorage.getItem('catalogSearch') || ''
      }
    : { category: '', location: '', search: '' };
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('catalogCategory');
    sessionStorage.removeItem('catalogLocation');
    sessionStorage.removeItem('catalogSearch');
  }

  const filters = {
    search: savedFilters.search || '',
    category: query?.get('category') || savedFilters.category || '',
    location: savedFilters.location || '',
    priceMin: '',
    priceMax: ''
  };

  const uniqueCategories = [...new Set(state.equipment.map((eq) => eq.category))];
  const uniqueLocations = [...new Set(state.equipment.map((eq) => eq.location))];

  container.innerHTML = `
    <section class="surface">
      <h2>Каталог</h2>
      <p>Фильтры мгновенно отрабатываются к локальному списку оборудования.</p>
      <div class="card-grid" style="margin-bottom:var(--space-md);">
        <input type="search" placeholder="Поиск по названию" data-filter="search" />
        <select data-filter="category">
          <option value="">Категория</option>
          ${uniqueCategories.map((cat) => `<option value="${cat}">${cat}</option>`).join('')}
        </select>
        <select data-filter="location">
          <option value="">Город</option>
          ${uniqueLocations.map((loc) => `<option value="${loc}">${loc}</option>`).join('')}
        </select>
        <div style="display:flex;gap:var(--space-xs);">
          <input type="number" placeholder="Цена от" data-filter="priceMin" />
          <input type="number" placeholder="Цена до" data-filter="priceMax" />
        </div>
        <button class="btn btn-ghost" data-action="reset">Сбросить</button>
      </div>
      <div class="catalog-grid" id="catalog-list"></div>
    </section>
  `;

  const list = container.querySelector('#catalog-list');
  const controls = container.querySelectorAll('[data-filter]');

  function applyFilters() {
    const items = state.equipment.filter((item) => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.location && item.location !== filters.location) return false;
      if (filters.priceMin && item.pricePerDay < Number(filters.priceMin)) return false;
      if (filters.priceMax && item.pricePerDay > Number(filters.priceMax)) return false;
      if (filters.search) {
        const haystack = `${item.name} ${item.description}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<p style="color:var(--color-text-muted);">Ничего не найдено.</p>';
      return;
    }
    items.forEach((item) => list.appendChild(createCard(item)));
  }

  controls.forEach((input) => {
    const key = input.dataset.filter;
    if (filters[key]) input.value = filters[key];
    input.addEventListener('input', (evt) => {
      filters[key] = evt.target.value;
      applyFilters();
    });
  });

  container.querySelector('[data-action="reset"]').addEventListener('click', () => {
    Object.keys(filters).forEach((key) => {
      filters[key] = '';
    });
    controls.forEach((input) => {
      input.value = '';
    });
    applyFilters();
  });

  applyFilters();
  return container;
}

export { renderCatalog };
