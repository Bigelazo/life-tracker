import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SECTION_ICONS,
  type SectionSlug,
} from "@/lib/sections";
import { cn } from "@/lib/utils";

export function EmptyState({
  slug,
  title,
  description,
  className,
}: {
  slug: SectionSlug;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "bg-notion-canvas-soft text-notion-ink border-notion-hairline items-center justify-center rounded-xl border py-8 text-center shadow-none",
        className,
      )}
    >
      <CardHeader className="items-center gap-3 px-6">
        {(() => {
          const Icon = SECTION_ICONS[slug];
          return <Icon className="text-notion-ink-muted size-7" aria-hidden />;
        })()}
        <CardTitle className="text-title text-notion-ink">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-body-md text-notion-ink-muted max-w-sm px-6 pb-2">
        {description}
      </CardContent>
    </Card>
  );
}
