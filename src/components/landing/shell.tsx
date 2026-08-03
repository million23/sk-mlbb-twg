import { PublicThemeToggle } from "@/components/public/public-theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { LANDING_SITE_TITLE } from "./content";
import NewFooter from "@/components/new-footer";

type LandingShellProps = {
	children: ReactNode;
	/** Overlay nav on hero (uses theme foreground tokens) */
	transparentNav?: boolean;
};

const navLinkClass = cn(
	buttonVariants({ variant: "ghost", size: "sm" }),
	"justify-start px-3",
);

export function LandingShell({
	children,
	transparentNav = false,
}: LandingShellProps) {
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<div className="flex min-h-svh flex-col bg-background">
			<header
				className={cn(
					"relative z-20",
					transparentNav
						? "absolute inset-x-0 top-0 border-transparent bg-transparent"
						: "border-b border-border/70 bg-background/80 backdrop-blur-md",
				)}
			>
				<div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-8 sm:py-4 lg:px-12">
					<Link
						to="/"
						className="min-w-0 truncate font-semibold tracking-tight text-sm text-foreground sm:text-base"
						onClick={() => setMenuOpen(false)}
					>
						<span className="sm:hidden">SK 176‑E</span>
						<span className="hidden sm:inline">{LANDING_SITE_TITLE}</span>
					</Link>

					{/* Desktop nav */}
					<nav
						className="hidden items-center gap-2 md:flex"
						aria-label="Primary"
					>
						<Link
							to="/tournaments"
							className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
						>
							Tournaments
						</Link>
						<Link
							to="/verify"
							className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
						>
							Verify registration
						</Link>
						<Button size="sm" render={<Link to="/register" />}>
							Register
						</Button>
						<PublicThemeToggle />
					</nav>

					{/* Mobile actions */}
					<div className="flex shrink-0 items-center gap-1.5 md:hidden">
						<PublicThemeToggle />
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							className="border-border/80 bg-background/80 backdrop-blur-sm"
							aria-label="Open menu"
							onClick={() => setMenuOpen(true)}
						>
							<Menu className="size-4" aria-hidden />
						</Button>
					</div>
				</div>
			</header>

			<Drawer
				open={menuOpen}
				onOpenChange={setMenuOpen}
				swipeDirection="up"
				showSwipeHandle
			>
				<DrawerContent className="flex w-full max-w-none flex-col overflow-hidden rounded-none rounded-b-2xl border-x-0 border-t-0 pt-[env(safe-area-inset-top)] [--drawer-content-height:auto] [--drawer-inset:0px]">
					<DrawerHeader className="flex flex-row items-start justify-between gap-3 px-4 pt-3 pb-2 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
						<div className="min-w-0 flex flex-col gap-0.5">
							<DrawerTitle className="truncate font-semibold tracking-tight">
								SK 176‑E
							</DrawerTitle>
							<DrawerDescription className="text-left">
								Tournament menu
							</DrawerDescription>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label="Close menu"
							onClick={() => setMenuOpen(false)}
						>
							<X className="size-4" aria-hidden />
						</Button>
					</DrawerHeader>

					<nav
						className="flex flex-col gap-1 px-3 pb-3"
						aria-label="Mobile primary"
					>
						<Link
							to="/tournaments"
							className={navLinkClass}
							onClick={() => setMenuOpen(false)}
						>
							Tournaments
						</Link>
						<Link
							to="/verify"
							className={navLinkClass}
							onClick={() => setMenuOpen(false)}
						>
							Verify registration
						</Link>
						<div className="border-t border-border/70 px-1 pt-3 pb-3">
							<Button
								className="w-full"
								render={
									<Link to="/register" onClick={() => setMenuOpen(false)} />
								}
							>
								Register
							</Button>
						</div>
					</nav>
				</DrawerContent>
			</Drawer>

			<div className="flex flex-1 flex-col">{children}</div>

			<NewFooter />
		</div>
	);
}
