# iReside — Modern Property Management Simplified

![iReside Banner](file:///C:/Users/JV/.gemini/antigravity/brain/2b965498-3ad6-4393-8142-bfd2103c5dcc/ireside_banner_1773457334047.png)

iReside is a premium, full-stack property management platform designed to bridge the gap between landlords and tenants. High-performance, secure, and powered by AI, iReside streamlines every aspect of the rental lifecycle—from listing and applications to lease management and maintenance.

## ✨ Core Features

### 🤖 iRis AI Assistant
Meet **iRis**, your intelligent building concierge. Powered by **Groq Llama 3.1**, iRis provides real-time, context-aware support for tenants.
- **Zero Cost**: Integrated with Groq's free tier for lightning-fast, high-quota responses.
- **RAG Powered**: iRis knows your lease terms, building amenities, and house rules.
- **24/7 Support**: Instant answers to common tenant queries.

### 🏠 For Landlords
- **Visual Property Planner**: Intuitive interface for managing properties and units.
- **Financial Analytics**: Real-time revenue charts and payment tracking.
- **Verification Workflow**: Dedicated flow for property and document verification.
- **Tenant Management**: Seamless communication and automated billing.

### 🔑 For Tenants
- **Smart Search**: Find your next home with map-based search (Leaflet integration).
- **Digital Leases**: Sign and manage lease agreements securely online.
- **Maintenance Portal**: Submit and track repair requests with ease.
- **One-Click Payments**: View history and settle dues instantly.

---

## 🛠️ Technology Stack

iReside is built with a modern, high-performance stack for maximum scalability and developer velocity.

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **AI Engine**: [Groq](https://groq.com/) (Llama 3.1 8B via OpenAI SDK)
- **Maps**: [Leaflet](https://leafletjs.com/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- A Supabase Project
- A [Groq API Key](https://console.groq.com/keys) (for iRis AI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sedictt/iReside.git
   cd iReside
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📂 Project Structure

```text
├── src/
│   ├── app/            # Next.js App Router (Routes & API)
│   ├── components/     # Reusable UI Components
│   ├── hooks/          # Custom React Hooks
│   ├── lib/            # Utilities & AI Logic (iRis context)
│   ├── types/          # TypeScript Type Definitions
├── supabase/           # Database Migrations & Seed Data
├── docs/               # Documentation (Architecture, API, etc.)
└── public/             # Static Assets
```

For a deeper dive into the system design, check out our [Architecture Documentation](./docs/ARCHITECTURE.md).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the iReside Team.
