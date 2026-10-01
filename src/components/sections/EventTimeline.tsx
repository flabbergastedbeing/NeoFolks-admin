import { useMemo, useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SerpentineTimeline } from "@/components/ui/serpentine-timeline";
import { SectionHeader } from "@/components/common/SectionHeader";
import { EventCard } from "@/components/common/EventCard";
import { EventDetailDialog } from "@/components/common/EventDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import type { ClubEvent, EventCategory } from "@/types";

const filters: ("All" | EventCategory)[] = ["All", "Workshops", "Seminars", "Competitions", "Community"];

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// Sortable month index from strings like "December 2026". Parsed by hand
// because `new Date("December 2026")` is not reliable across browsers.
function dateValue(event: ClubEvent): number {
  // Events from the database carry an exact ISO date.
  if (event.eventDate) return Date.parse(event.eventDate) / 86_400_000;
  const month = MONTHS.indexOf(event.date.split(" ")[0].toLowerCase());
  return Number(event.year) * 12 + Math.max(month, 0);
}

export function EventTimeline() {
  const { data, isLoading, isError, refetch } = useEvents();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  // The event whose popup is open (null = closed). Stored as an id and looked up
  // in the latest data, so "spots left" refreshes right after someone registers.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEvent = data?.find((e) => e.id === selectedId) ?? null;

  // Newest first, so upcoming events sit at the top of the serpentine.
  const events = useMemo(() => {
    if (!data) return [];
    const filtered = filter === "All" ? data : data.filter((e) => e.category === filter);
    return [...filtered].sort((a, b) => dateValue(b) - dateValue(a));
  }, [data, filter]);

  return (
    <section className="section-spacing">
      <div className="container-page flex flex-col gap-40">
        <SectionHeader
          eyebrow="Our Event Journey"
          title="The Story So Far"
          subhead="A look back at the milestones behind Neofolks."
        />

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="justify-center">
            {filters.map((f) => (
              <TabsTrigger key={f} value={f}>
                {f}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={filter}>
            {isLoading && (
              <div className="mx-auto flex max-w-[960px] flex-col gap-16">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[100px] w-full" />
                ))}
              </div>
            )}

            {isError && <ErrorState message="Couldn't load events." onRetry={() => refetch()} />}

            {data && events.length === 0 && (
              <p className="text-center text-body-sm text-ash-gray">
                No events in this category yet.
              </p>
            )}

            {data && events.length > 0 && (
              // `key` resets the focused item whenever the filter changes.
              <SerpentineTimeline
                key={filter}
                items={events}
                ariaLabel="Event timeline"
                className="mx-auto max-w-[960px]"
                renderItem={(event, _index, focused) => <EventCard {...event} focused={focused} />}
                onItemClick={(event) => setSelectedId(event.id)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <EventDetailDialog
        event={selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </section>
  );
}