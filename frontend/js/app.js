// ===== Config & State =====

const API_URL = "http://localhost:3000/api/expenses";

let expenses = [];
let pendingDeleteId = null;

let sortColumn = null;
let sortDirection = "asc";

let categoryChart = null;
let monthlyChart = null;

// ===== DOM Elements =====

const toggleBtn = document.getElementById("darkModeToggle");

const errorAlert = document.getElementById("error-alert");
const errorAlertMessage = document.getElementById("error-alert-message");
const errorAlertClose = document.getElementById("error-alert-close");

const deleteConfirmModal = document.getElementById("delete-confirm-modal");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const successToastEl = document.getElementById("success-toast");
const successToastMessage = document.getElementById("success-toast-message");

const totalAmount = document.getElementById("total-amount");
const expensesCount = document.getElementById("expenses-count");
const highestAmount = document.getElementById("highest-amount");
const highestName = document.getElementById("highest-name");

const expenseForm = document.getElementById("expense-form");

const expenseTitle = document.getElementById("expense-title");
const titleError = document.getElementById("title-error");

const expenseAmount = document.getElementById("expense-amount");
const amountError = document.getElementById("amount-error");

const expenseCategory = document.getElementById("expense-category");
const categoryError = document.getElementById("category-error");

const expenseDate = document.getElementById("expense-date");
const dateError = document.getElementById("date-error");

const addExpenseBtn = document.getElementById("add-expense-btn");
const spinnerBtn = document.getElementById("add-expense-spinner");

const exportCsvBtn = document.getElementById("export-csv-btn");
const filterToggleBtn = document.getElementById("filter-toggle-btn");
const filtersPanel = document.getElementById("filters-panel");

const filterCategory = document.getElementById("filter-category");
const searchTitle = document.getElementById("search-title");
const filterMonth = document.getElementById("filter-month");

const expensesSpinnerOverlay = document.getElementById(
  "expenses-spinner-overlay",
);

const expensesBody = document.getElementById("expenses-body");
const expensesTableHead = document.querySelector(".expenses-table thead");

const editModal = document.getElementById("edit-modal");

const editForm = document.getElementById("edit-form");
const editId = document.getElementById("edit-id");
const editTitle = document.getElementById("edit-title");
const editAmount = document.getElementById("edit-amount");
const editCategory = document.getElementById("edit-category");
const editDate = document.getElementById("edit-date");

const editTitleError = document.getElementById("edit-title-error");
const editAmountError = document.getElementById("edit-amount-error");
const editCategoryError = document.getElementById("edit-category-error");
const editDateError = document.getElementById("edit-date-error");

const saveChangesBtn = document.getElementById("save-changes-btn");

const addFields = {
  title: { input: expenseTitle, error: titleError },
  amount: { input: expenseAmount, error: amountError },
  category: { input: expenseCategory, error: categoryError },
  date: { input: expenseDate, error: dateError },
};

const editFields = {
  title: { input: editTitle, error: editTitleError },
  amount: { input: editAmount, error: editAmountError },
  category: { input: editCategory, error: editCategoryError },
  date: { input: editDate, error: editDateError },
};

// ===== API =====

async function getExpenses() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

async function addExpense(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

async function updateExpense(id, data) {
  const response = await fetch(API_URL + "/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

async function deleteExpense(id) {
  const response = await fetch(API_URL + "/" + id, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

// ===== Refresh =====

async function refresh() {
  showTableLoading();

  const minDelay = new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const [data] = await Promise.all([getExpenses(), minDelay]);
    expenses = data;

    renderSummary(expenses);

    const filteredList = applyFilter();

    renderTable(filteredList);
    renderCharts(expenses, filteredList);
  } catch (error) {
    showAlertError(error.message);
    renderTable([], "Failed to load expenses.");
  } finally {
    hideTableLoading();
  }
}

// ===== UI Helpers =====

function setError(input, errorEl, message) {
  errorEl.textContent = message;
  input.setAttribute("aria-invalid", "true");
}

function clearError(input, errorEl) {
  errorEl.textContent = "";
  input.setAttribute("aria-invalid", "false");
}

function showAlertError(message) {
  errorAlertMessage.textContent = message;
  errorAlert.classList.remove("d-none");
}

function hideAlertError() {
  errorAlert.classList.add("d-none");
}

function showSuccessToast(message) {
  successToastMessage.textContent = message;
  const toast = bootstrap.Toast.getOrCreateInstance(successToastEl, {
    delay: 3000,
  });
  toast.show();
}

function showTableLoading() {
  expensesSpinnerOverlay.classList.add("is-visible");
}

function hideTableLoading() {
  expensesSpinnerOverlay.classList.remove("is-visible");
}

// ===== Validation =====

function validateForm(fields) {
  const { title, amount, category, date } = fields;

  let isValid = true;

  if (title.input.value.trim() === "") {
    setError(title.input, title.error, "Enter a title.");
    isValid = false;
  } else {
    clearError(title.input, title.error);
  }

  const amountValue = Number(amount.input.value);

  if (isNaN(amountValue) || amountValue <= 0) {
    setError(amount.input, amount.error, "Enter an amount greater than 0.");
    isValid = false;
  } else {
    clearError(amount.input, amount.error);
  }

  if (category.input.value === "") {
    setError(category.input, category.error, "Choose a category.");
    isValid = false;
  } else {
    clearError(category.input, category.error);
  }

  if (date.input.value === "") {
    setError(date.input, date.error, "Pick a date.");
    isValid = false;
  } else {
    clearError(date.input, date.error);
  }

  return isValid;
}

// ===== Utils =====

function setTodayDate() {
  expenseDate.value = new Date().toLocaleDateString("en-CA");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ===== Rendering =====

function renderTable(list, emptyMessage = "No expenses yet. Add one above.") {
  if (list.length === 0) {
    expensesBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-secondary py-4">
          ${emptyMessage}
        </td>
      </tr>
    `;

    return;
  }

  expensesBody.innerHTML = list
    .map((e) => {
      const category = escapeHtml(e.category);
      const id = escapeHtml(e.id);

      return `
        <tr>
          <td>${escapeHtml(e.title)}</td>

          <td class="text-end">
            ${Number(e.amount).toFixed(2)}
          </td>

          <td>
            <span class="category-badge category-${category.toLowerCase()}">
              ${category}
            </span>
          </td>

          <td>
            ${escapeHtml(String(e.date).slice(0, 10))}
          </td>

          <td>
            <div class="actions">
              <button
                class="btn btn-sm btn-outline-secondary"
                data-action="edit"
                data-id="${id}"
              >
                Edit
              </button>

              <button
                class="btn btn-sm btn-outline-danger"
                data-action="delete"
                data-id="${id}"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderSummary(list) {
  let total = 0;
  let highest = null;

  list.forEach((e) => {
    const amount = Number(e.amount);

    total += amount;

    if (highest === null || amount > Number(highest.amount)) {
      highest = e;
    }
  });

  totalAmount.textContent = total.toFixed(2);

  expensesCount.textContent = list.length;

  highestAmount.textContent = highest
    ? Number(highest.amount).toFixed(2)
    : "0.00";

  highestName.textContent = highest ? highest.title : "—";
}

// ===== Filter & Sort =====

function filterList() {
  const categoryValue = filterCategory.value;
  const searchTitleValue = searchTitle.value.trim().toLowerCase();
  const filterMonthValue = filterMonth.value;

  return expenses.filter((e) => {
    const matchesCategory =
      categoryValue === "All" || e.category === categoryValue;

    const matchesMonth =
      filterMonthValue === "" || e.date.slice(0, 7) === filterMonthValue;

    const matchesSearch =
      searchTitleValue === "" ||
      e.title.toLowerCase().includes(searchTitleValue);

    return matchesCategory && matchesMonth && matchesSearch;
  });
}

function sortList(list) {
  if (!sortColumn) {
    return list;
  }

  const directionMultiplier = sortDirection === "asc" ? 1 : -1;

  const sorted = [...list].sort((a, b) => {
    const valueA = a[sortColumn];
    const valueB = b[sortColumn];

    if (sortColumn === "amount") {
      return (Number(valueA) - Number(valueB)) * directionMultiplier;
    }

    if (sortColumn === "date") {
      return String(valueA).localeCompare(String(valueB)) * directionMultiplier;
    }

    return (
      String(valueA).localeCompare(String(valueB), undefined, {
        sensitivity: "base",
      }) * directionMultiplier
    );
  });

  return sorted;
}

function updateSortIndicators() {
  document.querySelectorAll("[data-sort-indicator]").forEach((el) => {
    const column = el.dataset.sortIndicator;

    if (column !== sortColumn) {
      el.textContent = "";
      return;
    }

    el.textContent = sortDirection === "asc" ? "▲" : "▼";
  });
}

function applyFilter() {
  const filtered = filterList();

  const sorted = sortList(filtered);

  const categoryValue = filterCategory.value;
  const searchTitleValue = searchTitle.value.trim();
  const filterMonthValue = filterMonth.value;

  const emptyMessage =
    categoryValue === "All" &&
    filterMonthValue === "" &&
    searchTitleValue === ""
      ? "No expenses yet. Add one above."
      : "No expenses match your filters.";

  renderTable(sorted, emptyMessage);

  return sorted;
}

// ===== CSV Export =====

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function buildCsv(list) {
  const header = ["Title", "Amount", "Category", "Date"];

  const rows = list.map((e) => [
    e.title,
    Number(e.amount).toFixed(2),
    e.category,
    String(e.date).slice(0, 10),
  ]);

  const lines = [header, ...rows].map((row) =>
    row.map(escapeCsvValue).join(","),
  );

  return lines.join("\r\n");
}

function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function getCurrentFilename() {
  const today = new Date().toLocaleDateString("en-CA");
  return `expenses-${today}.csv`;
}

// ===== Charts =====

function getCategoryTotals(list) {
  const totals = {
    Food: 0,
    Transport: 0,
    Bills: 0,
    Entertainment: 0,
    Other: 0,
  };

  list.forEach((expense) => {
    totals[expense.category] += Number(expense.amount);
  });

  return totals;
}

function getMonthlyTotals(list) {
  const totals = {};

  list.forEach((expense) => {
    const month = expense.date.slice(0, 7);

    if (!totals[month]) {
      totals[month] = 0;
    }

    totals[month] += Number(expense.amount);
  });

  return Object.fromEntries(
    Object.entries(totals).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function renderCharts(allExpenses, filteredList) {
  const categoryTotals = getCategoryTotals(filteredList);
  const monthlyTotals = getMonthlyTotals(allExpenses);

  if (categoryChart) {
    categoryChart.destroy();
  }

  if (monthlyChart) {
    monthlyChart.destroy();
  }

  const isDark = document.body.classList.contains("dark-mode");

  const chartTextColor = isDark ? "#cbd5e1" : "#475569";
  const chartGridColor = isDark ? "#334155" : "#f1f5f9";
  const chartBorderColor = isDark ? "#1e293b" : "#ffffff";

  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  Chart.defaults.color = chartTextColor;

  const categoryCanvas = document.getElementById("category-chart");

  categoryChart = new Chart(categoryCanvas, {
    type: "doughnut",

    data: {
      labels: Object.keys(categoryTotals),

      datasets: [
        {
          data: Object.values(categoryTotals),

          backgroundColor: [
            "#10b981",
            "#06b6d4",
            "#f59e0b",
            "#ec4899",
            "#8b5cf6",
          ],

          borderWidth: 2,
          borderColor: chartBorderColor,
          hoverOffset: 6,
          borderRadius: 4,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",

      plugins: {
        legend: {
          position: "bottom",

          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 20,

            font: {
              size: 12,
              weight: "600",
            },

            color: chartTextColor,
          },
        },

        tooltip: {
          backgroundColor: isDark ? "#0f172a" : "#0f172a",

          titleFont: {
            size: 13,
            weight: "700",
          },

          bodyFont: {
            size: 12,
            family: "'JetBrains Mono', monospace",
          },

          padding: 12,
          cornerRadius: 10,
          displayColors: true,
          boxPadding: 6,

          callbacks: {
            label: function (context) {
              const value = context.raw || 0;

              return `  ${context.label}: ${value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`;
            },
          },
        },
      },

      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1000,
        easing: "easeOutQuart",
      },
    },
  });

  const monthlyCanvas = document.getElementById("monthly-chart");
  const monthlyCtx = monthlyCanvas.getContext("2d");

  const brandGradient = monthlyCtx.createLinearGradient(0, 0, 0, 300);

  brandGradient.addColorStop(
    0,
    isDark ? "rgba(129, 140, 248, 0.35)" : "rgba(79, 70, 229, 0.35)",
  );

  brandGradient.addColorStop(1, "rgba(79, 70, 229, 0.0)");

  monthlyChart = new Chart(monthlyCtx, {
    type: "line",

    data: {
      labels: Object.keys(monthlyTotals),

      datasets: [
        {
          label: "Expenses",
          data: Object.values(monthlyTotals),

          tension: 0.4,
          fill: true,

          backgroundColor: brandGradient,
          borderColor: isDark ? "#818cf8" : "#4f46e5",

          borderWidth: 3,

          pointBackgroundColor: isDark ? "#1e293b" : "#ffffff",
          pointBorderColor: isDark ? "#818cf8" : "#4f46e5",

          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,

          pointHoverBackgroundColor: isDark ? "#818cf8" : "#4f46e5",
          pointHoverBorderColor: isDark ? "#1e293b" : "#ffffff",

          pointHoverBorderWidth: 3,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        intersect: false,
        mode: "index",
      },

      scales: {
        x: {
          grid: {
            display: false,
          },

          ticks: {
            font: {
              size: 11,
              weight: "500",
            },

            color: "#94a3b8",
          },
        },

        y: {
          beginAtZero: true,

          grid: {
            color: chartGridColor,
            drawBorder: false,
          },

          ticks: {
            font: {
              size: 11,
              family: "'JetBrains Mono', monospace",
            },

            color: "#94a3b8",

            callback: function (value) {
              return "$" + value;
            },
          },
        },
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          backgroundColor: "#0f172a",

          titleFont: {
            size: 13,
            weight: "700",
          },

          bodyFont: {
            size: 12,
            family: "'JetBrains Mono', monospace",
          },

          padding: 12,
          cornerRadius: 10,
          displayColors: false,

          callbacks: {
            label: function (context) {
              return ` Expenses: $${context.parsed.y.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`;
            },
          },
        },
      },
    },
  });
}

// ===== Event Listeners =====

exportCsvBtn.addEventListener("click", () => {
  const filtered = filterList();
  const list = sortList(filtered);

  if (list.length === 0) {
    showAlertError("No expenses to export.");
    return;
  }

  const csv = buildCsv(list);
  downloadCsv(getCurrentFilename(), csv);
  showSuccessToast("Expenses exported successfully.");
});

expensesTableHead.addEventListener("click", (e) => {
  const th = e.target.closest("th[data-sort]");

  if (!th) {
    return;
  }

  const column = th.dataset.sort;

  if (sortColumn === column) {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortColumn = column;
    sortDirection = "asc";
  }

  updateSortIndicators();
  applyFilter();
});

expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateForm(addFields)) {
    return;
  }

  const data = {
    title: expenseTitle.value.trim(),
    amount: Number(expenseAmount.value),
    category: expenseCategory.value,
    date: expenseDate.value,
  };

  addExpenseBtn.disabled = true;
  spinnerBtn.classList.remove("d-none");

  try {
    await addExpense(data);

    await refresh();

    expenseForm.reset();
    setTodayDate();

    showSuccessToast("Expense added successfully.");
  } catch (error) {
    showAlertError(error.message);
  } finally {
    addExpenseBtn.disabled = false;
    spinnerBtn.classList.add("d-none");
  }
});

expensesBody.addEventListener("click", async (e) => {
  const button = e.target.closest("button");

  if (button == null) {
    return;
  }

  const id = button.dataset.id;

  if (button.dataset.action === "delete") {
    pendingDeleteId = id;
    bootstrap.Modal.getOrCreateInstance(deleteConfirmModal).show();
  } else if (button.dataset.action === "edit") {
    const found = expenses.find((item) => item.id == id);

    if (!found) {
      return;
    }

    editId.value = found.id;
    editTitle.value = found.title;
    editAmount.value = found.amount;
    editCategory.value = found.category;
    editDate.value = String(found.date).slice(0, 10);

    clearError(editTitle, editTitleError);
    clearError(editAmount, editAmountError);
    clearError(editCategory, editCategoryError);
    clearError(editDate, editDateError);

    bootstrap.Modal.getOrCreateInstance(editModal).show();
  }
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (!pendingDeleteId) {
    return;
  }

  try {
    await deleteExpense(pendingDeleteId);
    await refresh();

    bootstrap.Modal.getOrCreateInstance(deleteConfirmModal).hide();
    showSuccessToast("Expense deleted successfully.");
  } catch (error) {
    showAlertError(error.message);
  } finally {
    pendingDeleteId = null;
  }
});

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateForm(editFields)) {
    return;
  }

  const id = editId.value;

  const data = {
    title: editTitle.value.trim(),
    amount: Number(editAmount.value),
    category: editCategory.value,
    date: editDate.value,
  };

  saveChangesBtn.disabled = true;
  spinnerBtn.classList.remove("d-none");

  try {
    await updateExpense(id, data);

    bootstrap.Modal.getOrCreateInstance(editModal).hide();

    await refresh();

    showSuccessToast("Expense updated successfully.");
  } catch (error) {
    showAlertError(error.message);
  } finally {
    saveChangesBtn.disabled = false;
    spinnerBtn.classList.add("d-none");
  }
});

toggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");

  toggleBtn.setAttribute("aria-pressed", isDark);

  renderCharts(expenses, filterList());
});

filterToggleBtn.addEventListener("click", () => {
  const isOpen = filtersPanel.classList.toggle("show");
  filterToggleBtn.setAttribute("aria-expanded", String(isOpen));
});

errorAlertClose.addEventListener("click", hideAlertError);

filterCategory.addEventListener("change", applyFilter);
searchTitle.addEventListener("input", applyFilter);
filterMonth.addEventListener("change", applyFilter);

// ===== Init =====

refresh();
setTodayDate();
