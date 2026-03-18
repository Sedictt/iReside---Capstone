# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Comprehensive system feature documentation in `docs/list-of-features.md`

### Fixed
- Critical build error in `src/app/landlord/messages/page.tsx` due to invalid UTF-8 encoding (EM DASH char)
- Critical build error in `src/app/tenant/messages/page.tsx` due to invalid UTF-8 encoding (EM DASH char)
- Corrected mangled currency symbols (₱) in landlord and tenant message portals

### Security
- Synchronized security documentation for Role-Based Access Control (RBAC) and Row Level Security (RLS)
