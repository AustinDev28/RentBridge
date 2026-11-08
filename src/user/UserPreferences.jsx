import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "./userAuthService.js";

const UserPreferencesContext = createContext(null);

export function UserPreferencesProvider({ children }) {
  const [user, setUserState] = useState(() => getCurrentUser());
  const [theme, setThemeState] = useState("light");

  const setUser = useCallback((nextUser) => {
    setUserState(nextUser);
  }, []);

  const setTheme = useCallback(() => setThemeState("light"), []);

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
