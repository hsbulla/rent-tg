const toastRoot = document.getElementById('toast-root');
const modalRoot = document.getElementById('modal-root');
let activeModal = null;

function showToast(message, type = 'info') {
  if (!toastRoot) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  toastRoot.appendChild(toast);
  setTimeout(() => toast.classList.add('hide'), 2800);
  setTimeout(() => toast.remove(), 3200);
}

function closeModal() {
  if (activeModal) {
    activeModal.remove();
    activeModal = null;
  }
}

function openModal({ title, content, actions = [] }) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.addEventListener('click', (evt) => {
    if (evt.target === overlay) {
      closeModal();
    }
  });

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
      <h3 style="margin:0;">${title}</h3>
      <button class="btn btn-secondary" style="padding:6px 12px;" aria-label="Закрыть">×</button>
    </div>
    <div class="modal-body"></div>
    <div class="modal-footer" style="display:flex;gap:12px;margin-top:18px;"></div>
  `;
  modal.querySelector('button').addEventListener('click', closeModal);

  const body = modal.querySelector('.modal-body');
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }

  const footer = modal.querySelector('.modal-footer');
  actions.forEach(({ label, variant = 'primary', handler }) => {
    const btn = document.createElement('button');
    btn.className = `btn btn-${variant}`;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (handler) handler(closeModal);
    });
    footer.appendChild(btn);
  });

  overlay.appendChild(modal);
  modalRoot.appendChild(overlay);
  activeModal = overlay;
}

export { showToast, openModal, closeModal };
