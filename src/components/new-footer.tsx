import { PublicGovLogos } from "@/components/public/public-gov-logos";
import { Link } from "@tanstack/react-router";

const NewFooter = () => {
	const year = new Date().getFullYear();

	return (
		<footer className="relative z-10 mt-auto border-t border-border/50 bg-background">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
				<div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex flex-col gap-4">
						<PublicGovLogos
							align="start"
							sizeClassName="size-11 sm:size-12"
						/>
						<div className="flex flex-col gap-1">
							<p className="font-serif text-lg tracking-tight text-foreground">
								SK 176‑E
							</p>
							<p className="max-w-xs text-sm text-muted-foreground">
								© {year} Barangay 176E SK MLBB Tournament Tracker
							</p>
						</div>
					</div>

					<nav
						aria-label="Footer"
						className="flex flex-col gap-3 font-mono text-[0.7rem] uppercase tracking-[0.16em] sm:items-end"
					>
						<Link
							to="/tournaments"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							Tournaments
						</Link>
						<Link
							to="/about"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							About
						</Link>
						<Link
							to="/register"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							Register
						</Link>
						<Link
							to="/verify"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							Verify
						</Link>
						<a
							href="https://www.geraldchavez.xyz"
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground transition-colors hover:text-primary"
						>
							Gerald Chavez
						</a>
						<Link
							to="/app/auth/login"
							className="text-muted-foreground/50 transition-colors hover:text-muted-foreground"
						>
							Admin
						</Link>
					</nav>
				</div>
			</div>
		</footer>
	);
};

export default NewFooter;
