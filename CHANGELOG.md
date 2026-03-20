# Changelog

All notable changes to this project will be documented in this file.

## 2026-03-20
### Documentation
- Corrected platform architecture specification from native Android to Progressive Web App (PWA)
- Added comprehensive scope and delimitations paper for thesis documentation
- Updated technical stack documentation to reflect Next.js 16 + React 19 unified web architecture
- Clarified cross-platform approach using responsive design and mobile-optimized UI patterns

## 2026-03-20
### Updated
- Overhauled Admin Portal UI across all four admin views (layout, sidebar, dashboard, users, registrations)
- Redesigned AdminSidebar with icon containers, nav item descriptions, active gradient highlight, chevron indicator, and branded glow on the shield icon
- Rebuilt Admin Dashboard with accent-colored stat cards, registration pipeline progress bar, user breakdown panel, and quick actions row
- Revamped Users page with role filter pills (live counts), avatar component with initials fallback, and combined search + role filtering
- Revamped Registrations page with status filter tabs (live counts), polished review modal with applicant avatar, document rows with icons, and improved action buttons

## [Unreleased]

### Added
- Comprehensive system feature documentation in `docs/list-of-features.md`
- Real-time tenant application tracking portal with dynamic Supabase backend integration
- Live data integration for Tenant Lease Hub, offering dynamic progress tracking and document vault
- Real-time Tenant Payments dashboard connected to the backend financial ledger
- Autonomous AI-powered Chat Moderation feature running on Groq Llama 3 API blocking toxic behavior

### Fixed
- Critical build error in `src/app/landlord/messages/page.tsx` due to invalid UTF-8 encoding (EM DASH char)
- Critical build error in `src/app/tenant/messages/page.tsx` due to invalid UTF-8 encoding (EM DASH char)
- Corrected mangled currency symbols (₱) in landlord and tenant message portals

### Security
- Synchronized security documentation for Role-Based Access Control (RBAC) and Row Level Security (RLS)
