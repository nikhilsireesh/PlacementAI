# AI-Powered Placement Readiness System

A placement-preparation platform built around one idea: don't just measure a
student's placement readiness — tell them exactly what to do next, and keep
updating that advice as they improve.

> **ASSESS → ANALYZE → IDENTIFY GAP → RECOMMEND → PRACTICE → REASSESS → IMPROVE**

Built as a college project with a working Next.js + PostgreSQL (Neon) stack,
a deterministic scoring/recommendation engine, and an optional AI layer that
degrades gracefully to rule-based logic when no AI key is configured.

---

## 1. The core idea: the Next Best Action Engine

Instead of "You are weak in coding," the system computes:

> "Your biggest placement bottleneck is **Coding** (48% vs. a 75% target for
> Software Developer). Your next best action is a 30-minute Arrays & Strings
> practice session."

After the student completes that action, their skill score updates, their
readiness score recalculates, and a new recommendation is generated — all
from real data, no page refresh of fabricated numbers.

**Design principle carried through the whole codebase:** AI handles
interpretation and personalization (phrasing, resume feedback, interview
critique, chat answers). Plain, deterministic TypeScript handles every
number that matters — the readiness score, skill gaps, and recommendation
priority. See [`lib/engine/`](lib/engine) and [`lib/ai/aiService.ts`](lib/ai/aiService.ts).

## 2. Features

**Student**
- Register / log in, complete profile, pick a target job role
- Placement Readiness Score (0–100) with a plain-language level and a
  **confidence** indicator (low confidence = not enough assessment data yet)
- Skill-gap breakdown with role-weighted priority (HIGH/MEDIUM/LOW)
- **Next Best Action** card — the centerpiece of the dashboard
- Timed formal Assessments (MCQ / code-output questions) and short, untimed
  Practice sets, both of which grade instantly and update skill scores
- AI Coach — answers questions using the student's real profile data
- Resume Analyzer (PDF or pasted text) — role-alignment feedback
- Mock Interview — written-answer practice with structured feedback
- Personalized day-by-day Roadmap generator
- Progress page — readiness history, skill trends, assessment history,
  recommendation completion rate, practice streak
- Learning Resources library (free resources, filterable by skill)
- Light gamification (milestone badges)

**Faculty**
- Live dashboard: total students, average readiness, placement-ready count,
  students needing support, skill-gap distribution, department breakdown
- AI-assisted faculty insight (summarizes only real aggregated numbers)
- Student directory with filters (department, year, role, skill, priority)
  and a full per-student readiness/gap/history detail page
- Skill Gaps page, Assessments overview, a print-friendly Report page
- Job Roles page to **configure per-role skill weights and targets** —
  nothing about the scoring formula is hard-coded in the frontend
- **Upload a question bank from a PDF** (`/faculty/assessments/new`) — upload
  a PDF (or paste text) of numbered MCQ questions with lettered options and
  an answer key, and it's parsed into a new formal assessment or practice
  set students can take immediately. An AI key (if configured) tolerates
  messier formatting; without one, a deterministic line-format parser
  handles the documented pattern. Any question it can't confidently parse
  is skipped and reported back, rather than silently guessed at.

## 3. Architecture

```
app/                      Next.js App Router
  api/                    REST-ish API routes (auth, student, faculty, AI features)
  student/, faculty/      Role-specific pages, protected by middleware.ts
components/
  ui/                     Small design-system primitives (Button, Card, Badge, ...)
  dashboard/, charts/, assessment/, layout/
lib/
  engine/                 Deterministic readiness / skill-gap / next-best-action logic
  ai/                     Provider-agnostic AI client + aiService.ts (AI or fallback)
  services/               Business logic shared by pages and API routes
  validation/             Zod schemas that validate every AI response before use
  data/                   Static reference data (interview questions, role keywords)
  auth.ts, prisma.ts, apiUtils.ts, utils.ts
prisma/schema.prisma      Database schema (Neon PostgreSQL)
scripts/seed.ts           Seeds departments, roles, skills, assessments, demo data
middleware.ts             Route protection (session cookie + role check)
```

**Request flow for the core loop** (e.g. submitting a practice set):
`app/api/practice/submit/route.ts` grades the answers
(`lib/services/grading.ts`) → updates the skill score with an EMA
(`lib/services/skillEngine.ts`) → recomputes readiness
(`lib/engine/readiness.ts`) → recomputes skill gaps
(`lib/engine/skillGap.ts`) → generates a fresh recommendation, AI or
fallback (`lib/services/recommendationService.ts` → `lib/ai/aiService.ts`).

## 4. Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **UI:** Hand-rolled component primitives (no external UI kit dependency) + Lucide icons + Recharts
- **Backend:** Next.js Route Handlers (no separate server)
- **Database:** PostgreSQL via **Neon**, accessed with **Prisma ORM**
- **Auth:** Custom email/password auth — bcrypt password hashing, signed
  JWT session cookie (via `jose`), role-based middleware. No third-party
  auth service required.
- **AI:** Any OpenAI-compatible chat-completions API (defaults to
  [Groq](https://console.groq.com/keys)'s free tier), behind a single
  abstraction (`lib/ai/aiService.ts`) with Zod-validated output and a
  deterministic fallback for every AI feature.

## 5. Getting started

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL project (free tier is enough)

### Setup

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL / DIRECT_URL / AUTH_SECRET
npm run db:migrate        # creates all tables in your Neon database
npm run db:seed           # seeds reference data + demo accounts
npm run dev                # http://localhost:3000
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon **pooled** connection string (used at runtime) |
| `DIRECT_URL` | Yes | Neon **direct** connection string (used by `prisma migrate`) |
| `AUTH_SECRET` | Yes | Long random string signing session cookies. Generate with `openssl rand -hex 32` |
| `AI_API_KEY` | No | Leave blank to run entirely in deterministic fallback mode |
| `AI_MODEL` | No | Defaults to `llama-3.3-70b-versatile` (Groq) |
| `AI_BASE_URL` | No | Defaults to Groq's OpenAI-compatible endpoint |

Get both Neon connection strings from the Neon console → your project →
"Connect" (copy the pooled string as-is for `DATABASE_URL`; copy it again
and remove `-pooler` from the hostname for `DIRECT_URL`).

### Demo accounts (created by `npm run db:seed`)

| Role | Email | Password |
|---|---|---|
| Student (flagship demo profile — "Arjun Kumar") | `student@demo.com` | `student123` |
| Faculty (Placement Officer) | `faculty@demo.com` | `faculty123` |

The seed script also creates 23 additional students across 3 departments
and 6 job roles with deliberately varied skill profiles, so the faculty
dashboard has meaningful data to show immediately.

### Useful commands

```bash
npm run dev          # start the dev server
npm run build        # production build (also type-checks)
npm run lint         # ESLint
npm run db:migrate   # create/apply a Prisma migration
npm run db:seed      # re-run the seed script (safe to run multiple times)
npm run db:studio    # Prisma Studio — browse the database visually
npm run db:reset-demo-student  # restore Arjun Kumar's scores/history to the
                                # documented baseline after manual testing
```

### College branding

`public/college-logo.jpeg`, `public/campus-building.jpg`, and
`public/campus-courtyard.jpg` are used as the brand mark (nav bars, auth
screens) and hero/auth backgrounds (`components/layout/Logo.tsx`,
`AppShell.tsx`, `AuthBackground.tsx`, and the landing page). Swap these
three files to re-brand the platform for a different college.

## 6. The demo flow

1. Log in as `student@demo.com`. The dashboard shows a computed readiness
   score (~60/100, "At Risk"/"Needs Improvement" depending on latest
   activity) for the **Software Developer** target role.
2. The **Next Best Action** card recommends Coding practice, explaining why
   using Arjun's actual scores (Coding 48% vs. 75% target).
3. Click **Start Practice**, answer the questions, submit.
4. The Coding skill score updates, the readiness score recalculates, and a
   **new** recommendation appears — the loop is real, not scripted.
5. Visit **Progress** to see the readiness-over-time chart move.
6. Visit **Resume** and paste some resume text for AI/rule-based analysis.
7. Visit **Mock Interview**, answer a question, see structured feedback.
8. Log in as `faculty@demo.com`. The dashboard shows live aggregate
   readiness, skill-gap distribution, and a student directory you can
   filter by "students who need coding support."

## 7. AI architecture & safety

Every AI-touching route goes through `lib/ai/aiService.ts`, never a raw
model call. Each function:

1. Builds a prompt from real, structured application data (never invents
   input).
2. Calls the configured model asking for a single JSON object.
3. Validates the response against a Zod schema (`lib/validation/ai.ts`).
4. On any failure — no API key, timeout, invalid JSON, schema mismatch —
   falls back to a deterministic, rule-based implementation of the same
   feature, so the app is **fully functional with `AI_API_KEY` unset**.

A shared system prompt forbids absolute claims ("you will definitely get
placed") and instructs the model to use only the data it's given — this is
enforced by convention in the prompt, backed up by the fact that the model
never sees or touches the actual readiness/score calculations, which are
100% deterministic TypeScript.

## 8. Ethical & technical risk notes

| Risk | Mitigation |
|---|---|
| AI hallucination | Structured prompts, Zod-validated output, deterministic fallback for every feature |
| Bias / unfair judgment | AI never computes scores or makes pass/fail calls; it only explains and suggests |
| Privacy | Role-based access via signed session cookies + server-side authorization on every route; faculty cannot see one another's session data, students cannot see each other's |
| Incorrect scoring | Readiness/gap/priority formulas are pure functions in `lib/engine/`, unit-testable, with no AI in the loop |
| Over-reliance on AI | AI output is always labeled ("Rule-based recommendation" badge) when a fallback was used, so the UI never pretends a rule-based answer is AI-personalized |
| Data quality | A **Readiness Confidence** percentage (based on how many assessments back a skill) is shown alongside every score |

## 9. Known limitations (honest MVP scope)

- **Grading**: MCQ and short code-output questions are auto-graded by exact
  match; free-text/descriptive questions are not auto-graded in this MVP
  (per the original spec's guidance to avoid building a full code compiler).
- **Resume skill score**: the Resume *analysis* feature gives qualitative
  AI/rule-based feedback but does not currently write back into the
  deterministic "Resume" skill score — that stays driven by assessments, to
  preserve the "AI never sets scores" boundary. A future formal
  resume-rubric assessment could feed it.
- **Faculty CRUD**: job-role skill *weights* are editable in the UI, and new
  question banks can be uploaded from a PDF (`/faculty/assessments/new`);
  adding brand-new departments or skills is still done via `scripts/seed.ts`
  for this MVP (documented and easy to extend) rather than a full admin CRUD
  UI, to keep the core readiness/recommendation loop the priority per the
  project's own stated development order.
- **PDF question parsing**: the deterministic parser (used when no AI key is
  configured) expects the documented "numbered question, lettered options,
  `Answer: X` line" format — shown as an example on the upload page. Oddly
  formatted PDFs may need light cleanup, or an AI key for more tolerant
  parsing. Every question it can't confidently parse is skipped and listed,
  never silently guessed.
- **Rate limiting / CSRF**: relies on same-site session cookies and
  server-side authorization on every route; no dedicated rate limiter is
  included (would be a `middleware.ts` addition for production use).
- **PDF report export**: the faculty Report page is print/"Save as PDF"
  via the browser rather than a server-generated PDF file.

## 10. Recommended next improvements

- Persist AI-vs-fallback effectiveness metrics into a faculty-facing
  "recommendation effectiveness" analytics view (the data model already
  supports it — `feedbackRating`, `status`, `skillScoreBefore/After` on
  `Recommendation`).
- A full admin UI for departments/skills/question banks.
- Voice/video mock interviews (explicitly scoped out per the safety
  guidance against claiming to measure emotion/personality).
- Per-college branding/configuration (college name, logo, academic year).

---

Built end-to-end (schema → seed → API → UI) as a demonstration of a
deterministic-core, AI-assisted placement readiness platform.
