import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import { FaBehance, FaGithub, FaInstagram, FaLinkedinIn, FaTwitter } from "react-icons/fa";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";
import { EASE_OUT, stagger } from "@/lib/motion";
import { PillBadge } from "@/components/common/PillBadge";
import type { TeamMember, TeamSocials } from "@/types";

export type { TeamMember } from "@/types";

/*
  Team showcase — layout: a staggered three-column photo grid on the left and a
  name list on the right, linked by a shared hover state (hover a photo and its
  row lights up, and vice versa).

  Style follows the site's Design.md ("Basedash") tokens: Carbon Card surfaces,
  graphite borders, 16px card radius, no shadows, lavender-pulse as the only
  accent, serif display type for monograms.

  NOTE: tile sizes use explicit pixel values on purpose. tailwind.config.ts
  overrides the spacing scale (e.g. `4` = 4px, no `64` key), so numeric size
  utilities like `w-64` don't behave like stock Tailwind here.
*/

// Same purple glow as ActivityCard / CtaBand so the tiles read as one family.
const TILE_GLOW =
  "radial-gradient(ellipse at 50% 0%, rgba(163,102,255,0.24), rgba(123,78,245,0.1) 45%, transparent 75%)";

const SOCIALS: ReadonlyArray<{ key: keyof TeamSocials; label: string; Icon: IconType }> = [
  { key: "linkedin", label: "LinkedIn", Icon: FaLinkedinIn },
  { key: "github", label: "GitHub", Icon: FaGithub },
  { key: "twitter", label: "X (Twitter)", Icon: FaTwitter },
  { key: "instagram", label: "Instagram", Icon: FaInstagram },
  { key: "behance", label: "Behance", Icon: FaBehance },
];

// Column offsets/sizes create the staggered "mosaic" from the reference layout.
const COLUMNS = [
  {
    offset: "",
    tile: "h-[92px] w-[80px] sm:h-[132px] sm:w-[120px] lg:h-[165px] lg:w-[155px]",
  },
  {
    offset: "mt-[32px] sm:mt-[48px] lg:mt-[68px]",
    tile: "h-[100px] w-[88px] sm:h-[144px] sm:w-[132px] lg:h-[182px] lg:w-[172px]",
  },
  {
    offset: "mt-[14px] sm:mt-[22px] lg:mt-[32px]",
    tile: "h-[96px] w-[84px] sm:h-[138px] sm:w-[126px] lg:h-[172px] lg:w-[162px]",
  },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function pad(index: number) {
  return String(index + 1).padStart(2, "0");
}

interface TeamShowcaseProps {
  members: TeamMember[];
  className?: string;
}

export function TeamShowcase({ members, className }: TeamShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Keep each member's original index so numbering and stagger stay in list order.
  const indexed = members.map((member, index) => ({ member, index }));

  // Members fill the columns left to right (01→col 1, 02→col 2, 03→col 3, 04→col 1…).
  // The open-role card is the exception: it always sits at the bottom of the
  // last column, so with 8 cards, 08 lands directly under 06.
  const columnOf = ({ member, index }: (typeof indexed)[number]) =>
    member.vacant ? COLUMNS.length - 1 : index % COLUMNS.length;

  return (
    <>
      {/* Small screens + tablets (below lg): simple grid of photo cards, name + role underneath */}
      <ul
        className={cn(
          "mx-auto grid w-full max-w-[560px] grid-cols-2 gap-x-[16px] gap-y-[28px] lg:hidden",
          className,
        )}
      >
        {indexed.map(({ member, index }) => (
          <MobileCard key={member.id} member={member} index={index} />
        ))}
      </ul>

      {/* lg and up: staggered photo grid on the left, name list on the right */}
      <div
        className={cn(
          "mx-auto hidden w-full max-w-5xl items-start gap-32 lg:flex lg:gap-56",
          className,
        )}
      >
      {/* Left: staggered photo grid */}
      <div className="mx-0 flex shrink-0 select-none gap-8 lg:gap-12">
        {COLUMNS.map((column, columnIndex) => (
          <div key={columnIndex} className={cn("flex flex-col gap-8 lg:gap-12", column.offset)}>
            {indexed
              .filter((entry) => columnOf(entry) === columnIndex)
              .map(({ member, index }) => (
                <PhotoCard
                  key={member.id}
                  member={member}
                  index={index}
                  className={column.tile}
                  hoveredId={hoveredId}
                  onHover={setHoveredId}
                />
              ))}
          </div>
        ))}
      </div>

      {/* Right: member list */}
      <ul className="flex w-full flex-1 flex-col sm:grid sm:grid-cols-2 sm:gap-x-32 md:flex md:flex-col md:gap-x-0">
        {indexed.map(({ member, index }) => (
          <MemberRow
            key={member.id}
            member={member}
            index={index}
            hoveredId={hoveredId}
            onHover={setHoveredId}
          />
        ))}
      </ul>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   Photo card
───────────────────────────────────────── */

interface CardProps {
  member: TeamMember;
  index: number;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

function PhotoCard({
  member,
  index,
  className,
  hoveredId,
  onHover,
}: CardProps & { className: string }) {
  const isActive = hoveredId === member.id;
  const isDimmed = hoveredId !== null && !isActive;

  const surface = cn(
    "relative block h-full w-full overflow-hidden rounded-card border transition-[border-color,opacity,transform] duration-300",
    member.vacant ? "border-dashed bg-transparent" : "bg-carbon-card",
    isActive
      ? "-translate-y-[4px] border-lavender-pulse/60"
      : member.vacant
        ? "border-steel-gray/50"
        : "border-graphite",
    isDimmed && "opacity-40",
  );

  const number = (
    <span className="absolute left-8 top-8 z-10 text-caption tabular-nums text-steel-gray sm:left-12 sm:top-12">
      {pad(index)}
    </span>
  );

  return (
    // Outer element owns the entrance animation; the inner one owns hover/dim
    // styling, so the two never fight over `opacity`.
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: stagger(index) }}
      className={className}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
    >
      {member.vacant ? (
        <Link
          to="/contact"
          aria-label={`${member.role} is open — get in touch to apply`}
          className={cn(surface, "flex flex-col items-center justify-center gap-8")}
          onFocus={() => onHover(member.id)}
          onBlur={() => onHover(null)}
        >
          {number}
          <span
            className={cn(
              "flex h-32 w-32 items-center justify-center rounded-full border bg-white/5 transition-colors duration-300 sm:h-40 sm:w-40",
              isActive ? "border-lavender-pulse/60" : "border-graphite",
            )}
            aria-hidden="true"
          >
            <Plus className="h-16 w-16 text-ghost-white sm:h-20 sm:w-20" strokeWidth={1.75} />
          </span>
          <span className="hidden text-caption text-ash-gray sm:block">Open role</span>
        </Link>
      ) : (
        <div className={surface}>
          {member.image ? (
            <>
              <img
                src={member.image}
                alt={member.name}
                loading="lazy"
                decoding="async"
                draggable={false}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition duration-500",
                  isActive ? "scale-105 grayscale-0" : "grayscale",
                )}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void-black/60 via-transparent to-transparent"
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-50",
                )}
                style={{ background: TILE_GLOW }}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "font-alpha-lyrae absolute inset-0 flex items-center justify-center text-heading-sm transition-colors duration-300 sm:text-heading",
                  isActive ? "text-ghost-white" : "text-ash-gray",
                )}
                aria-hidden="true"
              >
                {initials(member.name)}
              </span>
            </>
          )}
          {number}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Member row
───────────────────────────────────────── */

function MemberRow({ member, index, hoveredId, onHover }: CardProps) {
  const isActive = hoveredId === member.id;
  const isDimmed = hoveredId !== null && !isActive;

  const links = SOCIALS.filter(({ key }) => member.social?.[key]);

  return (
    <motion.li
      initial={{ opacity: 0, x: 12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: stagger(index) }}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(member.id)}
      onBlur={() => onHover(null)}
    >
      <div
        className={cn(
          "flex items-center gap-16 border-b border-graphite/40 py-16 transition-opacity duration-300",
          isDimmed && "opacity-40",
        )}
      >
        <span
          className={cn(
            "w-24 shrink-0 text-caption tabular-nums transition-colors duration-300",
            isActive ? "text-lavender-pulse" : "text-steel-gray",
          )}
        >
          {pad(index)}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-body font-semibold",
              member.vacant ? "text-ash-gray" : "text-ghost-white",
            )}
          >
            {member.name}
          </p>
          <p className="text-body-sm text-ash-gray">{member.role}</p>
        </div>

        {member.vacant ? (
          <div className="flex shrink-0 items-center gap-12">
            <PillBadge className="hidden xs:inline-flex">Open</PillBadge>
            <Link
              to="/contact"
              className="inline-flex items-center gap-4 text-body-sm font-medium text-ghost-white underline-offset-4 hover:underline"
            >
              Apply
              <ArrowUpRight className="h-16 w-16" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          links.length > 0 && (
            <div className="flex shrink-0 items-center gap-12">
              {links.map(({ key, label, Icon }) => (
                <a
                  key={key}
                  href={member.social?.[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on ${label}`}
                  className="text-steel-gray transition-colors hover:text-ghost-white"
                >
                  <Icon className="h-16 w-16" />
                </a>
              ))}
            </div>
          )
        )}
      </div>
    </motion.li>
  );
}

/* ─────────────────────────────────────────
   Mobile card (below md): image tile, name + role underneath
───────────────────────────────────────── */

function MobileCard({ member, index }: { member: TeamMember; index: number }) {
  const links = SOCIALS.filter(({ key }) => member.social?.[key]);

  const tile = member.vacant ? (
    <Link
      to="/contact"
      aria-label={`${member.role} is open — get in touch to apply`}
      className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-8 rounded-card border border-dashed border-steel-gray/50 transition-colors duration-300 hover:border-lavender-pulse/60"
    >
      <span
        className="flex h-40 w-40 items-center justify-center rounded-full border border-graphite bg-white/5"
        aria-hidden="true"
      >
        <Plus className="h-20 w-20 text-ghost-white" strokeWidth={1.75} />
      </span>
      <span className="text-caption text-ash-gray">Open role</span>
    </Link>
  ) : (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card border border-graphite bg-carbon-card">
      {member.image ? (
        <img
          src={member.image}
          alt={member.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{ background: TILE_GLOW }}
            aria-hidden="true"
          />
          <span
            className="font-alpha-lyrae absolute inset-0 flex items-center justify-center text-heading text-ghost-white"
            aria-hidden="true"
          >
            {initials(member.name)}
          </span>
        </>
      )}
    </div>
  );

  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: stagger(index % 2) }}
      className="flex min-w-0 flex-col"
    >
      {tile}
      <div className="mt-12 min-w-0 text-center">
        <p
          className={cn(
            "truncate text-body font-semibold",
            member.vacant ? "text-ash-gray" : "text-ghost-white",
          )}
        >
          {member.name}
        </p>
        <p className="text-body-sm text-ash-gray">{member.role}</p>
        {links.length > 0 && !member.vacant && (
          <div className="mt-8 flex items-center justify-center gap-12">
            {links.map(({ key, label, Icon }) => (
              <a
                key={key}
                href={member.social?.[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on ${label}`}
                className="text-steel-gray transition-colors hover:text-ghost-white"
              >
                <Icon className="h-16 w-16" />
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.li>
  );
}

export default TeamShowcase;