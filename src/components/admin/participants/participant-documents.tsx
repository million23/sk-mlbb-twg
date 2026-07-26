import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import {
  fetchParticipantFileObjectUrl,
  isProbablyPdf,
  PARTICIPANT_DOC_FIELDS,
  PARTICIPANT_DOC_LABELS,
  type ParticipantDocField,
} from "@/lib/admin/participant-files";
import { FileText, ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
                    {filename ?? "Not uploaded"}
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

      {preview && record.id ? (
        <DocumentPreviewDialog
          record={record as ParticipantsRecord & { collectionId?: string }}
          field={preview.field}
          filename={preview.filename}
          open={Boolean(preview)}
          onOpenChange={(open) => {
            if (!open) setPreview(null);
          }}
        />
      ) : null}
    </div>
  );
}

function DocumentPreviewDialog({
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
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      revoke();
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: onOpenChange is an inline closer from parent
  }, [open, record.id, record.collectionId, filename]);

  const asPdf =
    contentType.includes("pdf") || isProbablyPdf(filename);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{PARTICIPANT_DOC_LABELS[field]}</DialogTitle>
          <DialogDescription className="truncate">{filename}</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-64 items-center justify-center overflow-auto rounded-md border border-border bg-muted/30">
          {loading ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : objectUrl && asPdf ? (
            <iframe
              title={PARTICIPANT_DOC_LABELS[field]}
              src={objectUrl}
              className="h-[70vh] w-full"
            />
          ) : objectUrl ? (
            <img
              src={objectUrl}
              alt={PARTICIPANT_DOC_LABELS[field]}
              className="max-h-[70vh] max-w-full object-contain"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
