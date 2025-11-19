import { state, getOrdersByRenter, logout } from '../state.js';
import { openModal, showToast } from './ui.js';

const statusMap = {
  awaiting_payment: { label: 'Ожидает оплаты', badge: 'badge', tone: 'rgba(249, 115, 22, 0.18)' },
  paid: { label: 'Оплачено', badge: 'badge', tone: 'rgba(74, 222, 128, 0.2)' },
  in_progress: { label: 'В процессе', badge: 'badge', tone: 'rgba(124, 140, 255, 0.2)' },
  completed: { label: 'Завершено', badge: 'badge', tone: 'rgba(255, 255, 255, 0.12)' }
};

function renderDashboardRenter() {
  const user = state.currentUser;
  const container = document.createElement('div');
  container.className = 'main-container';
  if (!user || user.role !== 'renter') {
    container.innerHTML = '<section class="surface"><h2>Нужен вход арендатора</h2><p>Войдите или зарегистрируйтесь, чтобы увидеть заказы.</p><button class="btn btn-primary" data-action="auth">Перейти</button></section>';
    container.querySelector('[data-action="auth"]').addEventListener('click', () => {
      window.location.hash = '#/auth';
    });
    return container;
  }

  const orders = getOrdersByRenter(user.id).map((order) => ({
    ...order,
    equipment: state.equipment.find((eq) => eq.id === order.equipmentId)
  }));

  container.innerHTML = `
    <section class="surface">
      <div class="pane-head">
        <div>
          <p class="badge">Личный кабинет арендатора</p>
          <h2>Привет, ${user.name.split(' ')[0]}</h2>
          <p>Ваша история аренды обновляется в реальном времени.</p>
        </div>
        <button class="btn btn-ghost" data-action="logout">Выйти</button>
      </div>
      <div class="card-grid" id="orders-grid"></div>
    </section>
  `;

  container.querySelector('[data-action="logout"]').addEventListener('click', () => {
    logout();
    showToast('Вы вышли из аккаунта', 'info');
    window.location.hash = '#/auth';
  });

  const grid = container.querySelector('#orders-grid');
  if (!orders.length) {
    grid.innerHTML = '<p style="color:var(--color-text-muted);">Заказов пока нет — переходите в каталог.</p>';
    return container;
  }

  orders.forEach((order) => {
    const meta = statusMap[order.status] || statusMap.awaiting_payment;
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="badge" style="background:${meta.tone};">${meta.label}</div>
      <strong>${order.equipment?.name || 'Оборудование'}</strong>
      <p>${order.startDate} — ${order.endDate}</p>
      <p><b>${order.total.toLocaleString('ru-RU')} ₽</b></p>
      <div style="display:flex;gap:var(--space-sm);">
        ${order.status === 'awaiting_payment' ? '<button class="btn btn-primary" data-action="pay">Оплатить</button>' : ''}
        <button class="btn btn-secondary" data-action="details">Детали</button>
      </div>
    `;
    const detailsBtn = card.querySelector('[data-action="details"]');
    detailsBtn.addEventListener('click', () => {
      openModal({
        title: order.equipment?.name || 'Заказ',
        content: `<p>${meta.label}</p><p>Даты: ${order.startDate} – ${order.endDate}</p><p>Сумма: ${order.total.toLocaleString('ru-RU')} ₽</p>`,
        actions: [{ label: 'Закрыть', variant: 'secondary', handler: (close) => close() }]
      });
    });
    const payBtn = card.querySelector('[data-action="pay"]');
    if (payBtn) {
      payBtn.addEventListener('click', () => {
        window.location.hash = `#/checkout/${order.id}`;
      });
    }
    grid.appendChild(card);
  });

  return container;
}

export { renderDashboardRenter };
