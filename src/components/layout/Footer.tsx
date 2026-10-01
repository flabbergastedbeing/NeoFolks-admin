import { Link } from "react-router-dom";
import { Linkedin, Instagram, Github, Mail } from "lucide-react";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Teams", to: "/teams" },
  { label: "Events", to: "/events" },
  { label: "Contact", to: "/contact" },
];

const socials = [
  { label: "LinkedIn", href: "https://linkedin.com/company/neofolks-nuv", icon: Linkedin },
  { label: "Instagram", href: "https://www.instagram.com/neofolks/", icon: Instagram },
  { label: "GitHub", href: "https://github.com/neofolks-nuv", icon: Github },
  { label: "Email", href: "mailto:neofolks@nuvstudents.edu", icon: Mail },
];

export function Footer() {
  return (
    <footer className="border-t border-graphite">
      <div className="container-page flex flex-col gap-40 py-56">
        <div className="flex flex-col gap-32 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link to="/" className="flex items-center gap-8">
              <svg viewBox="0 0 24 24" className="h-24 w-24" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="#ffffff" strokeWidth="1.6" />
                <circle cx="8.5" cy="8.5" r="1.6" fill="#9984d8" />
                <circle cx="15.5" cy="15.5" r="1.6" fill="#3fcb7f" />
                <path d="M8.5 8.5 L15.5 15.5" stroke="#ffffff" strokeWidth="1.2" />
              </svg>
              <span className="text-body font-medium text-ghost-white">NeoFolks</span>
            </Link>
            <p className="mt-12 text-body-sm text-ash-gray">
              The technology club at Navrachana University, Vadodara.
            </p>
          </div>

          <div className="flex flex-wrap gap-24">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-body-sm text-ash-gray transition-colors hover:text-ghost-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex gap-16">
            {socials.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-[36px] w-[36px] items-center justify-center rounded-button bg-ghost-white text-void-black transition-[color,background-color,transform] duration-200 hover:bg-bone-white active:scale-[0.97]"
              >
                <Icon className="h-16 w-16" />
              </a>
            ))}
          </div>
        </div>

        <p className="text-caption text-steel-gray">
          (c) 2026 NeoFolks. Navrachana University, Vadodara.
        </p>
      </div>
    </footer>
  );
}