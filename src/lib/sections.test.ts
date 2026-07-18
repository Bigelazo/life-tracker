import { describe, expect, it } from "vitest";
import { SECTIONS } from "./sections";

describe("SECTIONS", () => {
  it("exposes exactly the four app sections in navigation order", () => {
    expect(SECTIONS.map((s) => s.label)).toEqual([
      "Today",
      "Habits",
      "Finance",
      "Notes",
    ]);
  });

  it("gives every section an href matching its slug", () => {
    for (const section of SECTIONS) {
      expect(section.href).toBe(`/${section.slug}`);
    }
  });

  it("opens the app on the Today section", () => {
    expect(SECTIONS[0].slug).toBe("today");
  });
});
