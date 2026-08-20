import { PUBLIC_SITE_TITLE } from "@/lib/public-site";

export const LANDING_SITE_TITLE = PUBLIC_SITE_TITLE;

export const LANDING_HEADLINE =
  "Sign up for the barangay Mobile Legends tournament.";

export const LANDING_SUPPORT =
  "Join as a player from Barangay 176-E. Fill out the form, send your documents, and wait for the SK committee to confirm your spot.";

export const LANDING_TUTORIAL_SRC = "/video-tutorial.mp4";
export const LANDING_TUTORIAL_EYEBROW = "Tutorial";
export const LANDING_TUTORIAL_CTA = "Watch how to register";
export const LANDING_TUTORIAL_TITLE = "How to register";
export const LANDING_TUTORIAL_BLURB =
  "Walkthrough of the form, documents, and team path.";

export const LANDING_STEPS = [
  {
    title: "Choose your team path",
    blurb:
      "Get matched with others, join a listed team, or start one with a name you pick.",
  },
  {
    title: "Agree to the rules",
    blurb:
      "Read the SK terms. Once you agree, you can continue with your registration.",
  },
  {
    title: "Share your info and documents",
    blurb:
      "Enter your credentials, then upload a valid ID or school ID and purok endorsement. The committee reviews everything after.",
  },
] as const;

export const LANDING_WHO_EYEBROW = "Who can join";
export const LANDING_WHO_HEADLINE = "Check if you’re eligible.";
export const LANDING_WHO_SUPPORT =
  "These are the basic rules before you start the form.";

export const LANDING_WHO = [
  {
    mark: "15 and above",
    title: "Age",
    blurb: "You need to be at least 15 years old on the day of the tournament.",
  },
  {
    mark: "4 / 9 / 10A / 10B",
    title: "Home phase",
    blurb: "You live in Phase 4, 9, 10A and 10B in Bagong Silang.",
  },
  {
    mark: "Solo or Squad",
    title: "Team choice",
    blurb:
      "Get matched with others, join a listed team, or start one with a name you pick.",
  },
] as const;

export const LANDING_CTA_HEADLINE = "Ready to join?";
export const LANDING_CTA_SUPPORT =
  "When a tournament is open, register in a few minutes. After you submit, you can check your status anytime.";

export const ABOUT_PAGE_EYEBROW = "The people behind it";
export const ABOUT_PAGE_HEADLINE = "Meet the organizers.";
export const ABOUT_PAGE_SUPPORT =
  "SK 176‑E, PINTIG, and volunteers who keep the barangay Mobile Legends tournament running.";

export type AboutOrganizer = {
  name: string;
  role: string;
  /** Public path under `/public` when a photo is ready. */
  image?: string;
  /**
   * Gerald-only: glitch-reveal an encoded portrait painted to canvas
   * (never exposed as an <img src>).
   */
  glitchReveal?: boolean;
};

export const ABOUT_ORGANIZERS: readonly AboutOrganizer[] = [
  {
    name: 'Rafael "Paeng" Mahinay',
    role: "176‑E SK Kagawad, Committee on Good Governance",
    image: "/gov-profiles/raf-profile.png",
  },
  {
    name: "Rogen Rabago",
    role: "176‑E SK Kagawad, Chairman, Committee on Education",
    image: "/gov-profiles/rogen-profile.png",
  },
  {
    name: "Gerald Chavez",
    role: "Software Engineer",
    image: "/gov-profiles/rald-logo.png",
    glitchReveal: true,
  },
];

export type AboutPerson = {
  name: string;
  role?: string;
  /** Public path under `/public` when a photo is ready. */
  image?: string;
  /** Extra frames; hover/tap plays them in order. */
  images?: readonly string[];
};

export const ABOUT_LEADERS: readonly AboutPerson[] = [
  { name: "Allyssa Costibolo", image: "/gov-profiles/allysa-profile.png" },
  { name: "Cholo Edusma", image: "/gov-profiles/cholo-profile.png" },
  {
    name: "Shanea Senin",
    image: "/gov-profiles/shanea-profile.png",
    images: [
      "/gov-profiles/shanea-profile.png",
      "/gov-profiles/shanea2-profile.png",
      "/gov-profiles/shanea3-profile.png",
    ],
  },
  { name: "Lawrence Dullo", image: "/gov-profiles/lawrence-profile.png" },
  { name: "Joshua Agapito" },
  { name: "Gian Dela cruz", image: "/gov-profiles/gian-profile.png" },
  { name: "Tanya Adduro", image: "/gov-profiles/tanya-profile.png" },
];

export const ABOUT_OTHERS: readonly AboutPerson[] = [
  {
    name: "Jead Jylle Vincent Empas",
    role: "SK 176‑E Kagawad, Committee on Health",
    image: "/gov-profiles/jead-profile.png",
  },
  {
    name: "Emerlita Ranido",
    role: "SK 176‑E Kagawad, Committee on Livelihood",
  },
  { name: "Arcel Zamora", image: "/gov-profiles/arcel-profile.png" },
  { name: "Jony Bulan", image: "/gov-profiles/jony-profile.png" },
  { name: "Jairo Mirafuentes" },
  { name: "Jaomine Patrick Arcilla" },
];
