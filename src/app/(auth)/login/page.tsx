import type { Metadata } from "next";

import { auth } from "@/auth";
import { LoginCard } from "@/components/login-card";
import { testSignInEnabled } from "@/lib/test-sign-in";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <LoginCard
        error={error}
        signedIn={Boolean(session)}
        showTestSignIn={testSignInEnabled()}
      />
    </div>
  );
}