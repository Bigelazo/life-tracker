import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

import { shouldAllowSignIn, TEST_OWNER_PROVIDER_ID } from "@/lib/allow-sign-in";
import { ownerEmail } from "@/lib/allowlist";
import { testSignInEnabled } from "@/lib/test-sign-in";

function buildProviders(): Provider[] {
  const providers: Provider[] = [
    Google({
      // Populated from AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET env vars by Auth.js.
      allowDangerousEmailAccountLinking: true,
    }),
  ];

  if (testSignInEnabled()) {
    providers.push(
      Credentials({
        id: TEST_OWNER_PROVIDER_ID,
        name: "Test owner",
        credentials: {
          email: { label: "Email", type: "email" },
        },
        async authorize(credentials) {
          const provided =
            typeof credentials?.email === "string" ? credentials.email : undefined;
          const chosen = provided && provided.trim() !== "" ? provided : ownerEmail();
          if (!chosen) return null;
          return { id: chosen, name: "Owner", email: chosen };
        },
      }),
    );
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: buildProviders(),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      return shouldAllowSignIn({
        provider: account?.provider,
        email: user?.email ?? undefined,
      });
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
});