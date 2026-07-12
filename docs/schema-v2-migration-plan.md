# Studivo Schema v2 Migration Plan

## Overview

This document describes the migration plan from the current production database schema (v1) to the new domain-oriented schema (v2).

The goal is not to rebuild the application from scratch. The goal is to evolve the existing production system while preserving real user data and existing business history.

The application is already running in production and contains real:

* Users
* StudyHalls
* Membership data
* Payments
* Seat assignments
* Operational records

Therefore, all changes must be performed through a controlled migration process.

---

# Important Instruction for Developers and AI Agents

Before making any code changes:

1. Review the current `prisma/schema.prisma`.
2. Review the proposed Schema v2 design.
3. Understand the reason behind each model change.
4. Do not blindly rename models or fields.
5. Do not delete production data.
6. Prefer migration scripts over destructive database changes.

The Schema v2 file should always be treated as the source of the new domain model.

---

# Main Architectural Changes

## 1. User Model

### Previous Design

The previous design coupled identity with a specific StudyHall.

Example:

```
User
 ├── role
 └── studyhallId
```

This created limitations because:

* A user identity should not belong to one StudyHall.
* A person can change StudyHalls.
* A person can have different relationships with different StudyHalls.

---

### New Design

User represents identity only.

Relationships are modeled separately:

```
User

 ├── Membership
 |
 ├── StaffAssignment
 |
 └── PlatformRole
```

A user's role depends on context.

Examples:

* Member of a StudyHall → Membership
* Staff/Owner of a StudyHall → StaffAssignment
* Studivo platform employee → PlatformRole

---

# 2. Subscription → Membership

## Previous Design

The previous system used Subscription as the main membership concept.

## New Design

Subscription is replaced by Membership.

Reason:

Membership represents a business relationship between:

```
User
 +
StudyHall
 +
MembershipPlan
```

It contains:

* Start date
* End date
* Status
* Seat assignment history

---

# 3. Seat Ownership → SeatAssignment

## Previous Design

A seat was directly connected to a user.

Example:

```
Seat
 |
 User
```

## New Design

Seats are independent resources.

Ownership/history is stored separately:

```
Seat

 |

SeatAssignment

 |

Membership
```

Benefits:

* Seat history is preserved.
* Users can change seats.
* A seat can be assigned to another member after release.

---

# 4. Payment

Payment is now a first-class domain entity.

Reasons:

* Membership activation depends on payment state.
* Payment history must be preserved.
* Future online payment support is possible.

Relationship:

```
Payment

 |

Membership
```

---

# 5. Staff Management

Previous role-based design:

```
User.role = admin
```

is replaced with:

```
User

 |

StaffAssignment

 |

HallRole

OWNER
STAFF
```

Reason:

A user can manage multiple StudyHalls without changing identity.

---

# 6. Platform Context

Studivo is designed as a multi-tenant SaaS.

Platform users are separated from StudyHall users.

Platform entities:

* Lead
* DemoRequest
* PlatformRole

Example:

```
Studivo Platform

SUPER_ADMIN
SALES

        |

StudyHall Tenant

OWNER
STAFF
MEMBER
```

---

# 7. Communication

## PushSubscription

Push subscriptions belong to users, not StudyHalls.

Reason:

A user may use multiple devices:

```
User

 ├── Mobile Browser
 ├── Desktop Browser
 └── Other Device
```

Each device has its own push subscription.

---

# Removed Concepts

## RenewalReminder

RenewalReminder is not considered a core domain entity.

It is an implementation detail of notification scheduling.

Future implementation may use:

* Scheduled jobs
* Notification history
* Background workers

---

# Migration Principles

## Never perform destructive migration on production.

Before migration:

1. Create a full database backup.
2. Test migration on a copy of production data.
3. Verify data integrity.
4. Deploy backend changes after database migration.

---

# Migration Order

Recommended order:

## Phase 1

Finalize and validate Schema v2.

Commands:

```
prisma validate
prisma generate
```

---

## Phase 2

Create data migration scripts.

Examples:

```
Subscription
        |
        v
Membership
```

```
Seat.userId
        |
        v
SeatAssignment
```

---

## Phase 3

Update backend services.

Recommended approach:

* Update one domain at a time.
* Avoid large automatic refactors.
* Keep existing production behavior.

---

# Final Note

The purpose of Schema v2 is not only database optimization.

It represents a more accurate business model for Studivo as a multi-tenant SaaS platform.

Before implementing any migration or refactoring:

Always review:

```
prisma/schema.prisma
```

and confirm that the current implementation still matches the domain decisions documented here.
