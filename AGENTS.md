# Caliber — Codex Handoff

## What this project is
**Caliber** is a college admissions coaching platform for high school students.
It evaluates a student's academic profile (GPA, SAT/ACT, activities, awards) and gives AI-powered feedback, a score breakdown, and university recommendations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | Express.js (TypeScript) via `tsx` / `server.ts` |
| AI | Google Gemini (`gemini-2.5-flash`) via `@google/genai` |
| Database / Auth | Supabase (`@supabase/supabase-js`) |
| Charts | Recharts + D3.js |
| PDF Export | jsPDF |
| Tests | Vitest + Supertest |
| Package manager | npm (also has a `bun.lock`) |

---

## How to run

```bash
# Development (Vite + Express in one process)
npm run dev          # starts server.ts via tsx on port 3000

# Tests
npm test             # vitest run

# Production build
npm run build        # Vite build + esbuild bundles server.ts → dist/server.cjs
npm start            # node dist/server.cjs
```

---

## Project Structure

```
/                      ← repo root = D:\PYTHON-BACKEND\CALIBER
├── server.ts          ← Express entry point (createApp + startServer)
├── routes/
│   ├── analysis.ts    ← POST /api/analyze-profile  (Gemini AI profile eval)
│   ├── chat.ts        ← POST /api/chat             (AI coach chat)
│   ├── activity.ts    ← CRUD /api/student/activities
│   └── colleges.ts    ← CRUD /api/student/colleges + recommendations
├── middleware/
│   ├── auth.ts        ← JWT Bearer + x-api-key guard (all /api/* except /health)
│   └── validation.ts  ← Zod schema validators
├── services/
│   ├── gemini.ts      ← GoogleGenAI client, rate-limit cooldown, retry logic
│   ├── scoring.ts     ← deterministic fallback scoring engine (server-side)
│   └── supabaseServer.ts ← server-side Supabase admin client
├── prompts/
│   └── coach.ts       ← system prompt for the AI admissions coach
├── data/
│   └── schools.ts     ← school database (server-side, for recommendations)
├── scripts/
│   ├── seedSchools.ts         ← seed Supabase `schools` table from CDS data
│   ├── seed_schools.sql       ← raw SQL seed
│   ├── migrate_student_data.sql
│   └── generateSchoolSQL.ts
├── tests/
│   ├── api.test.ts    ← integration tests (Supertest)
│   └── scoring.test.ts
├── src/               ← Vite React frontend
│   ├── App.tsx        ← root component, routing, auth, profile state
│   ├── types.ts       ← shared TypeScript types (UserProfile, AnalysisResult, etc.)
│   ├── lib/
│   │   └── supabaseClient.ts  ← browser Supabase singleton + auth helpers
│   ├── components/    ← all React views and modals
│   ├── context/
│   │   └── CoachChatContext.tsx
│   ├── data/
│   │   ├── initialData.ts         ← default profile + local scoring fallback
│   │   └── universitiesDatabase.ts
│   └── utils/
│       ├── apiClient.ts           ← getApiHeaders() (x-api-key + JWT)
│       ├── admissionsOdds.ts      ← client-side admit probability math
│       ├── scoringEngine.ts       ← client-side heuristic scoring
│       └── exportProfilePDF.ts    ← jsPDF export
└── .env               ← secrets (never commit)
```

---

## Environment Variables (`.env`)

```
GEMINI_API_KEY=...
VITE_SUPABASE_URL=https://vpecnrdtgdhddejytdzw.supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=3000
```

---

## Key Architecture Decisions

### Auth flow
- Frontend auth: `src/lib/supabaseClient.ts` — real Supabase `createClient` singleton.
- All protected API calls send `x-api-key: caliber-secret-key` + `Authorization: Bearer <supabase-jwt>`.
- `middleware/auth.ts` validates both on the server.
- `localStorage` key `caliber_active_user` is a sync cache; `syncSessionFromSupabase()` called on app mount reconciles it with the live Supabase session.

### AI + fallback
- `POST /api/analyze-profile` calls Gemini first; if Gemini is unavailable (no key, rate-limited, error) it returns `analysis: null` and the frontend falls back to `computeLocalAnalysis()` in `src/data/initialData.ts`.
- `services/gemini.ts` has a 45 s cooldown on 429s and a 300 ms retry on 503s.
- AI coach chat goes through `routes/chat.ts` using the system prompt in `prompts/coach.ts`.

### Data persistence
- Profile is persisted to `localStorage` (key `caliber_user_profile`) on every change.
- Activities and honors are also synced to Supabase via fire-and-forget fetches (`/api/student/activities`, `/api/student/honors`).
- On login, remote data is fetched and merged; if Supabase is empty the local data is backfilled.

---

## What has been built (completed work)

1. **Full React SPA** — Landing, Dashboard, Profile Builder, Activities, Results & Spike, AI Coach, Target Universities, Settings views.
2. **Express backend** — Gemini AI integration, auth middleware, activity/honor CRUD, college recommendations endpoint.
3. **Supabase auth** — sign-up, sign-in, sign-out, password reset, session restore on mount.
4. **PDF export** — `src/utils/exportProfilePDF.ts` + `ExportPDFModal` / `PDFPreviewModal`.
5. **Scoring engine** — both client-side heuristic (`scoringEngine.ts`, `admissionsOdds.ts`) and server-side Gemini-powered evaluation.
6. **Security hardening** — Helmet, CORS, rate limiting, Zod input validation, JWT auth guard.
7. **Test suite** — `tests/api.test.ts` (integration) + `tests/scoring.test.ts` (unit).
8. **Background visual effects** — animated glow orbs, frosted glass UI, `ColorBends` / `DarkVeil` components.
9. **College data** — `data/schools.ts` + SQL seed scripts for Supabase `schools` table.

---

## Active branch: `main`

Last 5 commits:
- `6d78c4f` backend restorations
- `b843f60` Reconstructed the backend section
- `20d635f` chore: configure backend security and testing
- `5369f33` refactor(ai): improve prompt safety and dashboard UI
- `ef6c1b5` feat: implement PDF export functionality

---

## Known state / things to check before continuing

- Confirm `GEMINI_API_KEY` is set in `.env` before testing AI features.
- If sign-up is blocked, check Supabase dashboard → Auth → Email → disable "Enable email confirmations".
- The `schools` Supabase table may need seeding via `scripts/seedSchools.ts` if the colleges view is empty.
- `x-api-key` hardcoded value is `caliber-secret-key` (set in `middleware/auth.ts` and `src/utils/apiClient.ts`).
