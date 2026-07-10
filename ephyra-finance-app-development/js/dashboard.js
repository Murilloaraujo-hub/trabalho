/* ===== EPHYRA FINANCE — DASHBOARD RENDERER ===== */
const Dashboard = {
  render(data) {
    const t = Transacoes.totals(data);
    const recent = Transacoes.filter(data).slice(0, 6);
    const ms = MetasModule.stats(data);
    const container = U.qs('#page-dashboard');

    container.innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Dashboard</h2><p class="page-subtitle">Visão geral das suas finanças</p></div></div>

      <!-- Balance Hero -->
      <div class="balance-hero anim-slide-up">
        <p class="balance-label">Saldo Disponível</p>
        <h2 class="balance-amount">${U.money(data.saldo)}</h2>
        <div class="balance-sub">
          <span class="balance-sub-item text-success"><i class="fas fa-arrow-up"></i> ${U.money(t.receitas)}</span>
          <span class="balance-sub-item text-danger"><i class="fas fa-arrow-down"></i> ${U.money(t.despesas)}</span>
          <span class="balance-sub-item text-primary"><i class="fas fa-piggy-bank"></i> ${U.money(t.guardado)}</span>
        </div>
      </div>

      <!-- XP Bar -->
      <div style="margin-top:1rem">${XP.renderBar(data)}</div>

      <!-- Stats -->
      <div class="stats-grid stagger" style="margin-top:1.5rem">
        <div class="stat-card anim-slide-up"><div class="stat-icon" style="background:rgba(16,185,129,.12);color:#10b981"><i class="fas fa-arrow-up"></i></div><div><div class="stat-value text-success">${U.money(t.receitas)}</div><div class="stat-label">Receitas</div></div></div>
        <div class="stat-card anim-slide-up"><div class="stat-icon" style="background:rgba(239,68,68,.12);color:#ef4444"><i class="fas fa-arrow-down"></i></div><div><div class="stat-value text-danger">${U.money(t.despesas)}</div><div class="stat-label">Despesas</div></div></div>
        <div class="stat-card anim-slide-up"><div class="stat-icon" style="background:rgba(59,130,246,.12);color:#3b82f6"><i class="fas fa-chart-line"></i></div><div><div class="stat-value">${U.money(t.economia)}</div><div class="stat-label">Economia</div></div></div>
        <div class="stat-card anim-slide-up"><div class="stat-icon" style="background:rgba(124,58,237,.12);color:#7c3aed"><i class="fas fa-bullseye"></i></div><div><div class="stat-value">${ms.total}</div><div class="stat-label">Metas</div></div></div>
        <div class="stat-card anim-slide-up"><div class="stat-icon" style="background:rgba(245,158,11,.12);color:#f59e0b"><i class="fas fa-trophy"></i></div><div><div class="stat-value">${(data.conquistas||[]).length}</div><div class="stat-label">Conquistas</div></div></div>
        <div class="stat-card anim-slide-up"><div class="stat-icon" style="background:rgba(236,72,153,.12);color:#ec4899"><i class="fas fa-exchange-alt"></i></div><div><div class="stat-value">${(data.historico||[]).length}</div><div class="stat-label">Transações</div></div></div>
      </div>

      <!-- Charts -->
      <div class="charts-row" style="margin-top:1.5rem">
        <div class="chart-card anim-fade"><h3 class="chart-title"><i class="fas fa-chart-pie"></i> Receitas vs Despesas</h3><div class="chart-wrap"><canvas id="chart-pie"></canvas></div></div>
        <div class="chart-card anim-fade"><h3 class="chart-title"><i class="fas fa-chart-line"></i> Evolução Mensal</h3><div class="chart-wrap"><canvas id="chart-monthly"></canvas></div></div>
        <div class="chart-card anim-fade"><h3 class="chart-title"><i class="fas fa-chart-bar"></i> Despesas por Categoria</h3><div class="chart-wrap"><canvas id="chart-categories"></canvas></div></div>
      </div>

      <!-- Recent Transactions -->
      <div class="card" style="margin-top:1.5rem">
        <div class="flex justify-between items-center" style="margin-bottom:1rem">
          <h3 class="fw-700">Últimas Movimentações</h3>
          <button class="btn btn-ghost btn-sm" onclick="App.navigate('transacoes')">Ver todas <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="tx-list">${recent.length ? recent.map(tx => this.renderTxItem(tx, data)).join('') : '<div class="empty-state"><div class="empty-icon">📊</div><h3>Sem movimentações</h3><p>Adicione receitas e despesas para começar</p></div>'}</div>
      </div>
    `;

    setTimeout(() => Graficos.updateDashboard(data), 100);
  },

  renderTxItem(tx, data) {
    const cat = tx.categoriaObj || Categorias.find(data, tx.categoria) || { icone: 'fa-circle', cor: '#64748b', nome: 'Outros' };
    const isRec = tx.tipo === 'receita';
    return `<div class="tx-item">
      <div class="tx-icon" style="background:${cat.cor}22;color:${cat.cor}"><i class="fas ${cat.icone}"></i></div>
      <div class="tx-info"><div class="tx-name">${U.truncate(tx.nome, 35)}</div><div class="tx-meta">${cat.nome} • ${U.date(tx.data)}</div></div>
      <div class="tx-amount ${isRec ? 'text-success' : 'text-danger'}">${isRec ? '+' : '-'} ${U.money(tx.valor)}</div>
      <div class="tx-actions">
        <button class="btn-icon" title="Editar" onclick="App.editTransaction('${tx.id}')"><i class="fas fa-pen"></i></button>
        <button class="btn-icon" title="Excluir" onclick="App.deleteTransaction('${tx.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  }
};
