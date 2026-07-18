# Life Tracker

Personal habits, finance & notes hub. Single-user Next.js app — dark Linear-grade UI, installable PWA.

- **Spec & tickets**: [GitHub issues](https://github.com/Bigelazo/life-tracker/issues) (PRD: #1)
- **Visual source of truth**: `DESIGN.md`

## Commands

```bash
pnpm dev          # dev server (port 3000 is used by another local project — use -p 3100 if needed)
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest (domain seam)
pnpm test:e2e     # playwright (browser seam, builds + serves on :3100)
pnpm db:generate  # drizzle-kit generate migration
pnpm db:migrate   # apply migrations (needs DATABASE_URL — see .env.example)
```
