---
trigger: always_on
---

# UI/UX Engineering Standards & Conventions

These standards govern visual hierarchy, interaction ergonomics, mobile responsiveness, accessibility, and component quality across all pages of the iReside workspace. They complement the domain-specific invariants in `ui-constraints.md` and `onboarding-rules.md`.

---

## 1. Spatial Rhythm, Layout Hierarchy & Radii
- **8pt / 4pt Spatial Scale**: All margins, paddings, and layout gaps must strictly align with multiples of 4px or 8px (e.g., 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px). Avoid arbitrary "magic numbers" (e.g., `gap-[13px]`, `p-[19px]`).
- **Surface Elevation & Neumorphic Harmony**:
  - Use `.neumorphic-panel` for primary cards and workspace sections, and `.neumorphic-extruded` / `.neumorphic-inset` for interactive tiles and embedded controls.
  - In High Contrast / Accessibility Mode (`.high-contrast` or `[data-high-contrast="true"]`), all soft neumorphic shadows automatically collapse into solid 2px high-contrast borders for WCAG AAA compliance.
- **Border Radius Hierarchy**:
  - **Outer Cards & Section Containers**: `rounded-2xl` (16px) up to `rounded-[2.5rem]` (40px) for prominent neumorphic panels. Always ensure generous internal padding (`p-6` to `p-8`) so content does not collide with rounded corners.
  - **Inner Controls (Buttons, Inputs, Selects, Dropdowns)**: Clamped between `rounded-lg` (8px) and `rounded-xl` (12px).
  - **Status Badges, Filter Chips & Avatars**: Strictly `rounded-full`.
- **Predictable Z-Index Scale**:
  - `z-0`: Base canvas / page content
  - `z-10` to `z-20`: Sticky navigation headers, table headers, and sub-nav bars
  - `z-30`: Dropdown menus, popovers, and date/time pickers
  - `z-40`: Floating bulk action bars and fixed bottom navigation sheets
  - `z-50`: Modal backdrops, slide-over drawers, and full-screen dialogs
  - `z-[70]` to `z-[100]`: System toasts, snackbars, and global tooltips
  - `z-[250]`: Persistent guided tour spotlights and onboarding overlays (as defined in `onboarding-rules.md`)

---

## 2. Typography, Scannability & Numerical Alignment
- **Typographic Scale & Contrast**:
  - Establish clear hierarchy through weight (`font-bold` / `font-semibold` vs `font-normal`) and foreground color tokens (`text-foreground` vs `text-muted-foreground`), maintaining a scale ratio >= 1.25 between levels.
  - Limit body copy line length to `65ch–75ch` (`max-w-prose` or `max-w-2xl`) to maintain rapid reading comprehension.
- **Headings Discipline**:
  - Maximum hero heading clamp: `<= 6rem` (~96px).
  - Letter spacing floor: Heading tracking must not drop below `-0.04em` (prevents character collisions).
  - Apply `text-wrap: balance` to H1–H3 headings to avoid orphan words; apply `text-wrap: pretty` to multi-line narrative copy.
- **Data Table & Quantitative Alignment (Strict Invariant)**:
  - **Numeric & Financial Values**: Must ALWAYS be **right-aligned** and formatted with `tabular-nums` (or `font-mono`). This ensures decimals, commas, and currency amounts align vertically for effortless scannability.
  - **Textual Data**: Always **left-aligned**.
  - **Table Headers**: Must match the exact horizontal alignment of their column data (e.g., right-align "Total Due" and "Meter Reading" headers). Never center numbers in data tables.

---

## 3. Accessibility & Touch Targets (WCAG 2.2 AA / AAA)
- **Contrast Thresholds**:
  - Body text and form labels: Minimum **4.5:1** contrast against background.
  - Large text (>=18px or bold >=14px) and essential graphical UI controls: Minimum **3:1** contrast.
- **No Color-Alone Semantics (WCAG SC 1.4.1)**:
  - Status indicators (Vacant, Occupied, Overdue, Paid, Pending) must NEVER rely solely on color.
  - Always pair color badges with clear text labels and/or a distinct semantic icon (e.g., `CheckCircle2` for Paid, `Clock` for Pending, `AlertTriangle` for Overdue).
- **Touch Target Discipline (Apple HIG & Material 3)**:
  - Mouse pointer minimum target: **24x24px** (WCAG 2.2 SC 2.5.8).
  - Mobile touch target minimum: **44x44px** (iOS) / **48x48px** (Android).
  - When visual button/icon dimensions are smaller (e.g. `size-8` or `h-8`), expand the interactive hitbox using padding, negative margins, or invisible pseudo-elements (`after:absolute after:-inset-2`).
- **Focus Indicators & Obscuration (WCAG 2.2 SC 2.4.11 & 2.4.13)**:
  - Never remove focus rings (`outline: none`) without an explicit `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` replacement.
  - Focused interactive elements must not be obscured by sticky headers or floating overlays.
- **Reduced Motion (WCAG SC 2.3.3)**:
  - Every CSS transition, view fade, or pulsing beacon (`animate-ping`) must respect `@media (prefers-reduced-motion: reduce)` by falling back to instant transitions or static indicators.

---

## 4. Form UX & Error Recovery
- **"Reward Early, Punish Late" Validation Flow**:
  - **Punish Late**: Do not scold users while they type. Show initial validation errors only upon field `blur` or form `submit`.
  - **Reward Early**: As soon as an input displays an error, switch to real-time `onChange` validation so the error message and red border dismiss immediately the instant valid data is entered.
- **Never Use Preemptively Disabled Submit Buttons**:
  - Keep form submit buttons interactive even if required fields are empty.
  - If the user clicks submit with invalid fields, trigger inline validation, display clear error alerts (`AlertCircle`), and automatically focus the first invalid input.
  - Disabling submit buttons is ONLY permitted *after* submission begins to prevent duplicate requests (pair with `disabled`, `aria-busy="true"`, and a loading spinner).
- **Single-Column Flow & Top-Aligned Labels**:
  - Default to single-column form layouts. Multi-column layouts are strictly reserved for inherently paired fields (First + Last Name, City + Zip).
  - Always use persistent top-aligned labels. Never use placeholder text as a substitute for labels.
  - Never include form "Reset" or "Clear" buttons (risk of accidental data loss).
- **Layout Shift Prevention on Loading**:
  - When buttons enter the loading state, maintain their exact dimensions (`min-w-[...]` or fixed width) so surrounding layout elements do not jump.
- **Destructive Action Confirmation**:
  - Permanent operations (delete property, terminate lease, evict, reject) must require a confirmation modal.
  - Confirm buttons must state the exact affirmative verb (e.g., "Delete Property", "Terminate Lease"), never generic "OK" or "Yes", and must use `variant="destructive"`.

---

## 5. Mobile Responsiveness & Android APK Standards
- **Bottom Sheets over Centered Dialogs**:
  - On viewports `< 640px` (mobile), replace centered modal dialogs with bottom sheets (`Drawer` sliding from the bottom) featuring a top drag handle. Centered dialogs on mobile cause keyboard occlusion and awkward scrolling.
- **Safe Area Insets**:
  - Fixed top headers must include `pt-[env(safe-area-inset-top,0px)]`.
  - Fixed bottom navigation bars and floating action buttons must include `pb-[env(safe-area-inset-bottom,0px)]` to prevent overlap with native gesture bars.
- **Virtual Keyboard Clearance**:
  - Input fields inside dialogs and forms must provide `scroll-margin-bottom: 2rem` so focusing an input smoothly scrolls it into view above the Android/iOS virtual keyboard.
- **Overscroll Containment**:
  - Apply `overscroll-behavior-y: contain` to scrollable modal bodies and drawer sheets to prevent accidental pull-to-refresh or window bouncing.
- **Hardware / Gesture Back Handling**:
  - Modal backdrops, slide-overs, and popups must register `Escape` key and popstate events so Android hardware/gesture back dismisses the topmost modal before navigating away from the page.

---

## 6. Data Tables & High-Density SaaS Views
- **Responsive Mobile Transformation (Stacked Cards)**:
  - Data tables with more than 3 columns must gracefully transform into stacked card rows on mobile viewports (`< 768px`), displaying key-value pairs with prominent header identifiers (e.g. Unit Number, Tenant Name).
  - If a table must remain horizontal on mobile, freeze the primary identifier column on the left (`sticky left-0 bg-background z-10`) and display an explicit horizontal scroll indicator.
- **Dual Empty States**:
  - **Zero-Data State**: When no records exist in the system, show an empty state with a domain icon, an encouraging explanation, and a primary CTA button to create the first record ("Add First Tenant").
  - **Zero-Results Filter State**: When search or filters return 0 matches, display "No results found matching '[Query]'" accompanied by a secondary CTA button: "Clear All Filters".
- **Sticky Bulk Actions Toolbar**:
  - When multi-row selection is active, display a floating, sticky action toolbar (`fixed bottom-6 left-1/2 -translate-x-1/2 z-40`) displaying the selection count ("3 leases selected") and contextual bulk actions ("Mark as Paid", "Export", "Deselect All").
- **Truncation with Inspection**:
  - Text cells subject to truncation (`truncate` / `line-clamp-1`) must always provide a hover `title` attribute or tooltip, or an inline 1-click copy button (`CopyButton`) for IDs, email addresses, and tracking codes.

---

## 7. System Feedback, Skeletons & Optimistic UI
- **The 4 State Invariant**:
  Every data-driven container (table, grid, summary card) must handle:
  1. Default populated state
  2. Loading skeleton state (mirrors final geometry)
  3. Empty state (with actionable CTA)
  4. Error / retry state (with distinct message and "Try Again" trigger)
- **Skeletons vs. Spinners**:
  - Use skeleton loaders (`Skeleton` with subtle shimmer) for page sections and tables taking >500ms to load.
  - Use spinners exclusively for inline action buttons or brief modal submissions.
- **Optimistic UI with Actionable Rollback**:
  - Immediate visual updates for high-frequency toggles (star, archive, bookmark).
  - If the server request fails, roll back state immediately and display a sticky error toast with a "Retry" button.
- **Toast Notification Discipline**:
  - Success/Info toasts: Auto-dismiss within 3 to 4 seconds.
  - Error/Failure toasts: Must remain visible until dismissed or retried, providing actionable error details.
  - Limit active toasts to a maximum of 3 concurrent items to prevent screen clutter.

---

## 8. Anti-AI Slop & Clean SaaS Copy
- **Semantic Iconography**: Use functional, domain-specific icons (Lucide icons like `Home`, `Shield`, `FileText`, `CheckCircle2`). Strictly avoid decorative sparkles (`Sparkles`), magic wands, or AI-generated visual fluff unless an actual generative AI feature is being executed.
- **No Eyebrow Clutter**: Do not place tracked uppercase kicker labels (e.g., `01 PROCESS`, `ABOUT`, `FEATURES`) above every section heading as a generic template reflex.
- **No Gradient Text**: Avoid `background-clip: text` gradient headings. Deliver emphasis through typographic weight, clean sizing, and high-contrast ink colors.
- **Clear Micro-Copy**:
  - Button text must follow `[Action Verb] + [Target Object]` (e.g., "Add Property", "Save Lease", "Send Invitation").
  - Use straightforward language instead of inflated buzzwords (e.g., "Move-In Balance" instead of "Inception Settlement", "Late Fee Policy" instead of "Default Penalty Governance").

---

## 9. Sidebar Navigation & Layout Architecture (UX Best Practices)
- **Flat 2D Visual Discipline & Scannability**:
  - Sidebar navigation items must NEVER be styled as extruded 3D cards, embossed tiles, or heavy neumorphic bevels.
  - Navigation items must remain clean, flat list elements with subtle hover fills (`hover:bg-muted/60` or `hover:bg-accent`).
  - **Active State Invariant**: The active navigation item must be signaled with a clear 2D indicator:
    - Background tint: `bg-primary/10 text-primary font-bold`
    - Left edge accent bar: `<span className="absolute left-0 h-6 w-1 rounded-r-full bg-primary" aria-hidden="true" />`
    - No heavy box-shadows or floating card offsets on active items.
- **Optimal Widths & Ergonomics**:
  - Expanded desktop sidebar width must be clamped between **260px and 280px** to balance label readability and main workspace area.
  - Collapsed icon-only rail width must be clamped between **72px and 80px**.
- **Vertical Hierarchy & Information Architecture**:
  - **Top Anchor**: Property switcher / workspace context selector at the very top (`h-14` to `h-16`).
  - **Primary Core**: High-frequency operational hub (Dashboard) immediately following the workspace selector.
  - **Frequency-Based Categorization**: Group operational destinations into clear semantic sections (e.g., Core, Residents, Finance, Operations) separated by subtle dividers (`border-border/40`).
  - **Collapsible Section Folders**: Low-frequency or sub-operational sections must support collapse/expand to manage visual depth and reduce cognitive load.
- **Progressive Disclosure & Collapsed State Tooltips**:
  - Collapsing the sidebar must never hide navigational meaning.
  - When collapsed, every icon button MUST trigger a high-contrast right-aligned tooltip (`Tooltip side="right" sideOffset={18}`) revealing the full page label, locked status, and any active badge counts.
- **Notification & Status Badges**:
  - Numeric notification counters must be compact, right-aligned circular/capsule badges (`bg-red-500 text-white text-[10px] font-bold px-1.5 h-5 min-w-[20px] rounded-full`).
  - Avoid pulsing animations (`animate-ping`) on badge counters unless indicating a critical real-time incident or urgent landlord blocking state.
- **Footer & Utility Persistence**:
  - Non-navigational utilities (Language toggle, Profile, Log Out) must be pinned at the bottom footer separated by `border-t border-border/40`.
  - Log out and destructive actions must use restrained semantic styling (`hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`).

