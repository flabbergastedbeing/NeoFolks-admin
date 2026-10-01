import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";
import { backend } from "@/lib/backend";

// Events come from Supabase when it's configured. Without it the site falls
// back to the sample events in src/data/events.ts, so it still works locally.
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => (backend.configured ? backend.listEvents() : fetchEvents()),
  });
}
