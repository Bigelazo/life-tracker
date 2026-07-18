---
status: accepted
date: 2026-07-18
---

# ADR 0001: Auth gate — Auth.js v5, Google-only, single-owner allowlist

## Context

GitHub issue #3 asks for an auth gate on every app route: a visitor without a
session always lands on `/login`, the owner signs in once per device with a
Google account, sessions persist across browser restarts, and sign-out works
from anywhere. The owner is a single person, so the allowlist is a single
email.

The login screen has to render in the DESIGN.md (Linear-dark) visual language,
and Playwright has to authenticate without real Google OAuth.

## Decision

Use **Auth.js v5** (`next-auth@beta`) with the JWT session strategy:

- **Google** is the only production provider. `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
  are inferred by Auth.js from the env vars of the same name.
- The `signIn` callback denies any Google account whose email is not the
  configured `OWNER_EMAIL`; Auth.js then bounces the visitor back to
  `/login?error=AccessDenied`, which renders a clear, single-message rejection.
- A **test-only Credentials provider** (`id: "test-owner"`) is registered only
  when `ENABLE_TEST_SIGNIN === "1"`. It bypasses the owner-allowlist check and
  lets Playwright (visible "Sign in (test owner)" button on `/login`) mint a
  real JWT session cookie without Google credentials.
- Middleware (`src/middleware.ts`) gates every non-public route with the
  `auth()` wrapper. The `isPublicRoute` predicate (`src/lib/middleware-routes.ts`)
  is kept as a pure, unit-tested function so the public/protected decision stays
  out of framework generated middleware.
- App sections live under `src/app/(app)/` with a layout that mounts the
  sidebar/footer; `/login` lives under `src/app/(auth)/` so the auth gate never
  decorates the sign-in screen.

## Consequences

- The session is a signed, httpOnly JWT cookie — survives browser restarts,
  degrades gracefully if the database is unavailable.
- Production deploys must keep `ENABLE_TEST_SIGNIN` unset; otherwise any visitor
  can mint a session via the test provider.
- Adding a second owner later means changing `OWNER_EMAIL` semantics —
  acceptable for a single-owner life tracker.