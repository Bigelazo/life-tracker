"use client";

import Link from "next/link";
import * as m from "motion/react-m";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTION_ICONS, type Section } from "@/lib/sections";

export function WidgetCard({
  section,
  description,
}: {
  section: Section;
  description: string;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Link href={section.href} className="block focus:outline-none">
        <Card className="bg-notion-surface border-notion-hairline text-notion-ink rounded-xl border shadow-none transition-colors hover:bg-notion-surface-soft">
          <CardHeader className="gap-3 px-6 pt-6">
            {(() => {
              const Icon = SECTION_ICONS[section.slug];
              return (
                <Icon className="text-notion-ink-muted size-6" aria-hidden />
              );
            })()}
            <CardTitle className="text-heading-3 text-notion-ink">
              {section.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-body-sm text-notion-ink-muted px-6 pb-6">
            {description}
          </CardContent>
        </Card>
      </Link>
    </m.div>
  );
}
