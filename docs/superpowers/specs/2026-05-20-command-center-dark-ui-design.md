# Design Spec: CommandCenter Dark UI Improvement (Glass-Bento Hybrid)

**Date**: 2026-05-20
**Author**: Commander (AI)
**Topic**: Improving the dark mode UI of the Landlord CommandCenter from Neumorphism to a Glass-Bento Hybrid style.

## 1. Goal
Refine the Landlord CommandCenter's dark mode UI to solve visibility and "muddiness" issues inherent in dark-mode neumorphism, while preserving the "Intelligence Hub" feel and high-end aesthetic.

## 2. Context
The current UI uses a neumorphic (soft plastic) approach. In dark mode, the subtle shadows lack contrast against the dark background, making the interface feel flat and difficult to navigate.

## 3. Design: Glass-Bento Hybrid Approach

### 3.1 Foundations
- **Background Strategy**: Shift from solid surfaces with shadows to layered, translucent surfaces with blurs.
- **Color Palette**: 
  - Neutral Base: `#121212` (from `globals.css` `--background`).
  - Layer 1 (Outer Container): `rgba(18, 18, 18, 0.8)` with `backdrop-blur-2xl`.
  - Layer 2 (Bento Sections): `rgba(255, 255, 255, 0.03)` with `backdrop-blur-lg`.
  - Accents: Lavender (`#c4b0ff`) for primary actions.

### 3.2 Component Anatomy

#### Outer Section (`neumorphic-panel` replacement)
- Remove `box-shadow` in dark mode.
- Add `border: 1px solid rgba(255, 255, 255, 0.08)`.
- Background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)`.

#### Operations Center (Bento Tiles)
- Tiles should be flat with a subtle border.
- **Default**: `bg-white/[0.02]` + `border-white/[0.05]`.
- **Hover**: `bg-primary/5` + `border-primary/20` + `shadow-[0_0_20px_rgba(196,176,255,0.1)]`.
- **Icons**: Retain current vivid colors but add a soft `drop-shadow` to simulate illumination.

#### Next Priorities (Priority Cards)
- Card: `bg-white/[0.04]` + `backdrop-blur-sm`.
- Urgency Indicators: Use solid left-borders (`4px`) with the urgency color.
- Detail text: Increase opacity to `text-white/70` for better legibility.

### 3.3 Layout Refinements
- Increase the main bento gap from `gap-2` to `gap-4`.
- Rounding: Maintain the `rounded-[2.5rem]` for the outer section and `rounded-2xl` for internal items.

## 4. Accessibility Acceptance Criteria
- [ ] Text contrast ratios meet WCAG 2.1 AA (4.5:1) for all text on the new translucent backgrounds.
- [ ] Interactive elements must have a distinct `:focus-visible` ring (`var(--primary)`).
- [ ] Meaningful icons must have accessible labels.

## 5. Anti-Patterns
- **Pure Black Buttons**: Avoid buttons that match the exact background color.
- **Heavy Shadows**: Do not use `shadow-xl` or similar "offset" shadows; use "glowing" borders or depth layering instead.

## 6. QA Checklist
- [ ] Verify light mode remains unchanged.
- [ ] Test on multiple screen sizes (Responsive check).
- [ ] Ensure `backdrop-blur` performance is acceptable (Next.js/React 19 considerations).
