"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/lib/sections";
import { SectionIcon } from "@/components/section-icon";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: persistent left sidebar */}
      <nav
        aria-label="Sections"
        className="border-hairline bg-canvas sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r md:flex"
      >
        <div className="px-5 pt-6 pb-8">
          <span className="text-primary text-sm font-semibold tracking-tight">
            Life Tracker
          </span>
        </div>
        <ul className="flex flex-col gap-1 px-3">
          {SECTIONS.map((section) => {
            const active = isActive(pathname, section.href);
            return (
              <li key={section.slug}>
                <Link
                  href={section.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md flex min-h-10 items-center gap-3 px-3 text-sm transition-colors ${
                    active
                      ? "bg-surface-2 text-ink"
                      : "text-ink-subtle hover:bg-surface-1 hover:text-ink"
                  }`}
                >
                  <SectionIcon slug={section.slug} className="size-4" />
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile: bottom tab bar */}
      <nav
        aria-label="Sections"
        className="border-hairline bg-canvas/95 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-4">
          {SECTIONS.map((section) => {
            const active = isActive(pathname, section.href);
            return (
              <li key={section.slug}>
                <Link
                  href={section.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                    active ? "text-ink" : "text-ink-tertiary"
                  }`}
                >
                  <SectionIcon slug={section.slug} className="size-5" />
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
