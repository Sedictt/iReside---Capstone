# iReside

        ### PINAG-ISANG GABAY SA PAGGAMIT AT TEKNIKAL NA MANUAL

        *Para sa mga Tenant, Landlord, at IT Systems Engineers • Bersyon 1.0 (32 Pahina)*

---

      

      Bahagi I: Gabay sa Paggamit ng Tenant at Landlord
      
| 1. Pagsisimula (Kailangan, Pag-login, at App) | ... | Pahina 2–3 |
| --- | --- | --- |
| 2. Gabay sa Tenant (Kontrata, Bills, at Bayad) | ... | Pahina 4–5 |
| 3. Gabay sa Tenant (Sira, Chat, at Pag-alis) | ... | Pahina 6–7 |
| 4. Gabay sa Landlord (Gusali, Mapa, at Singilin) | ... | Pahina 8–9 |
| 5. Gabay sa Landlord (Tenant, Bayad, at Metro) | ... | Pahina 10–11 |
| 6. Gabay sa Landlord (Sira, Anunsyo, at Ulat) | ... | Pahina 12–13 |
| 7. Solusyon sa Problema at Seguridad | ... | Pahina 14–15 |
| 8. Suporta, Helpline, at Talasalitaan | ... | Pahina 16 |

      Bahagi II: IT Technical Documentation & Operations
      
| 9. System Overview & IT Handbook Directory | ... | Page 17 |
| --- | --- | --- |
| 10. System Architecture & Complete Tech Stack | ... | Page 18 |
| 11. Role Model & Service Role Operations (Zero Admin) | ... | Page 19 |
| 12. Environment Secrets & Cookie Governance | ... | Page 20 |
| 13. Database Schema: Profiles, Units & Floor Map | ... | Page 21 |
| 14. Database Schema: Leases, Financials & Submeters | ... | Page 22 |
| 15. Database Schema: Maintenance, Chat & Security | ... | Page 23 |
| 16. Row-Level Security (RLS) & Multi-Tenant Isolation | ... | Page 24 |
| 17. Authentication Engine, 2FA OTP & Session Guards | ... | Page 25 |
| 18. Cryptographic Emergency Spare Key Architecture | ... | Page 26 |
| 19. Workspace Claiming Lifecycle (/api/setup/launch) | ... | Page 27 |
| 20. Core REST API Endpoints & Webhook Lifecycle | ... | Page 28 |
| 21. Mobile Client Build Pipeline & Android Compilation | ... | Page 29 |
| 22. Automated Schedulers & Serverless Cron Workers | ... | Page 30 |
| 23. IT Operations, Disaster Recovery & Troubleshooting | ... | Page 31 |
| 24. Commissioning Sign-Off, Helpline & Glossary | ... | Page 32 |

    

    
  

  
  
  
  
    

    
      ## Mga Kailangan Bago Magsimula

      Bago buksan ang iReside, ihanda ang mga sumusunod na gamit:

      
        - **Smartphone o Computer:** Kahit anong Android, iPhone, o laptop.

        - **Internet o Mobile Data:** Kailangan ng koneksyon upang makapag-load.

        - **Email Address:** Dito ipapadala ang mga resibo at verification code.

        - **Login Details:** Ang email at pansamantalang password mula sa landlord.

      

      ## Paano Mag-Sign In sa Account

      Sundin ang mga hakbang na ito upang makapasok sa iReside:

      
        1. Buksan ang browser at pumunta sa website ng iReside.

        2. I-type ang iyong rehistradong email sa kahon ng **Email Address**.

        3. I-type ang iyong password sa kahon ng **Password**.

        4. Pindutin ang **Sign In** button.

        5. Kung hihingin ang 2FA, buksan ang email at kopyahin ang 6-digit code.

        6. I-type ang code sa **6-Digit Verification Code** at pindutin ang **Verify & Sign In**.

      

      
      > **Tip:** 
        Tip: Kung bago ang iyong account, hingin ang pansamantalang password sa iyong landlord.
      

      > **Babala / Paalala:** 
        Babala: Huwag ibigay ang iyong password o verification code kahit kanino. Lihim ito para sa iyong seguridad.
      

    

    
  

  
  
  
  
    

    
      ## Paano I-install ang App sa Phone

      Maaari mong ilagay ang iReside sa iyong cellphone para mabilis buksan:

      
        ### [Android] Pag-install sa Android Phone

        
          1. Pumunta sa kaliwang menu at pindutin ang **Download App**.

          2. Pindutin ang **Download iReside App** para makuha ang APK file.

          3. Buksan ang na-download na file at pindutin ang **Install**.

          4. Kapag nagtanong ang phone, pindutin ang **Allow**.

        

      

      
        ### [iPhone] Paglagay sa Home Screen ng iPhone

        
          1. Buksan ang Safari browser at puntahan ang iReside.

          2. Pindutin ang **Share** icon sa ibaba (kahon na may arrow).

          3. Piliin ang **Add to Home Screen** mula sa listahan.

          4. Pindutin ang **Add** sa kanang itaas ng screen.

        

      

      > **Tip:** 
        Tip: Pindutin ang **Allow** para makatanggap ng paalala sa buwanang renta at bayarin.
      

      ## Emergency Backup Key (Spare Key ng Account)

      Ang **Emergency Spare Key** ay ekstrang susi kung makalimutan mo ang password.

      
        1. Sa unang pag-login, lilitaw ang iyong Emergency Spare Key.

        2. Pindutin ang **Download (.txt)** button para mai-save ang key file.

        3. Lagyan ng tsek ang **I saved or wrote down my emergency key**.

        4. Pindutin ang **Proceed to Sign In** button upang magpatuloy.

        5. Itago ang file sa ligtas na folder o isulat sa kwaderno.

      

    

    
  

  
  
  
  
    

    
      
        ### [Gawain T1] Pumirma sa Kontrata ng Upa (Sign Lease)

        Bago tumira sa kuwarto, kailangang pirmahan ang digital na kasunduan:

        
          1. Sa menu, pindutin ang **Leases**.

          2. Sa itaas ng screen, pindutin ang **Review & sign** button.

          3. Basahin nang maigi ang buwanang renta, deposito, at mga patakaran.

          4. Pindutin ang **Sign Document** para buksan ang pirmahan.

          5. Gamitin ang iyong daliri o mouse upang gumuhit ng pirma sa screen.

          6. Pindutin ang **Finalize** at kumpirmahin ang iyong pirma.

        

        > **Tip:** 
          Tip: Pindutin ang **Download** anumang oras para sa sariling kopya ng kontrata.
        

      

      
        ### [Gawain T2] Paano Tingnan ang Monthly Bills at Dues

        Upang malaman ang halaga ng babayaran ngayong buwan:

        
          1. Sa kaliwang menu, pindutin ang **Finance Hub**.

          2. Sa itaas, makikita ang kabuuang halaga sa ilalim ng **Balance Due**.

          3. Tingnan ang **Due Date** upang malaman ang huling araw ng pagbabayad.

          4. Buksan ang tab na **Current Bill** para sa detalye ng renta, tubig, at kuryente.

        

      

      
      > **Tip:** 
        Tip: Makikita rin sa Current Bill tab ang breakdown ng renta at mga metro.
      

    

    
  

  
  
  
  
    

    
      
        ### [Gawain T3] Paano Magbayad Gamit ang GCash o Maya

        Maaari kang magbayad gamit ang iyong e-wallet nang hindi umaalis ng bahay:

        
          1. Pumunta sa **Finance Hub** at pindutin ang **Pay Now** button.

          2. Piliin ang **GCash** o **Maya** bilang payment method.

          3. I-scan ang QR code ng landlord o kopyahin ang nakasulat na numero.

          4. Buksan ang GCash o Maya app, magbayad, at kunan ng screenshot ang resibo.

          5. Sa ilalim ng **Transaction Receipt**, pindutin ang **Upload Screenshot**.

          6. I-type ang numero sa **Reference number** box at pindutin ang **Confirm & Settle Now**.

        

      

      
        ### [Gawain T4] Paano Magbayad ng Cash (Abot-Kamay)

        Kung nais magbayad ng pisikal na pera sa landlord:

        
          1. Sa screen ng checkout, piliin ang **Cash / In-Person**.

          2. Pindutin ang **Notify Landlord of Payment** button.

          3. Puntahan ang landlord at iabot ang eksaktong halaga ng bayad.

          4. Hintaying pindutin ng landlord ang **Confirm Cash Received** sa system.

          5. Sa **Payment History** tab, i-download ang opisyal na resibo.

        

      

      > **Babala / Paalala:** 
        Paalala: Siguraduhing tama ang na-type na Reference Number upang mabilis maaprubahan ang iyong bayad.
      

    

    
  

  
  
  
  
    

    
      
        ### [Gawain T5] Paano Mag-ulat ng Sira (Report Repair)

        Kapag may sirang ilaw, gripo, o pinto sa kuwarto, magsumite ng ticket:

        
          1. Sa kaliwang menu, pindutin ang **Maintenance**.

          2. Pindutin ang **New Request** button sa itaas.

          3. Piliin ang kategorya ng sira (Plumbing, Electrical, Furniture, o General).

          4. Sa kahon ng **Description**, isulat nang maikli ang nangyaring sira.

          5. Pindutin ang **Upload** button para maglagay ng litrato ng sira.

          6. Kung ikaw ang aayos, i-on ang switch ng **Self-Repair**.

          7. Pindutin ang **Submit Request** button.

        

      

      
      > **Tip:** 
        Tip: Kunan ng malinaw na litrato ang sira bago i-upload para mabilis maaksyunan.
      

      
        ### [Gawain T6] Paano Mag-chat sa Landlord (Messages)

        Para sa mga katanungan o simpleng pakikipag-ugnayan:

        
          1. Sa kaliwang menu, pindutin ang **Messages**.

          2. Piliin ang pangalan ng iyong landlord mula sa listahan.

          3. I-type ang iyong mensahe sa kahon sa ibaba ng chat.

          4. Pindutin ang **Send** button o pindutin ang Enter key.

        

      
    

    
  

  
  
  
  
    

    
      
        ### [Gawain T7] Paano Gamitin ang Unit Map at Facilities

        Maaari mong tingnan ang plano ng gusali at magreserba ng pasilidad:

        
          1. Pindutin ang **Unit Map** sa menu para makita ang 2D floor plan.

          2. Makikita rito kung nasaan ang iyong kuwarto, labasan, at hagdanan.

          3. Pindutin ang **Facilities** sa menu para sa mga amenities (gaya ng laundry).

          4. Piliin ang nais gamitin at pindutin ang **Book Amenity**.

          5. Piliin ang petsa at oras, tapos pindutin ang **Confirm Booking**.

        

      

      
        ### [Gawain T8] Paano Mag-request ng Renewal o Move-Out

        Kung malapit nang matapos ang iyong kontrata sa pag-upa:

        
          1. Sa kaliwang menu, pindutin ang **Leases**.

          2. Kung nais magpatuloy sa pagtira, pindutin ang **Request Renewal** button.

          3. Kung aalis na sa kuwarto, pindutin ang **Submit Move-Out Notice**.

          4. Piliin ang iyong target na araw ng pag-alis at ilagay ang dahilan.

          5. Pindutin ang **Submit Notice** button.

        

        > **Tip:** 
          Tip: Magsumite ng notice 30 araw bago umalis para maayos ang inspeksyon at refund.
        

      
    

    
  

  
  
  
  
    

    
      ## Ang 5-Stage Onboarding ng Landlord

      Kapag bago ang landlord account, kailangang tapusin ang 5 hakbang:

      
        1. **Step 1: Property Setup:** Pagrehistro ng gusali at mga unit.

        2. **Step 2: Unit Map Layout:** Paggawa ng visual 2D layout ng mga palapag.

        3. **Step 3: Utility & Billing Rails:** Pag-set ng rate sa kuryente, tubig, at GCash.

        4. **Step 4: Tenant Onboarding:** Pagpasok ng unang tenant sa kuwarto.

        5. **Step 5: Dashboard Overview:** Pagsisimula ng regular na pamamahala.

      

      
        ### [Gawain L1] Paano Magdagdag ng Bagong Property at Units

        Para irehistro ang iyong bagong paupahan sa system:

        
          1. Sa kaliwang menu, pindutin ang **Properties**.

          2. Pindutin ang **Add Property** button sa itaas.

          3. I-type ang pangalan ng gusali sa kahon ng **Property Name**.

          4. Piliin ang uri ng gusali: **Apartment**, **Dormitory**, o **Boarding House**.

          5. Pindutin ang **Continue** at ilagay ang units, floors, at address.

          6. Ilagay ang **Base Monthly Rent** at pindutin ang **Continue**.

          7. Pindutin ang **Complete & Save Property** button.

        

      

      
      > **Tip:** 
        Tip: Maaari kang magdagdag ng maraming gusali anumang oras sa pamamagitan ng Properties menu.
      

    

    
  

  
  
  
  
    

    
      
        ### [Gawain L2] Paano Isaayos ang Interactive Unit Map

        Gumawa ng malinaw na mapa ng bawat palapag para sa madaling pamamahala:

        
          1. Sa menu, pindutin ang **Unit Map**.

          2. Pumili ng layout preset (gaya ng **Double Loaded** o **Single Loaded**).

          3. I-drag at i-drop ang mga kahon ng unit upang itugma sa ayos ng iyong pasilyo.

          4. I-click ang unit upang palitan ang estado: **Vacant** o **Occupied**.

          5. Kusang naitatabi ang mapa sa ilalim ng **Saved to Cloud** badge.

        

      

      
        ### [Gawain L3] Paano I-set Up ang GCash at Utility Rates

        Bago mag-singil ng kuryente at tubig, itakda muna ang taripa:

        
          1. Sa menu, pindutin ang **Utility Billing**.

          2. Buksan ang tab na **Electricity & Water Rates**.

          3. I-type ang rate ng kuryente bawat kWh at tubig bawat metro kubiko.

          4. Pindutin ang **Save Changes** at pindutin ang **Confirm & Save**.

          5. Pumunta sa **Settings** at buksan ang **Payment methods**.

          6. I-type ang iyong **GCash Number** at i-upload ang iyong QR code.

          7. Pindutin ang **Save Changes** button.

        

      

      > **Tip:** 
        Tip: Siguraduhing malinaw ang QR code upang hindi mahirapan ang mga tenant sa pag-scan.
      

    

    
  

  
  
  
  
    

    
      
        ### [Gawain L4] Paano Magdagdag ng Tenant (Quick Add)

        Ito ang pinakamabilis na paraan kapag kaharap mo na ang umuupa:

        
          1. Sa menu, pindutin ang **Tenants** at pindutin ang **+ Add Tenant**.

          2. Piliin ang tab na **Quick Add**.

          3. I-type ang Buong Pangalan, Email Address, at Numero ng Telepono.

          4. Piliin ang gusali at ang tiyak na kuwarto sa **Unit** selector.

          5. I-type ang **Monthly Rent**, **Advance Rent**, at **Security Deposit**.

          6. Pindutin ang **Register Resident** button sa ibaba.

          7. Kopyahin ang temporary password mula sa screen at ibigay sa tenant.

        

      

      
        ### [Gawain L5] Paano Gumawa ng Onboarding Invite Link

        Para sa mga aplikante na gustong mag-fill up sa sarili nilang phone:

        
          1. Sa **Add Tenant** window, pindutin ang **Self-Onboarding Link**.

          2. Piliin ang unit at ilagay ang araw kung kailan mag-e-expire ang link.

          3. Pindutin ang **Generate Onboarding Link** button.

          4. Pindutin ang **Copy Link** o i-download ang QR code para mai-print sa bulletin board.

        

      

      
      > **Tip:** 
        Tip: Kopyahin at i-save agad ang pansamantalang password bago isara ang window.
      

    

    
  

  
  
  
  
    

    
      
        ### [Gawain L6] Paano Mag-verify ng Bayad at Resibo

        Kapag nagbayad ang tenant gamit ang GCash o nag-abot ng cash:

        
          1. Sa kaliwang menu, pindutin ang **Finance Hub**.

          2. Pindutin ang filter chip na **Needs Verification** sa itaas.

          3. I-click ang invoice para tingnan ang screenshot at Reference Number.

          4. I-check ang GCash app; kung pumasok ang pera, pindutin ang **Confirm & Issue Receipt**.

          5. Kung nag-abot ng cash sa kamay, pindutin ang **Confirm Cash Received**.

          6. Kusang maglalabas ang system ng digital official receipt para sa tenant.

        

      

      
        ### [Gawain L7] Paano Magbasa at Mag-compute ng Submeter

        Upang ma-compute ang konsumo sa kuryente at tubig bawat buwan:

        
          1. Sa menu, pumunta sa **Utility Billing**.

          2. Buksan ang tab na **Meter Readings**.

          3. I-type ang kasalukuyang numero mula sa metro sa bawat unit.

          4. Pindutin ang **Save Readings** upang mai-save ang mga numero.

          5. Pindutin ang **Send Monthly Bills** upang maipadala ang bill sa tenant.

        

      

      > **Babala / Paalala:** 
        Paalala: Huwag mag-kumpirma hangga't hindi nasisilip ang pumasok na pera sa iyong GCash o bangko.
      

    

    
  

  
  
  
  
    

    
      
        ### [Gawain L8] Paano Mag-asikaso ng Maintenance Requests

        Kapag nagsumite ng ulat ng sira ang tenant, asikasuhin ito agad:

        
          1. Sa kaliwang menu, pindutin ang **Maintenance**.

          2. I-click ang tiket na may pulang marka o may nakasulat na **Pending**.

          3. Basahin ang reklamo at tingnan ang litratong ipinadala ng tenant.

          4. Piliin ang gagawa: **Landlord Repair** o **Third Party Repair**.

          5. Pindutin ang **To Process** button.

          6. Kapag tapos nang ayusin ang sira, pindutin ang **Mark as Completed** button.

        

      

      
      > **Tip:** 
        Tip: Makikita ng lahat ng mga residente ang anunsyo sa kanilang dashboard.
      

      
        ### [Gawain L9] Paano Mag-post ng Anunsyo sa Community Hub

        Magpadala ng anunsyo sa lahat ng tenant (hal. water interruption):

        
          1. Sa kaliwang menu, pindutin ang **Community Hub**.

          2. Sa itaas ng composer, piliin ang **Announcement** tab.

          3. I-type ang buong detalye ng iyong mahalagang paalala sa mga residente.

          4. Pindutin ang **Photo** kung may nais ilakip na litrato.

          5. Pindutin ang **Publish** button sa kanang ibaba.

        

      
    

    
  

  
  
  
  
    

    
      
        ### [Gawain L10] Paano Iproseso ang Move-Out at Deposito

        Kapag aalis na ang tenant, ayusin ang clearance at deposito:

        
          1. Sa menu, pindutin ang **Move-Out Requests**.

          2. I-click ang kahilingan ng aalis na tenant para buksan ang inspection form.

          3. Suriin ang kuwarto. Ilagay ang anumang bawas para sa sira o naiwang bills.

          4. Pindutin ang **Save Inspection Results** button.

          5. Sa lumabas na confirmation dialog, pindutin ang **Confirm & Save**.

          6. Kusang magiging **Vacant** ang kuwarto sa Unit Map para mapaupahan muli.

        

      

      
        ### [Gawain L11] Paano Mag-download ng Reports at Documents

        Kung kailangan mong mag-print ng ulat ng kita para sa buwan:

        
          1. Pindutin ang **Analytics** sa menu para sa ulat ng koleksyon at occupancy.

          2. Sa **Finance Hub**, buksan ang **Unified Ledger** para sa buong talaan.

          3. Pindutin ang **Export to PDF** o **CSV Export** button.

          4. Maaari mo na itong buksan o i-print gamit ang printer.

        

      

      > **Tip:** 
        Tip: I-save ang Move-Out inspection form para sa iyong sariling rekord at accounting.
      

    

    
  

  
  
  
  
    

    
      ## Mga Karaniwang Problema at Solusyon

      
        **1. Nakalimutan ko ang aking password. Ano ang gagawin ko?**

        Sa login screen, pindutin ang **Forgot Password?**. I-type ang iyong email upang makatanggap ng link. Kung mayroon kang Emergency Spare Key, gamitin ito upang buksan agad ang account.

      

      
        **2. Hindi dumarating ang 6-digit code sa aking email.**

        Tingnan ang iyong Spam o Junk folder. Siguraduhing tama ang spelling ng email. Maghintay ng 60 segundo at pindutin ang **Resend Code** button.

      

      
        **3. Ayaw pumasok o mag-upload ng litrato ng resibo.**

        Suriin kung malakas ang internet o mobile data. Kung masyadong malaki ang file, kumuha ng bagong screenshot ng resibo bago i-upload muli.

      

      
        **4. May mali sa pangalan o renta sa aking kontrata.**

        Huwag munang pirmahan ang kontrata. Magpadala agad ng chat sa landlord sa pamamagitan ng **Messages** upang maiwasto ang detalye.

      

      
        **5. Nagbayad na ako sa GCash pero "Unpaid" pa rin ang status.**

        Kailangan munang kumpirmahin ng landlord ang bayad. Pagkapindot ng **Confirm & Issue Receipt**, lalabas ang opisyal na resibo.

      

      
        **6. Naka-lock ang ilang menu sa kaliwa (may padlock icon).**

        Tapusin muna ang naunang hakbang sa onboarding. Kusang magbubukas ang iba pang menu.

      
    

    
  

  
  
  
  
    

    
      ## Mga Payong Pangkaligtasan (Safety Tips)

      
        - **Lihim na Password:** Huwag ibahagi ang password kahit kanino. Gumamit ng titik at numero.

        - **Itago ang Emergency Key:** I-save ang spare key sa sariling flash drive o kwaderno.

        - **Mag-ingat sa Pekeng Mensahe:** Huwag mag-log in sa mga link sa text. Gamitin ang opisyal na website.

        - **I-save ang Resibo:** Kumuha ng screenshot ng reference number at itago ang digital resibo.

        - **Proteksyon sa Impormasyon:** Naka-encrypt ang iyong mga ID. Ang landlord lamang ang makakakita nito.

      

      ## Mga Madalas Itanong (FAQs)

      
        **T: Pwede bang mag-log in sa dalawang cellphone nang sabay?**

        S: Oo. Maaari kang mag-log in sa cellphone at computer gamit ang iisang account.

      

      
        **T: Libre ba ang paggamit ng app para sa tenant?**

        S: Oo, libre ang app para sa lahat ng mga rehistradong tenant.

      

      
        **T: Paano kung mawalan ng kuryente habang nagbabasa ng metro?**

        S: Kusang naitatabi ang iyong mga ginagawa sa system, kaya hindi mawawala ang iyong na-type.

      
    

    
  

  
  
  
  
    

    
      ## Saan Kukuha ng Tulong at Suporta

      Kung may katanungan o kailangan ng tulong sa system:

      
        - **Email Support:** support@ireside.app

        - **Helpline:** (02) 8123-4567 o +63 917 123 4567

        - **Opisyal na Website:** https://i-reside-capstone.vercel.app

        - **Oras ng Tanggapan:** Lunes hanggang Biyernes, 8:00 AM – 5:00 PM

      

      > **Babala / Paalala:** 
        Sa oras ng emergency: Tumawag agad sa hotline 911 o sa barangay hall.
      

      ## Maikling Talasalitaan (Glossary)

      - **Account:** Ang iyong sariling profile gamit ang email at password.

      - **Dashboard:** Ang unang pahina na nagpapakita ng buod ng iyong paupahan.

      - **Download:** Pag-save ng file o resibo sa iyong sariling gamit.

      - **Due Date:** Ang takdang araw kung kailan dapat bayaran ang bills.

      - **E-Signature:** Digital na pirma gamit ang daliri o mouse sa screen.

      - **Lease:** Legal na kasunduan o kontrata sa pag-upa ng kuwarto.

      - **Password:** Lihim na salita o numero para sa seguridad ng account.

      - **QR Code:** Parisukat na barcode na ini-scan upang magbayad o mag-download.

      - **Submeter:** Sariling metro ng kuryente o tubig sa bawat kuwarto.

      - **2FA:** Karagdagang 6-digit code sa email para sa dagdag na proteksyon.

      - **Upload:** Pagpapadala ng file o litrato mula sa phone papunta sa system.

      
        © 2026 iReside Technologies. All rights reserved. Nilimbag para sa pampublikong gabay.
      

    

    
  

  
  
  
  
    

    
      
        # BAHAGI II

        ### IT TECHNICAL & SYSTEM ADMINISTRATION HANDBOOK

        *Doc Ref: IR-IT-2026-V1 • Architecture, Database Governance & Runbook • Revision 1.0*

---

      

      ## Executive System Overview

      **iReside** is an enterprise rental property platform engineered for Philippine multi-family housing, boarding houses, and dormitories (Barangay Marulas pilot). It unifies tenant onboarding, interactive 2D unit maps, submeter utility billing, and maintenance ticketing into a decoupled cloud-native system.

      The system is architected around a strict two-role human model (**Landlord** and **Tenant**; no human admin accounts per `dfd-rules.md`). Automated operations, setup claiming, and maintenance crons execute through system service role tokens.

      ## Part II Table of Contents (IT Reference)

      
| 10. System Architecture & Complete Tech Stack | ... | Page 18 |
| --- | --- | --- |
| 11. Role Model & Service Role Operations (Zero Admin) | ... | Page 19 |
| 12. Environment Secrets & Cookie Governance | ... | Page 20 |
| 13. Database Schema: Profiles, Units & Floor Map | ... | Page 21 |
| 14. Database Schema: Leases, Financials & Submeters | ... | Page 22 |
| 15. Database Schema: Maintenance, Chat & Security | ... | Page 23 |
| 16. Row-Level Security (RLS) & Multi-Tenant Isolation | ... | Page 24 |
| 17. Authentication Engine, 2FA OTP & Session Guards | ... | Page 25 |
| 18. Cryptographic Emergency Spare Key Architecture | ... | Page 26 |
| 19. Workspace Claiming Lifecycle (/api/setup/launch) | ... | Page 27 |
| 20. Core REST API Endpoints & Webhook Lifecycle | ... | Page 28 |
| 21. Mobile Client Build Pipeline & Android Compilation | ... | Page 29 |
| 22. Automated Schedulers & Serverless Cron Workers | ... | Page 30 |
| 23. IT Operations, Disaster Recovery & Troubleshooting | ... | Page 31 |
| 24. Commissioning Sign-Off, Helpline & Glossary | ... | Page 32 |

    

    
  

  
  
  
  
    

    
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