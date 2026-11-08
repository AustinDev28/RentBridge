import { getCurrentAgent, fingerprintAgentValue } from "../authService.js";
import { USE_AGENT_VERIFICATION } from "./config.js";
import {
  MOCK_DOCUMENT_MAX_BYTES, MOCK_DOCUMENT_TYPES, MOCK_ID_TYPES,
  MOCK_SEEDED_VERIFIED_AGENT_IDS, MOCK_VERIFICATION_STORE_KEY,
} from "./mock/mockVerification.js";

export const VERIFICATION_DOCUMENT_MAX_BYTES = MOCK_DOCUMENT_MAX_BYTES;
export const VERIFICATION_DOCUMENT_TYPES = MOCK_DOCUMENT_TYPES;
export const VERIFICATION_ID_TYPES = MOCK_ID_TYPES;

const delay = () => new Promise((resolve) => window.setTimeout(resolve, 100));
const blankRecord = (agentId, agent = getCurrentAgent()) => {
  const seededVerified = MOCK_SEEDED_VERIFIED_AGENT_IDS.includes(agentId);
  return ({
  agentId,
  agentName: agent?.id === agentId ? agent.name : agentId || "Agent",
  agentEmail: agent?.id === agentId ? agent.email : "",
  agencyName: agent?.id === agentId ? agent.agency || "" : "",
  level: seededVerified ? 3 : 0,
  suspended: false,
  contact: { status: seededVerified ? "approved" : "not_started", emailVerified: seededVerified, phoneVerified: seededVerified },
  identity: { status: seededVerified ? "approved" : "not_started", idType: "", idDigest: "", frontFileName: "", backFileName: "", selfieFileName: "", reason: "" },
  business: { status: seededVerified ? "approved" : "not_started", agencyName: "", registrationNumber: "", officeAddress: "", membershipNumber: "", website: "", documentFileName: "", reason: "" },
  });
};

function readStore() {
  try {
    const value = JSON.parse(window.localStorage.getItem(MOCK_VERIFICATION_STORE_KEY) || "null");
    return { records: {}, published: [], ...(value && typeof value === "object" ? value : {}) };
  } catch {
    return { records: {}, published: [] };
  }
}

function writeStore(store) {
  try {
    window.localStorage.setItem(MOCK_VERIFICATION_STORE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event("rentbridge-verification-updated"));
    return true;
  } catch {
    return false;
  }
}

function recordFor(store, agentId) {
  if (!store.records[agentId]) store.records[agentId] = blankRecord(agentId);
  return store.records[agentId];
}

function updateLevel(record) {
  record.level = record.business.status === "approved" ? 3
    : record.identity.status === "approved" ? 2
      : record.contact.status === "approved" ? 1 : 0;
  return record;
}

function publicRecord(record) {
  const { idDigest, ...identity } = record.identity || {};
  return { ...record, identity };
}

function activeAgent(agentId) {
  return Boolean(agentId && getCurrentAgent()?.id === agentId);
}

function isValidDocument(file) {
  return Boolean(file && MOCK_DOCUMENT_TYPES.includes(file.type) && file.size <= MOCK_DOCUMENT_MAX_BYTES);
}

function submissionId(agentId, step) {
  return `${agentId}:${step}`;
}

export function getVerificationSnapshot(agentId) {
  if (!USE_AGENT_VERIFICATION) return { ...blankRecord(agentId), level: 3, contact: { status: "approved" }, identity: { status: "approved" }, business: { status: "approved" } };
  const store = readStore();
  const record = store.records[agentId] || blankRecord(agentId);
  return publicRecord(updateLevel({ ...record, contact: { ...record.contact }, identity: { ...record.identity }, business: { ...record.business } }));
}

export function isAgentPublic(agentId) {
  if (!USE_AGENT_VERIFICATION) return true;
  const record = getVerificationSnapshot(agentId);
  return record.level >= 2 && !record.suspended;
}

export async function getStatus(agentId = getCurrentAgent()?.id) {
  await delay();
  if (!agentId) return { ...blankRecord(""), status: "not_started", canPublish: false, dailyLimit: 0 };
  if (!USE_AGENT_VERIFICATION) return { ...getVerificationSnapshot(agentId), status: "approved", canPublish: true, dailyLimit: 5 };
  const store = readStore();
  const existed = Boolean(store.records[agentId]);
  const record = recordFor(store, agentId);
  updateLevel(record);
  if (!existed) {
    if (!writeStore(store)) return { ...publicRecord(record), status: record.suspended ? "suspended" : record.level >= 3 ? "approved" : "in_progress", canPublish: record.level >= 2 && !record.suspended, dailyLimit: record.level >= 3 ? 5 : record.level >= 2 ? 2 : 0, error: "storage_unavailable" };
    return { ...publicRecord(record), status: record.suspended ? "suspended" : record.level >= 3 ? "approved" : "in_progress", canPublish: record.level >= 2 && !record.suspended, dailyLimit: record.level >= 3 ? 5 : record.level >= 2 ? 2 : 0 };
  }
  return { ...publicRecord(record), status: record.suspended ? "suspended" : record.level >= 3 ? "approved" : "in_progress", canPublish: record.level >= 2 && !record.suspended, dailyLimit: record.level >= 3 ? 5 : record.level >= 2 ? 2 : 0 };
}

export async function getPostingAccess(agentId) {
  if (!USE_AGENT_VERIFICATION) return { allowed: true, level: 3, dailyLimit: 5, remaining: 5, reason: "" };
  const status = await getStatus(agentId);
  if (status.suspended) return { allowed: false, level: status.level, dailyLimit: 0, remaining: 0, reason: "suspended" };
  if (status.level < 2) return { allowed: false, level: status.level, dailyLimit: 0, remaining: 0, reason: "verification_required" };
  const store = readStore();
  const cutoff = Date.now() - 86400000;
  const used = store.published.filter((item) => item.agentId === agentId && new Date(item.createdAt).getTime() > cutoff).length;
  const dailyLimit = status.level >= 3 ? 5 : 2;
  const remaining = Math.max(0, dailyLimit - used);
  return { allowed: remaining > 0, level: status.level, dailyLimit, remaining, reason: remaining > 0 ? "" : "limit" };
}

export async function recordPublishedPost(agentId, postId) {
  if (!USE_AGENT_VERIFICATION) return true;
  const store = readStore();
  store.published = [...store.published, { agentId, postId: String(postId), createdAt: new Date().toISOString() }].slice(-1000);
  return writeStore(store);
}

export async function submitIdentity({ agentId = getCurrentAgent()?.id, idType, idNumber, frontFile, backFile, selfieFile }) {
  await delay();
  if (!activeAgent(agentId)) return { error: "not_signed_in" };
  const store = readStore();
  const record = recordFor(store, agentId);
  if (record.level < 1) return { error: "contact_required" };
  if (!MOCK_ID_TYPES.includes(idType) || !String(idNumber || "").trim() || !isValidDocument(frontFile) || !isValidDocument(backFile) || !selfieFile || !["image/jpeg", "image/png", "image/webp"].includes(selfieFile.type) || selfieFile.size > MOCK_DOCUMENT_MAX_BYTES) return { error: "invalid_submission" };
  const idDigest = await fingerprintAgentValue(idNumber, "id");
  if (Object.values(store.records).some((entry) => entry.agentId !== agentId && entry.identity?.idDigest === idDigest)) return { error: "duplicate_id" };
  record.agentName = getCurrentAgent().name;
  record.agentEmail = getCurrentAgent().email;
  record.identity = { status: "pending_review", idType, idDigest, frontFileName: frontFile.name, backFileName: backFile.name, selfieFileName: selfieFile.name, reason: "" };
  updateLevel(record);
  return writeStore(store) ? { success: true } : { error: "storage_unavailable" };
}

export async function submitBusiness({ agentId = getCurrentAgent()?.id, agencyName, registrationNumber, officeAddress, membershipNumber = "", website = "", documentFile }) {
  await delay();
  if (!activeAgent(agentId)) return { error: "not_signed_in" };
  const store = readStore();
  const record = recordFor(store, agentId);
  if (record.level < 2) return { error: "identity_required" };
  if (![agencyName, registrationNumber, officeAddress].every((value) => String(value || "").trim()) || !isValidDocument(documentFile)) return { error: "invalid_submission" };
  record.agentName = getCurrentAgent().name;
  record.agentEmail = getCurrentAgent().email;
  record.business = {
    status: "pending_review",
    agencyName: String(agencyName).trim(),
    registrationNumber: String(registrationNumber).trim(),
    officeAddress: String(officeAddress).trim(),
    membershipNumber: String(membershipNumber).trim(),
    website: String(website).trim(),
    documentFileName: documentFile.name,
    reason: "",
  };
  updateLevel(record);
  return writeStore(store) ? { success: true } : { error: "storage_unavailable" };
}

export async function saveDraft({ agentId = getCurrentAgent()?.id, step, data = {} }) {
  await delay();
  if (!activeAgent(agentId)) return { error: "not_signed_in" };
  const store = readStore();
  const record = recordFor(store, agentId);
  if (step === "identity") {
    record.identity = {
      ...record.identity,
      idType: MOCK_ID_TYPES.includes(data.idType) ? data.idType : record.identity.idType,
      frontFileName: data.frontFile?.name || record.identity.frontFileName,
      backFileName: data.backFile?.name || record.identity.backFileName,
      selfieFileName: data.selfieFile?.name || record.identity.selfieFileName,
      draftSaved: true,
    };
  } else if (step === "business") {
    record.business = {
      ...record.business,
      agencyName: String(data.agencyName || "").trim(),
      registrationNumber: String(data.registrationNumber || "").trim(),
      officeAddress: String(data.officeAddress || "").trim(),
      membershipNumber: String(data.membershipNumber || "").trim(),
      website: String(data.website || "").trim(),
      documentFileName: data.documentFile?.name || record.business.documentFileName,
      draftSaved: true,
    };
  }
  return writeStore(store) ? { success: true } : { error: "storage_unavailable" };
}

export async function getSubmissions() {
  await delay();
  const store = readStore();
  return Object.values(store.records).flatMap((record) => ["identity", "business"]
    .filter((step) => record[step]?.status && record[step].status !== "not_started")
    .map((step) => ({
      id: submissionId(record.agentId, step), agentId: record.agentId, step,
      level: record.level, suspended: record.suspended,
      agent: { name: record.agentName || record.agentId, email: record.agentEmail || "", agencyName: record.business?.agencyName || record.agencyName || "" },
      status: record[step].status,
      fileNames: step === "identity"
        ? [record.identity.frontFileName, record.identity.backFileName, record.identity.selfieFileName].filter(Boolean)
        : [record.business.documentFileName].filter(Boolean),
      details: step === "identity"
        ? { idType: record.identity.idType }
        : { agencyName: record.business.agencyName, registrationNumber: record.business.registrationNumber, officeAddress: record.business.officeAddress, membershipNumber: record.business.membershipNumber, website: record.business.website },
    })));
}

export async function reviewSubmission(id, decision, reason = "") {
  await delay();
  const [agentId, step] = String(id).split(":");
  if (!["identity", "business"].includes(step) || !["approve", "reject"].includes(decision)) return { error: "invalid_submission" };
  if (decision === "reject" && !String(reason).trim()) return { error: "reason_required" };
  const store = readStore();
  const record = store.records[agentId];
  if (!record || record[step]?.status !== "pending_review") return { error: "submission_not_found" };
  record[step].status = decision === "approve" ? "approved" : "rejected";
  record[step].reason = decision === "reject" ? String(reason).trim().slice(0, 500) : "";
  updateLevel(record);
  return writeStore(store) ? { success: true, status: record[step].status, level: record.level } : { error: "storage_unavailable" };
}

export async function suspendAgent(agentId) {
  await delay();
  const store = readStore();
  const record = recordFor(store, agentId);
  record.suspended = true;
  record.suspendedAt = new Date().toISOString();
  return writeStore(store) ? { success: true } : { error: "storage_unavailable" };
}
