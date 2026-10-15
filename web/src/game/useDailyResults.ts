import { useCallback, useEffect, useState } from "react";
import {
  loadDailyResults,
  recordDailyResult,
  saveDailyResults,
  type DailyResult,
  type DailyResults,
} from "./dailyResults";

/** Daily results, saved to localStorage whenever they change. */
export function useDailyResults() {
  const [results, setResults] = useState<DailyResults>(() => loadDailyResults());

  useEffect(() => {
    saveDailyResults(results);
  }, [results]);

  const record = useCallback((key: string, result: DailyResult) => {
    setResults((current) => recordDailyResult(current, key, result));
  }, []);

  return { results, record };
}
