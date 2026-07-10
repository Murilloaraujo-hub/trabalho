/* ===== EPHYRA FINANCE — CHARTS (Chart.js) ===== */
const Graficos = {
  instances: {},

  destroy(id) {
    if (this.instances[id]) { this.instances[id].destroy(); delete this.instances[id]; }
  },

  defaults() {
    const style = getComputedStyle(document.body);
    const txtColor = style.getPropertyValue('--text-muted').trim() || '#64748b';
    const gridColor = style.getPropertyValue('--border-color').trim() || 'rgba(148,163,184,.12)';
    return { txtColor, gridColor };
  },

  doughnut(canvasId, labels, values, colors) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: this.defaults().txtColor, padding: 12, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } } } } }
    });
  },

  line(canvasId, labels, datasets) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const { txtColor, gridColor } = this.defaults();
    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, plugins: { legend: { labels: { color: txtColor, usePointStyle: true, font: { size: 11 } } } }, scales: { x: { grid: { color: gridColor }, ticks: { color: txtColor, font: { size: 10 } } }, y: { grid: { color: gridColor }, ticks: { color: txtColor, font: { size: 10 } } } } }
    });
  },

  bar(canvasId, labels, data, color) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const { txtColor, gridColor } = this.defaults();
    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: color || 'rgba(124,58,237,.6)', borderRadius: 6, barThickness: 24 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: txtColor, font: { size: 10 } } }, y: { grid: { color: gridColor }, ticks: { color: txtColor, font: { size: 10 } } } } }
    });
  },

  updateDashboard(data) {
    const totals = Transacoes.totals(data);
    // Pie: Receitas vs Despesas
    this.doughnut('chart-pie', ['Receitas', 'Despesas'], [totals.receitas, totals.despesas], ['#10b981', '#ef4444']);

    // Expenses by category
    const catMap = {};
    (data.despesas || []).forEach(t => {
      const cat = t.categoriaObj || Categorias.find(data, t.categoria) || { nome: 'Outros', cor: '#64748b' };
      catMap[cat.nome] = (catMap[cat.nome] || 0) + t.valor;
    });
    const catLabels = Object.keys(catMap);
    const catValues = Object.values(catMap);
    const catColors = catLabels.map(name => {
      const c = data.categorias.find(x => x.nome === name);
      return c ? c.cor : '#64748b';
    });
    this.doughnut('chart-categories', catLabels, catValues, catColors);

    // Monthly line chart
    const months = {};
    const allTx = [...(data.receitas || []), ...(data.despesas || [])];
    allTx.forEach(t => {
      const d = new Date(t.data);
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { r: 0, d: 0 };
      if (t.tipo === 'receita') months[key].r += t.valor; else months[key].d += t.valor;
    });
    const mLabels = Object.keys(months).slice(-6);
    const mRec = mLabels.map(k => months[k]?.r || 0);
    const mDesp = mLabels.map(k => months[k]?.d || 0);
    this.line('chart-monthly', mLabels, [
      { label: 'Receitas', data: mRec, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.1)', fill: true, tension: .4 },
      { label: 'Despesas', data: mDesp, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.1)', fill: true, tension: .4 }
    ]);
  }
};
