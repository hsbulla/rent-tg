function renderAbout() {
  const container = document.createElement('div');
  container.className = 'main-container';
  container.innerHTML = `
    <section class="surface">
      <h2>О платформе RentHub v2</h2>
      <p>Это экспериментальная версия Telegram Mini App, показывающая путь аренды оборудования целиком в браузере. Все данные моковые и живут в памяти.</p>
      <div class="card-grid">
        <article class="card">
          <p class="badge">UX</p>
          <strong>Цель</strong>
          <p>Показать, как могут выглядеть реальные процессы: поиск, оплата, статусы, аналитика.</p>
        </article>
        <article class="card">
          <p class="badge">Stack</p>
          <strong>Только HTML + CSS + JS</strong>
          <p>Без библиотек, без серверов — всё работает прямо внутри WebApp.</p>
        </article>
        <article class="card">
          <p class="badge">Сценарии</p>
          <strong>Гость · Арендатор · Арендодатель · Админ</strong>
          <p>Каждая роль имеет собственные страницы и действия.</p>
        </article>
      </div>
    </section>
  `;
  return container;
}

export { renderAbout };
