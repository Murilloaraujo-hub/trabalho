/* ===== EPHYRA FINANCE — CATEGORIES ===== */
const DEFAULT_CATEGORIES = [
  { id: 'salario',       nome: 'Salário',        icone: 'fa-briefcase',      tipo: 'receita', cor: '#22c55e' },
  { id: 'freelance',     nome: 'Freelance',       icone: 'fa-laptop-code',   tipo: 'receita', cor: '#14b8a6' },
  { id: 'investimentos', nome: 'Investimentos',   icone: 'fa-chart-line',    tipo: 'receita', cor: '#3b82f6' },
  { id: 'presente',      nome: 'Presente',        icone: 'fa-gift',          tipo: 'receita', cor: '#ec4899' },
  { id: 'outros_rec',    nome: 'Outros',          icone: 'fa-plus-circle',   tipo: 'receita', cor: '#8b5cf6' },
  { id: 'alimentacao',   nome: 'Alimentação',     icone: 'fa-utensils',      tipo: 'despesa', cor: '#f97316' },
  { id: 'transporte',    nome: 'Transporte',      icone: 'fa-car',           tipo: 'despesa', cor: '#3b82f6' },
  { id: 'moradia',       nome: 'Moradia',         icone: 'fa-home',          tipo: 'despesa', cor: '#10b981' },
  { id: 'saude',         nome: 'Saúde',           icone: 'fa-heartbeat',     tipo: 'despesa', cor: '#ef4444' },
  { id: 'educacao',      nome: 'Educação',        icone: 'fa-graduation-cap',tipo: 'despesa', cor: '#8b5cf6' },
  { id: 'lazer',         nome: 'Lazer',           icone: 'fa-gamepad',       tipo: 'despesa', cor: '#f43f5e' },
  { id: 'compras',       nome: 'Compras',         icone: 'fa-shopping-bag',  tipo: 'despesa', cor: '#f59e0b' },
  { id: 'contas',        nome: 'Contas',          icone: 'fa-file-invoice-dollar', tipo: 'despesa', cor: '#6366f1' },
  { id: 'pets',          nome: 'Pets',            icone: 'fa-paw',           tipo: 'despesa', cor: '#a855f7' },
  { id: 'outros_desp',   nome: 'Outros',          icone: 'fa-ellipsis-h',    tipo: 'despesa', cor: '#64748b' }
];

const Categorias = {
  get(data) { return data.categorias || DEFAULT_CATEGORIES; },
  find(data, id) { return this.get(data).find(c => c.id === id); },
  byTipo(data, tipo) { return this.get(data).filter(c => c.tipo === tipo); },
  add(data, cat) { data.categorias.push({ ...cat, id: U.id() }); EphyraStorage.save(data); },
  remove(data, id) { data.categorias = data.categorias.filter(c => c.id !== id); EphyraStorage.save(data); },
  options(data, tipo) {
    return this.byTipo(data, tipo).map(c =>
      `<option value="${c.id}">${c.nome}</option>`
    ).join('');
  }
};
