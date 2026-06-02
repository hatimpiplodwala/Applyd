<div align="center">

# Applyd

**A job-application tracker that fills itself in.**

Log every role you apply to, move it through your pipeline, and let AI pull the details
straight from a posting — on the web or from a one-click browser extension.

Next.js&nbsp;·&nbsp;FastAPI&nbsp;·&nbsp;Supabase&nbsp;·&nbsp;Gemini&nbsp;·&nbsp;Manifest&nbsp;V3

</div>

---

## Why

Job hunting means juggling dozens of postings across a dozen tabs, and the moment you
close one you've lost the salary, the link, and the date you applied. Spreadsheets get
stale because logging a row by hand is friction at exactly the wrong moment.

Applyd removes that friction two ways: **paste a link** (or hit the **extension** on the
page you're already looking at) and the details auto-fill from the posting; then track
everything in a table, a drag-and-drop board, or an analytics view that shows where your
pipeline actually leaks.

## What it does

- **AI auto-fill** — paste a job URL or text and Gemini extracts company, role, location, and salary into the form.
- **One-click capture** — a Manifest V3 browser extension saves the posting you're viewing (popup or right-click), auto-filled, without leaving the tab.
- **Three ways to look at your search** — a sortable, filterable **table**; a drag-and-drop **kanban** board with optimistic updates; and **analytics** (status funnel, monthly volume, outcome split).
- **Follow-up reminders** — set a follow-up date on apply; optional Postgres-native email reminders (pg_cron + pg_net → Resend) go out the morning of.
- **Duplicate detection** — warns when a company + role already exists, but still lets you save (re-applying is valid).
- **Yours only** — every row is scoped to you by Supabase Row-Level Security; the API acts as the user, never with a god-mode key.
- **CSV export**, color-coded status badges, and email/password auth with password reset.

## How it's built

Three deployables share a single Supabase project. The web app and the extension both
authenticate directly against Supabase Auth, then call the API with the user's JWT.

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

The backend validates the token and **acts as the user** — it talks to Postgres with the
caller's JWT, so Row-Level Security does the authorization. There is no service-role key
in the request path. AI parsing lives behind the same auth and is the one place the
server reaches out to a third party.

| Layer | Tools |
|---|---|
| Web app | Next.js 14 (App Router), React 18, TypeScript, Tailwind, shadcn/ui (Radix), `@dnd-kit`, `@supabase/ssr` |
| API | FastAPI, Pydantic v2, Supabase Python client, `httpx` + BeautifulSoup, SlowAPI (rate limiting), Google Gemini (`google-genai`) |
| Extension | Manifest V3, Vite + `@crxjs/vite-plugin`, React, `@supabase/auth-js` |
| Data / Auth | Supabase (PostgreSQL + Auth + Row-Level Security) |
| Tests | pytest (backend), Vitest (frontend + extension) |

## Engineering highlights

A few things that went deeper than the feature list suggests:

- **SSRF-hardened URL parsing.** The "paste a link" feature fetches arbitrary URLs server-side — a classic SSRF foot-gun. Requests are validated against private/loopback/link-local ranges (including the cloud-metadata IP), and **every redirect hop is re-checked**, not just the first URL. Covered by unit tests.
- **Auth as the user, not as root.** The API never uses a service-role key; it forwards the caller's JWT to Supabase so RLS enforces ownership. Token validation is cached with a TTL + LRU so it isn't a per-request round-trip.
- **Tested where it counts.** ~70 backend tests (pytest) split between pure-logic units (the SSRF guard, the parser) and integration tests that drive the real FastAPI routes via `TestClient` with Supabase and Gemini mocked at the dependency boundary — so they run offline. Frontend/extension helpers (CSV building, timezone-safe dates, page extraction) are covered by Vitest.
- **Performance passes.** Pooled `httpx` connections, a singleton Supabase browser client, pagination on list endpoints, and a slimmer extension bundle (swapped to `@supabase/auth-js`).
- **Details that bite.** Spreadsheet formula-injection neutralized in CSV export; timezone-safe date handling so a `2026-05-31` never renders as the 30th in a negative-UTC zone.

## Project structure

```
job-tracker/
├── frontend/        # Next.js web app — routes, components (table/kanban/analytics), lib, tests
├── backend/         # FastAPI service — routers, services (job_parser), auth deps, tests
└── extension/       # MV3 extension — popup (React), background service worker, page extraction
```

## Run it locally

<details>
<summary><strong>Prerequisites & setup</strong></summary>

**Prerequisites:** Node 20+, Python 3.11+, a free [Supabase](https://supabase.com) project, and (optional) a [Gemini](https://ai.google.dev) API key for AI parsing.

**1. Supabase** — create a project and run:

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
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**2. Backend** (`backend/.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CORS_ORIGINS=http://localhost:3000`, optional `GEMINI_API_KEY`):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

**3. Frontend** (`frontend/.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL=http://localhost:8000`):

```bash
cd frontend && npm install && npm run dev   # http://localhost:3000
```

**4. Extension** (`extension/.env`: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DASHBOARD_URL`):

```bash
cd extension && npm install && npm run build
```

Then `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `extension/dist`.

</details>

<details>
<summary><strong>Tests</strong></summary>

```bash
cd backend   && pip install -r requirements-dev.txt && pytest
cd frontend  && npm test
cd extension && npm test
```

Backend tests mock Supabase and Gemini at the dependency boundary, so they run offline with no credentials.

</details>

## Deployment

Frontend → Vercel · Backend → any Python/container host (e.g. Render), with `CORS_ORIGINS` pointed at the frontend domain · Extension → `npm run build`, then upload `extension/dist` to the Chrome Web Store / Edge Add-ons with production `VITE_*` values. All `.env*` files are gitignored.
