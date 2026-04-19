# Dark Mode UI Design Guide

A comprehensive dark mode specification based on Material Design dark theme guidance, adapted into a practical design and engineering reference.

---

## 1. Purpose

This document defines how dark mode should work across the product.

The goals are to:
- reduce glare in low-light environments
- preserve readability and usability
- maintain brand identity without oversaturation
- communicate hierarchy and elevation clearly
- support accessibility and consistent implementation

Dark mode is not simply an inverted light theme. It is a separate visual system with its own surface, elevation, emphasis, and color rules.

---

## 2. Design Principles

### 2.1 Dark mode is a supplemental theme
Dark mode should coexist with light mode as a first-class experience. It should not feel like a fallback or an afterthought.

### 2.2 Prioritize legibility over brand intensity
On dark backgrounds, highly saturated colors can vibrate, bloom, or feel visually aggressive. Brand colors should usually be softened or reserved for accents and actionable elements.

### 2.3 Surfaces define the experience
Most of the UI in dark mode is built from surfaces, not from large colored panels. The interface should rely on neutral dark surfaces, then use color strategically.

### 2.4 Elevation must still be visible
In light themes, elevation is often communicated with shadows. In dark themes, shadows are less visible, so elevation should also be expressed by lightening elevated surfaces.

### 2.5 Contrast should feel intentional
Readable text, visible controls, and distinct states matter more than achieving an ultra-minimal look.

---

## 3. Base Color Strategy

### 3.1 Recommended foundation
Use a near-black neutral surface as the base of the dark theme.

**Recommended base surface:** `#121212`

This should be the primary background for most screens and neutral containers.

### 3.2 Avoid pure black for most product UI
Avoid using `#000000` as the default UI background.

Why:
- it reduces depth separation between layers
- it can make elevated surfaces harder to distinguish
- it often feels harsher and less refined than near-black surfaces

Pure black may still be appropriate for special cases like true-black battery-saving modes, media viewers, cinema-style layouts, or OLED-specific settings.

### 3.3 Branded dark surfaces
If the product needs a slightly branded dark surface, tint the base neutral with the primary brand color at very low opacity rather than replacing the surface with a saturated brand fill.

Example approach:
- base: `#121212`
- add subtle primary tint overlay at very low opacity

This preserves the calm, neutral character of dark mode while still making it feel on-brand.

---

## 4. Color Roles

Use clear semantic roles instead of scattering raw hex values through the system.

### 4.1 Core roles
- **background** — app background, page background
- **surface** — cards, sheets, app bars, drawers, dialogs
- **surface-variant** — alternate neutral containers
- **primary** — key actions, selection, active states
- **secondary** — supporting accents
- **error** — destructive actions and validation errors
- **on-background** — text/icons on background
- **on-surface** — text/icons on surface
- **on-primary** — text/icons on primary surfaces
- **outline / divider** — strokes, separators, low-emphasis boundaries

### 4.2 Usage philosophy
- Neutral roles should carry the majority of the layout.
- Accent roles should be reserved for actions, focus, selection, and states.
- Large areas of saturated color should be used sparingly.

---

## 5. Suggested Dark Theme Tokens

These values are aligned with Material dark theme patterns and are suitable as a baseline. Adjust for brand needs only after contrast and usability checks.

## 5.1 Foundation tokens
```css
--color-background: #121212;
--color-surface: #121212;
--color-surface-1: #1E1E1E;
--color-surface-2: #222222;
--color-surface-3: #242424;
--color-surface-4: #272727;
--color-surface-6: #2C2C2C;
--color-surface-8: #2E2E2E;
--color-surface-12: #333333;
--color-surface-16: #343434;
--color-surface-24: #383838;

--color-on-background: rgba(255,255,255,0.87);
--color-on-surface: rgba(255,255,255,0.87);
--color-on-surface-medium: rgba(255,255,255,0.60);
--color-on-surface-disabled: rgba(255,255,255,0.38);

--color-divider: rgba(255,255,255,0.12);
```

## 5.2 Example accent tokens
```css
--color-primary: #BB86FC;
--color-on-primary: #000000;

--color-secondary: #03DAC6;
--color-on-secondary: #000000;

--color-error: #CF6679;
--color-on-error: #000000;
```

Note: The accent values above reflect Material’s classic dark-theme defaults. Replace them with brand-approved colors only after validating contrast and visual comfort.

---

## 6. Elevation in Dark Mode

## 6.1 Why dark mode elevation is different
Shadows are less visible on dark backgrounds. Because of that, elevated surfaces should appear lighter than the base surface.

In practice, elevation in dark mode is communicated by:
- subtle shadows where appropriate
- lighter surface tones at higher elevations
- consistent layering rules

## 6.2 Elevation overlay concept
A surface starts from the base dark color, then becomes slightly lighter as elevation increases.

### Recommended reference mapping
| Elevation | Surface tone |
|---|---|
| 0dp | `#121212` |
| 1dp | `#1E1E1E` |
| 2dp | `#222222` |
| 3dp | `#242424` |
| 4dp | `#272727` |
| 6dp | `#2C2C2C` |
| 8dp | `#2E2E2E` |
| 12dp | `#333333` |
| 16dp | `#343434` |
| 24dp | `#383838` |

Use these as tokens instead of manually guessing lighter grays every time.

## 6.3 Practical component elevations
Suggested mapping:
- page background: 0dp
- card: 1dp to 2dp
- app bar: 4dp
- floating action button: 6dp
- drawer: 16dp
- modal / dialog: 24dp

## 6.4 Avoid over-layering
Too many slightly different dark grays can make the interface feel muddy. Use a limited and deliberate elevation scale.

---

## 7. Text and Icon Emphasis

Text and icons in dark mode should not all use full white.

### Recommended emphasis levels
- **High emphasis:** `rgba(255,255,255,0.87)`
- **Medium emphasis:** `rgba(255,255,255,0.60)`
- **Disabled:** `rgba(255,255,255,0.38)`

### Usage
- high emphasis: body text, headings, primary icons, selected labels
- medium emphasis: secondary text, helper text, supporting labels, unselected icons
- disabled: disabled labels, disabled icons, unavailable states

### Avoid
- using pure white for every text element
- using low-opacity text for critical content
- relying on color alone to indicate importance

---

## 8. Surface Rules

### 8.1 Large surfaces
Large regions such as full-page backgrounds, app bars, sidebars, and sheets should remain neutral and dark.

### 8.2 Small interactive surfaces
Buttons, toggles, chips, selected items, and active states can use brand color more freely because their smaller area reduces visual fatigue.

### 8.3 Nested surfaces
When placing surfaces inside surfaces:
- each child surface should either have a higher elevation tone or a clear outline
- avoid using identical tones for adjacent containers
- keep the hierarchy obvious at a glance

### 8.4 Borders and dividers
Use subtle separators rather than heavy lines.

Recommended divider baseline:
```css
--color-divider: rgba(255,255,255,0.12);
```

---

## 9. Brand Color in Dark Mode

## 9.1 Reduce overuse of saturated color
Brand colors can look brighter and louder against dark surfaces. Use them intentionally.

### Best uses for primary color
- primary buttons
- links
- selected navigation items
- focus rings
- toggles and selection controls
- progress and activity indicators

### Avoid using primary color for
- entire screen backgrounds
- large cards by default
- long passages of text
- too many neighboring elements at once

## 9.2 Tone adaptation
A brand color that works well in light mode may need to shift in dark mode.

Common adjustments:
- slightly lighter tone for visibility on dark surfaces
- slightly lower saturation to reduce glow or vibration
- updated on-color for readable text/icon contrast

## 9.3 Accent restraint
The darker the interface, the more noticeable every accent becomes. This makes restraint more important, not less.

---

## 10. Accessibility

## 10.1 Contrast
All text and essential UI controls should meet accessibility contrast requirements.

Minimum guidance:
- standard text: WCAG AA contrast minimum
- large text: WCAG AA large-text minimum
- interactive controls: visible against their surrounding surfaces
- focus indicators: clearly visible without relying on hover

## 10.2 Don’t rely on color alone
Status, selection, and validation should also include one or more of the following:
- icon change
- label change
- shape change
- outline or border change
- position or motion change

## 10.3 Low-light comfort
A valid dark mode is not only “technically visible.” It should also feel comfortable during extended use.

Watch for:
- overly bright accents
- glowing pure white text everywhere
- insufficient distinction between layers
- tiny gray text on slightly different gray backgrounds

---

## 11. Component Guidance

## 11.1 App background
- use the base background color
- do not use textured or noisy backgrounds by default
- keep the backdrop calm so content carries the attention

## 11.2 App bars and top bars
- prefer a surface tone above the background when elevated
- keep icons and titles high emphasis
- avoid fully saturated app bars unless the product intentionally uses a bold branded shell

## 11.3 Cards
- cards should be slightly lighter than the page background
- use elevation tone and optionally a subtle outline
- ensure neighboring cards do not blend into the background

## 11.4 Dialogs and modals
- use one of the highest elevation surface tones
- increase contrast with the backdrop
- maintain strong text legibility and clear action emphasis

## 11.5 Navigation drawers and side panels
- use elevated surfaces rather than flat brand color fills
- selected items may use primary tint, icon shift, bold label, or pill background

## 11.6 Buttons
### Contained / primary button
- use primary fill for highest-emphasis action
- text/icon on primary must remain high contrast

### Outlined button
- use for medium-emphasis actions
- ensure outline contrast remains visible on dark backgrounds

### Text button
- use sparingly for low-emphasis actions
- ensure tappable area remains obvious

## 11.7 Text fields
- distinguish active, idle, error, and disabled states clearly
- supporting labels and helper text can use medium emphasis
- cursor, focus line, and active outline can use primary color
- ensure field containers are distinct from background

## 11.8 Lists and tables
- row separation should be subtle but visible
- selected rows should use tint, state layer, or outline
- do not depend on zebra striping alone if contrast is weak

## 11.9 Chips, toggles, radios, and checkboxes
- selection should be obvious at a glance
- use both fill/outline changes and icon/check changes where relevant
- disabled state must still be identifiable without looking broken

## 11.10 Snackbars and banners
- snackbars should feel elevated above the content
- action text should be accent-colored but readable
- error and warning banners should preserve contrast without becoming neon

---

## 12. State Styling

Interactive states need clear feedback in dark mode because subtle changes can disappear easily.

## 12.1 Required states
Each interactive element should define:
- default
- hover
- focus
- pressed
- selected
- disabled
- error, where applicable

## 12.2 Focus state
Focus should be highly visible.

Recommended focus treatments:
- clear outline or ring
- strong state layer
- contrast increase
- not dependent on color shift alone

## 12.3 Hover and pressed
Use restrained overlays or slight tonal adjustments.
Avoid dramatic glow effects unless the product identity explicitly calls for it.

---

## 13. Imagery, Illustration, and Media

## 13.1 Images on dark surfaces
Images can appear more vibrant in dark mode. Check them for:
- blown-out highlights
- oversaturated colors
- unintended glow against surrounding UI

## 13.2 Illustration style
If illustrations sit inside the product UI:
- prefer deeper shadows and reduced highlights
- avoid large pure-white empty regions
- ensure the illustration does not overpower the interface chrome

## 13.3 Icons
Icons should follow the same emphasis levels as text.
Do not make all icons full white by default.

---

## 14. Layout and Hierarchy

## 14.1 Preserve a strong reading structure
Because dark themes compress visual contrast between surfaces, hierarchy must be reinforced with:
- spacing
- typography scale
- elevation
- alignment
- selective accent use

## 14.2 Use whitespace generously
Dense dark UIs can feel claustrophobic faster than light UIs. Allow enough spacing between groups and controls.

## 14.3 Limit simultaneous emphasis
If everything is bright, colorful, or elevated, nothing feels important.

---

## 15. Motion in Dark Mode

Animation in dark mode should feel calm and controlled.

Recommended approach:
- use shorter, refined transitions
- avoid large bright flashes
- prefer opacity, elevation, and transform changes over luminous effects
- ensure loading states do not produce harsh flicker

---

## 16. Implementation Guidance

## 16.1 Token-first theming
All colors should be implemented through semantic tokens.
Avoid hardcoding raw values inside components.

## 16.2 Example token set
```json
{
  "background": "#121212",
  "surface": "#121212",
  "surface1": "#1E1E1E",
  "surface2": "#222222",
  "surface3": "#242424",
  "surface4": "#272727",
  "surface6": "#2C2C2C",
  "surface8": "#2E2E2E",
  "surface12": "#333333",
  "surface16": "#343434",
  "surface24": "#383838",
  "onBackground": "rgba(255,255,255,0.87)",
  "onSurface": "rgba(255,255,255,0.87)",
  "onSurfaceMedium": "rgba(255,255,255,0.60)",
  "onSurfaceDisabled": "rgba(255,255,255,0.38)",
  "divider": "rgba(255,255,255,0.12)",
  "primary": "#BB86FC",
  "onPrimary": "#000000",
  "secondary": "#03DAC6",
  "onSecondary": "#000000",
  "error": "#CF6679",
  "onError": "#000000"
}
```

## 16.3 CSS example
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

## 16.4 Engineering rules
- never hardcode pure white text unless intentionally needed
- never use arbitrary grays when a surface token exists
- never invent new elevation colors per component
- always map component states to tokenized roles
- always validate contrast after brand customization

---

## 17. QA Checklist

Before shipping dark mode, verify the following:

### Visual
- backgrounds use near-black, not default pure black
- elevated surfaces are distinguishable from base background
- cards, sheets, and dialogs are clearly layered
- accents are not overused
- brand color does not bloom or vibrate on dark surfaces

### Typography
- primary text is highly legible
- secondary text is readable, not washed out
- disabled text is clearly inactive but still identifiable

### Interaction
- focus states are obvious
- selected states are clear without relying on color alone
- hover and pressed states remain visible on all surfaces
- disabled controls do not look broken

### Accessibility
- contrast meets required thresholds
- errors, warnings, and success states are distinguishable
- keyboard navigation is visible
- screen magnification and low-brightness use remain comfortable

### System consistency
- all surfaces use approved tokens
- all state colors map to semantic roles
- all components follow the same elevation and emphasis logic

---

## 18. Common Mistakes

Avoid these common dark-mode problems:
- using pure black everywhere
- using pure white for all text and icons
- making every surface the same dark value
- applying saturated brand colors to large backgrounds
- depending on shadows alone for hierarchy
- reducing contrast too much in the name of aesthetics
- creating muddy layouts with too many near-identical grays
- forgetting focus and disabled states

---

## 19. Recommended Default Spec

If a team needs a practical starting point, use this:

- base background: `#121212`
- elevated surfaces: use the defined surface scale
- primary text: `rgba(255,255,255,0.87)`
- secondary text: `rgba(255,255,255,0.60)`
- disabled text: `rgba(255,255,255,0.38)`
- dividers: `rgba(255,255,255,0.12)`
- primary color: softened brand accent, used mainly for actions and selection
- elevation: combine tonal lift with subtle shadow where appropriate
- accessibility: validate all final pairings with WCAG contrast checks

---

## 20. Final Guidance

A good dark mode should feel:
- calm
- readable
- layered
- intentional
- visually restrained
- unmistakably part of the same product system

The best dark themes do not chase drama. They use darkness to improve focus, comfort, and clarity.

