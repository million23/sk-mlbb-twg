/** Shared step bodies for the public registration wizard. */

import { LaneRoleIcon } from "@/components/participants/preferred-lane-icons";
import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import skConsentMarkdown from "@/content/sk-consent.md?raw";
import { useIsMobile } from "@/hooks/use-mobile";
import { LANE_ROLE_LABELS } from "@/lib/legacy/lane-role-icons";
import { sanitizePhilippineMobileInput } from "@/lib/legacy/philippine-mobile";
import {
	ELIGIBLE_PHASES,
	LANES,
	ageOnTournamentDay,
	isCreateTeamBatch,
	memberCountBounds,
	validateUploadFile,
	type Action,
	type Credentials,
	type FlowStep,
	type Lane,
	type RegistrationDraft,
	type TeamIntent,
	type Uploads,
} from "@/lib/registration/flow";
import { cn } from "@/lib/utils";
import type { PlayerRole } from "@/types/__pocketbase-types";
import { Link } from "@tanstack/react-router";
import {
	CircleCheck,
	CircleX,
	Clock3,
	House,
	Mail,
} from "lucide-react";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactNode,
	type UIEvent,
} from "react";
import ReactMarkdown from "react-markdown";

function digitsOnly(raw: string, max: number): string {
	return raw.replace(/\D/g, "").slice(0, max);
}

const PHASE_LABELS: Record<(typeof ELIGIBLE_PHASES)[number], string> = {
	"4": "Phase 4",
	"9": "Phase 9",
	"10": "Phase 10",
};

export const FLOW_STEPS: FlowStep[] = [
	"team_intent",
	"team_details",
	"consent",
	"credentials",
	"documents",
	"pending",
	"approved",
	"rejected",
];

export const STEP_LABELS: Record<FlowStep, string> = {
	closed: "Closed",
	consent: "Consent",
	team_intent: "Team",
	credentials: "Credentials",
	team_details: "Squad",
	documents: "Documents",
	pending: "Pending",
	approved: "Approved",
	rejected: "Rejected",
};

export function stepLabelFor(
	step: FlowStep,
	intent: TeamIntent | null,
): string {
	if (step === "team_details") {
		return intent === "create_team" ? "Team name" : "Team select";
	}
	return STEP_LABELS[step];
}

function PlayerChrome({ state }: { state: RegistrationDraft }) {
	if (!isCreateTeamBatch(state)) return null;
	return (
		<p className="rounded-2xl border border-border/70 bg-muted/30 px-3 py-2 font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
			Player {state.active_registrant_index + 1} of {state.member_count}
		</p>
	);
}

type Props = {
	state: RegistrationDraft;
	dispatch: (a: Action) => void;
};

function Field({
	label,
	children,
	className,
}: {
	label: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<span className="text-muted-foreground text-xs font-medium">{label}</span>
			{children}
		</div>
	);
}

export function ClosedStep({ state }: Props) {
	return (
		<div className="flex flex-col gap-4">
			<p className="text-lg font-medium">Registration is closed</p>
			<p className="text-muted-foreground text-sm">
				Registration is not open for this tournament right now. Check back when
				the committee opens the window (tournament day: {state.tournament_day}).
			</p>
			<Button type="button" variant="outline" render={<Link to="/" />}>
				Back to home
			</Button>
		</div>
	);
}

function isScrolledToBottom(el: HTMLElement, threshold = 8) {
	return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
}

export function ConsentStep({ state, dispatch }: Props) {
	const [open, setOpen] = useState(false);
	const [scrolledToEnd, setScrolledToEnd] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const isMobile = useIsMobile();

	const syncScrollEnd = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		// Content shorter than the viewport counts as fully read.
		if (el.scrollHeight <= el.clientHeight + 8) {
			setScrolledToEnd(true);
			return;
		}
		setScrolledToEnd(isScrolledToBottom(el));
	}, []);

	useEffect(() => {
		if (!open) {
			setScrolledToEnd(false);
			return;
		}
		let cancelled = false;
		const check = () => {
			if (!cancelled) syncScrollEnd();
		};
		const raf = window.requestAnimationFrame(() => {
			check();
			// Drawer/dialog layout settles a frame later.
			window.requestAnimationFrame(check);
		});
		const el = scrollRef.current;
		const ro =
			el && typeof ResizeObserver !== "undefined"
				? new ResizeObserver(check)
				: null;
		if (el && ro) ro.observe(el);
		return () => {
			cancelled = true;
			window.cancelAnimationFrame(raf);
			ro?.disconnect();
		};
	}, [open, syncScrollEnd, isMobile]);

	const onConsentScroll = (event: UIEvent<HTMLDivElement>) => {
		setScrolledToEnd(isScrolledToBottom(event.currentTarget));
	};

	const accept = () => {
		if (!scrolledToEnd) return;
		dispatch({ type: "ACCEPT_CONSENT" });
		setOpen(false);
	};

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) setScrolledToEnd(false);
	};

	const consentBody = (
		<div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-serif prose-headings:tracking-tight">
			<ReactMarkdown>{skConsentMarkdown}</ReactMarkdown>
		</div>
	);

	const consentActions = (
		<>
			<Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
				Cancel
			</Button>
			<Button type="button" onClick={accept} disabled={!scrolledToEnd}>
				I accept
			</Button>
		</>
	);

	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted-foreground text-sm leading-relaxed">
				SK Barangay 176-E Mobile Legends tournament — Terms & Agreement. You
				confirm residency in an eligible phase, age eligibility on tournament
				day, and that submitted documents are yours.
			</p>
			<ul className="list-inside list-disc text-muted-foreground text-sm">
				<li>Phases 4, 9, or 10 only</li>
				<li>Age 15+ on {state.tournament_day}</li>
				<li>One pending/approved registration per email</li>
			</ul>
			{state.consent_accepted ? (
				<p className="inline-flex items-center gap-1.5 text-sm text-success">
					<CircleCheck className="size-4 shrink-0" aria-hidden />
					Terms accepted
				</p>
			) : (
				<>
					<Button type="button" onClick={() => handleOpenChange(true)}>
						I accept the SK consent (T&A)
					</Button>
					{isMobile ? (
						<Drawer
							open={open}
							onOpenChange={handleOpenChange}
							swipeDirection="down"
							showSwipeHandle
						>
							<DrawerContent className="flex h-[92svh] max-h-[92svh] w-full max-w-none flex-col overflow-hidden rounded-none rounded-t-2xl border-x-0 border-b-0 [--drawer-inset:0px]">
								<DrawerHeader className="shrink-0 gap-1 border-b border-border/70 px-4 pt-1 pb-4 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
									<DrawerTitle className="font-serif text-xl tracking-tight">
										Terms & Agreement
									</DrawerTitle>
									<DrawerDescription className="text-left">
										Read the full consent, then accept to continue registration.
									</DrawerDescription>
								</DrawerHeader>
								<div
									ref={scrollRef}
									onScroll={onConsentScroll}
									className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
								>
									{consentBody}
								</div>
								<DrawerFooter className="shrink-0 gap-2 border-t border-border/70 bg-background px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
									{consentActions}
								</DrawerFooter>
							</DrawerContent>
						</Drawer>
					) : (
						<Dialog open={open} onOpenChange={handleOpenChange}>
							<DialogContent className="flex max-h-[min(85svh,40rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
								<DialogHeader
									data-modal-enter="from-top"
									className="shrink-0 border-b border-border/70 px-5 py-4 sm:px-6"
								>
									<DialogTitle className="font-serif text-xl tracking-tight">
										Terms & Agreement
									</DialogTitle>
									<DialogDescription>
										Read the full consent, then accept to continue registration.
									</DialogDescription>
								</DialogHeader>
								<div
									ref={scrollRef}
									data-modal-enter="fade"
									onScroll={onConsentScroll}
									className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6"
								>
									{consentBody}
								</div>
								<DialogFooter
									data-modal-enter="from-bottom"
									className="shrink-0 flex-col border-t border-border/70 px-5 py-4 sm:px-6"
								>
									{consentActions}
								</DialogFooter>
							</DialogContent>
						</Dialog>
					)}
				</>
			)}
		</div>
	);
}

export function CredentialsStep({ state, dispatch }: Props) {
	const c = state.credentials;
	const set = (patch: Partial<Credentials>) =>
		dispatch({ type: "SET_CREDENTIALS", patch });
	const age = ageOnTournamentDay(c.birthdate, state.tournament_day);
	const ageLabel = !state.tournament_day
		? "tournament date missing"
		: age == null
			? "—"
			: String(age);

	return (
		<div className="flex flex-col gap-4">
			<PlayerChrome state={state} />
			{!state.tournament_day ? (
				<p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm">
					Tournament date is missing. In PocketBase, set{" "}
					<span className="font-mono">start_at</span> on this tournament so age
					can be checked.
				</p>
			) : (
				<p className="text-muted-foreground text-xs">
					Age is checked on tournament day{" "}
					<span className="font-mono text-foreground">
						{state.tournament_day}
					</span>
					.
				</p>
			)}
			<div className="grid gap-3 sm:grid-cols-2">
				<Field label="Name">
					<Input
						value={c.name}
						onChange={(e) => set({ name: e.target.value })}
						autoComplete="name"
						placeholder="Full name"
					/>
				</Field>
				<Field label="Email">
					<Input
						type="email"
						value={c.email}
						onChange={(e) => set({ email: e.target.value })}
						autoComplete="email"
						placeholder="you@example.com"
					/>
				</Field>
				<Field label="IGN">
					<Input
						value={c.ign}
						onChange={(e) => set({ ign: e.target.value })}
						placeholder="In-game name"
					/>
				</Field>
				<Field label={`Birthdate (age on day: ${ageLabel})`}>
					<BirthdayPicker
						value={c.birthdate}
						onChange={(v) => set({ birthdate: v })}
					/>
				</Field>
				<Field label="User ID">
					<Input
						value={c.user_id}
						onChange={(e) => set({ user_id: digitsOnly(e.target.value, 16) })}
						inputMode="numeric"
						autoComplete="off"
						placeholder="123456789"
						className="tabular-nums"
					/>
				</Field>
				<Field label="Server ID">
					<Input
						value={c.server_id}
						onChange={(e) => set({ server_id: digitsOnly(e.target.value, 8) })}
						inputMode="numeric"
						autoComplete="off"
						placeholder="2001"
						className="tabular-nums"
					/>
				</Field>
				<div className="col-span-full grid grid-cols-4 gap-2 sm:gap-3">
					<Field label="Phase" className="min-w-0">
						<Select
							value={c.address_phase || null}
							onValueChange={(v) => set({ address_phase: v ?? "" })}
						>
							<SelectTrigger className="w-full px-2 sm:px-3">
								<SelectValue placeholder="Phase">
									{(value: string | null) =>
										value && value in PHASE_LABELS
											? PHASE_LABELS[value as keyof typeof PHASE_LABELS]
											: null
									}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{ELIGIBLE_PHASES.map((p) => (
										<SelectItem key={p} value={p}>
											{PHASE_LABELS[p]}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Field>
					<Field label="Package" className="min-w-0">
						<Input
							value={c.address_package}
							onChange={(e) =>
								set({ address_package: digitsOnly(e.target.value, 4) })
							}
							inputMode="numeric"
							placeholder="Pkg"
							className="tabular-nums px-2 sm:px-3"
						/>
					</Field>
					<Field label="Block" className="min-w-0">
						<Input
							value={c.address_block}
							onChange={(e) =>
								set({ address_block: digitsOnly(e.target.value, 4) })
							}
							inputMode="numeric"
							placeholder="Blk"
							className="tabular-nums px-2 sm:px-3"
						/>
					</Field>
					<Field label="Lot" className="min-w-0">
						<Input
							value={c.address_lot}
							onChange={(e) =>
								set({ address_lot: digitsOnly(e.target.value, 4) })
							}
							inputMode="numeric"
							placeholder="Lot"
							className="tabular-nums px-2 sm:px-3"
						/>
					</Field>
				</div>
				<Field label="Preferred lane">
					<Select
						value={c.preferred_lane || null}
						onValueChange={(v) =>
							set({ preferred_lane: (v ?? "") as Lane | "" })
						}
					>
						<SelectTrigger className="w-full gap-2">
							<SelectValue placeholder="Select lane">
								{(value: string | null) =>
									value ? (
										<span className="flex min-w-0 items-center gap-2">
											<LaneRoleIcon
												role={value as PlayerRole}
												className="size-5 shrink-0"
											/>
											<span className="truncate">
												{LANE_ROLE_LABELS[value as PlayerRole] ?? value}
											</span>
										</span>
									) : null
								}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{LANES.map((l) => (
									<SelectItem key={l} value={l}>
										<span className="flex items-center gap-2">
											<LaneRoleIcon
												role={l as PlayerRole}
												className="size-5 shrink-0"
											/>
											<span>{LANE_ROLE_LABELS[l as PlayerRole]}</span>
										</span>
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</Field>
				<Field label="Contact (optional)">
					<Input
						type="tel"
						inputMode="tel"
						autoComplete="tel"
						value={c.contact_number}
						onChange={(e) =>
							set({
								contact_number: sanitizePhilippineMobileInput(e.target.value),
							})
						}
						placeholder="09XX-XXX-XXXX"
						className="tabular-nums"
					/>
				</Field>
			</div>
		</div>
	);
}

export function TeamIntentStep({ state, dispatch }: Props) {
	const { min, max } = memberCountBounds(
		state.min_team_size,
		state.max_team_size,
	);
	const sizeOptions = Array.from(
		{ length: max - min + 1 },
		(_, i) => min + i,
	);
	const intents: { id: TeamIntent; title: string; blurb: string }[] = [
		{
			id: "open_matching",
			title: "Open matching",
			blurb: "Committee / system fills you with other registrants.",
		},
		{
			id: "join_team",
			title: "Join a listed team",
			blurb: "Next: enter your details, then pick a listed team.",
		},
		{
			id: "create_team",
			title: "Create / name a team",
			blurb: `Register ${min}–${max} teammates in one go, then name the squad.`,
		},
	];

	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted-foreground text-sm leading-relaxed">
				Choose how you want to enter. The committee may still prefer teams with
				a Phase 9 resident — that rule is not enforced in this form right now.
			</p>
			<div className="grid gap-2">
				{intents.map((intent) => {
					const on = state.team_intent === intent.id;
					return (
						<button
							key={intent.id}
							type="button"
							onClick={() =>
								dispatch({ type: "SET_TEAM_INTENT", intent: intent.id })
							}
							className={cn(
								"rounded-2xl border px-4 py-3 text-left transition-colors",
								on
									? "border-primary bg-primary/10"
									: "border-border hover:bg-muted/60",
							)}
						>
							<p className="font-medium text-sm">{intent.title}</p>
							<p className="text-muted-foreground text-xs">{intent.blurb}</p>
						</button>
					);
				})}
			</div>
			{state.team_intent === "create_team" ? (
				<Field label="How many teammates are registering now?">
					<Select
						value={String(state.member_count)}
						onValueChange={(v) => {
							const n = Number(v);
							if (!Number.isFinite(n)) return;
							dispatch({ type: "SET_MEMBER_COUNT", count: n });
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue>
								{(selected) =>
									selected ? `${selected} players` : "Choose count"
								}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{sizeOptions.map((n) => (
									<SelectItem key={n} value={String(n)}>
										{n} players
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</Field>
			) : null}
		</div>
	);
}

function JoinTeamPicker({ state, dispatch }: Props) {
	const [query, setQuery] = useState("");
	const q = query.trim().toLowerCase();
	const teams = state.listed_teams.filter((team) => {
		if (!q) return true;
		const phases = team.member_phases.join(" ");
		return (
			team.name.toLowerCase().includes(q) ||
			phases.includes(q) ||
			`phase ${phases}`.includes(q)
		);
	});

	return (
		<div className="flex flex-col gap-3">
			<p className="text-muted-foreground text-sm leading-relaxed">
				Search and pick a listed team. This is a preference — the committee
				assigns the final roster.
			</p>
			<Field label="Search teams">
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search by name or phase…"
					autoComplete="off"
				/>
			</Field>
			<ul className="flex flex-col gap-2" aria-label="Listed teams">
				{teams.length === 0 ? (
					<li className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-center text-muted-foreground text-sm">
						No teams match your search.
					</li>
				) : (
					teams.map((team) => {
						const on = state.preferred_team === team.id;
						return (
							<li key={team.id}>
								<button
									type="button"
									onClick={() =>
										dispatch({
											type: "SET_PREFERRED_TEAM",
											teamId: team.id,
										})
									}
									className={cn(
										"flex w-full flex-col gap-0.5 rounded-2xl border px-4 py-3 text-left transition-colors",
										on
											? "border-primary bg-primary/10"
											: "border-border hover:bg-muted/60",
									)}
								>
									<span className="font-medium text-sm">{team.name}</span>
									<span className="text-muted-foreground text-xs">
										Phases {team.member_phases.join(", ")}
									</span>
								</button>
							</li>
						);
					})
				)}
			</ul>
		</div>
	);
}

export function TeamDetailsStep({ state, dispatch }: Props) {
	if (state.team_intent === "join_team") {
		return <JoinTeamPicker state={state} dispatch={dispatch} />;
	}

	if (state.team_intent === "create_team") {
		return (
			<div className="flex flex-col gap-3">
				<p className="text-muted-foreground text-sm leading-relaxed">
					Name the team for all {state.member_count} registrants in this
					session. The committee will create the official team after review.
				</p>
				<Field label="Preferred team name">
					<Input
						value={state.preferred_team_name}
						onChange={(e) =>
							dispatch({
								type: "SET_PREFERRED_TEAM_NAME",
								name: e.target.value,
							})
						}
						placeholder="Night Owls"
					/>
				</Field>
			</div>
		);
	}

	return (
		<p className="text-muted-foreground text-sm">
			Go back and choose join or create to continue.
		</p>
	);
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsStep({ state, dispatch }: Props) {
	const files: { key: keyof Uploads; label: string }[] = [
		{ key: "school_id_front", label: "School ID — front" },
		{ key: "school_id_back", label: "School ID — back" },
		{ key: "purok_endorsement", label: "Purok endorsement" },
	];

	return (
		<div className="flex flex-col gap-3">
			<PlayerChrome state={state} />
			<p className="text-muted-foreground text-sm">
				Attach all three documents (JPG, PNG, WebP, HEIC, or PDF — max 5 MiB
				each). They upload with your registration for committee review.
			</p>
			{files.map((f) => {
				const file = state.uploads[f.key];
				const inputId = `upload-${f.key}`;
				return (
					<div
						key={f.key}
						className={cn(
							"flex flex-col gap-3 rounded-2xl border px-4 py-3",
							file
								? "border-primary bg-primary/10"
								: "border-dashed border-border",
						)}
					>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="min-w-0 flex flex-col gap-0.5">
								<span className="text-sm font-medium">{f.label}</span>
								<span className="truncate font-mono text-muted-foreground text-xs">
									{file
										? `${file.name} · ${formatFileSize(file.size)}`
										: "No file selected"}
								</span>
							</div>
							<div className="flex shrink-0 flex-wrap items-center gap-2">
								<input
									id={inputId}
									type="file"
									accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.webp,.heic,.pdf"
									className="block w-full max-w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:font-medium file:text-primary-foreground hover:file:bg-primary/80 sm:w-auto"
									onChange={(e) => {
										const next = e.target.files?.[0] ?? null;
										if (!next) {
											dispatch({
												type: "SET_UPLOAD",
												file: f.key,
												value: null,
											});
											return;
										}
										const err = validateUploadFile(next);
										if (err) {
											dispatch({
												type: "SET_LAST_ERROR",
												message: `${f.label}: ${err}`,
											});
											e.target.value = "";
											return;
										}
										dispatch({ type: "SET_LAST_ERROR", message: null });
										dispatch({
											type: "SET_UPLOAD",
											file: f.key,
											value: next,
										});
									}}
								/>
								{file ? (
									<Button
										type="button"
										size="sm"
										variant="ghost"
										onClick={() => {
											dispatch({
												type: "SET_UPLOAD",
												file: f.key,
												value: null,
											});
											const el = document.getElementById(
												inputId,
											) as HTMLInputElement | null;
											if (el) el.value = "";
										}}
									>
										Clear
									</Button>
								) : null}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function OutcomeShell({
	tone,
	icon,
	eyebrow,
	title,
	body,
	details,
	next,
	actions,
}: {
	tone: "pending" | "success" | "danger";
	icon: ReactNode;
	eyebrow: string;
	title: string;
	body: string;
	details?: ReactNode;
	next?: string[];
	actions?: ReactNode;
}) {
	const toneClass =
		tone === "success"
			? "border-success/30 bg-success/10 text-success"
			: tone === "danger"
				? "border-destructive/30 bg-destructive/10 text-destructive"
				: "border-primary/30 bg-primary/10 text-primary";

	return (
		<div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
			<div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
				<div
					className={cn(
						"flex size-14 items-center justify-center rounded-full border",
						toneClass,
					)}
					aria-hidden
				>
					{icon}
				</div>
				<div className="flex flex-col gap-2">
					<p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.2em]">
						{eyebrow}
					</p>
					<h2 className="font-serif text-2xl tracking-tight sm:text-3xl">
						{title}
					</h2>
					<p className="max-w-md text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
						{body}
					</p>
				</div>
			</div>

			{details}

			{next && next.length > 0 ? (
				<ol className="flex flex-col gap-0 border-y border-border/70">
					{next.map((item, i) => (
						<li
							key={item}
							className="grid grid-cols-[2.5rem_1fr] items-start gap-3 border-b border-border/50 py-3 last:border-b-0"
						>
							<span className="font-mono text-primary/80 text-sm tabular-nums">
								{String(i + 1).padStart(2, "0")}
							</span>
							<span className="pt-0.5 text-sm leading-relaxed">{item}</span>
						</li>
					))}
				</ol>
			) : null}

			<div className="flex flex-col gap-2 sm:flex-row">
				<Button size="lg" className="w-full sm:w-auto" render={<Link to="/" />}>
					<House data-icon="inline-start" />
					Back to home
				</Button>
				{actions}
			</div>
		</div>
	);
}

export function OutcomeStep({ state }: Props) {
	if (state.step === "pending") {
		const batch =
			state.submitted_registrants.length > 0
				? state.submitted_registrants
				: state.registration_status_codes.map((statusCode, index) => ({
						index,
						email:
							state.registrants[index]?.credentials.email.trim() ||
							state.credentials.email.trim(),
						statusCode,
					}));
		const multi = batch.length > 1;
		const code = batch[0]?.statusCode?.trim() || "";
		const email = batch[0]?.email?.trim() || state.credentials.email.trim();
		return (
			<OutcomeShell
				tone="pending"
				icon={<Clock3 className="size-6" />}
				eyebrow="Registration received"
				title={
					multi
						? "Your team is in the review queue"
						: "You’re in the review queue"
				}
				body={
					multi
						? "Each teammate got their own status code by email. Save every code below for tracking."
						: "The SK committee will check your credentials and documents. Save your status code — the same one is emailed to you for tracking approval."
				}
				details={
					<div className="flex flex-col gap-3">
						{multi ? (
							<ul className="flex flex-col gap-2">
								{batch.map((row) => (
									<li
										key={`${row.index}-${row.statusCode}`}
										className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3"
									>
										<p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.18em]">
											Player {row.index + 1}
											{row.email ? ` · ${row.email}` : ""}
										</p>
										<p className="mt-1 font-mono text-2xl tracking-[0.22em] text-foreground">
											{row.statusCode}
										</p>
									</li>
								))}
							</ul>
						) : code ? (
							<div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-4 text-center">
								<p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.18em]">
									Your status code
								</p>
								<p className="mt-2 font-mono text-3xl tracking-[0.28em] text-foreground">
									{code}
								</p>
							</div>
						) : null}
						{!multi && email ? (
							<div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-left">
								<Mail
									className="mt-0.5 size-4 shrink-0 text-primary"
									aria-hidden
								/>
								<div className="min-w-0 flex flex-col gap-0.5">
									<p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.18em]">
										Also emailed to
									</p>
									<p className="truncate font-medium text-sm">{email}</p>
								</div>
							</div>
						) : null}
					</div>
				}
				next={[
					multi
						? "Each player should check inbox (and spam) for their own registration-received email."
						: "Check your inbox (and spam) for the registration-received email with this code.",
					"Open Verify registration and enter a status code to check pending / approved / rejected.",
					"No walk-in encoding needed unless the committee asks.",
				]}
				actions={
					code ? (
						<Button
							size="lg"
							variant="outline"
							className="w-full sm:w-auto"
							render={<Link to="/verify" search={{ code }} />}
						>
							Verify {multi ? "first code" : "this code"}
						</Button>
					) : (
						<Button
							size="lg"
							variant="outline"
							className="w-full sm:w-auto"
							render={<Link to="/verify" />}
						>
							Verify registration
						</Button>
					)
				}
			/>
		);
	}

	if (state.step === "approved") {
		return (
			<OutcomeShell
				tone="success"
				icon={<CircleCheck className="size-6" />}
				eyebrow="You’re cleared"
				title="Registration approved"
				body="You’re a participant for this tournament. Watch for team and schedule updates from the committee."
			/>
		);
	}

	return (
		<OutcomeShell
			tone="danger"
			icon={<CircleX className="size-6" />}
			eyebrow="Not approved"
			title="Registration rejected"
			body={
				state.registration_reject_reason.trim() ||
				"The committee could not approve this registration."
			}
		/>
	);
}

export function StepBody(props: Props) {
	switch (props.state.step) {
		case "closed":
			return <ClosedStep {...props} />;
		case "consent":
			return <ConsentStep {...props} />;
		case "credentials":
			return <CredentialsStep {...props} />;
		case "team_intent":
			return <TeamIntentStep {...props} />;
		case "team_details":
			return <TeamDetailsStep {...props} />;
		case "documents":
			return <DocumentsStep {...props} />;
		case "pending":
		case "approved":
		case "rejected":
			return <OutcomeStep {...props} />;
		default:
			return null;
	}
}

export function ErrorBanner({ state }: { state: RegistrationDraft }) {
	if (!state.last_error) return null;
	return (
		<div
			role="alert"
			className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm"
		>
			{state.last_error}
		</div>
	);
}

export function NavRow({
	state,
	dispatch,
	showSubmit,
	onSubmit,
	onContinue,
	submitting,
	submitDisabled,
}: Props & {
	showSubmit?: boolean;
	onSubmit?: () => void;
	/** Async/sync continue (e.g. email availability). Defaults to `NEXT`. */
	onContinue?: () => void | Promise<void>;
	submitting?: boolean;
	/** Extra gate (e.g. Turnstile token not ready yet). */
	submitDisabled?: boolean;
}) {
	const fillable =
		state.step === "consent" ||
		state.step === "credentials" ||
		state.step === "team_intent" ||
		state.step === "team_details" ||
		state.step === "documents";

	if (!fillable) return null;

	const onLastDocumentPlayer =
		state.step === "documents" &&
		(!isCreateTeamBatch(state) ||
			state.active_registrant_index >= state.member_count - 1);

	const showSubmitButton = Boolean(showSubmit) || onLastDocumentPlayer;

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button
				type="button"
				variant="outline"
				onClick={() => dispatch({ type: "BACK" })}
				disabled={state.step === "team_intent" || submitting}
			>
				Back
			</Button>
			{showSubmitButton ? (
				<Button
					type="button"
					onClick={() => onSubmit?.()}
					disabled={submitting || !onSubmit || submitDisabled}
				>
					{submitting
						? "Submitting…"
						: submitDisabled
							? "Complete verification…"
							: isCreateTeamBatch(state)
								? "Submit team registration"
								: "Submit registration"}
				</Button>
			) : (
				<Button
					type="button"
					onClick={() => {
						if (onContinue) void onContinue();
						else dispatch({ type: "NEXT" });
					}}
					disabled={submitting}
				>
					{submitting
						? "Checking…"
						: state.step === "documents" || state.step === "credentials"
							? isCreateTeamBatch(state)
								? "Next player"
								: "Continue"
							: "Continue"}
				</Button>
			)}
		</div>
	);
}
