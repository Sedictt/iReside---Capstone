import { getCommonCss } from './manual-common-css.mjs';

export function buildUserManualHtml({ withScreenshots = true } = {}) {
  const css = getCommonCss();

  // Screen figures vs text tables
  const screenLogin = `
      <div class="screenshot-figure">
        <img src="images/screen-login.png" alt="Login Screen" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 1: Screen ng Pag-sign In (Email, Password, at Sign In button)</div>
      </div>`;

  const textLogin = `
      <table>
        <thead>
          <tr>
            <th>Hakbang sa Pag-login</th>
            <th>Aksyon ng Gumagamit</th>
            <th>Tugon ng Sistema</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Ilagay ang Detalye</strong></td>
            <td>I-type ang email at pansamantalang password.</td>
            <td>Titingnan ng sistema ang rehistradong account.</td>
          </tr>
          <tr>
            <td><strong>2. Kunin ang Code</strong></td>
            <td>Kunin ang 6-digit passcode sa email.</td>
            <td>Bisa ang code sa loob ng sampung minuto.</td>
          </tr>
          <tr>
            <td><strong>3. Pagpapatunay</strong></td>
            <td>I-type ang code sa verification prompt.</td>
            <td>Dadalhin ka agad sa dashboard ng iyong role.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Pamantayan sa Pag-login:</strong> Pinoprotektahan ng 2FA ang mga account laban sa hindi awtorisadong pag-access.
      </div>`;

  const screenFinance = `
      <div class="screenshot-figure">
        <img src="images/screen-finance-hub.png" alt="Finance Hub Screen" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 2: Finance Hub (Kabuuang Balance Due at Upload Payment button)</div>
      </div>`;

  const textFinance = `
      <table>
        <thead>
          <tr>
            <th>Yugto ng Pagbabayad</th>
            <th>Responsableng Tao</th>
            <th>Dokumentong Katibayan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Pagpasa ng Bayad</strong></td>
            <td>Umuupang Residente</td>
            <td>Mag-upload ng resibo na may reference number.</td>
          </tr>
          <tr>
            <td><strong>2. Pagsusuri</strong></td>
            <td>Accounting Ledger</td>
            <td>Ilalagay ang bayad sa pending review ledger.</td>
          </tr>
          <tr>
            <td><strong>3. Pag-apruba</strong></td>
            <td>May-ari ng Paupahan</td>
            <td>Kukumpirmahin ang bayad at maglalabas ng resibo.</td>
          </tr>
          <tr>
            <td><strong>4. Resibo</strong></td>
            <td>Sistema ng iReside</td>
            <td>Awtomatikong magbibigay ng opisyal na electronic resibo.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Paalala sa Bayad:</strong> Tiyaking tama ang 13-digit GCash reference number bago isumite.
      </div>`;

  const screenMaintenance = `
      <div class="screenshot-figure">
        <img src="images/screen-maintenance-request.png" alt="Maintenance Request Form" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 3: Form ng Pag-ulat ng Sira (Kategorya, Detalye, at Upload Photo)</div>
      </div>`;

  const textMaintenance = `
      <table>
        <thead>
          <tr>
            <th>Yugto ng Pagkumpuni</th>
            <th>Responsableng Tao</th>
            <th>Pamantayan sa Aksyon</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Pagsumite ng Tiket</strong></td>
            <td>Umuupang Residente</td>
            <td>Maglagay ng malinaw na paliwanag at litrato.</td>
          </tr>
          <tr>
            <td><strong>2. Pagtakda ng Gawain</strong></td>
            <td>May-ari ng Paupahan</td>
            <td>Titingnan ang sira at magtatalaga ng tagakumpuni.</td>
          </tr>
          <tr>
            <td><strong>3. Pagkumpuni</strong></td>
            <td>Itinalagang Tagakumpuni</td>
            <td>Aayusin ang sira at titingnan kung maayos.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Paalala sa Sira:</strong> Kumuha ng malinaw na litrato upang mabilis maaksyunan ang pagkumpuni.
      </div>`;

  const screenAddProperty = `
      <div class="screenshot-figure">
        <img src="images/screen-add-property.png" alt="Add Property Modal" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 4: Modal ng Pagdagdag ng Property (Pangalan, Lokasyon, at Palapag)</div>
      </div>`;

  const textAddProperty = `
      <table>
        <thead>
          <tr>
            <th>Preset ng Gusali</th>
            <th>Ayos ng Pasilyo</th>
            <th>Uri ng Paupahan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Double Loaded</strong></td>
            <td>Gitnang pasilyo na may mga kuwarto sa magkabilang gilid.</td>
            <td>Mga apartment at boarding house na may palapag.</td>
          </tr>
          <tr>
            <td><strong>Single Loaded</strong></td>
            <td>Isahang pasilyo na may bukas na rehas o balkonahe.</td>
            <td>Mga row house at paupahang may bukas na daanan.</td>
          </tr>
          <tr>
            <td><strong>U-Shape Layout</strong></td>
            <td>Tatlong panig na gusali na nakapalibot sa bakuran.</td>
            <td>Mga compound at gated residential rental properties.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Pamantayan sa Mapa:</strong> I-drag ang room cards sa grid upang tumugma sa pasilyo.
      </div>`;

  const screenAddTenant = `
      <div class="screenshot-figure">
        <img src="images/screen-add-tenant.png" alt="Add Tenant Modal" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 5: Window ng Pagdagdag ng Umuupa (Quick Add at Invite Link)</div>
      </div>`;

  const textAddTenant = `
      <table>
        <thead>
          <tr>
            <th>Paraan ng Pagdagdag</th>
            <th>Pamamaraan sa Paggawa</th>
            <th>Pangunahing Pakinabang</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Quick Add Form</strong></td>
            <td>Direktang ilalagay ng may-ari ang detalye.</td>
            <td>Mabilis na account para sa walk-in na umuupa.</td>
          </tr>
          <tr>
            <td><strong>Self-Onboarding Link</strong></td>
            <td>Sasagutan ng aplikante ang form sa cellphone.</td>
            <td>Walang abala sa papel para sa malayuang aplikasyon.</td>
          </tr>
          <tr>
            <td><strong>QR Code Poster</strong></td>
            <td>I-scan ng aplikante ang nakadikit na poster.</td>
            <td>Mabilis na pag-access habang tinitingnan ang kuwarto.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Pamantayan sa Pagdagdag:</strong> Suriin ang ID at cellphone number bago maglabas ng kontrata.
      </div>`;

  const screenMaintenanceLandlord = `
      <div class="screenshot-figure">
        <img src="images/screen-maintenance-management.png" alt="Maintenance Ticket Management" class="screenshot-img" />
        <div class="screenshot-caption">Larawan 6: Pamamahala ng Tiket ng Pagkumpuni (To Process at Mark as Completed)</div>
      </div>`;

  const textMaintenanceLandlord = `
      <table>
        <thead>
          <tr>
            <th>Uri ng Paunawa</th>
            <th>Saklaw ng Anunsyo</th>
            <th>Antas ng Priyoridad</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Abiso sa Utility</strong></td>
            <td>Nakatakdang pagkawala ng tubig o kuryente.</td>
            <td>Mataas na priority banner sa dashboard.</td>
          </tr>
          <tr>
            <td><strong>Paalala sa Bayad</strong></td>
            <td>Paparating na takdang petsa ng upa.</td>
            <td>Karaniwang paalala sa notification feed.</td>
          </tr>
          <tr>
            <td><strong>Tuntunin sa Gusali</strong></td>
            <td>Oras ng katahimikan at tapunan ng basura.</td>
            <td>Paskil sa community bulletin board.</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        <strong>Pamantayan sa Anunsyo:</strong> Makikita agad ang mga anunsyo sa mobile dashboard ng mga umuupa.
      </div>`;

  return `<!DOCTYPE html>
<html lang="fil">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>iReside - Gabay sa Paggamit (User Manual)</title>
  <style>
${css}
  </style>
</head>
<body>

<div class="book-container">

  <!-- ========================================================================= -->
  <!-- PAHINA 1: DEDICATED ENTERPRISE COVER PAGE                                 -->
  <!-- ========================================================================= -->
  <div class="page cover-page" id="page-1">
    <div class="cover-frame">
      <div class="cover-header-top">
        <span>Republika ng Pilipinas &bull; Lungsod ng Valenzuela</span>
        <span>Brgy. Marulas Pilot</span>
      </div>

      <div class="cover-hero">
        <div class="cover-wordmark">iReside</div>
        <div class="cover-tagline">Matalinong Pamamahala ng Paupahan sa Marulas</div>
        <div class="cover-rule"></div>
        <div class="cover-title">GABAY SA PAGGAMIT NG SISTEMA</div>
        <div class="cover-subtitle">Opisyal na Alituntunin sa Operasyon ng May-ari at Umuupa</div>
      </div>

      <div class="cover-emblem-wrap">
        <img src="images/ireside-logo-bw.png" alt="iReside Logo" class="cover-logo-img" />
      </div>

      <table class="cover-doc-table">
        <tr>
          <td class="meta-label">ID ng Dokumento</td>
          <td class="meta-value">DOC REF: IR-USER-2026-FIL-V1.0</td>
        </tr>
        <tr>
          <td class="meta-label">Klasipikasyon</td>
          <td class="meta-value">Opisyal na Gabay sa Operasyon &bull; Edisyong Filipino (16 Pahina)</td>
        </tr>
        <tr>
          <td class="meta-label">Mambabasa</td>
          <td class="meta-value">May-ari ng Paupahan, Katiwala, at mga Umuupang Residente</td>
        </tr>
        <tr>
          <td class="meta-label">Saklaw</td>
          <td class="meta-value">Pagdagdag ng Gusali, Mapa ng Kuwarto, Kontrata, Bayad, at Tiket</td>
        </tr>
        <tr>
          <td class="meta-label">Lugar ng Pilot</td>
          <td class="meta-value">Barangay Marulas Pilot Implementation, Valenzuela City</td>
        </tr>
      </table>

      <div class="cover-imprint">
        <span>Inilathala ng iReside Documentation &amp; Systems Engineering Team</span>
        <span>Awtorisadong Edisyon sa Operasyon &bull; 2026</span>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 2: TALAAN NG NILALAMAN & PAMANTAYAN SA OPERASYON                   -->
  <!-- ========================================================================= -->
  <div class="page" id="page-2">
    <div class="running-header">
      <span class="app-brand">iReside Operasyon</span>
      <span>Direktoryo at Pangkalahatang Pananaw</span>
    </div>

    <div class="content">
      <h2>Talaan ng Nilalaman</h2>
      <table class="toc-table">
        <tr>
          <td class="toc-title">1. Simula: Mga Kinakailangan at Pag-sign In</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 3</td>
        </tr>
        <tr>
          <td class="toc-title">2. Simula: Setup ng App at Emergency Spare Key</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 4</td>
        </tr>
        <tr>
          <td class="toc-title">3. Gabay ng Umuupa: Digital Kontrata at Buwanang Bayarin</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 5</td>
        </tr>
        <tr>
          <td class="toc-title">4. Gabay ng Umuupa: Pagbabayad ng Upa Gamit ang GCash at Cash</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 6</td>
        </tr>
        <tr>
          <td class="toc-title">5. Gabay ng Umuupa: Pag-ulat ng Sira at Direktang Mensahe</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 7</td>
        </tr>
        <tr>
          <td class="toc-title">6. Gabay ng Umuupa: Paunawa sa Paglipat at Pag-login Gamit ang Susi</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 8</td>
        </tr>
        <tr>
          <td class="toc-title">7. Gabay ng May-ari: Pagrehistro ng Gusali at Mapa ng Kuwarto</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 9</td>
        </tr>
        <tr>
          <td class="toc-title">8. Gabay ng May-ari: Singil sa Kuryente at Pagdagdag ng Umuupa</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 10</td>
        </tr>
        <tr>
          <td class="toc-title">9. Gabay ng May-ari: Invite Links at mga Walk-in na Aplikante</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 11</td>
        </tr>
        <tr>
          <td class="toc-title">10. Gabay ng May-ari: Pagkumpirma ng Bayad at Submeter</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 12</td>
        </tr>
        <tr>
          <td class="toc-title">11. Gabay ng May-ari: Pagkumpuni at mga Anunsyo sa Gusali</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 13</td>
        </tr>
        <tr>
          <td class="toc-title">12. Gabay ng May-ari: Pag-alis ng Umuupa at Ulat sa Pananalapi</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 14</td>
        </tr>
        <tr>
          <td class="toc-title">13. Pagresolba ng mga Karaniwang Problema at Seguridad</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 15</td>
        </tr>
        <tr>
          <td class="toc-title">14. Helpline, Madalas Itanong, at Glosaryo ng mga Termino</td>
          <td><div class="toc-leader"></div></td>
          <td class="toc-page">Pahina 16</td>
        </tr>
      </table>

      <h2>Layunin at Saklaw</h2>
      <p>Ang <strong>iReside</strong> ay isang cloud platform para sa pamamahala ng paupahan.</p>
      <p>Pinapadali nito ang paniningil ng upa, submeter ng tubig at kuryente, at pagkumpuni.</p>
      <p>Ipinapakita ng gabay na ito ang karaniwang operasyon para sa may-ari at umuupa.</p>
      <p>Ang lahat ng hakbang ay tumutugma sa opisyal na software sa produksyon.</p>

      <h2>Mga Pamantayan sa Operasyon at Arkitektura</h2>
      <table>
        <thead>
          <tr>
            <th>Pamantayang Haligi</th>
            <th>Pagpapatupad sa Sistema</th>
            <th>Tuntunin sa Operasyon</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Dalawang Role Lamang</strong></td>
            <td>Mahigpit na paghihiwalay ng May-ari at Umuupa.</td>
            <td>Walang admin backdoors o human admin accounts.</td>
          </tr>
          <tr>
            <td><strong>Pagsunod sa Batas</strong></td>
            <td>Sumusunod sa RA 10173 at RA 8792.</td>
            <td>Garantiya sa privacy at digital signature.</td>
          </tr>
          <tr>
            <td><strong>Pag-access sa App</strong></td>
            <td>Progressive Web App at Android APK.</td>
            <td>Maaaring gamitin sa cellphone o kompyuter.</td>
          </tr>
        </tbody>
      </table>

      <div class="tip-box">
        <strong>Pamantayan sa Gabay:</strong> Sundin ang mga numero ng hakbang upang maging maayos ang paggamit.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 2 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 3: SIMULA - MGA KINAKAILANGAN AT PAG-SIGN IN                       -->
  <!-- ========================================================================= -->
  <div class="page" id="page-3">
    <div class="running-header">
      <span class="app-brand">Unang Hakbang</span>
      <span>Mga Kinakailangan at Pag-sign In</span>
    </div>

    <div class="content">
      <h2>Mga Kailangan Bago Magsimula</h2>
      <p>Ihanda ang mga sumusunod bago buksan ang iReside portal:</p>
      <ul>
        <li><strong>Smartphone o Kompyuter:</strong> Anumang Android phone, iPhone, o laptop.</li>
        <li><strong>Koneksyon sa Internet:</strong> Aktibong Wi-Fi o mobile data load.</li>
        <li><strong>Aktibong Email Address:</strong> Para sa verification code at resibo.</li>
        <li><strong>Mga Kredensyal:</strong> Email at password mula sa pamunuan.</li>
      </ul>

      <h2>Paano Mag-sign In sa Iyong Account</h2>
      <p>Sundin ang mga hakbang na ito upang makapasok sa portal:</p>
      <ol>
        <li>Buksan ang browser at pumunta sa opisyal na iReside website.</li>
        <li>I-type ang rehistradong email sa <strong>Email Address</strong> field.</li>
        <li>I-type ang iyong password sa <strong>Password</strong> field.</li>
        <li>Pindutin ang <strong>Sign In</strong> button sa ibaba.</li>
        <li>Tingnan ang 6-digit verification code na ipinadala sa iyong email.</li>
        <li>I-type ang code sa <strong>6-Digit Verification Code</strong> at i-click ang <strong>Verify &amp; Sign In</strong>.</li>
      </ol>

      <h2>Talahanayan ng Kredensyal at Pagpapatunay</h2>
      <table>
        <thead>
          <tr>
            <th>Field ng Kredensyal</th>
            <th>Uri ng Input</th>
            <th>Tuntunin sa Pagsusuri</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Email Address</strong></td>
            <td>Karaniwang wastong email</td>
            <td>Dapat tugma sa profile record.</td>
          </tr>
          <tr>
            <td><strong>Password ng Account</strong></td>
            <td>Hindi bababa sa 8 karakter</td>
            <td>Case-sensitive na mga titik at numero.</td>
          </tr>
          <tr>
            <td><strong>Verification Code</strong></td>
            <td>6-digit numeric OTP code</td>
            <td>Mawawalan ng bisa makalipas ang 10 minuto.</td>
          </tr>
        </tbody>
      </table>

      ${withScreenshots ? screenLogin : textLogin}

      <div class="warning-box">
        Babala: Huwag ibigay ang iyong password o verification code kaninoman. Panatilihing lihim ito.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 3 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 4: SIMULA - SETUP NG APP AT EMERGENCY SPARE KEY                    -->
  <!-- ========================================================================= -->
  <div class="page" id="page-4">
    <div class="running-header">
      <span class="app-brand">Unang Hakbang</span>
      <span>Setup ng App at Spare Key</span>
    </div>

    <div class="content">
      <h2>Paano I-install ang Mobile App</h2>
      <p>Maaari mong i-install ang iReside sa iyong cellphone para sa mabilisang access:</p>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Android</span> Pag-install sa Android Phone</div>
        <ol>
          <li>Buksan ang kaliwang menu at pindutin ang <strong>Download App</strong>.</li>
          <li>Pindutin ang <strong>Download iReside App</strong> upang i-save ang APK.</li>
          <li>Buksan ang na-download na file at pindutin ang <strong>Install</strong>.</li>
          <li>Kapag nagtanong ang Android security, piliin ang <strong>Allow</strong>.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">iPhone</span> Pagdagdag sa iPhone Home Screen</div>
        <ol>
          <li>Buksan ang Safari browser at pumunta sa iReside portal.</li>
          <li>Pindutin ang <strong>Share</strong> button sa ibaba ng screen.</li>
          <li>Mag-scroll pababa at pindutin ang <strong>Add to Home Screen</strong>.</li>
          <li>Pindutin ang <strong>Add</strong> sa kanang itaas upang matapos.</li>
        </ol>
      </div>

      <h2>Kakayahan ng Cellphone at mga Kinakailangan</h2>
      <table>
        <thead>
          <tr>
            <th>Uri ng Platform</th>
            <th>Pinakamababang Sistema</th>
            <th>Mga Sinusuportahang Gamit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Android Client</strong></td>
            <td>Android 8.0 (Oreo) o mas bago</td>
            <td>Native APK, notification alerts, at camera uploads.</td>
          </tr>
          <tr>
            <td><strong>Apple iOS</strong></td>
            <td>iOS 14.0 o mas bago</td>
            <td>Safari Home Screen PWA at camera uploads.</td>
          </tr>
          <tr>
            <td><strong>Desktop Browser</strong></td>
            <td>Chrome, Firefox, Safari, Edge</td>
            <td>Keyboard navigation, dual monitors, at reports.</td>
          </tr>
        </tbody>
      </table>

      <h2>Ang Emergency Spare Key (Pagbawi ng Account)</h2>
      <p>Tulad ng ekstrang susi sa bahay, magagamit ito kapag nawala ang cellphone.</p>

      <h2>Mga Detalye ng Emergency Spare Key</h2>
      <table>
        <thead>
          <tr>
            <th>Katangian ng Susi</th>
            <th>Pamantayang Teknikal</th>
            <th>Tuntunin sa Pag-iingat</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Anyo ng Code</strong></td>
            <td>16 na malalaking titik at numero</td>
            <td>Nahahati sa apat na pangkat na may gitling.</td>
          </tr>
          <tr>
            <td><strong>Paraan ng Pag-save</strong></td>
            <td>One-way bcrypt cryptographic hash</td>
            <td>Hindi nakatago online ang tunay na teksto.</td>
          </tr>
          <tr>
            <td><strong>Limitasyon sa Gamit</strong></td>
            <td>Isang beses lamang magagamit</td>
            <td>Awtomatikong pinapalitan pagkatapos mag-login.</td>
          </tr>
        </tbody>
      </table>

      <div class="tip-box">
        Itago ang iyong Emergency Spare Key sa flash drive o isulat sa ligtas na papel.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 4 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 5: GABAY NG UMUUPA - KONTRATA AT BUWANANG BAYARIN                  -->
  <!-- ========================================================================= -->
  <div class="page" id="page-5">
    <div class="running-header">
      <span class="app-brand">Gabay ng Umuupa</span>
      <span>Kontrata at Buwanang Bayarin</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T1</span> Lumagda sa Digital na Kontrata (Sign Lease)</div>
        <p>Bago lumipat sa kuwarto, kailangang pirmahan ng umuupa ang kontrata:</p>
        <ol>
          <li>Pindutin ang <strong>Leases</strong> sa kaliwang menu.</li>
          <li>Pindutin ang <strong>Review &amp; sign</strong> button sa itaas ng screen.</li>
          <li>Basahin nang maigi ang buwanang upa, deposito, at mga patakaran.</li>
          <li>Pindutin ang <strong>Sign Document</strong> upang buksan ang signature pad.</li>
          <li>Guhit ang iyong lagda gamit ang daliri o mouse.</li>
          <li>Pindutin ang <strong>Finalize</strong> at kumpirmahin upang maipasa ang kontrata.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T2</span> Tingnan ang Buwanang Upa at Bayarin</div>
        <p>Alamin ang iyong bayarin sa upa, submeter, at nakaraang bayad:</p>
        <ol>
          <li>Pindutin ang <strong>Finance Hub</strong> sa navigation menu.</li>
          <li>Tingnan ang balanse sa ilalim ng <strong>Total Balance Due</strong>.</li>
          <li>Tingnan ang konsumo sa tubig at kuryente sa submeter.</li>
          <li>Alamin ang petsa ng bayad upang maiwasan ang multa.</li>
          <li>Pindutin ang <strong>View Statement</strong> upang makita ang singil.</li>
        </ol>
      </div>

      <h2>Mga Tuntunin sa Kontrata at Singil sa Upa</h2>
      <table>
        <thead>
          <tr>
            <th>Uri ng Bayarin</th>
            <th>Tuntunin ng Patakaran</th>
            <th>Tungkulin ng Umuupa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Buwanang Upa</strong></td>
            <td>Dapat bayaran sa unang araw ng buwan.</td>
            <td>Magsumite agad ng resibo ng bayad.</td>
          </tr>
          <tr>
            <td><strong>Security Deposit</strong></td>
            <td>Garantiya sa sira at naiwang singil.</td>
            <td>Ibabalik sa loob ng 15 araw paglipat.</td>
          </tr>
          <tr>
            <td><strong>Unpaid / Overdue</strong></td>
            <td>Singil na dapat nang bayaran ngayon.</td>
            <td>Bayaran agad upang walang abala o multa.</td>
          </tr>
          <tr>
            <td><strong>Paid / Pending</strong></td>
            <td>Bayad na o sinusuri pa ng may-ari.</td>
            <td>I-download at itago ang digital na resibo.</td>
          </tr>
        </tbody>
      </table>

      <h2>Pamantayan sa Pangungupahan at Batas</h2>
      <table>
        <thead>
          <tr>
            <th>Batas / Alituntunin</th>
            <th>Itinatakda ng Batas</th>
            <th>Patakaran sa Sistema</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Rent Control Act</strong></td>
            <td>Limitasyon sa taunang pagtaas ng upa.</td>
            <td>Sinusunod ang limitasyon sa presyo.</td>
          </tr>
          <tr>
            <td><strong>Security Deposit</strong></td>
            <td>Hanggang dalawang buwang deposito lamang.</td>
            <td>Nililimitahan ang halaga sa pag-set up.</td>
          </tr>
          <tr>
            <td><strong>Grace Period</strong></td>
            <td>Karaniwang 5 araw na palugit sa bayad.</td>
            <td>Ipinapataw ang multa pagkatapos ng palugit.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 5 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 6: GABAY NG UMUUPA - BAYAD SA UPA AT MGA RESIBO                    -->
  <!-- ========================================================================= -->
  <div class="page" id="page-6">
    <div class="running-header">
      <span class="app-brand">Gabay ng Umuupa</span>
      <span>Bayad sa Upa at mga Resibo</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T3</span> Magbayad ng Upa Gamit ang GCash o Maya</div>
        <p>Maaari kang magbayad ng upa gamit ang cellphone nang hindi lumalabas ng bahay:</p>
        <ol>
          <li>Buksan ang <strong>Finance Hub</strong> at pindutin ang <strong>Upload Payment</strong>.</li>
          <li>I-scan ang GCash QR code o kopyahin ang mobile number ng may-ari.</li>
          <li>Tapusin ang bayad sa GCash at kumuha ng screenshot ng resibo.</li>
          <li>Bumalik sa iReside at i-upload ang screenshot ng resibo.</li>
          <li>I-type ang eksaktong <strong>Reference Number</strong> mula sa resibo.</li>
          <li>Pindutin ang <strong>Submit Payment</strong> upang maipasa sa may-ari.</li>
        </ol>
      </div>

      ${withScreenshots ? screenFinance : textFinance}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T4</span> Magbayad ng Cash sa May-ari</div>
        <p>Kung nais mong magbayad ng pisikal na pera nang direkta sa may-ari:</p>
        <ol>
          <li>Pumunta sa opisina ng may-ari at iabot ang eksaktong halaga.</li>
          <li>Hintaying maitala ng may-ari ang bayad sa iReside portal.</li>
          <li>Buksan ang Finance Hub screen at i-refresh ang pahina.</li>
          <li>Tingnan ang bagong resibo sa ilalim ng <strong>Payment History</strong>.</li>
        </ol>
      </div>

      <h2>Paghahambing ng Paraan ng Pagbabayad</h2>
      <table>
        <thead>
          <tr>
            <th>Paraan ng Bayad</th>
            <th>Kailangang Patunay</th>
            <th>Oras ng Pag-apruba</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>GCash / Maya Transfer</strong></td>
            <td>Screenshot at 13-digit reference number</td>
            <td>Maaaprubahan sa loob ng 24 oras.</td>
          </tr>
          <tr>
            <td><strong>Cash sa May-ari</strong></td>
            <td>Direktang iabot sa opisina ng pamunuan</td>
            <td>Agad na maia-update sa electronic ledger.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 6 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 7: GABAY NG UMUUPA - PAG-ULAT NG SIRA AT MENSAHE                   -->
  <!-- ========================================================================= -->
  <div class="page" id="page-7">
    <div class="running-header">
      <span class="app-brand">Gabay ng Umuupa</span>
      <span>Pag-ulat ng Sira at Mensahe</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T5</span> Magsumite ng Tiket sa Pagkumpuni (Report Repairs)</div>
        <p>Kung may sirang gripo, problema sa kuryente, o iba pang sira sa kuwarto:</p>
        <ol>
          <li>Pindutin ang <strong>Maintenance</strong> sa kaliwang menu.</li>
          <li>Pindutin ang <strong>+ Submit Request</strong> button sa kanang itaas.</li>
          <li>Pumili ng kategorya at i-type ang paliwanag ng sira.</li>
          <li>Pindutin ang <strong>Upload Photo</strong> at pumili ng litrato.</li>
          <li>Pindutin ang <strong>Submit Ticket</strong> upang maipadala ang kahilingan.</li>
        </ol>
      </div>

      ${withScreenshots ? screenMaintenance : textMaintenance}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T6</span> Magpadala ng Direktang Mensahe sa May-ari</div>
        <p>Para sa mga katanungan, paunawa, o pag-uusap kasama ang pamunuan:</p>
        <ol>
          <li>Pindutin ang <strong>Messages</strong> sa kaliwang navigation sidebar.</li>
          <li>Piliin ang pag-uusap kasama ang iyong property manager.</li>
          <li>I-type ang iyong mensahe o tanong sa message composer box.</li>
          <li>Pindutin ang <strong>Send</strong> icon upang maipadala agad ang mensahe.</li>
          <li>Makatatanggap ka ng abiso kapag sumagot ang may-ari.</li>
        </ol>
      </div>

      <h2>Priyoridad sa Pagkumpuni at Oras</h2>
      <table>
        <thead>
          <tr>
            <th>Kategorya ng Sira</th>
            <th>Halimbawa ng Problema</th>
            <th>Target na Oras ng Pag-ayos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Plumbing</strong></td>
            <td>Tagas sa tubo, sirang gripo, baradong lababo</td>
            <td>Maaayos sa loob ng 24 oras.</td>
          </tr>
          <tr>
            <td><strong>Electrical</strong></td>
            <td>Bukas na kable, pumutok na breaker, ilaw</td>
            <td>Aayusin agad o sa loob ng 12 oras.</td>
          </tr>
          <tr>
            <td><strong>Kandado at Pinto</strong></td>
            <td>Sira sa seradura, sirang bintana, bisagra</td>
            <td>Maaayos sa loob ng 48 hanggang 72 oras.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 7 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 8: GABAY NG UMUUPA - PAGLIPAT AT PAG-LOGIN GAMIT ANG SUSI          -->
  <!-- ========================================================================= -->
  <div class="page" id="page-8">
    <div class="running-header">
      <span class="app-brand">Gabay ng Umuupa</span>
      <span>Paglipat at Pagbawi ng Account</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T7</span> Magpasa ng Paunawa sa Paglipat (Notice to Vacate)</div>
        <p>Kung matatapos na ang kontrata at balak mo nang umalis sa kuwarto:</p>
        <ol>
          <li>Pindutin ang <strong>Leases</strong> sa pangunahing navigation menu.</li>
          <li>Tingnan ang mga detalye ng iyong kasalukuyang kontrata.</li>
          <li>Pindutin ang <strong>Submit Move-Out Notice</strong> button.</li>
          <li>Piliin ang petsa ng iyong pag-alis gamit ang kalendaryo sa screen.</li>
          <li>Ilagay ang dahilan ng pag-alis at pindutin ang <strong>Confirm Notice</strong>.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task T8</span> Mag-sign In Gamit ang Emergency Spare Key</div>
        <p>Kung nawala ang iyong cellphone o hindi mabuksan ang email inbox:</p>
        <ol>
          <li>Sa login screen, pindutin ang link na <strong>Use Emergency Key</strong>.</li>
          <li>I-type ang iyong rehistradong email address sa account.</li>
          <li>I-type ang iyong 16-character Emergency Spare Key code.</li>
          <li>Pindutin ang <strong>Unlock Account</strong> button upang makapasok.</li>
          <li>Gumawa ng bagong password at i-save ang bagong susi na ibibigay.</li>
        </ol>
      </div>

      <h2>Talaan sa Pag-alis at Pagbawi ng Susi</h2>
      <table>
        <thead>
          <tr>
            <th>Bahagi ng Gawain</th>
            <th>Kinakailangang Aksyon</th>
            <th>Pamantayan sa Pagsang-ayon</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Kalinisan ng Kuwarto</strong></td>
            <td>Naitapon ang basura at malinis ang sahig.</td>
            <td>Sisingilin ang cleaning fee kung marumi.</td>
          </tr>
          <tr>
            <td><strong>Pagsasauli ng Susi</strong></td>
            <td>Naibalik ang lahat ng susi sa gate at pinto.</td>
            <td>Ibabawas sa deposito ang nawawalang susi.</td>
          </tr>
          <tr>
            <td><strong>Huling Metro</strong></td>
            <td>Nakuha ang huling basa ng tubig at kuryente.</td>
            <td>Ibabawas sa deposito ang huling singil.</td>
          </tr>
          <tr>
            <td><strong>Pagbawi ng Account</strong></td>
            <td>Ilagay ang 16-character emergency code.</td>
            <td>Papalitan ang password at magbibigay ng susi.</td>
          </tr>
        </tbody>
      </table>

      <h2>Iskedyul ng Pagbawas at Pagbalik ng Deposito</h2>
      <table>
        <thead>
          <tr>
            <th>Aytem ng Bawas</th>
            <th>Pamantayan sa Pagsusuri</th>
            <th>Oras ng Pag-aayos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Mga Balanseng Bill</strong></td>
            <td>Huling metro ng kuryente at tubig.</td>
            <td>Ibinabawas sa natitirang deposito.</td>
          </tr>
          <tr>
            <td><strong>Sira sa Kuwarto</strong></td>
            <td>Pagsusuri at halaga ng pagkumpuni.</td>
            <td>May resibo ng mga materyales.</td>
          </tr>
          <tr>
            <td><strong>Natitirang Pera</strong></td>
            <td>Deposito bawas ang mga bayarin.</td>
            <td>Ibinabalik sa loob ng 15 araw.</td>
          </tr>
        </tbody>
      </table>

      <div class="warning-box">
        Paalala sa Seguridad: Itago ang iyong Emergency Spare Key offline. Huwag itong ipadala sa chat.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 8 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 9: GABAY NG MAY-ARI - GUSALI AT MAPA NG KUWARTO                    -->
  <!-- ========================================================================= -->
  <div class="page" id="page-9">
    <div class="running-header">
      <span class="app-brand">Gabay ng May-ari</span>
      <span>Gusali at Mapa ng Kuwarto</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L1</span> Magdagdag ng Bagong Gusali at mga Kuwarto</div>
        <p>Irehistro ang bagong paupahang gusali at ang mga kuwarto nito sa portal:</p>
        <ol>
          <li>Pindutin ang <strong>Properties</strong> sa kaliwang navigation sidebar.</li>
          <li>Pindutin ang <strong>Add Property</strong> button sa itaas na action bar.</li>
          <li>Ilagay ang pangalan ng gusali sa ilalim ng <strong>Property Name</strong>.</li>
          <li>Ilagay ang buong address at piliin ang bilang ng mga palapag.</li>
          <li>Tukuyin ang bilang ng mga kuwarto para sa bawat palapag.</li>
          <li>Pindutin ang <strong>Create Property</strong> upang mai-save ang gusali sa iReside.</li>
        </ol>
      </div>

      ${withScreenshots ? screenAddProperty : textAddProperty}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L2</span> I-ayos ang Interactive Unit Map ng Gusali</div>
        <p>Gumawa ng visual na 2D floorplan upang madaling makita ang bawat pasilyo:</p>
        <ol>
          <li>Pindutin ang <strong>Unit Map</strong> sa pangunahing navigation menu.</li>
          <li>Pumili ng architectural preset tulad ng <strong>Double Loaded</strong> o <strong>Single Loaded</strong>.</li>
          <li>I-drag at i-drop ang mga room card upang tumugma sa totoong pasilyo.</li>
          <li>Pindutin ang alinmang kuwarto upang i-edit ang numero at buwanang upa.</li>
          <li>Pindutin ang <strong>Save Layout</strong> upang mai-publish ang plano ng palapag.</li>
        </ol>
      </div>

      <h2>Mga Katangian ng Gusali at mga Limitasyon</h2>
      <table>
        <thead>
          <tr>
            <th>Field ng Detalye</th>
            <th>Limitasyon sa Input</th>
            <th>Gabay sa Operasyon</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Pangalan ng Gusali</strong></td>
            <td>Hanggang 60 titik at numero</td>
            <td>Gamitin ang opisyal na pangalan ng gusali.</td>
          </tr>
          <tr>
            <td><strong>Tirahan / Address</strong></td>
            <td>Lokasyon sa Barangay Marulas</td>
            <td>Dapat nasa loob ng saklaw ng Marulas pilot.</td>
          </tr>
          <tr>
            <td><strong>Bilang ng Palapag</strong></td>
            <td>Mula 1 hanggang 10 palapag</td>
            <td>Bubuo ng mga lebel sa mapa ng gusali.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 9 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 10: GABAY NG MAY-ARI - SINGIL SA UTILITY AT UMUUPA                 -->
  <!-- ========================================================================= -->
  <div class="page" id="page-10">
    <div class="running-header">
      <span class="app-brand">Gabay ng May-ari</span>
      <span>Singil sa Utility at Umuupa</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L3</span> I-configure ang Singil sa Tubig at Kuryente</div>
        <p>Itakda ang presyo ng kuryente at tubig bago magkalkula ng submeter:</p>
        <ol>
          <li>Pindutin ang <strong>Utility Billing</strong> sa kaliwang menu.</li>
          <li>Buksan ang tab ng <strong>Electricity &amp; Water Rates</strong>.</li>
          <li>Ilagay ang presyo ng kuryente kada kWh at tubig kada metro kubiko.</li>
          <li>Ilagay ang iyong opisyal na <strong>GCash Mobile Number</strong> at pangalan.</li>
          <li>Pindutin ang <strong>Save Financial Configuration</strong> upang mailapat sa mga kuwarto.</li>
        </ol>
        <div class="tip-box">
          Tip: Tiyaking tama ang iyong GCash name upang hindi malito ang mga umuupa sa pagbayad.
        </div>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L4</span> Magdagdag ng Bagong Umuupa (Quick Add)</div>
        <p>Ang pinakamabilis na paraan ng pagrehistro kapag kaharap ang umuupa:</p>
        <ol>
          <li>Pindutin ang <strong>Tenants</strong> sa sidebar at i-click ang <strong>+ Add Tenant</strong>.</li>
          <li>Piliin ang tab na <strong>Quick Add</strong> sa window.</li>
          <li>Ilagay ang Buong Pangalan, Email Address, at Cellphone Number.</li>
          <li>Pumili ng bakanteng kuwarto, buwanang upa, at petsa ng pagsisimula.</li>
          <li>Pindutin ang <strong>Create Tenant Account</strong> upang mabuo ang kredensyal.</li>
        </ol>
      </div>

      <h2>Istraktura ng Singil sa Tubig at Kuryente</h2>
      <table>
        <thead>
          <tr>
            <th>Serbisyo ng Utility</th>
            <th>Yunit ng Sukat</th>
            <th>Pormula sa Pagsingil</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Kuryente</strong></td>
            <td>Kilowatt-hour (kWh)</td>
            <td>Konsumo na imumultiplika sa presyo ng kWh.</td>
          </tr>
          <tr>
            <td><strong>Tubig</strong></td>
            <td>Metro Kubiko (m&sup3;)</td>
            <td>Konsumo na imumultiplika sa presyo ng metro.</td>
          </tr>
          <tr>
            <td><strong>GCash Account</strong></td>
            <td>11-digit mobile number</td>
            <td>Ipinapakita sa buwanang invoice ng umuupa.</td>
          </tr>
        </tbody>
      </table>

      <h2>Mga Paraan ng Pagdagdag ng Umuupa</h2>
      <table>
        <thead>
          <tr>
            <th>Paraan ng Pagdagdag</th>
            <th>Inaasahang Umuupa</th>
            <th>Mabubuong Resulta</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Quick Add</strong></td>
            <td>Walk-in na umuupang kaharap sa opisina.</td>
            <td>Account na may pansamantalang password.</td>
          </tr>
          <tr>
            <td><strong>Self-Onboarding</strong></td>
            <td>Aplikanteng gumagamit ng sariling cellphone.</td>
            <td>Ligtas na link na ipinadala sa SMS o chat.</td>
          </tr>
          <tr>
            <td><strong>Digital Lease</strong></td>
            <td>Umuupang naaprubahan na ang aplikasyon.</td>
            <td>Elektronikong kontratang handa nang pirmahan.</td>
          </tr>
        </tbody>
      </table>

      <div class="tip-box">
        <strong>Proteksyon sa Datos:</strong> Ligtas at protektado ang numero ng cellphone alinsunod sa Republic Act 10173.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 10 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 11: GABAY NG MAY-ARI - INVITES AT MGA APLIKANTE                    -->
  <!-- ========================================================================= -->
  <div class="page" id="page-11">
    <div class="running-header">
      <span class="app-brand">Gabay ng May-ari</span>
      <span>Invites at mga Aplikante</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L5</span> Gumawa ng Self-Onboarding Invite Link</div>
        <p>Pahintulutan ang mga aplikante na sagutan ang form gamit ang cellphone:</p>
        <ol>
          <li>Sa loob ng Add Tenant window, piliin ang <strong>Self-Onboarding Link</strong>.</li>
          <li>Piliin ang bakanteng kuwarto at kung kailan mapapaso ang link.</li>
          <li>Pindutin ang <strong>Generate Onboarding Link</strong> upang mabuo ang URL.</li>
          <li>Pindutin ang <strong>Copy Link</strong> o ipakita ang QR code sa aplikante.</li>
          <li>Makakatanggap ka ng alert sa sandaling maipasa ng aplikante ang form.</li>
        </ol>
      </div>

      ${withScreenshots ? screenAddTenant : textAddTenant}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L6</span> Suriin at Aprubahan ang mga Walk-in Application</div>
        <p>Iproseso ang mga aplikanteng pumupunta sa iyong opisina:</p>
        <ol>
          <li>Buksan ang <strong>Tenants</strong> sa sidebar at piliin ang <strong>Applications</strong> tab.</li>
          <li>Pindutin ang pangalan ng aplikante upang suriin ang ipinasang ID.</li>
          <li>Kung maayos ang mga dokumento, pindutin ang <strong>Approve Application</strong>.</li>
          <li>Piliin ang kuwarto at gumawa ng digital na kontrata sa pag-upa.</li>
          <li>Awtomatikong ipapadala ng platform ang kredensyal sa kanyang email.</li>
        </ol>
      </div>

      <h2>Pamantayan sa Pagsusuri ng Dokumento ng Aplikante</h2>
      <table>
        <thead>
          <tr>
            <th>Dokumentong Sinusuri</th>
            <th>Katanggap-tanggap na Dokumento</th>
            <th>Pamantayan sa Pag-apruba</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Government ID</strong></td>
            <td>UMID, Passport, o Driver License</td>
            <td>Malinaw ang litrato at tugma ang pangalan.</td>
          </tr>
          <tr>
            <td><strong>Numero ng Cellphone</strong></td>
            <td>11-digit Philippine mobile number</td>
            <td>Subukang tawagan o padalhan ng SMS inquiry.</td>
          </tr>
          <tr>
            <td><strong>Itinalagang Kuwarto</strong></td>
            <td>Bakanteng unit sa interactive map</td>
            <td>Tiyaking bakante bago maglabas ng kontrata.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 11 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 12: GABAY NG MAY-ARI - BAYAD AT SUBMETER                           -->
  <!-- ========================================================================= -->
  <div class="page" id="page-12">
    <div class="running-header">
      <span class="app-brand">Gabay ng May-ari</span>
      <span>Bayad at Submeter</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L7</span> Kumpirmahin at Tanggapin ang Bayad sa Upa</div>
        <p>Kumpirmahin ang bayad gamit ang GCash transfer o pisikal na cash:</p>
        <ol>
          <li>Pindutin ang <strong>Finance Hub</strong> sa kaliwang navigation sidebar.</li>
          <li>Sa ilalim ng <strong>Pending Verification</strong>, pindutin ang bayad ng umuupa.</li>
          <li>Suriin ang screenshot ng resibo at itugma ang reference number.</li>
          <li>Pindutin ang <strong>Confirm Payment</strong> button upang aprubahan ang bayad.</li>
          <li>Agad na maia-update ang balanse at maglalabas ng opisyal na resibo.</li>
        </ol>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L8</span> Magtala ng Basa sa Submeter (Kuryente at Tubig)</div>
        <p>Awtomatikong kalkulahin ang bayarin sa tubig at kuryente ng bawat kuwarto:</p>
        <ol>
          <li>Pindutin ang <strong>Utility Billing</strong> at buksan ang <strong>Submeters</strong> tab.</li>
          <li>Pumili ng kuwarto at ilagay ang bagong numero sa <strong>Current Reading</strong>.</li>
          <li>Awtomatikong kukuwentahin ng sistema ang nakonsumong yunit mula sa lumang basa.</li>
          <li>Kakalkulahin ang kabuuang halaga gamit ang itinakdang presyo sa sistema.</li>
          <li>Pindutin ang <strong>Save Reading</strong> upang maitala ang singil.</li>
        </ol>
      </div>

      <h2>Pamantayan sa Bayad at Submeter ng Utility</h2>
      <table>
        <thead>
          <tr>
            <th>Uri ng Aksyon</th>
            <th>Pamantayan sa Pagsusuri</th>
            <th>Resulta sa Ledger</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>GCash / Maya</strong></td>
            <td>Itugma ang 13-digit reference number sa resibo.</td>
            <td>Mamarkahang bayad at gagawa ng resibo.</td>
          </tr>
          <tr>
            <td><strong>Pisikal na Cash</strong></td>
            <td>Kumpirmahin ang eksaktong perang natanggap.</td>
            <td>Itala ang transaksyon sa electronic ledger.</td>
          </tr>
          <tr>
            <td><strong>Kulang na Bayad</strong></td>
            <td>Mas mababa ang ibinayad kaysa sa singil.</td>
            <td>Ibabawas ang bayad; maiiwan ang balanse.</td>
          </tr>
          <tr>
            <td><strong>Basa sa Submeter</strong></td>
            <td>Kunin ang konsumo mula sa dating basa.</td>
            <td>Imumultiplika sa presyo ang konsumo.</td>
          </tr>
        </tbody>
      </table>

      <h2>Pamantayan sa Singil ng Tubig at Kuryente</h2>
      <table>
        <thead>
          <tr>
            <th>Uri ng Utility</th>
            <th>Paraan ng Pagkuwenta</th>
            <th>Pamamaraan ng Pagsusuri</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Kuryente (kWh)</strong></td>
            <td>Konsumo sa submeter na pinarami sa presyo.</td>
            <td>May litrato ng metro bawat buwan.</td>
          </tr>
          <tr>
            <td><strong>Tubig (Cubic Meter)</strong></td>
            <td>Nagamit na tubig na pinarami sa presyo.</td>
            <td>Inihahambing sa opisyal na bill.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 12 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 13: GABAY NG MAY-ARI - PAGKUMPUNI AT MGA ANUNSYO                   -->
  <!-- ========================================================================= -->
  <div class="page" id="page-13">
    <div class="running-header">
      <span class="app-brand">Gabay ng May-ari</span>
      <span>Pagkumpuni at mga Anunsyo</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L9</span> Mamahala at Mag-ayos ng Tiket ng Pagkumpuni</div>
        <p>Iproseso ang mga ulat ng sira na ipinasa ng mga umuupang residente:</p>
        <ol>
          <li>Pindutin ang <strong>Maintenance</strong> sa kaliwang navigation sidebar.</li>
          <li>Pindutin ang alinmang tiket na may pulang marka o <strong>Pending</strong> status.</li>
          <li>Suriin ang paliwanag ng sira at ang litratong ipinasa ng umuupa.</li>
          <li>Piliin ang tagakumpuni: <strong>Landlord Repair</strong> o <strong>Third Party Repair</strong>.</li>
          <li>Pindutin ang <strong>To Process</strong> button upang simulan ang iskedyul.</li>
          <li>Kapag tapos na ang gawa, pindutin ang <strong>Mark as Completed</strong> button.</li>
        </ol>
      </div>

      ${withScreenshots ? screenMaintenanceLandlord : textMaintenanceLandlord}

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L10</span> Magpaskil ng mga Anunsyo sa Gusali</div>
        <p>Maghatid ng mahahalagang abiso sa mga residente (tulad ng maintenance sa tubig):</p>
        <ol>
          <li>Pindutin ang <strong>Community Hub</strong> sa kaliwang navigation sidebar.</li>
          <li>Sa composer toolbar, pindutin ang tab na <strong>Announcement</strong>.</li>
          <li>I-type ang buong detalye ng paunawa para sa mga umuupa sa gusali.</li>
          <li>Pindutin ang <strong>Photo</strong> kung nais mong magsama ng litrato o poster.</li>
          <li>Pindutin ang <strong>Publish</strong> button sa kanang ibabang bahagi.</li>
        </ol>
      </div>

      <h2>Daloy ng Gawain sa Pagkumpuni at Pagsasara</h2>
      <table>
        <thead>
          <tr>
            <th>Yugto ng Gawain</th>
            <th>Responsableng Tao</th>
            <th>Pamantayan sa Pagresolba</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Unang Pagsusuri</strong></td>
            <td>May-ari ng Paupahan</td>
            <td>Suriin ang litrato sa loob ng 12 oras.</td>
          </tr>
          <tr>
            <td><strong>Pagtakda ng Gawa</strong></td>
            <td>Katiwala o Tagalabas</td>
            <td>Magtakda ng petsa kasama ang umuupa.</td>
          </tr>
          <tr>
            <td><strong>Pagsasara ng Tiket</strong></td>
            <td>May-ari at Umuupa</td>
            <td>Kumpirmahing maayos at isara ang tiket.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 13 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 14: GABAY NG MAY-ARI - PAG-ALIS AT MGA ULAT                        -->
  <!-- ========================================================================= -->
  <div class="page" id="page-14">
    <div class="running-header">
      <span class="app-brand">Gabay ng May-ari</span>
      <span>Pag-alis at mga Ulat</span>
    </div>

    <div class="content">
      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L11</span> Iproseso ang Paglipat at Security Deposit</div>
        <p>Magsagawa ng maayos na pag-aayos ng deposito kapag aalis na ang umuupa:</p>
        <ol>
          <li>Pindutin ang <strong>Leases</strong> sa sidebar at buksan ang <strong>Move-Out Requests</strong>.</li>
          <li>Suriin ang pisikal na kuwarto gamit ang checklist sa screen.</li>
          <li>Ilagay ang bawas para sa sira o hindi pa nababayarang tubig at kuryente.</li>
          <li>Awtomatikong kukuwentahin ng sistema ang matitirang <strong>Security Deposit</strong>.</li>
          <li>Pindutin ang <strong>Finalize Move-Out</strong> at ibalik ang natitirang pera sa umuupa.</li>
          <li>Awtomatikong babalik sa katayuang <strong>Vacant</strong> ang naturang kuwarto.</li>
        </ol>
        <div class="tip-box">
          Tip: Awtomatikong ibinabawas ng sistema ang hindi pa nababayarang bill sa deposito.
        </div>
      </div>

      <div class="task-block">
        <div class="task-title"><span class="task-badge">Task L12</span> Mag-export ng Ulat sa Pananalapi at Ledger</div>
        <p>I-download ang opisyal na tala ng kita at gastos para sa bookkeeping:</p>
        <ol>
          <li>Pindutin ang <strong>Finance Hub</strong> sa menu at piliin ang <strong>Reports</strong>.</li>
          <li>Piliin ang saklaw ng petsa ayon sa buwan, kwarter, o buong taon.</li>
          <li>Tingnan ang kabuuang nakolektang upa, kuryente, at tubig sa ulat.</li>
          <li>Pindutin ang <strong>Export PDF</strong> button upang mai-download ang statement.</li>
          <li>I-save o i-print ang dokumento para sa opisyal na talaan ng gusali.</li>
        </ol>
      </div>

      <h2>Pagtatapos ng Upa at mga Bawas sa Deposito</h2>
      <table>
        <thead>
          <tr>
            <th>Uri ng Bawas</th>
            <th>Pamantayan sa Pagsuri</th>
            <th>Tuntunin sa Pagbawas</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Naiwang Utility</strong></td>
            <td>Huling basa ng submeter sa pag-alis.</td>
            <td>Ibabawas sa matitirang deposito.</td>
          </tr>
          <tr>
            <td><strong>Sira sa Kuwarto</strong></td>
            <td>Sirang lampas sa karaniwang kalumaan.</td>
            <td>May resibo ng pagkumpuni na ibibigay.</td>
          </tr>
          <tr>
            <td><strong>Matitirang Sukli</strong></td>
            <td>Natitirang balanse ng deposito.</td>
            <td>Ipadadala sa GCash o cash sa 15 araw.</td>
          </tr>
        </tbody>
      </table>

      <h2>Mga Uri ng Ulat sa Pananalapi at Pag-export</h2>
      <table>
        <thead>
          <tr>
            <th>Anyo ng Ulat</th>
            <th>Saklaw na Panahon</th>
            <th>Mga Pangunahing Nilalaman</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Buwanang Ledger</strong></td>
            <td>Kasalukuyang buwan</td>
            <td>Nakolektang upa, utang, at utility.</td>
          </tr>
          <tr>
            <td><strong>Taunang Ulat</strong></td>
            <td>12-buwang taon ng kalendaryo</td>
            <td>Kabuuang kita, mga bawas, at netong kita.</td>
          </tr>
          <tr>
            <td><strong>Audit sa Submeter</strong></td>
            <td>Buwanang pagbasa sa metro</td>
            <td>Unang basa, huling basa, at kabuuang yunit.</td>
          </tr>
        </tbody>
      </table>

      <div class="tip-box">
        <strong>Tuntunin sa Talaan:</strong> Itabi ang mga exported financial report nang limang taon.
      </div>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 14 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 15: PAGRESOLBA NG MGA PROBLEMA AT SEGURIDAD                        -->
  <!-- ========================================================================= -->
  <div class="page" id="page-15">
    <div class="running-header">
      <span class="app-brand">Tulong at Seguridad</span>
      <span>Pagresolba ng mga Problema</span>
    </div>

    <div class="content">
      <h2>Mga Solusyon sa Karaniwang Problema</h2>

      <div class="qa-block">
        <div class="qa-q">1. Hindi natanggap ang 2FA verification email?</div>
        <p class="qa-a">Tingnan ang Spam o Junk folder. Maghintay ng 60 segundo bago pumindot ng Resend Code.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">2. Nakalimutan ang password at walang access sa email?</div>
        <p class="qa-a">Gamitin ang Emergency Spare Key. Pindutin ang Use Emergency Key sa login screen.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">3. Mahina ang internet habang nagpasa ng bayad?</div>
        <p class="qa-a">I-save ang screenshot ng resibo. I-upload muli kapag bumalik na ang maayos na koneksyon.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">4. Naipasa na ang bayad ngunit hindi pa nababawas sa balanse?</div>
        <p class="qa-a">Kailangan munang suriin at aprubahan ng may-ari ang resibo bago ma-update ang balanse.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">5. Paano kumuha ng malinaw na litrato ng sira?</div>
        <p class="qa-a">Buksan ang ilaw sa kuwarto. Kumuha ng malapitang litrato sa mismong bahagi ng sira.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">6. Sino ang tatawagan kapag may emergency sa gusali?</div>
        <p class="qa-a">Tumawag agad sa hotline ng pamunuan o sa Barangay Marulas Rescue Services.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">7. Paano aayusin ang error sa camera habang nag-a-upload ng resibo?</div>
        <p class="qa-a">Buksan ang browser settings. Piliin ang Site Settings, pindutin ang Camera, at piliin ang Allow.</p>
      </div>

      <h2>Proteksyon sa Datos at Pagsunod sa Batas</h2>
      <table>
        <thead>
          <tr>
            <th>Batas o Pamantayan</th>
            <th>Pinoprotektahang Bahagi</th>
            <th>Paraan ng Pagpapatupad</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>RA 10173 (Data Privacy)</strong></td>
            <td>Personal na impormasyon ng umuupa</td>
            <td>Naka-encrypt na storage para sa mga ID at numero.</td>
          </tr>
          <tr>
            <td><strong>RA 8792 (E-Commerce)</strong></td>
            <td>Digital na kontrata sa pag-upa</td>
            <td>Legal na kinikilalang digital signature.</td>
          </tr>
          <tr>
            <td><strong>Pamantayan sa Audit</strong></td>
            <td>Opisyal na talaan ng bayad</td>
            <td>Hindi nababagong timestamp sa bawat resibo.</td>
          </tr>
        </tbody>
      </table>

      <h2>Mahahalagang Tagubilin sa Seguridad</h2>
      <ul>
        <li><strong>Panatilihing Lihim ang Password:</strong> Huwag ibigay kaninoman. Gumamit ng titik at numero.</li>
        <li><strong>Itabi ang Emergency Spare Key:</strong> I-save ang ekstrang susi sa flash drive o kwaderno.</li>
        <li><strong>Mag-ingat sa Phishing Links:</strong> Huwag mag-login sa mga kahina-hinalang text link.</li>
        <li><strong>Itago ang mga Resibo:</strong> I-save ang reference number at mga larawan ng resibo.</li>
        <li><strong>Ingatan ang Pribadong Datos:</strong> Naka-encrypt ang mga ID at pamunuan lamang ang nakakakita.</li>
      </ul>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 15 ng 16</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAHINA 16: HELPLINE, MADALAS ITANONG, AT GLOSARYO                         -->
  <!-- ========================================================================= -->
  <div class="page" id="page-16">
    <div class="running-header">
      <span class="app-brand">Tulong at Sanggunian</span>
      <span>Mga Tanong, Helpline, at Glosaryo</span>
    </div>

    <div class="content">
      <h2>Madalas Itanong (FAQs)</h2>

      <div class="qa-block">
        <div class="qa-q">T: Paano kinakalkula ang buwanang kuryente at tubig?</div>
        <p class="qa-a">Ibinabawas ang lumang basa sa bagong basa at imumultiplika sa itinakdang presyo.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">T: Legal ba ang digital signature sa kontrata sa Pilipinas?</div>
        <p class="qa-a">Oo. Kinikilala ang electronic signature sa ilalim ng Republic Act No. 8792.</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">T: Paano pinoprotektahan ang personal na datos sa iReside?</div>
        <p class="qa-a">Sumusunod ang platform sa Philippine Data Privacy Act of 2012 (RA 10173).</p>
      </div>

      <div class="qa-block">
        <div class="qa-q">T: Ano ang gagawin kapag nag-error ang GCash habang nagpapadala?</div>
        <p class="qa-a">Maghintay ng 5 minuto, suriin ang GCash balance, at subukang magbayad muli.</p>
      </div>

      <h2>Opisyal na Helpline at Suporta</h2>
      <p style="font-size: 7.2pt; margin-bottom: 1.2mm;">
        Para sa tulong sa sistema, mag-email sa:
        <strong>support@ireside.ph</strong> | Tel: <strong>(02) 8292-1000</strong> (Lunes hanggang Sabado, 8:00 AM &ndash; 5:00 PM).
        Barangay Marulas Hall, MacArthur Highway, Valenzuela City.
      </p>

      <h2>Mga Hotline ng Emergency sa Komunidad</h2>
      <table>
        <thead>
          <tr>
            <th>Ahensya ng Pamahalaan</th>
            <th>Saklaw ng Serbisyo</th>
            <th>Telepono ng Emergency</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Barangay Hall</strong></td>
            <td>Desk ng Operasyon sa Brgy. Marulas</td>
            <td>(02) 8292-1000</td>
          </tr>
          <tr>
            <td><strong>Bumbero ng Valenzuela</strong></td>
            <td>Tugon sa Sunog at Sakuna</td>
            <td>160 / (02) 8292-2222</td>
          </tr>
          <tr>
            <td><strong>Pulisya ng Marulas</strong></td>
            <td>Substation ng Pulisya sa Marulas</td>
            <td>166 / (02) 8292-1111</td>
          </tr>
        </tbody>
      </table>

      <h2>Glosaryo ng mga Termino</h2>
      <div class="glossary-item"><span class="glossary-term">2FA:</span> Two-Factor Authentication gamit ang 6-digit email code sa pag-sign in.</div>
      <div class="glossary-item"><span class="glossary-term">Base Rent:</span> Buwanang bayad sa kuwarto na hindi kasama ang tubig at kuryente.</div>
      <div class="glossary-item"><span class="glossary-term">Submeter:</span> Sariling metro ng tubig o kuryente para sa bawat kuwarto.</div>
      <div class="glossary-item"><span class="glossary-term">Maintenance Ticket:</span> Kahilingan sa pagpapaayos ng mga sira sa loob ng gusali.</div>
      <div class="glossary-item"><span class="glossary-term">Emergency Spare Key:</span> Sikretong code para makapasok kapag nawala ang cellphone.</div>
      <div class="glossary-item"><span class="glossary-term">Dashboard:</span> Buod ng mga singil, balanse, paunawa, at mabilisang gamit.</div>
      <div class="glossary-item"><span class="glossary-term">Ledger:</span> Opisyal na talaan ng lahat ng bayad, utang, at transaksyon.</div>
      <div class="glossary-item"><span class="glossary-term">Invoice:</span> Buwanang ulat ng kabuuang dapat bayaran ng bawat umuupa.</div>
      <div class="glossary-item"><span class="glossary-term">Unit Map:</span> Visual na plano na nagpapakita ng bakante at inuupahang kuwarto.</div>
      <div class="glossary-item"><span class="glossary-term">Security Deposit:</span> Pera na garantiya sa posibleng sira bago lumipat sa kuwarto.</div>
      <div class="glossary-item"><span class="glossary-term">Upload:</span> Pagpasa ng litrato o dokumento mula sa iyong cellphone.</div>
      <div class="glossary-item"><span class="glossary-term">Move-Out Notice:</span> Opisyal na paunawa na aalis na ang umuupa sa kanyang kuwarto.</div>
      <div class="glossary-item"><span class="glossary-term">Tariff Rate:</span> Halaga ng singil kada kilowatt-hour o metro kubiko ng tubig.</div>

      <p style="font-size: 6.8pt; color: #666; text-align: center; margin-top: 1.2mm; border-top: 1px solid #ddd; padding-top: 0.6mm;">
        &copy; 2026 iReside Technologies. Lahat ng karapatan ay nakalaan. Awtorisadong Gabay.
      </p>
    </div>

    <div class="running-footer">
      <span>iReside Gabay sa Paggamit &bull; Bersyon 1.0</span>
      <span class="page-number">Pahina 16 ng 16</span>
    </div>
  </div>

</div>

</body>
</html>
`;
}
