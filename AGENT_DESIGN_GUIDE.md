# iReside Agent Design Guide
> Comprehensive UI/UX, HCI, and design system reference for AI coding agents building iReside frontend modules.

---

## Table of Contents

1. [How to Use This Guide](#1-how-to-use-this-guide)
2. [iReside Design System](#2-ireside-design-system)
3. [HCI Principles](#3-hci-principles)
4. [Ergonomics in UI Design](#4-ergonomics-in-ui-design)
5. [UX Laws Reference](#5-ux-laws-reference)
6. [Dark Mode Specification](#6-dark-mode-specification)
7. [Universal Web Design Principles](#7-universal-web-design-principles)
8. [Component Patterns](#8-component-patterns)
9. [State Design](#9-state-design)
10. [Motion System](#10-motion-system)
11. [Accessibility Baseline](#11-accessibility-baseline)
12. [Responsive Behavior](#12-responsive-behavior)
13. [Performance Rules](#13-performance-rules)
14. [Agent Build Workflow](#14-agent-build-workflow)
15. [Module Scaffolds](#15-module-scaffolds)
16. [QA Checklist](#16-qa-checklist)
17. [Definition of Done](#17-definition-of-done)
18. [Anti-Patterns to Avoid](#18-anti-patterns-to-avoid)

---

## 1. How to Use This Guide

This document is the authoritative design reference for AI agents and engineers building frontend modules for iReside. Before writing a single line of UI code, read the relevant sections below.

**Decision order when conflicts arise:**

1. Runtime agent instructions (highest authority)
2. This guide
3. Adjacent existing module patterns
4. General best practice

**When to consult which section:**

| Task | Sections to Read |
|---|---|
| Building a new page | §2, §8, §9, §14, §15 |
| Styling a component | §2.4–2.6, §6, §8 |
| Implementing dark mode | §6 |
| Writing copy for UI | §2.11, §7 |
| Adding motion/animation | §10 |
| Ensuring accessibility | §11 |
| Debugging visual inconsistency | §2, §18 |
| Pre-ship QA | §16, §17 |

---

## 2. iReside Design System

### 2.1 Product UX Intent

iReside is an operational platform. Every design decision should support these qualities:

- **Calm and trustworthy** — users manage real property and money; the UI must feel stable.
- **Dense enough for productivity, not cluttered** — show data efficiently without overwhelming.
- **Fast to scan and act on** — tasks should be completable in seconds, not minutes.
- **Role-aware** — admin, landlord, and tenant users have distinct mental models and contexts.

**Design priorities (in order):**

1. Clarity before decoration
2. Actionability before novelty
3. Predictable patterns across modules
4. Visual hierarchy through spacing, contrast, and typography

---

### 2.2 Frontend Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router (next@16) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + semantic CSS custom properties |
| Theme | `next-themes` via `ThemeProvider` |
| Motion | Framer Motion, GSAP |
| Icons | `lucide-react` |

**Core rule:** Prefer semantic Tailwind tokens (`bg-card`, `text-muted-foreground`, `border-border`, `bg-primary/10`) over hardcoded colors in every situation. Hardcoded visual treatments are allowed only when matching a specialized existing surface (e.g. admin cinematic shell).

---

### 2.3 Source of Truth Map

When deciding how to style a component, check sources in this order:

1. `src/app/globals.css` — semantic tokens, light/dark values, key animations
2. Existing role layouts: `src/app/admin/layout.tsx`, `src/app/landlord/layout.tsx`, `src/app/tenant/layout.tsx`
3. Existing role components: `src/components/admin/*`, `src/components/landlord/*`, `src/components/tenant/*`
4. Utility helper: `src/lib/utils.ts` (`cn` helper)

> Note: `src/styles/design-tokens.css` and `src/styles/globals.css` exist but are not imported by the app shell. Treat as legacy/reference only unless explicitly reintroduced.

---

### 2.4 Token System

#### Core Semantic Tokens (from `src/app/globals.css`)

```
--background
--foreground
--card
--card-foreground
--input
--border
--muted
--muted-foreground
--secondary
--secondary-foreground
--primary
--primary-foreground
--primary-rgb
```

**Light mode character:**
- Soft cool background: `#f3f5f9`
- Dark text: `#0f172a`
- Sage primary: `#6d9838`

**Dark mode character:**
- Near-black base: `#0a0a0a`
- High-contrast text
- Same primary family for continuity

---

### 2.5 Brand Color

| Role | Value |
|---|---|
| Primary | `#6d9838` (sage green) |
| Hover dark | `#5a7e2f` |
| Accent light | `#89b84f` |

**Use primary for:** primary CTAs, active navigation indicators, important status emphasis, focus/selection accents.

**Do not use primary for:** large backgrounds, dense text regions, large cards by default.

---

### 2.6 Status Colors

| Status | Tailwind Family | Example Badge |
|---|---|---|
| Success / paid / healthy | `emerald-500` | `bg-emerald-500/10 text-emerald-500 border border-emerald-500/20` |
| Warning / near due / review | `amber-500` | `bg-amber-500/10 text-amber-500 border border-amber-500/20` |
| Error / blocked / urgent | `red-500` | `bg-red-500/10 text-red-500 border border-red-500/20` |
| Informational / system | `blue-500` | `bg-blue-500/10 text-blue-500 border border-blue-500/20` |

---

### 2.7 Radius System

| Context | Class |
|---|---|
| Small controls | `rounded-lg` / `rounded-xl` |
| Standard cards | `rounded-2xl` |
| Feature containers | `rounded-3xl` / `rounded-[2rem]` |
| Hero / major panels | `rounded-[2.5rem]` |

Keep radius scale consistent inside a module. Never mix `rounded-md` with `rounded-3xl` in the same card family.

---

### 2.8 Shadows and Depth

Depth layers from lowest to highest:

1. Base page
2. Card
3. Sticky/top bars
4. Modal/drawer
5. Global overlays

Common patterns:
- Light shell: `shadow-sm`, `shadow-xl`, or subtle custom shadow
- Dark/glass shell: `shadow-[0_0_50px_rgba(...)]`
- Overlay components: strong elevation with blur backdrop

---

### 2.9 Role-Based Visual Languages

#### Landlord Surface
- **Tone:** Operational, structured, productivity-first
- **Shell:** Fixed sidebar (`w-64`) + optional right support rail; main canvas uses `bg-background` and tokenized cards
- **Card style:** `rounded-3xl border border-border bg-card p-6 shadow-sm`

#### Tenant Surface
- **Tone:** Friendly but utility-focused
- **Shell:** Desktop fixed sidebar (`md:w-64`), mobile drawer; subtle grid/radial background treatment; `max-w-7xl` content width

#### Admin Surface
- **Tone:** High-contrast command center
- **Shell:** Cinematic dark glass with radial/noise overlays; large rounded panels (`rounded-[2.5rem]`); dramatic depth
- **Rule:** Do not copy this intensity to landlord/tenant modules

#### Public/Auth Surface
- **Tone:** Brand-forward, marketing-like
- **Examples:** Split-screen auth pages, scrollytelling landing with GSAP

---

### 2.10 Layout Architecture

#### Page Composition Pattern

Every page follows this structure:

1. Page header section (title, subtitle, primary actions)
2. KPI/summary strip (optional)
3. Main content grid/list/canvas
4. Supporting drawers/modals/toolbars

#### Spacing Rhythm

| Context | Value |
|---|---|
| Section gaps | `gap-6` to `gap-8` |
| Page padding (mobile) | `p-6` |
| Page padding (desktop) | `md:p-8` |
| Card internal padding | `p-5`, `p-6`, or `p-8` |
| Max content width | `max-w-7xl` |

Full-bleed is used for immersive views (chat, map, onboarding).

---

### 2.11 Typography

**Fonts:**
- App body: Geist Sans via `--font-geist-sans`
- Mono/data: Geist Mono via `--font-geist-mono`
- Display accent: Manrope

**Type hierarchy:**
- Page titles: bold/black, tight tracking
- Section labels: small uppercase for grouping
- Body text: readable contrast, moderate line-height
- Metadata: muted, compact, secondary emphasis

**Copy rules:**
- Use task-driven language
- Keep labels concrete and short
- Avoid marketing language inside operations screens
- Error copy should explain the next action when possible

---

## 3. HCI Principles

These principles govern every interaction decision. Apply all of them to every module.

### 3.1 Consistency
Ensure similar actions and elements are represented the same way throughout the interface. Reuse components and behaviors so users can transfer knowledge between tasks. Same action = same style, every time.

### 3.2 Feedback
Let users know the results of their actions immediately. Confirm success, signal errors, and show progress. Users should never wonder if their action was registered.

### 3.3 Visibility
Users should easily see and understand the current state of the system. Surface key state (cart count, unread messages, active filters) without requiring navigation away from the current task.

### 3.4 Error Prevention and Recovery
Make it easy to undo actions and recover from mistakes without significant consequences. Support undo, confirmation dialogs for destructive actions, and clear error messaging.

### 3.5 Constraints
Limit the range of possible actions to avoid unintended inputs or invalid selections. For example, restrict phone number fields to numeric input only. Don't allow users to reach invalid states.

### 3.6 Learnability
Provide brief tutorials, tooltips, and guided tours for new features. Users should be able to learn core interactions quickly without reading documentation.

### 3.7 Simplicity
Use minimalistic design so users can complete primary tasks without distraction. Every element on screen should earn its place. Remove what doesn't serve the user.

### 3.8 Mental Models
Design interfaces to align with users' real-world experiences. Use familiar metaphors (trash can for delete, magnifying glass for search) so users can apply existing knowledge.

### 3.9 Affordance
Make clear to users how to interact with each element. Buttons should look clickable, inputs should look editable, links should look like links. Never make users guess.

---

## 4. Ergonomics in UI Design

### 4.1 Human-Centered Design
Design starts from the individual characteristics of the user: their physical and cognitive abilities, their needs, and their goals. The goal is minimal onboarding and rapid adaptation to the product.

Ask before building: Who is using this? What problem are they solving? What is their context?

### 4.2 Efficiency
The interface should let users complete tasks with minimal resource cost in time and effort. Efficiency is not binary — it exists on a spectrum of "enough" and "not enough." Measure against real user tasks, not theoretical flows.

---

## 5. UX Laws Reference

These laws should directly influence component and layout decisions. When in doubt about a design choice, cross-reference here.

### Cognitive Laws

| Law | What it means for iReside |
|---|---|
| **Cognitive Load** | Minimize the number of decisions and pieces of information presented at once. Chunk complex data. |
| **Miller's Law** | Limit lists and navigation groups to ~7 items. Break large sets into chunks. |
| **Hick's Law** | More choices = slower decisions. Limit options per screen; use defaults and recommendations. |
| **Fitts's Law** | Larger and closer targets are easier to hit. Make primary buttons large; ensure thumb reach on mobile. |
| **Occam's Razor** | Among equally good solutions, choose the simpler one. |
| **Tesler's Law** | Every system has irreducible complexity. Don't hide it — manage it well. |
| **Doherty Threshold** | Keep system responses under 400ms for productive flow. Show skeletons and optimistic updates when necessary. |

### Perception Laws

| Law | What it means for iReside |
|---|---|
| **Law of Proximity** | Group related items visually. Use spacing to separate unrelated elements. |
| **Law of Similarity** | Elements that look alike will be perceived as a group. Use consistent card styles for consistent data types. |
| **Law of Common Region** | Elements in a defined boundary are perceived as a group. Use cards and panels to create clear regions. |
| **Law of Uniform Connectedness** | Visually connected elements feel more related. Use lines, dividers, and borders intentionally. |
| **Law of Prägnanz** | Users interpret complex visuals as the simplest possible form. Design clearly; avoid visual ambiguity. |
| **Von Restorff Effect** | What differs will be remembered. Use visual distinction sparingly and intentionally for critical actions. |

### Behavioral Laws

| Law | What it means for iReside |
|---|---|
| **Aesthetic-Usability Effect** | Attractive design is perceived as more usable. Polish matters, especially for trust. |
| **Jakob's Law** | Users expect your product to work like others they already know. Follow established patterns. |
| **Serial Position Effect** | Users remember first and last items best. Put important items at the start or end of lists. |
| **Goal-Gradient Effect** | Users increase effort as they get closer to a goal. Use progress indicators in multi-step flows. |
| **Zeigarnik Effect** | Incomplete tasks are remembered better than complete ones. Use this for onboarding and progress prompts. |
| **Peak-End Rule** | Users judge an experience by its peak and its end. Make success states and completion moments feel good. |
| **Pareto Principle** | 80% of outcomes come from 20% of causes. Prioritize the features and actions your users use most. |
| **Selective Attention** | Users focus on what's relevant to their goal. Remove distractions from task flows. |
| **Paradox of the Active User** | Users rarely read documentation — they click immediately. Design for instant comprehension. |
| **Choice Overload** | Too many options overwhelm users. Default to sensible choices; expose advanced options progressively. |
| **Chunking** | Break large sets of information into smaller, meaningful groups. |

---

## 6. Dark Mode Specification

### 6.1 Core Philosophy

Dark mode is not an inverted light theme. It is a separate visual system with its own surface, elevation, emphasis, and color rules.

**Principles:**

- Dark mode should feel calm, readable, layered, intentional, and visually restrained.
- Prioritize legibility over brand intensity. Saturated colors vibrate and bloom on dark backgrounds.
- Surfaces define the experience — rely on neutral dark surfaces, then use color strategically.
- Elevation must be visible. In dark themes, use lighter surfaces at higher elevations, since shadows alone are insufficient.
- Contrast should feel intentional. Readable text and visible controls matter more than achieving an ultra-minimal look.

---

### 6.2 Base Colors

**Recommended base surface:** `#121212`

Avoid pure black (`#000000`) for most product UI because it reduces depth separation, makes elevated surfaces harder to distinguish, and feels harsher than near-black.

Pure black is acceptable only for: true-black battery-saving modes, media viewers, cinema layouts, or OLED-specific settings.

For branded dark surfaces, tint the neutral base with the primary brand color at very low opacity rather than replacing it with a saturated fill.

---

### 6.3 Elevation Scale

In dark mode, elevated surfaces appear lighter, not just shadowed.

| Elevation | Surface Token | Hex |
|---|---|---|
| 0dp (page background) | `--color-background` | `#121212` |
| 1dp (card) | `--color-surface-1` | `#1E1E1E` |
| 2dp (card raised) | `--color-surface-2` | `#222222` |
| 3dp | `--color-surface-3` | `#242424` |
| 4dp (app bar) | `--color-surface-4` | `#272727` |
| 6dp (FAB) | `--color-surface-6` | `#2C2C2C` |
| 8dp | `--color-surface-8` | `#2E2E2E` |
| 12dp | `--color-surface-12` | `#333333` |
| 16dp (drawer) | `--color-surface-16` | `#343434` |
| 24dp (modal/dialog) | `--color-surface-24` | `#383838` |

Use these tokens instead of guessing arbitrary gray values per component.

---

### 6.4 Text Emphasis

Never use pure white for all text.

| Emphasis | Value | Use for |
|---|---|---|
| High | `rgba(255,255,255,0.87)` | Body text, headings, primary icons, selected labels |
| Medium | `rgba(255,255,255,0.60)` | Secondary text, helper text, supporting labels, unselected icons |
| Disabled | `rgba(255,255,255,0.38)` | Disabled labels, disabled icons, unavailable states |

---

### 6.5 Core Tokens

```css
:root[data-theme="dark"] {
  --bg: #121212;
  --surface: #121212;
  --surface-1: #1E1E1E;
  --surface-2: #222222;
  --surface-4: #272727;
  --surface-8: #2E2E2E;
  --surface-24: #383838;

  --text-primary: rgba(255,255,255,0.87);
  --text-secondary: rgba(255,255,255,0.60);
  --text-disabled: rgba(255,255,255,0.38);
  --divider: rgba(255,255,255,0.12);

  --primary: #BB86FC;
  --on-primary: #000000;
  --secondary: #03DAC6;
  --on-secondary: #000000;
  --error: #CF6679;
  --on-error: #000000;
}
```

---

### 6.6 Brand Color in Dark Mode

Brand colors appear brighter and louder against dark surfaces. Use them with restraint.

**Good uses for primary:**
- Primary buttons
- Links
- Selected navigation items
- Focus rings
- Toggles and selection controls
- Progress indicators

**Avoid primary for:**
- Entire screen backgrounds
- Large cards
- Long text passages
- Too many neighboring elements simultaneously

A brand color that works in light mode may need a slightly lighter tone and lower saturation in dark mode to avoid glow or vibration effects.

---

### 6.7 Dark Mode Common Mistakes

Never do these:

- Using pure black everywhere
- Using pure white for all text and icons
- Making every surface the same dark value
- Applying saturated brand colors to large backgrounds
- Depending on shadows alone for hierarchy
- Reducing contrast too much in the name of aesthetics
- Creating muddy layouts with too many near-identical grays
- Forgetting focus and disabled states

---

## 7. Universal Web Design Principles

### 7.1 Clarity Over Cleverness
Design should be immediately understandable. Users should never need to "figure out" how the UI works. Avoid ambiguous labels. Prioritize readability over stylistic flair.

### 7.2 Visual Hierarchy
Guide attention intentionally using size, contrast, and spacing. Primary actions must visually dominate. Limit competing elements per screen.

### 7.3 Simplicity — Progressive Disclosure
Remove anything that doesn't serve the user. Show only what's needed at each step. Minimize form fields. Reduce visual noise.

### 7.4 Trust and Credibility
Users trust designs that look professional and behave predictably. Show pricing clearly, avoid hidden fees, explain processes upfront. Social proof (testimonials, usage stats) increases confidence.

### 7.5 Feedback and Affordance
Users need confirmation of every action. Provide button states (hover, active, loading), success/error messages, and progress indicators. Elements should visually suggest how they are used.

### 7.6 Reduce Friction
Remove barriers to task completion. Fewer steps, autofill, guest options, smart defaults. Every added step reduces completion rates.

### 7.7 Clear Call-to-Action
Every page should have one clear primary goal. Use action-oriented text. Make the CTA visually dominant. One primary CTA per screen.

### 7.8 White Space
Space improves comprehension. Don't crowd elements. Use spacing to separate sections and improve scanability. Dense dark UIs can feel claustrophobic; allow breathing room.

### 7.9 Contrast and Color
Use high contrast for readability. Apply color consistently (red = error, green = success). Limit palette to avoid confusion. Never rely on color alone to convey meaning.

### 7.10 Accessibility
Sufficient color contrast, keyboard navigation, semantic HTML, alt text for images. See §11 for the full baseline.

---

## 8. Component Patterns

### 8.1 Navigation

**Desktop sidebar requirements:**
- Group nav by labeled sections
- Active item must be obvious (tint, icon color, subtle background)
- Logout in footer region

**Mobile nav requirements:**
- Top mobile trigger bar
- Slide-in drawer + dim backdrop
- Close on route selection

---

### 8.2 Header Blocks

Every module page must have:

- Clear title
- Short context subtitle
- One to three high-priority actions

Do not overload the header with low-priority controls.

```tsx
<section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
  <h1 className="text-2xl font-black tracking-tight text-foreground">Module Title</h1>
  <p className="mt-2 text-sm text-muted-foreground">Short operational context.</p>
  <div className="mt-4 flex gap-2">
    {/* Primary action button here */}
  </div>
</section>
```

---

### 8.3 Cards

**Standard card:**

```tsx
<section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
  {/* content */}
</section>
```

**Enhanced glass card (admin/specialized only):**

```tsx
<section className="rounded-[2.5rem] border border-white/5 bg-[#0F0F12]/80 p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
  {/* content */}
</section>
```

---

### 8.4 Forms

- Label every field
- Use consistent input style within module
- Provide helper/error text near the control
- Keep primary submit action persistent and obvious

**Input baseline:**

```tsx
<input className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
```

---

### 8.5 Tables and Lists

For dense operational data:

- Wrap in a card-sectioned container
- Add quick filters/search at top
- Show status badge per row
- Always include empty and loading states

---

### 8.6 Status Badges

```tsx
<span className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium">
  Paid
</span>
```

Swap `emerald` for `amber`, `red`, or `blue` for other statuses (see §2.6).

---

### 8.7 Modals and Drawers

**Backdrop:**

```tsx
<div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/75 backdrop-blur-sm p-4">
```

**Modal container:**

```tsx
<div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
```

**Rules:**
- Sticky header for long-content dialogs
- Explicit close affordance (X button) plus keyboard escape support
- Use modal for focused, interruptive actions
- Use side panel for contextual editing/review

---

### 8.8 Buttons

**Primary (contained):**

```tsx
<button className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
  Confirm
</button>
```

**Secondary (outlined):**

```tsx
<button className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
  Cancel
</button>
```

**Ghost/text:**

Use sparingly for low-emphasis actions. Ensure tappable area is obvious.

---

### 8.9 Chat and Composer Patterns

Chat modules must include:

- Message bubble role distinction (own vs. other)
- Delivery/read status feedback where applicable
- Attachment affordances
- Policy/moderation feedback UI
- Typing/loading placeholders

---

## 9. State Design

Every new module must implement all relevant states. This is non-negotiable.

| State | When to show |
|---|---|
| **Initial loading** | First data fetch |
| **Refetch / loading in place** | Background refresh while showing stale data |
| **Empty** | No records returned |
| **Error** | Fetch failed or API returned error |
| **Success / confirmation** | Action completed |
| **Disabled / permission-restricted** | User lacks permission |

---

### 9.1 Loading State

```tsx
<div className="rounded-2xl border border-border bg-muted/40 p-4 animate-pulse" />
```

Use skeletons that match the shape of the real content.

---

### 9.2 Empty State

```tsx
<div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
  No records yet.
</div>
```

For important empty states, include a primary action: "Add your first property."

---

### 9.3 Error State

```tsx
<div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-300">
  Unable to load data right now. Please try again.
</div>
```

---

### 9.4 Success State

Confirm completion with a clear visual signal: a success banner, toast notification, or updated status badge. Apply the Peak-End Rule (§5) — make completion moments feel good.

---

## 10. Motion System

### 10.1 Global Principles

- Motion communicates state change, not decoration
- Keep transitions smooth but short for productivity surfaces
- Use stronger cinematic motion only on public/marketing or designated hero surfaces
- Respect reduced motion preferences where feasible
- Avoid mandatory long chained animations in critical workflows

---

### 10.2 Tools

| Tool | Use for |
|---|---|
| Framer Motion | Component-level enter/exit, micro-flow transitions |
| GSAP | Large scrollytelling, advanced timeline choreography |
| Custom CSS keyframes (`src/app/globals.css`) | Lightweight repeating effects |

---

### 10.3 Timing Guidelines

| Type | Duration |
|---|---|
| Micro interactions | ~150–250ms |
| Panel / card transitions | ~250–450ms |
| Page transitions (special) | Up to ~900ms if clearly intentional |

---

### 10.4 Motion Rules for Dark Mode

- Use shorter, refined transitions
- Avoid large bright flashes
- Prefer opacity, elevation, and transform changes over luminous effects
- Ensure loading states do not produce harsh flicker

---

## 11. Accessibility Baseline

Every module must satisfy all of these before shipping.

**Controls:**
- All controls are keyboard navigable
- Visible focus indicators on all interactive elements
- Icon-only buttons include `aria-label`

**Forms:**
- Every field has a proper label (`<label>` or `aria-label`)
- Errors are associated with their field (`aria-describedby`)

**Color:**
- Text meets WCAG AA contrast minimum in both light and dark modes
- Large text meets WCAG AA large-text minimum
- Status, selection, and validation are never communicated by color alone — also use icon, label, shape, or border changes

**Structure:**
- Logical heading hierarchy
- Landmark regions (`<main>`, `<nav>`, `<aside>`)

**Overlays:**
- Focus is trapped inside modals and dialogs
- Keyboard dismissal supported (Escape)
- Focus returns to the opener element on close

---

## 12. Responsive Behavior

**Approach:** Mobile first. Progressively enhance for `md`, `lg`, `xl`.

**Rules:**
- Collapse sidebars into drawers on mobile
- Convert multi-column dashboards to single-column stacks on small screens
- Preserve primary action visibility without requiring horizontal scroll
- Breakpoints change layout density, not remove critical actions

**Common breakpoints:**

| Prefix | Min width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

---

## 13. Performance Rules

For new modules:

- Prefer server components; use client components only when interactivity is needed
- Debounce heavy search/filter inputs
- Use optimistic or skeleton rendering for long-fetch views
- Use `AbortController` for cancellable fetches in effects
- Memoize expensive render loops where practical
- Never block the full page for a local section refresh — use partial loading UI

---

## 14. Agent Build Workflow

When adding a new UI module, follow this sequence in order:

**Step 1 — Identify destination surface**
Is this admin, landlord, tenant, or public/auth?

**Step 2 — Reuse existing shell/layout**
Never create a new shell unless explicitly required. Extend what exists.

**Step 3 — Draft page sections**
Plan: header → summary/KPIs → main content → supporting overlays.

**Step 4 — Apply semantic tokenized classes first**
`bg-card`, `text-foreground`, `border-border`, `text-muted-foreground` before any custom values.

**Step 5 — Implement all UX states**
Loading, empty, error, success, disabled. All of them.

**Step 6 — Responsive and accessibility pass**
Mobile → desktop. Keyboard, focus, labels.

**Step 7 — Visual consistency check**
Open adjacent modules. Does this new module look like it belongs in the same product?

---

### 14.1 Quick Agent Prompt Template

Use this internally before writing any code:

```
Build a new [ROLE] module at [ROUTE].
- Follow this design guide.
- Use semantic tokens from src/app/globals.css.
- Match [ROLE] shell/navigation patterns.
- Include loading, empty, error, success states.
- Mobile + desktop responsive.
- Accessible labels, focus states, and keyboard handling.
- Reuse existing iReside card/list/modal patterns.
```

---

## 15. Module Scaffolds

### 15.1 Standard Module Page

```tsx
export default function NewModulePage() {
  return (
    <div className="flex h-full w-full flex-col gap-8 bg-background p-6 text-foreground md:p-8">

      {/* Header */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Module Title</h1>
        <p className="mt-2 text-sm text-muted-foreground">Short operational context.</p>
      </section>

      {/* KPIs */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">KPI A</div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">KPI B</div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">KPI C</div>
      </section>

      {/* Main content */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        Main content
      </section>

    </div>
  );
}
```

---

### 15.2 Confirm Modal

```tsx
<div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/75 backdrop-blur-sm p-4">
  <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
    <h3 className="text-lg font-bold text-foreground">Confirm action</h3>
    <p className="mt-2 text-sm text-muted-foreground">Explain impact before user confirms.</p>
    <div className="mt-4 flex justify-end gap-2">
      <button className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
        Cancel
      </button>
      <button className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

### 15.3 Empty State Block

```tsx
<div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
  <p className="text-sm text-muted-foreground">No records yet.</p>
  <button className="mt-3 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
    Add First Record
  </button>
</div>
```

---

### 15.4 Error State Block

```tsx
<div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-300">
  Unable to load data right now. Please try again.
</div>
```

---

### 15.5 Loading Skeleton

```tsx
<div className="space-y-3">
  <div className="h-8 w-1/3 rounded-xl bg-muted animate-pulse" />
  <div className="h-4 w-2/3 rounded-lg bg-muted animate-pulse" />
  <div className="h-32 rounded-2xl bg-muted animate-pulse" />
</div>
```

---

## 16. QA Checklist

Run through all items before shipping any module.

### Visual

- [ ] Backgrounds use near-black in dark mode, not pure black
- [ ] Elevated surfaces are distinguishable from the base background
- [ ] Cards, sheets, and dialogs are clearly layered
- [ ] Accents are not overused
- [ ] Brand color does not bloom or vibrate on dark surfaces
- [ ] No random hardcoded hex values — all colors use semantic tokens

### Typography

- [ ] Primary text is highly legible
- [ ] Secondary text is readable, not washed out
- [ ] Disabled text is clearly inactive but still identifiable

### Interaction

- [ ] Focus states are visible on every interactive element
- [ ] Selected states are clear without relying on color alone
- [ ] Hover and pressed states are visible on all surfaces
- [ ] Disabled controls look inactive, not broken

### States

- [ ] Loading state is implemented and matches content shape
- [ ] Empty state is implemented with a helpful message or action
- [ ] Error state is implemented with a recovery path
- [ ] Success/confirmation is implemented and satisfying

### Accessibility

- [ ] Contrast meets WCAG AA thresholds in both themes
- [ ] Errors, warnings, and success states are distinguishable by more than color
- [ ] Keyboard navigation works throughout the module
- [ ] All form fields have labels
- [ ] Icon-only buttons have `aria-label`
- [ ] Modals trap focus and support Escape to dismiss

### Responsive

- [ ] Module is usable and complete on mobile
- [ ] Sidebar collapses to drawer at small screen sizes
- [ ] Primary actions remain accessible without horizontal scroll

### System Consistency

- [ ] All surfaces use approved semantic tokens
- [ ] All state colors map to semantic roles
- [ ] All components follow the same elevation and emphasis logic as adjacent modules
- [ ] Module belongs visually in the same product as neighbors

---

## 17. Definition of Done

A frontend module is complete only when all are true:

- [ ] Uses correct role shell and navigation conventions
- [ ] Uses semantic tokenized styling for all core surfaces
- [ ] Includes loading, empty, error, and success states
- [ ] Fully responsive at mobile and desktop sizes
- [ ] Keyboard accessible with visible focus states
- [ ] No obvious visual drift from nearby modules
- [ ] Motion is purposeful and not disruptive
- [ ] Copy is concise, clear, and action-oriented
- [ ] Passes the full QA checklist in §16

---

## 18. Anti-Patterns to Avoid

Never do these things:

**Styling**
- Hardcode random hex values when semantic tokens exist
- Use `#000000` as the UI background in dark mode
- Use pure white for every text element in dark mode
- Make every surface the same dark value
- Apply saturated brand colors to large backgrounds
- Mix radius scales within the same card family (e.g. `rounded-md` next to `rounded-3xl`)

**Layout**
- Introduce a totally new visual language for a single module
- Create a new shell/layout without explicit instruction
- Hide critical actions behind horizontal scroll

**States**
- Ship a module without loading/empty/error handling
- Use modals for non-interruptive contextual actions
- Show disabled states that look completely broken

**Accessibility**
- Communicate state through color alone
- Leave icon-only buttons without `aria-label`
- Allow focus to escape from open modals

**Interaction**
- Overanimate dense productivity views
- Use dramatic glow or flash effects in operational modules
- Block the full page for a partial data refresh

**Copy**
- Use marketing language inside operations screens
- Use vague labels like "Click here" or "Submit"
- Leave error messages that don't explain what to do next

**Architecture**
- Hide permissions in UI only without backend checks
- Leave raw fetch calls uncancelled in effects
- Render every component as a client component by default

---

*This document should evolve with shipped UI. Update it whenever theme tokens change, a new role shell is introduced, a recurring pattern becomes standard, or accessibility/interaction standards evolve.*
