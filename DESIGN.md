# iReside UI/UX Design System

Status: active  
Last updated: 2026-04-15  
Audience: AI agents and engineers building new frontend modules for iReside

---

## 1. Purpose

This document is the implementation design system for iReside frontend work.  
Use it when creating any new module/page/component so output is:

- Visually consistent with existing iReside surfaces.
- UX-complete (loading, empty, error, success, and edge states).
- Accessible and responsive.
- Compatible with current Next.js + Tailwind + token architecture.

If this document conflicts with runtime agent instructions, follow runtime instructions first, then update this file.

---

## 2. Product UX Intent

iReside is an operational platform. UI should feel:

- Calm and trustworthy.
- Dense enough for productivity, not cluttered.
- Fast to scan and act on.
- Role-aware (admin, landlord, tenant each has a different tone).

Design priorities:

1. Clarity before decoration.
2. Actionability before novelty.
3. Predictable patterns across modules.
4. Visual hierarchy through spacing, contrast, and typography.

---

## 3. Source of Truth Map

Use this order when deciding style behavior:

1. `src/app/globals.css`  
Semantic tokens, light/dark values, theme mapping, key animations.

2. Existing role layouts and shells  
`src/app/admin/layout.tsx`  
`src/app/landlord/layout.tsx`  
`src/app/tenant/layout.tsx`

3. Existing role components  
`src/components/admin/*`  
`src/components/landlord/*`  
`src/components/tenant/*`

4. Utility helper  
`src/lib/utils.ts` (`cn` helper)

Note:

- `src/styles/design-tokens.css` and `src/styles/globals.css` exist but are not imported by app shell; treat as legacy/reference only unless explicitly reintroduced.

---

## 4. Frontend Stack & Styling Model

- Framework: Next.js App Router (`next@16`) + React 19 + TypeScript
- Styling: Tailwind CSS v4 with semantic CSS custom properties in `src/app/globals.css`
- Theme: `next-themes` via `ThemeProvider`
- Motion: Framer Motion and GSAP (landing and transition-heavy surfaces)
- Icons: `lucide-react`

Core rule:

- Prefer semantic Tailwind tokens (`bg-card`, `text-muted-foreground`, `border-border`, `bg-primary/10`) over hardcoded colors.
- Hardcoded visual treatments are allowed only when matching an existing specialized surface (e.g., admin cinematic shell, marketing scrollytelling).

---

## 5. Theme & Token System

### 5.1 Core Semantic Tokens

Defined in `src/app/globals.css`:

- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--input`
- `--border`
- `--muted`
- `--muted-foreground`
- `--secondary`
- `--secondary-foreground`
- `--primary`
- `--primary-foreground`
- `--primary-rgb`

Default (light) character:

- Soft cool background (`#f3f5f9`)
- Dark text (`#0f172a`)
- Sage primary (`#6d9838`)

Dark mode character:

- Near-black base (`#0a0a0a`)
- High-contrast text
- Same primary family for continuity

### 5.2 Brand Color Behavior

- Primary: `#6d9838` (sage green)
- Hover dark: `#5a7e2f`
- Accent light: `#89b84f`

Use primary for:

- Primary CTAs
- Active navigation indicators
- Important status emphasis
- Focus/selection accents

Do not overuse primary backgrounds for large dense text regions.

### 5.3 Status Color Conventions

Observed platform status conventions:

- Success/paid/healthy: emerald (`emerald-500` family)
- Warning/near due/review: amber (`amber-500` family)
- Error/blocked/urgent: red (`red-500` family)
- Informational/system: blue (`blue-500` family)

Status badges should use tinted backgrounds:

- Example: `bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`

### 5.4 Radius & Surface Language

Current radius system in production UI:

- Small controls: `rounded-lg` / `rounded-xl`
- Standard cards: `rounded-2xl`
- Feature containers: `rounded-3xl` or `rounded-[2rem]`
- Hero/major panels: `rounded-[2.5rem]`

Rule:

- Keep radius scale consistent inside a module.
- Avoid mixing `rounded-md` with `rounded-3xl` in the same card family.

### 5.5 Shadows & Depth

Common patterns:

- Light shell: `shadow-sm`, `shadow-xl`, or subtle custom shadow
- Dark/glass shell: stronger blurred shadows (e.g., `shadow-[0_0_50px_rgba(...)]`)
- Overlay components: strong elevation with blur backdrop

Prefer depth hierarchy:

1. Base page
2. Card
3. Sticky/top bars
4. Modal/drawer
5. Global overlays

---

## 6. Role-Based Visual Languages

### 6.1 Landlord Surface

Tone:

- Operational, structured, productivity-first.

Shell:

- Fixed sidebar (`w-64`) and optional right support rail.
- Main canvas uses `bg-background` and tokenized cards.

Typical card style:

- `rounded-3xl border border-border bg-card p-6 shadow-sm`

### 6.2 Tenant Surface

Tone:

- Friendly but utility-focused.

Shell:

- Desktop fixed sidebar (`md:w-64`), mobile drawer for small screens.
- Subtle grid and radial background treatment in layout.
- Max content width usually around `max-w-7xl`.

### 6.3 Admin Surface

Tone:

- High-contrast command center.

Shell:

- Cinematic dark glass style with radial/noise overlays.
- Large rounded panels (`rounded-[2.5rem]`) and dramatic depth.

Use this style for admin pages only.  
Do not copy this visual intensity to landlord/tenant modules by default.

### 6.4 Public/Auth Surface

Tone:

- Brand-forward, marketing-like.

Examples:

- Split-screen auth pages.
- Scrollytelling landing with GSAP.

This is separate from app-internal module styling.

---

## 7. Layout Architecture Rules

### 7.1 Page Composition Pattern

Use this module structure:

1. Page header section (title, subtitle, primary actions).
2. KPI/summary strip (optional).
3. Main content grid/list/canvas.
4. Supporting drawers/modals/toolbars.

### 7.2 Width and Spacing

Preferred spacing rhythm:

- Section gaps: `gap-6` to `gap-8`
- Page padding: `p-6` mobile, `md:p-8` desktop
- Card internal padding: `p-5`, `p-6`, or `p-8`

Common width constraints:

- `max-w-7xl` for standard content pages.
- Full-bleed for immersive views (chat, map, onboarding).

### 7.3 Immersive vs Standard Mode

Standard:

- Sidebar + centered content container.

Immersive:

- Full-height layout, often no sidebar offset.
- Used for message canvases, map views, onboarding flows.

---

## 8. Component Design Standards

### 8.1 Navigation

Desktop sidebar requirements:

- Group nav by labeled sections.
- Active item must be obvious (tint, icon color, subtle background).
- Include logout in footer region.

Mobile nav requirements:

- Top mobile trigger bar.
- Slide-in drawer + dim backdrop.
- Close on route selection.

### 8.2 Header Blocks

Every module page should have:

- Clear title.
- Short context subtitle.
- One to three high-priority actions.

Avoid overloading header with low-priority controls.

### 8.3 Cards

Primary card recipe:

```tsx
<section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
  {/* content */}
</section>
```

Enhanced glass recipe (specialized surfaces):

```tsx
<section className="rounded-[2.5rem] border border-white/5 bg-[#0F0F12]/80 p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
  {/* content */}
</section>
```

### 8.4 Forms

Form control rules:

- Label every field.
- Use consistent input style within module.
- Provide helper/error text near control.
- Keep primary submit action persistent and obvious.

Preferred input baseline:

`rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground`

### 8.5 Tables/Lists

For dense operational data:

- Use card-wrapped sections.
- Add quick filters/search at top.
- Show status badge per row.
- Provide clear empty and loading states.

### 8.6 Modals and Drawers

Overlay baseline:

- Backdrop: `bg-background/75 backdrop-blur-sm` (or role equivalent)
- Container: rounded, bordered, elevated surface
- Sticky header for long-content dialogs
- Explicit close affordance + keyboard escape support

Use modal for focused, interruptive actions.  
Use side panel for contextual editing/review.

### 8.7 Chat and Composer Patterns

Chat modules should include:

- Message bubble role distinction
- Delivery/read status feedback where applicable
- Attachment affordances
- Policy/moderation feedback UI
- Typing/loading placeholders

---

## 9. State Design Requirements (Mandatory)

Every new module must implement all relevant states:

1. Initial loading
2. Refetch/loading-in-place
3. Empty
4. Error
5. Success/confirmation
6. Disabled/permission-restricted

State block patterns:

Loading:

```tsx
<div className="rounded-2xl border border-border bg-muted/40 p-4 animate-pulse" />
```

Empty:

```tsx
<div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
  No records yet.
</div>
```

Error:

```tsx
<div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-300">
  Unable to load data right now.
</div>
```

---

## 10. Motion System

### 10.1 Global Principles

- Motion should communicate state change, not decoration only.
- Keep transitions smooth but short enough for productivity surfaces.
- Use stronger cinematic motion only on public/marketing or designated hero surfaces.

### 10.2 Current Motion Tools

- Framer Motion for component-level enter/exit and micro-flow transitions.
- GSAP for large scrollytelling and advanced timeline choreography.
- Custom keyframes in `src/app/globals.css` for lightweight effects.

### 10.3 Timing Guidelines

- Micro interactions: ~150-250ms
- Panel/card transitions: ~250-450ms
- Page transitions (special): up to ~900ms if clearly intentional

Respect reduced motion where feasible; avoid mandatory long chained animations in critical workflows.

---

## 11. Typography & Content Design

### 11.1 Fonts

- Primary app body: Geist Sans via `--font-geist-sans`
- Mono data contexts: Geist Mono via `--font-geist-mono`
- Display accent where needed: Manrope

### 11.2 Type Hierarchy

- Page titles: bold/black, tight tracking
- Section labels: small uppercase tracking for grouping
- Body text: readable contrast and moderate line-height
- Metadata: muted, compact, secondary emphasis

### 11.3 Copy Rules

- Use task-driven language.
- Keep labels concrete and short.
- Avoid marketing language inside operations screens.
- Error copy should explain next action when possible.

---

## 12. Accessibility Baseline

Required for every module:

- Keyboard navigable controls.
- Visible focus indicators.
- Proper label association for form elements.
- Icon-only buttons include `aria-label`.
- Sufficient text/background contrast in both light and dark themes.
- Logical heading and landmark structure.

For overlays:

- Trap focus.
- Allow keyboard dismissal unless intentionally blocked.
- Restore focus to opener on close.

---

## 13. Responsive Behavior Rules

- Mobile first; progressively enhance for `md`, `lg`, `xl`.
- Collapse sidebars into drawers on mobile.
- Convert multi-column dashboards to single-column stack on small screens.
- Preserve primary action visibility without requiring horizontal scroll.

Breakpoints should change layout density, not remove critical actions.

---

## 14. Performance & Reliability (Frontend)

For new modules:

- Avoid unnecessary client components; prefer server components unless interactivity is needed.
- Debounce heavy search/filter inputs.
- Use optimistic or skeleton rendering for long-fetch views.
- Use `AbortController` for cancellable fetches in effects.
- Keep expensive render loops memoized where practical.

Do not block the entire page for local section refresh if partial loading UI can be used.

---

## 15. AI Agent Build Workflow (UI Modules)

When adding a new UI module, follow this sequence:

1. Identify destination surface:
   - `admin`, `landlord`, `tenant`, or public/auth.
2. Reuse existing shell/layout; do not create a new one unless required.
3. Draft page sections:
   - header, summary, main content, supporting overlay.
4. Use semantic tokenized classes first.
5. Implement all required UX states.
6. Add responsive behavior and accessibility pass.
7. Validate visual consistency against nearby modules.

---

## 16. Module Scaffolds

### 16.1 Standard Module Page Scaffold

```tsx
export default function NewModulePage() {
  return (
    <div className="flex h-full w-full flex-col gap-8 bg-background p-6 text-foreground md:p-8">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Module Title</h1>
        <p className="mt-2 text-sm text-muted-foreground">Short operational context.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">KPI A</div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">KPI B</div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">KPI C</div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        Main content
      </section>
    </div>
  );
}
```

### 16.2 Confirm Modal Scaffold

```tsx
<div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/75 backdrop-blur-sm p-4">
  <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
    <h3 className="text-lg font-bold text-foreground">Confirm action</h3>
    <p className="mt-2 text-sm text-muted-foreground">Explain impact before user confirms.</p>
    <div className="mt-4 flex justify-end gap-2">
      <button className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</button>
      <button className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">Confirm</button>
    </div>
  </div>
</div>
```

---

## 17. Do/Do Not

Do:

- Use `cn()` for class composition.
- Reuse patterns from adjacent role modules.
- Keep components focused and composable.
- Design states first, then polish.

Do not:

- Introduce a totally new visual language for one module.
- Hardcode random hex values when semantic tokens exist.
- Ship pages without loading/empty/error handling.
- Hide permissions in UI only without backend checks.
- Overanimate dense productivity views.

---

## 18. Definition of Done (UI/UX)

A frontend module is done only when all are true:

- [ ] Uses correct role shell and navigation conventions.
- [ ] Uses semantic tokenized styling for core surfaces.
- [ ] Includes loading, empty, error, and success states.
- [ ] Fully responsive at mobile and desktop sizes.
- [ ] Keyboard accessible with visible focus states.
- [ ] No obvious visual drift from nearby modules.
- [ ] Motion is purposeful and not disruptive.
- [ ] Copy is concise, clear, and action-oriented.

---

## 19. Quick Agent Prompt Template

Use this internally before coding:

```md
Build a new [ROLE] module at [ROUTE].
- Follow DESIGN.md UI system.
- Use semantic tokens from src/app/globals.css.
- Match [ROLE] shell/navigation patterns.
- Include loading, empty, error, success states.
- Mobile + desktop responsive.
- Accessible labels, focus states, and keyboard handling.
- Reuse existing iReside card/list/modal patterns.
```

---

## 20. Maintenance

Update this file whenever:

- Theme tokens change.
- A new role shell or module family is introduced.
- A recurring UI pattern becomes standard.
- Accessibility or interaction standards evolve.

This document should evolve with shipped UI, not stay theoretical.

