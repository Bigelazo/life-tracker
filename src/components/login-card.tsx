"use client";

import { useState } from "react";

import {
  signInWithGoogle,
  signInWithTestOwner,
} from "@/auth/actions";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "That Google account isn't the owner of this life tracker. Sign in with the allowlisted account.",
  OAuthSignin:
    "Google sign-in couldn't be reached right now. Check that AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are configured.",
  Configuration:
    "Google sign-in couldn't be completed because the auth configuration isn't valid. Check the server logs.",
};

type LoginCardProps = {
  error: string | undefined;
  signedIn: boolean;
  showTestSignIn: boolean;
};

export function LoginCard({ error, signedIn, showTestSignIn }: LoginCardProps) {
  const [pending, setPending] = useState<"google" | "test-owner" | null>(null);

  async function startGoogle() {
    setPending("google");
    try {
      await signInWithGoogle();
    } catch {
      setPending(null);
    }
  }

  async function startTestOwner() {
    setPending("test-owner");
    try {
      await signInWithTestOwner();
    } catch {
      setPending(null);
    }
  }

  const message = error ? ERROR_MESSAGES[error] ?? undefined : undefined;

  return (
    <div
      className="border-hairline bg-surface-1 rounded-lg flex w-full max-w-sm flex-col gap-6 border px-6 py-8"
      role="region"
      aria-label="Sign in"
    >
      <header className="flex flex-col gap-2">
        <span className="text-primary text-[13px] font-medium tracking-[0.4px] uppercase">
          Life Tracker
        </span>
        <h1 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.6px]">
          Sign in
        </h1>
        <p className="text-ink-subtle text-sm leading-[1.5]">
          Only the owner can sign in. Use the button below to continue with
          Google.
        </p>
      </header>

      {message ? (
        <p
          role="alert"
          className="border-hairline-strong bg-surface-2 rounded-md border px-3 py-2 text-sm text-ink-muted"
        >
          {message}
        </p>
      ) : null}

      {signedIn ? (
        <p className="text-ink-subtle text-sm">
          You&apos;re signed in. Refreshing…
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={startGoogle}
          disabled={pending !== null}
          className="bg-primary text-on-primary hover:bg-primary-hover focus-visible:bg-primary-focus rounded-md min-h-10 px-3.5 text-sm font-medium transition-colors disabled:opacity-60"
        >
          {pending === "google" ? "Redirecting to Google…" : "Sign in with Google"}
        </button>

        {showTestSignIn ? (
          <button
            type="button"
            onClick={startTestOwner}
            disabled={pending !== null}
            className="bg-surface-1 text-ink hover:bg-surface-2 rounded-md min-h-10 border border-hairline px-3.5 text-sm font-medium transition-colors disabled:opacity-60"
          >
            {pending === "test-owner" ? "Signing in…" : "Sign in (test owner)"}
          </button>
        ) : null}
      </div>
    </div>
  );
}