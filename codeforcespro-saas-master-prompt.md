# CodeforcesPro → SaaS: Master Prompt Pack

## How to use this

Don't paste all phases into one Claude Code / Cursor session and hope for the best. Paste
**"Shared Context"** once at the start of a session, then paste **one phase's prompt**, let
it finish, review the diff, commit, and only then move to the next phase. Each phase assumes
the previous one is merged and working.

If any assumption below is wrong (stack, current architecture), edit the Shared Context block
before you paste it — the agent will build on whatever you tell it is true.

---

## Shared Context (paste this first, every session)

```
Project: CodeforcesPro — a competitive-programming analytics dashboard for Codeforces,
currently deployed at codeforcespro.vercel.app.

Current state:
- Single-user client that pulls live data from the public Codeforces API (no persistent DB).
- Pages: Dashboard, Problems (solved explorer), Submissions, Contests, Analytics,
  Insights & AI, Compare Users, Progress & Goals, Bookmarks, Notes.
- "Insights & AI" currently generates text from fixed conditional logic on stats, not a
  real model call.
- Dashboard and Analytics pages are near-duplicates (same stat cards + same radar chart) —
  this needs to be resolved, not preserved.
- Assumed stack: Next.js + TypeScript + Tailwind, deployed on Vercel.
  [EDIT THIS if wrong — tell the agent your actual stack, ORM, and hosting before proceeding]
- No database, no auth, no billing exist yet.

Design language to preserve: dark theme, card-based layout, sidebar nav grouped into
"Main Platform / Intelligence & Tools / Workspace", green/orange/purple accent colors for
positive/target/highlight states. Any new UI must match this, not introduce a new style.

Non-negotiables for every phase:
1. Do not break existing pages/features while adding new ones.
2. Do not add a new top-level nav page that duplicates an existing one's content —
   if two pages would show the same data, merge them or clearly differentiate them.
3. Every new "AI" feature must call an actual LLM API with real user data in the prompt —
   no more hardcoded if/else dressed up as insight.
4. Write a short README note for each phase describing what changed and any new env vars.
5. Ask me before any change that would require re-architecting a previous phase's work.
```

---

## Phase 0 — Persistence Foundation

```
Goal: Add a real database so data survives beyond a single API pull, and enable
historical trend data (rating over time, problems/week) that currently doesn't exist.

Do:
1. Add Postgres (Supabase or Neon) with a schema for: users, linked_handles,
   submission_snapshots (timestamped), sync_log.
2. On each "Sync Data" click (and later, on a schedule), fetch from Codeforces API and
   upsert into submission_snapshots rather than just holding it in client state.
3. Add a simple daily cron (Vercel Cron or similar) that re-syncs all active users'
   handles automatically, so "Sync Data" becomes a manual override, not the only way
   data updates.
4. Add response caching for Codeforces API calls (TTL ~10 min) to avoid rate-limit issues
   once more than one user is syncing.

Definition of done: reloading the dashboard after a fresh deploy still shows the last
known data (not a blank state), and there's at least one chart showing a trend over
time (e.g. problems solved per day, last 30 days) built from stored snapshots, not
a single live pull.
```

---

## Phase 1 — Real AI Insights

```
Goal: Replace the rule-based "Insights & AI" page with actual LLM-generated analysis.

Do:
1. Build a server-side endpoint that assembles the user's real data (solved problems,
   tags, ratings, timestamps, verdicts) into a structured prompt and calls the Claude API
   (or your provider of choice) to generate: a written diagnostic summary, a recommended
   next-difficulty target with reasoning, and a suggested weekly practice plan.
2. Add a "regenerate insights" action so it's clearly a live model call, not cached copy
   that never changes.
3. Add a post-contest feature: after syncing a contest's submissions, auto-generate a
   short LLM writeup of what went well / what to work on for that specific contest.
4. (Stretch) Add a natural-language query box on this page — user types a question like
   "what should I practice before my next contest," backend feeds their real stats to
   the model and returns a direct answer.

Definition of done: the insights shown are demonstrably different for two accounts with
different solve histories, and change if you ask again with new data — not fixed strings
keyed off thresholds.
```

---

## Phase 2 — Auth & Multi-Tenancy

```
Goal: Turn this from a single hardcoded-handle app into a real multi-user product.

Do:
1. Add authentication (Auth.js / Clerk) — email or GitHub login.
2. Each authenticated user can link one or more Codeforces handles to their account.
   All existing pages should scope to "the logged-in user's linked handle(s)" instead
   of a hardcoded username.
3. Add a "cohort" or "team" concept: a user can create a group, invite others (by handle
   or invite link), and see an aggregate/leaderboard view scoped to that group. This is
   the feature that makes it usable by a coding club, a DSA study group, or a college TA
   tracking students — not just a personal tracker.
4. Data model must support: one user having multiple handles, and one handle appearing
   in multiple cohorts.

Definition of done: two different people can sign up, link different CF handles, see
only their own data on personal pages, and both see a shared leaderboard if they join
the same cohort.
```

---

## Phase 3 — Automation Layer (n8n)

```
Goal: Use n8n as the operational backbone instead of hand-rolling every scheduled job
in application code — showcase real workflow-automation engineering, not just app code.

Do:
1. Build n8n workflows for: nightly data sync per active user, "streak at risk" reminder
   (email or Discord webhook) if a user hasn't solved anything in N hours and their streak
   is about to break, contest-reminder notifications ahead of registered contests, and a
   weekly digest email summarizing the week's progress.
2. Expose whatever internal API endpoints n8n needs (sync trigger, user list, notification
   send) as clean authenticated endpoints rather than giving n8n direct DB access.
3. Document each workflow (trigger, steps, failure handling) in a short markdown file per
   workflow, the way you'd document any production automation.

Definition of done: at least the streak-reminder and weekly-digest workflows are live and
demonstrably firing (test with a throwaway account), and there's a short writeup you could
show a client or interviewer explaining the automation architecture.
```

---

## Phase 4 — Multi-Platform Aggregation & Public Profiles

```
Goal: Widen the product beyond Codeforces-only, and add a shareable growth loop.

Do:
1. Add LeetCode and/or AtCoder as additional data sources per user (start with one, expand
   later) — unify the "Problems Solved / Skill Radar / Analytics" views to show aggregated
   or platform-filtered data.
2. Add a public, unauthenticated profile page per user (e.g. /u/[handle]) showing their
   solved stats, skill radar, and achievement badges — shareable link, no login required
   to view.
3. Add an embeddable SVG stats badge (like GitHub README stat cards) generated server-side
   from a user's data, so people can embed it elsewhere and drive traffic back.

Definition of done: a logged-out visitor can view a public profile page and see a
generated stats badge image, without needing an account.
```

---

## Phase 5 — Monetization

```
Goal: Add the actual SaaS commercial layer — right now there's no front door and no
pricing at all.

Do:
1. Build a marketing landing page (separate from the app) explaining the product, with
   a pricing page: Free tier (current dashboard, one handle, basic analytics) vs Pro tier
   (AI insights, multi-platform aggregation, cohorts/teams, data export, full history).
2. Integrate Stripe for subscription billing, gate Pro features server-side (not just
   hidden in the UI), and add a billing/account settings page.
3. Add usage analytics (PostHog or similar) so you can see which features people actually
   use before deciding what to build next.

Definition of done: a new visitor can land on the marketing page, understand what it does
and what it costs, sign up for free, and hit a real paywall when trying a Pro feature.
```

---

## Phase 6 — UX Debt Cleanup (do this early, not last)

```
Goal: Fix the issues that make the current app look unfinished, independent of new features.

Do:
1. Resolve the Dashboard vs Analytics duplication — either merge them into one page, or
   clearly differentiate (e.g. Dashboard = quick glance + recent activity, Analytics =
   deep historical trends only, no overlap in what's shown).
2. Fix the Skill Proficiency Radar so it degrades gracefully with thin data — either a
   minimum-problems-solved gate with an explanatory empty state, or a normalized scale
   that doesn't collapse into an unreadable sliver.
3. Seed new accounts with example Notes/Bookmarks content (or a clear onboarding empty
   state with a call to action), so first-run experience doesn't look broken.

Definition of done: a brand-new user account doesn't show any page that looks like a bug
or an unfinished duplicate.
```
