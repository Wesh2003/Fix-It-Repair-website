import { logout } from "./auth.js";

export function renderTopbar(session, roleLabel) {
  const bar = document.getElementById("topbar");
  bar.innerHTML = `
    <div class="brand">⚙️ FixIt</div>
    <div class="topbar-right">
      <span>${session.username}</span>
      <span class="role-badge">${roleLabel}</span>
      <button class="btn btn-secondary btn-small" id="logout-btn">Logout</button>
    </div>
  `;
  document.getElementById("logout-btn").addEventListener("click", logout);
}
