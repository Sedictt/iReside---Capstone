# iReside 2-Device Live Defense Walkthrough Script & Setup Guide

**Property:** Fernando Gonzales Dormitory (24 rooms, 3 floors, Barangay Marulas, Valenzuela City)
**Shared Demo Password (All Accounts):** `Defense2026!`

---

## 1. Pre-Defense 2-Device Setup (Do This 5 Minutes Before Presenting)

Using **2 devices** side-by-side eliminates account switching during the demo:

### Device 1 — Landlord (Laptop / Main Projector Screen)
- **Account:** `john.gonzales@ireside.ph` / `Defense2026!`
- **Tab 1:** Logged in at `/landlord/dashboard` *(stays logged in for all 7 modules)*
- **Optional Backup Tab:** `/demo-console` *(only if a panelist asks to see another tenant state or you need 1-click DB Reset)*

### Device 2 — Tenant & Prospect (Second Laptop / Tablet / Phone)
- **Tab 1 (Primary Tenant — Stays logged in the entire time!):**
  - Log in once as **Joshua Miguel Dela Cruz** (`joshua.delacruz@ireside.ph` / `Defense2026!`, **Room 102**) at `/tenant/dashboard`
  - Works for **Modules 1, 2, 5, 6, and 7** without logging out.
- **Tab 2 (Module 3 — Public Application Portal):**
  - Pre-open `http://localhost:3000/apply/fgd-apply-online-2026` *(no login required, does not affect Joshua's session)*
- **Tab 3 (Module 4 — Katrina's Token Lease Signing Link):**
  - During Module 4, either copy Katrina's signing link directly from Device 1 (`/landlord/leases` → **Copy Signing Link**) or grab the latest `katrina_signing_link` from `output/defense-demo-ids.json` after each reseed *(works via JWT token without logging out Joshua)*.
- **Sample Image Ready on Device 2:** Keep one sample GCash receipt / ID image handy (e.g., `scripts/user-manual/sample-proof.png`) for Module 3 & Module 7 uploads.

### Reset Command (Before Defense & After Every Rehearsal)
```bash
node scripts/seed-defense-demo.mjs
```

---

## 2. Spoken Walkthrough Script (2-Device End-to-End Flow)

> **Delivery Note:** Maintain respectful `po` / `opo`, natural English technical/operational terms, and wait 1–2 seconds whenever switching focus between Device 1 and Device 2 so the panel sees the live update.

---

### Module 1: White-Label Branding
**Goal:** Show that landlords can customize the app with their own dormitory name, logo, and theme color—and tenants see the dormitory's identity across their portal.

* **[Device 1 — Landlord]** Open **System & Account** → **Settings** → **Logo, colors and banner** (`/landlord/settings?section=branding`).
> *"Good morning po sa ating mga panelists. Simulan po natin ang live walkthrough using two devices—ito pong main screen ay yung **Landlord** view, and ito pong pangalawang device ay yung **Tenant** view.*
>
> *Una po is yung **White-Label Branding**. Usually kasi, kapag gumagamit ng rental app ang maliliit na dormitories, pangalan ng software company yung nakikita ng tenants. Sa iReside po, yung landlord mismo ang may control sa identity ng property niya. Kung makikita po natin dito sa **Settings → Logo, colors and banner**, naka-set na yung property name na **Fernando Gonzales Dormitory**, yung tagline, at yung sarili nilang **FG Dormitory** logo."*

* **[Device 1 — Landlord]** Scroll to **Colors**, click **Royal Lavender** (or **Amber Sunset**) briefly so the live UI changes color, then click **Emerald Oasis** (or keep your chosen color) and click **Save changes** at the bottom bar.
> *"Pwede rin pong i-customize ng landlord yung color theme—isang click lang po, makikita na agad yung live preview. Then pag pinindot yung **Save changes**, mag-a-apply na ito sa buong system."*

* **[Device 2 — Tenant (Tab 1: Joshua)]** Refresh `/tenant/dashboard`.
> *"Now kung titingnan po natin dito sa **Tenant Device**, pag ni-refresh natin yung dashboard ni Joshua sa Room 102, agad-agad pong lumalabas yung **Fernando Gonzales Dormitory** logo, pangalan, at kulay—so para sa tenant, sariling portal ito ng dormitory nila."*

---

### Module 2: 2D Unit Map
**Goal:** Replace paper lists and spreadsheets with a visual floor-by-floor map of every room.

* **[Device 1 — Landlord]** Click **Unit Map** in the sidebar (`/landlord/unit-map`).
> *"Pangalawa po is yung **2D Unit Map**. Instead na nakasulat lang sa notebook or spreadsheet yung lists ng mga units, makikita po ng landlord dito yung actual floor layout ng buong dormitory—kung ano yung **Occupied** (blue), **Available / Vacant** (green), at **Under Maintenance** (red)."*

* **[Device 1 — Landlord]** Switch the floor dropdown (`FLOOR 1` → `SECOND FLOOR` → back to `FLOOR 1`). Click vacant **Room 103**, then click **Room 102** (Joshua).
> *"Pwede pong mag-switch per floor. Kapag clinick natin itong vacant na **Room 103**, makikita agad yung monthly rent na **₱4,500**. And kapag clinick natin yung **Room 102**, makikita agad sino yung tenant—si Joshua—pati yung active lease at open repair tickets niya."*

* **[Device 2 — Tenant (Tab 1: Joshua)]** Click **Unit Map** (`/tenant/unit-map`).
> *"Sa **Tenant Device** naman po, meron ding **View Only** 2D Unit Map si Joshua kung saan naka-highlight yung sarili niyang unit—**Room 102**—para malinaw sa kanya yung layout ng floor nila."*

---

### Module 3: Invite & Apply
**Goal:** Show contactless tenant application using a private invite link or QR code—without forcing applicants to create an account first.

* **[Device 1 — Landlord]** Click **Applications** (`/landlord/applications`) → click **Invite Manager**.
> *"Pangatlo po is **Invite & Apply**. Kapag may nag-inquire para sa vacant na Room 103, hindi na kailangan ng mahabang palitan ng chat sa Messenger. Dito po sa **Applications → Invite Manager**, makakagawa at makakapag-share yung landlord ng private invite link or QR code—pwede ring i-print sa lobby."*

* **[Device 2 — Tab 2 (Public Invite Link)]** Open `http://localhost:3000/apply/fgd-apply-online-2026`.
  * Select **Room 103 — ₱4,500/mo**.
  * Fill Step 1 (**Personal Details**):
    * Full Name: `Marco Antonio Reyes`
    * Email: `marco.reyes2026@gmail.com`
    * Phone: `9178452310`
    * Move-in Date: `2026-12-01`
    * Emergency Contact: `Elena Reyes` / `9185550192`
  * Click **Continue** → Step 2 (**Employment**): `IT Support Specialist` / `Valenzuela Tech Hub` / `24000` → **Continue**.
  * Step 3 (**Documents**): Upload sample ID/proof (or click **SET READY**) → **Continue** → **Submit Application**.
> *"Dito po sa **Tenant / Applicant Device**, once i-open ng applicant yung invite link, hindi niya kailangan mag-create ng account agad. Pipiliin lang niya yung vacant na **Room 103**, ilalagay yung personal at employment details niya, mag-u-upload ng valid ID, and then **Submit Application**."*

* **[Device 1 — Landlord]** Close Invite Manager and refresh `/landlord/applications` → click **PENDING** tab → click **View application** on the new entry.
> *"Pagbalik po sa **Landlord Device**, automatic na pong pumasok sa **Pending** queue yung application ni Marco kasama yung uploaded documents niya, ready for review and approval."*

---

### Module 4: Sign Lease (Digital Lease Signing)
**Goal:** End-to-end paperless lease signing with full audit trail.

* **[Device 1 — Landlord]** On `/landlord/applications`, click **APPROVED** (or open `/landlord/leases?id=ea37b3e5-e81c-4df9-b0fe-747e4f55cca8` for **Katrina Mae Villanueva, Room 201**) and click **Copy Signing Link**.
> *"Pang-apat po is **Digital Lease Signing**. Once ma-approve yung applicant—like si Katrina para sa Room 201—automatic nang generated yung Residential Lease Agreement niya na may curfew at house rules ng dorm. Dito po sa landlord view, naka-status siya as **Pending Tenant Signature**, at pwede i-copy yung secure signing link."*

* **[Device 2 — Tab 3 (Katrina's Signing Link)]** Open the copied signing link (or pre-opened `katrina_signing_link` from `output/defense-demo-ids.json`).
  * Click **Sign Document** → draw a signature directly on the contract → click **FINALIZE** → **Confirm & Finalize Signature**.
> *"Sa **Tenant Device**, pagbukas ni Katrina ng signing link, mababasa niya yung buong kontrata. Pipindutin lang niya yung **Sign Document**, pipirma gamit ang daliri o mouse, tapos **Finalize**. Hindi na kailangan magpa-print or maghintay ng personal meet-up para sa pirma."*

* **[Device 1 — Landlord]** Refresh Katrina's lease page (`/landlord/leases?id=ea37b3e5-e81c-4df9-b0fe-747e4f55cca8`) → click **Countersign Lease** → click **Sign Document** → draw landlord signature → click **Countersign & Activate** → **Confirm & Finalize Signature**.
> *"And dito po sa **Landlord Device**, magiging **Pending Landlord Signature** yung status. Magka-countersign lang si Mang John, and once finalized, **Active** na agad yung lease at recorded sa audit trail kung sino at kailan pumirma."*

---

### Module 5: iRis AI Assistant
**Goal:** Show practical AI support for both tenants (24/7 house-rule answers) and landlords (quick property summary).

* **[Device 2 — Tenant (Tab 1: Joshua)]** Click **Messages** (`/tenant/messages`) → click **iRis Assistant** → type and send:
  `Anong oras po ang curfew at pwede ba ang bisita sa Room 102?`
> *"Pang-lima po is **iRis AI**. Sa side ng tenant, mostly paulit-ulit yung tanong tungkol sa curfew, visitors, or Wi-Fi password. Dito sa **Messages → iRis Assistant**, nagtanong si Joshua in Taglish tungkol sa curfew at visitors ng Room 102. Kung makikita po natin, sumagot agad si iRis based sa actual dormitory policies ng Fernando Gonzales Dormitory—11:00 PM curfew, at visitors hanggang 9:00 PM sa ground-floor lounge lang."*

* **[Device 1 — Landlord]** Open **Analytics** (`/landlord/analytics`) → click the **iRis** mascot on the bottom-left to open **iRis Property Analysis**.
> *"Sa **Landlord Device** naman po under **Analytics**, tinutulungan ng iRis Property Analysis yung landlord na makita agad yung summary ng occupancy, earnings, at mga items na kailangan bantayan—without needing to read complicated charts."*

---

### Module 6: Repair & Chat
**Goal:** Show how a broken fixture report goes straight into the landlord's maintenance queue and stays synced with live messaging.

* **[Device 2 — Tenant (Tab 1: Joshua)]** Open **Maintenance** (`/tenant/maintenance`) → click **New Request**:
  * Title: `Tumutulo ang aircon sa Room 102`
  * Description: `May tumutulong tubig sa ilalim ng aircon unit tuwing gabi.`
  * Pick category → click **Submit Request**.
> *"Pang-anim po is **Repair & Chat**. Dati kasi, nakakalimutan yung mga repair requests dahil naisusulat lang sa papel or natatabunan sa Messenger. Sa **Tenant Device**, mag-su-submit si Joshua ng bagong maintenance request para sa tumutulong aircon sa Room 102."*

* **[Device 1 — Landlord]** Open **Maintenance** (`/landlord/maintenance`) to show the new ticket at the top, then open **Messages** (`/landlord/messages`) → click **Joshua Miguel Dela Cruz (Room 102)** → type and send:
  `Noted Joshua, papupuntahin ko na yung technician ngayong 2 PM.`
> *"Dito sa **Landlord Device**, pumasok agad sa **Maintenance** list yung ticket ni Joshua. Tapos sa **Messages**, naka-organize by tenant at room number yung inbox—mag-re-reply si Mang John ng update kung kailan darating yung technician."*

* **[Device 2 — Tenant (Tab 1: Joshua)]** Click **Messages** (`/tenant/messages`) → open **John Peter Gonzales**.
> *"And dito po sa **Tenant Device**, natanggap agad ni Joshua yung message sa live chat, so parehong tracked yung repair ticket at yung conversation."*

---

### Module 7: Utility Billing & GCash Bill
**Goal:** End-to-end submeter billing, GCash proof upload, landlord verification, and official receipt issuance—all on the same two accounts.

* **[Device 1 — Landlord]** Open **Utility Billing** (`/landlord/utility-billing`) to show electricity (`₱13.50/kWh`) and water (`₱35/m³`) submeter tracking.
> *"Pang-pito at huli po is **Utility Billing & GCash Bill**. Dito sa **Utility Billing**, ini-input yung water at electric meter readings per room para automatic yung pag-compute ng monthly bill—walang hulaan or doubts sa computation."*

* **[Device 2 — Tenant (Tab 1: Joshua)]** Open **Finance Hub** (`/tenant/payments`).
  * Point out Joshua's **November 2026** bill (`Base rent ₱4,500 + Water + Electricity`).
  * Click **Pay Now** → under GCash, type Reference #: `4029184756123` → upload `sample-proof.png` → click **Confirm & Settle Now**.
> *"Sa **Tenant Device**, makikita ni Joshua yung itemized bill niya—kasama yung rent, tubig, at kuryente. Pipindutin niya yung **Pay Now**, makikita niya yung GCash number at QR ng landlord, ilalagay yung 13-digit reference number, mag-u-upload ng screenshot ng receipt, then **Confirm & Settle Now**."*

* **[Device 1 — Landlord]** Open **Finance Hub** (`/landlord/invoices`) → click **To Verify** filter → click **Joshua Miguel Dela Cruz** (November 2026 bill) → inspect the uploaded receipt photo and reference number → click **Yes, the payment is correct** → confirm **Yes, the payment is correct**.
> *"Pagbalik sa **Landlord Device** sa **Finance Hub → To Verify**, makikita agad ni Mang John yung proof ni Joshua. Once i-check niya sa GCash app niya at tama yung reference number, isang click lang ng **Yes, the payment is correct**, automatic nang markado as **Paid** at may formal digital receipt na."*

* **[Device 2 — Tenant (Tab 1: Joshua)]** Refresh `/tenant/payments` → click **PAYMENT HISTORY**.
> *"And pag ni-refresh po natin yung **Tenant Device**, makikita na sa **Payment History** na **Paid** at **Receipted** na yung bill ni Joshua. Yun po ang end-to-end workflow ng iReside mula onboarding hanggang payments at maintenance. Maraming salamat po!"*

---

## 3. Quick Cheat Card (Copy-Paste Values During Defense)

| Item | Value |
|---|---|
| **Device 1 Login (Landlord)** | `john.gonzales@ireside.ph` / `Defense2026!` |
| **Device 2 Login (Primary Tenant)** | `joshua.delacruz@ireside.ph` / `Defense2026!` *(Room 102)* |
| **Public Invite URL (Module 3)** | `http://localhost:3000/apply/fgd-apply-online-2026` |
| **Katrina Signing Link (Module 4)** | Copy from Device 1 (`/landlord/leases`) or `output/defense-demo-ids.json` |
| **Applicant Sample (Module 3)** | `Marco Antonio Reyes` · `marco.reyes2026@gmail.com` · `9178452310` |
| **iRis AI Question (Module 5)** | `Anong oras po ang curfew at pwede ba ang bisita sa Room 102?` |
| **Repair Ticket (Module 6)** | `Tumutulo ang aircon sa Room 102` / `May tumutulong tubig sa ilalim ng aircon unit tuwing gabi.` |
| **Landlord Chat Reply (Module 6)** | `Noted Joshua, papupuntahin ko na yung technician ngayong 2 PM.` |
| **GCash Reference # (Module 7)** | `4029184756123` *(upload `scripts/user-manual/sample-proof.png`)* |
