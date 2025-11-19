import { state, getEquipmentById, createOrder } from '../state.js';
import { showToast, openModal } from './ui.js';

function renderItemPage({ id }) {
  const equipment = getEquipmentById(id);
  const container = document.createElement('div');
  container.className = 'main-container';
  if (!equipment) {
    container.innerHTML = '<section class="surface"><h2>Оборудование не найдено</h2><p>Вернитесь в каталог и выберите другое предложение.</p></section>';
    return container;
  }

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  container.innerHTML = `
    <section class="surface">
      <div class="item-hero">
        <img src="${equipment.image}" alt="${equipment.name}" style="width:100%;height:260px;object-fit:cover;border-radius:var(--radius-lg);" />
        <div>
          <p class="badge">${equipment.category}</p>
          <h2>${equipment.name}</h2>
          <p>${equipment.description}</p>
          <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;margin-top:var(--space-sm);">
            <span>📍 ${equipment.location}</span>
            <span>⭐ ${equipment.rating} (${equipment.reviews})</span>
          </div>
        </div>
      </div>
      <hr style="margin:var(--space-lg) 0;border:0;border-top:1px solid rgba(255,255,255,0.08);" />
      <div class="item-hero">
        <div>
          <h3>Бронирование</h3>
          <form class="booking-form">
            <div class="form-group">
              <label>Дата начала</label>
              <input type="date" name="start" value="${today}" min="${today}" required />
            </div>
            <div class="form-group">
              <label>Дата окончания</label>
              <input type="date" name="end" value="${tomorrow}" min="${today}" required />
            </div>
            <div class="form-group">
              <label>Итог</label>
              <strong class="summary">–</strong>
            </div>
            <button class="btn btn-primary" type="submit">Создать бронь</button>
          </form>
        </div>
        <div>
          <h3>Характеристики</h3>
          <div class="card-grid">
            ${Object.entries(equipment.specs || {})
              .map(([key, value]) => `<article class="card"><p class="badge">${key}</p><strong>${value}</strong></article>`)
              .join('')}
          </div>
        </div>
      </div>
    </section>
  `;

  const form = container.querySelector('.booking-form');
  const summary = form.querySelector('.summary');
  const startInput = form.querySelector('[name="start"]');
  const endInput = form.querySelector('[name="end"]');

  function updateSummary() {
    const start = new Date(startInput.value);
    const end = new Date(endInput.value);
    if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
      summary.textContent = 'Выберите корректные даты';
      return;
    }
    const days = Math.max(1, Math.ceil((end - start) / 86400000) + 1);
    const total = days * equipment.pricePerDay;
    summary.textContent = `${days} дней · ${total.toLocaleString('ru-RU')} ₽`;
  }

  startInput.addEventListener('change', () => {
    endInput.min = startInput.value;
    updateSummary();
  });
  endInput.addEventListener('change', updateSummary);
  updateSummary();

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    if (!state.currentUser || state.currentUser.role !== 'renter') {
      openModal({
        title: 'Нужен вход',
        content: '<p>Авторизуйтесь как арендатор, чтобы завершить бронирование.</p>',
        actions: [{ label: 'Перейти к авторизации', handler: () => (window.location.hash = '#/auth') }]
      });
      return;
    }
    const result = createOrder({
      equipmentId: equipment.id,
      startDate: startInput.value,
      endDate: endInput.value
    });
    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }
    showToast('Бронирование создано', 'success');
    window.location.hash = `#/checkout/${result.order.id}`;
  });

  return container;
}

export { renderItemPage };
