import {
  Atom,
  BarChart3,
  Braces,
  BrainCircuit,
  Cloud,
  Palette,
  Server,
  ShieldCheck,
  Terminal,
  Workflow,
} from "lucide-react";
import type { TechNode } from "@/types";

// "Technologies We Explore" orbit. Order matters: related technologies sit next
// to each other around the ring, so each cluster reads as a group while it
// rotates (web → data/AI → infrastructure).
export const orbitalTech: TechNode[] = [
  {
    id: 1,
    title: "React",
    category: "Frontend",
    content: "Component-driven UI library for building fast, interactive web apps.",
    icon: Atom,
    relatedIds: [2, 3, 4],
  },
  {
    id: 2,
    title: "TypeScript",
    category: "Language",
    content: "Typed JavaScript that keeps larger codebases safe to change.",
    icon: Braces,
    relatedIds: [1, 3],
  },
  {
    id: 3,
    title: "Node.js",
    category: "Backend",
    content: "JavaScript on the server for APIs and real-time services.",
    icon: Server,
    relatedIds: [1, 2],
  },
  {
    id: 4,
    title: "UI/UX",
    category: "Design",
    content: "Research and interface design that make products easy to use.",
    icon: Palette,
    relatedIds: [1],
  },
  {
    id: 5,
    title: "Python",
    category: "Language",
    content: "Readable, versatile language behind most data and AI work.",
    icon: Terminal,
    relatedIds: [6, 7],
  },
  {
    id: 6,
    title: "AI/ML",
    category: "Intelligence",
    content: "Models that learn from data, from simple classifiers to language models.",
    icon: BrainCircuit,
    relatedIds: [5, 7],
  },
  {
    id: 7,
    title: "Data Science",
    category: "Analytics",
    content: "Turning raw data into insight with statistics and visualisation.",
    icon: BarChart3,
    relatedIds: [5, 6],
  },
  {
    id: 8,
    title: "Cloud",
    category: "Infrastructure",
    content: "On-demand compute, storage and services without owning servers.",
    icon: Cloud,
    relatedIds: [9, 10],
  },
  {
    id: 9,
    title: "DevOps",
    category: "Delivery",
    content: "CI/CD, containers and automation to ship software reliably.",
    icon: Workflow,
    relatedIds: [8, 10],
  },
  {
    id: 10,
    title: "Cybersecurity",
    category: "Security",
    content: "Protecting systems and data through secure code and threat modelling.",
    icon: ShieldCheck,
    relatedIds: [8, 9],
  },
];