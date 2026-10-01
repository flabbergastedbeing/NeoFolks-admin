import { metrics } from "@/data/metrics";
import { MetricCard } from "@/components/common/MetricCard";

export function StatsRow() {
  return (
    <section className="container-page mt-56 md:mt-80">
      <div className="grid grid-cols-1 gap-16 sm:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  );
}
