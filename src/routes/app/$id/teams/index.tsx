import { getTeamsColumns } from "@/components/tables/teams-columns";
import { TeamCard } from "@/components/teams/team-card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
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
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	FxTeamsCards,
	FxTeamsHeaderSearch,
	FxTeamsTable,
} from "@/lib/loading-placeholders";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	useArchivedParticipants,
	useParticipantMutations,
	useParticipants,
} from "@/hooks/use-participants";
import { useArchivedTeams, useTeamMutations, useTeams } from "@/hooks/use-teams";
import { groupParticipantsByTournamentAge } from "@/lib/age";
import {
	downloadStructuredSpreadsheet,
	type SpreadsheetColumn,
} from "@/lib/spreadsheet-export";
import { getTeamStatusStyle } from "@/lib/team-status";
import {
	matchesFuzzyQuery,
	participantSearchHaystack,
} from "@/lib/fuzzy-match";
import { queryKeys } from "@/lib/query-keys";
import { isClientRateLimitError } from "@/lib/rate-limited-api";
import { compareRegisteredDesc } from "@/lib/registered-date";
import { pickUnassignedIdsForFiveLanes } from "@/lib/team-lane-recommendations";
import { PreferredLaneIcons } from "@/components/participants/preferred-lane-icons";
import { cn, formatParticipantNameDisplay } from "@/lib/utils";
import type { Collections, PlayerRole } from "@/types/pocketbase-types";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
	Archive,
	ChevronDown,
	FileSpreadsheet,
	LayoutGrid,
	LayoutList,
	Loader2,
	Plus,
	Search,
	UserPlus,
	UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$id/teams/")({
	component: TeamsPage,
});

type TeamFormData = Partial<
	Omit<Collections["teams"], "id" | "created" | "updated">
>;

type ParticipantSummary = {
	id: string;
	name?: string;
	gameID?: string;
	area?: string;
	birthdate?: string;
	preferredRoles?: PlayerRole[];
};

/** Max players to attach in one quick-team flow (main roster + backup). */
const QUICK_TEAM_MAX_MEMBERS = 6;

function QuickTeamFromUnassignedContent({
	step,
	unassignedParticipants,
	teamName,
	setTeamName,
	selectedIds,
	toggleParticipant,
	captainId,
	setCaptainId,
	search,
	setSearch,
	onContinue,
	onClose,
	onBack,
	onCreate,
	isSubmitting,
	onSuggestFiveByLanes,
	suggestedLaneIds,
}: {
	step: 1 | 2;
	unassignedParticipants: ParticipantSummary[];
	teamName: string;
	setTeamName: (v: string) => void;
	selectedIds: Set<string>;
	toggleParticipant: (id: string) => void;
	captainId: string;
	setCaptainId: (v: string) => void;
	search: string;
	setSearch: (v: string) => void;
	onContinue: () => void;
	/** Step 1: close wizard. Step 2: go back to member selection. */
	onClose: () => void;
	onBack: () => void;
	onCreate: () => void | Promise<void>;
	isSubmitting: boolean;
	/** Re-select five unassigned players whose preferences can cover all main lanes. */
	onSuggestFiveByLanes: () => void;
	/** From parent: ids for the current lane-balanced five (same as selection on open / re-suggest). */
	suggestedLaneIds: string[] | null;
}) {
	/** When a full-lane suggestion exists, step 1 only lists those five (not all unassigned). */
	const rosterListParticipants = useMemo(() => {
		if (!suggestedLaneIds?.length) return unassignedParticipants;
		const byId = new Map(unassignedParticipants.map((p) => [p.id, p]));
		return suggestedLaneIds
			.map((id) => byId.get(id))
			.filter((p): p is ParticipantSummary => p != null);
	}, [suggestedLaneIds, unassignedParticipants]);

	const filtered = useMemo(() => {
		if (!search.trim()) return rosterListParticipants;
		const q = search.trim();
		return rosterListParticipants.filter((p) =>
			matchesFuzzyQuery(participantSearchHaystack(p), q),
		);
	}, [rosterListParticipants, search]);

	const filteredByAge = useMemo(
		() => groupParticipantsByTournamentAge(filtered),
		[filtered],
	);

	const selectedList = useMemo(
		() => unassignedParticipants.filter((p) => selectedIds.has(p.id)),
		[unassignedParticipants, selectedIds],
	);

	const canContinue =
		teamName.trim().length > 0 && selectedIds.size >= 1 && selectedIds.size <= QUICK_TEAM_MAX_MEMBERS;

	const selectionMatchesLaneSuggestion = useMemo(() => {
		if (!suggestedLaneIds || suggestedLaneIds.length !== 5) return false;
		if (selectedIds.size !== 5) return false;
		return suggestedLaneIds.every((id) => selectedIds.has(id));
	}, [suggestedLaneIds, selectedIds]);

	if (step === 2) {
		return (
			<div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
				<div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
					<div className="flex flex-col gap-4 pb-1">
						<DialogDescription className="text-left">
							You are about to create this team and assign the selected players in
							one step. This cannot be undone from here (you can edit the team or
							remove members afterward).
						</DialogDescription>
						<div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
							<p>
								<span className="text-muted-foreground">Team name</span>{" "}
								<span className="font-medium">{teamName.trim()}</span>
							</p>
							<p className="text-muted-foreground">
								Members ({selectedList.length})
							</p>
							<ul className="flex flex-col gap-1 pl-1">
								{selectedList.map((p) => (
									<li key={p.id}>
										·{" "}
										{formatParticipantNameDisplay(p.name) || p.gameID || p.id}
									</li>
								))}
							</ul>
							{captainId ? (
								<p className="border-t border-border/60 pt-2 text-xs text-muted-foreground">
									Captain:{" "}
									<span className="font-medium text-foreground">
										{formatParticipantNameDisplay(
											selectedList.find((x) => x.id === captainId)?.name,
										) ||
											selectedList.find((x) => x.id === captainId)?.gameID ||
											captainId}
									</span>
								</p>
							) : null}
						</div>
					</div>
				</div>
				<DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-background pt-3 sm:gap-0">
					<Button
						type="button"
						variant="outline"
						onClick={onBack}
						disabled={isSubmitting}
					>
						Back
					</Button>
					<Button type="button" onClick={() => void onCreate()} disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
								Creating…
							</>
						) : (
							"Create team"
						)}
					</Button>
				</DialogFooter>
			</div>
		);
	}

	return (
		<div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
			<div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
				<div className="flex flex-col gap-3 pb-1">
					<div className="flex flex-col gap-2">
						<Label htmlFor="quick-team-name">Team name</Label>
						<Input
							id="quick-team-name"
							value={teamName}
							onChange={(e) => setTeamName(e.target.value)}
							placeholder="e.g. Fallen"
							autoComplete="off"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label>Captain (optional)</Label>
						<Select
							value={captainId}
							onValueChange={(v) => setCaptainId(v ?? "")}
							disabled={selectedIds.size === 0}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Choose from selected members">
									{(value) => {
										if (value == null || value === "") return null;
										const p = unassignedParticipants.find((x) => x.id === value);
										return (
											formatParticipantNameDisplay(p?.name) ||
											p?.gameID ||
											String(value)
										);
									}}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="">No captain yet</SelectItem>
									{[...selectedIds].map((id) => {
										const p = unassignedParticipants.find((x) => x.id === id);
										return (
											<SelectItem key={id} value={id}>
												{(formatParticipantNameDisplay(p?.name) || p?.gameID) ?? id}
											</SelectItem>
										);
									})}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-2 text-xs text-muted-foreground">
						{suggestedLaneIds?.length ? (
							<>
								<p>
									Only these five unassigned players are shown — their preferred
									lanes can cover mid, gold, exp, roamer, and jungle (one per
									lane). Each time you open Quick team (or use the button below),
									a different valid mix is chosen when more than one exists. You
									can change the roster later on the team.
								</p>
								{!selectionMatchesLaneSuggestion ? (
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
										<p>
											Pick another lane-balanced five, or re-check the boxes above.
										</p>
										<Button
											type="button"
											variant="secondary"
											size="sm"
											className="shrink-0 self-start"
											onClick={onSuggestFiveByLanes}
										>
											Try another mix
										</Button>
									</div>
								) : null}
							</>
						) : (
							<>
								<p>
									Select up to {QUICK_TEAM_MAX_MEMBERS} unassigned players. You can
									add or remove members later.
								</p>
								<p>
									No five unassigned players can cover every main lane from
									preferences alone — pick members manually or adjust preferred
									lanes on the Participants page.
								</p>
							</>
						)}
					</div>
					{!suggestedLaneIds?.length ? (
						<div className="relative min-w-0">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								placeholder="Search name, Game ID, or area…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="min-w-0 pl-9"
							/>
						</div>
					) : null}
					<div className="min-w-0 rounded-md border border-border/60 p-1">
						<div className="min-w-0 flex flex-col gap-4">
							{filteredByAge.map((group) => (
								<section key={group.key} className="min-w-0 flex flex-col gap-1.5">
									<h3 className="sticky top-0 z-1 border-b border-border/70 bg-background py-2 text-xs font-semibold tracking-wide text-muted-foreground">
										{group.label}
									</h3>
									<ul className="flex flex-col gap-1">
										{group.items.map((p) => {
											const checked = selectedIds.has(p.id);
											const hasLanes = Boolean(
												p.preferredRoles?.filter(Boolean).length,
											);
											return (
												<li
													key={p.id}
													className="flex min-w-0 max-w-full items-center gap-2 rounded-lg border px-2 py-2 sm:px-3"
												>
													<Checkbox
														checked={checked}
														onCheckedChange={(c) => {
															const on = Boolean(c);
															if (on && !selectedIds.has(p.id)) {
																toggleParticipant(p.id);
															} else if (!on && selectedIds.has(p.id)) {
																toggleParticipant(p.id);
															}
														}}
														aria-label={`Select ${formatParticipantNameDisplay(p.name) || p.gameID || p.id}`}
													/>
													<span className="min-w-0 flex-1 flex flex-col gap-1">
														<span className="flex flex-wrap items-center gap-2">
															<span className="block wrap-break-word font-medium">
																{(formatParticipantNameDisplay(p.name) ||
																	p.gameID) ??
																	p.id}
															</span>
															{hasLanes ? (
																<span className="inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 px-1 py-0.5">
																	<span className="sr-only">Preferred lanes</span>
																	<PreferredLaneIcons
																		roles={p.preferredRoles}
																		iconClassName="size-4"
																	/>
																</span>
															) : null}
														</span>
														{p.area ? (
															<span className="block wrap-break-word text-xs text-muted-foreground">
																{p.area}
															</span>
														) : null}
													</span>
												</li>
											);
										})}
									</ul>
								</section>
							))}
						</div>
						{filtered.length === 0 && (
							<p className="py-6 text-center text-sm text-muted-foreground">
								No participants match &quot;{search}&quot;
							</p>
						)}
					</div>
				</div>
			</div>
			<DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-background pt-3 sm:gap-0">
				<Button type="button" variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button type="button" onClick={onContinue} disabled={!canContinue}>
					Continue to confirmation
				</Button>
			</DialogFooter>
		</div>
	);
}

function AddMembersContent({
	unassignedParticipants,
	teamId,
	onAdd,
	onClose,
}: {
	unassignedParticipants: ParticipantSummary[];
	teamId: string;
	onAdd: (participantId: string, teamId: string) => void;
	onClose: () => void;
}) {
	const [search, setSearch] = useState("");
	const filtered = useMemo(() => {
		if (!search.trim()) return unassignedParticipants;
		const q = search.trim();
		return unassignedParticipants.filter((p) =>
			matchesFuzzyQuery(participantSearchHaystack(p), q),
		);
	}, [unassignedParticipants, search]);

	const filteredByAge = useMemo(
		() => groupParticipantsByTournamentAge(filtered),
		[filtered],
	);

	if (unassignedParticipants.length === 0) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-sm text-muted-foreground">
					No unassigned participants. Assign participants to teams from the
					Participants page first.
				</p>
				<Button variant="outline" onClick={onClose}>
					Close
				</Button>
			</div>
		);
	}
	return (
		<div className="flex min-h-0 w-full min-w-0 flex-col gap-3">
			<div className="relative min-w-0 shrink-0">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					placeholder="Search name, Game ID, or area…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="min-w-0 pl-9"
				/>
			</div>
			<div className="min-h-[280px] max-h-[50vh] min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain">
				<div className="min-w-0 flex flex-col gap-4">
					{filteredByAge.map((group) => (
						<section key={group.key} className="min-w-0 flex flex-col gap-1.5">
							<h3 className="sticky top-0 z-[1] border-b border-border/70 bg-background py-2 text-xs font-semibold tracking-wide text-muted-foreground">
								{group.label}
							</h3>
							<ul className="flex flex-col gap-1">
								{group.items.map((p) => {
									const hasLanes = Boolean(
										p.preferredRoles?.filter(Boolean).length,
									);
									return (
										<li
											key={p.id}
											className="flex min-w-0 max-w-full items-center justify-between gap-2 rounded-lg border px-3 py-2"
										>
											<span className="min-w-0 flex-1 flex flex-col gap-1">
												<span className="flex items-center gap-3 flex-wrap">
													<span className="block wrap-break-word font-medium">
														{(formatParticipantNameDisplay(p.name) ||
															p.gameID) ??
															p.id}
													</span>
													{hasLanes ? (
														<span className="inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 px-1 py-0.5">
															<span className="sr-only">Preferred lanes</span>
															<PreferredLaneIcons
																roles={p.preferredRoles}
																iconClassName="size-4"
															/>
														</span>
													) : null}
												</span>
												{p.area ? (
													<span className="block wrap-break-word text-xs text-muted-foreground">
														{p.area}
													</span>
												) : null}
											</span>
											<Button
												size="sm"
												variant="default"
												className="w-20 shrink-0 justify-center self-center"
												onClick={() => onAdd(p.id, teamId)}
											>
												<UserPlus className="size-4" />
												Add
											</Button>
										</li>
									);
								})}
							</ul>
						</section>
					))}
				</div>
				{filtered.length === 0 && (
					<p className="py-4 text-center text-sm text-muted-foreground">
						No participants match &quot;{search}&quot;
					</p>
				)}
			</div>
			<Button variant="outline" onClick={onClose} className="w-full shrink-0">
				Close
			</Button>
		</div>
	);
}

function CaptainPopover({
	onChange,
	teamMembers,
	triggerLabel,
}: {
	value: string;
	onChange: (v: string) => void;
	teamMembers: { id: string; name?: string; gameID?: string }[];
	triggerLabel: string;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-left text-sm font-normal ring-offset-background hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				aria-expanded={open}
			>
				<span className="truncate">{triggerLabel}</span>
				<ChevronDown className="size-4 shrink-0 opacity-50" />
			</PopoverTrigger>
			<PopoverContent
				className="min-w-80 w-(--anchor-width) max-w-[calc(100vw-2rem)] p-2"
				align="start"
			>
				<div className="flex max-h-[min(var(--available-height,280px),70vh)] flex-col gap-0.5 overflow-y-auto">
					<Button
						type="button"
						variant="ghost"
						className="h-auto w-full justify-start py-3 pl-3 text-left font-normal"
						onClick={() => {
							onChange("");
							setOpen(false);
						}}
					>
						No captain
					</Button>
					{teamMembers.map((p) => (
						<Button
							type="button"
							key={p.id}
							variant="ghost"
							className="h-auto w-full justify-start py-3 pl-3 text-left font-normal"
							onClick={() => {
								onChange(p.id);
								setOpen(false);
							}}
						>
							{(formatParticipantNameDisplay(p.name) || p.gameID) ?? p.id}
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}

function TeamForm({
	form,
	setForm,
	editingId,
	teamMembers,
	onClose,
	onSubmit,
	isMobile = false,
}: {
	form: TeamFormData;
	setForm: React.Dispatch<React.SetStateAction<TeamFormData>>;
	editingId: string | null;
	teamMembers: { id: string; name?: string; gameID?: string }[] | undefined;
	onClose: () => void;
	onSubmit: () => void;
	isMobile?: boolean;
}) {
	const captainMember = teamMembers?.find((p) => p.id === form.captain);
	const captainLabel =
		form.captain === ""
			? "Select captain (team members only)"
			: ((formatParticipantNameDisplay(captainMember?.name) ||
				captainMember?.gameID) ??
				"Select captain (team members only)");

	return (
		<div className="w-full flex flex-col gap-4 px-4 pb-4">
			<div className="flex flex-col gap-2">
				<Label htmlFor="name">Team name</Label>
				<Input
					id="name"
					value={form.name ?? ""}
					onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
					placeholder="Team name"
				/>
			</div>
			{editingId &&
				(isMobile ? (
					<div className="flex flex-col gap-2">
						<Label>Captain</Label>
						<CaptainPopover
							value={form.captain ?? ""}
							onChange={(v) => setForm((f) => ({ ...f, captain: v || "" }))}
							teamMembers={teamMembers ?? []}
							triggerLabel={captainLabel}
						/>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						<Label>Captain</Label>
						<Select
							value={form.captain ?? ""}
							onValueChange={(v) =>
								setForm((f) => ({ ...f, captain: v || "" }))
							}
							items={{
								"": "No captain",
								...Object.fromEntries(
									(teamMembers ?? []).map((p) => [
										p.id,
										(formatParticipantNameDisplay(p.name) || p.gameID) ?? p.id,
									]),
								),
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select captain (team members only)">
									{(value) => {
										if (value == null || value === "") return null;
										const p = teamMembers?.find((m) => m.id === value);
										return (
											formatParticipantNameDisplay(p?.name) ||
											p?.gameID ||
											String(value)
										);
									}}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="">No captain</SelectItem>
									{teamMembers?.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{(formatParticipantNameDisplay(p.name) || p.gameID) ?? p.id}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				))}
			<div className="flex gap-2 pt-4">
				<Button onClick={onSubmit} className="flex-1">
					{editingId ? "Save" : "Add"}
				</Button>
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
			</div>
		</div>
	);
}

function TeamsLoadingSkeleton({
	layout,
}: {
	layout: "table" | "cards";
}) {
	const body = layout === "cards" ? <FxTeamsCards /> : <FxTeamsTable />;
	return (
		<output
			aria-live="polite"
			aria-busy="true"
			className="block min-w-0 w-full"
		>
			<span className="sr-only">Loading teams</span>
			<div className="min-w-0 w-full">{body}</div>
		</output>
	);
}

function TeamsPage() {
	const params = useParams({ strict: false });
	const appId = (params as { id?: string })?.id ?? "";
	const { data: teams, isLoading } = useTeams();
	const { data: archivedTeamsData } = useArchivedTeams();
	const archivedTeams = archivedTeamsData ?? [];
	const { data: participants } = useParticipants();
	const { data: archivedParticipantsData } = useArchivedParticipants();
	const archivedParticipants = archivedParticipantsData ?? [];
	const queryClient = useQueryClient();
	const mutations = useTeamMutations();
	const participantMutations = useParticipantMutations();
	const isMobile = useIsMobile();
	const [view, setView] = useState<"table" | "cards">("table");
	const [sheetOpen, setSheetOpen] = useState(false);
	const [addMembersTeamId, setAddMembersTeamId] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
	const [quickTeamOpen, setQuickTeamOpen] = useState(false);
	const [quickTeamStep, setQuickTeamStep] = useState<1 | 2>(1);
	const [quickTeamName, setQuickTeamName] = useState("");
	const [quickTeamSelected, setQuickTeamSelected] = useState<Set<string>>(
		() => new Set(),
	);
	const [quickTeamCaptain, setQuickTeamCaptain] = useState("");
	const [quickTeamSearch, setQuickTeamSearch] = useState("");
	const [quickTeamSubmitting, setQuickTeamSubmitting] = useState(false);
	/** Lane-balanced five for this modal session (randomized order each open when possible). */
	const [quickTeamSuggestedLaneIds, setQuickTeamSuggestedLaneIds] = useState<
		string[] | null
	>(null);
	const [form, setForm] = useState<TeamFormData>({
		name: "",
		captain: "",
		status: "forming",
	});

	const openCreate = () => {
		setEditingId(null);
		setForm({ name: "", captain: "", status: "forming" });
		setSheetOpen(true);
	};

	const openEdit = (t: NonNullable<typeof teams>[number]) => {
		setEditingId(t.id);
		setForm({
			name: t.name ?? "",
			captain: t.captain ?? "",
			status: t.status ?? "forming",
		});
		setSheetOpen(true);
	};

	const handleSubmit = () => {
		const name = (form.name ?? "").trim();
		if (!name) {
			toast.error("Enter a team name");
			return;
		}
		if (editingId) {
			mutations.update.mutate({ id: editingId, ...form });
			toast.success("Team updated");
		} else {
			mutations.create.mutate(form);
			toast.success("Team added");
		}
		setSheetOpen(false);
	};

	const handleArchiveConfirm = useCallback(() => {
		const id = archiveConfirmId;
		if (!id || mutations.archive.isPending) return;
		const displayName =
			teams?.find((t) => t.id === id)?.name?.trim() || "Team";
		void toast.promise(mutations.archive.mutateAsync(id), {
			loading: "Archiving team and unassigning members…",
			success: () => {
				setArchiveConfirmId(null);
				return `${displayName} archived`;
			},
			error: "Could not archive the team. Try again.",
		});
	}, [archiveConfirmId, teams, mutations.archive]);

	const getCaptainName = useCallback(
		(captainId: string | undefined) => {
			const p = participants?.find((x) => x.id === captainId);
			if (!p) return "-";
			return formatParticipantNameDisplay(p.name) || p.gameID || "-";
		},
		[participants],
	);

	const participantPoolMerged = useMemo(() => {
		const byId = new Map<string, NonNullable<typeof participants>[number]>();
		for (const p of participants ?? []) byId.set(p.id, p);
		for (const p of archivedParticipants) {
			if (!byId.has(p.id)) byId.set(p.id, p);
		}
		return [...byId.values()];
	}, [participants, archivedParticipants]);

	const getCaptainNameMerged = useCallback(
		(captainId: string | undefined) => {
			const p = participantPoolMerged.find((x) => x.id === captainId);
			if (!p) return "-";
			return formatParticipantNameDisplay(p.name) || p.gameID || "-";
		},
		[participantPoolMerged],
	);

	const getTeamMemberCount = (teamId: string) =>
		participants?.filter((p) => p.team === teamId).length ?? 0;

	const getTeamMembers = (teamId: string) =>
		participants?.filter((p) => p.team === teamId) ?? [];

	const unassignedParticipants =
		participants?.filter((p) => !p.team || p.team === "") ?? [];

	const unassignedForQuickTeam = useMemo((): ParticipantSummary[] => {
		return unassignedParticipants.map((p) => ({
			id: p.id,
			name: p.name,
			gameID: p.gameID,
			area: p.area,
			birthdate: p.birthdate,
			preferredRoles: p.preferredRoles as PlayerRole[] | undefined,
		}));
	}, [unassignedParticipants]);

	const updatedForReady = useRef<Set<string>>(new Set());
	useEffect(() => {
		if (!teams || !participants) return;
		for (const team of teams) {
			const members = participants.filter((p) => p.team === team.id);
			const count = members.length;
			const captainIsMember =
				team.captain && members.some((p) => p.id === team.captain);
			const needsCaptainClear =
				(count === 0 && team.captain) || (team.captain && !captainIsMember);

			if (count >= 5) {
				if (needsCaptainClear) {
					mutations.update.mutate({ id: team.id, captain: "" });
				} else if (
					(team.status === "forming" || team.status === "incomplete") &&
					!updatedForReady.current.has(team.id)
				) {
					updatedForReady.current.add(team.id);
					mutations.update.mutate({ id: team.id, status: "ready" });
				}
			} else {
				const targetStatus = count === 0 ? "incomplete" : "forming";
				const needsStatusUpdate =
					team.status !== targetStatus && team.status !== "inactive";
				if (needsStatusUpdate || needsCaptainClear) {
					updatedForReady.current.delete(team.id);
					mutations.update.mutate({
						id: team.id,
						...(needsStatusUpdate && { status: targetStatus }),
						...(needsCaptainClear && { captain: "" }),
					});
				}
			}
		}
	}, [teams, participants, mutations.update]);

	const handleAddMember = (participantId: string, teamId: string) => {
		const currentCount = getTeamMemberCount(teamId);
		const newCount = currentCount + 1;
		participantMutations.update.mutateQueued({
			id: participantId,
			team: teamId,
			status: "assigned",
		});
		if (newCount >= 5) {
			updatedForReady.current.add(teamId);
			mutations.update.mutate({ id: teamId, status: "ready" });
			toast.success("Member added. Team status set to Ready (5+ members).");
		} else {
			toast.success("Member added to team");
		}
	};

	const resetQuickTeam = useCallback(() => {
		setQuickTeamOpen(false);
		setQuickTeamStep(1);
		setQuickTeamName("");
		setQuickTeamSelected(new Set());
		setQuickTeamCaptain("");
		setQuickTeamSearch("");
		setQuickTeamSubmitting(false);
		setQuickTeamSuggestedLaneIds(null);
	}, []);

	const openQuickTeam = useCallback(() => {
		if (unassignedParticipants.length === 0) {
			toast.message(
				"No unassigned participants. Add players or remove them from a team on the Participants page first.",
			);
			return;
		}
		const lanePick = pickUnassignedIdsForFiveLanes(unassignedForQuickTeam, {
			shuffleMemberOrder: true,
		});
		setQuickTeamSuggestedLaneIds(lanePick);
		setQuickTeamStep(1);
		setQuickTeamName("");
		setQuickTeamSelected(new Set(lanePick ?? []));
		setQuickTeamCaptain("");
		setQuickTeamSearch("");
		setQuickTeamSubmitting(false);
		setQuickTeamOpen(true);
	}, [unassignedParticipants.length, unassignedForQuickTeam]);

	const suggestQuickTeamFiveByLanes = useCallback(() => {
		const ids = pickUnassignedIdsForFiveLanes(unassignedForQuickTeam, {
			shuffleMemberOrder: true,
		});
		if (ids) {
			setQuickTeamSuggestedLaneIds(ids);
			setQuickTeamSelected(new Set(ids));
			toast.success(
				"Selected 5 players whose preferences can cover all five main lanes.",
			);
		} else {
			toast.message(
				"No group of 5 unassigned players covers every lane from preferences alone. Pick manually or update preferred lanes.",
			);
		}
	}, [unassignedForQuickTeam]);

	const toggleQuickTeamParticipant = useCallback((id: string) => {
		setQuickTeamSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				if (next.size >= QUICK_TEAM_MAX_MEMBERS) {
					toast.error(
						`You can select at most ${QUICK_TEAM_MAX_MEMBERS} players in this flow.`,
					);
					return prev;
				}
				next.add(id);
			}
			return next;
		});
	}, []);

	useEffect(() => {
		setQuickTeamCaptain((c) =>
			c && !quickTeamSelected.has(c) ? "" : c,
		);
	}, [quickTeamSelected]);

	const handleQuickTeamCreate = useCallback(() => {
		const name = quickTeamName.trim();
		const ids = [...quickTeamSelected];
		if (!name || ids.length === 0) return;
		let captain = quickTeamCaptain;
		if (captain && !ids.includes(captain)) captain = "";
		setQuickTeamSubmitting(true);

		const work = (async () => {
			// 1. Persist the team first — participant records need a real team id.
			const created = (await mutations.create.mutateAsync({
				name,
				captain: captain || "",
				status: "forming",
			})) as { id?: string };
			const teamId = created?.id;
			if (!teamId) {
				throw new Error("Team was created without an id");
			}

			// 2. Assign members one PocketBase update at a time (team already exists).
			await participantMutations.update.assignToTeamBatchAsync(ids, teamId);

			// 3. Wait for fresh participants so sync logic sees correct member counts
			//    before we set status to Ready (avoids stale-cache "incomplete" overwrites).
			await queryClient.refetchQueries({ queryKey: queryKeys.participants });

			if (ids.length >= 5) {
				updatedForReady.current.add(teamId);
				mutations.update.mutate({ id: teamId, status: "ready" });
			}
			resetQuickTeam();
			return ids.length >= 5
				? `Team "${name}" created with ${ids.length} members (Ready).`
				: `Team "${name}" created with ${ids.length} member(s).`;
		})();

		toast.promise(work, {
			loading: `Creating team "${name}"…`,
			success: (message) => message,
			error: (e) =>
				isClientRateLimitError(e)
					? (e instanceof Error ? e.message : "Too many requests. Wait a moment and try again.")
					: e instanceof Error
						? e.message
						: "Could not create the team. Try again.",
		});
		void work.catch(() => {
			setQuickTeamSubmitting(false);
		});
	}, [
		quickTeamName,
		quickTeamSelected,
		quickTeamCaptain,
		queryClient,
		mutations.create,
		mutations.update,
		participantMutations.update,
		resetQuickTeam,
	]);

	const addMembersTeam = addMembersTeamId
		? teams?.find((t) => t.id === addMembersTeamId)
		: null;

	const [search, setSearch] = useState("");
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [exportIncludeArchived, setExportIncludeArchived] = useState(false);

	const filteredTeams = useMemo(() => {
		const base = !search.trim()
			? (teams ?? [])
			: (teams ?? []).filter((t) => {
					const q = search.toLowerCase().trim();
					const name = (t.name ?? "").toLowerCase();
					const captainName = getCaptainName(t.captain).toLowerCase();
					return name.includes(q) || captainName.includes(q);
				});
		return [...base].sort(compareRegisteredDesc);
	}, [teams, search, getCaptainName]);

	const filteredArchivedTeams = useMemo(() => {
		if (!archivedTeams.length) return [];
		const base = !search.trim()
			? archivedTeams
			: archivedTeams.filter((t) => {
					const q = search.toLowerCase().trim();
					const name = (t.name ?? "").toLowerCase();
					const captainName = getCaptainNameMerged(t.captain).toLowerCase();
					return name.includes(q) || captainName.includes(q);
				});
		return [...base].sort(compareRegisteredDesc);
	}, [archivedTeams, search, getCaptainNameMerged]);

	const confirmExportTeams = useCallback(() => {
		const includeArchived = exportIncludeArchived;
		const pool = includeArchived ? participantPoolMerged : (participants ?? []);

		const captainForRow = (captainId: string | undefined) => {
			const p = pool.find((x) => x.id === captainId);
			if (!p) return "-";
			return formatParticipantNameDisplay(p.name) || p.gameID || "-";
		};

		const activeRows = filteredTeams;
		const archivedRows = includeArchived ? filteredArchivedTeams : [];
		const rows = [...activeRows, ...archivedRows];
		const archivedTeamIds = new Set(archivedRows.map((t) => t.id));

		type T = (typeof rows)[number];
		const baseColumns: SpreadsheetColumn<T>[] = [
			{
				header: "Team name",
				widthChars: 26,
				type: "text",
				get: (t) => t.name ?? "",
			},
			{
				header: "Date registered",
				widthChars: 28,
				type: "text",
				get: (t) => t.created ?? "",
			},
			{
				header: "Status",
				widthChars: 12,
				type: "text",
				get: (t) => getTeamStatusStyle(t.status).label,
			},
			{
				header: "Captain",
				widthChars: 26,
				type: "text",
				get: (t) => captainForRow(t.captain),
			},
			{
				header: "Member count",
				widthChars: 14,
				type: "number",
				get: (t) => pool.filter((p) => p.team === t.id).length,
			},
			{
				header: "Members",
				widthChars: 48,
				type: "text",
				get: (t) => {
					const members = pool.filter((p) => p.team === t.id);
					return members
						.map(
							(m) =>
								formatParticipantNameDisplay(m.name) ||
								m.gameID ||
								m.id,
						)
						.join("; ");
				},
			},
		];

		const [colTeamName, ...colsAfterName] = baseColumns;
		const columns: SpreadsheetColumn<T>[] = includeArchived
			? [
					colTeamName,
					{
						header: "Archived",
						widthChars: 10,
						type: "text",
						get: (t) => (archivedTeamIds.has(t.id) ? "Yes" : "No"),
					},
					...colsAfterName,
				]
			: baseColumns;

		if (rows.length === 0) {
			toast.error("Nothing to export for the current search and options.");
			return;
		}

		downloadStructuredSpreadsheet({
			fileBasename: "teams",
			sheetName: "Teams",
			workbookTitle: "Teams export",
			columns,
			rows,
			emptyMessage:
				"No teams match the current view — clear search or add teams.",
		});
		toast.success(
			`Exported ${rows.length} team${rows.length === 1 ? "" : "s"}`,
		);
		setExportDialogOpen(false);
	}, [
		exportIncludeArchived,
		participantPoolMerged,
		participants,
		filteredTeams,
		filteredArchivedTeams,
	]);

	const quickTeamModalProps = {
		step: quickTeamStep,
		unassignedParticipants: unassignedForQuickTeam,
		teamName: quickTeamName,
		setTeamName: setQuickTeamName,
		selectedIds: quickTeamSelected,
		toggleParticipant: toggleQuickTeamParticipant,
		captainId: quickTeamCaptain,
		setCaptainId: setQuickTeamCaptain,
		search: quickTeamSearch,
		setSearch: setQuickTeamSearch,
		onContinue: () => {
			const n = quickTeamName.trim();
			if (!n || quickTeamSelected.size < 1) return;
			setQuickTeamStep(2);
		},
		onClose: resetQuickTeam,
		onBack: () => setQuickTeamStep(1),
		onCreate: handleQuickTeamCreate,
		isSubmitting: quickTeamSubmitting,
		onSuggestFiveByLanes: suggestQuickTeamFiveByLanes,
		suggestedLaneIds: quickTeamSuggestedLaneIds,
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="min-w-0 max-w-prose lg:max-w-none">
					<h1 className="text-2xl font-bold tracking-tight text-balance">
						Teams
					</h1>
					<p className="text-muted-foreground text-pretty">
						Manage teams for the tournament
					</p>
				</div>
				<div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 lg:w-auto">
					{/* Keep table/cards toggle → quick team → add team on one row (order matters). */}
					<div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-2">
						<div className="hidden sm:flex shrink-0 rounded-lg border border-input p-0.5">
							<Button
								variant={view === "table" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setView("table")}
								aria-pressed={view === "table"}
								aria-label="Table view"
							>
								<LayoutList className="size-4" />
							</Button>
							<Button
								variant={view === "cards" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setView("cards")}
								aria-pressed={view === "cards"}
								aria-label="Card view"
							>
								<LayoutGrid className="size-4" />
							</Button>
						</div>
						<Button
							type="button"
							variant="outline"
							className="h-9 shrink-0"
							onClick={openQuickTeam}
							disabled={unassignedParticipants.length === 0}
							aria-label="Create team from unassigned participants"
							title={
								unassignedParticipants.length === 0
									? "No unassigned participants"
									: undefined
							}
						>
							<UsersRound className="size-4 shrink-0" aria-hidden />
							<span className="hidden sm:inline">Quick team</span>
							<span className="sm:hidden">Quick</span>
						</Button>
						<Button className="shrink-0" onClick={openCreate} aria-label="Add team">
							<Plus className="size-4 shrink-0" aria-hidden />
							<span className="hidden sm:inline">Add team</span>
							<span className="sm:hidden">Add</span>
						</Button>
					</div>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All teams</CardTitle>
					<CardDescription>
						{isLoading ? (
							<Skeleton className="h-4 w-28 max-w-[min(100%,7rem)]" />
						) : (
							<>{`${teams?.length ?? 0} teams`}</>
						)}
					</CardDescription>
					{isLoading ? (
						<FxTeamsHeaderSearch />
					) : (
						teams &&
						teams.length > 0 && (
							<div className="relative mt-2">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									placeholder="Search by team name or captain..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-9"
								/>
							</div>
						)
					)}
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<TeamsLoadingSkeleton layout={isMobile ? "cards" : view} />
					) : !teams?.length ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<UsersRound className="size-4" />
								</EmptyMedia>
								<EmptyTitle>No teams yet</EmptyTitle>
								<EmptyDescription>
									Add teams to organize participants
								</EmptyDescription>
							</EmptyHeader>
							<div className="flex flex-wrap justify-center gap-2">
								<Button onClick={openCreate} variant="outline">
									Add first team
								</Button>
								{unassignedParticipants.length > 0 ? (
									<Button type="button" onClick={openQuickTeam}>
										Quick team from unassigned
									</Button>
								) : null}
							</div>
						</Empty>
					) : (isMobile ? "cards" : view) === "table" ? (
						<>
							<DataTable
								columns={getTeamsColumns({
									getCaptainName,
									getMemberCount: getTeamMemberCount,
									getMembers: getTeamMembers,
									onEdit: openEdit,
									onDelete: setArchiveConfirmId,
									onAddMembers: (team) => setAddMembersTeamId(team.id),
								})}
								data={filteredTeams}
								initialSorting={[{ id: "created", desc: true }]}
								emptyMessage={
									search ? `No teams match "${search}"` : "No teams."
								}
								tableClassName="table-fixed min-w-[56rem]"
								tableWrapperClassName="overflow-x-auto"
							/>
							<div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4 mt-4">
								<Link
									to="/app/$id/teams/archived"
									params={{ id: appId }}
									aria-label="Archived Teams"
									className={cn(
										buttonVariants({ variant: "outline", size: "default" }),
										"gap-2",
									)}
								>
									<Archive className="size-4 shrink-0" aria-hidden />
									<span className="hidden sm:inline">Archived Teams</span>
									<span className="sm:hidden">Archived</span>
								</Link>
								<Button
									type="button"
									variant="outline"
									disabled={
										(teams?.length ?? 0) === 0 && archivedTeams.length === 0
									}
									className="gap-2"
									aria-label="Export spreadsheet"
									onClick={() => setExportDialogOpen(true)}
								>
									<FileSpreadsheet className="size-4 shrink-0" aria-hidden />
									<span className="hidden sm:inline">Export spreadsheet</span>
									<span className="sm:hidden">Export</span>
								</Button>
							</div>
						</>
					) : (
						<>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{filteredTeams.map((t) => (
									<TeamCard
										key={t.id}
										team={t}
										captainName={getCaptainName(t.captain)}
										memberCount={getTeamMemberCount(t.id)}
										members={getTeamMembers(t.id)}
										onEdit={openEdit}
										onDelete={setArchiveConfirmId}
										onAddMembers={(team) => setAddMembersTeamId(team.id)}
									/>
								))}
							</div>
							{filteredTeams.length === 0 && search && (
								<p className="py-4 text-center text-sm text-muted-foreground">
									No teams match &quot;{search}&quot;
								</p>
							)}
							<div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
								<Link
									to="/app/$id/teams/archived"
									params={{ id: appId }}
									aria-label="Archived Teams"
									className={cn(
										buttonVariants({ variant: "outline", size: "default" }),
										"gap-2",
									)}
								>
									<Archive className="size-4 shrink-0" aria-hidden />
									<span className="hidden sm:inline">Archived Teams</span>
									<span className="sm:hidden">Archived</span>
								</Link>
								<Button
									type="button"
									variant="outline"
									disabled={
										(teams?.length ?? 0) === 0 && archivedTeams.length === 0
									}
									className="gap-2"
									aria-label="Export spreadsheet"
									onClick={() => setExportDialogOpen(true)}
								>
									<FileSpreadsheet className="size-4 shrink-0" aria-hidden />
									<span className="hidden sm:inline">Export spreadsheet</span>
									<span className="sm:hidden">Export</span>
								</Button>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{isMobile ? (
				<Drawer open={sheetOpen} onOpenChange={setSheetOpen} direction="bottom">
					<DrawerContent className="max-h-[75vh] flex w-full flex-col overflow-hidden">
						<DrawerHeader className="shrink-0 px-4">
							<DrawerTitle>{editingId ? "Edit team" : "Add team"}</DrawerTitle>
						</DrawerHeader>
						<div className="min-h-0 w-full overflow-y-auto overscroll-contain">
							<TeamForm
								key={editingId ?? "create"}
								form={form}
								setForm={setForm}
								editingId={editingId}
								teamMembers={editingId ? getTeamMembers(editingId) : []}
								onClose={() => setSheetOpen(false)}
								onSubmit={handleSubmit}
								isMobile
							/>
						</div>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>{editingId ? "Edit team" : "Add team"}</DialogTitle>
						</DialogHeader>
						<TeamForm
							key={editingId ?? "create"}
							form={form}
							setForm={setForm}
							editingId={editingId}
							teamMembers={editingId ? getTeamMembers(editingId) : []}
							onClose={() => setSheetOpen(false)}
							onSubmit={handleSubmit}
						/>
					</DialogContent>
				</Dialog>
			)}

			{isMobile ? (
				<Drawer
					open={!!addMembersTeamId}
					onOpenChange={(o) => !o && setAddMembersTeamId(null)}
					direction="bottom"
				>
					<DrawerContent className="max-h-[85vh] flex w-full flex-col overflow-hidden">
						<DrawerHeader className="shrink-0">
							<DrawerTitle>
								Add members to {addMembersTeam?.name ?? "team"}
							</DrawerTitle>
						</DrawerHeader>
						<div className="min-h-0 min-w-0 flex-1 w-full overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-4">
							{addMembersTeamId && (
								<AddMembersContent
									unassignedParticipants={unassignedParticipants}
									teamId={addMembersTeamId}
									onAdd={handleAddMember}
									onClose={() => setAddMembersTeamId(null)}
								/>
							)}
						</div>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog
					open={!!addMembersTeamId}
					onOpenChange={(o) => !o && setAddMembersTeamId(null)}
				>
					<DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-xl">
						<DialogHeader className="shrink-0">
							<DialogTitle>
								Add members to {addMembersTeam?.name ?? "team"}
							</DialogTitle>
						</DialogHeader>
						<div className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto px-1">
							{addMembersTeamId && (
								<AddMembersContent
									unassignedParticipants={unassignedParticipants}
									teamId={addMembersTeamId}
									onAdd={handleAddMember}
									onClose={() => setAddMembersTeamId(null)}
								/>
							)}
						</div>
					</DialogContent>
				</Dialog>
			)}

			{isMobile ? (
				<Drawer
					open={quickTeamOpen}
					onOpenChange={(o) => {
						if (!o) resetQuickTeam();
					}}
					direction="bottom"
				>
					<DrawerContent className="flex max-h-[92vh] w-full flex-col overflow-hidden">
						<DrawerHeader className="shrink-0 px-4 text-left">
							<DrawerTitle>
								{quickTeamStep === 1
									? "Create team from unassigned"
									: "Confirm new team"}
							</DrawerTitle>
							{quickTeamStep === 1 ? (
								<p className="pt-1 text-sm text-muted-foreground">
									Name the team, optionally pick a captain, select members, then
									confirm — everyone is assigned in one step.
								</p>
							) : null}
						</DrawerHeader>
						<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 pb-4">
							<QuickTeamFromUnassignedContent {...quickTeamModalProps} />
						</div>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog
					open={quickTeamOpen}
					onOpenChange={(o) => {
						if (!o) resetQuickTeam();
					}}
				>
					<DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-4 overflow-hidden sm:max-w-lg">
						<DialogHeader className="shrink-0 flex flex-col gap-1.5 text-left">
							<DialogTitle>
								{quickTeamStep === 1
									? "Create team from unassigned"
									: "Confirm new team"}
							</DialogTitle>
							{quickTeamStep === 1 ? (
								<DialogDescription>
									Choose a team name, optionally set a captain from your
									selection, pick up to {QUICK_TEAM_MAX_MEMBERS} unassigned
									players, then confirm to create the team and assign everyone at
									once.
								</DialogDescription>
							) : null}
						</DialogHeader>
						<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-1 sm:px-0">
							<QuickTeamFromUnassignedContent {...quickTeamModalProps} />
						</div>
					</DialogContent>
				</Dialog>
			)}

			<Dialog
				open={exportDialogOpen}
				onOpenChange={(open) => {
					setExportDialogOpen(open);
					if (open) setExportIncludeArchived(false);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Export teams</DialogTitle>
						<DialogDescription>
							Download a spreadsheet using the current search. Active teams are
							always included when they match the search.
						</DialogDescription>
					</DialogHeader>
					<div className="flex items-start gap-3">
						<Checkbox
							id="export-teams-include-archived"
							checked={exportIncludeArchived}
							onCheckedChange={(checked) =>
								setExportIncludeArchived(Boolean(checked))
							}
							className="mt-0.5"
						/>
						<div className="grid gap-1.5 leading-none">
							<Label
								htmlFor="export-teams-include-archived"
								className="cursor-pointer font-medium"
							>
								Include archived teams
							</Label>
							<p className="text-sm font-normal leading-snug text-muted-foreground">
								When checked, archived teams that match the same search are
								appended and an &quot;Archived&quot; column is added. Member
								lists include archived participants when this is on.
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setExportDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button type="button" onClick={confirmExportTeams}>
							Export
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={!!archiveConfirmId}
				onOpenChange={(o) => {
					if (!o && !mutations.archive.isPending) setArchiveConfirmId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive team?</AlertDialogTitle>
						<AlertDialogDescription>
							This will hide the team from active lists and unassign all
							members. You can restore the team from the Archived teams page
							(members stay unassigned until you add them again).
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={mutations.archive.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							type="button"
							disabled={mutations.archive.isPending}
							onClick={(e) => {
								e.preventDefault();
								handleArchiveConfirm();
							}}
							className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{mutations.archive.isPending ? (
								<>
									<Loader2
										className="size-4 shrink-0 animate-spin"
										aria-hidden
									/>
									Archiving…
								</>
							) : (
								"Archive"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
