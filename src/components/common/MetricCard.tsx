import type { Metric } from "@/types";
import { PillBadge } from "@/components/common/PillBadge";

// Design.md "Metric Display Card": Carbon Card surface, 34px number, mint
// delta, tiny violet sparkline. Static on purpose: the old scroll-in reveal and
// count-up re-rendered the card every frame while the user was scrolling.
export function MetricCard({ label, value, suffix, delta, isLive }: Metric) {
  const sparklinePoints = "0,24 12,18 24,20 36,10 48,14 60,4 72,8";

  return (
    <div className="rounded-card border border-graphite bg-carbon-card p-20 transition-colors hover:border-steel-gray">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-ash-gray">{label}</p>
        {isLive && <PillBadge tone="mint" live>Live</PillBadge>}
      </div>
      <p className="mt-8 text-heading font-semibold tabular-nums text-ghost-white">
        {value.toLocaleString()}
        {suffix}
      </p>
      <div className="mt-12 flex items-center justify-between">
        <span className="text-body-sm font-medium text-mint-signal">{delta}</span>
        <svg width="72" height="28" viewBox="0 0 72 28" fill="none" aria-hidden="true">
          <polyline
            points={sparklinePoints}
            fill="none"
            stroke="#9984d8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
