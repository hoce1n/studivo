Updated todo list

Below are 5 practical, minimalist UX improvements for Studivo with concrete implementation guidance.

1) Seat-click Quick Reserve (in-place)
- Core idea: Click a seat on the map → open a right-side Sheet with pre-filled seatNumber, phone-first input and a single “Reserve” CTA.
- Problem solved: Eliminates a separate reservation page/modal and extra clicks.
- shadcn: Sheet + SheetHeader/Content + Form/Input + DatePicker + Button + Toaster.
- Code pointers: app/dashboard/_components/study-hall-seats-map.tsx (handle seat onClick); app/dashboard/_components/reserve-form.tsx (convert to Sheet-based, prefill seat).

2) Calm Seat Status Layer & Microlegend
- Core idea: Replace dense labels with color-coded dots + single-line badge on hover; persistent microlegend in header.
- Problem solved: Quick visual scan of occupancy without cognitive load.
- shadcn: Badge (dot), Tooltip (hover details), Card (microlegend).
- Code pointers: app/dashboard/_components/study-hall-seats-map.tsx (render dot + tooltip), app/layout.tsx or dashboard header (add microlegend).

3) Command Palette: Instant Actions
- Core idea: Global Command palette (Cmd/Ctrl+K) for seat/member lookup and one-key actions (reserve/renew/release).
- Problem solved: Removes navigation; power users complete tasks without leaving keyboard focus.
- shadcn: Command (list, input), Dialog or Sheet for results, Button for action triggers.
- Code pointers: new component components/command-palette.tsx; wire into app/layout.tsx (header) and call server actions in app/actions/actions.ts.

4) Phone-first Smart Autofill
- Core idea: In reserve form, phone input triggers server-side lookup (onBlur) and auto-fills name + shows active subscription summary inline.
- Problem solved: Prevents duplicate members, speeds registration, surfaces conflicts immediately.
- shadcn: Input + Avatar + Inline Alert/Badge + Skeleton while loading.
- Code pointers: app/dashboard/_components/reserve-form.tsx (add onBlur lookup); app/actions/actions.ts (add lookupMember API returning user+active sub).

5) Minimal Staff Invite Flow (one-click)
- Core idea: “Invite staff” compact Dialog: name + email + optional role; sends sign-up invite and assigns studyhall.
- Problem solved: Avoids full page form; admin can invite in 1-2 clicks.
- shadcn: Dialog + Form/Input + Button + Toaster.
- Code pointers: app/dashboard/_components/create-staff-form.tsx (convert to Dialog pattern); app/actions/actions.ts (reuse/createStaff to return invite result).

Notes on visual language
- Keep spacing generous, use mono-line labels, single primary CTA per card, and rely on color + microcopy for status (avoid icons unless meaningful). Use RTL-aware layout already present.
