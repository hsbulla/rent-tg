import { state, getAggregatedStats, getOrdersByRenter, getOrdersByOwner } from '../state.js';
import { showToast } from './ui.js';

const quickFlows = [
  { id: 'fast-book', title: 'Мгновенная бронь', text: 'Заполните даты и сумму будет рассчитана автоматически.', icon: '⚡' },
  { id: 'owner-demo', title: 'Добавить технику', text: 'Загрузите фото и цену — карточка появится мгновенно.', icon: '🛠' },
  { id: 'nearby', title: 'Рядом с вами', text: 'Москва, Санкт-Петербург и область.', icon: '📍' }
];

function renderHome() {
  const stats = getAggregatedStats();
  const container = document.createElement('div');
  container.className = 'main-container';
  container.innerHTML = `
    <section class="surface hero">
      <span class="hero-badge">RentHub v2 · Telegram Mini App</span>
      <h1>Цифровая аренда строительного и бытового оборудования прямо в Telegram</h1>
      <p>Выбирайте нужные позиции, бронируйте даты, оплачивайте и отслеживайте статусы. Все данные хранится в песочнице без сервера.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-action="go-catalog">Открыть каталог</button>
        <button class="btn btn-secondary" data-action="open-auth">Личный кабинет</button>
      </div>
      <div class="hero-trust">
        <span>🔒 SSL + Telegram WebApp</span>
        <span>🚚 5 минут до брони</span>
        <span>⭐️ Демонстрационный опыт</span>
      </div>
    </section>

    <section class="surface">
      <h2>Живые показатели</h2>
      <div class="stat-row">
        <article class="stat-card">
          <p>Пользователи</p>
          <strong>${stats.totalUsers}</strong>
        </article>
        <article class="stat-card">
          <p>Активные заказы</p>
          <strong>${stats.activeOrders}</strong>
        </article>
        <article class="stat-card">
          <p>Каталог</p>
          <strong>${state.equipment.length}</strong>
        </article>
        <article class="stat-card">
          <p>Оборот (мок)</p>
          <strong>${stats.revenue.toLocaleString('ru-RU')} ₽</strong>
        </article>
      </div>
    </section>

    <section class="surface">
      <h2>Быстрые сценарии</h2>
      <div class="quick-grid">
        ${quickFlows
          .map(
            (flow) => `
            <article class="quick-card" data-flow="${flow.id}">
              <span class="badge">${flow.icon}</span>
              <strong>${flow.title}</strong>
              <p>${flow.text}</p>
            </article>`
          )
          .join('')}
      </div>
    </section>

    <section class="surface">
      <h2>Что нового в версии 2</h2>
      <div class="card-grid">
        <article class="card">
          <p class="badge">Liquid UI</p>
          <strong>Полностью новый тёмный интерфейс</strong>
          <p>Стеклянные панели, плавающие CTA и акцент на мобильном опыте.</p>
        </article>
        <article class="card">
          <p class="badge">Mini App</p>
          <strong>Оптимизация под Telegram</strong>
          <p>Работает внутри Telegram, поддерживает хэптики, режим во весь экран и закрепление на рабочем столе.</p>
        </article>
        <article class="card">
          <p class="badge">Сценарии</p>
          <strong>Быстрые фильтры и пульс</strong>
          <p>Преднастроенные сценарии включают поиск техники поблизости и демо дохода.</p>
        </article>
      </div>
    </section>
  `;

  container.querySelector('[data-action="go-catalog"]').addEventListener('click', () => {
    window.location.hash = '#/catalog';
  });
  container.querySelector('[data-action="open-auth"]').addEventListener('click', () => {
    window.location.hash = state.currentUser ? (state.currentUser.role === 'owner' ? '#/dashboard-owner' : '#/dashboard-renter') : '#/auth';
  });
  container.querySelectorAll('[data-flow]').forEach((card) => {
    card.addEventListener('click', () => {
      switch (card.dataset.flow) {
        case 'fast-book':
          window.location.hash = '#/catalog';
          showToast('Откройте карточку, выберите даты и подтвердите бронирование', 'info');
          break;
        case 'owner-demo':
          window.location.hash = state.currentUser?.role === 'owner' ? '#/dashboard-owner' : '#/auth';
          showToast('Арендодатели могут добавлять технику из личного кабинета', 'info');
          break;
        case 'nearby':
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('catalogLocation', 'Москва');
          }
          window.location.hash = '#/catalog';
          break;
        default:
          window.location.hash = '#/catalog';
      }
    });
  });

  return container;
}

export { renderHome };
