# iReside Apartment Payment Algorithm

## Core Workflow

1. **Invoice Generation**: System auto-generates each tenant’s rent invoice before the due date.
2. **Initial Status**: System marks invoice as `Pending`.
3. **Reminders**: As due date approaches, IRIS sends a reminder in the tenant-landlord chat and a system notification.
4. **Call to Action**: Reminder includes a direct “Pay Now” button that opens the payment page.
5. **Method Selection**: Tenant chooses payment method.

### Flow A: GCash Payment
1. **Initiation**: If tenant selects GCash, tenant pays using landlord QR or number.
2. **Submission**: Tenant submits payment proof with: Reference number, clear screenshot, and optional note.
3. **Status Update**: System records payment as `Under Review`.
4. **Landlord Alert**: System alerts landlord through: System notification and IRIS chat message with action buttons.
5. **Review**: Landlord reviews proof and amount.
6. **Confirmation**: If valid and complete, landlord clicks Confirm Payment.
7. **Finalization**: System marks invoice as `Paid`.
8. **Receipting**: System issues official receipt.
9. **Delivery**: Receipt is delivered to tenant: In vault and in tenant-landlord chat.
10. **Ledger**: Billing ledger is automatically updated.

### Flow B: Face-to-Face Payment
1. **Initiation**: If tenant selects Face-to-Face, tenant first clicks Trigger In-Person Payment.
2. **Status Update**: System records status as `Awaiting In-Person`.
3. **Landlord Alert**: System alerts landlord with direct link to the exact transaction screen.
4. **Execution**: Tenant pays landlord in person.
5. **Confirmation**: Landlord opens the transaction and clicks Confirm Received.
6. **Finalization**: System marks invoice as `Paid`.
7. **Receipting**: System issues receipt to vault and chat.
8. **Ledger**: Billing ledger is automatically updated.

---

## Guardrails (Business Safety Rules)

*   **Standard Statuses (Digital)**: `Pending` -> `Reminder Sent` -> `Intent Submitted` -> `Under Review` -> `Confirmed/Rejected` -> `Receipted`
*   **Standard Statuses (In-Person)**: `Pending` -> `Reminder Sent` -> `Awaiting In-Person` -> `Confirmed/Rejected` -> `Receipted`
*   **Face-to-Face Expiry**: Face-to-face intent expires automatically after a set period (example: 3 days) if not confirmed.
*   **Expiry Action**: On expiry, system notifies both tenant and landlord and reverts invoice to `Pending`.
*   **Amount Handling Rules**: `Exact`, `Partial`, `Overpaid`, and `Short Paid` must be explicitly tagged.
*   **Non-Exact Actions**: Landlord must choose an action for non-exact payments: Accept as partial, request completion, or reject.
*   **GCash Mandatory Fields**: Submissions must include Reference number and proof image.
*   **Submission Blocking**: Submission is blocked if required fields are missing or unreadable.
*   **Rejection Flow**: Rejection flow must require a reason.
*   **Correction**: Tenant can resubmit corrected proof without creating a new invoice.
*   **Idempotency**: Every button action is idempotent: Repeated clicks do not duplicate payment confirmation or receipts.
*   **Audit Logging**: Every key action is audit logged: Who acted, what changed, when, and from where.
*   **Receipt Immutability**: Receipt must be immutable once issued: Unique receipt number, method, amount breakdown, and timestamp.
