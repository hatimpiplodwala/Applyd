# Applyd

A job-application tracker. Log every role you apply to, move it through your pipeline, and let AI fill in the details straight from a posting — on the web or from a one-click browser extension.

Applyd is three pieces that share one Supabase project:

- **`frontend/`** — Next.js 14 web app (dashboard, kanban, analytics, auth)
- **`backend/`** — FastAPI service (CRUD API + AI job parsing)
- **`extension/`** — Manifest V3 browser extension ("Save Job")

---

## Features

- **Track applications** — company, role, location, status, date applied, salary range, contact, job URL, and notes.
- **Three views** — a sortable/filterable table, a drag-and-drop **kanban** board, and **analytics** (status funnel, monthly volume, outcome split).
- **AI auto-fill** — paste a job URL or text and Gemini extracts company, role, location, and salary into the form.
- **Browser extension** — open the popup on any job posting to save it with details auto-filled; also works from the right-click context menu.
- **Follow-up reminders** — set a follow-up date on apply; optional Postgres-native email reminders (pg_cron + pg_net → Resend).
- **Duplicate detection** — warns when a company + role already exists, but still lets you save.
- **CSV export**, status badges, and per-user data isolation via Supabase Row-Level Security.
- **Auth** — email/password sign-up, login, and password reset via Supabase Auth.

---

## Architecture

```
                ┌──────────────────────┐
   Browser ───► │  frontend (Next.js)  │ ──┐
                └──────────────────────┘   │   Bearer JWT
                ┌──────────────────────┐   ├──► backend (FastAPI) ──► Gemini (parse)
   Extension ─► │  extension (MV3)     │ ──┘            │
                └──────────────────────┘                │
                          │                             ▼
                          └────── Supabase Auth ──► Postgres (RLS, applications)
```

- The **frontend** and **extension** authenticate directly against Supabase Auth and call the **backend** with the user's JWT as a bearer token.
- The **backend** validates the token, scopes every query to the user (RLS), and owns the AI parsing endpoint. It never holds a service-role key — it uses the user's token so row-level security applies.

---

## Tech stack

| Layer | Tools |
|---|---|
| Web app | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix), `@dnd-kit`, `@supabase/ssr` |
| API | FastAPI, Pydantic v2, Supabase Python client, `httpx` + BeautifulSoup, SlowAPI (rate limiting), Google Gemini (`google-genai`) |
| Extension | Manifest V3, Vite + `@crxjs/vite-plugin`, React, `@supabase/auth-js` |
| Data / Auth | Supabase (PostgreSQL + Auth + Row-Level Security) |
| Tests | pytest (backend), Vitest (frontend + extension) |

---

## Repository structure

```
job-tracker/
├── frontend/        # Next.js web app
│   ├── app/         # routes: /, /login, /signup, /dashboard, /reset-password, ...
│   ├── components/  # table, kanban, analytics, forms, landing, ui/ (shadcn)
│   ├── lib/         # api client, supabase clients, csv, helpers
│   └── tests/       # vitest unit tests
├── backend/         # FastAPI service
│   ├── app/
│   │   ├── routers/     # applications, parse
│   │   ├── services/    # job_parser (fetch + SSRF guard + Gemini)
│   │   ├── deps.py      # auth dependency (token → CurrentUser)
│   │   └── ...
│   ├── main.py
│   └── tests/       # pytest unit + integration (TestClient) tests
└── extension/       # MV3 browser extension
    ├── src/
    │   ├── popup/       # React popup (login, quick-add form)
    │   ├── background/  # service worker (context menu)
    │   └── lib/         # api, auth, page extraction
    └── tests/       # vitest unit tests
```

---

## Getting started

### Prerequisites

- Node.js 20+
- Python 3.11+
- A free [Supabase](https://supabase.com) project
- (Optional) A [Google Gemini](https://ai.google.dev) API key for AI parsing

### 1. Supabase

Create a project, then run this in the SQL editor:

```sql
create table applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  company       text not null,
  role          text not null,
  location      text,
  status        text not null default 'Applied',
  date_applied  date not null,
  follow_up_date date,
  job_url       text,
  salary_range  text,
  contact_name  text,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table applications enable row level security;

create policy "owner access" on applications
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Grab the **Project URL** and **anon public key** from Project Settings → API.

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

`backend/.env`:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
CORS_ORIGINS=http://localhost:3000
GEMINI_API_KEY=your-gemini-key   # optional; omit to disable AI parsing
```

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

`frontend/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Extension (optional)

```bash
cd extension
npm install
npm run build   # outputs to extension/dist
```

`extension/.env`:

```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DASHBOARD_URL=http://localhost:3000/dashboard
```

Then load it unpacked: open `chrome://extensions`, enable **Developer mode**, and **Load unpacked** → select `extension/dist`. Use `npm run dev` for a hot-reloading build during development.

---

## Testing

```bash
# Backend — pytest (unit + integration via FastAPI TestClient)
cd backend && pytest             # uses pytest.ini; needs dev deps:
pip install -r requirements-dev.txt

# Frontend — vitest
cd frontend && npm test

# Extension — vitest
cd extension && npm test
```

Backend tests mock Supabase and Gemini at the dependency boundary, so they run offline with no real credentials. The frontend/extension suites cover pure helpers (CSV building, date handling, page extraction, the SSRF guard).

---

## Deployment

- **Frontend** → Vercel (set the three `NEXT_PUBLIC_*` env vars).
- **Backend** → any container/Python host (e.g. Render); set the backend env vars and point `CORS_ORIGINS` at your frontend domain.
- **Extension** → `npm run build`, then upload `extension/dist` (zipped) to the Chrome Web Store / Edge Add-ons with production `VITE_*` values.

Keep every `.env*` file out of version control (they're gitignored).
