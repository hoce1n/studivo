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

## ADR-004: SQLite for Local Development, PostgreSQL for Production Path

**Status:** Accepted as current state with planned migration

**Decision:** The current repository uses SQLite via `@prisma/adapter-better-sqlite3`, while the production path should move to PostgreSQL.

**Reasoning:** SQLite keeps the starter simple and fast for local development. However, Studivo's core promise depends on concurrent seat booking integrity. Real multi-staff venues need stronger production concurrency, better isolation, operational backups, and database-level constraints such as partial unique indexes.

**Consequences:**

- Development remains easy today.
- Production readiness requires a database migration plan.
- Active-seat uniqueness should eventually be enforced at the database level, not only in application transactions.

## ADR-005: PWA + Push Notifications Before Native Apps

**Status:** Accepted

**Decision:** Invest in PWA installation and push-notification support before building native mobile apps.

**Reasoning:** Study hall owners, staff, and students need low-friction access. A PWA can be installed directly on phones, bypass app-store friction, and deliver operational notifications such as subscription renewal alerts, payment reminders, and staff follow-ups. This replaces the immediate need for native mobile apps while preserving a mobile-friendly experience.

**Consequences:**

- The app includes a manifest, service-worker registration, and push-notification scaffolding.
- Push subscriptions must be persisted in the database before production use.
- Notification UX must be permission-aware and respectful; operators should control reminder behavior.

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
