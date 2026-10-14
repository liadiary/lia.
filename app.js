const STORAGE_KEY = "lia-review-hub-v1";
const THEME_KEY = "lia-theme";

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const starterReviews = [
  { id: crypto.randomUUID(), title: "秋季品牌视觉提案", owner: "Mia", date: addDays(2), status: "pending", tag: "品牌设计", description: "确认主视觉方向、字体层级与延展场景的一致性。" },
  { id: crypto.randomUUID(), title: "移动端首页体验优化", owner: "产品团队", date: addDays(5), status: "progress", tag: "产品体验", description: "聚焦首屏信息密度、快捷入口与核心路径的可发现性。" },
  { id: crypto.randomUUID(), title: "九月内容专题", owner: "Nora", date: addDays(-1), status: "done", tag: "内容", description: "专题结构、标题语气和发布素材均已完成最终确认。" },
];

let reviews = loadReviews();
let currentFilter = "all";
let searchTerm = "";

const $ = (selector) => document.querySelector(selector);
const grid = $("#reviewGrid");
const dialog = $("#reviewDialog");
const form = $("#reviewForm");

function loadReviews() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : starterReviews;
  } catch { return starterReviews; }
}

function saveReviews() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(date);
}

function escapeHtml(value = "") {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function statusLabel(status) {
  return ({ pending: "等待反馈", progress: "进行中", done: "已完成" })[status];
}

function render() {
  const visible = reviews.filter((item) => {
    const matchesFilter = currentFilter === "all" || item.status === currentFilter;
    const haystack = `${item.title} ${item.owner} ${item.tag}`.toLowerCase();
    return matchesFilter && haystack.includes(searchTerm.toLowerCase());
  });

  grid.innerHTML = visible.map((item) => `
    <article class="review-card" data-id="${item.id}" tabindex="0" role="button" aria-label="编辑 ${escapeHtml(item.title)}">
      <div class="card-title"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.tag || "Uncategorized")} · ${escapeHtml(item.description || "No description")}</span></div>
      <span class="status ${item.status}">${statusLabel(item.status)}</span>
      <span class="card-owner"><i class="owner-avatar">${escapeHtml(item.owner.slice(0, 2).toUpperCase())}</i>${escapeHtml(item.owner)}</span>
      <span class="card-date">${formatDate(item.date)}</span>
      <span class="card-arrow">›</span>
    </article>`).join("");

  $("#emptyState").hidden = visible.length > 0;
  $("#totalCount").textContent = reviews.length;
  $("#pendingCount").textContent = reviews.filter((item) => item.status === "pending").length;
  $("#progressCount").textContent = reviews.filter((item) => item.status === "progress").length;
  $("#doneCount").textContent = reviews.filter((item) => item.status === "done").length;
  $("#todayPending").textContent = reviews.filter((item) => item.status !== "done").length;
  $("#navCount").textContent = reviews.length;
}

function openDialog(item) {
  form.reset();
  $("#reviewId").value = item?.id || "";
  $("#dialogTitle").textContent = item ? "编辑审阅" : "新建审阅";
  $("#titleInput").value = item?.title || "";
  $("#ownerInput").value = item?.owner || "";
  $("#dateInput").value = item?.date || addDays(3);
  $("#statusInput").value = item?.status || "pending";
  $("#tagInput").value = item?.tag || "";
  $("#descriptionInput").value = item?.description || "";
  $("#deleteButton").hidden = !item;
  dialog.showModal();
  setTimeout(() => $("#titleInput").focus(), 50);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = $("#reviewId").value;
  const item = {
    id: id || crypto.randomUUID(),
    title: $("#titleInput").value.trim(),
    owner: $("#ownerInput").value.trim(),
    date: $("#dateInput").value,
    status: $("#statusInput").value,
    tag: $("#tagInput").value.trim(),
    description: $("#descriptionInput").value.trim(),
  };
  if (id) reviews = reviews.map((review) => review.id === id ? item : review);
  else reviews.unshift(item);
  saveReviews(); render(); dialog.close(); showToast(id ? "审阅已更新" : "审阅已创建");
});

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".review-card");
  if (card) openDialog(reviews.find((item) => item.id === card.dataset.id));
});
grid.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") event.target.click();
});
$("#filters").addEventListener("click", (event) => {
  const button = event.target.closest(".filter");
  if (!button) return;
  document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
  button.classList.add("active"); currentFilter = button.dataset.filter; render();
});
$("#searchInput").addEventListener("input", (event) => { searchTerm = event.target.value.trim(); render(); });
$("#newReviewButton").addEventListener("click", () => openDialog());
$("#emptyCreate").addEventListener("click", () => openDialog());
$("#closeDialog").addEventListener("click", () => dialog.close());
$("#cancelButton").addEventListener("click", () => dialog.close());
$("#deleteButton").addEventListener("click", () => {
  const id = $("#reviewId").value;
  reviews = reviews.filter((item) => item.id !== id);
  saveReviews(); render(); dialog.close(); showToast("审阅已删除");
});

const today = new Date();
$("#todayWeekday").textContent = new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(today);
$("#todayDate").textContent = today.getDate();
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme === "dark") document.documentElement.classList.add("dark");
$("#themeToggle").addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, document.documentElement.classList.contains("dark") ? "dark" : "light");
});

$("#mobileMenu").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
document.querySelectorAll(".status-nav button").forEach((button) => button.addEventListener("click", () => {
  currentFilter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item.dataset.filter === currentFilter));
  document.querySelector(".sidebar").classList.remove("open");
  render();
}));
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    $("#searchInput").focus();
  }
});

render();
