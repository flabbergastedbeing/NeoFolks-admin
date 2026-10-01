# NeoFolks

The site for **NeoFolks**, the technology club at Navrachana University (NUV), Vadodara. Built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, React Three Fiber, TanStack Query, and React Hook Form + Zod, following the "Basedash" dark design system (see the original build prompt's embedded `Design.md`).

## Setup

```bash
npm i
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).

Other scripts:

```bash
npm run build      # type-check (tsc -b) + production build to dist/
npm run preview    # preview the production build locally
npm run lint       # eslint
```

## shadcn/ui components

This project hand-rolled restyled versions of the shadcn primitives it needed (`Button`, `Input`, `Textarea`, `Label`, `Select`, `Sheet`, `Tabs`, `Skeleton`) directly in `src/components/ui`, built on the same Radix primitives shadcn uses, so no CLI run is required to get started. If you later want to pull in additional shadcn components or regenerate one of these from the official templates, the project already has a `components.json`, so the standard CLI works:

```bash
npx shadcn@latest init      # already configured via components.json — safe to skip
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
# ...etc, for any component not already in src/components/ui
```

After adding a component, re-apply the design tokens (Carbon Card background, 16px card / 6px button / 6px input radii, graphite borders, no box-shadows) so it matches the rest of the system — the existing files in `src/components/ui` are good references.

## Swapping in the real "Alpha Lyrae" and "Iowan Old Style" fonts

The real fonts referenced in `Design.md` aren't publicly available, so the build currently substitutes:

- **Alpha Lyrae** (display serif, 48px headings) → **Cormorant Garamond**
- **Iowan Old Style** (testimonial quotes, 24px) → **Source Serif 4**

Both are wired through CSS variables so swapping them later is a one-line change per font:

1. Host or link the real font files (e.g. via `@font-face` in `src/index.css` or a `<link>` in `index.html`).
2. Update the two variable declarations in `src/index.css`:
   ```css
   :root {
     --font-alpha-lyrae: "Alpha Lyrae", "EB Garamond", "PT Serif", serif;
     --font-iowan-old-style: "Iowan Old Style", Lora, Palatino, serif;
   }
   ```
3. Remove the now-unnecessary Google Fonts `<link>` for Cormorant Garamond / Source Serif 4 in `index.html` if you no longer need the fallback loaded.

Nothing else needs to change — every heading and testimonial quote already reads from `--font-alpha-lyrae` / `--font-iowan-old-style` via the `font-alpha-lyrae` and `font-iowan-old-style` Tailwind utilities.

## Replacing mock data with a real API

All placeholder content (team members, events, testimonials, metrics, contact channels) lives in `src/data/*.ts`, each flagged with `// TODO: replace with real data`. `src/lib/api.ts` is the single seam between that data and the rest of the app — every function there (`fetchTeam`, `fetchEvents`, `fetchTestimonials`, `fetchActivities`, `fetchCoreValues`, `submitContactForm`) currently just resolves the static data after an artificial delay.

To connect a real backend:

1. Replace the body of each `fetch*` function in `src/lib/api.ts` with a real network call (e.g. `fetch("/api/events").then(r => r.json())`), keeping the same return shape (the types in `src/types/index.ts`).
2. Replace `submitContactForm` with a real `POST` to your form endpoint. It's already called through a TanStack Query `useMutation` in `src/hooks/useContactMutation.ts`, so loading/error/success states in `ContactForm.tsx` need no changes.
3. Delete the corresponding placeholder arrays in `src/data/*.ts` once they're no longer imported as fallbacks, or keep them as local dev fixtures.
4. Every consumer already goes through TanStack Query hooks (`useTeam`, `useEvents`, `useTestimonials`, `useActivities`), so skeleton and error states keep working unchanged.

## Deploying to Vercel

1. Push this project to a Git repository.
2. In Vercel, "Add New Project" → import the repository. Framework preset: **Vite**.
3. Build command: `npm run build`. Output directory: `dist`.
4. `vercel.json` already includes the SPA rewrite (`"/(.*)" → "/index.html"`) so all client-side routes (`/about`, `/teams`, `/events`, `/contact`) work on refresh and direct navigation.
5. Deploy. No environment variables are required until you connect a real API (see above).

## Project structure

```
src/
  components/
    ui/          restyled shadcn-style primitives
    layout/      Navbar, Footer, PageTransition, ScrollToTop
    sections/    page sections (Hero, ActivitiesSection, ContactForm, ...)
    three/       HeroScene / AccentScene (lazy-loaded R3F) + WebGL detection
    common/      SectionHeader, PillBadge, MetricCard, TestimonialCard, TeamCard, EventCard, ErrorState
  pages/         Home, About, Teams, Events, Contact, NotFound
  hooks/         TanStack Query hooks + useReducedMotion + useDocumentMeta
  lib/           api.ts, utils.ts, schemas.ts (Zod), seo.ts
  data/          placeholder content, all flagged // TODO
  types/         shared TypeScript interfaces
```

## Notes on the 3D scenes

`HeroScene` (Home) and `AccentScene` (About → Mission section) are React Three Fiber scenes, lazy-loaded via `React.lazy`/`Suspense` so the Three.js bundle never ships to people who don't render them. Both:

- fall back to a static CSS gradient when `prefers-reduced-motion` is set or WebGL isn't available,
- only mount (and therefore only render) while their container is on-screen, via `IntersectionObserver`,
- cap `dpr` at `[1, 1.75]`,
- let React Three Fiber own geometry/material disposal by unmounting the `<Canvas>` rather than manually managing a render loop.
