import { getAggregatedStats, state, loginAdmin, logoutAdmin } from '../state.js';
import { showToast } from './ui.js';

function renderAdmin() {
  const container = document.createElement('div');
  container.className = 'main-container';
  if (!state.adminSession) {
    container.innerHTML = `
      <section class="surface">
        <h2>Админ-панель</h2>
        <p>Версия 2 показывает агрегаты по локальному состоянию. Введите демо данные admin@renthub.dev / admin123.</p>
        <form class="auth-card" data-form>
          <div class="form-group"><label>Email</label><input type="email" name="email" required /></div>
          <div class="form-group"><label>Пароль</label><input type="password" name="password" required /></div>
          <button class="btn btn-primary" type="submit">Войти</button>
        </form>
      </section>
    `;
    const form = container.querySelector('[data-form]');
    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const formData = new FormData(form);
      const result = loginAdmin(formData.get('email'), formData.get('password'));
      if (!result.success) {
        showToast(result.message, 'error');
        return;
      }
      showToast('Администратор авторизован', 'success');
    });
    return container;
  }

  const stats = getAggregatedStats();
  container.innerHTML = `
    <section class="surface">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-sm);flex-wrap:wrap;">
        <div>
          <p class="badge">Admin Mode</p>
          <h2>Сводка платформы</h2>
          <p>Данные основаны на текущем состоянии браузера.</p>
        </div>
        <button class="btn btn-ghost" data-action="logout">Выйти</button>
      </div>
      <div class="stat-row">
        <article class="stat-card"><p>Пользователи</p><strong>${stats.totalUsers}</strong></article>
        <article class="stat-card"><p>Арендаторы</p><strong>${stats.renters}</strong></article>
        <article class="stat-card"><p>Арендодатели</p><strong>${stats.owners}</strong></article>
        <article class="stat-card"><p>Оборот</p><strong>${stats.revenue.toLocaleString('ru-RU')} ₽</strong></article>
      </div>
      <div class="table-card">
        <table>
          <thead><tr><th>Заказ</th><th>Статус</th><th>Сумма</th></tr></thead>
          <tbody>
            ${state.orders
              .map(
                (order) => `
                <tr>
                  <td>${order.id}</td>
                  <td>${order.status}</td>
                  <td>${order.total.toLocaleString('ru-RU')} ₽</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  container.querySelector('[data-action="logout"]').addEventListener('click', () => {
    logoutAdmin();
    showToast('Сессия завершена', 'info');
  });

  return container;
}

export { renderAdmin };
