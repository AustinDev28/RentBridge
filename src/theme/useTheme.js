import "./tokens.css";

export function setThemeMode() {
  // RentBridge currently uses light mode across all account types.
}

if (typeof document !== "undefined") {
  document.documentElement.dataset.theme = "light";
}

export function useTheme() {
  return { mode: "light", resolvedTheme: "light", setMode: setThemeMode };
}
