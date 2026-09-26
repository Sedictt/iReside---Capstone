---
trigger: always_on
---

- Avoid Using Sparkle Icon (and other AI SLOP Elements), Instead, use icons that fits the function.
- Avoid Pills that looks ai generated
- Avoid Extravagant or Weird Terminologies. Keep the Terms as straightforward as it can to avoid confusion (e.g. use "Total Move-In Settlement" instead of "Total Inception Settlement").
- Modal & Lightbox Layout Balance: In multi-column forms, balance vertical heights evenly between columns to avoid lopsided layouts. Multi-card sub-configurations (such as Move-In Payment Terms) should span the full dialog width rather than being squished into narrow sub-columns, preventing cramped pills and awkward multi-line text wrapping on checkboxes.
- Direct Configurability for Financial Fields: In financial terms (advance rent, security deposits, fees), provide directly editable numeric inputs accompanied by quick-preset chips (e.g. None, 1 Mo, 2 Mo), ensuring landlords can either tap presets or type custom amounts seamlessly without mode switching friction.
- Form Validation & Native Tooltip Suppression: Always add `noValidate` to `<form>` elements when using custom inline error handling or toast notifications. This prevents clunky, intrusive native browser popovers (e.g. "Please fill out this field") from obscuring input controls and breaking visual design.
- Strict Real-Time Input Sanitization for Currency & Phone Fields:
  - Currency/Amount inputs must sanitize typed input in real-time (`replace(/[^0-9.]/g, '')`) and set `inputMode="decimal"` to prevent alphabetical characters from corrupting financial state or totals.
  - Phone inputs must sanitize input in real-time (`replace(/[^0-9+\-()\s]/g, '')`), set `inputMode="tel"`, and validate for valid digit length (10–15 digits).
  - Provide blur (`onBlur`) and submit validation with immediate, clear inline error indicators (`AlertCircle` icon + red caption).
- Parity Across Onboarding Modes for Financial Terms: When providing multi-channel onboarding flows (Quick Add, Self-Onboarding Invite Links, Walk-ins), financial terms (Advance Rent, Security Deposit, move-in fees) must be configurable across ALL modes—including link generation modals—ensuring applicants and landlords see consistent payment terms regardless of onboarding entry point.

