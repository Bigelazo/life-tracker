import type { SectionSlug } from "@/lib/sections";
import { SectionIcon } from "@/components/section-icon";

export function EmptyState({
  slug,
  title,
  description,
}: {
  slug: SectionSlug;
  title: string;
  description: string;
}) {
  return (
    <div className="border-hairline bg-surface-1 rounded-lg flex flex-col items-center justify-center gap-3 border px-6 py-20 text-center">
      <SectionIcon slug={slug} className="text-ink-tertiary size-8" />
      <h2 className="text-ink text-[22px] leading-[1.25] font-medium tracking-[-0.4px]">
        {title}
      </h2>
      <p className="text-ink-subtle max-w-sm text-sm">{description}</p>
    </div>
  );
}
