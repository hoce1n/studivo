# DECISIONS.md — Studivo Architectural Decision Log

This file records architectural and product decisions whose reasoning is not fully obvious from code alone. Update it whenever the project makes a meaningful architecture, database, security, product-platform, or operational decision.

## ADR-001: Position Studivo as Study Hall Management Software

**Status:** Accepted

**Decision:** Studivo is explicitly positioned as Study Hall Management Software, not a generic SaaS starter, generic booking tool, or dashboard template.

**Reasoning:** The product's strongest value comes from domain-specific operations: physical seat inventory, recurring memberships, renewal tracking, front-desk workflows, staff roles, and visual occupancy. Generic positioning would dilute the promise and lead to unfocused features.

**Consequences:**

- Documentation and UI copy must speak to study hall owners, private libraries, exam-prep spaces, and seat-based operators.
- Features should be judged by whether they reduce human error, protect revenue, or improve daily venue operations.
- Generic SaaS features should not displace core seat-management reliability.

## ADR-002: Better Auth Instead of Clerk

**Status:** Accepted

**Decision:** Use Better Auth with the Prisma adapter instead of Clerk or another hosted auth provider.

**Reasoning:** Studivo targets local businesses and smaller operators. A self-hosted auth layer provides drastically lower long-term cost, more control over session behavior and user records, and a clean developer experience inside Next.js 16. It also fits the product's need to store owner, staff, and internal member records in the same relational domain.

**Consequences:**

- The app owns auth persistence through Prisma tables.
- The team must manage auth security, deployment configuration, secrets, and operational hardening.
- Role and venue scoping can be modeled directly on the local `User` table.
- Future auth changes must preserve the low-cost/self-hosted operating model unless there is a strong business reason not to.

## ADR-003: Prisma ORM for Relational Domain Modeling

**Status:** Accepted

**Decision:** Use Prisma ORM for database access and schema definition.

**Reasoning:** Studivo's core domain is relational: venues have seats, users belong to venues, subscriptions link members to seats over time, and auth tables must remain consistent. Prisma provides type-safe database queries, generated client types, migrations, and structural enforcement for these relationships.

**Consequences:**

- Data model changes should start in `prisma/schema.prisma`.
- Business actions should use Prisma transactions for multi-step workflows.
- Schema constraints should be preferred over ad-hoc UI assumptions.
- The generated Prisma client lives under `lib/generated/prisma` per the current generator configuration.

## ADR-004: PostgreSQL as the Platform Database

**Status:** Accepted

**Decision:** Studivo uses PostgreSQL as the official application database through Prisma.

**Reasoning:** Studivo's core promise depends on concurrent seat booking integrity. Real multi-staff venues need strong transaction behavior, isolation, row-level locking capabilities, operational backups, and database-level constraints such as partial unique indexes.

**Consequences:**

- Development and production should target PostgreSQL-compatible behavior.
- Seat booking, renewal, release, and swap flows remain wrapped in Prisma transactions.
- Active-seat uniqueness should be hardened with PostgreSQL-native constraints where possible.

## ADR-005: PWA + Push Notifications Before Native Apps

**Status:** Accepted

**Decision:** Invest in PWA installation and push-notification support before building native mobile apps.

**Reasoning:** Study hall owners, staff, and students need low-friction access. A PWA can be installed directly on phones, bypass app-store friction, and deliver operational notifications such as subscription renewal alerts, payment reminders, and staff follow-ups. This replaces the immediate need for native mobile apps while preserving a mobile-friendly experience.

**Consequences:**

- The app includes a manifest, service-worker registration, and push-notification scaffolding.
- Push subscriptions are persisted in PostgreSQL and scoped by `userId` and `studyhallId`.
- A daily cron route (`/api/cron/renewal-reminders`) sends renewal/expiry reminders to admin/staff devices with active push subscriptions.
- Notification UX must remain permission-aware and respectful; owners should eventually control reminder behavior in settings.

## ADR-006: Server Actions as the Mutation Boundary

**Status:** Accepted

**Decision:** Use Next.js Server Actions as the primary mutation boundary for domain operations.

**Reasoning:** Seat booking, renewals, releases, staff creation, and settings changes require server-side validation, session checks, RBAC, and database transactions. Server Actions fit the App Router architecture and keep mutation logic close to the UI without exposing unsafe client-side database access.

**Consequences:**

- Client components submit forms or invoke action handlers; they do not perform domain mutations directly.
- Server Actions must enforce `studyhallId` scope and role checks.
- Future work should standardize action return states instead of throwing for expected validation/business errors.

## ADR-007: Preserve Subscription History

**Status:** Accepted

**Decision:** Renewals should preserve historical subscription records rather than overwrite every field on the existing row.

**Reasoning:** Owners need history for disputes, revenue analysis, payment reconciliation, and member service. Preserving old subscription periods makes it possible to answer what happened previously, not only what is active right now.

**Consequences:**

- Renewals expire the current active row and create a fresh active subscription.
- Reporting can later calculate retention, renewal rates, and revenue history.
- Future payment models should link invoices/payments to subscription periods.


## ADR-008: Migration from SQLite to PostgreSQL

**Status:** Accepted

**Decision:** Complete the platform migration from SQLite-style local persistence to PostgreSQL-backed persistence.

**Context/Rationale:** Studivo manages real physical seats during high-pressure operational windows such as exam seasons and peak registration days. PostgreSQL is required for strict transactions, reduced lock contention under concurrent staff usage, and robust row-level locking patterns that support double-booking prevention when multiple operators attempt seat reservations, renewals, or swaps at the same time.

**Consequences:**

- Prisma datasource configuration now targets PostgreSQL.
- Better Auth uses the PostgreSQL Prisma adapter provider.
- Server-side concurrency logic is backed by PostgreSQL isolation and locking instead of file-level database locking.
- Future schema hardening should add a partial unique index or equivalent invariant for active seat occupancy.

## Server action module organization

- Server actions are organized by domain under `app/actions/`: authentication and venue setup in `auth.ts`, seat operations in `seat.ts`, subscription renewals in `subscription.ts`, audit/action-result helpers in `audit.ts`, and PWA notification actions in `pwa.ts`.
- `app/actions/index.ts` is the main barrel export so dashboard components import from one stable entry point while each mutation stays small, scoped, and easier to audit for RBAC, tenant checks, transactions, and revalidation.
- `renewSubscription` uses smart renewal semantics: changes more than seven days from the current end date preserve history by expiring the old row and creating a new active subscription; changes of seven days or less are treated as date corrections on the current active subscription.

## ADR-009: Studivo Includes an Internal Sales Platform

**Status:** Accepted

**Decision:** Extend Studivo from a single customer-facing product into two products in one codebase: the operational study hall dashboard (tenant-facing) and an internal Sales Platform (business-facing). In Phase 1 the Sales Platform covers only a marketing website, demo requests, lead collection, and internal platform administration. A full CRM, sales pipeline, and analytics are explicitly out of scope for now.

**Reasoning:** The customer product is production-ready, but the business that sells Studivo has no system of its own. Marketing leads were captured only as a console log (`app/actions/marketing.ts`), demo requests lived nowhere, and there was no record of who was interested or what stage they were at. To validate the business with real customers we need the smallest possible system: a way to capture a lead from the marketing site and track it until it converts into a StudyHall. Building this inside the same repository lets it reuse the existing stack (Next.js 16, Prisma, PostgreSQL, Better Auth).

**Consequences:**

- A new platform-level domain exists beside the tenant domain, consisting of just `Lead` and `DemoRequest`.
- The existing `submitLead` marketing action becomes the entry point that persists a real `Lead` instead of logging to the console.
- Phase 1 delivers only the minimum foundation (two models, a platform role, docs). The CRM, sales pipeline, and analytics are deferred to later phases (see ADR-012, ADR-013).

## ADR-010: SUPER_ADMIN Lives Outside Tenant Scope via a Separate `platformRole`

**Status:** Accepted

**Decision:** Introduce a new nullable `User.platformRole` enum (`SUPER_ADMIN`, `SALES`) that is orthogonal to the existing tenant `role` string (`admin`/`staff`/`member`). Platform users have a `platformRole` and typically no `studyhallId`; venue users have `platformRole = NULL`. The existing tenant `role` field and its RBAC are left completely unchanged.

**Reasoning:** A platform operator (especially `SUPER_ADMIN`) manages Studivo itself — leads and demo requests today, more later — and must not belong to any single study hall. Overloading the existing `role` string with a `"super_admin"` value was rejected because `role` is compared as a raw string in many places (`role === "admin"`, `role: { in: ["admin","staff"] }`, member upserts), and adding values there risks silently widening or breaking tenant authorization. A separate, additive, nullable enum models "platform authority" as a distinct dimension without touching tenant RBAC.

**Consequences:**

- `platformRole` is `NULL` for all existing users, so no current behavior changes and the customer dashboard keeps working untouched.
- Tenant isolation and RBAC are fully preserved: sales data is gated by `platformRole`, never by `studyhallId`.
- Platform routes will later be guarded by a `requirePlatformUser` / `requireSuperAdmin` helper that checks `platformRole`, mirroring the existing `requireScopedUser` pattern.
- Only two platform roles exist now; more can be added to the enum later if a real need appears (YAGNI — ADR-013).

## ADR-011: Lead Is Separate From StudyHall

**Status:** Accepted

**Decision:** Model the pre-sale prospect as a `Lead` and keep it entirely separate from the post-sale operational `StudyHall`. The two are joined only by a single nullable, unique `Lead.studyhallId` set at conversion. `Lead` and `DemoRequest` are platform-level and are never scoped by `studyhallId`.

**Reasoning:** A Lead is an *intent to maybe buy* and most leads never convert (they end `LOST`); a StudyHall is a *running venue* that must keep operating no matter what produced it. Collapsing the two would force pre-sale noise into tenant-scoped operational tables, bloat every dashboard query, and weaken tenant isolation. Keeping `Lead` outside `studyhallId` means a venue's `admin`/`staff` can never see sales data, and deleting/converting a lead can never touch live operational data. The conversion link lives on `Lead` (not as a new column on `StudyHall`) so the StudyHall table is unchanged for every existing tenant.

**Consequences:**

- The funnel Visitor → Landing → Request Demo → Lead → StudyHall is enforced by a foreign key (`Lead.studyhallId`), not by convention.
- A won lead points to exactly one StudyHall (`@unique`); StudyHall keeps a single optional `lead` back-relation and gains no new columns.
- No `Company` entity is introduced: in Phase 1 a lead converts directly to one StudyHall (see ADR-012).

## ADR-012: No CRM Entities Yet — Lead Converts Directly to StudyHall

**Status:** Accepted

**Decision:** Phase 1 introduces only `Lead` and `DemoRequest`. It deliberately does **not** introduce `Company`, `Campaign`, `Referral`, `Interaction`, sales notes, timelines, tasks, opportunities, activities, or any other CRM entity. A `Lead` converts directly to a `StudyHall`.

**Reasoning:** None of those entities is required to acquire the first paying customers, which is the only goal of this phase. Each one adds schema surface, query complexity, and UI we would have to maintain before we have learned anything from real sales. In particular, a `Company` (multi-branch account) is unnecessary while a customer is a single venue; an `Interaction`/timeline is unnecessary while a salesperson can track status by hand; `Campaign`/rich attribution is unnecessary while `LeadSource` gives coarse origin. Every one of these can be added later as a purely additive change (new tables / new nullable columns) without refactoring `Lead` or `StudyHall`.

**Consequences:**

- The schema stays tiny and easy to reason about, with a single sales-to-tenant bridge.
- If a single business later needs several venues, a `Company` model can be added and `Lead`/`StudyHall` pointed at it without data loss.
- Reporting/analytics will be built later directly on top of existing rows; no analytics tables exist now.

## ADR-013: YAGNI Is the Architectural Principle for This Phase

**Status:** Accepted

**Decision:** Adopt YAGNI ("You Aren't Gonna Need It") as the explicit governing principle for the Sales Platform foundation. Before any model, field, or abstraction is added, it must answer **yes** to: *"Is this required to acquire the first 50 paying customers?"* If the answer is no, it is not built. The only forward-looking concession is the `LeadStatus` enum, which declares the full future funnel (`NEW → CONTACTED → DEMO → TRIAL → CUSTOMER → LOST`) so the pipeline can be built later without a destructive migration — but no pipeline logic, board, or stage-history table is built now.

**Reasoning:** Premature abstraction is the most expensive kind of complexity: it is hard to remove, constrains future learning, and slows the very validation it claims to enable. The fastest path to a validated business is the smallest system that lets real sales happen, then iterate based on what real usage teaches us. Declaring the `LeadStatus` values up front is cheap (an enum is just allowed strings) and avoids an awkward migration on a populated table, so it is the one place we look ahead. Everything else is deferred.

**Consequences:**

- Phase 1 ships only `PlatformRole`, `Lead`, `DemoRequest`, `LeadStatus`, and `LeadSource`.
- `LeadStatus` already holds future stages; a salesperson updates `Lead.status` by hand, with no pipeline UI or automation.
- Future capabilities (CRM, pipeline board, analytics, campaigns, referrals) are designed to arrive as additive, backward-compatible changes.
- All schema changes in this phase are non-destructive: new tables, new nullable columns, and one optional relation.

## ADR-014: Seat Management with Payment Status

**Status:** Accepted

**Decision:** Implement a `paymentStatus` field on the `Subscription` model (`paid` | `unpaid`) and expose it in the seat management UI.

**Reasoning:** Operators need to track whether a member has paid for their current subscription period directly from the seat map. This reduces the need for separate spreadsheets or memory-based tracking and provides immediate visual feedback on the venue's revenue health.

**Consequences:**

- `Subscription` model updated with `paymentStatus`.
- `updatePaymentStatus` server action added for transactional updates and audit logging.
- Visual indicators (amber/green dots/badges) added to seat cards and member lists.
- Dashboard stats now reflect revenue "at risk" based on unpaid subscriptions.

## ADR-015: Cron Job Security and Payment Status Reset

**Status:** Accepted

**Decision:** Secure the `/api/cron/renewal-reminders` route with a `CRON_SECRET` and implement automatic `paymentStatus` reset for expired subscriptions.

**Reasoning:** The cron route must be protected from unauthorized triggers to prevent spamming notifications and unnecessary DB load. Automatically resetting `paymentStatus` to `unpaid` when a subscription expires ensures that operators are prompted to collect payment for the new period.

**Consequences:**

- `CRON_SECRET` environment variable required for all cron requests.
- `sendRenewalReminders` logic enhanced to update `paymentStatus` for expired rows.
- `docs/CRON_SETUP.md` provides clear instructions for VPS deployment.

## ADR-016: Public Landing Page Design Conversion

**Status:** Accepted

**Decision:** Convert the high-fidelity HTML design for the public Study Hall landing page into a production-ready Next.js implementation at `app/[slug]/page.tsx`.

**Reasoning:** We needed a high-conversion, professional public face for individual study halls that uses real venue data while maintaining a premium academic feel.

**Consequences:**

- Server Component fetching real `StudyHall` data by slug.
- Dedicated `VenueDemoForm` and `PublicSeatMap` components for public use.
- Reused `submitLead` action for public visit/demo requests.
- Dynamic metadata and Open Graph tags for better SEO.

## ADR-017: Financial Reporting Foundation

### Context
To provide study hall managers with better insights into their revenue and payment status, financial reporting features are needed. This includes tracking revenue, overdue payments, and occupancy-related revenue statistics.

### Decision
1.  **Minimal Schema Extensions**: Instead of a full `Invoice` model, we've added `monthlyFeeAtSubscription` (Float) and `paymentDate` (DateTime) as nullable fields to the existing `Subscription` model. This keeps the schema lean (YAGNI) while providing enough data for initial financial reports.
2.  **New Server Actions**: Created `fetchRevenueReport(dateRange)`, `fetchOverduePayments()`, and `fetchOccupancyRevenueStats()` to encapsulate financial logic, ensuring proper RBAC and tenant scoping.
3.  **Prioritization**: `fetchOverduePayments()` is prioritized first. This directly addresses a critical operational need for hall managers: identifying and following up on unpaid subscriptions to recover lost revenue. `fetchOccupancyRevenueStats()` provides valuable insights into potential vs. actual revenue, and `fetchRevenueReport()` offers a broader view of financial performance.
4.  **RBAC and Scoping**: All new server actions are scoped by `studyhallId` using `requireScopedUser()`, ensuring that managers can only access data for their own study halls.
5.  **Optimized Prisma Queries**: Queries are designed to be efficient, leveraging Prisma's `findMany` and `count` methods with appropriate `where` clauses and `select` statements to fetch only necessary data.

### Consequences
-   Hall managers gain immediate visibility into their financial health.
-   The minimal schema extensions reduce complexity and allow for future expansion without major refactoring.
-   The new server actions provide a clear API for financial data, facilitating UI development.
-   The prioritization ensures that the most impactful financial feature is delivered first.

## ADR-007: Clean Self-Hosted Deploys and Stale Chunk Recovery

**Status:** Accepted

**Decision:** Treat Next.js build output as an atomic production artifact for VPS deployments and add client-side recovery for stale chunks.

**Reasoning:** Next.js production builds emit content-hashed JavaScript chunks. Open browser tabs, service-worker runtime caches, or reverse-proxy caches can request files from the previous build after PM2 starts serving the new build, causing route-specific client components to fail with `ChunkLoadError`.

**Consequences:**

- Production deploys should stop PM2 before deleting `.next` and running `pnpm build`, then start the process after a clean build.
- The service worker must not cache `/_next/` assets, navigation requests, HTML, RSC payloads, or App Router data responses.
- The root layout mounts a one-shot chunk-load recovery component to refresh stale open tabs after deployment.
- Nginx may cache immutable `/_next/static/*` assets, but must not cache HTML/RSC responses without a deliberate App Router cache strategy.
