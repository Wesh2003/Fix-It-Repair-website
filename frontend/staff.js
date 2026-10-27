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

const session = requireRole(["staff"]);
let allIssues = [];

if (session) {
  renderTopbar(session, "Staff");
  init();
}

async function init() {
  await loadIssues();
  document
    .getElementById("status-filter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("priority-filter")
    .addEventListener("change", applyFilters);
}

async function loadIssues() {
  const container = document.getElementById("issues-container");
  container.innerHTML = `<p class="loading-text">Loading reports…</p>`;
  try {
    const data = await api.listRequests();
    allIssues = data.results || data;
    applyFilters();
  } catch (err) {
    container.innerHTML = `<p class="empty-state">Could not load reports.</p>`;
    showToast(err.message, "error");
  }
}

function applyFilters() {
  const status = document.getElementById("status-filter").value;
  const priority = document.getElementById("priority-filter").value;
  let filtered = allIssues;
  if (status) filtered = filtered.filter((i) => i.status === status);
  if (priority) filtered = filtered.filter((i) => i.priority === priority);
  renderList(filtered);
}

function renderList(issues) {
  const container = document.getElementById("issues-container");
  if (!issues.length) {
    container.innerHTML = `<p class="empty-state">No reports match these filters.</p>`;
    return;
  }
  container.innerHTML = `<div class="issue-list">${issues
    .map(renderIssueRow)
    .join("")}</div>`;

  container.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => handleAction(btn.dataset.action, Number(btn.dataset.id)));
  });
}

function renderIssueRow(issue) {
  const isMine = String(issue.assigned_staff) === String(session.user_id);
  let actions = "";

  if (issue.status === "requested" && !issue.assigned_staff) {
    actions = `<button class="btn btn-primary btn-small" data-action="assign" data-id="${issue.id}">Assign to me</button>`;
  } else if (issue.status === "assigned" && isMine) {
    actions = `<button class="btn btn-primary btn-small" data-action="start" data-id="${issue.id}">Start work</button>`;
  } else if (issue.status === "in_progress" && isMine) {
    actions = `<button class="btn btn-primary btn-small" data-action="complete" data-id="${issue.id}">Mark fixed</button>`;
  }

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
      <div class="issue-actions">${actions}</div>
    </div>
  `;
}

async function handleAction(action, id) {
  try {
    if (action === "assign") {
      await api.assignRequest(id, session.user_id);
      showToast("Assigned to you.", "success");
    } else if (action === "start") {
      await api.startRequest(id);
      showToast("Marked as in progress.", "success");
    } else if (action === "complete") {
      const cost = window.prompt("Final cost for this job (KES):", "0");
      if (cost === null) return;
      await api.completeRequest(id, Number(cost) || 0);
      showToast("Marked as fixed.", "success");
    }
    await loadIssues();
  } catch (err) {
    showToast(err.message || "Action failed.", "error");
  }
}
