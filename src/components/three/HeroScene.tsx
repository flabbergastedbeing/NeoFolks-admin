import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWebGLSupport } from "@/components/three/useWebGLSupport";

// Lazy-loaded so the three.js / @react-three/fiber bundle never ships in the
// main chunk. Falls back to a static gradient when WebGL is unavailable or
// prefers-reduced-motion is set, and unmounts (pausing rendering) whenever
// the scene scrolls off-screen.
const HeroSceneCanvas = lazy(() =>
  import("@/components/three/HeroSceneCanvas").then((m) => ({ default: m.HeroSceneCanvas }))
);

function StaticFallback() {
  return (
    <div
      className="h-full w-full"
      style={{
        background:
          "radial-gradient(circle at 50% 30%, rgba(153,132,216,0.28), rgba(63,203,127,0.06) 45%, transparent 70%)",
      }}
      aria-hidden="true"
    />
  );
}

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebGLSupport();

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const canRender3D = webglSupported === true && !reducedMotion;

  return (
    <div
      ref={containerRef}
      className="relative h-[360px] w-full overflow-hidden sm:h-[440px] md:h-[520px]"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent, black 12%, black 82%, transparent), linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        maskComposite: "intersect",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 12%, black 82%, transparent), linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskComposite: "source-in",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, rgba(163,102,255,0.38), rgba(123,78,245,0.16) 40%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      {canRender3D && inView ? (
        <Suspense fallback={<StaticFallback />}>
          <HeroSceneCanvas />
        </Suspense>
      ) : (
        <StaticFallback />
      )}
    </div>
  );
}
