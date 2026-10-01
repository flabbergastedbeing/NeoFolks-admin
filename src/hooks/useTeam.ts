import { useQuery } from "@tanstack/react-query";
import { fetchTeam } from "@/lib/api";

export function useTeam() {
  return useQuery({ queryKey: ["team"], queryFn: fetchTeam });
}
