
const STORAGE_KEY = "ephyra-finance-state";
const LEGACY_STORAGE_KEY = "ephyra-finance-transactions";

const CATEGORY_OPTIONS = {
  income: ["Salário", "Freelance", "Presente", "Bônus/Extra", "Outros"],
  expense: ["Alimentação", "Transporte", "Saúde", "Educação", "Lazer", "Contas", "Investimento", "Outros"]
};

const transactionForm = document.querySelector("#transactionForm");
const descriptionInput = document.querySelector("#descriptionInput");
const amountInput = document.querySelector("#amountInput");
const categoryInput = document.querySelector("#categoryInput");
const formMessage = document.querySelector("#formMessage");
const typeInputs = document.querySelectorAll('input[name="type"]');

const goalForm = document.querySelector("#goalForm");
const goalNameInput = document.querySelector("#goalNameInput");
const goalAmountInput = document.querySelector("#goalAmountInput");
const goalMessage = document.querySelector("#goalMessage");
const goalList = document.querySelector("#goalList");

const transactionList = document.querySelector("#transactionList");
const emptyState = document.querySelector("#emptyState");
const emptyStateText = document.querySelector("#emptyStateText");
const clearDataButton = document.querySelector("#clearDataButton");
const overspendingAlert = document.querySelector("#overspendingAlert");
const filterButtons = document.querySelectorAll("[data-filter]");
const searchInput = document.querySelector("#searchInput");

const balanceAmount = document.querySelector("#balanceAmount");
const dashboardBalanceAmount = document.querySelector("#dashboardBalanceAmount");
const balanceStatus = document.querySelector("#balanceStatus");
const incomeAmount = document.querySelector("#incomeAmount");
const expenseAmount = document.querySelector("#expenseAmount");
const transactionCount = document.querySelector("#transactionCount");
const needsAmount = document.querySelector("#needsAmount");
const wantsAmount = document.querySelector("#wantsAmount");
const investmentsAmount = document.querySelector("#investmentsAmount");
const incomeBar = document.querySelector("#incomeBar");
const expenseBar = document.querySelector("#expenseBar");
const incomeBarValue = document.querySelector("#incomeBarValue");
const expenseBarValue = document.querySelector("#expenseBarValue");

const tipsList = document.querySelector("#tipsList");
const achievementList = document.querySelector("#achievementList");
const chartStatus = document.querySelector("#chartStatus");

const largestExpense = document.querySelector("#largestExpense");
const largestIncome = document.querySelector("#largestIncome");
const averageExpense = document.querySelector("#averageExpense");
const averageIncome = document.querySelector("#averageIncome");
const totalMoved = document.querySelector("#totalMoved");

const onboardingOverlay = document.querySelector("#onboardingOverlay");
const onboardingForm = document.querySelector("#onboardingForm");
const onboardingSalaryInput = document.querySelector("#onboardingSalaryInput");
const onboardingMessage = document.querySelector("#onboardingMessage");

const extraIncomeButton = document.querySelector("#extraIncomeButton");
const extraIncomeOverlay = document.querySelector("#extraIncomeOverlay");
const extraIncomeForm = document.querySelector("#extraIncomeForm");
const extraIncomeDescriptionInput = document.querySelector("#extraIncomeDescriptionInput");
const extraIncomeAmountInput = document.querySelector("#extraIncomeAmountInput");
const extraIncomeMessage = document.querySelector("#extraIncomeMessage");
const extraIncomeCancelButton = document.querySelector("#extraIncomeCancelButton");

const tabButtons = document.querySelectorAll("[data-tab]");
const tabPanels = document.querySelectorAll("[data-tab-panel]");

let appState = loadState();
let activeFilter = "all";
let searchTerm = "";
let charts = {
  pie: null,
  bars: null,
  trend: null
};

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const ACHIEVEMENTS = [
  {
    id: "first-income",
    label: "🏆 Primeira receita cadastrada",
    isUnlocked: () => appState.transactions.some((transaction) => transaction.type === "income")
  },
  {
    id: "ten-transactions",
    label: "🏆 10 transações registradas",
    isUnlocked: () => appState.transactions.length >= 10
  },
  {
    id: "positive-30-days",
    label: "🏆 Saldo positivo por 30 dias",
    isUnlocked: () => hasPositiveBalanceFor30Days()
  },
  {
    id: "first-goal",
    label: "🏆 Primeira meta criada",
    isUnlocked: () => appState.goals.length > 0
  },
  {
    id: "goal-master",
    label: "🏆 Mestre da Poupança",
    isUnlocked: () => appState.goals.some((goal) => getGoalProgress(goal).percent >= 100)
  },
  {
    id: "green-month",
    label: "🏆 Mês no Verde",
    isUnlocked: () => {
      const { income, expense } = appState.totals;
      return income > 0 && income >= expense * 1.2;
    }
  },
  {
    id: "extra-bonus",
    label: "🏆 Bônus de Esforço",
    isUnlocked: () => appState.hasAddedExtraIncome === true
  },
  {
    id: "conscious-investor",
    label: "🏆 Investidor Consciente",
    isUnlocked: () => appState.transactions.some(
      (transaction) => transaction.type === "expense" && transaction.category === "Investimento"
    )
  }
];

function createEmptyState() {
  return {
    transactions: [],
    goals: [],
    achievements: [],
    positiveBalanceSince: null,
    hasAddedExtraIncome: false,
    totals: {
      income: 0,
      expense: 0,
      balance: 0
    }
  };
}

function loadState() {
  const savedState = localStorage.getItem(STORAGE_KEY);

  if (savedState) {
    try {
      return normalizeState(JSON.parse(savedState));
    } catch (error) {
      console.warn("Nao foi possivel carregar os dados salvos.", error);
    }
  }

  const legacyTransactions = localStorage.getItem(LEGACY_STORAGE_KEY);

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
  const safeState = createEmptyState();
  const transactions = Array.isArray(state.transactions) ? state.transactions : [];
  const goals = Array.isArray(state.goals) ? state.goals : [];
  const achievements = Array.isArray(state.achievements) ? state.achievements : [];

  safeState.transactions = transactions.map(normalizeTransaction).filter(Boolean);
  safeState.goals = goals.map(normalizeGoal).filter(Boolean);
  safeState.achievements = achievements.filter((achievement) => typeof achievement === "string");
  safeState.positiveBalanceSince = state.positiveBalanceSince || null;
  safeState.hasAddedExtraIncome = Boolean(state.hasAddedExtraIncome);
  safeState.totals = calculateTotals(safeState.transactions);

  return safeState;
}

function normalizeTransaction(transaction) {
  const amount = Number(transaction.amount);
  const type = transaction.type === "expense" ? "expense" : "income";
  const description = String(transaction.description || "").trim();
  const category = CATEGORY_OPTIONS[type].includes(transaction.category)
    ? transaction.category
    : "Outros";

  if (!description || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    id: transaction.id || createId("transaction"),
    description,
    amount,
    type,
    category,
    date: transaction.date || new Date().toLocaleDateString("pt-BR"),
    createdAt: transaction.createdAt || new Date().toISOString()
  };
}

function normalizeGoal(goal) {
  const targetAmount = Number(goal.targetAmount);
  const name = String(goal.name || "").trim();

  if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0) {
    return null;
  }

  return {
    id: goal.id || createId("goal"),
    name,
    targetAmount,
    createdAt: goal.createdAt || new Date().toISOString()
  };
}

function saveState() {
  syncTotals();
  updatePositiveBalanceTracking();
  evaluateAchievements();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

function syncTotals() {
  appState.totals = calculateTotals(appState.transactions);
}

function calculateTotals(transactions = appState.transactions) {
  return transactions.reduce(
    (totals, transaction) => {
      if (transaction.type === "income") {
        totals.income += transaction.amount;
      } else {
        totals.expense += transaction.amount;
      }

      totals.balance = totals.income - totals.expense;
      return totals;
    },
    { income: 0, expense: 0, balance: 0 }
  );
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatMoney(value) {
  return moneyFormatter.format(value);
}

function parseAmount(value) {
  const normalizedValue = value.trim().replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    return Number.NaN;
  }

  return Number(normalizedValue);
}

function sanitizeAmountValue(value) {
  const cleanedValue = value.replace(/[^\d,.]/g, "");
  const separatorIndex = cleanedValue.search(/[,.]/);

  if (separatorIndex === -1) {
    return cleanedValue;
  }

  const integerPart = cleanedValue.slice(0, separatorIndex).replace(/[,.]/g, "");
  const decimalSeparator = cleanedValue.charAt(separatorIndex);
  const decimalPart = cleanedValue
    .slice(separatorIndex + 1)
    .replace(/[,.]/g, "")
    .slice(0, 2);

  return `${integerPart}${decimalSeparator}${decimalPart}`;
}

function normalizeSearchText(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSelectedType() {
  return document.querySelector('input[name="type"]:checked')?.value || "income";
}

function updateCategoryOptions() {
  const selectedType = getSelectedType();
  categoryInput.innerHTML = "";

  CATEGORY_OPTIONS[selectedType].forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryInput.appendChild(option);
  });
}

function updateDashboard() {
  syncTotals();

  const { income, expense, balance } = appState.totals;
  const highestTotal = Math.max(income, expense, 1);
  const incomePercent = (income / highestTotal) * 100;
  const expensePercent = (expense / highestTotal) * 100;

  balanceAmount.textContent = formatMoney(balance);
  dashboardBalanceAmount.textContent = formatMoney(balance);
  incomeAmount.textContent = formatMoney(income);
  expenseAmount.textContent = formatMoney(expense);
  transactionCount.textContent = String(appState.transactions.length);

  needsAmount.textContent = formatMoney(income * 0.5);
  wantsAmount.textContent = formatMoney(income * 0.3);
  investmentsAmount.textContent = formatMoney(income * 0.2);

  incomeBar.style.width = `${incomePercent}%`;
  expenseBar.style.width = `${expensePercent}%`;
  incomeBarValue.textContent = formatMoney(income);
  expenseBarValue.textContent = formatMoney(expense);

  overspendingAlert.classList.toggle("is-hidden", expense <= income);
  updateBalanceStatus();
}

function updateBalanceStatus() {
  const { balance } = appState.totals;

  if (appState.transactions.length === 0) {
    balanceStatus.textContent = "Tudo pronto para comecar.";
    return;
  }

  if (balance > 0) {
    balanceStatus.textContent = "Seu saldo esta positivo. Bom trabalho!";
    return;
  }

  if (balance === 0) {
    balanceStatus.textContent = "Receitas e despesas estao equilibradas.";
    return;
  }

  balanceStatus.textContent = "Atencao: suas despesas superaram as receitas.";
}

function renderTransactions() {
  const filteredTransactions = getFilteredTransactions();

  transactionList.innerHTML = "";

  if (appState.transactions.length === 0) {
    emptyStateText.textContent = "Nenhuma transacao cadastrada ainda.";
    emptyState.classList.remove("is-hidden");
    return;
  }

  if (filteredTransactions.length === 0) {
    emptyStateText.textContent = "Nenhuma transacao encontrada para esse filtro.";
    emptyState.classList.remove("is-hidden");
    return;
  }

  emptyState.classList.add("is-hidden");
  filteredTransactions.forEach((transaction) => {
    transactionList.appendChild(createTransactionElement(transaction));
  });
}

function getFilteredTransactions() {
  const normalizedTerm = normalizeSearchText(searchTerm);

  return appState.transactions.filter((transaction) => {
    const matchesType = activeFilter === "all" || transaction.type === activeFilter;
    const searchableText = normalizeSearchText(`${transaction.description} ${transaction.category}`);
    const matchesSearch = !normalizedTerm || searchableText.includes(normalizedTerm);

    return matchesType && matchesSearch;
  });
}

function createTransactionElement(transaction) {
  const item = document.createElement("li");
  const isIncome = transaction.type === "income";

  item.className = "transaction-item";
  item.dataset.id = transaction.id;

  const main = document.createElement("div");
  main.className = "transaction-main";

  const icon = document.createElement("span");
  icon.className = "transaction-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = isIncome ? "💵" : "💳";

  const title = document.createElement("div");
  title.className = "transaction-title";

  const description = document.createElement("strong");
  description.textContent = transaction.description;
  description.title = transaction.description;

  const details = document.createElement("span");
  details.textContent = `${isIncome ? "Receita" : "Despesa"} - ${transaction.category} - ${transaction.date}`;

  title.append(description, details);
  main.append(icon, title);

  const value = document.createElement("span");
  value.className = `transaction-value ${isIncome ? "income" : "expense"}`;
  value.textContent = `${isIncome ? "+" : "-"} ${formatMoney(transaction.amount)}`;

  const removeButton = document.createElement("button");
  removeButton.className = "remove-button";
  removeButton.type = "button";
  removeButton.textContent = "🗑️";
  removeButton.setAttribute("aria-label", `Excluir transacao ${transaction.description}`);

  item.append(main, value, removeButton);

  return item;
}

function renderTips() {
  const tips = getFinancialTips();
  tipsList.innerHTML = "";

  tips.forEach((tip) => {
    const item = document.createElement("li");
    item.textContent = tip;
    tipsList.appendChild(item);
  });
}

function getFinancialTips() {
  const { income, expense, balance } = appState.totals;
  const tips = [];

  if (appState.transactions.length === 0) {
    tips.push("Cadastre receitas e despesas para receber dicas personalizadas.");
    return tips;
  }

  if (expense > income) {
    tips.push("Você está gastando mais do que recebe. Considere reduzir gastos não essenciais.");
  }

  if (income > 0 && expense < income * 0.5) {
    tips.push("Ótimo trabalho. Você está mantendo seus gastos sob controle.");
  }

  if (income > 0 && balance < income * 0.2) {
    tips.push("Considere reservar uma parte maior da sua renda para investimentos.");
  }

  if (balance > 0) {
    tips.push("Seu saldo está saudável. Continue mantendo o controle.");
  }

  if (appState.goals.length > 0 && balance > 0) {
    tips.push("Use seu saldo positivo para aproximar suas metas financeiras da conclusão.");
  }

  if (tips.length === 0) {
    tips.push("Seu fluxo financeiro está equilibrado. Continue acompanhando suas transações.");
  }

  return tips;
}

function renderSummary() {
  const incomeTransactions = appState.transactions.filter((transaction) => transaction.type === "income");
  const expenseTransactions = appState.transactions.filter((transaction) => transaction.type === "expense");
  const biggestIncome = getLargestTransaction(incomeTransactions);
  const biggestExpense = getLargestTransaction(expenseTransactions);
  const incomeAverage = getAverage(incomeTransactions);
  const expenseAverage = getAverage(expenseTransactions);
  const moved = appState.totals.income + appState.totals.expense;

  largestIncome.textContent = biggestIncome ? formatMoney(biggestIncome.amount) : formatMoney(0);
  largestExpense.textContent = biggestExpense ? formatMoney(biggestExpense.amount) : formatMoney(0);
  averageIncome.textContent = formatMoney(incomeAverage);
  averageExpense.textContent = formatMoney(expenseAverage);
  totalMoved.textContent = formatMoney(moved);
}

function getLargestTransaction(transactions) {
  return transactions.reduce((largest, transaction) => {
    if (!largest || transaction.amount > largest.amount) {
      return transaction;
    }

    return largest;
  }, null);
}

function getAverage(transactions) {
  if (transactions.length === 0) {
    return 0;
  }

  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  return total / transactions.length;
}

function renderGoals() {
  goalList.innerHTML = "";

  if (appState.goals.length === 0) {
    const empty = document.createElement("p");
    empty.className = "goal-copy";
    empty.textContent = "Nenhuma meta criada ainda.";
    goalList.appendChild(empty);
    return;
  }

  appState.goals.forEach((goal) => {
    goalList.appendChild(createGoalElement(goal));
  });
}

function createGoalElement(goal) {
  const progress = getGoalProgress(goal);
  const item = document.createElement("article");
  item.className = "goal-item";
  item.dataset.id = goal.id;

  const header = document.createElement("div");
  header.className = "goal-header";

  const title = document.createElement("strong");
  title.textContent = goal.name;
  title.title = goal.name;

  const removeButton = document.createElement("button");
  removeButton.className = "remove-button";
  removeButton.type = "button";
  removeButton.textContent = "🗑️";
  removeButton.setAttribute("aria-label", `Excluir meta ${goal.name}`);

  header.append(title, removeButton);

  const values = document.createElement("div");
  values.className = "goal-values";

  const currentValue = document.createElement("span");
  currentValue.textContent = `Valor atual: ${formatMoney(progress.current)}`;

  const targetValue = document.createElement("span");
  targetValue.textContent = `Meta: ${formatMoney(goal.targetAmount)}`;

  const percentValue = document.createElement("span");
  percentValue.textContent = `${progress.percent.toFixed(0)}% atingido`;

  values.append(currentValue, targetValue, percentValue);

  const track = document.createElement("div");
  track.className = "goal-track";
  track.setAttribute("aria-hidden", "true");

  const fill = document.createElement("span");
  fill.className = "goal-fill";
  fill.style.width = `${progress.percent}%`;

  track.appendChild(fill);
  item.append(header, values, track);

  return item;
}

function getGoalProgress(goal) {
  const availableBalance = Math.max(appState.totals.balance, 0);
  const current = Math.min(availableBalance, goal.targetAmount);
  const percent = Math.min((current / goal.targetAmount) * 100, 100);

  return { current, percent };
}

function renderAchievements() {
  achievementList.innerHTML = "";

  ACHIEVEMENTS.forEach((achievement) => {
    const item = document.createElement("article");
    const earned = appState.achievements.includes(achievement.id);

    item.className = `achievement-item ${earned ? "is-earned" : ""}`;
    item.textContent = earned ? achievement.label : `🔒 ${achievement.label.replace("🏆 ", "")}`;

    achievementList.appendChild(item);
  });
}

function updatePositiveBalanceTracking() {
  const hasAchievement = appState.achievements.includes("positive-30-days");

  if (appState.totals.balance > 0) {
    appState.positiveBalanceSince = appState.positiveBalanceSince || new Date().toISOString();
    return;
  }

  if (!hasAchievement) {
    appState.positiveBalanceSince = null;
  }
}

function hasPositiveBalanceFor30Days() {
  if (!appState.positiveBalanceSince || appState.totals.balance <= 0) {
    return false;
  }

  const startDate = new Date(appState.positiveBalanceSince);

  if (Number.isNaN(startDate.getTime())) {
    return false;
  }

  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - startDate.getTime() >= thirtyDays;
}

function evaluateAchievements() {
  const earnedAchievements = new Set(appState.achievements);

  ACHIEVEMENTS.forEach((achievement) => {
    if (achievement.isUnlocked()) {
      earnedAchievements.add(achievement.id);
    }
  });

  appState.achievements = Array.from(earnedAchievements);
}

function initializeCharts() {
  if (typeof Chart === "undefined") {
    chartStatus.textContent = "Chart.js nao carregou. Verifique a conexao para visualizar os graficos.";
    return;
  }

  chartStatus.textContent = "Graficos ativos com Chart.js.";
  chartStatus.classList.add("is-ok");

  Chart.defaults.font.family = "Arial, Helvetica, sans-serif";
  Chart.defaults.color = "#637083";

  charts.pie = new Chart(document.querySelector("#pieChart"), {
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
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: { label: chartTooltipLabel } }
      }
    }
  });

  charts.bars = new Chart(document.querySelector("#barChart"), {
    type: "bar",
    data: {
      labels: ["Receitas", "Despesas", "Saldo"],
      datasets: [{
        label: "Valores",
        data: [0, 0, 0],
        backgroundColor: ["#16a66a", "#dc3d4a", "#1769c2"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => formatMoney(Number(value)) }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: chartTooltipLabel } }
      }
    }
  });

  charts.trend = new Chart(document.querySelector("#trendChart"), {
    type: "line",
    data: {
      labels: ["Inicio"],
      datasets: [{
        label: "Saldo acumulado",
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
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: { callback: (value) => formatMoney(Number(value)) }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: chartTooltipLabel } }
      }
    }
  });
}

function chartTooltipLabel(context) {
  const label = context.label ? `${context.label}: ` : "";
  return `${label}${formatMoney(Number(context.parsed.y ?? context.parsed))}`;
}

function updateCharts() {
  if (!charts.pie || !charts.bars || !charts.trend) {
    return;
  }

  const { income, expense, balance } = appState.totals;
  const trend = getTrendData();

  charts.pie.data.datasets[0].data = [income, expense];
  charts.pie.update();

  charts.bars.data.datasets[0].data = [income, expense, balance];
  charts.bars.data.datasets[0].backgroundColor = ["#16a66a", "#dc3d4a", balance >= 0 ? "#1769c2" : "#dc3d4a"];
  charts.bars.update();

  charts.trend.data.labels = trend.labels;
  charts.trend.data.datasets[0].data = trend.values;
  charts.trend.data.datasets[0].borderColor = balance >= 0 ? "#1769c2" : "#dc3d4a";
  charts.trend.update();
}

function getTrendData() {
  const chronological = [...appState.transactions].sort((first, second) => {
    return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
  });

  let runningBalance = 0;
  const labels = ["Inicio"];
  const values = [0];

  chronological.forEach((transaction, index) => {
    runningBalance += transaction.type === "income" ? transaction.amount : -transaction.amount;
    labels.push(`${index + 1}. ${transaction.date}`);
    values.push(Number(runningBalance.toFixed(2)));
  });

  const maxPoints = 12;
  return {
    labels: labels.slice(-maxPoints),
    values: values.slice(-maxPoints)
  };
}

function setMessage(element, message, type = "error") {
  element.textContent = message;
  element.classList.toggle("is-success", type === "success");
}

function clearFormMessage() {
  setMessage(formMessage, "");
}

function clearGoalMessage() {
  setMessage(goalMessage, "");
}

function addTransaction(event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = parseAmount(amountInput.value);
  const type = getSelectedType();
  const category = categoryInput.value || "Outros";

  if (!description) {
    setMessage(formMessage, "Informe uma descricao para a transacao.");
    descriptionInput.focus();
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    setMessage(formMessage, "Informe um valor maior que zero, usando apenas numeros.");
    amountInput.focus();
    return;
  }

  appState.transactions.unshift({
    id: createId("transaction"),
    description,
    amount,
    type,
    category,
    date: new Date().toLocaleDateString("pt-BR"),
    createdAt: new Date().toISOString()
  });

  saveState();
  renderApp();
  transactionForm.reset();
  document.querySelector('input[name="type"][value="income"]').checked = true;
  updateCategoryOptions();
  setMessage(formMessage, "Transacao adicionada com sucesso.", "success");
  descriptionInput.focus();
}

function removeTransaction(transactionId) {
  appState.transactions = appState.transactions.filter(
    (transaction) => transaction.id !== transactionId
  );
  saveState();
  renderApp();
}

function addGoal(event) {
  event.preventDefault();

  const name = goalNameInput.value.trim();
  const targetAmount = parseAmount(goalAmountInput.value);

  if (!name) {
    setMessage(goalMessage, "Informe o nome da meta.");
    goalNameInput.focus();
    return;
  }

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    setMessage(goalMessage, "Informe um valor desejado maior que zero.");
    goalAmountInput.focus();
    return;
  }

  appState.goals.unshift({
    id: createId("goal"),
    name,
    targetAmount,
    createdAt: new Date().toISOString()
  });

  saveState();
  renderApp();
  goalForm.reset();
  setMessage(goalMessage, "Meta criada com sucesso.", "success");
  goalNameInput.focus();
}

function removeGoal(goalId) {
  appState.goals = appState.goals.filter((goal) => goal.id !== goalId);
  saveState();
  renderApp();
}

function handleTransactionListClick(event) {
  const removeButton = event.target.closest(".remove-button");

  if (!removeButton) {
    return;
  }

  const item = removeButton.closest(".transaction-item");
  const transactionId = item.dataset.id;

  item.classList.add("is-removing");
  item.addEventListener("animationend", () => removeTransaction(transactionId), { once: true });
}

function handleGoalListClick(event) {
  const removeButton = event.target.closest(".remove-button");

  if (!removeButton) {
    return;
  }

  const item = removeButton.closest(".goal-item");
  const goalId = item.dataset.id;

  item.classList.add("is-removing");
  item.addEventListener("animationend", () => removeGoal(goalId), { once: true });
}

function clearAllData() {
  const hasData = appState.transactions.length > 0
    || appState.goals.length > 0
    || appState.achievements.length > 0;

  if (!hasData) {
    setMessage(formMessage, "Nao existem dados para limpar.");
    return;
  }

  const wantsToClear = confirm("Deseja apagar todas as transacoes, metas e conquistas salvas?");

  if (!wantsToClear) {
    return;
  }

  appState = createEmptyState();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  activeFilter = "all";
  searchTerm = "";
  searchInput.value = "";
  updateFilterButtons();
  renderApp();
  setMessage(formMessage, "Todos os dados foram apagados.", "success");
  checkOnboarding();
}

function checkOnboarding() {
  const needsOnboarding = appState.transactions.length === 0;
  onboardingOverlay.classList.toggle("is-hidden", !needsOnboarding);
  document.body.style.overflow = needsOnboarding ? "hidden" : "";
}

function handleOnboardingSubmit(event) {
  event.preventDefault();

  const amount = parseAmount(onboardingSalaryInput.value);

  if (!Number.isFinite(amount) || amount <= 0) {
    setMessage(onboardingMessage, "Informe um valor de salario maior que zero.");
    onboardingSalaryInput.focus();
    return;
  }

  appState.transactions.unshift({
    id: createId("transaction"),
    description: "Salário",
    amount,
    type: "income",
    category: "Salário",
    date: new Date().toLocaleDateString("pt-BR"),
    createdAt: new Date().toISOString()
  });

  saveState();
  renderApp();
  onboardingForm.reset();
  setMessage(onboardingMessage, "");
  checkOnboarding();
}

function openExtraIncomeModal() {
  extraIncomeOverlay.classList.remove("is-hidden");
  extraIncomeDescriptionInput.focus();
}

function closeExtraIncomeModal() {
  extraIncomeOverlay.classList.add("is-hidden");
  extraIncomeForm.reset();
  setMessage(extraIncomeMessage, "");
}

function handleExtraIncomeSubmit(event) {
  event.preventDefault();

  const description = extraIncomeDescriptionInput.value.trim() || "Rendimento extra";
  const amount = parseAmount(extraIncomeAmountInput.value);

  if (!Number.isFinite(amount) || amount <= 0) {
    setMessage(extraIncomeMessage, "Informe um valor maior que zero.");
    extraIncomeAmountInput.focus();
    return;
  }

  appState.transactions.unshift({
    id: createId("transaction"),
    description,
    amount,
    type: "income",
    category: "Bônus/Extra",
    date: new Date().toLocaleDateString("pt-BR"),
    createdAt: new Date().toISOString()
  });

  appState.hasAddedExtraIncome = true;

  saveState();
  renderApp();
  closeExtraIncomeModal();
  setMessage(formMessage, "Rendimento extra adicionado com sucesso.", "success");
}

function switchTab(tabName) {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabName);
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.tabPanel !== tabName);
  });
}

function handleAmountInput(input) {
  const sanitizedValue = sanitizeAmountValue(input.value);

  if (input.value !== sanitizedValue) {
    input.value = sanitizedValue;
  }
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === activeFilter);
  });
}

function renderApp() {
  syncTotals();
  renderTransactions();
  updateDashboard();
  renderTips();
  renderSummary();
  renderGoals();
  renderAchievements();
  updateCharts();
}

transactionForm.addEventListener("submit", addTransaction);
goalForm.addEventListener("submit", addGoal);

descriptionInput.addEventListener("input", clearFormMessage);
amountInput.addEventListener("input", () => {
  handleAmountInput(amountInput);
  clearFormMessage();
});
goalNameInput.addEventListener("input", clearGoalMessage);
goalAmountInput.addEventListener("input", () => {
  handleAmountInput(goalAmountInput);
  clearGoalMessage();
});

typeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateCategoryOptions();
    clearFormMessage();
  });
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    updateFilterButtons();
    renderTransactions();
  });
});

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value;
  renderTransactions();
});

transactionList.addEventListener("click", handleTransactionListClick);
goalList.addEventListener("click", handleGoalListClick);
clearDataButton.addEventListener("click", clearAllData);

onboardingForm.addEventListener("submit", handleOnboardingSubmit);
onboardingSalaryInput.addEventListener("input", () => {
  handleAmountInput(onboardingSalaryInput);
  setMessage(onboardingMessage, "");
});

extraIncomeButton.addEventListener("click", openExtraIncomeModal);
extraIncomeCancelButton.addEventListener("click", closeExtraIncomeModal);
extraIncomeForm.addEventListener("submit", handleExtraIncomeSubmit);
extraIncomeAmountInput.addEventListener("input", () => {
  handleAmountInput(extraIncomeAmountInput);
  setMessage(extraIncomeMessage, "");
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

updateCategoryOptions();
initializeCharts();
saveState();
renderApp();
checkOnboarding();
