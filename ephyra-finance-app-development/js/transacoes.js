/* ===== EPHYRA FINANCE — TRANSACTIONS ===== */
const Transacoes = {
  add(data, tipo, t) {
    const tx = { id: U.id(), tipo, nome: t.nome.trim(), categoria: t.categoria, valor: parseFloat(t.valor), data: t.data || new Date().toISOString(), descricao: t.descricao || '', dataCriacao: new Date().toISOString() };
    const cat = Categorias.find(data, t.categoria);
    if (cat) tx.categoriaObj = cat;
    if (tipo === 'receita') { data.saldo += tx.valor; data.receitas.push(tx); }
    else { data.saldo -= tx.valor; data.despesas.push(tx); }
    data.historico.push(tx);
    XP.add(data, tipo === 'receita' ? 5 : 3);
    Conquistas.check(data);
    EphyraStorage.save(data);
    return tx;
  },

  edit(data, id, updates) {
    const lists = [data.receitas, data.despesas, data.historico];
    for (const list of lists) {
      const idx = list.findIndex(t => t.id === id);
      if (idx >= 0) {
        const old = list[idx];
        const diffVal = parseFloat(updates.valor || old.valor) - old.valor;
        if (old.tipo === 'receita') data.saldo += diffVal; else data.saldo -= diffVal;
        Object.assign(list[idx], updates, { valor: parseFloat(updates.valor || old.valor) });
        if (updates.categoria) list[idx].categoriaObj = Categorias.find(data, updates.categoria);
      }
    }
    EphyraStorage.save(data);
  },

  remove(data, id) {
    const findAndRemove = (arr) => {
      const idx = arr.findIndex(t => t.id === id);
      if (idx >= 0) { const t = arr.splice(idx, 1)[0]; return t; }
      return null;
    };
    let removed = findAndRemove(data.receitas);
    if (removed) { data.saldo -= removed.valor; }
    else { removed = findAndRemove(data.despesas); if (removed) data.saldo += removed.valor; }
    data.historico = data.historico.filter(t => t.id !== id);
    EphyraStorage.save(data);
    return removed;
  },

  duplicate(data, id) {
    const all = [...data.receitas, ...data.despesas];
    const orig = all.find(t => t.id === id);
    if (!orig) return null;
    return this.add(data, orig.tipo, { nome: orig.nome + ' (cópia)', categoria: orig.categoria, valor: orig.valor, data: new Date().toISOString(), descricao: orig.descricao });
  },

  filter(data, filters = {}) {
    let list = [...(data.historico || [])];
    if (filters.tipo && filters.tipo !== 'todos') list = list.filter(t => t.tipo === filters.tipo);
    if (filters.categoria) list = list.filter(t => t.categoria === filters.categoria);
    if (filters.search) { const s = filters.search.toLowerCase(); list = list.filter(t => t.nome.toLowerCase().includes(s) || (t.descricao || '').toLowerCase().includes(s)); }
    if (filters.dateFrom) list = list.filter(t => new Date(t.data) >= new Date(filters.dateFrom));
    if (filters.dateTo) list = list.filter(t => new Date(t.data) <= new Date(filters.dateTo));
    list.sort((a, b) => new Date(b.data) - new Date(a.data));
    return list;
  },

  totals(data) {
    const tR = data.receitas.reduce((s, t) => s + t.valor, 0);
    const tD = data.despesas.reduce((s, t) => s + t.valor, 0);
    const mG = data.metas.reduce((s, m) => s + (m.valorGuardado || 0), 0);
    return { receitas: tR, despesas: tD, economia: tR - tD, guardado: mG };
  }
};
