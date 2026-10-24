// MOCK ONLY - replace with real backend before production
import { MOCK_USERS } from "./mockUsers.js";
import { DEMO_WORKSPACE } from "./mockWorkspace.js";

const SESSION_KEY = "rentbridge-agent-session";
const REGISTERED_AGENTS_KEY = "rentbridge-registered-agents";
const WORKSPACE_KEY = "rentbridge-agent-workspaces";

const delay = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export async function login(email, password) {
  await delay(500);

  const user = [...MOCK_USERS, ...getRegisteredAgents()].find(
    (entry) =>
      entry.email.toLowerCase() === email.trim().toLowerCase() &&
      entry.password === password,
  );

  if (!user) {
    return { error: "invalid_credentials" };
  }

  if (user.role !== "agent") {
    return { error: "access_denied" };
  }

  const agent = { id: user.id, name: user.name, email: user.email, role: user.role };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(agent));
  return { agent };
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
