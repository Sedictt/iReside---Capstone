<!-- converted from iReside_UAT_Test_Cases_v2.xlsx -->

## Sheet: UAT Test Cases
| Test Case ID | Stakeholder | Module / Route | Test Scenario | Preconditions | Test Steps | Expected Result | Actual Result | Pass or Failed | Remarks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC-001 | Landlord | Authentication (/login) | Log in with valid landlord credentials | A landlord account exists and is active. | 1. Open /login.
2. Enter valid landlord email and password.
3. Click Log In. | The system authenticates the landlord, creates a session, and redirects to the landlord portal. |  |  |  |
| TC-002 | Landlord | Authentication (/login) | Reject invalid landlord credentials | The login page is accessible. | 1. Open /login.
2. Enter an invalid email, password, or mismatched combination.
3. Click Log In. | The system denies access and shows a login error without opening landlord pages. |  |  |  |
| TC-003 | Landlord | Authentication / RBAC (/landlord/*) | Allow only authenticated landlords to open landlord routes | A landlord route such as /landlord/dashboard exists. | 1. Open a landlord route while logged out.
2. Repeat using a non-landlord account.
3. Repeat using a landlord account. | Logged-out and unauthorized users are blocked, while the landlord can access the route normally. |  |  |  |
| TC-004 | Landlord | Dashboard (/landlord/dashboard) | Load the landlord dashboard overview | The landlord is logged in. | 1. Open /landlord/dashboard.
2. Wait for dashboard widgets to load.
3. Review the banner and payment overview sections. | The dashboard loads the banner, payment overview, and recent inquiry sections without layout errors. |  |  |  |
| TC-005 | Landlord | Dashboard Payment Overview (/landlord/dashboard) | Open payment details by category from the dashboard | The landlord dashboard shows payment categories. | 1. Open /landlord/dashboard.
2. Click See All for Overdue, Near Due, or Paid.
3. Review the payment modal contents. | The system opens the payment modal for the selected category and lists matching payment records or a valid empty state. |  |  |  |
| TC-006 | Landlord | Dashboard Advisory (/landlord/dashboard) | Display or gracefully hide the system advisory panel | The landlord is logged in. | 1. Open /landlord/dashboard.
2. Observe the advisory area when advisory data exists.
3. Repeat when no advisory is returned. | The advisory panel appears when data is available and stays hidden without breaking the dashboard when no advisory exists. |  |  |  |
| TC-007 | Landlord | Properties (/landlord/properties) | Create a property with valid required details | The landlord is logged in and can access the properties module. | 1. Open /landlord/properties/new or the create property flow.
2. Enter valid property details.
3. Save the property. | The property record is created and becomes available in the landlord property list. |  |  |  |
| TC-008 | Landlord | Properties (/landlord/properties) | Validate required property fields during creation | The property creation form is open. | 1. Leave one or more required property fields blank.
2. Attempt to save the property.
3. Review validation feedback. | The system blocks saving and highlights the missing or invalid property fields. |  |  |  |
| TC-009 | Landlord | Properties (/landlord/properties) | Edit an existing property record | At least one property already exists under the landlord account. | 1. Open /landlord/properties.
2. Select an existing property.
3. Update one or more property fields and save. | The edited property details are saved and persist after refresh. |  |  |  |
| TC-010 | Landlord | Properties / Units (/landlord/properties) | Add a new unit under an existing property | A property exists and the unit management form is available. | 1. Open a property inside /landlord/properties.
2. Choose the add unit action.
3. Enter valid unit details and save. | The unit is created and linked to the selected property. |  |  |  |
| TC-011 | Landlord | Properties / Units (/landlord/properties) | Validate incomplete or invalid unit data | The add or edit unit form is open. | 1. Enter invalid or incomplete unit details.
2. Attempt to save the unit.
3. Review the form response. | The system rejects the save and identifies the invalid unit inputs. |  |  |  |
| TC-012 | Landlord | Properties / Units (/landlord/properties) | Update unit pricing, deposit, amenities, or status | A unit already exists for the landlord. | 1. Open an existing unit record.
2. Change rent, deposit, amenities, or availability.
3. Save and refresh the page. | The updated unit attributes persist and the latest values appear in the unit record. |  |  |  |
| TC-013 | Landlord | Unit Media (/landlord/properties) | Upload supported media for a unit | A unit exists and the media upload area is available. | 1. Open the unit media section.
2. Select a supported image or media file within the allowed limit.
3. Upload the file. | The file uploads successfully and a preview or attached media entry is shown for the unit. |  |  |  |
| TC-014 | Landlord | Unit Media (/landlord/properties) | Reject unsupported or oversized unit media uploads | The unit media upload area is available. | 1. Open the unit media section.
2. Select an unsupported file type or an oversized file.
3. Attempt the upload. | The system blocks the upload and shows an error explaining the invalid file constraint. |  |  |  |
| TC-015 | Landlord | Properties Dashboard (/landlord/properties) | Review the landlord property list and related records | At least one property exists. | 1. Open /landlord/properties.
2. Review the listed properties and linked unit details.
3. Open a property record from the dashboard. | The landlord can see the existing properties and navigate into their details without data mismatch. |  |  |  |
| TC-016 | Landlord | Unit Map / Visual Planner (/landlord/unit-map or /dashboard/visual-planner) | Open the visual planner for a property layout | The landlord is logged in and at least one property exists. | 1. Open the landlord unit map or visual planner route.
2. Select a property layout to manage.
3. Wait for planner elements to render. | The visual planner loads the current layout and editing tools for the selected property. |  |  |  |
| TC-017 | Landlord | Visual Planner (/dashboard/visual-planner) | Drag and snap planner elements on the grid | A property layout is open in the visual planner. | 1. Select a corridor, unit, or room element.
2. Drag it to a new grid location.
3. Release the element. | The moved element snaps to the grid and updates its position correctly on the canvas. |  |  |  |
| TC-018 | Landlord | Visual Planner (/dashboard/visual-planner) | Persist a visual planner layout after saving | A planner layout has unsaved changes. | 1. Move or adjust one or more layout elements.
2. Save the layout.
3. Reload the route or return later. | The saved layout persists and reloads with the updated structure. |  |  |  |
| TC-019 | Landlord | Unit Map (/landlord/unit-map) | Review the landlord unit map and occupancy state | Property units exist and are represented on the unit map. | 1. Open /landlord/unit-map.
2. Review the unit layout and statuses.
3. Verify occupied and available units are distinguishable. | The unit map displays the building layout and current unit statuses in a readable format. |  |  |  |
| TC-020 | Landlord | Applications (/landlord/applications?action=walk-in) | Submit a walk-in application through the wizard | An available unit exists and the landlord can access the walk-in wizard. | 1. Open /landlord/applications?action=walk-in.
2. Select a unit and enter applicant details.
3. Complete the checklist and finish the wizard. | The walk-in application is created successfully and appears in the applications list. |  |  |  |
| TC-021 | Landlord | Applications (/landlord/applications) | Save a walk-in application as pending | The walk-in application form is available. | 1. Open the walk-in application flow.
2. Enter valid applicant details without completing final approval.
3. Save the application as pending. | The system stores the application and marks its status as pending. |  |  |  |
| TC-022 | Landlord | Applications (/landlord/applications) | Approve a walk-in application with completed requirements | A pending walk-in application exists with all required checklist items satisfied. | 1. Open the application record.
2. Review applicant data and compliance checklist.
3. Approve the application. | The application status updates to approved and becomes eligible for lease finalization. |  |  |  |
| TC-023 | Landlord | Applications (/landlord/applications) | Prevent submission of an incomplete walk-in application | The walk-in application form is open. | 1. Leave required applicant details blank.
2. Attempt to continue or finish the wizard.
3. Review the response. | The system prevents completion and shows validation errors for the incomplete requirements. |  |  |  |
| TC-024 | Landlord | Applications (/landlord/applications) | Block walk-in processing for an unavailable unit | A unit exists but is no longer available for application processing. | 1. Start a walk-in application.
2. Select an unavailable or occupied unit.
3. Attempt to proceed. | The system shows an availability warning and does not allow the application to continue with that unit. |  |  |  |
| TC-025 | Landlord | Lease Finalization (/api/landlord/lease/finalize) | Finalize an approved application into an active lease | An approved application exists and lease details are complete. | 1. Start the lease finalization workflow for an approved application.
2. Enter lease dates, rent, deposit, and signatures.
3. Submit finalization. | The system creates the lease, links the tenant and unit, and updates the lease and unit status. |  |  |  |
| TC-026 | Landlord | Lease Finalization (/api/landlord/lease/finalize) | Validate missing lease finalization requirements | The finalization workflow is available for an approved application. | 1. Leave required fields such as application, unit, dates, rent, or signatures incomplete.
2. Submit the finalization request.
3. Review the response. | The system rejects the request and reports the missing lease finalization data. |  |  |  |
| TC-027 | Landlord | Lease Finalization / Tenant Provisioning | Create a new tenant account while finalizing a lease | The approved applicant email does not already belong to an existing tenant account. | 1. Finalize the lease for a new applicant.
2. Allow the system to provision the tenant account.
3. Review the finalization response. | A tenant account is created, onboarding state is prepared, and the lease finalization returns the tenant credentials payload. |  |  |  |
| TC-028 | Landlord | Lease Finalization / Existing Tenant Reuse | Reuse an existing tenant account during lease finalization | The approved applicant email already belongs to an existing tenant account. | 1. Finalize the lease for an applicant with an existing tenant email.
2. Submit the finalization request.
3. Review the success response. | The system reuses the existing tenant account instead of creating a duplicate and still creates the lease successfully. |  |  |  |
| TC-029 | Landlord | Lease Signing Workflow | Complete the happy path signing order for a lease | A pending lease exists and the selected signing mode is valid. | 1. Open the lease signing workflow.
2. Complete the tenant signature step.
3. Complete the landlord signature step. | The system records both signatures in the correct order and advances the lease to the active state. |  |  |  |
| TC-030 | Landlord | Remote Lease Signing | Generate and send a remote signing link for the tenant | A lease is ready for remote signing and the tenant has a valid email address. | 1. Open the lease signing workflow.
2. Select the remote signing option.
3. Generate and send the signing link. | The system produces a secure tenant signing link and keeps the lease in the correct pending signature state. |  |  |  |
| TC-031 | Landlord | Lease Signing Validation | Keep the lease pending when required signatures are missing | A lease is open in the signing workflow. | 1. Attempt to complete the workflow without both required signatures.
2. Submit or continue the flow.
3. Review the status change. | The system prevents activation and retains a pending lease status until all required signatures are recorded. |  |  |  |
| TC-032 | Landlord | Lease / Document Vault | Review stored signed lease documents and related files | A lease has been created and related files exist in the document vault. | 1. Open the landlord lease or document area.
2. Select a signed lease or supporting file.
3. Review the document entry. | The document vault shows the lease-related files associated with the correct tenant and property. |  |  |  |
| TC-033 | Landlord | Invoices / Financial Ledger (/landlord/invoices) | Load invoice metrics and billing records | Billing records exist for one or more tenants. | 1. Open /landlord/invoices.
2. Wait for metrics and invoice rows to load.
3. Review totals and listed invoices. | The page shows invoice metrics, balances, and invoice rows or a valid empty state. |  |  |  |
| TC-034 | Landlord | Invoices (/landlord/invoices) | Search invoices by tenant name or invoice ID | Multiple invoices exist in the landlord account. | 1. Open /landlord/invoices.
2. Enter a tenant name or invoice ID in search.
3. Review the filtered list. | Only invoices matching the search query remain visible. |  |  |  |
| TC-035 | Landlord | Invoices (/landlord/invoices) | Filter invoices by status | Invoices exist across different statuses. | 1. Open /landlord/invoices.
2. Apply Pending, Overdue, Paid, and All filters.
3. Compare the visible invoice rows. | The list updates correctly for each status filter and shows an empty state when no rows match. |  |  |  |
| TC-036 | Landlord | Invoice Details (/landlord/invoices) | Open an invoice detail modal from the invoice list | At least one invoice exists in the list. | 1. Open /landlord/invoices.
2. Click the view invoice action.
3. Review the invoice modal contents. | The system opens the selected invoice details without navigating away from the invoice page. |  |  |  |
| TC-037 | Landlord | Invoice Actions (/landlord/invoices) | Send a reminder for an overdue invoice | At least one invoice is marked overdue. | 1. Open /landlord/invoices.
2. Locate an overdue invoice.
3. Trigger the send reminder action. | The overdue reminder action is available only for overdue invoices and the request is accepted without breaking the list. |  |  |  |
| TC-038 | Landlord | Maintenance (/landlord/maintenance) | Load the landlord maintenance dashboard | One or more maintenance requests exist or the module is accessible. | 1. Open /landlord/maintenance.
2. Wait for maintenance data to load.
3. Review cards, requests, and status markers. | The maintenance dashboard shows current request data or a clear empty or fallback state. |  |  |  |
| TC-039 | Landlord | Maintenance (/landlord/maintenance) | Update maintenance status from pending to in-progress or completed | A maintenance request exists and is editable by the landlord. | 1. Open a maintenance request.
2. Change its status.
3. Save or confirm the update. | The request status updates successfully and the new state appears in the maintenance dashboard. |  |  |  |
| TC-040 | Landlord | Statistics (/landlord/statistics) | Load landlord KPIs, charts, and featured property analytics | Statistics data is available for the landlord portfolio. | 1. Open /landlord/statistics.
2. Wait for KPI cards, charts, and featured property data to load.
3. Review the displayed values. | The statistics page shows portfolio KPIs, chart data, and featured property analytics or a valid fallback state. |  |  |  |
| TC-041 | Landlord | Statistics (/landlord/statistics) | Switch between simplified and detailed analytics views | The statistics page is loaded. | 1. Open /landlord/statistics.
2. Toggle simplified and detailed mode.
3. Expand or collapse additional KPI sections if available. | The page updates KPI labels and presentation mode without losing the loaded statistics context. |  |  |  |
| TC-042 | Landlord | Statistics Exports (/landlord/statistics) | Export portfolio reports and log export history | The statistics page is accessible. | 1. Open /landlord/statistics.
2. Export a CSV or PDF report.
3. Review the export history after completion. | The system generates the requested report and records the export in the history list when tracking is available. |  |  |  |
| TC-043 | Landlord | Statistics AI Insights (/landlord/statistics) | Display AI-generated KPI insights or fallback insight text | The statistics page is loaded with KPI data. | 1. Open /landlord/statistics.
2. Wait for insight generation.
3. Review the insight source and content. | The system shows AI-generated insights when available and fallback insights when the AI service is unavailable. |  |  |  |
| TC-044 | Landlord | Messages (/landlord/messages) | Exchange messages with a tenant in real time | An authorized landlord-tenant conversation exists or can be created. | 1. Open /landlord/messages.
2. Open a conversation thread.
3. Send a valid text or file-based message. | The message is delivered to the thread, stored in conversation history, and reflected in the current chat view. |  |  |  |
| TC-045 | Landlord | Community Hub (/landlord/community) | Moderate community content as an authorized landlord | The landlord belongs to a property community and moderation-capable content exists. | 1. Open /landlord/community.
2. Review a resident post or reported content.
3. Approve, reject, save, or report the content as allowed. | The moderation action updates the post state correctly and the community feed reflects the change. |  |  |  |
| TC-046 | Tenant | Authentication (/login) | Log in with valid tenant credentials | A tenant account exists and is active. | 1. Open /login.
2. Enter valid tenant email and password.
3. Click Log In. | The tenant is authenticated and routed to onboarding or the tenant portal according to account state. |  |  |  |
| TC-047 | Tenant | Authentication (/login) | Reject invalid tenant credentials | The login page is available. | 1. Open /login.
2. Enter invalid tenant credentials.
3. Click Log In. | The system denies access and shows an error without opening tenant-only pages. |  |  |  |
| TC-048 | Tenant | Onboarding (/tenant/onboarding) | Complete the tenant profile onboarding step | Guided onboarding is enabled for the tenant account. | 1. Open /tenant/onboarding.
2. Enter full name and phone number.
3. Save and continue. | The profile step is marked complete and the onboarding flow advances to the next required step. |  |  |  |
| TC-049 | Tenant | Onboarding (/tenant/onboarding) | Resume onboarding from the next incomplete step after refresh | At least one onboarding step has already been completed. | 1. Complete the first onboarding step.
2. Refresh /tenant/onboarding.
3. Review the step currently shown. | The onboarding flow resumes at the next incomplete step instead of restarting from the beginning. |  |  |  |
| TC-050 | Tenant | Onboarding (/tenant/onboarding) | Finish onboarding and redirect to the tenant portal | The tenant is on the final onboarding steps. | 1. Complete lease acknowledgement.
2. Confirm payment readiness and support guidance.
3. Finalize onboarding. | The onboarding status becomes complete and the tenant is redirected to the allowed tenant destination. |  |  |  |
| TC-051 | Tenant | Onboarding (/tenant/onboarding) | Prevent incomplete onboarding step submission | The onboarding profile step is open. | 1. Leave required onboarding fields blank.
2. Attempt to continue.
3. Review validation feedback. | The system blocks the submission and prompts the tenant to provide the required information. |  |  |  |
| TC-052 | Tenant | Product Tour (/tenant/tour) | Start or resume the tenant product tour | The tenant can access the product tour shell. | 1. Open /tenant/tour.
2. Click Start Tour or Resume Tour.
3. Follow the first guided step. | The tour starts or resumes successfully and navigates the tenant into the guided tour flow. |  |  |  |
| TC-053 | Tenant | Product Tour (/tenant/tour) | Skip the product tour for now | The product tour page is accessible. | 1. Open /tenant/tour.
2. Click Skip for Now.
3. Review the confirmation state. | The system records the skip action and shows the appropriate skipped-tour status. |  |  |  |
| TC-054 | Tenant | Product Tour (/tenant/tour) | Complete the tenant product tour and expose replay | The product tour can be started from the beginning. | 1. Start the product tour.
2. Progress through each guided step until finish.
3. Return to /tenant/tour. | The tour is marked completed and the tenant can replay it from the tour shell. |  |  |  |
| TC-055 | Tenant | Dashboard (/tenant/dashboard) | Load tenant dashboard lease, billing, and activity widgets | The tenant has an account with accessible dashboard data. | 1. Open /tenant/dashboard.
2. Wait for dashboard sections to load.
3. Review lease, next payment, utilities, and activity widgets. | The dashboard displays the tenant's current lease, payment summary, and recent activity in the correct sections. |  |  |  |
| TC-056 | Tenant | Dashboard Quick Actions (/tenant/dashboard) | Open tenant quick actions from the dashboard | The tenant dashboard is loaded. | 1. Open /tenant/dashboard.
2. Use dashboard actions to open lease, messages, or payments.
3. Review the destination page. | Each quick action opens the correct tenant module without breaking session context. |  |  |  |
| TC-057 | Tenant | Lease Overview (/tenant/lease) | View lease details, terms, and timeline | A lease record exists for the tenant. | 1. Open /tenant/lease.
2. Review the contract details and timeline.
3. Inspect lease dates, remaining days, and renewal information. | The lease page displays accurate tenant lease details, timeline progress, and renewal eligibility state. |  |  |  |
| TC-058 | Tenant | Lease Overview (/tenant/lease) | Show a valid unavailable state when no lease exists | The tenant account has no accessible lease record. | 1. Open /tenant/lease.
2. Wait for the page response.
3. Review the rendered state. | The system shows an empty or unavailable lease state instead of broken content. |  |  |  |
| TC-059 | Tenant | Document Vault (/tenant/lease) | Open an authorized document from the document vault | The tenant has lease-related documents in the vault. | 1. Open /tenant/lease.
2. Locate a document in the document vault.
3. Open or download the document. | The selected authorized document is retrievable by the tenant. |  |  |  |
| TC-060 | Tenant | Document Vault Access Control | Block unauthorized or missing document access | A requested document is missing or not authorized for the tenant. | 1. Attempt to open a missing or unauthorized document reference.
2. Wait for the system response.
3. Review the error handling. | The system blocks access and returns an error or fallback message without exposing restricted files. |  |  |  |
| TC-061 | Tenant | Lease Signing (/tenant/sign-lease/[leaseId]) | Complete the tenant signature step of lease signing | A pending lease signing workflow is available to the tenant. | 1. Open the tenant lease signing route.
2. Review the lease terms.
3. Submit a valid tenant signature. | The tenant signature is recorded and the lease advances to the next valid signing state. |  |  |  |
| TC-062 | Tenant | Lease Signing Validation (/tenant/sign-lease/[leaseId]) | Block access with an invalid or expired signing link | An invalid, unauthorized, or expired signing link is available for testing. | 1. Open the invalid or expired signing link.
2. Wait for the page response.
3. Review the access handling. | The system denies access to the signing page and shows an appropriate error state. |  |  |  |
| TC-063 | Tenant | Lease Progress (/tenant/lease) | Track lease status progress and remaining days | A lease workflow record exists for the tenant. | 1. Open /tenant/lease.
2. Review the progress bar and date markers.
3. Compare the status, start date, end date, and remaining days. | The system shows the current lease phase, relevant dates, and remaining days accurately. |  |  |  |
| TC-064 | Tenant | Payments (/tenant/payments) | View outstanding charges, statuses, and payment history | Payment or billing records exist for the tenant. | 1. Open /tenant/payments.
2. Review current charges and statuses.
3. Review payment history entries. | The payments page shows balances, statuses, and transaction history associated with the tenant lease. |  |  |  |
| TC-065 | Tenant | Payments (/tenant/payments) | Show a valid empty or fallback state when payment data is unavailable | Payment data is unavailable or no billing records exist. | 1. Open /tenant/payments.
2. Wait for the page to handle the missing records.
3. Review the rendered state. | The page shows a clear empty or fallback state without exposing incorrect payment information. |  |  |  |
| TC-066 | Tenant | Maintenance Requests | Create a maintenance request with valid details and image | The tenant is linked to a property or unit and can open the maintenance form. | 1. Open the maintenance request form.
2. Enter an issue description and attach a valid image.
3. Submit the request. | The system stores the maintenance request and makes it available for landlord review. |  |  |  |
| TC-067 | Tenant | Maintenance Requests | Validate required maintenance request details | The maintenance request form is available. | 1. Leave required issue details blank.
2. Attempt to submit the request.
3. Review validation feedback. | The system blocks submission and shows the missing maintenance request requirements. |  |  |  |
| TC-068 | Tenant | Maintenance Requests | Reject an invalid maintenance attachment | The maintenance request form is open. | 1. Attach an unsupported or invalid file.
2. Attempt to submit or upload it.
3. Review the response. | The system prevents the invalid attachment from being accepted. |  |  |  |
| TC-069 | Tenant | Maintenance Tracking | Review maintenance request history and status updates | At least one maintenance request exists for the tenant. | 1. Open the maintenance request history area.
2. Review one or more existing requests.
3. Compare the displayed statuses and details. | The tenant can track the current and historical status of submitted maintenance requests. |  |  |  |
| TC-070 | Tenant | Messages (/tenant/messages) | Open an authorized landlord conversation | A landlord-tenant conversation exists or can be loaded for the tenant. | 1. Open /tenant/messages.
2. Select a conversation from the sidebar.
3. Review the chat thread. | The selected conversation loads the correct message history for the tenant. |  |  |  |
| TC-071 | Tenant | Messages (/tenant/messages) | Send a valid text message to the landlord | An authorized conversation is open. | 1. Open /tenant/messages.
2. Type a valid text message.
3. Send the message. | The message is delivered to the conversation thread and appears in the message history. |  |  |  |
| TC-072 | Tenant | Messages (/tenant/messages) | Send a valid file or media message | The tenant has access to file or media messaging in an authorized thread. | 1. Open /tenant/messages.
2. Attach a valid file or image.
3. Send the message. | The attached file or media is accepted and shown in the conversation thread. |  |  |  |
| TC-073 | Tenant | Message Moderation (/tenant/messages) | Block unsafe or prohibited message content | An authorized conversation is open. | 1. Open /tenant/messages.
2. Compose a message containing unsafe or prohibited content.
3. Attempt to send it. | The system blocks the unsafe message and informs the tenant that it was not delivered. |  |  |  |
| TC-074 | Tenant | Message Status (/tenant/messages) | Display conversation metadata such as timestamps and read state | At least one message exists in the conversation. | 1. Open /tenant/messages.
2. Review message timestamps and chat state indicators.
3. Observe metadata updates after interaction. | The conversation shows message timing and available delivery or read state metadata for the thread. |  |  |  |
| TC-075 | Tenant | Community Hub (/tenant/community) | Load the tenant community feed | The tenant belongs to a valid property community. | 1. Open /tenant/community.
2. Wait for the feed to load.
3. Review available posts and tabs. | The community feed loads posts for the tenant's property or shows a valid empty state. |  |  |  |
| TC-076 | Tenant | Community Hub (/tenant/community) | Create a discussion post in the community hub | The tenant can create a post in the community module. | 1. Open /tenant/community.
2. Start a new discussion post.
3. Enter valid content and submit. | The system accepts the post according to role permissions and updates the community feed or moderation state. |  |  |  |
| TC-077 | Tenant | Community Hub (/tenant/community) | Create a media-rich community post | The tenant can attach supported media in the community module. | 1. Open /tenant/community.
2. Start a post with images or other supported media.
3. Submit the post. | The community post is stored with its media attachments and rendered correctly in the feed or queue. |  |  |  |
| TC-078 | Tenant | Community Hub (/tenant/community) | React to, comment on, and save a community post | At least one community post exists in the feed. | 1. Open /tenant/community.
2. React to a post.
3. Add a comment and save the same post. | The reaction, comment, and saved state update successfully on the selected post. |  |  |  |
| TC-079 | Tenant | Community Reporting (/tenant/community) | Report a community post with a reason | At least one reportable post exists in the community feed. | 1. Open /tenant/community.
2. Choose Report on a post.
3. Enter a report reason and submit. | The system accepts the report and records the post for moderation review. |  |  |  |
| TC-080 | Tenant | Unit Map (/tenant/unit-map) | Open the read-only tenant unit map | A mapped property layout exists for the tenant's property. | 1. Open /tenant/unit-map.
2. Wait for the layout to render.
3. Review the displayed unit map. | The tenant can view the building layout in read-only mode. |  |  |  |
| TC-081 | Tenant | Unit Transfer Requests (/tenant/unit-map) | Submit a unit transfer request for an eligible vacant unit | The tenant has an active lease and an eligible vacant unit is available. | 1. Open /tenant/unit-map.
2. Select a vacant unit.
3. Enter a transfer reason and submit the request. | The system creates the transfer request and marks it pending for landlord review. |  |  |  |
| TC-082 | Tenant | Unit Transfer Requests (/tenant/unit-map) | Prevent duplicate pending unit transfer requests | The tenant already has a pending transfer request for the property. | 1. Open /tenant/unit-map.
2. Attempt to submit another transfer request.
3. Review the response. | The system blocks the duplicate request and informs the tenant that a pending transfer request already exists. |  |  |  |
| TC-083 | Tenant | Move-Out Request (/tenant/lease or dashboard component) | Start a move-out request and detect unsettled balances | The tenant can open the move-out request flow. | 1. Trigger Request Move-Out.
2. Wait for the clearance scan to complete.
3. Review the result. | The system scans ledger balances and shows a blocked clearance state when unsettled balances are found. |  |  |  |
| TC-084 | Tenant | iRis AI Assistant | Ask iRis a contextual tenant support question | The tenant is logged in and the iRis assistant is available. | 1. Open the iRis assistant from the dashboard or messages tray.
2. Ask a valid question about lease, amenities, rules, or support.
3. Wait for the reply. | The system returns a contextual assistant response based on the tenant's available system data. |  |  |  |
| TC-085 | Tenant | iRis AI Assistant Fallback | Show a fallback response when the AI service is unavailable | The tenant can access the iRis assistant and the AI request can be forced to fail or time out. | 1. Open the iRis assistant.
2. Submit a question while the AI service is unavailable.
3. Review the returned response. | The system displays a fallback assistance message instead of leaving the tenant without a reply. |  |  |  |
| TC-086 | SuperAdmin | Authentication (/login) | Log in with valid super administrator credentials | A super administrator account exists and is active. | 1. Open /login.
2. Enter valid administrator credentials.
3. Click Log In. | The system authenticates the administrator and routes the user to the admin portal. |  |  |  |
| TC-087 | SuperAdmin | Authentication (/login) | Reject invalid super administrator credentials | The login page is accessible. | 1. Open /login.
2. Enter invalid administrator credentials.
3. Click Log In. | The system denies access and does not open admin-only routes. |  |  |  |
| TC-088 | SuperAdmin | Admin Dashboard (/admin/dashboard) | Load platform metrics on the admin dashboard | The administrator is logged in and platform data is accessible. | 1. Open /admin/dashboard.
2. Wait for the statistics cards to load.
3. Review user, property, and lease metrics. | The admin dashboard shows platform-wide metrics and quick actions for governance tasks. |  |  |  |
| TC-089 | SuperAdmin | Admin Dashboard (/admin/dashboard) | Show a valid fallback state when admin metrics cannot be retrieved | The admin dashboard is accessible but metrics are unavailable. | 1. Open /admin/dashboard.
2. Simulate or observe a failed metrics fetch.
3. Review the rendered state. | The dashboard remains usable and shows a loading, zero-value, or fallback state instead of crashing. |  |  |  |
| TC-090 | SuperAdmin | Admin RBAC (/admin/*) | Restrict admin routes to authorized administrators only | Admin routes exist and non-admin accounts are available for testing. | 1. Attempt to open an admin route while logged out.
2. Attempt again as a landlord or tenant.
3. Attempt again as an admin. | Only the administrator can access admin routes, while others are denied or redirected. |  |  |  |
| TC-091 | SuperAdmin | Users (/admin/users) | Load the platform user list with role counts | User records exist in the platform. | 1. Open /admin/users.
2. Wait for the user list and counts to load.
3. Review the displayed totals and rows. | The page shows registered users and the role-based counts needed for governance review. |  |  |  |
| TC-092 | SuperAdmin | Users (/admin/users) | Search platform users by name or email | Multiple user accounts exist in the platform. | 1. Open /admin/users.
2. Enter a name or email in the search input.
3. Review the filtered list. | Only users matching the name or email query remain in the result set. |  |  |  |
| TC-093 | SuperAdmin | Users (/admin/users) | Filter users by role pill | Users exist across multiple roles. | 1. Open /admin/users.
2. Click the Tenant, Landlord, Admin, and All pills.
3. Review the user rows after each selection. | The user list updates correctly for each role filter and the counts remain consistent with the selected pill. |  |  |  |
| TC-094 | SuperAdmin | Users (/admin/users) | Show an empty state when no user search results match | The admin user page is accessible. | 1. Open /admin/users.
2. Enter a search term that matches no user.
3. Review the page response. | The page shows a no-results state and prompts the admin to adjust filters or search terms. |  |  |  |
| TC-095 | SuperAdmin | Landlord Registrations Review | Load pending landlord registrations for review | Pending landlord registration submissions exist in the system. | 1. Open the landlord registration review module.
2. Wait for the registration list to load.
3. Review the pending submissions. | The system displays submitted landlord registrations that are available for administrator review. |  |  |  |
| TC-096 | SuperAdmin | Landlord Registrations Review | Open a landlord registration and inspect its submitted details | At least one landlord registration submission exists. | 1. Open the landlord registration review list.
2. Select a submission.
3. Review the form data, notes, and supporting files. | The administrator can inspect the selected registration details and supporting documents for decision-making. |  |  |  |
| TC-097 | SuperAdmin | Landlord Registrations Review | Approve a landlord registration with internal notes | A pending landlord registration is available for approval. | 1. Open a pending registration.
2. Enter an internal note if required.
3. Approve the submission. | The registration status updates to approved and the decision is saved in the review history. |  |  |  |
| TC-098 | SuperAdmin | Landlord Registrations Review | Reject or return a landlord registration for clarification | A pending registration is available for review. | 1. Open a landlord registration.
2. Enter rejection or clarification notes.
3. Reject or return the submission. | The system records the decision and updates the registration to the correct non-approved status. |  |  |  |
| TC-099 | SuperAdmin | Governance / User Management | Prevent invalid governance or user management updates | A governance or user update action is available to the administrator. | 1. Open a governance or user management action.
2. Enter invalid or unauthorized update data.
3. Attempt to save the change. | The system blocks the invalid update and preserves current records until valid data is submitted. |  |  |  |
| TC-100 | SuperAdmin | Admin Sign-out | Sign out securely from the admin portal | The administrator is currently logged in. | 1. Open the admin portal.
2. Use the sign-out action.
3. Attempt to revisit a protected admin page. | The session ends successfully and protected admin routes require authentication again. |  |  |  |
## Sheet: Summary
| Stakeholder | Count |
| --- | --- |
| Landlord | 45 |
| Tenant | 40 |
| SuperAdmin | 15 |
| Source Basis |  |
| docs/latest-documentations after major refactor/functional-requirements.md |  |
| docs/latest-documentations after major refactor/ireside_system_overview.md |  |
| docs/latest-documentations after major refactor/output-use-case-scenarios-3.5.5.md |  |