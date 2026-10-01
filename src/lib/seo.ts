export interface PageMeta {
  title: string;
  description: string;
}

export const siteMeta = {
  siteName: "NeoFolks",
  baseTitle: "NeoFolks — Technology Club, Navrachana University",
};

export const pageMeta: Record<string, PageMeta> = {
  home: {
    title: "NeoFolks — Technology Club, Navrachana University",
    description:
      "NeoFolks is the technology club at Navrachana University, Vadodara. Learn in public. Build together.",
  },
  about: {
    title: "About — NeoFolks",
    description:
      "The premier technology club at Navrachana University, dedicated to fostering innovation, creativity, and collaboration among students passionate about technology.",
  },
  teams: {
    title: "Our Team — NeoFolks",
    description:
      "Meet the passionate leaders driving innovation and fostering community growth at NeoFolks.",
  },
  events: {
    title: "Events & Activities — NeoFolks",
    description:
      "Join us for exciting workshops, seminars, hackathons, and community events at NeoFolks.",
  },
  contact: {
    title: "Get In Touch — NeoFolks",
    description:
      "Have questions? Want to join or collaborate? We'd love to hear from you.",
  },
  notFound: {
    title: "Page Not Found — NeoFolks",
    description: "The page you're looking for doesn't exist.",
  },
};
