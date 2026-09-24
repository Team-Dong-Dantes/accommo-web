# accommo-web Architecture

How the admin web app is layered, and where new code goes.

## Layer map

```
src/
├── api/            Pure Supabase fetchers. No refs, no notify, no DOM.
├── composables/    Stateful orchestration. Own refs/loading/error, call api/.
├── stores/         Pinia stores (auth). Cross-page reactive state.
├── features/       Domain composites (markup + scoped CSS + local logic).
│   ├── drawer/     DetailDrawer preview body + tab panels + preview types
│   ├── tickets/    Ticket window family (sidebar, thread, composer, details)
│   ├── verifications/  DocumentViewer, checks, decision form
│   ├── settings/   AdministratorsSection (invite + manage admins)
│   ├── announcements/  ComposerDialog (create/edit) + shared date helpers
│   ├── audit/      DateRangeButton + log mapping/diffing
│   └── users/      User → drawer-preview construction (userPreview.ts)
├── components/
│   ├── ui/         Generic primitives (TabNav, DetailDrawer shell, EmptyState…)
│   ├── table/      DataTable / TableCard / Toolbar / Pagination
│   ├── user/       BadgePill, UserInfoCell, ProfileHero…
│   └── verification/  VerificationReview (layout glue)
├── pages/          Routing + filters + composition. No inline sub-views.
├── utils/          Pure helpers (format, status.config, supabase client).
├── types/          Generated DB types + shared domain types (dashboard).
└── router/         Routes + guards.
```

## Data flow (one direction)

`api/ → composables/ → pages → features/ → components/`

- **api/** modules export typed async functions. They throw on error and
  hold no state. A composable decides what a failure means.
- **composables/** own reactive state, call api/ functions (usually batched
  in `Promise.all`), and expose `{ data, loading, error, load }`-style
  handles. `useTickets` is the canonical example: one instance per page —
  it is a factory, NOT a singleton; extracted components must never call it
  themselves, they receive data via props and emit events up.
  `useNotifications` is the other shape worth knowing: two unrelated
  surfaces (the header bell and the notification centre) share it, each
  passing its own `limit` and realtime `channel`. Where two screens do the
  same job, that difference belongs in arguments, not in a second copy.
- **pages/** wire routing, table/filter state, and compose feature
  components. A page should not exceed ~400 lines; if it grows, extract a
  feature component with a real boundary (a whole overlay, a whole panel —
  not a random fragment).
- **features/** know one domain, receive data via props, emit events up
  (`v-model` / `update:x` conventions). Their scoped CSS travels with them.
- **components/ui|table|user** know nothing about domains.

## Rules of thumb

1. **No file over 400 lines** (exception: `types/database.gen.ts` —
   generated, never edit). Currently 16 files exceed this; treat it as the
   target for files you touch, not a claim about the tree.
2. **Icons** are `<Icon icon="lucide:..." />` from `@iconify/vue` — never
   `q-icon`, and never the `mdi` collection (retired). The one remaining
   exception is the `mdi-*` Quasar font names inside `utils/notify.ts` and
   the two auth pages.
3. **Status colors** come from `utils/status.config.ts`
   (`getStatus().tone`, `getTone()`, `toneVar()`), never hardcoded Quasar
   palette names or hex maps. `STATUS_MAP` covers roles, account and
   accreditation status, ticket priority, announcement audience, **and room
   occupancy** (`available` / `occupied` / `maintenance`). Add a key there
   rather than writing a local tone function — two pages did that for room
   status and their copies disagreed about `maintenance`.
4. **Shared string/date helpers** live in `utils/format.ts`
   (`getInitials`, `getInitialsWide`, `getTimeAgo`, `getTimeAgoShort`,
   `roleLabel`, `cap`, `capitalize`, `fmtDate`, `csvDate`, `avatarUrl`,
   `formatTime`, `formatDateTime`, `dayLabel`, `humanizeEnum`). Don't
   re-define them locally. Two pairs differ intentionally:
   - `getInitials` / `getInitialsWide` — single-word names → "M" vs "MA"
   - `cap` / `capitalize` — empty input → "—" vs "Pending", and
     `capitalize` lowercases the tail
   Pick the one your surface already used. Feature modules
   (`features/announcements/shared.ts`, `features/audit/logMapping.ts`,
   `features/users/userPreview.ts`, `features/drawer/preview.ts`) re-export
   some of these so their importers have one import surface.
5. **Dates are formatted in `en-PH`**, explicitly, never with the browser
   default — otherwise the same timestamp renders differently per admin.
6. **Type re-exports for compatibility**: `DetailDrawer.vue` re-exports the
   `DrawerPreview*` types from `features/drawer/preview.ts` so pages can
   keep importing from either location.
7. **VerificationReview** keeps its `:request` / `@close` / `@submit`
   contract with `pages/admin/Verifications.vue`; its internals are
   `features/verifications/*`.

## Verification gates (run before handing anything over)

```bash
npm run typecheck             # must exit 0 (strict mode)
npm run lint                  # must stay at 0 errors
npm run test                  # must stay green
npm run build                 # must succeed
grep -rnE "console\.(log|warn|error)" src/
```

The console grep used to look for `console.log` alone, which nothing in the
tree has ever used — every call is `warn` or `error`, so the gate passed
while catching nothing. It is a review prompt, not a hard zero: the current
count is 22, all of them deliberate `warn`/`error` on a non-fatal path.

Screenshot parity for touched surfaces (shoot before, diff after) —
refactors must be visually invisible.

## Known quirks preserved on purpose

- `dayLabel()` in `utils/format.ts` has an off-by-one-month bug inherited
  from SupportTickets.vue (day keys are built 0-indexed then re-parsed by
  string). Fixing it changes visible labels — only do it as an explicit,
  user-approved change.
- `roleLabel()` shows "User" for unknown roles (formerly "Student" in the
  ticket window's local copy).
