import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Download, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminEvents,
  useRegistrations,
  useReviewRegistration,
  useSendApprovalEmail,
} from "@/hooks/useAdmin";
import { formatDateTime } from "@/lib/dates";
import { downloadRegistrationsExcel } from "@/lib/exportRegistrations";
import { cn } from "@/lib/utils";
import type { Registration, RegistrationStatus } from "@/types";

type Filter = "all" | RegistrationStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  pending: "border-steel-gray text-ash-gray",
  approved: "border-mint-signal/50 text-mint-signal",
  waitlisted: "border-lavender-pulse/60 text-lavender-pulse",
  rejected: "border-error-red/50 text-error-red",
};

const FULL_HINT = "The event is full. Raise the entry limit or reject an entry to free a spot.";

interface AdminRegistrationsPanelProps {
  eventId: string | null;
  onSelectEvent: (id: string) => void;
}

export function AdminRegistrationsPanel({ eventId, onSelectEvent }: AdminRegistrationsPanelProps) {
  const events = useAdminEvents();
  const registrations = useRegistrations(eventId);
  const review = useReviewRegistration();
  const resend = useSendApprovalEmail();

  const [filter, setFilter] = useState<Filter>("all");
  const [exporting, setExporting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Upcoming events first: those are the ones taking sign-ups.
  const ordered = useMemo(() => {
    const list = events.data ?? [];
    const time = (e: { eventDate?: string }) => Date.parse(e.eventDate ?? "");
    return [
      ...list.filter((e) => e.status === "upcoming").sort((a, b) => time(a) - time(b)),
      ...list.filter((e) => e.status === "past").sort((a, b) => time(b) - time(a)),
    ];
  }, [events.data]);

  // Pick something sensible when the tab is opened without an event chosen.
  useEffect(() => {
    if (!eventId && ordered.length > 0) onSelectEvent(ordered[0].id);
  }, [eventId, ordered, onSelectEvent]);

  const event = ordered.find((e) => e.id === eventId);
  const rows = useMemo(() => registrations.data ?? [], [registrations.data]);

  const counts = useMemo(() => {
    const c: Record<RegistrationStatus, number> = { pending: 0, approved: 0, waitlisted: 0, rejected: 0 };
    for (const r of rows) c[r.status] += 1;
    return c;
  }, [rows]);

  const taken = counts.pending + counts.approved;
  const capacity = event?.capacity ?? null;
  const isFull = capacity != null && taken >= capacity;
  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const onReview = async (row: Registration, action: "approve" | "reject") => {
    try {
      const result = await review.mutateAsync({ id: row.id, action });
      if (action === "reject") {
        toast.success(`Rejected ${row.fullName}`);
      } else if (result.email?.sent) {
        toast.success(`Approved ${row.fullName}`, { description: `A confirmation email was sent to ${row.email}.` });
      } else {
        toast.warning(`Approved ${row.fullName}, but the email didn't send`, {
          description: result.email?.error ?? "Use “Resend email” on their row to try again.",
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const onExport = async () => {
    if (!event) return;
    setExporting(true);
    try {
      await downloadRegistrationsExcel(event, rows);
      toast.success("Excel file downloaded", {
        description: `${rows.length} ${rows.length === 1 ? "registration" : "registrations"} for ${event.title}.`,
      });
    } catch {
      toast.error("Couldn't create the Excel file. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const onResend = async (row: Registration) => {
    try {
      const result = await resend.mutateAsync(row.id);
      if (result.sent) toast.success(`Email sent to ${row.email}`);
      else toast.error("The email didn't send", { description: result.error });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (events.isLoading) return <Skeleton className="h-[240px] w-full" />;
  if (events.isError) return <ErrorState message="Couldn't load events." onRetry={() => events.refetch()} />;
  if (ordered.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-graphite p-32 text-center text-body-sm text-ash-gray">
        Add an event first, then its registrations will appear here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-24">
      <div className="flex flex-wrap items-end justify-between gap-16">
        <div className="w-full max-w-[420px]">
          <label htmlFor="reg-event" className="mb-8 block text-body-sm font-medium text-ghost-white">
            Event
          </label>
          <Select value={eventId ?? undefined} onValueChange={onSelectEvent}>
            <SelectTrigger id="reg-event">
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {ordered.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title} · {e.date}
                  {e.status === "past" ? " (past)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-8">
          <Button
            variant="outlined"
            size="sm"
            disabled={exporting || !registrations.data || rows.length === 0}
            title={rows.length === 0 ? "No registrations to export yet" : undefined}
            onClick={() => void onExport()}
          >
            <Download className="mr-8 h-12 w-12" aria-hidden="true" />
            {exporting ? "Preparing…" : "Download Excel"}
          </Button>
          <Button variant="outlined" size="sm" onClick={() => void registrations.refetch()}>
            <RefreshCw className={cn("mr-8 h-12 w-12", registrations.isFetching && "animate-spin")} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Numbers at a glance */}
      <div className="grid grid-cols-2 gap-12 md:grid-cols-5">
        <Stat
          label="Spots"
          value={capacity != null ? `${taken} / ${capacity}` : `${taken} / ∞`}
          note={isFull ? "Full: new sign-ups are waitlisted" : capacity != null ? `${capacity - taken} left` : "No limit"}
        />
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Approved" value={counts.approved} />
        <Stat label="Waitlisted" value={counts.waitlisted} />
        <Stat label="Rejected" value={counts.rejected} />
      </div>

      <div className="flex flex-wrap gap-8" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-badge border px-12 py-4 text-[12px] transition-colors duration-200",
              filter === f.value
                ? "border-ghost-white text-ghost-white"
                : "border-graphite text-ash-gray hover:border-steel-gray hover:text-ghost-white",
            )}
          >
            {f.label}
            {f.value !== "all" && <span className="ml-4 text-steel-gray">{counts[f.value]}</span>}
          </button>
        ))}
      </div>

      {registrations.isLoading && <Skeleton className="h-[200px] w-full" />}
      {registrations.isError && (
        <ErrorState message="Couldn't load registrations." onRetry={() => registrations.refetch()} />
      )}

      {registrations.data && visible.length === 0 && (
        <p className="rounded-card border border-dashed border-graphite p-32 text-center text-body-sm text-ash-gray">
          {rows.length === 0 ? "No one has registered yet." : "No entries with this status."}
        </p>
      )}

      {visible.length > 0 && (
        <div className="overflow-x-auto rounded-card border border-graphite bg-carbon-card">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="text-caption uppercase tracking-wider text-steel-gray">
                <th className="px-16 py-12 font-medium">Participant</th>
                <th className="px-16 py-12 font-medium">Status</th>
                <th className="px-16 py-12 font-medium">Submitted</th>
                <th className="px-16 py-12 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const busy =
                  (review.isPending && review.variables?.id === row.id) ||
                  (resend.isPending && resend.variables === row.id);
                const needsSpot = row.status === "waitlisted" || row.status === "rejected";
                const blocked = needsSpot && isFull;
                const open = expanded === row.id;

                return (
                  <Fragment key={row.id}>
                    <tr className="border-t border-graphite align-top">
                      <td className="px-16 py-12">
                        <p className="text-body-sm font-medium text-ghost-white">
                          {row.fullName}
                          {row.registrantType === "outside" && (
                            <span className="ml-8 rounded-badge border border-lavender-pulse/50 px-8 py-2 align-middle text-[11px] font-medium text-lavender-pulse">
                              Outside university
                            </span>
                          )}
                        </p>
                        <p className="text-caption text-ash-gray">{row.email}</p>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setExpanded(open ? null : row.id)}
                          className="mt-4 inline-flex items-center gap-4 text-caption text-steel-gray transition-colors duration-200 hover:text-ghost-white"
                        >
                          {open ? "Hide details" : "View details"}
                          <ChevronDown
                            className={cn("h-12 w-12 transition-transform duration-200", open && "rotate-180")}
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                      <td className="px-16 py-12">
                        <span
                          className={cn(
                            // 12px spelled out: tailwind-merge would drop `text-caption` next to a colour class.
                            "inline-flex rounded-badge border px-12 py-4 text-[12px] font-medium capitalize",
                            STATUS_STYLES[row.status],
                          )}
                        >
                          {row.status}
                        </span>
                        {row.status === "approved" && (
                          <p
                            className={cn("mt-4 text-[12px]", row.emailSentAt ? "text-steel-gray" : "text-error-red")}
                            title={row.emailError}
                          >
                            {row.emailSentAt
                              ? `Email sent ${formatDateTime(row.emailSentAt)}`
                              : row.emailError
                                ? "Email failed"
                                : "Email not sent"}
                          </p>
                        )}
                      </td>
                      <td className="px-16 py-12 text-body-sm text-ash-gray">
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="px-16 py-12">
                        <div className="flex flex-wrap justify-end gap-8">
                          {row.status === "pending" && (
                            <>
                              <Button size="sm" disabled={busy} onClick={() => void onReview(row, "approve")}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outlined" disabled={busy} onClick={() => void onReview(row, "reject")}>
                                Reject
                              </Button>
                            </>
                          )}
                          {row.status === "waitlisted" && (
                            <>
                              <Button
                                size="sm"
                                disabled={busy || blocked}
                                title={blocked ? FULL_HINT : undefined}
                                onClick={() => void onReview(row, "approve")}
                              >
                                Promote &amp; approve
                              </Button>
                              <Button size="sm" variant="outlined" disabled={busy} onClick={() => void onReview(row, "reject")}>
                                Reject
                              </Button>
                            </>
                          )}
                          {row.status === "approved" && (
                            <>
                              {!row.emailSentAt && (
                                <Button size="sm" variant="outlined" disabled={busy} onClick={() => void onResend(row)}>
                                  {row.emailError ? "Resend email" : "Send email"}
                                </Button>
                              )}
                              <Button size="sm" variant="outlined" disabled={busy} onClick={() => void onReview(row, "reject")}>
                                Reject
                              </Button>
                            </>
                          )}
                          {row.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="outlined"
                              disabled={busy || blocked}
                              title={blocked ? FULL_HINT : undefined}
                              onClick={() => void onReview(row, "approve")}
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {open && (
                      <tr className="bg-void-black/40">
                        <td colSpan={4} className="px-16 py-16">
                          {row.answers.length === 0 ? (
                            <p className="text-body-sm text-ash-gray">No extra questions were asked for this event.</p>
                          ) : (
                            <dl className="grid grid-cols-1 gap-x-24 gap-y-12 md:grid-cols-2">
                              {row.answers.map((a) => (
                                <div key={a.id}>
                                  <dt className="text-caption text-steel-gray">{a.label}</dt>
                                  <dd className="whitespace-pre-wrap text-body-sm text-ghost-white">
                                    {a.value || "-"}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}
                          {row.emailError && (
                            <p className="mt-12 text-caption text-error-red">Email error: {row.emailError}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-card border border-graphite bg-carbon-card p-16">
      <p className="text-caption text-steel-gray">{label}</p>
      <p className="mt-4 text-subheading font-semibold tabular-nums text-ghost-white">{value}</p>
      {note && <p className="mt-4 text-caption text-ash-gray">{note}</p>}
    </div>
  );
}