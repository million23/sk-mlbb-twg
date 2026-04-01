import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LANE_ICON_SRC, LANE_ROLE_LABELS } from "@/lib/lane-role-icons";
import type { PlayerRole } from "@/types/pocketbase-types";

/** White-filled lane SVGs: invert on light backgrounds, normal on dark */
const laneImgClass =
	"object-contain invert opacity-90 dark:invert-0 dark:opacity-100";

export function LaneRoleIcon({
	role,
	className,
}: {
	role: PlayerRole;
	className?: string;
}) {
	const label = LANE_ROLE_LABELS[role];
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<button
						type="button"
						className="inline-flex shrink-0 cursor-default touch-manipulation border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						aria-label={label}
					/>
				}
			>
				<img
					src={LANE_ICON_SRC[role]}
					alt=""
					aria-hidden
					className={cn("size-5 shrink-0", laneImgClass, className)}
				/>
			</TooltipTrigger>
			<TooltipContent side="top">{label}</TooltipContent>
		</Tooltip>
	);
}

export function PreferredLaneIcons({
	roles,
	className,
	iconClassName,
}: {
	roles?: PlayerRole[] | null;
	className?: string;
	iconClassName?: string;
}) {
	const list = roles?.filter(Boolean) ?? [];
	if (!list.length) {
		return (
			<span className="text-muted-foreground tabular-nums">
				<span className="sr-only">No preferred lanes</span>
				<span aria-hidden>—</span>
			</span>
		);
	}
	return (
		<span className={cn("inline-flex items-center gap-1", className)}>
			{list.map((r) => (
				<LaneRoleIcon key={r} role={r} className={iconClassName} />
			))}
		</span>
	);
}
