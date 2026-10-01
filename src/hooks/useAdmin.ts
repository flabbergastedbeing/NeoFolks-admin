import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  backend,
  type AdminSessionState,
  type EmailResult,
  type EventInput,
  type ReviewAction,
} from "@/lib/backend";

export type SessionState = AdminSessionState | { status: "loading" };

// Tracks who is signed in and whether they're an admin. Re-checks whenever the
// Supabase session changes (sign in, sign out, token refresh).
export function useAdminSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      backend.auth
        .getSession()
        .then((next) => alive && setState(next))
        .catch(() => alive && setState({ status: "signedOut" }));
    };
    refresh();
    const unsubscribe = backend.auth.onChange(refresh);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  return state;
}

const keys = {
  events: ["admin", "events"] as const,
  registrations: (eventId: string) => ["admin", "registrations", eventId] as const,
};

export function useAdminEvents() {
  return useQuery({ queryKey: keys.events, queryFn: () => backend.listEvents() });
}

export function useRegistrations(eventId: string | null) {
  return useQuery({
    queryKey: keys.registrations(eventId ?? ""),
    queryFn: () => backend.admin.listRegistrations(eventId as string),
    enabled: Boolean(eventId),
    // New sign-ups show up without the admin having to refresh.
    refetchInterval: 20_000,
  });
}

// Everything that changes events or counts should refresh both the admin lists
// and the public Events page.
function useRefreshEverything() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin"] });
    void queryClient.invalidateQueries({ queryKey: ["events"] });
  };
}

export function useSaveEvent() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: (input: EventInput) => backend.admin.saveEvent(input),
    onSuccess: refresh,
  });
}

export function useDeleteEvent() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: (id: string) => backend.admin.deleteEvent(id),
    onSuccess: refresh,
  });
}

export interface ReviewOutcome {
  status: "approved" | "rejected" | "pending" | "waitlisted";
  email: EmailResult | null;
}

// Approving an entry also emails the participant. The status change is saved
// first (and is what matters), so if the email fails the entry stays approved
// and the dashboard offers a "Resend email" button.
export function useReviewRegistration() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: async (vars: { id: string; action: ReviewAction }): Promise<ReviewOutcome> => {
      const registration = await backend.admin.reviewRegistration(vars.id, vars.action);
      const email =
        vars.action === "approve" && registration.status === "approved"
          ? await backend.admin.sendApprovalEmail(vars.id)
          : null;
      return { status: registration.status, email };
    },
    onSettled: refresh,
  });
}

export function useSendApprovalEmail() {
  const refresh = useRefreshEverything();
  return useMutation({
    mutationFn: (id: string) => backend.admin.sendApprovalEmail(id),
    onSettled: refresh,
  });
}
