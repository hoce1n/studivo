1. Project Overview & Value Proposition
-------------------------------------

What is this application?
- Studivo (minimal SaaS starter) — a small SaaS product for managing study halls (physical reading/study rooms). It provides seat inventory, per-seat subscriptions, member management, staff management, basic revenue estimates, and an admin onboarding flow to create a study hall and seats.
- Built as a production-ready starter: Next.js App Router + Prisma + Better-Auth + Tailwind/shadcn UI, with PWA and push-notification support.

Core problem solved
- Simplifies daily operations of a study hall: register members, assign/renew/cancel seat subscriptions, manage staff, and monitor occupancy/revenue at a glance.

Target user
- Small business owners or operators of study halls, private libraries, or similar venues. Also useful to developers who want a minimal SaaS template with auth, data modeling, and key patterns implemented.

2. Tech Stack & Architecture
----------------------------

Core technologies
- Framework: Next.js 16 (App Router)
- UI: React 19, Tailwind CSS v4, shadcn-style UI primitives, Lucide icons, Sonner for toasts
- Auth: better-auth (server-side Next.js integration)
- ORM & DB: Prisma (client generated), SQLite via @prisma/adapter-better-sqlite3
- Validation: zod
- PWA & Push: service worker (sw.js), web-push (VAPID)
- Tooling: TypeScript, pnpm, ESLint

High-level architecture & folder layout
- app/ — Next.js App Router pages, layouts, provider components, server actions
  - (auth) — login/signup UI
  - dashboard — main app screens (seat map, staff, reservations)
  - api/auth/[...all]/route.ts — better-auth handler for auth routes
  - actions/ — server-side actions (business logic) used by UI
- components/ — shared UI components and shadcn wrappers (sidebar, forms, PWA helpers)
- lib/ — core singletons: db (prisma client), auth, server helpers, utils
  - lib/auth.ts — better-auth configured with Prisma adapter
  - lib/db.ts — PrismaClient with better-sqlite3 adapter (keeps instance in dev)
  - lib/server.ts — server helper to fetch session
- prisma/ — schema.prisma and migrations
- public/ — static assets and service worker

Architectural pattern
- Feature / route-based organization (App Router): server components for pages, server actions for mutations, client components for interactive elements.
- Clear separation: UI components (components/), business logic (app/actions/* server functions), persistence (Prisma / lib/db).

3. Core Features & User Flows
-----------------------------

Main implemented features
- Authentication
  - Email & password with better-auth (auth API wired via app/api/auth/[...all]).
  - Server helper getSession() to read current session in server components.
- Onboarding
  - Admin creates a StudyHall (name, totalSeats, monthlyFee); seats auto-created.
  - Onboarding guard redirects users missing studyhall to /onboarding.
- Dashboard
  - Live seat map (StudyHallSeatsMap) showing status: available, reserved, renewal (expiring soon), expired.
  - Summary cards: totals, occupancy %, membership counts, rough revenue numbers.
  - Reserve seat (reserveSeat action) creating members (upsert by phone) and subscriptions.
  - Renew or release seats; swap seat (swapSeat action).
  - Admin-only: create staff (createStaff action) — triggers better-auth sign-up for the staff, then assigns role=staff & studyhallId.
- Profile & StudyHall settings
  - Update profile and studyhall settings (role-based guard: only admin modifies settings).
- PWA & Push Notifications
  - Service worker registration (components/PWARegister.tsx)
  - Push subscription UI and client-side manager (PushNotificationManager.tsx)
  - Server helper app/actions/pwa.ts uses web-push and in-memory subscription (demo-style) to send notifications.
- UI/UX
  - RTL localization (fa locale) and Persian copy in UI.
  - Theme provider, tooltips, toasts.

Primary user journeys
1. New admin signs up → Onboard (create study hall and seats) → redirected to /dashboard.
2. Admin views seat map → creates staff → staff logs in and manages reservations.
3. Staff reserves a seat via ReserveForm → creates/updates member by phone + subscription record.
4. Admin or staff renews or swaps seats → history preserved by creating new subscription or updating seatId.
5. Optional: enable push notifications (client subscribes → server sends test pushes).

4. Database & Data Models
-------------------------

Prisma models (summary of main entities)
- StudyHall
  - id, name, totalSeats, monthlyFee, gender, address
  - relations: users[], seats[], subscriptions[]
- User
  - id, name, email, emailVerified, image, phoneNumber, role (member|staff|admin)
  - studyhallId (optional)
  - relations: sessions, accounts, subscriptions
  - Unique constraints: email; unique(studyhallId, phoneNumber)
- Seat
  - id, seatNumber, studyhallId
  - relations: subscriptions[]
  - Unique: (studyhallId, seatNumber)
- Subscription
  - id, userId, seatId, startDate, endDate, paymentStatus, status (active/expired/cancelled)
  - relations: user, seat, studyhall
- Session, Account, Verification
  - Standard tables used by auth adapter

Entity relationships
- 1 StudyHall -> N Seats
- 1 StudyHall -> N Users (staff + members + admin)
- 1 Seat -> N Subscriptions (historical)
- 1 User -> N Subscriptions (a member can have historical subscriptions)
- Subscriptions link User <-> Seat <-> StudyHall (with indices for efficient queries)

Business rules implemented in actions
- Onboarding creates seats (createMany) and assigns creator as admin.
- reserveSeat:
  - Validates seat exists and no active subscription on seat
  - Ensures member has no other active subscription in same studyhall (by phone)
  - Upserts user by studyhallId+phoneNumber; if created, generates local email hash (shortHash@studivo.ir)
  - Creates subscription (status: active)
  - All performed inside prisma.$transaction for atomicity
- renewSubscription:
  - Marks current active subscription as expired; creates a new active subscription to preserve history
- swapSeat:
  - Validates target seat exists and is free, then updates current subscription.seatId
- createStaff:
  - Calls auth.api.signUpEmail then updates user's role and studyhallId

5. Key APIs, Services, or Integrations
--------------------------------------

Internal services
- Server actions (app/actions/*) — the canonical business-logic layer used from server components.
- lib/auth (better-auth) + app/api/auth route handler via toNextJsHandler(auth).
- lib/db (Prisma client) — central DB access.

Third-party integrations
- better-auth (authentication & signUp): accounts, sessions, providers via adapter-prisma.
- Prisma (ORM)
- web-push (VAPID) — push notifications; uses NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.
- @prisma/adapter-better-sqlite3 — adapter to use SQLite with Prisma
- next-themes, sonner, tailwind, shadcn UI primitives

Notable internal endpoints / server handlers
- app/api/auth/[...all]/route.ts — auth endpoints delegated to better-auth
- Server actions (exported functions) are called from client components via form actions or from pages:
  - completeOnboarding(formData)
  - createStaff(formData)
  - reserveSeat(formData)
  - renewSubscription(subscriptionId, endDate)
  - releaseSeat(subscriptionId)
  - swapSeat(subscriptionId, newSeatNumber)
  - updateProfileDetails, updateStudyHallSettings
- app/actions/pwa.ts — subscribeUser/unsubscribeUser/sendNotification (demo: stores subscription in-memory)

6. Current State & Potential Bottlenecks
-----------------------------------------

Current state (summary)
- Well-structured, functional minimal SaaS for managing study halls.
- Auth, DB modeling, main flows, server actions, and UIs implemented.
- PWA basic support and push demo implemented.
- Strong use of prisma transactions and zod validation for server actions.

Potential bottlenecks & issues (immediate / medium-term)
1. Persistence of push subscriptions
   - app/actions/pwa.ts currently stores subscription in a module-level variable (subscription = sub). Not persisted to DB. This is a demo pattern and will not survive process restart nor support multiple users/devices.
   - Recommendation: persist push subscriptions to database (subscription table keyed by studyhall/user), associate to user/studyhall.

2. SQLite for production
   - SQLite is fine for prototyping, but not for multi-process concurrency or large scale. Prisma + SQLite works in single-node deployments only.
   - Recommendation: Postgres / MySQL for production.

3. Email uniqueness & local member accounts
   - Upsert uses synthetic email shortHash@studivo.ir for members, which is fine for internal accounts but may conflict if hash collisions occur (low risk).
   - Recommendation: consider a dedicated Member model or separate authentication scheme for members, or reserve synthetic email namespace carefully.

4. Missing payment integration
   - paymentStatus exists but no integration (Stripe or other). Revenue numbers are estimates; no actual billing/charges.
   - Recommendation: integrate payment provider and webhooks, persist invoices/payments.

5. Security & RBAC checks
   - Most actions guard by role, but ensure every API/route and server action checks user.studyhallId and role consistently. Review client-side RBAC (UI hiding is not enough).
   - Ensure secrets (VAPID_PRIVATE_KEY, DATABASE_URL) kept in environment and not committed.

6. Testing & CI
   - No automated tests visible (unit/integration) and no CI configuration.
   - Recommendation: add tests for critical server actions (reserveSeat, swapSeat) and add pipeline (pnpm test/lint).

7. Scaling concurrency & race conditions
   - Seat reservation/renew/swap are wrapped in transactions, mitigating race conditions in DB. But with SQLite and multiple Node processes, race conditions can still be an issue.
   - Recommendation: move to a transactional DB (Postgres) and consider background job processing for expensive tasks.

8. Observability & logging
   - Limited centralized logging/metrics. Add structured logs and error monitoring.

7. Recommended Next Steps (short prioritized list)
--------------------------------------------------
1. Persist push subscriptions to DB and wire sendNotification to stored subscriptions (per studyhall/user).
2. Replace SQLite with Postgres for multi-user/production readiness; reconfigure prisma datasource.
3. Integrate a payments provider (Stripe) and connect paymentStatus workflow.
4. Add unit & integration tests for core server actions; add CI (GitHub Actions).
5. Harden security: ensure authorization checks server-side, secrets rotation, CSP headers, rate-limiting on auth endpoints.
6. Add audit/history views for subscriptions and payments.

Appendix — Key code pointers
---------------------------
- Auth wiring: lib/auth.ts (betterAuth + prismaAdapter) -> app/api/auth/[...all]/route.ts
- DB client: lib/db.ts (PrismaClient with better-sqlite3 adapter)
- Server session helper: lib/server.ts getSession() used by pages/actions
- Business logic: app/actions/actions.ts (reserveSeat, createStaff, completeOnboarding, renewSubscription, swapSeat)
- Models: prisma/schema.prisma (StudyHall, User, Seat, Subscription, Session, Account, Verification)
- PWA: components/PWARegister.tsx, components/pwa/PushNotificationManager.tsx, app/actions/pwa.ts

If you’d like, next steps I can perform:
- Create an architecture diagram and a concise README summary.
- Produce a migration plan to switch to Postgres (prisma schema + env + guidance).
- Implement persisted push-subscriptions and demo send flow (code + DB changes + migration).

Would you like me to implement any of these improvements now?