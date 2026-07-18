"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "cmdk";
import { SECTIONS } from "@/lib/sections";
import { SectionIcon } from "@/components/section-icon";
import { signOut as signOutAction } from "@/auth/actions";

const NAV_ITEMS = SECTIONS.map((section) => ({
  id: section.slug,
  label: section.label,
  href: section.href,
  slug: section.slug,
}));

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      contentClassName="bg-surface-2 border-hairline rounded-lg border shadow-2xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg"
      overlayClassName="bg-black/60 fixed inset-0"
    >
      <CommandInput
        placeholder="Type a command or search…"
        className="border-b-hairline text-ink placeholder:text-ink-tertiary pt-4 pb-3 px-4 outline-none focus-visible:outline-none"
      />
      <CommandList>
        <CommandEmpty className="text-ink-subtle py-6 text-center text-sm">
          No results found.
        </CommandEmpty>
        <CommandGroup heading="Navigate" className="[&_[cmdk-group-heading]]:text-ink-tertiary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.id}
              value={item.id}
              onSelect={() => handleSelect(item.href)}
              className="text-ink aria-selected:bg-surface-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors"
            >
              <SectionIcon slug={item.slug} className="text-ink-subtle size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator className="border-t-hairline" />
        <CommandGroup heading="Actions" className="[&_[cmdk-group-heading]]:text-ink-tertiary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
          <CommandItem
            value="sign-out"
            disabled={pending}
            onSelect={() => {
              setOpen(false);
              startTransition(async () => {
                await signOutAction();
                router.push("/login");
              });
            }}
            className="text-ink aria-selected:bg-surface-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors"
          >
            {pending ? "Signing out…" : "Sign out"}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
