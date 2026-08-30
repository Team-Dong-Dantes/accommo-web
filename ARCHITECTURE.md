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
- **pages/** wire routing, table/filter state, and compose feature
  components. A page should not exceed ~400 lines; if it grows, extract a
  feature component with a real boundary (a whole overlay, a whole panel —
  not a random fragment).
- **features/** know one domain, receive data via props, emit events up
  (`v-model` / `update:x` conventions). Their scoped CSS travels with them.
- **components/ui|table|user** know nothing about domains.

## Rules of thumb

1. **No file over 400 lines** (exceptions: `types/database.gen.ts` —
   generated, never edit; `pages/admin/UIBible.vue` — dev-only style guide).
2. **Icons** are `<Icon icon="mdi:..." />` from `@iconify/vue` — never
   `q-icon`.
3. **Status colors** come from `utils/status.config.ts`
   (`getStatus().tone`, `toneVar()`), never hardcoded Quasar palette names
   or hex maps.
4. **Shared string/date helpers** live in `utils/format.ts`
   (`getInitials`, `getInitialsWide`, `getTimeAgo`, `getTimeAgoShort`,
   `roleLabel`, `formatTime`, `formatDateTime`, `dayLabel`). Don't
   re-define them locally. Note: `getInitials` and `getInitialsWide`
   differ intentionally (single-word names → "M" vs "MA") — pick the one
   your surface already used.
5. **Type re-exports for compatibility**: `DetailDrawer.vue` re-exports the
   `DrawerPreview*` types from `features/drawer/preview.ts` so pages can
   keep importing from either location.
6. **VerificationReview** keeps its `:request` / `@close` / `@submit`
   contract with `pages/admin/Verifications.vue`; its internals are
   `features/verifications/*`.

## Verification gates (run before handing anything over)

```bash
npx vue-tsc --noEmit          # must exit 0 (strict mode)
npx quasar build              # must succeed
grep -rn "console.log" src/   # must be empty
```

Screenshot parity for touched surfaces (shoot before, diff after) —
refactors must be visually invisible.

## Known quirks preserved on purpose

- `dayLabel()` in `utils/format.ts` has an off-by-one-month bug inherited
  from SupportTickets.vue (day keys are built 0-indexed then re-parsed by
  string). Fixing it changes visible labels — only do it as an explicit,
  user-approved change.
- `roleLabel()` shows "User" for unknown roles (formerly "Student" in the
  ticket window's local copy).
