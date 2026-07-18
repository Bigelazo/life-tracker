import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Notes" };

export default function NotesPage() {
  return (
    <section>
      <h1 className="mb-6 text-2xl">Notes</h1>
      <EmptyState
        slug="notes"
        title="No pages yet"
        description="Markdown pages with wikilinks, backlinks and full-text search — coming in the notes milestone."
      />
    </section>
  );
}
