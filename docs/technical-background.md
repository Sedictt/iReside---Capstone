# 2.1 Technical Background

iReside is an integrated property and tenant management ecosystem designed for the multi-unit residential sector in Barangay Marulas, Valenzuela City. The system comprises three primary interfaces: a Discovery Portal for prospective tenants to explore available units, a Visual Command Center for landlords and property managers to oversee operations, and an Administrative Oversight Portal for system moderation and governance. Core functionalities include a 2D Spatial Canvas with Modular Floor Planner for unit layout visualization, a Map-based Discovery Portal using Leaflet.js for location-aware property search, a Real-Time Financial Ledger for payment tracking, and AI-Powered Features such as the iRis AI Assistant for contextual property inquiries and Maintenance Triage for service request categorization. The platform implements role-based access control to maintain data isolation between Super Admin, Landlord, and Tenant roles.

The software architecture utilizes Supabase as the Backend-as-a-Service infrastructure, providing PostgreSQL-based database management, user authentication via Supabase Auth, and real-time capabilities through PostgreSQL replication and row-level security (RLS) for multi-tenant data isolation. The frontend is developed using Next.js 16 and React 19, leveraging server-side rendering and static site generation for optimal performance, with Tailwind CSS for utility-first styling and Lucide React for consistent iconography. AI-driven functionalities employ Retrieval-Augmented Generation (RAG) using the Groq-hosted Llama 3.1 70B model, enabling context-aware responses for tenant inquiries and operational analytics while maintaining data privacy through localized knowledge base integration. For vector storage and similarity search required by the RAG pipeline, the system integrates the pgvector extension with PostgreSQL to efficiently manage and retrieve embeddings from curated property management documentation and local ordinances. The system follows a clean separation of concerns: the frontend (Next.js) serves static and server-rendered UIs, while the backend (Supabase) handles authentication, CRUD operations, and real-time WebSocket events. The AI layer operates as a stateless service, ingesting user queries, retrieving relevant context from pgvector embeddings, and generating responses via the Groq API — ensuring low-latency inference without compromising data isolation.

## References

Supabase. (2024). *Supabase: The open source Firebase alternative*. Retrieved from https://supabase.com

Vercel. (2024). *Next.js: The React Framework for Production*. Retrieved from https://nextjs.org

Groq. (2024). *Groq: The world's fastest AI inference*. Retrieved from https://groq.com

Kane, A. (2024). *pgvector: Vector search for PostgreSQL*. Retrieved from https://github.com/pgvector/pgvector

Tailwind Labs. (2024). *Tailwind CSS: A utility-first CSS framework*. Retrieved from https://tailwindcss.com

Framer. (2024). *Framer Motion: Production-ready motion library for React*. Retrieved from https://www.framer.com/motion

Leaflet. (2024). *Leaflet: An open-source JavaScript library for mobile-friendly interactive maps*. Retrieved from https://leafletjs.com

Lucide. (2024). *Lucide React: Beautiful & consistent icon library for React*. Retrieved from https://lucide.dev

Radix UI. (2024). *Radix UI: Low-level UI primitives for accessible design systems*. Retrieved from https://www.radix-ui.com