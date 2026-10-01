import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getInitial(): boolean {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

export function useReducedMotion(): boolean {
  // Read the preference synchronously. Starting at `false` and correcting in an
  // effect made reduced-motion users see the animated version (iframe effect,
  // marquees) mount for a frame and then get torn down.
  const [reduced, setReduced] = useState(getInitial);

  useEffect(() => {
    const query = window.matchMedia(QUERY);
    setReduced(query.matches);
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
}
