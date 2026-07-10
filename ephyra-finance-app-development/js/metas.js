/* ===== EPHYRA FINANCE — GOALS ===== */
const MetasModule = {
  create(data, m) {
    const meta = { id: U.id(), nome: m.nome.trim(), descricao: m.descricao || '', valorObjetivo: parseFloat(m.valorObjetivo), valorGuardado: 0, dataLimite: m.dataLimite || null, cor: m.cor || '#3b82f6', icone: m.icone || '🎯', prioridade: m.prioridade || 'media', status: 'ativa', dataCriacao: new Date().toISOString() };
    data.metas.push(meta);
    XP.add(data, 5);
    Conquistas.check(data);
    EphyraStorage.save(data);
    return meta;
  },

  edit(data, id, updates) {
    const meta = data.metas.find(m => m.id === id);
    if (!meta) return null;
    Object.assign(meta, updates);
    if (updates.valorObjetivo) meta.valorObjetivo = parseFloat(updates.valorObjetivo);
    EphyraStorage.save(data);
    return meta;
  },

  remove(data, id) {
    const idx = data.metas.findIndex(m => m.id === id);
    if (idx < 0) return null;
    const removed = data.metas.splice(idx, 1)[0];
    EphyraStorage.save(data);
    return removed;
  },

  deposit(data, id, valor) {
    const meta = data.metas.find(m => m.id === id);
    if (!meta) { Toast.error('Meta não encontrada'); return false; }
    const v = parseFloat(valor);
    if (!v || v <= 0) { Toast.error('Valor inválido'); return false; }
    if (v > data.saldo) { Toast.error('Saldo insuficiente!'); return false; }
    data.saldo -= v;
    meta.valorGuardado = (meta.valorGuardado || 0) + v;
    if (meta.valorGuardado >= meta.valorObjetivo) {
      meta.valorGuardado = meta.valorObjetivo;
      meta.status = 'concluida';
      meta.dataConclusao = new Date().toISOString();
      Toast.success(`🎉 Meta "${meta.nome}" concluída!`);
      XP.add(data, 30);
    } else {
      Toast.success(`${U.money(v)} guardado na meta "${meta.nome}"`);
      XP.add(data, 3);
    }
    Conquistas.check(data);
    EphyraStorage.save(data);
    return true;
  },

  stats(data) {
    const m = data.metas || [];
    return { total: m.length, concluidas: m.filter(x => x.status === 'concluida').length, ativas: m.filter(x => x.status === 'ativa').length, valorTotal: m.reduce((s, x) => s + x.valorObjetivo, 0), valorGuardado: m.reduce((s, x) => s + (x.valorGuardado || 0), 0) };
  }
};
