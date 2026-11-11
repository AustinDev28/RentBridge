// MOCK ONLY - replace with real backend before production
import { MOCK_USERS } from "./mockUsers.js";
import { DEMO_WORKSPACE } from "./mockWorkspace.js";
import { isGoogleLinked, isMockGoogleEmail, setGoogleLinked } from "../auth/social/socialService.js";
import {
  MOCK_DEVICE_SIGNUP_COUNT_KEY, MOCK_DEVICE_SIGNUP_LIMIT, MOCK_DISPOSABLE_EMAIL_DOMAINS,
} from "./verification/mock/mockVerification.js";

const SESSION_KEY = "rentbridge-agent-session";
const REGISTERED_AGENTS_KEY = "rentbridge-registered-agents";
const WORKSPACE_KEY = "rentbridge-agent-workspaces";
const PASSWORD_OVERRIDES_KEY = "rentbridge-agent-password-overrides";

const delay = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export async function login(email, password) {
  await delay(500);
  const passwordOverrides = readPasswordOverrides();

  const user = [...MOCK_USERS, ...getRegisteredAgents()].find(
    (entry) =>
      entry.email.toLowerCase() === email.trim().toLowerCase() &&
      (passwordOverrides[entry.id] || entry.password) === password,
  );

  if (!user) {
    return { error: "invalid_credentials" };
  }

  if (user.role !== "agent") {
    return { error: "access_denied" };
  }

  const agent = { id: user.id, name: user.name, email: user.email, role: user.role, agency: user.agency || "", phoneDigest: user.phoneDigest || "" };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(agent));
  return { agent };
}

export async function resetAgentPassword(email, newPassword) {
  await delay(300);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (typeof newPassword !== "string" || newPassword.length < 8) return { error: "password_too_short" };
  const agent = [...MOCK_USERS, ...getRegisteredAgents()].find(
    (entry) => entry.role === "agent" && entry.email.toLowerCase() === normalizedEmail,
  );
  if (!agent) return { error: "account_not_found" };
  const overrides = readPasswordOverrides();
  overrides[agent.id] = newPassword;
  try {
    window.localStorage.setItem(PASSWORD_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    return { error: "storage_unavailable" };
  }
  return { success: true };
}

function readPasswordOverrides() {
  try {
    const overrides = JSON.parse(window.localStorage.getItem(PASSWORD_OVERRIDES_KEY) || "{}");
    return overrides && typeof overrides === "object" && !Array.isArray(overrides) ? overrides : {};
  } catch {
    return {};
  }
}

export async function registerAgent({ name, email, password }) {
  await delay(500);
  const normalizedEmail = email.trim().toLowerCase();
  const allUsers = [...MOCK_USERS, ...getRegisteredAgents()];

  if (allUsers.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return { error: "email_in_use" };
  }

  const agent = {
    id: `agent-${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: "agent",
  };
  const registeredAgents = [...getRegisteredAgents(), agent];
  window.localStorage.setItem(REGISTERED_AGENTS_KEY, JSON.stringify(registeredAgents));

  const session = { id: agent.id, name: agent.name, email: agent.email, role: agent.role };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { agent: session };
}

export async function signInWithGoogle({ email, name = "RentBridge Agent" }) {
  await delay(240);
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { error: "network_error" };
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const accounts = [...MOCK_USERS, ...getRegisteredAgents()].filter((account) => account.role === "agent");
  const existing = accounts.find((account) => account.email.toLowerCase() === normalizedEmail);
  if (existing) {
    if ((existing.authProvider === "google" && !existing.googleDisconnected) || isGoogleLinked("agent", existing.id)) {
      const session = { id: existing.id, name: existing.name, email: existing.email, role: "agent", agency: existing.agency || "", phoneDigest: existing.phoneDigest || "" };
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { agent: session };
    }
    const passwordOverrides = readPasswordOverrides();
    if (typeof (passwordOverrides[existing.id] || existing.password) === "string" && (passwordOverrides[existing.id] || existing.password)) {
      return { error: "link_required", accountId: existing.id };
    }
  }
  if (!isMockGoogleEmail(normalizedEmail)) return { error: "mock_account_unavailable" };

  const account = { id: `agent-google-${Date.now()}`, name: String(name || "RentBridge Agent").trim(), email: normalizedEmail, password: null, role: "agent", agency: "", authProvider: "google" };
  try {
    const registered = getRegisteredAgents();
    window.localStorage.setItem(REGISTERED_AGENTS_KEY, JSON.stringify([...registered, account]));
    const session = { id: account.id, name: account.name, email: account.email, role: "agent", agency: "" };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { agent: session };
  } catch {
    return { error: "storage_unavailable" };
  }
}

export async function linkGoogleAccount({ email, password }) {
  await delay(240);
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { error: "network_error" };
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const account = [...MOCK_USERS, ...getRegisteredAgents()].find((item) => item.role === "agent" && item.email.toLowerCase() === normalizedEmail);
  if (!account) return { error: "link_confirmation_failed" };
  const passwordOverrides = readPasswordOverrides();
  const expectedPassword = passwordOverrides[account.id] || account.password;
  if (!expectedPassword || expectedPassword !== password) return { error: "link_confirmation_failed" };
  if (!setGoogleLinked("agent", account.id, true)) return { error: "storage_unavailable" };
  const session = { id: account.id, name: account.name, email: account.email, role: "agent", agency: account.agency || "", phoneDigest: account.phoneDigest || "" };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { agent: session };
}

export function getSignInMethods(agentId = getCurrentAgent()?.id) {
  const account = [...MOCK_USERS, ...getRegisteredAgents()].find((item) => item.id === agentId && item.role === "agent");
  if (!account) return { password: false, google: false };
  const password = Boolean(readPasswordOverrides()[account.id] || account.password);
  return { password, google: (account.authProvider === "google" && !account.googleDisconnected) || isGoogleLinked("agent", account.id) };
}

export function disconnectGoogleAccount(agentId = getCurrentAgent()?.id) {
  const methods = getSignInMethods(agentId);
  if (!methods.google) return { error: "google_not_connected" };
  if (!methods.password) return { error: "password_required" };
  if (!setGoogleLinked("agent", agentId, false)) return { error: "storage_unavailable" };
  try {
    const registered = getRegisteredAgents().map((account) => account.id === agentId ? { ...account, googleDisconnected: true } : account);
    window.localStorage.setItem(REGISTERED_AGENTS_KEY, JSON.stringify(registered));
  } catch {
    return { error: "storage_unavailable" };
  }
  return { success: true, signInMethods: getSignInMethods(agentId) };
}

export async function fingerprintAgentValue(value, purpose = "verification") {
  const source = String(value || "").trim().toLowerCase();
  const normalized = purpose === "phone" ? source.replace(/\D/g, "") : source.replace(/[^a-z0-9]/g, "");
  const input = new TextEncoder().encode(`rentbridge-mock:${purpose}:${normalized}`);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", input);
    return [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, "0")).join("");
  }
  let hash = 2166136261;
  for (const part of input) hash = Math.imul(hash ^ part, 16777619);
  return `mock-${(hash >>> 0).toString(16)}`;
}

export async function registerVerifiedAgent({ name, email, phone, password, agencyName = "", acceptedTerms = false }) {
  await delay(300);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPhone = String(phone || "").replace(/\D/g, "");
  const domain = normalizedEmail.split("@").at(-1);
  if (!name?.trim() || !normalizedEmail.includes("@") || !normalizedPhone || !password || !acceptedTerms) return { error: "signup_failed" };
  if (MOCK_DISPOSABLE_EMAIL_DOMAINS.includes(domain)) return { error: "signup_failed" };

  try {
    const registeredAgents = getRegisteredAgents();
    if ([...MOCK_USERS, ...registeredAgents].some((user) => user.email.toLowerCase() === normalizedEmail)) return { error: "signup_failed" };
    const phoneDigest = await fingerprintAgentValue(normalizedPhone, "phone");
    if (registeredAgents.some((agent) => agent.phoneDigest && agent.phoneDigest === phoneDigest)) return { error: "signup_failed" };
    const signupCount = Number(window.localStorage.getItem(MOCK_DEVICE_SIGNUP_COUNT_KEY) || 0);
    if (!Number.isFinite(signupCount) || signupCount >= MOCK_DEVICE_SIGNUP_LIMIT) return { error: "signup_failed" };

    const agent = {
      id: `agent-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "agent",
      agency: String(agencyName || "").trim(),
      phoneDigest,
    };
    window.localStorage.setItem(REGISTERED_AGENTS_KEY, JSON.stringify([...registeredAgents, agent]));
    window.localStorage.setItem(MOCK_DEVICE_SIGNUP_COUNT_KEY, String(signupCount + 1));
    const session = { id: agent.id, name: agent.name, email: agent.email, role: "agent", agency: agent.agency, phoneDigest };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { agent: session };
  } catch {
    return { error: "signup_failed" };
  }
}

function getRegisteredAgents() {
  try {
    const registeredAgents = JSON.parse(window.localStorage.getItem(REGISTERED_AGENTS_KEY) || "[]");
    return Array.isArray(registeredAgents) ? registeredAgents : [];
  } catch {
    return [];
  }
}

export function logout() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function getCurrentAgent() {
  const session = window.localStorage.getItem(SESSION_KEY);
  if (!session) return null;

  try {
    const agent = JSON.parse(session);
    return agent?.role === "agent" ? agent : null;
  } catch {
    logout();
    return null;
  }
}

export function getAgentWorkspace(agentId) {
  const workspaces = readWorkspaces();
  const saved = workspaces[agentId];
  const defaults = agentId === "agent-demo" ? DEMO_WORKSPACE : emptyWorkspace();
  const workspace = { ...defaults, ...saved,
    profile: { ...defaults.profile, ...saved?.profile },
    settings: { ...defaults.settings, ...saved?.settings },
    listings: saved?.listings ?? defaults.listings,
    messages: saved?.messages ?? defaults.messages,
  };
  return JSON.parse(JSON.stringify(workspace));
}

export function saveAgentWorkspaceSection(agentId, section, value) {
  const workspace = getAgentWorkspace(agentId);
  workspace[section] = value;
  const workspaces = readWorkspaces();
  workspaces[agentId] = workspace;
  window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspaces));
  return workspace;
}

export function saveAgentProfile(agentId, profile) {
  const workspace = saveAgentWorkspaceSection(agentId, "profile", profile);
  const session = getCurrentAgent();
  if (session?.id === agentId) {
    const updatedSession = { ...session, name: profile.name || session.name };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    return { workspace, agent: updatedSession };
  }
  return { workspace, agent: session };
}

function readWorkspaces() {
  try {
    const value = JSON.parse(window.localStorage.getItem(WORKSPACE_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function emptyWorkspace() {
  return { profile: {}, listings: [], messages: [], settings: {
    emailNotifications: true,
    messageNotifications: true,
    listingUpdates: true,
  } };
}
