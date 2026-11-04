import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { store } from "./store";
import { queryClient } from "./utils/queryClient";
import { ThemeContext } from "./context/ThemeContext";
import AppInitializer from "./components/AppInitializer";
import App from "./App.jsx";
import "@fontsource-variable/dm-sans";
import { createCampusTheme } from "./theme";
import "./index.css";

const THEME_STORAGE_KEY = "campus-theme-mode";

const getStoredThemeMode = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
};

const getSystemMode = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function Root() {
  const [themeMode, setThemeMode] = useState(getStoredThemeMode);
  const [systemMode, setSystemMode] = useState(getSystemMode);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      setSystemMode(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const resolvedMode = themeMode === "system" ? systemMode : themeMode;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedMode === "dark");
    document.documentElement.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  const cycleThemeMode = () => {
    setThemeMode((currentMode) => {
      if (currentMode === "light") return "dark";
      if (currentMode === "dark") return "system";
      return "light";
    });
  };

  const themeContextValue = useMemo(
    () => ({
      themeMode,
      resolvedMode,
      setThemeMode,
      cycleThemeMode,
    }),
    [themeMode, resolvedMode]
  );

  const theme = useMemo(() => createCampusTheme(resolvedMode), [resolvedMode]);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeContext.Provider value={themeContextValue}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <AppInitializer>
                <App />
              </AppInitializer>
            </ThemeProvider>
          </ThemeContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

createRoot(document.getElementById("root")).render(
  <Root />,
);
