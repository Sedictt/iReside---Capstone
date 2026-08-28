# iReside — Landlord User Manual

> **Property Management & Operations Platform**  
> **Dedicated Operational Guide for Property Owners, Managers, and Leasing Staff**  
> *Version 2.0 | 2026 Edition*

---

## Table of Contents

1. [Introduction & Platform Architecture](#1-introduction--platform-architecture)
   - 1.1 [Welcome to iReside for Landlords](#11-welcome-to-ireside-for-landlords)
   - 1.2 [System Requirements & PWA App Installation](#12-system-requirements--pwa-app-installation)
   - 1.3 [User Roles & Access Permissions](#13-user-roles--access-permissions)
2. [Account Setup & Landlord Onboarding](#2-account-setup--landlord-onboarding)
   - 2.1 [Registration & Business Verification](#21-registration--business-verification)
   - 2.2 [The Guided Onboarding Wizard](#22-the-guided-onboarding-wizard)
   - 2.3 [Theme & Navigation Customization (Dark / Light Mode)](#23-theme--navigation-customization-dark--light-mode)
3. [The Landlord Dashboard](#3-the-landlord-dashboard)
   - 3.1 [Executive Portfolio Summary Cards](#31-executive-portfolio-summary-cards)
   - 3.2 [Revenue & Occupancy Metrics](#32-revenue--occupancy-metrics)
   - 3.3 [Actionable Alerts & Pending Queue](#33-actionable-alerts--pending-queue)
   - 3.4 [Recent Activity Feed](#34-recent-activity-feed)
4. [Property & Unit Management](#4-property--unit-management)
   - 4.1 [Adding a New Property](#41-adding-a-new-property)
   - 4.2 [Configuring Property Details, Address & Amenities](#42-configuring-property-details-address--amenities)
   - 4.3 [Adding and Organizing Units by Floor](#43-adding-and-organizing-units-by-floor)
   - 4.4 [Understanding Unit Status Indicators](#44-understanding-unit-status-indicators)
   - 4.5 [Editing, Archiving, and Deleting Units/Properties](#45-editing-archiving-and-deleting-unitsproperties)
5. [Visual Unit Map (2D & 3D Interactive Layouts)](#5-visual-unit-map-2d--3d-interactive-layouts)
   - 5.1 [Configuring Floorplans & Coordinates](#51-configuring-floorplans--coordinates)
   - 5.2 [Navigating the 2D Color-Coded Map](#52-navigating-the-2d-color-coded-map)
   - 5.3 [Using the 3D Interactive Building Explorer](#53-using-the-3d-interactive-building-explorer)
   - 5.4 [Quick Unit Actions from the Map](#54-quick-unit-actions-from-the-map)
6. [Tenant Management & Directory](#6-tenant-management--directory)
   - 6.1 [Navigating the Tenant Directory](#61-navigating-the-tenant-directory)
   - 6.2 [Tenant Profile Deep-Dive](#62-tenant-profile-deep-dive)
   - 6.3 [Assigning Tenants to Units](#63-assigning-tenants-to-units)
   - 6.4 [Managing Emergency Contacts & Vehicle Info](#64-managing-emergency-contacts--vehicle-info)
7. [Rental Application Processing & Screening](#7-rental-application-processing--screening)
   - 7.1 [Receiving New Applications](#71-receiving-new-applications)
   - 7.2 [Reviewing Applicant Credentials & Verification Documents](#72-reviewing-applicant-credentials--verification-documents)
   - 7.3 [Approving Applications & Converting to Lease](#73-approving-applications--converting-to-lease)
   - 7.4 [Rejecting Applications & Sending Notice](#74-rejecting-applications--sending-notice)
8. [Lease Administration & Digital Signatures](#8-lease-administration--digital-signatures)
   - 8.1 [Creating a New Lease Agreement](#81-creating-a-new-lease-agreement)
   - 8.2 [Configuring Rent, Deposits & Custom Terms](#82-configuring-rent-deposits--custom-terms)
   - 8.3 [Dispatching for Tenant E-Signature](#83-dispatching-for-tenant-e-signature)
   - 8.4 [Landlord Countersigning via Digital Signature Pad](#84-landlord-countersigning-via-digital-signature-pad)
   - 8.5 [Managing Active, Expiring, and Terminated Leases](#85-managing-active-expiring-and-terminated-leases)
   - 8.6 [Generating & Archiving Signed PDF Contracts](#86-generating--archiving-signed-pdf-contracts)
9. [Financial Management & Invoicing](#9-financial-management--invoicing)
   - 9.1 [Generating Automated & Manual Invoices](#91-generating-automated--manual-invoices)
   - 9.2 [Configuring Rent Schedules & Due Dates](#92-configuring-rent-schedules--due-dates)
   - 9.3 [Managing Overdue Invoices & Late Payment Penalties](#93-managing-overdue-invoices--late-payment-penalties)
   - 9.4 [Recording Offline/Manual Payments (Cash, Bank Transfer, Cheque)](#94-recording-offlinemanual-payments-cash-bank-transfer-cheque)
   - 9.5 [Issuing Official Receipts (PDF)](#95-issuing-official-receipts-pdf)
10. [Maintenance Oversight & Work Orders](#10-maintenance-oversight--work-orders)
    - 10.1 [Maintenance Ticket Triage & Urgency Prioritization](#101-maintenance-ticket-triage--urgency-prioritization)
    - 10.2 [Assigning In-House Technicians or Third-Party Contractors](#102-assigning-in-house-technicians-or-third-party-contractors)
    - 10.3 [Managing Ticket Lifecycle (Pending $\rightarrow$ In Progress $\rightarrow$ Resolved $\rightarrow$ Closed)](#103-managing-ticket-lifecycle-pending-rightarrow-in-progress-rightarrow-resolved-rightarrow-closed)
    - 10.4 [Handling Self-Repair Requests & Material Reimbursements](#104-handling-self-repair-requests--material-reimbursements)
    - 10.5 [Logging Maintenance Costs & Invoicing Tenant Damages](#105-logging-maintenance-costs--invoicing-tenant-damages)
11. [Utility Meter Tracking & Utility Billing](#11-utility-meter-tracking--utility-billing)
    - 11.1 [Logging Meter Readings (Electricity, Water, Gas)](#111-logging-meter-readings-electricity-water-gas)
    - 11.2 [Automated Consumption Calculations](#112-automated-consumption-calculations)
    - 11.3 [Generating Consolidated Utility Invoices](#113-generating-consolidated-utility-invoices)
    - 11.4 [Utility Arrears & Payment Tracking](#114-utility-arrears--payment-tracking)
12. [Document Management & Compliance Vault](#12-document-management--compliance-vault)
    - 12.1 [Centralized Digital Document Repository](#121-centralized-digital-document-repository)
    - 12.2 [Uploading Property Titles, Insurance & Permits](#122-uploading-property-titles-insurance--permits)
    - 12.3 [Managing Tenant IDs, Clearances & Contracts](#123-managing-tenant-ids-clearances--contracts)
    - 12.4 [Security, Access Control & File Retention](#124-security-access-control--file-retention)
13. [Move-Out Management & Deposit Settlement](#13-move-out-management--deposit-settlement)
    - 13.1 [Handling Move-Out Notices](#131-handling-move-out-notices)
    - 13.2 [Conducting Move-Out Inspections & Photographic Records](#132-conducting-move-out-inspections--photographic-records)
    - 13.3 [Itemizing Deductions (Unpaid Utilities, Damages, Cleaning)](#133-itemizing-deductions-unpaid-utilities-damages-cleaning)
    - 13.4 [Executing Security Deposit Refund & Final Ledger Closure](#134-executing-security-deposit-refund--final-ledger-closure)
14. [Communications & Messaging](#14-communications--messaging)
    - 14.1 [Direct Messaging with Tenants & Applicants](#141-direct-messaging-with-tenants--applicants)
    - 14.2 [Sending Multimedia Attachments & Notices](#142-sending-multimedia-attachments--notices)
    - 14.3 [Automated Moderation & Chat Oversight](#143-automated-moderation--chat-oversight)
15. [Community Management & Announcements](#15-community-management--announcements)
    - 15.1 [Publishing Building-Wide Announcements](#151-publishing-building-wide-announcements)
    - 15.2 [Moderating the Community Feed & Resident Discussions](#152-moderating-the-community-feed--resident-discussions)
    - 15.3 [Establishing & Updating Property House Rules](#153-establishing--updating-property-house-rules)
16. [Calendar, Inspections & Showing Schedules](#16-calendar-inspections--showing-schedules)
    - 16.1 [Calendar Overview](#161-calendar-overview)
    - 16.2 [Managing Property Tour Bookings](#162-managing-property-tour-bookings)
    - 16.3 [Scheduling Routine Inspections & Maintenance Windows](#163-scheduling-routine-inspections--maintenance-windows)
17. [Marketing & Property Flyer Generator](#17-marketing--property-flyer-generator)
    - 17.1 [Generating Vacancy Marketing Flyers](#171-generating-vacancy-marketing-flyers)
    - 17.2 [Customizing Flyer Templates & QR Codes](#172-customizing-flyer-templates--qr-codes)
    - 17.3 [Exporting for Social Media & Print](#173-exporting-for-social-media--print)
18. [Portfolio Analytics & Financial Reporting](#18-portfolio-analytics--financial-reporting)
    - 18.1 [Occupancy Rate & Vacancy Analysis](#181-occupancy-rate--vacancy-analysis)
    - 18.2 [Gross & Net Revenue Trends](#182-gross--net-revenue-trends)
    - 18.3 [Maintenance Cost & Frequency Reports](#183-maintenance-cost--frequency-reports)
    - 18.4 [Tenant Turnover & Renewal Metrics](#184-tenant-turnover--renewal-metrics)
19. [Profile, Settings & Account Security](#19-profile-settings--account-security)
    - 19.1 [Managing Landlord / Company Profile](#191-managing-landlord--company-profile)
    - 19.2 [Notification Preferences & Webhook Channels](#192-notification-preferences--webhook-channels)
    - 19.3 [Security, Two-Factor Authentication & Passwords](#193-security-two-factor-authentication--passwords)
20. [Troubleshooting & Operational FAQs](#20-troubleshooting--operational-faqs)
    - 20.1 [Handling Payment Disputes & Ledger Adjustments](#201-handling-payment-disputes--ledger-adjustments)
    - 20.2 [Addressing Lease Signing Bottlenecks](#202-addressing-lease-signing-bottlenecks)
    - 20.3 [Offline Operation & Data Sync](#203-offline-operation--data-sync)
    - 20.4 [Frequently Asked Questions (FAQ)](#204-frequently-asked-questions-faq)

---

## 1. Introduction & Platform Architecture

### 1.1 Welcome to iReside for Landlords

**iReside** is a next-generation property management system engineered for property owners, residential building managers, and leasing teams. It streamlines the complete lifecycle of property management into a unified, cloud-based platform:

- **Portfolio Control**: Centralize properties, buildings, units, and floor layouts.
- **Tenant Lifecycle**: From initial application and screening to digital lease signing and move-out inspections.
- **Automated Financials**: Instant invoice creation, multi-channel payment reconciliation, submeter utility billing, and downloadable official receipts.
- **Maintenance Engine**: Prioritized ticket routing, photo triage, contractor coordination, and maintenance cost logging.
- **Visual Intelligence**: Interactive 2D floor plans and 3D visual unit mapping.

### 1.2 System Requirements & PWA App Installation

iReside runs efficiently across any modern web browser:
- **Recommended Browsers**: Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari (current versions).
- **Mobile Responsive**: Fully optimized for tablets (iPad, Android tablets) and mobile devices.

#### Installing as a Progressive Web App (PWA):
1. **On Desktop (Chrome/Edge)**: Click the **Install iReside** icon in the URL search bar.
2. **On iOS (Safari)**: Tap the **Share** icon $\rightarrow$ select **"Add to Home Screen"**.
3. **On Android (Chrome)**: Tap the **Menu (⋮)** $\rightarrow$ select **"Install App"**.

### 1.3 User Roles & Access Permissions

- **Landlord / Property Owner**: Full administrative privileges over owned properties, leases, financial ledgers, and tenant records.
- **Tenant**: Self-service resident access to their assigned unit, invoices, maintenance tickets, and community features.
- **Administrator**: System-wide governance, moderation, and technical verification.

---

## 2. Account Setup & Landlord Onboarding

### 2.1 Registration & Business Verification

1. Go to the registration page or follow your invite link.
2. Provide your **Full Legal Name**, **Company / Trade Name**, **Business Email**, and **Mobile Phone Number**.
3. Upload verification credentials (e.g., DTI/SEC registration, Mayor's Permit, or Government ID) for compliance.
4. Once verified, you will receive full access to your Landlord Workspace.

### 2.2 The Guided Onboarding Wizard

New landlords can access `/landlord/onboarding`:
- **Step 1: Company Profile**: Set up your company logo, business address, and banking details for payout.
- **Step 2: Add First Property**: Input your initial building or residential complex.
- **Step 3: Define Units & Rates**: Bulk configure or individually add units, rent amounts, and security deposits.
- **Step 4: Invite Tenants**: Import existing tenants or share vacancy application links.

### 2.3 Theme & Navigation Customization (Dark / Light Mode)

Toggle between Dark and Light mode anytime using the **Sun / Moon** icon in the sidebar. Dark mode is specifically optimized for low-light management and OLED screens to reduce eye fatigue.

---

## 3. The Landlord Dashboard

### 3.1 Executive Portfolio Summary Cards

Located at `/landlord/dashboard`:
- **Total Properties**: Count of registered buildings/complexes.
- **Total Units**: Aggregate inventory across all properties.
- **Occupancy Rate**: Real-time percentage of units under active lease ($\frac{\text{Occupied Units}}{\text{Total Units}} \times 100$).
- **Active Leases**: Number of legally binding contracts currently in effect.
- **Pending Maintenance**: Open repair tickets requiring scheduling or review.
- **Monthly Revenue**: Aggregated collections for the active billing cycle.

### 3.2 Revenue & Occupancy Metrics

Interactive charts provide instant visual analysis:
- **Income Over Time**: Monthly comparison of expected vs. actual collected revenue.
- **Occupancy Trends**: Historical occupancy rate over 3, 6, and 12 months.

### 3.3 Actionable Alerts & Pending Queue

The pending queue highlights urgent operational tasks:
- Rental applications awaiting screening.
- Leases awaiting landlord countersignature.
- Emergency maintenance requests flagged by tenants.
- Overdue invoices requiring payment follow-up.

### 3.4 Recent Activity Feed

A live chronological audit trail of all transactions, message alerts, maintenance updates, and new lease signings across all managed properties.

---

## 4. Property & Unit Management

### 4.1 Adding a New Property

1. Go to **Properties** (`/landlord/properties`).
2. Click the **+ Add Property** button.
3. Fill in the required fields:
   - **Property Name**: e.g., *"Grand Horizon Residences"*.
   - **Address Details**: Street, Barangay, City, Postal Code, Province.
   - **Property Type**: Apartment Building, Condominium, Townhouse Complex, Commercial/Residential.
   - **Description**: Public overview highlight for prospective tenants.
4. Select the property amenities (Swimming Pool, Gym, 24/7 Security, Elevator, Backup Generator, Parking, Fiber Wi-Fi).
5. Upload high-resolution property exterior and lobby photos.
6. Click **Save Property**.

### 4.2 Configuring Property Details, Address & Amenities

You can update property amenities, operational rules, or contact numbers at any time by clicking **Edit Property**.

### 4.3 Adding and Organizing Units by Floor

1. Open the property card and navigate to the **Units** tab.
2. Click **+ Add Unit**.
3. Specify unit specifications:
   - **Unit Number / Name**: e.g., *"Unit 402"* or *"Penthouse B"*.
   - **Floor Level**: e.g., *"Floor 4"*.
   - **Bedrooms / Bathrooms**: e.g., 2 Bed, 1 Bath.
   - **Floor Area ($m^2$)**: e.g., 48 $m^2$.
   - **Monthly Rental Rate**: e.g., ₱25,000.
   - **Security Deposit**: e.g., ₱50,000 (2 months deposit).
4. Upload unit interior photos.
5. Click **Save Unit**.

### 4.4 Understanding Unit Status Indicators

Units across the platform are tagged with standard visual color indicators:

| Color Status | State | Description |
|---|---|---|
| 🟢 **Green** | **Vacant** | Available for rent; open for new applications |
| 🔵 **Blue** | **Occupied** | Currently leased to an active tenant |
| 🟡 **Amber** | **Payment Due / Overdue** | Tenant has an unpaid active balance |
| 🔴 **Red** | **Under Maintenance** | Under repair or deep cleaning; not ready for move-in |

### 4.5 Editing, Archiving, and Deleting Units/Properties

- **Edit**: Update rental rates, inclusions, or unit photos.
- **Archive**: Deactivate a unit undergoing extensive long-term renovation without losing historical accounting records.
- **Delete**: Remove a mistakenly created unit (only permitted if no financial records or active leases are attached).

---

## 5. Visual Unit Map (2D & 3D Interactive Layouts)

### 5.1 Configuring Floorplans & Coordinates

Go to **Unit Map** (`/landlord/unit-map`):
- Upload an architectural floorplan SVG or blueprint.
- Position unit hotspots over the visual blueprint corresponding to their physical locations.

### 5.2 Navigating the 2D Color-Coded Map

- Select property and floor level from the dropdown.
- Inspect unit statuses instantly via color overlays (Green, Blue, Amber, Red).
- Hover over any unit to view tenant name, lease expiration date, and rent status.

### 5.3 Using the 3D Interactive Building Explorer

- Click **Toggle 3D View**.
- Orbit, pan, and zoom around a 3D isometric representation of the building.
- Ideal for showing unit locations to prospective tenants during virtual showings.

### 5.4 Quick Unit Actions from the Map

Clicking on any unit hotspot brings up a quick modal menu:
- **View Tenant Profile**
- **Generate Invoice**
- **Create Maintenance Ticket**
- **Draft Lease**

---

## 6. Tenant Management & Directory

### 6.1 Navigating the Tenant Directory

Go to **Tenants** (`/landlord/tenants`):
- Filter tenants by Property, Floor, Lease Status (Active, Expiring, Past), or Payment Status.
- Use the quick search bar to find tenants by name, email, unit number, or phone number.

### 6.2 Tenant Profile Deep-Dive

Clicking on any tenant row opens their complete profile:
- **General Info**: Contact info, government ID copy, emergency contacts.
- **Lease Details**: Active contract terms, start/end dates, monthly rate.
- **Payment History**: Complete ledger of all historical invoices and receipts.
- **Maintenance History**: All tickets filed by this tenant and resolution records.
- **Communication Log**: Direct link to the messaging conversation.

### 6.3 Assigning Tenants to Units

1. Open the tenant profile or approved application.
2. Click **Assign to Unit**.
3. Select the vacant unit from the dropdown list.
4. Proceed to generate a lease contract.

### 6.4 Managing Emergency Contacts & Vehicle Info

Record tenant vehicle license plates, parking slot allocations, and emergency contact details for building security protocols.

---

## 7. Rental Application Processing & Screening

### 7.1 Receiving New Applications

Go to **Applications** (`/landlord/applications`):
- All applications submitted via public listing links or the tenant portal appear in the **Pending** queue.
- Application badges display submission date, applicant name, requested unit, and target move-in date.

### 7.2 Reviewing Applicant Credentials & Verification Documents

Open an application to review:
- **Income Verification**: Uploaded pay stubs, certificates of employment, or bank statements.
- **Identity Verification**: Government ID copies.
- **Rental History**: References from previous landlords and reason for moving.

### 7.3 Approving Applications & Converting to Lease

1. Click **Approve Application**.
2. Click **Create Lease from Application**.
3. The system automatically populates the tenant's details into a new draft lease contract.

### 7.4 Rejecting Applications & Sending Notice

1. Click **Reject Application**.
2. Select a rejection reason (e.g., *"Unit no longer available"*, *"Incomplete verification documents"*).
3. Optionally add a personalized message to the applicant.
4. Click **Confirm Rejection**. The applicant receives an automated polite notice.

---

## 8. Lease Administration & Digital Signatures

### 8.1 Creating a New Lease Agreement

1. Go to **Leases** (`/landlord/leases`).
2. Click **+ Create Lease**.
3. Select the **Property**, **Unit**, and **Tenant**.
4. Set the **Start Date** and **End Date** (e.g., 1-year standard term).

### 8.2 Configuring Rent, Deposits & Custom Terms

- **Monthly Rent Amount**: In Philippine Pesos (₱).
- **Payment Due Day**: e.g., *1st* or *5th* of every month.
- **Security Deposit Amount**: e.g., 2 months rent.
- **Advance Rent Amount**: e.g., 1 month advance.
- **Utility Clauses**: Define tenant vs. landlord utility responsibilities.
- **Custom Clauses**: Add custom rules (e.g., pet policies, maximum occupants, quiet hours).

### 8.3 Dispatching for Tenant E-Signature

1. Click **Send for Signature**.
2. The tenant receives an email notification with a secure signing link.
3. The lease status updates to **Pending Tenant Signature**.

### 8.4 Landlord Countersigning via Digital Signature Pad

1. Once the tenant signs, you receive a notification: *"Tenant has signed lease"*.
2. Open the lease contract in `/landlord/leases`.
3. Review the tenant's signature and timestamp.
4. Draw your digital signature on the Landlord Signature Pad.
5. Click **Countersign & Activate Lease**.
6. The lease transitions to **Active** status.

### 8.5 Managing Active, Expiring, and Terminated Leases

- **Active**: Contracts currently running.
- **Expiring Soon**: Highlighted contracts within 30–60 days of completion (prompting renewal).
- **Expired / Terminated**: Concluded agreements archived for compliance.

### 8.6 Generating & Archiving Signed PDF Contracts

Once both parties have signed, iReside generates an official **Signed Lease Agreement PDF** containing:
- Cryptographic timestamp of both signatures.
- Full contract clauses and schedules.
- Direct download availability for both Landlord and Tenant.

---

## 9. Financial Management & Invoicing

### 9.1 Generating Automated & Manual Invoices

Go to **Invoices** (`/landlord/invoices`):
- **Automated Invoices**: The system automatically generates recurring monthly rent invoices based on active lease terms.
- **Manual Invoices**: Click **+ Create Invoice** to bill for special charges:
  - Utility Submeters (Electricity, Water).
  - Damage repairs or extra cleaning fees.
  - Parking slot fees.
  - Association dues.

### 9.2 Configuring Rent Schedules & Due Dates

Set automated billing dates (e.g., invoices generated 5 days before due date).

### 9.3 Managing Overdue Invoices & Late Payment Penalties

- Invoices unpaid after the due date automatically update to **Overdue** status.
- The corresponding unit turns **Amber** on the Unit Map.
- Automated payment reminder emails are dispatched to the tenant.

### 9.4 Recording Offline/Manual Payments (Cash, Bank Transfer, Cheque)

If a tenant pays via direct cash or bank deposit:
1. Open the unpaid invoice in `/landlord/invoices`.
2. Click **Record Payment**.
3. Select Payment Method (**Cash**, **Bank Deposit / Wire**, **Cheque**, **GCash**).
4. Enter the **Transaction / Reference Number** and **Payment Date**.
5. Upload a photo of the deposit slip (optional).
6. Click **Confirm Payment**.
7. The invoice updates to **Paid**, and the tenant's ledger reflects a zero balance.

### 9.5 Issuing Official Receipts (PDF)

Upon invoice settlement, click **Download Official Receipt (PDF)** to print or email an official BIR-compliant or standard payment receipt.

---

## 10. Maintenance Oversight & Work Orders

### 10.1 Maintenance Ticket Triage & Urgency Prioritization

Go to **Maintenance** (`/landlord/maintenance`):
- Tickets are sorted by priority:
  - 🚨 **Emergency** (Gas leak, flooding, electrical fire risk) — Red banner.
  - ⚠️ **High** (Broken AC, water heater, lock issue).
  - 📋 **Medium / Standard** (Slow drain, minor plumbing).
  - ℹ️ **Low** (Aesthetic touch-ups).

### 10.2 Assigning In-House Technicians or Third-Party Contractors

1. Open the maintenance ticket.
2. Review the tenant's photos and description.
3. In the **Assignment** field, select an in-house maintenance staff member or enter external contractor contact details.
4. Schedule an inspection date and time.

### 10.3 Managing Ticket Lifecycle

Update ticket states as work progresses:
- **Pending Review**: Ticket received.
- **In Progress**: Technician assigned; parts ordered; repair underway.
- **Resolved**: Work completed; awaiting tenant verification.
- **Closed**: Final sign-off completed.

### 10.4 Handling Self-Repair Requests & Material Reimbursements

If the tenant flagged the ticket for **Self-Repair**:
1. Review their proposed repair plan.
2. If approved, approve the material cost budget.
3. Upon receipt submission, click **Apply Credit to Next Rent Invoice**.

### 10.5 Logging Maintenance Costs & Invoicing Tenant Damages

- Log labor and parts expenses for each ticket to track building maintenance expenses.
- If damage was tenant-caused (e.g., broken window due to negligence), click **Bill Damage to Tenant** to generate a direct invoice.

---

## 11. Utility Meter Tracking & Utility Billing

### 11.1 Logging Meter Readings (Electricity, Water, Gas)

Go to **Utilities** (`/landlord/utilities`):
1. Select the property building and billing cycle month.
2. For each unit, input the **Current Meter Reading**.
3. Upload a photo of the physical meter dial for verification and audit protection.
4. Click **Save Readings**.

### 11.2 Automated Consumption Calculations

The platform automatically computes:
$$\text{Consumption} = \text{Current Reading} - \text{Previous Reading}$$
$$\text{Total Charge} = \text{Consumption} \times \text{Tariff Rate per Unit}$$

### 11.3 Generating Consolidated Utility Invoices

Go to **Utility Billing** (`/landlord/utility-billing`):
1. Review the calculated consumption summary table for all units.
2. Click **Generate Utility Invoices**.
3. Invoices are automatically dispatched to tenants and attached to their payment ledger.

### 11.4 Utility Arrears & Payment Tracking

Track utility payment statuses separately or as part of consolidated monthly rent billing.

---

## 12. Document Management & Compliance Vault

### 12.1 Centralized Digital Document Repository

Go to **Documents** (`/landlord/documents`):
- Secure cloud storage categorized by property and tenant.
- Eliminate lost paperwork and physical filing cabinets.

### 12.2 Uploading Property Titles, Insurance & Permits

- Upload building occupancy permits, fire safety inspection certificates, insurance policies, and tax declarations.
- Set document expiration reminders (e.g., Annual Fire Inspection Certificate renewal).

### 12.3 Managing Tenant IDs, Clearances & Contracts

- View all signed leases, move-in condition reports, government ID copies, and NBI/Police clearances in one folder per tenant.

### 12.4 Security, Access Control & File Retention

All uploaded documents are encrypted in transit and at rest, accessible only by authorized landlord account holders.

---

## 13. Move-Out Management & Deposit Settlement

### 13.1 Handling Move-Out Notices

Go to **Move-Out** (`/landlord/move-out`):
- View pending move-out notices submitted by tenants.
- Set the scheduled **Move-Out Walkthrough Date**.

### 13.2 Conducting Move-Out Inspections & Photographic Records

1. Perform the unit walkthrough with the tenant.
2. Use the digital **Move-Out Checklist** on your mobile device or tablet.
3. Take photos of:
   - Cleanliness of kitchen, bathroom, and floors.
   - Wall paint condition and nail holes.
   - Appliance functionality.
   - Keys and access cards returned.
4. Upload photos directly to the inspection ticket.

### 13.3 Itemizing Deductions (Unpaid Utilities, Damages, Cleaning)

On the Move-Out Settlement form:
- Initial Security Deposit: ₱50,000
- Less: Final Unpaid Water Bill: (₱1,250)
- Less: Final Unpaid Electricity Bill: (₱3,400)
- Less: Professional Deep Cleaning Fee: (₱2,500)
- Less: Wall Repainting / Patching: (₱1,800)
- **Net Deposit Refund Due**: **₱41,050**

### 13.4 Executing Security Deposit Refund & Final Ledger Closure

1. Share the itemized settlement statement with the tenant.
2. Once signed off, record the refund transaction.
3. The unit status automatically updates back to 🟢 **Green (Vacant)** and is ready for the next marketing cycle!

---

## 14. Communications & Messaging

### 14.1 Direct Messaging with Tenants & Applicants

Go to **Messages** (`/landlord/messages`):
- Dedicated chat channels for each tenant and applicant.
- Real-time instant delivery with read receipts.
- Filter conversations by property or unit.

### 14.2 Sending Multimedia Attachments & Notices

- Attach PDF circulars, repair quotes, or photos directly in the chat thread.

### 14.3 Automated Moderation & Chat Oversight

- Built-in profanity and spam filters ensure a professional and respectful communication environment.

---

## 15. Community Management & Announcements

### 15.1 Publishing Building-Wide Announcements

Go to **Community** (`/landlord/community`):
1. Click **+ New Announcement**.
2. Select target audience: **All Properties**, **Specific Building**, or **Specific Floor**.
3. Enter title and message body (e.g., *"Scheduled Water Interruption: Thursday 1PM–5PM for tank cleaning"*).
4. Pin the announcement to the top of tenant feeds.
5. Click **Publish**. Tenants receive instant in-app alerts and emails.

### 15.2 Moderating the Community Feed & Resident Discussions

- Review community posts submitted by tenants.
- Delete inappropriate comments or lock threads if necessary.

### 15.3 Establishing & Updating Property House Rules

- Maintain the official **House Rules** repository visible to all tenants.

---

## 16. Calendar, Inspections & Showing Schedules

### 16.1 Calendar Overview

Go to **Calendar** (`/landlord/calendar`):
- Master schedule displaying lease start/end dates, inspection appointments, maintenance visits, and prospective tenant tours.

### 16.2 Managing Property Tour Bookings

- Accept, reschedule, or cancel showing appointments requested by prospects.
- Add meeting links for virtual video showings.

### 16.3 Scheduling Routine Inspections & Maintenance Windows

- Schedule annual building inspections or HVAC servicing and notify affected tenants automatically.

---

## 17. Marketing & Property Flyer Generator

### 17.1 Generating Vacancy Marketing Flyers

Go to **Flyer** (`/landlord/flyer`):
1. Select a vacant unit from your inventory.
2. The generator pulls unit photos, rental price, floor area, and property amenities automatically.

### 17.2 Customizing Flyer Templates & QR Codes

- Choose a visual design template (Modern Minimalist, Elegant Luxury, Vibrant).
- The flyer includes a dynamic **QR Code** linking prospective tenants directly to your online rental application page.

### 17.3 Exporting for Social Media & Print

- Click **Export as Image (.PNG)** for Facebook Marketplace / Instagram listings.
- Click **Export as PDF** for high-resolution physical printing on bulletin boards or gate signage.

---

## 18. Portfolio Analytics & Financial Reporting

### 18.1 Occupancy Rate & Vacancy Analysis

Go to **Analytics** (`/landlord/analytics`):
- Track physical occupancy vs. economic occupancy.
- Identify long-standing vacant units to adjust pricing strategies.

### 18.2 Gross & Net Revenue Trends

- Comprehensive monthly and annual revenue curves.
- Export financial tables to CSV/Excel for external bookkeepers and accountants.

### 18.3 Maintenance Cost & Frequency Reports

- Pinpoint high-maintenance units or recurring plumbing/electrical issues to make informed capital improvement decisions.

### 18.4 Tenant Turnover & Renewal Metrics

- Monitor average tenancy duration and tenant retention percentage.

---

## 19. Profile, Settings & Account Security

### 19.1 Managing Landlord / Company Profile

Go to **Profile** (`/landlord/profile`) / **Settings** (`/landlord/settings`):
- Update business legal name, official address, and customer support hotline.
- Upload company logo for automated inclusion in invoices and receipts.

### 19.2 Notification Preferences & Webhook Channels

- Configure email and browser push alert triggers for new applications, lease signatures, and maintenance tickets.

### 19.3 Security, Two-Factor Authentication & Passwords

- Manage strong passwords and security authentication protocols.

---

## 20. Troubleshooting & Operational FAQs

### 20.1 Handling Payment Disputes & Ledger Adjustments

- **Scenario**: A tenant paid offline but entered the wrong reference number.
  - *Resolution*: Go to `/landlord/invoices`, open the specific invoice, verify your bank deposit statement, and click **Record Payment** manually with the verified reference code.

### 20.2 Addressing Lease Signing Bottlenecks

- **Scenario**: Tenant states they didn't receive the signing email.
  - *Resolution*: Direct the tenant to log in to `/tenant/sign-lease` where the pending contract is immediately accessible on their dashboard.

### 20.3 Offline Operation & Data Sync

- The iReside PWA allows viewing unit maps and tenant emergency contact info even without internet connectivity.
- Financial transactions and ticket updates will sync to the cloud as soon as an internet connection is re-established.

### 20.4 Frequently Asked Questions (FAQ)

**Q: Can I manage multiple distinct properties located in different cities under one account?**  
A: Yes! You can add unlimited properties, buildings, and units under your landlord workspace.

**Q: How do I adjust utility rates when government electric/water tariffs change?**  
A: Go to **Utilities** $\rightarrow$ **Settings** and update the per-kWh or per-$m^3$ rate before generating the new month's readings.

**Q: Are digital signatures generated on iReside legally binding?**  
A: Yes. iReside complies with electronic signature standards (such as the Philippine E-Commerce Act of 2000 / RA 8792 and global e-sign frameworks), recording IP addresses, audit timestamps, and cryptographic hashes.

---

*For technical support, custom feature inquiries, or platform assistance, please consult the iReside System Administrator.*
