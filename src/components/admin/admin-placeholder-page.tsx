import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStagger } from "@/components/admin/admin-stagger";

type AdminPlaceholderPageProps = {
  title: string;
  description?: string;
  eyebrow?: string;
};

export function AdminPlaceholderPage({
  title,
  description = "This page is not wired yet. Use the legacy admin for now.",
  eyebrow = "Committee",
}: AdminPlaceholderPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <AdminStagger index={0}>
        <AdminPageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
      </AdminStagger>
    </div>
  );
}
