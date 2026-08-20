import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Play } from "lucide-react";
import { useState } from "react";

import {
	LANDING_TUTORIAL_BLURB,
	LANDING_TUTORIAL_CTA,
	LANDING_TUTORIAL_EYEBROW,
	LANDING_TUTORIAL_SRC,
	LANDING_TUTORIAL_TITLE,
} from "./content";

export function LandingTutorial() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button
				type="button"
				variant="ghost"
				className="h-auto gap-3 rounded-2xl px-3 py-2 text-left hover:bg-foreground/5"
				onClick={() => setOpen(true)}
			>
				<span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/20 bg-background/40 backdrop-blur-sm">
					<Play className="size-3.5 fill-current" />
				</span>
				<span className="flex min-w-0 flex-col items-start gap-0.5">
					<span className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
						{LANDING_TUTORIAL_EYEBROW}
					</span>
					<span className="text-sm text-foreground/80">
						{LANDING_TUTORIAL_CTA}
					</span>
				</span>
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="flex max-h-[92svh] w-[min(calc(100%-1rem),28rem)] max-w-[min(calc(100%-1rem),28rem)] flex-col gap-3 overflow-hidden p-4 sm:max-w-[min(calc(100%-2rem),32rem)] sm:p-5">
					<DialogHeader className="pr-8">
						<DialogTitle className="font-serif text-xl tracking-tight sm:text-2xl">
							{LANDING_TUTORIAL_TITLE}
						</DialogTitle>
						<DialogDescription>{LANDING_TUTORIAL_BLURB}</DialogDescription>
					</DialogHeader>
					<div className="min-h-0 overflow-hidden rounded-2xl border border-border/50 bg-black">
						{open ? (
							// No .vtt exists for this walkthrough yet.
							// biome-ignore lint/a11y/useMediaCaption: tutorial has no caption file
							<video
								src={LANDING_TUTORIAL_SRC}
								controls
								playsInline
								preload="metadata"
								className="mx-auto block h-[min(72svh,52rem)] w-auto max-w-full bg-black object-contain"
							/>
						) : null}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
