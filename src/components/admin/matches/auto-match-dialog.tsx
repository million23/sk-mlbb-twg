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
  type AutoMatchPreview,
  type AutoMatchPreviewRow,
  type AutoMatchTeam,
  buildAutoMatchPreview,
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
  pending?: boolean;
  onConfirm: (preview: AutoMatchPreview) => Promise<void> | void;
};

export function AutoMatchDialog({
  open,
  onOpenChange,
  teams,
  highestOrder,
  defaultBestOf = 3,
  pending,
  onConfirm,
}: AutoMatchDialogProps) {
  const [preview, setPreview] = useState<AutoMatchPreview | null>(null);

  const makePreview = () =>
    buildAutoMatchPreview({
      teams,
      highestOrder,
      defaultBestOf,
    });

  useEffect(() => {
    if (!open) {
      setPreview(null);
      return;
    }
    const next = buildAutoMatchPreview({
      teams,
      highestOrder,
      defaultBestOf,
    });
    if (!next) {
      toast.error("Need at least 2 active teams");
      onOpenChange(false);
      return;
    }
    setPreview(next);
  }, [open, teams, highestOrder, defaultBestOf, onOpenChange]);

  const bulkRound = preview?.rows[0]?.round ?? "Round 1";
  const bulkBestOf = preview?.rows[0]?.bestOf ?? defaultBestOf;

  const updateRow = (
    index: number,
    patch: Partial<Pick<AutoMatchPreviewRow, "round" | "order" | "bestOf">>,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="flex flex-col gap-1 border-b border-border px-6 py-4 text-left">
          <DialogTitle>Auto match preview</DialogTitle>
          <DialogDescription>
            Review the generated pairings before creating matches.{" "}
            {teams.length} active team{teams.length === 1 ? "" : "s"} available.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {!preview ? (
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
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        M{index + 1}
                      </Badge>
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

              {preview.leftOut ? (
                <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Unpaired team:</span>{" "}
                  <span className="font-medium">{preview.leftOut.name}</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="mx-0! mb-0! mt-auto shrink-0 flex-col-reverse gap-3 border-t border-border bg-muted/40 px-6 pt-4 pb-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const next = makePreview();
              if (!next) {
                toast.error("Need at least 2 active teams");
                return;
              }
              setPreview(next);
            }}
            disabled={pending}
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
