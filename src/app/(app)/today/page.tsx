import type { Metadata } from "next";
import * as m from "motion/react-m";
import { SECTIONS } from "@/lib/sections";
import { WidgetCard } from "@/components/widget-card";
import { TodayHabitsWidget } from "./today-habits-widget";

const WIDGET_SECTIONS = SECTIONS.filter((s) => s.slug !== "today" && s.slug !== "habits");

const DESCRIPTIONS: Record<string, string> = {
  finance: "Accounts, categorized transactions, budgets and charts.",
  notes: "Markdown pages with wikilinks, backlinks and full-text search.",
};

const STAGGER = 0.08;

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <section>
      <m.h1
        className="text-heading-2 text-notion-ink mb-8"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        Today
      </m.h1>

      <m.div
        className="mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <TodayHabitsWidget />
      </m.div>

      <m.div
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: STAGGER } },
        }}
      >
        {WIDGET_SECTIONS.map((section) => (
          <WidgetCard
            key={section.slug}
            section={section}
            description={DESCRIPTIONS[section.slug] ?? "Coming soon."}
          />
        ))}
      </m.div>
    </section>
  );
}
