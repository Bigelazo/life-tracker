---
version: v2
name: Life Tracker — Design System
description: The visual and interaction spec for Life Tracker, a single-user daily-use personal-productivity hub spanning habits, finance, and notes. Warm paper-light canvas as the canonical theme; a mechanically inverted near-black dark theme; one structural blue, decorative sticker accents, pill primary actions, and the rolling-year heatmap as the signature surface. Built on top of shadcn primitives so future surfaces compose from a shared chrome.

colors:
  # ─── Structural accent ───────────────────────────────────────────
  primary: "#0075de"
  primary-active: "#005bab"
  on-primary: "#ffffff"

  # ─── Page canvas & card surfaces (3-layer surface ramp) ───────────
  canvas: "#ffffff"
  canvas-soft: "#f6f5f4"
  surface: "#ffffff"
  surface-soft: "#fafafa"
  surface-raised: "#ffffff"  # Level-1 layered shadow applied via elevation table

  # ─── Text ink (4-tier, AA-verified against canvas-soft) ──────────
  ink: "#000000"
  ink-secondary: "#31302e"
  ink-muted: "#615d59"
  ink-faint: "#706b65"  # darkened from origin value #a39e98 to pass WCAG AA on canvas-soft

  # ─── Hairlines ───────────────────────────────────────────────────
  hairline: "#e6e6e6"
  hairline-strong: "#cccccc"  # elevated dividers, YearHeatmap missed cells

  # ─── Decorative sticker palette (illustration / heatmap ramps / category dots ONLY) ─
  accent-sky: "#62aef0"
  accent-purple: "#d6b6f6"
  accent-purple-deep: "#391c57"
  accent-pink: "#ff64c8"
  accent-orange: "#dd5b00"
  accent-orange-deep: "#793400"
  accent-teal: "#2a9d99"
  accent-green: "#1aae39"
  accent-brown: "#523410"

typography:
  font-family: "Plus Jakarta Sans"
  font-mono: "Geist Mono"
  font-family-fallback: "Plus Jakarta Sans, system-ui, ui-sans-serif, 'Segoe UI', Helvetica, Arial, sans-serif"
  # Per-role letter-spacing values carried over verbatim from the origin spec —
  # they remain compositor- and brand-tight across sans-serif families; the
  # visual-pass ticket may empirically relax any role if Plus Jakarta Sans
  # reads loose at a given size.
  display-1:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: -2.125px
  display-2:
    fontFamily: Plus Jakarta Sans
    fontSize: 54px
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: -1.875px
  heading-1:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1px
  heading-2:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: 700
    lineHeight: 1.23
    letterSpacing: -0.625px
  heading-3:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.27
    letterSpacing: -0.25px
  title:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.125px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: 0
  button:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  eyebrow:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: 0.125px

rounded:
  xs: 4px
  sm: 5px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 28px
  xxl: 32px

components:
  # ─── Primitives (kebab-case) ─────────────────────────────────────
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
  button-primary-pressed:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    border: "1px solid {colors.hairline}"
  button-utility:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "4px 14px"
    border: "1px solid {colors.hairline}"
  button-icon-circular:
    backgroundColor: "rgba(0, 0, 0, 0.05)"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
  badge-pill:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    font-variant-numeric: "tabular-nums"
  feature-card:
    description: "Workhorse app card chrome — cards, widget shells, modals, empty-state frames. Default elevation is Level 0 (hairline only); apply the `–elevated` modifier to add the Level-1 layered shadow instead of minting a separate component."
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.hairline}"
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: 6px
    border: "1px solid {colors.hairline}"

  # ─── Example / shell primitives (kept verbatim, mapped to real surfaces) ───
  ex-app-shell-row:
    description: "SidebarNav item-level chrome. Active state uses brand primary as the indicator."
    backgroundColor: "{colors.canvas}"
    activeIndicator: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
  ex-auth-form-card:
    description: "Sign-in card surface — consumed by `LoginCard` (composed). Same chrome as `feature-card` with `text-input` primitives inside."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.hairline}"
  ex-modal-card:
    description: "Modal dialog surface — `feature-card` chrome with the Level-1 layered shadow. Consumed by shadcn `Dialog` and `AlertDialog`."
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.hairline}"
    elevation: "Level-1"
  ex-empty-state-card:
    description: "Empty-state illustration frame — consumed by `EmptyState` (composed)."
    backgroundColor: "{colors.canvas-soft}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xxl}"
    captionTypography: "{typography.body-md}"
  ex-toast:
    description: "Toast notification surface — `feature-card` shape + Level-1 shadow. Consumed by Sonner."
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.sm} {spacing.md}"
    typography: "{typography.body-sm}"
    elevation: "Level-1"
    aria-live: "polite"

  # ─── Composed app surfaces (PascalCase) ───────────────────────────
  SidebarNav:
    description: "Persistent left navigation on desktop (md and up); collapses to icon-rail with hover-expand; mobile renders a bottom-tab bar separately."
    composedOf: [shadcn Button (ghost), Tooltip, lucide icons (LayoutDashboard, CalendarCheck, Wallet, NotebookPen)]
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-muted}"
    activeIndicator: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    expandedWidth: 240px
    railWidth: 64px
    breakpoint: "md (768px)"
    transition: "width 200ms ease"
    iconSize: 20px
    itemMinHeight: 44px
    aria-label: "Sections"
  SidebarRailCollapsed:
    description: "Pinned-collapsed variant of `SidebarNav`. Section labels hidden, only icons + Tooltip on each; expands back to 240px on hover when not pinned. Pin toggle is a `button-icon-circular` in the rail's top-right."
    composedOf: [SidebarNav, Tooltip, button-icon-circular]
    backgroundColor: "{colors.canvas}"
    railWidth: 64px
    iconSize: 20px
    tooltip: "necessary on every icon — aria-label carries the section name"
  ThemeToggle:
    description: "Icon-only theme switch mounted in the SidebarNav bottom block on desktop and the mobile top-right cluster. Calls `next-themes` `setTheme`; icon (`lucide Sun`/`Moon`) follows `resolvedTheme`."
    composedOf: [shadcn Button (ghost), Tooltip, lucide Sun, lucide Moon]
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    hoverColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 36px
    iconSize: 18px
    aria-label: "Toggle theme"
  TodayHabitsWidget:
    description: "Today-dashboard widget summarizing today's habit state. Keeps Motion's `AnimatePresence` on row enter/exit; row reorder is a popover. `EmptyState` chrome when no active habits."
    composedOf: [feature-card, AnimatePresence, HabitRow, EmptyState, button-icon-circular, AlertDialog (Add-Amount confirm)]
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.hairline}"
    data-testid: "today-habits-widget"
  HabitRow:
    description: "A single Habit card on Today and on the Habits list. Composes 7 shadcn primitives per row; Motion's spring animates the quantifiable-bar fill via `scaleX` (compositor-friendly)."
    composedOf: [shadcn Card, Checkbox, Badge, Progress (with motion.div scaleX spring), DropdownMenu, Dialog (Edit), AlertDialog (Relapse / Add-Amount confirm), Sonner (error via mutationCache onError)]
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px solid {colors.hairline}"
    badgeChrome: "{badge-pill}"
    progressFill: "{colors.primary}"
    progressTrack: "{colors.surface-soft}"
    data-testid: "habit-checkbox, habit-add-amount, habit-actions-menu"
  HabitForm:
    description: "Create/Edit form for a Habit. Build/Quit + Daily/N-per-week/Weekdays are `ToggleGroup`s; Quantifiable target+unit stays inline as a small visible-unit pairing."
    composedOf: [shadcn ToggleGroup, Input, Label, Checkbox, Button (primary + utility)]
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    inputChrome: "{text-input}"
    primaryAction: "{button-primary}"
    secondaryAction: "{button-utility}"
  HabitDetail:
    description: "The `/habits/[id]` page. Composes a read-only `HabitRow` (no DropdownMenu) + the signature `YearHeatmap`. Page h1 uses `heading-2` typography (26px)."
    composedOf: [HabitRow (read-only), YearHeatmap, section-page heading-2]
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    padding: "{spacing.lg}"
  YearHeatmap:
    description: "Signature surface — per-Habit rolling-year chart (365 day-cells at 10px each). Bespoke SVG canvas rendering (preserved); only the color tokens read from CSS variables so retokenization reframes the chart without redrawing the layout."
    composedOf: [bespoke SVG, CSS custom-property color reads]
    backgroundColor: "{colors.surface}"
    padding: "{spacing.lg}"
    rounded: "{rounded.xl}"
    border: "1px solid {colors.hairline}"
    cellSize: 10px
    cellRadius: 2px
    cellColors:
      done: "{colors.primary}"
      missed: "{colors.hairline-strong}"
      not-due: "{colors.surface}"
      relapse: "{colors.ink-faint}"
      before-creation: transparent
      out-of-year: transparent
    legendTypography: "{typography.eyebrow}"
    font-variant-numeric: "tabular-nums"
  LoginCard:
    description: "The auth gate's single surface. Composes `ex-auth-form-card` chrome with shadcn Card + Button + Alert for signed-in/error regions."
    composedOf: [ex-auth-form-card, shadcn Card, Button (primary + secondary), Alert]
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    padding: "{spacing.lg}"
    errorChrome: shadcn Alert with `variant="destructive"`
  CommandPaletteShell:
    description: "⌘K palette. Replaces direct cmdk consumption with shadcn `Command` wrapped in `Dialog`. Visible ⌘&#160;K hint in SidebarNav's bottom block (Tooltip on mobile icon-only access)."
    composedOf: [shadcn Command (wraps cmdk), Dialog, lucide Check, lucide ChevronRight]
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xl}"
    groupHeadingTypography: "{typography.eyebrow}"
  EmptyState:
    description: "Centered empty-state frame for Nothing due today / No accounts yet / No pages yet. Composes `ex-empty-state-card` chrome with a lucide centered icon."
    composedOf: [ex-empty-state-card, shadcn Card, lucide icon 28px]
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink-muted}"
    titleTypography: "{typography.title}"
    captionTypography: "{typography.body-md}"
    iconSize: 28px
---

## Overview

Life Tracker's design language is a warm-paper personal-productivity system. The dominant page surface is `canvas-soft` (#f6f5f4) — a warm, paper-soft off-white that takes the clinical edge off the screen and makes long tracking sessions feel like a document rather than an app. Type is set in **Plus Jakarta Sans** in near-black `ink` (#000000) at tight negative tracking for display sizes, so headlines read as set, not stretched. The whole system whispers in greys and blacks, then says exactly one thing in colour: a single, dependable primary blue `#0075de`, reserved for primary-action fills, the active/focus signal, and nothing else.

Against that quiet chrome, a **decorative sticker palette** carries all the personality — purple, pink, orange, teal, green, sky-blue, and brown appear as category dots, YearHeatmap ramps, and future illustration tiles. These colours never structure the layout or paint a primary action; they decorate. The discipline is deliberate — the interface stays monochrome-plus-blue so content (and the rolling-year history) can breathe.

The 365-cell **YearHeatmap** on the Habit detail page is this product's signature surface. It is the one artifact a habit-tracking personal hub cannot do without and where the calm paper aesthetic pays off most: a year of days read in two glances, with the single primary-blue `done` cells catching the eye and the warm grey paper tolerating the long empty stretches between routines. Every other surface exists to make Space for that chart to land when the user drills into a habit.

A mechanically-inverted **dark theme** ships toggleable. The warm paper `#f6f5f4` becomes a warm near-black `#1f1d1a`; the near-black ink becomes a warm near-white; the single primary blue stays literally unchanged across both themes, preserving the brand discipline in the dark variant without reverse-engineering a separate dark-token spec.

**Key Characteristics:**
- Warm paper-soft `canvas-soft` `#f6f5f4` over pure white `surface` — calm, document-like, never clinical
- Near-black `ink` set in **Plus Jakarta Sans** with per-role negative tracking pills (display-1: −2.125px at 64px)
- Exactly one structural accent — the primary blue `#0075de` — reserved for primary-action fills + the active/focus signal (never inline link body text; inline links use `ink` + `underline`)
- A decorative-only multi-colour sticker palette (`accent-purple`, `accent-pink`, `accent-orange`, `accent-teal`, `accent-green`, `accent-sky`, `accent-brown`) that adds personality without ever painting structure
- Pill-shaped primary CTA buttons (`rounded.full`) contrasted with 8px utility buttons (`rounded.md`) and square-ish 4px inputs (`rounded.xs`)
- App chrome at 16px (`rounded.xl`) for cards/widgets/modals — slightly slicker than the canonical Notion 12px marketing tile to read as app, not marketing
- Hairline-defined surfaces with barely-there layered shadows, not heavy drop-shadows; the dark theme inverts the shadow stack polarity (`rgba(255,255,255,a)`)
- The rolling-year **YearHeatmap** as the signature surface — the one memorable artifact this product owns

> **Origin footnote.** The design language inherits Notion's paper-light + one-blue + sticker-palette brand discipline verbatim as its foundation — the value of that discipline for a calm, daily-use, document-like personal hub was the reason Life Tracker adopted it rather than starting from a fresh system. The product surface (habit tracking, finance logging, note-taking) is Life Tracker's own; the typography family (Plus Jakarta Sans) and the app-chrome radii deliberately diverge from Notion's marketing-site literal values to read as *this* product, not as a website-template.

## Colors — light

### Brand & accent
- **Primary** (`{colors.primary}` — #0075de): the single structural accent. Primary-action fill (Save Habit, Confirm Relapse, Sign In, Add Amount), the active/focus signal. The only colour that ever paints an action.
- **Primary Active** (`{colors.primary-active}` — #005bab): the pressed state of the primary fill.
- **On Primary** (`{colors.on-primary}` — #ffffff): the text/glyph colour on a primary fill in both themes.

The remaining colours form the **decorative sticker palette** — they appear only as illustration tiles, category dots, and YearHeatmap ramp fills, never as primary actions or structural fills:
- **Sticker Sky** (`{colors.accent-sky}` — #62aef0)
- **Sticker Purple** (`{colors.accent-purple}` — #d6b6f6) / **Deep Purple** (`{colors.accent-purple-deep}` — #391c57)
- **Sticker Pink** (`{colors.accent-pink}` — #ff64c8)
- **Sticker Orange** (`{colors.accent-orange}` — #dd5b00) / **Deep Orange** (`{colors.accent-orange-deep}` — #793400)
- **Sticker Teal** (`{colors.accent-teal}` — #2a9d99)
- **Sticker Green** (`{colors.accent-green}` — #1aae39)
- **Sticker Brown** (`{colors.accent-brown}` — #523410)

### Surface — 3-layer ramp
- **Canvas** (`{colors.canvas}`, `{colors.surface}` — #ffffff): card surfaces, form fields, sidebar background.
- **Warm Paper** (`{colors.canvas-soft}` — #f6f5f4): the page canvas and the empty-state frame — warm off-white that gives the app its document-like calm.
- **Surface Soft** (`{colors.surface-soft}` — #fafafa): hover / soft-fill lift, the warm wash on a hovered card and the badge-pill background.
- **Surface Raised** (`{colors.surface-raised}` — #ffffff): same value as `surface`; elevation is implied by the Level-1 layered shadow applied via the elevation table — not a tint shift.

### Hairlines
- **Hairline** (`{colors.hairline}` — #e6e6e6): 1px card borders and dividers, kept solid for token reuse, designed as barely-there (~1.25:1 contrast on white).
- **Hairline Strong** (`{colors.hairline-strong}` — #cccccc): elevated dividers and the YearHeatmap *missed* cell fill — visible enough to read as an unused day without competing with the primary-blue *done* fill.

### Text — 4-tier, AA-verified against `canvas-soft #f6f5f4`
- **Ink** (`{colors.ink}` — #000000): primary headings and body text (rendered at ~95% alpha for soft true-black).
- **Warm Charcoal** (`{colors.ink-secondary}` — #31302e): secondary body copy.
- **Stone** (`{colors.ink-muted}` — #615d59): supporting / muted copy. AA-verified at 5.99:1 on `canvas-soft` and 6.53:1 on `surface`.
- **Ash** (`{colors.ink-faint}` — #706b65): the most-de-emphasized tier that still passes WCAG AA — captions, metadata, placeholder text. **Field override**: the origin spec's value `#a39e98` fails AA at 2.44:1 on `canvas-soft`; Life Tracker darkens it to `#706b65` (4.85:1 on `canvas-soft`, 5.28:1 on `surface`) while keeping the warm-stone hue family. The original `#a39e98` survives as the dark ink-faint (it passes AA on the near-black canvas — see the dark appendix).

### Semantic
Life Tracker does not ship a separate semantic ramp — affirmative cues use the primary blue (Done), destructive states use `AlertDialog` chrome (not a colour), and the sticker palette carries any incidental category distinction. A future finance-budget-overrun state may introduce a single `semantic-warning` token; for now, not represented.

## Dark mode — inverted tokens

The dark theme is **mechanically inverted** from the light palette: warm paper → warm near-black, near-black ink → warm near-white, primary blue unchanged. Where a clean inversion is not possible (the three dark sticker variants, designed as fills against a white hero band and thus invisible against near-black), a documented dark-mode override takes its place.

`next-themes` toggles the `.dark` class on `<html>`. `globals.css` MUST set `:root { color-scheme: light }` and `.dark { color-scheme: dark }` so native scrollbars, form controls, and the address bar read in the active theme.

### Dark appendix table

| Light token | → Dark token | dark value | on dark canvas contrast | note |
|---|---|---|---|---|
| `canvas` `#ffffff` | `canvas-dark` | `#1f1d1a` | — | warm near-black; mechanical luminance inversion preserving the warm hue (R≥G≥B) |
| `canvas-soft` `#f6f5f4` | *(no dark counterpart — single dark page canvas)* | — | — | the dark theme uses one canvas token; no `canvas-soft-dark` is introduced |
| `surface` `#ffffff` | `surface-dark` | `#26231f` | — | cards/inputs lift *lighter* than the page |
| `surface-soft` `#fafafa` | `surface-soft-dark` | `#2c2823` | — | hover/soft fill |
| `surface-raised` `#ffffff` | `surface-raised-dark` | `#33302b` | — | Level-1 elevated |
| `hairline` `#e6e6e6` | `hairline-dark` | `#3a3631` | 1.40:1 on canvas-dark | barely-there, matches light's 1.25:1 on white |
| `hairline-strong` `#cccccc` | `hairline-strong-dark` | `#4c4843` | 1.85:1 on canvas-dark | elevated dividers, YearHeatmap missed cells |
| `ink` `#000000` | `ink` | `#f6f5f4` | 15.57:1 | warm near-white (paper-as-ink) |
| `ink-secondary` `#31302e` | `ink-secondary` | `#d4cfc7` | 10.85:1 | |
| `ink-muted` `#615d59` | `ink-muted` | `#c9c4be` | 9.71:1 | |
| `ink-faint` `#706b65` *(light-darkened for AA)* | `ink-faint` | `#a39e98` *(Notion original; passes AA on dark)* | 6.33:1 | the original Notion value was AA-clean against dark surfaces, so it survives as the dark ink-faint; the *light-side* override stays at `#706b65` |
| `primary` `#0075de` | `primary` | `#0075de` | 3.68:1 as raw colour; **link-use restricted** | unchanged across themes per ADR 0003; inline link body text never painted in primary (use `ink` + `underline`) |
| `primary-active` `#005bab` | `primary-active` | `#005bab` | — | pressed fill, both themes |
| `on-primary` `#ffffff` | `on-primary` | `#ffffff` | 4.57:1 on `#0075de` | text on a primary fill stays white in both themes |
| `accent-sky` `#62aef0` | `accent-sky` | `#62aef0` | 7.07:1 | bright sticker; unchanged |
| `accent-purple` `#d6b6f6` | `accent-purple` | `#d6b6f6` | 9.51:1 | unchanged |
| `accent-purple-deep` `#391c57` | `accent-purple-deep-dark` | `#9d7fc9` | 5.05:1 | **dark override** — origin dark sticker invisible at 1.18:1; lifted to a light lavender in the same hue family |
| `accent-pink` `#ff64c8` | `accent-pink` | `#ff64c8` | 6.33:1 | unchanged |
| `accent-orange` `#dd5b00` | `accent-orange` | `#dd5b00` | 4.46:1 | unchanged |
| `accent-orange-deep` `#793400` | `accent-orange-deep-dark` | `#d9843a` | 5.85:1 | **dark override** — origin dark sticker near-invisible at 1.84:1; lifted to amber |
| `accent-teal` `#2a9d99` | `accent-teal` | `#2a9d99` | 5.11:1 | unchanged |
| `accent-green` `#1aae39` | `accent-green` | `#1aae39` | 5.73:1 | unchanged |
| `accent-brown` `#523410` | `accent-brown-dark` | `#c89876` | 6.57:1 | **dark override** — origin brown invisible at 1.49:1; lifted to a warm caramel in the same stone-hue family. This is the specific non-invertible case ADR 0003 anticipated. |

> **Mechanical inversion algorithm.** The dark appendix is *luminance inversion preserving hue family* (R≥G≥B in light stays R≥G≥B in dark), NOT literal per-channel RGB inversion — the latter would flip warm brown to cold cyan-blue. Three dark sticker variants (`accent-purple-deep`, `accent-orange-deep`, `accent-brown`) are designed as fills against light hero bands; visible against near-black only through the documented overrides recorded above.

## Typography

### Font family
The entire sans system is set in **Plus Jakarta Sans** (Tokotype, Google Fonts, variable weight 200–800), loaded via `next/font/google` and injected as `--font-jakarta`. `Geist Mono` carries code blocks and any tabular-mono display (numeric mono columns if needed). The fallback stack is `Plus Jakarta Sans, system-ui, ui-sans-serif, "Segoe UI", Helvetica, Arial, sans-serif`.

> **Why Plus Jakarta Sans and not Inter.** The origin aesthetic was set in `NotionInter` — a proprietary tuning of open-source Inter; the closest faithful substitute would be Inter directly. Life Tracker diverges deliberately: Plus Jakarta Sans is a geometric sans with a friendly contemporary voice that pairs better with the journal-like warmth a personal tracker should have than Inter's more terminal-neutral geometry. The trade-off is that Plus Jakarta Sans reads slightly looser than a tuned Inter at display sizes; the per-role letter-spacing values below carry verbatim from the origin spec, and the migration tracks' final visual pass (Track D1) verifies empirically whether any role needs local relaxation.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-1}` | 64px | 700 | 1.0 | −2.125px | Future marketing surface (rare; not currently rendered) |
| `{typography.display-2}` | 54px | 700 | 1.04 | −1.875px | Future large section headlines |
| `{typography.heading-1}` | 40px | 700 | 1.1 | −1px | Section page headlines (e.g., Habits list h1, Finance/Notes stub h1) |
| `{typography.heading-2}` | 26px | 700 | 1.23 | −0.625px | HabitDetail page h1, modal titles, widget-card headers |
| `{typography.heading-3}` | 22px | 700 | 1.27 | −0.25px | Card titles, today-widget titles |
| `{typography.title}` | 20px | 600 | 1.4 | −0.125px | EmptyState titles, modal section titles |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default body copy, notes future editor body |
| `{typography.body-sm}` | 15px | 400 | 1.33 | 0 | Dense body, habit-row description, nav text |
| `{typography.button}` | 16px | 500 | 1.5 | 0 | Button labels |
| `{typography.caption}` | 14px | 400 | 1.43 | 0 | Captions, footnotes, form helper text |
| `{typography.eyebrow}` | 12px | 600 | 1.33 | +0.125px | Pill badges, group headings (CommandPalette), small labels |

### Implementation
- Per-role tracking tokens surface as custom utilities (`--tracking-display-1`, `--tracking-heading-1`, `--tracking-heading-2`, `--tracking-heading-3`, `--tracking-title`, `--tracking-eyebrow`; body/button/caption carry 0). The existing global `-0.003em` / heading `-0.02em` hack in `globals.css` is **dropped** — each `text-heading-*` utility bundles its own tracking.
- `text-wrap: balance` applies on `h1`–`h3` to prevent widows (and on `text-pretty` for long body paragraphs in the future Notes editor).
- `font-variant-numeric: tabular-nums` for any column of numbers (streak pills "11 days", elapsed pills "3d ago", YearHeatmap legend, future Finance widgets).
- OpenType `lnum`(lining numerals) is enabled on body and heading roles.

### Voice
Typography carries the personality of the page. Plus Jakarta Sans at weight 700 with aggressive negative tracking (display-1 −2.125px) reads **set, not stretched**. Body copy at 400 with a comfortable 1.5 line-height stays document-readable. The contrast between a heavy 700 headline and a calm 400 body is the primary expressive lever — there is no decorative typography type role; only a clean hierarchy.

## Layout

### Spacing system
- **Base unit**: 8px.
- **Tokens (front matter)**: `xxs` 4px · `xs` 8px · `sm` 12px · `md` 16px · `lg` 24px · `xl` 28px · `xxl` 32px.
- Card interior padding lands at `lg` (24px); utility buttons use a tight 4px/14px; form fields pad at `6px`. Section gaps stack the larger steps.

### Grid & container
Content sits in a centred ~960px max-width column on the section pages, with sidebar 240px on the left and the main panel filling the rest. The Today dashboard renders a 12-col grid (`grid-cols-1 md:grid-cols-3`) for widgets; one column on mobile. YearHeatmap scrolls horizontally on mobile and full-width on desktop.

### Whitespace philosophy
Whitespace is the primary grouping device. Sections are separated by large vertical gaps rather than rules. Cards sit on the warm canvas with quiet hairlines instead of heavy frames. The result is document-like: airy, scannable, never crowded.

### Responsive strategy

#### Breakpoints
| Name | Width | Key changes |
|---|---|---|
| Wide | 1280px+ | Sidebar 240px expanded + roomy main panel |
| Desktop | 768–1280px | Sidebar 240px expanded or 64px rail per user pref |
| Tablet | < 768px | Sidebar hidden; bottom-tab nav takes over; widgets stack 1-column; YearHeatmap scrolls horizontally |
| Mobile | ≤ 600px | Same as Tablet; the mobile top-right cluster holds `ThemeToggle` + `SignOutButton` |

#### Touch targets
Pill primary CTAs (`button-primary`, `button-secondary`) and utility buttons (`button-utility`) carry comfortable tap padding; minimum 44×44px on mobile by preserving vertical padding even as labels shrink. `SidebarNav` items use `min-height: 44px`.

#### Safe areas
On mobile PWAs the notch and home indicator must not occlude the bottom-tab or the top-right cluster. Globals must consume `env(safe-area-inset-bottom)` on the bottom-tab bar and `env(safe-area-inset-top) / env(safe-area-inset-right)` on the mobile top-right cluster (`ThemeToggle` + `SignOutButton`).

### Surface Map

**Today** — the daily aggregator. Primary chrome is `WidgetCard` (`feature-card` shell); per-widget Motion stagger on enter; sections that don't ship yet (Finance, Notes) live as `EmptyState` chrome holding the slot.

**Habits** — the densest surface. `HabitRow` carries `Card` + `Checkbox` + `Badge` + `Progress` + `DropdownMenu` + `Dialog` + `AlertDialog` + `Sonner`-error — seven primitives in one row. The habit-detail page anchors on the signature `YearHeatmap`. The warm paper keeps ritual-tracking calm, not coach-y.

**Finance** — stub today; future number-led widgets. When populated, widgets will use `tabular-nums` Plus Jakarta Sans on `feature-card` surfaces; the design language leans on columned readability, not colour-led hierarchy.

**Notes** — stub today; future editor. Will rely on `body-md` 1.5 line-height on `canvas-soft`; warm canvas makes writing feel journal-like, not terminal. Safely ignored by this version of the spec.

## Shapes

### Border radius scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Form fields, small tags, inline chips |
| `{rounded.sm}` | 5px | Menu items, list rows, status pills (legacy; rarely used in app chrome) |
| `{rounded.md}` | 8px | `button-utility`, `SidebarNav` items, `ex-app-shell-row` active row indicator |
| `{rounded.lg}` | 12px | Marketing-tile illustration frames (rare in app; reserved) |
| `{rounded.xl}` | 16px | **App chrome — `feature-card`, modal cards, `EmptyState`, `YearHeatmap`, `CommandPaletteShell`** |
| `{rounded.full}` | 9999px | Primary-action pill CTAs, secondary pill CTAs, `badge-pill`, `button-icon-circular`, `ThemeToggle` |

### Icon geometry
Lucide stroke icons render at 20px inside `SidebarNav` items and at 18px inside `ThemeToggle`/`button-icon-circular`. YearHeatmap cells render at 10px squares with 2px (`rounded-[2px]`) corners. Avatars and circular icon buttons carry `rounded.full` — there is no heavy art-direction crop; icons scale within their declared size.

## Elevation & Depth

| Level | Treatment (light) | Treatment (dark — mechanical inversion) | Use |
|---|---|---|---|
| **0 — Flat** | `1px solid {colors.hairline}`, no shadow | `1px solid {colors.hairline-dark}`, no shadow | Default cards on the warm canvas |
| **1 — Soft** | Layered micro-shadow `rgba(0,0,0,0.01) 0 0.175px 1.041px`, `0.02 0 0.8px 2.925px`, `0.027 0 2.025px 7.847px`, `0.04 0 4px 18px` | Inverted: `rgba(255,255,255,0.01) … 0 4px 18px` (same stack, channel-polarized) | Raised feature cards (`feature-card –elevated`), floating buttons, `ex-modal-card`, `ex-toast` |
| **2 — Elevated** | 5-stop stack ending `rgba(0,0,0,0.05) 0 23px 52px` | Inverted 5-stop stack ending `rgba(255,255,255,0.05) 0 23px 52px` | `CommandPaletteShell` backdrop, raised dropdown / popover |

The elevation philosophy is **barely-there** in both themes: shadows are built from many near-transparent layers so surfaces feel gently lifted off the paper rather than dramatically dropped. Dark-theme shadows read as a faint top-edge light-spill against the near-black canvas; the hairline carries most of the depth, the shadow is the second voice.

## Motion & Depth

Two animation systems coexist with a strict boundary:

### Motion-owned (lifecycle / ambient)
These are Framer Motion (`motion/react`) animations retained on mount / unmount and ambient state transitions:

| Surface | Animation | Property | Duration / spring | `prefers-reduced-motion` |
|---|---|---|---|---|
| `TodayHabitsWidget` rows | enter (`opacity 0, y 8 → 0, 0`) / exit (`y → -8, opacity 1 → 0`) | `transform`, `opacity` | spring stiffness 200 / damping 25 | dead — instant cut |
| Today page stagger | per `WidgetCard` enter with delay `i × 0.05s` | `transform`, `opacity` | ease-out 0.4s | dead — instant cut |
| `WidgetCard` slide-in | `opacity 0, y 12 → 1, 0` | `transform`, `opacity` | ease-out 0.4s | dead — instant cut |
| `HabitRow` quantifiable-bar fill | `scaleX(0 → progressRatio)` on a 100%-width inner fill (`transform-origin: left`) | `transform` | spring stiffness 200 / damping 25 | dead — instant cut |

> **Per-role progress-bar compositor note.** The migration tracks pin the quantifiable-bar fill to `scaleX` of a 100%-width inner node (`transform-origin: left`), NOT `width` animation. `width` is not compositor-friendly; `scaleX` keeps the spring on the GPU and satisfies the Web Interface Guidelines "animate transform/opacity only" directive.

### shadcn-CSS-owned (hover / press / open / close)
Short, well-tolerated transitions delivered via Tailwind `data-[state=open]:animate-in` / `-out` utilities on shadcn primitives:

- `Dialog` (Edit-Habit) open/close — fade + zoom
- `AlertDialog` (Relapse, Add-Amount confirm) open/close
- `DropdownMenu` (HabitRow kebab actions) open/close — fade + slide
- `Command` (CommandPaletteShell) open/close — fade
- `Sheet` (mobile drawer if used) open/close — slide
- `Tooltip` (collapsed SidebarNav icons, ThemeToggle, icon-only actions) open/close — fade-zoom
- `Popover` (Add-Amount inline confirm if chosen over AlertDialog) open/close

These stay active under `prefers-reduced-motion` — they're short open/close transitions and well-tolerated per Web Interface Guidelines.

### `prefers-reduced-motion: reduce`
- Motion ambient animations (the four rows above) collapse to instant — zero duration.
- shadcn CSS transitions stay ON.
- Tab focus rings stay visible (focus-visible unaffected).

## Components

> **Naming convention.** Two tiers — lowercase-kebab entries are **primitives / chrome tokens** (the lowest-level building blocks — `button-primary`, `feature-card`, `text-input`, …). PascalCase entries are **composed app surfaces** that consume one or more primitives (`HabitRow`, `TodayHabitsWidget`, `LoginCard`, …). The five `ex-*` entries (`ex-app-shell-row`, `ex-auth-form-card`, `ex-modal-card`, `ex-empty-state-card`, `ex-toast`) inherit the `ex-` prefix — short for "example" — from the origin kit spec where they were demo frames; in this rewrite they are real surfaces consumed by their PascalCase siblings (`ex-empty-state-card` → `EmptyState`, `ex-auth-form-card` → `LoginCard`, `ex-modal-card` → `Dialog`/`AlertDialog` shells, `ex-toast` → Sonner). Each composed entry declares `composedOf:` (the primitives consumed) plus the styling tokens it inherits.

### Primitives

**`button-primary`** — primary action CTA (Save Habit, Confirm Relapse, Sign In, Add Amount)
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}`, fully pill-shaped `{rounded.full}`. The single structural blue action on any page.
- Press state lives in `button-primary-pressed` (background `{colors.primary-active}`).
- shadcn `Button` variant: `default`.

**`button-primary-pressed`**
- Background `{colors.primary-active}`, text `{colors.on-primary}` — the depressed state of the primary CTA.

**`button-secondary`** — Secondary CTA (Cancel within a paired CTA group, "Continue as guest")
- White surface `{colors.surface}`, text `{colors.ink}`, type `{typography.button}`, pill `{rounded.full}`, 1px `{colors.hairline}` border. Pairs beside `button-primary` in `LoginCard` and `AlertDialog` actions.
- shadcn `Button` variant: `outline`.

**`button-utility`** — Utility action (nav CTAs, plan-select-like smaller buttons)
- White surface `{colors.surface}`, text `{colors.ink}`, type `{typography.button}`, tighter `{rounded.md}` (8px), padding `4px 14px`, 1px `{colors.hairline}` border. Used where the marketing pill would be too large.
- shadcn `Button` variant: `secondary` (with tighter radius override).

**`button-icon-circular`** — Icon-only action (`SidebarCollapse` toggle, `ThemeToggle`, Today-widget `+`)
- Circular `{rounded.full}`, translucent `rgba(0,0,0,0.05)` fill in light / `rgba(255,255,255,0.05)` in dark, `{colors.ink}` glyph.
- **MUST declare `aria-label`** (the only on-screen content is an icon).
- shadcn `Button` variant: `ghost` + `size="icon"`.

**`badge-pill`** — Streak / elapsed / category dot
- Surface `{colors.surface-soft}`, text `{colors.ink-faint}`, type `{typography.eyebrow}`, fully pill `{rounded.full}`, padding `2px 8px`, `tabular-nums` (numbers stay aligned at any count).
- shadcn `Badge` variant: `secondary`.

**`feature-card`** — Workhorse app card chrome
- White surface `{colors.surface}`, `{colors.ink}` text, `{typography.body-md}`, rounded `{rounded.xl}` (16px), padding `{spacing.lg}` (24px), 1px `{colors.hairline}` border. Default elevation is Level 0 (hairline only).
- `–elevated` modifier: adds the Level-1 layered shadow from the Elevation table for raised cards (WidgetCards, floating product panels, toast, modal surface chrome). No separate `feature-card-elevated` component entry — the modifier is a property of `feature-card` chrome.
- shadcn `Card` (CardHeader / CardContent / CardFooter).

**`text-input`** — Text / number field
- White surface `{colors.surface}`, `{colors.ink}` text, `{typography.body-sm}`, 1px `{colors.hairline}` border, rounded `{rounded.xs}` (4px), padding `6px`. Square-ish corners deliberately tighter than the pill CTAs. Focus adds the soft Level-1 shadow.
- shadcn `Input` + `Label`.

**`ex-app-shell-row`** — SidebarNav item chrome
- Background `{colors.canvas}`, active indicator `{colors.primary}`, rounded `{rounded.md}`, padding `{spacing.sm} {spacing.md}`. The SidebarNav row's "active" state paints the primary indicator — a 2px left ribbon or a primary-tinted background — and `{colors.ink}` text; inactive rows use `{colors.ink-muted}` text and a transparent background, elevating to `{colors.ink}` + `{colors.surface-soft}` background on hover.

**`ex-auth-form-card`** — Sign-in card surface
- White surface `{colors.surface}`, rounded `{rounded.xl}`, padding `{spacing.lg}`, 1px `{colors.hairline}` border. The chrome `LoginCard` consumes — same shell with `text-input` primitives inside.

**`ex-modal-card`** — Modal dialog surface
- White surface `{colors.surface}`, rounded `{rounded.xl}`, padding `{spacing.lg}`, 1px `{colors.hairline}` border, Level-1 layered shadow applied. Consumed by shadcn `Dialog` and `AlertDialog`.

**`ex-empty-state-card`** — Empty-state frame
- Warm `{colors.canvas-soft}` fill (sets the empty/held tone apart from active cards on white), rounded `{rounded.xl}`, padding `{spacing.xxl}`. Caption typography `{typography.body-md}`. Consumed by `EmptyState`.

**`ex-toast`** — Toast notification surface
- White surface `{colors.surface}`, `{colors.ink}` text, body-sm, rounded `{rounded.xl}`, padding `{spacing.sm} {spacing.md}`, Level-1 layered shadow. `aria-live="polite"` on the toast region so screen-readers announce completion / failure. Consumed by shadcn Sonner.

### Composed app surfaces

**`SidebarNav`** — Persistent left navigation on desktop
- Composes: shadcn `Button` (ghost) for the collapse-toggle pin + each section row (which use `ex-app-shell-row` chrome); `Tooltip` for icons-only states; lucide icons (`LayoutDashboard` Today, `CalendarCheck` Habits, `Wallet` Finance, `NotebookPen` Notes).
- 240px expanded width on desktop (Tailwind `w-60`); 64px collapsed rail (Tailwind `w-16`); the width transition is `200ms ease`, animate `width` only.
- Collapsible on desktop (≥ md breakpoint 768px); pinned state stays at 240px regardless of hover; the rail expands back to `240px` on hover only when it is not pinned. The pinned-rail semantics live in `SidebarRailCollapsed` below.
- Mobile (< md): hidden; the bottom-tab bar (4-column grid) carries navigation. `ThemeToggle` + `SignOutButton` move to the mobile top-right cluster with `env(safe-area-inset-*)` padding.
- Each icon-only entry in the collapsed rail MUST `Tooltip` and `aria-label` the section name.
- Bottom block holds `ThemeToggle` + `SignOutButton` + the `⌘K` search hint (visible on the expanded sidebar as "Search… ⌘ K", on the rail as just a `⌘K` glyph button).

**`SidebarRailCollapsed`** — Pinned-collapsed variant of SidebarNav
- Same chrome as `SidebarNav` with width pinned at 64px. Section labels hidden; the bottom block compresses to icon-only equivalents (`ThemeToggle` and the `⌘K` glyph button, sign-out moved to its own icon).
- Tooltip is mandatory on every icon — `aria-label` carries the section name.
- Pin toggle is a `button-icon-circular` (`SidebarCollapse`) in the rail's top-right corner.

**`ThemeToggle`** — Theme switch
- shadcn `Button` ghost + icon size, 36px target; `lucide Sun` in light mode, `lucide Moon` in dark mode; icon follows `next-themes`'s `resolvedTheme`.
- On click calls `setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')`.
- `Tooltip` on hover explaining the current choice; `aria-label="Toggle theme"` regardless.
- Mounted in SidebarNav bottom block (desktop) and mobile top-right cluster beside `SignOutButton`.

**`TodayHabitsWidget`** — Today-dashboard habits widget
- Composes `feature-card` shell + Motion `AnimatePresence` on row enter/exit + `HabitRow` repeated + `EmptyState` chrome when no active habits + a `button-icon-circular` `+` that opens an `AlertDialog` (Add-Amount confirm) for quantifiable habits or scrolls to the create-habit `Dialog` for non-quantifiable.
- `data-testid="today-habits-widget"` on the outer card.

**`HabitRow`** — Single Habit card
- Composes 7 shadcn primitives per row: `Card` (shell) + `Checkbox` (done toggle for Build habits) + `Badge` (streak / elapsed pill) + `Progress` (quantifiable-bar; **inner fill animates `scaleX` via motion.div spring 200/25, NOT `width`**) + `DropdownMenu` (kebab actions: Edit / Reset / Archive) + `Dialog` (Edit form) + `AlertDialog` (Relapse confirm and Add-Amount confirm) + Sonner error toast (consumed from the `QueryClient` `mutationCache.onError` handler).
- `data-testid="habit-checkbox"` on the done Checkbox; `data-testid="habit-actions-menu"` on the kebab trigger; `data-testid="habit-add-amount"` on the `+` Add-Amount trigger.
- Removes every inline hex literal from `style` props — all colour resolvers go through Tailwind classes backed by tokens.

**`HabitForm`** — Create / Edit form
- shadcn `ToggleGroup` for Build/Quit (single) and for Daily/N-per-week/Weekdays (single). Quantifiable target+unit stays inline as a small visible-unit pairing (not worth a popover).
- `Input` (with `Label`) for name + description + target + unit; `Checkbox` for any confirm; `Button` (primary pill "Save Habit" + utility "Cancel").

**`HabitDetail`** — `/habits/[id]` page
- Composes a read-only `HabitRow` display (no `DropdownMenu` — the page itself owns the actions) + the signature `YearHeatmap`. Section-page h1 uses `heading-2` typography (26px / 700 / −0.625px). Page background sits on `canvas-soft`; the YearHeatmap sits inside `feature-card` chrome on top.

**`YearHeatmap`** — Signature rolling-year chart
- **Signed surface**: each Habit detail page anchors on this chart — 365 day-cells at 10px squares with 2px corner radius; bespoke SVG rendering preserved across the migration; only the colour scale reads from CSS custom-property tokens so retokenization reframes the chart without redrawing layout.
- Cell-status colors:
  - `done` — `{colors.primary}` (single structural blue)
  - `missed` — `{colors.hairline-strong}` (`#cccccc` light, `#4c4843` dark) — visible enough to read as an unused day without competing with the *done* cells
  - `not-due` — `{colors.surface}` (light) / `{colors.surface-dark}` (dark) — no fill, just the hairline
  - `relapse` — `{colors.ink-faint}` (`#706b65` light, `#a39e98` dark)
  - `before-creation` — transparent
  - `out-of-year` — transparent with a dashed hairline border
- Legend uses `eyebrow` typography with `tabular-nums`.
- Vitest test (`year-heatmap.test.tsx`) is updated only if the color-scale change forces it; the test pins on visible cell states, not exact hex.

**`LoginCard`** — Auth gate single surface
- Composes `ex-auth-form-card` chrome + shadcn `Card` + `Button` (primary pill "Sign in with Google") + `Button` (secondary outline if needed) + `Alert` for error/signed-in regions. `ERROR_MESSAGES` map stays as pure data.
- Works in both themes; no Linear-dark-only literals.

**`CommandPaletteShell`** — ⌘K palette
- shadcn `Command` (wraps `cmdk`) inside a `Dialog`. Group headings use `eyebrow` typography with `tabular-nums` for any countable label. `lucide Check` and `lucide ChevronRight` replace the bespoke `CheckBadge` / `Arrow Badge` SVGs; `lucide` icons replace `SectionIcon`.
- Visible `⌘ K` keyboard hint in the SidebarNav bottom block; the palette is accessible on mobile via a small `⌘K` glyph button (with `Tooltip`).
- Static text uses non-breaking-space between `⌘` and `K`: render `⌘&nbsp;K` (or `⌘\u00A0K`).

**`EmptyState`** — Empty placeholder composition
- `ex-empty-state-card` chrome + shadcn `Card` + a centered lucide icon (28px). Title `{typography.title}` 20/600 + caption `{typography.body-md}`. Used for "Nothing due today", "No accounts yet", "No pages yet".

## Copy & layout Do's (for migration tracks)

- Action labels in active voice: "Save habit", "Confirm relapse", "Sign in with Google". Not "Saving..." for static labels; reserve `…` (single char, not `...`) for explicit in-progress states ("Saving…", "Loading…").
- Curly quotes `"…"` not straight `"` in body copy.
- Numerals for counts ("11 days", "3d ago"). Non-breaking spaces between `⌘` and `K` and in brand name ("Life&nbsp;Tracker" when needed for tight inline use).
- `Intl.DateTimeFormat` for date labels; `Intl.NumberFormat` for currency/number formatting — never hardcoded formats.
- `text-wrap: balance` on `h1`–`h3`; `text-pretty` on long body paragraphs.
- Title Case for headings and buttons (Chicago style).

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` for primary-action fills (`button-primary`) and the active/focus signal — nothing decorative. Inline links use `{colors.ink}` + `underline`.
- Keep the page on the warm `{colors.canvas-soft}` canvas; use white `{colors.surface}` for cards to create gentle figure/ground.
- Let the sticker palette (`accent-pink`, `accent-teal`, `accent-orange`, …) live only in illustration tiles, category dots, and YearHeatmap ramps — never as primary-action fills or structural text colour.
- Set headlines in heavy `{typography.heading-1}` / `heading-2` with their per-role letter-spacing applied explicitly (via `text-heading-1` etc. utility classes).
- Use pill `{rounded.full}` for primary-action CTAs and tighter `{rounded.md}` for utility buttons; use 16px `{rounded.xl}` for app chrome cards and 4px `{rounded.xs}` for inputs.
- Define surfaces with `{colors.hairline}` and the barely-there Level-1 shadow rather than heavy drop-shadows.
- Mark every icon-only button (`ThemeToggle`, `SidebarCollapse`, kebab `+`) with `aria-label`.
- Confirm destructive actions via `AlertDialog` (Relapse) and `AlertDialog` (Add-Amount on quantifiable habits) — never fire destructively on a misclick.
- Render `<meta name="theme-color">` to match the active canvas color in both themes.
- Wrap icon-only interactions in `Tooltip` (collapsed-sidebar icons, `ThemeToggle`, and the mobile `⌘K` glyph).
- Apply `text-wrap: balance` to `h1`–`h3` and `tabular-nums` to any numeric column (streak pills, heatmap legend, future Finance widgets).
- Toggle `color-scheme: light` / `.dark { color-scheme: dark }` via globals so native scrollbars and form controls read in the active theme.

### Don't
- Don't paint a primary-action fill or structural fill in any sticker-palette colour — those are decoration only.
- Don't introduce a second structural accent alongside `{colors.primary}`. There is exactly one blue.
- Don't set inline link body text in `{colors.primary}` — it fails AA on `canvas-soft` (4.19:1, below the 4.5 threshold). Use `{colors.ink}` + `underline`.
- Don't put pill `{rounded.full}` radii on form fields — inputs stay tight at `{rounded.xs}` (4px).
- Don't drop heavy shadows — the elevation stack is many near-transparent layers, never a hard cast. In dark, invert the stack polarity (`rgba(255,255,255,a)`) rather than darkening further.
- Don't set body copy in a heavy weight — keep 400 for readability and let 700 belong to headlines.
- Don't animate `width` on the quantifiable-progress bar fill — pin it to `scaleX` of a 100%-width inner node (`transform-origin: left`) so the spring stays compositor-friendly.
- Don't bypass the chrome: inline hex literals in component `style` props (`style={{ backgroundColor: "#5e6ad2" }}` etc.) MUST be replaced by token-backed Tailwind classes during the migration tracks.
- Don't keep Linear-dark-era `#010102`, `#5e6ad2`, `#34343a`, etc. literals around — the only colour source of truth lives in this document.
- Don't place type on pure white for full pages — the warm `{colors.canvas-soft}` is core to the calm.
- Don't reverse-engineer Notion's actual product dark tokens; the dark appendix is the mechanical inversion recorded here.