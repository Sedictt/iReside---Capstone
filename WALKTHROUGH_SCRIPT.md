# iReside — Feature Walkthrough Video Script

**Capstone Defense Presentation**
**Total Runtime: ~10 minutes**

---

# EPISODE 1: THE UNIT MAP

**Runtime: ~2:00**

## Narration

> The **Unit Map** is a modular floor planning tool that enables landlords to design and manage building layouts visually within the system.
>
> Landlords start with an empty canvas and use a grid-based drag-and-drop interface to place units, corridors, and room spaces. The grid snapping system—with a 20-pixel alignment grid—ensures structural consistency and precise positioning.
>
> Each placed unit is linked to the database, storing attributes such as unit number, floor level, bed and bath count, rental rate, and occupancy status. Changes are persisted in real time to Supabase and reflected immediately across the system.
>
> This addresses a common problem in property management: the disconnect between physical building layouts and administrative records. With the Unit Map, the visual representation always matches the current database state—there is no duplicated manual effort to maintain consistency.
>
> Landlords can configure multiple floors, view the complete building structure, and modify layouts as occupancy needs change over time.

## Suggested Visuals

- Unit Map interface showing the empty canvas and available drag-and-drop elements
- Placing a unit and configuring its properties (name, floor, beds, baths, rent)
- Demonstrating grid snapping behavior
- Completing a sample floor plan with multiple units
- Showing real-time save confirmation

## Transition

> With the building structure defined in the Unit Map, landlords can monitor overall property performance through the dashboard.

---

# EPISODE 2: THE LANDLORD DASHBOARD

**Runtime: ~2:00**

## Narration

> The **Landlord Dashboard** serves as the primary interface for monitoring property performance and managing daily operations.
>
> The dashboard displays key performance indicators at a glance: total earnings from rent collections, active tenant count, current occupancy rate, and the number of pending maintenance tickets requiring attention.
>
> Landlords can toggle between **Simplified Mode**, which presents essential metrics in a clean overview, and **Detailed Analytics**, which provides deeper insights into maintenance costs, upcoming lease renewals, and portfolio value trends.
>
> Each listed property shows its own performance summary, including occupancy rate and month-over-month growth data—enabling landlords to identify which units are performing well and which may need attention.
>
> The reporting module supports configurable date ranges: 7 days, 30 days, 90 days, or custom selection. Landlords can export reports as branded PDFs for stakeholder presentations or as CSV files for external auditing. A chronological history log tracks all exported reports for compliance and record-keeping purposes.
>
> All dashboard metrics are synchronized in real time with the database—no manual refresh required.

## Suggested Visuals

- Landlord dashboard showing KPI cards: earnings, active tenants, occupancy rate, pending maintenance
- Toggling between Simplified Mode and Detailed Analytics
- Selecting a date range and observing data update
- Generating a PDF report and previewing the branded output
- CSV export demonstration
- Report history log showing past exports

## Transition

> From the dashboard, landlords can also manage individual tenant interactions through the Tenant Portal.

---

# EPISODE 3: THE TENANT PORTAL

**Runtime: ~2:00**

## Narration

> The **Tenant Portal** provides residents with a centralized interface for managing all aspects of their tenancy.
>
> From the portal, tenants access their **active lease**, which contains essential information: monthly rent amount, payment due date, lease start and end dates, and a dynamically calculated renewal eligibility window indicating when the tenant becomes eligible to renew.
>
> The **Document Vault** stores all signed agreements and amendments, accessible on demand without requiring assistance from the landlord. This ensures tenants always have access to their contractual terms.
>
> **Maintenance Requests** are submitted through the portal with a description of the issue, priority level selection, and optional photo attachments. Tenants track the status of each ticket as it progresses through Pending, In Progress, and Completed stages—with notifications at each transition.
>
> The **Message Portal** provides direct communication with the landlord. Conversation threads include typing indicators and read receipts, creating an accountable communication channel with a complete message history.
>
> The portal is designed with a responsive interface, providing a consistent experience across both desktop and mobile devices.

## Suggested Visuals

- Tenant dashboard overview showing active lease summary
- Detailed lease view with renewal eligibility window
- Document Vault displaying a signed lease agreement
- Submitting a maintenance request with description and photo
- Tracking a maintenance ticket through its status timeline
- Messaging portal with a sample conversation showing read receipts

## Transition

> Let me now show you two supporting modules that create operational transparency for both landlords and tenants.

---

# EPISODE 4: MAINTENANCE SYSTEM & FINANCIAL LEDGER

**Runtime: ~2:00**

## Narration

> The system includes two integrated modules for operational transparency: the **Maintenance System** and the **Financial Ledger**.
>
> The Maintenance System establishes a structured workflow from request submission to resolution. Tenants describe the issue, select a priority level, and attach photos of the affected area. The request appears immediately in the landlord's maintenance dashboard.
>
> Landlords update ticket status as work progresses—Pending, In Progress, Completed—with each status change timestamped and visible to the tenant. Ticket details include the reporting tenant's unit, the full description, attached images, and a chronological history of all updates. This creates an accountable record for both parties.
>
> The **Financial Ledger** maintains an itemized record of all rental charges and payments per tenant. For each billing period, the ledger shows the base rent plus utility allocations for water and electricity as separate line items—not a single ambiguous total.
>
> Tenants view their current balance, due dates, and a complete payment history. Landlords see an overview of outstanding balances across all tenants, with overdue accounts flagged for attention.
>
> Both parties reference the same ledger record, reducing disputes caused by mismatched understandings of charges and payment status. The system serves as the authoritative financial record for each tenancy.

## Suggested Visuals

- Tenant submitting a maintenance request with priority selection and photo upload
- Landlord's maintenance dashboard showing tickets in Pending, In Progress, and Completed states
- Updating a ticket status and showing the tenant notification
- Completed ticket with resolution notes and timeline
- Financial Ledger showing itemized breakdown: base rent, water, electricity
- Tenant view of payment history and current balance
- Landlord view of tenant balances and overdue accounts

## Transition

> One more feature that sets iReside apart: an AI-powered assistant available to tenants around the clock.

---

# EPISODE 5: THE AI ASSISTANT (iRis)

**Runtime: ~2:00**

## Narration

> **iRis** is an AI-powered conversational assistant integrated into the tenant portal, providing immediate responses to tenant inquiries without requiring landlord intervention.
>
> The system is built on **Groq's Llama 3.1 model** with **Retrieval-Augmented Generation**—what this means practically is that when a tenant asks a question, iRis first retrieves relevant context specific to that tenant before generating a response.
>
> The retrieved context includes the tenant's unit details, lease terms, property amenities, and house rules. This ensures responses are based on actual system data rather than generic or inaccurate information.
>
> Tenants ask natural language questions such as: available building amenities, rent due dates and payment procedures, house rules regarding guests or quiet hours, how to submit maintenance requests, and lease provisions for renewals or termination.
>
> For landlords, iRis reduces the volume of routine inquiries, allowing them to focus on higher-priority property management tasks. For tenants, it provides round-the-clock support without waiting for office hours or landlord response time.
>
> The system operates at no cost using Groq's free API tier, making it a practical, sustainable solution for long-term deployment.
>
> A floating chat widget provides access to iRis from any page within the tenant portal, ensuring assistance is always available when needed.

## Suggested Visuals

- iRis chat interface accessible from the tenant portal
- Tenant asking about available amenities → response showing property-specific amenities
- Tenant asking about rent due date → response pulled directly from lease data
- Tenant asking about house rules → response based on lease agreement provisions
- The floating chat widget visible on a tenant dashboard page
- Demonstrating context retrieval by showing what data iRis pulls before answering

## Transition

> To conclude, let me summarize how iReside addresses the identified problems in residential property management.

---

# EPISODE 6: SYSTEM SUMMARY

**Runtime: ~1:00**

## Narration

> To summarize: iReside integrates five core functional modules addressing identified problems in residential property management.
>
> The **Unit Map** provides landlords with a visual floor planning tool connected directly to the database—eliminating the gap between physical layouts and administrative records.
>
> The **Landlord Dashboard** delivers real-time KPIs, configurable reporting, and portfolio-wide visibility into property performance.
>
> The **Tenant Portal** gives residents centralized access to their lease documents, maintenance workflows, and direct communication with landlords.
>
> The **Maintenance System and Financial Ledger** together create operational transparency—maintenance requests are tracked to resolution and financial records are itemized and shared.
>
> The **AI Assistant iRis** provides 24/7 tenant support using retrieval-augmented generation, pulling context from actual system data to deliver accurate, personalized responses.
>
> The system is built on Next.js 16 with React 19 and TypeScript, Supabase for PostgreSQL database management with real-time synchronization and Row Level Security, and Groq's Llama 3.1 for AI-powered assistance.
>
> iReside contributes to the field by providing a unified, role-appropriate platform that reduces administrative burden for landlords and improves access to information for tenants.

## Suggested Visuals

- Final system architecture overview
- Feature summary with icons or screenshots for each module
- Tech stack summary
- Closing title card with iReside branding and university attribution

---

# EPISODE TIMING BREAKDOWN

| Episode | Feature | Runtime |
|---------|---------|---------|
| 1 | The Unit Map | 2:00 |
| 2 | The Landlord Dashboard | 2:00 |
| 3 | The Tenant Portal | 2:00 |
| 4 | Maintenance System & Financial Ledger | 2:00 |
| 5 | The AI Assistant (iRis) | 2:00 |
| 6 | System Summary | 1:00 |
| | **Total** | **11:00** |

**Note:** Total runtime runs slightly over 10 minutes. To fit exactly 10 minutes:

- Shorten the System Summary to 45 seconds by removing the tech stack recap, OR
- Trim each episode by 15 seconds through slightly faster narration pacing

---

# PRODUCTION NOTES

## Narration Guidelines

- Steady, confident pace at approximately 130–150 words per minute
- Clear pronunciation of technical terms: "Supabase," "Row Level Security," "Retrieval-Augmented Generation"
- Neutral inflection appropriate for academic presentation—avoid sounding like a sales pitch
- 1–2 second pauses after each major point to let visuals settle
- Do not rush through feature descriptions—each episode deserves its full runtime

## Visual Matching

- Show only UI elements directly relevant to the narration
- Sync on-screen actions with spoken descriptions point by point
- Use clean cuts or subtle fades between segments—avoid distracting transitions
- Ensure all text on screen is legible at standard video resolution
- Use annotation overlays sparingly to highlight specific UI areas being discussed

## Pre-Recording Checklist

- [ ] Verify all demo accounts have realistic, contextual data loaded
- [ ] Set dashboard date ranges to display meaningful analytics figures
- [ ] Prepare floor plan with 4–5 configured units across multiple floors
- [ ] Stage maintenance tickets in each status: Pending, In Progress, Completed
- [ ] Confirm iRis has access to actual tenant, unit, lease, and property data for contextual responses
- [ ] Pre-generate PDF and CSV reports for the export demonstration
- [ ] Record in light mode for screen recording consistency
- [ ] Have mobile viewport ready to demonstrate responsive design

## What to Avoid

- Do not use marketing phrases such as "game-changing," "revolutionary," or "powerful"
- Do not make claims like "the only system that..."—stay factual and measurable
- Do not rush through episodes to save time—each feature deserves proper coverage
- Do not skip visual demonstrations—show the actual system in action, not just slides
- Do not use informal language—maintain academic presentation tone throughout

---

# END OF SCRIPT

*iReside Feature Walkthrough Script*
*Capstone Defense Presentation*
*Pamantasang ng Lungsod ng Valenzuela — College of Engineering and Information Technology*