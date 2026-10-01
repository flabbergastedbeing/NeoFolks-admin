import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/*
  Serpentine timeline
  -------------------
  A wavy vertical line that swings between the left and right of the container,
  with one node per item sitting on a peak of the wave and its card beside it,
  outside the wave. Cards alternate left / right.

  Focus model: exactly one item is "focused" and drawn sharp. Every card before
  and after it is blurred and dimmed, more strongly the further away it is (the
  wave and its nodes stay crisp so the path is always readable). The
  focused item follows scroll (whichever item crosses the middle of the
  viewport), and can also be set by clicking a card or tabbing to it.

  On narrow containers the wave shrinks into a small wiggle down the left edge
  and every card sits to its right.

  Geometry is measured from the real DOM (row centres + container width), so the
  line always lines up with the nodes however tall the cards turn out to be.
*/

// Below this container width the timeline collapses to the single-column layout.
const WIDE_MIN_WIDTH = 640;
const WIDE = { amp: 56, gap: 28 };
const NARROW = { cx: 16, amp: 6, inset: 44 };
const DOT = 12;

const LINE_IDLE = "#333333"; // graphite
const LINE_DONE = "#9984d8"; // lavender-pulse
const NODE_GLOW =
  "radial-gradient(circle, rgba(153,132,216,0.45) 0%, rgba(153,132,216,0) 70%)";

// Every focus transition (card blur/fade, node, glow, lit path) runs 800ms
// (`duration-[800ms]` below). Raise/lower them together to speed up or slow down.

// How far each step away from the focused item is blurred / dimmed / shrunk.
function depthStyle(distance: number): { blur: number; opacity: number; scale: number } {
  if (distance === 0) return { blur: 0, opacity: 1, scale: 1 };
  if (distance === 1) return { blur: 4, opacity: 0.55, scale: 0.98 };
  return { blur: 6, opacity: 0.35, scale: 0.96 };
}

interface Geometry {
  width: number;
  height: number;
  ys: number[];
}

interface SerpentineTimelineProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T, index: number, focused: boolean) => ReactNode;
  // When provided, activating the FOCUSED card (click, Enter or Space) calls this
  // (e.g. to open a popup). Activating a blurred card only brings it into focus
  // and scrolls it to the middle of the screen, as it always did.
  onItemClick?: (item: T, index: number) => void;
  ariaLabel?: string;
  className?: string;
}

export function SerpentineTimeline<T extends { id: string }>({
  items,
  renderItem,
  onItemClick,
  ariaLabel = "Timeline",
  className,
}: SerpentineTimelineProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reducedMotion = useReducedMotion();
  // Whether a card was already the focused one when the pointer went down on it.
  // Needed because the browser focuses the card on mouse-down, which makes it
  // "focused" before the click event arrives.
  const pressedWhileFocused = useRef<boolean | null>(null);

  const [active, setActive] = useState(0);
  const [geo, setGeo] = useState<Geometry>({ width: 0, height: 0, ys: [] });

  const current = Math.min(active, Math.max(items.length - 1, 0));
  const wide = geo.width >= WIDE_MIN_WIDTH;
  const cx = wide ? geo.width / 2 : NARROW.cx;
  const amp = wide ? WIDE.amp : NARROW.amp;
  const xAt = (index: number) => cx + (index % 2 === 0 ? -amp : amp);

  // Measure the container and the vertical centre of every row.
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const ys = rowRefs.current
      .slice(0, items.length)
      .map((row) => (row ? row.offsetTop + row.offsetHeight / 2 : 0));
    const next: Geometry = {
      width: container.clientWidth,
      height: container.offsetHeight,
      ys,
    };
    setGeo((prev) =>
      prev.width === next.width &&
      prev.height === next.height &&
      prev.ys.length === ys.length &&
      prev.ys.every((y, i) => y === ys[i])
        ? prev
        : next,
    );
  }, [items.length]);

  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    rowRefs.current.slice(0, items.length).forEach((row) => row && observer.observe(row));
    return () => observer.disconnect();
  }, [measure, items.length]);

  // Scroll-driven focus: the row crossing a thin band at the middle of the
  // viewport becomes the focused one. When the band sits in a gap between rows
  // nothing fires, so the previous row simply stays focused.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index));
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    rowRefs.current.slice(0, items.length).forEach((row) => row && observer.observe(row));
    return () => observer.disconnect();
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      role="list"
      aria-label={ariaLabel}
      className={cn("relative flex flex-col", wide ? "gap-40" : "gap-32", className)}
    >
      {/* The wave: one S-curve per pair of neighbouring nodes. Segments the
          reader has already passed are lit lavender. */}
      {geo.ys.length > 1 && (
        <svg
          className="pointer-events-none absolute left-0 top-0"
          width={geo.width}
          height={geo.height}
          aria-hidden="true"
        >
          {geo.ys.slice(0, -1).map((y1, i) => {
            const y2 = geo.ys[i + 1];
            const x1 = xAt(i);
            const x2 = xAt(i + 1);
            const ym = (y1 + y2) / 2;
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${x1} ${ym} ${x2} ${ym} ${x2} ${y2}`}
                fill="none"
                strokeWidth={1.5}
                strokeLinecap="round"
                className="transition-colors duration-[800ms]"
                style={{ stroke: i < current ? LINE_DONE : LINE_IDLE }}
              />
            );
          })}
        </svg>
      )}

      {items.map((item, index) => {
        const distance = Math.abs(index - current);
        const focused = distance === 0;
        const passed = index < current;
        const onLeft = index % 2 === 0;
        const { blur, opacity, scale } = depthStyle(distance);

        const dotLeft = wide
          ? `calc(50% + ${(onLeft ? -amp : amp) - DOT / 2}px)`
          : `${xAt(index) - DOT / 2}px`;
        const reach = amp + WIDE.gap;

        const cardStyle: CSSProperties = wide
          ? onLeft
            ? { width: `calc(50% - ${reach}px)` }
            : { width: `calc(50% - ${reach}px)`, marginLeft: `calc(50% + ${reach}px)` }
          : { marginLeft: NARROW.inset };

        // Only the card is blurred: the node and connector stay crisp so the
        // wave never appears to end in empty space.
        const cardDepthStyle: CSSProperties = {
          filter: `blur(${blur}px)`,
          opacity,
          transform: `scale(${scale})`,
          // Shrink towards the node so the card doesn't drift sideways.
          transformOrigin: wide && !onLeft ? "left center" : wide ? "right center" : "left center",
        };

        return (
          <div
            key={item.id}
            role="listitem"
            ref={(el) => {
              rowRefs.current[index] = el;
            }}
            data-index={index}
            className="relative"
          >
            {/* Connector from the wave to the card (wide layout only). */}
            {wide && (
              <span
                className="absolute top-1/2 h-px bg-graphite"
                style={{
                  left: onLeft
                    ? `calc(50% - ${reach}px)`
                    : `calc(50% + ${amp + DOT / 2}px)`,
                  width: WIDE.gap - DOT / 2,
                }}
                aria-hidden="true"
              />
            )}

            {/* Node on the wave */}
            <span
              className={cn(
                "absolute rounded-full border transition-[background-color,border-color,transform] duration-[800ms]",
                focused
                  ? "scale-125 border-ghost-white bg-ghost-white"
                  : passed
                    ? "border-lavender-pulse bg-void-black"
                    : "border-steel-gray bg-void-black",
              )}
              style={{ left: dotLeft, top: `calc(50% - ${DOT / 2}px)`, width: DOT, height: DOT }}
              aria-hidden="true"
            >
              <span
                className={cn(
                  "pointer-events-none absolute -inset-[12px] rounded-full transition-opacity duration-[800ms]",
                  focused ? "opacity-100" : "opacity-0",
                )}
                style={{ background: NODE_GLOW }}
              />
            </span>

            {/* The card. Focusable so keyboard users can step through the story;
                clicking a blurred card brings it to the middle of the screen. */}
            <div
              tabIndex={0}
              role={onItemClick ? "button" : undefined}
              aria-haspopup={onItemClick && focused ? "dialog" : undefined}
              aria-current={focused ? "step" : undefined}
              style={{ ...cardStyle, ...cardDepthStyle }}
              onFocus={() => setActive(index)}
              onPointerDown={() => {
                pressedWhileFocused.current = focused;
              }}
              onClick={(event) => {
                const wasFocused = pressedWhileFocused.current ?? focused;
                pressedWhileFocused.current = null;
                setActive(index);
                if (onItemClick && wasFocused) {
                  onItemClick(item, index);
                  return;
                }
                event.currentTarget.scrollIntoView({
                  block: "center",
                  behavior: reducedMotion ? "auto" : "smooth",
                });
              }}
              onKeyDown={(event) => {
                if (!onItemClick || event.target !== event.currentTarget) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setActive(index);
                if (focused) {
                  onItemClick(item, index);
                } else {
                  event.currentTarget.scrollIntoView({
                    block: "center",
                    behavior: reducedMotion ? "auto" : "smooth",
                  });
                }
              }}
              className="cursor-pointer transition-[filter,opacity,transform] duration-[800ms] ease-out"
            >
              {renderItem(item, index, focused)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SerpentineTimeline;