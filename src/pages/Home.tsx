import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { pageMeta } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ActivitiesSection } from "@/components/sections/ActivitiesSection";
import { FocusSection } from "@/components/sections/FocusSection";
import { LogoGrid } from "@/components/sections/LogoGrid";
import { Testimonials } from "@/components/sections/Testimonials";
import { CtaBand } from "@/components/sections/CtaBand";
import GatewayFlow from "@/components/effects/GatewayFlow";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function Home() {
  useDocumentMeta(pageMeta.home);
  const reducedMotion = useReducedMotion();

  return (
    <>
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {reducedMotion ? (
            <div
              className="h-full w-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(153,132,216,0.2), transparent 65%)",
              }}
              aria-hidden="true"
            />
          ) : (
            <GatewayFlow mode="dark" focusY={0.7} className="h-full w-full" />
          )}
        </div>
        <Hero />
      </div>
      <ActivitiesSection />
      <FocusSection />
      <LogoGrid />
      <Testimonials />
      <CtaBand animateOnScroll={false} />
    </>
  );
}