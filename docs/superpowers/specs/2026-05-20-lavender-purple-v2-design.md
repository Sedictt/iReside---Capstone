# Specification: Lavender Purple v2 (Sage Green Replacement)

## Context
Refining the previous brand transition (Sage Green -> Purple) to use a specific, softer shade of lavender (#c4b0ff) requested by the user.

## Goals
- Integrate #c4b0ff as the primary brand signature.
- Maintain WCAG 2.1 contrast compliance.
- Update global CSS variables, component-specific styles, and email templates.

## Palette
- **Primary Signature (#c4b0ff)**: The hero color for the brand. Used for large surface areas and background accents.
- **Primary Action (#9b77ff)**: A slightly more saturated version derived from the signature, used for buttons/interactive elements to ensure readability against white backgrounds.
- **Primary Dark (#7c3aed)**: Deep purple for high-contrast text and hover states.
- **Primary Foreground (#ffffff)**: White text for the Primary Action color.
- **Secondary Foreground (#1e1b4b)**: Deep navy text for use on the Signature (#c4b0ff) background.

## Implementation Plan
1. Update `src/app/globals.css`.
2. Update `src/styles/globals.css` and `src/styles/design-tokens.css`.
3. Update `src/lib/email.ts`.
4. Bulk replace the previous hex `#8B5CF6` with the new palette across 20+ files.
