import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AUTO_MATCH_BRACKET_OPTIONS,
  type AutoMatchBracketOption,
} from "@/lib/admin/auto-matches";

export type AutoMatchBracketDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamCount: number;
  value: AutoMatchBracketOption;
  onValueChange: (value: AutoMatchBracketOption) => void;
  onContinue: () => void;
};

function optionCopy(count: AutoMatchBracketOption): {
  title: string;
  description: string;
} {
  if (count === 2) {
    return {
      title: "2 brackets",
      description: "Bracket A and B. Team count must be even.",
    };
  }
  return {
    title: "4 brackets",
    description: "Brackets A–D. Team count must be a multiple of 4.",
  };
}

export function AutoMatchBracketDialog({
  open,
  onOpenChange,
  teamCount,
  value,
  onValueChange,
  onContinue,
}: AutoMatchBracketDialogProps) {
  const perBracket = Math.floor(teamCount / value);
  const splitsEven = teamCount > 0 && teamCount % value === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Auto matches</DialogTitle>
          <DialogDescription>
            Choose how many elimination brackets to fill. Pairings stay inside
            each bracket.
          </DialogDescription>
        </DialogHeader>

        <FieldSet>
          <FieldLegend variant="label">Brackets</FieldLegend>
          <RadioGroup
            value={String(value)}
            onValueChange={(next) => {
              const parsed = Number.parseInt(String(next), 10);
              if (parsed === 2 || parsed === 4) onValueChange(parsed);
            }}
          >
            {AUTO_MATCH_BRACKET_OPTIONS.map((count) => {
              const copy = optionCopy(count);
              const id = `auto-match-brackets-${count}`;
              return (
                <FieldLabel key={count} htmlFor={id} className="cursor-pointer">
                  <Field orientation="horizontal">
                    <RadioGroupItem id={id} value={String(count)} />
                    <FieldContent>
                      <FieldTitle>{copy.title}</FieldTitle>
                      <FieldDescription>{copy.description}</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              );
            })}
          </RadioGroup>
        </FieldSet>

        <p className="text-muted-foreground text-sm">
          {teamCount} ready team{teamCount === 1 ? "" : "s"}
          {splitsEven
            ? ` → ${value} brackets (${perBracket} each).`
            : `. Need a multiple of ${value} for ${value} equal brackets.`}
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onContinue} disabled={!splitsEven}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
