import { EmptyState } from "@/components/empty-state";
import type { SectionSlug } from "@/lib/sections";

export function SectionPage({
  slug,
  title,
  emptyStateTitle,
  emptyStateDescription,
}: {
  slug: SectionSlug;
  title: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
}) {
  return (
    <section>
      <h1 className="text-heading-2 text-notion-ink mb-6">{title}</h1>
      <EmptyState
        slug={slug}
        title={emptyStateTitle}
        description={emptyStateDescription}
      />
    </section>
  );
}
