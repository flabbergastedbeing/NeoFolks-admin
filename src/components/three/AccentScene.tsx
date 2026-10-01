import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWebGLSupport } from "@/components/three/useWebGLSupport";

// Quieter companion to HeroScene, used on the About page's Mission section.
const AccentSceneCanvas = lazy(() =>
  import("@/components/three/AccentSceneCanvas").then((m) => ({ default: m.AccentSceneCanvas }))
);

function StaticFallback() {
  return (
    <div
      className="h-full w-full"
      style={{
        background: "radial-gradient(circle at 50% 50%, rgba(153,132,216,0.2), transparent 65%)",
      }}
      aria-hidden="true"
    />
  );
}

export function AccentScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  // Once the scene has been seen we keep it mounted and merely pause its render
  // loop off-screen. Unmounting on every scroll-out re-created the WebGL
  // context (and re-randomised the nodes), which caused a visible hitch.
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebGLSupport();

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasBeenSeen(true);
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const canRender3D = webglSupported === true && !reducedMotion;

  return (
    <div ref={containerRef} className="relative h-[260px] w-full overflow-hidden sm:h-[320px]">
      {canRender3D && hasBeenSeen ? (
        <Suspense fallback={<StaticFallback />}>
          <AccentSceneCanvas active={inView} />
        </Suspense>
      ) : (
        <StaticFallback />
      )}
    </div>
  );
}
