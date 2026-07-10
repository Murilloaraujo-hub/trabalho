/* ===== EPHYRA FINANCE — ACHIEVEMENTS ===== */
const ACHIEVEMENTS_DEF = [
  { id:'primeira_receita',   nome:'Primeira Receita',      desc:'Registre sua primeira receita',         xp:10,  icone:'💰', cat:'iniciante' },
  { id:'primeira_despesa',   nome:'Primeira Despesa',      desc:'Registre sua primeira despesa',         xp:10,  icone:'💳', cat:'iniciante' },
  { id:'primeira_meta',      nome:'Sonhador',              desc:'Crie sua primeira meta',                xp:15,  icone:'🎯', cat:'iniciante' },
  { id:'dez_transacoes',     nome:'Organizando a Casa',    desc:'Registre 10 transações',               xp:20,  icone:'📊', cat:'iniciante' },
  { id:'cem_transacoes',     nome:'Contador',              desc:'Registre 100 transações',               xp:50,  icone:'🧮', cat:'avancado' },
  { id:'milionario',         nome:'Milionário',            desc:'Tenha R$ 1.000 de saldo',               xp:25,  icone:'💎', cat:'intermediario' },
  { id:'economista',         nome:'Economista',            desc:'Tenha R$ 5.000 de saldo',               xp:50,  icone:'🪙', cat:'avancado' },
  { id:'meta_concluida',     nome:'Objetivo Alcançado',    desc:'Conclua sua primeira meta',             xp:30,  icone:'🏁', cat:'intermediario' },
  { id:'cinco_metas',        nome:'Planejador',            desc:'Crie 5 metas',                          xp:35,  icone:'🗓️', cat:'intermediario' },
  { id:'sete_dias',          nome:'Semana Firme',          desc:'Use o app por 7 dias',                  xp:25,  icone:'📅', cat:'intermediario' },
  { id:'trinta_dias',        nome:'Mês Completo',          desc:'Use o app por 30 dias',                 xp:50,  icone:'🗓️', cat:'avancado' },
  { id:'nivel_5',            nome:'Evoluindo',             desc:'Alcance o nível 5',                     xp:30,  icone:'⭐', cat:'intermediario' },
  { id:'nivel_10',           nome:'Mestre Financeiro',     desc:'Alcance o nível 10',                    xp:100, icone:'👑', cat:'avancado' },
  { id:'investidor',         nome:'Investidor',            desc:'Adicione uma receita de investimentos', xp:20,  icone:'📈', cat:'intermediario' },
  { id:'economizou_mes',     nome:'Poupador',              desc:'Termine o mês com saldo positivo',      xp:40,  icone:'🐷', cat:'avancado' },
];

const SECRET_ACHIEVEMENT = { id:'mestre_dinheiro', nome:'Mestre do Dinheiro', desc:'+99999 de Aura', xp:500, icone:'🏆', cat:'secreto' };

const Conquistas = {
  check(data) {
    const unlock = (achDef) => {
      if (data.conquistas.some(c => c.id === achDef.id)) return;
      data.conquistas.push({ ...achDef, data: new Date().toISOString(), desbloqueada: true });
      data.xp = (data.xp || 0) + achDef.xp;
      Toast.success(`🏆 Conquista: ${achDef.nome}!`);
      EphyraStorage.save(data);
    };

    const h = data.historico || [];
    const r = data.receitas || [];
    const d = data.despesas || [];
    const m = data.metas || [];
    const dias = data.config?.diasUsando || 1;

    if (r.length >= 1)   unlock(ACHIEVEMENTS_DEF[0]);
    if (d.length >= 1)   unlock(ACHIEVEMENTS_DEF[1]);
    if (m.length >= 1)   unlock(ACHIEVEMENTS_DEF[2]);
    if (h.length >= 10)  unlock(ACHIEVEMENTS_DEF[3]);
    if (h.length >= 100) unlock(ACHIEVEMENTS_DEF[4]);
    if (data.saldo >= 1000) unlock(ACHIEVEMENTS_DEF[5]);
    if (data.saldo >= 5000) unlock(ACHIEVEMENTS_DEF[6]);
    if (m.some(x => x.valorGuardado >= x.valorObjetivo)) unlock(ACHIEVEMENTS_DEF[7]);
    if (m.length >= 5) unlock(ACHIEVEMENTS_DEF[8]);
    if (dias >= 7)  unlock(ACHIEVEMENTS_DEF[9]);
    if (dias >= 30) unlock(ACHIEVEMENTS_DEF[10]);
    if ((data.nivel || 1) >= 5)  unlock(ACHIEVEMENTS_DEF[11]);
    if ((data.nivel || 1) >= 10) unlock(ACHIEVEMENTS_DEF[12]);
    if (r.some(x => x.categoria === 'investimentos')) unlock(ACHIEVEMENTS_DEF[13]);
  },

  trySecret(data, code) {
    if (code !== '6767') { Toast.error('Código incorreto!'); return false; }
    if (data.conquistas.some(c => c.id === 'mestre_dinheiro')) { Toast.warning('Já desbloqueada!'); return false; }
    data.conquistas.push({ ...SECRET_ACHIEVEMENT, data: new Date().toISOString(), desbloqueada: true });
    data.xp = (data.xp || 0) + SECRET_ACHIEVEMENT.xp;
    EphyraStorage.save(data);
    Toast.success('🏆 CONQUISTA SECRETA: Mestre do Dinheiro!');
    this.showSecretAnimation();
    return true;
  },

  showSecretAnimation() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.8);animation:fadeIn .3s ease';
    overlay.innerHTML = `<div style="text-align:center;animation:scaleIn .5s ease both">
      <div style="font-size:6rem;margin-bottom:1rem">🏆</div>
      <h2 style="font-size:2rem;color:#fbbf24;margin-bottom:.5rem">Mestre do Dinheiro!</h2>
      <p style="font-size:1.3rem;color:#a78bfa">+99999 de Aura</p>
      <p style="color:#94a3b8;margin-top:1rem">+500 XP</p>
    </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = () => overlay.remove();
    setTimeout(() => overlay.remove(), 5000);
  },

  getAll() { return ACHIEVEMENTS_DEF; },
  getUnlocked(data) { return data.conquistas || []; }
};
