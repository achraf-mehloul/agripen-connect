import { useEffect, useState } from "react";

/** True only after hydration — safe gate for reading browser-only state. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
