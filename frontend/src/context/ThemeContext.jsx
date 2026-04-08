import { createContext, useContext } from "react";

export const ThemeContext = createContext({
  themeMode: "system",
  resolvedMode: "light",
  cycleThemeMode: () => {},
  setThemeMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);
