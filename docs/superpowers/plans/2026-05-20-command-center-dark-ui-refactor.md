# Implementation Plan: CommandCenter Dark UI Refactor (Glass-Bento Hybrid)

**Date**: 2026-05-20
**Feature**: Landlord CommandCenter Dark Mode Refactor

## 1. Overview
Refactor the `CommandCenter` component to replace muddy dark-mode neumorphism with a sharp, vibrant "Glass-Bento Hybrid" aesthetic. This plan ensures light mode neumorphism remains untouched while resolving visibility issues in dark mode.

## 2. File Mapping
- `src/app/globals.css`:
  - Add `.glass-premium` utility to bypass global dark mode blur restrictions.
  - Add `.bento-glass-card` and `.bento-glass-inset` for consistent bento styling.
- `src/components/landlord/dashboard/CommandCenter.tsx`:
  - Replace `neumorphic-*` classes with conditional classes (Neumorphic for light, Bento-Glass for dark).
  - Adjust layout spacing (gap-4) and rounding consistency.

## 3. Tasks

### Task 1: CSS Foundation Update
- [ ] Modify `src/app/globals.css` to exempt `.glass-premium` from the global `backdrop-filter: none !important` rule in `.dark`.
- [ ] Define `.glass-premium` with `backdrop-blur-md` and `saturate-150`.
- [ ] Define `.bento-glass-card`:
  - Light: (Inherit neumorphic-extruded or transparent)
  - Dark: `bg-white/[0.03] border border-white/[0.08] shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2)]`
- [ ] Define `.bento-glass-inset`:
  - Light: (Inherit neumorphic-inset)
  - Dark: `bg-black/20 border border-white/[0.05] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]`

### Task 2: CommandCenter Component Refactor
- [ ] Update outer `<section>`:
  - Class: `cn("neumorphic-panel dark:glass-premium dark:bg-card/40 ...", ...)`
- [ ] Update Operations Center & Insights Hub containers:
  - Class: `cn("neumorphic-inset dark:bento-glass-inset ...", ...)`
- [ ] Update Stat Cards (Real-time pills):
  - Class: `cn("neumorphic-extruded dark:bento-glass-card ...", ...)`
- [ ] Update Operations Center Tiles:
  - Class: `cn("neumorphic-extruded dark:bento-glass-card ...", ...)`
  - Add hover state: `dark:hover:bg-primary/5 dark:hover:border-primary/20`
- [ ] Update Next Priorities Cards:
  - Class: `cn("neumorphic-extruded dark:bento-glass-card ...", ...)`
  - Improve legibility: `dark:text-white/70` for detail text.

### Task 3: Verification
- [ ] Run `npm run build` to verify production CSS/TS.
- [ ] Run `npx eslint src/components/landlord/dashboard/CommandCenter.tsx` for linting.
- [ ] Verify light mode neumorphism is intact.
- [ ] Verify dark mode visibility and glass effects are active.

## 4. Testing Note
Since this is a UI refactor, verification is primarily visual. Ensure that `backdrop-blur` is working in the browser after clearing any `backdrop-filter: none` overrides.
