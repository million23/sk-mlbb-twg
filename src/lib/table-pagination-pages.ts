/** 1-based current page, total page count → page numbers and ellipsis markers. */
export function getVisiblePageItems(
	currentPage: number,
	totalPages: number,
): Array<number | "ellipsis"> {
	if (totalPages < 1) return [];
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}
	const p = currentPage;
	if (p <= 4) {
		return [1, 2, 3, 4, 5, "ellipsis", totalPages];
	}
	if (p >= totalPages - 3) {
		return [
			1,
			"ellipsis",
			totalPages - 4,
			totalPages - 3,
			totalPages - 2,
			totalPages - 1,
			totalPages,
		];
	}
	return [1, "ellipsis", p - 1, p, p + 1, "ellipsis", totalPages];
}
