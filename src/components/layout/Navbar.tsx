import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Teams", to: "/teams" },
  { label: "Events", to: "/events" },
  { label: "Contact", to: "/contact" },
];

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="#ffffff" strokeWidth="1.6" />
      <circle cx="8.5" cy="8.5" r="1.6" fill="#9984d8" />
      <circle cx="15.5" cy="15.5" r="1.6" fill="#3fcb7f" />
      <path d="M8.5 8.5 L15.5 15.5" stroke="#ffffff" strokeWidth="1.2" />
    </svg>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        // transition-colors alone doesn't animate backdrop-filter, so the blur
        // used to pop in. Name the properties explicitly.
        "fixed inset-x-0 top-0 z-40 h-[64px] border-b transition-[background-color,backdrop-filter,border-color] duration-300 ease-out",
        scrolled
          ? "border-graphite/40 bg-void-black/70 backdrop-blur-md"
          : "border-transparent bg-transparent backdrop-blur-none"
      )}
    >
      <nav className="container-page flex h-full items-center justify-between">
        <Link to="/" className="flex items-center gap-8" aria-label="NeoFolks home">
          <LogoMark className="h-24 w-24" />
          <span className="text-body font-medium text-ghost-white">NeoFolks</span>
        </Link>

        <div className="hidden items-center gap-32 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative py-8 text-body-sm text-ash-gray transition-colors duration-200 hover:text-ghost-white",
                  isActive && "text-ghost-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {/* One shared underline that slides between links instead of
                      popping in and out, so the current page is easy to track. */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-2 left-0 h-[2px] w-full bg-ghost-white"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:block">
          <Button asChild variant="filled">
            <Link to="/contact">Join NeoFolks</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="flex h-40 w-40 items-center justify-center rounded-input text-ghost-white md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-24 w-24" />
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle className="mb-32 flex items-center gap-8">
              <LogoMark className="h-24 w-24" />
              NeoFolks
            </SheetTitle>
            <div className="flex flex-col gap-24">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === "/"}
                    className={({ isActive }) =>
                      cn("text-body text-ash-gray transition-colors duration-200 hover:text-ghost-white", isActive && "text-ghost-white")
                    }
                  >
                    {link.label}
                  </NavLink>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Button asChild variant="filled" className="mt-16 w-full">
                  <Link to="/contact">Join NeoFolks</Link>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
