(() => {
  "use strict";

  const STORAGE_KEY = "ephyra-finance-state";
  const LEGACY_STORAGE_KEY = "ephyra-finance-transactions";

  const CATEGORY_OPTIONS = {
    income: ["Salario", "Freelance", "Presente", "Outros"],
    expense: ["Alimentacao", "Transporte", "Saude", "Educacao", "Lazer", "Contas", "Investimento", "Outros"],
    transfer: ["Metas"]
  };

  const XP_REWARDS = {
    transaction: 5,
    goalDeposit: 10,
    goalCreated: 20,
    goalCompleted: 100,
    achievement: 50
  };

  const moneyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  let appState = null;
  let elements = {};
  let activeFilter = "all";
  let categoryFilter = "all";
  let searchTerm = "";
  let sortMode = "newest";
  let charts = {};

  const ACHIEVEMENTS = [
    achievement("first-saved", "Economia", "\u{1F4B0}", "Primeiro dinheiro guardado", "Guarde qualquer valor em uma meta.", 1, () => getTotalSaved()),
    achievement("save-100", "Economia", "\u{1F4B5}", "Guardar R$100", "Tenha pelo menos R$100 guardados.", 100, () => getTotalSaved()),
    achievement("save-500", "Economia", "\u{1F4B8}", "Guardar R$500", "Tenha pelo menos R$500 guardados.", 500, () => getTotalSaved()),
    achievement("save-1000", "Economia", "\u{1F3E6}", "Guardar R$1000", "Tenha pelo menos R$1000 guardados.", 1000, () => getTotalSaved()),
    achievement("save-5000", "Economia", "\u{1F48E}", "Guardar R$5000", "Tenha pelo menos R$5000 guardados.", 5000, () => getTotalSaved()),
    achievement("first-goal-complete", "Economia", "\u{1F3AF}", "Mestre da Poupanca", "Conclua a primeira meta financeira.", 1, () => getCompletedGoalsCount()),
    achievement("three-deposits", "Economia", "\u{1F4CA}", "Ritmo de Reserva", "Faca 3 depositos em metas.", 3, () => getGoalHistoryCount("deposit")),
    achievement("twenty-percent-saved", "Economia", "\u{1F331}", "Reserva 20%", "Guarde pelo menos 20% da sua renda.", 1, () => appState.totals.income > 0 && getTotalSaved() >= appState.totals.income * 0.2 ? 1 : 0),

    achievement("first-transaction", "Organizacao", "\u{1F4DD}", "Primeira transacao", "Registre a primeira receita ou despesa.", 1, () => getRealTransactions().length),
    achievement("ten-transactions", "Organizacao", "\u{1F4D2}", "10 transacoes", "Registre 10 transacoes.", 10, () => getRealTransactions().length),
    achievement("fifty-transactions", "Organizacao", "\u{1F5C3}", "50 transacoes", "Registre 50 transacoes.", 50, () => getRealTransactions().length),
    achievement("hundred-transactions", "Organizacao", "\u{1F4DA}", "100 transacoes", "Registre 100 transacoes.", 100, () => getRealTransactions().length),
    achievement("first-goal", "Organizacao", "\u{1F3C1}", "Criar primeira meta", "Crie sua primeira meta.", 1, () => appState.goals.length),
    achievement("three-goals", "Organizacao", "\u{1F5FA}", "Planejador", "Crie 3 metas financeiras.", 3, () => appState.goals.length),
    achievement("five-categories", "Organizacao", "\u{1F3F7}", "Categorias em dia", "Use 5 categorias diferentes.", 5, () => getUsedCategories().length),

    achievement("use-7-days", "Disciplina", "\u{1F4C5}", "7 dias usando", "Use o Ephyra em 7 dias diferentes.", 7, () => getUsageDaysCount()),
    achievement("use-30-days", "Disciplina", "\u{1F4C6}", "30 dias", "Use o Ephyra em 30 dias diferentes.", 30, () => getUsageDaysCount()),
    achievement("use-90-days", "Disciplina", "\u{1F552}", "90 dias", "Use o Ephyra em 90 dias diferentes.", 90, () => getUsageDaysCount()),
    achievement("use-180-days", "Disciplina", "\u{1F4AA}", "180 dias", "Use o Ephyra em 180 dias diferentes.", 180, () => getUsageDaysCount()),
    achievement("use-365-days", "Disciplina", "\u{1F31F}", "365 dias", "Use o Ephyra em 365 dias diferentes.", 365, () => getUsageDaysCount()),
    achievement("green-month", "Disciplina", "\u{1F7E2}", "Mes no Verde", "Tenha receitas 20% maiores que despesas.", 1, () => appState.totals.income > 0 && appState.totals.income >= appState.totals.expense * 1.2 ? 1 : 0),
    achievement("positive-balance", "Disciplina", "\u{2705}", "Controlador", "Mantenha saldo disponivel positivo.", 1, () => appState.totals.balance > 0 ? 1 : 0),

    achievement("effort-bonus", "Especial", "\u{2728}", "Bonus de Esforco", "Adicione um rendimento extra.", 1, () => appState.transactions.some((transaction) => transaction.source === "extra-income") ? 1 : 0),
    achievement("conscious-investor", "Especial", "\u{1F331}", "Investidor Consciente", "Registre despesa na categoria Investimento.", 1, () => appState.transactions.some((transaction) => transaction.type === "expense" && transaction.category === "Investimento") ? 1 : 0),
    achievement("economist", "Especial", "\u{1F9E0}", "Economista", "Mantenha gastos abaixo de 50% da renda.", 1, () => appState.totals.income > 0 && appState.totals.expense <= appState.totals.income * 0.5 ? 1 : 0),
    achievement("master-finance", "Especial", "\u{1F451}", "Mestre Financeiro", "Desbloqueie 20 conquistas.", 20, () => getEarnedAchievements().length),
    achievement("beginner-investor", "Especial", "\u{1F4C8}", "Investidor Iniciante", "Guarde dinheiro ou invista pela primeira vez.", 1, () => getTotalSaved() > 0 || appState.transactions.some((transaction) => transaction.category === "Investimento") ? 1 : 0),
    achievement("financial-legend", "Especial", "\u{1F3C6}", "Lenda Financeira", "Alcance o nivel 10.", 10, () => getLevelInfo(appState.profile.xp).level)
  ];

  function achievement(id, category, icon, title, description, target, getValue) {
    return { id, category, icon, title, description, target, getValue };
  }

  function createEmptyState() {
    const now = new Date().toISOString();

    return {
      version: 3,
      baseSalary: 0,
      transactions: [],
      goals: [],
      achievements: [],
      positiveBalanceSince: null,
      profile: {
        name: "",
        email: "",
        theme: "light",
        xp: 0,
        createdAt: now,
        lastUseDate: null,
        usageDays: []
      },
      totals: {
        income: 0,
        expense: 0,
        saved: 0,
        transfer: 0,
        balance: 0
      }
    };
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function collectElements() {
    elements = {
      appShell: $("#appShell"),
      salaryModal: $("#salaryModal"),
      salaryForm: $("#salaryForm"),
      salaryInput: $("#salaryInput"),
      salaryMessage: $("#salaryMessage"),
      extraIncomeButton: $("#extraIncomeButton"),
      extraIncomeModal: $("#extraIncomeModal"),
      extraIncomeForm: $("#extraIncomeForm"),
      extraIncomeDescriptionInput: $("#extraIncomeDescriptionInput"),
      extraIncomeAmountInput: $("#extraIncomeAmountInput"),
      extraIncomeMessage: $("#extraIncomeMessage"),
      closeExtraIncomeModal: $("#closeExtraIncomeModal"),
      tabButtons: $$("[data-tab]"),
      tabPanels: $$("[data-tab-panel]"),
      transactionForm: $("#transactionForm"),
      descriptionInput: $("#descriptionInput"),
      amountInput: $("#amountInput"),
      categoryInput: $("#categoryInput"),
      formMessage: $("#formMessage"),
      typeInputs: $$('input[name="type"]'),
      transferForm: $("#transferForm"),
      transferGoalSelect: $("#transferGoalSelect"),
      transferAmountInput: $("#transferAmountInput"),
      transferMessage: $("#transferMessage"),
      goalForm: $("#goalForm"),
      goalNameInput: $("#goalNameInput"),
      goalAmountInput: $("#goalAmountInput"),
      goalSavedInput: $("#goalSavedInput"),
      goalColorInput: $("#goalColorInput"),
      goalIconInput: $("#goalIconInput"),
      goalDeadlineInput: $("#goalDeadlineInput"),
      goalDescriptionInput: $("#goalDescriptionInput"),
      goalMessage: $("#goalMessage"),
      goalList: $("#goalList"),
      transactionList: $("#transactionList"),
      emptyState: $("#emptyState"),
      emptyStateText: $("#emptyStateText"),
      clearDataButton: $("#clearDataButton"),
      overspendingAlert: $("#overspendingAlert"),
      filterButtons: $$("[data-filter]"),
      searchInput: $("#searchInput"),
      categoryFilter: $("#categoryFilter"),
      sortSelect: $("#sortSelect"),
      exportCsvButton: $("#exportCsvButton"),
      exportJsonButton: $("#exportJsonButton"),
      balanceAmount: $("#balanceAmount"),
      dashboardBalanceAmount: $("#dashboardBalanceAmount"),
      baseSalaryAmount: $("#baseSalaryAmount"),
      balanceStatus: $("#balanceStatus"),
      incomeAmount: $("#incomeAmount"),
      expenseAmount: $("#expenseAmount"),
      savedAmount: $("#savedAmount"),
      transactionCount: $("#transactionCount"),
      needsAmount: $("#needsAmount"),
      wantsAmount: $("#wantsAmount"),
      investmentsAmount: $("#investmentsAmount"),
      incomeBar: $("#incomeBar"),
      expenseBar: $("#expenseBar"),
      savedBar: $("#savedBar"),
      incomeBarValue: $("#incomeBarValue"),
      expenseBarValue: $("#expenseBarValue"),
      savedBarValue: $("#savedBarValue"),
      tipsList: $("#tipsList"),
      chartStatus: $("#chartStatus"),
      largestExpense: $("#largestExpense"),
      largestIncome: $("#largestIncome"),
      averageExpense: $("#averageExpense"),
      averageIncome: $("#averageIncome"),
      totalMoved: $("#totalMoved"),
      recentActivityList: $("#recentActivityList"),
      featuredGoalsList: $("#featuredGoalsList"),
      goalsSavedTotal: $("#goalsSavedTotal"),
      activeGoalsCount: $("#activeGoalsCount"),
      completedGoalsCount: $("#completedGoalsCount"),
      averageGoalProgress: $("#averageGoalProgress"),
      monthlyIncomeAverage: $("#monthlyIncomeAverage"),
      monthlyExpenseAverage: $("#monthlyExpenseAverage"),
      statsSavedAmount: $("#statsSavedAmount"),
      topCategory: $("#topCategory"),
      largestExpensesList: $("#largestExpensesList"),
      categoryUsageList: $("#categoryUsageList"),
      earnedAchievementsCount: $("#earnedAchievementsCount"),
      totalXpAmount: $("#totalXpAmount"),
      achievementLevel: $("#achievementLevel"),
      achievementTitle: $("#achievementTitle"),
      achievementList: $("#achievementList"),
      profileForm: $("#profileForm"),
      profileNameInput: $("#profileNameInput"),
      profileEmailInput: $("#profileEmailInput"),
      themeSelect: $("#themeSelect"),
      profileMessage: $("#profileMessage"),
      profileDisplayName: $("#profileDisplayName"),
      profileTitleLabel: $("#profileTitleLabel"),
      levelLabel: $("#levelLabel"),
      xpFill: $("#xpFill"),
      xpText: $("#xpText"),
      heroLevelLabel: $("#heroLevelLabel"),
      heroXpFill: $("#heroXpFill"),
      exportBackupButton: $("#exportBackupButton"),
      importBackupButton: $("#importBackupButton"),
      backupFileInput: $("#backupFileInput"),
      usageDays: $("#usageDays"),
      lastUseDate: $("#lastUseDate"),
      profileGoalsCount: $("#profileGoalsCount"),
      profileTransactionsCount: $("#profileTransactionsCount")
    };
  }

  function on(element, eventName, handler) {
    if (element) {
      element.addEventListener(eventName, handler);
    }
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function setWidth(element, value) {
    if (element) {
      element.style.width = value;
    }
  }

  function storageGet(key) {
    try {
      return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
    } catch (error) {
      console.warn("Nao foi possivel ler o LocalStorage.", error);
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn("Nao foi possivel salvar no LocalStorage.", error);
    }
  }

  function storageRemove(key) {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn("Nao foi possivel limpar o LocalStorage.", error);
    }
  }

  function loadState() {
    const savedState = storageGet(STORAGE_KEY);

    if (savedState) {
      try {
        return normalizeState(JSON.parse(savedState));
      } catch (error) {
        console.warn("Nao foi possivel carregar os dados salvos.", error);
      }
    }

    const legacyTransactions = storageGet(LEGACY_STORAGE_KEY);

    if (legacyTransactions) {
      try {
        return normalizeState({ transactions: JSON.parse(legacyTransactions) });
      } catch (error) {
        console.warn("Nao foi possivel carregar o historico antigo.", error);
      }
    }

    return createEmptyState();
  }

  function normalizeState(state) {
    const sourceState = state && typeof state === "object" ? state : {};
    const safeState = createEmptyState();
    const transactions = Array.isArray(sourceState.transactions) ? sourceState.transactions : [];
    const goals = Array.isArray(sourceState.goals) ? sourceState.goals : [];
    const achievements = Array.isArray(sourceState.achievements) ? sourceState.achievements : [];
    const baseSalary = Number(sourceState.baseSalary);

    safeState.transactions = transactions.map(normalizeTransaction).filter(Boolean);
    safeState.goals = goals.map(normalizeGoal).filter(Boolean);
    safeState.achievements = achievements.map(normalizeAchievement).filter(Boolean);
    safeState.positiveBalanceSince = sourceState.positiveBalanceSince || null;
    safeState.profile = normalizeProfile(sourceState.profile);
    safeState.baseSalary = Number.isFinite(baseSalary) && baseSalary > 0
      ? baseSalary
      : findBaseSalaryFromTransactions(safeState.transactions);

    ensureBaseSalaryTransaction(safeState);
    ensureGoalHistoryTransactions(safeState);
    safeState.totals = calculateTotals(safeState);

    return safeState;
  }

  function normalizeProfile(profile) {
    const sourceProfile = profile && typeof profile === "object" ? profile : {};
    const emptyProfile = createEmptyState().profile;
    const xp = Number(sourceProfile.xp);

    return {
      name: String(sourceProfile.name || "").trim(),
      email: String(sourceProfile.email || "").trim(),
      theme: sourceProfile.theme === "focus" ? "focus" : "light",
      xp: Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0,
      createdAt: sourceProfile.createdAt || emptyProfile.createdAt,
      lastUseDate: sourceProfile.lastUseDate || null,
      usageDays: Array.isArray(sourceProfile.usageDays)
        ? sourceProfile.usageDays.filter((day) => typeof day === "string")
        : []
    };
  }

  function normalizeAchievement(achievementItem) {
    if (typeof achievementItem === "string") {
      return {
        id: achievementItem,
        unlockedAt: new Date().toISOString()
      };
    }

    if (!achievementItem || typeof achievementItem !== "object" || typeof achievementItem.id !== "string") {
      return null;
    }

    return {
      id: achievementItem.id,
      unlockedAt: achievementItem.unlockedAt || new Date().toISOString()
    };
  }

  function normalizeTransaction(transaction) {
    if (!transaction || typeof transaction !== "object") {
      return null;
    }

    const amount = Number(transaction.amount);
    const description = String(transaction.description || "").trim();

    if (!description || !Number.isFinite(amount) || amount <= 0) {
      return null;
    }

    let source = transaction.source || "manual";
    let type = transaction.type === "expense" ? "expense" : "income";
    let direction = transaction.direction || null;

    if (source === "goal-saving" || source === "goal-deposit") {
      source = "goal-deposit";
      type = "transfer";
      direction = "deposit";
    }

    if (source === "goal-withdraw") {
      type = "transfer";
      direction = "withdraw";
    }

    if (transaction.type === "transfer") {
      type = "transfer";
      direction = direction === "withdraw" ? "withdraw" : "deposit";
      source = source === "goal-withdraw" ? "goal-withdraw" : "goal-deposit";
    }

    const category = getSafeCategory(type, transaction.category);

    return {
      id: transaction.id || createId("transaction"),
      description,
      amount,
      type,
      category,
      direction,
      source,
      goalId: transaction.goalId || null,
      date: transaction.date || new Date().toLocaleDateString("pt-BR"),
      createdAt: transaction.createdAt || new Date().toISOString()
    };
  }

  function normalizeGoal(goal) {
    if (!goal || typeof goal !== "object") {
      return null;
    }

    const targetAmount = Number(goal.targetAmount);
    const savedAmount = Number(goal.savedAmount);
    const name = String(goal.name || "").trim();

    if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      return null;
    }

    const normalizedGoal = {
      id: goal.id || createId("goal"),
      kind: "saving",
      name,
      targetAmount,
      savedAmount: Number.isFinite(savedAmount) && savedAmount > 0
        ? Math.min(savedAmount, targetAmount)
        : 0,
      color: isValidHexColor(goal.color) ? goal.color : "#16a66a",
      icon: String(goal.icon || "\u{1F4B0}"),
      description: String(goal.description || "").trim(),
      deadline: goal.deadline || "",
      history: Array.isArray(goal.history)
        ? goal.history.map(normalizeGoalHistory).filter(Boolean)
        : [],
      completedAt: goal.completedAt || null,
      createdAt: goal.createdAt || new Date().toISOString()
    };

    if (normalizedGoal.history.length === 0 && normalizedGoal.savedAmount > 0) {
      normalizedGoal.history.push({
        id: createId("goal-history"),
        type: "deposit",
        amount: normalizedGoal.savedAmount,
        note: "Valor inicial guardado",
        transactionId: null,
        createdAt: normalizedGoal.createdAt,
        date: new Date(normalizedGoal.createdAt).toLocaleDateString("pt-BR")
      });
    }

    updateGoalCompletion(normalizedGoal, false);
    return normalizedGoal;
  }

  function normalizeGoalHistory(historyItem) {
    const amount = Number(historyItem.amount);
    const type = historyItem.type === "withdraw" ? "withdraw" : "deposit";

    if (!Number.isFinite(amount) || amount <= 0) {
      return null;
    }

    return {
      id: historyItem.id || createId("goal-history"),
      type,
      amount,
      note: String(historyItem.note || "").trim(),
      transactionId: historyItem.transactionId || null,
      createdAt: historyItem.createdAt || new Date().toISOString(),
      date: historyItem.date || new Date().toLocaleDateString("pt-BR")
    };
  }

  function getSafeCategory(type, category) {
    const options = CATEGORY_OPTIONS[type] || CATEGORY_OPTIONS.income;
    return options.includes(category) ? category : options[options.length - 1];
  }

  function ensureBaseSalaryTransaction(state) {
    const hasSalaryTransaction = state.transactions.some((transaction) => transaction.source === "salary");

    if (state.baseSalary <= 0 || hasSalaryTransaction) {
      return;
    }

    state.transactions.unshift(createTransaction({
      description: "Salario/Rendimento Principal",
      amount: state.baseSalary,
      type: "income",
      category: "Salario",
      source: "salary"
    }));
  }

  function ensureGoalHistoryTransactions(state) {
    const matchedTransactions = new Set();

    state.goals.forEach((goal) => {
      goal.history.forEach((historyItem) => {
        const existingTransaction = historyItem.transactionId
          ? state.transactions.find((transaction) => transaction.id === historyItem.transactionId)
          : state.transactions.find((transaction) => {
              return !matchedTransactions.has(transaction.id)
                && transaction.type === "transfer"
                && transaction.goalId === goal.id
                && transaction.direction === historyItem.type
                && Math.abs(transaction.amount - historyItem.amount) < 0.01;
            });

        if (existingTransaction) {
          historyItem.transactionId = existingTransaction.id;
          matchedTransactions.add(existingTransaction.id);
          return;
        }

        const transaction = createGoalTransferTransaction(goal, historyItem.type, historyItem.amount, historyItem.note);
        transaction.createdAt = historyItem.createdAt;
        transaction.date = historyItem.date;
        historyItem.transactionId = transaction.id;
        state.transactions.unshift(transaction);
      });
    });
  }

  function saveState() {
    syncTotals();
    updatePositiveBalanceTracking();
    evaluateAchievements();
    storageSet(STORAGE_KEY, JSON.stringify(appState));
    storageRemove(LEGACY_STORAGE_KEY);
  }

  function syncTotals() {
    appState.totals = calculateTotals(appState);
  }

  function calculateTotals(state = appState) {
    const income = state.transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expense = state.transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const transfer = state.transactions
      .filter((transaction) => transaction.type === "transfer")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const saved = getTotalSaved(state.goals);

    return {
      income,
      expense,
      saved,
      transfer,
      balance: income - expense - saved
    };
  }

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function formatMoney(value) {
    return moneyFormatter.format(Number(value) || 0);
  }

  function parseAmount(value) {
    const cleanedValue = String(value || "").trim().replace(/[^\d,.]/g, "");

    if (!cleanedValue) {
      return Number.NaN;
    }

    const normalizedValue = normalizeMoneyString(cleanedValue);

    if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
      return Number.NaN;
    }

    return Number(normalizedValue);
  }

  function normalizeMoneyString(value) {
    const lastComma = value.lastIndexOf(",");
    const lastDot = value.lastIndexOf(".");
    const hasComma = lastComma !== -1;
    const hasDot = lastDot !== -1;

    if (hasComma && hasDot) {
      const decimalIndex = Math.max(lastComma, lastDot);
      const integerPart = value.slice(0, decimalIndex).replace(/[,.]/g, "");
      const decimalPart = value.slice(decimalIndex + 1).replace(/[,.]/g, "");
      return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
    }

    if (hasComma || hasDot) {
      const separator = hasComma ? "," : ".";
      const parts = value.split(separator);

      if (parts.length > 2) {
        return parts.join("");
      }

      const integerPart = parts[0];
      const decimalPart = parts[1] || "";

      if (decimalPart.length === 3) {
        return `${integerPart}${decimalPart}`;
      }

      return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
    }

    return value;
  }

  function sanitizeAmountValue(value) {
    return String(value || "").replace(/[^\d,.]/g, "");
  }

  function normalizeSearchText(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function isValidHexColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || ""));
  }

  function createTransaction({ description, amount, type, category, source = "manual", goalId = null, direction = null, note = "" }) {
    return {
      id: createId("transaction"),
      description,
      amount,
      type,
      category: getSafeCategory(type, category),
      direction,
      source,
      goalId,
      note,
      date: new Date().toLocaleDateString("pt-BR"),
      createdAt: new Date().toISOString()
    };
  }

  function createGoalTransferTransaction(goal, direction, amount, note = "") {
    const isWithdraw = direction === "withdraw";

    return createTransaction({
      description: `${isWithdraw ? "Retirada da meta" : "Reserva para meta"}: ${goal.name}`,
      amount,
      type: "transfer",
      category: "Metas",
      source: isWithdraw ? "goal-withdraw" : "goal-deposit",
      direction: isWithdraw ? "withdraw" : "deposit",
      goalId: goal.id,
      note
    });
  }

  function getSelectedType() {
    const checked = document.querySelector('input[name="type"]:checked');
    return checked ? checked.value : "income";
  }

  function getSelectedTransferDirection() {
    const checked = document.querySelector('input[name="transferDirection"]:checked');
    return checked ? checked.value : "deposit";
  }

  function updateCategoryOptions() {
    if (!elements.categoryInput) {
      return;
    }

    const selectedType = getSelectedType();
    elements.categoryInput.innerHTML = "";

    CATEGORY_OPTIONS[selectedType].forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      elements.categoryInput.appendChild(option);
    });
  }

  function updateCategoryFilterOptions() {
    if (!elements.categoryFilter) {
      return;
    }

    const currentValue = categoryFilter;
    const categories = ["all", ...getUsedCategories()];
    elements.categoryFilter.innerHTML = "";

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category === "all" ? "Todas" : category;
      elements.categoryFilter.appendChild(option);
    });

    categoryFilter = categories.includes(currentValue) ? currentValue : "all";
    elements.categoryFilter.value = categoryFilter;
  }

  function updateTransferGoalOptions() {
    if (!elements.transferGoalSelect) {
      return;
    }

    elements.transferGoalSelect.innerHTML = "";

    if (appState.goals.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Crie uma meta primeiro";
      elements.transferGoalSelect.appendChild(option);
      elements.transferGoalSelect.disabled = true;
      return;
    }

    elements.transferGoalSelect.disabled = false;
    appState.goals.forEach((goal) => {
      const option = document.createElement("option");
      option.value = goal.id;
      option.textContent = `${goal.name} - ${formatMoney(goal.savedAmount)} guardado`;
      elements.transferGoalSelect.appendChild(option);
    });
  }

  function updateDashboard() {
    syncTotals();

    const { income, expense, saved, balance } = appState.totals;
    const highestTotal = Math.max(income, expense, saved, 1);

    setText(elements.balanceAmount, formatMoney(balance));
    setText(elements.dashboardBalanceAmount, formatMoney(balance));
    setText(elements.baseSalaryAmount, formatMoney(appState.baseSalary));
    setText(elements.incomeAmount, formatMoney(income));
    setText(elements.expenseAmount, formatMoney(expense));
    setText(elements.savedAmount, formatMoney(saved));
    setText(elements.transactionCount, String(appState.transactions.length));

    setText(elements.needsAmount, formatMoney(income * 0.5));
    setText(elements.wantsAmount, formatMoney(income * 0.3));
    setText(elements.investmentsAmount, formatMoney(income * 0.2));

    setWidth(elements.incomeBar, `${(income / highestTotal) * 100}%`);
    setWidth(elements.expenseBar, `${(expense / highestTotal) * 100}%`);
    setWidth(elements.savedBar, `${(saved / highestTotal) * 100}%`);
    setText(elements.incomeBarValue, formatMoney(income));
    setText(elements.expenseBarValue, formatMoney(expense));
    setText(elements.savedBarValue, formatMoney(saved));

    if (elements.overspendingAlert) {
      elements.overspendingAlert.classList.toggle("is-hidden", expense <= income);
    }

    updateBalanceStatus();
  }

  function updateBalanceStatus() {
    const { balance, income, expense, saved } = appState.totals;

    if (appState.baseSalary <= 0) {
      setText(elements.balanceStatus, "Informe seu salario para iniciar o painel.");
      return;
    }

    if (balance < 0) {
      setText(elements.balanceStatus, "Atencao: suas despesas e metas passaram do saldo disponivel.");
      return;
    }

    if (saved > 0 && income > 0 && saved >= income * 0.2) {
      setText(elements.balanceStatus, "Voce esta guardando dinheiro com consistencia.");
      return;
    }

    if (expense > income) {
      setText(elements.balanceStatus, "Suas despesas superaram suas receitas.");
      return;
    }

    if (balance > 0) {
      setText(elements.balanceStatus, "Seu saldo esta positivo. Bom trabalho!");
      return;
    }

    setText(elements.balanceStatus, "Receitas, despesas e metas estao equilibradas.");
  }

  function renderTransactions() {
    if (!elements.transactionList) {
      return;
    }

    updateCategoryFilterOptions();

    const filteredTransactions = getFilteredTransactions();
    elements.transactionList.innerHTML = "";

    if (appState.transactions.length === 0) {
      setText(elements.emptyStateText, "Nenhuma transacao cadastrada ainda.");
      elements.emptyState?.classList.remove("is-hidden");
      return;
    }

    if (filteredTransactions.length === 0) {
      setText(elements.emptyStateText, "Nenhuma transacao encontrada para esse filtro.");
      elements.emptyState?.classList.remove("is-hidden");
      return;
    }

    elements.emptyState?.classList.add("is-hidden");
    filteredTransactions.forEach((transaction) => {
      elements.transactionList.appendChild(createTransactionElement(transaction));
    });
  }

  function getFilteredTransactions() {
    const normalizedTerm = normalizeSearchText(searchTerm);

    return appState.transactions
      .filter((transaction) => {
        const matchesType = activeFilter === "all" || transaction.type === activeFilter;
        const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
        const searchableText = normalizeSearchText(`${transaction.description} ${transaction.category} ${getTransactionTypeLabel(transaction)}`);
        const matchesSearch = !normalizedTerm || searchableText.includes(normalizedTerm);
        return matchesType && matchesCategory && matchesSearch;
      })
      .sort(sortTransactions);
  }

  function sortTransactions(first, second) {
    if (sortMode === "oldest") {
      return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
    }

    if (sortMode === "highest") {
      return second.amount - first.amount;
    }

    if (sortMode === "lowest") {
      return first.amount - second.amount;
    }

    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  }

  function createTransactionElement(transaction) {
    const item = document.createElement("li");
    item.className = "transaction-item";
    item.dataset.id = transaction.id;

    const main = document.createElement("div");
    main.className = "transaction-main";

    const icon = document.createElement("span");
    icon.className = "transaction-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = getTransactionIcon(transaction);

    const title = document.createElement("div");
    title.className = "transaction-title";

    const description = document.createElement("strong");
    description.textContent = transaction.description;
    description.title = transaction.description;

    const details = document.createElement("span");
    details.textContent = `${getTransactionTypeLabel(transaction)} - ${transaction.category} - ${transaction.date}`;

    title.append(description, details);
    main.append(icon, title);

    const value = document.createElement("span");
    value.className = `transaction-value ${transaction.type}`;
    value.textContent = `${getTransactionSignal(transaction)} ${formatMoney(transaction.amount)}`;

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.textContent = "\u{1F5D1}\uFE0F";
    removeButton.setAttribute("aria-label", `Excluir transacao ${transaction.description}`);

    item.append(main, value, removeButton);
    return item;
  }

  function getTransactionIcon(transaction) {
    if (transaction.type === "income") {
      return "\u{1F4B5}";
    }

    if (transaction.type === "expense") {
      return "\u{1F4B3}";
    }

    return transaction.direction === "withdraw" ? "\u{1F4B8}" : "\u{1F4B0}";
  }

  function getTransactionTypeLabel(transaction) {
    if (transaction.type === "income") {
      return "Receita";
    }

    if (transaction.type === "expense") {
      return "Despesa";
    }

    return transaction.direction === "withdraw" ? "Transferencia - retirada" : "Transferencia - deposito";
  }

  function getTransactionSignal(transaction) {
    if (transaction.type === "income") {
      return "+";
    }

    if (transaction.type === "expense") {
      return "-";
    }

    return transaction.direction === "withdraw" ? "\u21A9" : "\u21AA";
  }

  function renderTips() {
    if (!elements.tipsList) {
      return;
    }

    elements.tipsList.innerHTML = "";
    getFinancialTips().forEach((tip) => {
      const item = document.createElement("li");
      item.textContent = tip;
      elements.tipsList.appendChild(item);
    });
  }

  function getFinancialTips() {
    const { income, expense, balance, saved } = appState.totals;
    const tips = [];

    if (appState.baseSalary <= 0) {
      return ["Registre seu salario para receber dicas personalizadas."];
    }

    if (expense > income) {
      tips.push("Voce esta gastando mais do que recebe. Considere reduzir gastos nao essenciais.");
    }

    if (income > 0 && expense < income * 0.5) {
      tips.push("Otimo trabalho. Voce esta mantendo seus gastos sob controle.");
    }

    if (income > 0 && saved < income * 0.2) {
      tips.push("Considere guardar uma parte maior da sua renda para metas e investimentos.");
    }

    if (balance > 0) {
      tips.push("Seu saldo esta saudavel. Continue mantendo o controle.");
    }

    if (getCompletedGoalsCount() > 0) {
      tips.push("Voce ja concluiu uma meta. Use esse ritmo para planejar o proximo objetivo.");
    }

    if (appState.transactions.some((transaction) => transaction.source === "extra-income")) {
      tips.push("Rendimentos extras foram registrados. Direcione parte deles para seus cofrinhos.");
    }

    return tips.length > 0 ? tips : ["Seu fluxo financeiro esta equilibrado. Continue acompanhando suas transacoes."];
  }

  function renderSummary() {
    const incomes = appState.transactions.filter((transaction) => transaction.type === "income");
    const expenses = appState.transactions.filter((transaction) => transaction.type === "expense");
    const largestIncome = getLargestValue(incomes);
    const largestExpense = getLargestValue(expenses);
    const averageIncome = getAverageValue(incomes);
    const averageExpense = getAverageValue(expenses);
    const totalMoved = appState.totals.income + appState.totals.expense + appState.totals.transfer;

    setText(elements.largestExpense, formatMoney(largestExpense));
    setText(elements.largestIncome, formatMoney(largestIncome));
    setText(elements.averageExpense, formatMoney(averageExpense));
    setText(elements.averageIncome, formatMoney(averageIncome));
    setText(elements.totalMoved, formatMoney(totalMoved));
  }

  function getLargestValue(transactions) {
    if (transactions.length === 0) {
      return 0;
    }

    return Math.max(...transactions.map((transaction) => transaction.amount));
  }

  function getAverageValue(transactions) {
    if (transactions.length === 0) {
      return 0;
    }

    const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    return total / transactions.length;
  }

  function renderRecentActivities() {
    renderCompactList(
      elements.recentActivityList,
      [...appState.transactions].sort(sortTransactions).slice(0, 5),
      "Nenhuma atividade recente.",
      (transaction) => ({
        title: transaction.description,
        meta: `${getTransactionTypeLabel(transaction)} - ${transaction.date}`,
        value: `${getTransactionSignal(transaction)} ${formatMoney(transaction.amount)}`
      })
    );
  }

  function renderFeaturedGoals() {
    const goals = [...appState.goals]
      .sort((first, second) => getGoalProgress(second).percent - getGoalProgress(first).percent)
      .slice(0, 3);

    renderCompactList(
      elements.featuredGoalsList,
      goals,
      "Crie uma meta para acompanhar seus cofrinhos.",
      (goal) => ({
        title: `${goal.icon} ${goal.name}`,
        meta: getGoalForecast(goal),
        value: `${getGoalProgress(goal).percent.toFixed(0)}%`
      })
    );
  }

  function renderCompactList(container, items, emptyText, mapper) {
    if (!container) {
      return;
    }

    container.innerHTML = "";

    if (items.length === 0) {
      const empty = document.createElement("article");
      empty.className = "compact-item";
      empty.innerHTML = `<p>${emptyText}</p>`;
      container.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const mapped = mapper(item);
      const card = document.createElement("article");
      card.className = "compact-item";

      const header = document.createElement("div");
      header.className = "compact-item-header";

      const title = document.createElement("strong");
      title.textContent = mapped.title;

      const value = document.createElement("span");
      value.textContent = mapped.value;

      const meta = document.createElement("p");
      meta.textContent = mapped.meta;

      header.append(title, value);
      card.append(header, meta);
      container.appendChild(card);
    });
  }

  function renderGoals() {
    if (!elements.goalList) {
      return;
    }

    updateTransferGoalOptions();
    updateGoalSummary();
    elements.goalList.innerHTML = "";

    if (appState.goals.length === 0) {
      const empty = document.createElement("article");
      empty.className = "compact-item";
      empty.innerHTML = "<p>Nenhuma meta criada ainda.</p>";
      elements.goalList.appendChild(empty);
      return;
    }

    appState.goals.forEach((goal) => {
      elements.goalList.appendChild(createGoalElement(goal));
    });
  }

  function updateGoalSummary() {
    const completed = getCompletedGoalsCount();
    const active = appState.goals.length - completed;
    const average = appState.goals.length === 0
      ? 0
      : appState.goals.reduce((sum, goal) => sum + getGoalProgress(goal).percent, 0) / appState.goals.length;

    setText(elements.goalsSavedTotal, formatMoney(getTotalSaved()));
    setText(elements.activeGoalsCount, String(active));
    setText(elements.completedGoalsCount, String(completed));
    setText(elements.averageGoalProgress, `${average.toFixed(0)}%`);
  }

  function createGoalElement(goal) {
    const progress = getGoalProgress(goal);
    const item = document.createElement("article");
    item.className = "goal-item";
    item.dataset.id = goal.id;
    item.style.setProperty("--goal-color", goal.color);

    const header = document.createElement("div");
    header.className = "goal-header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "goal-title";

    const icon = document.createElement("span");
    icon.className = "goal-icon";
    icon.textContent = goal.icon;

    const titleText = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = goal.name;
    title.title = goal.name;
    const forecast = document.createElement("p");
    forecast.textContent = getGoalForecast(goal);
    titleText.append(title, forecast);
    titleWrap.append(icon, titleText);

    const removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.type = "button";
    removeButton.textContent = "\u{1F5D1}\uFE0F";
    removeButton.setAttribute("aria-label", `Excluir meta ${goal.name}`);

    header.append(titleWrap, removeButton);

    const description = document.createElement("p");
    description.className = "goal-description";
    description.textContent = goal.description || "Meta de guardar dinheiro.";

    const values = document.createElement("div");
    values.className = "goal-values";
    values.innerHTML = `
      <span>Atual: ${formatMoney(goal.savedAmount)}</span>
      <span>Meta: ${formatMoney(goal.targetAmount)}</span>
      <span>${progress.percent.toFixed(0)}% atingido</span>
    `;

    const track = document.createElement("div");
    track.className = "goal-track";
    track.setAttribute("aria-hidden", "true");

    const fill = document.createElement("span");
    fill.className = "goal-fill";
    fill.style.width = `${progress.percent}%`;
    track.appendChild(fill);

    const actions = document.createElement("div");
    actions.className = "goal-actions-grid";
    actions.append(
      createGoalMoneyForm(goal, "deposit", "Guardar"),
      createGoalMoneyForm(goal, "withdraw", "Retirar")
    );

    const history = createGoalHistoryElement(goal);
    item.append(header, description, values, track, actions, history);
    return item;
  }

  function createGoalMoneyForm(goal, action, label) {
    const form = document.createElement("form");
    form.className = "goal-money-form";
    form.dataset.id = goal.id;
    form.dataset.action = action;
    form.autocomplete = "off";

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.placeholder = "0,00";
    input.setAttribute("aria-label", `${label} dinheiro na meta ${goal.name}`);

    const button = document.createElement("button");
    button.className = action === "deposit" ? "primary-button tiny-button" : "secondary-button tiny-button";
    button.type = "submit";
    button.textContent = label;

    form.append(input, button);
    return form;
  }

  function createGoalHistoryElement(goal) {
    const wrap = document.createElement("div");
    wrap.className = "goal-history";

    const title = document.createElement("p");
    title.textContent = "Historico de depositos e retiradas";

    const list = document.createElement("ul");
    list.className = "goal-history-list";

    const history = [...goal.history]
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
      .slice(0, 6);

    if (history.length === 0) {
      const empty = document.createElement("li");
      empty.textContent = "Nenhum movimento nesta meta.";
      list.appendChild(empty);
    } else {
      history.forEach((entry) => {
        const item = document.createElement("li");
        const label = entry.type === "withdraw" ? "Retirada" : "Deposito";
        item.innerHTML = `<span>${label} - ${entry.date}</span><strong>${formatMoney(entry.amount)}</strong>`;
        list.appendChild(item);
      });
    }

    wrap.append(title, list);
    return wrap;
  }

  function getGoalProgress(goal) {
    const current = Math.min(goal.savedAmount || 0, goal.targetAmount);
    const percent = goal.targetAmount > 0
      ? Math.min((current / goal.targetAmount) * 100, 100)
      : 0;

    return { current, percent };
  }

  function getGoalForecast(goal) {
    const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

    if (remaining === 0) {
      return "Meta concluida.";
    }

    if (!goal.deadline) {
      return `Faltam ${formatMoney(remaining)}.`;
    }

    const today = new Date();
    const deadline = new Date(`${goal.deadline}T00:00:00`);
    const days = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (!Number.isFinite(days) || days <= 0) {
      return `Prazo vencido. Faltam ${formatMoney(remaining)}.`;
    }

    const dailyNeed = remaining / days;
    return `Faltam ${days} dias. Guarde ${formatMoney(dailyNeed)} por dia.`;
  }

  function updateGoalCompletion(goal, shouldAwardXp = true) {
    if (goal.savedAmount >= goal.targetAmount && !goal.completedAt) {
      goal.completedAt = new Date().toISOString();

      if (shouldAwardXp) {
        awardXp(XP_REWARDS.goalCompleted);
      }
      return;
    }

    if (goal.savedAmount < goal.targetAmount) {
      goal.completedAt = null;
    }
  }

  function renderAchievements() {
    if (!elements.achievementList) {
      return;
    }

    const earned = getEarnedAchievements();
    const levelInfo = getLevelInfo(appState.profile.xp);

    setText(elements.earnedAchievementsCount, String(earned.length));
    setText(elements.totalXpAmount, `${appState.profile.xp} XP`);
    setText(elements.achievementLevel, String(levelInfo.level));
    setText(elements.achievementTitle, levelInfo.title);

    elements.achievementList.innerHTML = "";
    const groups = [...new Set(ACHIEVEMENTS.map((achievementDef) => achievementDef.category))];

    groups.forEach((group) => {
      const groupWrap = document.createElement("section");
      groupWrap.className = "achievement-group";

      const heading = document.createElement("h3");
      heading.textContent = group;
      groupWrap.appendChild(heading);

      ACHIEVEMENTS
        .filter((achievementDef) => achievementDef.category === group)
        .forEach((achievementDef) => {
          groupWrap.appendChild(createAchievementElement(achievementDef));
        });

      elements.achievementList.appendChild(groupWrap);
    });
  }

  function createAchievementElement(achievementDef) {
    const progress = getAchievementProgress(achievementDef);
    const earned = getAchievementRecord(achievementDef.id);
    const item = document.createElement("article");
    const recentlyUnlocked = earned && Date.now() - new Date(earned.unlockedAt).getTime() < 2500;

    item.className = `achievement-item ${earned ? "is-earned" : ""} ${recentlyUnlocked ? "is-new" : ""}`;

    const icon = document.createElement("span");
    icon.className = "achievement-icon";
    icon.textContent = earned ? achievementDef.icon : "\u{1F512}";

    const copy = document.createElement("div");
    copy.className = "achievement-copy";

    const title = document.createElement("strong");
    title.textContent = achievementDef.title;

    const description = document.createElement("p");
    description.textContent = earned
      ? `${achievementDef.description} Desbloqueada em ${new Date(earned.unlockedAt).toLocaleDateString("pt-BR")}.`
      : achievementDef.description;

    copy.append(title, description);

    const progressWrap = document.createElement("div");
    progressWrap.className = "achievement-progress";

    const track = document.createElement("div");
    track.className = "achievement-track";
    const fill = document.createElement("span");
    fill.className = "achievement-fill";
    fill.style.width = `${progress.percent}%`;
    track.appendChild(fill);

    const label = document.createElement("span");
    label.textContent = `${Math.min(progress.current, progress.target).toFixed(0)} / ${progress.target}`;
    progressWrap.append(track, label);

    item.append(icon, copy, progressWrap);
    return item;
  }

  function evaluateAchievements() {
    const earnedIds = new Set(appState.achievements.map((item) => item.id));
    let unlockedCount = 0;

    ACHIEVEMENTS.forEach((achievementDef) => {
      const progress = getAchievementProgress(achievementDef);

      if (progress.current >= progress.target && !earnedIds.has(achievementDef.id)) {
        appState.achievements.push({
          id: achievementDef.id,
          unlockedAt: new Date().toISOString()
        });
        earnedIds.add(achievementDef.id);
        unlockedCount += 1;
      }
    });

    if (unlockedCount > 0) {
      awardXp(unlockedCount * XP_REWARDS.achievement);
    }
  }

  function getAchievementProgress(achievementDef) {
    const current = Number(achievementDef.getValue()) || 0;
    const target = achievementDef.target;
    const percent = Math.min((current / target) * 100, 100);
    return { current, target, percent };
  }

  function getAchievementRecord(id) {
    return appState.achievements.find((achievementItem) => achievementItem.id === id) || null;
  }

  function getEarnedAchievements() {
    return appState.achievements.filter((achievementItem) => {
      return ACHIEVEMENTS.some((achievementDef) => achievementDef.id === achievementItem.id);
    });
  }

  function renderStats() {
    const monthly = getMonthlyData();
    const incomeAverage = getAverageFromValues(monthly.map((item) => item.income));
    const expenseAverage = getAverageFromValues(monthly.map((item) => item.expense));
    const topCategory = getTopCategory();

    setText(elements.monthlyIncomeAverage, formatMoney(incomeAverage));
    setText(elements.monthlyExpenseAverage, formatMoney(expenseAverage));
    setText(elements.statsSavedAmount, formatMoney(getTotalSaved()));
    setText(elements.topCategory, topCategory || "-");

    renderCompactList(
      elements.largestExpensesList,
      appState.transactions
        .filter((transaction) => transaction.type === "expense")
        .sort((first, second) => second.amount - first.amount)
        .slice(0, 5),
      "Nenhuma despesa registrada.",
      (transaction) => ({
        title: transaction.description,
        meta: `${transaction.category} - ${transaction.date}`,
        value: formatMoney(transaction.amount)
      })
    );

    renderCompactList(
      elements.categoryUsageList,
      getCategoryUsage().slice(0, 5),
      "Nenhuma categoria utilizada.",
      (category) => ({
        title: category.name,
        meta: `${category.count} movimento(s)`,
        value: formatMoney(category.amount)
      })
    );
  }

  function getMonthlyData() {
    const map = new Map();

    getRealTransactions().forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const key = Number.isNaN(date.getTime())
        ? transaction.date
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!map.has(key)) {
        map.set(key, { label: key, income: 0, expense: 0 });
      }

      const item = map.get(key);
      if (transaction.type === "income") {
        item.income += transaction.amount;
      } else {
        item.expense += transaction.amount;
      }
    });

    return Array.from(map.values()).sort((first, second) => first.label.localeCompare(second.label)).slice(-12);
  }

  function getAverageFromValues(values) {
    if (values.length === 0) {
      return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function getCategoryUsage() {
    const map = new Map();

    getRealTransactions().forEach((transaction) => {
      const current = map.get(transaction.category) || { name: transaction.category, count: 0, amount: 0 };
      current.count += 1;
      current.amount += transaction.amount;
      map.set(transaction.category, current);
    });

    return Array.from(map.values()).sort((first, second) => second.count - first.count || second.amount - first.amount);
  }

  function getTopCategory() {
    const [top] = getCategoryUsage();
    return top ? top.name : "";
  }

  function renderProfile() {
    const levelInfo = getLevelInfo(appState.profile.xp);

    if (elements.profileNameInput) {
      elements.profileNameInput.value = appState.profile.name;
    }

    if (elements.profileEmailInput) {
      elements.profileEmailInput.value = appState.profile.email;
    }

    if (elements.themeSelect) {
      elements.themeSelect.value = appState.profile.theme;
    }

    document.body.classList.toggle("theme-focus", appState.profile.theme === "focus");

    setText(elements.profileDisplayName, appState.profile.name || "Usuario Ephyra");
    setText(elements.profileTitleLabel, levelInfo.title);
    setText(elements.levelLabel, `Nivel ${levelInfo.level}`);
    setText(elements.xpText, `${levelInfo.currentXp} / ${levelInfo.nextLevelXp} XP`);
    setText(elements.heroLevelLabel, `Nivel ${levelInfo.level} - ${levelInfo.title}`);
    setWidth(elements.xpFill, `${levelInfo.percent}%`);
    setWidth(elements.heroXpFill, `${levelInfo.percent}%`);
    setText(elements.usageDays, String(getUsageDaysCount()));
    setText(elements.lastUseDate, appState.profile.lastUseDate ? new Date(appState.profile.lastUseDate).toLocaleDateString("pt-BR") : "-");
    setText(elements.profileGoalsCount, String(appState.goals.length));
    setText(elements.profileTransactionsCount, String(appState.transactions.length));
  }

  function getLevelInfo(totalXp) {
    const xp = Math.max(Number(totalXp) || 0, 0);
    const level = Math.floor(xp / 100) + 1;
    const currentXp = xp % 100;
    const nextLevelXp = 100;
    const titles = [
      "Iniciante financeiro",
      "Organizador",
      "Controlador",
      "Planejador",
      "Economista",
      "Investidor iniciante",
      "Estrategista",
      "Mestre financeiro",
      "Guardiao do saldo",
      "Lenda financeira"
    ];

    return {
      level,
      currentXp,
      nextLevelXp,
      percent: (currentXp / nextLevelXp) * 100,
      title: titles[Math.min(level - 1, titles.length - 1)]
    };
  }

  function awardXp(amount) {
    appState.profile.xp = Math.max(0, Math.floor(appState.profile.xp + amount));
  }

  function recordUsageDay() {
    const today = new Date().toISOString().slice(0, 10);
    appState.profile.lastUseDate = new Date().toISOString();

    if (!appState.profile.usageDays.includes(today)) {
      appState.profile.usageDays.push(today);
    }
  }

  function updatePositiveBalanceTracking() {
    const hasPositiveAchievement = appState.achievements.some((achievementItem) => achievementItem.id === "positive-balance");

    if (appState.totals.balance > 0) {
      appState.positiveBalanceSince = appState.positiveBalanceSince || new Date().toISOString();
      return;
    }

    if (!hasPositiveAchievement) {
      appState.positiveBalanceSince = null;
    }
  }

  function submitInitialSalary(event) {
    event.preventDefault();

    const amount = parseAmount(elements.salaryInput?.value);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage(elements.salaryMessage, "Informe um salario maior que zero.");
      elements.salaryInput?.focus();
      return;
    }

    appState.baseSalary = amount;
    appState.transactions.unshift(createTransaction({
      description: "Salario/Rendimento Principal",
      amount,
      type: "income",
      category: "Salario",
      source: "salary"
    }));

    awardXp(XP_REWARDS.transaction);
    saveState();
    elements.salaryForm?.reset();
    setMessage(elements.salaryMessage, "");
    elements.salaryModal?.classList.add("is-hidden");
    elements.appShell?.classList.remove("is-soft-locked");
    renderApp();
  }

  function openExtraIncomeModal() {
    elements.extraIncomeModal?.classList.remove("is-hidden");
    setMessage(elements.extraIncomeMessage, "");
    setTimeout(() => elements.extraIncomeDescriptionInput?.focus(), 40);
  }

  function closeExtraIncomePanel() {
    elements.extraIncomeModal?.classList.add("is-hidden");
    elements.extraIncomeForm?.reset();
    setMessage(elements.extraIncomeMessage, "");
  }

  function addExtraIncome(event) {
    event.preventDefault();

    const description = elements.extraIncomeDescriptionInput?.value.trim();
    const amount = parseAmount(elements.extraIncomeAmountInput?.value);

    if (!description) {
      setMessage(elements.extraIncomeMessage, "Informe a descricao do rendimento extra.");
      elements.extraIncomeDescriptionInput?.focus();
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage(elements.extraIncomeMessage, "Informe um valor maior que zero.");
      elements.extraIncomeAmountInput?.focus();
      return;
    }

    appState.transactions.unshift(createTransaction({
      description,
      amount,
      type: "income",
      category: "Outros",
      source: "extra-income"
    }));

    awardXp(XP_REWARDS.transaction);
    saveState();
    closeExtraIncomePanel();
    renderApp();
  }

  function addTransaction(event) {
    event.preventDefault();

    const description = elements.descriptionInput?.value.trim();
    const amount = parseAmount(elements.amountInput?.value);
    const type = getSelectedType();
    const category = elements.categoryInput?.value || "Outros";

    if (!description) {
      setMessage(elements.formMessage, "Informe uma descricao para a transacao.");
      elements.descriptionInput?.focus();
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage(elements.formMessage, "Informe um valor maior que zero, usando apenas numeros.");
      elements.amountInput?.focus();
      return;
    }

    appState.transactions.unshift(createTransaction({
      description,
      amount,
      type,
      category,
      source: "manual"
    }));

    awardXp(XP_REWARDS.transaction);
    saveState();
    renderApp();
    elements.transactionForm?.reset();
    const incomeRadio = document.querySelector('input[name="type"][value="income"]');
    if (incomeRadio) {
      incomeRadio.checked = true;
    }
    updateCategoryOptions();
    setMessage(elements.formMessage, "Transacao adicionada com sucesso.", "success");
    elements.descriptionInput?.focus();
  }

  function addGoal(event) {
    event.preventDefault();
    syncTotals();

    const name = elements.goalNameInput?.value.trim();
    const targetAmount = parseAmount(elements.goalAmountInput?.value);
    const savedAmountText = elements.goalSavedInput?.value.trim() || "";
    const savedAmount = savedAmountText ? parseAmount(savedAmountText) : 0;
    const color = isValidHexColor(elements.goalColorInput?.value) ? elements.goalColorInput.value : "#16a66a";
    const icon = elements.goalIconInput?.value || "\u{1F4B0}";
    const deadline = elements.goalDeadlineInput?.value || "";
    const description = elements.goalDescriptionInput?.value.trim() || "";

    if (!name) {
      setMessage(elements.goalMessage, "Informe o nome da meta.");
      elements.goalNameInput?.focus();
      return;
    }

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setMessage(elements.goalMessage, "Informe um valor desejado maior que zero.");
      elements.goalAmountInput?.focus();
      return;
    }

    if (savedAmountText && (!Number.isFinite(savedAmount) || savedAmount < 0)) {
      setMessage(elements.goalMessage, "Informe um valor atual valido.");
      elements.goalSavedInput?.focus();
      return;
    }

    if (savedAmount > targetAmount) {
      setMessage(elements.goalMessage, "O valor atual nao pode ser maior que o valor desejado.");
      elements.goalSavedInput?.focus();
      return;
    }

    if (savedAmount > appState.totals.balance) {
      setMessage(elements.goalMessage, "Saldo insuficiente para guardar esse valor na meta.");
      elements.goalSavedInput?.focus();
      return;
    }

    const goal = {
      id: createId("goal"),
      kind: "saving",
      name,
      targetAmount,
      savedAmount,
      color,
      icon,
      description,
      deadline,
      history: [],
      completedAt: null,
      createdAt: new Date().toISOString()
    };

    if (savedAmount > 0) {
      const transaction = createGoalTransferTransaction(goal, "deposit", savedAmount, "Valor inicial guardado");
      goal.history.unshift(createGoalHistory("deposit", savedAmount, "Valor inicial guardado", transaction.id));
      appState.transactions.unshift(transaction);
      awardXp(XP_REWARDS.goalDeposit);
    }

    updateGoalCompletion(goal);
    appState.goals.unshift(goal);
    awardXp(XP_REWARDS.goalCreated);
    saveState();
    renderApp();
    elements.goalForm?.reset();
    if (elements.goalColorInput) {
      elements.goalColorInput.value = "#16a66a";
    }
    setMessage(elements.goalMessage, "Meta criada com sucesso.", "success");
    elements.goalNameInput?.focus();
  }

  function createGoalHistory(type, amount, note, transactionId) {
    return {
      id: createId("goal-history"),
      type,
      amount,
      note,
      transactionId,
      date: new Date().toLocaleDateString("pt-BR"),
      createdAt: new Date().toISOString()
    };
  }

  function processGoalTransfer(goalId, action, amount) {
    syncTotals();

    const goal = appState.goals.find((item) => item.id === goalId);

    if (!goal) {
      setMessage(elements.goalMessage, "Selecione uma meta valida.");
      setMessage(elements.transferMessage, "Selecione uma meta valida.");
      return false;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage(elements.goalMessage, "Informe um valor maior que zero.");
      setMessage(elements.transferMessage, "Informe um valor maior que zero.");
      return false;
    }

    if (action === "deposit") {
      return depositToGoal(goal, amount);
    }

    return withdrawFromGoal(goal, amount);
  }

  function depositToGoal(goal, amount) {
    const remainingAmount = Math.max(goal.targetAmount - goal.savedAmount, 0);
    const amountToSave = Math.min(amount, remainingAmount);

    if (remainingAmount === 0) {
      setMessage(elements.goalMessage, "Essa meta ja foi concluida.", "success");
      setMessage(elements.transferMessage, "Essa meta ja foi concluida.", "success");
      return false;
    }

    if (amountToSave > appState.totals.balance) {
      setMessage(elements.goalMessage, "Saldo insuficiente para guardar esse valor na meta.");
      setMessage(elements.transferMessage, "Saldo insuficiente para guardar esse valor na meta.");
      return false;
    }

    goal.savedAmount = Math.min(goal.savedAmount + amountToSave, goal.targetAmount);
    const transaction = createGoalTransferTransaction(goal, "deposit", amountToSave, "Deposito na meta");
    goal.history.unshift(createGoalHistory("deposit", amountToSave, "Deposito na meta", transaction.id));
    appState.transactions.unshift(transaction);
    awardXp(XP_REWARDS.goalDeposit);
    updateGoalCompletion(goal);
    saveState();
    renderApp();
    setMessage(elements.goalMessage, `Valor guardado. Faltam ${formatMoney(Math.max(goal.targetAmount - goal.savedAmount, 0))}.`, "success");
    setMessage(elements.transferMessage, "Transferencia registrada com sucesso.", "success");
    return true;
  }

  function withdrawFromGoal(goal, amount) {
    if (amount > goal.savedAmount) {
      setMessage(elements.goalMessage, "Nao e possivel retirar mais dinheiro do que foi guardado.");
      setMessage(elements.transferMessage, "Nao e possivel retirar mais dinheiro do que foi guardado.");
      return false;
    }

    goal.savedAmount = Math.max(goal.savedAmount - amount, 0);
    const transaction = createGoalTransferTransaction(goal, "withdraw", amount, "Retirada da meta");
    goal.history.unshift(createGoalHistory("withdraw", amount, "Retirada da meta", transaction.id));
    appState.transactions.unshift(transaction);
    updateGoalCompletion(goal, false);
    saveState();
    renderApp();
    setMessage(elements.goalMessage, "Valor retirado da meta e devolvido ao saldo.", "success");
    setMessage(elements.transferMessage, "Transferencia registrada com sucesso.", "success");
    return true;
  }

  function handleTransferSubmit(event) {
    event.preventDefault();

    const goalId = elements.transferGoalSelect?.value;
    const amount = parseAmount(elements.transferAmountInput?.value);
    const action = getSelectedTransferDirection();

    if (processGoalTransfer(goalId, action, amount)) {
      elements.transferForm?.reset();
      const depositRadio = document.querySelector('input[name="transferDirection"][value="deposit"]');
      if (depositRadio) {
        depositRadio.checked = true;
      }
    }
  }

  function removeTransaction(transactionId) {
    const removedTransaction = appState.transactions.find((transaction) => transaction.id === transactionId);

    if (!removedTransaction) {
      return;
    }

    if (removedTransaction.type === "transfer" && removedTransaction.goalId) {
      reverseGoalTransfer(removedTransaction);
    }

    appState.transactions = appState.transactions.filter((transaction) => transaction.id !== transactionId);

    if (removedTransaction.source === "salary") {
      appState.baseSalary = findBaseSalaryFromTransactions(appState.transactions);
    }

    saveState();
    renderApp();
  }

  function reverseGoalTransfer(transaction) {
    const goal = appState.goals.find((item) => item.id === transaction.goalId);

    if (!goal) {
      return;
    }

    if (transaction.direction === "withdraw") {
      goal.savedAmount = Math.min(goal.savedAmount + transaction.amount, goal.targetAmount);
    } else {
      goal.savedAmount = Math.max(goal.savedAmount - transaction.amount, 0);
    }

    goal.history = goal.history.filter((entry) => entry.transactionId !== transaction.id);
    updateGoalCompletion(goal, false);
  }

  function removeGoal(goalId) {
    appState.goals = appState.goals.filter((goal) => goal.id !== goalId);
    appState.transactions = appState.transactions.filter((transaction) => transaction.goalId !== goalId);
    saveState();
    renderApp();
  }

  function handleTransactionListClick(event) {
    const removeButton = event.target.closest(".remove-button");

    if (!removeButton) {
      return;
    }

    const item = removeButton.closest(".transaction-item");
    const transactionId = item?.dataset.id;

    if (!transactionId) {
      return;
    }

    item.classList.add("is-removing");
    item.addEventListener("animationend", () => removeTransaction(transactionId), { once: true });
  }

  function handleGoalListClick(event) {
    const removeButton = event.target.closest(".remove-button");

    if (!removeButton) {
      return;
    }

    const item = removeButton.closest(".goal-item");
    const goalId = item?.dataset.id;

    if (!goalId) {
      return;
    }

    item.classList.add("is-removing");
    item.addEventListener("animationend", () => removeGoal(goalId), { once: true });
  }

  function handleGoalListSubmit(event) {
    const form = event.target.closest(".goal-money-form");

    if (!form) {
      return;
    }

    event.preventDefault();

    const input = form.querySelector("input");
    const amount = parseAmount(input?.value);

    if (processGoalTransfer(form.dataset.id, form.dataset.action, amount)) {
      input.value = "";
    }
  }

  function clearAllData() {
    const hasData = appState.transactions.length > 0
      || appState.goals.length > 0
      || appState.achievements.length > 0
      || appState.baseSalary > 0
      || appState.profile.xp > 0
      || appState.profile.usageDays.length > 0
      || Boolean(appState.profile.name)
      || Boolean(appState.profile.email);

    if (!hasData) {
      updateOnboardingGate();
      return;
    }

    const wantsToClear = confirm("Deseja apagar todas as transacoes, metas, conquistas e perfil salvo?");

    if (!wantsToClear) {
      return;
    }

    appState = createEmptyState();
    storageRemove(STORAGE_KEY);
    storageRemove(LEGACY_STORAGE_KEY);
    activeFilter = "all";
    categoryFilter = "all";
    searchTerm = "";
    sortMode = "newest";

    if (elements.searchInput) {
      elements.searchInput.value = "";
    }

    if (elements.sortSelect) {
      elements.sortSelect.value = "newest";
    }

    updateFilterButtons();
    closeExtraIncomePanel();
    renderApp();
  }

  function handleAmountInput(input) {
    if (!input) {
      return;
    }

    const sanitizedValue = sanitizeAmountValue(input.value);

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }
  }

  function switchTab(tabName) {
    elements.tabButtons.forEach((button) => {
      const active = button.dataset.tab === tabName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    elements.tabPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.tabPanel === tabName);
    });

    if (tabName === "stats") {
      updateCharts();
    }
  }

  function updateFilterButtons() {
    elements.filterButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.filter === activeFilter);
    });
  }

  function setMessage(element, message, type = "error") {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.toggle("is-success", type === "success");
  }

  function shouldLockApp() {
    return appState.baseSalary <= 0;
  }

  function updateOnboardingGate() {
    const locked = shouldLockApp();
    elements.salaryModal?.classList.toggle("is-hidden", !locked);
    elements.appShell?.classList.toggle("is-soft-locked", locked);

    if (locked) {
      setTimeout(() => elements.salaryInput?.focus(), 40);
    }
  }

  function exportTransactionsAsCsv() {
    const header = ["Descricao", "Valor", "Tipo", "Categoria", "Data", "Origem"];
    const rows = appState.transactions.map((transaction) => [
      transaction.description,
      transaction.amount.toFixed(2).replace(".", ","),
      getTransactionTypeLabel(transaction),
      transaction.category,
      transaction.date,
      transaction.source
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n");
    downloadFile("ephyra-transacoes.csv", csv, "text/csv;charset=utf-8");
  }

  function exportTransactionsAsJson() {
    downloadFile("ephyra-transacoes.json", JSON.stringify(appState.transactions, null, 2), "application/json");
  }

  function exportBackup() {
    saveState();
    downloadFile("ephyra-backup.json", JSON.stringify(appState, null, 2), "application/json");
  }

  function importBackup(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        appState = normalizeState(JSON.parse(String(reader.result)));
        recordUsageDay();
        saveState();
        renderApp();
        setMessage(elements.profileMessage, "Backup importado com sucesso.", "success");
      } catch (error) {
        setMessage(elements.profileMessage, "Nao foi possivel importar esse arquivo.");
      } finally {
        event.target.value = "";
      }
    });
    reader.readAsText(file);
  }

  function escapeCsv(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function downloadFile(fileName, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function saveProfile(event) {
    event.preventDefault();

    appState.profile.name = elements.profileNameInput?.value.trim() || "";
    appState.profile.email = elements.profileEmailInput?.value.trim() || "";
    appState.profile.theme = elements.themeSelect?.value === "focus" ? "focus" : "light";
    saveState();
    renderApp();
    setMessage(elements.profileMessage, "Perfil salvo com sucesso.", "success");
  }

  function initializeCharts() {
    if (typeof Chart === "undefined") {
      setText(elements.chartStatus, "Chart.js nao carregou. O painel continua funcionando normalmente sem os graficos.");
      elements.chartStatus?.classList.remove("is-ok");
      return;
    }

    setText(elements.chartStatus, "Graficos ativos com Chart.js.");
    elements.chartStatus?.classList.add("is-ok");

    Chart.defaults.font.family = "Arial, Helvetica, sans-serif";
    Chart.defaults.color = "#637083";

    createChart("pie", "#pieChart", {
      type: "doughnut",
      data: {
        labels: ["Receitas", "Despesas"],
        datasets: [{
          data: [0, 0],
          backgroundColor: ["#16a66a", "#dc3d4a"],
          borderColor: "#ffffff",
          borderWidth: 4
        }]
      },
      options: chartOptions({ legend: true })
    });

    createChart("bars", "#barChart", {
      type: "bar",
      data: {
        labels: ["Receitas", "Despesas", "Saldo", "Guardado"],
        datasets: [{
          label: "Valores",
          data: [0, 0, 0, 0],
          backgroundColor: ["#16a66a", "#dc3d4a", "#1769c2", "#1d7fe5"],
          borderRadius: 8
        }]
      },
      options: chartOptions({ legend: false, beginAtZero: true })
    });

    createChart("trend", "#trendChart", {
      type: "line",
      data: {
        labels: ["Inicio"],
        datasets: [{
          label: "Saldo disponivel",
          data: [0],
          borderColor: "#1769c2",
          backgroundColor: "rgba(23, 105, 194, 0.14)",
          pointBackgroundColor: "#16a66a",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          tension: 0.34,
          fill: true
        }]
      },
      options: chartOptions({ legend: false })
    });

    createChart("monthly", "#monthlyChart", {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          { label: "Receitas", data: [], backgroundColor: "#16a66a", borderRadius: 8 },
          { label: "Despesas", data: [], backgroundColor: "#dc3d4a", borderRadius: 8 }
        ]
      },
      options: chartOptions({ legend: true, beginAtZero: true })
    });

    createChart("category", "#categoryChart", {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: ["#1769c2", "#16a66a", "#dc3d4a", "#b77900", "#1d7fe5", "#0f7a4d", "#a72c37"],
          borderColor: "#ffffff",
          borderWidth: 4
        }]
      },
      options: chartOptions({ legend: true })
    });

    createChart("goal", "#goalChart", {
      type: "bar",
      data: {
        labels: [],
        datasets: [{
          label: "Progresso %",
          data: [],
          backgroundColor: "#1769c2",
          borderRadius: 8
        }]
      },
      options: chartOptions({ legend: false, beginAtZero: true, percentAxis: true })
    });
  }

  function createChart(key, selector, config) {
    if (charts[key]) {
      return;
    }

    const canvas = $(selector);

    if (canvas) {
      charts[key] = new Chart(canvas, config);
    }
  }

  function chartOptions({ legend = false, beginAtZero = false, percentAxis = false } = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: percentAxis || beginAtZero
        ? {
            y: {
              beginAtZero,
              max: percentAxis ? 100 : undefined,
              ticks: {
                callback: (value) => percentAxis ? `${value}%` : formatMoney(Number(value))
              }
            }
          }
        : undefined,
      plugins: {
        legend: { display: legend, position: "bottom" },
        tooltip: { callbacks: { label: chartTooltipLabel } }
      }
    };
  }

  function chartTooltipLabel(context) {
    const label = context.dataset?.label || context.label || "";
    const parsed = typeof context.parsed === "object" ? context.parsed.y : context.parsed;
    const value = Number(parsed) || 0;
    const isPercent = context.chart.canvas.id === "goalChart";
    return `${label ? `${label}: ` : ""}${isPercent ? `${value.toFixed(0)}%` : formatMoney(value)}`;
  }

  function updateCharts() {
    if (Object.keys(charts).length === 0) {
      return;
    }

    const { income, expense, balance, saved } = appState.totals;
    const trend = getTrendData();
    const monthly = getMonthlyData();
    const categories = getCategoryUsage().slice(0, 7);

    if (charts.pie) {
      charts.pie.data.datasets[0].data = [income, expense];
      charts.pie.update();
    }

    if (charts.bars) {
      charts.bars.data.datasets[0].data = [income, expense, balance, saved];
      charts.bars.data.datasets[0].backgroundColor = ["#16a66a", "#dc3d4a", balance >= 0 ? "#1769c2" : "#dc3d4a", "#1d7fe5"];
      charts.bars.update();
    }

    if (charts.trend) {
      charts.trend.data.labels = trend.labels;
      charts.trend.data.datasets[0].data = trend.values;
      charts.trend.data.datasets[0].borderColor = balance >= 0 ? "#1769c2" : "#dc3d4a";
      charts.trend.update();
    }

    if (charts.monthly) {
      charts.monthly.data.labels = monthly.map((item) => item.label);
      charts.monthly.data.datasets[0].data = monthly.map((item) => item.income);
      charts.monthly.data.datasets[1].data = monthly.map((item) => item.expense);
      charts.monthly.update();
    }

    if (charts.category) {
      charts.category.data.labels = categories.map((item) => item.name);
      charts.category.data.datasets[0].data = categories.map((item) => item.count);
      charts.category.update();
    }

    if (charts.goal) {
      charts.goal.data.labels = appState.goals.map((goal) => goal.name).slice(0, 8);
      charts.goal.data.datasets[0].data = appState.goals.map((goal) => getGoalProgress(goal).percent).slice(0, 8);
      charts.goal.update();
    }
  }

  function getTrendData() {
    const chronological = [...appState.transactions].sort((first, second) => {
      return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
    });

    let runningIncome = 0;
    let runningExpense = 0;
    let runningSaved = 0;
    const labels = ["Inicio"];
    const values = [0];

    chronological.forEach((transaction, index) => {
      if (transaction.type === "income") {
        runningIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        runningExpense += transaction.amount;
      } else if (transaction.direction === "deposit") {
        runningSaved += transaction.amount;
      } else if (transaction.direction === "withdraw") {
        runningSaved -= transaction.amount;
      }

      labels.push(`${index + 1}. ${transaction.date}`);
      values.push(Number((runningIncome - runningExpense - runningSaved).toFixed(2)));
    });

    const maxPoints = 12;
    return {
      labels: labels.slice(-maxPoints),
      values: values.slice(-maxPoints)
    };
  }

  function setupChartScriptListener() {
    const chartScript = $("#chartJsScript");

    if (!chartScript) {
      return;
    }

    chartScript.addEventListener("load", () => {
      initializeCharts();
      updateCharts();
    });

    chartScript.addEventListener("error", () => {
      setText(elements.chartStatus, "Chart.js nao carregou. O painel continua funcionando normalmente sem os graficos.");
      elements.chartStatus?.classList.remove("is-ok");
    });
  }

  function getTotalSaved(goals = appState.goals) {
    return goals.reduce((sum, goal) => sum + (Number(goal.savedAmount) || 0), 0);
  }

  function getCompletedGoalsCount() {
    return appState.goals.filter((goal) => goal.savedAmount >= goal.targetAmount).length;
  }

  function getGoalHistoryCount(type) {
    return appState.goals.reduce((sum, goal) => {
      return sum + goal.history.filter((entry) => entry.type === type).length;
    }, 0);
  }

  function getRealTransactions() {
    return appState.transactions.filter((transaction) => transaction.type === "income" || transaction.type === "expense");
  }

  function getUsedCategories() {
    return Array.from(new Set(appState.transactions.map((transaction) => transaction.category))).sort((a, b) => a.localeCompare(b));
  }

  function getUsageDaysCount() {
    return new Set(appState.profile.usageDays).size;
  }

  function findBaseSalaryFromTransactions(transactions) {
    const salaryTransaction = transactions.find((transaction) => transaction.source === "salary");
    return salaryTransaction ? salaryTransaction.amount : 0;
  }

  function bindEvents() {
    on(elements.salaryForm, "submit", submitInitialSalary);
    on(elements.extraIncomeButton, "click", openExtraIncomeModal);
    on(elements.extraIncomeForm, "submit", addExtraIncome);
    on(elements.closeExtraIncomeModal, "click", closeExtraIncomePanel);
    on(elements.transactionForm, "submit", addTransaction);
    on(elements.transferForm, "submit", handleTransferSubmit);
    on(elements.goalForm, "submit", addGoal);
    on(elements.transactionList, "click", handleTransactionListClick);
    on(elements.goalList, "click", handleGoalListClick);
    on(elements.goalList, "submit", handleGoalListSubmit);
    on(elements.clearDataButton, "click", clearAllData);
    on(elements.exportCsvButton, "click", exportTransactionsAsCsv);
    on(elements.exportJsonButton, "click", exportTransactionsAsJson);
    on(elements.exportBackupButton, "click", exportBackup);
    on(elements.importBackupButton, "click", () => elements.backupFileInput?.click());
    on(elements.backupFileInput, "change", importBackup);
    on(elements.profileForm, "submit", saveProfile);

    [
      elements.salaryInput,
      elements.extraIncomeAmountInput,
      elements.amountInput,
      elements.transferAmountInput,
      elements.goalAmountInput,
      elements.goalSavedInput
    ].forEach((input) => {
      on(input, "input", () => handleAmountInput(input));
    });

    on(elements.salaryInput, "input", () => setMessage(elements.salaryMessage, ""));
    on(elements.extraIncomeDescriptionInput, "input", () => setMessage(elements.extraIncomeMessage, ""));
    on(elements.extraIncomeAmountInput, "input", () => setMessage(elements.extraIncomeMessage, ""));
    on(elements.descriptionInput, "input", () => setMessage(elements.formMessage, ""));
    on(elements.amountInput, "input", () => setMessage(elements.formMessage, ""));
    on(elements.goalNameInput, "input", () => setMessage(elements.goalMessage, ""));
    on(elements.goalAmountInput, "input", () => setMessage(elements.goalMessage, ""));
    on(elements.goalSavedInput, "input", () => setMessage(elements.goalMessage, ""));
    on(elements.transferAmountInput, "input", () => setMessage(elements.transferMessage, ""));

    elements.tabButtons.forEach((button) => {
      on(button, "click", () => switchTab(button.dataset.tab));
    });

    elements.typeInputs.forEach((input) => {
      on(input, "change", () => {
        updateCategoryOptions();
        setMessage(elements.formMessage, "");
      });
    });

    elements.filterButtons.forEach((button) => {
      on(button, "click", () => {
        activeFilter = button.dataset.filter;
        updateFilterButtons();
        renderTransactions();
      });
    });

    on(elements.searchInput, "input", () => {
      searchTerm = elements.searchInput.value;
      renderTransactions();
    });

    on(elements.categoryFilter, "change", () => {
      categoryFilter = elements.categoryFilter.value;
      renderTransactions();
    });

    on(elements.sortSelect, "change", () => {
      sortMode = elements.sortSelect.value;
      renderTransactions();
    });

    on(elements.goalList, "input", (event) => {
      if (event.target.matches(".goal-money-form input")) {
        handleAmountInput(event.target);
      }
    });
  }

  function renderApp() {
    syncTotals();
    updateDashboard();
    renderTips();
    renderSummary();
    renderRecentActivities();
    renderFeaturedGoals();
    renderTransactions();
    renderGoals();
    renderStats();
    renderAchievements();
    renderProfile();
    updateCharts();
    updateOnboardingGate();
  }

  function bootApp() {
    collectElements();
    appState = loadState();
    recordUsageDay();
    bindEvents();
    updateCategoryOptions();
    updateFilterButtons();
    setupChartScriptListener();
    saveState();
    renderApp();
    initializeCharts();
    updateCharts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootApp, { once: true });
  } else {
    bootApp();
  }
})();
