const STORAGE_KEY = "rentbridge-status-feed-preferences";

function readJson(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

export function readFeedPreferences(userId) {
  const stored = readJson(STORAGE_KEY);
  if (stored && typeof stored === "object") return stored;
  const accountPreferences = userId
    ? readJson(`rentbridge-user-search-preferences-${userId}`) || readJson("rentbridge-account-search-preferences")
    : readJson("rentbridge-account-search-preferences");
  return accountPreferences && typeof accountPreferences === "object"
    ? { area: accountPreferences.preferredArea || accountPreferences.area || "", type: "all" }
    : { area: "", type: "all" };
}

export function writeFeedPreferences(preferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Keep the current selection in memory when browser storage is unavailable.
  }
}
