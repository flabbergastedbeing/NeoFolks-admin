import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";

// Code-split routes per the project structure spec. The loaders are kept in a
// map so the other routes can be prefetched while the browser is idle.
const routeLoaders = {
  home: () => import("@/pages/Home"),
  about: () => import("@/pages/About"),
  teams: () => import("@/pages/Teams"),
  events: () => import("@/pages/Events"),
  contact: () => import("@/pages/Contact"),
  notFound: () => import("@/pages/NotFound"),
};

const Home = lazy(routeLoaders.home);
const About = lazy(routeLoaders.about);
const Teams = lazy(routeLoaders.teams);
const Events = lazy(routeLoaders.events);
const Contact = lazy(routeLoaders.contact);
const NotFound = lazy(routeLoaders.notFound);
// The admin area is deliberately NOT in `routeLoaders`, so visitors never
// download or prefetch it.
const Admin = lazy(() => import("@/pages/Admin"));

// Jump to the top only once the old page has finished fading out. Doing it on
// the location change (as before) made the outgoing page visibly snap to the
// top while it was still on screen.
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

// Warm the other routes' chunks after first paint so page changes never hit a
// blank Suspense fallback while a chunk downloads.
function usePrefetchRoutes() {
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    if (connection?.saveData) return;

    const run = () => Object.values(routeLoaders).forEach((load) => void load());
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 1500);
    return () => window.clearTimeout(id);
  }, []);
}

function RouteFallback() {
  return <div className="min-h-screen" aria-hidden="true" />;
}

export default function App() {
  const location = useLocation();
  usePrefetchRoutes();

  // The admin area has its own header, so hide the public navbar and footer.
  const isAdminArea = location.pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-void-black">
      {!isAdminArea && <Navbar />}
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <AnimatePresence mode="wait" initial={false} onExitComplete={scrollToTop}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/about" element={<PageTransition><About /></PageTransition>} />
              <Route path="/teams" element={<PageTransition><Teams /></PageTransition>} />
              <Route path="/events" element={<PageTransition><Events /></PageTransition>} />
              <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
              <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      {!isAdminArea && <Footer />}
    </div>
  );
}
