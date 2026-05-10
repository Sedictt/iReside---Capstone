# React Doctor Fix Progress

## jsx-a11y/click-events-have-key-events

### Fixed (12 instances)
| File | Line(s) | Status |
|------|---------|--------|
| `FeaturedPropertyCard.tsx` | 33, 91 | ✅ Fixed |
| `MessageBubble.tsx` | 140, 312, 322 | ✅ Fixed |
| `ClickSpark.tsx` | 149 | ✅ Fixed |
| `onboarding/[token]/page.tsx` | 909, 1252 | ✅ Fixed |
| `CommunityPostCard.tsx` | 358, 370 | ✅ Fixed |
| `UnitMapFeatureSection.tsx` | 96 | ✅ Fixed |
| `CommunityHeader.tsx` | 80 | ✅ Fixed |
| `move-out/preview/page.tsx` | 167 | ✅ Fixed |
| `PaymentModal.tsx` | 137, 191 | ✅ Fixed |

### Remaining (35 instances)
See original react-doctor output for full list.

### Fix Pattern
```tsx
// BEFORE:
<div onClick={handler} className="cursor-pointer">...</div>

// AFTER:
<div
  onClick={handler}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }}}
  tabIndex={0}
  role="button"
  className="cursor-pointer"
>
  ...
</div>
```

---

## jsx-a11y/label-has-associated-control

### Fixed (8 instances)
| File | Line(s) | Status |
|------|---------|--------|
| `onboarding/[token]/page.tsx` | 627, 661, 685, 696, 708, 738 | ✅ Fixed |
| `BillingOperationsPanel.tsx` | 593, 607 | ✅ Fixed |

### Remaining (46 instances)
| File | Lines |
|------|-------|
| `TenantSettings.tsx` | 918 |
| `RecordExpenseModal.tsx` | 103 |
| `LandlordProfile.tsx` | 219, 230 |
| `LandlordSettings.tsx` | 715 |
| `MessageReportWizard.tsx` | 228 |
| `WalkInApplicationModal.tsx` | 1211, 1226, 1241, 1261 |
| `MoveOutInspectionForm.tsx` | 234 |
| `tenant/maintenance/new/page.tsx` | 200 |
| `RentApplications.tsx` | 1539 |
| `environment/page.tsx` | 352, 369, 396, 415, 466, 499 |
| `test-verification/page.tsx` | 112, 126 |
| `properties/new/page.tsx` | 481, 490, 500, 530, 556 |
| `chat-moderation/page.tsx` | 400 |
| `AddAmenityModal.tsx` | 458, 515 |
| `VisualBuilder.tsx` | 580, 605, 617, 843, 4980, 4985, 4989, 4994 |
| `UtilityBillingDashboard.tsx` | 1054, 1065 |
| `UnitListingWizard.tsx` | 155, 172, 179, 239, 256 |
| `analytics/page.tsx` | 932, 981 |

### Fix Pattern
```tsx
// BEFORE (label without htmlFor):
<label className="...">Label Text</label>
<input ... />

// AFTER:
<label htmlFor="input-id" className="...">Label Text</label>
<input id="input-id" ... />

// OR for non-label elements that are just text:
<span className="...">Label Text</span>
```

---

## Other Fixed Issues

### react-doctor/server-auth-actions (4 false positives - documented)
Added `// eslint-disable-next-line react-doctor/server-auth-actions` comments to:
- `auth.ts:13` - `auth()` function (IS the auth utility)
- `auth.ts:26` - `requireUser()` function (IS the auth utility)
- `auth.ts:41` - `signUp()` function (public endpoint)
- `auth.ts:68` - `signIn()` function (public endpoint)

### react-doctor/effect-needs-cleanup (1 false positive)
- `NotificationContext.tsx:270` - Fixed early return to return cleanup function

### jsx-a11y/anchor-is-valid (6 instances)
- `cookie-consent.tsx:88` - Converted `<a href="#">` to `<button>`
- `page.tsx:854` - Converted social icons `<a>` to `<button>`
- `page.tsx:905-906` - Converted footer links `<a>` to `<button>`
- `signup/page.tsx:783` - Converted Terms/Privacy links `<a>` to `<button>`
