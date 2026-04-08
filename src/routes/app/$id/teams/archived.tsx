import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, RotateCcw, UsersRound } from "lucide-react";
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
import { useArchivedTeams, useTeamMutations } from "@/hooks/use-teams";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/$id/teams/archived")({
	component: ArchivedTeamsPage,
});

function formatArchivedAt(iso?: string) {
	if (!iso) return "—";
	try {
		return format(new Date(iso), "MMM d, yyyy HH:mm");
	} catch {
		return iso;
	}
}

function ArchivedTeamsPage() {
	const params = useParams({ strict: false });
	const id = (params as { id?: string })?.id ?? "";
	const { data: archivedTeams, isLoading } = useArchivedTeams();
	const mutations = useTeamMutations();

	const handleRestore = (teamId: string) => {
		mutations.restore.mutate(teamId);
		toast.success("Team restored");
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0 space-y-1">
					<Link
						to="/app/$id/teams"
						params={{ id }}
						className={cn(
							buttonVariants({ variant: "ghost", size: "sm" }),
							"-ml-2 gap-2",
						)}
					>
						<ArrowLeft className="size-4 shrink-0" aria-hidden />
						Back to teams
					</Link>
					<h1 className="text-2xl font-bold tracking-tight text-balance">
						Archived teams
					</h1>
					<p className="text-muted-foreground">
						Soft-deleted teams. Archived time uses last modified (
						<code className="text-xs">updated</code>). Members were unassigned
						when the team was archived.
					</p>
				</div>
				<ArchivedPagesDropdown appId={id} current="teams" />
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UsersRound className="size-5 text-muted-foreground" />
						Archived list
					</CardTitle>
					<CardDescription>
						{isLoading
							? "Loading…"
							: `${archivedTeams?.length ?? 0} archived`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="animate-pulse">
							<FxArchivedListTwoRows />
						</div>
					) : !archivedTeams?.length ? (
						<p className="text-sm text-muted-foreground">No archived teams.</p>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Team</TableHead>
										<TableHead>Archived (last modified)</TableHead>
										<TableHead className="w-[120px] text-right">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{archivedTeams.map((t) => (
										<TableRow key={t.id}>
											<TableCell className="font-medium">
												{t.name ?? t.id}
											</TableCell>
											<TableCell className="text-muted-foreground tabular-nums text-sm">
												{formatArchivedAt(t.updated)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													type="button"
													variant="outline"
													size="sm"
													className="gap-2"
													onClick={() => handleRestore(t.id)}
												>
													<RotateCcw className="size-4 shrink-0" aria-hidden />
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
