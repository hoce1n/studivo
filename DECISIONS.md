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

**Decision:** Extend Studivo from a single customer-facing product into two products in one codebase: the operational study hall dashboard (tenant-facing) and an internal Sales Platform (business-facing) covering marketing, lead collection, an internal CRM, and a future sales pipeline and analytics.

**Reasoning:** The customer product is production-ready, but the business that sells Studivo has no system of its own. Marketing leads were captured only as a console log (`app/actions/marketing.ts`), demos and follow-ups lived nowhere, and there was no way to see the funnel from visitor to paying customer. Running the sales side from spreadsheets and memory is exactly the problem Studivo sells *against*; the company should run on its own discipline. Building the Sales Platform inside the same repository lets it reuse the existing stack (Next.js 16, Prisma, PostgreSQL, Better Auth) and join sales data to real operational/revenue data when analytics arrive.

**Consequences:**

- A new platform-level domain exists beside the tenant domain: `Lead`, `Company`, `DemoRequest`, `Interaction`, `Campaign`, `Referral`.
- The existing `submitLead` marketing action becomes the entry point that persists a real `Lead` instead of logging to the console.
- Marketing is treated as part of the product, not a detached brochure (see ADR-015).
- Phase 1 delivers only the foundation (schema, role, docs). Analytics and full CRM/pipeline UI are explicitly deferred to avoid premature implementation.

## ADR-010: Sales Data Is Platform-Scoped, Not Tenant-Scoped

**Status:** Accepted

**Decision:** Sales Platform models are never scoped by `studyhallId`. They are platform-level and read only by platform users. The only structural bridge to the tenant world is a single nullable `StudyHall.companyId` relation with `onDelete: SetNull`.

**Reasoning:** Tenant isolation is a core security guarantee: a venue's `admin`/`staff` must only ever see their own `studyhallId` data. Sales data (leads, deals, other businesses) belongs to none of them and to *all* venues at once, so forcing it into the tenant scope would either break isolation or require awkward NULL-scoped rows. Keeping sales models entirely outside `studyhallId` preserves the existing RBAC and tenant model untouched, while `SetNull` guarantees that deleting a CRM record can never cascade into and destroy live operational venue data.

**Consequences:**

- No operational table gains a sales column; no sales table gains a `studyhallId`.
- Existing tenant queries, RBAC checks, and cascade behavior are unchanged.
- Access to sales models is gated by `platformRole` (ADR-011), not by `studyhallId`.
- A Company can link to many StudyHalls without those StudyHalls leaking into each other.

## ADR-011: SUPER_ADMIN Lives Outside Tenant Scope via a Separate `platformRole`

**Status:** Accepted

**Decision:** Introduce a new nullable `User.platformRole` enum (`SUPER_ADMIN`, `SALES`, `SUPPORT`) that is orthogonal to the existing tenant `role` string (`admin`/`staff`/`member`). Platform users have a `platformRole` and typically no `studyhallId`; venue users have `platformRole = NULL`.

**Reasoning:** A platform operator (especially `SUPER_ADMIN`) manages Studivo itself — leads, companies, demos, customers, analytics — and must not belong to any single study hall. Overloading the existing `role` string with a `"super_admin"` value was rejected because `role` is compared as a raw string in many places (`role === "admin"`, `role: { in: ["admin","staff"] }`, member upserts), and adding values there risks silently widening or breaking tenant authorization. A separate, additive enum dimension models "platform authority" cleanly without touching tenant RBAC, and leaves room for more platform roles (sales, support) later.

**Consequences:**

- `platformRole` is `NULL` for all existing users, so no current behavior changes.
- Tenant `role` stays a string for now (an eventual enum migration remains a separate, deliberate decision).
- Platform routes will be guarded by a new `requirePlatformUser` / `requireSuperAdmin` helper that checks `platformRole`, mirroring `requireScopedUser`.
- `SUPER_ADMIN` will eventually have cross-platform read access to Leads, Companies, Demo Requests, Customers, and analytics.

## ADR-012: Lead and StudyHall Are Different Concepts; "Customer" Is a Company State

**Status:** Accepted

**Decision:** Model the sales funnel as distinct entities — `Lead` (pre-sale interest), `Company` (CRM account/organization), and `StudyHall` (post-sale operational tenant) — and represent a "Customer" as a `Company` whose `status = ACTIVE` with at least one linked StudyHall, rather than as a separate Customer table.

**Reasoning:** A Lead is an *intent to maybe buy* and most leads never convert; a StudyHall is a *running venue* that must keep operating no matter what produced it. Collapsing the two would force pre-sale noise into tenant-scoped operational tables. A Company sits between them because one organization can run several branches (one Company → many StudyHalls) and can generate several leads over time. Making "Customer" a separate table would duplicate the same organization in two places and create two sources of truth to keep in sync; modeling it as a Company lifecycle state avoids that duplication entirely.

**Consequences:**

- `Lead.companyId` links a qualified lead to its CRM account; `StudyHall.companyId` links an operational venue to the same account.
- Customer reporting is "companies in ACTIVE status with linked study halls," computed, not stored.
- `DemoRequest`, `Interaction`, and `Referral` attach to Lead and/or Company, never to StudyHall.
- The relationship chain Visitor → Lead → Company → StudyHall → Customer is enforced by foreign keys, not by convention.

## ADR-013: Pre-Model the Full Sales Pipeline Without Building It

**Status:** Accepted

**Decision:** Encode the entire sales pipeline as a `LeadStage` enum (`NEW → CONTACTED → DEMO → TRIAL → CUSTOMER → LOST`) and supporting fields (`convertedAt`, `lostReason`) and tables (`DemoRequest`, `Interaction`) now, even though the pipeline UI is not implemented in Phase 1.

**Reasoning:** Pipeline stages are a structural property of the business, not a feature detail. Defining them up front means the eventual pipeline is additive UI work over an existing model rather than a destructive schema migration on a table that already holds production leads. Recording stage transitions as `Interaction` rows reuses the history-preservation philosophy established for subscriptions in ADR-007.

**Consequences:**

- Leads can be created and staged immediately; the Kanban/pipeline view is layered on later with no migration.
- Stage history will be auditable via the Interaction timeline.
- `convertedAt`/`lostReason` make conversion-rate and win/loss analytics computable when analytics is built.

## ADR-014: `Source` as an Enum, `Campaign` as a Table

**Status:** Accepted

**Decision:** Model acquisition channel category as the `LeadSource` enum (`DIRECT`, `ORGANIC_SEARCH`, `PAID_SEARCH`, `SOCIAL`, `REFERRAL`, `MARKETING_SITE`, `OTHER`) and model specific named initiatives as the `Campaign` table with UTM metadata.

**Reasoning:** Channel categories are a small, stable, query-hot set ideal for an enum: fast to filter/group and self-documenting, with no join. Campaigns are unbounded and dynamic (each launch, ad set, or seasonal push is a new row with its own UTM tags and active window). Splitting the two avoids both an over-normalized lookup table for a handful of fixed channels and an under-powered enum that cannot hold per-campaign metadata. This directly answers the "avoid duplicate data / think about scalability" requirement.

**Consequences:**

- `Lead.source` (enum) gives instant channel segmentation; `Lead.campaignId` (nullable FK) gives campaign attribution when one applies.
- Adding a new campaign is a data insert, not a schema change.
- Adding a genuinely new *channel category* is a rare, deliberate enum migration.

## ADR-015: Marketing Is Part of the Product

**Status:** Accepted

**Decision:** Treat the marketing website (`app/(marketing)`) and lead capture as a first-class, instrumented part of the product and its data model, not as detached static brochure pages.

**Reasoning:** The marketing site is the top of the funnel and the only place a Visitor becomes a Lead. If marketing is disconnected from the data model, the business loses attribution, conversion visibility, and any feedback loop between messaging and results. By wiring marketing forms to persist real `Lead` rows with `source`/`campaign` attribution, and by tracking anonymous Visitors through analytics, marketing performance becomes measurable and the funnel becomes continuous from first visit to active customer.

**Consequences:**

- Marketing form submissions create `Lead` rows (with source/campaign), replacing the console-log placeholder.
- Anonymous visitor behavior is tracked in the analytics layer (PostHog), not as transactional rows.
- Marketing copy, CTAs, and campaigns can be evaluated against real lead and conversion data once analytics ships.
- Marketing changes carry the same documentation/quality expectations as the rest of the product.
