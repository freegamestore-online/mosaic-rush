import { useCallback, useEffect, useState } from "react";
import { loadBests, recordBest, saveBests, type Bests } from "./bests";

/** Best score per level, saved to localStorage whenever it changes. */
export function useBests() {
  const [bests, setBests] = useState<Bests>(() => loadBests());

  useEffect(() => {
    saveBests(bests);
  }, [bests]);

  const record = useCallback((level: number, score: number) => {
    setBests((current) => recordBest(current, level, score));
  }, []);

  return { bests, record };
}
