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
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { compareRegisteredDesc } from "@/lib/registered-date";
import { PreferredLaneIcons } from "@/components/participants/preferred-lane-icons";
import { cn, formatParticipantNameDisplay } from "@/lib/utils";
import type { Collections, PlayerRole } from "@/types/pocketbase-types";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
	Archive,
	ChevronDown,
	FileSpreadsheet,
	LayoutGrid,
	LayoutList,
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
			<div className="space-y-4">
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
				<div className="min-w-0 space-y-4">
					{filteredByAge.map((group) => (
						<section key={group.key} className="min-w-0 space-y-1.5">
							<h3 className="sticky top-0 z-[1] border-b border-border/70 bg-background py-2 text-xs font-semibold tracking-wide text-muted-foreground">
								{group.label}
							</h3>
							<ul className="space-y-1">
								{group.items.map((p) => {
									const hasLanes = Boolean(
										p.preferredRoles?.filter(Boolean).length,
									);
									return (
										<li
											key={p.id}
											className="flex min-w-0 max-w-full items-center justify-between gap-2 rounded-lg border px-3 py-2"
										>
											<span className="min-w-0 flex-1 space-y-1">
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
		<div className="w-full space-y-4 px-4 pb-4">
			<div className="space-y-2">
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
					<div className="space-y-2">
						<Label>Captain</Label>
						<CaptainPopover
							value={form.captain ?? ""}
							onChange={(v) => setForm((f) => ({ ...f, captain: v || "" }))}
							teamMembers={teamMembers ?? []}
							triggerLabel={captainLabel}
						/>
					</div>
				) : (
					<div className="space-y-2">
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
								<SelectItem value="">No captain</SelectItem>
								{teamMembers?.map((p) => (
									<SelectItem key={p.id} value={p.id}>
										{(formatParticipantNameDisplay(p.name) || p.gameID) ?? p.id}
									</SelectItem>
								))}
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

function TeamsPage() {
	const params = useParams({ strict: false });
	const appId = (params as { id?: string })?.id ?? "";
	const { data: teams, isLoading } = useTeams();
	const { data: archivedTeamsData } = useArchivedTeams();
	const archivedTeams = archivedTeamsData ?? [];
	const { data: participants } = useParticipants();
	const { data: archivedParticipantsData } = useArchivedParticipants();
	const archivedParticipants = archivedParticipantsData ?? [];
	const mutations = useTeamMutations();
	const participantMutations = useParticipantMutations();
	const isMobile = useIsMobile();
	const [view, setView] = useState<"table" | "cards">("table");
	const [sheetOpen, setSheetOpen] = useState(false);
	const [addMembersTeamId, setAddMembersTeamId] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
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

	const handleArchiveConfirm = () => {
		if (archiveConfirmId) {
			mutations.archive.mutate(archiveConfirmId);
			toast.success("Team archived");
			setArchiveConfirmId(null);
		}
	};

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

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="min-w-0 max-w-prose lg:max-w-none">
					<h1 className="text-2xl font-bold tracking-tight text-balance">
						Teams
					</h1>
					<p className="text-muted-foreground text-pretty">
						Manage teams for the tournament
					</p>
				</div>
				<div className="flex w-full min-w-0 flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">
					<div className="hidden sm:flex rounded-lg border border-input p-0.5">
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
					<Button onClick={openCreate} aria-label="Add team">
						<Plus className="size-4 shrink-0" aria-hidden />
						<span className="hidden sm:inline">Add team</span>
						<span className="sm:hidden">Add</span>
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All teams</CardTitle>
					<CardDescription>{teams?.length ?? 0} teams</CardDescription>
					{teams && teams.length > 0 && (
						<div className="relative mt-2">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								placeholder="Search by team name or captain..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9"
							/>
						</div>
					)}
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Skeleton className="h-64 w-full" />
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
							<Button onClick={openCreate} variant="outline">
								Add first team
							</Button>
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
				onOpenChange={(o) => !o && setArchiveConfirmId(null)}
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
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleArchiveConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Archive
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
