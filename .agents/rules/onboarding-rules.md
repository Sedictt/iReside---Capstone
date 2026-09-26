---
trigger: always_on
---

# Onboarding Architecture & Flow Rules

## 1. 5-Stage Onboarding Sequence & Numbering
The canonical onboarding sequence for landlords is strictly 5 steps:
- **Step 1 of 5**: Property Setup (`/landlord/properties/new`)
- **Step 2 of 5**: Unit Map Layout (`/landlord/unit-map`)
- **Step 3 of 5**: Utility & Billing Rails (`/landlord/utility-billing`)
- **Step 4 of 5**: Tenant Onboarding (`/landlord/tenants`)
- **Step 5 of 5**: Dashboard Overview & Guided Tour (`/landlord/dashboard`)

All step badges, headers, modals, cards, and test assertions MUST strictly reference these canonical step numbers. Never refer to Tenant Setup as "Step 3".

## 2. Greeting Lightbox & Modal Invariants
Every onboarding stage MUST feature a greeting modal adhering to a single, consistent visual language:
- **Header**: Domain icon (Building2, Map, Zap, Users, LayoutDashboard) in `size-12` or `size-14` container with `bg-primary/10 text-primary border border-primary/20`.
- **Badge**: Step indicator (e.g. `Step X of Onboarding`) + Stage tag (e.g. `Mandatory Setup`, `Financial Rails`).
- **Body**: Concise heading + max 2-sentence description.
- **3-Point Architecture**: Exactly 3 concise benefit/feature points in a subtle container (`bg-muted/20 border border-border/70`). Avoid verbose wall-of-text blocks or AI slop.
- **Single Primary Action**: A single primary proceed button (e.g. "Proceed to Guided Tour", "Start Setup") that automatically triggers the interactive setup or tour. Avoid competing primary buttons (e.g., don't offer "Tour" AND "Configure Rates" AND "Finish Step" in the same initial greeting).
- **Graceful Dismissal**: An explicit "Maybe Later" or "Explore First" button that postpones or dismisses the greeting for the current visit.

## 3. Step Completion & Choice Dialog Invariant
Completing an onboarding step (whether via wizard, canvas generator, or floating tour card) MUST NEVER force an immediate, jarring redirect to another route.
Instead, completion MUST:
1. Mark local completion state in `localStorage` and dispatch the corresponding window event (`*-setup-completed`).
2. Refresh context (`PropertyContext.refreshProperties()`).
3. Display a Completion Choice Dialog (e.g. `UnitMapExploreOrReturnModal`, `UtilityBillingCompletionModal`) with 3 clear options:
   - **Proceed to Next Step** (primary button with arrow icon, navigating to the subsequent onboarding stage)
   - **Continue Exploring [Current Feature]** (secondary button that closes the modal and keeps the user on the current workspace with immediate navigation unlock)
   - **Return to Dashboard** (secondary button navigating to `/landlord/dashboard`)

## 4. Sidebar Lock Invariants per Stage
Navigation locking in `RoleSidebar` and `layout.tsx` must strictly enforce the following visibility matrix:

| Stage | Identifier | Accessible Routes | Locked Routes |
|---|---|---|---|
| 1. No Property | `no_property` | `/landlord/properties`, `/landlord/properties/new` | All other sidebar items |
| 2. No Unit Map | `no_unit_map` | `/landlord/unit-map` | All other sidebar items |
| 3. No Billing Rails | `no_billing_rails` | `/landlord/dashboard`, `/landlord/properties`, `/landlord/properties/new`, `/landlord/unit-map`, `/landlord/utility-billing` | Finance Hub (`/landlord/invoices`), Tenants, Leases, Maintenance, etc. |
| 4. No Tenants | `no_tenant` | Dashboard, Properties, Unit Map, Utility Billing, Tenants, Applications, Finance Hub | In-depth operational sub-pages |

Finance Hub (`/landlord/invoices`) MUST be locked during Stage 3 (`no_billing_rails`). It deals with tenant payments, receipts, and rental ledgers which are invalid prior to tenant onboarding.

## 5. Re-occurring Prompts until Complete
When an onboarding stage remains incomplete:
- Visiting the dashboard MUST surface a prompt/greeting after a 1.2–1.5s delay.
- Visiting the stage's dedicated workspace MUST show the greeting on every fresh page mount.
- Dismissing via "Maybe Later" sets a visit-scoped dismissal flag (`dismissedThisVisit = true`), so the user can freely interact with the page during that session without nagging, but is greeted again on their next visit.

## 6. Interactive Guided Tour & Target Highlighting Invariant
When an onboarding stage features a hands-on guided tutorial (e.g., Utility Billing, Unit Map visual planner):
- **Floating Spotlight Card**: Positioned persistently at bottom-right (`fixed bottom-6 right-6 z-[250]`) with step indicators (`Tour: Step X of Y`), concise instructions, and Next/Back/Action buttons.
- **Visual Target Highlighting**: The specific UI element/button explained by the current step MUST be visually spotlighted:
  - Strong pulsing ring & glow: `ring-4 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_30px_rgba(155,119,255,0.85)] animate-pulse scale-105 z-30`.
  - Live ping beacon dot: `animate-ping` pinging beacon placed directly on the active control.
  - Indicator pill: Inside the spotlight card, an indicator pill (`Highlighted: [Element Label]`) with a synchronized beacon dot confirms what control is being targeted.
  - Smooth auto-scroll: Advancing steps or opening the tour automatically smooth-scrolls the viewport to bring the targeted element into view.
- **Reopen Capability**: Every guided tour page MUST provide an easily discoverable "Guided Tour" trigger button in its action bar or header, allowing users who dismissed the spotlight card to reopen the tour at any time.

### 6.1 Direct-Manipulation & Drag-and-Drop Tour Invariants
When an onboarding stage features drag-and-drop canvas manipulation (such as the Unit Map visual planner):
- **Explicit Drag-and-Drop Step**: The guided tour must provide a dedicated step explaining direct drag-and-drop manipulation alongside batch/automation tools.
- **Dual-Target Visual Highlighting**:
  - The draggable source element (e.g. unit card) must display a pulsing ring (`ring-4 ring-primary`), ping beacon dot (`animate-ping`), animated grip handle, and an explicit action badge (e.g. "Drag Me").
  - The valid destination dropzone (e.g. target floor lane tray) must simultaneously display a dashed primary border, ring glow, and drop indicator pill ("Target Drop Zone").
- **Auto-Scroll to Draggable Target**: Navigating to the drag-and-drop tour step must automatically smooth-scroll the active draggable element into the viewport if it is outside the visible scroll area.
## 7. Dashboard Overview & Operational Tour Invariant
Stage 5 completes the onboarding pipeline by guiding the landlord through high-frequency operational controls on `/landlord/dashboard`:
- **Auto-Greeting Trigger**: When stages 1–4 are satisfied (or tenant setup postponed) and the dashboard tour is incomplete, surface `DashboardGreetingModal` after a 1.2–1.5s delay.
- **4 Key Spotlight Steps**:
  1. **Quick Action Launchpad** (`tour-quick-actions`): Cash payment recording, walk-in application, invite link generation, and printable QR flyer.
  2. **Command Center Pulse** (`tour-command-center`): Overdue rent, upcoming dues, vacant units, and active invites.
  3. **Cash Flow Ledger** (`tour-cash-flow`): Payment tracking and manual settlement verification.
  4. **Portfolio Switcher & Operations Hub** (`tour-dashboard-navigation`): Multi-property context switching and operational sub-pages.
- **Replay Trigger**: Provide an on-demand "Guided Tour" trigger button with a `Compass` icon on the dashboard banner.
- **Final Completion**: Dispatch `dashboard-tour-completed` and mark `ireside.onboarding_completed` in `localStorage`, displaying a celebration choice dialog directing the landlord to the dashboard, 2D unit map, or resident directory.

## 8. Non-Blocking Launch & Transition Invariant
In workspace initialization (`/setup`), wizard launches, and onboarding stage transitions:
- **Never Block Navigation on Client-Side Auth Sync**: Client-side SDK calls like `supabase.auth.refreshSession()`, `refreshProfile()`, or token re-fetches must NEVER be directly `await`ed on the critical path prior to navigation. In browser environments, `refreshSession()` can hang indefinitely due to client lock contention (`navigator.locks`) or token synchronization stalls.
- **Fire-and-Forget or Bounded Race**: All client-side auth refresh calls preceding navigation must be executed in a non-blocking background manner (`void supabase.auth.refreshSession().catch(() => {})`) or wrapped in `Promise.race` with an aggressive timeout (max 1.5s).
- **Server Ground Truth & Cookie Signal**: Finalization state (e.g. `is_setup_completed`, `setupCompleted`) must be persisted directly on the server (via service role `/api/setup/launch`) and signaled to middleware via local cookie/storage (`ireside_setup_completed=true`), allowing immediate navigation without waiting on client JWT regeneration.
- **Replace Over Push on Finalization**: Use `window.location.replace` or `router.replace` when transitioning out of single-use setup wizards to prevent browser history back-loops.
