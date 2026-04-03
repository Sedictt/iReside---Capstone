# Future Considerations & Ideas

This document tracks ideas, feature requests, and architectural considerations that are currently outside the project's scope due to current project requirements, advisor mandates, or technical constraints. These may be revisited for future development phases or post-capstone commercialization.

---

## 1. Invite-Based Self-Service Tenant Registration

### Problem/Opportunity
Currently, ALL tenant accounts must be manually provisioned by the landlord through the walk-in application workflow. While this ensures total privacy and control, it places a high administrative burden on the landlord for data entry.

### Concept: "The Discord Model"
Instead of open public registration, landlords could generate a unique **Invite Link** or **Property Access Code** tied to a specific property.
- **Workflow:** Landlord shares link/code → Prospective tenant visits the link → Tenant self-registers and fills out their application details on their own device.
- **Why it's cool:** Reduces landlord data entry while maintaining the "private ecosystem" philosophy.
- **Constraint:** Needs to be validated against the advisor-mandated "private system" refactor to ensure it doesn't cross back into "public marketplace" territory.

---

## 2. Automated Legal Compliance & Batas Pambansa Blg. 25

### Concept
A system that automatically checks for compliance with Philippine rental laws (e.g., Rent Control Act).
- **Feature:** Warning landlords if annual rent increases exceed the allowed percentage.
- **Feature:** Automated generation of legally-sound eviction notices (notices to vacate) based on delinquency duration.
- **Constraint:** Requires legal consultation and constant monitoring of legislative updates.

---

## 3. Public Website With Vetted Landlord Application

### Problem/Opportunity
The platform currently has strong private-access boundaries, but the public-facing entry experience is still loosely defined. Without a clear decision, the website could drift toward an open-registration model that conflicts with the system's trust, governance, and admin-vetting philosophy.

### Concept
Expose a public informational website that explains iReside while keeping platform access controlled through landlord application review.
- **Public site role:** Present the product, explain how the system works, surface FAQs and documentation, and guide qualified users toward the correct next step.
- **Primary CTA:** `Apply as Landlord` for prospective landlords who want access to the platform.
- **Secondary CTA:** `Sign In` for users with existing approved accounts.
- **Registration model:** Open application, closed activation. Visitors may submit a landlord registration request, but landlord access is only granted after admin review and approval.
- **Public visibility:** Visitors may view marketing pages, onboarding explanations, and product documentation, but they cannot browse private property data, self-register as tenants, or enter operational portals without authorization.

### Why it fits
- Preserves the system's private-ecosystem model.
- Gives the Super Admin a clear governance responsibility through landlord vetting.
- Improves product clarity by separating public information from private operations.
- Supports trust-building without turning iReside into a public listings marketplace.

### Constraint
The public website must remain an informational and application-entry layer only. It should not evolve into open tenant registration, public property discovery, or immediate landlord activation without vetting, as those directions would conflict with the project's current scope and access model.
