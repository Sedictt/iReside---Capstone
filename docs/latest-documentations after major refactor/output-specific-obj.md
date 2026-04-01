1.2.2 Specific Objectives
1. To develop and evaluate iReside: A Modern Property and Tenant Management Platform with the following features for different user roles:
	a. Enable Super Administrators to manage:
		i. View key live metrics (Total Users, Properties, Leases, Pending Reviews).
		ii. Monitor Registration Pipeline progress (Pending, Reviewing, Approved).
		iii. Access the role-branded header with ambient glow branding.
		iv. Contextual navigation with item descriptions and chevrons.
		v. Manage user accounts using role-specific filter pills (All, Tenant, Landlord, Admin).
		vi. Display user avatars with initials-based fallback.
		vii. Combined Search + Filter for fast user lookup by name or email.
		viii. Access Registration Review dashboard with status filter tabs.
		ix. Open detailed Review Modals for applicant evaluation.
		x. Review applicant-uploaded documents and profile photos.
		xi. Add internal administrative notes to applications.
		xii. Update application status with icon-coded badges (Approved, Rejected, Reviewing).
		xiii. Execute destructive sign-out from the secure administrator sidebar.
	b. Enable Landlords to manage:
		i. View Dashboard performance via AI-driven KPI Insights.
		ii. Toggle between "Simplified Mode" and "Detailed Analytics" for dashboard reading.
		iii. Monitor Primary KPIs (Earnings, Active Tenants, Occupancy, Pending Issues).
		iv. Monitor Extended KPIs (Maintenance Cost, Lease Renewals, Portfolio Value).
		v. Analyze Featured Property data (Total Sales, Views, MOM Growth, Occupancy Rate).
		vi. Select preset report ranges (7D, 30D, 90D, 1Y).
		vii. Define custom start and end dates for performance filters.
		viii. View sync status and database connectivity indicators.
		ix. Generate iReside Branded PDF Reports for portfolio performance.
		x. Generate and download CSV Reports for data auditing.
		xi. Review chronological history of exported reports and audit logs.
		xii. Access the Modular Floor Planner drag-and-drop structural engine.
		xiii. Align structural units using a precise 20px grid-snapping system.
		xiv. Interactively manipulate and position corridors, units, and room spaces.
		xv. Save structural changes in real-time to the persistent Supabase backend.
		xvi. Specify advance rent requirements and security deposit amounts.
		xvii. Manage unit media with slots for Bedroom, Bathroom, Kitchen, and Living areas.
		xviii. Define custom room descriptions, amenities, and features.
		xix. Centralized Maintenance Dashboard for tracking all repair tickets.
		xx. Assign priority status to maintenance tasks (Pending, In-Progress, Completed).
		xxi. View multi-image galleries and descriptions in maintenance tickets.
		xxii. Monitor active lease progress via live dashboard tracking charts.
		xxiii. Access the Smart Document Vault for master agreements and reports.
		xxiv. Calculate and view renewal eligibility windows dynamically.
		xxv. Contact assigned tenants via direct messaging or one-click calling.
		xxvi. Monitor the Live Financial Ledger for overdue and pending invoices.
		xxvii. View dynamic payment breakdowns (Base Rent, Water, Electricity).
		xxviii. Create and track invoices for tenant billing.
		xxix. Record walk-in applications for prospective tenants with required documents and checklists.
		xxx. Save walk-in applications as pending or approved and update their status.
		xxxi. Finalize approved applications into lease records and provision tenant accounts with credentials.
		xxxii. Select lease signing mode (in-person dual signing or remote asynchronous signing).
		xxxiii. Enforce tenant-first signing order during the lease signing workflow.
		xxxiv. Generate secure JWT-based signing links with 30-day expiration for remote tenant signing.
		xxxv. Access a comprehensive audit trail for all signing events with timestamps, IP addresses, and user agents.
		xxxvi. Navigate to external management tools (Contract Templates, Property Policies, Amenities) with wizard state preserved.
		xxxvii. Manage community board posts including approval queues and moderation dashboards.
		xxxviii. Publish Management Notices and Utility Alerts for building-wide communication.
		xxxix. Filter and manage community content by specific property.
	c. Enable Tenants to:
		i. View lease details, terms, status, and progress from the tenant dashboard.
		ii. Access the read-only Unit Map for a visual representation of the building layout.
		iii. Request unit transfers to vacant units directly from the unit map.
		iv. Submit move-out requests digitally.
		v. Sign digital leases through signature-ready agreements.
		vi. Access the Document Vault for signed reports and amendments.
		vii. Submit Maintenance Requests with image uploads and descriptions.
		viii. View real-time status updates of repair tickets.
		ix. Access the iRis AI Assistant for context-aware building support.
		x. Ask natural language questions about amenities, rules, and lease details via RAG.
		xi. View the Live Financial Ledger for monthly dues and balances.
		xii. Access chronological payment history and transaction logs.
		xiii. Use the Messaging Portal with typing indicators, read receipts, and presence indicators.
		xiv. Send and receive files or media within conversation threads.
		xv. Create Discussion Posts, Photo Albums, and participate in Resident Polls on the Community Hub.
		xvi. React to community posts with multi-reactions (Like, Heart, Thumbs Up, Clap, Celebration).
		xvii. Engage in threaded comments on community posts.
		xviii. Bookmark and save important community discussions.
		xix. Report community content for spam or harassment.
		xx. Complete interactive Product Tours for Dashboard, Messages, Lease, and Community modules.
		xxi. Follow step-by-step onboarding flows as a new tenant.
	d. For all users, the system shall:
		i. Ensure secure login/logout via Supabase Auth.
		ii. Enforce database-level Row Level Security (RLS) for strict data isolation.
		iii. Maintain property-level data isolation where each property operates as a private, independent ecosystem.
		iv. Execute real-time message moderation and toxic content filtering via AI.
		v. Maintain smooth UI transitions via Framer Motion animations.
		vi. Provide skeleton loading states for data-heavy components.
		vii. Use modern typography (Geist, Rethink Sans) for enhanced readability.
		viii. Deliver mobile-responsive interfaces across all modules.
2. To develop iReside using appropriate modern tools and programming technologies to ensure system efficiency and usability:
	a. Framework: To program a web-based application using Next.js 16 (App Router) and TypeScript as the development environment.
	b. Frontend: To implement the UI using React 19, Tailwind CSS 4, Radix UI, and Framer Motion for modern interactivity.
	c. Backend: To utilize Supabase for backend operations, PostgreSQL database management, Real-time functionality, and Storage.
	d. Intelligence: To integrate Groq Llama 3.1 8B via the OpenAI SDK for RAG-powered intelligence, AI chat moderation, and landlord analytics.
	e. Interactivity: To implement drag-and-drop structural logic using @dnd-kit/core and @dnd-kit/utilities.
	f. Security: To enforce authentication and data protection using Supabase Auth and Row-Level Security (RLS).
3. To determine the level of conformity of iReside to the international standard ISO 25010:
	a. Functional Suitability (Completeness, Correctness, Appropriateness)
	b. Performance Efficiency (Time behavior, Resource utilization, Capacity)
	c. Compatibility (Co-existence, Interoperability)
	d. Interaction Capability (Appropriateness recognizability, Learnability, Operability, User engagement)
	e. Reliability (Availability, Fault tolerance, Recoverability)
	f. Security (Confidentiality, Integrity, Non-repudiation, Accountability, Authenticity)
	g. Maintainability (Modularity, Reusability, Analyzability, Modifiability, Testability)
	h. Flexibility (Adaptability, Scalability, Installability)
	i. Safety (Operational constraints, Risk identification, Fail-safe measures, Hazard warnings)
