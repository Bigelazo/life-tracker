"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOut as signOutAction } from "@/auth/actions";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  label?: string;
  variant?: "label" | "icon";
  className?: string;
};

export function SignOutButton({
  label = "Sign out",
  variant = "label",
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

  if (variant === "icon") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            disabled={pending}
            aria-label={label}
            className={className}
          >
            <LogOut aria-hidden className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleSignOut}
      disabled={pending}
      aria-label={label}
      className={cn("text-notion-ink-muted", className)}
    >
      {pending ? "Signing out…" : label}
    </Button>
  );
}
