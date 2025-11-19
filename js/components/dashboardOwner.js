import { state, addEquipment, getOrdersByOwner, logout } from '../state.js';
import { openModal, showToast } from './ui.js';

function renderDashboardOwner() {
  const user = state.currentUser;
  const container = document.createElement('div');
  container.className = 'main-container';
  if (!user || user.role !== 'owner') {
    container.innerHTML = '<section class="surface"><h2>Нужен вход арендодателя</h2><p>Авторизуйтесь, чтобы управлять техникой.</p><button class="btn btn-primary" data-action="auth">Перейти</button></section>';
    container.querySelector('[data-action="auth"]').addEventListener('click', () => {
      window.location.hash = '#/auth';
    });
    return container;
  }

  const equipment = state.equipment.filter((eq) => eq.ownerId === user.id);
  const orders = getOrdersByOwner(user.id).map((order) => ({
    ...order,
    equipment: state.equipment.find((eq) => eq.id === order.equipmentId)
  }));
  const revenue = orders.filter((o) => ['paid', 'in_progress', 'completed'].includes(o.status)).reduce((sum, o) => sum + o.total, 0);

  container.innerHTML = `
    <section class="surface">
      <div class="pane-head">
        <div>
          <p class="badge">Кабинет арендодателя</p>
          <h2>${user.name.split(' ')[0]}, ваша техника</h2>
        </div>
        <div style="display:flex;gap:var(--space-xs);flex-wrap:wrap;">
          <button class="btn btn-ghost" data-action="logout">Выйти</button>
          <button class="btn btn-primary" data-action="new">Добавить оборудование</button>
        </div>
      </div>
      <div class="stat-row">
        <article class="stat-card"><p>Позиций</p><strong>${equipment.length}</strong></article>
        <article class="stat-card"><p>Заказы</p><strong>${orders.length}</strong></article>
        <article class="stat-card"><p>Выручка</p><strong>${revenue.toLocaleString('ru-RU')} ₽</strong></article>
      </div>
    </section>

    <section class="surface">
      <h2>Ваш каталог</h2>
      <div class="card-grid" id="equipment-list"></div>
    </section>

    <section class="surface">
      <h2>Заказы</h2>
      <div class="card-grid" id="orders-list"></div>
    </section>
  `;

  const eqList = container.querySelector('#equipment-list');
  if (!equipment.length) {
    eqList.innerHTML = '<p style="color:var(--color-text-muted);">Пока пусто.</p>';
  } else {
    equipment.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <strong>${item.name}</strong>
        <p>${item.location} · ${item.pricePerDay.toLocaleString('ru-RU')} ₽/сут</p>
        <button class="btn btn-secondary" data-action="view">Посмотреть</button>
      `;
      card.querySelector('[data-action="view"]').addEventListener('click', () => {
        window.location.hash = `#/item/${item.id}`;
      });
      eqList.appendChild(card);
    });
  }

  const orderList = container.querySelector('#orders-list');
  if (!orders.length) {
    orderList.innerHTML = '<p style="color:var(--color-text-muted);">Заказов пока нет.</p>';
  } else {
    orders.forEach((order) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <strong>${order.equipment?.name || 'Оборудование'}</strong>
        <p>${order.startDate} — ${order.endDate}</p>
        <p>${order.total.toLocaleString('ru-RU')} ₽</p>
      `;
      orderList.appendChild(card);
    });
  }

  container.querySelector('[data-action="logout"]').addEventListener('click', () => {
    logout();
    showToast('Вы вышли из аккаунта', 'info');
    window.location.hash = '#/auth';
  });

  container.querySelector('[data-action="new"]').addEventListener('click', () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <div class="form-group"><label>Название</label><input name="name" required /></div>
      <div class="form-group"><label>Описание</label><textarea name="description" required></textarea></div>
      <div class="form-group"><label>Категория</label><input name="category" required /></div>
      <div class="form-group"><label>Локация</label><input name="location" required /></div>
      <div class="form-group"><label>Цена/сут</label><input type="number" name="price" required min="500" /></div>
      <div class="form-group"><label>Фото (URL)</label><input name="image" placeholder="https://" /></div>
    `;
    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const formData = new FormData(form);
      const payload = {
        name: formData.get('name'),
        description: formData.get('description'),
        category: formData.get('category'),
        location: formData.get('location'),
        pricePerDay: Number(formData.get('price')),
        image: formData.get('image') || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=60'
      };
      const result = addEquipment(payload);
      if (!result.success) {
        showToast(result.message, 'error');
        return;
      }
      showToast('Оборудование добавлено', 'success');
      window.location.hash = '#/catalog';
    });
    openModal({
      title: 'Новая позиция',
      content: form,
      actions: [
        { label: 'Сохранить', handler: () => form.requestSubmit() },
        { label: 'Отмена', variant: 'secondary', handler: (close) => close() }
      ]
    });
  });

  return container;
}

export { renderDashboardOwner };
