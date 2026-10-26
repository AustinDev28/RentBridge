import { MOCK_USERS } from "../../agent/mockUsers.js";
import { DEMO_WORKSPACE } from "../../agent/mockWorkspace.js";

const WORKSPACE_KEY = "rentbridge-agent-workspaces";
const REGISTERED_AGENTS_KEY = "rentbridge-registered-agents";
const REPORTS_KEY = "rentbridge-listing-reports";

function readJson(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export function getReportableListings() {
  const workspaces = readJson(WORKSPACE_KEY, {});
  const registeredAgents = readJson(REGISTERED_AGENTS_KEY, []);
  const agents = [...MOCK_USERS, ...(Array.isArray(registeredAgents) ? registeredAgents : [])];
  const agentNames = new Map(agents.map((agent) => [agent.id, agent.name]));
  const agentIds = new Set([...agents.map((agent) => agent.id), ...Object.keys(workspaces)]);

  return [...agentIds].flatMap((agentId) => {
    const savedListings = workspaces[agentId]?.listings;
    const listings = savedListings ?? (agentId === "agent-demo" ? DEMO_WORKSPACE.listings : []);
    return listings.map((listing) => ({
      id: `${agentId}:${listing.id}`,
      agentId,
      agentName: agentNames.get(agentId) || "Property agent",
      title: listing.title || "Untitled property",
      location: listing.location || "Location not provided",
    }));
  });
}

export function saveListingReport(report) {
  const reports = readJson(REPORTS_KEY, []);
  const savedReports = Array.isArray(reports) ? reports : [];
  const entry = {
    ...report,
    id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    submittedAt: new Date().toISOString(),
    status: "Received on this device",
  };

  window.localStorage.setItem(REPORTS_KEY, JSON.stringify([entry, ...savedReports]));
  return entry;
}
