import type { PlayerRole } from "@/types/__pocketbase-types";

/** Short labels for tooltips / screen readers */
export const LANE_ROLE_LABELS: Record<PlayerRole, string> = {
	mid: "Middle Lane",
	gold: "Gold Lane",
	exp: "Experience Lane",
	support: "Roamer/Support",
	jungle: "Jungler",
};

/**
 * Status lookup returns a comma-joined string; records may be a string or array.
 * Never call `.map` on the raw field — strings have `.length` but no `.map`.
 */
export function preferredLanesList(
	raw: string | string[] | undefined | null,
): string[] {
	if (Array.isArray(raw)) {
		return raw.map((lane) => String(lane).trim()).filter(Boolean);
	}
	if (typeof raw !== "string" || !raw.trim()) return [];
	return raw
		.split(",")
		.map((lane) => lane.trim())
		.filter(Boolean);
}

export function formatPreferredLaneLabels(
	raw: string | string[] | undefined | null,
): string {
	return preferredLanesList(raw)
		.map((lane) =>
			lane in LANE_ROLE_LABELS ? LANE_ROLE_LABELS[lane as PlayerRole] : lane,
		)
		.join(", ");
}

/** Public SVG paths under `public/icons/lanes` */
export const LANE_ICON_SRC: Record<PlayerRole, string> = {
	mid: "/icons/lanes/midlane-icon.svg",
	gold: "/icons/lanes/goldlane-icon.svg",
	exp: "/icons/lanes/explane-icon.svg",
	support: "/icons/lanes/roamer-icon.svg",
	jungle: "/icons/lanes/jungler-icon.svg",
};
