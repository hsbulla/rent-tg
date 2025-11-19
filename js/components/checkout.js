import { state, updateOrderStatus } from '../state.js';
import { showToast } from './ui.js';

function renderCheckout({ id }) {
  const container = document.createElement('div');
  container.className = 'main-container';
  const order = state.orders.find((o) => o.id === id);
  const equipment = order ? state.equipment.find((eq) => eq.id === order.equipmentId) : null;
  if (!order || !equipment || state.currentUser?.id !== order.renterId) {
    container.innerHTML = '<section class="surface"><h2>Заказ недоступен</h2><p>Проверьте ссылку или выполните вход.</p></section>';
    return container;
  }

  container.innerHTML = `
    <section class="surface">
      <h2>Оплата</h2>
      <div class="card-grid" style="margin-bottom:var(--space-md);">
        <article class="card"><p class="badge">Техника</p><strong>${equipment.name}</strong></article>
        <article class="card"><p class="badge">Даты</p><strong>${order.startDate} — ${order.endDate}</strong></article>
        <article class="card"><p class="badge">Сумма</p><strong>${order.total.toLocaleString('ru-RU')} ₽</strong></article>
      </div>
      <form class="payment-form">
        <div class="quick-grid">
          <label class="quick-card" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span>Банковская карта</span>
              <input type="radio" name="method" value="card" checked />
            </div>
            <p>PCI DSS · токенизация</p>
          </label>
          <label class="quick-card" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span>СБП</span>
              <input type="radio" name="method" value="sbp" />
            </div>
            <p>Перевод по номеру телефона</p>
          </label>
        </div>
        <button class="btn btn-primary" type="submit">Оплатить</button>
      </form>
    </section>
  `;

  const form = container.querySelector('.payment-form');
  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Обработка…';
    setTimeout(() => {
      updateOrderStatus(order.id, 'paid');
      showToast('Оплата успешна', 'success');
      window.location.hash = '#/dashboard-renter';
    }, 1100);
  });

  return container;
}

export { renderCheckout };
