"use client";
import { createContext, useContext, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

// Theme lives in an external store (the <html data-theme> attribute the pre-paint
// script sets). useSyncExternalStore is SSR-safe and avoids setState-in-effect.
function subscribe(cb: () => void) {
  window.addEventListener("zw-theme-change", cb);
  return () => window.removeEventListener("zw-theme-change", cb);
}
function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}
function getServerSnapshot(): Theme {
  return "dark"; // default; matches pre-paint default, no hydration mismatch
}

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});
export const useTheme = () => useContext(ThemeCtx);

export default function Providers({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("zw-theme", next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new Event("zw-theme-change"));
  };
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}
