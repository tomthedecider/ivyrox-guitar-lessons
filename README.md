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
- **Database**: SQLite for local dev (zero setup); the same Prisma schema
  runs against Postgres by switching one line (see below).

## Project layout

```
ivyrox/
  backend/    Express API (src/), Prisma schema + migrations (prisma/)
  frontend/   Vite React app (src/)
  Dockerfile  Single-image build: API + built frontend, one deployable service
```

## Local development

Requires Node 20+.

### 1. Backend

```bash
cd backend
cp .env.example .env      # defaults work as-is for local SQLite
npm install
npx prisma migrate dev    # creates dev.db and applies the schema
npm run seed               # optional: seed a teacher + student + sample songs
npm run dev                 # http://localhost:4000
```

Seeded logins (from `npm run seed`):

| Role    | Email                | Password       |
| ------- | --------------------- | -------------- |
| Teacher | teacher@ivyrox.app    | teach-ivyrox   |
| Student | student@ivyrox.app    | play-ivyrox    |

**Change these before deploying anywhere real** — either edit
`prisma/seed.ts` or create your own users.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, proxies /api to the backend
```

Open `http://localhost:5173` and sign in with one of the seeded accounts.

## Switching to Postgres

The schema is written to be portable. In `backend/prisma/schema.prisma`,
change:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

to `provider = "postgresql"`, point `DATABASE_URL` (in `.env`) at your
Postgres instance, then run `npx prisma migrate dev` again to generate a
fresh migration for that provider.

## Deployment

The `Dockerfile` at the repo root builds one image that serves both the API
(`/api/*`) and the built frontend from a single Express process — deploy it
as one web service on any container host (Render, Railway, Fly.io, etc.):

```bash
cd ivyrox
docker build -t ivyrox .
docker run -p 4000:4000 \
  -e DATABASE_URL="file:/data/prod.db" \
  -e JWT_SECRET="<a long random string>" \
  -v ivyrox-data:/data \
  ivyrox
```

For SQLite in production, mount a persistent volume and point `DATABASE_URL`
at a path on it (as above) — otherwise the database resets on every deploy.
For Postgres, just set `DATABASE_URL` to your connection string and switch
the schema provider as described above; no volume needed.

**Connecting to GitHub for deploy:**

1. Push this repo to GitHub (already done if you're reading this there).
2. `.github/workflows/ivyrox-ci.yml` builds and type-checks the backend,
   frontend, and Docker image on every push/PR touching `ivyrox/**` — treat
   a green run as your merge gate.
3. Pick a host that can build from a Dockerfile and deploy on push to
   `main` (Render and Railway both do this natively via their GitHub
   integration — connect the repo, point the build at the `ivyrox/`
   directory, and set the `DATABASE_URL` / `JWT_SECRET` env vars above in
   their dashboard). No credentials for a hosting provider are stored in
   this repo, so that connection has to be made from the provider's side.

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
