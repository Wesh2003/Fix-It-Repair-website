// FixIt demo data layer.
// This file intentionally uses browser localStorage instead of a Django API.
// For real deployment, the integration developer can replace this module with fetch() calls.
const USERS_KEY = "fixit_demo_users";
const ISSUES_KEY = "fixit_demo_issues";
const SERVICES_KEY = "fixit_demo_services";

const defaultServices = [
  { id: 1, name: "Plumbing" },
  { id: 2, name: "Electrical" },
  { id: 3, name: "Furniture" },
  { id: 4, name: "Cleaning" },
  { id: 5, name: "Equipment" },
  { id: 6, name: "Other" },
];

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function users() {
  let list = read(USERS_KEY, null);
  if (!list) {
    list = [
      { id: 1, first_name: "Zinaidah", last_name: "Student", username: "student", email: "student@fixit.demo", password: "student123", role: "customer" },
      { id: 2, first_name: "Alex", last_name: "Staff", username: "staff", email: "staff@fixit.demo", password: "staff123", role: "staff" },
      { id: 3, first_name: "Demo", last_name: "Admin", username: "admin", email: "admin@fixit.demo", password: "admin123", role: "admin" },
    ];
    write(USERS_KEY, list);
  }
  return list;
}
function services() {
  const list = read(SERVICES_KEY, null);
  if (list) return list;
  write(SERVICES_KEY, defaultServices);
  return defaultServices;
}
function issues() {
  let list = read(ISSUES_KEY, null);
  if (!list) {
    const now = new Date();
    list = [
      { id: 1, service: 1, service_name: "Plumbing", description: "The tap near the second-floor washroom keeps leaking.", location: "Block C, Floor 2", priority: "medium", status: "requested", customer: 1, customer_name: "Zinaidah Student", assigned_staff: null, requested_at: new Date(now.getTime()-86400000).toISOString(), photo: "" },
      { id: 2, service: 2, service_name: "Electrical", description: "The classroom light is flickering and sometimes switches off.", location: "Lecture Hall B", priority: "high", status: "in_progress", customer: 1, customer_name: "Zinaidah Student", assigned_staff: 2, requested_at: new Date(now.getTime()-172800000).toISOString(), photo: "" },
      { id: 3, service: 3, service_name: "Furniture", description: "One of the library desks has a loose leg.", location: "Main Library", priority: "low", status: "completed", customer: 1, customer_name: "Zinaidah Student", assigned_staff: 2, requested_at: new Date(now.getTime()-259200000).toISOString(), photo: "" },
    ];
    write(ISSUES_KEY, list);
  }
  return list;
}
function currentUser() {
  const id = Number(localStorage.getItem("fixit_user_id"));
  return users().find((u) => u.id === id) || null;
}
function sessionFor(user) {
  return { token: `demo-${user.id}`, user_id: user.id, role: user.role, username: user.username };
}
function nextId(list) { return list.reduce((max, item) => Math.max(max, Number(item.id)||0), 0) + 1; }

export const api = {
  register: async (payload) => {
    const list = users();
    if (list.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) throw new Error("That username is already registered.");
    if (list.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) throw new Error("That email is already registered.");
    const user = { id: nextId(list), ...payload };
    list.push(user); write(USERS_KEY, list);
    return { id: user.id, username: user.username, role: user.role };
  },
  login: async (username, password) => {
    const user = users().find((u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) throw new Error("Incorrect username or password. Use a demo account or register first.");
    return sessionFor(user);
  },
  logout: async () => ({ ok: true }),
  listServices: async () => services(),
  listRequests: async () => {
    const all = issues();
    const user = currentUser();
    return user && user.role === "customer" ? all.filter((i) => Number(i.customer) === user.id) : all;
  },
  getRequest: async (id) => {
    const item = issues().find((i) => Number(i.id) === Number(id));
    if (!item) throw new Error("Report not found.");
    return item;
  },
  createRequest: async (payload) => {
    const list = issues();
    const user = currentUser();
    const service = services().find((s) => Number(s.id) === Number(payload.service));
    const item = {
      id: nextId(list), ...payload,
      service_name: service ? service.name : "Other",
      status: "requested",
      customer: user ? user.id : null,
      customer_name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Demo User",
      assigned_staff: null,
      requested_at: new Date().toISOString(),
      photo: payload.photo || "",
    };
    list.unshift(item); write(ISSUES_KEY, list); return item;
  },
  assignRequest: async (id, staffId) => updateIssue(id, { status: "assigned", assigned_staff: Number(staffId) }),
  startRequest: async (id) => updateIssue(id, { status: "in_progress" }),
  completeRequest: async (id, finalCost) => updateIssue(id, { status: "completed", final_cost: Number(finalCost)||0 }),
  cancelRequest: async (id) => updateIssue(id, { status: "cancelled" }),
  listStaff: async () => users().filter((u) => u.role === "staff").map((u) => ({ user: u.id, user_info: { first_name: u.first_name, last_name: u.last_name } })),
  listAvailableStaff: async () => users().filter((u) => u.role === "staff").map((u) => ({ user: u.id, user_info: { first_name: u.first_name, last_name: u.last_name } })),
};
function updateIssue(id, changes) {
  const list = issues();
  const index = list.findIndex((i) => Number(i.id) === Number(id));
  if (index < 0) throw new Error("Report not found.");
  list[index] = { ...list[index], ...changes };
  write(ISSUES_KEY, list);
  return list[index];
}
