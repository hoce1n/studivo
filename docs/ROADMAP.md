# Studivo Roadmap — Refactor, Harden, Learn

> Living audit-driven roadmap for Schema V2 Studivo.  
> Each item pairs a **Technical Task** (what to ship) with a **Learning Goal** (concept to master while shipping it).  
> Generated from a full-stack audit of `prisma/schema.prisma`, `app/actions/`, App Router routes, and product docs (`AGENTS.md`, `TASKS.md`, `DESIGN.md`).

**Stack context:** Next.js 16.2 / React 19 / Prisma 7 (PostgreSQL) / Better Auth / Server Actions–first mutations.

**What’s already solid (do not re-litigate):**

- Schema V2 domain: `StudyHall → Section → Seat`, `Membership` / `SeatAssignment` / `Payment` / `StaffAssignment` / `AuditLog`
- Core seat ops (reserve / renew / release / swap) with Zod + transactions + hall scoping
- Dashboard RSC shells, marketing / platform / public `[slug]` route-group separation
- Better Auth + Prisma adapter; push cron scaffold; finance + audit OWNER surfaces (mostly)

---

## How to use this document

1. Prefer **P0 → P1 → P2** within a phase; cross-phase work is fine when blocked.
2. Treat Learning Goals as deliberate practice — write a short note in `DECISIONS.md` when a concept changes product behavior.
3. Keep `TASKS.md` in sync when items move; this file is the *why + curriculum*, `TASKS.md` is the *board*.
4. Before Next.js cache/auth API changes, read `node_modules/next/dist/docs/` (Next 16 drift).

---

## Phase 0 — Integrity Baseline (ship first)

Product promise #1 is “no double-booking.” Integrity work unlocks every later feature.

| ID | Technical Task | Learning Goal | Tags |
|----|----------------|---------------|------|
| **0.1** | Add a **PostgreSQL partial unique index** on `seat_assignments(seat_id) WHERE ends_at IS NULL`. Also fix membership open-assignment uniqueness: current `@@unique([membershipId, endsAt])` fails under PG NULL-distinct rules (multiple `endsAt = null` allowed). Prefer partial unique on `(membership_id) WHERE ends_at IS NULL` and/or `UNIQUE NULLS NOT DISTINCT`. Map `P2002` to a Persian conflict error in `reserveSeat` / `swapSeat`. | **Partial unique indexes**, `NULLS NOT DISTINCT` (PG 15+), race conditions (check-then-insert vs DB invariants), Prisma `P2002`. | `database` `bug` `refactor` |
| **0.2** | Add concurrency-oriented tests that fire two parallel reserves on the same seat and assert exactly one succeeds. Optionally add `SELECT … FOR UPDATE` on the seat row inside the transaction as defense-in-depth before the unique index lands. | **Isolation levels**, row locks vs constraints, testing races without flakiness. | `database` `learning` `bug` |
| **0.3** | Gate `SeatAssignment` creation on `hasFixedSeat` in `app/actions/seats/reserve.ts` (today assignment is created unconditionally while the flag is only snapshotted). | **Domain invariants in app + DB**, snapshot fields vs live plan config. | `bug` `refactor` |
| **0.4** | Fix renewal/adjust seat sync: when extending an expired membership with a fixed seat, re-open or recreate an open `SeatAssignment` (`memberships/renew.ts`). | **Temporal state machines** (ACTIVE / EXPIRED + open/closed assignment), history-preserving updates. | `bug` |
| **0.5** | Decide and implement renewal **Payment** path (create COMPLETED/PENDING payment inside `renewMembership`, or require explicit `recordPayment`). Align finance reports. | **Financial event sourcing lite** — membership lifecycle vs payment lifecycle; reporting correctness. | `bug` `refactor` |
| **0.6** | Treat `scripts/migrate-v2.ts` as a one-off local ETL: **never commit DSNs/passwords**; use `DATABASE_URL_V1` / `DATABASE_URL_V2`; archive or gate behind npm script docs. Rotate any password that was previously committed. | Secrets hygiene; idempotent data migrations vs greenfield `prisma migrate deploy`. | `bug` `refactor` |

---

## Phase 1 — Database & Prisma Deep-Dive

Master SQL/Prisma by hardening Schema V2, not by inventing a V3 prematurely.

| ID | Technical Task | Learning Goal | Tags |
|----|----------------|---------------|------|
| **1.1** | Add missing uniqueness for **one active staff role per user per hall**: e.g. partial unique on `(user_id, studyhall_id) WHERE is_active = true` (or equivalent). | Composite / partial uniques for soft-active rows; modeling “current assignment.” | `database` `refactor` |
| **1.2** | Audit cascade graph: hall/section/seat/membership cascades can erase **financial/occupancy history** if hard deletes are ever introduced. Align Prisma `onDelete` with SQL for `Payment`/`Expense` createdBy/voidedBy. Prefer Restrict + soft flags for money tables; document in `DECISIONS.md`. | **ON DELETE CASCADE vs RESTRICT vs SET NULL**; soft void vs hard delete for ledger-like tables. | `database` `learning` |
| **1.3** | Add query-shaped indexes that match real dashboard filters: e.g. `(studyHallId, status, endsAt)` on `memberships`, `(seatId, endsAt)` covering occupancy lookups, `(studyHallId, createdAt)` on `audit_logs`. Validate with `EXPLAIN ANALYZE`. | **Composite indexes**, index selectivity, reading query plans, covering indexes. | `database` `learning` |
| **1.4** | Enforce overlap rules for `Shift` and optionally active membership date ranges — exclusion constraint (`tstzrange` + `&&`) or documented app-only checks. | **PostgreSQL exclusion constraints**, range types, when app checks are insufficient. | `database` `learning` |
| **1.5** | Wire reminder preferences onto `StudyHall` (or settings JSON): days-before, channels. Update `lib/reminders.ts` to read prefs; add **dedupe** via `Notification` rows (or a send-log table) after `RenewalReminder` removal. Rewrite stale `docs/CRON_SETUP.md` (still mentions MVP `Subscription` / `RenewalReminder`). Correct overstated “prefs complete” claim in `TASKS.md`. | **Idempotent jobs**, cron design, unique keys for “already notified,” docs/code drift. | `database` `bug` |
| **1.6** | Persist in-app `Notification` on cron/push events; wire `NotificationBell` to real reads + mark-as-read. | Fan-out: one domain event → DB row + web-push; read models for UI. | `database` `refactor` |
| **1.7** | CRM schema hygiene: `Lead.lostReason` (or structured notes), unique `convertedStudyHallId` if business requires 1:1; sync `LeadStatus` docs with schema enums. | Optional fields vs enums; CRM funnel modeling without bloating tenant tables. | `database` |
| **1.8** | Auth/push constraint hygiene: `Account @@unique([providerId, accountId])` (Better Auth convention); `PushSubscription.endpoint` unique; open-`Attendance` partial unique (`checked_out_at IS NULL`) before shipping check-in UI. | Provider account identity; push endpoint idempotency; open-row uniqueness patterns. | `database` `refactor` |
| **1.9** | Review money fields: keep `Decimal(10,2)` end-to-end; ban `Number(plan.price)` float aggregation in finance analytics; serialize Decimals at RSC→client boundaries. | **Exact numeric types**, why float breaks money, Prisma `Decimal` + JSON serialization. | `database` `learning` |
| **1.10** | Normalize schema naming/`@map` drift where cheap (StudyHall public-page camelCase columns vs snake_case domain FKs) — or document as intentional Better Auth vs domain split. | Prisma `@@map` / `@map`, dual naming conventions across auth + domain. | `learning` `refactor` |

---

## Phase 2 — Next.js Architecture & Data Flow

Use Studivo’s real routes as the lab for App Router, RSC, and caching.

| ID | Technical Task | Learning Goal | Tags |
|----|----------------|---------------|------|
| **2.1** | Deduplicate auth with React `cache()` around `getSession` / `requireScopedUser` so layout + page + nested fetches share one session resolution per request. | **React `cache()`**, request memoization, why `headers()` forces dynamic rendering. | `refactor` `learning` |
| **2.2** | Fix loading UX: specialize or remove root `app/loading.tsx` (dashboard skeleton flashes on marketing); add `dashboard/loading.tsx`; introduce Suspense boundaries (stats vs seat map). | **Segment `loading.tsx`**, Suspense streaming, nested layouts vs root fallbacks. | `refactor` `learning` |
| **2.3** | Replace blanket `revalidatePath("/dashboard")` with **tag-based invalidation** (`cacheTag` / `revalidateTag`) for seat ops vs settings vs finance. Remove dead paths (`/dashboard/memberships`, `/dashboard/seats`). | Next 16 **cache components / tags**, when path revalidation is too coarse. | `refactor` `learning` |
| **2.4** | Split the monolithic client seat island (`reserve-form.tsx` ~1k lines + map): RSC data shell + small client leaves (sheet, calendar, form). | **Server Components vs Client Components**, prop serialization, “push client boundary down.” | `refactor` `learning` |
| **2.5** | Lazy-load heavy client bundles with `next/dynamic`: marketing Silk/Three.js, recharts, shift calendar. Keep CommandPalette off public marketing routes (or gate by segment). | Code-splitting, bundle budgets, route-group-specific providers. | `refactor` |
| **2.6** | Fix staff hours **N+1** on `dashboard/staff/page.tsx` — one aggregated query (or batched action) instead of `calculateTotalHours` per member. | N+1 detection, SQL `GROUP BY` / Prisma `groupBy`, batching. | `bug` `refactor` `learning` |
| **2.7** | Multi-hall operator support: stop ambiguous `staffAssignments take: 1` without `orderBy`; add explicit hall switcher (cookie/searchParam) used by `requireScopedUser`. | Tenant resolution strategies; cookies vs URL state; never trust client-only scope. | `bug` `refactor` |
| **2.8** | Normalize action results toward one dialect (prefer AGENTS `ActionState` `{ ok }` *or* document `ActionResult` `{ success }` as canonical and migrate leftovers: `{ ok }`, throws, raw returns). | Server Actions contracts, progressive enhancement with `ActionForm`, navigation digests. | `refactor` |
| **2.9** | Remove erroneous `"use server"` from `app/api/upload/image/route.ts`; keep Blob upload as Route Handler. Optionally evaluate middleware for auth flash reduction (without duplicating all RBAC). | **Route Handlers vs Server Actions**, middleware limitations, defense in depth. | `bug` `learning` |
| **2.10** | Public `[slug]` caching strategy: consider tagged cache / ISR-style revalidation when public page settings change; keep private dashboard dynamic. | Static vs dynamic rendering, `revalidateTag` from mutations, PII-safe public caches. | `learning` |
| **2.11** | Delete or quarantine legacy mutation modules (`studyhall/mutations.ts` `totalSeats` onboarding, duplicate public-page / staff-assign paths). | Dead code as architectural smell; single write-path rule. | `refactor` |

---

## Phase 3 — Features, Bugs & Product Completion

Ship operator value on top of a trustworthy data layer.

### P0 / P1 — Front-desk & trust

| ID | Technical Task | Learning Goal | Tags |
|----|----------------|---------------|------|
| **3.1** | Phone-first member lookup on reserve: blur/search → autofill name + show active conflicts before submit. | Optimistic UX vs authoritative server validation; race between lookup and submit. | `refactor` |
| **3.2** | Enforce smart-renewal UX: one primary CTA from `daysDifference` heuristic (or disable the wrong path). | Decision UI; keep business rules on the server even if UI guides. | `bug` |
| **3.3** | Attendance check-in/out Server Actions + front-desk UI on `Attendance` (model already exists; audit enums ready). | Presence vs membership occupancy; open check-in uniqueness. | `refactor` |
| **3.4** | Wire real owner reminder prefs UI into settings (replace orphan `HallSettingsForm` fake-save). | Form → Server Action → schema → cron end-to-end. | `bug` `refactor` |
| **3.5** | Harden `createStaff` (try/catch + structured errors); prefer **invite flow** over password-in-form; track invite expiry. | Auth provisioning anti-patterns; Better Auth admin/invite patterns. | `bug` `refactor` |
| **3.6** | Centralize RBAC helpers (`requireOwner`, `canManageFinance`, …); drop legacy `"admin"` / `"ADMIN"` strings in sidebar. Enforce OWNER on **all** finance report actions (`finance/reports.ts` currently scoped-only). | Authorization as code; UI hide ≠ security. | `bug` `refactor` |
| **3.7** | Automated tests for reserve / renew / release / swap + double-book + cross-hall access. Add CI job: lint + `tsc` + Prisma validate + tests (deploy workflow is not enough). | Test pyramid for Server Actions; fixture strategies with Prisma; CI as regression gate. | `learning` `refactor` |

### P2 — Platform / CRM / growth

| ID | Technical Task | Learning Goal | Tags |
|----|----------------|---------------|------|
| **3.8** | Finish sales CRM: persist `lostReason`, assign `ownerId`, demo schedule/complete mutations, rate-limit `submitLead`. | Funnel state machines; abuse prevention on public actions. | `refactor` |
| **3.9** | Lead → venue conversion creates a *usable* hall (sections/seats/plans or deep-link into onboarding); set conversion timestamps consistently. | Onboarding as product; avoid empty tenants. | `bug` `refactor` |
| **3.10** | Strip MVP leftovers from platform venue UI (`monthlyFee`, `activeSubscriptions`, etc.) and secondary docs. | Docs/code drift control. | `refactor` |
| **3.11** | SMS renewals via market-appropriate provider; store attempt/delivery status (beyond `sms:` URI + OTP). | Transactional messaging, provider adapters, PII/compliance basics. | `refactor` |
| **3.12** | Production hardening: auth rate limits, security headers/CSP review, secrets hygiene, error monitoring (Sentry-class). Seed first `SUPER_ADMIN` if missing. | Defense in depth; observability. | `bug` `refactor` |

---

## Phase 4 — Advanced Mastery Lab (optional curriculum track)

Not all of these are product-critical; they are deliberate deep-dives using Studivo as the textbook.

| ID | Technical Task | Learning Goal | Tags |
|----|----------------|---------------|------|
| **4.1** | Implement and document a **read model** for the seat map (materialized SQL view or denormalized status column) if map queries get heavy. | CQRS-lite, denormalization trade-offs. | `learning` `database` |
| **4.2** | Add Postgres `LISTEN/NOTIFY` or polling strategy for near-real-time seat map updates across staff devices. | Realtime patterns without overbuilding websockets. | `learning` |
| **4.3** | Explore Prisma typed SQL / raw queries for finance rollups instead of loading all rows into Node. | SQL aggregation pushdown; when ORMs hurt. | `learning` `database` |
| **4.4** | Experiment with Next.js Cache Components / Partial Prerendering on marketing only (keep dashboard dynamic). | PPR mental model; static shells + dynamic holes. | `learning` |
| **4.5** | Formalize `ActionState` migration ADR and codemod a single domain module end-to-end. | Incremental architecture migration without big-bang rewrites. | `learning` `refactor` |

---

## Suggested sprint order (first 4–6 weeks)

```text
Week 1    │ 0.6 → 0.1 → 0.2           Secrets + open-seat uniqueness + race tests
Week 1–2  │ 0.3 → 0.4 → 0.5           hasFixedSeat + seat re-open + renew payment
Week 2–3  │ 1.5 → 1.6 → 3.4 → 1.8     Reminder prefs/dedupe + auth/push uniques
Week 3–4  │ 2.7 → 3.6 → 2.1 → 2.6     Multi-hall scope, RBAC, cache(), N+1
Week 4–5  │ 3.7 → 2.2 → 2.4 → 2.5     Tests/CI, loading/Suspense, seat UI split
Week 5–6  │ 3.3 → 3.1 → 3.8           Attendance, phone lookup, CRM finish
```

---

## Audit snapshot (evidence highlights)

| Area | Finding | Primary refs |
|------|---------|--------------|
| Double-booking | App checks only; no open-seat partial unique; `(membershipId, endsAt)` unique weak under NULL-distinct | `schema.prisma` `SeatAssignment`; `TASKS.md`; `AGENTS.md` §9 |
| migrate-v2 | Hardcoded local DSNs were committed; script incomplete / non-idempotent | `scripts/migrate-v2.ts` (now env-based) |
| Multi-hall | `take: 1` without order → ambiguous venue | `verify-role.ts`, `dashboard/layout.tsx` |
| Finance RBAC | Report actions lack OWNER gate | `app/actions/finance/reports.ts` |
| Renewals | No Payment write; adjust may leave seat closed | `memberships/renew.ts` |
| Notifications | Prefs overstated; `Notification` unused; cron no dedupe; stale CRON docs | `lib/reminders.ts`, `docs/CRON_SETUP.md` |
| Attendance | Model only; no open check-in unique yet | `Attendance` in schema |
| Cascades | Hard delete of User/Seat can wipe payments/assignment history | `schema.prisma` relations |
| Auth/push uniques | Missing `Account(providerId, accountId)`; `PushSubscription.endpoint` not unique | `schema.prisma` |
| Tests / CI | Zero `*.test.*`; deploy-only workflow | `package.json`, `.github/workflows/` |
| Performance | Staff hours N+1; Three.js hero; huge client reserve form | `dashboard/staff`, marketing Silk, `reserve-form.tsx` |
| Loading UX | Root `loading.tsx` is dashboard-shaped | `app/loading.tsx` |
| Legacy | MVP onboarding / duplicate settings paths | `studyhall/mutations.ts` |

---

## Tag legend (for Linear / project boards)

| Tag | Meaning |
|-----|---------|
| `database` | Schema, SQL, migrations, indexes, constraints |
| `refactor` | Structural improvement without new product surface |
| `bug` | Incorrect or unsafe current behavior |
| `learning` | Explicit curriculum payoff; write ADR notes |
| `phase-0` … `phase-4` | Roadmap phase grouping |

---

## Related docs

- `AGENTS.md` — coding guardrails & strategic priorities  
- `TASKS.md` — live checkbox board  
- `DESIGN.md` / `DECISIONS.md` — architecture & ADRs  
- `docs/CRON_SETUP.md`, `docs/PWA_GUIDE.md`, `docs/postgresql-backup-restore.md`
