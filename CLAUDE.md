# Notes for Claude

- The user has access to multiple Macs. If native iOS packaging (Capacitor
  build + Xcode + code signing) comes up, a Mac is available — don't assume
  it's blocked or default to a cloud Mac build service without checking.

## Deployment setup (context for future sessions)

- Hosting: Render, via `render.yaml` (Blueprint). Two services: `ivyrox-dev`
  (tracks `develop`, auto-seeded via `SEED_ON_BOOT=true`) and `ivyrox-prod`
  (tracks `main`, never auto-seeded).
- Database: Postgres via Neon (two separate projects/connection strings,
  one per environment — see README "Persistence"). `DATABASE_URL` is set
  manually in each Render service's Environment tab, not committed.
- Workflow: branch off `develop` → push → verify on `ivyrox-dev` → PR into
  `main` → `ivyrox-prod` redeploys.
- Practice-clip recordings (`Assignment.recording`) are stored as Postgres
  `Bytes`, capped at 5MB per upload — there's no persistent disk on Render's
  free plan, so this is the simplest option for two users. There is no
  pruning/cleanup path; storage grows indefinitely with usage. Worth
  revisiting (object storage, a retention policy) if Neon's free-tier
  storage ceiling ever becomes a concern.
