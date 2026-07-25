# AGENTS.md — Studivo Agent & Developer Rulebook

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 1. Product Identity Is Non-Negotiable

This repository is **Studivo**.

Studivo is **Study Hall Management Software** for سالن‌های مطالعه, private libraries, exam-prep study spaces, and seat-based co-working rooms. It is not a generic SaaS template, not a generic booking system, and not merely a dashboard starter.

Every product, code, UI, and documentation decision must support the core promise:

- eliminate double-booking and seat disputes;
- automate recurring membership and renewal tracking;
- give staff a real-time visual occupancy map;
- help owners maximize occupancy and revenue;
- replace memory, notebooks, spreadsheets, and scattered messages with one reliable system.

## 2. Mandatory Repository Orientation

Before changing code, inspect the real implementation. At minimum, review the relevant parts of:

- `prisma/schema.prisma` for data model and relational constraints (Schema V2);
- `app/actions/` domain modules (`seats/`, `memberships/`, `staff/`, `finance/`, `onboarding.ts`, `auth/`, …) for business mutations;
- `lib/auth.ts`, `lib/server.ts`, and `app/api/auth/[...all]/route.ts` for auth/session behavior;
- `app/dashboard` for the operational UI;
- `components/ui` before adding any visual primitive;
- `docs/` and the root documentation files before making architectural changes.

This project uses **Next.js 16**, and local `AGENTS.md` rules state that this is not necessarily the Next.js behavior you remember. When changing Next.js APIs, routing, caching, Server Actions, metadata, or build behavior, read the relevant guide in `node_modules/next/dist/docs/` first and follow current deprecations.

## 3. Critical Coding Guardrails

### Prefer Existing shadcn/ui Components

Always check `components/ui` before creating UI. Prefer composition of existing shadcn/Radix primitives:

- `Button`, `Input`, `Card`, `Sheet`, `Alert`, `AlertDialog`, `Popover`, `Calendar`, `Badge`, `Sidebar`, and related components;
- `ActionForm` for server-action forms that need inline/toast error handling;
- existing dashboard-specific components before introducing parallel patterns.

Do not reinvent components unless the existing primitives cannot support the use case.

### Use Server Actions for Backend Mutations

All business mutations must live server-side, preferably as Next.js Server Actions:

- reserve a seat;
- renew a membership;
- release or swap a seat (close/open `SeatAssignment` rows);
- record or void payments;
- manage staff assignments and shifts;
- update venue/profile settings;
- onboarding;
- future audit, SMS, attendance UI, and notification operations.

Client components may collect input and present feedback, but they must not bypass server-side validation, RBAC, or Prisma transaction rules.

### No Error Swallowing

Never swallow errors with only `console.error`.

Rules:

- Expected user/business failures must be returned to the UI in a standardized action state object that the frontend can explicitly render.
- If a catch block is needed, it must either rethrow, return a typed error state, or convert the error through an approved helper.
- Never hide failures that affect booking integrity, payments, auth, notifications, or staff permissions.
- Do not catch Next.js navigation errors such as redirects/notFound and convert them into generic UI errors.

Preferred future action shape:

```ts
type ActionState<T = unknown> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
```

Existing actions still throw in several places; when touching them, migrate toward standardized return objects without weakening current validation.

### Never Bypass RBAC or Tenant Scope

Every server mutation and protected read must enforce:

1. authenticated user;
2. completed onboarding / valid venue scope via an active `StaffAssignment` when operating on venue data;
3. correct hall role permission (`OWNER` / `STAFF`);
4. `studyHallId` scoping on every Prisma query that reads or mutates venue data.

Do not assume MVP fields `User.role` or `User.studyhallId` — they are gone in Schema V2.

UI hiding is not security. Client-side role checks are allowed only as progressive UX; server-side checks are mandatory.

### Preserve Database Integrity

- Use Prisma transactions for any multi-step mutation.
- Keep seat operations scoped by `studyHallId` (through section/seat or membership relations).
- Check target seat occupancy (open `SeatAssignment`) before reserve/swap.
- Preserve membership history when renewing; close/open `SeatAssignment` rows on swap/release.
- Do not delete operational history casually.
- Open-seat uniqueness is app-enforced today; prefer adding a DB partial unique for `endsAt IS NULL` on `seat_id`.
- When adding production-grade constraints, prefer database-enforced invariants over UI-only checks.

## 4. State Management & UI Guidance

Studivo is for busy operators who need clarity during front-desk work. UI must be:

- ultra-clean and minimal;
- calm, premium, and trustworthy;
- fast to scan from a distance;
- RTL-aware and Persian-friendly where current product copy is Persian;
- usable in both dark and light modes;
- optimized around one primary action per workflow;
- explicit about seat states: available, active, renewal-needed, expired, cancelled.

Avoid visual clutter. Use whitespace, clear hierarchy, concise labels, and meaningful status colors. Never bury critical operational warnings such as double-booking conflicts, expired memberships, or payment risk.

For local component state, React state and transitions are fine. Introduce global state only when it solves a real cross-route problem. Server data should remain server-owned and refreshed through revalidation or current Next.js data patterns.

## 5. Business Logic Standards

### Seat Booking

A correct reservation must:

- validate all input with Zod or an equivalent schema;
- confirm the seat belongs to the user's study hall (via section);
- reject occupied seats (open / occupying `SeatAssignment`);
- reject assigning the same member phone number to another active membership in the same study hall;
- upsert member identity consistently (`User` by phone);
- create `Membership` (+ `SeatAssignment` when fixed seat) (+ `Payment`) atomically;
- snapshot plan fields onto the membership at create time;
- revalidate affected dashboard views;
- return an explicit success/error state to the UI.

### Seat Swap

A correct swap must:

- validate destination seat;
- reject missing seats;
- reject occupied destination seats;
- ensure the source assignment/membership is active and belongs to the current study hall;
- reject swapping to the same seat;
- close the old `SeatAssignment` and open a new one inside a transaction (do not overwrite history away).

### Renewal

A correct renewal must:

- validate the new end date is in the future (unless an explicit adjustment path);
- preserve membership history for real renewals;
- keep seat assignment occupancy in sync for fixed-seat plans;
- avoid creating overlapping active contracts for the same seat;
- clearly communicate renewal result to the operator.

## 6. Authentication & Authorization Standards

Better Auth is the selected auth system. Do not replace it casually.

- Use `getSession`/server helpers for authenticated server reads.
- Keep Better Auth route integration intact.
- Keep staff creation and owner permissions server-side via `StaffAssignment`.
- If adding member self-service later, design it explicitly; do not assume membership `User` rows should automatically have full login access.

## 7. Documentation Debt Rule

Whenever a major architectural, product, or database change is made, update these files in the same pull request:

- `DESIGN.md` for architecture, flows, schemas, and folder changes;
- `DECISIONS.md` for important architectural/product decisions and their reasoning;
- `TASKS.md` for what moved from planned to in-progress or completed;
- `AGENTS.md` and `CLAUDE.md` if developer/agent rules change (single agent rulebook — do not reintroduce `AGENT.md`).

Documentation is part of the product. Do not leave future agents guessing.

## 8. Testing & Verification Expectations

For any meaningful code change, run the narrowest reliable checks first, then broader checks when practical:

- type checking/build checks when available;
- linting;
- tests for affected business logic once tests exist;
- manual dashboard smoke checks for seat workflows;
- screenshot verification for perceptible runnable UI changes.

If a check cannot run because of environment limitations, report it clearly and do not pretend it passed.

## 9. Current Strategic Priorities

1. Add DB-level open-seat collision prevention (partial unique on open `SeatAssignment` / equivalent).
2. Automated tests for reservation, renewal, release, and swap flows under Schema V2.
3. Normalize remaining RBAC helpers around `StaffAssignment` / `HallRole`.
4. Wire attendance check-in/out UI to the `Attendance` model.
5. Clean leftover MVP references (`Subscription`, `totalSeats`, `RenewalReminder`) in secondary docs and copy.
6. Revalidate renewal-reminder dedupe after `RenewalReminder` table removal.
