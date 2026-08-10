import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SK_BRACKET_COUNT,
  SK_TEAMS_PER_BRACKET,
  type AutoMatchPreview,
  type AutoMatchPreviewRow,
  type AutoMatchTeam,
  buildBracketAutoMatchPreview,
} from "@/lib/admin/auto-matches";
import { Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type AutoMatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: AutoMatchTeam[];
  highestOrder: number;
  defaultBestOf?: number;
  /** Equal brackets to fill (SK default 4). Team count must be a multiple. */
  bracketCount?: number;
  pending?: boolean;
  onConfirm: (preview: AutoMatchPreview) => Promise<void> | void;
  /** When set, show this preview instead of generating Round 1 from teams. */
  seedPreview?: AutoMatchPreview | null;
  title?: string;
  description?: string;
  /** Custom reshuffle (advance / playoffs). Defaults to Round-1 bracket shuffle. */
  onShufflePreview?: () =>
    | { ok: true; preview: AutoMatchPreview }
    | { ok: false; error: string };
};

export function AutoMatchDialog({
  open,
  onOpenChange,
  teams,
  highestOrder,
  defaultBestOf = 3,
  bracketCount = SK_BRACKET_COUNT,
  pending,
  onConfirm,
  seedPreview = null,
  title = "Auto match preview",
  description,
  onShufflePreview,
}: AutoMatchDialogProps) {
  const [preview, setPreview] = useState<AutoMatchPreview | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const seeded = seedPreview != null;

  const makeRound1Preview = () =>
    buildBracketAutoMatchPreview({
      teams,
      bracketCount,
      highestOrder,
      defaultBestOf,
    });

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setBootError(null);
      return;
    }
    if (seedPreview) {
      setPreview(seedPreview);
      setBootError(null);
      return;
    }
    const next = makeRound1Preview();
    if (!next.ok) {
      // Keep dialog open so Cancel/X can close it. Closing from this effect
      // can leave Base UI visually stuck while React state is already false.
      setPreview(null);
      setBootError(next.error);
      toast.error(next.error);
      return;
    }
    setBootError(null);
    setPreview(next.preview);
  }, [open, seedPreview, teams, highestOrder, defaultBestOf, bracketCount]);

  const bulkRound = preview?.rows[0]?.round ?? "Round 1";
  const bulkBestOf = preview?.rows[0]?.bestOf ?? defaultBestOf;
  const perBracket =
    bracketCount > 0 ? Math.floor(teams.length / bracketCount) : 0;

  const defaultDescription = seeded
    ? "Review pairings before creating matches."
    : `${teams.length} team${teams.length === 1 ? "" : "s"} → ${bracketCount} brackets${perBracket > 0 ? ` (${perBracket} each)` : ""}. Pairings stay inside each bracket.${perBracket === SK_TEAMS_PER_BRACKET ? " Full SK field (16 per bracket)." : ""}`;

  const updateRow = (
    index: number,
    patch: Partial<
      Pick<AutoMatchPreviewRow, "round" | "order" | "bestOf" | "bracket">
    >,
  ) => {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((row, i) =>
          i === index ? { ...row, ...patch } : row,
        ),
      };
    });
  };

  const updateAllRows = (
    patch: Partial<Pick<AutoMatchPreviewRow, "round" | "bestOf">>,
  ) => {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((row) => ({ ...row, ...patch })),
      };
    });
  };

  const handleShuffle = () => {
    if (onShufflePreview) {
      const next = onShufflePreview();
      if (!next.ok) {
        toast.error(next.error);
        return;
      }
      setPreview(next.preview);
      return;
    }
    const next = makeRound1Preview();
    if (!next.ok) {
      toast.error(next.error);
      return;
    }
    setPreview(next.preview);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-dvh max-h-dvh w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[min(90vh,720px)] sm:max-w-2xl sm:rounded-lg">
        <DialogHeader className="flex flex-col gap-1 border-b border-border px-4 py-4 text-left sm:px-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? defaultDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {bootError ? (
            <p className="text-destructive text-sm" role="alert">
              {bootError}
            </p>
          ) : !preview ? (
            <p className="text-muted-foreground text-sm">No preview available.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-2 rounded-lg border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs">
                    Round (apply to all)
                  </Label>
                  <Input
                    value={bulkRound}
                    onChange={(e) => updateAllRows({ round: e.target.value })}
                    placeholder="Round 1"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs">
                    Best of (apply to all)
                  </Label>
                  <Input
                    inputMode="numeric"
                    value={String(bulkBestOf)}
                    onChange={(e) => {
                      const next = e.target.value.trim();
                      if (next === "-" || next === "") return;
                      const parsed = Number.parseInt(next, 10);
                      if (!Number.isFinite(parsed)) return;
                      updateAllRows({ bestOf: Math.max(1, parsed) });
                    }}
                    placeholder="3"
                  />
                </div>
              </div>

              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border/70">
                {preview.rows.map((row, index) => (
                  <div
                    key={`${row.teamA.id}-${row.teamB.id}-${index}`}
                    className="flex flex-col gap-3 px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        M{index + 1}
                      </Badge>
                      {row.bracket ? (
                        <Badge variant="secondary" className="text-xs">
                          {row.bracket}
                        </Badge>
                      ) : null}
                      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm">
                        <span className="truncate text-right font-medium">
                          {row.teamA.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="h-6 px-2 text-[10px] text-muted-foreground tracking-wide uppercase"
                        >
                          VS
                        </Badge>
                        <span className="truncate text-left font-medium">
                          {row.teamB.name}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-muted-foreground text-xs">
                          Round
                        </Label>
                        <Input
                          value={row.round}
                          onChange={(e) =>
                            updateRow(index, { round: e.target.value })
                          }
                          placeholder="Round 1"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-muted-foreground text-xs">
                          Order
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={String(row.order)}
                          onChange={(e) =>
                            updateRow(index, {
                              order: Number.parseInt(e.target.value, 10) || 1,
                            })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-muted-foreground text-xs">
                          Best of
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={String(row.bestOf)}
                          onChange={(e) =>
                            updateRow(index, {
                              bestOf: Number.parseInt(e.target.value, 10) || 1,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {preview.leftOut.length > 0 ? (
                <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    Unpaired this round:
                  </span>{" "}
                  <span className="font-medium">
                    {preview.leftOut.map((t) => t.name).join(", ")}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="mx-0! mb-0! mt-auto shrink-0 flex-col-reverse gap-3 border-t border-border bg-muted/40 px-4 pt-4 pb-5 sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {bootError ? "Close" : "Cancel"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleShuffle}
            disabled={pending || Boolean(bootError)}
          >
            <Shuffle className="size-4" />
            Shuffle
          </Button>
          <Button
            type="button"
            disabled={pending || !preview || preview.rows.length < 1}
            onClick={() => {
              if (!preview) return;
              void Promise.resolve(onConfirm(preview)).then(() =>
                onOpenChange(false),
              );
            }}
          >
            {pending ? "Generating…" : "Confirm & generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
