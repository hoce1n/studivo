# Schema v2 Onboarding and StudyHall Provisioning Refactor Report

## Scope

This report documents the current, legacy signup/onboarding assumptions that still exist after the Prisma schema moved to Schema v2. It intentionally does **not** change authentication, onboarding, dashboard, or platform logic.

The business direction for Schema v2 is that `StudyHall` provisioning moves out of self-service onboarding and into the SaaS sales funnel:

```text
Lead
  -> DemoRequest
  -> Conversion
  -> StudyHall creation
  -> Owner assignment
```

## Schema v2 target model

Schema v2 removes the previous direct tenant ownership fields from `User`. `User` now represents identity only and is connected to venues through contextual records such as `StaffAssignment`, `Membership`, and `PlatformRole`.

Relevant Schema v2 facts:

- `User` has no `role`, `studyhallId`, or `studyhall` relation fields.
- Venue operator authorization is modeled by `StaffAssignment` with `role: HallRole` and `studyHallId`.
- Platform access is modeled separately by nullable `User.platformRole`.
- Sales data is represented by `Lead` and `DemoRequest`.
- A converted lead links to a venue through `Lead.convertedStudyHallId` / `convertedStudyHall`.
- Seat inventory is section-based: `StudyHall -> Section -> Seat`.
- Plans and recurring member relationships are modeled as `MembershipPlan` and `Membership`, not legacy `Subscription` records.

## Legacy flow currently assumed by application code

The existing product flow is still:

1. User signs up with Better Auth email/password.
2. User verifies a phone number.
3. User without `studyhallId` is redirected to `/onboarding`.
4. `/onboarding` collects venue name, gender, address, total seat count, and monthly fee.
5. `completeOnboarding` creates a `StudyHall`.
6. `completeOnboarding` updates the current `User` to `role = "admin"` and attaches `studyhallId`.
7. `completeOnboarding` creates numbered seats directly under the new hall.
8. The dashboard uses `user.studyhallId`, `user.role`, and `user.studyhall` as the tenant context.

This flow belongs to the previous product model and should be preserved only until the Schema v2 provisioning flow is implemented.

## Places where the old assumption exists

### 1. Signup success still routes users into tenant onboarding

`SignupForm` signs up through Better Auth and redirects newly created accounts to `/verify-phone`. The form copy describes ordinary account creation, not a sales-led owner invitation or lead conversion path.

Future implication: signup can remain for invited owners/staff/platform users, but it should not imply that every new user is allowed to create a StudyHall.

### 2. Phone verification treats `studyhallId` as onboarding completion

`app/(auth)/verify-phone/page.tsx` fetches `phoneNumber` and `studyhallId`; if the phone is verified, it redirects to `/dashboard` when `studyhallId` exists and `/onboarding` otherwise.

Future implication: this check must be replaced with a Schema v2 context resolver. A verified user may be:

- a platform user with `platformRole`;
- an owner/staff user with an active `StaffAssignment`;
- a member user with only `Membership` records;
- an invited owner whose account exists before assignment is activated;
- a normal marketing lead who should not reach tenant provisioning.

### 3. `/onboarding` directly creates a StudyHall for the current user

`app/onboarding/page.tsx` explicitly describes creating a StudyHall, asks for total seats and monthly fee, blocks users without phone verification, and redirects users with `studyhallId` to `/dashboard`.

Future implication: this route should become one of the following after migration:

- disabled for normal self-service users;
- replaced by an invitation acceptance / owner profile completion flow;
- limited to internal platform provisioning only;
- redirected to the demo/sales flow when no converted lead or invitation exists.

### 4. `completeOnboarding` is the main legacy provisioning mutation

`app/actions/auth.ts` still defines `completeOnboarding` around the old tenant model:

- checks `user.studyhallId` to decide whether onboarding is already complete;
- validates `totalSeats` and `monthlyFee` as fields on the hall;
- creates a `StudyHall` from onboarding form data;
- updates the same user with `role: "admin"` and `studyhallId`;
- creates seats with `seatNumber` and `studyhallId` directly.

This is the most important future refactor point. In Schema v2, conversion should create:

- `StudyHall` with v2 fields (`name`, `slug`, `gender`, optional contact/address fields);
- one or more `Section` records;
- `Seat` records under sections;
- one or more `MembershipPlan` records if initial plans are needed;
- a `StaffAssignment` with `role: OWNER` for the owner user;
- an audit trail for platform provisioning.

It should not write `User.role` or `User.studyhallId` because those fields are no longer part of Schema v2.

### 5. Auth helpers resolve tenant scope from `User.studyhallId`

`requireUser` still selects legacy fields and relations (`role`, `studyhallId`, `studyhall`, legacy StudyHall settings). `requireScopedUser` redirects authenticated users without `studyhallId` to `/onboarding`.

Future implication: tenant scope must be resolved from active `StaffAssignment` rows instead of direct fields on `User`. The helper should eventually return a contextual principal such as:

```ts
type TenantPrincipal = {
  userId: string;
  studyHallId: string;
  hallRole: "OWNER" | "STAFF";
  studyHall: { id: string; name: string; slug: string; gender: Gender };
};
```

If one user can manage multiple halls, the app also needs a selected active hall context rather than a single implicit `studyhallId` on the user.

### 6. Dashboard layout still gates access with direct user tenant fields

`app/dashboard/layout.tsx` selects `role`, `platformRole`, `studyhallId`, and `studyhall`, redirects platform users to `/platform`, then redirects users without `studyhallId` to `/onboarding`.

Future implication: dashboard access should be granted when the user has an active owner/staff `StaffAssignment`. Platform users should still route to `/platform`, but users without staff assignments should not automatically be asked to create a hall.

### 7. Dashboard pages and tenant backend actions still depend on legacy scope

The dashboard and backend action modules continue to use old tenant assumptions in many places:

- `user.role === "admin"` for owner/admin permissions;
- `user.studyhallId` for tenant scoping;
- direct `StudyHall.totalSeats` and `StudyHall.monthlyFee` fields;
- `Seat.seatNumber` and direct `Seat.studyhallId`;
- legacy `Subscription` relations and statuses;
- member users identified by `User.role = "member"` and `User.studyhallId`.

These areas are outside the requested no-code-change scope, but they are blockers for runtime compatibility with Schema v2.

### 8. Platform conversion code already represents the future direction, but uses old field names

`app/actions/platform.ts` contains a platform-side `convertLeadToStudyHall` mutation, which is directionally aligned with the sales-led provisioning model. However, the surrounding platform code still uses old fields and statuses such as `Lead.name`, `Lead.phone`, `Lead.venueName`, `Lead.studyhallId`, `LeadStatus.DEMO`, `LeadStatus.CUSTOMER`, and `StudyHall.totalSeats` / `monthlyFee`.

Future implication: platform conversion should become the only normal StudyHall creation path, but it must be updated to the Schema v2 model:

- use `Lead.fullName`, `phoneNumber`, `studyhallName`, `convertedStudyHallId`, and v2 `LeadStatus` values;
- create a v2-compatible `StudyHall` with a unique slug and valid `Gender`;
- create the owner identity or match an existing user by email/phone;
- create `StaffAssignment(role: OWNER)` instead of mutating `User.role` / `studyhallId`;
- optionally create default `Section`, `Seat`, and `MembershipPlan` records;
- record conversion metadata in `AuditLog` or a future platform audit model.

### 9. Marketing lead capture is sales-led but still not Schema v2-compatible

`app/actions/marketing.ts` attempts to create a lead and linked demo request from public marketing forms, but it uses old lead fields and enum values: `name`, `phone`, `venueName`, `message`, `source: "MARKETING_SITE"`, and demo request `status: "requested"`.

Future implication: the sales funnel entry point should be retained, but the action must write Schema v2 fields and enum values:

- `Lead.fullName` instead of `name`;
- `Lead.phoneNumber` instead of `phone`;
- `Lead.studyhallName` instead of `venueName`;
- allowed `LeadSource` values such as `WEBSITE`;
- allowed `DemoRequestStatus` values such as `PENDING`.

## Required future refactoring plan

### Phase 1 — Freeze and classify legacy onboarding

- Keep `/onboarding` unchanged until a replacement is ready.
- Add a product decision that self-service StudyHall creation is legacy behavior.
- Decide whether `/signup` is public, invite-only, or both.
- Decide where a new user with no platform role and no staff assignment should go after phone verification.

### Phase 2 — Add Schema v2 context helpers

- Replace `requireScopedUser` with a helper that resolves active `StaffAssignment` context.
- Add explicit owner/staff guards based on `HallRole`.
- Support users with multiple `StaffAssignment` rows by adding a selected hall mechanism.
- Keep `requirePlatformUser` based on `platformRole`, but update the fallback redirect so non-tenant users are not forced into legacy onboarding.

### Phase 3 — Move StudyHall provisioning to platform conversion

- Make platform conversion the canonical `StudyHall` creation path.
- Convert lead status and relation fields to Schema v2 names and enum values.
- Create the owner user and `StaffAssignment(role: OWNER)` during conversion or through an invitation acceptance flow.
- Create initial sections/seats through Schema v2 `Section` and `Seat` records.
- Create default membership plans if needed for immediate operations.

### Phase 4 — Replace tenant dashboard assumptions

- Update dashboard queries from direct user scope to staff-assignment scope.
- Replace legacy `Subscription` reads/writes with `Membership`, `SeatAssignment`, and `Payment` flows.
- Replace `Seat.seatNumber` / direct hall seats with `Section -> Seat.number`.
- Replace `StudyHall.totalSeats` with counts over active seats or sections.
- Replace `StudyHall.monthlyFee` with `MembershipPlan.price` or platform billing configuration, depending on product meaning.

### Phase 5 — Retire or repurpose legacy onboarding

After platform conversion and invitation/owner assignment are working:

- remove public links to `/onboarding`;
- convert `/onboarding` into an invitation completion flow, an internal provisioning wizard, or a deprecation redirect;
- remove writes to non-existent legacy fields;
- document the final SaaS sales lifecycle in `DESIGN.md` and `DECISIONS.md`.

## Recommended future decisions

1. **Owner account creation timing:** decide whether owners are created during lead conversion, invited after conversion, or matched to existing users by phone/email.
2. **Multiple venue management:** decide how users choose between multiple active `StaffAssignment` contexts.
3. **Signup policy:** decide whether public signup should remain available, and if so, whether it creates a lead, a user identity only, or starts an invitation request.
4. **Legacy data migration:** map old `User.role = admin/staff` and `User.studyhallId` rows to `StaffAssignment` rows before removing code assumptions.
5. **Seat bootstrap model:** decide whether conversion creates one default section with all seats, or whether seat/section setup happens in a post-conversion owner wizard.
6. **Commercial plan separation:** clarify whether old `monthlyFee` meant member subscription price, Studivo SaaS billing price, or both; Schema v2 should keep member pricing in `MembershipPlan` and platform billing elsewhere.

## Summary

The old assumption is widespread: authentication, phone verification, onboarding, dashboard routing, tenant authorization, staff management, seat operations, and documentation all still treat `User.studyhallId` as the signal that a user owns or belongs to exactly one StudyHall.

Schema v2 requires replacing that assumption with contextual relationships:

- platform authority through `User.platformRole`;
- venue authority through `StaffAssignment`;
- customer/member relationships through `Membership`;
- venue provisioning through `Lead -> DemoRequest -> Conversion -> StudyHall -> StaffAssignment(OWNER)`.

No code was changed as part of this report.
