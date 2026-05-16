import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ConversionMode } from "./sinhala";

type Theme = "dark" | "light";

interface AppCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  mode: ConversionMode;
  setMode: (m: ConversionMode) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mode, setModeState] = useState<ConversionMode>("unicode");

  useEffect(() => {
    const t = (localStorage.getItem("sintype.theme") as Theme | null) ?? "dark";
    const m = (localStorage.getItem("sintype.mode") as ConversionMode | null) ?? "unicode";
    setThemeState(t);
    setModeState(m);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("sintype.theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sintype.mode", mode);
  }, [mode]);

  return (
    <Ctx.Provider value={{ theme, setTheme: setThemeState, mode, setMode: setModeState }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be inside AppProvider");
  return v;
}

// ===== History (LocalStorage, last 20) =====
const HIST_KEY = "sintype.history";
export interface HistoryItem { id: string; input: string; output: string; ts: number; }

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HIST_KEY) ?? "[]"); } catch { return []; }
}
export function pushHistory(item: Omit<HistoryItem, "id" | "ts">) {
  const items = loadHistory();
  if (!item.input.trim()) return items;
  if (items[0]?.input === item.input) return items;
  const next: HistoryItem[] = [{ ...item, id: crypto.randomUUID(), ts: Date.now() }, ...items].slice(0, 20);
  localStorage.setItem(HIST_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("sintype.history.update"));
  return next;
}
export function clearHistory() {
  localStorage.removeItem(HIST_KEY);
  window.dispatchEvent(new Event("sintype.history.update"));
}
