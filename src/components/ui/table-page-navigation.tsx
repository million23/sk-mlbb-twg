"use client";

import { Button } from "@/components/ui/button";
import { getVisiblePageItems } from "@/lib/table-pagination-pages";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type TablePageNavigationProps = {
	/** 1-based */
	page: number;
	pageCount: number;
	onPageChange: (page: number) => void;
	className?: string;
};

export function TablePageNavigation({
	page,
	pageCount,
	onPageChange,
	className,
}: TablePageNavigationProps) {
	if (pageCount < 1) return null;

	const safePage = Math.min(Math.max(1, page), pageCount);
	const items = getVisiblePageItems(safePage, pageCount);
	const canPrev = safePage > 1;
	const canNext = safePage < pageCount;

	return (
		<nav
			aria-label="Pagination"
			className={cn(
				"flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-2",
				className,
			)}
		>
			<Button
				type="button"
				variant="ghost"
				size="lg"
				className="h-9 px-3.5 text-foreground hover:bg-muted/50"
				disabled={!canPrev}
				onClick={() => onPageChange(safePage - 1)}
				aria-label="Go to previous page"
			>
				<ChevronLeft className="size-4 shrink-0" aria-hidden />
				Previous
			</Button>

			<ol className="flex list-none flex-wrap items-center justify-center gap-1.5 sm:gap-2">
				{items.map((item, i) =>
					item === "ellipsis" ? (
						<li
							key={`ellipsis-${String(items[i - 1])}-to-${String(items[i + 1])}`}
							className="flex min-w-8 items-center justify-center px-1 text-sm text-muted-foreground select-none"
							aria-hidden
						>
							...
						</li>
					) : (
						<li key={item}>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className={cn(
									"h-9 min-w-9 px-2.5 font-medium text-foreground hover:bg-muted/50",
									item === safePage &&
										"rounded-md border border-border bg-muted/60 shadow-none hover:bg-muted/80",
								)}
								aria-label={`Page ${item}`}
								aria-current={item === safePage ? "page" : undefined}
								onClick={() => onPageChange(item)}
							>
								{item}
							</Button>
						</li>
					),
				)}
			</ol>

			<Button
				type="button"
				variant="ghost"
				size="lg"
				className="h-9 px-3.5 text-foreground hover:bg-muted/50"
				disabled={!canNext}
				onClick={() => onPageChange(safePage + 1)}
				aria-label="Go to next page"
			>
				Next
				<ChevronRight className="size-4 shrink-0" aria-hidden />
			</Button>
		</nav>
	);
}
