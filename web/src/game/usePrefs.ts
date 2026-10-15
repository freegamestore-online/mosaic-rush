import { useCallback, useEffect, useState } from "react";
import { loadPrefs, savePrefs, type Prefs } from "./prefs";

/** Display preferences, saved to localStorage whenever they change. */
export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const setPref = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((current) => ({ ...current, [key]: value }));
  }, []);

  return { prefs, setPref };
}
