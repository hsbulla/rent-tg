const STORAGE_KEYS = {
  userId: 'sleepApp.userId',
  settings: 'sleepApp.settings',
  days: 'sleepApp.days',
  stats: 'sleepApp.stats',
};

const CHECKLIST_TASKS = [
  'За 1 час до сна — без телефонов',
  'Не пью кофе после 16:00',
  'Проветриваю комнату перед сном',
  'Короткая растяжка / дыхание',
];

const telegram = window.Telegram?.WebApp;

const state = {
  userId: localStorage.getItem(STORAGE_KEYS.userId) || 'local-user',
  settings: parseJSON(localStorage.getItem(STORAGE_KEYS.settings)),
  days: parseJSON(localStorage.getItem(STORAGE_KEYS.days)) || [],
  stats:
    parseJSON(localStorage.getItem(STORAGE_KEYS.stats)) ||
    {
      current: 0,
      best: 0,
    },
};

const onboardingSection = document.getElementById('onboarding');
const todaySection = document.getElementById('todayView');
const progressSection = document.getElementById('progressView');
const toastEl = document.getElementById('toast');

const currentWakeSelect = document.getElementById('currentWakeSelect');
const targetWakeSelect = document.getElementById('targetWakeSelect');
const challengeButtons = document.querySelectorAll('.challenge-options .chip');
const onboardingForm = document.getElementById('onboardingForm');
const onboardingSteps = document.querySelectorAll('.onboarding-step');
const stepDots = document.querySelectorAll('[data-step-indicator]');
const prevStepBtn = document.getElementById('prevStep');
const nextStepBtn = document.getElementById('nextStep');
const startChallengeBtn = document.getElementById('startChallenge');
const summaryCurrent = document.getElementById('summaryCurrent');
const summaryTarget = document.getElementById('summaryTarget');
const summaryDays = document.getElementById('summaryDays');

const statusText = document.getElementById('statusText');
const dayTitle = document.getElementById('dayTitle');
const dayNumberEl = document.getElementById('dayNumber');
const totalDaysEl = document.getElementById('totalDays');
const progressPercentEl = document.getElementById('progressPercent');
const progressDaysEl = document.getElementById('progressDays');
const progressCircle = document.querySelector('.progress-ring .indicator');
const todayShiftEl = document.getElementById('todayShift');
const streakText = document.getElementById('streakText');
const streakBadge = document.getElementById('streakBadge');
const sleepTargetEl = document.getElementById('sleepTarget');
const wakeTargetEl = document.getElementById('wakeTarget');
const checklistEl = document.getElementById('checklist');
const actualSleepSelect = document.getElementById('actualSleepSelect');
const actualWakeSelect = document.getElementById('actualWakeSelect');
const moodPicker = document.getElementById('moodPicker');
const saveDayButton = document.getElementById('saveDay');
const restartButton = document.getElementById('restartButton');
const backTodayBtn = document.getElementById('backToday');
const openProgressButton = document.getElementById('openProgress');

const progressGrid = document.getElementById('progressGrid');
const dayDetails = document.getElementById('dayDetails');
const currentStreakStat = document.getElementById('currentStreakStat');
const bestStreakStat = document.getElementById('bestStreakStat');
const greenCountEl = document.getElementById('greenCount');
const avgWakeEl = document.getElementById('avgWake');

const moodState = {
  selected: null,
};

let onboardingStep = 0;
let activeView = 'onboarding';
let fullscreenGestureAttached = false;
let fullscreenActive = false;

initTimeSelect(currentWakeSelect, '08:00');
initTimeSelect(targetWakeSelect, '07:00');
initTimeSelect(actualSleepSelect);
initTimeSelect(actualWakeSelect);

registerEvents();
bootstrapTelegram();
updateOnboardingSummary();
updateOnboardingStepUI();
refreshUI();

function parseJSON(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn('Failed to parse JSON', error);
    return null;
  }
}

function initTimeSelect(select, defaultValue) {
  select.innerHTML = '<option value="">—</option>';
  for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
    const option = document.createElement('option');
    option.value = minutes;
    option.textContent = formatTime(minutes);
    if (defaultValue && option.textContent === defaultValue) {
      option.selected = true;
    }
    select.appendChild(option);
  }
}

function registerEvents() {
  challengeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      challengeButtons.forEach((b) => b.classList.remove('chip-active'));
      btn.classList.add('chip-active');
      summaryDays.textContent = btn.dataset.days;
      updateOnboardingSummary();
    });
  });

  prevStepBtn.addEventListener('click', handlePrevStep);
  nextStepBtn.addEventListener('click', handleNextStep);
  currentWakeSelect.addEventListener('change', updateOnboardingSummary);
  targetWakeSelect.addEventListener('change', updateOnboardingSummary);

  onboardingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const currentWake = Number(currentWakeSelect.value);
    const targetWake = Number(targetWakeSelect.value);
    const selectedBtn = document.querySelector('.challenge-options .chip-active');
    const challengeDays = Number(selectedBtn?.dataset.days || 14);

    if (Number.isNaN(currentWake) || Number.isNaN(targetWake)) {
      showToast('Выбери время подъёма');
      return;
    }

    const plan = generatePlan({ currentWake, targetWake, challengeDays });
    const startDate = startOfDay(new Date()).toISOString();

    state.settings = {
      currentWake,
      targetWake,
      challengeDays,
      startDate,
    };
    state.days = plan;
    state.stats = { current: 0, best: 0 };

    persistState();
    attemptFullscreen(true);
    activeView = 'todayView';
    refreshUI();
  });

  openProgressButton.addEventListener('click', () => showView('progressView'));

  restartButton.addEventListener('click', () => {
    const ok = confirm('Сбросить прогресс и начать заново?');
    if (!ok) return;
    state.settings = null;
    state.days = [];
    state.stats = { current: 0, best: 0 };
    localStorage.removeItem(STORAGE_KEYS.settings);
    localStorage.removeItem(STORAGE_KEYS.days);
    localStorage.removeItem(STORAGE_KEYS.stats);
    onboardingStep = 0;
    challengeButtons.forEach((btn) => {
      btn.classList.toggle('chip-active', btn.dataset.days === '14');
    });
    summaryDays.textContent = '14';
    updateOnboardingStepUI();
    updateOnboardingSummary();
    refreshUI();
  });

  backTodayBtn.addEventListener('click', () => showView('todayView'));

  checklistEl.addEventListener('change', (event) => {
    if (!event.target.matches('input[type="checkbox"]')) return;
    const dayIndex = getCurrentDayIndex();
    if (dayIndex == null || !state.days[dayIndex]) return;
    const itemIndex = Number(event.target.dataset.index);
    state.days[dayIndex].checklist[itemIndex] = event.target.checked;
    persistDays();
  });

  moodPicker.addEventListener('click', (event) => {
    if (!event.target.matches('button')) return;
    moodState.selected = event.target.dataset.mood;
    Array.from(moodPicker.children).forEach((btn) => btn.classList.remove('active'));
    event.target.classList.add('active');
  });

  saveDayButton.addEventListener('click', saveCurrentDay);

  progressGrid.addEventListener('click', (event) => {
    if (!event.target.matches('button[data-index]')) return;
    const index = Number(event.target.dataset.index);
    const day = state.days[index];
    if (!day) return;
    showDayDetails(day, index);
  });
}

function refreshUI() {
  const hasSettings = Boolean(state.settings && state.days.length);
  onboardingSection.classList.toggle('hidden', hasSettings);
  if (!hasSettings) {
    todaySection.classList.add('hidden');
    progressSection.classList.add('hidden');
    activeView = 'onboarding';
    updateOnboardingSummary();
    updateOnboardingStepUI();
    return;
  }

  if (activeView === 'onboarding') {
    activeView = 'todayView';
  }

  renderToday();
  renderProgress();
  showView(activeView);
}

function showView(viewId) {
  if (viewId === 'todayView') {
    todaySection.classList.remove('hidden');
    progressSection.classList.add('hidden');
    activeView = 'todayView';
  } else if (viewId === 'progressView') {
    progressSection.classList.remove('hidden');
    todaySection.classList.add('hidden');
    activeView = 'progressView';
  }
}

function handleNextStep() {
  if (!validateOnboardingStep(onboardingStep)) return;
  if (onboardingStep < onboardingSteps.length - 1) {
    onboardingStep += 1;
    updateOnboardingStepUI();
  }
}

function handlePrevStep() {
  if (onboardingStep === 0) return;
  onboardingStep -= 1;
  updateOnboardingStepUI();
}

function updateOnboardingStepUI() {
  onboardingSteps.forEach((stepEl, idx) => {
    stepEl.classList.toggle('active', idx === onboardingStep);
  });
  stepDots.forEach((dot) => {
    const index = Number(dot.dataset.stepIndicator);
    dot.classList.toggle('active', index <= onboardingStep);
  });
  if (prevStepBtn) prevStepBtn.disabled = onboardingStep === 0;
  if (nextStepBtn) nextStepBtn.classList.toggle('hidden', onboardingStep === onboardingSteps.length - 1);
  startChallengeBtn?.classList.toggle('hidden', onboardingStep !== onboardingSteps.length - 1);
  updateOnboardingSummary();
}

function updateOnboardingSummary() {
  summaryCurrent.textContent = formatSummaryValue(currentWakeSelect.value);
  summaryTarget.textContent = formatSummaryValue(targetWakeSelect.value);
  const selected = document.querySelector('.challenge-options .chip-active');
  summaryDays.textContent = selected?.dataset.days || summaryDays.textContent || '14';
}

function formatSummaryValue(value) {
  if (value === '' || value == null) return '—';
  const minutes = Number(value);
  return Number.isNaN(minutes) ? '—' : formatTime(minutes);
}

function validateOnboardingStep(stepIndex) {
  if (stepIndex === 0 && !currentWakeSelect.value) {
    showToast('Выбери текущее время подъёма');
    return false;
  }
  if (stepIndex === 1 && !targetWakeSelect.value) {
    showToast('Укажи желаемое время подъёма');
    return false;
  }
  return true;
}

function generatePlan({ currentWake, targetWake, challengeDays }) {
  let diff = targetWake - currentWake;
  if (diff > 12 * 60) diff -= 24 * 60;
  if (diff < -12 * 60) diff += 24 * 60;
  const perDayShift = diff / challengeDays;
  const plan = [];
  const startDate = startOfDay(new Date());

  for (let i = 0; i < challengeDays; i++) {
    let wakeMinutes = roundToQuarter(currentWake + perDayShift * (i + 1));
    if (i === challengeDays - 1) {
      wakeMinutes = targetWake;
    }
    const normalizedWake = normalizeMinutes(wakeMinutes);
    const sleepMinutes = normalizeMinutes(normalizedWake - 8 * 60);
    plan.push({
      date: addDays(startDate, i).toISOString(),
      targetWake: normalizedWake,
      targetSleep: sleepMinutes,
      actualWake: null,
      actualSleep: null,
      mood: null,
      checklist: [false, false],
      color: 'pending',
    });
  }
  return plan;
}

function renderToday() {
  const dayIndex = clampDayIndex(getCurrentDayIndex());
  const totalDays = state.settings.challengeDays;
  totalDaysEl.textContent = totalDays;

  if (dayIndex == null) {
    statusText.textContent = 'Челлендж ещё не начался';
    dayTitle.textContent = 'Начинаем сегодня';
    return;
  }

  const day = state.days[dayIndex];
  if (!day) return;

  dayNumberEl.textContent = dayIndex + 1;
  statusText.textContent = `День ${dayIndex + 1} из ${totalDays}`;
  todayShiftEl.textContent = `Сегодня двигаем утро к ${formatTime(day.targetWake)}`;
  dayTitle.textContent = `Мягко поднимаемся к ${formatTime(state.settings.targetWake)}`;

  sleepTargetEl.textContent = formatTime(day.targetSleep);
  wakeTargetEl.textContent = formatTime(day.targetWake);

  streakText.textContent = `Текущая серия: ${state.stats.current} • Лучшая: ${state.stats.best}`;
  streakBadge.textContent = `+1 к серии, если успеешь до ${formatTime(day.targetWake)}`;

  renderChecklist(day, dayIndex);
  updateLogForm(day);
  updateProgressSummary();
}

function renderChecklist(day, dayIndex) {
  if (!Array.isArray(day.checklist) || day.checklist.length < 2) {
    day.checklist = [false, false];
  }
  const tasks = getTasksForDay(dayIndex);
  checklistEl.innerHTML = '';
  tasks.forEach((text, idx) => {
    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.index = idx;
    checkbox.checked = day.checklist[idx] || false;
    const label = document.createElement('label');
    label.textContent = text;
    li.appendChild(checkbox);
    li.appendChild(label);
    checklistEl.appendChild(li);
  });
}

function updateLogForm(day) {
  actualSleepSelect.value = day.actualSleep ?? '';
  actualWakeSelect.value = day.actualWake ?? '';
  moodState.selected = day.mood;
  Array.from(moodPicker.children).forEach((btn) => btn.classList.toggle('active', btn.dataset.mood === day.mood));
}

function saveCurrentDay() {
  const dayIndex = clampDayIndex(getCurrentDayIndex());
  if (dayIndex == null) {
    showToast('Челлендж не активен');
    return;
  }
  const day = state.days[dayIndex];
  const actualSleep = Number(actualSleepSelect.value);
  const actualWake = Number(actualWakeSelect.value);

  if (Number.isNaN(actualSleep) || Number.isNaN(actualWake)) {
    showToast('Укажи времена сна и подъёма');
    return;
  }

  const mood = moodState.selected;
  const sleepDelta = circularDiff(actualSleep, day.targetSleep);
  const wakeDelta = circularDiff(actualWake, day.targetWake);

  let color = 'red';
  if (sleepDelta <= 30 && wakeDelta <= 30) {
    color = 'green';
  } else if (sleepDelta <= 90 && wakeDelta <= 90) {
    color = 'yellow';
  }

  day.actualSleep = actualSleep;
  day.actualWake = actualWake;
  day.mood = mood;
  day.color = color;

  recomputeStreaks();
  persistDays();
  showToast(getFeedbackByColor(color));
  renderToday();
  renderProgress();
}

function getFeedbackByColor(color) {
  switch (color) {
    case 'green':
      return 'День зачтён! Серия +1 🔥';
    case 'yellow':
      return 'Неплохо, завтра получится ещё лучше';
    default:
      return 'Бывает. Завтра попробуем снова — шаг за шагом.';
  }
}

function recomputeStreaks() {
  let current = 0;
  let best = 0;
  let streak = 0;

  state.days.forEach((day) => {
    if (day.color === 'green') {
      streak += 1;
      if (streak > best) best = streak;
    } else if (day.actualWake != null || day.actualSleep != null) {
      streak = 0;
    }
  });

  current = 0;
  for (let i = state.days.length - 1; i >= 0; i--) {
    const day = state.days[i];
    if (day.color === 'green') {
      current += 1;
    } else if (day.actualWake != null || day.actualSleep != null) {
      break;
    } else {
      continue;
    }
  }

  state.stats = { current, best: Math.max(best, current) };
  persistStats();
}

function renderProgress() {
  progressGrid.innerHTML = '';
  dayDetails.classList.add('hidden');

  state.days.forEach((day, index) => {
    const cell = document.createElement('button');
    cell.dataset.index = index;
    cell.dataset.color = day.color || 'pending';
    cell.textContent = index + 1;
    progressGrid.appendChild(cell);
  });

  updateProgressSummary();
}

function updateProgressSummary() {
  const completedDays = state.days.filter((d) => d.actualWake != null && d.actualSleep != null).length;
  const totalDays = state.settings?.challengeDays || 0;
  const percent = totalDays ? Math.round((completedDays / totalDays) * 100) : 0;
  updateProgressRing(percent, `${completedDays}/${totalDays}`);

  const greenDays = state.days.filter((d) => d.color === 'green').length;
  greenCountEl.textContent = `${greenDays} из ${totalDays}`;
  currentStreakStat.textContent = state.stats.current;
  bestStreakStat.textContent = state.stats.best;
  avgWakeEl.textContent = formatAverageWake();
  progressDaysEl.textContent = `${completedDays}/${totalDays}`;
  progressPercentEl.textContent = `${percent}%`;
}

function showDayDetails(day, index) {
  dayDetails.classList.remove('hidden');
  dayDetails.innerHTML = `
    <strong>День ${index + 1}</strong>
    <span>${formatDate(day.date)}</span>
    <span>Лёг: ${day.actualSleep != null ? formatTime(day.actualSleep) : '—'} | Встал: ${day.actualWake != null ? formatTime(day.actualWake) : '—'}</span>
    <span>Самочувствие: ${mapMood(day.mood)}</span>
  `;
}

function getTasksForDay(dayIndex) {
  const tasks = [];
  for (let i = 0; i < 2; i++) {
    tasks.push(CHECKLIST_TASKS[(dayIndex + i) % CHECKLIST_TASKS.length]);
  }
  return tasks;
}

function roundToQuarter(value) {
  return Math.round(value / 15) * 15;
}

function normalizeMinutes(value) {
  let minutes = Math.round(value);
  while (minutes < 0) minutes += 1440;
  while (minutes >= 1440) minutes -= 1440;
  return minutes;
}

function circularDiff(a, b) {
  const diff = Math.abs(a - b);
  return Math.min(diff, 1440 - diff);
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatTime(minutes) {
  const hrs = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function formatAverageWake() {
  const values = state.days.filter((d) => d.actualWake != null).map((d) => d.actualWake);
  if (!values.length) return '—';
  const sum = values.reduce((acc, val) => acc + val, 0);
  return formatTime(Math.round(sum / values.length));
}

function mapMood(mood) {
  switch (mood) {
    case 'sad':
      return '😞';
    case 'ok':
      return '😐';
    case 'good':
      return '🙂';
    case 'great':
      return '😁';
    default:
      return '—';
  }
}

function updateProgressRing(percent, label) {
  const totalLength = 2 * Math.PI * 52;
  const safePercent = Math.max(0, Math.min(100, percent || 0));
  const dashoffset = totalLength - (safePercent / 100) * totalLength;
  progressCircle.style.strokeDasharray = totalLength;
  progressCircle.style.strokeDashoffset = dashoffset;
  progressPercentEl.textContent = `${safePercent}%`;
  progressDaysEl.textContent = label;
}

function clampDayIndex(index) {
  if (index == null) return null;
  if (!state.settings) return null;
  if (index < 0) return 0;
  return Math.min(index, state.settings.challengeDays - 1);
}

function getCurrentDayIndex() {
  if (!state.settings) return null;
  const startDate = new Date(state.settings.startDate);
  const now = startOfDay(new Date());
  const diff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 0;
  if (diff >= state.settings.challengeDays) return state.settings.challengeDays - 1;
  return diff;
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function persistState() {
  localStorage.setItem(STORAGE_KEYS.userId, state.userId);
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  persistDays();
  persistStats();
}

function persistDays() {
  localStorage.setItem(STORAGE_KEYS.days, JSON.stringify(state.days));
}

function persistStats() {
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(state.stats));
}

function bootstrapTelegram() {
  if (!telegram) return;
  try {
    state.userId = telegram.initDataUnsafe?.user?.id || state.userId;
    localStorage.setItem(STORAGE_KEYS.userId, state.userId);
    telegram.ready();
    telegram.expand?.();
    attemptFullscreen();
    setupFullscreenGesture();
    telegram.onEvent?.('fullscreenChanged', (isFull) => {
      fullscreenActive = Boolean(isFull);
      if (!fullscreenActive) {
        setupFullscreenGesture();
      }
    });
    telegram.onEvent?.('fullscreenFailed', (reason) => {
      console.warn('Fullscreen failed', reason);
      setupFullscreenGesture();
    });
  } catch (error) {
    console.warn('Telegram init failed', error);
  }
}

function attemptFullscreen(force = false) {
  if (!telegram?.requestFullscreen) return;
  if (!force && fullscreenActive) return;
  try {
    telegram.requestFullscreen();
  } catch (error) {
    console.warn('Fullscreen request error', error);
  }
}

function setupFullscreenGesture() {
  if (!telegram?.requestFullscreen || fullscreenGestureAttached || fullscreenActive) return;
  fullscreenGestureAttached = true;
  const handler = () => {
    attemptFullscreen(true);
    document.removeEventListener('pointerup', handler);
    document.removeEventListener('keydown', handler);
    fullscreenGestureAttached = false;
    if (!fullscreenActive) {
      setTimeout(setupFullscreenGesture, 200);
    }
  };
  document.addEventListener('pointerup', handler);
  document.addEventListener('keydown', handler);
}
