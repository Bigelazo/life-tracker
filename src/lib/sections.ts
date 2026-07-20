import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  LayoutDashboard,
  NotebookPen,
  Wallet,
} from "lucide-react";

export type SectionSlug = "today" | "habits" | "finance" | "notes";

export type Section = {
  slug: SectionSlug;
  label: string;
  href: string;
};

export const SECTIONS: Section[] = [
  { slug: "today", label: "Today", href: "/today" },
  { slug: "habits", label: "Habits", href: "/habits" },
  { slug: "finance", label: "Finance", href: "/finance" },
  { slug: "notes", label: "Notes", href: "/notes" },
];

/**
 * Per-section lucide icon — DESIGN.md v2 maps the four sections to
 * LayoutDashboard / CalendarCheck / Wallet / NotebookPen. Centralized
 * so the Sidebar, Today widget-cards, and EmptyState all render the
 * same icon for the same slug.
 */
export const SECTION_ICONS: Record<SectionSlug, LucideIcon> = {
  today: LayoutDashboard,
  habits: CalendarCheck,
  finance: Wallet,
  notes: NotebookPen,
};

export function getSectionIcon(slug: SectionSlug): LucideIcon {
  return SECTION_ICONS[slug];
}
