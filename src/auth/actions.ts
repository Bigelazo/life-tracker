"use server";

import { cookies } from "next/headers";
import { signIn as authSignIn } from "@/auth";

export async function signInWithGoogle(callbackUrl = "/today") {
  await authSignIn("google", { redirectTo: callbackUrl });
}

export async function signInWithTestOwner(callbackUrl = "/today") {
  await authSignIn("test-owner", { redirectTo: callbackUrl });
}

const COOKIES_TO_DESTROY = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.csrf-token",
  "__Secure-authjs.csrf-token",
];

export async function signOut() {
  const cookieStore = await cookies();
  for (const name of COOKIES_TO_DESTROY) {
    if (cookieStore.get(name)) {
      cookieStore.set(name, "", {
        path: "/",
        maxAge: 0,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true,
      });
    }
  }
}