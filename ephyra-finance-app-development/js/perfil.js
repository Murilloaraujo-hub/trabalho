/* ===== EPHYRA FINANCE — PROFILE ===== */
const Perfil = {
  render(data, user) {
    const t = Transacoes.totals(data);
    const ms = MetasModule.stats(data);
    const dias = data.config?.diasUsando || 1;
    const container = U.qs('#page-perfil');

    container.innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Perfil</h2><p class="page-subtitle">Suas informações e estatísticas</p></div>
        <button class="btn btn-outline btn-sm" onclick="App.showEditProfile()"><i class="fas fa-pen"></i> Editar</button>
      </div>

      <div class="card flex gap-lg items-center" style="flex-wrap:wrap">
        <img src="${user.foto || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user.nome)}" class="avatar avatar-xl" alt="Avatar">
        <div style="flex:1;min-width:200px">
          <h2 class="text-xl fw-800">${user.nome}</h2>
          <p class="text-secondary">${user.email}</p>
          <p class="text-xs text-muted" style="margin-top:.3rem"><i class="fas fa-calendar-alt"></i> Membro desde ${U.date(user.dataCadastro)}</p>
          <div style="margin-top:.75rem">${XP.renderBar(data)}</div>
        </div>
      </div>

      <div class="stats-grid stagger" style="margin-top:1.5rem">
        <div class="stat-card"><div class="stat-icon" style="background:rgba(16,185,129,.12);color:#10b981"><i class="fas fa-wallet"></i></div><div><div class="stat-value">${U.money(data.saldo)}</div><div class="stat-label">Saldo</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:rgba(16,185,129,.12);color:#10b981"><i class="fas fa-arrow-up"></i></div><div><div class="stat-value">${U.money(t.receitas)}</div><div class="stat-label">Receitas</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:rgba(239,68,68,.12);color:#ef4444"><i class="fas fa-arrow-down"></i></div><div><div class="stat-value">${U.money(t.despesas)}</div><div class="stat-label">Despesas</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:rgba(59,130,246,.12);color:#3b82f6"><i class="fas fa-exchange-alt"></i></div><div><div class="stat-value">${U.money(t.receitas + t.despesas)}</div><div class="stat-label">Total Mov.</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:rgba(124,58,237,.12);color:#7c3aed"><i class="fas fa-bullseye"></i></div><div><div class="stat-value">${ms.concluidas}/${ms.total}</div><div class="stat-label">Metas</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:rgba(245,158,11,.12);color:#f59e0b"><i class="fas fa-trophy"></i></div><div><div class="stat-value">${(data.conquistas||[]).length}</div><div class="stat-label">Conquistas</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:rgba(236,72,153,.12);color:#ec4899"><i class="fas fa-calendar-check"></i></div><div><div class="stat-value">${dias}</div><div class="stat-label">Dias Usando</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:rgba(251,191,36,.12);color:#fbbf24"><i class="fas fa-star"></i></div><div><div class="stat-value">Nv. ${data.nivel||1}</div><div class="stat-label">Nível</div></div></div>
      </div>
    `;
  }
};
