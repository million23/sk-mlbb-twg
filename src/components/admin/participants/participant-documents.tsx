import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import {
  fetchParticipantFileObjectUrl,
  isProbablyPdf,
  PARTICIPANT_DOC_FIELDS,
  PARTICIPANT_DOC_LABELS,
  type ParticipantDocField,
} from "@/lib/admin/participant-files";
import { FileText, ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";

function docFilename(
  record: ParticipantsRecord,
  field: ParticipantDocField,
): string | undefined {
  const value = record[field];
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function ParticipantDocuments({
  record,
}: {
  record: ParticipantsRecord;
}) {
  const [preview, setPreview] = useState<{
    field: ParticipantDocField;
    filename: string;
  } | null>(null);
  // Keep last preview while the sheet closes so exit animation can run.
  const [cached, setCached] = useState(preview);
  useEffect(() => {
    if (preview) setCached(preview);
  }, [preview]);

  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">Documents</p>
      <ul className="space-y-2">
        {PARTICIPANT_DOC_FIELDS.map((field) => {
          const filename = docFilename(record, field);
          return (
            <li
              key={field}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                {filename && isProbablyPdf(filename) ? (
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {PARTICIPANT_DOC_LABELS[field]}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {filename
                      ? filename
                      : field === "purok_endorsement"
                        ? "Present at tournament"
                        : "Not uploaded"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!filename || !record.id}
                onClick={() => {
                  if (!filename) return;
                  setPreview({ field, filename });
                }}
              >
                View
              </Button>
            </li>
          );
        })}
      </ul>

      {cached && record.id ? (
        <DocumentPreviewSheet
          record={
            record as ParticipantsRecord & {
              id: string;
              collectionId?: string;
            }
          }
          field={cached.field}
          filename={cached.filename}
          open={Boolean(preview)}
          onOpenChange={(open) => {
            if (!open) setPreview(null);
          }}
        />
      ) : null}
    </div>
  );
}

function DocumentPreviewSheet({
  record,
  field,
  filename,
  open,
  onOpenChange,
}: {
  record: ParticipantsRecord & { id: string; collectionId?: string };
  field: ParticipantDocField;
  filename: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState("");
  const [loading, setLoading] = useState(false);

  const closeOnError = useEffectEvent(() => {
    onOpenChange(false);
  });

  useEffect(() => {
    if (!open) return;
    let revoke = () => {};
    let cancelled = false;

    setLoading(true);
    setObjectUrl(null);
    fetchParticipantFileObjectUrl(
      {
        id: record.id,
        collectionId: record.collectionId,
        collectionName: "participants",
      },
      filename,
    )
      .then((result) => {
        if (cancelled) {
          result.revoke();
          return;
        }
        revoke = result.revoke;
        setObjectUrl(result.objectUrl);
        setContentType(result.contentType);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Could not load document",
          );
          closeOnError();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      revoke();
    };
  }, [open, record.id, record.collectionId, filename]);

  const asPdf =
    contentType.includes("pdf") || isProbablyPdf(filename);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        forceOverlay
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-xl!"
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle className="pr-8">
            {PARTICIPANT_DOC_LABELS[field]}
          </SheetTitle>
          <SheetDescription className="truncate font-mono text-xs">
            {filename}
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
          {loading ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : objectUrl && asPdf ? (
            <iframe
              title={PARTICIPANT_DOC_LABELS[field]}
              src={objectUrl}
              className="h-full min-h-[70vh] w-full rounded-md border border-border bg-background"
            />
          ) : objectUrl ? (
            <img
              src={objectUrl}
              alt={PARTICIPANT_DOC_LABELS[field]}
              className="max-h-full max-w-full object-contain"
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
