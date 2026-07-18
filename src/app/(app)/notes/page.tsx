import type { Metadata } from "next";
import { SectionPage } from "@/components/section-page";

export const metadata: Metadata = { title: "Notes" };

export default function NotesPage() {
  return (
    <SectionPage
      slug="notes"
      title="Notes"
      emptyStateTitle="No pages yet"
      emptyStateDescription="Markdown pages with wikilinks, backlinks and full-text search — coming in the notes milestone."
    />
  );
}
