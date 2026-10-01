import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

import { PillBadge } from "@/components/common/PillBadge";
import { RegistrationForm, RegistrationSuccess } from "@/components/common/RegistrationForm";
import { Button } from "@/components/ui/button";
import { backend, type SubmitRegistrationResult } from "@/lib/backend";
import { cn } from "@/lib/utils";
import type { ClubEvent } from "@/types";

interface EventDetailDialogProps {
  // The event to show, or null when the popup is closed.
  event: ClubEvent | null;
  onOpenChange: (open: boolean) => void;
}

// Same lavender glow the site uses on CtaBand and the activity cards.
const SURFACE_GLOW =
  "radial-gradient(ellipse at 50% 0%, rgba(163,102,255,0.24), rgba(123,78,245,0.1) 45%, transparent 75%)";

const PLACEHOLDER_COUNT = 3;
const SWIPE_THRESHOLD = 48;

// Centered popup for a single event: photo gallery on the left, details on the
// right (stacked on small screens). Built on Radix Dialog, so focus is trapped,
// Escape / overlay click close it and background scroll is locked.
export function EventDetailDialog({ event, onOpenChange }: EventDetailDialogProps) {
  // Keep the last event around so the popup's content doesn't vanish while its
  // exit animation is still playing.
  const lastEvent = useRef<ClubEvent | null>(event);
  if (event) lastEvent.current = event;
  const shown = event ?? lastEvent.current;

  return (
    <DialogPrimitive.Root open={event !== null} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />

        {shown && (
          <DialogPrimitive.Content
            // `inset-0 m-auto` + a fixed size centres the popup without using
            // transform, which the open/close animation needs for itself.
            // The description is only shown on the details view, so opt out of
            // Radix's "missing Description" warning for the other views.
            aria-describedby={undefined}
            className="fixed inset-0 z-50 m-auto flex h-[min(680px,calc(100dvh-32px))] w-[min(1080px,calc(100vw-32px))] flex-col overflow-hidden rounded-card border border-graphite bg-carbon-card shadow-2xl outline-none data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out md:flex-row"
          >
            <EventGallery key={shown.id} title={shown.title} photos={shown.photos} />
            <EventDetails key={shown.id} event={shown} />
          </DialogPrimitive.Content>
        )}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function EventGallery({ title, photos }: { title: string; photos?: string[] }) {
  const slides: (string | null)[] =
    photos && photos.length > 0 ? photos : Array.from({ length: PLACEHOLDER_COUNT }, () => null);
  const total = slides.length;

  const [index, setIndex] = useState(0);
  const swipeStart = useRef<number | null>(null);

  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  // Left / right arrow keys flip through the photos while the popup is open.
  useEffect(() => {
    if (total < 2) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  return (
    <div
      className="relative h-[220px] shrink-0 overflow-hidden border-b border-graphite bg-void-black md:h-auto md:w-[42%] md:border-b-0 md:border-r"
      role="group"
      aria-roledescription="carousel"
      aria-label={`${title} photos`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: SURFACE_GLOW }}
        aria-hidden="true"
      />

      <div
        className="relative flex h-full touch-pan-y transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onPointerDown={(e) => {
          swipeStart.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (swipeStart.current === null || total < 2) return;
          const dx = e.clientX - swipeStart.current;
          swipeStart.current = null;
          if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
      >
        {slides.map((src, i) => (
          <div
            key={i}
            className="flex h-full min-w-full items-center justify-center"
            role="group"
            aria-roledescription="slide"
            aria-label={`Photo ${i + 1} of ${total}`}
            aria-hidden={i !== index}
          >
            {src ? (
              <img
                src={src}
                alt={`${title} photo ${i + 1}`}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-12 text-steel-gray">
                <ImageIcon className="h-32 w-32" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-caption uppercase tracking-wider">
                  Event photo {i + 1} of {total}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-16 top-1/2 flex h-40 w-40 -translate-y-1/2 items-center justify-center rounded-full border border-graphite bg-carbon-card/80 text-ghost-white backdrop-blur-md transition-colors duration-200 hover:border-steel-gray"
          >
            <ChevronLeft className="h-16 w-16" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-16 top-1/2 flex h-40 w-40 -translate-y-1/2 items-center justify-center rounded-full border border-graphite bg-carbon-card/80 text-ghost-white backdrop-blur-md transition-colors duration-200 hover:border-steel-gray"
          >
            <ChevronRight className="h-16 w-16" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-16 flex items-center justify-center gap-4">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === index}
                className="flex h-16 w-16 items-center justify-center"
              >
                <span
                  className={cn(
                    "h-8 w-8 rounded-full transition-colors duration-300",
                    i === index ? "bg-ghost-white" : "bg-steel-gray/60",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type DetailsMode = "details" | "form" | "done";

function availabilityText(event: ClubEvent): string {
  if (event.capacity == null) return "Open to everyone. No entry limit.";
  const left = Math.max(event.capacity - (event.taken ?? 0), 0);
  if (left === 0) return "This event is full. You can still join the waitlist.";
  return left === 1 ? "1 spot left" : `${left} spots left`;
}

function EventDetails({ event }: { event: ClubEvent }) {
  const { title, date, category, status, description, details, highlights } = event;
  const HighlightIcon = /winner/i.test(highlights?.title ?? "") ? Trophy : Sparkles;

  const [mode, setMode] = useState<DetailsMode>("details");
  const [submitted, setSubmitted] = useState<{
    result: SubmitRegistrationResult;
    email: string;
  } | null>(null);

  // Registration only exists for upcoming events, and only when the backend is
  // connected (otherwise the site is showing sample events).
  const isUpcoming = status === "upcoming" && backend.configured;
  const canRegister = isUpcoming && event.registrationOpen !== false;
  const isFull = event.capacity != null && (event.taken ?? 0) >= event.capacity;

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto p-24 md:p-40">
      <DialogPrimitive.Close
        aria-label="Close"
        className="absolute right-16 top-16 flex h-40 w-40 items-center justify-center rounded-full border border-graphite bg-carbon-card text-ghost-white transition-colors duration-200 hover:border-steel-gray"
      >
        <X className="h-16 w-16" aria-hidden="true" />
      </DialogPrimitive.Close>

      <div className="flex flex-wrap items-center gap-8 pr-48">
        <PillBadge>{category}</PillBadge>
        {status === "upcoming" ? (
          <PillBadge tone="mint" live>
            Upcoming
          </PillBadge>
        ) : (
          <PillBadge>Past</PillBadge>
        )}
      </div>

      <DialogPrimitive.Title className="mt-16 font-alpha-lyrae text-heading-sm font-normal text-ghost-white md:text-heading">
        {title}
      </DialogPrimitive.Title>
      <p className="mt-8 text-body-sm uppercase tracking-wider text-steel-gray">{date}</p>

      {mode === "form" && (
        <div className="mt-24 border-t border-graphite pt-24">
          <RegistrationForm
            event={event}
            onBack={() => setMode("details")}
            onSubmitted={(result, email) => {
              setSubmitted({ result, email });
              setMode("done");
            }}
          />
        </div>
      )}

      {mode === "done" && submitted && (
        <div className="mt-24 border-t border-graphite pt-24">
          <RegistrationSuccess result={submitted.result} email={submitted.email} />
        </div>
      )}

      {mode === "details" && (
        <>
          <DialogPrimitive.Description className="mt-20 text-body text-ash-gray">
            {details ?? description}
          </DialogPrimitive.Description>

          {highlights && highlights.items.length > 0 && (
            <div className="mt-24 border-t border-graphite pt-24">
              <h3 className="flex items-center gap-12 font-alpha-lyrae text-subheading font-normal text-ghost-white">
                <HighlightIcon className="h-24 w-24 text-lavender-pulse" aria-hidden="true" />
                {highlights.title}
              </h3>
              <ul className="mt-16 flex flex-col gap-12">
                {highlights.items.map((item) => (
                  <li key={item} className="flex items-start gap-12 text-body-sm text-ash-gray">
                    <span
                      className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-lavender-pulse"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isUpcoming && (
            <div className="mt-24 flex flex-wrap items-center justify-between gap-16 border-t border-graphite pt-24">
              <div>
                <p className="text-body-sm font-medium text-ghost-white">Registration</p>
                <p className="text-caption text-ash-gray">
                  {canRegister ? availabilityText(event) : "Registration is closed for this event."}
                </p>
              </div>
              {canRegister && (
                <Button variant="filled" onClick={() => setMode("form")}>
                  {isFull ? "Join the waitlist" : "Register"}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
