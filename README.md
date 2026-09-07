# Ivyrox

A personal guitar-lesson web app for a teacher and one beginner student (six
months in — comfortable with scales and basic classical technique, not yet
able to play a full song through). Tracks assignments, a self-serve practice
library, and progress, and gives the teacher a weekly prep view.

## Features

1. **Required assignments** — the teacher assigns a song or exercise with a
   due date and notes. The student marks it done herself, but it sits as
   *pending confirmation* until the teacher reviews and approves it at the
   next lesson.
2. **Optional library** — a self-serve pool of songs/exercises the student
   can browse and add to her own list, with a `learning` / `learned` toggle
   she controls — no approval needed.
3. **Progress tracking** — songs learned over time, a chord mastery
   checklist, and a consecutive-day practice streak.
4. **Content per song/exercise** — a tab/chord sheet link, an optional
   reference recording/video link, and a short tips note.
5. **Teacher weekly overview** — one dashboard: what's assigned this week,
   what's waiting on review, and what the student picked up independently.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS, React Router.
- **Backend**: Node + Express + TypeScript, Prisma ORM, JWT auth.
- **Database**: Postgres. [Neon](https://neon.tech) is the recommended free
  host — no local install needed, works the same for local dev and both
  Render services (see "Persistence" below).

## Project layout

```
backend/    Express API (src/), Prisma schema + migrations (prisma/)
frontend/   Vite React app (src/)
Dockerfile  Single-image build: API + built frontend, one deployable service
```

## Local development

Requires Node 20+ and a Postgres connection string (see "Persistence" below
for the easiest way to get one — a free Neon project takes under a minute
and needs no local install).

### 1. Backend

```bash
cd backend
cp .env.example .env      # then paste your Postgres connection string in
npm install
npx prisma migrate deploy # applies the existing schema — don't use `migrate dev` against a shared/hosted database
npm run seed               # optional: seed a teacher + student + sample songs
npm run dev                 # http://localhost:4000
```

Seeded logins (from `npm run seed`):

| Role    | Email                | Password       |
| ------- | --------------------- | -------------- |
| Teacher | teacher@ivyrox.app    | teach-ivyrox   |
| Student | student@ivyrox.app    | play-ivyrox    |

**Don't use these for a real deployment** — anyone with access to this
repo can read them. Instead, set `TEACHER_EMAIL`, `TEACHER_PASSWORD`,
`STUDENT_EMAIL`, and `STUDENT_PASSWORD` as environment variables before
running `npm run seed` (or set them as env vars on the hosting platform
and enable `SEED_ON_BOOT` for one deploy — see "Dev environment (Render)"
below). When any of those are set, the seed creates only those two
accounts — no demo songs, chords, or assignments — so a real environment
doesn't end up with fictional lesson content mixed into real data.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, proxies /api to the backend
```

Open `http://localhost:5173` and sign in with one of the seeded accounts.

## Persistence

The app needs one Postgres database per environment where data should
stick around: one for local dev / `ivyrox-dev`, and a **separate** one for
`ivyrox-prod` (don't share a database between dev and prod — dev's seeded
demo accounts and casual testing shouldn't touch real lesson data).

[Neon](https://neon.tech) is the recommended host — its free tier doesn't
expire the way some "free trial" database tiers do, and setup is just:

1. Sign up at neon.tech (GitHub login is fine).
2. Create a project named something like `ivyrox-dev`, region **Frankfurt**
   (`eu-central-1`) — matches `region: frankfurt` in `render.yaml`. Keep
   the app server and database in the same region; which region that
   should be depends on where your actual users are (see the note in
   `render.yaml`), not on where you personally are. Neon gives you a
   connection string immediately (**Dashboard → Connection Details**) —
   copy the one labeled for `psql` / general use, starting with
   `postgresql://`.
3. Create a **second** project, `ivyrox-prod`, same region, and copy its connection
   string too. (Neon's free tier supports multiple projects — if it
   doesn't for your account, a second free host or Neon's paid tier both
   work identically here; nothing in this repo assumes Neon specifically.)
4. Paste the `ivyrox-dev` string into your local `backend/.env` as
   `DATABASE_URL`, and also into the `ivyrox-dev` Render service's
   Environment tab. Paste the `ivyrox-prod` string into the `ivyrox-prod`
   Render service's Environment tab.

That's the only manual step — everything else (schema, migrations, the
Dockerfile) already targets Postgres and needs no further changes per
environment.

## Deployment

The `Dockerfile` at the repo root builds one image that serves both the API
(`/api/*`) and the built frontend from a single Express process — deploy it
as one web service on any container host (Render, Railway, Fly.io, etc.):

```bash
docker build -t ivyrox .
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://user:password@host/dbname" \
  -e JWT_SECRET="<a long random string>" \
  ivyrox
```

**Connecting to GitHub for deploy:**

1. Push this repo to GitHub (already done if you're reading this there).
2. `.github/workflows/ci.yml` builds and type-checks the backend, frontend,
   and Docker image on every push/PR — treat a green run as your merge gate.
3. Pick a host that can build from a Dockerfile and deploy on push (Render
   and Railway both do this natively via their GitHub integration). No
   credentials for a hosting provider are stored in this repo, so that
   connection has to be made from the provider's side.

## Dev environment (Render)

`render.yaml` at the repo root is a [Render Blueprint](https://render.com/docs/blueprint-spec)
that provisions **two** independent web services from two branches, so you
can see a change working before it reaches production:

| Branch    | Service       | Purpose                                              |
| --------- | ------------- | ----------------------------------------------------- |
| `develop` | `ivyrox-dev`  | Auto-seeded with the sample teacher/student/songs — click around and confirm a change before promoting it. |
| `main`    | `ivyrox-prod` | Production. Never auto-seeded.                        |

### One-time setup

1. Push the `develop` branch (already created — see below).
2. In the Render dashboard: **New +** → **Blueprint** → connect this GitHub
   repo. Render reads `render.yaml` and creates both services in one step,
   each with its own `onrender.com` URL and its own generated `JWT_SECRET`.
   `DATABASE_URL` isn't set by the blueprint (it's a secret, so it isn't
   committed to the repo) — Render will prompt you for it per service
   during sync, or you can fill it in afterward under each service's
   Environment tab. See "Persistence" below for where those two
   connection strings come from.
3. Open the `ivyrox-dev` service's URL once the first deploy finishes and
   sign in with the seeded accounts (same credentials as local dev, above).
4. `ivyrox-prod` has no accounts yet — it's deliberately never
   auto-seeded. To create real ones: on the `ivyrox-prod` service's
   Environment tab, add `TEACHER_EMAIL`, `TEACHER_PASSWORD`,
   `STUDENT_EMAIL`, `STUDENT_PASSWORD` (your own real values — never the
   demo ones above) alongside `SEED_ON_BOOT=true`, save (triggers a
   redeploy that creates just those two accounts, no demo content), then
   remove `SEED_ON_BOOT` again afterward so it doesn't keep re-running on
   every future restart. Safe to leave the credential env vars in place —
   the seed only *creates* an account if that email doesn't already
   exist, so re-running it never overwrites a password or touches any
   other data.

### Day-to-day workflow

1. Branch from `develop`, make changes, push — Render redeploys `ivyrox-dev`
   automatically and you get a URL to actually click through.
2. Happy with it? Merge into `develop` (if you branched off it) so the dev
   service reflects the latest state, confirm once more, then open a PR
   from `develop` into `main`.
3. Merging that PR redeploys `ivyrox-prod` automatically.

## API overview

All routes are under `/api` and (except `/api/auth/login` and
`/api/health`) require `Authorization: Bearer <token>`.

| Route                                   | Who       | What                                    |
| ---------------------------------------- | --------- | ---------------------------------------- |
| `POST /auth/login`                       | anyone    | Returns `{ token, user }`                |
| `GET /songs`                             | both      | Full catalog                             |
| `POST /songs`, `PATCH /songs/:id`        | teacher   | Curate the catalog                       |
| `GET /assignments`                       | both      | Own (student) or all (teacher)           |
| `POST /assignments`                      | teacher   | Assign a song with a due date            |
| `PATCH /assignments/:id/mark-done`       | student   | ASSIGNED → PENDING_CONFIRMATION          |
| `PATCH /assignments/:id/approve`         | teacher   | PENDING_CONFIRMATION → APPROVED          |
| `PATCH /assignments/:id/reject`          | teacher   | Sends it back to ASSIGNED                |
| `GET /library`                           | student   | Library songs + this student's progress  |
| `POST /library/:songId`                  | student   | Add a library song to her list           |
| `PATCH /library/:songId`                 | student   | Toggle LEARNING / LEARNED                |
| `GET /progress/songs-learned`            | both      | Combined learned timeline                |
| `GET /progress/chords`, `PUT /progress/chords` | both / student | Chord checklist                    |
| `GET /progress/streak`, `POST /progress/practice` | both / student | Practice streak                 |
| `GET /teacher/overview`                  | teacher   | Weekly dashboard                         |
| `GET /teacher/students`                  | teacher   | Student picker for the assign form       |
