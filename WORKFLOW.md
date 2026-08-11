# Accommo Web — Workflow Guide

## Team
- **You** — Web interface (sole dev)

---

## 1. Branches

```
master (protected)    ← stable, production-ready
development           ← active development, auto-deploys via Vercel
  └── feat/xxxxx      ← your feature branches
```

- Always branch off `development`
- Branch naming: `feat/<short-description>` (e.g., `feat/property-list`, `feat/tenant-table`)
- PR into `development` — needs 1 review from a mobile teammate

---

## 2. Workflow

1. **Create an Issue** on GitHub for each task
2. **Branch:** `git checkout -b feat/property-list`
3. **Work** — commit + push regularly
4. **PR:** Open PR → assign mobile dev as reviewer
5. **Merge:** Squash and merge after approval
6. **Delete branch** after merge

### PR Checklist
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] No console.log / debug code

---

## 3. Deployment

Deployment is handled by **Vercel**. Every push to `development` triggers an automatic production deployment.

```bash
git checkout development && git pull
# ... make changes ...
git push origin development
# Vercel auto-deploys from here
```

No manual deploy steps needed. Check the Vercel dashboard for build status and previews.

---

## 4. Coordination

Since you're the sole web dev, conflicts are rare. But when you need new API features, Supabase migrations, or shared types — open a quick issue or message the mobile team so they're aware.

**Shared touchpoints:**
- Database schema changes (coordinate with both mobile devs)
- API endpoint changes (coordinate with both mobile devs)
- Auth flow changes (affects all interfaces)
