"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CommandIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SECTIONS, SECTION_ICONS } from "@/lib/sections";
import { cn } from "@/lib/utils";

const EXPANDED_WIDTH_CLASS = "w-60";
const RAIL_WIDTH_CLASS = "w-16";
const WIDTH_TRANSITION = "transition-[width] duration-200 ease-in-out";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Synthetic ⌘K keydown — the command palette listens for `(meta|ctrl)+k`
 * on `document`, so we mirror that gesture here to let the sidebar's
 * glyph button open the palette without exposing an imperative API.
 */
function dispatchCommandPalette() {
  if (typeof document === "undefined") return;
  const event = new KeyboardEvent("keydown", {
    key: "k",
    metaKey: true,
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

export function AppNav() {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);

  const expanded = pinned || hovering;
  const desktopCollapsed = !expanded;

  return (
    <>
      {/* Desktop: persistent left sidebar — collapsible to a 64px rail
          that expands back to 240px on hover. The pin toggle pins the
          rail in place; while unpinned the rail auto-expands. */}
      <nav
        aria-label="Sections"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={cn(
          "bg-notion-canvas border-notion-hairline sticky top-0 hidden h-screen shrink-0 flex-col border-r md:flex",
          WIDTH_TRANSITION,
          expanded ? EXPANDED_WIDTH_CLASS : RAIL_WIDTH_CLASS,
        )}
      >
        <div
          className={cn(
            "flex items-center pt-6 pb-8",
            expanded ? "px-5 justify-between" : "px-0 justify-center",
          )}
        >
          {expanded ? (
            <span className="text-notion-primary text-eyebrow font-semibold tracking-tight">
              Life&nbsp;Tracker
            </span>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPinned((p) => !p)}
                aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
                aria-pressed={pinned}
              >
                {expanded ? (
                  <PanelLeftClose aria-hidden className="size-4" />
                ) : (
                  <PanelLeftOpen aria-hidden className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {pinned ? "Unpin to collapse on leave" : "Pin sidebar open"}
            </TooltipContent>
          </Tooltip>
        </div>
        <ul className={cn("flex flex-col gap-1", expanded ? "px-3" : "px-2")}>
          {SECTIONS.map((section) => (
            <DesktopNavRow
              key={section.slug}
              slug={section.slug}
              href={section.href}
              active={isActive(pathname, section.href)}
              collapsed={desktopCollapsed}
            />
          ))}
        </ul>
        <div
          className={cn(
            "mt-auto flex flex-col gap-1 pb-6",
            expanded ? "px-3" : "px-2 items-center",
          )}
        >
          <CommandKHint collapsed={desktopCollapsed} />
          <ThemeToggle />
          <SignOutButton
            variant={desktopCollapsed ? "icon" : "label"}
            className={desktopCollapsed ? undefined : "w-full justify-start"}
          />
        </div>
      </nav>

      {/* Mobile: bottom tab bar */}
      <nav
        aria-label="Sections"
        className="bg-notion-canvas/95 border-notion-hairline fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-4">
          {SECTIONS.map((section) => {
            const active = isActive(pathname, section.href);
            return (
              <li key={section.slug}>
                <Link
                  href={section.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 transition-colors",
                    active ? "text-notion-ink" : "text-notion-ink-faint",
                  )}
                >
                  {(() => {
                    const Icon = SECTION_ICONS[section.slug];
                    return <Icon aria-hidden className="size-5" />;
                  })()}
                  <span className="text-eyebrow">{section.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile: sign-out and theme toggle pinned to the top-right */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1 md:hidden">
        <ThemeToggle />
        <SignOutButton
          variant="label"
          className="bg-notion-surface-soft border border-notion-hairline px-3.5"
        />
      </div>
    </>
  );
}

function DesktopNavRow({
  slug,
  href,
  active,
  collapsed,
}: {
  slug: (typeof SECTIONS)[number]["slug"];
  href: string;
  active: boolean;
  collapsed: boolean;
}) {
  const { label } = SECTIONS.find((s) => s.slug === slug)!;

  const content = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={cn(
        "rounded-md relative flex min-h-11 items-center text-body-sm transition-colors",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active
          ? "bg-notion-surface-soft text-notion-ink"
          : "text-notion-ink-muted hover:bg-notion-surface-soft hover:text-notion-ink",
      )}
    >
      {/* 2px primary left ribbon — DESIGN.md ex-app-shell-row's active
          indicator. When collapsed the row has no left padding so the
          ribbon sits flush against the sidebar edge. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full bg-notion-primary",
          collapsed ? "left-0.5 h-4 w-[2px]" : "left-0 h-5 w-[2px]",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      {(() => {
        const Icon = SECTION_ICONS[slug];
        return <Icon aria-hidden className="size-5" />;
      })()}
      {collapsed ? null : <span>{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return <li>{content}</li>;
}

function CommandKHint({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={dispatchCommandPalette}
            aria-label="Open command palette"
          >
            <CommandIcon aria-hidden className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Search&nbsp;·&nbsp;⌘&nbsp;K</TooltipContent>
      </Tooltip>
    );
  }

  // Expanded: visible "Search… ⌘ K" hint only — non-interactive, so
  // the palette is always opened via the keyboard shortcut.
  return (
    <div
      aria-hidden
      className="border-notion-hairline bg-notion-surface text-notion-ink-muted flex h-9 w-full items-center justify-between rounded-md border px-3"
    >
      <span className="flex items-center gap-2">
        <Search aria-hidden className="text-notion-ink-faint size-3.5" />
        <span>Search</span>
      </span>
      <span className="text-eyebrow text-notion-ink-faint">⌘&nbsp;K</span>
    </div>
  );
}
