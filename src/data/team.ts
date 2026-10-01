// TODO: replace with real data.
//  - `image`: add a portrait per member (URL, or a file in /public/team/, e.g.
//    "/team/vansh-shah.jpg"). Without one the card shows a monogram tile.
//  - `social`: add links per member; icons only render for links that exist.
import type { TeamMember } from "@/types";

export const teamMembers: TeamMember[] = [
  { id: "vansh-shah", name: "Vansh Shah", role: "Community Lead" },
  { id: "durva-desai", name: "Durva Desai", role: "Content Lead" },
  { id: "charls-gandhi", name: "Charls Gandhi", role: "Tech Lead" },
  { id: "aditi-atodaria", name: "Aditi Atodaria", role: "Tech Lead" },
  { id: "mann-shah", name: "Mann Shah", role: "Social Media Lead" },
  { id: "priyansh-shah", name: "Priyansh Shah", role: "Graphics Design Lead" },
  { id: "heeral-nirkhe", name: "Heeral Nirkhe", role: "Marketing & Outreach Lead" },
  // Unfilled role — shown as an "open position" card linking to /contact.
  { id: "event-operations-lead", name: "Open position", role: "Event Operations Lead", vacant: true },
];