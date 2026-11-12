# Appendix: Client & Intended Market User Interview Transcript
## Requirements Elicitation & System Specification Phase

**Project Title:** iReside: Property & Tenant Services Management System  
**Document Type:** Formal Interview Transcript & Requirements Mapping  
**Date of Interview:** October 15, 2025  
**Location:** Fernando Gonzales Dormitory, 27 M. H. del Pilar Street, Barangay Marulas, Valenzuela City  
**Interviewee:** John Peter Gonzales *(Property Owner / Landlord)*  
**Interviewer:** Joseph Venedict Tillo *(Lead Developer & Researcher)*  

---

### Interview Background & Objectives
This semi-structured interview was conducted as part of the Capstone 1 system requirements elicitation phase. The primary objective was to investigate the actual operational pain points, manual tracking bottlenecks, and financial reconciliation challenges encountered by micro-to-medium rental housing operators in Valenzuela City, Metro Manila. The insights gathered directly informed the functional specifications, database design, and user experience workflows of the iReside platform.

---

### Verbatim Transcript (Filipino / Taglish)

**Interviewer:** Magandang araw po, Mang John. Maraming salamat po sa pagpapaunlak niyo sa amin para sa interview na ito. Para po ito sa aming Capstone project kung saan gumagawa kami ng property management system para sa mga apartment at dormitoryo. Gusto lang po naming maintindihan nang mabuti kung ano yung mga tunay na nararanasan ninyong hirap sa araw-araw na pagpapatakbo ng inyong mga paupahan.

**Interviewee (Mang John):** Walang anuman, Joseph. Maganda nga yang ginagawa niyo kasi sa totoo lang, kung titingnan mo sa labas, akala ng marami kapag may paupahan ka, upo ka na lang at hihintayin mo na lang pumasok ang pera. Pero ang totoo niyan, napakaraming abala at sakit sa ulo, lalo na kapag marami ka nang kwartong pinapamahalaan. Sige, ano ba yung mga gusto ninyong malaman?

---

#### I. Pagsubaybay sa Bayad, GCash, at Singilan (Financial Rails & Invoicing)

**Interviewer:** Unang-una po, Mang John, paano niyo po kasalukuyang sinusubaybayan ang mga bayarin ng mga nangungupahan buwan-buwan?

**Interviewee:** Sa ngayon, halo-halo ang paraan ko. May notebook ako kung saan nakasulat yung mga pangalan at room number nila, tapos may gumagamit din ako ng simpleng Excel sa laptop kapag may oras ako mag-update. Kaso ang nagiging problema, hindi naman sabay-sabay magbayad ang mga yan. Ang due date kadalasan kinsenas o katapusan, pero may magsasabi, “Mang John, next week na lang po paglabas ng sahod.” Tapos yung iba, makakalimutan mo na kung sino na ba yung nakapag-down o sino yung may balanse pa. Minsan may nangungupahan na magpupumilit na bayad na raw sila nung nakaraang buwan, eh wala kaming maipakitang malinaw na resibo o talaan kundi yung sulat-kamay ko sa notebook na minsan nababasa o nawawala pa.

**Interviewer:** Paano naman po kapag online sila nagbabayad, tulad ng GCash o kaya Bank Transfer?

**Interviewee:** Naku, isa pa yan sa pinakamalaking sakit ng ulo ko! Karamihan sa mga estudyante at nagtatrabahong umuupa rito, puro GCash na ang gamit. Ang ginagawa nila, magsesend sila ng pera, tapos ise-screenshot yung resibo at ipapadala sa akin sa Messenger. Eh isipin mo, may mahigit dalawampung kwarto ako rito. Sa Messenger, sabay-sabay magchachat: may nagtatanong kung may bakante, may nagrereklamo sa tubig, tapos doon din isesend yung bayad. Natatabunan! Ang mas mahirap pa, minsan hindi pangalan ng tenant yung nasa GCash. Halimbawa, nanay pala o kapatid niya ang nag-send, ibang pangalan ang lumabas. Tapos magmemessage sa akin, “Kuya, nasend ko na po yung bayad.” Hindi ko tuloy alam kung kaninong kwarto ibabawas yun! Minsan nga, may nagpasa pa ng lumang screenshot ng nakaraang buwan, mabuti na lang napansin ko yung petsa. Kaya kung may sistema sana na may sariling lalagyan ng reference number at litrato ng bayad na pwede kong i-verify bago ma-tag na bayad, napakalaking ginhawa nun sa akin.

---

#### II. Submeter ng Kuryente at Tubig (Utility Billing Calculation)

**Interviewer:** Tungkol naman po sa mga sub-meter ng kuryente at tubig, paano po ang kasalukuyang proseso ninyo sa pagkuha ng konsumo at pagkukwenta ng babayaran ng bawat kwarto?

**Interviewee:** Mano-mano talaga. Bawat dulo ng buwan, umiikot ako sa bawat palapag dala yung ballpen, papel, at flashlight. Tinitingnan ko yung metro ng kuryente at submeter ng tubig sa labas ng bawat kwarto. Tapos babalik ako sa lamesa ko, gagamit ako ng calculator. Ibabawas ko yung lumang reading sa bagong reading para makuha yung konsumo, tapos i-mumultiply ko sa rate ng Meralco o Maynilad.

**Interviewer:** May mga pagkakataon po ba na nagkakaroon ng hindi pagkakaunawaan o reklamo tungkol sa computation ng utilities?

**Interviewee:** Madalas! Halos buwan-buwan may nagtatanong, “Mang John, bakit ang taas ng kuryente ko ngayon? Eh tuwing gabi lang naman ako nandito.” Minsan nagdududa sila na baka dinaya ko yung kwenta o baka nagkamali ako sa pagpindot sa calculator. Nakakapagod magpaliwanag nang paulit-ulit. Kaya ang gusto ko talaga, kung may app o system, ilalagay ko na lang yung bagong reading, tapos kusa na niyang kukunin yung nakaraang reading at awtomatikong magko-compute gamit yung fixed rate. At higit sa lahat, makikita sana ng tenant sa sarili nilang phone yung breakdown—kung ilang kilowatt-hour o cubic meter ang nagamit nila pati na yung litrato nung metro kung maaari. Pag malinaw at transparent, walang magdududa.

---

#### III. Unit Map at Floor Layout (Interactive Spatial Visualizer)

**Interviewer:** Kapag may nagtatanong po na bagong aplikante o naghahanap ng mauupahan, paano niyo po tinutukoy kung aling mga kwarto ang bakante o nasa maayos na kondisyon?

**Interviewee:** Dati kapag may walk-in na nagtatanong sa baba, aalalahanin ko pa sa isip ko o aakyat pa ako sa 2nd o 3rd floor para tingnan kung alin ba ang walang tao. Minsan magsasabi yung customer, “Gusto ko po sana sa second floor, yung malapit sa bintana o malayo sa hagdan.” Eh sa notebook ko, room number lang ang nakalista—101, 202, 305. Hindi mo visual na nakikita kung saan banda nakapwesto yung kwarto o kung katabi ba ng banyo. Minsan nga, napangakuan ko yung isang nag-inquire sa Room 204, tapos pag-akyat ko, naalala ko may tagas pa pala yung lababo doon at ginagawa pa, kaya napahiya ako.

**Interviewer:** Kung magkakaroon po ng visual na 2D layout o Interactive Unit Map sa screen kung saan kitang-kita ang bawat palapag, unit number, at status kung Occupied, Vacant, o Under Maintenance—makakatulong po ba ito sa inyo?

**Interviewee:** Ay naku, napakaganda niyan! Isang pindot mo lang sa screen, alam mo na agad kung saan nakapwesto ang bawat kwarto nang hindi mo kailangang umakyat sa ikatlong palapag. Tapos kung may sira o ginagawa, madaling mamarkahan na ‘Maintenance’ para hindi maituro sa bagong uupa. Malaking tulong lalo na sa mga katulad kong may edad na at medyo sumasakit na ang tuhod kapag akyat-manaog sa hagdan.

---

#### IV. Move-in Terms: Advance Rent at Security Deposit

**Interviewer:** Paano niyo naman po pinanghahawakan ang Advance Rent at Security Deposit kapag may bagong papasok na tenant, at ano po ang nagiging problema rito kapag aalis na sila?

**Interviewee:** Ang policy natin, one month advance at one month deposit bago lumipat. Ang nagiging sakit ng ulo diyan, kapag magpapaalam na yung tenant na aalis sila sa susunod na buwan, ang sasabihin agad nila: “Mang John, gamitin ko na lang po yung deposit ko para sa huling buwan ng upa ko.” Eh bawal yun! Kasi ang security deposit, nakalaan yan sakaling may masira silang gripo, bintana, o kaya kapag iniwanan nila akong malaking unpaid balance sa kuryente at tubig. Kapag pinayagan mong maubos yung deposit bilang upa, pagka-turnover ng susi at pag-alis nila, wala ka nang mahahabol kahit giba-giba ang kwarto.

**Interviewer:** Ibig sabihin po, kailangan talaga na magkahiwalay ang pagtala ng regular na upa sa hawak na Security Deposit at Advance?

**Interviewee:** Oo, dapat nakahiwalay talaga yan sa record. Para malinaw na ang deposit ay hindi pwedeng galawin o ibawas basta-basta sa buwanang upa hangga't hindi natatapos ang pormal na turnover at clearance pagka-alis nila.

---

#### V. Pagtanggap ng Tenant: Online Invite Link vs. Walk-in Registration

**Interviewer:** Sa pagpapasok po ng bagong nangungupahan, mas gusto niyo po ba na kayo ang nag-eencode ng kanilang impormasyon, o mas gusto niyo na sila mismo ang maglagay sa kanilang cellphone?

**Interviewee:** Depende sa klase ng umuupa. Halimbawa, yung mga estudyante mula Fatima o PLV, sanay sa cellphone yang mga yan. Mas madali kung bibigyan ko na lang sila ng link sa Messenger o ipapa-scan ko sa kanila, tapos sila na mismo ang maglalagay ng buong pangalan nila, emergency contact number ng mga magulang nila, at mag-a-upload ng valid ID. Pero may mga nangungupahan din ako na mga trabahador sa pabrika o mga matatanda na walk-in, yung mga hindi masyadong marunong sa mga app o minsan walang data. Sa mga ganun, kailangan kaya ko pa ring i-encode nang diretso sa dashboard ko yung detalye nila. Kaya mas maganda kung parehong paraan ay pwedeng gawin sa sistema.

---

#### VI. Pag-uulat ng mga Sira at Maintenance (Ticketing with Photo Evidence)

**Interviewer:** Paano po kasalukuyang nagrereklamo o nag-uulat ang mga tenant kapag may sirang gripo, ilaw, o tagas sa kanilang mga kwarto?

**Interviewee:** Kadalasan sinasabi lang nila kapag nagkasalubong kami sa hallway, o kaya itetext ako ng “Mang John, may sira po sa banyo.” Ang problema diyan, kapag verbal, madalas kong makalimutan lalo na pag marami akong ginagawa. Pangalawa, hindi ko alam kung anong eksaktong sira. Tatawag ako ng tubero o electrician, pagdating sa kwarto, mali pala yung dinalang piyesa o gamit kasi akala gripo lang, yun pala basag na yung mismong PVC pipe sa ilalim! Sayang ang pamasahe at araw nung trabahador. 

**Interviewer:** Ano po ang magiging pakinabang kung magkakaroon ng maintenance ticket kung saan kailangang mag-attach ng litrato ang tenant ng sirang gamit?

**Interviewee:** Naku, malaking bagay yun! Bago pa man pumunta yung karpintero o tubero, ipapakita ko na sa kanya yung litrato sa cellphone: “O tignan mo, ito yung tagas sa Room 102, bumili ka na agad ng ganitong selyo at pandikit.” At saka maganda rin para may tracking kami kung sino yung unang nag-report para patas, at para alam ko kung aling mga kwarto ang pabalik-balik ang sira para maipagawa nang pangmatagalan.

---

#### VII. Pamamahala at Pag-aari ng Sistema (Direct Landlord Control vs. Third-Party Admin)

**Interviewer:** Bilang panghuling katanungan po, kung gagamit po kayo ng ganitong sistema, mas komportable po ba kayo na kayo mismo ang may direktang kontrol at pagmamay-ari sa inyong data, o mas gusto niyo na may ibang kumpanya o external admin na humahawak ng records ninyo?

**Interviewee:** Mas gusto ko siyempre na ako mismo ang may hawak ng paupahan ko. Negosyo ko ito eh, at pribadong impormasyon ng mga tenant ko at ng kinikita ko ang nakalagay diyan. Ayoko ng sistema na kailangan ko pang magmakaawa o magbayad buwan-buwan sa kung sinong ahensya o third-party admin para lang baguhin ang upa o para tingnan ang sarili kong income. Ang kailangan namin ay isang sistema na madaling gamitin, diretso sa amin, at kapag tinurnover ninyo sa amin ay amin na talaga at gumagana nang maayos sa browser o telepono.

**Interviewer:** Maliwanag na maliwanag po, Mang John. Lahat po ng mga nabanggit ninyo—mula sa resibo ng GCash, submeter computation, visual na unit map, hanggang sa maayos na maintenance ticketing at direct control—ay isasama po namin sa disenyo ng iReside. Maraming salamat po sa inyong oras at tulong para sa aming Capstone!

**Interviewee:** Walang anuman, Joseph. Excited din ako na makita yan kapag natapos niyo. Malaking tulong yan sa mga katulad naming nagpapatakbo ng paupahan dito sa komunidad. Galingan ninyo sa defense niyo!

---

### System Requirements Traceability Matrix (Defense Justification Guide)

| System Module / Feature | Panel Question / Defense Invalidation Risk | Documented User Requirement & Client Justification |
| :--- | :--- | :--- |
| **Interactive 2D Unit Map** (`/landlord/unit-map`) | *"Why build a complex visual 2D floor layout instead of a simple database table or grid?"* | **Section III:** Landlords manage multi-floor facilities where room layout, proximity to stairs/windows, and current physical condition matter to prospective tenants. The 2D map eliminates physical stair-climbing and prevents double-booking rooms undergoing repairs. |
| **Utility Submeter Automated Calculation** (`/landlord/utility-billing`) | *"Why include utility billing calculation? Isn't rent ledger management sufficient for a property app?"* | **Section II:** Submeter utilities are the single highest source of tenant friction and accounting doubt. Automated calculation based on current vs. previous readings, coupled with photo proof and transparent breakdown, eliminates human math errors and disputes. |
| **Payment Verification & Proof Upload** (`/landlord/invoices`) | *"Why require landlord verification for GCash / Bank transfers rather than auto-marking them as paid?"* | **Section I:** Messenger screenshots are buried and lack transactional linkage. Senders often use third-party names (e.g. parents/relatives), and risks of forged/recycled GCash receipts require explicit landlord verification before ledger settlement. |
| **Segregated Security Deposit & Advance Rails** | *"Why separate Security Deposit tracking from the regular Monthly Rent balance?"* | **Section IV:** Tenants frequently attempt to offset their final month's rent with their security deposit ("ibawas sa deposit"), leaving landlords unprotected against unpaid utility bills or damaged fixtures upon property turnover. |
| **Dual Onboarding (Invite Link & Quick Add)** (`/landlord/tenants`) | *"Why support both self-service digital links and direct landlord data entry?"* | **Section V:** Accommodates heterogeneous tenant demographics: tech-literate university students prefer mobile self-registration, while non-technical walk-in industrial workers require direct in-person landlord onboarding. |
| **Photo-Evidence Maintenance Ticketing** (`/landlord/maintenance`) | *"Why implement structured ticketing with photo uploads instead of relying on standard SMS/chat?"* | **Section VI:** Verbal and text reports lead to forgotten work orders and incorrect replacement parts being dispatched. Visual photographic evidence ensures contractors arrive with the appropriate tools and materials. |
| **Two-Role Architecture (Landlord & Tenant Only)** | *"Why is there no overarching System Administrator role in the database?"* | **Section VII:** Guarantees technical sovereignty and financial privacy. Micro-to-medium landlords reject recurring third-party admin subscriptions and centralized surveillance over their rental income and tenant data. |
