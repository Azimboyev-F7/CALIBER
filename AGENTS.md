# Caliber project guide

Caliber is a college admissions coaching app for high school students. It evaluates academics, activities, and honors, then provides analysis, AI coaching, and university recommendations.

## Stack and commands

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4.
- Backend: Express in `server.ts`, run with `tsx` during development.
- Data and authentication: Supabase.
- AI: Google Gemini through `services/gemini.ts`.
- PDF export: jsPDF through `src/utils/exportProfilePDF.ts`.
- Charts: Recharts and D3.js.
- Tests: Vitest and Supertest.

```bash
npm run dev       # development server on port 3000
npm run lint      # TypeScript check
npm test          # test suite
npm run build     # frontend and backend production build
npm start         # run the built server
```

## Main code paths

- `src/App.tsx`: student app state and routing; `/rais` selects the separate admin app.
- `src/admin/`: admin shell, navigation, users, and university tools.
- `src/components/AdminPanel.tsx`: admin usage overview and charts.
- `src/lib/supabaseClient.ts`: browser authentication and session restoration.
- `src/utils/apiClient.ts`: authenticated API headers and persistent browser device ID.
- `routes/`: Express API endpoints for analysis, activities, chat, colleges, and analytics/admin data.
- `middleware/auth.ts`: verifies Supabase bearer tokens for protected API routes.
- `services/supabaseServer.ts`: server-side Supabase clients and school data cache.
- `services/scoring.ts`: server-side scoring and recommendation fallback.
- `data/schools.ts`: local school profiles used as a fallback for recommendations.
- `src/data/initialData.ts`: default profile and local analysis fallback.
- `src/utils/admissionsOdds.ts` and `src/utils/scoringEngine.ts`: client-side scoring helpers.
- `prompts/coach.ts`: AI admissions coach system prompt.
- `scripts/seedSchools.ts`: upserts local school profiles into Supabase `school_profiles`.
- `scripts/migrate_analytics.sql`: admin and analytics schema/functions.
- `scripts/migrate_student_data.sql`: activities and honors schema.

## Architecture and data

- The student app is served at `/`; the admin console is served at `/rais`. Admin API routes must verify membership in Supabase `admin_users`. The URL alone is not authorization.
- Supabase Auth is the source of truth for sessions. A local user cache may exist, but protected requests require a valid bearer token.
- Profile state is stored locally; student activities and honors also sync with Supabase. Avoid assuming locally stored profile fields are available to admin APIs without server persistence.
- University recommendations read `school_profiles` from Supabase with a local fallback. New university records should follow the existing `school_profiles` fields and invalidate the server school cache after writes.
- Analytics tracks both registered accounts and persistent browser/device IDs. A device ID identifies a browser installation, not necessarily a distinct person. Legacy `account:*` fallback IDs must not count as real devices.
- The AI analysis route can fall back to local analysis when Gemini is unavailable.

## Working conventions

- Keep `.env` and service-role credentials out of version control and client code.
- Validate admin writes on the server and keep the admin-only Supabase service client server-side.
- Run `npm run lint`, `npm test`, and `npm run build` for application changes.
- Do not commit or push current workspace changes unless the user explicitly asks; the admin work is currently local.


## AI engineering workflow

For non-trivial changes, do not immediately start editing code.

1. Understand the requested behavior and inspect the relevant existing code.
2. Identify affected routes, services, data models, and tests.
3. Prefer the smallest implementation that satisfies the requirement.
4. Add or update tests where the behavior is testable.
5. Implement the change.
6. Run the relevant tests and quality checks.
7. Review the resulting diff critically before considering the task complete.
8. Report what changed, what was tested, and any remaining risks.

### Engineering principles

Follow these principles when generating or modifying code:

- KISS: prefer simple solutions over unnecessary abstractions.
- YAGNI: do not build functionality that is not currently required.
- DRY: remove meaningful duplication, but do not create abstractions merely to avoid a few repeated lines.
- SOLID: especially maintain clear single responsibilities.
- Avoid large monolithic files when responsibilities can reasonably be separated.
- Preserve existing architecture unless there is a concrete reason to change it.
- Do not silently introduce new dependencies.
- Do not weaken authentication, authorization, validation, or security checks.

### Testing workflow

Use TDD when practical for business logic, bug fixes, API behavior,
scoring, authorization, and other deterministic functionality:

RED -> GREEN -> REFACTOR

For bug fixes:
1. Reproduce the bug.
2. Add a failing regression test when practical.
3. Fix the underlying cause rather than masking the symptom.
4. Confirm the regression test passes.
5. Run related tests.

Do not modify tests merely to make an incorrect implementation pass.

### Quality gate

Before considering an application change complete:

npm run lint
npm test
npm run build

Also review for:

- TypeScript/type-safety issues
- dead or unreachable code
- accidentally exposed secrets
- authentication/authorization regressions
- unnecessary complexity
- circular dependencies
- missing error handling
- untested important behavior

Useful targets for new/changed code:

- cyclomatic complexity <= 10 where practical
- cognitive complexity <= 15 where practical
- diff test coverage >= 80% for testable business logic
- circular dependencies = 0

These are quality targets, not reasons to distort otherwise clear code.

### Review roles

For substantial work, reason through the task using separate passes:

**Architect**
- clarify requirements
- identify affected architecture
- identify risks and constraints
- create the implementation checklist

**Implementer**
- make the smallest correct change
- follow existing project patterns

**Tester**
- verify expected behavior
- test edge cases and failure paths
- use stronger testing techniques such as property-based or mutation
  testing when they provide meaningful value

**Critic / reviewer**
- inspect the diff independently
- look for incorrect assumptions, security issues, regressions,
  unnecessary complexity, and missing tests

A task is not complete merely because the implementation compiles.

### Planning vs production requirements

Keep backlog/planning notes separate from production requirements.

Do not treat an idea in the backlog as an approved implementation
requirement.

When requirements are ambiguous, clarify them before making large
architectural decisions.

### Working with the user

When the user provides a rough feature idea rather than a clear
specification:

1. Do not invent a large PRD immediately.
2. Ask focused questions to clarify the idea.
3. Prefer one important question at a time when requirements are unclear.
4. Use reference products/screenshots/descriptions supplied by the user.
5. Establish expected behavior before substantial implementation.