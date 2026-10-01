import { useTeam } from "@/hooks/useTeam";
import { TeamShowcase } from "@/components/ui/team-showcase";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";

// Mirrors the showcase layout (photo mosaic + list) so the page doesn't jump
// when the data arrives.
function TeamSkeleton() {
  return (
    <div aria-hidden="true">
      {/* Small screens + tablets: grid of cards */}
      <div className="mx-auto grid w-full max-w-[560px] grid-cols-2 gap-x-[16px] gap-y-[28px] lg:hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-12">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="mx-auto h-[16px] w-[70%]" />
          </div>
        ))}
      </div>

      {/* lg and up: photo mosaic + list */}
      <div className="mx-auto hidden w-full max-w-5xl gap-32 lg:flex lg:gap-56">
        <Skeleton className="h-[300px] w-[396px] shrink-0 lg:h-[420px] lg:w-[513px]" />
        <div className="flex w-full flex-1 flex-col gap-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[56px] w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TeamSection() {
  const { data, isLoading, isError, refetch } = useTeam();

  return (
    <section className="section-spacing">
      <div className="container-page">
        {isLoading && <TeamSkeleton />}
        {isError && <ErrorState message="Couldn't load the team." onRetry={() => refetch()} />}
        {data && <TeamShowcase members={data} />}
      </div>
    </section>
  );
}