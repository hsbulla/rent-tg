function renderHeader() {
  const headerEl = document.getElementById('site-header');
  if (!headerEl) return;
  headerEl.innerHTML = '';
}

export { renderHeader };
