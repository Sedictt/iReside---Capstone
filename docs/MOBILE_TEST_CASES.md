# iReside Mobile 2.0 — Comprehensive QA Test Case Specification

**Document Version**: 2.0.0  
**Target Branch**: `mobile-2.0-by-jv`  
**Application Environment**: Mobile Web (Viewport: 390×844 / Responsive Mobile Viewport)  
**Total Test Cases**: 70 Test Cases across 10 Operational Modules  

---

## 1. Test Environment & Verification Credentials

| Persona | Account Role | Verified Credentials | Default Landing Route | Target Facility / Property |
| :--- | :--- | :--- | :--- | :--- |
| **Landlord Admin** | Property Owner / Manager | **Email:** `john.gonzales@ireside.ph`<br>**Password:** `Password123!` | `/mobile/landlord/overview` | Fernando Gonzales Dormitory (Full Setup Complete) |
| **Active Resident** | Unit Tenant | **Email:** `maria.santos@ireside.ph`<br>**Password:** `Password123!` | `/mobile/tenant/home` | Room 101, Fernando Gonzales Dormitory (₱4,500/mo) |
| **Unauthenticated / Guest** | Visitor | *None (Anonymous)* | `/mobile` (Redirects to `/login?redirect=/mobile`) | N/A |

---

## Module Index

- **Module 1**: Mobile Gateway, Role-Based Route Guards & Session Recovery (`TC-MOB-001` – `TC-MOB-007`)
- **Module 2**: Violet Ledger Layout, Bottom Tab Bar & Sheet Animation Engine (`TC-MOB-008` – `TC-MOB-014`)
- **Module 3**: Tenant Home Dashboard & Daily Quick Shortcuts (`TC-MOB-015` – `TC-MOB-021`)
- **Module 4**: Tenant Digital Payments, Submeter Dues & Proof Intake (`TC-MOB-022` – `TC-MOB-028`)
- **Module 5**: Tenant Lease Agreement, Renewals & Move-Out Clearance Drawer (`TC-MOB-029` – `TC-MOB-036`)
- **Module 6**: Tenant Amenity Booking Drawer & Facility Reservations (`TC-MOB-037` – `TC-MOB-042`)
- **Module 7**: Landlord Operations Center & Intelligence Hub (`TC-MOB-043` – `TC-MOB-049`)
- **Module 8**: Landlord Fast Cash Flow: Offline Payment, Invoicing & Expenses (`TC-MOB-050` – `TC-MOB-057`)
- **Module 9**: Landlord Leases, Overrides, Fast Renewals & Move-Out Audit (`TC-MOB-058` – `TC-MOB-064`)
- **Module 10**: Operations Calendar, Messaging, Notifications & Deep Linking (`TC-MOB-065` – `TC-MOB-070`)

---

## Module 1: Mobile Gateway, Role-Based Route Guards & Session Recovery

| Test ID | Screen / Path | Test Objective | Preconditions | Execution Steps | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-001** | `/mobile` | Verify automatic role-based redirect for authenticated Landlord | User is logged in as `john.gonzales@ireside.ph`. | 1. Open mobile browser to `http://localhost:3000/mobile`.<br>2. Observe URL routing. | Browser immediately redirects to `/mobile/landlord/overview` without showing tenant interface. | Pass | Verified |
| **TC-MOB-002** | `/mobile` | Verify automatic role-based redirect for authenticated Tenant | User is logged in as `maria.santos@ireside.ph`. | 1. Open mobile browser to `http://localhost:3000/mobile`.<br>2. Observe URL routing. | Browser immediately redirects to `/mobile/tenant/home` without showing landlord operations. | Pass | Verified |
| **TC-MOB-003** | `/mobile` | Verify redirect to login for unauthenticated visitors | Browser session is logged out. | 1. Clear session cookies / open Incognito tab.<br>2. Navigate to `http://localhost:3000/mobile`. | Browser redirects to `/login?redirect=/mobile` preserving the return path in query parameters. | Pass | Verified |
| **TC-MOB-004** | `/login` | Verify post-login redirection returns to mobile home | Browser is on `/login?redirect=/mobile`. | 1. Type email and password.<br>2. Tap "Sign In". | Upon successful auth handshake, user is redirected back to `/mobile` which routes to their respective dashboard. | Pass | Verified |
| **TC-MOB-005** | `/mobile/landlord/*` | Prevent unauthorized tenant access to landlord routes | Logged in as tenant `maria.santos@ireside.ph`. | 1. Manually type `http://localhost:3000/mobile/landlord/overview` in URL bar.<br>2. Press Enter. | System blocks access, redirecting tenant back to `/mobile/tenant/home` with an unauthorized access warning toast. | Pass | Security Guard |
| **TC-MOB-006** | `/mobile/tenant/*` | Prevent unauthorized landlord access to tenant routes | Logged in as landlord `john.gonzales@ireside.ph`. | 1. Manually type `http://localhost:3000/mobile/tenant/home` in URL bar.<br>2. Press Enter. | System blocks access, redirecting landlord back to `/mobile/landlord/overview`. | Pass | Security Guard |
| **TC-MOB-007** | Safe-Area Insets | Verify layout renders properly on notch and home-bar devices | Mobile device with display notch (iPhone 14 / Pixel 7). | 1. Inspect top status bar and bottom gesture bar.<br>2. Check if content clips under the camera notch or bottom indicator. | Top header respects `env(safe-area-inset-top)` and bottom tab bar includes `env(safe-area-inset-bottom)` padding. | Pass | UI Safe Area |

---

## Module 2: Violet Ledger Layout, Bottom Tab Bar & Sheet Animation Engine

| Test ID | Screen / Path | Test Objective | Preconditions | Execution Steps | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-008** | Bottom Navigation | Verify 72px tab height and thumb reachability | Mobile viewport (390×844). | 1. Inspect bottom navigation bar.<br>2. Measure bar height.<br>3. Tap across tabs. | Tab bar measures exactly 72px height plus safe area padding; icons are 24px and thumb-friendly. | Pass | Token Parity |
| **TC-MOB-009** | Bottom Navigation | Verify sliding spring pill indicator on active tab | Mobile viewport. | 1. Tap from "Home" to "Pay" or "Lease".<br>2. Observe the active tab indicator. | A colored pill indicator smoothly glides horizontally under the active icon using Framer Motion spring physics. | Pass | Violet Ledger |
| **TC-MOB-010** | Mobile Header | Verify tactile 44×44px back and notification buttons | Any sub-page with header back button (e.g. `/mobile/notifications`). | 1. Tap the chevron back button.<br>2. Observe button micro-scaling and navigation. | Button scales down on touch active (`active:scale-90`) and navigates back to previous screen or fallback route. | Pass | Touch Target |
| **TC-MOB-011** | Mobile Header | Verify unread notification counter badge | Account has unread notifications. | 1. Inspect top right bell icon in `MobileHeader`. | Coral pill badge (`--m-coral`) appears displaying unread count (e.g. `3` or `9+`). | Pass | Visual Parity |
| **TC-MOB-012** | Pull-to-Refresh | Verify pull-to-refresh spinner on mobile views | On any primary mobile dashboard view. | 1. Touch top of scroll container and swipe downward.<br>2. Release swipe. | Haptic feedback fires, loading spinner appears at top, fresh data is fetched from API, and spinner slides away. | Pass | PullToRefresh |
| **TC-MOB-013** | Bottom Sheets | Verify automatic slide-down exit animation (`MobileSheetExit`) | Any bottom drawer opened (Payment, Invoice, or Move-Out). | 1. Open drawer.<br>2. Tap the "X" close button or tap the dark backdrop. | Drawer sheet does NOT disappear abruptly; it smoothly slides down while backdrop fades out over 340ms. | Pass | MobileSheetExit |
| **TC-MOB-014** | Dark Mode Theme | Verify contrast and surface colors in dark theme | Dark mode enabled via device or toggle. | 1. Switch to Dark Mode.<br>2. Inspect ground, card surfaces, and text contrast. | Background switches to dark ground, cards display dark elevation borders (`dark:border-white/10`), text remains crisp white/light gray. | Pass | WCAG Contrast |

---

## Module 3: Tenant Home Dashboard & Daily Quick Shortcuts

| Test ID | Screen / Path | Test Objective | Preconditions | Execution Steps | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-015** | `/mobile/tenant/home` | Verify property skyline hero card & resident room badge | Logged in as tenant `maria.santos@ireside.ph`. | 1. Open Tenant Home screen.<br>2. Inspect the top hero card. | Displays "Fernando Gonzales Dormitory", tenant greeting "Welcome, Maria", and unit badge "Room 101". | Pass | Hero Rendering |
| **TC-MOB-016** | `/mobile/tenant/home` | Verify quick shortcut grid navigation | On Tenant Home screen. | 1. Tap "Pay Rent" shortcut.<br>2. Tap "Maintenance" shortcut.<br>3. Tap "My Lease" shortcut. | Each shortcut navigates to its respective destination (`/mobile/tenant/pay`, `/mobile/tenant/maintenance`, `/mobile/tenant/lease`). | Pass | Tile Grid |
| **TC-MOB-017** | `/mobile/tenant/home` | Verify Landlord Quick Contact Avatar & Chat link | On Tenant Home screen. | 1. Inspect landlord contact section.<br>2. Tap the chat button next to landlord name. | Displays landlord initials avatar ("JG" / "PM") and taps directly into `/mobile/tenant/messages`. | Pass | Quick Contact |
| **TC-MOB-018** | `/mobile/tenant/home` | Verify Current Dues quick balance widget | Tenant has an active invoice. | 1. Review the dues widget on home screen.<br>2. Compare balance with `/mobile/tenant/pay`. | Displays exact outstanding balance in ₱ and due date; tapping navigates to pay screen. | Pass | Financial Sync |
| **TC-MOB-019** | `/mobile/tenant/home` | Verify Building Announcements carousel | Building has active broadcast announcements. | 1. Scroll to Announcements section.<br>2. Swipe horizontally through announcement cards. | Displays latest landlord broadcasts with priority badges and formatted timestamps. | Pass | Broadcast Feed |
| **TC-MOB-020** | `/mobile/tenant/home` | Verify Amenities quick reservation tile | On Tenant Home screen. | 1. Tap the "Book Facility" tile. | Opens the mobile amenity booking flow directly. | Pass | Drawer Hook |
| **TC-MOB-021** | `/mobile/tenant/home` | Verify Emergency Contact & Dorm Rules shortcut | On Tenant Home screen. | 1. Tap "Dorm Rules & Handbook" link. | Opens the mobile handbook / manual view (`/mobile/tenant/manual`). | Pass | Handbook Link |

---

## Module 4: Tenant Digital Payments, Submeter Dues & Proof Intake

| Test ID | Screen / Path | Test Objective | Preconditions | Execution Steps | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-022** | `/mobile/tenant/pay` | Verify Payable Balance Hero Card rendering | Logged in as tenant with pending dues. | 1. Navigate to `/mobile/tenant/pay`.<br>2. Review top hero card. | Total payable balance displayed prominently in large bold font (`₱X,XXX.XX`) with overdue alert pill if past due. | Pass | Hero Card |
| **TC-MOB-023** | `/mobile/tenant/pay` | Verify itemized utility submeter breakdown (Electric & Water) | Invoice has utility line items. | 1. Tap on current billing period card.<br>2. Inspect breakdown lines. | Base rent, electricity (kWh readings and submeter calculation), and water charges are itemized in ₱. | Pass | Line Item Audit |
| **TC-MOB-024** | `/mobile/tenant/pay` | Verify payment status filter tabs (All, Pending, Paid) | Multiple past and present invoices exist. | 1. Tap "Pending" tab.<br>2. Tap "Paid" tab.<br>3. Tap "All" tab. | Invoice list immediately filters to match the selected status without page reload. | Pass | Filter Tabs |
| **TC-MOB-025** | `/mobile/tenant/pay` | Verify Payment Checkout Modal trigger | Unpaid invoice listed. | 1. Tap "Pay Now" or "Upload Proof" on unpaid invoice card. | Opens bottom modal showing GCash number / Bank account and photo upload zone. | Pass | Modal Trigger |
| **TC-MOB-026** | `/mobile/tenant/pay` | Verify GCash payment QR and account copying | Inside Payment Checkout Modal. | 1. Tap "Copy Account Number" next to GCash number.<br>2. Check clipboard. | Number is copied to clipboard with success toast notification and haptic vibration. | Pass | Clipboard API |
| **TC-MOB-027** | `/mobile/tenant/pay` | Verify Payment Proof Submission with reference number | Proof modal open. | 1. Enter 13-digit GCash reference number.<br>2. Select/attach screenshot photo.<br>3. Tap "Submit Payment Proof". | Submits to `/api/tenant/payments/[id]/submit`; status updates to "Under Verification"; landlord receives alert. | Pass | End-to-End Pay |
| **TC-MOB-028** | `/mobile/tenant/pay` | Verify Payment Receipts History download | Past verified payments exist. | 1. Switch to "Paid" tab.<br>2. Tap "View Official Receipt" on paid bill. | Displays digital Official Receipt (`#OR-...`) with itemized deductions and confirmation timestamp. | Pass | Receipt Modal |

---

## Module 5: Tenant Lease Agreement, Renewals & Move-Out Clearance Drawer

| Test ID | Screen / Path | Test Objective | Preconditions | Execution Steps | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-029** | `/mobile/tenant/lease` | Verify active lease contract details & tenure display | Active lease exists. | 1. Navigate to `/mobile/tenant/lease`.<br>2. Review tenure and dates. | Displays unit name, start date, end date (or open-ended tenure), monthly rent, and security deposit. | Pass | Lease Overview |
| **TC-MOB-030** | `/mobile/tenant/lease` | Verify digital lease agreement contract modal | Active lease exists. | 1. Tap "View Lease Agreement" button. | Opens full contract viewer with property manager signature and electronic terms. | Pass | Contract Viewer |
| **TC-MOB-031** | `/mobile/tenant/lease` | Verify Lease Extension Request bottom sheet | Lease has end date. | 1. Tap "Request Lease Extension".<br>2. Choose desired term (6 months, 1 year).<br>3. Add notes and submit. | Submits renewal proposal to `/api/tenant/renewals`; updates status to "Renewal Requested". | Pass | Renewal Sheet |
| **TC-MOB-032** | `/mobile/tenant/lease` | Verify Notice to Vacate drawer trigger | On Tenant Lease view. | 1. Tap the "Notice to Vacate" action card. | Bottom drawer opens displaying statutory 30-day notice rule and date picker. | Pass | Drawer Trigger |
| **TC-MOB-033** | MobileMoveOutDrawer | Enforce minimum 30-calendar-day notice rule | Move-out drawer open. | 1. Attempt to pick a date within 10 days.<br>2. Inspect error text. | Form displays error: "Minimum 30 calendar days notice required"; submit button is disabled. | Pass | Date Rule |
| **TC-MOB-034** | MobileMoveOutDrawer | Verify quick preset buttons (+30 Days & Lease End Date) | Move-out drawer open. | 1. Tap "+30 Days (Earliest)" preset button.<br>2. Check input value. | Date input immediately auto-fills with the exact eligible 30-day date and clears error. | Pass | Preset Helper |
| **TC-MOB-035** | MobileMoveOutDrawer | Submit Notice to Vacate with forwarding details | Valid date chosen. | 1. Enter relocation reason / forwarding address in textarea.<br>2. Tap "Submit Notice". | Submits `POST /api/tenant/lease/move-out`; success toast appears; stepper advances to "Under Landlord Review". | Pass | Flow Parity |
| **TC-MOB-036** | MobileMoveOutDrawer | Verify Interactive Clearance Checklist & Deposit Deductions | Move-out request approved by landlord. | 1. Open drawer.<br>2. Tap checklist item: "Return physical keys & access fobs".<br>3. Review deposit deductions breakdown. | Checklist item marks complete with strike-through and syncs via API (`PUT /api/.../checklist`); itemized deductions and net refund in ₱ displayed. | Pass | Parity Parity |

---

## Module 6: Tenant Amenity Booking Drawer & Facility Reservations

| Test ID | Screen / Path | Test Objective | Preconditions | Execution Steps | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-037** | MobileAmenityDrawer | Verify facility category filter chips (Gym, Lounge, Roof Deck) | Amenities configured on property. | 1. Trigger amenity booking drawer.<br>2. Tap "Gym" filter chip.<br>3. Tap "All" filter chip. | Facility cards filter dynamically to show only the selected category with capacity badges. | Pass | Category Chips |
| **TC-MOB-038** | MobileAmenityDrawer | Verify reservation date picker and available time slots | Facility selected. | 1. Select reservation date.<br>2. Review available 1-hour time slots. | Grid of time slots renders; slots already booked by other tenants display as disabled/reserved. | Pass | Slot Detection |
| **TC-MOB-039** | MobileAmenityDrawer | Real-time pricing calculation for paid amenities | Paid facility selected (e.g. Function Hall). | 1. Select 3 hours duration.<br>2. Observe total price indicator. | Total updates in real time: `Hourly Rate × Duration = ₱X,XXX`. | Pass | Live Price |
| **TC-MOB-040** | MobileAmenityDrawer | Enforce facility house rules acknowledgement | Reservation form filled. | 1. Attempt to confirm booking without checking rules box.<br>2. Check submit button. | Submit button is disabled; warning message asks tenant to accept building facility rules. | Pass | Form Validation |
| **TC-MOB-041** | MobileAmenityDrawer | Confirm facility reservation and schedule update | All fields and rules checked. | 1. Tap "Confirm Booking".<br>2. Review success feedback. | Booking submitted via `POST /api/tenant/amenities/book`; haptic vibration triggers; event appears on calendar. | Pass | End-to-End Book |
| **TC-MOB-042** | `/mobile/tenant/calendar` | Verify booked amenity appears on tenant calendar | Amenity booking confirmed. | 1. Navigate to `/mobile/tenant/calendar`.<br>2. Find reservation date. | Facility event card displays with time range, amenity badge, and cancellation option. | Pass | Calendar Sync |

---

## Module 7: Landlord Operations Center & Intelligence Hub

| Test ID | Screen / Path | Test Objective | Preconditions | Execution Steps | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-043** | `/mobile/landlord/overview` | Verify property switcher dropdown | Landlord has properties configured. | 1. Tap top property selector card.<br>2. Select "Fernando Gonzales Dormitory". | Active property updates across dashboard, refreshing all metrics and room counts immediately. | Pass | Property Switch |
| **TC-MOB-044** | `/mobile/landlord/overview` | Verify Hero Card with dynamic digital clock | Landlord overview loaded. | 1. Inspect top `.m-hero` card.<br>2. Observe digital clock and date. | Displays live digital clock in Philippine Standard Time (PST), current date, and custom property banner. | Pass | Digital Clock |
| **TC-MOB-045** | `/mobile/landlord/overview` | Verify Intelligence Hub cards (Overdue, Near Due, Vacant, Invites) | Operational data loaded. | 1. Inspect Intelligence Hub metrics grid.<br>2. Tap "Overdue" card. | Card displays count and total ₱ overdue; tapping navigates directly to `/mobile/landlord/payments?tab=overdue`. | Pass | Metrics Nav |
| **TC-MOB-046** | `/mobile/landlord/overview` | Verify Quick Action Toolbar buttons | Landlord overview loaded. | 1. Tap "Collect" button.<br>2. Tap "Calendar" button.<br>3. Tap "Tickets" button. | Each action button triggers its drawer or view instantly with tactile haptic feedback. | Pass | Quick Actions |
| **TC-MOB-047** | `/mobile/landlord/overview` | Verify Fast Action cards: "Issue Invoice" & "Record Expense" | Landlord overview loaded. | 1. Scroll to Cash Flow Ledger.<br>2. Tap "+ Bill" card.<br>3. Tap "- Expense" card. | Directly opens `MobileIssueInvoiceDrawer` and `MobileRecordExpenseDrawer` without leaving the dashboard. | Pass | Parity Drawers |
| **TC-MOB-048** | `/mobile/landlord/overview` | Verify Recent Activity Feed & payment events | Activity logs exist. | 1. Scroll to Recent Activity.<br>2. Tap on recent payment log. | Shows tenant name, room number, payment timestamp, and opens transaction audit modal. | Pass | Activity Feed |
| **TC-MOB-049** | `/mobile/landlord/overview` | Verify Lobby Flyer Studio shortcut | Landlord overview loaded. | 1. Tap "Lobby Flyer" shortcut button. | Navigates to flyer poster studio view for printing physical dormitory notices. | Pass | Studio Link |

---

## Module 8: Landlord Fast Cash Flow: Offline Payment, Invoicing & Expenses

| Test ID | Screen / Path | Test Objective | Preconditions | Execution Steps | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-050** | MobileCollectDrawer | Verify active invoice selector for offline intake | Unpaid tenant bills exist. | 1. Tap "Collect" on overview or payments view.<br>2. Open invoice dropdown. | Displays all unpaid invoices with tenant name, room number, and balance in ₱. Auto-selects first bill. | Pass | Auto-Select |
| **TC-MOB-051** | MobileCollectDrawer | Verify payment method chips (Cash, GCash, Bank Transfer) | Collect payment drawer open. | 1. Tap "Cash".<br>2. Tap "GCash".<br>3. Tap "Bank Transfer". | Selected method highlights; reference number field adapts requirements (required for GCash/Bank). | Pass | Method Selector |
| **TC-MOB-052** | MobileCollectDrawer | Verify partial payment calculation and balance warning | Total bill is ₱4,500. | 1. Type amount `3000`.<br>2. Observe remaining balance indicator. | System displays remaining unpaid balance (`₱1,500`) and tags payment as partial. | Pass | Partial Math |
| **TC-MOB-053** | MobileCollectDrawer | Submit offline payment & generate Official Receipt number | Form filled with valid inputs. | 1. Tap "Record Payment".<br>2. Review confirmation feedback. | Submits to `/api/landlord/payments/offline`; fires success haptic; generates `#OR-YYYY-XXXXX` receipt. | Pass | Offline Intake |
| **TC-MOB-054** | MobileInvoiceDrawer | Dynamic line item addition & real-time total in ₱ | Issue invoice drawer open. | 1. Select tenant lease.<br>2. Add "Electricity" line item (₱850).<br>3. Add "Water" line item (₱320). | Total amount computes live in ₱; displays formatted breakdown. | Pass | Dynamic Items |
| **TC-MOB-055** | MobileInvoiceDrawer | Enforce valid billing month and due date | Issue invoice drawer open. | 1. Choose billing month.<br>2. Pick due date before billing month.<br>3. Inspect validation. | Displays error: "Due date cannot be before billing month start"; submit button disabled. | Pass | Due Date Rule |
| **TC-MOB-056** | MobileInvoiceDrawer | Dispatch new monthly invoice to tenant | Valid lines and dates configured. | 1. Tap "Issue Invoice".<br>2. Check tenant account. | Submits to `/api/landlord/invoices`; invoice created; tenant receives bill notification instantly. | Pass | Invoice API |
| **TC-MOB-057** | MobileExpenseDrawer | Record operating expense with category chips | Record expense drawer open. | 1. Select property.<br>2. Tap "Maintenance" category chip.<br>3. Enter amount ₱1,200, date incurred, and receipt description.<br>4. Tap "Save Expense". | Submits to `/api/landlord/expenses`; expense logged to financial ledger; deducts from net cash flow. | Pass | Expense API |

---

## Module 9: Landlord Leases, Overrides, Fast Renewals & Move-Out Audit

| Test ID | Screen / Path | Test Objective | Preconditions | Execution Steps | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-058** | `/mobile/landlord/leases` | View active lease contracts & search by tenant name | Multiple leases exist. | 1. Navigate to `/mobile/landlord/leases`.<br>2. Type "Maria" in search bar. | Lease list filters instantly to show Maria Santos's contract, room, and end date. | Pass | Instant Search |
| **TC-MOB-059** | `/mobile/landlord/leases` | Switch to Renewals Tab & review pending tenant requests | Tenant requested extension. | 1. Tap "Renewals" tab at top.<br>2. Review pending proposal card. | Shows requested term, proposed rent, and landlord action buttons ("Approve", "Counter", "Adjust"). | Pass | Renewals Tab |
| **TC-MOB-060** | `/mobile/landlord/leases` | Interactive Term Switcher (6 Months, 1 Year, Month-to-Month) | Lease renewal modal open. | 1. Tap "1 Year" term button.<br>2. Tap "6 Months".<br>3. Tap "Month-to-Month". | Lease end date recalculates automatically based on selected term duration. | Pass | Term Switcher |
| **TC-MOB-061** | `/mobile/landlord/leases` | Custom rent adjustment override input | Renewal modal open. | 1. Toggle "Adjust Monthly Rent".<br>2. Enter new rent amount (e.g. ₱5,000).<br>3. Tap "Generate Signing Link". | Generates digital countersigning link with adjusted rent terms and copies to clipboard. | Pass | Rent Override |
| **TC-MOB-062** | `/mobile/landlord/move-out` | View pending notices to vacate & inspection schedule | Tenant submitted notice. | 1. Navigate to `/mobile/landlord/move-out`.<br>2. Review pending notice card. | Displays tenant room, requested move-out date, and relocation reason. | Pass | Move-Out View |
| **TC-MOB-063** | MobileMoveOutInspect | Fast Move-Out Inspection & Security Deposit Deductions | Notice to vacate approved. | 1. Tap "Conduct Inspection".<br>2. Add deduction: "Wall repaint retouch" (₱1,500).<br>3. Add deduction: "Unpaid electric submeter" (₱650). | Deposit calculator shows: `Initial Deposit - Deductions = Net Refund to Tenant`. | Pass | Inspection Drawer |
| **TC-MOB-064** | `/mobile/landlord/move-out` | Finalize move-out clearance and terminate lease | Inspection completed. | 1. Confirm refund disbursement method.<br>2. Tap "Finalize Clearance & Terminate Lease". | Lease status updates to `terminated`; unit status flips to `vacant`; tenant marked cleared. | Pass | Clearance Parity |

---

## Module 10: Operations Calendar, Messaging, Notifications & Deep Linking

| Test ID | Screen / Path | Test Objective | Preconditions | Execution Steps | Expected Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-MOB-065** | `/mobile/landlord/calendar` | Shared schedule navigation & category filter chips | Operational events exist. | 1. Navigate to `/mobile/landlord/calendar`.<br>2. Tap "Maintenance" filter chip.<br>3. Tap "Move-Outs" filter chip. | Calendar highlights matching event days; lower cards filter to selected category. | Pass | Category Pills |
| **TC-MOB-066** | `/mobile/shared/calendar` | Add personal operational reminder (`useCalendarNotes`) | On calendar view. | 1. Tap "+ Note" floating button.<br>2. Enter title: "Inspect water tank pressure", pick date.<br>3. Tap "Save Note". | Personal note saves to local storage / API; displays with violet star badge on calendar date. | Pass | Personal Notes |
| **TC-MOB-067** | `/mobile/notifications` | Deep-link landlord lease renewal notification | Landlord received renewal notice. | 1. Open Notifications screen.<br>2. Tap "New Lease Renewal Proposal" card. | Automatically marks notification as read and navigates directly to `/mobile/landlord/leases?tab=renewals`. | Pass | Phase 9 Deep Link |
| **TC-MOB-068** | `/mobile/notifications` | Deep-link landlord move-out notification | Landlord received move-out notice. | 1. Open Notifications screen.<br>2. Tap "Notice to Vacate Submitted" card. | Automatically marks notification as read and navigates directly to `/mobile/landlord/move-out`. | Pass | Phase 9 Deep Link |
| **TC-MOB-069** | `/mobile/notifications` | Deep-link tenant move-out clearance notice | Tenant received approval notice. | 1. Open Notifications as tenant.<br>2. Tap "Move-Out Approved" notification card. | Marks as read and deep-links directly to `/mobile/tenant/lease` where clearance drawer is hosted. | Pass | Phase 9 Deep Link |
| **TC-MOB-070** | `/mobile/landlord/messages` | Direct chat with tenant & floating action button positioning | Messages view open. | 1. Inspect FAB "+ New Chat" button above bottom tab bar.<br>2. Type message to Maria Santos and tap Send. | FAB does not overlap bottom navigation (`mobile-above-tab-bar`); message pops in with `bubbleMotion`. | Pass | Messaging Parity |

---

## 2. Test Execution Sign-Off Matrix

- **Unit & Integration Test Automation Suites**: 10 Test Suites / 40 Vitest Automated Tests Passing (100%)
- **TypeScript Static Compilation Gate**: `tsc --noEmit` — 0 Errors
- **Violet Ledger Theme Compatibility**: Light Mode & Dark Mode Verified
- **Haptic Tactile Engine**: Verified via Web Vibration API / `triggerHaptic`
