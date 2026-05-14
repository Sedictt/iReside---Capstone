# Activity Diagram Refactoring Design

**Date:** 2026-05-13
**Author:** Commander
**Status:** Approved

## 1. Overview

Refactor the existing monolithic activity diagrams into a set of focused, standalone swimlane activity diagrams. Each diagram represents a single major activity area with clear boundaries, proper UML notation, and all interacting actors visible.

## 2. Current State

Existing diagrams (all single, dense diagrams per stakeholder):
- `activity-diagram.drawio` — Whole system (3180px — very dense)
- `activity-diagram-tenant-stakeholder.drawio` — All tenant activities combined
- `activity-diagram-landlord-stakeholder.drawio` — All landlord activities combined
- `activity-diagram-admin-stakeholder.drawio` — All admin activities combined

## 3. Target State

### 3.1 Cross-Cutting Diagrams

| File | Swimlanes |
|------|------------|
| `activity-authentication.drawio` | Super Admin, Landlord, Tenant, iReside System |
| `activity-billing-payments.drawio` | Tenant, iReside System, Payment Processor, Landlord |

### 3.2 Tenant Standalone Diagrams

| File | Swimlanes |
|------|------------|
| `activity-tenant-discovery.drawio` | Tenant, iReside System, Landlord |
| `activity-tenant-application.drawio` | Tenant, iReside System, Landlord |
| `activity-tenant-lease-signing.drawio` | Tenant, iReside System, Landlord |
| `activity-tenant-maintenance.drawio` | Tenant, iReside System, Landlord |
| `activity-tenant-messaging.drawio` | Tenant, iReside System, Landlord |

### 3.3 Landlord Standalone Diagrams

| File | Swimlanes |
|------|------------|
| `activity-landlord-property-mgmt.drawio` | Landlord, iReside System, Tenant |
| `activity-landlord-lease-mgmt.drawio` | Landlord, iReside System, Tenant |
| `activity-landlord-maintenance.drawio` | Landlord, iReside System, Tenant |
| `activity-landlord-messaging.drawio` | Landlord, iReside System, Tenant |

### 3.4 Admin Standalone Diagrams

| File | Swimlanes |
|------|------------|
| `activity-admin-user-mgmt.drawio` | Super Admin, iReside System, Landlord |
| `activity-admin-platform-metrics.drawio` | Super Admin, iReside System |

## 4. Notation Standards

All diagrams MUST use proper UML activity diagram notation:

| Element | UML Symbol |
|---------|-----------|
| Activity | Rounded rectangle |
| Action | Rounded rectangle (smaller than activity) |
| Control Flow | Solid arrow line |
| Object Flow | Dashed arrow line |
| Initial Node | Filled black circle |
| Activity Final Node | Filled black circle inside double circle |
| Object Node | Rectangle (no rounded corners) |
| Decision Node | Diamond |
| Merge Node | Diamond |
| Fork Node | Heavy horizontal bar |
| Join Node | Heavy horizontal bar |

### Color Coding
- Actor/Role swimlane headers: colored backgrounds per role
- iReside System swimlane: green tint (`#edf8ec`)
- Actor swimlanes: blue tint (`#eef4ff`)
- External actor swimlanes: yellow tint (`#fff3d6`)

## 5. File Location

All new diagrams saved to:
```
docs/latest-documentations after major refactor/activity-diagrams/
```

## 6. Swimbane Configuration

- **Minimal 2-column option** NOT used — all diagrams use 3+ columns showing all interacting parties
- **All possible actors** NOT used — each diagram only shows actors that actually participate in that specific activity

## 7. Standalone Principle

Each diagram is:
- Self-contained with its own Initial Node → Activity Final Node
- Complete flow from start to end
- Independent of other diagrams (no Call Behavior Action references)

## 8. Approval

User approved design on 2026-05-13.