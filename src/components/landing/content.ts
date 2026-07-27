import { PUBLIC_SITE_TITLE } from "@/lib/public-site";

export const LANDING_SITE_TITLE = PUBLIC_SITE_TITLE;

export const LANDING_HEADLINE =
  "Your barangay. Your squad. One Mobile Legends tournament.";

export const LANDING_SUPPORT =
  "Register online, upload your documents, and wait for SK committee approval—no walk-in encoding.";

export const LANDING_STEPS = [
  {
    title: "Accept the terms",
    blurb:
      "Read and accept the SK consent form before the registration fields unlock.",
  },
  {
    title: "Submit credentials",
    blurb:
      "Name, birthdate, Phase–Package–Block–Lot address, IGN, server ID, user ID, and preferred lane.",
  },
  {
    title: "Upload proofs",
    blurb:
      "School ID (front and back) plus purok endorsement—then the committee reviews your entry.",
  },
] as const;

export const LANDING_WHO = [
  {
    title: "Ages 15+",
    blurb: "You must be at least 15 years old on the tournament date.",
  },
  {
    title: "Phase 4, 9, or 10",
    blurb: "Residency is limited to these eligible phases in Barangay 176-E.",
  },
  {
    title: "Team options",
    blurb:
      "Open matching, join a listed team, or name a team you want to create.",
  },
] as const;
