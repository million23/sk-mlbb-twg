type AdminPlaceholderPageProps = {
  title: string;
  description?: string;
};

export function AdminPlaceholderPage({
  title,
  description = "This page is not wired yet. Use the legacy admin for now.",
}: AdminPlaceholderPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="text-muted-foreground text-sm text-pretty">{description}</p>
    </div>
  );
}
