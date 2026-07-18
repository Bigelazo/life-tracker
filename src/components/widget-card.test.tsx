import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WidgetCard } from "@/components/widget-card";

const section = {
  slug: "habits" as const,
  label: "Habits",
  href: "/habits",
};

describe("WidgetCard", () => {
  it("renders the section label and description", () => {
    render(<WidgetCard section={section} description="Track habits." />);
    expect(screen.getByText("Habits")).toBeInTheDocument();
    expect(screen.getByText("Track habits.")).toBeInTheDocument();
  });

  it("links to the section href", () => {
    render(<WidgetCard section={section} description="Track habits." />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/habits");
  });

  it("renders an icon for the section slug", () => {
    const { container } = render(
      <WidgetCard section={section} description="Track habits." />
    );
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });
});
