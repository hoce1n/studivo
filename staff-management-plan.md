# Staff Management Implementation Plan

This document outlines the minimal viable product (MVP) implementation for the **Staff Management** (مراقبین / کارکنان) section in the Studivo application. The plan strictly adheres to the existing `feature/v2-database` branch architecture, utilizing only the current `StaffAssignment` and `Shift` Prisma models without introducing new schema fields.

## 1. Folder Structure

To maintain consistency with the existing codebase (e.g., `app/actions/seats`, `app/actions/memberships`), the backend actions and frontend pages should be organized as follows:

### Backend Actions
Create a new directory for staff-related actions:
```text
app/actions/staff/
├── assignments.ts   # Actions for StaffAssignment (create, update, deactivate)
├── shifts.ts        # Actions for Shift (create, update, delete)
└── queries.ts       # Read-only queries (list staff, list shifts, calculate hours)
```
*Note: The existing `assignStaffToStudyHall` in `app/actions/settings/mutations.ts` can be migrated to `assignments.ts` or kept in settings depending on preference, but a dedicated `staff` directory is cleaner for the new dashboard section.*

### Frontend Pages & Components
Create a new route in the dashboard:
```text
app/dashboard/staff/
├── page.tsx                 # Main server component (fetches data, renders tabs)
└── _components/
    ├── staff-tabs.tsx       # Client component managing "Staff List" and "Shifts" tabs
    ├── staff-list-tab.tsx   # Table of staff assignments
    ├── shift-list-tab.tsx   # Calendar/List view of shifts
    ├── add-staff-form.tsx   # Form to assign a new staff member
    └── add-shift-form.tsx   # Form to create a new shift
```

## 2. Server Actions & Responsibilities

All actions must use `requireScopedUser()` to ensure the user is authorized (OWNER or STAFF) for the current study hall. Mutations should utilize Prisma transactions, log to `auditLog`, and call `revalidateOperationalPaths()` (or a new `revalidateStaffPaths()`).

### `app/actions/staff/assignments.ts`
- **`assignStaff(formData: FormData)`**: 
  - **Responsibility**: Assigns an existing user to the study hall.
  - **Logic**: Validates identifier (email/phone), checks if user exists, creates `StaffAssignment` with `role`, `startDate`, `endDate`, and `note`.
  - **Permissions**: OWNER only.
- **`updateStaffAssignment(assignmentId: string, data: UpdateData)`**:
  - **Responsibility**: Updates role, dates, or deactivates a staff member.
  - **Logic**: Updates `StaffAssignment`. If deactivating, sets `isActive: false` and `endDate: now()`.
  - **Permissions**: OWNER only.

### `app/actions/staff/shifts.ts`
- **`createShift(formData: FormData)`**:
  - **Responsibility**: Records a new shift for a staff member.
  - **Logic**: Validates `startsAt` < `endsAt`. Ensures the `staffAssignmentId` belongs to the current study hall. Creates `Shift` record.
  - **Permissions**: OWNER can create for anyone; STAFF can only create for themselves.
- **`updateShift(shiftId: string, data: UpdateData)`**:
  - **Responsibility**: Modifies an existing shift (e.g., correcting hours).
  - **Logic**: Updates `startsAt`, `endsAt`, or `note`.
  - **Permissions**: OWNER or the specific STAFF member who owns the shift.
- **`deleteShift(shiftId: string)`**:
  - **Responsibility**: Removes an invalid shift.
  - **Logic**: Deletes the `Shift` record.
  - **Permissions**: OWNER only.

### `app/actions/staff/queries.ts`
- **`getStaffList(studyHallId: string)`**:
  - **Responsibility**: Fetches all `StaffAssignment` records for the hall, including user details.
- **`getShifts(studyHallId: string, filters: { staffId?: string, startDate?: Date, endDate?: Date })`**:
  - **Responsibility**: Fetches shifts within a date range.
- **`calculateTotalHours(staffAssignmentId: string, startDate: Date, endDate: Date)`**:
  - **Responsibility**: Utility function that fetches shifts for a specific assignment in a date range and sums the duration (`endsAt - startsAt`).

## 3. Pages & UI Structure

### Main Page: `/dashboard/staff/page.tsx`
This server component will:
1. Call `requireScopedUser()` to verify access.
2. Fetch the list of staff assignments and recent shifts using the query actions.
3. Pass the data to the client-side `<StaffTabs />` component.

### Tabs Component: `<StaffTabs />`
Similar to `SettingsTabs`, this will use the `Tabs` component from `shadcn/ui` to switch between:
1. **Staff List (لیست همکاران)**:
   - Displays a `<Table>` showing: Name, Role, Start Date, Status (Active/Inactive), and "Total Hours This Month" (calculated via the utility function).
   - Includes an `<AddStaffForm />` (visible only to OWNERs) to assign new staff.
2. **Shifts (شیفت‌ها)**:
   - Displays a list or simple calendar view of shifts.
   - Includes an `<AddShiftForm />` allowing staff to log their hours (`startsAt`, `endsAt`, `note`).
   - Filters to view shifts by specific staff members or date ranges.

## 4. Sidebar Integration

Update `components/app-sidebar.tsx` to link to the new section. Currently, the sidebar has a placeholder for staff under `adminOnlyItems`:

```tsx
{
  title: "کارکنان",
  url: "/dashboard/staff",
  icon: <UsersRoundIcon />,
  isActive: activePath.startsWith("/dashboard/staff"),
  items: [
    { title: "لیست همکاران", url: "/dashboard/staff" },
    { title: "شیفت‌ها", url: "/dashboard/staff?tab=shifts" },
  ],
}
```
*Note: If STAFF role users need access to log their own shifts, this section should be moved out of `adminOnlyItems` and made conditionally visible based on `isOwnerOrAdmin || isStaff`.*

## 5. Important Notes & Edge Cases

- **Permissions**: Ensure strict authorization checks. An OWNER can manage all staff and shifts. A STAFF member should only be able to view their own assignments and log/edit their own shifts.
- **Audit Logging**: Every mutation (create/update/delete assignment or shift) must create an `AuditLog` entry. Use `entityType: "STAFF_ASSIGNMENT"` or `"SHIFT"` and include relevant metadata (e.g., `operatorName`, `targetUser`, `shiftDuration`).
- **Past Shifts**: When creating a shift, validate that `startsAt` is not unreasonably far in the past (e.g., limit to the current month or past 30 days) to prevent accidental or malicious logging of historical hours. Similar to the `START_DATE_MAX_PAST_DAYS` logic in `reserve.ts`.
- **Overlapping Shifts**: Consider adding validation in `createShift` to prevent a single staff member from having overlapping shift times.
- **Timezones**: Ensure `startsAt` and `endsAt` are handled correctly in the UI (converting to local Iranian time for display) while storing as UTC in the database.
