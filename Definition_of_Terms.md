# 1.7 Definition of Terms

**2D Spatial Canvas** – The visual grid-based interface at the core of iReside's Landlord Command Center, enabling property managers to digitally map building layouts using a drag-and-drop structural engine with grid-snapping for precise unit alignment. It serves as the foundation for the Unit Map and Dynamic Status Overlays.

**AI-Driven Landlord Analytics** – A feature of the AI Utility that analyzes operational and financial metrics—Net Income, Occupancy Rate, Maintenance Volume, Lease Renewals, and Portfolio Value—using Groq-hosted Llama 3.1 8B to surface strategic recommendations for landlords in both simplified and detailed display modes.

**AI Maintenance Triage** – A feature of the AI Utility that analyzes text descriptions of unit damages (via the Smart Maintenance Reporting system) to automatically categorize the issue (e.g., Plumbing, Electrical), determine its severity, and suggest appropriate actions or estimated costs.

**Artificial Intelligence (AI) Utility / Supportive AI Utility** – A supportive component of the system that uses third-party APIs for natural language processing to assist landlords in operational tasks, such as triaging maintenance reports, categorizing urgency, and providing data-driven analytics on payment and tenant behavior trends.

**Community Hub** – A module within iReside that facilitates property-based engagement, allowing landlords to publish announcements, utility alerts, and pinned notices, while tenants can participate in community discussions, polls, and photo albums, all moderated through a landlord-controlled approval queue.

**DeLone & McLean (D&M) Information Systems Success Model** – The model used in the study to evaluate the overall success of the iReside system across dimensions such as System Quality, Information Quality, Service Quality, User Satisfaction, and Net Benefits.

**Digital Handbook** – A digitized repository of building rules, regulations, policies, and lease-related information accessible to tenants through the Seamless Living App, ensuring transparency and awareness of house guidelines.

**Digital Lease Signing** – The process within the Lease Management Module that allows landlords and tenants to execute lease agreements electronically through in-person or remote signing workflows, with dual-signature support and validated state transitions tracked through the Lease Status State Machine.

**Digital Twin** – The conceptual goal of the platform, which is to create a continuous, real-time digital representation of the physical rental property, specifically linking the status of real-world units (e.g., payment status) to their visual "blocks" on the virtual canvas.

**Dynamic Invoice Breakdowns** – A feature of the Payments and Billing Module that itemizes tenant invoices into base rent, water, and electricity charges, enabling granular financial tracking for both landlords and tenants.

**Dynamic Status Overlays** – A color-coded visualization system that updates the unit blocks on the Unit Map in real-time to provide instant situational awareness of a unit's status, such as Green (Vacant), Blue (Occupied/Paid), Yellow (Due Soon), Red (Overdue Payment), and Orange Pulse (Active Maintenance).

**Groq-hosted Llama 3.1 8B** – The large language model integrated via Groq's inference engine that powers iReside's AI features, including the iRis AI Assistant, Real-Time Message Moderation, and AI-Driven Landlord Analytics, through a RAG-based architecture.

**iReside** – The proposed Integrated Rental Management System, which is a dual-platform (Web and Mobile) ecosystem designed to streamline property operations and enhance transparency for landlords and tenants in Barangay Marulas, Valenzuela City.

**iRis AI Assistant** – Within the iReside ecosystem, iRis refers to the proprietary AI service powered by Retrieval-Augmented Generation (RAG). It functions as a dual-purpose support tool that provides tenants with immediate, fact-grounded answers regarding their lease terms and building rules, while simultaneously assisting landlords by automatically triaging and prioritizing maintenance requests based on the urgency and nature of the reported issue.

**Lease Status State Machine** – The validated workflow within the Lease Management Module that enforces strict lease status transitions: draft → pending_tenant_signature → pending_landlord_signature → active, ensuring leases proceed through all required approval steps.

**Managed-Access Portal** – The tenant-facing component of iReside, in which each tenant's access is restricted to their enrolled property and unit, ensuring a secure and professionally managed digital environment where participation is directly tied to active lease status.

**Multi-Tenant Data Isolation** – The architectural principle within iReside by which each property operates as a private, independent ecosystem, with database-level Row-Level Security (RLS) enforcing strict data separation between properties, landlords, and tenants.

**Progressive Web App (PWA)** – The mobile delivery mechanism of iReside, enabling the Seamless Living App to function as a mobile-optimized, installable application accessible through any modern web browser while maintaining full responsiveness and offline-like behavior.

**Real-Time Message Moderation** – A security feature powered by Groq Llama 3.1 8B that performs instant real-time filtering of toxic content, hate speech, and spam within landlord-tenant messaging channels and the Community Hub, blocking unsafe messages before delivery.

**Retrieval-Augmented Generation (RAG)** – An AI architecture that combines retrieved document context with large language model generation to produce accurate, fact-grounded responses. In iReside, RAG powers the iRis AI Assistant by retrieving relevant property management documentation and local ordinances from a pgvector-enabled knowledge base to answer tenant and landlord queries.

**Role-Based Access Control (RBAC)** – The security architecture within the iReside platform that differentiates permissions for Landlords, Tenants, and Administrators, ensuring each user accesses only information and actions scoped to their role and enrolled property.

**Row-Level Security (RLS)** – A database-level enforcement mechanism implemented through PostgreSQL that enforces strict data isolation between Admin, Landlord, and Tenant roles, ensuring no cross-role or cross-property data access is possible at the infrastructure layer.

**Seamless Living App** – The user-friendly mobile interface for tenants, providing them with a personal residency dashboard for transparent payment tracking, access to the Digital Handbook, and a direct channel for maintenance reporting.

**Situation Awareness (SA) Theory** – A theoretical framework, critical for the design of the Visual Command Center, that defines the user's ability to perceive, comprehend, and project the status of elements in their environment, which the system enhances through its Dynamic Status Overlays and predictive analytics.

**Smart Maintenance Reporting** – The tenant-facing system feature within the Seamless Living App that allows residents to submit maintenance issues by describing the problem in natural language, enabling the AI Maintenance Triage system to automatically categorize, assess severity, and prioritize the request.

**Supabase** – The Backend-as-a-Service infrastructure powering iReside, providing PostgreSQL-based database management, user authentication via Supabase Auth, and real-time capabilities through PostgreSQL replication, serving as the foundation for RLS-based multi-tenant data isolation.

**Task-Technology Fit (TTF) Theory** – A theoretical framework used in the study that argues an information system's success is maximized when its technological capabilities (e.g., the Unit Map) directly and effectively match the cognitive tasks of the user (e.g., managing physical space and monitoring occupancy).

**Tenant Ledger** – A real-time record available to tenants through the Seamless Living App that consolidates their financial responsibilities, including past payments, outstanding balances, and lease status, ensuring transparency.

**Unit Map** – An interactive, grid-based, drag-and-drop interface within the Visual Command Center that allows property managers to digitally map out building layouts by creating "blocks" representing individual units, organized by floor or wing. Tenants access a read-only version for building orientation and unit transfer requests.

**Unit Transfer Request** – A tenant-initiated workflow within the Unit Map that allows residents with an active lease to request a transfer to a vacant unit directly from the visual interface, subject to landlord review and approval.

**Visual Command Center** – The landlord-facing dashboard interface that consolidates real-time operational data, the Unit Map, and Dynamic Status Overlays into a single spatial view, enabling landlords to monitor property status, identify issues, and make informed decisions with minimal cognitive load.

**Walk-in Application** – The in-person tenant application process within the Applications and Tenant Onboarding Module, where landlords record walk-in applicant information, submitted documents, and checklist progress, with approved applications converted into tenant accounts linked to lease records.

**Zero-Latency Sync** – The technical requirement for instantaneous data flow between the physical and digital realities of the system, ensuring that a change in the tenant's status (like a payment being made) instantly and automatically updates the visual color-coding of the unit block for the landlord.