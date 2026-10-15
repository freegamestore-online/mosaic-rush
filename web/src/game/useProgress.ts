import { useCallback, useEffect, useState } from "react";
import { completeLevel, loadProgress, saveProgress, type Progress } from "./progress";

/** Progress state, saved to localStorage whenever it changes. */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const complete = useCallback((level: number) => {
    setProgress((current) => completeLevel(current, level));
  }, []);

  return { progress, complete };
}
