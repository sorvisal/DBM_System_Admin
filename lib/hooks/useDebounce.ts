import { useCallback, useEffect, useRef, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useLoadingState<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadedRef = useRef(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await loader();
      setData(result);
      loadedRef.current = true;
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Load failed");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    run();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, reload: run };
}
