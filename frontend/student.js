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

const session = requireRole(["customer"]);
if (session) {
  renderTopbar(session, "Student");
  init();
}

async function init() {
  await loadServices();
  await loadMyIssues();

  document
    .getElementById("report-form")
    .addEventListener("submit", onSubmitReport);
  setupPhotoUpload();
}

let selectedPhoto = "";
function setupPhotoUpload() {
  const input = document.getElementById("photo");
  const wrap = document.getElementById("photo-preview-wrap");
  const preview = document.getElementById("photo-preview");
  const remove = document.getElementById("remove-photo");
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error"); input.value = ""; return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Please choose an image smaller than 2 MB.", "error"); input.value = ""; return;
    }
    const reader = new FileReader();
    reader.onload = () => { selectedPhoto = String(reader.result || ""); preview.src = selectedPhoto; wrap.hidden = false; };
    reader.onerror = () => showToast("Could not read that image. Please try another.", "error");
    reader.readAsDataURL(file);
  });
  remove.addEventListener("click", () => {
    selectedPhoto = ""; input.value = ""; preview.removeAttribute("src"); wrap.hidden = true;
  });
}

async function loadServices() {
  const select = document.getElementById("service");
  try {
    const data = await api.listServices();
    const services = data.results || data;
    select.innerHTML = services
      .map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
      .join("");
  } catch (err) {
    select.innerHTML = `<option value="">Could not load categories</option>`;
    showToast(err.message, "error");
  }
}

async function onSubmitReport(e) {
  e.preventDefault();
  const errorText = document.getElementById("error-text");
  const submitBtn = document.getElementById("submit-btn");
  errorText.textContent = "";

  const payload = {
    service: Number(document.getElementById("service").value),
    description: document.getElementById("description").value.trim(),
    location: document.getElementById("location").value.trim(),
    priority: document.getElementById("priority").value,
    photo: selectedPhoto,
  };

  if (!payload.service || !payload.description || !payload.location) {
    errorText.textContent = "Please fill in every field.";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";

  try {
    await api.createRequest(payload);
    document.getElementById("report-form").reset();
    selectedPhoto = "";
    document.getElementById("photo-preview-wrap").hidden = true;
    document.getElementById("photo-preview").removeAttribute("src");
    showToast("Report submitted.", "success");
    await loadMyIssues();
  } catch (err) {
    errorText.textContent = err.message || "Could not submit report.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit report";
  }
}

async function loadMyIssues() {
  const container = document.getElementById("issues-container");
  container.innerHTML = `<p class="loading-text">Loading your reports…</p>`;
  try {
    const data = await api.listRequests();
    const issues = data.results || data;
    if (!issues.length) {
      container.innerHTML = `<p class="empty-state">You haven't submitted any reports yet.</p>`;
      return;
    }
    container.innerHTML = `<div class="issue-list">${issues
      .map(renderIssueRow)
      .join("")}</div>`;
  } catch (err) {
    container.innerHTML = `<p class="empty-state">Could not load your reports.</p>`;
    showToast(err.message, "error");
  }
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
          <span>Reported ${formatDate(issue.requested_at)}</span>
        </div>
        <div class="issue-desc">${escapeHtml(issue.description)}</div>
        ${issue.photo ? `<img class="issue-photo" src="${issue.photo}" alt="Photo attached to report" />` : ""}
      </div>
    </div>
  `;
}
