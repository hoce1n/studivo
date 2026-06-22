# DESIGN.md — Studivo Technical Architecture

## 1. System Overview

**Studivo** is Study Hall Management Software for physical seat-based venues: study halls, private libraries, exam-prep boarding/study spaces, and small co-working rooms where a fixed inventory of seats is sold through recurring memberships.

The product is intentionally not a generic SaaS dashboard. Its core domain is the daily operational loop of a study hall:

1. An owner creates a venue and its seat inventory.
2. Staff view a live visual map of all seats.
3. A member is assigned to one seat for a subscription period.
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
- **PWA:** Web app manifest, service-worker registration, push-notification helper actions, and a demo in-memory push subscription.

PostgreSQL now backs Studivo's server-side concurrency model. Seat reservation, renewal, release, and swap flows still use explicit Prisma transactions, and those transactions are now backed by PostgreSQL isolation and locking behavior instead of file-level database locking. This is critical for peak-season front-desk activity where multiple staff members may attempt high-value seat operations at the same time.

## 3. Database & Entity Relationships

The authoritative domain model is `prisma/schema.prisma`.

### StudyHall

`StudyHall` represents one managed venue/branch. It stores the venue name, total seat count, monthly fee, hall type/gender policy, address, and timestamps.

Relationships:

- One `StudyHall` has many `User` records.
- One `StudyHall` has many `Seat` records.
- One `StudyHall` has many `Subscription` records.

Important integrity behavior:

- Cascading deletes are configured from users, seats, and subscriptions back to the owning study hall. Deleting a venue deletes its scoped operational data.
- The app scopes all dashboard and mutation queries by `studyhallId` so staff cannot mutate another venue's records.

### User

`User` is shared by authenticated owners/staff and internal member records.

Important fields:

- `role`: currently a string with values used by the app such as `admin`, `staff`, and `member`.
- `studyhallId`: optional until onboarding is complete; required for scoped dashboard work.
- `phoneNumber`: optional for authenticated staff/owners, required by reservation flows for members.

Relationships:

- One `User` can have many auth `Session` and `Account` records.
- One `User` can have many `Subscription` records, preserving member history over time.
- A user may belong to one `StudyHall`.

Integrity constraints:

- `email` is globally unique.
- `(studyhallId, phoneNumber)` is unique, preventing duplicate member phone records inside the same venue while still allowing the same phone number to exist in another venue.
- `studyhallId` is indexed for fast scoped queries.

### Seat

`Seat` is a physical seat/desk inside one study hall.

Relationships:

- One `Seat` belongs to one `StudyHall`.
- One `Seat` can have many historical `Subscription` records.

Integrity constraints:

- `(studyhallId, seatNumber)` is unique, ensuring seat number 12 can exist in multiple venues but cannot be duplicated inside the same venue.
- Deleting a `StudyHall` cascades to its seats.

### Subscription / Reservation

The codebase currently names the recurring seat contract `Subscription`. Product language may call this a reservation, membership, or seat subscription depending on UI context.

Important fields:

- `userId`: member assigned to the seat.
- `seatId`: physical seat assigned to the member.
- `studyhallId`: denormalized venue scope for security and query performance.
- `startDate` / `endDate`: subscription period.
- `paymentStatus`: currently `paid` / `unpaid` by convention, defaulting to `unpaid`.
- `status`: currently `active`, `expired`, or `cancelled` by convention.

Relationships:

- A subscription belongs to one `User`, one `Seat`, and one `StudyHall`.
- Historical subscriptions are preserved by creating new rows on renewal rather than overwriting every old contract.

Integrity notes:

- There is currently no database-level partial unique index that prevents more than one `active` subscription per seat. Double-booking prevention is implemented in transactional server actions.
- PostgreSQL transaction isolation and locking now provide the database foundation for safe active-seat occupancy checks. A future partial unique index can further harden the invariant at schema level.

### Auth Tables

`Session`, `Account`, and `Verification` are Better Auth persistence tables. They are mapped to lowercase table names and maintain tokens, provider accounts, password credentials, and verification flows.

## 4. Core Business Logic Flows

Primary business logic lives in `app/actions/actions.ts` as Next.js Server Actions. These actions are the authoritative mutation layer and must remain server-side.

### Onboarding Flow

1. A signed-in user without `studyhallId` is redirected to `/onboarding`.
2. `completeOnboarding` validates venue name, hall type, address, total seats, and monthly fee with Zod.
3. Inside a Prisma transaction:
   - Create the `StudyHall`.
   - Promote the current user to `admin`.
   - Attach that user to the new `studyhallId`.
   - Create one `Seat` row per seat number.
4. Revalidate `/dashboard` and redirect the owner into the dashboard.

This transaction ensures the venue, owner role, and generated seat inventory are created atomically.

### Booking / Reserving a Seat

`reserveSeat` is the current reservation action.

Flow:

1. Require an authenticated, scoped user via `requireScopedUser`.
2. Validate `seatNumber`, `memberName`, `phoneNumber`, and `endDate`.
3. Reject an end date that is not in the future.
4. Open a Prisma transaction.
5. Find the requested seat by `(studyhallId, seatNumber)`.
6. Reject if the seat does not belong to the current venue.
7. Search for an existing active subscription on that seat.
8. Reject if the seat already has an active subscription.
9. Search for an active subscription belonging to the same phone number in the same study hall.
10. Reject if the member already has another active subscription in that venue.
11. Upsert the member user by `(studyhallId, phoneNumber)`:
    - Update existing internal member name/role if found.
    - Create a member with a deterministic local Studivo email if not found.
12. Create the active subscription for that member and seat.
13. Revalidate `/dashboard`.

This protects the core promise: a staff member cannot intentionally reserve a seat that the app already knows is active.

### Double-Booking Prevention

The current implementation prevents common double-booking scenarios through application-level transaction checks:

- Every lookup is scoped by `studyhallId`.
- A transaction checks the target seat for an existing `active` subscription before creating a new one.
- A transaction checks the member phone number for another active subscription before assigning a new seat.
- Seat numbers are unique per study hall.
- Member phone numbers are unique per study hall.

Production hardening recommendation:

- Keep all seat mutations inside Prisma transactions so PostgreSQL can enforce isolation and locking around concurrent reads/writes.
- Add a database-level invariant for active seat occupancy, such as a PostgreSQL partial unique index on `(studyhallId, seatId)` where `status = 'active'`.
- Use explicit row-level locking patterns if future high-concurrency booking queues require stricter serialization.

### Dynamic Seat Changes / Swapping Seats

`swapSeat` handles moving an active member from one seat to another.

Flow:

1. Require a scoped authenticated user.
2. Validate the active subscription id and destination seat number.
3. Open a Prisma transaction.
4. Find the destination seat scoped to the current study hall.
5. Reject if the destination seat does not exist.
6. Check whether the destination seat already has an active subscription.
7. Reject if the target is occupied.
8. Find the current active subscription scoped to the current study hall.
9. Reject if the subscription is missing, inactive, or already on the target seat.
10. Update the subscription's `seatId` to the target seat.
11. Revalidate `/dashboard`.

The subscription history remains attached to the same subscription row for a move. Renewals, by contrast, preserve history by expiring the old row and creating a fresh row.

### Renewing a Subscription

`renewSubscription` validates a future end date and runs a transaction that:

1. Finds the current active subscription by id and current `studyhallId`.
2. Marks the existing row as `expired` to preserve history.
3. Creates a new active subscription for the same member and seat.
4. Revalidates `/dashboard`.

### Releasing a Seat

`releaseSeat` updates the active subscription status to `cancelled` using `updateMany` scoped by `subscriptionId`, `studyhallId`, and `status = active`, then revalidates the dashboard.

## 5. Authentication & Authorization

### Better Auth Integration

Better Auth is configured in `lib/auth.ts` with:

- Prisma adapter.
- PostgreSQL provider.
- Email/password authentication enabled.

The route handler at `app/api/auth/[...all]/route.ts` exposes the Better Auth API. Server-side code reads sessions through `getSession` in `lib/server.ts`, which passes Next.js request headers to Better Auth.

### RBAC Model

Roles are currently string values on `User.role`:

- `admin`: owner/operator with venue settings and staff-management privileges.
- `staff`: front-desk operator who can access the venue dashboard and perform operational seat work.
- `member`: internal record for students/readers; not currently a full self-service app user.

Current enforcement patterns:

- `requireUser` redirects unauthenticated users to `/login`.
- `requireScopedUser` redirects authenticated users without a study hall to `/onboarding`.
- Admin-only operations explicitly check `user.role === "admin"` before updating study hall settings or creating staff.
- Dashboard queries and mutations are scoped to `user.studyhallId`.

Future hardening:

- Replace role strings with a Prisma enum.
- Centralize permission helpers, e.g. `canManageStaff`, `canReserveSeat`, `canEditVenueSettings`.
- Return standardized action states instead of throwing generic errors for normal validation failures.
- Add audit logs for staff/admin mutations.

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
- `app/dashboard/settings`: admin-only hall settings for name, type, address, capacity, and monthly fee.
- `app/actions`: server actions for core business mutations and PWA actions.
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

1. **Active-seat uniqueness is not yet enforced by a partial unique index.** PostgreSQL transactions reduce risk, but a database-level active-seat invariant should still be added.
2. **Some Server Actions still throw for expected failures.** New or touched actions should continue migrating to structured `{ success, error?, message? }` result objects.
3. **Push subscriptions are in-memory.** They disappear on restart and are not user- or venue-scoped.
4. **Payment status is modeled but not integrated.** `paymentStatus` exists without invoices, receipts, or payment-provider webhooks.
5. **Role values are strings.** A Prisma enum and permission helpers would reduce accidental authorization drift.
