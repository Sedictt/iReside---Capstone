# 3.5.5 Use Case Scenario

The following use case scenarios were derived from the approved iReside use case diagram and aligned with the current functional requirements of the system.

## Primary Use Cases

### Use Case Scenario 1

| Field | Details |
|---|---|
| No. | 1 |
| Use Case Name | Sign In and Access Role Portal |
| Summary | The user signs in to the iReside system and is redirected to the appropriate portal based on the assigned role. |
| Actors | Super Administrator, Landlord, Tenant |
| Precondition | 1. The user must have a registered account.<br>2. The user must have valid login credentials.<br>3. The system must be available. |
| Main Sequence | 1. The user enters the registered credentials.<br>2. The system validates the submitted credentials.<br>3. The system identifies the role of the user.<br>4. The system creates a session for the authenticated user.<br>5. The system redirects the user to the correct role-specific portal. |
| Alternate Sequence | 1. If the credentials are invalid, the system displays an error message.<br>2. If the account is unauthorized or inactive, the system denies access. |
| Non-Functional Requirements | 1. Authentication should complete within 3 seconds under normal conditions.<br>2. Login credentials must be securely processed and protected.<br>3. Role-based access control must be enforced. |
| Post-Condition | The authenticated user gains access to the correct portal and an active session is established. |

### Use Case Scenario 2

| Field | Details |
|---|---|
| No. | 2 |
| Use Case Name | Monitor Platform Metrics |
| Summary | The Super Administrator views platform-wide metrics to monitor system activity and operational status. |
| Actors | Super Administrator |
| Precondition | 1. The Super Administrator must be logged in.<br>2. Platform metrics data must be available. |
| Main Sequence | 1. The Super Administrator opens the administrative dashboard.<br>2. The system retrieves platform-wide statistics.<br>3. The system displays metrics such as user counts, activity summaries, and system indicators.<br>4. The Super Administrator reviews the displayed information. |
| Alternate Sequence | 1. If metrics cannot be retrieved, the system displays an error or fallback state.<br>2. If there is no available data, the system displays an empty metrics view. |
| Non-Functional Requirements | 1. Dashboard data should load within 3 seconds.<br>2. Metrics should be presented in a clear and readable format.<br>3. Access must be restricted to authorized administrators only. |
| Post-Condition | The Super Administrator is informed of the current platform performance and status. |

### Use Case Scenario 3

| Field | Details |
|---|---|
| No. | 3 |
| Use Case Name | Review Landlord Registrations |
| Summary | The Super Administrator reviews landlord registration submissions and decides whether to approve, reject, or return them for clarification. |
| Actors | Super Administrator |
| Precondition | 1. The Super Administrator must be logged in.<br>2. Pending landlord registration records must exist. |
| Main Sequence | 1. The Super Administrator opens the landlord registration review page.<br>2. The system displays the list of submitted registrations.<br>3. The Super Administrator selects a registration to review.<br>4. The system displays the submitted details and supporting information.<br>5. The Super Administrator records a decision.<br>6. The system saves the decision and updates the registration status. |
| Alternate Sequence | 1. If the submitted information is incomplete, the system allows the registration to be returned for clarification.<br>2. If the record cannot be opened, the system shows an error message. |
| Non-Functional Requirements | 1. All decisions must be logged for audit purposes.<br>2. Submitted records must be securely stored and viewed only by authorized users.<br>3. Status updates should be reflected immediately after saving. |
| Post-Condition | The landlord registration status is updated and the decision is recorded in the system. |

### Use Case Scenario 4

| Field | Details |
|---|---|
| No. | 4 |
| Use Case Name | Manage Users and Governance |
| Summary | The Super Administrator manages user accounts, access levels, and governance-related controls within the platform. |
| Actors | Super Administrator |
| Precondition | 1. The Super Administrator must be logged in.<br>2. The target user account or governance setting must exist. |
| Main Sequence | 1. The Super Administrator opens the user and governance management module.<br>2. The system displays the list of users and available controls.<br>3. The Super Administrator selects a user account or governance setting.<br>4. The Super Administrator updates the necessary information or permissions.<br>5. The system validates and saves the changes.<br>6. The system records the action in the audit trail. |
| Alternate Sequence | 1. If the entered data is invalid, the system prevents saving and displays validation errors.<br>2. If the requested action is not permitted, the system denies the update. |
| Non-Functional Requirements | 1. Administrative actions must be auditable.<br>2. Access must be protected by role-based restrictions.<br>3. The management interface should remain responsive during updates. |
| Post-Condition | User records or governance settings are updated and logged successfully. |

### Use Case Scenario 5

| Field | Details |
|---|---|
| No. | 5 |
| Use Case Name | Manage Properties and Units |
| Summary | The landlord creates, updates, and maintains property and unit records in the system. |
| Actors | Landlord |
| Precondition | 1. The landlord must be logged in.<br>2. The landlord must have access to the property management module. |
| Main Sequence | 1. The landlord opens the property and unit management module.<br>2. The landlord creates a new property or selects an existing one.<br>3. The landlord enters or updates property and unit details.<br>4. The system validates the entered data.<br>5. The system saves the property and unit records.<br>6. The system updates unit availability and related records. |
| Alternate Sequence | 1. If required fields are missing, the system highlights the incomplete entries.<br>2. If invalid data is submitted, the system rejects the save request. |
| Non-Functional Requirements | 1. Form validation should occur reliably before saving.<br>2. Saved records should be persisted without data loss.<br>3. The interface should be responsive on desktop and mobile devices. |
| Post-Condition | The property and unit information is successfully stored or updated in the system. |

### Use Case Scenario 6

| Field | Details |
|---|---|
| No. | 6 |
| Use Case Name | Upload Unit Media |
| Summary | The landlord uploads photos or other media files associated with a property unit. |
| Actors | Landlord |
| Precondition | 1. The landlord must be logged in.<br>2. A property unit record must already exist.<br>3. The media file must follow supported upload formats and limits. |
| Main Sequence | 1. The landlord opens the media management section of a unit.<br>2. The landlord selects one or more media files.<br>3. The system validates the file type and size.<br>4. The system uploads and stores the media file.<br>5. The system attaches the uploaded media to the selected unit.<br>6. The system displays the uploaded media preview. |
| Alternate Sequence | 1. If the file type is unsupported, the system rejects the upload.<br>2. If the file exceeds the allowed size, the system displays an upload error. |
| Non-Functional Requirements | 1. Media uploads should be stored securely.<br>2. Upload feedback should be clear and immediate.<br>3. Supported files should be optimized for fast retrieval. |
| Post-Condition | The selected media is uploaded and linked to the unit record. |

### Use Case Scenario 7

| Field | Details |
|---|---|
| No. | 7 |
| Use Case Name | Record Walk-in Applications |
| Summary | The landlord records a walk-in tenant application and stores the applicant details in the system. |
| Actors | Landlord |
| Precondition | 1. The landlord must be logged in.<br>2. A target property unit must exist.<br>3. The unit must be available for application processing. |
| Main Sequence | 1. The landlord opens the walk-in application form.<br>2. The landlord selects the property unit for the applicant.<br>3. The landlord enters the applicant's personal and application details.<br>4. The landlord uploads or records the required supporting documents.<br>5. The landlord saves the application as pending or approved.<br>6. The system stores the application and updates its status. |
| Alternate Sequence | 1. If required applicant information is missing, the system prevents submission.<br>2. If the selected unit is unavailable, the system displays an availability warning. |
| Non-Functional Requirements | 1. Application records must be stored accurately.<br>2. Uploaded documents must be securely handled.<br>3. Status updates should be reflected immediately after saving. |
| Post-Condition | A walk-in application record is created and saved in the system. |

### Use Case Scenario 8

| Field | Details |
|---|---|
| No. | 8 |
| Use Case Name | Finalize Lease and Onboard Tenant |
| Summary | The landlord finalizes an approved application into a lease and completes the onboarding of the tenant. |
| Actors | Landlord, Tenant |
| Precondition | 1. The landlord must be logged in.<br>2. An approved applicant record must exist.<br>3. The lease details must be complete and the unit must be available. |
| Main Sequence | 1. The landlord opens the lease finalization workflow.<br>2. The landlord reviews and confirms the lease details.<br>3. The system generates the lease record for the selected tenant and unit.<br>4. The system initiates the lease signing process.<br>5. After signing is completed, the system provisions or activates the tenant account.<br>6. The system updates the unit and lease status accordingly. |
| Alternate Sequence | 1. If required lease information is incomplete, the system prevents finalization.<br>2. If signing is not completed, the system keeps the lease in a pending status. |
| Non-Functional Requirements | 1. Lease creation must preserve data consistency.<br>2. The workflow must maintain an audit trail of onboarding actions.<br>3. Sensitive account information must be securely handled. |
| Post-Condition | The tenant is onboarded and the lease record is created or activated in the system. |

### Use Case Scenario 9

| Field | Details |
|---|---|
| No. | 9 |
| Use Case Name | View Financial Ledger |
| Summary | The landlord views the financial ledger to monitor billing records, balances, and related transactions. |
| Actors | Landlord |
| Precondition | 1. The landlord must be logged in.<br>2. Financial and billing records must exist in the system. |
| Main Sequence | 1. The landlord opens the financial ledger page.<br>2. The system retrieves the relevant billing and ledger data.<br>3. The system displays the recorded transactions, balances, and payment statuses.<br>4. The landlord reviews the displayed records. |
| Alternate Sequence | 1. If no ledger records are available, the system displays an empty state.<br>2. If billing data cannot be retrieved, the system displays an error or fallback message. |
| Non-Functional Requirements | 1. Financial values must be accurate and consistent.<br>2. Only authorized landlords should be able to access ledger data.<br>3. The page should load within 3 seconds under normal conditions. |
| Post-Condition | The landlord is able to review the current financial status and transaction history. |

### Use Case Scenario 10

| Field | Details |
|---|---|
| No. | 10 |
| Use Case Name | View Analytics and Generate Reports |
| Summary | The landlord views property analytics and generates reports for operational monitoring and decision-making. |
| Actors | Landlord |
| Precondition | 1. The landlord must be logged in.<br>2. Analytics data must be available for the selected property or portfolio. |
| Main Sequence | 1. The landlord opens the analytics and reports module.<br>2. The system retrieves KPI data such as income, occupancy, delinquency, and maintenance volume.<br>3. The system displays analytics visualizations and summaries.<br>4. The landlord selects a reporting option.<br>5. The system generates the requested report for download or viewing. |
| Alternate Sequence | 1. If analytics data is unavailable, the system displays an empty or error state.<br>2. If report generation fails, the system displays an error and preserves the current analytics view. |
| Non-Functional Requirements | 1. Charts and summaries should load promptly.<br>2. Reports must reflect accurate and up-to-date data.<br>3. Generated reports should be downloadable in a usable format. |
| Post-Condition | The landlord reviews analytics data and may obtain a generated report from the system. |

### Use Case Scenario 11

| Field | Details |
|---|---|
| No. | 11 |
| Use Case Name | Moderate Community Content |
| Summary | The authorized moderator reviews and acts on community content to maintain a safe and appropriate platform environment. |
| Actors | Super Administrator, Landlord |
| Precondition | 1. The authorized moderator must be logged in.<br>2. Community content or reported content must exist. |
| Main Sequence | 1. The moderator opens the community moderation module.<br>2. The system displays flagged or reported content.<br>3. The moderator reviews the content details.<br>4. The moderator decides to keep, remove, or take action on the content.<br>5. The system saves the moderation decision and updates the content status. |
| Alternate Sequence | 1. If the content record is no longer available, the system informs the moderator.<br>2. If no flagged content exists, the system displays an empty moderation queue. |
| Non-Functional Requirements | 1. Moderation actions must be logged for auditing.<br>2. Content updates should be reflected immediately.<br>3. Only authorized moderators should be able to perform moderation actions. |
| Post-Condition | Community content is updated based on the moderation decision and the action is recorded. |

### Use Case Scenario 12

| Field | Details |
|---|---|
| No. | 12 |
| Use Case Name | Approve Transfer or Move-Out Requests |
| Summary | The landlord reviews tenant requests for unit transfer or move-out and records a decision. |
| Actors | Landlord |
| Precondition | 1. The landlord must be logged in.<br>2. A transfer or move-out request must exist. |
| Main Sequence | 1. The landlord opens the transfer and move-out request module.<br>2. The system displays the submitted tenant requests.<br>3. The landlord selects a request to review.<br>4. The system displays the request details, lease information, and unit details.<br>5. The landlord approves or rejects the request.<br>6. The system saves the decision and updates the request status. |
| Alternate Sequence | 1. If the request lacks required details, the system keeps it pending and indicates the missing information.<br>2. If the request conflicts with lease policies, the system allows the landlord to reject it with a stated reason. |
| Non-Functional Requirements | 1. Request decisions must be stored accurately.<br>2. Status updates should be visible immediately.<br>3. Actions should be logged for traceability. |
| Post-Condition | The transfer or move-out request is updated with the landlord's decision. |

### Use Case Scenario 13

| Field | Details |
|---|---|
| No. | 13 |
| Use Case Name | View Lease and Documents |
| Summary | The tenant views lease details and associated documents through the system. |
| Actors | Tenant |
| Precondition | 1. The tenant must be logged in.<br>2. A lease record and related documents must exist for the tenant. |
| Main Sequence | 1. The tenant opens the lease and documents page.<br>2. The system retrieves the tenant's lease information.<br>3. The system displays the lease details and linked documents.<br>4. The tenant reviews the displayed information. |
| Alternate Sequence | 1. If no lease record exists, the system displays an empty or unavailable state.<br>2. If a document cannot be retrieved, the system displays an access error. |
| Non-Functional Requirements | 1. Document access must be secure and role-restricted.<br>2. Lease data should load within 3 seconds under normal conditions.<br>3. The interface should remain readable across screen sizes. |
| Post-Condition | The tenant has reviewed the lease details and related documents. |

### Use Case Scenario 14

| Field | Details |
|---|---|
| No. | 14 |
| Use Case Name | Complete Lease Signing |
| Summary | The landlord and tenant complete the digital lease signing process until the agreement becomes active. |
| Actors | Landlord, Tenant |
| Precondition | 1. A pending lease record must exist.<br>2. The authorized signer must have access to the signing workflow.<br>3. The required signing mode must already be selected. |
| Main Sequence | 1. The tenant or landlord opens the lease signing workflow.<br>2. The system displays the lease details for review.<br>3. The tenant completes the required signature step.<br>4. The system records and validates the tenant signature.<br>5. The landlord completes the required signature step.<br>6. The system records the landlord signature, stores the signed lease, and updates the lease status to active. |
| Alternate Sequence | 1. If the signing link is invalid or expired, the system denies access to the signing page.<br>2. If required signatures are missing, the system keeps the lease in a pending status.<br>3. If signature validation fails, the system displays an error and requests resubmission. |
| Non-Functional Requirements | 1. Signature records must be securely stored.<br>2. The system must maintain a complete audit trail of signing events.<br>3. Lease status transitions must be consistent and reliable. |
| Post-Condition | The lease is digitally signed, stored, and updated to the appropriate status. |

### Use Case Scenario 15

| Field | Details |
|---|---|
| No. | 15 |
| Use Case Name | Track Lease Status Progress |
| Summary | The tenant tracks the progress and current status of the lease workflow through the system. |
| Actors | Tenant |
| Precondition | 1. The tenant must be logged in.<br>2. A lease workflow record must exist. |
| Main Sequence | 1. The tenant opens the lease tracking page.<br>2. The system retrieves the lease status information.<br>3. The system displays the current phase, relevant dates, and remaining actions.<br>4. The tenant reviews the progress information. |
| Alternate Sequence | 1. If the lease record is unavailable, the system shows an unavailable state.<br>2. If the lease has not yet entered the tracked workflow, the system informs the tenant accordingly. |
| Non-Functional Requirements | 1. Status information must be accurate and current.<br>2. The tracking page should be responsive across devices.<br>3. Data retrieval should be fast and reliable. |
| Post-Condition | The tenant understands the current progress and status of the lease workflow. |

### Use Case Scenario 16

| Field | Details |
|---|---|
| No. | 16 |
| Use Case Name | View Payments and History |
| Summary | The tenant views outstanding charges, payment statuses, and payment history in the system. |
| Actors | Tenant |
| Precondition | 1. The tenant must be logged in.<br>2. Payment or billing records must exist in the system. |
| Main Sequence | 1. The tenant opens the payments page.<br>2. The system retrieves the tenant's billing and payment records.<br>3. The system displays charges, balances, statuses, and transaction history.<br>4. The tenant reviews the payment information. |
| Alternate Sequence | 1. If payment records are unavailable, the system displays an empty or fallback state.<br>2. If a billing record cannot be loaded, the system displays an error message. |
| Non-Functional Requirements | 1. Financial information must be accurate and consistent.<br>2. Access to payment records must be secure and role-restricted.<br>3. The payments page should load within 3 seconds under normal conditions. |
| Post-Condition | The tenant is informed of the current payment obligations and transaction history. |

### Use Case Scenario 17

| Field | Details |
|---|---|
| No. | 17 |
| Use Case Name | Submit Maintenance Requests |
| Summary | The tenant submits a maintenance request and the system records it for landlord review and follow-up. |
| Actors | Tenant, Landlord |
| Precondition | 1. The tenant must be logged in.<br>2. The tenant must be associated with a property or unit.<br>3. The maintenance form must be available. |
| Main Sequence | 1. The tenant opens the maintenance request form.<br>2. The tenant enters the issue details and uploads supporting images if needed.<br>3. The tenant submits the maintenance request.<br>4. The system validates and stores the request.<br>5. The system notifies the landlord and displays the request in the maintenance dashboard. |
| Alternate Sequence | 1. If required details are missing, the system rejects the submission and shows validation errors.<br>2. If an uploaded file violates the allowed constraints, the system prevents the upload. |
| Non-Functional Requirements | 1. Submitted requests must be stored without data loss.<br>2. File attachments must be securely handled.<br>3. Request notifications should be delivered promptly. |
| Post-Condition | A maintenance request is recorded and made available for monitoring and action. |

### Use Case Scenario 18

| Field | Details |
|---|---|
| No. | 18 |
| Use Case Name | Exchange Messages |
| Summary | The landlord and tenant exchange messages in real time through the system. |
| Actors | Landlord, Tenant |
| Precondition | 1. The user must be logged in.<br>2. An authorized conversation or message channel must exist or be creatable. |
| Main Sequence | 1. The user opens a conversation thread.<br>2. The user composes a message.<br>3. The system checks the message content for unsafe or prohibited content.<br>4. If the message is valid, the system delivers the message to the recipient.<br>5. The system updates the message history and conversation state. |
| Alternate Sequence | 1. If unsafe content is detected, the system blocks the message and informs the sender.<br>2. If the message cannot be delivered, the system displays a delivery failure state. |
| Non-Functional Requirements | 1. Messages should be delivered in near real time.<br>2. Message history must be stored reliably.<br>3. Conversations must be protected from unauthorized access. |
| Post-Condition | The conversation thread is updated with the newly processed message. |

### Use Case Scenario 19

| Field | Details |
|---|---|
| No. | 19 |
| Use Case Name | Participate in Community Hub |
| Summary | The landlord or tenant participates in the community hub by viewing and interacting with community content. |
| Actors | Landlord, Tenant |
| Precondition | 1. The user must be logged in.<br>2. The user must belong to a valid property community. |
| Main Sequence | 1. The user opens the community hub.<br>2. The system displays available posts, updates, or interactions in the community feed.<br>3. The user views or creates community content.<br>4. The system stores the interaction and updates the feed accordingly. |
| Alternate Sequence | 1. If the submitted content violates community rules, the system blocks or flags the content.<br>2. If no content exists, the system displays an empty community feed. |
| Non-Functional Requirements | 1. Community interactions should load promptly.<br>2. Posted content must be stored consistently.<br>3. The feed should remain usable on desktop and mobile screens. |
| Post-Condition | The user's community interaction is reflected in the community hub. |

### Use Case Scenario 20

| Field | Details |
|---|---|
| No. | 20 |
| Use Case Name | Request Unit Transfer or Move-Out |
| Summary | The tenant submits a request to transfer to another unit or move out of the current unit. |
| Actors | Tenant |
| Precondition | 1. The tenant must be logged in.<br>2. The tenant must have an active lease or tenancy record. |
| Main Sequence | 1. The tenant opens the transfer or move-out request form.<br>2. The tenant selects the request type.<br>3. The tenant enters the required request details and reason.<br>4. The tenant submits the request.<br>5. The system stores the request and forwards it for landlord review. |
| Alternate Sequence | 1. If the request is incomplete, the system prevents submission and displays validation errors.<br>2. If the lease does not permit the request, the system informs the tenant accordingly. |
| Non-Functional Requirements | 1. Request data must be stored accurately.<br>2. Status tracking should remain available after submission.<br>3. Sensitive tenant information must be securely handled. |
| Post-Condition | A transfer or move-out request is created and marked for landlord review. |

### Use Case Scenario 21

| Field | Details |
|---|---|
| No. | 21 |
| Use Case Name | Access Document Vault |
| Summary | The tenant accesses and retrieves files stored in the document vault. |
| Actors | Tenant |
| Precondition | 1. The tenant must be logged in.<br>2. Authorized documents must exist in the tenant's document vault. |
| Main Sequence | 1. The tenant opens the document vault page.<br>2. The system retrieves the list of authorized documents.<br>3. The system displays the available files.<br>4. The tenant selects a document to view or download.<br>5. The system provides the selected file. |
| Alternate Sequence | 1. If the selected document is missing, the system displays an error message.<br>2. If the tenant attempts to access an unauthorized file, the system blocks the request. |
| Non-Functional Requirements | 1. Documents must be securely stored and retrieved.<br>2. Download actions must be restricted to authorized users only.<br>3. Retrieval should be fast enough for practical document access. |
| Post-Condition | The requested document is viewed or downloaded by the authorized tenant. |

### Use Case Scenario 22

| Field | Details |
|---|---|
| No. | 22 |
| Use Case Name | Ask iRis AI Assistant |
| Summary | The tenant asks a question in natural language and receives contextual assistance from the iRis AI Assistant. |
| Actors | Tenant, External AI Service |
| Precondition | 1. The tenant must be logged in.<br>2. The AI assistant module must be available.<br>3. Relevant system context must be accessible for response generation. |
| Main Sequence | 1. The tenant opens the iRis AI Assistant interface.<br>2. The tenant submits a question in natural language.<br>3. The system gathers relevant contextual information.<br>4. The system sends the request to the AI processing flow.<br>5. The system receives the generated response.<br>6. The system displays the answer to the tenant. |
| Alternate Sequence | 1. If the AI service is unavailable, the system provides a fallback response.<br>2. If the question cannot be processed, the system displays a failure message or guidance. |
| Non-Functional Requirements | 1. Responses should be returned within an acceptable wait time.<br>2. User data and contextual inputs must be handled securely.<br>3. The interface should remain usable while waiting for a response. |
| Post-Condition | The tenant receives an AI-generated or fallback response to the submitted question. |

## Supporting Use Cases

### Use Case Scenario 23

| Field | Details |
|---|---|
| No. | 23 |
| Use Case Name | Provide AI Fallback Response |
| Summary | The system provides an alternative response when the AI service cannot return a valid answer. |
| Actors | Tenant, External AI Service |
| Precondition | 1. The tenant must have submitted a question through the AI assistant.<br>2. The AI service must have failed, timed out, or returned no usable response. |
| Main Sequence | 1. The system detects that the AI service cannot provide a usable answer.<br>2. The system triggers the fallback response flow.<br>3. The system retrieves a predefined or rule-based fallback message.<br>4. The system displays the fallback response and guidance to the tenant. |
| Alternate Sequence | 1. If no specific fallback answer is available, the system displays a general assistance message.<br>2. If the failure persists, the system may advise the user to retry later. |
| Non-Functional Requirements | 1. Fallback behavior should activate reliably after AI failure detection.<br>2. The fallback message should be displayed without excessive delay.<br>3. Failure handling should preserve system stability. |
| Post-Condition | The tenant receives a fallback response instead of an empty or failed AI interaction. |

### Use Case Scenario 24

| Field | Details |
|---|---|
| No. | 24 |
| Use Case Name | Generate AI-Driven Insights |
| Summary | The system generates AI-based insights from analytics data to support landlord decision-making. |
| Actors | Landlord, External AI Service |
| Precondition | 1. The landlord must be logged in.<br>2. Analytics data must be available.<br>3. The AI service must be reachable for insight generation. |
| Main Sequence | 1. The landlord opens the analytics page.<br>2. The system gathers the relevant performance and operational data.<br>3. The system sends the prepared data to the AI service.<br>4. The AI service processes the data and returns insights or recommendations.<br>5. The system displays the generated insights to the landlord. |
| Alternate Sequence | 1. If the AI service is unavailable, the system provides standard analytics without AI-generated insights.<br>2. If the data is insufficient, the system displays a limited insight state. |
| Non-Functional Requirements | 1. Data sent for insight generation must be handled securely.<br>2. Insight generation should complete within an acceptable response time.<br>3. Returned insights should remain readable and relevant to the displayed analytics. |
| Post-Condition | The landlord receives AI-generated insights or a non-AI fallback analytics view. |

### Use Case Scenario 25

| Field | Details |
|---|---|
| No. | 25 |
| Use Case Name | Filter Unsafe Content |
| Summary | The system checks messages or community content for unsafe or prohibited content before the content is delivered or published. |
| Actors | Landlord, Tenant |
| Precondition | 1. The user must be logged in.<br>2. The user must submit a message or community content for processing. |
| Main Sequence | 1. The user submits a message or community content.<br>2. The system scans the submitted content for unsafe, prohibited, or spam material.<br>3. If the content is acceptable, the system allows the content to proceed to delivery or publication.<br>4. If the content is not acceptable, the system blocks the content and informs the user. |
| Alternate Sequence | 1. If content scanning is temporarily unavailable, the system may prevent submission until checking becomes available.<br>2. If the content is borderline or ambiguous, the system may hold it for moderation. |
| Non-Functional Requirements | 1. Content filtering should occur in near real time.<br>2. Content checks should be reliable enough to reduce harmful or spam content.<br>3. Filtering results must be handled securely and consistently. |
| Post-Condition | Only acceptable content proceeds to delivery or publication, while unsafe content is blocked or flagged. |
