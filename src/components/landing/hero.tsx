import { PublicGovLogos } from "@/components/public/public-gov-logos";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

import {
	LANDING_HEADLINE,
	LANDING_SITE_TITLE,
	LANDING_SUPPORT,
} from "./content";
import { LandingTutorial } from "./landing-tutorial";

const LANE_ICONS = [
	{ alt: "Experience Lane", src: "/icons/lanes/explane-icon.svg" },
	{ alt: "Jungle", src: "/icons/lanes/jungler-icon.svg" },
	{ alt: "Middle Lane", src: "/icons/lanes/midlane-icon.svg" },
	{ alt: "Gold Lane", src: "/icons/lanes/goldlane-icon.svg" },
	{ alt: "Roamer Support", src: "/icons/lanes/roamer-icon.svg" },
] as const;

function FoilLaneIcon({ alt, src }: { alt: string; src: string }) {
	return (
		<span
			className="foil lane-foil"
			style={{ "--foil-mask": `url(${src})` } as CSSProperties}
		>
			<img
				alt={alt}
				src={src}
				className="h-12 w-12 object-cover object-center invert opacity-90 dark:invert-0 dark:opacity-100"
			/>
		</span>
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
			initial={{ opacity: 0, y: 18 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.7,
				delay,
				ease: [0.22, 1, 0.36, 1],
			}}
		>
			{children}
		</motion.div>
	);
}

/**
 * Hero copy only — starfield plane lives on the parent so the
 * next section can share the same continuous background.
 */
export function LandingHero() {
	return (
		<section className="relative z-10 flex min-h-svh flex-col items-center justify-center text-foreground">
			<div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-5 py-28 text-center sm:gap-7 sm:px-8 sm:py-32">
				<Stagger>
					<PublicGovLogos align="center" sizeClassName="size-12 sm:size-14" />
				</Stagger>

				<Stagger delay={0.08}>
					<p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.28em]">
						Barangay 176‑E · SK
					</p>
				</Stagger>

				<Stagger delay={0.12}>
					<div className="flex gap-2">
						{LANE_ICONS.map((icon) => (
							<FoilLaneIcon key={icon.src} alt={icon.alt} src={icon.src} />
						))}
					</div>
				</Stagger>

				<Stagger delay={0.14}>
					<p className="text-balance font-serif text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] tracking-tight">
						{LANDING_SITE_TITLE}
					</p>
				</Stagger>

				<Stagger delay={0.22}>
					<h1 className="max-w-xl text-pretty font-heading text-base font-medium text-foreground/90 sm:text-xl">
						{LANDING_HEADLINE}
					</h1>
				</Stagger>

				<Stagger delay={0.28}>
					<p className="max-w-md text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
						{LANDING_SUPPORT}
					</p>
				</Stagger>

				<Stagger delay={0.36}>
					<div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row sm:justify-center">
						<Button
							size="lg"
							className="w-full sm:w-auto"
							render={<Link to="/register" />}
						>
							Register now
							<ArrowRight data-icon="inline-end" />
						</Button>
						<Button
							variant="outline"
							size="lg"
							className="w-full border-foreground/20 bg-background/30 backdrop-blur-sm sm:w-auto"
							render={<Link to="/tournaments" />}
						>
							View tournaments
						</Button>
					</div>
				</Stagger>

				<Stagger delay={0.44}>
					<LandingTutorial />
				</Stagger>
			</div>
		</section>
	);
}
