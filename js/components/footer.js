import { state } from '../state.js';

const navConfig = [
  { hash: '#/', label: 'Главная', icon: '🏠' },
  { hash: '#/catalog', label: 'Каталог', icon: '🧰' },
  { hash: '#/dashboard', label: 'Мой кабинет', icon: '📋' },
  { hash: '#/about', label: 'О сервисе', icon: '❔' }
];

function resolveDashboard() {
  if (!state.currentUser) return '#/auth';
  return state.currentUser.role === 'owner' ? '#/dashboard-owner' : '#/dashboard-renter';
}

function renderFooter(activeHash = '#/') {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  const items = navConfig.map((item) => {
    if (item.hash === '#/dashboard') {
      return { ...item, hash: resolveDashboard(), label: state.currentUser ? 'Кабинет' : 'Войти' };
    }
    return item;
  });
  footer.innerHTML = `
    <nav class="bottom-nav">
      ${items
        .map(
          (item) => `
        <button data-route="${item.hash}" class="${activeHash.startsWith(item.hash) ? 'active' : ''}">
          <div>${item.icon}</div>
          <span>${item.label}</span>
        </button>`
        )
        .join('')}
    </nav>
  `;
  footer.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.hash = button.dataset.route;
    });
  });
}

export { renderFooter };
