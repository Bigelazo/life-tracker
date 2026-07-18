---
status: accepted
date: 2026-07-18
---

# ADR 0002: Custom sign-out action clears Auth.js cookies directly

## Context

The documented Auth.js v5 sign-out path — call `signOut()` from `next-auth`
inside a server action — did not reliably clear the `authjs.session-token`
cookie in Playwright runs under Next.js 16 / Turbopack. Approximately half
the post-sign-out GAs landed on `/today` instead of `/login` — i.e. the
cookie stayed valid after the redirect response reached the browser.

The root cause is in the interaction between the Next.js 16 server-action
response pipeline and the Auth.js `signOut()` helper: the Set-Cookie
entries queued by `cookieJar.set(...)` are not always carried onto the
final redirect response that the browser actually commits. A TDD-style
e2e test made this instability visible.

## Decision

Implement sign-out as our own `"use server"` action in
`src/auth/actions.ts`. It clears the relevant Auth.js cookies explicitly
through `next/headers`' `cookies().set(name, "", { maxAge: 0 })`, then the
client component (`SignOutButton`) navigates to `/login` via
`useRouter().push("/login")` after the action resolves.

The action clears every known Auth.js cookie variant
(`authjs.session-token`, `authjs.callback-url`, `authjs.csrf-token`) and
their `__Secure-` prefixed counterparts, so production deploys behind TLS
keep working.

## Consequences

- Sign-out is reliable and deterministic — the cookie is removed before
  the navigation, so the next request to a gated route always redirects
  to `/login`.
- The cookie name list is a brittle dependency on Auth.js' cookie
  naming; if a future version renames them, sign-out silently no-ops.
  We accept this risk in exchange for working sign-out today, and
  consider unit-testing the cookie-list constant.
- The Auth.js `signOut` server action from `next-auth` is left unused on
  the sign-out path; we still rely on its sibling `signIn` for the
  sign-in flow.