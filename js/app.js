/* ===== EPHYRA FINANCE — MAIN APP ===== */
const App = {
  data: null,
  user: null,
  currentPage: 'dashboard',

  /* ── Initialize ── */
  init() {
    Toast.init();
    this.data = EphyraStorage.load();
    this.user = EphyraStorage.loadUser();

    if (!this.user) { this.showWelcome(); return; }
    if (!this.data) { this.data = this.createDefaultData(); EphyraStorage.save(this.data); }

    this.processLogin();
    this.showApp();
    this.navigate('dashboard');
    this.setupNav();
    this.applyTheme();
    this.updateSidebarProfile();
  },

  /* ── Default Data ── */
  createDefaultData() {
    return { saldo: 0, receitas: [], despesas: [], metas: [], historico: [], conquistas: [], categorias: [...DEFAULT_CATEGORIES], xp: 0, nivel: 1, config: { tema: 'dark', diasUsando: 1, ultimoLogin: new Date().toISOString() } };
  },

  /* ── Daily Login ── */
  processLogin() {
    if (!this.data.config) this.data.config = { diasUsando: 1, ultimoLogin: new Date().toISOString() };
    const last = this.data.config.ultimoLogin;
    if (!U.sameDay(last, new Date())) {
      this.data.config.diasUsando = (this.data.config.diasUsando || 0) + 1;
      this.data.config.ultimoLogin = new Date().toISOString();
      EphyraStorage.save(this.data);
    }
    Conquistas.check(this.data);
  },

  /* ── Theme ── */
  applyTheme() {
    const isDark = this.data?.config?.tema !== 'light';
    document.body.classList.toggle('light', !isDark);
    document.body.classList.toggle('dark', isDark);
  },

  toggleTheme() {
    const isNowLight = document.body.classList.toggle('light');
    document.body.classList.toggle('dark', !isNowLight);
    if (this.data) { this.data.config.tema = isNowLight ? 'light' : 'dark'; EphyraStorage.save(this.data); }
    Toast.info(isNowLight ? '☀️ Modo claro ativado' : '🌙 Modo escuro ativado');
    if (this.currentPage === 'dashboard') setTimeout(() => Graficos.updateDashboard(this.data), 200);
  },

  /* ── Navigation ── */
  setupNav() {
    U.qsa('[data-nav]').forEach(el => U.on(el, 'click', () => this.navigate(el.dataset.nav)));
    U.on(U.qs('.menu-toggle'), 'click', () => this.toggleSidebar());
    U.on(U.qs('.sidebar-overlay'), 'click', () => this.toggleSidebar(false));
  },

  navigate(page) {
    this.currentPage = page;
    U.qsa('.page').forEach(p => p.classList.remove('active'));
    const target = U.qs(`#page-${page}`);
    if (target) target.classList.add('active');
    U.qsa('[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === page));

    switch (page) {
      case 'dashboard': Dashboard.render(this.data); break;
      case 'transacoes': this.renderTransacoes(); break;
      case 'metas': this.renderMetas(); break;
      case 'conquistas': this.renderConquistas(); break;
      case 'perfil': Perfil.render(this.data, this.user); break;
      case 'configuracoes': Configuracoes.render(this.data); break;
    }

    this.toggleSidebar(false);
    this.updateSidebarProfile();
    U.qs('#topbar-title').textContent = { dashboard: 'Dashboard', transacoes: 'Transações', metas: 'Metas', conquistas: 'Conquistas', perfil: 'Perfil', configuracoes: 'Configurações' }[page] || '';
  },

  toggleSidebar(force) {
    const sb = U.qs('.sidebar');
    const ov = U.qs('.sidebar-overlay');
    const open = force !== undefined ? force : !sb.classList.contains('open');
    sb.classList.toggle('open', open);
    ov.classList.toggle('active', open);
  },

  updateSidebarProfile() {
    if (!this.user) return;
    U.qs('.sidebar-profile-name').textContent = this.user.nome;
    U.qs('.sidebar-profile-level').textContent = `Nível ${this.data.nivel || 1} • ${this.data.xp || 0} XP`;
    const img = U.qs('.sidebar-profile img');
    if (img) img.src = this.user.foto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(this.user.nome)}`;
  },

  showApp() {
    U.qs('#welcome-screen')?.classList.add('hidden');
    U.qs('#login-screen')?.classList.add('hidden');
    U.qs('#app-shell').classList.remove('hidden');
  },

  /* ── WELCOME SCREEN ── */
  showWelcome() {
    U.qs('#app-shell').classList.add('hidden');
    U.qs('#login-screen')?.classList.add('hidden');
    const ws = U.qs('#welcome-screen');
    ws.classList.remove('hidden');
    ws.innerHTML = `
      <div class="welcome-container anim-scale">
        <div class="welcome-logo"><div class="brand-icon" style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;margin:0 auto 1rem">💰</div>
          <h1 style="font-size:1.8rem;font-weight:900;background:linear-gradient(135deg,var(--color-primary),var(--color-primary-light));-webkit-background-clip:text;-webkit-text-fill-color:transparent">Ephyra Finance</h1>
          <p class="text-muted" style="margin-top:.5rem">Organize suas finanças de forma inteligente</p>
        </div>
        <form id="welcome-form" class="flex flex-col gap-md" style="margin-top:2rem;width:100%;max-width:400px">
          <div class="form-group"><label class="form-label">Nome *</label><input class="form-input" id="w-nome" required placeholder="Seu nome completo"></div>
          <div class="form-group"><label class="form-label">Email *</label><input class="form-input" id="w-email" type="email" required placeholder="seu@email.com"></div>
          <div class="form-group"><label class="form-label">Senha *</label><input class="form-input" id="w-senha" type="password" required minlength="4" placeholder="Mínimo 4 caracteres"></div>
          <div class="form-group"><label class="form-label">Salário Mensal (opcional)</label><input class="form-input" id="w-salario" type="number" step="0.01" placeholder="0.00"></div>
          <button type="submit" class="btn btn-primary btn-lg btn-block" style="margin-top:.5rem"><i class="fas fa-rocket"></i> Começar</button>
        </form>
      </div>`;
    U.on(U.qs('#welcome-form'), 'submit', (e) => { e.preventDefault(); this.handleWelcome(); });
  },

  handleWelcome() {
    const nome = U.qs('#w-nome').value.trim();
    const email = U.qs('#w-email').value.trim();
    const senha = U.qs('#w-senha').value;
    const salario = parseFloat(U.qs('#w-salario').value) || 0;

    if (!Validate.form([
      { test: Validate.required(nome), msg: 'Nome é obrigatório' },
      { test: Validate.email(email), msg: 'Email inválido' },
      { test: Validate.minLen(senha, 4), msg: 'Senha precisa de 4+ caracteres' }
    ])) return;

    this.user = { nome, email, senha, foto: null, dataCadastro: new Date().toISOString(), salario };
    this.data = this.createDefaultData();
    if (salario > 0) {
      Transacoes.add(this.data, 'receita', { nome: 'Salário', categoria: 'salario', valor: salario, data: new Date().toISOString() });
    }
    EphyraStorage.saveUser(this.user);
    EphyraStorage.save(this.data);
    Toast.success('🎉 Bem-vindo ao Ephyra Finance!');
    this.showApp();
    this.navigate('dashboard');
    this.setupNav();
    this.applyTheme();
    this.updateSidebarProfile();
  },

  /* ── LOGIN ── */
  showLogin() {
    U.qs('#app-shell').classList.add('hidden');
    U.qs('#welcome-screen')?.classList.add('hidden');
    const ls = U.qs('#login-screen');
    ls.classList.remove('hidden');
    ls.innerHTML = `
      <div class="welcome-container anim-scale">
        <div class="welcome-logo"><div class="brand-icon" style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;margin:0 auto 1rem">💰</div>
          <h1 style="font-size:1.8rem;font-weight:900;background:linear-gradient(135deg,var(--color-primary),var(--color-primary-light));-webkit-background-clip:text;-webkit-text-fill-color:transparent">Ephyra Finance</h1>
          <p class="text-muted" style="margin-top:.5rem">Entre na sua conta</p>
        </div>
        <form id="login-form" class="flex flex-col gap-md" style="margin-top:2rem;width:100%;max-width:400px">
          <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="l-email" type="email" required></div>
          <div class="form-group"><label class="form-label">Senha</label><input class="form-input" id="l-senha" type="password" required></div>
          <button type="submit" class="btn btn-primary btn-lg btn-block"><i class="fas fa-sign-in-alt"></i> Entrar</button>
        </form>
      </div>`;
    U.on(U.qs('#login-form'), 'submit', (e) => { e.preventDefault(); this.handleLogin(); });
  },

  handleLogin() {
    const email = U.qs('#l-email').value.trim();
    const senha = U.qs('#l-senha').value;
    const storedUser = EphyraStorage.loadUser();
    if (!storedUser || storedUser.email !== email || storedUser.senha !== senha) {
      Toast.error('Email ou senha incorretos'); return;
    }
    this.user = storedUser;
    this.data = EphyraStorage.load() || this.createDefaultData();
    this.processLogin();
    this.showApp();
    this.navigate('dashboard');
    this.setupNav();
    this.applyTheme();
    this.updateSidebarProfile();
    Toast.success(`Bem-vindo de volta, ${this.user.nome}!`);
  },

  logout() {
    this.user = null;
    this.data = null;
    this.showLogin();
    Toast.info('Você saiu da sua conta');
  },

  /* ── TRANSACTIONS PAGE ── */
  renderTransacoes() {
    const c = U.qs('#page-transacoes');
    const txs = Transacoes.filter(this.data);
    c.innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Transações</h2><p class="page-subtitle">Gerencie receitas e despesas</p></div>
        <div class="flex gap-sm">
          <button class="btn btn-success btn-sm" onclick="App.showTxModal('receita')"><i class="fas fa-plus"></i> Receita</button>
          <button class="btn btn-danger btn-sm" onclick="App.showTxModal('despesa')"><i class="fas fa-minus"></i> Despesa</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:1rem">
        <div class="flex gap-sm items-center" style="flex-wrap:wrap">
          <input class="form-input" id="tx-search" placeholder="Pesquisar..." style="max-width:220px" oninput="App.filterTx()">
          <select class="form-select" id="tx-filter-type" style="max-width:140px" onchange="App.filterTx()">
            <option value="todos">Todos</option><option value="receita">Receitas</option><option value="despesa">Despesas</option>
          </select>
          <select class="form-select" id="tx-filter-cat" style="max-width:160px" onchange="App.filterTx()">
            <option value="">Todas categorias</option>${Categorias.get(this.data).map(c => `<option value="${c.id}">${c.nome}</option>`).join('')}
          </select>
        </div>
      </div>

      <div id="tx-list-container" class="tx-list">${txs.length ? txs.map(tx => Dashboard.renderTxItem(tx, this.data)).join('') : '<div class="empty-state"><div class="empty-icon">💰</div><h3>Nenhuma transação</h3><p>Comece adicionando receitas ou despesas</p></div>'}</div>
    `;
  },

  filterTx() {
    const search = U.qs('#tx-search')?.value || '';
    const tipo = U.qs('#tx-filter-type')?.value || 'todos';
    const cat = U.qs('#tx-filter-cat')?.value || '';
    const txs = Transacoes.filter(this.data, { search, tipo, categoria: cat || undefined });
    U.qs('#tx-list-container').innerHTML = txs.length ? txs.map(tx => Dashboard.renderTxItem(tx, this.data)).join('') : '<div class="empty-state"><div class="empty-icon">🔍</div><h3>Nenhum resultado</h3></div>';
  },

  /* ── Transaction Modal ── */
  showTxModal(tipo, editId) {
    const existing = editId ? [...this.data.receitas, ...this.data.despesas].find(t => t.id === editId) : null;
    if (editId && existing) tipo = existing.tipo;
    const isEdit = !!existing;
    this.openModal(`${isEdit ? 'Editar' : 'Nova'} ${tipo === 'receita' ? 'Receita' : 'Despesa'}`, `
      <form id="tx-form" class="flex flex-col gap-md">
        <div class="form-group"><label class="form-label">Nome *</label><input class="form-input" id="tx-nome" required value="${existing?.nome || ''}"></div>
        <div class="form-group"><label class="form-label">Categoria</label><select class="form-select" id="tx-cat">${Categorias.options(this.data, tipo)}</select></div>
        <div class="form-group"><label class="form-label">Valor (R$) *</label><input class="form-input" id="tx-valor" type="number" step="0.01" min="0.01" required value="${existing?.valor || ''}"></div>
        <div class="form-group"><label class="form-label">Data</label><input class="form-input" id="tx-data" type="date" value="${existing ? U.dateInput(existing.data) : U.dateInput()}"></div>
        <div class="form-group"><label class="form-label">Descrição</label><input class="form-input" id="tx-desc" value="${existing?.descricao || ''}"></div>
        <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Salvar' : 'Adicionar'}</button>
      </form>`
    );
    if (existing) U.qs('#tx-cat').value = existing.categoria;
    U.on(U.qs('#tx-form'), 'submit', (e) => {
      e.preventDefault();
      const vals = { nome: U.qs('#tx-nome').value, categoria: U.qs('#tx-cat').value, valor: U.qs('#tx-valor').value, data: U.qs('#tx-data').value, descricao: U.qs('#tx-desc').value };
      if (!Validate.form([{ test: Validate.required(vals.nome), msg: 'Nome obrigatório' }, { test: Validate.positive(vals.valor), msg: 'Valor inválido' }])) return;
      if (isEdit) { Transacoes.edit(this.data, editId, vals); Toast.success('Transação atualizada!'); }
      else { Transacoes.add(this.data, tipo, vals); Toast.success(`${U.capitalize(tipo)} adicionada!`); }
      this.closeModal();
      this.navigate(this.currentPage);
    });
  },

  editTransaction(id) { this.showTxModal(null, id); },

  deleteTransaction(id) {
    this.openModal('Confirmar Exclusão', `
      <p class="text-secondary">Tem certeza que deseja excluir esta transação?</p>
      <div class="modal-footer"><button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
        <button class="btn btn-danger" id="confirm-del">Excluir</button></div>`
    );
    U.on(U.qs('#confirm-del'), 'click', () => {
      Transacoes.remove(this.data, id); Toast.success('Transação excluída'); this.closeModal(); this.navigate(this.currentPage);
    });
  },

  /* ── GOALS PAGE ── */
  renderMetas() {
    const c = U.qs('#page-metas');
    const metas = this.data.metas || [];
    c.innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Metas</h2><p class="page-subtitle">Seus objetivos financeiros</p></div>
        <button class="btn btn-primary btn-sm" onclick="App.showMetaModal()"><i class="fas fa-plus"></i> Nova Meta</button>
      </div>
      <div class="grid-auto">${metas.length ? metas.map(m => this.renderMetaCard(m)).join('') : '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🎯</div><h3>Nenhuma meta</h3><p>Crie metas para organizar seus objetivos</p><button class="btn btn-primary" onclick="App.showMetaModal()">Criar primeira meta</button></div>'}</div>
    `;
  },

  renderMetaCard(m) {
    const pct = U.pct(m.valorGuardado || 0, m.valorObjetivo);
    const done = m.status === 'concluida';
    return `<div class="card" style="border-left:4px solid ${m.cor || '#3b82f6'}">
      <div class="flex justify-between items-center" style="margin-bottom:.75rem">
        <h3 class="fw-700">${m.icone || '🎯'} ${U.truncate(m.nome, 25)}</h3>
        ${done ? '<span class="badge badge-success">Concluída ✅</span>' : `<span class="badge badge-primary">${pct.toFixed(0)}%</span>`}
      </div>
      <p class="text-sm text-muted" style="margin-bottom:.75rem">${U.truncate(m.descricao || 'Sem descrição', 60)}</p>
      <div class="progress" style="margin-bottom:.5rem"><div class="progress-fill ${done ? '' : ''}" style="width:${pct}%;${done ? 'background:linear-gradient(90deg,#10b981,#059669)' : ''}"></div></div>
      <div class="flex justify-between text-xs text-muted" style="margin-bottom:.75rem">
        <span>${U.money(m.valorGuardado || 0)}</span><span>${U.money(m.valorObjetivo)}</span>
      </div>
      <div class="flex gap-sm">
        ${!done ? `<button class="btn btn-primary btn-sm" onclick="App.depositMeta('${m.id}')"><i class="fas fa-piggy-bank"></i> Guardar</button>` : ''}
        <button class="btn btn-ghost btn-sm" onclick="App.showMetaModal('${m.id}')"><i class="fas fa-pen"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="App.deleteMeta('${m.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  },

  showMetaModal(editId) {
    const existing = editId ? this.data.metas.find(m => m.id === editId) : null;
    const isEdit = !!existing;
    this.openModal(`${isEdit ? 'Editar' : 'Nova'} Meta`, `
      <form id="meta-form" class="flex flex-col gap-md">
        <div class="form-group"><label class="form-label">Nome *</label><input class="form-input" id="m-nome" required value="${existing?.nome || ''}"></div>
        <div class="form-group"><label class="form-label">Descrição</label><input class="form-input" id="m-desc" value="${existing?.descricao || ''}"></div>
        <div class="form-group"><label class="form-label">Valor Objetivo (R$) *</label><input class="form-input" id="m-valor" type="number" step="0.01" min="0.01" required value="${existing?.valorObjetivo || ''}"></div>
        <div class="form-group"><label class="form-label">Data Limite</label><input class="form-input" id="m-data" type="date" value="${existing?.dataLimite ? U.dateInput(existing.dataLimite) : ''}"></div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">Cor</label><input type="color" id="m-cor" value="${existing?.cor || '#3b82f6'}" style="width:100%;height:40px;border:none;border-radius:var(--radius-md);cursor:pointer"></div>
          <div class="form-group"><label class="form-label">Prioridade</label><select class="form-select" id="m-prior"><option value="baixa" ${existing?.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option><option value="media" ${!existing || existing?.prioridade === 'media' ? 'selected' : ''}>Média</option><option value="alta" ${existing?.prioridade === 'alta' ? 'selected' : ''}>Alta</option></select></div>
        </div>
        <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Salvar' : 'Criar Meta'}</button>
      </form>`
    );
    U.on(U.qs('#meta-form'), 'submit', (e) => {
      e.preventDefault();
      const vals = { nome: U.qs('#m-nome').value, descricao: U.qs('#m-desc').value, valorObjetivo: U.qs('#m-valor').value, dataLimite: U.qs('#m-data').value || null, cor: U.qs('#m-cor').value, prioridade: U.qs('#m-prior').value };
      if (!Validate.form([{ test: Validate.required(vals.nome), msg: 'Nome obrigatório' }, { test: Validate.positive(vals.valorObjetivo), msg: 'Valor inválido' }])) return;
      if (isEdit) { MetasModule.edit(this.data, editId, vals); Toast.success('Meta atualizada!'); }
      else { MetasModule.create(this.data, vals); Toast.success('Meta criada!'); }
      this.closeModal();
      this.navigate('metas');
    });
  },

  depositMeta(id) {
    this.openModal('Guardar Dinheiro', `
      <p class="text-secondary" style="margin-bottom:1rem">Saldo disponível: <strong class="text-success">${U.money(this.data.saldo)}</strong></p>
      <div class="form-group"><label class="form-label">Valor (R$)</label><input class="form-input" id="dep-valor" type="number" step="0.01" min="0.01"></div>
      <button class="btn btn-primary btn-block" id="dep-btn" style="margin-top:1rem"><i class="fas fa-piggy-bank"></i> Guardar</button>`
    );
    U.on(U.qs('#dep-btn'), 'click', () => {
      const v = U.qs('#dep-valor').value;
      if (MetasModule.deposit(this.data, id, v)) { this.closeModal(); this.navigate(this.currentPage); }
    });
  },

  deleteMeta(id) {
    this.openModal('Confirmar', `<p class="text-secondary">Excluir esta meta?</p>
      <div class="modal-footer"><button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
        <button class="btn btn-danger" id="del-meta-btn">Excluir</button></div>`);
    U.on(U.qs('#del-meta-btn'), 'click', () => { MetasModule.remove(this.data, id); Toast.success('Meta excluída'); this.closeModal(); this.navigate('metas'); });
  },

  /* ── ACHIEVEMENTS PAGE ── */
  renderConquistas() {
    const c = U.qs('#page-conquistas');
    const all = Conquistas.getAll();
    const unlocked = this.data.conquistas || [];
    c.innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Conquistas</h2><p class="page-subtitle">${unlocked.length} de ${all.length} desbloqueadas</p></div></div>

      <div class="card text-center" style="margin-bottom:1.5rem">
        <div style="font-size:3rem;margin-bottom:.5rem">🏆</div>
        <h3 class="fw-700">Sua Coleção</h3>
        <p class="text-muted">Nível ${this.data.nivel || 1} • ${this.data.xp || 0} XP</p>
        <div style="max-width:300px;margin:1rem auto 0">${XP.renderBar(this.data)}</div>
      </div>

      <div class="grid-auto">${all.map(a => {
        const isUnlocked = unlocked.some(u => u.id === a.id);
        return `<div class="card text-center ${isUnlocked ? '' : 'skeleton-locked'}" style="opacity:${isUnlocked ? 1 : .4};cursor:${isUnlocked ? 'pointer' : 'default'}" ${isUnlocked ? `onclick="Toast.info('${a.desc} — ${a.xp} XP')"` : ''}>
          <div style="font-size:2.2rem;margin-bottom:.5rem">${isUnlocked ? a.icone : '🔒'}</div>
          <p class="fw-600 text-sm">${a.nome}</p>
          <p class="text-xs text-muted">${a.xp} XP</p>
        </div>`;
      }).join('')}</div>

      <div class="card text-center" style="margin-top:1.5rem">
        <h3 class="fw-700" style="margin-bottom:1rem">🔐 Código Secreto</h3>
        <div class="flex gap-sm justify-center items-center">
          <input class="form-input" id="secret-input" placeholder="Digite o código" style="max-width:200px">
          <button class="btn btn-primary btn-sm" onclick="Conquistas.trySecret(App.data, document.getElementById('secret-input').value); App.navigate('conquistas')">Desbloquear</button>
        </div>
      </div>
    `;
  },

  /* ── PROFILE EDIT ── */
  showEditProfile() {
    this.openModal('Editar Perfil', `
      <form id="prof-form" class="flex flex-col gap-md">
        <div class="form-group"><label class="form-label">Nome</label><input class="form-input" id="p-nome" value="${this.user.nome}"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="p-email" type="email" value="${this.user.email}"></div>
        <button type="submit" class="btn btn-primary btn-block">Salvar</button>
      </form>`);
    U.on(U.qs('#prof-form'), 'submit', (e) => {
      e.preventDefault();
      this.user.nome = U.qs('#p-nome').value.trim() || this.user.nome;
      this.user.email = U.qs('#p-email').value.trim() || this.user.email;
      EphyraStorage.saveUser(this.user);
      Toast.success('Perfil atualizado!');
      this.closeModal();
      this.updateSidebarProfile();
      if (this.currentPage === 'perfil') Perfil.render(this.data, this.user);
    });
  },

  showChangePassword() {
    this.openModal('Alterar Senha', `
      <form id="pw-form" class="flex flex-col gap-md">
        <div class="form-group"><label class="form-label">Senha Atual</label><input class="form-input" id="pw-old" type="password" required></div>
        <div class="form-group"><label class="form-label">Nova Senha</label><input class="form-input" id="pw-new" type="password" required minlength="4"></div>
        <button type="submit" class="btn btn-primary btn-block">Alterar</button>
      </form>`);
    U.on(U.qs('#pw-form'), 'submit', (e) => {
      e.preventDefault();
      if (U.qs('#pw-old').value !== this.user.senha) { Toast.error('Senha atual incorreta'); return; }
      this.user.senha = U.qs('#pw-new').value;
      EphyraStorage.saveUser(this.user);
      Toast.success('Senha alterada!');
      this.closeModal();
    });
  },

  /* ── DATA MANAGEMENT ── */
  exportData() {
    const json = EphyraStorage.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ephyra-finance-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
    Toast.success('Dados exportados!');
  },

  importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (EphyraStorage.importJSON(ev.target.result)) {
        this.data = EphyraStorage.load();
        this.user = EphyraStorage.loadUser();
        Toast.success('Dados importados!');
        this.navigate(this.currentPage);
      } else { Toast.error('Erro na importação'); }
    };
    reader.readAsText(file);
  },

  confirmReset() {
    this.openModal('⚠️ Resetar Tudo', `
      <p class="text-secondary">Todos os dados serão perdidos permanentemente. Tem certeza?</p>
      <div class="modal-footer"><button class="btn btn-ghost" onclick="App.closeModal()">Cancelar</button>
        <button class="btn btn-danger" id="reset-btn">Resetar Tudo</button></div>`);
    U.on(U.qs('#reset-btn'), 'click', () => { EphyraStorage.clearAll(); location.reload(); });
  },

  /* ── MODAL HELPERS ── */
  openModal(title, bodyHTML) {
    const overlay = U.qs('#modal-overlay');
    overlay.querySelector('.modal-title').textContent = title;
    overlay.querySelector('.modal-body').innerHTML = bodyHTML;
    overlay.classList.add('active');
  },

  closeModal() {
    U.qs('#modal-overlay').classList.remove('active');
  }
};

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => setTimeout(() => App.init(), 300));
