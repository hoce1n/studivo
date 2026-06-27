# TASKS.md — Studivo Live Task Board

This board reflects the current repository state after reviewing the Prisma schema, Next.js app folders, server actions, docs, and PWA scaffolding. Keep it updated as work moves between sections.

## In Progress / Active Fundamentals

- [ ] Refine the core seat booking layout around the existing click-seat → right-side Sheet flow.
  - Current state: clickable visual seat map and `ReserveForm` Sheet exist.
  - Next step: reduce form friction with phone-first lookup, clearer conflict states, and one primary CTA.

- [x] Standardize core Server Action results.
  - Core auth/settings, seat, subscription, and PWA actions now return a unified `{ success, error?, message?, data? }` result for expected failures and user feedback.

- [ ] Harden transactional seat collision prevention.
  - Current state: `reserveSeat` and `swapSeat` check active subscriptions inside Prisma transactions backed by PostgreSQL.
  - Next step: add database-level active-seat protection with a PostgreSQL partial unique index or equivalent invariant.

- [x] Improve renewal visibility and operator workflow.
  - Smart renewal/date-correction guidance is shown in the seat management sheet, and renewal actions preserve history only when the new end date is more than seven days beyond the current end date.

- [ ] Normalize RBAC and permission helpers.
  - Current state: `admin`, `staff`, and `member` roles are string fields; admin-only checks exist for staff creation and venue settings.
  - Next step: introduce central permission helpers and eventually a Prisma enum.

- [x] Convert PWA push notification demo into production-ready notification infrastructure.
  - Push subscriptions persist in PostgreSQL by `userId` and `studyhallId`.
  - Daily cron route sends renewal/expiry reminders to admin/staff devices.
  - Owner-configurable reminder timing and notification preferences UI are complete.

## Planned Features (Short-term)

- [ ] Database-level no-double-booking invariant.
  - Add an active-seat uniqueness strategy, ideally a PostgreSQL partial unique index for active subscriptions.
  - Add tests that simulate conflicting reservations.

- [ ] SMS reminder integration for renewals.
  - Send renewal/expiry reminders through an SMS provider suitable for the target market.
  - Store message attempts and delivery status.

- [ ] Staff audit logs.
  - Record who reserved, renewed, released, swapped, created staff, and changed settings.
  - Include timestamps, study hall scope, target entity, and before/after metadata.

- [ ] Member phone-first smart autofill.
  - On phone blur/search, find existing member in the current study hall.
  - Autofill name and show active subscription conflicts before submit.

- [ ] Staff invite flow.
  - Replace manual staff password creation with an invite-based flow.
  - Track invite status and expiration.

- [ ] Payment/invoice model.
  - Expand beyond `paymentStatus` to invoices, receipts, payment method, discounts, and partial payments.
  - Add provider/webhook integration when a payment provider is chosen.

- [ ] Subscription history and member profile pages.
  - Show all past seats, renewals, cancellations, payments, and notes for a member.

- [ ] Automated tests for critical business rules.
  - Cover reserve, renew, release, swap, onboarding, and staff creation.
  - Add regression tests for double-booking and cross-studyhall access.

- [ ] CI checks.
  - Run lint, type/build checks, Prisma validation, and test suite on pull requests.


- [ ] Production security hardening.
  - Rate-limit auth routes.
  - Review headers/CSP.
  - Validate secrets management.
  - Add monitoring/error reporting.

## Completed

- [x] Refactor server actions into domain modules with a main barrel export.
- [x] PostgreSQL production migration completed.
- [x] SQLite-specific adapter cleanup completed from Prisma client wiring.
- [x] Next.js 16 App Router project initialized.
- [x] React 19 and TypeScript configured.
- [x] Tailwind CSS v4 and shadcn/Radix-style UI primitives available.
- [x] Better Auth integration configured with Prisma adapter and email/password auth.
- [x] Auth API route mounted at `app/api/auth/[...all]/route.ts`.
- [x] Prisma schema created for `StudyHall`, `User`, `Seat`, `Subscription`, and Better Auth tables.
- [x] PostgreSQL datasource/provider configured through Prisma.
- [x] Onboarding flow creates a study hall with name, hall type, address, monthly fee, assigns owner as admin, and generates seats.
- [x] Dashboard route protects unauthenticated users and redirects users without a study hall to onboarding.
- [x] Live seat map implemented with visual statuses for available, reserved, renewal-needed, and expired seats.
- [x] Quick reserve/manage Sheet implemented from the seat map.
- [x] Reserve seat server action validates input, scopes by study hall, checks active seat conflicts, upserts member, and creates subscription in a transaction.
- [x] Custom subscription start date supported in reserve flow: `ReserveForm` exposes «تاریخ شروع اشتراک» (defaults to today) and `reserveSeat` persists the operator-selected `startDate` with audit metadata.
- [x] Renew subscription server action uses smart renewal logic: real renewals preserve history by expiring the current row and creating a new active row, while small date corrections update the active row.
- [x] Release seat server action cancels active subscriptions.
- [x] Swap seat server action validates destination seats and blocks occupied targets inside a transaction.
- [x] Admin-only staff creation server action exists.
- [x] Profile settings are separated from admin-only hall settings.
- [x] Dedicated `تنظیمات سالن` admin dashboard route exists for venue configuration.
- [x] PWA manifest and service-worker registration exist.
- [x] Push notification proof-of-concept exists with VAPID/web-push scaffolding.
- [x] Product positioning and marketing docs exist under `docs/`.
- [x] Strategic root documentation files populated: `AGENT.md`, `DESIGN.md`, `DECISIONS.md`, and `TASKS.md`.
- [x] Transition (marketing) routes to professional production-ready state.
  - Replaced placeholders with high-quality Persian copy from marketing blueprint.
  - Integrated real Contact/Lead server actions with `ActionForm` and descriptive success states.
  - Verified and enriched legal/compliance pages (Privacy, Terms, Refund) with SMS consent.
  - Polished UI/UX and verified successful local build.

## Completed — Data Preservation & Trust

- [x] Expose seat-level subscription history in the seat management sheet.
- [x] Add a member archive/profile view for active and inactive members with historical subscription/payment timelines.
- [x] Add one-click archived-member reactivation through pre-filled dashboard reservations.
- [x] Add venue-scoped `AuditLog` persistence for reservation, smart renewal/date correction, release, and seat swap operations.
- [x] Notification preferences for renewal reminders.
  - Owners can configure renewal lead time, renewal reminders, and expiry reminders from `/dashboard/settings`.
- [x] Add an admin-only `/dashboard/logs` digital event notebook.

---

# Sales & Marketing Platform Roadmap

This roadmap covers the **business side** of Studivo — the internal Sales Platform — and is tracked separately from the customer product board above. It follows the architecture in `DESIGN.md` §8 and ADR-009 through ADR-015. The funnel it serves is: **Visitor → Lead → Company → StudyHall → Customer**.

Phase 1 (this milestone set's foundation work) intentionally ships only the data model, the platform role, and documentation. Analytics and the full CRM/pipeline UI are deferred on purpose.

## Milestone 0 — Phase 1 Foundation

- [x] Design platform-level Sales data model (`Lead`, `Company`, `DemoRequest`, `Interaction`, `Campaign`, `Referral`) without scoping by `studyhallId`.
- [x] Add sales pipeline enums (`LeadStage`, `LeadSource`, `InteractionType`, `DemoRequestStatus`, `CompanyStatus`, `ReferralStatus`).
- [x] Add platform-level `PlatformRole` enum and nullable `User.platformRole` (SUPER_ADMIN outside tenant scope) without touching the tenant `role` string.
- [x] Add the single tenant↔sales bridge: nullable `StudyHall.companyId` with `onDelete: SetNull`.
- [x] Validate schema and regenerate the Prisma client.
- [x] Update `DESIGN.md`, `DECISIONS.md`, and `TASKS.md` for the Sales Platform.
- [ ] Apply the schema with `npx prisma db push` against the live database, then `npx prisma generate` (requires `DATABASE_URL`).
- [ ] Seed a first `SUPER_ADMIN` platform user (no `studyhallId`).

## Milestone 1 — Marketing Foundation

- [ ] Treat `app/(marketing)` as instrumented product surface (ADR-015), not static pages.
- [ ] Integrate PostHog (already a dependency) for anonymous Visitor + funnel tracking.
- [ ] Capture UTM parameters on landing and pass `source`/`campaign` through to lead submission.
- [ ] Add structured metadata/SEO and per-campaign landing variants.
- [ ] Define conversion events (form view, form start, submit, demo request) in analytics.

## Milestone 2 — Lead Management

- [ ] Replace the console-log `submitLead` with a real action that persists a `Lead` (with `source`, optional `campaignId`).
- [ ] Add a dedicated `app/actions/sales/` module with standardized `ActionResult` returns.
- [ ] Add a "request a demo" form that creates a `Lead` (if new) plus a `DemoRequest`.
- [ ] Server-side lead validation, dedup by phone/email, and spam/rate-limit protection.
- [ ] Notify platform users of new leads (reuse push/notification or email).
- [ ] Optional double opt-in / SMS consent capture for the Iranian market.

## Milestone 3 — Internal Admin Platform

- [ ] Add a platform-only route segment (e.g. `app/(platform)/admin`) separate from `/dashboard`.
- [ ] Add `requirePlatformUser` / `requireSuperAdmin` guards that check `platformRole` (mirroring `requireScopedUser`).
- [ ] Leads inbox: list, filter by `stage`/`source`/`campaign`, assign `ownerId`.
- [ ] Lead detail with `Interaction` timeline (notes, calls, emails, SMS, meetings).
- [ ] Company (account) view linking leads, demo requests, and provisioned StudyHalls.
- [ ] Demo request scheduling and status management.
- [ ] Customer view: ACTIVE companies and their linked study halls.

## Milestone 4 — Sales Pipeline

- [ ] Pipeline/Kanban board over `LeadStage` (NEW → CONTACTED → DEMO → TRIAL → CUSTOMER → LOST).
- [ ] Stage transition action that records an `Interaction` and updates `convertedAt`/`lostReason`.
- [ ] Lead → Company qualification flow (create/link `Company`, set `Lead.companyId`).
- [ ] Customer provisioning flow: create/link `StudyHall.companyId` when a deal is won.
- [ ] Referral capture and `ReferralStatus` lifecycle for word-of-mouth growth.
- [ ] Owner assignment, follow-up reminders, and stale-lead surfacing.

## Milestone 5 — Analytics

- [ ] Funnel analytics: Visitor → Lead → Demo → Trial → Customer conversion rates.
- [ ] Acquisition analytics by `source` and `Campaign` (volume, conversion, cost where available).
- [ ] Sales performance: stage conversion, demo show-rate, win/loss, time-to-close per owner.
- [ ] Revenue/retention analytics by joining `Company → StudyHall → Subscription` history.
- [ ] SUPER_ADMIN executive dashboard combining marketing, sales, and revenue signals.
- [ ] Scheduled/exportable reporting on top of read-only aggregations (no new transactional tables).
