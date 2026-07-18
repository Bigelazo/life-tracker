"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOut as signOutAction } from "@/auth/actions";

type SignOutButtonProps = {
  label?: string;
  className?: string;
};

export function SignOutButton({
  label = "Sign out",
  className,
}: SignOutButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
      router.push("/login");
    });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className={`text-ink-tertiary hover:bg-surface-1 hover:text-ink rounded-md min-h-10 px-3 text-sm transition-colors disabled:opacity-60 ${className ?? ""}`}
    >
      {pending ? "Signing out…" : label}
    </button>
  );
}