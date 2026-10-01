import { useState } from "react";
import { Wrench, Users, CalendarDays, GraduationCap, ArrowUpRight, Sparkles, Code2, Rocket, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/effect-coverflow";

interface ActivityBentoItem {
  number: string;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  highlight: string;
  gradient: string;
  accentColor: string;
  link: string;
}

const bentoActivities: ActivityBentoItem[] = [
  {
    number: "01",
    title: "Hands-on Technical Workshops",
    category: "Practical Learning",
    description:
      "Deep-dive interactive bootcamps spanning Fullstack, Generative AI, Cloud Deployments, and Systems. Step-by-step guidance from zero to shipping production apps.",
    icon: Wrench,
    tags: ["Full-Stack", "AI Models", "Cloud Architecture", "DevOps"],
    highlight: "Weekly hands-on labs with real project deliverables",
    gradient: "from-lavender-pulse/15 via-transparent to-transparent",
    accentColor: "text-lavender-pulse",
    link: "/events",
  },
  {
    number: "02",
    title: "Flagship Hackathons & Sprints",
    category: "Build & Compete",
    description:
      "High-energy 24-48 hour coding sprints where students collaborate in cross-disciplinary teams to build solutions for real industry challenges.",
    icon: CalendarDays,
    tags: ["24h Hackathons", "Prize Pools", "Industry Judges", "Mentorship"],
    highlight: "Over ₹2.5L+ won in state & national hackathons",
    gradient: "from-mint-signal/15 via-transparent to-transparent",
    accentColor: "text-mint-signal",
    link: "/events",
  },
  {
    number: "03",
    title: "Open Source Lab & Projects",
    category: "Real Codebases",
    description:
      "Collaborative student-led repositories. Learn Git workflows, pull requests, automated CI/CD pipelines, and contribute to tools used by campus clubs.",
    icon: Rocket,
    tags: ["GitHub Projects", "CI/CD", "Real Users", "Code Reviews"],
    highlight: "15+ active open-source repositories on GitHub",
    gradient: "from-blue-500/15 via-transparent to-transparent",
    accentColor: "text-blue-400",
    link: "/about",
  },
  {
    number: "04",
    title: "Peer Mentorship & Career Circles",
    category: "Community Network",
    description:
      "Direct guidance from senior students and alumni working at top tech firms. Resume teardowns, mock tech interviews, and portfolio curation.",
    icon: GraduationCap,
    tags: ["1-on-1 Guidance", "Mock Interviews", "Resume Reviews", "Referrals"],
    highlight: "Connected alumni network across top product startups",
    gradient: "from-purple-500/15 via-transparent to-transparent",
    accentColor: "text-purple-400",
    link: "/teams",
  },
];

// Swiper's loop mode needs more slides than are visible at once. With only 4 cards
// it silently switches loop (and autoplay) off, so the set is rendered twice.
const loopSlides = [...bentoActivities, ...bentoActivities];

const carouselCss = `
  .activities-swiper {
    width: 100%;
    padding: 12px 0 8px !important;
  }
  .activities-swiper .swiper-slide { height: auto; }
`;

export function ModernActivitiesGrid() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="activities-carousel w-full">
      <style>{carouselCss}</style>
      <Swiper
        modules={[EffectCoverflow, Autoplay]}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        loop
        autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        slideToClickedSlide
        spaceBetween={0}
        coverflowEffect={{
          rotate: 40,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        onSwiper={(sw) => setSwiper(sw)}
        onRealIndexChange={(sw) => setActiveIdx(sw.realIndex % bentoActivities.length)}
        className="activities-swiper"
      >
      {loopSlides.map((item, idx) => {
        const Icon = item.icon;
        const isHovered = hoveredIdx === idx;

        return (
          <SwiperSlide key={`${item.number}-${idx}`} className="!h-auto !w-[min(86vw,440px)]">
          <div
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-card border border-graphite/60 bg-carbon-card/90 p-28 sm:p-32 transition-all duration-300 hover:-translate-y-1 hover:border-lavender-pulse/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
          >
            {/* Ambient Corner Gradient */}
            <div
              className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${item.gradient} blur-2xl transition-opacity duration-500 ${
                isHovered ? "opacity-100" : "opacity-40"
              }`}
              aria-hidden="true"
            />

            {/* Top header strip */}
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-[10px]">
                <span className="font-mono text-caption font-semibold text-steel-gray">
                  {item.number}
                </span>
                <span className="h-4 w-4 rounded-full bg-graphite" />
                <span className={`text-[12px] font-medium tracking-wide uppercase ${item.accentColor}`}>
                  {item.category}
                </span>
              </div>

              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-button border border-graphite/60 bg-white/[0.03] transition-all duration-300 group-hover:border-ghost-white group-hover:bg-white/[0.08]">
                <Icon className="h-16 w-16 text-ghost-white" />
              </div>
            </div>

            {/* Main content body */}
            <div className="relative mt-24 flex-1">
              <h3 className="text-[22px] font-medium leading-snug text-ghost-white transition-colors group-hover:text-white">
                {item.title}
              </h3>
              <p className="mt-12 text-body-sm text-ash-gray leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Tags and Highlight Footer */}
            <div className="relative mt-28 border-t border-graphite/40 pt-20">
              <div className="flex flex-wrap items-center gap-8 mb-16">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-badge border border-graphite/60 bg-void-black/60 px-10 py-4 text-[11px] font-medium text-ash-gray transition-colors group-hover:border-graphite group-hover:text-ghost-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-caption">
                <span className="text-steel-gray flex items-center gap-[6px]">
                  <Sparkles className="h-[10px] w-[10px] text-lavender-pulse" />
                  {item.highlight}
                </span>

                <Link
                  to={item.link}
                  className="inline-flex items-center gap-4 font-medium text-ghost-white transition-transform duration-200 group-hover:translate-x-1"
                >
                  <span>Learn more</span>
                  <ArrowUpRight className="h-12 w-12 text-lavender-pulse" />
                </Link>
              </div>
            </div>
          </div>
          </SwiperSlide>
        );
      })}
      </Swiper>

      <div className="mt-8 flex items-center justify-center gap-[10px]" role="tablist" aria-label="Activities">
        {bentoActivities.map((item, i) => (
          <button
            key={item.number}
            type="button"
            role="tab"
            aria-selected={activeIdx === i}
            aria-label={`Show ${item.title}`}
            onClick={() => swiper?.slideToLoop(i)}
            className={`h-[8px] rounded-full transition-all duration-300 ${
              activeIdx === i ? "w-[24px] bg-lavender-pulse" : "w-[8px] bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}