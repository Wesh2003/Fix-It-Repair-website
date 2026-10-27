import { api } from "./api.js";
import { requireRole } from "./auth.js";
import { renderTopbar } from "./topbar.js";
import {
  showToast,
  statusBadge,
  priorityBadge,
  formatDate,
  escapeHtml,
} from "./ui.js";

const session = requireRole(["admin"]);
let allIssues = [];
let staffList = [];

if (session) {
  renderTopbar(session, "Admin");
  init();
}

async function init() {
  await Promise.all([loadStaff(), loadIssues()]);
  document
    .getElementById("status-filter")
    .addEventListener("change", applyFilters);
}

async function loadStaff() {
  try {
    const data = await api.listStaff();
    staffList = (data.results || data).map((sp) => ({
      id: sp.user,
      name:
        sp.user_info &&
        `${sp.user_info.first_name || ""} ${sp.user_info.last_name || ""}`.trim(),
    }));
  } catch (err) {
    staffList = [];
  }
}

async function loadIssues() {
  const container = document.getElementById("issues-container");
  container.innerHTML = `<p class="loading-text">Loading reports…</p>`;
  try {
    const data = await api.listRequests();
    allIssues = data.results || data;
    renderStats(allIssues);
    applyFilters();
  } catch (err) {
    container.innerHTML = `<p class="empty-state">Could not load reports.</p>`;
    showToast(err.message, "error");
  }
}

function renderStats(issues) {
  const total = issues.length;
  const pending = issues.filter((i) => i.status === "requested").length;
  const inProgress = issues.filter(
    (i) => i.status === "assigned" || i.status === "in_progress"
  ).length;
  const resolved = issues.filter((i) => i.status === "completed").length;

  const tiles = [
    { label: "Total reports", value: total },
    { label: "Pending", value: pending },
    { label: "In progress", value: inProgress },
    { label: "Resolved", value: resolved },
  ];

  document.getElementById("stats-grid").innerHTML = tiles
    .map(
      (t) => `
      <div class="stat-tile">
        <div class="stat-value">${t.value}</div>
        <div class="stat-label">${t.label}</div>
      </div>`
    )
    .join("");
}

function applyFilters() {
  const status = document.getElementById("status-filter").value;
  const filtered = status
    ? allIssues.filter((i) => i.status === status)
    : allIssues;
  renderList(filtered);
}

function renderList(issues) {
  const container = document.getElementById("issues-container");
  if (!issues.length) {
    container.innerHTML = `<p class="empty-state">No reports match this filter.</p>`;
    return;
  }
  container.innerHTML = `<div class="issue-list">${issues
    .map(renderIssueRow)
    .join("")}</div>`;

  container.querySelectorAll("[data-action='assign-select']").forEach((sel) => {
    sel.addEventListener("change", () => {
      const id = Number(sel.dataset.id);
      const staffId = Number(sel.value);
      if (staffId) handleAssign(id, staffId);
    });
  });
}

function staffOptions(issue) {
  const options = staffList
    .map(
      (s) =>
        `<option value="${s.id}" ${
          String(issue.assigned_staff) === String(s.id) ? "selected" : ""
        }>${escapeHtml(s.name || "Staff #" + s.id)}</option>`
    )
    .join("");
  return `
    <select class="filter-select" data-action="assign-select" data-id="${issue.id}">
      <option value="">Assign staff…</option>
      ${options}
    </select>
  `;
}

function renderIssueRow(issue) {
  return `
    <div class="issue-row">
      <div class="issue-main">
        <div class="issue-title">${escapeHtml(
          issue.service_name || "Issue"
        )} — ${escapeHtml(issue.location)}</div>
        <div class="issue-meta">
          ${statusBadge(issue.status)}
          ${priorityBadge(issue.priority)}
          <span>By ${escapeHtml(issue.customer_name || "—")}</span>
          <span>Reported ${formatDate(issue.requested_at)}</span>
        </div>
        <div class="issue-desc">${escapeHtml(issue.description)}</div>
        ${issue.photo ? `<img class="issue-photo" src="${issue.photo}" alt="Photo attached to report" />` : ""}
      </div>
      <div class="issue-actions">${staffOptions(issue)}</div>
    </div>
  `;
}

async function handleAssign(id, staffId) {
  try {
    await api.assignRequest(id, staffId);
    showToast("Staff assigned.", "success");
    await loadIssues();
  } catch (err) {
    showToast(err.message || "Could not assign staff.", "error");
  }
}
