import { api } from "./api.js";
import { saveSession, homeForRole, getSession } from "./auth.js";

const existing = getSession();
if (existing) window.location.href = homeForRole(existing.role);

const form = document.getElementById("register-form");
const errorText = document.getElementById("error-text");
const registerBtn = document.getElementById("register-btn");

function wireToggle(btnId, inputId) {
  document.getElementById(btnId).addEventListener("click", () => {
    const input = document.getElementById(inputId);
    input.type = input.type === "password" ? "text" : "password";
  });
}
wireToggle("toggle-password", "password");
wireToggle("toggle-confirm-password", "confirm_password");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorText.textContent = "";

  const first_name = document.getElementById("first_name").value.trim();
  const last_name = document.getElementById("last_name").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const role = document.getElementById("role").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm_password").value;

  if (!first_name || !last_name || !username || !email || !password) {
    errorText.textContent = "Please fill in every field.";
    return;
  }
  if (password !== confirmPassword) {
    errorText.textContent = "Passwords don't match.";
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "Creating account…";

  try {
    await api.register({ first_name, last_name, username, email, role, password });
    // Registration endpoint doesn't log the user in automatically, so sign in right after.
    const data = await api.login(username, password);
    saveSession(data);
    window.location.href = homeForRole(data.role);
  } catch (err) {
    errorText.textContent = err.message || "Could not create account.";
    registerBtn.disabled = false;
    registerBtn.textContent = "Create Account";
  }
});
