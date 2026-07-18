import type { SectionSlug } from "@/lib/sections";
import { EmptyState } from "@/components/empty-state";

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
      <h1 className="mb-6 text-[28px] leading-[1.2] font-semibold tracking-[-0.6px]">
        {title}
      </h1>
      <EmptyState
        slug={slug}
        title={emptyStateTitle}
        description={emptyStateDescription}
      />
    </section>
  );
}
