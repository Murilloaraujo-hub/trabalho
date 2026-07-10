/* ===== EPHYRA FINANCE — SETTINGS ===== */
const Configuracoes = {
  render(data) {
    const isDark = !document.body.classList.contains('light');
    const container = U.qs('#page-configuracoes');

    container.innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Configurações</h2><p class="page-subtitle">Personalize sua experiência</p></div></div>

      <div class="card" style="margin-bottom:1rem">
        <h3 class="fw-700" style="margin-bottom:1rem"><i class="fas fa-palette"></i> Aparência</h3>
        <div class="flex items-center justify-between" style="padding:.75rem 0;border-bottom:1px solid var(--border-color)">
          <div><p class="fw-600">Modo Escuro</p><p class="text-xs text-muted">Interface escura e elegante</p></div>
          <label style="position:relative;display:inline-block;width:48px;height:26px;cursor:pointer">
            <input type="checkbox" id="theme-toggle" ${isDark ? 'checked' : ''} onchange="App.toggleTheme()" style="opacity:0;width:0;height:0">
            <span style="position:absolute;inset:0;background:var(--bg-input);border-radius:26px;transition:.3s"></span>
            <span style="position:absolute;top:3px;left:${isDark ? '25px' : '3px'};width:20px;height:20px;background:var(--color-primary);border-radius:50%;transition:.3s"></span>
          </label>
        </div>
      </div>

      <div class="card" style="margin-bottom:1rem">
        <h3 class="fw-700" style="margin-bottom:1rem"><i class="fas fa-database"></i> Dados</h3>
        <div class="flex gap-md" style="flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" onclick="App.exportData()"><i class="fas fa-download"></i> Exportar JSON</button>
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('import-file').click()"><i class="fas fa-upload"></i> Importar JSON</button>
          <input type="file" id="import-file" accept=".json" style="display:none" onchange="App.importData(event)">
        </div>
      </div>

      <div class="card" style="margin-bottom:1rem">
        <h3 class="fw-700" style="margin-bottom:1rem"><i class="fas fa-user-edit"></i> Conta</h3>
        <div class="flex gap-md" style="flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" onclick="App.showEditProfile()"><i class="fas fa-user"></i> Editar Perfil</button>
          <button class="btn btn-outline btn-sm" onclick="App.showChangePassword()"><i class="fas fa-key"></i> Alterar Senha</button>
          <button class="btn btn-ghost btn-sm" onclick="App.logout()"><i class="fas fa-sign-out-alt"></i> Sair</button>
        </div>
      </div>

      <div class="card">
        <h3 class="fw-700 text-danger" style="margin-bottom:1rem"><i class="fas fa-exclamation-triangle"></i> Zona Perigosa</h3>
        <p class="text-sm text-muted" style="margin-bottom:1rem">Estas ações são irreversíveis.</p>
        <button class="btn btn-danger btn-sm" onclick="App.confirmReset()"><i class="fas fa-trash-alt"></i> Resetar Tudo</button>
      </div>
    `;
  }
};
