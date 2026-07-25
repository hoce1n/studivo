# DESIGN.md — Studivo Technical Architecture

## 1. System Overview

**Studivo** is Study Hall Management Software for physical seat-based venues: study halls, private libraries, exam-prep boarding/study spaces, and small co-working rooms where a fixed inventory of seats is sold through recurring memberships.

The product is intentionally not a generic SaaS dashboard. Its core domain is the daily operational loop of a study hall:

1. An owner creates a venue, sections, seat inventory, and membership plans.
2. Staff view a live visual map of all seats.
3. A member receives a Membership from a MembershipPlan; fixed-seat plans also get a SeatAssignment.
4. Near-expiry and expired seats are highlighted so renewals are not forgotten.
5. Staff can renew, release, or move a member without relying on notebooks, memory, or spreadsheets.

The current application is a Next.js 16 App Router application with server-rendered dashboard pages, client-side interactive seat-map components, Prisma-backed persistence, Better Auth authentication, Tailwind CSS v4 styling, shadcn/ui primitives, and PWA/push-notification foundations.

## 2. Technology Stack

- **Framework:** Next.js 16.2.6 using the App Router.
- **Runtime/UI:** React 19, TypeScript, Server Components, Client Components where interactivity is required.
- **Persistence:** Prisma 7.8 with a generated client in `lib/generated/prisma`.
- **Database:** PostgreSQL is the official platform database for development-aligned production workflows and transactional seat-management safety.
- **Authentication:** Better Auth with email/password enabled and a Prisma adapter.
- **Styling:** Tailwind CSS v4, next-themes, Radix/shadcn-style UI components, Sonner toasts.
- **PWA:** Web app manifest, service-worker registration, persisted push subscriptions scoped by user, automated renewal reminder delivery for staff/owner operators, and a service-worker cache policy that keeps Next.js build assets and navigation responses network-owned to prevent stale post-deploy chunks.

PostgreSQL now backs Studivo's server-side concurrency model. Seat reservation, renewal, release, and swap flows still use explicit Prisma transactions, and those transactions are now backed by PostgreSQL isolation and locking behavior instead of file-level database locking. This is critical for peak-season front-desk activity where multiple staff members may attempt high-value seat operations at the same time.

### Deployment & Client Asset Consistency

Production deployments must avoid mixing `.next` output from different builds. The baseline VPS deploy path is `scripts/deploy-production.sh`, which pulls the branch, installs locked dependencies, stops PM2 before deleting `.next`, builds a clean Next.js output, then starts the PM2 process. The root layout also mounts `ChunkLoadRecovery`, a client-only safety net that reloads an already-open tab once when the browser reports a stale Next.js chunk load failure.

Nginx should cache only immutable `/_next/static/*` files for a long duration. HTML, RSC, and navigation/prefetch responses should remain controlled by Next.js cache headers or explicitly be marked no-store at the proxy.

## 3. Database & Entity Relationships

The authoritative domain model is `prisma/schema.prisma` (Schema V2). Formal SQL migrations live under `prisma/migrations/` (notably `init_v2` and the seat-assignment unique follow-up).

### Domain map (V2)

```
StudyHall
  ├── Section[] → Seat[]
  ├── MembershipPlan[]
  ├── Membership[] → Payment[], SeatAssignment[], Attendance[]
  ├── StaffAssignment[] → Shift[]
  ├── Expense[]
  └── AuditLog[]

User (auth identity)
  ├── StaffAssignment[]   (OWNER / STAFF per hall)
  ├── Membership[]        (as member / student)
  ├── Notification[], PushSubscription[]
  └── platformRole?       (SUPER_ADMIN / SALES → Lead / DemoRequest)
```

### StudyHall

`StudyHall` is one managed venue/branch. It stores name, optional public `slug`, `gender` (`MALE` | `FEMALE`), phone, address, description, `isActive`, public-page fields (`publicPageEnabled`, `heroImage`, `galleryImages`), and timestamps.

It no longer stores `totalSeats` or `monthlyFee`. Capacity is derived from active seats under active sections. Pricing comes from `MembershipPlan` rows.

Relationships:

- One `StudyHall` has many `Section`, `MembershipPlan`, `Membership`, `StaffAssignment`, `Expense`, and `AuditLog` records.
- Converted sales leads point back via `Lead.convertedStudyHallId`.

Integrity behavior:

- Cascades remove section/seat/plan/membership/staff/expense/audit data when a venue is deleted.
- Dashboard and mutation queries are scoped by `studyHallId` resolved from the operator's active `StaffAssignment`.

### Section / Seat

`Section` models a room, floor, or zone inside a venue (`@@unique([studyHallId, name])`).

`Seat` is a physical desk inside a section (`number` is a string; `@@unique([sectionId, number])`). Soft-deactivation uses `isActive` on both section and seat.

Occupancy is **not** a column on `Seat`. It is inferred from open / occupying `SeatAssignment` rows.

### MembershipPlan / Membership

`MembershipPlan` is a reusable template per venue: `name`, `durationDays`, `price`, `hasFixedSeat`, `isActive`, optional description.

`Membership` is the member's contract for a period. At create time it **snapshots** `planName`, `planDurationDays`, `planPrice`, and `hasFixedSeat` so later plan price/duration edits do not rewrite history. Status is `PENDING` | `ACTIVE` | `EXPIRED` | `CANCELLED`, with `startsAt` / `endsAt`.

Product UI may still say “رزرو” or “اشتراک”; the canonical model name is `Membership`.

### SeatAssignment

`SeatAssignment` links a `Membership` to a `Seat` with `startsAt` and optional `endsAt`.

- Open assignment: `endsAt = null` (member currently holds the seat).
- Closed assignment: `endsAt` set (released, swapped away, or otherwise ended). History is preserved as rows, not by overwriting a seat FK on the membership.

Applied DB constraint: `@@unique([membershipId, endsAt])` (migration `fix_seat_assignment`). This is **not** a partial unique on open `seatId` occupancy. Two different memberships can still collide on the same seat at the database level; Server Actions must continue to check occupancy inside transactions. A true open-seat partial unique remains follow-up work (see ADR-018).

### Payment / Expense

`Payment` belongs to a `Membership`: `amount`, `method` (`CASH` | `POS` | `CARD_TO_CARD` | `ONLINE`), `status` (`PENDING` | `COMPLETED` | `VOIDED`), optional `paidAt`, void metadata, and `createdBy` / `voidedBy` actors. Multiple payments per membership support partial payment flows.

`Expense` is venue-scoped operational spend with category enum, `occurredAt`, and void support.

### StaffAssignment / Shift / Attendance

`StaffAssignment` attaches a `User` to a `StudyHall` with `HallRole` (`OWNER` | `STAFF`), `startDate` / optional `endDate`, and `isActive`. This replaces MVP `User.role` + `User.studyhallId`.

`Shift` schedules work intervals on a staff assignment.

`Attendance` records member check-in/out against a `Membership`, with optional staff actors for check-in and check-out.

### AuditLog / Notification / OtpVerification

`AuditLog` uses typed `AuditAction` and `AuditEntity` enums, optional `actorId`, optional `studyHallId`, `entityId`, and JSON `metadata`.

`Notification` is user-scoped (`MEMBERSHIP_EXPIRING`, `PAYMENT_DUE`, `PAYMENT_RECEIVED`, `SYSTEM`).

`OtpVerification` stores phone OTP codes for `LOGIN` / `VERIFY_PHONE`.

### Auth tables / Push

`Session`, `Account`, and `Verification` remain Better Auth persistence tables.

`PushSubscription` stores browser push endpoints scoped by `userId` (no `studyhallId` column in V2). A secured cron route (`/api/cron/renewal-reminders`) still drives renewal/expiry reminders to operator devices. The MVP `RenewalReminder` table was removed; dedupe behavior should be revalidated against the current reminder path.

### Sales models

`Lead`, `DemoRequest`, and `PlatformRole` follow ADR-009–013. The sales↔tenant bridge is `Lead.convertedStudyHallId` (nullable). These tables are platform-scoped and must not be read through tenant dashboard queries.

## 4. Core Operational Flows

Primary business logic lives in domain-focused Next.js Server Action modules under `app/actions/` (`seats/`, `memberships/`, `staff/`, `finance/`, `onboarding.ts`, `auth/`, `audit/`, `notifications/`, `platform/`, …). These actions are the authoritative mutation layer and must remain server-side.

### Onboarding Flow

1. A signed-in user with no active `StaffAssignment` is redirected to `/onboarding`.
2. `submitOnboarding` validates venue identity, optional multi-section layout, seat numbering mode, and initial membership plans with Zod.
3. Inside a Prisma transaction:
   - Create the `StudyHall`.
   - Create one or more `Section` rows and their `Seat` rows (auto-numbered or manual).
   - Create initial `MembershipPlan` rows.
   - Create an active `StaffAssignment` with role `OWNER` for the current user.
4. Revalidate `/dashboard` and send the owner into the dashboard.

This transaction ensures venue, owner assignment, inventory, and plans are created atomically.

### Booking / Reserving a Seat

`reserveSeat` (in `app/actions/seats/reserve.ts`) is the current reservation action.

Flow:

1. Require an authenticated, venue-scoped user via `requireScopedUser`.
2. Validate seat id, membership plan, member name/phone, start/end dates, and payment fields.
3. Open a Prisma transaction.
4. Load the seat through its section and confirm it belongs to the current `studyHallId` and is active.
5. Reject if the seat already has an occupying assignment.
6. Load the active `MembershipPlan` for the venue.
7. Upsert the member `User` by globally unique `phoneNumber`.
8. Reject if that member already has an active/pending membership (or occupying assignment) in this study hall.
9. Create the `Membership` with plan field snapshots; status depends on payment completion (`ACTIVE` vs `PENDING`).
10. Create an open `SeatAssignment` (`endsAt: null`) when the flow assigns a fixed seat.
11. Create the related `Payment` row.
12. Write an `AuditLog` entry in the same transaction.
13. Revalidate operational dashboard paths.

This protects the core promise: staff cannot intentionally reserve a seat the app already knows is occupied.

### Double-Booking Prevention

Current protection is application-level inside Prisma transactions:

- Lookups are scoped by `studyHallId` (via section or membership).
- Target seat occupancy is checked before creating a new open assignment.
- Member phone / user is checked for another active membership or occupying assignment in the same venue.
- Seat numbers are unique per section; section names are unique per study hall.
- Member phones are globally unique on `User`.

Production hardening recommendation:

- Keep all seat mutations inside Prisma transactions.
- Add a database-level open-seat invariant, ideally a PostgreSQL partial unique index on `seat_assignments(seat_id) WHERE ends_at IS NULL` (or an equivalent trigger). The existing unique on `(membership_id, ends_at)` does **not** provide this guarantee.
- Use explicit row-level locking if future high-concurrency booking queues require stricter serialization.

### Dynamic Seat Changes / Swapping Seats

`swapSeat` moves an occupying assignment to a different seat.

Flow:

1. Require a scoped authenticated user.
2. Validate the current `seatAssignmentId` and destination seat.
3. Open a Prisma transaction.
4. Confirm the source assignment is occupying and belongs to the current study hall.
5. Confirm the destination seat exists in the venue and is not already occupied.
6. Close the source assignment (`endsAt = now`) and create a new open assignment on the target seat for the same membership.
7. Write audit metadata and revalidate operational paths.

Seat history is preserved as assignment rows. Membership period continuity is separate from physical seat moves.

### Renewing a Membership

`renewMembership` validates the new end date and runs renewal / adjustment logic inside a Prisma transaction:

1. Find the membership by id and current `studyHallId`.
2. Decide real renewal vs date adjustment (including optional plan switch) from operator input and day delta.
3. For real renewals, preserve history appropriately and keep fixed-seat `SeatAssignment` occupancy in sync so the map stays correct.
4. Snapshot plan fields when a plan change is part of the renewal.
5. Write an `AuditLog` entry with renewal/adjustment metadata.
6. Revalidate operational paths.

### Releasing a Seat

`releaseSeat` closes the occupying `SeatAssignment` (`endsAt = now`) and cancels the related active/pending `Membership` inside a transaction scoped to the current study hall, then revalidates the dashboard.

## 5. Authentication & Authorization

### Better Auth Integration

Better Auth is configured in `lib/auth.ts` with:

- Prisma adapter.
- PostgreSQL provider.
- Email/password authentication enabled.

The route handler at `app/api/auth/[...all]/route.ts` exposes the Better Auth API. Server-side code reads sessions through `getSession` in `lib/server.ts`, which passes Next.js request headers to Better Auth. Phone OTP flows use `OtpVerification` alongside Better Auth where needed.

### RBAC Model

Tenant authority is modeled with `StaffAssignment.HallRole`:

- `OWNER`: venue owner/operator with settings and staff-management privileges.
- `STAFF`: front-desk operator who can access the venue dashboard and perform operational seat work.

Members/students are ordinary `User` rows linked through `Membership`; they are not hall staff and are not currently full self-service app users.

Platform authority remains orthogonal via nullable `User.platformRole` (`SUPER_ADMIN` | `SALES`) per ADR-010.

Current enforcement patterns:

- `requireUser` redirects unauthenticated users to `/login` and loads active `staffAssignments`.
- `requireScopedUser` redirects users with no active staff assignment to `/onboarding`, then exposes `studyHallId` and hall `role` from the first active assignment.
- Owner-only operations should check hall role `OWNER` (not MVP string `"admin"`).
- Dashboard queries and mutations are scoped to `studyHallId` from that assignment.
- Platform routes use `requirePlatformUser` / `requireSuperAdmin` against `platformRole`.

Future hardening:

- Centralize permission helpers, e.g. `canManageStaff`, `canReserveSeat`, `canEditVenueSettings`.
- Support multi-hall operators choosing among multiple active `StaffAssignment`s explicitly.
- Continue migrating expected action failures to structured result objects.
- Expand audit coverage for remaining staff/owner mutations.

## 6. Folder Structure Map

### `app/`

- `app/layout.tsx`: root HTML shell, metadata, theme/provider wiring, PWA registration.
- `app/globals.css`: Tailwind v4 global styling and design tokens.
- `app/(marketing)/`: public landing page and marketing sections for Studivo.
- `app/(auth)/login` and `app/(auth)/signup`: authentication screens.
- `app/onboarding`: first-run venue creation flow.
- `app/dashboard`: authenticated study hall operations dashboard.
- `app/dashboard/_components`: dashboard-specific seat map, seat cards, reserve/manage sheet, and staff form.
- `app/dashboard/profile`: user profile and password/security settings.
- `app/dashboard/settings`: owner hall settings for identity, sections/seats, membership plans, and public page.
- `app/actions`: domain Server Actions (`seats/`, `memberships/`, `staff/`, `finance/`, `onboarding.ts`, `auth/`, …).
- `app/api/auth/[...all]`: Better Auth route handler.
- `app/manifest.json`: PWA manifest.

### `components/`

- `components/ui`: shadcn/Radix UI primitives. Prefer these before creating new UI primitives.
- `components/action-form.tsx`: reusable client form wrapper for server actions, toast feedback, and inline errors.
- `components/app-sidebar.tsx`, `components/nav-*`, `components/team-switcher.tsx`: shared app shell/navigation components.
- `components/pwa`: PWA install and push-notification UI.
- `components/onboarding-form.tsx`: onboarding UI.

### `lib/`

- `lib/db.ts`: Prisma client singleton for the PostgreSQL-backed Prisma datasource.
- `lib/auth.ts`: Better Auth configuration.
- `lib/auth-client.ts`: client-side Better Auth integration.
- `lib/server.ts`: server helper for reading sessions.
- `lib/action-errors.ts`: helpers for converting thrown errors into user-visible messages without swallowing Next.js navigation errors.
- `lib/utils.ts`: shared utility helpers such as `cn`.

### `docs/`

- `docs/STUDIVO.md`: existing product/technical overview.
- `docs/STUDIVO_MARKETING.md`: positioning and sales language.
- `docs/PWA_GUIDE.md`: PWA implementation notes.
- `docs/Plan.md`: UX improvement notes and code pointers.

## 7. Current Architecture Risks

1. **Open-seat uniqueness is not yet enforced by a partial unique index.** The applied unique on `(membershipId, endsAt)` does not prevent two memberships from holding the same seat. Occupancy checks remain application-level inside transactions.
2. **Some Server Actions still throw for expected failures.** New or touched actions should continue migrating to structured `{ success, error?, message? }` result objects.
3. **RenewalReminder table was removed in V2.** Reminder delivery still exists; dedupe/idempotency against the current path should be revalidated.
4. **Payment provider / online checkout is not integrated.** `Payment` supports methods and voids, but there is no payment-provider webhook layer yet.
5. **Multi-hall staff selection is implicit.** `requireScopedUser` currently uses the first active `StaffAssignment`; explicit hall switching is still future work.
6. **Secondary docs still contain MVP language** in places (`docs/STUDIVO.md`, older ADRs referencing `Subscription`). Treat `prisma/schema.prisma` + this file + ADR-018 as authoritative for V2.

## Data Preservation & Trust Features

Studivo now exposes preserved operational history as first-class product value instead of hidden backend rows:

- **Seat History Log:** the dashboard seat sheet receives `SeatAssignment` history for each physical seat, scoped to the authenticated `studyHallId`, and renders a Persian timeline of current and past occupants.
- **Member Archive:** `/dashboard/members` separates active members from archived members with no active membership. Member profiles retain membership/payment timelines and include a one-click “رزرو مجدد” path that pre-fills the reservation sheet from archived identity data.
- **Audit Logs:** `AuditLog` records staff/owner operations with typed `AuditAction` / `AuditEntity` values and rich metadata in the same transaction as the operational mutation. `/dashboard/logs` is owner-facing and shows the venue-scoped digital event notebook.

These flows reinforce history preservation: expired/cancelled memberships, closed seat assignments, and member identities remain available for trust, dispute resolution, revenue checks, and rapid reactivation.

## 8. Sales & Marketing Platform (Phase 1 Foundation)

Studivo is now two products sharing one codebase and one database:

1. **The Customer Product** — the operational study hall dashboard described in sections 1–7. It is multi-tenant and isolated by `studyhallId`. It serves the people who *run* a study hall.
2. **The Sales Platform** — the business side of Studivo. It serves the people who *sell* Studivo: a marketing website, demo requests, lead collection, and internal platform administration.

Phase 1 is intentionally **minimal**. Its only goal is to acquire and track the first paying customers. The guiding rule is **YAGNI** (see ADR-013): we build the smallest foundation that lets real sales happen, and we defer the CRM, sales pipeline, and analytics to later phases. Every model added now must answer "yes" to the question *"Is this required to acquire the first 50 paying customers?"* — so this phase introduces only `Lead` and `DemoRequest` plus a platform role.

### 8.1 The Phase 1 Business Flow

The funnel is intentionally short and linear:

```
Visitor
  ↓
Landing Website
  ↓
Request Demo
  ↓
Lead
  ↓
StudyHall  (after conversion)
```

```
 Visitor          Landing Website   Request Demo      Lead              StudyHall
 (anonymous)      (marketing site)  (form submit)     (sales record)    (tenant/venue)
 ──────────       ──────────        ──────────        ──────────        ──────────
 browses,         presents the      a DemoRequest +   a persisted row   the existing
 not stored       product & CTA     Lead are created  a salesperson     operational tenant,
                                                       works             created on conversion
```

**Visitor.** An anonymous person browsing the marketing website. A Visitor is **not** a database row — there is no reason to persist anonymous traffic to acquire the first customers. Lightweight web analytics can be layered in later without any schema change.

**Landing Website.** The public marketing surface (`app/(marketing)`) that explains Studivo and drives the single primary call to action: request a demo.

**Request Demo.** The conversion event. Submitting the demo form creates a `Lead` (the interested person) and a `DemoRequest` (the specific ask) in one step.

**Lead.** The one and only persisted sales entity. It holds the prospect's contact details, where they came from (`source`), and where they are in the funnel (`status`). A Lead is pre-sale and may never convert.

**StudyHall.** The existing operational tenant. When a Lead is won, the salesperson provisions a StudyHall and links the Lead to it via `Lead.convertedStudyHallId`. That single link is the entire bridge between the sales world and the tenant world.

### 8.2 Why Lead Is Separate From StudyHall

A Lead is an *intent to maybe buy*; a StudyHall is an *operational venue we are already running*. They have completely different lifecycles:

- Most Leads never convert — they end up `LOST`. A StudyHall, by definition, only exists after a successful sale.
- A StudyHall must keep operating regardless of any sales activity. Mixing pre-sale records into tenant-scoped operational tables would pollute every dashboard query and weaken tenant isolation.
- Sales data is **platform-level** and read only by platform users; StudyHall data is **tenant-level** and isolated by `studyhallId`.

So the two stay separate, joined only by the nullable `Lead.convertedStudyHallId`. No operational table gains a sales column, and the `Lead`/`DemoRequest` tables are never scoped by tenant `studyHallId`. Tenant isolation and hall RBAC are therefore kept separate from platform sales access.

### 8.3 SUPER_ADMIN and the Platform Role

The Sales Platform is operated by **platform users** who do not belong to any single study hall. This is modeled with a nullable `User.platformRole` enum (`SUPER_ADMIN`, `SALES`) that is *separate* from tenant hall roles on `StaffAssignment` (`OWNER` / `STAFF`):

- A normal venue operator has `platformRole = NULL` and one or more active `StaffAssignment`s.
- A platform user (e.g. `SUPER_ADMIN`) has a `platformRole` and typically **no** hall staff assignment, because they manage Studivo itself rather than a venue.

We deliberately did **not** overload hall roles with platform authority. `SUPER_ADMIN` exists outside tenant scope and manages the platform; `SALES` owns and works leads. Platform UI lives under `app/platform/` guarded by helpers that check `platformRole`, mirroring `requireScopedUser` for tenant work. See ADR-010.

### 8.4 Lead Lifecycle (Pipeline Designed, Not Built)

The Sales Pipeline is **not** implemented in Phase 1. However, so that it can be added later without a destructive migration, the `LeadStatus` enum already declares the full set of future stages:

```
NEW  →  CONTACTED  →  DEMO  →  TRIAL  →  CUSTOMER  →  LOST
```

In Phase 1 these are simply the values a `Lead.status` can hold; a salesperson updates the status by hand. There is no Kanban board, no automation, and no stage-transition history table yet — those are future work. A `convertedAt` timestamp and a free-text `lostReason` are the only supporting fields, kept because they cost nothing and make basic outcome reporting possible later.

### 8.5 What Is Intentionally NOT Built Yet

To stay honest about YAGNI, Phase 1 explicitly excludes:

- **Company** — there is no multi-branch account concept yet. A Lead converts directly to one StudyHall. If/when a single business needs several venues, a `Company` model can be introduced as an additive change.
- **Campaign / rich attribution** — `LeadSource` is a coarse enum; UTM/campaign tracking is deferred.
- **Interaction / activity timeline, Notes, Tasks, Opportunities** — no CRM activity log yet.
- **Referral** — no referral/reward program yet.
- **Analytics tables** — reporting will be built later on top of the existing rows; no analytics schema is added now.

Each of these can be added incrementally and additively. None is required to win the first customers, so none is built.

### 8.6 Schema Summary (Phase 1 sales additions + V2 alignment)

Sales enums: `PlatformRole`, `LeadStatus`, `LeadSource`, `DemoRequestStatus`.

Sales models: `Lead`, `DemoRequest`.

Operational Schema V2 (see §3 and ADR-018) replaced the MVP `Subscription` / flat-seat model. Platform users still use `User.platformRole`; tenant operators use `StaffAssignment`. The sales↔tenant bridge is `Lead.convertedStudyHallId`.

Migration: schema changes are applied through Prisma SQL migrations under `prisma/migrations/` (V2 init is already deployed). After setting `DATABASE_URL`, use `npx prisma migrate deploy` (or the project's documented migrate workflow) and `npx prisma generate`. Do not treat `db push` as the production source of truth.
