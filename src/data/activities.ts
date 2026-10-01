import { CalendarDays, GraduationCap, Users, Wrench } from "lucide-react";
import type { Activity, CoreValue, MissionCard } from "@/types";

export const activities: Activity[] = [
  {
    number: "01",
    icon: Wrench,
    title: "Technical Workshops",
    description:
      "Hands-on sessions covering web development, AI/ML, cloud computing, and emerging technologies.",
  },
  {
    number: "02",
    icon: Users,
    title: "Community Building",
    description:
      "A supportive network of tech enthusiasts who learn, grow, and innovate together.",
  },
  {
    number: "03",
    icon: CalendarDays,
    title: "Tech Events",
    description:
      "Hackathons, tech talks, coding competitions, and industry expert sessions.",
  },
  {
    number: "04",
    icon: GraduationCap,
    title: "Mentorship",
    description:
      "Guidance from experienced peers and industry professionals to accelerate growth.",
  },
];

export const coreValues: CoreValue[] = [
  {
    title: "Innovation",
    description: "Pushing boundaries and exploring new technological possibilities",
  },
  {
    title: "Collaboration",
    description: "Working together to achieve greater goals and build connections",
  },
  {
    title: "Learning",
    description: "Continuous growth and knowledge sharing among all members",
  },
  {
    title: "Inclusivity",
    description: "Welcoming everyone regardless of background or experience",
  },
];

export const missionCards: MissionCard[] = [
  {
    number: "01",
    title: "Community Building",
    description:
      "Fostering an inclusive tech community where students explore, learn, and innovate together.",
    tag: "Growing Community",
  },
  {
    number: "02",
    title: "Industry Connection",
    description:
      "Bridging academic learning with real-world applications through workshops and partnerships.",
    tag: "Industry Focus",
  },
  {
    number: "03",
    title: "Technical Innovation",
    description:
      "Empowering students with cutting-edge technologies and hands-on learning experiences.",
    tag: "Tech Excellence",
  },
];

export const scopeTags: string[] = [
  "Web Development",
  "Mobile Apps",
  "Data Science",
  "AI/ML",
  "Cloud Computing",
  "Cybersecurity",
  "UI/UX Design",
  "Community Building",
  "Blockchain",
  "IoT",
  "Game Development",
  "DevOps",
];

export interface EventTypeCard {
  title: string;
  description: string;
}

export const eventTypes: EventTypeCard[] = [
  { title: "Technical Workshops", description: "Hands-on coding sessions" },
  { title: "Industry Seminars", description: "Expert talks & guidance" },
  { title: "Competitions", description: "Hackathons & contests" },
  { title: "Community Events", description: "Networking sessions" },
];
