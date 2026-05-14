# iReside Work Breakdown Structure

This document provides a hierarchical breakdown of work packages for the iReside property management system, reflecting the major refactor and the enhanced lease signing workflow.

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
|---|---|---|---|---|---|---|
| 1 | 1.0 | iReside System | Complete property management platform for landlords and tenants. | N/A | 70 | Proponents |
| 2 | 1.1 | Account Management | Users must be able to create, secure, recover, and maintain their accounts. | N/A | N/A | Proponents |
| 3 | 1.1.1 | Sign Up | Allow new users to register using email, password, and role selection. | N/A | 7 | Frontend and Backend Team |
| 3 | 1.1.2 | Sign In | Authenticate returning users and create role-aware sessions. | 1.1.1 | 5 | Frontend and Backend Team |
| 3 | 1.1.3 | Recover Account | Let users recover access through password reset and account verification. | 1.1.2 | 3 | Backend Team |
| 3 | 1.1.4 | Profile Management | Allow users to update profile details, avatars, and account settings. | 1.1.2 | 4 | Frontend Team |
| 2 | 1.2 | Core Platform Setup | Establish the application shell, routing, and shared UI foundation. | N/A | N/A | Proponents |
| 3 | 1.2.1 | Application Layout and Navigation | Build the responsive shell, header, sidebar, and role-based routing. | N/A | 6 | Frontend Team |
| 3 | 1.2.2 | Design System and Styling | Configure global styles, tokens, typography, and component patterns. | 1.2.1 | 5 | Frontend Team |
| 3 | 1.2.3 | State and Data Utilities | Implement reusable hooks, fetch utilities, and shared helpers. | 1.2.1 | 4 | Full-Stack Team |
| 2 | 1.3 | Applications and Lease Management | Manage rental applications, approvals, and lease documents. | N/A | N/A | Proponents |
| 3 | 1.3.1 | Application Submission | Let tenants submit applications and required documents. | 1.2.3, 1.1.2 | 6 | Frontend and Backend Team |
| 3 | 1.3.2 | Application Review Workflow | Allow landlords to review, approve, or reject applications. | 1.3.1 | 5 | Backend Team |
| 3 | 1.3.3 | Enhanced Lease Signing Workflow | Implement dual signing modes, remote links, audit trails, and state machine. | 1.3.2 | 12 | Full-Stack Team |
| 4 | 1.3.3.1 | Database Schema Changes | Add new columns and tables to support enhanced signing workflow. | N/A | 4 | Backend Team |
| 4 | 1.3.3.2 | JWT Token System | Implement secure token generation and validation for signing links. | 1.3.3.1 | 4 | Backend Team |
| 4 | 1.3.3.3 | Signing Mode Selection UI | Create interface for selecting in-person or remote signing modes. | 1.3.3.2 | 4 | Frontend Team |
| 4 | 1.3.3.4 | In-Person Dual Signing Interface | Implement simultaneous signature capture for both parties. | 1.3.3.3 | 5 | Frontend Team |
| 4 | 1.3.3.5 | Remote Signing Link Generation | Create and distribute signing links for remote tenant signing. | 1.3.3.3 | 6 | Full-Stack Team |
| 4 | 1.3.3.6 | Remote Tenant Signing Interface | Create tenant-facing signing interface with JWT validation. | 1.3.3.5 | 6 | Frontend and Backend Team |
| 4 | 1.3.3.7 | Landlord Countersignature Flow | Implement landlord countersignature after tenant signs remotely. | 1.3.3.6 | 6 | Frontend and Backend Team |
| 4 | 1.3.3.8 | Wizard State Persistence | Implement localStorage-based state preservation for external tool access. | 1.3.3.7 | 5 | Frontend Team |
| 4 | 1.3.3.9 | External Tool Access Buttons | Create quick-access buttons for Contract Templates, Property Policies, Amenities. | 1.3.3.8 | 3 | Frontend Team |
| 4 | 1.3.3.10 | Lease Status State Machine | Implement validated status transitions for lease lifecycle. | 1.3.3.1 | 4 | Backend Team |
| 4 | 1.3.3.11 | Signature Validation and Storage | Implement signature data validation and concurrent signing prevention. | 1.3.3.4 | 5 | Backend Team |
| 4 | 1.3.3.12 | Audit Trail System | Implement comprehensive logging for all signing events. | 1.3.3.1 | 6 | Backend Team |
| 3 | 1.3.4 | Renewal and Move-Out Tracking | Track lease renewals, expirations, and move-out requests. | 1.3.3 | 4 | Backend Team |
| 2 | 1.4 | Property and Unit Management | Let landlords create and maintain properties, units, and media. | 1.2.2 | N/A | Proponents |
| 3 | 1.4.1 | Property Registration | Capture property metadata, address data, and verification details. | 1.2.2, 1.1.2 | 6 | Backend Team |
| 3 | 1.4.2 | Unit Listing Wizard | Publish unit listings with pricing, deposits, amenities, and media. | 1.4.1 | 10 | Full-Stack Team |
| 2 | 1.5 | Financial Operations | Track rent, utilities, invoices, receipts, and reports. | 1.3.3 | N/A | Proponents |
| 3 | 1.5.1 | Ledger and Invoice Tracking | Maintain overdue, pending, and paid invoice records. | 1.3.3.9 | 6 | Backend Team |
| 3 | 1.5.2 | Receipt Upload and Verification | Support manual proof-of-payment review and approval. | 1.5.1 | 4 | Frontend and Backend Team |
| 3 | 1.5.3 | Report Exporting | Generate PDF and CSV reports for audits and summaries. | 1.5.1 | 5 | Full-Stack Team |
| 3 | 1.5.4 | Payment History Views | Show chronological payment logs and transaction details. | 1.5.1 | 4 | Frontend Team |
| 2 | 1.6 | Maintenance and Messaging | Coordinate requests, conversations, and AI-assisted support. | 1.3.1 | N/A | Proponents |
| 3 | 1.6.1 | Maintenance Request Tracking | Allow tenants to submit requests with images and status updates. | 1.3.1 | 6 | Frontend and Backend Team |
| 3 | 1.6.2 | Real-Time Messaging | Implement in-app chat with presence, attachments, and notifications. | 1.6.1 | 7 | Full-Stack Team |
| 3 | 1.6.3 | AI Assistant and RAG Context | Integrate contextual AI answers based on property and lease data. | 1.6.2 | 8 | Backend Team |
| 3 | 1.6.4 | Message Moderation | Filter toxic content and spam before message delivery. | 1.6.2 | 4 | Backend Team |
| 2 | 1.7 | Admin Governance | Provide administrative tools for review, moderation, and oversight. | 1.2.1 | N/A | Proponents |
| 3 | 1.7.1 | Registration Review Dashboard | Let admins inspect landlord applications, documents, and notes. | 1.2.1 | 6 | Frontend and Backend Team |
| 3 | 1.7.2 | User Management Tools | Support filtering, searching, and role management for platform users. | 1.7.1 | 5 | Frontend Team |
| 3 | 1.7.3 | Platform Metrics Dashboard | Display live operational indicators and summary cards. | 1.7.1 | 4 | Frontend Team |
| 2 | 1.8 | Testing and Deployment | Verify quality, prepare release artifacts, and deploy the system. | 1.2.3 | N/A | Proponents |
| 3 | 1.8.1 | Unit and Integration Testing | Validate critical workflows and service interactions. | 1.2.3 | 6 | QA Team |
| 3 | 1.8.2 | Bug Fixing and Refinement | Resolve defects found during testing and review. | 1.8.1 | 5 | Full-Stack Team |
| 3 | 1.8.3 | Documentation and Final Submission | Prepare thesis documents, user guides, and final handoff files. | 1.8.2 | 5 | Documentation Team |

## Summary Statistics

- **Total Project Duration:** 70 Working Days
- **Total Workstreams:** 8 (1.1 to 1.8)
- **Critical Path:** 1.2.1 → 1.2.3 → 1.3.1 → 1.3.2 → 1.3.3.1 → 1.3.3.2 → 1.3.3.3 → 1.3.3.5 → 1.3.3.6 → 1.3.3.7 → 1.3.3.8 → 1.3.3.9 → 1.5.1 → 1.5.3
