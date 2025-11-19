import { register, login } from '../state.js';
import { showToast } from './ui.js';

const demoAccounts = [
  { id: 'renter', label: 'Демо арендатора', email: 'renter@renthub.dev', password: 'demo123' },
  { id: 'owner', label: 'Демо арендодателя', email: 'owner@renthub.dev', password: 'demo123' }
];

function renderAuth() {
  const container = document.createElement('div');
  container.className = 'main-container';
  container.innerHTML = `
    <section class="surface auth-shell">
      <p class="badge">Личный доступ</p>
      <h2>Вход и регистрация</h2>
      <p>Версия 2 поддерживает быстрые демо-логины. После авторизации откроется соответствующий кабинет.</p>
      <div class="quick-grid">
        ${demoAccounts
          .map((demo) => `<button class="btn btn-secondary" type="button" data-demo="${demo.id}">${demo.label}</button>`)
          .join('')}
      </div>
      <div class="tabs" role="tablist" style="margin-top:var(--space-md);">
        <button class="active" data-tab="login">Войти</button>
        <button data-tab="register">Регистрация</button>
      </div>
      <div class="auth-panel" style="margin-top:var(--space-md);">
        <form class="auth-card" data-form="login">
          <div class="form-group"><label>Email</label><input type="email" name="email" required /></div>
          <div class="form-group"><label>Пароль</label><input type="password" name="password" required /></div>
          <p class="form-note" data-error="login"></p>
          <button class="btn btn-primary" type="submit">Войти</button>
        </form>
        <form class="auth-card" data-form="register" hidden>
          <div class="form-group"><label>Имя</label><input name="name" required /></div>
          <div class="form-group"><label>Email</label><input type="email" name="email" required /></div>
          <div class="form-group"><label>Роль</label>
            <div class="switch-field">
              <label><input type="radio" name="role" value="renter" checked /><span>Арендатор</span></label>
              <label><input type="radio" name="role" value="owner" /><span>Арендодатель</span></label>
            </div>
          </div>
          <div class="form-group"><label>Пароль</label><input type="password" name="password" required minlength="4" /></div>
          <label style="display:flex;gap:8px;align-items:center;font-size:14px;"><input type="checkbox" name="terms" required />Я принимаю условия</label>
          <p class="form-note" data-error="register"></p>
          <button class="btn btn-primary" type="submit">Создать аккаунт</button>
        </form>
      </div>
    </section>
  `;

  const tabs = container.querySelectorAll('.tabs button');
  const loginForm = container.querySelector('[data-form="login"]');
  const registerForm = container.querySelector('[data-form="register"]');
  const loginError = container.querySelector('[data-error="login"]');
  const registerError = container.querySelector('[data-error="register"]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((btn) => btn.classList.remove('active'));
      tab.classList.add('active');
      const showLogin = tab.dataset.tab === 'login';
      loginForm.hidden = !showLogin;
      registerForm.hidden = showLogin;
      loginError.textContent = '';
      registerError.textContent = '';
    });
  });

  container.querySelectorAll('[data-demo]').forEach((button) => {
    button.addEventListener('click', () => {
      const demo = demoAccounts.find((d) => d.id === button.dataset.demo);
      if (!demo) return;
      loginForm.querySelector('input[name="email"]').value = demo.email;
      loginForm.querySelector('input[name="password"]').value = demo.password;
      tabs[0].click();
      showToast(`${demo.label} заполнен`, 'info');
    });
  });

  loginForm.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(loginForm);
    const result = login(formData.get('email'), formData.get('password'));
    if (!result.success) {
      loginError.textContent = result.message;
      return;
    }
    showToast('Вход выполнен', 'success');
    window.location.hash = result.user.role === 'owner' ? '#/dashboard-owner' : '#/dashboard-renter';
  });

  registerForm.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(registerForm);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role')
    };
    if (!payload.email.includes('@')) {
      registerError.textContent = 'Введите корректный email';
      return;
    }
    const result = register(payload);
    if (!result.success) {
      registerError.textContent = result.message;
      return;
    }
    showToast('Регистрация успешна', 'success');
    window.location.hash = payload.role === 'owner' ? '#/dashboard-owner' : '#/dashboard-renter';
  });

  return container;
}

export { renderAuth };
