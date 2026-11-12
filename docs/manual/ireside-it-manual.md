# iReside

        ### IT TECHNICAL & SYSTEM ADMINISTRATION HANDBOOK

        *Doc Ref: IR-IT-2026-V1 • For DevOps, System Admins & Evaluators • Revision 1.0*

---

      

      ## Table of Contents

      
| 1. System Architecture & Complete Tech Stack | ... | Page 2 |
| --- | --- | --- |
| 2. Role Model & Service Role Operations (Zero Admin) | ... | Page 3 |
| 3. Environment Configuration & Secrets Management | ... | Page 4 |
| 4. Database Schema: Profiles, Properties & Unit Map | ... | Page 5 |
| 5. Database Schema: Leases, Financials & Submeters | ... | Page 6 |
| 6. Database Schema: Maintenance, Chat & Security | ... | Page 7 |
| 7. Row-Level Security (RLS) & Multi-Tenant Isolation | ... | Page 8 |
| 8. Authentication Engine, 2FA OTP & Session Guards | ... | Page 9 |
| 9. Cryptographic Emergency Spare Key Architecture | ... | Page 10 |
| 10. Workspace Claiming Lifecycle (/api/setup/launch) | ... | Page 11 |
| 11. Core REST API Endpoints & Webhook Lifecycle | ... | Page 12 |
| 12. Mobile Client Build Pipeline & Android Compilation | ... | Page 13 |
| 13. Automated Schedulers & Serverless Cron Workers | ... | Page 14 |
| 14. IT Operations, Disaster Recovery & Troubleshooting | ... | Page 15 |
| 15. Commissioning Sign-Off, Helpline & Glossary | ... | Page 16 |

      ## Executive System Overview

      **iReside** is an enterprise rental property platform engineered for Philippine multi-family housing, boarding houses, and dormitories (Barangay Marulas pilot). It unifies tenant onboarding, interactive 2D unit maps, submeter utility billing, and maintenance ticketing into a decoupled cloud-native system.

      The system is architected around a strict two-role human model (**Landlord** and **Tenant**; no human admin accounts per `dfd-rules.md`). Automated operations, setup claiming, and maintenance crons execute through system service role tokens.

    

    
  

  
  
  
  
    

    
      ## System Architecture & Multi-Tier Topology

      iReside employs a modern decoupled architecture separating presentation, serverless edge compute, and managed relational persistence:

      

        📦 **Presentation Tier: Next.js 16 (App Router SSR) / Capacitor APK**
   Landlord Web Hub (/landlord) • Tenant Portal (/tenant)

           ↓ *(HTTPS / WSS Realtime)*

        📦 **Serverless Compute Tier: Vercel Edge & Node.js API Routes**
   Auth Guards • Cron Workers • PDF Engine (Puppeteer / pdf-lib)

           ↓ *(TLS 1.3 / Port 5432 / HTTPS)*

        📦 **Managed Cloud BaaS: Supabase PostgreSQL 15 & Storage CDN**
   PostgreSQL RLS Policies • PgBouncer Pooler • S3 Bucket CDN

      

      ## Complete Technology Stack Specifications

      
| Subsystem | Technology | Runtime / Role |
| --- | --- | --- |
| Frontend | Next.js 16 (App Router) | React 19, Server Components & Server Actions |
| Language | TypeScript 5.x | Strict typing, end-to-end type safety |
| Styling | Tailwind CSS v3.4 | Neumorphic surface design & responsive tokens |
| Database | Supabase PostgreSQL 15 | PgBouncer connection pooling, Row-Level Security |
| Authentication | Supabase Auth (JWT) | HttpOnly cookies, 2FA email OTP challenges |
| Mobile App | Capacitor 7 Standalone | Android APK compiled via Studio JBR & Gradle 8 |
| PDF Generator | Puppeteer & pdf-lib | Headless Chromium A5 paged media compilation |
| Security | Node.js crypto | AES-256-GCM authenticated cipher for recovery keys |

      > **Tip:** 
        **Runtime Invariant:** Client code executes in modern ES6+ browsers. Server route handlers target Node.js 20+ LTS on Vercel Serverless Functions.
      

    

    
  

  
  
  
  
    

    
      ## Strict Two-Role Human User Model

      Per authoritative project requirements (`dfd-rules.md`), iReside enforces a strict **two-role human model**. There is **no human Admin or Super-Admin account** in user tables:

      
        - **Landlord (`role = 'landlord'`):** Property operator. Manages properties, draws visual floor maps, sets utility submeter rates, creates leases, verifies GCash/cash payments, and dispatches repair tickets.

        - **Tenant (`role = 'tenant'`):** Resident occupant. Reviews and signs leases, checks bills, uploads payment receipts, files repair tickets, and interacts on the community board.

      

      ## System-Level Service Role Operations

      Administrative, background, and automated operations bypass RLS via the Supabase **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`):

      
        - **Server-Only Scope:** Instantiated exclusively in `src/lib/supabase/admin.ts` via `createServiceRoleSupabaseClient()`. Never exposed to browser bundles.

        - **Turnkey Workspace Setup:** Used by `/api/setup/launch` to claim turnkey profiles, write auth metadata, and update passwords without lock stalls.

        - **Automated Cron Handlers:** Monthly invoice generation (`/api/cron/monthly-invoices`) reads across properties and units using service role authority.

      

      ## Role-Based Route Guard Enforcement

      
| Route Prefix | Required Role | Enforcement Layer |
| --- | --- | --- |
| /landlord/* | landlord | Next.js Middleware + requireAuthenticatedUser |
| /tenant/* | tenant | Next.js Middleware + requireAuthenticatedUser |
| /setup/* | landlord (pre-claim) | Session token guard + setup completed cookie |
| /api/cron/* | System Worker | Bearer token matching CRON_SECRET header |

      > **Babala / Paalala:** 
        **Security Rule:** If an authenticated tenant attempts to access `/landlord/*`, middleware automatically redirects to `/tenant/dashboard`.
      

    

    
  

  
  
  
  
    

    
      ## Required Environment Variables (`.env.local`)

      All sensitive credentials and endpoints must be populated in the production serverless environment prior to commissioning:

      
| Variable Name | Scope | Description & Constraints |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Public | HTTPS endpoint for Supabase project gateway. |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public | Public client JWT key. Strictly restricted by RLS. |
| SUPABASE_SERVICE_ROLE_KEY | Secret | Bypasses PostgreSQL RLS. Server-side only. |
| NEXT_PUBLIC_APP_URL | Public | Base URL (e.g. https://i-reside-capstone.vercel.app). |
| SECURITY_KEY_ENCRYPTION_SECRET | Secret | 32-byte hex secret key for AES-256-GCM spare keys. |
| CRON_SECRET | Secret | Bearer token authenticating Vercel cron endpoints. |
| SMTP_HOST, SMTP_PORT, etc. | Secret | Transactional SMTP credentials for 2FA OTP codes. |

      ## Cookie Governance & Client State Signals

      The application relies on secure, partitioned cookies to manage auth and state transitions:

      
        - **`ireside_setup_completed`:** Cookie set to `"true"` upon successful setup launch (Path: `/`, Max-Age: 31,536,000s, SameSite: `Lax`). Signals Next.js middleware that the workspace is claimed, avoiding client-side JWT refresh hangs.

        - **`sb-*-auth-token`:** Managed by `@supabase/ssr`. Stored as `HttpOnly`, `Secure`, `SameSite=Lax` to prevent XSS session exfiltration.

      

      > **Babala / Paalala:** 
        **DevOps Notice:** Never commit `.env.local` to version control. Set variables directly in Vercel Project Settings > Environment Variables.
      

    

    
  

  
  
  
  
    

    
      ## Entity Hierarchy: Properties & 2D Floor Plan

      Physical rental structures and visual layout units are represented in normalized PostgreSQL tables:

      

        
          
            profiles (id PK)

            role, email, phone
          
          
            1
            
              
              
            
            N
          
          
            properties (id PK)
            landlord_id FK, name
          
          
            1
            
              
              
            
            N
          
          
            units (id PK)
            property_id FK, rent, coords
          
        
      

      ## Core Database Table Definitions

      
| Table / Column | Data Type | Constraints & Domain Description |
| --- | --- | --- |
| public.profiles — Base identity table for all users |
| id | uuid | PK; references auth.users(id) ON DELETE CASCADE. |
| role | text | CHECK (role IN ('landlord', 'tenant')). |
| full_name | text | User's legal full name (max 50 chars). |
| avatar_bg_color | text | Hex code (defaults to brand violet #8B5CF6). |
| is_account_claimed | boolean | Indicates turnkey profile has been claimed. |
| public.properties — Real estate asset container |
| landlord_id | uuid | FK -> profiles(id); strictly owner-scoped. |
| property_type | text | 'apartment' | 'dormitory' | 'boarding_house'. |
| map_decorations | jsonb | Stores architectural walls, doors, stairs & branding. |
| public.units — Individual rentable rooms / units |
| status | text | 'vacant' | 'occupied' | 'maintenance' | 'reserved'. |
| position_x, _y | numeric | Cartesian grid coordinates on 2D visual planner. |
| monthly_rent | numeric(10,2) | Base monthly rent in Philippine Pesos (PHP). |

      > **Tip:** 
        **Data Integrity:** Deleting a property cascades to all contained units, floor plans, and decorations via foreign key cascade constraints.
      

    

    
  

  
  
  
  
    

    
      ## Financial Engine & Ledger Relational Architecture

      Tenant occupancy agreements, billing schedules, and utility submeters form an immutable audit chain:

      

        
          
            leases (id PK)

            unit_id, tenant_id
          
          
            1
            
              
              
            
            N
          
          
            invoices (id PK)
            amount_due, status
          
          
            1
            
              
              
            
            N
          
          
            payments (id PK)
            method, proof_url
          
        
      

      ## Financial Table Specifications

      
| Table / Column | Data Type | Description & Financial Governance |
| --- | --- | --- |
| public.leases — Legal tenancy contract records |
| tenant_id, landlord_id | uuid | FKs to profiles. Dual-party tenancy association. |
| status | text | 'pending_signature' | 'active' | 'terminated' | 'expired'. |
| contract_url | text | Permanent S3 storage URI to signed PDF lease agreement. |
| security_deposit | numeric(10,2) | Pre-collected refundable security deposit in PHP. |
| public.invoices — Periodic billing obligations |
| invoice_number | text | Unique human-readable reference (e.g. INV-2026-0042). |
| breakdown | jsonb | Itemized line items: rent, water, electric, waste, penalties. |
| status | text | 'pending' | 'paid' | 'overdue' | 'partially_paid'. |
| public.utility_submeters — Electricity and water logs |
| meter_type | text | 'electricity' (kWh) or 'water' (cubic meters). |
| previous_reading | numeric(10,2) | Meter index from preceding billing cycle. |
| current_reading | numeric(10,2) | Newly logged physical meter index. |
| rate_per_unit | numeric(10,2) | Configured tariff rate per unit (e.g. PHP 14.50 / kWh). |

      > **Tip:** 
        **Automated Computation:** Consumption = `current_reading - previous_reading`. Total Utility Charge = `consumption * rate_per_unit`.
      

    

    
  

  
  
  
  
    

    
      ## Operations, Communication & Security Tables

      Operational ticketing, direct resident communication, and security settings are tracked in dedicated relational schemas:

      
| Table / Column | Data Type | Description & Operational Function |
| --- | --- | --- |
| public.maintenance_requests — Repair tickets |
| category | text | 'plumbing' | 'electrical' | 'structural' | 'appliance'. |
| urgency | text | 'low' | 'medium' | 'high' | 'urgent'. |
| status | text | 'submitted' | 'in_progress' | 'resolved' | 'cancelled'. |
| photo_urls | text[] | Array of image storage URLs uploaded from phone camera. |
| ai_triage_notes | text | Groq/Llama triage recommendations for landlord action. |
| public.messages — Direct encrypted communication |
| sender_id, receiver_id | uuid | FKs to profiles. Enforces two-party message privacy. |
| body | text | Chat message content (max 500 characters). |
| read_at | timestamptz | Delivery and read receipt timestamp. |
| public.user_security_settings — Account recovery credentials |
| profile_id | uuid | PK; references profiles(id) ON DELETE CASCADE. |
| security_key_encrypted | text | AES-256-GCM ciphertext of single-use spare recovery key. |
| security_key_iv | text | Base64 initialization vector for AES-256-GCM. |
| security_key_auth_tag | text | Base64 authentication tag verifying ciphertext integrity. |
| security_key_failed_attempts | integer | Lockout counter for failed recovery attempts. |
| security_key_locked_until | timestamptz | Progressive lockout expiration timestamp. |

      > **Tip:** 
        **Audit Logging:** All security events (key rotation, recovery attempts, password updates) write immutable records to `public.audit_logs`.
      

    

    
  

  
  
  
  
    

    
      ## PostgreSQL Row-Level Security (RLS) Architecture

      iReside relies on PostgreSQL RLS to enforce mathematical tenant isolation directly at the database engine level. Client queries executed via `NEXT_PUBLIC_SUPABASE_ANON_KEY` run under the security context of the user's JWT:

      ```bash

-- Canonical Pattern: Restrict properties access strictly to the owner landlord
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords manage own properties"
ON public.properties FOR ALL TO authenticated
USING (landlord_id = auth.uid())
WITH CHECK (landlord_id = auth.uid());
```

      ## Authoritative RLS Policy Matrix

      
| Table | Operation | Enforced Policy Condition |
| --- | --- | --- |
| profiles | SELECT | Public directory fields readable; private fields self-only. |
| profiles | UPDATE | auth.uid() = id (users can only edit self). |
| properties | ALL | landlord_id = auth.uid(). |
| units | SELECT | Property owner OR Tenant holding active lease for unit. |
| units | WRITE | Property owner: landlord_id = auth.uid(). |
| leases | SELECT | tenant_id = auth.uid() OR landlord_id = auth.uid(). |
| invoices | SELECT | tenant_id = auth.uid() OR landlord_id = auth.uid(). |
| messages | SELECT/INSERT | sender_id = auth.uid() OR receiver_id = auth.uid(). |
| user_security_settings | ALL | profile_id = auth.uid() (recovery settings isolated). |

      > **Babala / Paalala:** 
        **RLS Governance:** Never disable RLS in production. Unit tests in `src/__tests__/` verify that tenants cannot query competitor properties or invoices.
      

    

    
  

  
  
  
  
    

    
      ## Two-Factor Authentication (2FA) Lifecycle

      For high-value accounts, 2FA provides defense against compromised credentials via email OTP challenges:

      

        
          User Authentication Gate (POST /api/auth/login)

          Verify Password • Inspect profiles.two_factor_enabled
        

        
          
            
            
            
            
            
            
          
        

        
          
            Branch A: If 2FA Enabled (OTP Challenge)
            
              Dispatch 6-Digit OTP via SMTP
              Rate limit (5 attempts / 15m)
            
            
              
              
                
                
              
            
            
              POST /api/auth/2fa/verify-login
              Timing-safe check • Issue Session Cookie
            
          

          
            Branch B: If 2FA Disabled (Direct Session)
            
              Issue Direct JWT Session
              Encrypted cookies via @supabase/ssr
            
            
              
              
                
                
              
            
            
              Portal Route Redirection
              Immediate navigate to /landlord or /tenant
            
          
        
      

      ## Session Guard & Middleware Implementation

      Every inbound request to protected routes passes through Next.js edge middleware (`src/middleware.ts`):

      
        - **Session Validation:** Reads Supabase auth tokens from request cookies using `@supabase/ssr`.

        - **Role Routing:** Extracts `user_metadata.role` from the JWT. Redirects unauthenticated sessions to `/auth/login` and wrong-role attempts to user portals.

        - **Setup Claim Bypass:** Inspects `ireside_setup_completed` cookie. If set, allows access to dashboard without blocking on client auth lock state.

      

      ## Security Hardening Standards

      
        - **Rate Limiting:** 5 failed OTP attempts triggers a 15-minute freeze.

        - **Constant-Time OTP Check:** OTP hashes are compared via timing-safe mechanisms.

        - **Strict Transport:** Enforces HTTPS with HSTS headers (`max-age=31536000`).

      

    

    
  

  
  
  
  
    

    
      ## The Emergency Spare Key Architecture

      To eliminate account lockout risks for non-technical landlords without depending on complex recovery email chains, iReside introduces the **Emergency Spare Key** (backed by **AES-256-GCM**):

      

        
          Key Generation (CSPRNG 16 Chars)

          ABCD - EFGH - JKLM - NPQR
        

        
          
            
            
            
            
            
            
          
        

        
          
            Plaintext Key to Landlord (One-Time)
            Physical Storage: Displayed once on screen; saved in physical safe or notebook. Never written to server logs.
          
          
            
              AES-256-GCM Cipher Encryption
              Secret: SECURITY_KEY_ENCRYPTION_SECRETIV: 12-byte random CSPRNG
            
            
              
              
                
                
              
            
            
              Persisted in user_security_settings
              Ciphertext + IV + 16-byte Auth Tag
            
          
        
      

      ## Cryptographic Implementation Specifications

      
| Parameter | Cryptographic Standard | Implementation Details |
| --- | --- | --- |
| Cipher Algorithm | AES-256-GCM | Authenticated encryption preventing ciphertext tampering. |
| Key Derivation | Master 256-bit Secret | Derived from SECURITY_KEY_ENCRYPTION_SECRET. |
| Initialization Vector | 12-Byte Random CSPRNG | Generated freshly per key via crypto.randomBytes(12). |
| Authentication Tag | 16-Byte GCM Tag | Guarantees ciphertext integrity before decryption. |
| Character Encoding | Base32 Safe Alphabet | Excludes ambiguous characters: 0, O, 1, I, l. |

      ## Single-Use Consumption & Progressive Lockout

      
        - **Single-Use Burning:** Successful recovery destroys the key in the database and immediately prompts for a new password and key rotation.

        - **Timing-Attack Immunity:** Decrypted candidate key is evaluated using `crypto.timingSafeEqual`.

        - **Progressive Lockout:** 3 failed attempts locks recovery for 30 minutes.

      

    

    
  

  
  
  
  
    

    
      ## The Turnkey Workspace Launch Lifecycle

      iReside supports instant deployment via pre-seeded turnkey properties. When the landlord finalizes customization, `POST /api/setup/launch` performs an atomic commissioning transaction:

      

        
          
            1

            
              Client POST & Validation
              `/api/setup/launch` • Zod schema
            
          
          
            2
            
              Service Role Admin Client
              Updates `auth.users` (email, pass, role)
            
          
          
            3
            
              Profile & Property Brand Sync
              Upserts `profiles` & business branding
            
          
          
            4
            
              Emergency Spare Key Gen
              AES-256-GCM encryption & persistence
            
          
          
            5
            
              Cookie Signaling
              Sets `ireside_setup_completed=true`
            
          
          
            6
            
              Client Dashboard Navigation
              `router.replace('/landlord/dashboard')`
            
          
        
      

      ## Step-by-Step Server Operations

      
        1. **Authentication Guard:** Verifies caller session via `requireAuthenticatedUser`, rejecting unverified users with HTTP 403 Forbidden.

        2. **Zod Input Validation:** Validates property name, archetype (apartment, dorm, boarding house), and operator credentials, rejecting preseeded test data.

        3. **Supabase Auth Finalization:** Calls `adminClient.auth.admin.updateUserById` to update official email, password, and sets `is_setup_completed: true`.

        4. **Profile & Property Branding:** Updates `profiles` table with business name, avatar color, and sets `has_changed_password: true`.

        5. **Cryptographic Key Issuance:** Generates and encrypts initial emergency spare key, storing ciphertext and returning plaintext once.

        6. **Cookie Issuance:** Sets `ireside_setup_completed=true` cookie (Path: `/`, SameSite: `Lax`), guaranteeing instant middleware clearance.

      

      > **Tip:** 
        **Non-Blocking Invariant:** The client executes `window.location.replace` without awaiting `refreshSession()`, avoiding browser lock deadlocks.
      

    

    
  

  
  
  
  
    

    
      ## Core Application API Directory

      All API routes reside under `src/app/api/` and adhere to RESTful standards with standardized JSON responses:

      
| HTTP Method & Endpoint | Role Required | Payload & Functional Purpose |
| --- | --- | --- |
| POST /api/setup/launch | landlord | Claims workspace; updates branding & sets spare key. |
| POST /api/auth/security-key/recover | Public / Auth | Recovers account using 16-character recovery spare key. |
| POST /api/auth/security-key/rotate | Authenticated | Invalidates current key and generates replacement. |
| POST /api/auth/2fa/challenge | Authenticated | Generates and dispatches 6-digit email OTP challenge. |
| POST /api/auth/2fa/verify-login | Public / 2FA | Verifies OTP code and mints full session cookie. |
| POST /api/landlord/properties | landlord | Creates property record with floor & unit counts. |
| GET /api/landlord/units/matrix | landlord | Fetches 2D coordinate grid and occupancy status. |
| POST /api/tenant/payments/submit | tenant | Submits GCash/bank reference number and receipt URL. |
| POST /api/landlord/payments/verify | landlord | Verifies or rejects payment proof for invoice. |
| POST /api/tenant/maintenance | tenant | Files repair ticket with photo URLs & AI triage note. |

      ## Standardized API Error Format

      ```bash

// HTTP 400 Bad Request / HTTP 500 Internal Error Contract
{
  "error": "Validation failed: Please check your input fields.",
  "details": { "monthlyRent": ["Must be greater than 0"] },
  "status": 400
}
```

      > **Tip:** 
        **HTTP Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `429 Too Many Requests`, `500 Server Error`.
      

    

    
  

  
  
  
  
    

    
      ## Mobile Client Architecture & Isolation

      iReside provides a native Android experience via a standalone Capacitor 7 wrapper. Per `mobile-apk-build.md`, all native source is strictly isolated inside `android/`:

      

        📦 **Web App Production Endpoint**
   https://i-reside-capstone.vercel.app/mobile

           ↓ *(Capacitor 7 Bridge (WebView))*

        📦 **Android Native Wrapper: android/ (Gradle 8.x)**
   Package: ph.ireside.mobile • Android SDK 34 • Java JBR 17/21

           ↓ *(Build Script: scripts/build-mobile.mjs)*

        📦 **Output Production Artifacts**
   output/iReside-release.apk (v1+v2 signed, zipalign verified)

      

      ## Toolchain Invariants & Build Commands

      
        - **JDK Requirement:** Must use Android Studio bundled JBR (`C:\Program Files\Android\Android Studio\jbr`). Incompatible system JDKs (such as Java 25) must NOT be invoked with AGP.

        - **Android SDK:** Resolved from `C:\Users\JV\AppData\Local\Android\Sdk`.

        - **Standard Production Build:**
          ```bash
npm run mobile:build
```

        

        - **Clean Rebuild & Cache Wipe:**
          ```bash
npm run mobile:build:clean
```

        

        - **Custom Endpoint Target:**
          ```bash
node scripts/build-mobile.mjs --url=https://custom-domain.app/mobile
```

        

      

      ## Artifact Distribution & Sync

      Upon compilation, `scripts/build-mobile.mjs` signs the release APK using v1 and v2 signature schemes, aligns the zip container, and automatically syncs the output to `public/downloads/iReside.apk` for direct web downloads.

    

    
  

  
  
  
  
    

    
      ## Vercel Serverless Cron Architecture

      Automated recurring jobs are declared in `vercel.json` and executed as serverless functions, secured by a shared bearer secret:

      

        
          
            Vercel Cron Schedulers

            Declared in vercel.json
          
          
            
            Bearer CRON_SECRET
            
              
              
            
          
          
            /api/cron/* Serverless Workers
            Monthly Invoices • Database Keep-Alive
          
        
      

      ```bash

// vercel.json Cron Declarations
{ "crons": [
  { "path": "/api/cron/monthly-invoices", "schedule": "0 0 1 * *" },
  { "path": "/api/cron/keep-alive",       "schedule": "0 */6 * * *" }
] }
```

      ## Production Cron Workers Specification

      
| Job & Schedule | Endpoint | Execution Logic & Safeguards |
| --- | --- | --- |
| Monthly Invoices0 0 1 * * (1st of month) | /api/cron/monthly-invoices | Scans active leases; fetches latest electricity/water consumption deltas; creates itemized invoices; dispatches email notifications. |
| Database Keep-Alive0 */6 * * * (Every 6h) | /api/cron/keep-alive | Executes a lightweight heartbeat query to PgBouncer pooler to prevent idle database pausing on starter tiers. |
| Lease Expiry Scanner0 12 * * * (Daily noon) | /api/cron/lease-reminders | Detects leases expiring in 30/15 days; alerts landlord and resident to initiate renewals. |

      ## Security & Authorization Guard

      All cron endpoints enforce bearer token validation before executing logic:

      ```bash

const authHeader = request.headers.get("Authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
}
```

      > **Tip:** 
        **Idempotency:** Invoice generator checks for existing invoices for the current billing period to prevent duplicate charges.
      

    

    
  

  
  
  
  
    

    
      ## Database Backup & Disaster Recovery Protocols

      To safeguard operational records against catastrophic loss, adhere to the following backup procedures:

      
        - **Continuous Cloud Backups:** Supabase automated WAL-G snapshots with point-in-time recovery (PITR).

        - **Manual Logical Dump (CLI):**
          ```bash
pg_dump -h db.[ref].supabase.co -U postgres -d postgres -F c -b -v -f ireside_backup.dump
```

        

        - **Database Restoration:**
          ```bash
pg_restore -h db.[ref].supabase.co -U postgres -d postgres -v ireside_backup.dump
```

        

      

      ## Common Incident Troubleshooting Runbook

      
| Incident Symptom | Root Cause | Resolution Procedure |
| --- | --- | --- |
| Setup launch hangs on client | Client refreshSession() deadlocked on navigator.locks. | Ensure ireside_setup_completed cookie is set; navigate via window.location.replace. |
| TypeScript build fails (tsc) | Out-of-sync schema types in src/types/database.ts. | Run npm run update-types to regenerate database TypeScript interfaces. |
| Storage upload 403 Forbidden | Missing or restrictive storage RLS policy on S3 bucket. | Apply migration 20260515035800_property_images_storage_policies.sql. |
| Android build fails with Java error | Incompatible Java 25 detected in system PATH. | Point JAVA_HOME to Android Studio JBR (C:\Program Files\Android\Android Studio\jbr). |

      > **Babala / Paalala:** 
        **Hotfix Protocol:** Commit bug fixes to development branch, verify with `npm run build`, then follow `mobile-merge-protocol.md` to deploy to master.
      

    

    
  

  
  
  
  
    

    
      ## Engineering Commissioning Sign-Off

      This sheet formally certifies that the iReside rental management platform has been inspected, tested, and validated against all security, database, and architectural standards:

      
| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Lead Systems Architect | __________________________ | ________________ | ___/___/2026 |
| Database Administrator | __________________________ | ________________ | ___/___/2026 |
| Oral Defense Panelist | __________________________ | ________________ | ___/___/2026 |

      ## IT Technical Helpline & Support Escalation

      
        - **DevOps Support Desk:** `devops@ireside.app`

        - **Emergency Operations Hotline:** (02) 8123-4567 • +63 917 123 4567

        - **GitHub Source Repository:** `https://github.com/JV/iReside`

      

      ## Technical Glossary for IT Personnel

      
| AES-256-GCM | Authenticated symmetric cipher providing confidentiality and integrity. |
| --- | --- |
| App Router | Next.js architecture supporting React Server Components and Edge functions. |
| BaaS | Backend-as-a-Service (Supabase PostgreSQL, Auth, Realtime, and S3 Storage). |
| Capacitor | Cross-platform runtime executing web applications inside native Android containers. |
| JBR | JetBrains / Android Studio bundled Java Runtime required for Gradle builds. |
| PgBouncer | Lightweight PostgreSQL connection pooler managing serverless connections. |
| RLS | Row-Level Security: PostgreSQL kernel mechanism isolating table rows by user. |
| Zod | TypeScript-first schema declaration and runtime input validation library. |

      
        &copy; 2026 iReside Technologies. All rights reserved. System turnover engineering specification.