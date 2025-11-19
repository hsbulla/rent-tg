const tg = window.Telegram?.WebApp || null;

function applyTheme(params = {}) {
  const resolved = {
    '--color-bg': params.secondary_bg_color || 'rgba(9, 14, 26, 0.96)',
    '--color-bg-elevated': params.bg_color || 'rgba(19, 28, 51, 0.88)',
    '--color-text-main': params.text_color || '#f8fbff',
    '--color-text-secondary': params.hint_color || 'rgba(248, 251, 255, 0.7)'
  };
  Object.entries(resolved).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

function initTelegramEnvironment() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  applyTheme(tg.themeParams);
  tg.onEvent?.('themeChanged', () => applyTheme(tg.themeParams));
  tg.setHeaderColor?.('#0b1220');
  tg.setBackgroundColor?.('#050913');
}

function requestHomeShortcut() {
  if (!tg) {
    alert('Откройте приложение в Telegram, чтобы добавить его на домашний экран.');
    return;
  }
  if (typeof tg.showPopup === 'function') {
    tg.showPopup({
      title: 'Добавление на рабочий стол',
      message: 'Откройте меню ⋮ или ⋯ в Telegram и выберите «Добавить на главный экран». Telegram закрепит приложение с иконкой RentHub.',
      buttons: [{ id: 'ok', type: 'close', text: 'Понятно' }]
    });
  }
}

function useHaptics(pattern = 'light') {
  tg?.HapticFeedback?.impactOccurred(pattern);
}

function isTelegram() {
  return Boolean(tg);
}

export { initTelegramEnvironment, requestHomeShortcut, useHaptics, isTelegram };
