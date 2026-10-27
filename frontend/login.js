import { api } from "./api.js";
import { saveSession, homeForRole, getSession } from "./auth.js";

// Already logged in? skip straight to the right dashboard.
const existing = getSession();
if (existing) window.location.href = homeForRole(existing.role);

const form = document.getElementById("login-form");
const errorText = document.getElementById("error-text");
const loginBtn = document.getElementById("login-btn");
const toggleBtn = document.getElementById("toggle-password");
const passwordInput = document.getElementById("password");

toggleBtn.addEventListener("click", () => {
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorText.textContent = "";

  const username = document.getElementById("username").value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    errorText.textContent = "Enter both username and password.";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in…";

  try {
    const data = await api.login(username, password);
    saveSession(data);
    window.location.href = homeForRole(data.role);
  } catch (err) {
    errorText.textContent = err.message || "Login failed. Check your credentials.";
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
});
