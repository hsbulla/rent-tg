import { initRouter, rerenderRoute } from './router.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { subscribe } from './state.js';
import { initTelegramEnvironment } from './tma.js';

function bootstrap() {
  initTelegramEnvironment();
  const currentHash = window.location.hash || '#/';
  renderHeader(currentHash);
  renderFooter(currentHash);
  initRouter((hash) => {
    renderHeader(hash);
    renderFooter(hash);
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);

subscribe(() => {
  const hash = window.location.hash || '#/';
  renderHeader(hash);
  renderFooter(hash);
  rerenderRoute();
});
