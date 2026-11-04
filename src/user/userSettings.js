const SETTINGS_PREFIX = "rentbridge-user-settings-";

const defaults = {
  inAppStatusNotifications: true,
  browserStatusNotifications: true,
};

export function getUserSettings(userId) {
  if (!userId) return { ...defaults };
  try {
    const saved = JSON.parse(window.localStorage.getItem(`${SETTINGS_PREFIX}${userId}`) || "{}");
    return {
      inAppStatusNotifications: saved.inAppStatusNotifications !== false,
      browserStatusNotifications: saved.browserStatusNotifications !== false,
    };
  } catch {
    return { ...defaults };
  }
}

export function saveUserSettings(userId, settings) {
  if (!userId) return getUserSettings(userId);
  const next = { ...defaults, ...getUserSettings(userId), ...settings };
  try {
    window.localStorage.setItem(`${SETTINGS_PREFIX}${userId}`, JSON.stringify(next));
  } catch {
    // Settings remain available for the current screen if browser storage is unavailable.
  }
  return next;
}
