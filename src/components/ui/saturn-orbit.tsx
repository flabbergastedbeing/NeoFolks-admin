import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import type { TechNode } from "@/types";
import logoUrl from "@/assets/saturn-logo.png";

// Saturn-style orbit: technologies travel around one tilted ring, passing
// behind the centre logo and in front of it. Restyled onto the site's tokens
// (carbon-card / graphite / ash-gray / lavender-pulse, Inter).
//
// Behaviour
//  - Constant rotation. Hovering / focusing the ring eases it to a stop.
//  - Clicking a technology glides it to the front of the ring.
//  - Positions are written straight to the DOM every frame (no React re-render
//    per frame). Only the caption under the ring is React state.
//  - Pauses while off-screen; never auto-rotates for reduced-motion users.

const TILT = (-16 * Math.PI) / 180; // ring tilt
const SQUASH = 0.38; // 0 = edge-on, 1 = flat circle
const SECONDS_PER_ITEM = 1.2; // lower = faster
const MAX_RADIUS = 300;
const TWO_PI = Math.PI * 2;
const FRONT = Math.PI / 2; // the "front" of the ring

// Site tokens as rgb so they can be blended per frame.
const LAVENDER = [153, 132, 216]; // lavender-pulse #9984d8
const CARD = [5, 6, 7]; // carbon-card #050607
const CARD_ACTIVE = [33, 21, 53]; // the site's orbit tint #211535
const GRAPHITE = [51, 51, 51]; // graphite #333333

const mix = (a: number[], b: number[], t: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c: number[], alpha = 1) => `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a)); // -PI..PI
const smooth = (x: number) => x * x * (3 - 2 * x);

interface SaturnOrbitProps {
  items: TechNode[];
  className?: string;
  ariaLabel?: string;
}

export default function SaturnOrbit({
  items,
  className,
  ariaLabel = "Technologies we explore",
}: SaturnOrbitProps) {
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const goToRef = useRef<(i: number) => void>(() => {});
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [frontIdx, setFrontIdx] = useState(0);

  const radius = Math.min(size.w * 0.44, MAX_RADIUS);
  const minor = radius * SQUASH;
  const deg = (TILT * 180) / Math.PI;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || items.length === 0) return;

    const N = items.length;
    const STEP = TWO_PI / N;
    const FULL_SPEED = -STEP / SECONDS_PER_ITEM; // rad / s

    let W = 0;
    let H = 0;
    let R = 0;
    let B = 0;
    let offset = FRONT; // item 0 starts at the front
    let speed = 0;
    let goal: number | null = null;
    let hovering = false;
    let visible = true;
    let shown = -1;
    let raf = 0;
    let last = performance.now();

    const measure = () => {
      const r = stage.getBoundingClientRect();
      W = r.width;
      H = r.height;
      R = Math.min(W * 0.44, MAX_RADIUS);
      B = R * SQUASH;
      setSize({ w: W, h: H });
    };

    const place = () => {
      nodeRefs.current.forEach((el, i) => {
        if (!el) return;
        const th = i * STEP + offset;
        const lx = R * Math.cos(th);
        const ly = B * Math.sin(th); // ly > 0 = front, ly < 0 = back
        const x = lx * Math.cos(TILT) - ly * Math.sin(TILT);
        const y = lx * Math.sin(TILT) + ly * Math.cos(TILT);
        const depth = B > 0 ? (ly / B + 1) / 2 : 0.5; // 0 back .. 1 front

        // closeness to the very front, as a smooth 0..1 value
        const d = Math.abs(wrapAngle(th - FRONT));
        const e = smooth(1 - Math.min(1, d / (STEP * 0.8)));

        const scale = (0.62 + 0.38 * depth) * (1 + 0.3 * e);
        const base = 0.28 + 0.5 * depth;
        el.style.transform = `translate(${W / 2 + x}px, ${H / 2 + y}px) scale(${scale})`;
        el.style.opacity = String(base + (1 - base) * e);
        el.style.zIndex = ly >= 0 ? String(5 + Math.round(depth * 10)) : "1";
        el.style.borderColor = rgb(mix(GRAPHITE, LAVENDER, e), 0.6 + 0.4 * e);
        el.style.background = rgb(mix(CARD, CARD_ACTIVE, e));
        el.style.color = rgb(mix([179, 179, 179], [255, 255, 255], e)); // ash-gray -> ghost-white
        el.style.boxShadow =
          e > 0.02
            ? `0 0 0 ${6 * e}px ${rgb(LAVENDER, 0.14 * e)}, 0 0 ${34 * e}px ${6 * e}px ${rgb(LAVENDER, 0.4 * e)}`
            : "none";

        const label = el.lastElementChild as HTMLElement | null;
        if (label) {
          label.style.opacity = String(e);
          label.style.transform = `translate(-50%, ${6 + 6 * e}px) scale(${1 / scale})`; // steady text size
        }
      });

      // the caption follows whichever item is closest to the front
      const near = ((Math.round((FRONT - offset) / STEP) % N) + N) % N;
      if (near !== shown) {
        shown = near;
        setFrontIdx(near);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (goal !== null) {
        // gliding to a clicked icon
        const diff = goal - offset;
        offset += diff * (1 - Math.exp(-dt * 7));
        if (Math.abs(diff) < 0.002) {
          offset = goal;
          goal = null;
        }
      } else {
        const wanted = hovering || reduced || !visible ? 0 : FULL_SPEED;
        speed += (wanted - speed) * (1 - Math.exp(-dt * 5)); // ease up / down
        offset += speed * dt;
      }
      place();
      raf = requestAnimationFrame(frame);
    };

    goToRef.current = (i: number) => {
      let target = FRONT - i * STEP;
      target += Math.round((offset - target) / TWO_PI) * TWO_PI; // shortest way round
      if (reduced) {
        offset = target;
        goal = null;
        place();
      } else {
        goal = target;
      }
    };

    const onEnter = () => (hovering = true);
    const onLeave = () => (hovering = false);
    const onFocusIn = () => (hovering = true);
    const onFocusOut = () => (hovering = false);
    stage.addEventListener("mouseenter", onEnter);
    stage.addEventListener("mouseleave", onLeave);
    stage.addEventListener("focusin", onFocusIn);
    stage.addEventListener("focusout", onFocusOut);

    const resizeObserver = new ResizeObserver(() => {
      measure();
      place();
    });
    resizeObserver.observe(stage);

    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    visibility.observe(stage);

    measure();
    place();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      visibility.disconnect();
      stage.removeEventListener("mouseenter", onEnter);
      stage.removeEventListener("mouseleave", onLeave);
      stage.removeEventListener("focusin", onFocusIn);
      stage.removeEventListener("focusout", onFocusOut);
    };
  }, [items, reduced]);

  // One half of the tilted ellipse: "back" passes behind the logo, "front" in front.
  const half = (which: "back" | "front") =>
    `M ${-radius} 0 A ${radius} ${minor} 0 0 ${which === "front" ? 1 : 0} ${radius} 0`;
  const ring = (which: "back" | "front") => (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      style={{ zIndex: which === "front" ? 4 : 1 }}
      viewBox={`0 0 ${size.w} ${size.h}`}
      aria-hidden="true"
    >
      <g transform={`translate(${size.w / 2} ${size.h / 2}) rotate(${deg})`}>
        <path d={half(which)} fill="none" stroke={rgb(LAVENDER, 0.32)} strokeWidth={0.6} />
      </g>
    </svg>
  );

  return (
    <div className={cn("w-full", className)}>
      <style>{glassCss}</style>

      <div
        ref={stageRef}
        className="relative mx-auto aspect-[1/0.85] w-full max-w-[680px]"
        role="group"
        aria-label={ariaLabel}
      >
        {/* ring: back half behind the icons, front half in front */}
        {ring("back")}

        {/* centre logo (liquid glass) */}
        <div
          className="saturn-glass"
          role="img"
          aria-label="NeoFolks logo"
          style={{ "--saturn-logo": `url(${logoUrl})` } as React.CSSProperties}
        >
          <span className="sg-blur" />
          <span className="sg-base" />
          <span className="sg-tint" />
          <span className="sg-rim" />
        </div>

        {ring("front")}

        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              type="button"
              aria-label={item.title}
              onClick={() => goToRef.current(i)}
              className="absolute left-0 top-0 grid h-[46px] w-[46px] -ml-[23px] -mt-[23px] cursor-pointer place-items-center rounded-full border border-graphite bg-carbon-card text-ghost-white will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ghost-white"
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={1.7} aria-hidden="true" />
              <span
                className="pointer-events-none absolute left-1/2 top-full whitespace-nowrap font-inter text-body-sm font-medium text-ghost-white opacity-0"
                style={{ textShadow: "0 1px 10px #000" }}
              >
                {item.title}
              </span>
            </button>
          );
        })}

        {/* filters used by the glass logo */}
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <filter id="saturn-glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
            <feDisplacementMap in="SourceGraphic" in2="softMap" scale="40" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="saturn-glass-rim" x="-5%" y="-5%" width="110%" height="110%">
            <feComponentTransfer in="SourceAlpha" result="inv">
              <feFuncA type="table" tableValues="1 0" />
            </feComponentTransfer>
            <feOffset in="inv" dx="2" dy="2" result="o1" />
            <feComposite in="o1" in2="SourceAlpha" operator="in" result="r1" />
            <feOffset in="inv" dx="-1" dy="-1" result="o2" />
            <feComposite in="o2" in2="SourceAlpha" operator="in" result="r2" />
            <feMerge result="rim">
              <feMergeNode in="r1" />
              <feMergeNode in="r2" />
            </feMerge>
            <feGaussianBlur in="rim" stdDeviation="0.4" result="soft" />
            <feFlood floodColor="#ffffff" floodOpacity="0.6" />
            <feComposite in2="soft" operator="in" />
          </filter>
        </svg>
      </div>

      <p
        className="mt-[10px] min-h-[1.5em] text-center text-body-sm text-ash-gray"
        aria-live="polite"
      >
        {items[frontIdx]?.title}
      </p>
    </div>
  );
}

const glassCss = `
  .saturn-glass {
    position: absolute; left: 50%; top: 50%; z-index: 2;
    width: 13%; aspect-ratio: 240 / 267;
    transform: translate(-50%, -50%);
    transition: transform .7s cubic-bezier(.175, .885, .32, 2.2);
  }
  .saturn-glass:hover { transform: translate(-50%, -50%) scale(1.08); }
  .saturn-glass span {
    position: absolute; inset: 0;
    -webkit-mask: var(--saturn-logo) center / contain no-repeat;
            mask: var(--saturn-logo) center / contain no-repeat;
  }
  .sg-base { background: var(--saturn-logo) center / contain no-repeat; }
  .sg-blur {
    -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
    filter: url(#saturn-glass-distortion);
    isolation: isolate;
  }
  .sg-tint { background: rgba(255, 255, 255, .08); }
  .sg-rim {
    background: var(--saturn-logo) center / contain no-repeat;
    filter: url(#saturn-glass-rim);
    -webkit-mask: none; mask: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .saturn-glass { transition: none; }
    .saturn-glass:hover { transform: translate(-50%, -50%); }
  }
`;