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
