import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Autoplay, EffectCoverflow, Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css";

import { cn } from "@/lib/utils";
import { ActivityCard } from "@/components/common/ActivityCard";
import type { Activity } from "@/types";

interface InvertedPerspectiveCarouselProps {
  cards: Activity[];
  className?: string;
  showPagination?: boolean;
  showNavigation?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  spaceBetween?: number;
}

// Adapted from Skiper 49 (Carousel_003) by Skiper UI — same Swiper coverflow
// mechanic, restyled onto the site's own tokens (carbon-card/graphite/ash-gray,
// rounded-card) and swapped from an image gallery to the "What We Do" activity
// cards, since we have text content rather than photography.
// Symmetric layout: the centre card and one card on each side are fully visible;
// anything further out fades away. The fade is driven by each slide's live
// position (`progress`: 0 = centre, +/-1 = neighbours) rather than by CSS classes
// that only flip once a slide has finished moving. That makes cards fade in and
// out *as they slide*, and it keeps working while the carousel is dragged (the
// old approach left blank space next to the cards during a drag).
function fadeSlidesByPosition(swiper: SwiperType) {
  for (const slide of swiper.slides) {
    const { progress } = slide as HTMLElement & { progress: number };
    const distance = Math.abs(progress);
    // Full opacity up to one card away, then a linear fade to nothing at two.
    slide.style.opacity = String(distance <= 1 ? 1 : Math.max(0, 2 - distance));
  }
}

export const InvertedPerspectiveCarousel = ({
  cards,
  className,
  showPagination = true,
  showNavigation = true,
  loop = true,
  autoplay = true,
  spaceBetween = 0,
}: InvertedPerspectiveCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);

  // Swiper's loop mode needs more slides than "slidesPerView + looped slides"
  // to work. With only a handful of cards it silently breaks (the carousel
  // gets stuck on the last card with an uneven left/right layout), so we feed
  // it the cards twice. The pagination below tracks the *real* card index.
  const slides = loop && cards.length < 8 ? [...cards, ...cards] : cards;

  const css = `
    .activities-carousel {
      width: 100%;
      max-width: 960px;
      margin: 0 auto;
      padding-bottom: 8px !important;
    }

    .activities-carousel .swiper-slide {
      width: 280px;
      height: 260px;
      /* Swiper only animates transform on slides. Adding opacity makes the fade
         run over the same duration as the slide movement (Swiper sets that
         duration itself, and sets it to 0 while dragging so the fade tracks the
         finger exactly). */
      transition-property: transform, opacity;
    }


    .activities-carousel .swiper-button-next,
    .activities-carousel .swiper-button-prev {
      width: 40px;
      height: 40px;
    }
  `;

  return (
    <div className={cn("relative w-full", className)}>
      <style>{css}</style>

      <Swiper
        spaceBetween={spaceBetween}
        autoplay={autoplay ? { delay: 3400, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
        effect="coverflow"
        speed={650}
        grabCursor
        slidesPerView="auto"
        centeredSlides
        loop={loop}
        coverflowEffect={{
          rotate: 40,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        onSwiper={setSwiper}
        onAfterInit={fadeSlidesByPosition}
        onSetTranslate={fadeSlidesByPosition}
        onSlideChange={(sw) => setActiveIndex(sw.realIndex % cards.length)}
        navigation={
          showNavigation
            ? { nextEl: ".activities-carousel-next", prevEl: ".activities-carousel-prev" }
            : false
        }
        className="activities-carousel"
        modules={[EffectCoverflow, Autoplay, Navigation]}
      >
        {slides.map((activity, i) => (
          <SwiperSlide key={`${activity.number}-${i}`} aria-hidden={i >= cards.length || undefined}>
            <ActivityCard activity={activity} />
          </SwiperSlide>
        ))}

        {showNavigation && (
          <>
            <div className="activities-carousel-prev absolute left-0 top-1/2 z-10 flex h-40 w-40 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-graphite bg-carbon-card transition-colors hover:border-steel-gray">
              <ChevronLeftIcon className="h-20 w-20 text-ghost-white" />
            </div>
            <div className="activities-carousel-next absolute right-0 top-1/2 z-10 flex h-40 w-40 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-graphite bg-carbon-card transition-colors hover:border-steel-gray">
              <ChevronRightIcon className="h-20 w-20 text-ghost-white" />
            </div>
          </>
        )}
      </Swiper>

      {showPagination && (
        <div className="mt-16 flex items-center justify-center gap-8">
          {cards.map((activity, i) => (
            <button
              key={activity.number}
              type="button"
              aria-label={`Go to ${activity.title}`}
              aria-current={i === activeIndex}
              onClick={() => swiper?.slideToLoop(i)}
              className={cn(
                "h-8 w-8 rounded-full transition-colors",
                i === activeIndex ? "bg-white" : "bg-[#808080]/60 hover:bg-[#808080]",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};