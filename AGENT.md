# AGENT.md — Studivo Agent & Developer Rulebook

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

- `prisma/schema.prisma` for data model and relational constraints;
- `app/actions/actions.ts` for business mutations;
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
- renew a subscription;
- release a seat;
- swap a seat;
- create staff;
- update venue/profile settings;
- onboarding;
- future payment, audit, SMS, and notification operations.

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
2. completed onboarding / valid `studyhallId` when operating on venue data;
3. correct role permission;
4. `studyhallId` scoping on every Prisma query that reads or mutates venue data.

UI hiding is not security. Client-side role checks are allowed only as progressive UX; server-side checks are mandatory.

### Preserve Database Integrity

- Use Prisma transactions for any multi-step mutation.
- Keep seat operations scoped by `studyhallId`.
- Check target seat occupancy before reserve/swap.
- Preserve subscription history when renewing.
- Do not delete operational history casually.
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

Avoid visual clutter. Use whitespace, clear hierarchy, concise labels, and meaningful status colors. Never bury critical operational warnings such as double-booking conflicts, expired subscriptions, or payment risk.

For local component state, React state and transitions are fine. Introduce global state only when it solves a real cross-route problem. Server data should remain server-owned and refreshed through revalidation or current Next.js data patterns.

## 5. Business Logic Standards

### Seat Booking

A correct reservation must:

- validate all input with Zod or an equivalent schema;
- confirm the seat belongs to the user's study hall;
- reject occupied active seats;
- reject assigning the same member phone number to another active seat in the same study hall;
- upsert member identity consistently;
- create the subscription atomically;
- revalidate affected dashboard views;
- return an explicit success/error state to the UI.

### Seat Swap

A correct swap must:

- validate destination seat number;
- reject missing seats;
- reject occupied destination seats;
- ensure the subscription is active and belongs to the current study hall;
- reject swapping to the same seat;
- update inside a transaction.

### Renewal

A correct renewal must:

- validate the new end date is in the future;
- preserve history;
- avoid creating overlapping active contracts for the same seat;
- clearly communicate renewal result to the operator.

## 6. Authentication & Authorization Standards

Better Auth is the selected auth system. Do not replace it casually.

- Use `getSession`/server helpers for authenticated server reads.
- Keep Better Auth route integration intact.
- Keep staff creation and owner/admin permissions server-side.
- If adding member self-service later, design it explicitly; do not assume internal `member` records should automatically have full login access.

## 7. Documentation Debt Rule

Whenever a major architectural, product, or database change is made, update these files in the same pull request:

- `DESIGN.md` for architecture, flows, schemas, and folder changes;
- `DECISIONS.md` for important architectural/product decisions and their reasoning;
- `TASKS.md` for what moved from planned to in-progress or completed;
- `AGENT.md` and `CLAUDE.md` if developer/agent rules change.

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

1. Harden reservation actions with standardized action-state returns.
2. Move production persistence to PostgreSQL.
3. Add DB-level active-seat collision prevention.
4. Add owner-configurable renewal notification preferences.
5. Add audit logs for staff/admin activity.
6. Add automated tests for reservation, renewal, release, and swap flows.
