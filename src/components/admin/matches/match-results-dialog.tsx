import { Button } from "@/components/ui/button";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MatchRecord } from "@/hooks/legacy/use-matches";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type MatchResultsValues = {
  scoreA: number;
  scoreB: number;
  winner: string;
};

function teamName(m: MatchRecord, side: "A" | "B"): string {
  const key = side === "A" ? "teamA" : "teamB";
  const id = side === "A" ? m.teamA : m.teamB;
  const expanded = m.expand?.[key];
  return expanded?.name ?? id ?? "TBD";
}

export function MatchResultsDialog({
  open,
  onOpenChange,
  match,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchRecord | null;
  pending?: boolean;
  onSubmit: (values: MatchResultsValues) => Promise<void> | void;
}) {
  const [scoreA, setScoreA] = useState("0");
  const [scoreB, setScoreB] = useState("0");
  const [winner, setWinner] = useState("");

  useEffect(() => {
    if (!open || !match) return;
    setScoreA(String(match.scoreA ?? 0));
    setScoreB(String(match.scoreB ?? 0));
    setWinner(match.winner ?? "");
  }, [open, match]);

  const teamALabel = match ? teamName(match, "A") : "Team A";
  const teamBLabel = match ? teamName(match, "B") : "Team B";
  const bestOfLimit = match?.bestOf ?? 0;
  const headline =
    match?.matchLabel?.trim() ||
    (match ? `${teamALabel} vs ${teamBLabel}` : "");

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="flex max-h-[min(90vh,560px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <ResponsiveModalHeader className="flex flex-col gap-1 border-b border-border px-6 py-4 text-left">
          <ResponsiveModalTitle>Score & winner</ResponsiveModalTitle>
          <ResponsiveModalDescription className="line-clamp-2">
            {headline || "Match result"}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form
          className="flex flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            const parsedScoreA = Math.max(0, Number.parseInt(scoreA, 10) || 0);
            const parsedScoreB = Math.max(0, Number.parseInt(scoreB, 10) || 0);
            if (
              bestOfLimit > 0 &&
              (parsedScoreA > bestOfLimit || parsedScoreB > bestOfLimit)
            ) {
              toast.error(`Score cannot exceed Best of ${bestOfLimit}`);
              return;
            }
            void Promise.resolve(
              onSubmit({
                scoreA: parsedScoreA,
                scoreB: parsedScoreB,
                winner,
              }),
            ).then(() => onOpenChange(false));
          }}
        >
          <div className="flex flex-col gap-4 px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="result-score-a">{teamALabel} — wins</Label>
                <Input
                  id="result-score-a"
                  type="number"
                  min={0}
                  max={bestOfLimit > 0 ? bestOfLimit : undefined}
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="result-score-b">{teamBLabel} — wins</Label>
                <Input
                  id="result-score-b"
                  type="number"
                  min={0}
                  max={bestOfLimit > 0 ? bestOfLimit : undefined}
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="result-winner">Winner</Label>
              <Select
                value={winner || "__none__"}
                onValueChange={(v) =>
                  setWinner(v === "__none__" || v == null ? "" : v)
                }
              >
                <SelectTrigger id="result-winner" className="w-full">
                  <SelectValue placeholder="Winner">
                    {(value) =>
                      value && value !== "__none__"
                        ? value === match?.teamA
                          ? teamALabel
                          : value === match?.teamB
                            ? teamBLabel
                            : value
                        : "None"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="__none__">None</SelectItem>
                    {match?.teamA ? (
                      <SelectItem value={match.teamA}>{teamALabel}</SelectItem>
                    ) : null}
                    {match?.teamB ? (
                      <SelectItem value={match.teamB}>{teamBLabel}</SelectItem>
                    ) : null}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Only the two sides in this match are listed. Clear winner with
                &quot;None&quot;.
              </p>
            </div>
          </div>

          <ResponsiveModalFooter className="mx-0! mb-0! mt-auto shrink-0 flex-col-reverse gap-3 border-t border-border bg-muted/40 px-6 pt-4 pb-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !match}>
              {pending ? "Saving…" : "Save result"}
            </Button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
