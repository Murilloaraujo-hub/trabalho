/* ===== EPHYRA FINANCE — NOTIFICATIONS ===== */
const Toast = {
  _container: null,
  init() { this._container = U.qs('#toast-container'); },

  show(message, type = 'info', duration = 4000) {
    if (!this._container) this.init();
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = U.el('div', `toast toast-${type}`, `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`);
    this._container.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};
