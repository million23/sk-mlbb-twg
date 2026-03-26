import { ParticipantCard } from "@/components/participants/participant-card";
import { getParticipantsColumns } from "@/components/tables/participants-columns";
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
import { GeneratedAvatar } from "@/components/ui/avatar";
import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
	Dialog,
	DialogContent,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { AGE_BRACKETS } from "@/config/age-brackets";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	useParticipantMutations,
	useParticipants,
} from "@/hooks/use-participants";
import { useTeamSuggestions } from "@/hooks/use-team-suggestions";
import { useTeams } from "@/hooks/use-teams";
import { formatBirthdateDisplay, getAge, getAgeBracketLabel } from "@/lib/age";
import { getAvatarUrl } from "@/lib/avatar";
import { sanitizePhilippineMobileInput } from "@/lib/philippine-mobile";
import {
	cn,
	formatParticipantNameDisplay,
	toTitleCaseWords,
} from "@/lib/utils";
import type { Collections, PlayerRole } from "@/types/pocketbase-types";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
	Archive,
	ArrowDownWideNarrow,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	LayoutGrid,
	LayoutList,
	Loader2,
	Plus,
	Search,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$id/participants/")({
	component: ParticipantsPage,
});

type ParticipantFormData = Partial<
	Omit<Collections["participants"], "id" | "created" | "updated">
>;

const PREFERRED_ROLES: { value: PlayerRole; label: string }[] = [
	{ value: "mid", label: "Mid" },
	{ value: "gold", label: "Gold" },
	{ value: "exp", label: "Exp" },
	{ value: "support", label: "Support" },
	{ value: "jungle", label: "Jungle" },
];

function ParticipantForm({
	form,
	setForm,
	editingId,
	onClose,
	onSubmit,
}: {
	form: ParticipantFormData;
	setForm: React.Dispatch<React.SetStateAction<ParticipantFormData>>;
	editingId: string | null;
	onClose: () => void;
	onSubmit: () => void;
	isMobile?: boolean;
}) {
	return (
		<div className="w-full space-y-4 px-4 pb-4">
			{editingId && (
				<div className="flex justify-center pb-2">
					<GeneratedAvatar
						className="size-16"
						src={getAvatarUrl(editingId)}
						alt={formatParticipantNameDisplay(form.name) || form.gameID || ""}
					/>
				</div>
			)}
			<div className="space-y-2">
				<Label htmlFor="gameID">Game ID</Label>
				<Input
					id="gameID"
					value={form.gameID ?? ""}
					onChange={(e) => setForm((f) => ({ ...f, gameID: e.target.value }))}
					placeholder="e.g. 123456789"
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					value={form.name ?? ""}
					onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
					onBlur={() =>
						setForm((f) => ({
							...f,
							name: toTitleCaseWords(f.name ?? ""),
						}))
					}
					placeholder="Full name"
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="contact">Contact number</Label>
				<Input
					id="contact"
					type="tel"
					inputMode="tel"
					autoComplete="tel"
					value={form.contactNumber ?? ""}
					onChange={(e) =>
						setForm((f) => ({
							...f,
							contactNumber: sanitizePhilippineMobileInput(e.target.value),
						}))
					}
					placeholder="09XX-XXX-XXXX"
					className="tabular-nums"
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="area">Area</Label>
				<Input
					id="area"
					value={form.area ?? ""}
					onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
					placeholder="Barangay / area"
				/>
			</div>
			<div className="w-full space-y-2">
				<Label htmlFor="birthdate">Birthday</Label>
				<BirthdayPicker
					id="birthdate"
					value={form.birthdate ?? ""}
					onChange={(v) =>
						setForm((f) => ({ ...f, birthdate: v || undefined }))
					}
				/>
			</div>
			<div className="space-y-2">
				<Label>Preferred lanes (1st, 2nd, 3rd)</Label>
				<div className="grid grid-cols-3 gap-2">
					{[0, 1, 2].map((i) => {
						const roles = form.preferredRoles ?? [];
						const used = roles.filter((r, j) => j !== i && r);
						return (
							<Select
								key={i}
								value={roles[i] ?? ""}
								onValueChange={(v) => {
									const next = [...roles]
									next[i] = (v || "") as PlayerRole;
									setForm((f) => ({ ...f, preferredRoles: next }));
								}}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="—">
										{(value: string | null) =>
											value
												? (PREFERRED_ROLES.find((r) => r.value === value)
													?.label ?? value)
												: null
										}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">—</SelectItem>
									{PREFERRED_ROLES.filter((r) => !used.includes(r.value)).map(
										(r) => (
											<SelectItem key={r.value} value={r.value}>
												{r.label}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						)
					})}
				</div>
			</div>
			<div className="flex gap-2 pt-4">
				<Button onClick={onSubmit} className="flex-1">
					{editingId ? "Save" : "Add"}
				</Button>
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
			</div>
		</div>
	)
}

type TeamSuggestion = {
	suggestedTeamId?: string;
	suggestedTeamName?: string;
	suggestionPriority?: string;
};

type ParticipantRow = Collections["participants"] & { id: string };

function compareParticipantName(a: ParticipantRow, b: ParticipantRow): number {
	const na = (
		formatParticipantNameDisplay(a.name) ||
		a.gameID ||
		""
	).toLowerCase();
	const nb = (
		formatParticipantNameDisplay(b.name) ||
		b.gameID ||
		""
	).toLowerCase();
	return na.localeCompare(nb, undefined, { sensitivity: "base" });
}

function sortParticipantsByTeam(
	list: ParticipantRow[],
	getTeamName: (teamId: string | undefined) => string,
): ParticipantRow[] {
	return [...list].sort((a, b) => {
		const aId = a.team?.trim() || "";
		const bId = b.team?.trim() || "";
		const aUn = !aId;
		const bUn = !bId;
		if (aUn !== bUn) return aUn ? 1 : -1;
		if (aUn && bUn) return compareParticipantName(a, b);
		const teamNameCmp = getTeamName(aId).localeCompare(
			getTeamName(bId),
			undefined,
			{ sensitivity: "base" },
		)
		if (teamNameCmp !== 0) return teamNameCmp;
		if (aId !== bId) return aId.localeCompare(bId);
		return compareParticipantName(a, b);
	});
}

const CARDS_PER_PAGE = 20;

const PARTICIPANTS_CARD_SKELETON_KEYS = [
	"pc1",
	"pc2",
	"pc3",
	"pc4",
	"pc5",
	"pc6",
] as const;

const PARTICIPANTS_TABLE_SKELETON_KEYS = [
	"pr1",
	"pr2",
	"pr3",
	"pr4",
	"pr5",
	"pr6",
	"pr7",
	"pr8",
] as const;

function ParticipantsLoadingSkeleton({
	layout,
}: {
	layout: "table" | "cards";
}) {
	if (layout === "cards") {
		return (
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{PARTICIPANTS_CARD_SKELETON_KEYS.map((key) => (
					<div
						key={key}
						className="rounded-xl border border-border bg-card p-4 shadow-sm"
					>
						<div className="flex gap-3">
							<Skeleton className="size-14 shrink-0 rounded-lg" />
							<div className="min-w-0 flex-1 space-y-2 pt-0.5">
								<Skeleton className="h-4 w-[72%] max-w-[200px]" />
								<Skeleton className="h-3 w-20 rounded-full" />
							</div>
						</div>
						<div className="mt-4 space-y-2.5">
							<div className="flex items-center gap-2">
								<Skeleton className="size-4 shrink-0 rounded" />
								<Skeleton className="h-3 flex-1" />
							</div>
							<div className="flex items-center gap-2">
								<Skeleton className="size-4 shrink-0 rounded" />
								<Skeleton className="h-3 w-[85%]" />
							</div>
							<div className="flex items-center gap-2">
								<Skeleton className="size-4 shrink-0 rounded" />
								<Skeleton className="h-3 w-[60%]" />
							</div>
						</div>
					</div>
				))}
			</div>
		)
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="w-12 py-3">
							<span className="sr-only">Avatar</span>
						</TableHead>
						<TableHead className="py-3">
							<Skeleton className="h-3.5 w-14" />
						</TableHead>
						<TableHead className="py-3">
							<Skeleton className="h-3.5 w-12" />
						</TableHead>
						<TableHead className="py-3">
							<Skeleton className="h-3.5 w-16" />
						</TableHead>
						<TableHead className="py-3">
							<Skeleton className="h-3.5 w-20" />
						</TableHead>
						<TableHead className="py-3">
							<Skeleton className="h-3.5 w-14" />
						</TableHead>
						<TableHead className="py-3">
							<Skeleton className="h-3.5 w-24" />
						</TableHead>
						<TableHead className="py-3">
							<Skeleton className="h-3.5 w-12" />
						</TableHead>
						<TableHead className="w-[120px] py-3">
							<span className="sr-only">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{PARTICIPANTS_TABLE_SKELETON_KEYS.map((rowKey, row) => (
						<TableRow
							key={rowKey}
							className={cn(
								row % 2 === 1 && "bg-muted/20",
								"hover:bg-transparent",
							)}
						>
							<TableCell>
								<Skeleton className="size-8 rounded-full" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-24" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-28" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-28" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-32" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-5 w-20 rounded-full" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-24" />
							</TableCell>
							<TableCell>
								<Skeleton className="h-4 w-20" />
							</TableCell>
							<TableCell>
								<div className="flex gap-1">
									<Skeleton className="size-8 rounded-md" />
									<Skeleton className="size-8 rounded-md" />
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}

function ParticipantsPage() {
	const {
		data: participantsData,
		isLoading,
		isError,
		error,
		refetch,
	} = useParticipants();

	const participants = participantsData ?? [];
	const totalRegistered = participants.length;

	const { data: teams } = useTeams();
	const { data: teamSuggestions } = useTeamSuggestions();
	const params = useParams({ strict: false });
	const appId = (params as { id?: string })?.id ?? "";

	const suggestionsByParticipant = useMemo(() => {
		const map = new Map<string, TeamSuggestion[]>();
		for (const s of teamSuggestions ?? []) {
			const participantRef = s.participantId as unknown;
			const pid =
				typeof participantRef === "string"
					? participantRef
					: participantRef &&
						typeof participantRef === "object" &&
						"id" in participantRef &&
						typeof (participantRef as { id?: unknown }).id === "string"
						? (participantRef as { id: string }).id
						: undefined
			if (!pid) continue;
			const list = map.get(pid) ?? [];
			list.push({
				suggestedTeamId: s.suggestedTeamId,
				suggestedTeamName: s.suggestedTeamName,
				suggestionPriority: s.suggestionPriority,
			})
			map.set(pid, list);
		}
		return map;
	}, [teamSuggestions]);
	const mutations = useParticipantMutations();
	const isMobile = useIsMobile();
	const [view, setView] = useState<"table" | "cards">("table");
	const [sheetOpen, setSheetOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(
		null,
	)
	const [removeFromTeamParticipant, setRemoveFromTeamParticipant] = useState<
		(Collections["participants"] & { id: string }) | null
	>(null);
	const [form, setForm] = useState<ParticipantFormData>({
		gameID: "",
		name: "",
		contactNumber: "",
		area: "",
		birthdate: undefined,
		preferredRoles: [],
		status: "unassigned",
	});

	const openCreate = () => {
		setEditingId(null);
		setForm({
			gameID: "",
			name: "",
			contactNumber: "",
			area: "",
			birthdate: undefined,
			preferredRoles: [],
			status: "unassigned",
			team: undefined,
		})
		setSheetOpen(true);
	}

	const openEdit = (p: Collections["participants"] & { id: string }) => {
		setEditingId(p.id);
		setForm({
			gameID: p.gameID ?? "",
			name: p.name ?? "",
			contactNumber: sanitizePhilippineMobileInput(p.contactNumber ?? ""),
			area: p.area ?? "",
			birthdate: p.birthdate ?? undefined,
			preferredRoles: p.preferredRoles ?? [],
			status: p.status ?? "unassigned",
			team: p.team,
		})
		setSheetOpen(true);
	}

	const handleSubmit = () => {
		const name = (form.name ?? "").trim();
		const gameID = (form.gameID ?? "").trim();
		if (!name && !gameID) {
			toast.error("Enter at least a name or Game ID");
			return
		}
		const payload = {
			...form,
			contactNumber: sanitizePhilippineMobileInput(form.contactNumber ?? ""),
			preferredRoles: (form.preferredRoles ?? [])
				.filter((r): r is PlayerRole => Boolean(r))
				.slice(0, 3),
		}
		if (editingId) {
			mutations.update.mutate({ id: editingId, ...payload });
			toast.success("Participant updated");
		} else {
			mutations.create.mutate(payload);
			toast.success("Participant added");
		}
		setSheetOpen(false);
	}

	const handleArchiveConfirm = () => {
		if (archiveConfirmId) {
			mutations.archive.mutate(archiveConfirmId);
			toast.success("Participant archived");
			setArchiveConfirmId(null);
		}
	}

	const handleRemoveFromTeamClick = (
		p: Collections["participants"] & { id: string },
	) => {
		setRemoveFromTeamParticipant(p);
	}

	const handleRemoveFromTeamConfirm = () => {
		if (removeFromTeamParticipant) {
			mutations.update.mutate({
				id: removeFromTeamParticipant.id,
				team: "",
				status: "unassigned",
			})
			toast.success("Removed from team");
			setRemoveFromTeamParticipant(null);
		}
	}

	const handleJoinTeam = (participantId: string, teamId: string) => {
		mutations.update.mutateQueued({
			id: participantId,
			team: teamId,
			status: "assigned",
		})
		toast.success("Added to team");
	}

	const getTeamName = useCallback(
		(teamId: string | undefined) =>
			teams?.find((t) => t.id === teamId)?.name ?? "-",
		[teams],
	)

	const [search, setSearch] = useState("");
	const [participantSort, setParticipantSort] = useState<"default" | "team">(
		"default",
	);
	const [cardPage, setCardPage] = useState(1);

	const filteredParticipants = useMemo(() => {
		if (!search.trim()) return participants;
		const q = search.toLowerCase().trim();
		return participants.filter((p) => {
			const name = (p.name ?? "").toLowerCase();
			const gameID = (p.gameID ?? "").toLowerCase();
			const contact = (p.contactNumber ?? "").toLowerCase();
			const contactDigits = (p.contactNumber ?? "").replace(/\D/g, "");
			const qDigits = q.replace(/\D/g, "");
			const area = (p.area ?? "").toLowerCase();
			const teamName = getTeamName(p.team).toLowerCase();
			const age = getAge(p.birthdate);
			const ageStr = age !== null ? String(age) : "";
			const bracket = getAgeBracketLabel(age, AGE_BRACKETS).toLowerCase();
			const birthdateStr = (
				formatBirthdateDisplay(p.birthdate) ?? ""
			).toLowerCase();
			return (
				name.includes(q) ||
				gameID.includes(q) ||
				contact.includes(q) ||
				(qDigits.length > 0 && contactDigits.includes(qDigits)) ||
				area.includes(q) ||
				teamName.includes(q) ||
				ageStr.includes(q) ||
				bracket.includes(q) ||
				birthdateStr.includes(q)
			)
		})
	}, [participants, search, getTeamName]);

	const displayedParticipants = useMemo(() => {
		if (participantSort !== "team") return filteredParticipants;
		return sortParticipantsByTeam(filteredParticipants, getTeamName);
	}, [filteredParticipants, participantSort, getTeamName]);

	const cardPageCount = Math.max(
		1,
		Math.ceil(displayedParticipants.length / CARDS_PER_PAGE),
	);
	const effectiveCardPage = Math.min(cardPage, cardPageCount);

	useEffect(() => {
		setCardPage((p) => Math.min(p, cardPageCount));
	}, [cardPageCount]);

	const pagedCardParticipants = useMemo(() => {
		const start = (effectiveCardPage - 1) * CARDS_PER_PAGE;
		return displayedParticipants.slice(start, start + CARDS_PER_PAGE);
	}, [displayedParticipants, effectiveCardPage]);

	const showEmptyState = !isLoading && !isError && totalRegistered === 0;
	const loadErrorMessage =
		error instanceof Error ? error.message : error ? String(error) : null;
	const initialQueryFailed = isError && !participantsData;

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<h1 className="text-2xl font-bold tracking-tight text-balance">
						Participants
					</h1>
					<p className="text-muted-foreground">
						Manage registered players for the tournament
					</p>
				</div>
				<div className="flex items-center gap-2">
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
					<Link
						to="/app/$id/participants/archived"
						params={{ id: appId }}
						className={cn(
							buttonVariants({ variant: "outline", size: "default" }),
							"gap-2",
						)}
					>
						<Archive className="size-4 shrink-0" aria-hidden />
						Archived
					</Link>
					<Button onClick={openCreate}>
						<Plus className="size-4" />
						Add participant
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All participants</CardTitle>
					<CardDescription>
						{isLoading ? (
							<span className="inline-flex items-center gap-2 text-muted-foreground">
								<Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
								Loading participants…
							</span>
						) : (
							<>{`${totalRegistered} registered`}</>
						)}
					</CardDescription>
					{isLoading ? (
						<div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
							<Skeleton className="h-9 w-full flex-1 rounded-md" />
							<div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-[min(100%,14rem)]">
								<Skeleton className="h-3 w-8" />
								<Skeleton className="h-9 w-full rounded-md" />
							</div>
						</div>
					) : null}
					{!isLoading && totalRegistered > 0 && (
						<div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
							<div className="relative min-w-0 flex-1">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									placeholder="Search by name, Game ID, contact, area, age..."
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										setCardPage(1);
									}}
									className="pl-9"
								/>
							</div>
							<div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-[min(100%,14rem)]">
								<Label
									htmlFor="participant-sort"
									className="text-xs text-muted-foreground"
								>
									Sort
								</Label>
								<Select
									value={participantSort}
									onValueChange={(v) => {
										setParticipantSort(v as "default" | "team");
										setCardPage(1);
									}}
								>
									<SelectTrigger id="participant-sort" className="w-full">
										<ArrowDownWideNarrow
											className="size-4 shrink-0 text-muted-foreground"
											aria-hidden
										/>
										<SelectValue placeholder="Order" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="default">Default order</SelectItem>
										<SelectItem value="team">By team</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					)}
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<output
							aria-live="polite"
							aria-busy="true"
							className="block space-y-2"
						>
							<span className="sr-only">Loading participants</span>
							<ParticipantsLoadingSkeleton layout={isMobile ? "cards" : view} />
						</output>
					) : initialQueryFailed ? (
						<div className="flex flex-col items-center gap-3 py-8">
							<p className="text-center text-sm text-destructive">
								{loadErrorMessage ?? "Could not load participants."}
							</p>
							<Button
								variant="outline"
								size="sm"
								type="button"
								onClick={() => void refetch()}
							>
								Retry
							</Button>
						</div>
					) : showEmptyState ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Users className="size-4" />
								</EmptyMedia>
								<EmptyTitle>No participants yet</EmptyTitle>
								<EmptyDescription>
									Add participants to start building teams
								</EmptyDescription>
							</EmptyHeader>
							<Button onClick={openCreate} variant="outline">
								Add first participant
							</Button>
						</Empty>
					) : (isMobile ? "cards" : view) === "table" ? (
						<>
							<DataTable
								columns={getParticipantsColumns({
									teams,
									getTeamName,
									suggestionsByParticipant,
									onEdit: openEdit,
									onDelete: setArchiveConfirmId,
									onRemoveFromTeam: handleRemoveFromTeamClick,
									onJoinTeam: handleJoinTeam,
								})}
								data={displayedParticipants}
								emptyMessage={
									search
										? `No participants match "${search}"`
										: "No participants."
								}
							/>
						</>
					) : (
						<>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{pagedCardParticipants.map((p) => (
									<ParticipantCard
										key={p.id}
										participant={p}
										teamName={getTeamName(p.team)}
										teams={teams}
										suggestions={suggestionsByParticipant.get(p.id) ?? []}
										onEdit={openEdit}
										onDelete={setArchiveConfirmId}
										onRemoveFromTeam={handleRemoveFromTeamClick}
										onJoinTeam={handleJoinTeam}
									/>
								))}
							</div>
							{filteredParticipants.length === 0 && search && (
								<p className="py-4 text-center text-sm text-muted-foreground">
									No participants match &quot;{search}&quot;
								</p>
							)}
							{displayedParticipants.length > CARDS_PER_PAGE ? (
								<div className="flex flex-col items-center gap-3 border-t border-border pt-4 sm:flex-row sm:justify-between">
									<p className="text-sm text-muted-foreground">
										Page {effectiveCardPage} of {cardPageCount} ·{" "}
										{displayedParticipants.length} matching
									</p>
									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="hidden size-8 sm:inline-flex"
											aria-label="First page"
											disabled={effectiveCardPage <= 1}
											onClick={() => setCardPage(1)}
										>
											<ChevronsLeft className="size-4" />
										</Button>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="size-8"
											aria-label="Previous page"
											disabled={effectiveCardPage <= 1}
											onClick={() => setCardPage((p) => Math.max(1, p - 1))}
										>
											<ChevronLeft className="size-4" />
										</Button>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="size-8"
											aria-label="Next page"
											disabled={effectiveCardPage >= cardPageCount}
											onClick={() =>
												setCardPage((p) => Math.min(cardPageCount, p + 1))
											}
										>
											<ChevronRight className="size-4" />
										</Button>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="hidden size-8 sm:inline-flex"
											aria-label="Last page"
											disabled={effectiveCardPage >= cardPageCount}
											onClick={() => setCardPage(cardPageCount)}
										>
											<ChevronsRight className="size-4" />
										</Button>
									</div>
								</div>
							) : null}
						</>
					)}
				</CardContent>
			</Card>

			{isMobile ? (
				<Drawer open={sheetOpen} onOpenChange={setSheetOpen} direction="bottom">
					<DrawerContent className="max-h-[75vh] flex w-full flex-col overflow-hidden">
						<DrawerHeader className="shrink-0 px-4">
							<DrawerTitle>
								{editingId ? "Edit participant" : "Add participant"}
							</DrawerTitle>
						</DrawerHeader>
						<div className="min-h-0 w-full overflow-y-auto overscroll-contain">
							<ParticipantForm
								key={editingId ?? "create"}
								form={form}
								setForm={setForm}
								editingId={editingId}
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
							<DialogTitle>
								{editingId ? "Edit participant" : "Add participant"}
							</DialogTitle>
						</DialogHeader>
						<ParticipantForm
							key={editingId ?? "create"}
							form={form}
							setForm={setForm}
							editingId={editingId}
							onClose={() => setSheetOpen(false)}
							onSubmit={handleSubmit}
						/>
					</DialogContent>
				</Dialog>
			)}

			<AlertDialog
				open={!!archiveConfirmId}
				onOpenChange={(o) => !o && setArchiveConfirmId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive participant?</AlertDialogTitle>
						<AlertDialogDescription>
							This will hide the participant from active lists and remove them
							from any team. The record stays in the database with archived set
							to true. You can restore them from the Archived participants page.
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

			<AlertDialog
				open={!!removeFromTeamParticipant}
				onOpenChange={(o) => !o && setRemoveFromTeamParticipant(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove from team?</AlertDialogTitle>
						<AlertDialogDescription>
							Remove{" "}
							{(formatParticipantNameDisplay(removeFromTeamParticipant?.name) ||
								removeFromTeamParticipant?.gameID) ??
								"this participant"}{" "}
							from{" "}
							{removeFromTeamParticipant?.team
								? getTeamName(removeFromTeamParticipant.team)
								: "their team"}
							? They will become unassigned.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRemoveFromTeamConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
