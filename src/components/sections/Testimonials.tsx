import { useTestimonials } from "@/hooks/useTestimonials";
import { SectionHeader } from "@/components/common/SectionHeader";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";

export function Testimonials() {
  const { data, isLoading, isError, refetch } = useTestimonials();

  const firstColumn = data?.slice(0, 3) ?? [];
  const secondColumn = data?.slice(3, 6) ?? [];
  const thirdColumn = data?.slice(6, 9) ?? [];

  return (
    <section className="section-spacing overflow-hidden">
      <div className="container-page flex flex-col gap-48">
        <SectionHeader
          eyebrow="Testimonials"
          title="What our community says"
          subhead="Checkout what others have to say about us."
          animateOnScroll={false}
        />

        {isLoading && (
          <div className="grid grid-cols-1 gap-40 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[140px] w-full" />
            ))}
          </div>
        )}

        {isError && <ErrorState message="Couldn't load testimonials." onRetry={() => refetch()} />}

        {data && (
          <div className="group flex max-h-[740px] justify-center gap-16 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
            <TestimonialsColumn testimonials={firstColumn} duration={15} />
            <TestimonialsColumn testimonials={secondColumn} duration={19} className="hidden md:block" />
            <TestimonialsColumn testimonials={thirdColumn} duration={17} className="hidden lg:block" />
          </div>
        )}
      </div>
    </section>
  );
}