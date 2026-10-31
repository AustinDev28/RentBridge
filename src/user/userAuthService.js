// Local prototype authentication. Replace with a secure backend before production.
import { MOCK_USERS } from "../agent/mockUsers.js";

const ACCOUNTS_KEY = "rentbridge-registered-users";
const SESSION_KEY = "rentbridge-user-session";

function readAccounts() {
  try {
    const value = JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function getCurrentUser() {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || "null");
    return value?.role === "user" ? value : null;
  } catch {
    logoutUser();
    return null;
  }
}

export function loginUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = [...MOCK_USERS, ...readAccounts()].find((account) =>
    account.role === "user" && account.email.toLowerCase() === normalizedEmail && account.password === password,
  );
  if (!user) return { error: "invalid_credentials" };
  const session = { id: user.id, name: user.name, email: user.email, role: "user" };
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: session };
}

export function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  if ([...MOCK_USERS, ...readAccounts()].some((account) => account.email.toLowerCase() === normalizedEmail)) {
    return { error: "email_in_use" };
  }
  const account = { id: `user-${Date.now()}`, name: name.trim(), email: normalizedEmail, password, role: "user" };
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...readAccounts(), account]));
  const session = { id: account.id, name: account.name, email: account.email, role: "user" };
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: session };
}

export function logoutUser() {
  window.sessionStorage.removeItem(SESSION_KEY);
}
