---
trigger: always_on
---

# Mobile-to-Master Safe Merge Protocol

When merging updates from `mobile-2.0` to `master` for Vercel deployment, ALWAYS follow this verified safe protocol to protect the live desktop application:

1. **Create Safety Backups**:
   - Create local backup tags/branches before touching anything:
     `git branch backup/master-pre-mobile-merge origin/master`
     `git branch backup/mobile-2.0-pre-merge mobile-2.0`
2. **Use an Isolated Integration Branch**:
   - Never merge directly on `master`.
   - Checkout fresh integration branch from `origin/master`:
     `git checkout -b test/mobile-master-merge origin/master`
   - Merge: `git merge mobile-2.0`
3. **Verify Shared Types & Deduplication**:
   - Check `src/lib/billing/server.ts` for duplicate properties (e.g. `paymentProofUrl`).
   - Check `src/types/database.ts` ensuring `Profile` type has `first_name?: string | null` and `last_name?: string | null` for mobile compatibility.
   - Run `npm install` if new dependencies (such as `@vercel/blob`) were added on master.
4. **Mandatory Build & Type Verification**:
   - Run `npx tsc --noEmit` and ensure 0 TypeScript errors.
   - Run `npm run build` and ensure Next.js builds all desktop and mobile routes successfully.
5. **Promote to Master**:
   - `git checkout master`
   - `git pull origin master`
   - `git merge test/mobile-master-merge -m "feat(mobile): integrate updates into master"`
   - `git push origin master`
6. **Return to Working Branch**:
   - Always return to `mobile-2.0`: `git checkout mobile-2.0`
   - Clean up integration branch: `git branch -D test/mobile-master-merge`
