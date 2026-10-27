// Session storage + role-based guarding.
export function saveSession({ token, user_id, role, username }) {
  localStorage.setItem("fixit_token", token);
  localStorage.setItem("fixit_user_id", user_id);
  localStorage.setItem("fixit_role", role);
  localStorage.setItem("fixit_username", username);
}

export function getSession() {
  const token = localStorage.getItem("fixit_token");
  if (!token) return null;
  return {
    token,
    user_id: localStorage.getItem("fixit_user_id"),
    role: localStorage.getItem("fixit_role"),
    username: localStorage.getItem("fixit_username"),
  };
}

export function clearSession() {
  localStorage.removeItem("fixit_token");
  localStorage.removeItem("fixit_user_id");
  localStorage.removeItem("fixit_role");
  localStorage.removeItem("fixit_username");
}

export function homeForRole(role) {
  if (role === "staff") return "staff.html";
  if (role === "admin") return "admin.html";
  return "student.html";
}

// Call at the top of any protected page. Redirects to login if no session,
// or to the correct dashboard if the signed-in role doesn't match allowedRoles.
export function requireRole(allowedRoles) {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    window.location.href = homeForRole(session.role);
    return null;
  }
  return session;
}

export function logout() {
  clearSession();
  window.location.href = "login.html";
}
