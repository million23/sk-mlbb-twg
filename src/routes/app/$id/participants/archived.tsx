import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, RotateCcw, Users } from "lucide-react";
import { toast } from "sonner";
import { ArchivedPagesDropdown } from "@/components/archived-pages-dropdown";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FxArchivedListTwoRows } from "@/lib/loading-placeholders";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	useArchivedParticipants,
	useParticipantMutations,
} from "@/hooks/use-participants";
import { cn, formatParticipantNameDisplay } from "@/lib/utils";

export const Route = createFileRoute("/app/$id/participants/archived")({
	component: ArchivedParticipantsPage,
});

function formatArchivedAt(iso?: string) {
	if (!iso) return "—";
	try {
		return format(new Date(iso), "MMM d, yyyy HH:mm");
	} catch {
		return iso;
	}
}

function ArchivedParticipantsPage() {
	const params = useParams({ strict: false });
	const id = (params as { id?: string })?.id ?? "";
	const { data: archivedParticipants, isLoading } = useArchivedParticipants();
	const mutations = useParticipantMutations();

	const handleRestore = (participantId: string) => {
		mutations.restore.mutate(participantId);
		toast.success("Participant restored");
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0 space-y-1">
					<Link
						to="/app/$id/participants"
						params={{ id }}
						className={cn(
							buttonVariants({ variant: "ghost", size: "sm" }),
							"-ml-2 gap-2",
						)}
					>
						<ArrowLeft className="size-4 shrink-0" aria-hidden />
						Back to participants
					</Link>
					<h1 className="text-2xl font-bold tracking-tight text-balance">
						Archived participants
					</h1>
					<p className="text-muted-foreground">
						Soft-deleted records. Archived time uses last modified (
						<code className="text-xs">updated</code>).
					</p>
				</div>
				<ArchivedPagesDropdown appId={id} current="participants" />
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="size-5 text-muted-foreground" />
						Archived list
					</CardTitle>
					<CardDescription>
						{isLoading
							? "Loading…"
							: `${archivedParticipants?.length ?? 0} archived`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="animate-pulse">
							<FxArchivedListTwoRows />
						</div>
					) : !archivedParticipants?.length ? (
						<p className="text-sm text-muted-foreground">
							No archived participants.
						</p>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name / Game ID</TableHead>
										<TableHead>Archived (last modified)</TableHead>
										<TableHead className="w-[120px] text-right">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{archivedParticipants.map((p) => (
										<TableRow key={p.id}>
											<TableCell className="font-medium">
												{formatParticipantNameDisplay(p.name) || p.gameID || p.id}
											</TableCell>
											<TableCell className="text-muted-foreground tabular-nums text-sm">
												{formatArchivedAt(p.updated)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="gap-2"
													onClick={() => handleRestore(p.id)}
												>
													<RotateCcw className="size-4" />
													Restore
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
