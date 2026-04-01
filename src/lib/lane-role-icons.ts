import type { PlayerRole } from "@/types/pocketbase-types";

/** Short labels for tooltips / screen readers */
export const LANE_ROLE_LABELS: Record<PlayerRole, string> = {
	mid: "Middle Lane",
	gold: "Gold Lane",
	exp: "Experience Lane",
	support: "Roamer/Support",
	jungle: "Jungler",
};

/** Public SVG paths under `public/icons/lanes` */
export const LANE_ICON_SRC: Record<PlayerRole, string> = {
	mid: "/icons/lanes/midlane-icon.svg",
	gold: "/icons/lanes/goldlane-icon.svg",
	exp: "/icons/lanes/explane-icon.svg",
	support: "/icons/lanes/roamer-icon.svg",
	jungle: "/icons/lanes/jungler-icon.svg",
};
