import { useQuery } from "@tanstack/react-query";
import { fetchTestimonials } from "@/lib/api";

export function useTestimonials() {
  return useQuery({ queryKey: ["testimonials"], queryFn: fetchTestimonials });
}
