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
