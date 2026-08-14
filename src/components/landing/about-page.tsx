import { LandingShell } from "@/components/landing/shell";
import { motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import {
  loadGeraldPortraitBitmap,
  paintCover,
  wipeCanvas,
} from "@/components/landing/gerald-portrait";

import { getAvatarUrl } from "@/lib/legacy/avatar";

import {
  ABOUT_LEADERS,
  ABOUT_ORGANIZERS,
  ABOUT_OTHERS,
  ABOUT_PAGE_EYEBROW,
  ABOUT_PAGE_HEADLINE,
  ABOUT_PAGE_SUPPORT,
  type AboutOrganizer,
  type AboutPerson,
} from "./content";

const GLITCH_OUT_MS = 850;
const GLITCH_LAYERS = ["r", "g", "b", "main"] as const;

function isFinePointer() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

/** Hover on desktop; tap to toggle on phone. Tap outside dismisses. */
function useCardActive() {
  const [active, setActive] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!active || isFinePointer()) return;
    const onDocPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setActive(false);
      }
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [active]);

  return {
    rootRef,
    active,
    setActive,
    onPointerEnter: () => {
      if (isFinePointer()) setActive(true);
    },
    onPointerLeave: () => {
      if (isFinePointer()) setActive(false);
    },
    onClick: () => {
      if (isFinePointer()) return;
      setActive((v) => !v);
    },
  };
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
      {children}
    </p>
  );
}

function GlitchPersonPhoto({
  name,
  image,
  active,
}: {
  name: string;
  image?: string;
  /** Paint portrait while true; wipe canvases when false. */
  active: boolean;
}) {
  const src = image ?? getAvatarUrl(name);
  const layerRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!active) {
      for (const canvas of layerRefs.current) {
        if (canvas) wipeCanvas(canvas);
      }
      return;
    }

    void (async () => {
      const bmp = await loadGeraldPortraitBitmap();
      if (cancelled) return;
      for (const canvas of layerRefs.current) {
        if (canvas) paintCover(canvas, bmp);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <div
      className="person-glitch relative aspect-square w-full overflow-hidden border border-border/50 bg-muted/40"
      onContextMenu={(e) => e.preventDefault()}
    >
      <img
        src={src}
        alt={name}
        className="person-glitch-base size-full object-cover grayscale"
        loading="lazy"
        draggable={false}
      />
      {GLITCH_LAYERS.map((layer, i) => (
        <canvas
          key={layer}
          ref={(el) => {
            layerRefs.current[i] = el;
          }}
          aria-hidden
          data-layer={layer}
          className="person-glitch-alt"
        />
      ))}
      <div className="person-glitch-noise" aria-hidden />
    </div>
  );
}

function PersonPhoto({
  name,
  image,
}: {
  name: string;
  image?: string;
}) {
  const src = image ?? getAvatarUrl(name);

  return (
    <div className="relative aspect-square w-full overflow-hidden border border-border/50 bg-muted/40">
      <img
        src={src}
        alt={name}
        className="size-full object-cover grayscale transition-[filter,transform] duration-500 ease-out group-data-[active=true]/person:scale-[1.03] group-data-[active=true]/person:grayscale-0"
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

type GlitchPhase = "idle" | "on" | "out";

function PersonCardShell({
  rootRef,
  active,
  onPointerEnter,
  onPointerLeave,
  onClick,
  className,
  children,
  glitch,
}: {
  rootRef: RefObject<HTMLLIElement | null>;
  active: boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onClick: () => void;
  className?: string;
  children: ReactNode;
  glitch?: GlitchPhase;
}) {
  return (
    <li
      ref={rootRef}
      className={
        className ? `group/person min-w-0 ${className}` : "group/person min-w-0"
      }
      data-active={active ? "true" : undefined}
      data-glitch={glitch}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      {children}
    </li>
  );
}

function OrganizerCard({
  person,
  index,
}: {
  person: AboutOrganizer;
  index: number;
}) {
  const reduceMotion = useReducedMotion();
  const {
    rootRef,
    active,
    onPointerEnter,
    onPointerLeave,
    onClick: onCardClick,
  } = useCardActive();
  const [glitch, setGlitch] = useState<GlitchPhase>("idle");
  const glitchRef = useRef<GlitchPhase>("idle");
  const outTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasGlitch = Boolean(person.glitchReveal);

  useEffect(() => {
    glitchRef.current = glitch;
  }, [glitch]);

  useEffect(() => {
    return () => {
      if (outTimer.current) clearTimeout(outTimer.current);
    };
  }, []);

  // Sync glitch phase with card active state
  useEffect(() => {
    if (!hasGlitch) return;

    if (active) {
      if (outTimer.current) clearTimeout(outTimer.current);
      setGlitch("on");
      return;
    }

    if (glitchRef.current !== "on") {
      setGlitch("idle");
      return;
    }

    if (reduceMotion) {
      setGlitch("idle");
      return;
    }

    setGlitch("out");
    if (outTimer.current) clearTimeout(outTimer.current);
    outTimer.current = setTimeout(() => setGlitch("idle"), GLITCH_OUT_MS);
  }, [active, hasGlitch, reduceMotion]);

  return (
    <PersonCardShell
      rootRef={rootRef}
      active={active}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onCardClick}
      glitch={hasGlitch ? glitch : undefined}
    >
      <div className="flex flex-col gap-5">
        {hasGlitch ? (
          <GlitchPersonPhoto
            name={person.name}
            image={person.image}
            active={glitch === "on" || glitch === "out"}
          />
        ) : (
          <PersonPhoto name={person.name} image={person.image} />
        )}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.18em] tabular-nums">
            {String(index + 1).padStart(2, "0")}
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
    </PersonCardShell>
  );
}

function GridPersonCard({
  person,
}: {
  person: AboutPerson;
}) {
  const {
    rootRef,
    active,
    onPointerEnter,
    onPointerLeave,
    onClick,
  } = useCardActive();

  return (
    <PersonCardShell
      rootRef={rootRef}
      active={active}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      <div className="flex flex-col gap-4">
        <PersonPhoto name={person.name} image={person.image} />
        <div className="flex flex-col gap-1.5">
          <FoilName className="font-serif text-lg tracking-tight text-foreground/90 sm:text-xl">
            {person.name}
          </FoilName>
          {person.role ? (
            <p className="text-pretty text-muted-foreground text-sm leading-relaxed">
              {person.role}
            </p>
          ) : null}
        </div>
      </div>
    </PersonCardShell>
  );
}

function PersonGrid({
  people,
}: {
  people: readonly AboutPerson[];
}) {
  return (
    <ul className="mt-8 grid grid-cols-1 gap-8 sm:mt-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-10">
      {people.map((person) => (
        <GridPersonCard key={person.name} person={person} />
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
                <OrganizerCard key={person.name} person={person} index={i} />
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
