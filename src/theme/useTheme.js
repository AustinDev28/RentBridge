import { useSyncExternalStore } from "react";
import { USE_THEME_SYSTEM } from "./config.js";
import "./tokens.css";

const STORAGE_KEY = "rentbridge-theme-mode";
const listeners = new Set();
const mediaQuery = typeof window !== "undefined" && window.matchMedia
  ? window.matchMedia("(prefers-color-scheme: dark)")
  : null;

function readMode() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch {
    return "system";
  }
}

let mode = typeof window === "undefined" ? "system" : readMode();
let systemTheme = mediaQuery?.matches ? "dark" : "light";

function snapshot() {
  return `${mode}:${systemTheme}`;
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function handleSystemChange(event) {
  systemTheme = event.matches ? "dark" : "light";
  if (mode === "system") emitChange();
}

function handleStorageChange(event) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  mode = readMode();
  emitChange();
}

function subscribe(listener) {
  listeners.add(listener);
  if (listeners.size === 1) {
    mediaQuery?.addEventListener?.("change", handleSystemChange);
    window.addEventListener("storage", handleStorageChange);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      mediaQuery?.removeEventListener?.("change", handleSystemChange);
      window.removeEventListener("storage", handleStorageChange);
    }
  };
}

export function setThemeMode(nextMode) {
  if (!USE_THEME_SYSTEM || !["light", "dark", "system"].includes(nextMode)) return;
  mode = nextMode;
  try {
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  } catch {
    // Keep the in-memory choice if browser storage is unavailable.
  }
  emitChange();
}

export function useTheme() {
  const state = useSyncExternalStore(subscribe, snapshot, () => "system:light");
  const [modeValue, deviceTheme] = state.split(":");
  const resolvedTheme = USE_THEME_SYSTEM
    ? (modeValue === "system" ? deviceTheme : modeValue)
    : "light";
  return {
    mode: USE_THEME_SYSTEM ? modeValue : "system",
    resolvedTheme,
    setMode: setThemeMode,
  };
}
