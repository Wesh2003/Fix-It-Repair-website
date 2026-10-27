export function showToast(message, type = "default") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.className = `toast ${type === "error" ? "toast-error" : ""} ${
    type === "success" ? "toast-success" : ""
  }`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

export function statusLabel(status) {
  const map = {
    requested: "Reported",
    assigned: "Assigned",
    in_progress: "In Progress",
    completed: "Fixed",
    cancelled: "Cancelled",
  };
  return map[status] || status;
}

export function statusBadge(status) {
  return `<span class="badge badge-${status}">${statusLabel(status)}</span>`;
}

export function priorityBadge(priority) {
  return `<span class="badge badge-priority-${priority}">${priority}</span>`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
