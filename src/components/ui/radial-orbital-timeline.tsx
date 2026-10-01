import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Link2 } from "lucide-react";

import { PillBadge } from "@/components/common/PillBadge";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { TechNode } from "@/types";

interface RadialOrbitalTimelineProps {
  timelineData: TechNode[];
  className?: string;
  ariaLabel?: string;
}

// Adapted from the "radial orbital timeline" component and restyled onto the
// site's own tokens (carbon-card / graphite / ash-gray / lavender-pulse,
// rounded-card, Inter). Differences from the original, on purpose:
//   - node positions are driven per frame from refs (no setInterval + React
//     re-render every 50ms fighting a 700ms CSS transition), so the orbit is
//     smooth and the page stays responsive;
//   - the orbit sizes itself to its container instead of a fixed 200px radius;
//   - nodes are real <button>s (keyboard + screen-reader friendly);
//   - it pauses while off-screen, while a node is hovered/focused, and never
//     auto-rotates for people who prefer reduced motion.

const ROTATION_DEG_PER_SEC = 3;
// A selected node is rotated to the top of the ring (270deg).
const CENTER_ANGLE = 270;
const CENTER_DURATION_MS = 700;
const RADIUS_RATIO = 0.36;
// Below this radius the ring is too tight for text labels next to every node.
const LABEL_MIN_RADIUS = 128;

// Same lavender glow the site uses on CtaBand and the activity cards.
const SURFACE_GLOW =
  "radial-gradient(ellipse at 50% 0%, rgba(163,102,255,0.24), rgba(123,78,245,0.1) 45%, transparent 75%)";
const CORE_GLOW =
  "radial-gradient(circle, rgba(163,102,255,0.55) 0%, rgba(123,78,245,0.18) 55%, transparent 72%)";
// Circular fill for the orbit: solid #211535 at the centre, fading out to
// transparent at the ring. `closest-side` makes the gradient end exactly at the
// edge of the (square) element, so it stays a perfect circle at any size.
const ORBIT_FILL =
  "radial-gradient(circle closest-side, #211535 0%, rgba(33,21,53,0.6) 55%, rgba(33,21,53,0) 100%)";
const NODE_GLOW =
  "radial-gradient(circle, rgba(153,132,216,0.32) 0%, rgba(153,132,216,0) 70%)";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function RadialOrbitalTimeline({
  timelineData,
  className,
  ariaLabel = "Technologies we explore",
}: RadialOrbitalTimelineProps) {
  const reducedMotion = useReducedMotion();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [radius, setRadius] = useState(200);

  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Everything the animation loop reads lives in refs so it never re-renders.
  const angleRef = useRef(0);
  const radiusRef = useRef(200);
  const activeRef = useRef<number | null>(null);
  const pausedRef = useRef(false); // pointer/keyboard is on a node
  const tweenRef = useRef<{ from: number; to: number; start: number } | null>(null);
  const dataRef = useRef(timelineData);
  activeRef.current = activeId;
  dataRef.current = timelineData;

  const applyPositions = useCallback(() => {
    const data = dataRef.current;
    const total = data.length;
    const r = radiusRef.current;

    data.forEach((item, index) => {
      const el = nodeRefs.current[item.id];
      if (!el) return;

      const angle = (index / total) * 360 + angleRef.current;
      const rad = (angle * Math.PI) / 180;
      const x = r * Math.cos(rad);
      const y = r * Math.sin(rad);
      const isActive = activeRef.current === item.id;

      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      // Depth cue: nodes on one side of the ring stack in front of the others
      // (z-index only). Opacity is deliberately NOT varied by position, so
      // every node stays at full brightness all the way round the orbit.
      el.style.zIndex = String(isActive ? 200 : Math.round(100 + 50 * Math.cos(rad)));
    });
  }, []);

  // Keep z-index correct as soon as the active node changes, even if
  // the frame loop is paused (off-screen, reduced motion).
  useLayoutEffect(() => {
    applyPositions();
  }, [activeId, applyPositions]);

  // Size the ring to the container.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const next = Math.round(Math.min(width, height) * RADIUS_RATIO);
      radiusRef.current = next;
      setRadius(next);
      applyPositions();
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [applyPositions]);

  // Frame loop: only runs while the orbit is on screen.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let raf = 0;
    let last = 0;
    let running = false;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const tween = tweenRef.current;
      if (tween) {
        const t = Math.min((now - tween.start) / CENTER_DURATION_MS, 1);
        angleRef.current = tween.from + (tween.to - tween.from) * easeOutCubic(t);
        if (t >= 1) tweenRef.current = null;
      } else if (activeRef.current === null && !pausedRef.current && !reducedMotion) {
        angleRef.current = (angleRef.current + ROTATION_DEG_PER_SEC * dt) % 360;
      }

      applyPositions();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    observer.observe(stage);

    return () => {
      observer.disconnect();
      stop();
    };
  }, [applyPositions, reducedMotion]);

  // Rotate so the selected node sits at the top, taking the shortest way round.
  const centerOnNode = useCallback(
    (id: number) => {
      const data = dataRef.current;
      const index = data.findIndex((item) => item.id === id);
      if (index < 0) return;

      const target = CENTER_ANGLE - (index / data.length) * 360;
      const current = angleRef.current;
      let delta = (target - current) % 360;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      if (reducedMotion) {
        angleRef.current = current + delta;
        tweenRef.current = null;
        applyPositions();
      } else {
        tweenRef.current = {
          from: current,
          to: current + delta,
          start: performance.now(),
        };
      }
    },
    [applyPositions, reducedMotion],
  );

  const toggleNode = useCallback(
    (id: number) => {
      if (activeRef.current === id) {
        setActiveId(null);
        return;
      }
      setActiveId(id);
      centerOnNode(id);
    },
    [centerOnNode],
  );

  // Escape closes the open card from anywhere (focus may have moved off the
  // orbit after clicking a connected-node chip, so don't rely on a local handler).
  useEffect(() => {
    if (activeId === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeId]);

  const activeItem = timelineData.find((item) => item.id === activeId);
  const relatedToActive = activeItem?.relatedIds ?? [];
  const showLabels = radius >= LABEL_MIN_RADIUS;

  return (
    <div
      ref={stageRef}
      role="group"
      aria-label={ariaLabel}
      onClick={() => setActiveId(null)}
      className={cn(
        // `isolate` gives the orbit its own stacking context, so the nodes' z-index values
        // (100-200, used for the depth effect) stay inside it instead of drawing
        // over the fixed navbar (z-40) when the page scrolls.
        "relative isolate aspect-square w-full",
        className,
      )}
    >
      {/* Orbit fill: #211535 emerging from the centre */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: radius * 2, height: radius * 2, background: ORBIT_FILL }}
        aria-hidden="true"
      />

      {/* Orbit ring */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-graphite"
        style={{ width: radius * 2, height: radius * 2 }}
        aria-hidden="true"
      />

      {/* Core */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-[64px] w-[64px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
        style={{ background: CORE_GLOW }}
        aria-hidden="true"
      >
        <span
          className="absolute h-[80px] w-[80px] animate-ping rounded-full border border-lavender-pulse/30"
          style={{ animationDuration: "2.5s" }}
        />
        <span
          className="absolute h-[96px] w-[96px] animate-ping rounded-full border border-lavender-pulse/15"
          style={{ animationDuration: "2.5s", animationDelay: "1.25s" }}
        />
        <span className="h-[28px] w-[28px] rounded-full bg-ghost-white/90" />
      </div>

      {/* Nodes */}
      {timelineData.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        const isRelated = relatedToActive.includes(item.id);

        return (
          <div
            key={item.id}
            ref={(el) => {
              nodeRefs.current[item.id] = el;
            }}
            className="absolute left-1/2 top-1/2 -ml-20 -mt-20 h-40 w-40 will-change-transform hover:!opacity-100 focus-within:!opacity-100"
          >
            {/* Halo */}
            <span
              className={cn(
                "pointer-events-none absolute -left-16 -top-16 h-[72px] w-[72px] rounded-full transition-opacity duration-300",
                isActive ? "opacity-100" : "opacity-60",
                isRelated && "animate-pulse",
              )}
              style={{ background: NODE_GLOW }}
              aria-hidden="true"
            />

            <button
              type="button"
              aria-label={item.title}
              aria-expanded={isActive}
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(item.id);
              }}
              // Pause the orbit while a node is under the pointer / focused so
              // it's easy to click instead of chasing a moving target.
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") pausedRef.current = true;
              }}
              onPointerLeave={() => {
                pausedRef.current = false;
              }}
              onFocus={(e) => {
                if (e.currentTarget.matches(":focus-visible")) pausedRef.current = true;
              }}
              onBlur={() => {
                pausedRef.current = false;
              }}
              className={cn(
                "relative flex h-40 w-40 items-center justify-center rounded-full border transition-[transform,background-color,border-color,box-shadow,color] duration-300 ease-out",
                isActive
                  ? "scale-150 border-ghost-white bg-ghost-white text-void-black shadow-[0_0_28px_rgba(153,132,216,0.5)]"
                  : isRelated
                    ? "border-lavender-pulse bg-carbon-card text-ghost-white"
                    : "border-graphite bg-carbon-card text-ghost-white hover:border-steel-gray",
              )}
            >
              <Icon className="h-16 w-16" strokeWidth={1.75} aria-hidden="true" />
            </button>

            {(showLabels || isActive) && (
              <span
                className={cn(
                  // Explicit 12px: tailwind-merge (inside cn) drops the custom `text-caption`
                  // size when it sees a text-colour class, so spell the caption size out.
                  "pointer-events-none absolute left-1/2 top-[56px] -translate-x-1/2 whitespace-nowrap text-[12px] font-medium leading-[1.5] tracking-[-0.36px] transition-colors duration-300",
                  isActive ? "text-ghost-white" : "text-ash-gray",
                )}
              >
                {item.title}
              </span>
            )}

            {isActive && (
              <motion.div
                role="region"
                aria-label={`${item.title} details`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                onClick={(e) => e.stopPropagation()}
                className="absolute left-1/2 top-[84px] -ml-[124px] w-[248px] cursor-default overflow-hidden rounded-card border border-graphite bg-carbon-card/95 p-16 text-left backdrop-blur-md"
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: SURFACE_GLOW }}
                  aria-hidden="true"
                />

                <div className="relative">
                  <PillBadge>{item.category}</PillBadge>
                  <p className="mt-12 text-body-sm font-semibold text-ghost-white">
                    {item.title}
                  </p>
                  <p className="mt-4 text-caption text-ash-gray">{item.content}</p>

                  {item.relatedIds.length > 0 && (
                    <div className="mt-12 border-t border-graphite pt-12">
                      <p className="mb-8 flex items-center gap-4 text-caption font-medium uppercase tracking-wider text-steel-gray">
                        <Link2 className="h-12 w-12" aria-hidden="true" />
                        Connected
                      </p>
                      <div className="flex flex-wrap gap-8">
                        {item.relatedIds.map((relatedId) => {
                          const related = timelineData.find((n) => n.id === relatedId);
                          if (!related) return null;
                          return (
                            <button
                              key={relatedId}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNode(relatedId);
                              }}
                              className="inline-flex items-center gap-4 rounded-badge border border-steel-gray px-8 py-4 text-caption text-ash-gray transition-colors duration-200 hover:border-lavender-pulse hover:text-ghost-white"
                            >
                              {related.title}
                              <ArrowRight className="h-12 w-12" aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}