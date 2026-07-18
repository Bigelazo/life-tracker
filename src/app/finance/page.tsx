import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Finance" };

export default function FinancePage() {
  return (
    <section>
      <h1 className="mb-6 text-2xl">Finance</h1>
      <EmptyState
        slug="finance"
        title="No accounts yet"
        description="Accounts, categorized transactions, budgets and charts — coming in the finance milestone."
      />
    </section>
  );
}
