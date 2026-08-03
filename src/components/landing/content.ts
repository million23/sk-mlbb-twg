import { PUBLIC_SITE_TITLE } from "@/lib/public-site";

export const LANDING_SITE_TITLE = PUBLIC_SITE_TITLE;

export const LANDING_HEADLINE =
  "Sign up for the barangay Mobile Legends tournament.";

export const LANDING_SUPPORT =
  "Join as a player from Barangay 176-E. Fill out the form, send your documents, and wait for the SK committee to confirm your spot.";

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
      "Enter your credentials, then upload your school ID and purok endorsement. The committee reviews everything after.",
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
