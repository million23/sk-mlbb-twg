import { ParticipantCard } from "@/components/participants/participant-card";
import { LaneRoleIcon } from "@/components/participants/preferred-lane-icons";
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
import { TablePageNavigation } from "@/components/ui/table-page-navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
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
	useArchivedParticipants,
	useParticipantMutations,
	useParticipants,
} from "@/hooks/use-participants";
import { useTeamSuggestions } from "@/hooks/use-team-suggestions";
import { useArchivedTeams, useTeams } from "@/hooks/use-teams";
import { formatBirthdateDisplay, getAge, getAgeBracketLabel } from "@/lib/age";
import { getAvatarUrl } from "@/lib/avatar";
import { LANE_ROLE_LABELS } from "@/lib/lane-role-icons";
import { effectiveParticipantStatus } from "@/lib/participant-display-status";
import { sanitizePhilippineMobileInput } from "@/lib/philippine-mobile";
import { compareRegisteredDesc } from "@/lib/registered-date";
import {
	downloadStructuredSpreadsheet,
	type SpreadsheetColumn,
} from "@/lib/spreadsheet-export";
import {
	cn,
	formatParticipantNameDisplay,
	toTitleCaseWords,
} from "@/lib/utils";
import type { Collections, PlayerRole } from "@/types/pocketbase-types";
import {
	createFileRoute,
	Link,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { format } from "date-fns";
import {
	Archive,
	ArrowDownWideNarrow,
	FileSpreadsheet,
	LayoutGrid,
	LayoutList,
	Loader2,
	Plus,
	Search,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type ParticipantsSearch = {
	edit?: string;
	archive?: string;
};

export const Route = createFileRoute("/app/$id/participants/")({
	validateSearch: (search: Record<string, unknown>): ParticipantsSearch => {
		const rawEdit = search.edit;
		const rawArchive = search.archive;
		return {
			edit:
				typeof rawEdit === "string" && rawEdit.length > 0 ? rawEdit : undefined,
			archive:
				typeof rawArchive === "string" && rawArchive.length > 0
					? rawArchive
					: undefined,
		};
	},
	component: ParticipantsPage,
});

type ParticipantFormData = Partial<
	Omit<Collections["participants"], "id" | "created" | "updated">
>;

const PREFERRED_ROLES: { value: PlayerRole; label: string }[] = [
	{ value: "mid", label: LANE_ROLE_LABELS.mid },
	{ value: "gold", label: LANE_ROLE_LABELS.gold },
	{ value: "exp", label: LANE_ROLE_LABELS.exp },
	{ value: "support", label: LANE_ROLE_LABELS.support },
	{ value: "jungle", label: LANE_ROLE_LABELS.jungle },
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
									const next = [...roles];
									next[i] = (v || "") as PlayerRole;
									setForm((f) => ({ ...f, preferredRoles: next }));
								}}
							>
								<SelectTrigger className="w-full gap-2 px-2">
									<SelectValue placeholder="—">
										{(value: string | null) =>
											value ? (
												<span className="flex min-w-0 items-center gap-2">
													<LaneRoleIcon
														role={value as PlayerRole}
														className="size-5 shrink-0"
													/>
													<span className="truncate text-sm">
														{PREFERRED_ROLES.find((r) => r.value === value)
															?.label ?? value}
													</span>
												</span>
											) : null
										}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">—</SelectItem>
									{PREFERRED_ROLES.filter((r) => !used.includes(r.value)).map(
										(r) => (
											<SelectItem key={r.value} value={r.value}>
												<span className="flex items-center gap-2">
													<LaneRoleIcon
														role={r.value}
														className="size-5 shrink-0"
													/>
													<span>{r.label}</span>
												</span>
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						);
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
	);
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
		if (aUn && bUn) {
			const byDate = compareRegisteredDesc(a, b);
			if (byDate !== 0) return byDate;
			return compareParticipantName(a, b);
		}
		const teamNameCmp = getTeamName(aId).localeCompare(
			getTeamName(bId),
			undefined,
			{ sensitivity: "base" },
		);
		if (teamNameCmp !== 0) return teamNameCmp;
		if (aId !== bId) return aId.localeCompare(bId);
		const byDate = compareRegisteredDesc(a, b);
		if (byDate !== 0) return byDate;
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
		);
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
	);
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
	const { data: archivedParticipantsData } = useArchivedParticipants();
	const archivedParticipants = archivedParticipantsData ?? [];
	const { data: archivedTeams } = useArchivedTeams();
	const { data: teamSuggestions } = useTeamSuggestions();
	const params = useParams({ strict: false });
	const appId = (params as { id?: string })?.id ?? "";
	const { edit, archive } = Route.useSearch();
	const navigate = useNavigate();

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
						: undefined;
			if (!pid) continue;
			const list = map.get(pid) ?? [];
			list.push({
				suggestedTeamId: s.suggestedTeamId,
				suggestedTeamName: s.suggestedTeamName,
				suggestionPriority: s.suggestionPriority,
			});
			map.set(pid, list);
		}
		return map;
	}, [teamSuggestions]);
	const mutations = useParticipantMutations();
	const isMobile = useIsMobile();
	const [view, setView] = useState<"table" | "cards">("table");
	/** Add flow only; edit mode uses `?edit=<id>` in the URL */
	const [addSheetOpen, setAddSheetOpen] = useState(false);
	/** Dialog/drawer visibility — decoupled from `?edit` so URL can clear after close animation */
	const [sheetOpen, setSheetOpen] = useState(false);
	const closingEditRef = useRef(false);
	const clearEditUrlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
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

	const navigateParticipantsSearch = useCallback(
		(
			next:
				| Partial<ParticipantsSearch>
				| ((prev: ParticipantsSearch) => ParticipantsSearch),
		) => {
			void navigate({
				to: "/app/$id/participants/",
				params: { id: appId },
				search:
					typeof next === "function" ? next : (prev) => ({ ...prev, ...next }),
			});
		},
		[navigate, appId],
	);

	/** Matches dialog `duration-100` + small buffer so content stays until exit finishes */
	const EDIT_SHEET_CLOSE_MS = 150;

	const cancelPendingEditUrlClear = useCallback(() => {
		if (clearEditUrlTimeoutRef.current) {
			clearTimeout(clearEditUrlTimeoutRef.current);
			clearEditUrlTimeoutRef.current = null;
		}
		closingEditRef.current = false;
	}, []);

	const clearEditFromUrlAfterAnimation = useCallback(() => {
		if (clearEditUrlTimeoutRef.current) {
			clearTimeout(clearEditUrlTimeoutRef.current);
		}
		clearEditUrlTimeoutRef.current = setTimeout(() => {
			clearEditUrlTimeoutRef.current = null;
			navigateParticipantsSearch({ edit: undefined });
			closingEditRef.current = false;
		}, EDIT_SHEET_CLOSE_MS);
	}, [navigateParticipantsSearch]);

	const lastSyncedEditRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (!edit) {
			lastSyncedEditRef.current = undefined;
			return;
		}
		const p = participants.find((x) => x.id === edit);
		if (!p) return;
		if (lastSyncedEditRef.current === edit) return;
		lastSyncedEditRef.current = edit;
		setForm({
			gameID: p.gameID ?? "",
			name: p.name ?? "",
			contactNumber: sanitizePhilippineMobileInput(p.contactNumber ?? ""),
			area: p.area ?? "",
			birthdate: p.birthdate ?? undefined,
			preferredRoles: p.preferredRoles ?? [],
			status: p.status ?? "unassigned",
			team: p.team,
		});
	}, [edit, participants]);

	useEffect(() => {
		if (!edit || isLoading || isError) return;
		const found = participants.some((p) => p.id === edit);
		if (!found) {
			toast.error("Participant not found");
			cancelPendingEditUrlClear();
			setSheetOpen(false);
			navigateParticipantsSearch({ edit: undefined });
		}
	}, [
		edit,
		participants,
		isLoading,
		isError,
		navigateParticipantsSearch,
		cancelPendingEditUrlClear,
	]);

	useEffect(() => {
		if (!archive || isLoading || isError) return;
		const found = participants.some((p) => p.id === archive);
		if (!found) {
			toast.error("Participant not found");
			navigateParticipantsSearch({ archive: undefined });
		}
	}, [archive, participants, isLoading, isError, navigateParticipantsSearch]);

	useEffect(() => {
		if (edit && !closingEditRef.current) {
			setSheetOpen(true);
		}
	}, [edit]);

	useEffect(() => {
		if (!edit && !addSheetOpen) {
			setSheetOpen(false);
		}
	}, [edit, addSheetOpen]);

	useEffect(() => {
		return () => {
			if (clearEditUrlTimeoutRef.current) {
				clearTimeout(clearEditUrlTimeoutRef.current);
			}
		};
	}, []);

	const openCreate = () => {
		cancelPendingEditUrlClear();
		setSheetOpen(true);
		setAddSheetOpen(true);
		navigateParticipantsSearch({ edit: undefined });
		setForm({
			gameID: "",
			name: "",
			contactNumber: "",
			area: "",
			birthdate: undefined,
			preferredRoles: [],
			status: "unassigned",
			team: undefined,
		});
	};

	const openEdit = (p: Collections["participants"] & { id: string }) => {
		cancelPendingEditUrlClear();
		setAddSheetOpen(false);
		navigateParticipantsSearch({ edit: p.id });
	};

	const closeSheet = () => {
		setSheetOpen(false);
		setAddSheetOpen(false);
		if (edit) {
			closingEditRef.current = true;
			clearEditFromUrlAfterAnimation();
		}
	};

	const handleSheetOpenChange = (open: boolean) => {
		if (!open) closeSheet();
	};

	const handleSubmit = () => {
		const name = (form.name ?? "").trim();
		const gameID = (form.gameID ?? "").trim();
		if (!name && !gameID) {
			toast.error("Enter at least a name or Game ID");
			return;
		}
		const payload = {
			...form,
			contactNumber: sanitizePhilippineMobileInput(form.contactNumber ?? ""),
			preferredRoles: (form.preferredRoles ?? [])
				.filter((r): r is PlayerRole => Boolean(r))
				.slice(0, 3),
		};
		if (edit) {
			mutations.update.mutate({ id: edit, ...payload });
			toast.success("Participant updated");
			setSheetOpen(false);
			closingEditRef.current = true;
			clearEditFromUrlAfterAnimation();
		} else {
			mutations.create.mutate(payload);
			toast.success("Participant added");
			setSheetOpen(false);
			setAddSheetOpen(false);
		}
	};

	const openArchiveConfirm = useCallback(
		(id: string) => {
			navigateParticipantsSearch({ archive: id });
		},
		[navigateParticipantsSearch],
	);

	const closeArchiveConfirm = useCallback(() => {
		navigateParticipantsSearch({ archive: undefined });
	}, [navigateParticipantsSearch]);

	const handleArchiveConfirm = () => {
		if (!archive) return;
		mutations.archive.mutate(archive);
		toast.success("Participant archived");
		navigateParticipantsSearch({ archive: undefined });
	};

	const handleRemoveFromTeamClick = (
		p: Collections["participants"] & { id: string },
	) => {
		setRemoveFromTeamParticipant(p);
	};

	const handleRemoveFromTeamConfirm = () => {
		if (removeFromTeamParticipant) {
			mutations.update.mutate({
				id: removeFromTeamParticipant.id,
				team: "",
				status: "unassigned",
			});
			toast.success("Removed from team");
			setRemoveFromTeamParticipant(null);
		}
	};

	const handleJoinTeam = (participantId: string, teamId: string) => {
		mutations.update.mutateQueued({
			id: participantId,
			team: teamId,
			status: "assigned",
		});
		toast.success("Added to team");
	};

	const getTeamName = useCallback(
		(teamId: string | undefined) =>
			teams?.find((t) => t.id === teamId)?.name ?? "-",
		[teams],
	);

	const getTeamNameIncludingArchived = useCallback(
		(teamId: string | undefined) =>
			teams?.find((t) => t.id === teamId)?.name ??
			archivedTeams?.find((t) => t.id === teamId)?.name ??
			"-",
		[teams, archivedTeams],
	);

	const [search, setSearch] = useState("");
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [exportIncludeArchived, setExportIncludeArchived] = useState(false);
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
			);
		});
	}, [participants, search, getTeamName]);

	const displayedParticipants = useMemo(() => {
		if (participantSort === "team") {
			return sortParticipantsByTeam(filteredParticipants, getTeamName);
		}
		return [...filteredParticipants].sort(compareRegisteredDesc);
	}, [filteredParticipants, participantSort, getTeamName]);

	const filteredArchivedParticipants = useMemo(() => {
		if (!search.trim()) return archivedParticipants;
		const q = search.toLowerCase().trim();
		return archivedParticipants.filter((p) => {
			const name = (p.name ?? "").toLowerCase();
			const gameID = (p.gameID ?? "").toLowerCase();
			const contact = (p.contactNumber ?? "").toLowerCase();
			const contactDigits = (p.contactNumber ?? "").replace(/\D/g, "");
			const qDigits = q.replace(/\D/g, "");
			const area = (p.area ?? "").toLowerCase();
			const teamName = getTeamNameIncludingArchived(p.team).toLowerCase();
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
			);
		});
	}, [archivedParticipants, search, getTeamNameIncludingArchived]);

	const displayedArchivedParticipants = useMemo(() => {
		if (participantSort === "team") {
			return sortParticipantsByTeam(
				filteredArchivedParticipants,
				getTeamNameIncludingArchived,
			);
		}
		return [...filteredArchivedParticipants].sort(compareRegisteredDesc);
	}, [
		filteredArchivedParticipants,
		participantSort,
		getTeamNameIncludingArchived,
	]);

	const confirmExportParticipants = useCallback(() => {
		const includeArchived = exportIncludeArchived;
		const activeRows = displayedParticipants;
		const archivedRows = includeArchived ? displayedArchivedParticipants : [];
		const rows = [...activeRows, ...archivedRows];
		const archivedIds = new Set(archivedRows.map((p) => p.id));
		const teamLookup = includeArchived
			? getTeamNameIncludingArchived
			: getTeamName;

		type P = (typeof rows)[number];
		const baseColumns: SpreadsheetColumn<P>[] = [
			{
				header: "Game ID",
				widthChars: 14,
				type: "text",
				get: (p) => p.gameID ?? "",
			},
			{
				header: "Name",
				widthChars: 28,
				type: "text",
				get: (p) => formatParticipantNameDisplay(p.name) || "",
			},
			{
				header: "Date registered",
				widthChars: 28,
				type: "text",
				get: (p) =>
					p.created ? format(p.created as string, "MMM d, yyyy - hh:mm a") : "",
			},
			{
				header: "Contact",
				widthChars: 16,
				type: "text",
				get: (p) => p.contactNumber ?? "",
			},
			{
				header: "Area",
				widthChars: 36,
				type: "text",
				get: (p) => p.area ?? "",
			},
			{
				header: "Birthday",
				widthChars: 16,
				type: "text",
				get: (p) =>
					p.birthdate ? format(p.birthdate as string, "MMM d, yyyy") : "",
			},
			{
				header: "Status",
				widthChars: 12,
				type: "text",
				get: (p) => effectiveParticipantStatus(p, teams),
			},
			{
				header: "Preferred lanes",
				widthChars: 22,
				type: "text",
				get: (p) =>
					(p.preferredRoles?.filter(Boolean) as PlayerRole[] | undefined)
						?.map((r) => LANE_ROLE_LABELS[r] ?? r)
						.join(", ") ?? "",
			},
			{
				header: "Team",
				widthChars: 24,
				type: "text",
				get: (p) => teamLookup(p.team),
			},
		];

		const columns: SpreadsheetColumn<P>[] = includeArchived
			? [
				...baseColumns.slice(0, 2),
				{
					header: "Archived",
					widthChars: 10,
					type: "text",
					get: (p) => (archivedIds.has(p.id) ? "Yes" : "No"),
				},
				...baseColumns.slice(2),
			]
			: baseColumns;

		if (rows.length === 0) {
			toast.error("Nothing to export for the current search and options.");
			return;
		}

		downloadStructuredSpreadsheet({
			fileBasename: "participants",
			sheetName: "Participants",
			workbookTitle: "Participants export",
			columns,
			rows,
			emptyMessage:
				"No participants match the current view — adjust search or filters.",
		});
		toast.success(
			`Exported ${rows.length} participant${rows.length === 1 ? "" : "s"}`,
		);
		setExportDialogOpen(false);
	}, [
		exportIncludeArchived,
		displayedParticipants,
		displayedArchivedParticipants,
		teams,
		getTeamName,
		getTeamNameIncludingArchived,
	]);

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
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="min-w-0 max-w-prose lg:max-w-none">
					<h1 className="text-2xl font-bold tracking-tight text-balance">
						Participants
					</h1>
					<p className="text-muted-foreground text-pretty">
						Manage registered players for the tournament
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
					<Button
						type="button"
						variant="outline"
						disabled={
							isLoading ||
							(displayedParticipants.length === 0 &&
								archivedParticipants.length === 0)
						}
						className="gap-2"
						aria-label="Export spreadsheet"
						onClick={() => setExportDialogOpen(true)}
					>
						<FileSpreadsheet className="size-4 shrink-0" aria-hidden />
						<span className="hidden sm:inline">Export spreadsheet</span>
						<span className="sm:hidden">Export</span>
					</Button>
					<Button onClick={openCreate} aria-label="Add participant">
						<Plus className="size-4 shrink-0" aria-hidden />
						<span className="hidden sm:inline">Add participant</span>
						<span className="sm:hidden">Add</span>
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
										<SelectItem value="default">
											Date registered (newest first)
										</SelectItem>
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
									onDelete: openArchiveConfirm,
									onRemoveFromTeam: handleRemoveFromTeamClick,
									onJoinTeam: handleJoinTeam,
								})}
								data={displayedParticipants}
								initialSorting={[{ id: "created", desc: true }]}
								tableWrapperClassName="overflow-x-auto"
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
										onDelete={openArchiveConfirm}
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
								<div className="flex flex-col items-center gap-3 border-t border-border pt-4">
									<p className="text-center text-sm text-muted-foreground">
										{displayedParticipants.length} matching
									</p>
									<TablePageNavigation
										page={effectiveCardPage}
										pageCount={cardPageCount}
										onPageChange={setCardPage}
										className="w-full"
									/>
								</div>
							) : null}
						</>
					)}
				</CardContent>
			</Card>

			{isMobile ? (
				<Drawer
					open={sheetOpen}
					onOpenChange={handleSheetOpenChange}
					direction="bottom"
				>
					<DrawerContent className="max-h-[75vh] flex w-full flex-col overflow-hidden">
						<DrawerHeader className="shrink-0 px-4">
							<DrawerTitle>
								{edit ? "Edit participant" : "Add participant"}
							</DrawerTitle>
						</DrawerHeader>
						<div className="min-h-0 w-full overflow-y-auto overscroll-contain">
							<ParticipantForm
								key={edit ?? "create"}
								form={form}
								setForm={setForm}
								editingId={edit ?? null}
								onClose={closeSheet}
								onSubmit={handleSubmit}
								isMobile
							/>
						</div>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog open={sheetOpen} onOpenChange={handleSheetOpenChange}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>
								{edit ? "Edit participant" : "Add participant"}
							</DialogTitle>
						</DialogHeader>
						<ParticipantForm
							key={edit ?? "create"}
							form={form}
							setForm={setForm}
							editingId={edit ?? null}
							onClose={closeSheet}
							onSubmit={handleSubmit}
						/>
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
						<DialogTitle>Export participants</DialogTitle>
						<DialogDescription>
							Download a spreadsheet using the current search and sort. Active
							participants are always included when they match the search.
						</DialogDescription>
					</DialogHeader>
					<div className="flex items-start gap-3">
						<Checkbox
							id="export-participants-include-archived"
							checked={exportIncludeArchived}
							onCheckedChange={(checked) =>
								setExportIncludeArchived(Boolean(checked))
							}
							className="mt-0.5"
						/>
						<div className="grid gap-1.5 leading-none">
							<Label
								htmlFor="export-participants-include-archived"
								className="cursor-pointer font-medium"
							>
								Include archived participants
							</Label>
							<p className="text-sm font-normal leading-snug text-muted-foreground">
								When checked, archived participants that match the same search
								are appended and an &quot;Archived&quot; column is added.
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
						<Button type="button" onClick={confirmExportParticipants}>
							Export
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={!!archive}
				onOpenChange={(o) => !o && closeArchiveConfirm()}
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
	);
}
