// Local prototype authentication. Replace with a secure backend before production.
import { MOCK_USERS } from "../agent/mockUsers.js";
import { isGoogleLinked, isMockGoogleEmail, setGoogleLinked } from "../auth/social/socialService.js";

const ACCOUNTS_KEY = "rentbridge-registered-users";
const SESSION_KEY = "rentbridge-user-session";
const PASSWORD_OVERRIDES_KEY = "rentbridge-user-password-overrides";
const PROFILE_OVERRIDES_KEY = "rentbridge-user-profile-overrides";

function readAccounts() {
  try {
    const value = JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readOverrides(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function findUserAccount(userId) {
  return [...MOCK_USERS, ...readAccounts()].find((account) => account.id === userId && account.role === "user");
}

export function getCurrentUser() {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || "null");
    if (value?.role !== "user") return null;
    return { ...value, ...readOverrides(PROFILE_OVERRIDES_KEY)[value.id], role: "user" };
  } catch {
    logoutUser();
    return null;
  }
}

export function loginUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordOverrides = readOverrides(PASSWORD_OVERRIDES_KEY);
  const profileOverrides = readOverrides(PROFILE_OVERRIDES_KEY);
  const account = [...MOCK_USERS, ...readAccounts()].find((item) =>
    item.role === "user" && item.email.toLowerCase() === normalizedEmail && (passwordOverrides[item.id] || item.password) === password,
  );
  const user = account && { ...account, ...profileOverrides[account.id] };
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

export async function signInWithGoogle({ email, name = "RentBridge member" }) {
  await new Promise((resolve) => window.setTimeout(resolve, 240));
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { error: "network_error" };
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const accounts = [...MOCK_USERS, ...readAccounts()].filter((account) => account.role === "user");
  const existing = accounts.find((account) => account.email.toLowerCase() === normalizedEmail);
  if (existing) {
    if ((existing.authProvider === "google" && !existing.googleDisconnected) || isGoogleLinked("user", existing.id)) {
      const profile = readOverrides(PROFILE_OVERRIDES_KEY)[existing.id];
      const user = { ...existing, ...profile };
      const session = { id: user.id, name: user.name, email: user.email, role: "user" };
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { user: session };
    }
    if (typeof (readOverrides(PASSWORD_OVERRIDES_KEY)[existing.id] || existing.password) === "string" && (readOverrides(PASSWORD_OVERRIDES_KEY)[existing.id] || existing.password)) {
      return { error: "link_required", accountId: existing.id };
    }
  }
  if (!isMockGoogleEmail(normalizedEmail)) return { error: "mock_account_unavailable" };

  const account = { id: `user-google-${Date.now()}`, name: String(name || "RentBridge member").trim(), email: normalizedEmail, password: null, role: "user", authProvider: "google" };
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...readAccounts(), account]));
    const session = { id: account.id, name: account.name, email: account.email, role: "user" };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { user: session };
  } catch {
    return { error: "storage_unavailable" };
  }
}

export async function linkGoogleAccount({ email, password }) {
  await new Promise((resolve) => window.setTimeout(resolve, 240));
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { error: "network_error" };
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const account = [...MOCK_USERS, ...readAccounts()].find((item) => item.role === "user" && item.email.toLowerCase() === normalizedEmail);
  if (!account) return { error: "link_confirmation_failed" };
  const overrides = readOverrides(PASSWORD_OVERRIDES_KEY);
  const expectedPassword = overrides[account.id] || account.password;
  if (!expectedPassword || expectedPassword !== password) return { error: "link_confirmation_failed" };
  if (!setGoogleLinked("user", account.id, true)) return { error: "storage_unavailable" };
  const profile = readOverrides(PROFILE_OVERRIDES_KEY)[account.id];
  const user = { ...account, ...profile };
  const session = { id: user.id, name: user.name, email: user.email, role: "user" };
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: session };
}

export function getSignInMethods(userId = getCurrentUser()?.id) {
  const account = [...MOCK_USERS, ...readAccounts()].find((item) => item.id === userId && item.role === "user");
  if (!account) return { password: false, google: false };
  const hasPassword = Boolean(readOverrides(PASSWORD_OVERRIDES_KEY)[account.id] || account.password);
  return { password: hasPassword, google: (account.authProvider === "google" && !account.googleDisconnected) || isGoogleLinked("user", account.id) };
}

export function disconnectGoogleAccount(userId = getCurrentUser()?.id) {
  const methods = getSignInMethods(userId);
  if (!methods.google) return { error: "google_not_connected" };
  if (!methods.password) return { error: "password_required" };
  if (!setGoogleLinked("user", userId, false)) return { error: "storage_unavailable" };
  try {
    const accounts = readAccounts().map((account) => account.id === userId ? { ...account, googleDisconnected: true } : account);
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    return { error: "storage_unavailable" };
  }
  return { success: true, signInMethods: getSignInMethods(userId) };
}

export function logoutUser() {
  window.sessionStorage.removeItem(SESSION_KEY);
}

// Frontend prototype only: a real backend must hash passwords and verify all profile changes server-side.
export function updateUserProfile({ name }) {
  const session = getCurrentUser();
  const cleanName = String(name || "").trim();
  if (!session) return { error: "not_signed_in" };
  if (cleanName.length < 2 || cleanName.length > 80) return { error: "invalid_name" };

  const overrides = readOverrides(PROFILE_OVERRIDES_KEY);
  overrides[session.id] = { ...overrides[session.id], name: cleanName };
  try {
    window.localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    return { error: "storage_unavailable" };
  }
  const updated = { ...session, name: cleanName };
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  return { user: updated };
}

export function changeUserPassword({ currentPassword, newPassword }) {
  const session = getCurrentUser();
  if (!session) return { error: "not_signed_in" };
  if (typeof newPassword !== "string" || newPassword.length < 8) return { error: "password_too_short" };
  if (currentPassword === newPassword) return { error: "password_unchanged" };
  const account = findUserAccount(session.id);
  const overrides = readOverrides(PASSWORD_OVERRIDES_KEY);
  const expectedPassword = overrides[session.id] || account?.password;
  if (!expectedPassword || expectedPassword !== currentPassword) return { error: "incorrect_current_password" };
  overrides[session.id] = newPassword;
  try {
    window.localStorage.setItem(PASSWORD_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    return { error: "storage_unavailable" };
  }
  return { success: true };
}

export function resetUserPassword({ email, newPassword }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (typeof newPassword !== "string" || newPassword.length < 8) return { error: "password_too_short" };
  const account = [...MOCK_USERS, ...readAccounts()].find((item) => item.role === "user" && item.email.toLowerCase() === normalizedEmail);
  if (!account) return { error: "account_not_found" };
  const overrides = readOverrides(PASSWORD_OVERRIDES_KEY);
  overrides[account.id] = newPassword;
  try {
    window.localStorage.setItem(PASSWORD_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    return { error: "storage_unavailable" };
  }
  return { success: true };
}
