# Accommo Web

Administrative web application for Accommo, an ISU Echague boarding-house
listing platform. It is a Quasar SPA built with Vue 3 and TypeScript, with
Supabase providing authentication and application data.

## Requirements

- Node.js 18 or later
- npm
- A Supabase project for authenticated or data-backed features

## Local setup

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and set the public client configuration.

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_MAPBOX_TOKEN=pk.your-public-mapbox-token
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
   ```

   Do not commit `.env`. Supabase anon keys, Mapbox `pk.*` tokens, Cloudinary
   cloud names, and unsigned upload presets are client-visible by design. Never
   put Supabase service-role keys, Cloudinary API secrets, or other privileged
   credentials in this file.

3. Start the development server.

   ```bash
   npm run dev
   ```

## Quality checks

Run these before merging or deploying changes:

```bash
npm run test
npm run typecheck
npm run build
```

`npm run test:watch` starts Vitest in watch mode. Tests currently cover shared
logic in `src/**/*.test.ts`; browser-level workflow coverage should be added as
the admin flows stabilize.

## Architecture

Application code follows this data flow:

```text
api -> composables -> pages -> features -> components
```

- `src/api/` contains typed Supabase query helpers.
- `src/composables/` owns reactive data, loading, error, and mutation state.
- `src/pages/` provides route-level composition and filters.
- `src/features/` contains domain composites such as tickets and verification.
- `src/components/` contains reusable interface components.
- `src/stores/auth.ts` holds cross-page authentication and profile state.
- `src/router/` defines routes and protects administrator-only pages.

See [ARCHITECTURE.md](ARCHITECTURE.md) for project conventions and placement
guidance.

## Supabase deployment

1. Review the linked project's migration ledger before deploying schema changes.
   The current remote history predates the repository baseline and must be
   reconciled before using `supabase db push`; see
   [MIGRATION-LEDGER.md](supabase/MIGRATION-LEDGER.md).
2. Regenerate `src/types/database.gen.ts` whenever the deployed schema changes.
3. Deploy the privileged Edge Functions in `supabase/functions/`:
   - `invite-admin`
   - `manage-admin`
4. Configure Edge Function secrets in Supabase, including the service-role key.
   Service-role keys must only exist in Edge Function secrets, never in browser
   environment variables.
5. Confirm Row Level Security policies allow each intended administrator action
   and deny all unintended client-side writes.

The frontend is deliberately limited to public Supabase configuration. Database
authorization is enforced by Supabase RLS and privileged administrator actions
are handled by the Edge Functions.

## Vercel deployment

`vercel.json` builds `dist/spa` and rewrites application routes to the SPA entry
point. Add the variables from `.env.example` in the Vercel project settings for
each environment, then deploy with:

```bash
npm run build
```

Verify the production deployment by signing in as an administrator, completing
onboarding if needed, and checking at least one data-backed screen and the map.
