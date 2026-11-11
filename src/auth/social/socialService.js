import { MOCK_GOOGLE_ACCOUNTS } from "./mock/mockSocialAccounts.js";

const GOOGLE_LINKS_KEY = "rentbridge-mock-google-links";

/*
  Production requires a Google Cloud OAuth client ID with authorized domains,
  server-side ID-token signature, audience, expiry, and email_verified checks,
  explicit account-linking rules, httpOnly session cookies, and CSRF protection.
  The client must never decide on its own that a user is signed in.
*/

export function getGoogleAccountChoices() {
  return MOCK_GOOGLE_ACCOUNTS.map((account) => ({ ...account }));
}

export function isMockGoogleEmail() {
  return false;
}

function readGoogleLinks() {
  try {
    const value = JSON.parse(window.localStorage.getItem(GOOGLE_LINKS_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function linkKey(role, accountId) {
  return `${role}:${accountId}`;
}

export function isGoogleLinked(role, accountId) {
  return Boolean(readGoogleLinks()[linkKey(role, accountId)]);
}

export function setGoogleLinked(role, accountId, linked) {
  try {
    const links = readGoogleLinks();
    const key = linkKey(role, accountId);
    if (linked) links[key] = true;
    else delete links[key];
    window.localStorage.setItem(GOOGLE_LINKS_KEY, JSON.stringify(links));
    return true;
  } catch {
    return false;
  }
}
