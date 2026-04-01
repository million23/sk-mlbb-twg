"use client";

import { formatRegisteredDate, toRegisteredInstantIso } from "@/lib/registered-date";
import { cn } from "@/lib/utils";

type RegisteredDateCellProps = {
	created?: string;
	className?: string;
	/**
	 * Prepend visually hidden “Date registered” for layouts without a column
	 * header (e.g. cards).
	 */
	announceLabel?: boolean;
};

export function RegisteredDateCell({
	created,
	className,
	announceLabel = false,
}: RegisteredDateCellProps) {
	const iso = toRegisteredInstantIso(created);
	const text = formatRegisteredDate(created);

	if (!iso) {
		return (
			<span
				className={cn("text-sm tabular-nums text-muted-foreground", className)}
			>
				<span className="sr-only">No registration date</span>
				<span aria-hidden="true">{text}</span>
			</span>
		);
	}

	return (
		<time
			dateTime={iso}
			className={cn("text-sm tabular-nums text-muted-foreground", className)}
		>
			{announceLabel ? (
				<>
					<span className="sr-only">Date registered, </span>
					{text}
				</>
			) : (
				text
			)}
		</time>
	);
}
