import { renderHome } from './components/home.js';
import { renderCatalog } from './components/catalog.js';
import { renderItemPage } from './components/itemPage.js';
import { renderAuth } from './components/auth.js';
import { renderDashboardRenter } from './components/dashboardRenter.js';
import { renderDashboardOwner } from './components/dashboardOwner.js';
import { renderCheckout } from './components/checkout.js';
import { renderAdmin } from './components/admin.js';
import { renderAbout } from './components/about.js';

const routes = [
  { pattern: /^#\/?$/, render: () => renderHome() },
  { pattern: /^#\/catalog$/, render: (ctx) => renderCatalog({ query: ctx.query }) },
  { pattern: /^#\/about$/, render: () => renderAbout() },
  { pattern: /^#\/auth$/, render: () => renderAuth() },
  { pattern: /^#\/item\/([^/]+)$/, render: (ctx) => renderItemPage({ id: ctx.matches[1] }) },
  { pattern: /^#\/dashboard-renter$/, render: () => renderDashboardRenter() },
  { pattern: /^#\/dashboard-owner$/, render: () => renderDashboardOwner() },
  { pattern: /^#\/checkout\/([^/]+)$/, render: (ctx) => renderCheckout({ id: ctx.matches[1] }) },
  { pattern: /^#\/admin$/, render: () => renderAdmin() }
];

let routeChangeCallback = () => {};

function resolve(hash) {
  const normalized = hash || '#/';
  const [path, search = ''] = normalized.split('?');
  const query = new URLSearchParams(search);
  for (const route of routes) {
    const matches = path.match(route.pattern);
    if (matches) {
      return { route, context: { hash: normalized, path, query, matches } };
    }
  }
  return null;
}

function renderNotFound() {
  const wrap = document.createElement('section');
  wrap.className = 'section';
  wrap.innerHTML = '<h2>Страница не найдена</h2><p>Вернитесь на <a href="#/">главную</a>.</p>';
  return wrap;
}

function renderCurrentRoute() {
  const app = document.getElementById('app');
  if (!app) return;
  const hash = window.location.hash || '#/';
  const match = resolve(hash);
  const view = match ? match.route.render(match.context) : renderNotFound();
  app.innerHTML = '';
  app.appendChild(view);
  routeChangeCallback(hash);
  app.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initRouter(onRouteChange) {
  routeChangeCallback = onRouteChange || (() => {});
  window.addEventListener('hashchange', renderCurrentRoute);
  if (!window.location.hash) {
    window.location.hash = '#/';
  }
  renderCurrentRoute();
}

function rerenderRoute() {
  renderCurrentRoute();
}

function navigate(hash) {
  window.location.hash = hash;
}

export { initRouter, navigate, rerenderRoute };
