/* ===== EPHYRA FINANCE — XP & LEVEL SYSTEM ===== */
const XP = {
  PER_LEVEL: 100,

  add(data, amount, reason) {
    data.xp = (data.xp || 0) + amount;
    const needed = this.needed(data);
    if (data.xp >= needed) {
      data.xp -= needed;
      data.nivel = (data.nivel || 1) + 1;
      Toast.success(`🎉 Você subiu para o Nível ${data.nivel}!`);
      this.animateLevelUp();
    }
    EphyraStorage.save(data);
  },

  needed(data) { return (data.nivel || 1) * this.PER_LEVEL; },
  progress(data) { return U.pct(data.xp || 0, this.needed(data)); },

  animateLevelUp() {
    const el = U.qs('.xp-bar-container');
    if (el) { el.classList.add('anim-level'); setTimeout(() => el.classList.remove('anim-level'), 900); }
  },

  renderBar(data) {
    const pct = this.progress(data);
    return `<div class="xp-bar-container">
      <div class="flex justify-between items-center gap-sm" style="margin-bottom:.3rem">
        <span class="badge badge-primary"><i class="fas fa-star"></i> Nível ${data.nivel || 1}</span>
        <span class="text-xs text-muted">${data.xp || 0} / ${this.needed(data)} XP</span>
      </div>
      <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }
};
