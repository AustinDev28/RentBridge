import { getCurrentUser } from "./userAuthService.js";
import { getCurrentAgent } from "../agent/authService.js";

const savedKey = (userId) => `rentbridge-saved-properties-${userId}`;
const getViewerId = () => getCurrentUser()?.id || getCurrentAgent()?.id || null;

export function getSavedPropertyIds(userId = getViewerId()) {
  if (!userId) return [];
  try {
    const ids = JSON.parse(window.localStorage.getItem(savedKey(userId)) || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function toggleSavedProperty(propertyId, userId = getViewerId()) {
  if (!userId) return [];
  const current = getSavedPropertyIds(userId);
  const next = current.includes(propertyId)
    ? current.filter((id) => id !== propertyId)
    : [...current, propertyId];
  try {
    window.localStorage.setItem(savedKey(userId), JSON.stringify(next));
    window.dispatchEvent(new Event("rentbridge-saved-properties-updated"));
  } catch {
    return current;
  }
  return next;
}
