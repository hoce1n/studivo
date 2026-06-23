# TASKS.md — Studivo Live Task Board

This board reflects the current repository state after reviewing the Prisma schema, Next.js app folders, server actions, docs, and PWA scaffolding. Keep it updated as work moves between sections.

## In Progress / Active Fundamentals

- [ ] Refine the core seat booking layout around the existing click-seat → right-side Sheet flow.
  - Current state: clickable visual seat map and `ReserveForm` Sheet exist.
  - Next step: reduce form friction with phone-first lookup, clearer conflict states, and one primary CTA.

- [ ] Standardize all Server Action results.
  - Current state: actions validate and throw errors; `ActionForm` converts thrown errors into UI feedback.
  - Next step: migrate expected failures to a unified `{ ok, data?, error? }` action-state contract.

- [ ] Harden transactional seat collision prevention.
  - Current state: `reserveSeat` and `swapSeat` check active subscriptions inside Prisma transactions backed by PostgreSQL.
  - Next step: add database-level active-seat protection with a PostgreSQL partial unique index or equivalent invariant.

- [ ] Improve renewal visibility and operator workflow.
  - Current state: dashboard marks seats as available, reserved, renewal-needed, or expired based on active subscription end date.
  - Next step: add focused renewal queue, reminder actions, and payment follow-up states.

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
- [x] Renew subscription server action preserves history by expiring the current row and creating a new active row.
- [x] Release seat server action cancels active subscriptions.
- [x] Swap seat server action validates destination seats and blocks occupied targets inside a transaction.
- [x] Admin-only staff creation server action exists.
- [x] Profile settings are separated from admin-only hall settings.
- [x] Dedicated `تنظیمات سالن` admin dashboard route exists for venue configuration.
- [x] PWA manifest and service-worker registration exist.
- [x] Push notification proof-of-concept exists with VAPID/web-push scaffolding.
- [x] Product positioning and marketing docs exist under `docs/`.
- [x] Strategic root documentation files populated: `AGENT.md`, `DESIGN.md`, `DECISIONS.md`, and `TASKS.md`.

## Completed — Data Preservation & Trust

- [x] Expose seat-level subscription history in the seat management sheet.
- [x] Add a member archive/profile view for active and inactive members with historical subscription/payment timelines.
- [x] Add one-click archived-member reactivation through pre-filled dashboard reservations.
- [x] Add venue-scoped `AuditLog` persistence for reservation, renewal, release, and seat swap operations.
- [x] Notification preferences for renewal reminders.
  - Owners can configure renewal lead time, renewal reminders, and expiry reminders from `/dashboard/settings`.
- [x] Add an admin-only `/dashboard/logs` digital event notebook.
