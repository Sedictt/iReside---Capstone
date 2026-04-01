## 3.5.1 Proposed System Context Diagram

The proposed system context diagram, also known as the Data Flow Diagram (DFD) Level 0, presents the overall interaction between iReside and its external entities. At this level, the system is treated as a single major process, while the external users and services that communicate with the system are shown together with the data they provide and receive. The diagram gives a general view of the system boundary and shows how information enters and exits the proposed system.

In the case of iReside, the context diagram centers on the **iReside Property Management System** as the main process. The system interacts primarily with three user-based external entities, namely the **Administrator**, **Landlord**, and **Tenant**. It also interacts with an external **AI Service** that supports intelligent assistance and content-related processing for selected modules of the system.

Figure X shows the proposed system context diagram of iReside.

Figure X. Proposed System Context Diagram of iReside

The **Administrator** interacts with the system for governance and monitoring purposes. The administrator provides user review decisions, registration assessment data, and administrative actions. In return, the system provides registration records, user details, platform summaries, and monitoring information needed for system supervision and decision-making.

The **Landlord** is one of the main users of the system and exchanges a large volume of operational data with iReside. The landlord inputs property details, unit information, walk-in application records, lease setup data, invoice information, maintenance actions, community management actions, and communication data. In return, the system provides tenant information, application status updates, lease records, payment monitoring details, analytics, reports, maintenance records, and other property management outputs needed for daily operations.

The **Tenant** interacts with the system for residency-related services. The tenant sends maintenance requests, lease-related actions, payment viewing requests, messaging data, move-out or transfer requests, and community participation data. In return, the tenant receives lease information, billing details, maintenance status updates, landlord messages, community content, onboarding guidance, and other information related to their residence within the property.

The **AI Service** functions as an external supporting entity connected to iReside. The system sends user prompts, relevant context data, and content evaluation requests to the AI service. In return, the AI service provides generated responses, contextual assistance for the iRis assistant, analytics support, and moderation-related outputs that are used by the system to enhance user experience and decision support.

Through this context diagram, it can be seen that iReside serves as the central processing system that connects the major participants involved in private property management. It receives data from administrators, landlords, and tenants, processes these transactions within the system boundary, and returns organized information, status updates, and service outputs according to each user's role. The inclusion of the external AI service further shows that some system functions are strengthened through intelligent processing while the main control and data management remain within iReside.

Overall, the proposed system context diagram provides a high-level representation of how iReside operates as an integrated property management platform. It shows the major external entities involved, the direction of their interaction with the system, and the general flow of information necessary for administration, property operations, tenant services, and AI-assisted support.
