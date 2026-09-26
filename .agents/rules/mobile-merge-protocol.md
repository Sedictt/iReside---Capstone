---
trigger: always_on
---

# Mobile-to-Master Safe Merge Protocol

When merging updates from `mobile-2.0` to `master` for Vercel deployment, ALWAYS follow this verified safe protocol to protect both mobile and desktop experiences:

1. **Create Safety Backups**:
   - Create local backup tags/branches before touching anything:
     `git branch -f backup/master-pre-mobile-merge origin/master`
     `git branch -f backup/mobile-2.0-pre-merge mobile-2.0`

2. **Mobile UI Authority & Conflict Prevention**:
   - **Never overwrite mobile navigation**: Mobile-specific navigation components (`MobileSettingsCategoryDropdown`, bottom tab bar, mobile header) must NEVER be replaced by desktop fallback components (e.g. horizontal pill rails with "Swipe to reveal") during merge conflict resolution.
   - **Desktop header isolation**: Desktop-only elements (e.g. `< Dashboard` back links, cloud `Syncing...` background badges) must remain hidden on mobile viewports using `hidden lg:flex`.
   - **Persistent exclusions**: Keep the red `Danger` (Delete Account) tab excluded from `SUB_TABS.Data` for both Landlord and Tenant settings.
   - **Fast-Forward Priority**: If `mobile-2.0` is already rebased or up to date with master, use fast-forward promotion (`git merge mobile-2.0 --ff-only`) to avoid introducing unreviewed upstream desktop regressions into mobile views.

3. **Use an Isolated Integration Branch**:
   - Never merge directly on `master`.
   - Checkout fresh integration branch from `origin/master`:
     `git checkout -B test/mobile-master-merge origin/master`
   - Merge: `git merge mobile-2.0`

4. **Verify Shared Types & Deduplication**:
   - Check `src/lib/billing/server.ts` for duplicate properties (e.g. `paymentProofUrl`).
   - Check `src/types/database.ts` ensuring `Profile` type has `first_name?: string | null` and `last_name?: string | null` for mobile compatibility.
   - Run `npm install` if new dependencies were added on master.

5. **Mandatory Build & Type Verification**:
   - Run `npx tsc --noEmit` and ensure 0 TypeScript errors.
   - Run `npx vitest run src/__tests__/validation` and verify all validation tests pass.
   - Run `npm run build` and ensure Next.js builds all desktop and mobile routes successfully.

6. **Promote to Master**:
   - `git checkout master`
   - `git pull origin master`
   - `git merge test/mobile-master-merge -m "feat(mobile): integrate updates into master"`
   - `git push origin master`

7. **Return to Working Branch**:
   - Always return to `mobile-2.0`: `git checkout mobile-2.0`
   - Clean up integration branch: `git branch -D test/mobile-master-merge`
