import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";

const setTheme = vi.fn();
const useThemeMock = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => useThemeMock(),
}));

function renderToggle() {
  return render(
    <TooltipProvider>
      <ThemeToggle />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  setTheme.mockReset();
  useThemeMock.mockReset();
  useThemeMock.mockReturnValue({
    resolvedTheme: "light",
    setTheme,
  });
});

afterEach(() => {
  cleanup();
});

describe("ThemeToggle", () => {
  it("renders a button labelled 'Toggle theme'", () => {
    renderToggle();
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toBeInTheDocument();
  });

  it("switches to dark when the current resolved theme is light", () => {
    useThemeMock.mockReturnValue({ resolvedTheme: "light", setTheme });
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("switches to light when the current resolved theme is dark", () => {
    useThemeMock.mockReturnValue({ resolvedTheme: "dark", setTheme });
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
