# Stakeholder-Based Activity Diagram Implementation Plan

> **For AI Agent:** Execute this plan to create 2 high-level stakeholder journey diagrams.
> **Context:** These diagrams complement the 13 feature-based diagrams by providing a "Master Journey" view for each primary user type.

## Overview

Create 2 standalone stakeholder journey diagrams (`.drawio` files) that show the end-to-end lifecycle of a user in the iReside system.

**Files:**
1. `activity-tenant-stakeholder-journey.drawio`
2. `activity-landlord-stakeholder-journey.drawio`

**Output Directory:** `docs/latest-documentations after major refactor/activity-diagrams/`

---

## Diagram 1: activity-tenant-stakeholder-journey.drawio

**Swimlanes:**
1. Tenant (Actor)
2. iReside System
3. Landlord/Third Party (Consolidated external lane)

**Flow (Lifecycle Stages):**
1. **Initial Node**
2. **Discovery**: Search → View Details → Book Viewing.
3. **Decision: Interested?** → Yes → **Application**: Submit App → Upload Docs → Wait for Review.
4. **Decision: Approved?** → Yes → **Lease**: Review Lease → E-sign → Wait for Countersign.
5. **Decision: Lease Active?** → Yes → **Operational Loop (Fork)**:
    - **Finance**: View Balance → Pay Rent/Bills.
    - **Support**: Chat with iRis/Landlord.
    - **Maintenance**: Report Issue → Confirm Resolution.
6. **Move-out / End of Lease** → Final Node.

---

## Diagram 2: activity-landlord-stakeholder-journey.drawio

**Swimlanes:**
1. Landlord (Actor)
2. iReside System
3. Tenant (Consolidated external lane)

**Flow (Lifecycle Stages):**
1. **Initial Node**
2. **Setup**: Add Property → Add Units → Set Pricing/Availability.
3. **Marketing**: Publish Listings → View Applicant List.
4. **Acquisition**: Review Applications → **Decision: Approve?** → Yes → Generate Lease → Review & Countersign.
5. **Management Loop (Fork)**:
    - **Finance**: View Ledger → Track Payments.
    - **Maintenance**: Receive Requests → Assign Contractor → Verify Work.
    - **Communication**: Send Announcements → Direct Message Tenants.
6. **Property Maintenance / Tenant Turnover** → Final Node.

---

## Notation Standards

- Use the same styles as the feature-based diagrams (rounded rects for activities, diamonds for decisions, etc.)
- Use high-level "Phase" headers or visual separators if possible, or just a clean top-to-bottom flow.
- Reference the standalone diagrams in the action labels (e.g., "Submit Application [Ref: activity-tenant-application]").
