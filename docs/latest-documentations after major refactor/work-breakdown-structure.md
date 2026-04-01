# iReside Work Breakdown Structure

This document provides a hierarchical breakdown of work packages for the iReside property management system, including the enhanced lease signing workflow features. Durations are estimates in working days and may be refined during planning.

The hierarchy follows the WBS dictionary format: Level 1 is the system, Level 2 is the workstream, Level 3 is the major deliverable, and Level 4 is the sub or minor deliverable.

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
|---|---|---|---|---|---|---|
| 1 | 1.0 | iReside System | Complete property management platform for landlords and tenants. | N/A | N/A | Proponents |
| 2 | 1.1 | Account Management | Users must be able to create, secure, recover, and maintain their accounts. | N/A | N/A | Proponents |
| 3 | 1.1.1 | Sign Up | Allow new users to register using email, password, and role selection. | N/A | 7 | Frontend and Backend Team |
| 3 | 1.1.2 | Sign In | Authenticate returning users and create role-aware sessions. | 1.1.1 | 5 | Frontend and Backend Team |
| 3 | 1.1.3 | Recover Account | Let users recover access through password reset and account verification. | 1.1.2 | 3 | Backend Team |
| 3 | 1.1.4 | Profile Management | Allow users to update profile details, avatars, and account settings. | 1.1.2 | 4 | Frontend Team |
| 2 | 1.2 | Core Platform Setup | Establish the application shell, routing, and shared UI foundation. | N/A | N/A | Proponents |
| 3 | 1.2.1 | Application Layout and Navigation | Build the responsive shell, header, sidebar, and role-based routing. | N/A | 6 | Frontend Team |
| 3 | 1.2.2 | Design System and Styling | Configure global styles, tokens, typography, and component patterns. | 1.2.1 | 5 | Frontend Team |
| 3 | 1.2.3 | State and Data Utilities | Implement reusable hooks, fetch utilities, and shared helpers. | 1.2.1 | 4 | Full-Stack Team |
| 2 | 1.3 | Tenant Discovery Portal | Users must be able to search, filter, and review available properties. | N/A | N/A | Proponents |
| 3 | 1.3.1 | Map-Based Search | Integrate the interactive map, radius filters, and location lookup. | 1.2.1 | 7 | Frontend and Backend Team |
| 3 | 1.3.2 | Listing Filters and Cards | Display property cards, amenities, pricing, and filter controls. | 1.3.1 | 6 | Frontend Team |
| 3 | 1.3.3 | Property Details and Saved Listings | Provide listing detail views, bookmarks, and saved property management. | 1.3.2 | 5 | Frontend Team |
| 2 | 1.4 | Applications and Lease Management | Manage rental applications, approvals, and lease documents. | N/A | N/A | Proponents |
| 3 | 1.4.1 | Application Submission | Let tenants submit applications and required documents. | 1.3.3 | 6 | Frontend and Backend Team |
| 3 | 1.4.2 | Application Review Workflow | Allow landlords to review, approve, or reject applications. | 1.4.1 | 5 | Backend Team |
| 3 | 1.4.3 | Enhanced Lease Signing Workflow | Implement dual signing modes, remote signing links, audit trails, and state machine. | 1.4.2 | 12 | Full-Stack Team |
| 4 | 1.4.3.1 | Database Schema Changes | Add new columns and tables to support enhanced signing workflow. | N/A | 4 | Backend Team |
| 4 | 1.4.3.2 | JWT Token System | Implement secure token generation and validation for signing links. | 1.4.3.1 | 4 | Backend Team |
| 4 | 1.4.3.3 | Signing Mode Selection UI | Create interface for selecting in-person or remote signing modes. | 1.4.3.2 | 4 | Frontend Team |
| 4 | 1.4.3.4 | In-Person Dual Signing Interface | Implement simultaneous signature capture for both parties. | 1.4.3.3 | 5 | Frontend Team |
| 4 | 1.4.3.5 | Remote Signing Link Generation | Create and distribute signing links for remote tenant signing. | 1.4.3.3 | 6 | Full-Stack Team |
| 4 | 1.4.3.6 | Remote Tenant Signing Interface | Create tenant-facing signing interface with JWT validation. | 1.4.3.5 | 6 | Frontend and Backend Team |
| 4 | 1.4.3.7 | Landlord Countersignature Flow | Implement landlord countersignature after tenant signs remotely. | 1.4.3.6 | 6 | Frontend and Backend Team |
| 4 | 1.4.3.8 | Wizard State Persistence | Implement localStorage-based state preservation for external tool access. | 1.4.3.7 | 5 | Frontend Team |
| 4 | 1.4.3.9 | External Tool Access Buttons | Create quick-access buttons for Contract Templates, Property Policies, Amenities. | 1.4.3.8 | 3 | Frontend Team |
| 4 | 1.4.3.10 | Lease Status State Machine | Implement validated status transitions for lease lifecycle. | 1.4.3.1 | 4 | Backend Team |
| 4 | 1.4.3.11 | Signature Validation and Storage | Implement signature data validation and concurrent signing prevention. | 1.4.3.4 | 5 | Backend Team |
| 4 | 1.4.3.12 | Audit Trail System | Implement comprehensive logging for all signing events. | 1.4.3.1 | 6 | Backend Team |
| 3 | 1.4.4 | Renewal and Move-Out Tracking | Track lease renewals, expirations, and move-out requests. | 1.4.3 | 4 | Backend Team |
| 2 | 1.5 | Property and Unit Management | Let landlords create and maintain properties, units, and media. | 1.2.2 | N/A | Proponents |
| 3 | 1.5.1 | Property Registration | Capture property metadata, address data, and verification details. | 1.2.2 | 6 | Backend Team |
| 3 | 1.5.2 | Modular Floor Planner | Build the drag-and-drop unit layout and status visualization. | 1.5.1 | 10 | Frontend Team |
| 3 | 1.5.3 | Unit Listing Wizard | Publish unit listings with pricing, deposits, amenities, and media. | 1.5.2 | 8 | Frontend Team |
| 3 | 1.5.4 | Listing Status Management | Update unit availability, occupancy, and display state in real time. | 1.5.3 | 4 | Backend Team |
| 2 | 1.6 | Financial Operations | Track rent, utilities, invoices, receipts, and reports. | 1.4.3 | N/A | Proponents |
| 3 | 1.6.1 | Ledger and Invoice Tracking | Maintain overdue, pending, and paid invoice records. | 1.4.3 | 6 | Backend Team |
| 3 | 1.6.2 | Receipt Upload and Verification | Support manual proof-of-payment review and approval. | 1.6.1 | 4 | Frontend and Backend Team |
| 3 | 1.6.3 | Report Exporting | Generate PDF and CSV reports for audits and summaries. | 1.6.1 | 5 | Full-Stack Team |
| 3 | 1.6.4 | Payment History Views | Show chronological payment logs and transaction details. | 1.6.1 | 4 | Frontend Team |
| 2 | 1.7 | Maintenance, Messaging, and AI | Coordinate requests, conversations, and AI-assisted support. | 1.4.1 | N/A | Proponents |
| 3 | 1.7.1 | Maintenance Request Tracking | Allow tenants to submit requests with images and status updates. | 1.4.1 | 6 | Frontend and Backend Team |
| 3 | 1.7.2 | Real-Time Messaging | Implement in-app chat with presence, attachments, and notifications. | 1.7.1 | 7 | Full-Stack Team |
| 3 | 1.7.3 | AI Assistant and RAG Context | Integrate contextual AI answers based on property and lease data. | 1.7.2 | 8 | Backend Team |
| 3 | 1.7.4 | Message Moderation | Filter toxic content and spam before message delivery. | 1.7.2 | 4 | Backend Team |
| 2 | 1.8 | Admin Governance | Provide administrative tools for review, moderation, and oversight. | 1.2.1 | N/A | Proponents |
| 3 | 1.8.1 | Registration Review Dashboard | Let admins inspect landlord applications, documents, and notes. | 1.2.1 | 6 | Frontend and Backend Team |
| 3 | 1.8.2 | User Management Tools | Support filtering, searching, and role management for platform users. | 1.8.1 | 5 | Frontend Team |
| 3 | 1.8.3 | Platform Metrics Dashboard | Display live operational indicators and summary cards. | 1.8.1 | 4 | Frontend Team |
| 2 | 1.9 | Testing and Deployment | Verify quality, prepare release artifacts, and deploy the system. | 1.8.3 | N/A | Proponents |
| 3 | 1.9.1 | Unit and Integration Testing | Validate critical workflows and service interactions. | 1.2.3 | 6 | QA Team |
| 3 | 1.9.2 | Bug Fixing and Refinement | Resolve defects found during testing and review. | 1.9.1 | 5 | Full-Stack Team |
| 3 | 1.9.3 | Documentation and Final Submission | Prepare thesis documents, user guides, and final handoff files. | 1.9.2 | 5 | Documentation Team |

## Enhanced Lease Signing Workflow Detail (1.4.3 Sub-packages)

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
|---|---|---|---|---|---|---|
| 4 | 1.4.3.1 | Database Schema Changes | Add new columns and tables to support enhanced signing workflow. | N/A | 4 | Backend Team |
| 5 | 1.4.3.1.1 | Lease Table Enhancements | Add signing_mode, tenant_signed_at, landlord_signed_at, signing_link_token_hash, signature_lock_version. | N/A | 2 | Backend Team |
| 5 | 1.4.3.1.2 | Audit Trail Table | Create lease_signing_audit table with foreign key to leases. | 1.4.3.1.1 | 1 | Backend Team |
| 5 | 1.4.3.1.3 | Indexes and Constraints | Add indexes on signing_link_token_hash and audit.lease_id, add CHECK constraints. | 1.4.3.1.2 | 1 | Backend Team |
| 4 | 1.4.3.2 | JWT Token System | Implement secure token generation and validation for signing links. | 1.4.3.1 | 4 | Backend Team |
| 5 | 1.4.3.2.1 | JWT Utility Functions | Create token generation with 30-day expiration and SHA-256 hashing. | 1.4.3.1.3 | 2 | Backend Team |
| 5 | 1.4.3.2.2 | Token Verification | Implement JWT verification with expiration checking. | 1.4.3.2.1 | 1 | Backend Team |
| 5 | 1.4.3.2.3 | Token Invalidation | Implement token invalidation for regeneration workflow. | 1.4.3.2.2 | 1 | Backend Team |
| 4 | 1.4.3.3 | Signing Mode Selection UI | Create interface for selecting in-person or remote signing modes. | 1.4.3.2 | 4 | Frontend Team |
| 5 | 1.4.3.3.1 | Mode Selector Component | Create SigningModeSelector with in-person and remote options. | 1.4.3.2.3 | 2 | Frontend Team |
| 5 | 1.4.3.3.2 | Mode State Management | Add signing mode state to wizard context/store. | 1.4.3.3.1 | 1 | Frontend Team |
| 5 | 1.4.3.3.3 | Mode Locking Logic | Implement mode locking after first signature. | 1.4.3.3.2 | 1 | Frontend Team |
| 4 | 1.4.3.4 | In-Person Dual Signing Interface | Implement simultaneous signature capture for both parties. | 1.4.3.3 | 5 | Frontend Team |
| 5 | 1.4.3.4.1 | Tenant Signature Pad | Create TenantSignaturePad with signature_pad.js integration. | 1.4.3.3.3 | 2 | Frontend Team |
| 5 | 1.4.3.4.2 | Landlord Signature Pad | Create LandlordSignaturePad component. | 1.4.3.4.1 | 2 | Frontend Team |
| 5 | 1.4.3.4.3 | Sequential Enabling | Implement tenant-first, then landlord sequential enabling. | 1.4.3.4.2 | 1 | Frontend Team |
| 4 | 1.4.3.5 | Remote Signing Link Generation | Create and distribute signing links for remote tenant signing. | 1.4.3.3 | 6 | Full-Stack Team |
| 5 | 1.4.3.5.1 | Link Generation API | Create API route for signing link generation. | 1.4.3.3.3 | 2 | Backend Team |
| 5 | 1.4.3.5.2 | Email Integration | Create Supabase Edge Function for email sending with Resend API. | 1.4.3.5.1 | 2 | Backend Team |
| 5 | 1.4.3.5.3 | Email Templates | Design signing link and landlord notification email templates. | 1.4.3.5.2 | 2 | Frontend Team |
| 4 | 1.4.3.6 | Remote Tenant Signing Interface | Create tenant-facing signing interface with JWT validation. | 1.4.3.5 | 6 | Frontend and Backend Team |
| 5 | 1.4.3.6.1 | Tenant Signing Page | Create /tenant/sign-lease/[applicationId] page route. | 1.4.3.5.3 | 2 | Frontend Team |
| 5 | 1.4.3.6.2 | JWT Token Verification | Implement JWT verification on page load with error handling. | 1.4.3.6.1 | 1 | Backend Team |
| 5 | 1.4.3.6.3 | Lease Terms Display | Display complete lease terms with scroll-to-bottom requirement. | 1.4.3.6.2 | 2 | Frontend Team |
| 5 | 1.4.3.6.4 | Tenant Signature Save | Create tenant signature save API route with status update. | 1.4.3.6.3 | 1 | Backend Team |
| 4 | 1.4.3.7 | Landlord Countersignature Flow | Implement landlord countersignature after tenant signs remotely. | 1.4.3.6 | 6 | Frontend and Backend Team |
| 5 | 1.4.3.7.1 | Tenant Signature Display | Display tenant signature with timestamp in application view. | 1.4.3.6.4 | 1 | Frontend Team |
| 5 | 1.4.3.7.2 | Countersignature Modal | Create "Countersign Lease" button and modal with signature pad. | 1.4.3.7.1 | 2 | Frontend Team |
| 5 | 1.4.3.7.3 | Countersignature API | Create landlord countersignature API route with status update. | 1.4.3.7.2 | 1 | Backend Team |
| 5 | 1.4.3.7.4 | Confirmation Email | Send confirmation email to tenant with executed lease PDF. | 1.4.3.7.3 | 2 | Backend Team |
| 4 | 1.4.3.8 | Wizard State Persistence | Implement localStorage-based state preservation for external tool access. | 1.4.3.7 | 5 | Frontend Team |
| 5 | 1.4.3.8.1 | localStorage Utilities | Create save, load, clear functions with 24-hour TTL. | N/A | 2 | Frontend Team |
| 5 | 1.4.3.8.2 | State Serialization | Implement wizard state serialization to localStorage. | 1.4.3.8.1 | 1 | Frontend Team |
| 5 | 1.4.3.8.3 | State Restoration | Implement state restoration on wizard mount with stale data detection. | 1.4.3.8.2 | 1 | Frontend Team |
| 5 | 1.4.3.8.4 | Error Handling | Handle localStorage quota exceeded and disabled errors. | 1.4.3.8.3 | 1 | Frontend Team |
| 4 | 1.4.3.9 | External Tool Access Buttons | Create quick-access buttons for Contract Templates, Property Policies, Amenities. | 1.4.3.8 | 3 | Frontend Team |
| 5 | 1.4.3.9.1 | Tool Access Bar Component | Create ToolAccessBar with three buttons and icons. | 1.4.3.8.4 | 1 | Frontend Team |
| 5 | 1.4.3.9.2 | New Tab Navigation | Implement target="_blank" for external tool opening. | 1.4.3.9.1 | 1 | Frontend Team |
| 5 | 1.4.3.9.3 | Data Refresh Logic | Implement data refresh when returning from external tools. | 1.4.3.9.2 | 1 | Frontend Team |
| 4 | 1.4.3.10 | Lease Status State Machine | Implement validated status transitions for lease lifecycle. | 1.4.3.1 | 4 | Backend Team |
| 5 | 1.4.3.10.1 | Status Enum Type | Create lease status enum (draft, pending_tenant_signature, pending_landlord_signature, active, expired, terminated). | 1.4.3.1.3 | 1 | Backend Team |
| 5 | 1.4.3.10.2 | Transition Validation | Implement status transition validation function. | 1.4.3.10.1 | 1 | Backend Team |
| 5 | 1.4.3.10.3 | Server-Side Guards | Add server-side transition guards in API routes. | 1.4.3.10.2 | 1 | Backend Team |
| 5 | 1.4.3.10.4 | Status Badge Component | Create status badge with color coding. | 1.4.3.10.3 | 1 | Frontend Team |
| 4 | 1.4.3.11 | Signature Validation and Storage | Implement signature data validation and concurrent signing prevention. | 1.4.3.4 | 5 | Backend Team |
| 5 | 1.4.3.11.1 | Validation Utilities | Create base64, PNG, file size, and dimension validation functions. | 1.4.3.4.3 | 2 | Backend Team |
| 5 | 1.4.3.11.2 | Data URL Sanitization | Implement signature data URL sanitization for XSS prevention. | 1.4.3.11.1 | 1 | Backend Team |
| 5 | 1.4.3.11.3 | Optimistic Locking | Implement signature_lock_version counter for concurrent prevention. | 1.4.3.11.2 | 1 | Backend Team |
| 5 | 1.4.3.11.4 | Retry Logic | Implement retry logic with exponential backoff for failed saves. | 1.4.3.11.3 | 1 | Backend Team |
| 4 | 1.4.3.12 | Audit Trail System | Implement comprehensive logging for all signing events. | 1.4.3.1 | 6 | Backend Team |
| 5 | 1.4.3.12.1 | Audit Logging Utility | Create audit logging function with IP address and user agent capture. | 1.4.3.1.2 | 1 | Backend Team |
| 5 | 1.4.3.12.2 | Event Logging | Implement logging for all signing events (link generated, accessed, signed, expired). | 1.4.3.12.1 | 2 | Backend Team |
| 5 | 1.4.3.12.3 | Audit Trail Display | Create audit trail display component with formatted timestamps. | 1.4.3.12.2 | 2 | Frontend Team |
| 5 | 1.4.3.12.4 | Authorization Check | Add authorization check for audit trail visibility. | 1.4.3.12.3 | 1 | Backend Team |

## Summary Statistics

- **Total Level 2 Work Packages:** 9 workstreams
- **Total Level 3 Work Packages:** 31 deliverables
- **Enhanced Lease Signing Workflow (1.4.3):** 12 Level 4 sub-packages with 34 Level 5 tasks
- **Estimated Total Duration:** ~120 working days (excluding parallel execution)
- **Critical Path:** 1.2.1 -> 1.3.1 -> 1.3.2 -> 1.3.3 -> 1.4.1 -> 1.4.2 -> 1.4.3 -> 1.4.4 -> 1.9.1 -> 1.9.2 -> 1.9.3

## Notes

1. Durations are estimates and may be refined during implementation
2. Work packages can be executed in parallel where dependencies allow
3. The Enhanced Lease Signing Workflow (1.4.3) is the most complex work package with 12 sub-packages
4. Testing (1.9.1) should begin after core platform setup (1.2) is complete
5. Documentation (1.9.3) runs in parallel with bug fixing (1.9.2)
