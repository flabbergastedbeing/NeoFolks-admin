import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PillBadge } from "@/components/common/PillBadge";
import { ErrorState } from "@/components/common/ErrorState";
import { EventEditor } from "@/components/admin/EventEditor";
import { useAdminEvents, useDeleteEvent } from "@/hooks/useAdmin";
import type { ClubEvent } from "@/types";

interface AdminEventsPanelProps {
  onViewRegistrations: (eventId: string) => void;
}

export function AdminEventsPanel({ onViewRegistrations }: AdminEventsPanelProps) {
  const { data, isLoading, isError, refetch } = useAdminEvents();
  const del = useDeleteEvent();
  // undefined = showing the list, null = adding, event = editing.
  const [editing, setEditing] = useState<ClubEvent | null | undefined>(undefined);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Upcoming first (soonest first), then past (most recent first).
  const events = useMemo(() => {
    const list = data ?? [];
    const time = (e: ClubEvent) => Date.parse(e.eventDate ?? "");
    return [
      ...list.filter((e) => e.status === "upcoming").sort((a, b) => time(a) - time(b)),
      ...list.filter((e) => e.status === "past").sort((a, b) => time(b) - time(a)),
    ];
  }, [data]);

  if (editing !== undefined) {
    return <EventEditor event={editing} onClose={() => setEditing(undefined)} />;
  }

  const onDelete = async (event: ClubEvent) => {
    try {
      await del.mutateAsync(event.id);
      toast.success(`Deleted "${event.title}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the event.");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="flex flex-col gap-24">
      <div className="flex flex-wrap items-center justify-between gap-12">
        <p className="max-w-[560px] text-body-sm text-ash-gray">
          Add upcoming events (people can register for these) and past events (they appear on the
          timeline). Changes show up on the Events page straight away.
        </p>
        <Button variant="filled" onClick={() => setEditing(null)}>
          <Plus className="mr-8 h-16 w-16" aria-hidden="true" />
          Add event
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] w-full" />
          ))}
        </div>
      )}

      {isError && <ErrorState message="Couldn't load events." onRetry={() => refetch()} />}

      {data && events.length === 0 && (
        <p className="rounded-card border border-dashed border-graphite p-32 text-center text-body-sm text-ash-gray">
          No events yet. Add your first one.
        </p>
      )}

      <ul className="flex flex-col gap-12">
        {events.map((event) => {
          const upcoming = event.status === "upcoming";
          const confirming = confirmId === event.id;
          return (
            <li
              key={event.id}
              className="flex flex-col gap-16 rounded-card border border-graphite bg-carbon-card p-20 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-8">
                  {upcoming ? (
                    <PillBadge tone="mint" live>
                      Upcoming
                    </PillBadge>
                  ) : (
                    <PillBadge>Past</PillBadge>
                  )}
                  <span className="text-caption text-steel-gray">{event.category}</span>
                </div>
                <p className="mt-8 truncate text-body font-semibold text-ghost-white">{event.title}</p>
                <p className="text-body-sm text-ash-gray">
                  {event.date}
                  {upcoming && (
                    <>
                      {" · "}
                      {event.capacity != null
                        ? `${event.taken ?? 0} of ${event.capacity} spots taken`
                        : `${event.taken ?? 0} registered, no limit`}
                      {event.registrationOpen === false && " · registration closed"}
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-8">
                {confirming ? (
                  <>
                    <span className="text-body-sm text-ash-gray">
                      Delete this event and its registrations?
                    </span>
                    <Button
                      variant="outlined"
                      size="sm"
                      className="border-error-red text-error-red hover:border-error-red"
                      disabled={del.isPending}
                      onClick={() => void onDelete(event)}
                    >
                      Yes, delete
                    </Button>
                    <Button variant="outlined" size="sm" onClick={() => setConfirmId(null)}>
                      Keep
                    </Button>
                  </>
                ) : (
                  <>
                    {upcoming && (
                      <Button variant="outlined" size="sm" onClick={() => onViewRegistrations(event.id)}>
                        Registrations
                      </Button>
                    )}
                    <Button variant="outlined" size="sm" onClick={() => setEditing(event)}>
                      Edit
                    </Button>
                    <Button variant="outlined" size="sm" onClick={() => setConfirmId(event.id)}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
