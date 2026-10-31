import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "./userAuthService.js";

const UserPreferencesContext = createContext(null);
const preferenceKey = (userId) => `rentbridge-user-preferences-${userId}`;

function readTheme(user) {
  if (!user) return "light";
  try {
    const preferences = JSON.parse(window.localStorage.getItem(preferenceKey(user.id)) || "{}");
    return preferences.theme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function UserPreferencesProvider({ children }) {
  const [user, setUserState] = useState(() => getCurrentUser());
  const [theme, setThemeState] = useState(() => readTheme(getCurrentUser()));

  const setUser = useCallback((nextUser) => {
    setUserState(nextUser);
    setThemeState(readTheme(nextUser));
  }, []);

  const setTheme = useCallback((nextTheme) => {
    const validTheme = nextTheme === "dark" ? "dark" : "light";
    setThemeState(validTheme);
    if (user) {
      window.localStorage.setItem(preferenceKey(user.id), JSON.stringify({ theme: validTheme }));
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.dataset.userTheme = theme;
  }, [theme]);

  const value = useMemo(() => ({ user, setUser, theme, setTheme }), [user, setUser, theme, setTheme]);
  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
}

export function useUserPreferences() {
  const value = useContext(UserPreferencesContext);
  if (!value) throw new Error("useUserPreferences must be used inside UserPreferencesProvider");
  return value;
}
