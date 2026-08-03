import { LandingShell } from "@/components/landing/shell";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import {
  ABOUT_LEADERS,
  ABOUT_ORGANIZERS,
  ABOUT_OTHERS,
  ABOUT_PAGE_EYEBROW,
  ABOUT_PAGE_HEADLINE,
  ABOUT_PAGE_SUPPORT,
} from "./content";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
      {children}
    </p>
  );
}

function placeholderSrc(name: string, px: number) {
  return `https://i.pravatar.cc/${px}?u=${encodeURIComponent(name)}`;
}

function PersonPhoto({
  name,
  image,
  size = "featured",
}: {
  name: string;
  image?: string;
  size?: "featured" | "member";
}) {
  const px = size === "featured" ? 480 : 320;
  const src = image ?? placeholderSrc(name, px);

  return (
    <div className="relative aspect-square w-full overflow-hidden border border-border/50 bg-muted/40">
      <img
        src={src}
        alt={name}
        className="size-full object-cover grayscale transition-[filter,transform] duration-500 ease-out group-hover/person:scale-[1.03] group-hover/person:grayscale-0"
        loading="lazy"
      />
    </div>
  );
}

function FoilName({
  children,
  className,
  as: Tag = "p",
}: {
  children: string;
  className?: string;
  as?: "p" | "h2";
}) {
  return (
    <Tag className={className}>
      <span className="foil-text">{children}</span>
    </Tag>
  );
}

function PersonGrid({
  people,
  size = "member",
}: {
  people: readonly { name: string; image?: string }[];
  size?: "featured" | "member";
}) {
  return (
    <ul className="mt-8 grid grid-cols-1 gap-8 sm:mt-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-10">
      {people.map((person) => (
        <li key={person.name} className="group/person min-w-0">
          <div className="flex flex-col gap-4">
            <PersonPhoto
              name={person.name}
              image={person.image}
              size={size}
            />
            <FoilName className="font-serif text-lg tracking-tight text-foreground/90 sm:text-xl">
              {person.name}
            </FoilName>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Stagger({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function AboutPage() {
  return (
    <LandingShell>
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <Stagger>
          <header className="flex max-w-2xl flex-col gap-3">
            <SectionLabel>{ABOUT_PAGE_EYEBROW}</SectionLabel>
            <h1 className="text-balance font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
              {ABOUT_PAGE_HEADLINE}
            </h1>
            <p className="text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
              {ABOUT_PAGE_SUPPORT}
            </p>
          </header>
        </Stagger>

        {/* Featured organizers */}
        <Stagger delay={0.08}>
          <section className="mt-14 sm:mt-20" aria-label="Meet the organizers">
            <ul className="grid grid-cols-1 gap-10 border-t border-border/40 pt-8 sm:grid-cols-3 sm:gap-8 sm:pt-10 lg:gap-10">
              {ABOUT_ORGANIZERS.map((person, i) => (
                <li key={person.name} className="group/person min-w-0">
                  <div className="flex flex-col gap-5">
                    <PersonPhoto name={person.name} image={person.image} />
                    <div className="flex flex-col gap-2">
                      <p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.18em] tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </p>
                      <FoilName
                        as="h2"
                        className="font-serif text-xl tracking-tight sm:text-2xl"
                      >
                        {person.name}
                      </FoilName>
                      <p className="text-pretty text-muted-foreground text-sm leading-relaxed">
                        {person.role}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </Stagger>

        {/* PINTIG and SK Leaders */}
        <Stagger delay={0.16}>
          <section
            className="mt-16 border-t border-border/40 pt-12 sm:mt-24 sm:pt-16"
            aria-labelledby="pintig-leaders"
          >
            <div className="flex max-w-xl flex-col gap-3">
              <SectionLabel>Community</SectionLabel>
              <h2
                id="pintig-leaders"
                className="text-balance font-serif text-2xl tracking-tight sm:text-3xl"
              >
                PINTIG and SK Leaders
              </h2>
            </div>
            <PersonGrid people={ABOUT_LEADERS} />
          </section>
        </Stagger>

        {/* Other organizers */}
        <Stagger delay={0.24}>
          <section
            className="mt-16 border-t border-border/40 pt-12 pb-4 sm:mt-24 sm:pt-16"
            aria-labelledby="other-organizers"
          >
            <div className="flex max-w-xl flex-col gap-3">
              <SectionLabel>Supporting cast</SectionLabel>
              <h2
                id="other-organizers"
                className="text-balance font-serif text-2xl tracking-tight sm:text-3xl"
              >
                Other organizers
              </h2>
            </div>
            <PersonGrid people={ABOUT_OTHERS} />
          </section>
        </Stagger>
      </main>
    </LandingShell>
  );
}
