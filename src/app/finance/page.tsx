import type { Metadata } from "next";
import { SectionPage } from "@/components/section-page";

export const metadata: Metadata = { title: "Finance" };

export default function FinancePage() {
  return (
    <SectionPage
      slug="finance"
      title="Finance"
      emptyStateTitle="No accounts yet"
      emptyStateDescription="Accounts, categorized transactions, budgets and charts — coming in the finance milestone."
    />
  );
}
