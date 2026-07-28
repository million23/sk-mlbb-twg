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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  type AutoMatchBracket,
  type AutoMatchPreview,
  type AutoMatchPreviewRow,
  type AutoMatchTeam,
  buildAutoMatchPreview,
  filterTeamsByAgeBracket,
} from "@/lib/admin/auto-matches";
import { cn } from "@/lib/utils";
import { Shuffle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export type AutoMatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: AutoMatchTeam[];
  majorityByTeam: Map<string, AutoMatchBracket | null>;
  highestOrder: number;
  defaultBestOf?: number;
  pending?: boolean;
  onConfirm: (preview: AutoMatchPreview) => Promise<void> | void;
};

export function AutoMatchDialog({
  open,
  onOpenChange,
  teams,
  majorityByTeam,
  highestOrder,
  defaultBestOf = 3,
  pending,
  onConfirm,
}: AutoMatchDialogProps) {
  const [step, setStep] = useState<"bracket" | "preview">("bracket");
  const [bracket, setBracket] = useState<AutoMatchBracket>("under18");
  const [preview, setPreview] = useState<AutoMatchPreview | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("bracket");
    setBracket("under18");
    setPreview(null);
  }, [open]);

  const eligibleCount = useMemo(
    () => filterTeamsByAgeBracket(teams, majorityByTeam, bracket).length,
    [bracket, majorityByTeam, teams],
  );

  const bulkRound = preview?.rows[0]?.round ?? "Round 1";
  const bulkBestOf = preview?.rows[0]?.bestOf ?? defaultBestOf;

  const makePreview = (nextBracket: AutoMatchBracket) =>
    buildAutoMatchPreview({
      teams,
      majorityByTeam,
      bracket: nextBracket,
      highestOrder,
      defaultBestOf,
    });

  const openPreview = () => {
    const next = makePreview(bracket);
    if (!next) {
      toast.error("Need at least 2 teams in this age bracket");
      return;
    }
    setPreview(next);
    setStep("preview");
  };

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
      <DialogContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          step === "preview"
            ? "max-h-[min(90vh,720px)] sm:max-w-2xl"
            : "sm:max-w-md",
        )}
      >
        <DialogHeader className="flex flex-col gap-1 border-b border-border px-6 py-4 text-left">
          <DialogTitle>
            {step === "bracket" ? "Auto matches" : "Auto match preview"}
          </DialogTitle>
          <DialogDescription>
            {step === "bracket"
              ? "Pick an age bracket. Teams are included only if more than half of their members are in that bracket."
              : "Review the generated pairings before creating matches."}
          </DialogDescription>
        </DialogHeader>

        {step === "bracket" ? (
          <>
            <div className="flex flex-col gap-3 px-6 py-4">
              <Label>Age bracket</Label>
              <RadioGroup
                value={bracket}
                onValueChange={(v) => setBracket(v as AutoMatchBracket)}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <Label
                  htmlFor="auto-bracket-under18"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
                    bracket === "under18"
                      ? "border-primary bg-primary/10"
                      : "border-input bg-transparent hover:bg-muted/40",
                  )}
                >
                  <RadioGroupItem id="auto-bracket-under18" value="under18" />
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">Under 18</span>
                    <span className="text-muted-foreground text-sm">
                      Majority minors
                    </span>
                  </span>
                </Label>
                <Label
                  htmlFor="auto-bracket-18plus"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
                    bracket === "18+"
                      ? "border-primary bg-primary/10"
                      : "border-input bg-transparent hover:bg-muted/40",
                  )}
                >
                  <RadioGroupItem id="auto-bracket-18plus" value="18+" />
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">18 and above</span>
                    <span className="text-muted-foreground text-sm">
                      Majority adults
                    </span>
                  </span>
                </Label>
              </RadioGroup>
              <p className="text-muted-foreground text-xs">
                Eligible teams: {eligibleCount}. Teams without a strict majority
                are skipped.
              </p>
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
                onClick={openPreview}
                disabled={pending || eligibleCount < 2}
              >
                Preview matches
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {!preview ? (
                <p className="text-muted-foreground text-sm">
                  No preview available.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-2 rounded-lg border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-muted-foreground text-xs">
                        Round (apply to all)
                      </Label>
                      <Input
                        value={bulkRound}
                        onChange={(e) =>
                          updateAllRows({ round: e.target.value })
                        }
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
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
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
                                  order:
                                    Number.parseInt(e.target.value, 10) || 1,
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
                                  bestOf:
                                    Number.parseInt(e.target.value, 10) || 1,
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
                      <span className="text-muted-foreground">
                        Unpaired team:
                      </span>{" "}
                      <span className="font-medium">
                        {preview.leftOut.name}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <DialogFooter className="mx-0! mb-0! mt-auto shrink-0 flex-col-reverse gap-3 border-t border-border bg-muted/40 px-6 pt-4 pb-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("bracket");
                  setPreview(null);
                }}
                disabled={pending}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreview(makePreview(bracket))}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
