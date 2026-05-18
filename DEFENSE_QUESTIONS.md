# Capstone Defense Questions

## iReside: Property and Tenant Services Management System for the Landlords of Valenzuela City

**Proponents:** Canon, Bryan Benedict G. | Delaog, Margaux Zyann J. | Dolot, Mark Roniel Y. | Tillo, Joseph Venedict G.

**Degree:** Bachelor of Science in Information Technology

---

## Table of Contents

1. [Introduction and Background](#1-introduction-and-background)
2. [Statement of the Problem](#2-statement-of-the-problem)
3. [Objectives of the Study](#3-objectives-of-the-study)
4. [Related Literature and Studies](#4-related-literature-and-studies)
5. [Methodology](#5-methodology)
6. [System Design and Architecture](#6-system-design-and-architecture)
7. [Database Design](#7-database-design)
8. [Features and Functionalities](#8-features-and-functionalities)
9. [Security and Privacy](#9-security-and-privacy)
10. [Testing and Evaluation](#10-testing-and-evaluation)
11. [User Acceptance](#11-user-acceptance)
12. [Deployment and Maintenance](#12-deployment-and-maintenance)
13. [Feasibility and Scalability](#13-feasibility-and-scalability)
14. [Limitations of the Study](#14-limitations-of-the-study)
15. [Recommendations](#15-recommendations)
16. [Ethical and Legal Considerations](#16-ethical-and-legal-considerations)
17. [Future Improvements](#17-future-improvements)
18. [Technical Deep-Dive Questions](#18-technical-deep-dive-questions)
19. [Trick / Pressure Questions from Strict Panelists](#19-trick--pressure-questions-from-strict-panelists)

---

## 1. Introduction and Background

### Easy

1. In your own words, what specific problem in Valenzuela City does iReside aim to solve?
2. Why did you choose Valenzuela City specifically, and not other cities with similar rental density like Quezon City or Manila?
3. You mention that landlords in Marulas, Malinta, Maysan, and Canumay rely on "fragmented, manual methods." What evidence do you have that this fragmentation actually exists?

### Moderate

4. How did you validate that the problems you describe — data fragmentation, delayed maintenance response, lack of transparency — are actually the most pressing issues for Valenzuela landlords and not simply assumptions from literature?
5. Your background mentions "rapid urbanization" as a driver. Can you quantify the actual growth rate of rental properties in Valenzuela City that your system responds to?
6. You frame iReside as a solution to "informal" rental management. But many small-scale landlords may prefer informality because it's simpler and cheaper. How does your system address the adoption barrier for landlords who are comfortable with their notebooks and logbooks?

### Difficult

7. Your manuscript claims landlords face "significant operational challenges." Yet your sampling only reached 4 landlords. How can you confidently generalize the problems of Valenzuela City's entire rental sector from only 4 landlord respondents?
8. The background section mentions that "many organizations now rely on technology" — but this is a generic claim. What specific, measurable indicators in the Valenzuela rental market did you observe that prove landlords are actually seeking, or ready for, a technological solution like iReside?
9. You describe the problem across four barangays with different characteristics (industrial Canumay/Maysan vs. residential/commercial Marulas/Malinta). Are the operational needs of a landlord in an industrial dormitory zone truly the same as those in a residential apartment complex? How does iReside account for these contextual differences?

### Socratic Follow-Up

10. If I were a landlord in Valenzuela using a simple Excel spreadsheet and it works for my 5-unit building, what compelling reason would you give me to switch to iReside?

---

## 2. Statement of the Problem

### Easy

1. Restate your general problem in one sentence.
2. What are the five investigative questions that guide your study?

### Moderate

3. Your first investigative question asks about "essential functional requirements." How did you determine what is "essential" versus "nice-to-have"? What was your prioritization framework?
4. Question 2 references "centralized data architecture and real-time synchronization." Can you explain — in technical terms — what real-time synchronization means in the context of iReside, and how it differs from periodic polling?
5. Question 5 asks about ISO/IEC 25010 compliance. Why did you select ISO 25010 instead of other quality models like ISO 9126 or the Technology Acceptance Model (TAM)?

### Difficult

6. Your problem statement says traditional methods "fail to provide real-time operational visibility." But isn't this an overstatement? A landlord who physically walks through their property has real-time visibility. Your system only provides visibility into data that has been entered. How do you reconcile this?
7. The problem statement mentions "the current lack of AI-driven tools limits the ability to automate tenant support and triage urgent property issues." Is AI integration a genuine problem in the rental sector, or is it a solution looking for a problem? How do you justify making AI a central feature of your system rather than a supplementary enhancement?
8. Your problem statement describes both operational inefficiencies AND the absence of AI as co-equal problems. Are these truly problems of the same magnitude? Doesn't this conflate a genuine operational need (record-keeping) with a technological trend (AI)?

### Socratic Follow-Up

9. If I remove the AI component from iReside entirely — no iRis assistant, no AI analytics, no message moderation — does the fundamental problem you identified still get solved? If yes, then why is AI essential? If no, what problem uniquely requires AI?

---

## 3. Objectives of the Study

### Easy

1. What is the general objective of your study?
2. List your specific objectives.

### Moderate

3. Your general objective mentions a "dedicated mobile-responsive interface for tenants." Why did you choose a responsive web approach (PWA) instead of developing a separate native mobile application?
4. One objective is to "automate maintenance tracking." What does "automate" mean in this context? At what point does the system require human intervention, and at what point is it truly automatic?
5. How did you ensure that each of your specific objectives maps directly to at least one functional requirement and at least one evaluation metric?

### Difficult

6. Your objectives span tenant services, landlord administration, AI integration, security, AND ISO compliance. Is this scope realistically achievable within a single capstone project timeline? How do you justify not narrowing your objectives?
7. You have an objective about ISO/IEC 25010 evaluation. But ISO 25010 has eight quality characteristics (Functional Suitability, Performance Efficiency, Compatibility, Usability, Reliability, Security, Maintainability, Portability). Which characteristics did you actually evaluate, and which did you omit — and why?
8. Your general objective mentions a "strict role-based architecture." What makes your RBAC implementation "strict"? Have you formally verified that no role can access data outside its permission boundary?

### Socratic Follow-Up

9. Looking at your specific objectives — which one was the hardest to achieve, and why?

---

## 4. Related Literature and Studies

### Easy

1. What is the most important foreign study that influenced your system design, and what specific insight did you take from it?
2. Name one local study that validates the need for iReside in the Philippine context.

### Moderate

3. You cite Encarnacion et al. (2025) and Bisquera et al. (2025) as local literature supporting digital transformation. But both studies focus on tourism-oriented accommodations (Siargao) and student boarding houses (Bayombong). How transferable are these findings to Valenzuela City's mixed industrial-residential context?
4. Your literature review on legal compliance (Section 2.3.9) cites RA 9653 (Rent Control Act of 2009). Can you explain specifically which provisions of RA 9653 iReside directly supports, and how your system automates compliance?
5. In your related systems comparison (Table 2.1), you compare iReside against platforms like Innago, Landlord Studio, AppFolio, and Anabode. These are international platforms targeting different markets. What makes this comparison valid, given that none of them operate in the Philippine context?

### Difficult

6. Your gap analysis identifies "Disaster-Resilient Data Architecture" as a key gap, citing Valenzuela City's flood vulnerability. Yet your chosen backend (Supabase) is cloud-hosted. How exactly does using a cloud database constitute a "disaster-resilient" solution to flooding? Does cloud hosting alone address the gap, or is this a superficial solution?
7. You synthesized three theories (TTF, SA, D&M) into a hybrid framework. But these theories come from different epistemological traditions — TTF is task-oriented, SA is cognitive psychology, D&M is organizational. What is the risk of theoretical eclecticism, and how did you ensure these three frameworks are complementary rather than contradictory?
8. You cite Adediran et al. (2025) on AI in property management and Adrogué (2026) on AI trends. Both are very recent (2025-2026). How did you ensure that the AI features you implemented are based on proven practices rather than experimental trends that haven't been validated?

### Socratic Follow-Up

9. If you had to remove ALL foreign literature from your Chapter 2 and rely only on Philippine-based studies, would your literature review still adequately support your study? Why or why not?

---

## 5. Methodology

### Easy

1. What development model did you use, and why?
2. How many respondents participated in your evaluation?
3. What sampling technique did you employ?

### Moderate

4. You used the Evolutionary Prototyping Model. How did you determine when a prototype iteration was "done" and ready to move to the next? What was your versioning or milestone criteria?
5. Your research design describes a "Sequential Exploratory" mixed-method approach: qualitative interviews first, then quantitative evaluation. But the qualitative phase was used for requirements gathering, while the quantitative phase was for evaluation. Is this truly a mixed-method study, or are these simply two separate phases — requirements and testing — that happen to use different data types?
6. You have exactly 21 respondents. How did you arrive at this number? Is there a statistical basis (power analysis, saturation point) or was it determined by convenience?
7. Purposive sampling is inherently non-probability. How do you respond to the criticism that your findings cannot be generalized beyond your 21 respondents?

### Difficult

8. Your IT professional evaluators (5 respondents) are responsible for assessing ISO/IEC 25010 compliance across potentially 8 quality characteristics. With only 5 evaluators, how reliable is your ISO evaluation? What is the minimum sample size recommended for ISO 25010 evaluation in software engineering literature?
9. The manuscript mentions four research instruments: Open-Ended Questionnaire, Feature-Based Questionnaire, ISO-Based Questionnaire, and Test Cases. How did you validate these instruments? Were they pilot-tested? Were they reviewed by experts other than your adviser? What is their Cronbach's alpha?
10. Your schedule allocates only 5 days for "Initial design and core feature development" and 28 days total for the entire development cycle. Given the scope of features (unit map, AI assistant, marketplace, lease signing, maintenance dashboard, finance hub, community hub, analytics, admin governance), how is this timeline realistic?

### Socratic Follow-Up

11. If I, as a panelist, ask you to justify that 12 tenants, 4 landlords, and 5 IT professionals constitute a statistically valid sample for evaluating a software system intended for an entire city — what is your response?

---

## 6. System Design and Architecture

### Easy

1. Describe your system architecture at a high level. What are the main components?
2. What diagram types did you use to model your system?

### Moderate

3. Your proposed system context diagram shows interaction between external entities and iReside. What external services does iReside depend on (e.g., Supabase, Groq API, Gemini, email service), and what happens to the system when any one of these external dependencies fails?
4. You have separate DFD Level 1 diagrams for Landlord, Tenant, and Admin. Why did you choose to separate them rather than showing a unified DFD with all actors? Doesn't this approach risk hiding cross-role data flows?
5. Your use case diagram lists 18+ use cases across four actor roles. How did you manage the complexity of designing for all these use cases simultaneously? Did you use any prioritization framework like MoSCoW?

### Difficult

6. The manuscript mentions a "Turnover access logic" (in exit criteria, Section 3.6.2). What exactly is this logic, and how is it architecturally distinct from standard RBAC? Can you walk me through the state machine of a tenant's access before, during, and after a lease turnover?
7. You use Supabase as your backend — which provides PostgreSQL, authentication, real-time subscriptions, and storage. However, your system also calls external AI APIs (Groq, potentially Gemini/OpenAI). How do you handle the architectural coupling to these external services? What is your strategy for preventing a single API outage from degrading core functionality?
8. Your system is described as a PWA. PWAs have specific technical requirements: service workers, manifest files, offline capabilities. Does iReside actually function offline? If a tenant in Canumay has intermittent internet, can they still access their lease information or submit a maintenance request?

### Socratic Follow-Up

9. Draw me — on the whiteboard — the data flow when a tenant submits a maintenance request that the AI must triage. Walk me through every component involved, every API call, and every potential point of failure.

---

## 7. Database Design

### Easy

1. What database management system did you use, and why?
2. How many main tables does your database have?

### Moderate

3. Your data dictionary shows extensive use of UUIDs as primary keys and JSONB columns. Why UUIDs over auto-incrementing integers? What are the performance implications of UUIDs as primary keys in PostgreSQL?
4. You use Supabase's real-time subscriptions. Which tables in your schema support real-time updates, and what PostgreSQL replication mechanism makes this possible?
5. Your messages table has a `content` field as TEXT and a separate `metadata` JSONB field for attachments. What was your rationale for storing message content and attachment metadata in separate fields rather than a unified JSON structure?

### Difficult

6. Your database design includes a `message_user_reports` table for abuse reporting, a `message_user_actions` table for blocking/archiving, and a `messages` table. How do you ensure that when a user is blocked, existing messages are handled correctly? What is the exact cascade behavior?
7. How did you design your Row-Level Security (RLS) policies in Supabase? Can you walk me through the RLS policy for the `leases` table — showing exactly which roles can read, insert, update, and delete — and how you tested that these policies cannot be bypassed?
8. The data dictionary mentions "sample values" for each attribute. But I notice the lease and billing tables appear to track financial data. How do you ensure data integrity for financial transactions in a way that would satisfy an auditor? Do you use database-level constraints, application-level validation, or both?

### Socratic Follow-Up

9. If I compromise a tenant's authentication token, what data can I access in your database? Walk me through exactly what RLS policies would — or would not — stop me from seeing.

---

## 8. Features and Functionalities

### Easy

1. What are the three most important features of iReside?
2. What is the purpose of the Unit Map feature?

### Moderate

3. Your system includes both a "Marketplace" for property discovery AND "Walk-in Application Processing" for offline applications. Why both? Aren't these overlapping features? When would a landlord use one versus the other?
4. The iRis AI Assistant has multiple functions: tenant Q&A, maintenance triage, and landlord KPI analytics. How did you ensure the AI responses remain contextually appropriate across these very different functional domains?
5. Your digital lease signing supports both "in-person and remote signing with tenant-first signing order." Why tenant-first? What was the legal or UX rationale behind this signing sequence?
6. The Community Hub includes real-time message moderation using Groq's Llama 3.1 API. How do you handle false positives in content moderation — where a legitimate message is incorrectly flagged as toxic?

### Difficult

7. Your Unit Map uses a drag-and-drop builder with 20px grid snapping. This is essentially a floor plan design tool embedded in a property management system. How did you validate that landlords — who may not be technically proficient — can actually use this tool effectively? What usability testing did you conduct specifically for the Unit Map?
8. You have 18+ distinct feature modules (dashboard, marketplace, unit map, property config, walk-in applications, lease management, digital signing, maintenance, finance, billing, community hub, messaging, AI assistant, analytics, admin governance, document vault, tenant portal, profile management). Which of these features were actually completed and tested versus partially implemented? Be specific.
9. The AI Analytics feature claims to provide "strategic recommendations" using Groq Llama 3.1 8B. How do you validate that the AI's recommendations are actually correct and beneficial, rather than hallucinated or misleading? What testing did you do to compare AI-generated insights against ground truth?

### Socratic Follow-Up

10. Among all your features, which one would you say is the "weakest" — the one you're least proud of — and why?

---

## 9. Security and Privacy

### Easy

1. What authentication method does iReside use?
2. How many user roles does your system have, and what are they?

### Moderate

3. You use Supabase Auth for authentication. What specific auth providers did you configure (email/password, OAuth, magic link, etc.) and why?
4. Your RBAC system has four roles: Landlord, Tenant, Admin, and an implied "Visitor" role. How are role permissions enforced — at the application layer, the database layer (RLS), or both?
5. The AI features send data to external APIs (Groq, potentially Gemini/OpenAI). What tenant data is being sent to these third-party services? How do you ensure compliance with the Data Privacy Act of 2012 (RA 10173)?

### Difficult

6. Your security section (Functional Requirements 11) lists four REQs: RBAC enforcement, unauthorized access prevention, secure sign-out, and sensitive data protection. These are very high-level requirements. Can you point to a specific, concrete security control you implemented — for example, how do you prevent SQL injection, XSS, CSRF, or token theft?
7. The manuscript mentions "Turnover access logic" where access changes when a lease ends. Walk me through the exact mechanism: when a tenant's lease expires, at what precise moment does their access change? Is it immediate, batched, event-driven? What happens if a tenant has an active maintenance request when their lease expires?
8. You store personal data including names, contact information, lease agreements, payment records, and message histories. Have you conducted a Data Privacy Impact Assessment (DPIA)? Where is this data physically stored? Who has access to it at the infrastructure level (Supabase employees, your development team)?

### Socratic Follow-Up

9. If I am a malicious landlord and I want to read the private messages between my tenant and another landlord, what security controls would stop me? Be technically specific.

---

## 10. Testing and Evaluation

### Easy

1. What evaluation standard did you use to assess your system's quality?
2. What are your entry and exit criteria for testing?

### Moderate

3. Your test cases table (Section 3.6.4.1) appears to be structured as a template. Can you present the actual test results — which test cases passed and which failed — with specific numbers?
4. You used both a Feature-Based Questionnaire and an ISO-Based Questionnaire. Why two separate instruments? What does each measure that the other doesn't?
5. Your exit criteria state there should be "no major or high-priority faults." How did you classify faults as major vs. minor? What was your severity classification framework?
6. The testing schedule allocates 3 days for alpha testing, 7 days for beta testing, and 5 days for final testing. What exactly happened during each phase, and what were the key findings?

### Difficult

7. Your evaluation used a 4-point Likert scale (Strongly Agree to Strongly Disagree). Why 4 points instead of 5 or 7? A 4-point scale forces respondents to take a position — this is a deliberate choice. But it also eliminates a neutral midpoint. How do you justify this methodological decision?
8. You evaluated ISO/IEC 25010 compliance. But ISO 25010 is a quality MODEL, not a testing methodology. How did you operationalize abstract quality characteristics like "Maintainability" or "Portability" into concrete, measurable test items? Can you show me the specific test item that measures "Portability"?
9. The manuscript states you have 21 respondents evaluating the system. But your testing schedule shows different evaluation phases (alpha, beta, final). Were all 21 respondents involved in all phases? If not, how many evaluated what, and doesn't this further fragment your already small sample?

### Socratic Follow-Up

10. If I asked you to provide the mean, standard deviation, and statistical significance (p-value) for each ISO 25010 characteristic as evaluated by your respondents — could you produce these figures right now?

---

## 11. User Acceptance

### Easy

1. Who were the end-users who tested your system?
2. Did tenants and landlords evaluate different aspects of the system?

### Moderate

3. Your Feature-Based Questionnaire includes statements in both English and Filipino. Why the dual-language approach? How did you ensure translational equivalence between the English and Filipino versions?
4. The manuscript describes that landlords evaluated the Unit Map and iRis AI, while tenants evaluated the Community Hub and Tenant Ledger. But shouldn't ALL users evaluate ALL features that are relevant to them, rather than being segmented by role? What if a landlord also wanted to evaluate the messaging feature?
5. What specific feedback from your landlord respondents led to the most significant design change during development?

### Difficult

6. User acceptance testing typically distinguishes between "perceived usefulness" and "perceived ease of use" (as in TAM). Your evaluation does not explicitly use TAM. How do you know whether users ACCEPT your system versus merely finding it functional? What threshold of agreement on your 4-point scale constitutes "acceptance"?
7. You have 4 landlords and 12 tenants as evaluators. If 1 out of 4 landlords strongly disagreed with a core feature, that's 25% of your landlord sample. At what point does negative feedback become statistically meaningful with such a small sample?
8. The ultimate measure of user acceptance is adoption — would users actually switch from their current methods to iReside? Did you ask your respondents this question? If not, how can you claim user acceptance based solely on Likert-scale satisfaction ratings?

### Socratic Follow-Up

9. Your 12 tenant evaluators were selected via purposive sampling. If I randomly selected 12 different tenants from the same barangays, would I get the same results? How do you know?

---

## 12. Deployment and Maintenance

### Easy

1. Where is iReside hosted?
2. Is iReside a web application or a mobile application?

### Moderate

3. You describe iReside as a Progressive Web App (PWA). What specific PWA capabilities did you implement (service workers, offline caching, push notifications, installability)? Which ones did you NOT implement, and why?
4. Your system depends on Supabase for hosting, authentication, database, and storage. What is your deployment pipeline? How do you move from development to production?
5. What is the cost model for running iReside? Supabase has free and paid tiers. Groq API has usage costs. Who pays for these services after your capstone defense?

### Difficult

6. The manuscript's gap analysis emphasizes "disaster-resilient data architecture" for flood-prone Valenzuela. What specific disaster recovery provisions have you implemented? What is your Recovery Time Objective (RTO) and Recovery Point Objective (RPO)?
7. Supabase manages your database, but database schema evolution is your responsibility. What is your migration strategy? If you need to alter the `leases` table schema after deployment with live tenant data, how would you do it without data loss or downtime?
8. Your system integrates with third-party AI APIs (Groq, potentially Google Gemini, OpenAI). What happens to your system if Groq discontinues its free tier, changes its API, or goes out of business? What is your vendor lock-in mitigation strategy?

### Socratic Follow-Up

9. Six months after deployment, a critical security vulnerability is discovered in a dependency you used. Walk me through your process for identifying, patching, testing, and deploying the fix.

---

## 13. Feasibility and Scalability

### Easy

1. Is iReside designed to scale beyond the four barangays you studied?
2. What makes your system "feasible" for small-scale landlords?

### Moderate

3. Your system targets landlords in Valenzuela City. If a landlord from Cebu City wanted to use iReside, would the system work? What localization or configuration changes would be needed?
4. You mention compliance with RA 9653 (Rent Control Act). But RA 9653 applies specifically to residential units with monthly rent within certain thresholds. How does your system handle units that fall outside RA 9653 coverage — commercial leases, high-end units?
5. The comparative analysis emphasizes that iReside is free or low-cost compared to commercial alternatives. But "free" is not a sustainable business model. What is the long-term financial feasibility of maintaining and operating iReside?

### Difficult

6. Your database uses Supabase (PostgreSQL). At what point does a single PostgreSQL instance become a bottleneck? Did you conduct any load testing to determine how many concurrent users or how many properties your current architecture can handle before performance degrades?
7. Your AI features call external APIs for every AI interaction. As the user base grows, so do API costs and latency. How do you plan to scale the AI features economically? Have you considered caching, request batching, rate limiting, or on-device models?
8. Operational feasibility: you're targeting landlords who currently use "notebooks and logbooks." What is your strategy for digital literacy training and onboarding? How do you plan to overcome the technological learning curve for landlords who may not be comfortable with computers?

### Socratic Follow-Up

9. If iReside suddenly had 1,000 landlords and 10,000 tenants — tomorrow — what would break first, and why?

---

## 14. Limitations of the Study

### Easy

1. What are the stated delimitations of your study?
2. Why did you limit your study to four barangays?

### Moderate

3. Your delimitations state that iReside "does not integrate with third-party payment gateways." Yet your system includes billing, utilities, and payment tracking. How do tenants actually pay? How do you track payments without a payment gateway?
4. You excluded "native mobile applications" in favor of a PWA. PWAs on iOS have known limitations (limited push notification support, storage caps, no background sync). How do these limitations affect your tenant users who predominantly use mobile devices?
5. The system is delimited to "English language." In a city where many tenants and landlords may be more comfortable in Filipino, isn't this a significant usability limitation? How did you address this during testing?

### Difficult

6. Your study has 21 respondents from 4 barangays. This is approximately 0.006% of Valenzuela City's population of ~350,000 (or even smaller as a fraction of the rental market). At what point does a sample become too small to draw meaningful conclusions? How do you defend the external validity of your findings?
7. The manuscript identifies that the system does not include "accounting or tax compliance features." But your Finance Hub tracks payments, generates receipts, and produces reports. Where exactly is the line between "payment tracking" (which you do) and "accounting" (which you don't)? Can a landlord actually use your system for tax filing?
8. You used purposive sampling — a non-probability method. Your own manuscript cites Bryman (2016) to justify this. But Bryman also acknowledges that purposive samples cannot be statistically generalized. Given that your entire evaluation rests on this sample, what claims can you ACTUALLY make about your findings?

### Socratic Follow-Up

9. Looking at your study honestly — what is its single biggest weakness, and if you had 6 more months, how would you address it?

---

## 15. Recommendations

### Easy

1. Who would you recommend use iReside?
2. What recommendations do you have for future researchers?

### Moderate

3. Based on your findings, would you recommend that landlords completely abandon their manual systems and rely solely on iReside? Why or why not?
4. Your system was evaluated by IT professionals using ISO 25010. Based on their feedback, what is the ONE most urgent recommendation for improving the system before any real-world deployment?
5. What recommendations do you have for the Valenzuela City local government regarding the use of systems like iReside for rental property oversight?

### Difficult

6. Your study recommends iReside for landlords in Valenzuela City. But your evaluation involved only 4 landlords. On what basis do you make this recommendation? Would you feel comfortable recommending the system to a landlord managing 100+ units based on your findings?
7. Given that your system does not handle actual payments, does not do accounting, does not have a native mobile app, and uses third-party AI with dependency risks — what is your honest assessment of whether iReside is "deployment-ready" versus being a proof of concept?
8. If the local government of Valenzuela City asked you to deploy iReside city-wide for all registered rental properties, what would you tell them? What would need to happen before you could say yes?

### Socratic Follow-Up

9. Ten years from now, what do you think will be different about property management in Valenzuela City, and what role would iReside play in that evolution?

---

## 16. Ethical and Legal Considerations

### Easy

1. What ethical considerations did you address in your study?
2. How did you obtain consent from your respondents?

### Moderate

3. Your system stores sensitive personal data including names, addresses, payment records, and private messages. What specific measures did you implement to comply with the Data Privacy Act of 2012 (RA 10173)?
4. The manuscript mentions ethical considerations in Section 3.2.8. Did you seek approval from an institutional ethics review board or committee? If not, why not?
5. Your AI message moderation filters "toxic content, hate speech, and spam." Who defines what is "toxic"? What safeguards exist to prevent the AI moderation from being biased or censoring legitimate communication?

### Difficult

6. The AI assistant (iRis) interacts with tenants and provides responses. If iRis provides incorrect advice — for example, telling a tenant they don't need to pay rent this month, or misinterpreting a maintenance request as non-urgent when it's actually critical — who is legally liable? The developers? The landlord? The AI provider?
7. Your system facilitates digital lease signing. Under Philippine law (E-Commerce Act, RA 8792), electronic signatures are legally recognized. However, have you verified that your specific implementation of digital signatures meets the legal requirements for enforceable electronic contracts in the Philippines?
8. The manuscript mentions that tenants can report other users through the message reporting system. What due process protections exist for a reported user? Can a user be banned or restricted based solely on AI moderation or another user's report without human review?

### Socratic Follow-Up

9. A tenant's private data is stored in your Supabase database. A landlord requests access to messages between that tenant and a previous landlord for a legal dispute. What is your legal and ethical obligation? What does your system actually allow?

---

## 17. Future Improvements

### Easy

1. What feature would you add to iReside if you had more time?
2. What technology would you explore for a future version?

### Moderate

3. Your delimitations mention no payment gateway integration. If you were to add this in the future, which Philippine payment providers would you consider (GCash, Maya, bank transfers) and what are the integration challenges?
4. The system is currently English-only. What would be involved in adding multi-language support, particularly Filipino, to iReside?
5. You mention IoT integration as a future possibility. What specific IoT use cases do you envision for iReside (smart locks, utility meters, sensors), and how would they enhance the platform?

### Difficult

6. If you were to rebuild iReside from scratch — knowing everything you know now — what would you do differently? Be specific about architecture, technology choices, and scope.
7. Your AI features currently depend on Groq's API. With the rapid evolution of AI models, would you consider migrating to a locally-hosted, open-source model for privacy and cost reasons? What are the trade-offs?
8. The manuscript's gap analysis identifies disaster resilience as a key differentiator. What specific technical steps would be needed to make iReside truly disaster-resilient — beyond simply using a cloud database?

### Socratic Follow-Up

9. If a venture capitalist offered you funding to turn iReside into a commercial startup, what would be the first three things you'd invest in, and why?

---

## 18. Technical Deep-Dive Questions

### Easy

1. What frontend framework did you use and why?
2. What database does your system use?
3. How does the Unit Map's drag-and-drop functionality work?

### Moderate

4. You use Next.js with React. Are you using the App Router or Pages Router? What Next.js features (server components, streaming, ISR, middleware) did you leverage, and which did you avoid?
5. Supabase provides real-time subscriptions via PostgreSQL's logical replication. Explain technically how a change to the `maintenance_requests` table triggers an immediate update on the landlord's dashboard.
6. Your AI features use Groq's Llama 3.1 8B via API. How do you structure the prompts for different AI functions (tenant Q&A vs. KPI analytics vs. message moderation)? Do you use few-shot prompting, system prompts, or retrieval-augmented generation (RAG)?
7. The Unit Map with 20px grid snapping implies a canvas-based implementation. Did you use HTML5 Canvas, SVG, or a library like React Flow/Konva? How do you persist the spatial layout to your relational database?

### Difficult

8. Your system has approximately 18+ feature modules. How are these organized in your codebase? What is your component architecture — atomic design, feature-based colocation, or something else? How do you manage state across modules?
9. The manuscript mentions RAG in the context of related studies (Section 2.4.3). Does iReside actually implement RAG? If so, what is your vector database, embedding model, and chunking strategy? If not, how does the AI access domain-specific information about properties and policies?
10. Tailwind CSS 4 is mentioned as your UI framework, but Tailwind v4 was released very recently with significant breaking changes (CSS-first configuration, no tailwind.config.js). Which version did you actually use, and how did the version choice affect your development?
11. Your digital lease signing involves two parties signing sequentially. How is the signed document stored and verified? Is there any cryptographic signature involved, or is this a "click-to-sign" implementation? How can a third party verify that a lease was not tampered with after signing?

### Socratic Follow-Up

12. Show me one piece of code you're particularly proud of — something technically challenging. Walk me through it and explain why you made the decisions you did.

---

## 19. Trick / Pressure Questions from Strict Panelists

### Easy (but deceptive)

1. What is the most important thing you learned from this capstone project?
2. If you could go back to Day 1 and give yourself one piece of advice, what would it be?

### Moderate (adversarial framing)

3. You built a system with AI, drag-and-drop floor plans, digital signatures, real-time messaging, analytics, and 18+ features. Yet you tested it with only 4 landlords. Doesn't this suggest a mismatch between development effort and validation rigor?
4. Your title says "for the Landlords of Valenzuela City." But you only studied 4 barangays out of 33. Can you really claim this system is "for the Landlords of Valenzuela City"?
5. You compared iReside against Innago, Landlord Studio, AppFolio, and other international platforms. But these are multi-million-dollar products built by professional teams over years. What makes you think a capstone project built in ~28 days is comparable?

### Difficult (pressure simulation)

6. I've read your entire manuscript. I notice your test cases table has "Actual Result," "Pass or Failed," and "Remarks" columns — but many of these appear to be formatted as a template with placeholder structure. Have ALL test cases actually been executed and results recorded? Can you show me the completed test results?
7. Your system claims to help with RA 9653 compliance, BSP's cash-lite economy goals, and disaster resilience. These are significant claims — legal compliance, financial regulation alignment, and disaster preparedness — for an undergraduate capstone project. Are you not overstating the impact and scope of your work?
8. I'm going to ask a difficult question: Your entire evaluation relies on 21 purposively selected respondents using a non-validated questionnaire on a 4-point scale, evaluating a system that was built in 28 days and hasn't been tested under real operational conditions. What, honestly, can you actually conclude from this study?
9. Four proponents, presumably each with different strengths. Can you tell me — specifically — what each of you contributed to the project, in technical detail? Who wrote the AI integration? Who designed the database schema? Who built the frontend components?

### Maximum Pressure

10. [Pause. Look directly at one proponent.] You — don't look at your teammates. Tell me: what is the ONE feature of iReside that you personally built that you know has a bug, a security vulnerability, or an incomplete edge case? Be honest. No one builds a perfect system.

11. [After the answer to #10.] Now — you [different proponent]. Do you agree with what your teammate just said? Is there something ELSE they didn't mention?

12. You've spent months building this. I see a beautiful UI. I see AI integration. I see real-time features. But let me ask you directly: If a real landlord in Valenzuela City tried to use this tomorrow to manage 50 units with real tenants, real rent payments, and real maintenance emergencies — would it actually work? Or is this a well-executed academic exercise?

13. Final question. You're not just defending a system. You're defending a research study. My question is: what is the contribution to KNOWLEDGE that your study makes? Not what you BUILT — what did you DISCOVER that wasn't known before?

---

## Summary Statistics

| Category | Easy | Moderate | Difficult | Total |
|----------|:----:|:--------:|:---------:|:-----:|
| 1. Introduction & Background | 3 | 3 | 3 | 9 |
| 2. Statement of the Problem | 2 | 3 | 3 | 8 |
| 3. Objectives of the Study | 2 | 3 | 3 | 8 |
| 4. Related Literature & Studies | 2 | 3 | 3 | 8 |
| 5. Methodology | 3 | 4 | 3 | 10 |
| 6. System Design & Architecture | 2 | 3 | 3 | 8 |
| 7. Database Design | 2 | 3 | 3 | 8 |
| 8. Features & Functionalities | 2 | 4 | 3 | 9 |
| 9. Security & Privacy | 2 | 3 | 3 | 8 |
| 10. Testing & Evaluation | 2 | 4 | 3 | 9 |
| 11. User Acceptance | 2 | 3 | 3 | 8 |
| 12. Deployment & Maintenance | 2 | 3 | 3 | 8 |
| 13. Feasibility & Scalability | 2 | 3 | 3 | 8 |
| 14. Limitations of the Study | 2 | 3 | 3 | 8 |
| 15. Recommendations | 2 | 3 | 3 | 8 |
| 16. Ethical & Legal Considerations | 2 | 3 | 3 | 8 |
| 17. Future Improvements | 2 | 3 | 3 | 8 |
| 18. Technical Deep-Dive | 3 | 4 | 4 | 11 |
| 19. Trick / Pressure Questions | 2 | 3 | 8 | 13 |
| **TOTAL** | **39** | **61** | **60** | **160** |

---

## Techniques Employed

| Technique | How Applied |
|-----------|-------------|
| **Socratic Questioning** | Questions that probe assumptions, seek evidence, and reveal contradictions — forcing proponents to defend not just WHAT they did but WHY they chose it |
| **Adversarial Panel Simulation** | Intentionally challenging the weakest points: small sample size, untested features, compressed timeline, missing validation |
| **Bloom's Taxonomy Layering** | Easy = Recall/Comprehension | Moderate = Application/Analysis | Difficult = Synthesis/Evaluation |
| **Research Inconsistency Detection** | Targeting contradictions: title vs. scope, claims vs. evidence, problem statement vs. solution architecture |
| **Defense Pressure Simulation** | Section 19 uses rapid-fire, confrontational framing with escalating intensity — designed to test composure under pressure |

---

*Prepared as a defense preparation resource. These questions are designed to test the proponents' understanding beyond what is written in the manuscript — simulating an actual academic defense panel.*
