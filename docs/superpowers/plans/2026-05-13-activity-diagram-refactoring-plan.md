# Activity Diagram Refactoring Implementation Plan

> **For AI Agent:** Execute this plan to create 13 standalone swimlane activity diagrams.
> **Spec:** `docs/superpowers/specs/2026-05-13-activity-diagram-refactoring-design.md`

## Overview

Create 13 standalone swimlane activity diagrams (`.drawio` files) for the iReside property management system. Each diagram is self-contained with its own Initial Node → Activity Final Node flow. All use UML standard notation with 3+ swimlane columns per diagram.

**Total Diagrams:** 13
**Output Directory:** `docs/latest-documentations after major refactor/activity-diagrams/`

---

## Swimlane Color Reference

| Swimlane Type | Fill Color | Stroke Color |
|---------------|-----------|--------------|
| Actor (external) | `#dce9ff` | `#6c8ebf` |
| iReside System | `#d8f0d3` | `#82b366` |
| External Service | `#ffe9b3` | `#d6b656` |

---

## Node Notation Reference

| Element | Style |
|---------|-------|
| Activity | `rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#6c8ebf;` |
| Action | `rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#6c8ebf;` |
| Initial Node | `ellipse;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;` |
| Activity Final Node | `ellipse;whiteSpace=wrap;html=1;fillColor=#000000;strokeColor=#000000;` (double circle via style) |
| Decision Node | `rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;` |
| Merge Node | `rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;` |
| Fork Node | `shape=hline;boundedText=1;whiteSpace=wrap;html=1;fillColor=#82b366;strokeColor=#82b366;strokeWidth=3;` |
| Join Node | `shape=hline;boundedText=1;whiteSpace=wrap;html=1;fillColor=#82b366;strokeColor=#82b366;strokeWidth=3;` |
| Object Node | `shape=rect;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#6c8ebf;` |
| Control Flow | Arrow with `endArrow=classic;html=1;` |
| Object Flow | Arrow with `endArrow=classic;dashed=1;html=1;` |

---

## File List

```
docs/latest-documentations after major refactor/activity-diagrams/
├── activity-authentication.drawio              (Super Admin, Landlord, Tenant, iReside System)
├── activity-billing-payments.drawio             (Tenant, iReside System, Payment Processor, Landlord)
├── activity-tenant-discovery.drawio             (Tenant, iReside System, Landlord)
├── activity-tenant-application.drawio           (Tenant, iReside System, Landlord)
├── activity-tenant-lease-signing.drawio         (Tenant, iReside System, Landlord)
├── activity-tenant-maintenance.drawio           (Tenant, iReside System, Landlord)
├── activity-tenant-messaging.drawio              (Tenant, iReside System, Landlord)
├── activity-landlord-property-mgmt.drawio       (Landlord, iReside System, Tenant)
├── activity-landlord-lease-mgmt.drawio           (Landlord, iReside System, Tenant)
├── activity-landlord-maintenance.drawio          (Landlord, iReside System, Tenant)
├── activity-landlord-messaging.drawio            (Landlord, iReside System, Tenant)
├── activity-admin-user-mgmt.drawio               (Super Admin, iReside System, Landlord)
└── activity-admin-platform-metrics.drawio        (Super Admin, iReside System)
```

---

## Task Breakdown

### Diagram 1: activity-authentication.drawio

**Swimlanes (left to right):**
1. Super Admin — x=40, width=220, fill `#eef4ff`
2. Landlord — x=280, width=220, fill `#eef4ff`
3. Tenant — x=520, width=220, fill `#eef4ff`
4. iReside System — x=760, width=500, fill `#edf8ec`

**Flow:**
1. Initial Node (super admin OR landlord OR tenant enters credentials)
2. Action: "Enter credentials" [in actor's lane]
3. Control flow → Action: "Authenticate and validate role" [iReside System lane]
4. Decision: "Credentials valid?" → Yes → Action: "Create session" → Redirect to portal
5. Decision: No → Action: "Show error message" → End (Activity Final in error state)

**Use cases covered:** Sign In, Role-based access

---

### Diagram 2: activity-billing-payments.drawio

**Swimlanes (left to right):**
1. Tenant — x=40, width=220, fill `#eef4ff`
2. iReside System — x=280, width=400, fill `#edf8ec`
3. Payment Processor — x=700, width=200, fill `#fff3d6`
4. Landlord — x=920, width=200, fill `#eef4ff`

**Flow:**
1. Initial Node → Action: "Initiate payment (rent/invoice)" [Tenant lane]
2. Object flow → Object: "Invoice/Payment Request" → Action: "Process payment request" [iReside System]
3. Fork → parallel flows: → Action: "Charge payment method" [Payment Processor] → Action: "Update ledger" [iReside System]
4. Join → Decision: "Payment successful?" → Yes → Action: "Confirm payment" → Object: "Receipt" → Merge → End
5. No → Action: "Notify failure" → End (Activity Final)

---

### Diagram 3: activity-tenant-discovery.drawio

**Swimlanes (left to right):**
1. Tenant — x=40, width=240
2. iReside System — x=300, width=500
3. Landlord — x=820, width=240

**Flow:**
1. Initial Node → Action: "Search properties (map/radius)" [Tenant]
2. Control flow → Action: "Return property listings" [iReside System]
3. Decision: "Apply filters?" → Yes → Action: "Filter results" [iReside System] → return to listings
4. Decision: "View details?" → Yes → Action: "Show property details + landlord info" [iReside System]
5. Decision: "Save/Bookmark?" → Yes → Action: "Add to saved listings" [iReside System]
6. Decision: "Schedule viewing?" → Yes → Object: "Viewing Request" → Action: "Notify landlord" [iReside System]
7. End

---

### Diagram 4: activity-tenant-application.drawio

**Swimlanes (left to right):**
1. Tenant — x=40, width=240
2. iReside System — x=300, width=500
3. Landlord — x=820, width=240

**Flow:**
1. Initial Node → Action: "Submit rental application" [Tenant]
2. Object flow → Object: "Application Form + Documents" → Action: "Validate application" [iReside System]
3. Decision: "Complete?" → No → Action: "Request missing info" [iReside System] → loop back
4. Yes → Decision: "Auto-approve criteria met?" → Yes → Action: "Auto-approve application" [iReside System] → notify landlord
5. No → Object: "Pending Application" → Action: "Notify landlord" [iReside System]
6. Decision: "Approve or reject?" [Landlord] → Approve → Action: "Generate lease" [iReside System]
7. → End | Reject → Action: "Notify rejection" → End

---

### Diagram 5: activity-tenant-lease-signing.drawio

**Swimlanes (left to right):**
1. Tenant — x=40, width=240
2. iReside System — x=300, width=500
3. Landlord — x=820, width=240

**Flow:**
1. Initial Node → Object: "Generated Lease" [iReside System]
2. Action: "Review lease terms" [Tenant]
3. Decision: "Accept terms?" → No → Action: "Request amendments" [iReside System] → notify landlord → Decision: "Amendments approved?" → No → End (rejected) → Yes → loop to review
4. Yes → Action: "E-sign lease" [Tenant]
5. Parallel flows (fork): → Action: "Landlord countersigns" [Landlord] | → Action: "Archive signed lease" [iReside System]
6. Join → Object: "Executed Lease" → Action: "Notify both parties" [iReside System]
7. End

---

### Diagram 6: activity-tenant-maintenance.drawio

**Swimlanes (left to right):**
1. Tenant — x=40, width=240
2. iReside System — x=300, width=500
3. Landlord — x=820, width=240

**Flow:**
1. Initial Node → Action: "Submit maintenance request" [Tenant]
2. Object flow → Object: "Request + Photos" → Action: "Log request" [iReside System]
3. Decision: "Emergency?" → Yes → Action: "Alert landlord immediately" [iReside System] → Priority flow
4. No → Action: "Assign priority" [iReside System]
5. Decision: "Landlord assigns contractor?" → Yes → Action: "Select contractor" [Landlord]
6. Action: "Schedule repair" [iReside System]
7. Decision: "Work completed?" → Yes → Action: "Mark resolved" [iReside System]
8. Action: "Tenant confirms resolution" [Tenant] → End

---

### Diagram 7: activity-tenant-messaging.drawio

**Swimlanes (left to right):**
1. Tenant — x=40, width=240
2. iReside System — x=300, width=500
3. Landlord — x=820, width=240

**Flow:**
1. Initial Node → Action: "Compose message" [Tenant]
2. Object: "Message" → Action: "Send via platform" [iReside System]
3. Decision: "Urgent keywords detected?" → Yes → Action: "Flag as priority" [iReside System]
4. Action: "Deliver to landlord" [iReside System]
5. Decision: "Landlord responds?" → Yes → Action: "Deliver response to tenant" [iReside System]
6. Loop back to compose (optional continuation)
7. End

---

### Diagram 8: activity-landlord-property-mgmt.drawio

**Swimlanes (left to right):**
1. Landlord — x=40, width=240
2. iReside System — x=300, width=500
3. Tenant — x=820, width=240

**Flow:**
1. Initial Node → Action: "Add/Edit property" [Landlord]
2. Action: "Save property record" [iReside System]
3. Decision: "Add units?" → Yes → Action: "Configure units" [Landlord] → Action: "Save units" [iReside System]
4. Decision: "Set availability?" → Yes → Action: "Update availability status" [iReside System]
5. Object: "Property/Unit listing" → Action: "Publish to discovery" [iReside System]
6. End

---

### Diagram 9: activity-landlord-lease-mgmt.drawio

**Swimlanes (left to right):**
1. Landlord — x=40, width=240
2. iReside System — x=300, width=500
3. Tenant — x=820, width=240

**Flow:**
1. Initial Node → Object: "Tenant Application" [iReside System]
2. Action: "Review application" [Landlord]
3. Decision: "Approve or reject?" → Reject → Action: "Reject application" [iReside System] → End
4. Approve → Action: "Generate lease document" [iReside System]
5. Action: "Review and sign lease" [Landlord]
6. Parallel (fork): → Action: "Tenant e-signs" [Tenant] | → Action: "Archive signed lease" [iReside System]
7. Join → Action: "Assign unit to tenant" [iReside System]
8. End

---

### Diagram 10: activity-landlord-maintenance.drawio

**Swimlanes (left to right):**
1. Landlord — x=40, width=240
2. iReside System — x=300, width=500
3. Tenant — x=820, width=240

**Flow:**
1. Initial Node → Object: "Maintenance Request" [iReside System]
2. Action: "Receive notification" [Landlord]
3. Decision: "Assign contractor?" → Yes → Action: "Select from contractor list" [Landlord]
4. Action: "Assign priority and schedule" [Landlord]
5. Action: "Notify tenant of timeline" [iReside System]
6. Decision: "Work completed?" → Yes → Action: "Mark as completed" [Landlord]
7. Action: "Request tenant confirmation" [iReside System]
8. Decision: "Tenant confirms?" → Yes → Action: "Close request" [iReside System] → End
9. No → Action: "Re-open request" [iReside System] → loop

---

### Diagram 11: activity-landlord-messaging.drawio

**Swimlanes (left to right):**
1. Landlord — x=40, width=240
2. iReside System — x=300, width=500
3. Tenant — x=820, width=240

**Flow:**
1. Initial Node → Action: "Compose message" [Landlord]
2. Object: "Message" → Action: "Send via platform" [iReside System]
3. Decision: "Urgent/flagged?" → Yes → Action: "Priority notification to tenant" [iReside System]
4. Action: "Deliver to tenant" [iReside System]
5. Decision: "Tenant responds?" → Yes → Action: "Deliver response to landlord" [iReside System]
6. Loop back (optional)
7. End

---

### Diagram 12: activity-admin-user-mgmt.drawio

**Swimlanes (left to right):**
1. Super Admin — x=40, width=240
2. iReside System — x=300, width=500
3. Landlord — x=820, width=240

**Flow:**
1. Initial Node → Decision: "User action type?" → Create → Action: "Create user account" [Super Admin] → Action: "Provision account" [iReside System]
2. Update → Action: "Update user details" [Super Admin] → Action: "Sync changes" [iReside System]
3. Deactivate → Action: "Deactivate account" [Super Admin] → Action: "Revoke access" [iReside System]
4. All paths → Decision: "Notify user?" → Yes → Action: "Send notification email" [iReside System]
5. End

---

### Diagram 13: activity-admin-platform-metrics.drawio

**Swimlanes (left to right):**
1. Super Admin — x=40, width=240
2. iReside System — x=300, width=500

**Flow:**
1. Initial Node → Action: "Access admin dashboard" [Super Admin]
2. Action: "Retrieve platform metrics" [iReside System]
3. Decision: "Data available?" → No → Action: "Show empty/error state" [iReside System]
4. Yes → Action: "Display metrics (users, properties, activity)" [iReside System]
5. Decision: "Filter/export?" → Yes → Action: "Generate report" [iReside System]
6. End

---

## Implementation Notes

1. Each `.drawio` file uses the standard `mxfile` + `diagram` + `mxGraphModel` XML structure
2. Use sequential cell IDs starting from 0, 1 (root), then 10+, 20+, etc.
3. All geometry uses `x`, `y`, `width`, `height` in pixels
4. Swimlane rectangles should span the full diagram height minus header
5. After creating all 13 files, the old combined diagrams can be archived (not deleted)

## Verification

After creating all 13 diagrams, verify:
- [ ] All files exist in the target directory
- [ ] Each diagram opens in draw.io without errors
- [ ] Each has exactly one Initial Node
- [ ] Each has at least one Activity Final Node
- [ ] Swimlanes match the specified actors
- [ ] Control flows and object flows use correct arrow styles