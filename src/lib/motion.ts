// Shared motion tokens so every animation on the site feels like it belongs
// to the same family: same easing curves, same durations, same stagger cap.

// Fast start, long soft landing — feels responsive but never abrupt.
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
// Accelerating exit — things leaving the screen should get out of the way.
export const EASE_IN = [0.4, 0, 1, 1] as const;

export const DURATION = {
  fast: 0.2,
  base: 0.45,
  slow: 0.6,
} as const;

// Stagger delay for the i-th item of a group. Capped so items far down a long
// list (timelines, team grids) never wait noticeably to appear.
export function stagger(index: number, step = 0.06, maxSteps = 5): number {
  return Math.min(index, maxSteps) * step;
}
