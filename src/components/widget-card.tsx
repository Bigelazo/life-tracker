"use client";

import Link from "next/link";
import * as m from "motion/react-m";
import type { Section } from "@/lib/sections";
import { SectionIcon } from "@/components/section-icon";

export function WidgetCard({
  section,
  description,
  delay,
}: {
  section: Section;
  description: string;
  delay: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      <Link
        href={section.href}
        className="border-hairline bg-surface-1 hover:bg-surface-2 rounded-lg flex flex-col gap-3 border p-6 transition-colors"
      >
        <SectionIcon
          slug={section.slug}
          className="text-ink-subtle size-6"
        />
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] leading-[1.25] font-medium tracking-[-0.4px]">
            {section.label}
          </h2>
          <p className="text-ink-subtle text-sm leading-[1.5]">
            {description}
          </p>
        </div>
      </Link>
    </m.div>
  );
}
