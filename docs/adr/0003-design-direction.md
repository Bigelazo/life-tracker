---
status: accepted
date: 2026-07-20
---

# ADR 0003: Design direction — Notion-light + Notion-dark toggleable, replacing Linear-dark

## Context

The Life Tracker codebase shipped with a dark Linear-grade visual language:
near-black `#010102` canvas, sparse `#5e6ad2` lavender accent, a single
dark-only theme (see `src/app/globals.css` as of issue #2). The original
`DESIGN.md` documented that Linear system. At some later point that
`DESIGN.md` was overwritten with an analysis of the Notion marketing site
(a warm paper-light system with Notion blue `#0075de`) — but the code kept
shipping Linear-dark. The two have never matched; issue #19 ("DESIGN.md
compliance") has been unworkable as a result.

Issue #20 ("Design refactor: Notion-light + Notion-dark with shadcn
primitives") reconciles the contradiction in favour of the Notion system,
in both light and dark variants, with a toggle.

## Decision

Four axes were resolved as part of the issue #20 grilling session:

1. **Theme direction.** Replace the Linear-dark implementation with the
   Notion paper-light system as the canonical theme, plus a Notion-dark
   theme whose tokens are mechanically *inverted* from the light palette
   (warm paper → warm near-black, near-black ink → warm near-white, the
   single Notion blue `#0075de` unchanged across both themes). The
   decorative sticker palette (`accent-pink`, `accent-teal`,
   `accent-orange`, etc.) is preserved as decoration-only tokens; it never
   paints structure.

2. **Toggle strategy.** Use `next-themes` with `attribute="class"` and
   Tailwind v4's `@custom-variant dark (&:is(.dark *))` directive. The
   provider injects a pre-hydration script that writes `.dark` on
   `<html>` before React mounts, so there is no flash of the wrong theme
   on first paint. Discarded alternatives: hand-rolled cookie + inline
   script (boilerplate we'd reimplement and diverge from the shadcn
   default every primitive expects); `prefers-color-scheme` only (no
   manual toggle); React context with no FOUC handling (visible flicker
   on reload of a daily-use PWA).

3. **UX scope.** Beyond pure retokenization, eight specific UX upgrades
   ship inline with the component migrations: (a) relapse confirmation
   becomes `AlertDialog`; (b) habit-card hover actions become a kebab
   `DropdownMenu` (mobile-friendly); (c) failed mutations surface `Sonner`
   toasts via the `QueryClient` `mutationCache.onError` handler; (d) the
   inline habit Edit form becomes a `Dialog`; (e) the cramped Today-widget
   add-amount row becomes a popover / `AlertDialog`; (f) the desktop
   sidebar becomes collapsible to an icon-rail with tooltips on each icon;
   (g) icon-only actions get `Tooltip`s; (h) a visible ⌘K shortcut hint
   appears in the sidebar. Layout-disrupting choices are scoped to these
   eight — Finance and Notes surfaces are not reshaped in this refactor.

4. **Acceptance gates.** Each component-migration ticket's acceptance is
   `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green on
   its own branch. Each migration updates the relevant vitest component
   test and Playwright spec atomically (in the same PR), with stable
   `data-testid` hooks preserved (`habit-checkbox`, `habit-add-amount`,
   `today-habits-widget`) and new ones added (`habit-actions-menu` for the
   kebab trigger). A final visual + accessibility pass ticket runs
   Lighthouse, keyboard-only walkthroughs, focus-trap audit on every
   overlay, and WCAG AA contrast verification on every ink × surface
   combination in both themes, plus a committed screenshot matrix captured
   via the `agent-browser` skill.

The execution is sequenced as three tracks:

```
A1 (DESIGN.md v2 rewrite, grill-with-docs)  ┐
                                            ├─► C1 (Sidebar+Today migration)
B1 (Foundation: shadcn + next-themes setup) ─┤  C2 (Habits+Auth+Command migration) ─► D1 (Visual+a11y pass)
                                            ┘
```

A1 and B1 run concurrently. The migration tracks (C1, C2) wait on both;
the final pass (D1) waits on C1 and C2.

## Considered Options

For theme direction, four were considered and the most expensive one was
chosen deliberately:

- Refine Linear-dark, rewrite DESIGN.md to describe the dark system
  already in code. Lowest churn; rejected because the brand discipline of
  Notion (warm paper, single blue, sticker decoration) is a better fit for
  a daily-use personal hub than the terminal-dark Linear aesthetic.
- Switch to Notion-light only. Higher churn, but a single-theme terminal
  in light form on a phone at night is uncomfortable.
- A brand-new third design. Highest churn; rejected because the in-repo
  DESIGN.md is already a credible Notion spec, and inventing a fresh
  system would burn design time without better outcomes.
- **Notion-light + Notion-dark toggleable.** The chosen option; preserves
  the Notion brand discipline across both themes and gives the owner the
  mode that fits the moment.

For dark-theme tokens, four were considered: invert DESIGN.md
(chosen — one appendix table, brand discipline carries verbatim); mirror
Notion's actual product dark mode (rejected: requires reverse-engineering
and adds a full second spec); use `colors.secondary` indigo as the canvas
(rejected: breaks the brand discipline Notion keeps indigo as one
decorative band); defer / research first (rejected: keeps the plan
blocked on an external investigation).

For toggle strategy, see the discarded alternatives in axis 2 above.

For shadcn adoption scope, four were considered: full adoption (chosen),
strategic adoption (rejected: primitives would drift between shadcn and
bespoke over time), minimal theme + Command only (rejected: the
"improve UX using shadcn" half of the goal would be unmet), and
incremental primitive-by-primitive adoption after DESIGN.md lands
(rejected: the plan becomes a skeleton instead of a spec).

## Consequences

- `DESIGN.md` is rewritten via a separate grill-with-docs session before
  the migration tracks begin; until then, the migration tracks are blocked.
- The shadcn foundation (Track B) can proceed in parallel with the
  DESIGN.md rewrite because the shadcn CLI generates structure, not
  tokens. The shadcn registry style is `new-york` as a placeholder; the
  migration tickets re-pin per-component using `DESIGN.md` v2 tokens when
  they land.
- `globals.css` drops every Linear-dark literal. Every inline hex literal
  in component `style` props is replaced with token-backed Tailwind
  classes; the next person to swap a token no longer has to chase hex
  literals across the codebase.
- Motion is preserved for mount/unmount lifecycle (`AnimatePresence` on
  TodayHabitsWidget rows, Today page stagger, WidgetCard slide-in, habit
  quantifiable-bar spring); shadcn owns hover/press/open/close transitions.
  `prefers-reduced-motion` disables the Motion ambient animations only.
- Issue #19 is superseded: a summary comment is posted and the issue is
  closed once the four refactor tickets (C1, C2, D1, and the DESIGN.md
  rewrite) land.
- The dark theme's warm-paper-to-warm-near-black mapping may fail WCAG AA
  at specific ink-muted × canvas-soft combinations (notably the documented
  `#f6f5f4` × `#615d59` pair). The DESIGN.md rewrite session is expected
  to deepen ink-muted if AA requires it; the final visual + accessibility
  pass is the verifier of record.
- If the matcher of Notion's product dark mode is wanted later (rather
  than our mechanically inverted dark theme), it becomes a follow-up
  research ticket — the choice to mechanically invert is recorded but
  not irrevocably closed.
EOF