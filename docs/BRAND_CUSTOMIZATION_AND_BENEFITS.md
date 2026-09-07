# iReside Customization Features & Brand Personalization Engine: Architectural Specification & Capstone Defense Guide

## Executive Summary

The **iReside** platform features an integrated, multi-tenant **Brand Customization and Design Token Engine**. Rather than enforcing a rigid, generic Software-as-a-Service (SaaS) visual shell, iReside allows property managers and independent landlords to dynamically white-label their operations. This personalization propagates across both digital interfaces (Landlord Hub, Tenant Portal, Mobile Views) and physical artifacts (Printed Lobby Flyers, Digital QR codes, Official Transactional Receipts).

This document serves as an exhaustive reference for capstone documentation, research papers, system architecture chapters, and defense panel presentations.

---

## 1. System Architecture & Technical Foundation

The brand customization subsystem is engineered around a reactive, offline-first design token architecture that decouples landlord-configured assets and styling parameters from core application logic.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Landlord Branding Inputs                        │
│   • Property Trade Name & Tagline        • Rental Business Archetype   │
│   • Primary & Secondary Brand Colors     • Custom Logo / Hero Banner   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             BrandContext & Algorithmic Token Engine (Client)           │
│   • Mathematical Color Conversions: HEX ↔ HSL ↔ RGB                    │
│   • WCAG 2.1 AAA Contrast Ratio & Relative Luminance Evaluation        │
│   • Root CSS Custom Property Injection (--primary, --brand-*, etc.)    │
│   • Dynamic Monogram Emblem Fallback Generation                        │
└──────────────────┬────────────────────────────────┬────────────────────┘
                   │                                │
                   ▼                                ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│   Offline-First Storage Cache     │ │   Cloud Database & Object Store  │
│   • IndexedDB / LocalStorage      │ │   • Supabase Storage:            │
│   • Instant client hydration      │ │     `brand-logos` bucket (5MB)   │
│   • Zero flash of unstyled        │ │   • Table: `properties`          │
│     content (FOUC) on cold start  │ │     (`map_decorations.branding`) │
│   • Cross-tab event synchronization│ │   • Table: `profiles`           │
│     (`property-branding-updated`) │ │     (`business_name`)            │
└───────────────────────────────────┘ └──────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Omnichannel Identity Propagation                     │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐ │
│  │ Landlord Management   │  │ Resident Portal       │  │ Official    │ │
│  │ (Nav, Sidebar, Banner,│  │ (Desktop & Mobile Nav,│  │ Receipts &  │ │
│  │  Visual Floor Planner)│  │  Onboarding Portal)   │  │ Statements  │ │
│  └───────────────────────┘  └───────────────────────┘  └─────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Physical Lobby Flyers (Dual QR: Android APK + Web Resident Portal)│ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Source Files & Implementation Reference:
- **`src/context/BrandContext.tsx`**: Core client-side React Context providing `useBrand()`, managing `BrandConfig`, multi-layer storage synchronization, and optimistic UI updates.
- **`src/lib/branding/colors.ts`**: Pure mathematical engine for color space transformations, WCAG contrast verification, and dynamic DOM injection.
- **`src/app/api/branding/route.ts`**: Public `GET` endpoint for cross-role brand discovery and protected `POST` endpoint guarded by role authorization (`landlord`, `admin`).
- **`src/app/api/branding/logo/route.ts`**: Multi-part form handler handling secure image validation, MIME sanitization, and upload to the Supabase `brand-logos` storage bucket.
- **`src/components/landlord/LandlordSettings.tsx`**: The landlord personalization studio supporting theme toggling, color picking, logo management, and banner selection.
- **`src/components/ui/BrandLogo.tsx`**: Adaptive emblem renderer that smoothly transitions between uploaded logos, generated monograms, and platform branding.
- **`src/components/messaging/OfficialReceipt.tsx`**: Monospace payment receipt formatter that incorporates landlord business names and property trade titles.
- **`src/components/landlord/flyer/LobbyFlyerModal.tsx`**: Print-ready marketing studio that synthesizes brand tokens into downloadable lobby notices and QR onboarding guides.
- **`src/components/landlord/dashboard/DashboardBanner.tsx`**: Panoramic hero dashboard customizer with photo library support.
- **`src/app/setup/page.tsx`**: Day-one onboarding wizard that captures property branding upon initial account registration.

---

## 2. Exhaustive Inventory of Customization Features

### 2.1. Commercial Property Identity
- **Property Trade Name**: The public-facing name of the real estate facility (e.g., *"Skyline Lofts"*). It dynamically replaces generic platform headers across navigation bars, document titles, invoice headers, and tenant invitations.
- **Property Tagline / Subtitle**: A descriptive business subtitle (e.g., *"Modern Urban Residences & Studios"*) positioned below trade names for consistent branding.
- **Rental Business Archetype**: Configures domain-specific workflows and operational terminology:
  - **Apartment Complex**: Tailored for monthly per-unit lease contracts, individualized utility submeters (electric & water), and multi-room tenant rosters.
  - **Student Dormitory**: Tailored for per-bed leasing agreements, shared utility splits, and academic calendar occupancy cycles.
  - **Boarding House**: Configured for flexible short- and long-term lodging with communal utility billing.

### 2.2. Visual Assets & Intelligent Fallbacks
- **Custom Logo Asset Management**: Supports raster and vector formats (PNG, JPEG, SVG, WebP) up to 5MB. Validated for file signatures, sanitized, and stored in the dedicated Supabase `brand-logos` public bucket.
- **Algorithmic Monogram Emblem Fallback**: If a landlord does not upload an image file, the system algorithmically extracts 2-letter uppercase monogram initials (e.g., *"Skyline Lofts"* $\rightarrow$ *"SL"*, *"Reyes Dormitory"* $\rightarrow$ *"RD"*). The monogram is rendered within a modern rounded container whose background and border are automatically tinted with the landlord’s primary brand accent.
- **Panoramic Dashboard Hero Banners**: Landlords can personalize their operational dashboard header through:
  - 6 curated architectural presets (*Modern Glass High-Rise, Urban Residential Complex, Minimalist Loft & Studio, Warm Brick Townhouses, Tropical Residential Oasis, Obsidian Metropolis Skyline*).
  - Direct image file uploads (up to 8MB).
  - External high-resolution image URLs.

### 2.3. Algorithmic Color & Contrast Token Engine
Located in `src/lib/branding/colors.ts`, this engine executes real-time color theory computations:
- **Bi-Directional Color Space Conversion**:
  - `hexToHsl(hex: string)`: Converts Hex values to Hue, Saturation, and Lightness components.
  - `hslToHex(h, s, l)`: Generates Hex colors from numerical HSL channels.
  - `hexToRgb(hex: string)`: Extracts raw RGB triples for alpha-blended Tailwind utilities.
- **WCAG 2.1 AAA Accessibility & Luminance Evaluation**:
  - `getLuminance(hex: string)`: Computes normalized relative luminance based on the standard CIE colorimetric formula:
    $$Y = 0.2126 \times R_{\text{linear}} + 0.7152 \times G_{\text{linear}} + 0.0722 \times B_{\text{linear}}$$
  - `getContrastRatio(hex1, hex2)`: Evaluates visual contrast ratios between 1.0:1 and 21.0:1.
  - `getContrastTextColor(bgHex: string)`: Dynamically selects `#09090b` (dark text) when background luminance exceeds $0.38$, or `#ffffff` (light text) otherwise. This ensures that buttons and badges maintain readability regardless of user color selection.
- **Runtime CSS Variable Injection**:
  - `applyBrandCssVariables()`: Injects custom CSS tokens into `document.documentElement`:
    - `--primary` & `--primary-rgb`: Core system accent for active buttons and tabs.
    - `--primary-foreground`: Calculated high-contrast text color.
    - `--brand-primary` & `--brand-secondary`: Base branding tones for custom styling.
    - `--brand-primary-50`, `--brand-primary-100`, `--brand-primary-900`: Mathematically computed tints for subtle backgrounds, hover states, and card borders.
- **Curated Palette Library**: Provides pre-calibrated, aesthetically balanced color pairings:
  - *Royal Lavender* (`#C4B0FF` / `#06B6D4`)
  - *Emerald Oasis* (`#10B981` / `#065F46`)
  - *Amber Sunset* (`#F59E0B` / `#EA580C`)
  - *Electric Indigo* (`#6366F1` / `#3B82F6`)
  - *Ruby Crimson* (`#F43F5E` / `#9F1239`)

### 2.4. Omnichannel Application Surfaces
The brand personalization engine ensures that changes propagate across all system touchpoints:
1. **Landlord Workspace**:
   - Navigation bars (`LandlordNavbar.tsx`) and global sidebars (`RoleSidebar.tsx`) display the active brand logo and trade name.
   - The interactive 2D Visual Blueprint / Floor Planner (`VisualBuilder.tsx`) binds canvas highlights and room selection indicators to the landlord's active brand palette.
2. **Resident & Tenant Portal**:
   - Both mobile and desktop navigation bars (`TenantNavbar.tsx`) reflect the property trade name and logo, reassuring tenants of official communications.
3. **Official Transactional Receipts**:
   - `OfficialReceipt.tsx` generates paper-textured, monospace payment confirmations featuring custom property trade names, formal invoice numbers, landlord business names, and decorative cut-marks.
4. **Physical Lobby Flyer Studio**:
   - `LobbyFlyerModal.tsx` provides a built-in document builder for print-ready notices and posters:
     - Header card with property name, address, and subtitle.
     - Dual QR codes: One linking directly to the downloadable Android APK, and another linking to the Web Resident Portal for self-registration.
     - 3-step resident onboarding guide (*Scan QR $\rightarrow$ Create Account $\rightarrow$ Pay & Request*).
     - Lobby Wi-Fi network credentials (SSID and password) and property management office contact hours.
     - Direct live styling controls: Custom background photography, brightness, saturation, opacity, card background colors, and typography choices (*Modern Sans, Editorial Serif, Geometric Mono*).

### 2.5. Additional Platform Customization Features
Beyond brand personalization, iReside provides granular operational and visual customizations:
- **Visual Themes**: Integrated Light Mode and Dark Mode with smooth transition animations via the native browser `document.startViewTransition` API.
- **Accessibility - Universal High Contrast Mode**: Engineered according to WCAG 2.1 AAA guidelines. Replaces soft neumorphic box shadows with crisp 2.5px solid high-contrast borders and reinforced typography across all screens.
- **Accessibility - Typography & Font Scaling**: Interactive slider that dynamically scales application-wide font sizes without distorting responsive card layouts.
- **Financial & Utility Configurations**:
  - Custom per-unit billing rates for submetered electricity (PHP per kWh) and water (PHP per cubic meter).
  - GCash QR code uploads and bank account destination settings for automated payment routing.
- **Communication & Notification Preferences**: Configurable notification channels for automated overdue invoice reminders and maintenance status updates.

---

## 3. Benefits for Capstone Documentation & Research Defense

These categorized benefits can be incorporated directly into your Capstone Chapter 1 (Significance of the Study), Chapter 3 (System Architecture & Methodology), Chapter 4 (Results & Discussion), or defense presentation.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DIMENSIONS OF BENEFIT                           │
│                                                                        │
│   1. Commercial & Operational       2. User Experience & Security      │
│      • Market differentiation          • Anti-phishing protection      │
│      • Domain-specific alignment       • Familiar living environment   │
│      • Frictionless onboarding         • Clear transactional records   │
│                                                                        │
│   3. Architectural & Technical      4. Economic & Socio-Technical      │
│      • Zero-latency offline boots      • Elimination of dev costs      │
│      • Algorithmic accessibility       • Bridging physical-digital gap │
│      • Real-time token reactivity      • Empowering local rental SMEs  │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1. Commercial & Operational Benefits (Landlord & Property Manager Perspective)
1. **Democratization of Enterprise White-Labeling for Rental SMEs**:
   - *Context*: Independent landlords, dormitory managers, and boarding house owners typically lack the budget to hire software agencies for custom branded mobile apps or portals.
   - *Benefit*: iReside provides turnkey, agency-grade white-label capabilities out of the box. Small property businesses present a polished, professional identity to prospective and existing tenants without development overhead.
2. **Operational Terminology Alignment via Rental Archetypes**:
   - *Context*: Generic property management platforms often force boarding houses or dormitories into rigid apartment-style unit models.
   - *Benefit*: Selecting an archetype adjusts the system's operational vocabulary and billing workflows (e.g., handling individual bed rentals vs. full-unit leases), preventing user confusion and eliminating workarounds.
3. **Closing the Onboarding Gap via Automated Physical Marketing Artifacts**:
   - *Context*: Transitioning non-technical or student tenants from informal messaging channels to a formal software portal frequently encounters adoption resistance.
   - *Benefit*: The Lobby Flyer Studio automatically transforms brand tokens into ready-to-print, high-impact lobby posters. Tenants onboard themselves by scanning the dual QR codes (Android APK or Web Portal) directly in the building lobby.

### 3.2. User Experience & Security Benefits (Tenant & Resident Perspective)
1. **Protection Against Rental Fraud and Payment Phishing**:
   - *Context*: Off-campus dormitories and rental housing in urban centers frequently suffer from payment diversion scams and fraudulent banking notices.
   - *Benefit*: By maintaining uniform branding across lobby posters, the resident portal, and official payment receipts, tenants can easily verify authentic billing statements, building trust and mitigating fraud risks.
2. **Cohesive, Familiar Living Experience**:
   - *Benefit*: Residents do not feel like they are interacting with a detached, impersonal database. The software interface acts as a natural digital extension of their actual residence (e.g., logging into "Skyline Lofts Resident Portal" rather than a generic utility app).
3. **Audit-Ready Official Financial Receipts**:
   - *Benefit*: Monospace-styled official receipts with distinct cut-marks and official trade naming provide tenants and their guarantors (e.g., parents of college students) with clear documentation for reimbursement and expense tracking.

### 3.3. Technical & Architectural Benefits (Software Engineering Perspective)
1. **Zero-Latency Offline-First Hydration (Resilient Local State)**:
   - *Context*: Unstable network conditions in developing or dense residential zones can lead to broken styling or sluggish page loads.
   - *Benefit*: iReside's multi-tier storage pattern hydrates brand tokens immediately from `OfflineStorage` (IndexedDB / LocalStorage) before remote Supabase round-trips complete. This prevents Flash of Unstyled Content (FOUC) and ensures seamless offline performance.
2. **Enforced WCAG 2.1 AAA Accessibility via Mathematical Constraints**:
   - *Context*: Giving non-technical users open color pickers often leads to inaccessible contrast combinations (e.g., pastel yellow text on a light gray background).
   - *Benefit*: By computing relative luminance mathematically at runtime, the color engine automatically assigns compliant foreground text tones (`#09090b` vs. `#ffffff`). Accessibility is enforced through code rather than user discretion.
3. **Lightweight Runtime Re-Theming Without Rebuild Overhead**:
   - *Benefit*: Injecting values into native CSS custom properties (`--primary`, `--brand-*`) allows real-time, application-wide re-theming without triggering expensive React virtual DOM re-renders or requiring CSS re-bundling.
4. **Resilient Degradation via Fallback Hierarchies**:
   - *Benefit*: If a landlord provides neither an image logo nor a custom color palette, the system falls back gracefully to a dynamically generated monogram emblem and standard high-contrast default color tokens without breaking layout structures.

---

## 4. Academic Terminology Cross-Reference Table

Use these academic phrasings in your thesis or capstone paper to elevate the technical rigor of your writing:

| Informal / Colloquial Term | Formal Academic & Engineering Phrasing |
| :--- | :--- |
| Changing colors and logos | **Dynamic Multi-Tenant White-Labeling & Design Token Injection** |
| Picking black or white text | **Algorithmic WCAG 2.1 AAA Relative Luminance & Contrast Evaluation** |
| Saving styles for offline use | **Offline-First Client State Hydration via Layered Cache Strategies** |
| Printing lobby posters with QR | **Omnichannel Tenant Onboarding via Dynamic QR-Enabled Physical Artifacts** |
| Adapting between dorms & apartments | **Domain-Driven Rental Business Archetype Abstraction** |
| Generated two-letter logo | **Algorithmic Monogram Emblem Generation with Hierarchical Fallbacks** |
| Color picker presets | **Curated Harmonious Color Space Palettes** |
| Changing hero banners | **Panoramic Hero Viewport Personalization** |
| Theme switching animation | **View Transition API Integration for Perceptual Continuity** |

---

## 5. Summary Matrix of Customization Attributes

| Customization Domain | Configuration Attribute | Storage & Transport Layer | Impacted Surfaces | Accessibility / Integrity Safeguard |
| :--- | :--- | :--- | :--- | :--- |
| **Commercial Identity** | Property Trade Name | `profiles.business_name` & `properties.name` | Navbars, Sidebars, Invoices, Flyers, Receipts | Fallback to default *"iReside Residences"* |
| **Commercial Identity** | Property Tagline | `properties.description` | Top Banners, Monograms, Lobby Flyers | Max string clamping to prevent layout overflow |
| **Business Logic** | Rental Archetype | `properties.type` (`apartment`, `dormitory`, `boarding_house`) | Billing models, submeter tracking, unit rosters | Strict TypeScript union type validation |
| **Visual Assets** | Custom Logo Image | Supabase Storage (`brand-logos` bucket) | Main App Bars, Tenant Portal, Official Invoices | 5MB size limit; MIME type checking; auto monogram fallback |
| **Visual Assets** | Dashboard Banner Photo | Supabase Storage / LocalStorage | Landlord Dashboard Hero Section | 6 architectural presets; 8MB upload limit |
| **Color System** | Primary Brand Color | CSS Token: `--primary`, `--brand-primary` | Buttons, Active Tabs, Map Canvas, Badges | Hex-to-HSL conversion; automatic contrast text pairing |
| **Color System** | Secondary Brand Color | CSS Token: `--brand-secondary` | Gradients, Badges, Glow Accents | Curated dual-tone color harmony presets |
| **Physical Onboarding** | Lobby Flyer Notice | Canvas / DOM Vector Generation | Printable A4/Letter Lobby Posters | Dual QR code error-correction; contrast overlay shields |
| **Accessibility** | High Contrast Mode | CSS Root Class: `.high-contrast` | Global Application Shell | 2.5px solid borders; replaces soft neumorphic shadows |
| **Accessibility** | Font Scaling Engine | CSS Root Variable: `--font-scale` | Universal Typography Elements | Layout-preserving rem multipliers with live preview |
