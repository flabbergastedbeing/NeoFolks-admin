import { useQuery } from "@tanstack/react-query";
import { fetchActivities } from "@/lib/api";

export function useActivities() {
  return useQuery({ queryKey: ["activities"], queryFn: fetchActivities });
}
