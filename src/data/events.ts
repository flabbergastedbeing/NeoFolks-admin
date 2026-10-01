// TODO: replace with real data — titles, dates, descriptions, details and
// highlights are placeholders. To use real photos in an event popup, add
// `photos: ["/images/events/e1-1.jpg", ...]` to that event.
import type { ClubEvent } from "@/types";

export const events: ClubEvent[] = [
  {
    id: "e1",
    title: "NeoFolks Winter Hackathon",
    date: "December 2026",
    year: "2026",
    category: "Competitions",
    description: "A 24-hour build sprint for teams across the university.",
    status: "upcoming",
    details:
      "A 24-hour build sprint for teams across the university. Form a team, pick a problem, and ship a working prototype before the clock runs out, with mentors on hand to help you get unstuck.",
    highlights: {
      title: "What to expect",
      items: [
        "24 hours of hands-on building in teams",
        "Mentors from the NeoFolks community on hand",
        "Live demos and feedback at the end",
        "Open to every student, no experience required",
      ],
    },
  },
  {
    id: "e2",
    title: "Intro to Cloud Computing",
    date: "November 2026",
    year: "2026",
    category: "Workshops",
    description: "A hands-on primer on deploying your first cloud application.",
    status: "upcoming",
    details:
      "A hands-on primer on deploying your first cloud application. You will go from an empty account to a live app, picking up the core ideas of compute, storage and networking along the way.",
    highlights: {
      title: "What you will learn",
      items: [
        "Core cloud concepts: compute, storage and networking",
        "Deploying a simple app end to end",
        "Keeping costs under control with free tiers",
        "Where to go next after your first deployment",
      ],
    },
  },
  {
    id: "e3",
    title: "AI/ML Bootcamp",
    date: "August 2026",
    year: "2026",
    category: "Workshops",
    description: "A weekend series covering the fundamentals of applied machine learning.",
    status: "past",
    details:
      "A weekend series covering the fundamentals of applied machine learning, from preparing data to training and evaluating your first models.",
    highlights: {
      title: "What we covered",
      items: [
        "Cleaning and exploring real datasets",
        "Training and evaluating a first model",
        "Common pitfalls such as overfitting and data leakage",
        "How machine learning fits into real projects",
      ],
    },
  },
  {
    id: "e4",
    title: "Industry Expert Talk: Careers in Tech",
    date: "March 2026",
    year: "2026",
    category: "Seminars",
    description: "An evening session with alumni working across the tech industry.",
    status: "past",
    details:
      "An evening session with alumni working across the tech industry, sharing how they got started and what they wish they had known as students.",
    highlights: {
      title: "Topics discussed",
      items: [
        "Paths into the tech industry",
        "Skills employers look for in graduates",
        "Lessons from first jobs",
        "Open Q&A with the audience",
      ],
    },
  },
  {
    id: "e5",
    title: "NeoFolks Founding Meetup",
    date: "September 2025",
    year: "2025",
    category: "Community",
    description: "The first gathering of NeoFolks members on campus.",
    status: "past",
    details:
      "The first gathering of NeoFolks members on campus, where the club's founding members met, shared ideas and set the direction for what came next.",
    highlights: {
      title: "Highlights",
      items: [
        "Meeting the founding members",
        "Sharing ideas for what NeoFolks could become",
        "Planning the first workshops and events",
      ],
    },
  },
  {
    id: "e6",
    title: "Web Development Sprint",
    date: "November 2025",
    year: "2025",
    category: "Workshops",
    description: "A three-day sprint building full-stack web projects in teams.",
    status: "past",
    details:
      "A three-day sprint building full-stack web projects in teams, from a blank repository to a deployed application.",
    highlights: {
      title: "What we built",
      items: [
        "Full-stack projects built in small teams",
        "Collaboration with Git and pull requests",
        "Deploying the finished project",
      ],
    },
  },
];
