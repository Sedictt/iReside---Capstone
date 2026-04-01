# TEST CASES

## iReside

Grouped by stakeholder, aligned with the PDF format.

## 1. Administrator

| Test Case ID | Case Name | Case Description | Expected Result | Test Data | Actual Result | P/F | Remarks |
|---|---|---|---|---|---|---|---|
| TC-001 | View All Users | Open the admin users page and review all accounts. | Users list loads with complete records. | N/A |  |  | Requirement ID: `ADMIN-001`<br/>Priority: High |
| TC-002 | Search Users by Name | Search users using partial and full name values. | Matching users are returned accurately. | Name query: `juan` |  |  | Requirement ID: `ADMIN-001`<br/>Priority: High |
| TC-003 | Filter Users by Role | Apply role filters for tenant, landlord, and admin. | Only users matching selected role are shown. | Role: `landlord` |  |  | Requirement ID: `ADMIN-001`<br/>Priority: High |
| TC-004 | Open User Profile | Open a user detail record from the list. | Profile details page/modal displays correctly. | Existing user ID |  |  | Requirement ID: `ADMIN-001`<br/>Priority: Medium |
| TC-005 | Suspend User Account | Suspend an active account from admin controls. | User status changes to suspended and login is blocked. | Existing active account |  |  | Requirement ID: `ADMIN-003`<br/>Priority: High |
| TC-006 | Reactivate User Account | Reactivate a suspended account. | User status returns to active and access is restored. | Suspended account |  |  | Requirement ID: `ADMIN-003`<br/>Priority: High |
| TC-007 | Reset User Password | Trigger admin password reset workflow. | Reset action succeeds and reset email is sent. | Existing user email |  |  | Requirement ID: `ADMIN-004`<br/>Priority: Medium |
| TC-008 | Approve Landlord Registration | Review and approve a pending landlord application. | Application status changes to approved and user is notified. | Pending landlord application |  |  | Requirement ID: `ADMIN-002`<br/>Priority: High |
| TC-009 | Reject Landlord Registration | Reject a pending landlord application with reason. | Application is rejected and reason is recorded and sent. | Pending landlord application |  |  | Requirement ID: `ADMIN-002`<br/>Priority: High |
| TC-010 | View Registration Details | Open full registration detail before decision. | Complete submitted details are visible and readable. | Pending application |  |  | Requirement ID: `ADMIN-002`<br/>Priority: Medium |
| TC-011 | View Audit Logs | Open admin audit logs for recent actions. | Audit trail shows actor, action, and timestamp. | N/A |  |  | Requirement ID: `ADMIN-006`<br/>Priority: Medium |
| TC-012 | Export User List CSV | Export the user list to CSV. | CSV file downloads and contains filtered users. | Active filters applied |  |  | Requirement ID: `ADMIN-007`<br/>Priority: Medium |
| TC-013 | Validate Pagination | Move across pages in users table. | Pagination changes page and keeps filter context. | 30+ users in dataset |  |  | Requirement ID: `ADMIN-001`<br/>Priority: Medium |
| TC-014 | Unauthorized Admin Route Block | Attempt admin route access as non-admin. | Access is denied and user is redirected. | Tenant session |  |  | Requirement ID: `AUTH-005`<br/>Priority: High |
| TC-015 | Admin Dashboard Metrics | Open admin dashboard metrics panel. | Metrics load and match backend aggregates. | N/A |  |  | Requirement ID: `ADMIN-008`<br/>Priority: High |

---

## 2. Landlord

| Test Case ID | Case Name | Case Description | Expected Result | Test Data | Actual Result | P/F | Remarks |
|---|---|---|---|---|---|---|---|
| TC-016 | Create Property | Create a property with required details. | Property is created and listed in dashboard. | Name: `Sunset Apartments` |  |  | Requirement ID: `PROP-001`<br/>Priority: High |
| TC-017 | Edit Property Details | Update property title, address, and description. | Changes persist and reflect in listings. | Existing property |  |  | Requirement ID: `PROP-001`<br/>Priority: High |
| TC-018 | Archive Property | Archive a property no longer in use. | Archived property is hidden from active list. | Existing property |  |  | Requirement ID: `PROP-004`<br/>Priority: Medium |
| TC-019 | Add Unit to Property | Add a unit with rent and room details. | Unit is linked and appears under property. | Unit: `A-101` |  |  | Requirement ID: `PROP-002`<br/>Priority: High |
| TC-020 | Edit Unit Details | Update unit rent, bedroom, and bathroom values. | Unit updates save and display correctly. | Existing unit |  |  | Requirement ID: `PROP-002`<br/>Priority: High |
| TC-021 | Mark Unit Vacant | Change occupied unit to vacant status. | Unit status updates and availability reflects. | Existing occupied unit |  |  | Requirement ID: `PROP-006`<br/>Priority: Medium |
| TC-022 | Upload Property Images | Upload property and unit photos. | Images are uploaded and rendered in gallery. | JPG/PNG files |  |  | Requirement ID: `PROP-003`<br/>Priority: Medium |
| TC-023 | Replace Property Cover Image | Replace existing cover image with a new one. | New cover image is displayed immediately. | Valid image file |  |  | Requirement ID: `PROP-003`<br/>Priority: Medium |
| TC-024 | Remove Unit Image | Delete an uploaded image from unit gallery. | Selected image is removed successfully. | Existing image |  |  | Requirement ID: `PROP-003`<br/>Priority: Low |
| TC-025 | Property Dashboard Statistics | View landlord property metrics panel. | Counts and totals are accurate. | N/A |  |  | Requirement ID: `PROP-005`<br/>Priority: High |
| TC-026 | Create Walk-in Application | Start a new walk-in application through wizard. | Wizard starts and step 1 is ready for input. | Unit selected |  |  | Requirement ID: `APP-002`<br/>Priority: High |
| TC-027 | Save Draft Walk-in Application | Save wizard progress before completion. | Draft is saved and recoverable later. | Partially completed wizard |  |  | Requirement ID: `APP-002`<br/>Priority: High |
| TC-028 | Resume Draft Walk-in Application | Resume a previously saved application draft. | Wizard reopens at last saved step and values. | Existing draft |  |  | Requirement ID: `APP-002`<br/>Priority: High |
| TC-029 | Submit Application with Required Fields | Complete wizard with all required values and submit. | Application is created with `pending` status. | Valid applicant data |  |  | Requirement ID: `APP-002`<br/>Priority: High |
| TC-030 | Reject Incomplete Application | Attempt submit with missing required values. | Validation errors block submission. | Missing phone/income |  |  | Requirement ID: `APP-002`<br/>Priority: High |
| TC-031 | Update Application Status to Reviewing | Move a pending application to reviewing. | Status changes and activity is logged. | Pending application |  |  | Requirement ID: `APP-004`<br/>Priority: High |
| TC-032 | Approve Application | Approve reviewed tenant application. | Status changes to approved and next actions enabled. | Reviewing application |  |  | Requirement ID: `APP-004`<br/>Priority: High |
| TC-033 | Reject Application with Reason | Reject reviewed application with decision note. | Status is rejected and reason is saved. | Reviewing application |  |  | Requirement ID: `APP-004`<br/>Priority: High |
| TC-034 | Generate Tenant Credentials | Generate credentials after approval. | Credentials are generated and emailed. | Approved application |  |  | Requirement ID: `APP-006`<br/>Priority: Medium |
| TC-035 | Regenerate Tenant Credentials | Regenerate credentials when first email fails. | New credentials are issued and previous invalidated. | Approved application |  |  | Requirement ID: `APP-006`<br/>Priority: Medium |
| TC-036 | Generate Lease Agreement | Create lease from approved application. | Lease draft is generated with populated details. | Approved application |  |  | Requirement ID: `LEASE-001`<br/>Priority: High |
| TC-037 | Edit Lease Terms Before Sending | Update lease term fields before signing flow. | Edits save and reflected in lease preview. | Lease draft |  |  | Requirement ID: `LEASE-001`<br/>Priority: High |
| TC-038 | Send Lease for Tenant Signature | Send lease signing link to tenant. | Signing link is generated and sent by email. | Lease draft |  |  | Requirement ID: `LEASE-002`<br/>Priority: High |
| TC-039 | Tenant Signature Tracking Visibility | Monitor if tenant has completed signature. | Landlord sees updated signature status. | Lease pending tenant signature |  |  | Requirement ID: `LEASE-005`<br/>Priority: High |
| TC-040 | Landlord Countersign Lease | Countersign after tenant completes signing. | Lease status updates to `active`. | Lease pending landlord signature |  |  | Requirement ID: `LEASE-003`<br/>Priority: High |
| TC-041 | Lease Status Tracking | View lease statuses in lease management list. | Status badges are accurate for all records. | Multiple lease states |  |  | Requirement ID: `LEASE-006`<br/>Priority: High |
| TC-042 | Record Manual Payment | Record payment entry for tenant lease. | Payment is saved and linked to lease history. | Amount: `15000` |  |  | Requirement ID: `PAY-003`<br/>Priority: High |
| TC-043 | Validate Duplicate Payment Reference | Submit duplicate payment reference number. | System blocks duplicate reference and shows error. | Ref: `GCASH-12345` |  |  | Requirement ID: `PAY-003`<br/>Priority: High |
| TC-044 | View Payment History | Open payment history and apply filters. | Filtered records display correctly. | Date range filter |  |  | Requirement ID: `PAY-004`<br/>Priority: High |
| TC-045 | Export Payment History CSV | Export payment history list to CSV. | CSV export contains matching rows and totals. | Active payment filters |  |  | Requirement ID: `PAY-005`<br/>Priority: Medium |

---

## 3. Tenant

| Test Case ID | Case Name | Case Description | Expected Result | Test Data | Actual Result | P/F | Remarks |
|---|---|---|---|---|---|---|---|
| TC-046 | Submit Online Application | Submit an online rental application to a listing. | Application is created in `pending` status. | Valid applicant profile |  |  | Requirement ID: `APP-001`<br/>Priority: High |
| TC-047 | Save Online Application Draft | Save partially completed online application. | Draft is stored and editable later. | Partial form input |  |  | Requirement ID: `APP-001`<br/>Priority: High |
| TC-048 | Edit Online Application Draft | Reopen draft and continue editing values. | Updates persist and draft remains valid. | Existing application draft |  |  | Requirement ID: `APP-001`<br/>Priority: High |
| TC-049 | Upload Application Attachment | Add attachment while applying (ID/proof). | Supported file uploads successfully. | PDF/JPG file |  |  | Requirement ID: `APP-003`<br/>Priority: Medium |
| TC-050 | View Application Status Timeline | Open application status history/timeline. | Timeline shows accurate chronological events. | Existing application |  |  | Requirement ID: `APP-005`<br/>Priority: Medium |
| TC-051 | Receive Credential Email | Confirm tenant receives generated credentials email. | Email arrives with valid login details. | Approved application |  |  | Requirement ID: `APP-006`<br/>Priority: Medium |
| TC-052 | First Login with Generated Credentials | Login using generated credentials for first time. | Login succeeds and redirects to tenant dashboard. | Generated credentials |  |  | Requirement ID: `AUTH-002`<br/>Priority: High |
| TC-053 | Open Lease Signing Link | Open lease signing link from email. | Signing page opens when token is valid. | Valid link token |  |  | Requirement ID: `LEASE-002`<br/>Priority: High |
| TC-054 | Sign Lease Digitally | Review and sign lease in signing page. | Signature saves and success confirmation appears. | Valid signature input |  |  | Requirement ID: `LEASE-002`<br/>Priority: High |
| TC-055 | Block Expired Lease Link | Open expired signing link after validity period. | Access is blocked with expiration message. | Expired token |  |  | Requirement ID: `LEASE-007`<br/>Priority: High |
| TC-056 | View Active Lease Details | Open tenant lease details after activation. | Lease details display correct amounts and terms. | Active lease |  |  | Requirement ID: `LEASE-006`<br/>Priority: High |
| TC-057 | View Payment Obligations | Open obligations card/list for active lease. | Due amount and due date are accurate. | Active lease |  |  | Requirement ID: `PAY-001`<br/>Priority: High |
| TC-058 | View Payment Due Date Alerts | Check due reminders in tenant portal. | Upcoming dues appear in alerts/notifications. | Rent due in 3 days |  |  | Requirement ID: `NOTIF-001`<br/>Priority: Medium |
| TC-059 | Submit Maintenance Request | Create maintenance request with details and priority. | Request is submitted and appears in tenant list. | Priority: `high` |  |  | Requirement ID: `MAINT-001`<br/>Priority: High |
| TC-060 | Upload Maintenance Evidence Image | Add image evidence to maintenance request. | Image uploads and attaches to request. | JPG image |  |  | Requirement ID: `MAINT-001`<br/>Priority: Medium |
| TC-061 | Track Maintenance Status | View status changes for submitted request. | Status timeline updates as landlord changes status. | Existing request |  |  | Requirement ID: `MAINT-004`<br/>Priority: Medium |
| TC-062 | Add Maintenance Follow-up Comment | Post follow-up comment in maintenance thread. | Comment is saved and visible to landlord. | Follow-up message text |  |  | Requirement ID: `MAINT-005`<br/>Priority: Medium |
| TC-063 | Open Direct Message to Landlord | Start DM thread from tenant messages page. | New conversation opens with selected landlord. | Landlord user selected |  |  | Requirement ID: `MSG-001`<br/>Priority: High |
| TC-064 | Send Attachment in Chat | Send file attachment in tenant-landlord chat. | Attachment appears in thread and is downloadable. | PDF lease addendum |  |  | Requirement ID: `MSG-002`<br/>Priority: High |
| TC-065 | Mark Messages as Read | Open unread conversation and verify read update. | Unread count decrements and read status updates. | Unread messages present |  |  | Requirement ID: `MSG-004`<br/>Priority: Medium |

---

## 4. Shared (Landlord and Tenant)

| Test Case ID | Case Name | Case Description | Expected Result | Test Data | Actual Result | P/F | Remarks |
|---|---|---|---|---|---|---|---|
| TC-066 | Signing Link Expiration Notification | Validate email reminder when signing link is near expiry. | Reminder notification is sent before expiration. | Link age: 29 days |  |  | Requirement ID: `LEASE-007`<br/>Priority: Medium |
| TC-067 | Signing Link One-Time Use Enforcement | Attempt to reuse already consumed signing link. | Reused link is blocked with clear message. | Consumed token |  |  | Requirement ID: `LEASE-008`<br/>Priority: High |
| TC-068 | Request Timeline Ordering | Open maintenance timeline on both roles. | Events are sorted chronologically and consistent. | Existing request timeline |  |  | Requirement ID: `MAINT-004`<br/>Priority: Medium |
| TC-069 | Community Post Creation | Create community post from shared forum module. | Post appears in feed with author metadata. | Title + content |  |  | Requirement ID: `COMM-001`<br/>Priority: High |
| TC-070 | Community Post Edit | Edit own community post content. | Changes save and updated version appears in feed. | Existing own post |  |  | Requirement ID: `COMM-002`<br/>Priority: Medium |
| TC-071 | Community Post Delete Own Post | Delete own post from forum. | Post is removed and no longer listed. | Existing own post |  |  | Requirement ID: `COMM-003`<br/>Priority: Medium |
| TC-072 | Community Reaction Toggle | Add then remove reaction on a post. | Reaction count increments/decrements correctly. | Existing post |  |  | Requirement ID: `COMM-005`<br/>Priority: Medium |
| TC-073 | Community Comment on Post | Add comment under existing post. | Comment is visible to all allowed viewers. | Existing post |  |  | Requirement ID: `COMM-006`<br/>Priority: Medium |
| TC-074 | Landlord Announcement Visibility to Tenants | Publish landlord announcement and verify tenant visibility. | Announcement is visible to intended tenant audience. | Landlord announcement text |  |  | Requirement ID: `COMM-004`<br/>Priority: High |
| TC-075 | Announcement Pin/Unpin | Pin and unpin a high-priority announcement. | Pinned state updates and ordering changes accordingly. | Existing announcement |  |  | Requirement ID: `COMM-004`<br/>Priority: Medium |
| TC-076 | In-app Notification Delivery | Trigger event and validate in-app notification. | Notification appears in notification center promptly. | Event: new message |  |  | Requirement ID: `NOTIF-001`<br/>Priority: High |
| TC-077 | Email Notification Delivery | Trigger event and validate email notification content. | Email sends with correct subject/body and link. | Event: maintenance update |  |  | Requirement ID: `NOTIF-002`<br/>Priority: High |
| TC-078 | Notification Deep Link Navigation | Click notification and validate destination routing. | User is routed to related page/entity correctly. | Notification item |  |  | Requirement ID: `NOTIF-003`<br/>Priority: Medium |
| TC-079 | Notification Mark as Read | Mark one notification item as read. | Item read state updates and unread badge changes. | Existing unread notification |  |  | Requirement ID: `NOTIF-003`<br/>Priority: Medium |
| TC-080 | Notification Mark All as Read | Use mark-all action in notification center. | All unread notifications switch to read. | Multiple unread notifications |  |  | Requirement ID: `NOTIF-003`<br/>Priority: Medium |

---

## 5. All Users

| Test Case ID | Case Name | Case Description | Expected Result | Test Data | Actual Result | P/F | Remarks |
|---|---|---|---|---|---|---|---|
| TC-081 | User Registration | Register a new account with required fields. | Account and profile are created successfully. | Email + password + role |  |  | Requirement ID: `AUTH-001`<br/>Priority: High |
| TC-082 | Duplicate Email Registration Validation | Register with an already-used email address. | Registration is blocked with duplicate email error. | Existing email |  |  | Requirement ID: `AUTH-001`<br/>Priority: High |
| TC-083 | User Login | Login with valid credentials. | Authentication succeeds and dashboard opens. | Valid account |  |  | Requirement ID: `AUTH-002`<br/>Priority: High |
| TC-084 | Invalid Login Error Handling | Login with wrong password and invalid email format. | Proper error messages are shown. | Invalid credentials |  |  | Requirement ID: `AUTH-002`<br/>Priority: High |
| TC-085 | Session Persistence After Refresh | Refresh browser after successful login. | Session remains active and user stays logged in. | Logged-in user |  |  | Requirement ID: `AUTH-002`<br/>Priority: High |
| TC-086 | User Logout | Logout from active session. | Session ends and protected pages require login. | Logged-in user |  |  | Requirement ID: `AUTH-003`<br/>Priority: High |
| TC-087 | Profile Update | Update profile name and contact info. | Updated profile fields persist and display correctly. | New profile values |  |  | Requirement ID: `AUTH-004`<br/>Priority: Medium |
| TC-088 | Avatar Upload Validation | Upload invalid and valid avatar file types/sizes. | Invalid uploads fail; valid avatar saves. | PNG + oversized file |  |  | Requirement ID: `AUTH-004`<br/>Priority: Medium |
| TC-089 | Role-Based Access Control | Access role-restricted routes for each role. | Unauthorized routes are blocked for mismatched roles. | Tenant, landlord, admin accounts |  |  | Requirement ID: `AUTH-005`<br/>Priority: High |
| TC-090 | Protected Route Redirect | Open protected route while logged out. | User is redirected to login page. | No session |  |  | Requirement ID: `AUTH-005`<br/>Priority: High |
| TC-091 | IRIS Chat Response | Submit prompt in IRIS chat assistant. | AI response is generated and displayed. | Prompt: `How to pay rent?` |  |  | Requirement ID: `IRIS-001`<br/>Priority: Medium |
| TC-092 | IRIS Conversation History Persistence | Create multiple IRIS messages, then reopen chat. | Prior conversation history is preserved and visible. | Existing conversation |  |  | Requirement ID: `IRIS-002`<br/>Priority: Medium |

---

## 6. Regression Tests (Cross-Role)

| Test Case ID | Case Name | Case Description | Expected Result | Test Data | Actual Result | P/F | Remarks |
|---|---|---|---|---|---|---|---|
| TC-093 | Login Flow Regression | Re-run full authentication flow across supported roles. | Login/logout/session flow remains stable. | Tenant + landlord + admin |  |  | Priority: High |
| TC-094 | Landlord Application Flow Regression | Re-run landlord application lifecycle from create to decision. | End-to-end application flow works without regressions. | Walk-in and online applications |  |  | Priority: High |
| TC-095 | Lease Signing Flow Regression | Re-run lease creation, tenant sign, landlord countersign, activation. | Lease reaches active state with correct status transitions. | Approved application with generated lease |  |  | Priority: High |
| TC-096 | Payment Flow Regression | Re-run payment entry and history verification flow. | Payment records remain accurate and searchable. | Sample monthly payment |  |  | Priority: High |
| TC-097 | Maintenance Flow Regression | Re-run maintenance create, update, and close cycle. | Maintenance lifecycle and notifications stay correct. | One open maintenance request |  |  | Priority: High |
| TC-098 | Messaging Flow Regression | Re-run direct chat messaging with attachments and read updates. | Delivery, attachment handling, and read states remain correct. | Image and PDF attachment |  |  | Priority: Medium |
| TC-099 | Community Flow Regression | Re-run post, comment, reaction, and moderation behaviors. | Community interactions still function as expected. | Existing discussion thread |  |  | Priority: Medium |
| TC-100 | Admin Workflow Regression | Re-run critical admin workflows end-to-end. | Admin tools remain functional and secure. | Admin account + pending requests |  |  | Priority: High |

---

## 7. Test Data Summary

| Category | Test Data |
|---|---|
| **Roles** | tenant, landlord, admin |
| **Property Types** | Boarding House, Apartment, Dormitory |
| **Application Status** | pending, reviewing, approved, rejected |
| **Lease Status** | draft, pending_signature, active, expired, terminated |
| **Payment Methods** | Cash, GCash, Maya, Bank Transfer |
| **Maintenance Priority** | low, medium, high, urgent |
| **Notification Types** | payment, lease, maintenance, application, message |

---

*Document Version: 1.1*
*Updated: 2026-03-30*
