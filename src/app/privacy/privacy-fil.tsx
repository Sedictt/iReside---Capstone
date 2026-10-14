import Link from "next/link"
import type { LegalSection } from "@/components/legal/LegalDocumentShell"
import {
  LegalLink,
  LegalList,
  LegalSubheading,
  LegalTable,
} from "@/components/legal/legal-content"
import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton"
import { FilipinoCourtesyNotice } from "./LocalizedLegalDocument"

/**
 * Filipino courtesy translation of the Privacy Policy (src/app/privacy/page.tsx).
 * Keep it in sync with the English version, which prevails in case of conflict.
 */

const PRIVACY_EMAIL = "ireside.official.mail@gmail.com"
const LINK = "text-primary hover:text-primary-dark font-medium underline underline-offset-4"

export const PRIVACY_TITLE_FIL = "Patakaran sa Privacy"
export const PRIVACY_LAST_UPDATED_FIL = "Oktubre 8, 2026"
export const PRIVACY_SEARCH_PLACEHOLDER_FIL = "Maghanap sa patakarang ito (hal. cookies, AI, pagtatago)…"

export const PRIVACY_INTRO_FIL = (
  <>
    <FilipinoCourtesyNotice />
    <p>
      Ipinapaliwanag ng patakarang ito kung anong personal na datos ang hinahawakan ng iReside,
      bakit, kanino ito ibinabahagi, at ang mga pagpipilian at karapatan mo.
    </p>
  </>
)

export const PRIVACY_SUMMARY_FIL = (
  <section
    aria-labelledby="privacy-summary-heading"
    className="rounded-3xl border border-primary/30 bg-primary/5 p-6 md:p-8 print:border-border print:bg-transparent"
  >
    <h2 id="privacy-summary-heading" className="text-xl font-bold font-display text-foreground mb-3">
      Buod ng privacy
    </h2>
    <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-foreground/80">
      <li>
        Kinokolekta namin ang kailangan para patakbuhin ang paupahan: ang iyong account, mga
        aplikasyon, kontrata (lease), talaan ng bayad, request sa pagpapaayos, at mga mensahe.
      </li>
      <li>
        <strong>Hindi kami nagbebenta ng personal na datos</strong>, at walang advertising o
        third-party analytics tracker ang iReside.
      </li>
      <li>
        Nakikita ng iyong landlord ang impormasyong kailangan para pamahalaan ang iyong
        pag-upa. Ang ibang user ay nakakakita lamang ng kailangan ng feature na ginagamit nila.
      </li>
      <li>
        Ang iRis assistant at ang analytics para sa landlord ay nagpapadala ng datos sa isang AI
        provider (Groq) para makabuo ng sagot.{" "}
        <a href="#ai" className="text-primary underline underline-offset-4">Tingnan kung ano ang ipinapadala</a>.
      </li>
      <li>
        Maaari mong hilinging makita, itama, burahin, o kumuha ng kopya ng iyong datos, at maaari
        kang magreklamo sa National Privacy Commission.{" "}
        <a href="#rights" className="text-primary underline underline-offset-4">Ang iyong mga karapatan</a>.
      </li>
    </ul>
  </section>
)

export const PRIVACY_SECTIONS_FIL: LegalSection[] = [
  {
    id: "scope",
    title: "Saklaw at kung sino ang may pananagutan",
    icon: "info",
    content: (
      <>
        <p>
          Ipinapaliwanag ng patakarang ito kung paano hinahawakan ang personal na datos kapag
          ginagamit mo ang iReside sa web app, sa Windows desktop app, o sa Android app. Lahat ng
          ito ay nakakonekta sa iisang serbisyo. Isinulat ito alinsunod sa{" "}
          <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong> ng Pilipinas, sa
          Implementing Rules and Regulations nito, at sa mga issuance ng National Privacy
          Commission (NPC).
        </p>

        <LegalSubheading>Sino ang nagpapasya kung paano gagamitin ang iyong datos</LegalSubheading>
        <p>
          Ibinibigay ang iReside bilang hiwalay at independiyenteng instance para sa bawat
          landlord o negosyo ng paupahan (tingnan ang aming{" "}
          <Link href="/terms#fees" className={LINK}>Mga Tuntunin ng Serbisyo</Link>). Nakaaapekto
          ito kung sino ang may pananagutan sa iyong datos:
        </p>
        <LegalList>
          <li>
            <strong>Ang Operator</strong> ay ang landlord o organisasyong nagpapatakbo ng instance
            na ginagamit mo. Ang Operator ang nagpapasya kung anong datos ng tenant, aplikante,
            kontrata, billing, maintenance, at komunidad ang kinokolekta at kung bakit, at siya
            ang <em>personal information controller</em> ng datos na iyon. Makikita sa app ang
            contact details ng iyong landlord.
          </li>
          <li>
            <strong>Ang iReside development team</strong> ang bumubuo at nagme-maintain ng
            software. Hinahawakan lamang namin ang personal na datos sa isang instance kung
            kailangan para i-deploy, suportahan, o ayusin ito ayon sa mga tagubilin ng Operator.
            Kami ang controller ng mga mensaheng ipinapadala mo sa contact address sa ibaba at
            ng pampublikong website na ito.
          </li>
        </LegalList>
        <p>
          Maliban kung iba ang nakasaad, ang “kami” at “namin” sa patakarang ito ay tumutukoy sa
          Operator at sa iReside development team na kumikilos sa mga papel na iyon.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "Impormasyong kinokolekta namin",
    icon: "collect",
    content: (
      <>
        <p>
          Ang kinokolekta namin ay depende sa kung paano mo ginagamit ang iReside. Ang ilan ay
          direkta mong ibinibigay, ang ilan ay nalilikha habang ginagamit mo ang serbisyo, at ang
          ilan ay inilalagay tungkol sa iyo ng iyong landlord (halimbawa, isang walk-in na
          aplikante o tenant na manu-manong idinagdag).
        </p>
        <LegalTable
          caption="Mga kategorya ng personal na datos na kinokolekta ng iReside"
          columns={["Kategorya", "Kasama rito"]}
          rows={[
            [
              "Account at profile",
              "Buong pangalan, email address, role (landlord o tenant), profile photo, bio, phone number, at address. Ang iyong password ay hinahawakan ng aming authentication provider at iniimbak lamang bilang hash; hindi namin ito nababasa.",
            ],
            [
              "Detalye ng negosyo ng landlord",
              "Pangalan ng negosyo, numero ng business permit at mga in-upload na dokumento ng permit, at ang mga detalye sa pagtanggap ng bayad na pinipiling ipakita ng landlord sa mga tenant (detalye ng bank account, GCash o Maya QR code).",
            ],
            [
              "Mga aplikasyon sa pag-upa at onboarding",
              "Pangalan, email, phone, katayuan at detalye ng trabaho, buwanang kita, pangalan at phone number ng emergency contact at mga reference, gustong petsa ng paglipat, ang iyong mensahe, mga in-upload na sumusuportang dokumento (na maaaring may kasamang valid ID at patunay ng kita, depende sa hinihingi ng landlord), at patunay ng bayad sa application fee.",
            ],
            [
              "Kontrata at pag-upa",
              "Mga tuntunin ng kontrata, upa, deposito, at mga petsa; mga electronic signature; mga request sa pag-renew, pag-alis, at paglipat ng unit; at isang signing audit trail na nagtatala ng oras, IP address, at device.",
            ],
            [
              "Billing at mga bayad",
              "Mga invoice at line item, reading at rate ng utility meter, mga in-upload na larawan ng patunay ng bayad, mga opisyal na resibo, at (para sa mga landlord) talaan ng gastos at mga export. Hindi nagpoproseso ang iReside ng bayad gamit ang card at hindi nag-iimbak ng numero ng card; ang upa ay direktang binabayaran sa pagitan ng landlord at tenant.",
            ],
            [
              "Mga request sa pagpapaayos",
              "Paglalarawan ng request, kategorya, pagka-urgent, mga larawan, iskedyul, at mga tala sa pagkakaayos.",
            ],
            [
              "Mga mensahe at komunidad",
              "Mga chat message at attachment; mga aksyong mute, block, at report; mga post sa komunidad, komento, reaksyon, boto sa poll, photo album, at booking ng amenity.",
            ],
            [
              "iRis assistant",
              "Ang mga tanong mo kay iRis at ang mga sagot nito, na itinatago bilang iyong chat history.",
            ],
            [
              "Datos sa seguridad at device",
              "Mga login session (IP address, browser, at device), mga entry sa security audit log, mga one-time passcode at ang pag-expire ng mga ito, mga setting ng two-factor, ang Google account email na naka-link para sa verification, isang naka-encrypt na account-recovery key, at bilang ng mga bigong pagsubok.",
            ],
            [
              "Mga kagustuhan at paggamit",
              "Mga notipikasyon sa app, progreso sa onboarding product tour, at ang mga pinili mo sa tema, wika, laki ng teksto, contrast, at cookies.",
            ],
            [
              "Mga pahintulot sa device (Android app)",
              "Access sa camera at mga larawan, ginagamit lamang kapag pinili mong kumuha o mag-attach ng larawan.",
            ],
          ]}
        />

        <LegalSubheading>Hindi namin kinokolekta</LegalSubheading>
        <p>
          Hindi humihingi ang iReside ng GPS o eksaktong lokasyon, ng iyong mga contact, ng access
          sa mikropono, ng biometric data, o ng numero ng payment card, at hindi ito gumagamit ng
          advertising identifier. Ang mga address sa sistema ay tekstong inilagay ng mga user, hindi
          sinusubaybayang lokasyon.
        </p>

        <LegalSubheading>Impormasyon tungkol sa ibang tao</LegalSubheading>
        <p>
          Kung ibibigay mo sa amin ang detalye ng ibang tao, gaya ng emergency contact o
          reference, kinukumpirma mong pinapayagan kang ibahagi ang mga ito at alam nila na
          ibinahagi mo.
        </p>
      </>
    ),
  },
  {
    id: "purposes",
    title: "Paano at bakit namin ginagamit ang iyong datos",
    icon: "purpose",
    content: (
      <>
        <p>
          Ginagamit lamang namin ang personal na datos para sa mga layunin sa ibaba, na idineklara,
          tiyak, at lehitimo sa ilalim ng Section 11 ng Data Privacy Act. Umaasa kami sa mga
          batayang naaayon sa batas sa Sections 12 at 13 ng Act.
        </p>
        <LegalTable
          caption="Mga layunin ng pagproseso at ang legal na batayan ng bawat isa"
          columns={["Layunin", "Mga halimbawa", "Legal na batayan"]}
          rows={[
            [
              "Ibigay ang serbisyo",
              "Paggawa at pag-secure ng iyong account, pag-sign in sa iyo, pagpapakita ng iyong dashboard.",
              "Kontrata, o mga hakbang na hiniling mo bago ang isang kontrata.",
            ],
            [
              "Pangasiwaan ang pag-upa",
              "Pagproseso ng mga aplikasyon, paghahanda at pagpirma ng mga kontrata, pag-invoice, pagtatala ng mga bayad, pag-aasikaso ng maintenance at pag-alis.",
              "Kontrata, at ang lehitimong interes ng Operator sa pamamahala ng ari-arian nito.",
            ],
            [
              "Makipag-ugnayan sa iyo",
              "Mga notipikasyon, imbitasyon, one-time passcode, paalala sa bayad, at abiso tungkol sa serbisyo sa pamamagitan ng email o sa app.",
              "Kontrata at lehitimong interes.",
            ],
            [
              "Panatilihing ligtas ang platform",
              "Pamamahala ng session, mga audit log, pag-filter ng pang-aabuso at spam, pag-aasikaso ng mga report ng user.",
              "Lehitimong interes at mga legal na obligasyon.",
            ],
            [
              "Mga feature ng assistant at analytics",
              "Pagsagot sa mga tanong mo kay iRis; pagbibigay sa mga landlord ng madaling-unawaing buod ng sarili nilang mga numero.",
              "Ang iyong kahilingan kapag ginamit mo ang feature, at lehitimong interes.",
            ],
            [
              "Pagbutihin ang iReside",
              "Pag-aayos ng mga error at pagsuri kung madaling maunawaan ang onboarding tour.",
              "Lehitimong interes.",
            ],
            [
              "Sumunod sa batas",
              "Pagtugon sa mga legal na utos; pagtatago ng mga talaang hinihingi ng batas.",
              "Legal na obligasyon.",
            ],
          ]}
        />
        <p>
          Hindi namin ginagamit ang iyong datos para sa advertising o marketing, at hindi namin ito
          gagamitin sa ibang layunin nang hindi ka sinasabihan at, kung kinakailangan, nang hindi
          humihingi ng iyong pahintulot.
        </p>
      </>
    ),
  },
  {
    id: "sensitive",
    title: "Sensitibong personal na impormasyon",
    icon: "sensitive",
    content: (
      <>
        <p>
          Sa ilalim ng Data Privacy Act, ang mga identifier na inisyu ng gobyerno gaya ng passport,
          driver&apos;s license, SSS, UMID, o tax number ay{" "}
          <strong>sensitibong personal na impormasyon</strong> (sensitive personal information).
          Hindi ito mismong hinihingi ng iReside. Gayunman, maaaring humingi ang landlord ng mga
          valid ID bilang bahagi ng aplikasyon sa pag-upa, at ikaw ang mag-a-upload nito sa
          aplikasyon.
        </p>
        <LegalList>
          <li>Pinoproseso lamang namin ang sensitibong personal na impormasyon nang may pahintulot mo o kung pinapayagan ito ng batas.</li>
          <li>Ang mga in-upload na ID ay para sa landlord na sumusuri ng iyong aplikasyon. Huwag mag-upload ng higit sa hinihingi ng landlord.</li>
          <li>Dapat humingi lamang ang mga Operator ng kung ano ang kailangan at angkop para suriin ang isang aplikante, at hindi dapat magtago ng mga ID nang mas matagal kaysa kinakailangan.</li>
        </LegalList>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Kanino namin ibinabahagi ang datos",
    icon: "sharing",
    content: (
      <>
        <LegalSubheading>Sa loob ng iyong iReside instance</LegalSubheading>
        <LegalList>
          <li>
            <strong>Landlord (Operator):</strong> ang iyong profile, aplikasyon, kontrata, billing,
            mga request sa pagpapaayos, at mga mensahe ninyo.
          </li>
          <li>
            <strong>Mga tenant:</strong> ang pangalan, negosyo, at contact details ng iyong
            landlord, at impormasyon tungkol sa ari-arian. Ang mga post sa komunidad ay ibinabahagi
            sa ibang residente ng ari-ariang iyon at sa pamunuan nito; ang ilang post ng residente
            ay pinipigil muna para sa pag-apruba.
          </li>
          <li>
            <strong>Mga administrator ng instance:</strong> mga report ng mapang-abusong mensahe o
            post, at pinagsama-samang (aggregate) sukatan ng paggamit ng onboarding tour.
          </li>
          <li>
            <strong>Iba pang kalahok:</strong> ang mga pribadong mensahe ay nakikita lamang ng mga
            taong kasali sa usapang iyon.
          </li>
        </LegalList>

        <LegalSubheading>Mga service provider</LegalSubheading>
        <p>
          Ginagamit namin ang mga provider sa ibaba para patakbuhin ang iReside. Pinoproseso nila
          ang datos para sa amin, sa ilalim ng sarili nilang mga tuntunin at patakaran sa privacy.
        </p>
        <LegalTable
          caption="Mga third-party service provider na ginagamit ng iReside"
          columns={["Provider", "Ginagawa nito para sa iReside", "Kasangkot na datos"]}
          rows={[
            [
              "Supabase",
              "Database, authentication ng user, imbakan ng file, at real-time na update.",
              "Lahat ng datos na nakaimbak sa platform, kasama ang mga in-upload na file.",
            ],
            [
              "Vercel",
              "Web hosting, server functions, ang buwanang iskedyul ng invoice, at pag-host ng mga file na pang-download ng app.",
              "Datos ng request gaya ng IP address sa mga server log.",
            ],
            [
              "Groq",
              "AI model na nagpapatakbo kay iRis at sa mga buod ng analytics para sa landlord.",
              "Tingnan ang “Mga feature ng AI” sa ibaba.",
            ],
            [
              "Google",
              "Opsyonal na “Sign in with Google” verification para sa two-factor authentication, at Google Fonts para sa typography ng page.",
              "Para sa verification: ang iyong Google email, pangalan, at profile. Para sa fonts: ipinapadala sa Google ang iyong IP address at detalye ng browser kapag nag-load ang isang page.",
            ],
            [
              "Paghahatid ng email (SMTP)",
              "Nagpapadala ng mga passcode, imbitasyon, paalala, at abiso. Gmail ang default; maaaring mag-configure ang Operator ng ibang provider.",
              "Ang iyong email address at ang nilalaman ng mensahe.",
            ],
          ]}
        />

        <LegalSubheading>Mga legal at regulatory na pagbubunyag</LegalSubheading>
        <p>
          Maaari naming ibunyag ang personal na datos kapag hinihingi ng batas, ng utos ng korte, o
          ng legal na kahilingan mula sa awtoridad ng gobyerno, o para magtatag, gumamit, o
          ipagtanggol ang mga legal na paghahabol (legal claims).
        </p>

        <LegalSubheading>Walang pagbebenta ng personal na datos</LegalSubheading>
        <p>Hindi kami nagbebenta o nagpapaupa ng personal na datos, at hindi namin ito ibinabahagi sa mga advertiser.</p>
      </>
    ),
  },
  {
    id: "ai",
    title: "Mga feature ng AI (iRis)",
    icon: "ai",
    content: (
      <>
        <p>
          May dalawang feature ang iReside na pinapagana ng AI. Pareho silang nagpapadala ng
          datos sa Groq, isang third-party AI provider, para makabuo ng sagot.
        </p>
        <LegalList>
          <li>
            <strong>iRis tenant assistant.</strong> Kapag nagtanong ka, ipinapadala namin sa Groq
            ang iyong mensahe, hanggang 80 sa mga nauna mong mensahe kay iRis, at impormasyon
            tungkol sa iyong pag-upa para tama ang sagot: ang iyong pangalan at contact details,
            impormasyon sa kontrata at upa, kamakailang status ng bayad, address ng ari-arian,
            contact details ng iyong landlord, at ang pangalan ng Wi-Fi network ng gusali kung
            idinagdag ito ng iyong landlord. Hindi kailanman ipinapadala sa Groq ang Wi-Fi
            password; ang app mismo ang naglalagay nito sa reply card.
          </li>
          <li>
            <strong>Analytics para sa landlord.</strong> Kapag humingi ang landlord ng AI na buod,
            nagpapadala kami ng pinagsama-samang (aggregated) indicator, gaya ng occupancy, kita,
            gastos, at mga nakabinbing isyu. Hindi kami nagpapadala ng indibidwal na talaan ng
            tenant para sa feature na ito.
          </li>
        </LegalList>
        <p>
          Maaaring mali o kulang ang mga sagot ng AI at hindi ito legal o pinansyal na payo. Hindi
          kami gumagamit ng AI para aprubahan o tanggihan ang mga aplikasyon, magtakda ng upa, o
          gumawa ng ibang desisyon tungkol sa iyo; mga tao ang gumagawa ng mga desisyong iyon.
          Iwasang mag-type kay iRis ng impormasyong ayaw mong maproseso ng isang third party.
          Kung hindi available ang AI service, ang analytics ay babalik sa mga built-in na buod na
          hindi gumagamit ng Groq.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies at local storage",
    icon: "cookies",
    content: (
      <>
        <p>
          Gumagamit lamang ang iReside ng first-party cookies at browser storage na kailangan ng
          serbisyo para gumana o para tandaan ang iyong mga setting. Hindi kami gumagamit ng
          advertising cookies, third-party analytics, o cross-site tracking.
        </p>
        <LegalTable
          caption="Cookies at browser storage na ginagamit ng iReside"
          columns={["Pangalan", "Layunin", "Uri"]}
          rows={[
            [
              "Authentication cookies (nagsisimula ang pangalan sa “sb-”)",
              "Pinapanatili kang naka-sign in at pinoprotektahan ang iyong session. Kung wala ang mga ito, hindi ka makakapag-login.",
              "Mahigpit na kailangan",
            ],
            [
              "ireside-theme",
              "Tinatandaan ang light o dark mode.",
              "Kagustuhan (local storage)",
            ],
            [
              "ireside_font_scale, ireside_font_size, ireside_high_contrast",
              "Tinatandaan ang iyong setting sa laki ng teksto at high contrast.",
              "Kagustuhan (local storage)",
            ],
            [
              "ireside_language",
              "Tinatandaan kung English o Filipino.",
              "Kagustuhan (local storage)",
            ],
            [
              "ireside-consent-v1",
              "Tinatandaan ang pinili mo sa cookie banner.",
              "Kagustuhan (local storage)",
            ],
            [
              "Offline cache",
              "Nag-iimbak ang isang service worker ng mga static na file ng app para mabuksan ang iReside nang offline. Hindi nito iniimbak ang iyong mga personal na talaan.",
              "Mahigpit na kailangan",
            ],
          ]}
        />
        <p>
          May opsyonal na “Performance Metrics” at “Personalization” na switch ang cookie banner.
          Sa ngayon, walang feature ang iReside na nakadepende sa mga ito, kaya hindi nababago ng
          iyong pinili ang tumatakbo ngayon. Iniimbak namin ito sa iyong device at igagalang
          namin ito, at ia-update muna namin ang patakarang ito, kung sakaling magdagdag ng ganitong
          mga feature.
        </p>
        <p>
          Mananatili sa iyong device ang mga kagustuhan hanggang burahin mo ang datos ng iyong
          browser. Kapag hinarangan mo ang mahigpit na kailangang cookies, hindi ka makakapag-sign
          in.
        </p>
        <div className="not-prose mt-4">
          <CookiePreferencesButton />
        </div>
      </>
    ),
  },
  {
    id: "security",
    title: "Paano namin pinoprotektahan ang iyong datos",
    icon: "security",
    content: (
      <>
        <p>
          Naglalapat kami ng mga organisasyonal, pisikal, at teknikal na pananggalang alinsunod sa
          Section 20 ng Data Privacy Act. Kabilang sa mga hakbang na kasalukuyang umiiral ang:
        </p>
        <LegalList>
          <li>Encryption habang ipinapadala: ang iReside ay inihahatid sa pamamagitan ng HTTPS.</li>
          <li>Password hashing na hinahawakan ng aming authentication provider, kaya hindi namin kailanman nakikita o iniimbak ang iyong password bilang plain text.</li>
          <li>Row-level security sa database, na naglilimita sa bawat talaan sa mga user na may karapatang makita ito (halimbawa, ang sariling kontrata ng tenant at ang landlord na may-ari nito).</li>
          <li>Ang phone number at address ng tirahan ay itinatago sa hiwalay at mas limitadong profile record.</li>
          <li>Opsyonal na two-factor authentication gamit ang email passcode, at available din sa mga landlord ang verification gamit ang Google account.</li>
          <li>Isang account-recovery security key na nakaimbak gamit ang AES-256-GCM encryption, na may papalalang lockout pagkatapos ng mga bigong pagsubok.</li>
          <li>Isang listahan ng iyong mga naka-sign in na device sa Settings, kung saan maaari mong tapusin ang anumang session na hindi mo kilala.</li>
          <li>Mga security audit log para sa mga sensitibong aksyon sa account, kung saan naka-mask ang IP address.</li>
          <li>Awtomatikong pag-filter at mga tool sa pag-report para sa mapang-abuso o spam na nilalaman sa chat.</li>
        </LegalList>
        <p>
          Sadyang nakikita ng publiko ang mga larawan ng ari-arian at mga branding image, para
          maipakita ang mga ito sa mga listing. Huwag maglagay ng personal na impormasyon sa mga ito.
        </p>

        <LegalSubheading>Ang magagawa mo</LegalSubheading>
        <p>
          Gumamit ng matibay at natatanging password, i-on ang two-factor authentication, itago
          sa ligtas na lugar ang iyong recovery key, mag-sign out sa mga shared na device, at
          regular na suriin ang iyong mga aktibong session.
        </p>

        <LegalSubheading>Kung may mangyaring problema</LegalSubheading>
        <p>
          Walang sistemang ganap na ligtas. Kung magkaroon ng personal data breach na kailangang
          ipaalam, aabisuhan namin ang NPC at ang mga apektadong indibidwal sa loob ng
          pitumpu&apos;t dalawang (72) oras mula nang malaman namin ito, ayon sa hinihingi ng NPC
          Circular 16-03, at sasabihin namin sa iyo kung ano ang nangyari at kung ano ang magagawa
          mo.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "Gaano katagal namin itinatago ang datos",
    icon: "retention",
    content: (
      <>
        <p>
          Itinatago lamang namin ang personal na datos hangga&apos;t kailangan para sa mga layunin
          sa patakarang ito o hangga&apos;t hinihingi ng batas.
        </p>
        <LegalTable
          caption="Panahon ng pagtatago ayon sa uri ng datos"
          columns={["Datos", "Gaano katagal namin ito itinatago"]}
          rows={[
            ["Account at profile", "Habang aktibo ang iyong account, at pagkatapos ay hanggang humiling ka ng pagbura."],
            ["Mga aplikasyon", "Habang kailangan para pagpasyahan ang aplikasyon at asikasuhin ang anumang alitan. Binubura o ginagawang anonymous kapag hiniling, maliban kung kailangan para sa isang legal na paghahabol."],
            ["Mga kontrata, invoice, resibo, patunay ng bayad, at signing audit trail", "Habang may pag-upa at pagkatapos nito hangga't hinihingi ng mga patakaran sa buwis, accounting, at civil law ng Pilipinas."],
            ["Mga chat message at nilalaman sa komunidad", "Hanggang burahin mo o ng isang moderator, o hanggang maalis ang iyong account."],
            ["iRis chat history", "Hanggang maalis ang iyong account o hilingin mong burahin namin ito."],
            ["Mga session, passcode, at invitation link", "Tumatagal ang mga session hanggang mag-sign out o mag-expire. Ang mga passcode at invitation link ay nag-e-expire pagkatapos ng maikling panahon."],
            ["Mga backup ng provider", "Ang mga kopya sa backup ng provider ay napapalitan ayon sa karaniwang backup cycle ng provider pagkatapos ng pagbura."],
          ]}
        />
        <p>
          Sa kasalukuyan, hindi awtomatikong nagbubura ng mga talaan ang iReside ayon sa iskedyul.
          Ang pagbura ay ginagawa ng Operator o ng iReside team kapag gumawa ka ng beripikadong
          kahilingan (tingnan ang “Ang iyong mga karapatan”).
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Ang iyong mga karapatan",
    icon: "rights",
    content: (
      <>
        <p>Bilang data subject sa ilalim ng Data Privacy Act, may karapatan kang:</p>
        <LegalList>
          <li><strong>Mabigyang-alam</strong> kung paano pinoproseso ang iyong datos, na siyang layunin ng patakarang ito.</li>
          <li><strong>Ma-access</strong> ang personal na datos na hawak namin tungkol sa iyo.</li>
          <li><strong>Tumutol</strong> sa pagproseso, kabilang ang pagbawi ng pahintulot anumang oras kung ito ang aming batayan.</li>
          <li><strong>Ipatama</strong> ang mali o kulang na datos.</li>
          <li><strong>Ipabura o ipaharang</strong> ang iyong datos sa aming sistema kung ito ay nakuha nang labag sa batas, hindi na kailangan, o binawi mo ang pahintulot, alinsunod sa mga talaang dapat naming itago ayon sa batas.</li>
          <li><strong>Data portability</strong>: matanggap ang iyong datos sa isang structured at karaniwang ginagamit na format.</li>
          <li><strong>Humingi ng danyos</strong> para sa mali, kulang, luma, huwad, o ilegal na nakuhang datos, o sa hindi awtorisadong paggamit nito.</li>
          <li><strong>Magreklamo</strong> sa National Privacy Commission.</li>
        </LegalList>
        <p>
          Maaaring gamitin ng iyong mga legal na tagapagmana at assign ang mga karapatang ito para
          sa iyo pagkatapos ng iyong kamatayan o kung ikaw ay mawalan ng kakayahan. Kung nasa
          isang bansa ka kung saan may ibang batas sa privacy na nagbibigay sa iyo ng karagdagang
          karapatan, makipag-ugnayan sa amin at aasikasuhin namin ang iyong kahilingan ayon sa
          batas na naaangkop sa iyo.
        </p>

        <LegalSubheading>Paano gamitin ang iyong mga karapatan</LegalSubheading>
        <p>
          Maaari mong itama ang karamihan sa detalye ng iyong profile at suriin ang iyong mga
          aktibong session direkta sa Settings. Para sa iba pa, kabilang ang access, kopya,
          pagbura, o pagbawi ng pahintulot, mag-email sa{" "}
          <LegalLink href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</LegalLink> mula sa address
          na nakarehistro sa iyong account, o magtanong sa iyong landlord. Maaaring kailanganin
          muna naming i-verify ang iyong pagkakakilanlan. Sasagot kami sa loob ng makatwirang
          panahon at sasabihin namin sa iyo kung hindi namin lubusang maaaksyunan ang isang
          kahilingan at kung bakit.
        </p>

        <LegalSubheading>Mga reklamo</LegalSubheading>
        <p>
          Kung sa tingin mo ay hindi wastong nahawakan ang iyong datos, makipag-ugnayan muna sa
          amin para masubukan naming ayusin ito. Maaari ka ring magsampa ng reklamo sa{" "}
          <LegalLink href="https://privacy.gov.ph" external>
            National Privacy Commission (privacy.gov.ph)
          </LegalLink>
          .
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Privacy ng mga bata",
    icon: "children",
    content: (
      <p>
        Ang iReside ay para sa mga nasa hustong gulang na 18 pataas at hindi nakatuon sa mga bata.
        Hindi namin sinasadyang mangolekta ng personal na datos mula sa sinumang wala pang 18
        taong gulang. Kung naniniwala kang nagbigay sa amin ng personal na datos ang isang menor
        de edad, makipag-ugnayan sa amin at buburahin namin ito.
      </p>
    ),
  },
  {
    id: "transfers",
    title: "Saan iniimbak ang datos",
    icon: "transfers",
    content: (
      <p>
        Maaaring mag-imbak o magproseso ng datos ang aming mga provider (Supabase, Vercel, Groq,
        at Google) sa mga server sa labas ng Pilipinas, kabilang ang United States. Ang region na
        ginagamit ng isang instance ay depende sa kung paano ito na-set up; masasabi ito sa iyo ng
        Operator. Nananatili kaming may pananagutan sa personal na datos na inilalagay namin sa mga
        provider at pumipili kami ng mga provider na nag-aalok ng mga tuntunin sa proteksyon ng
        datos.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Mga pagbabago sa patakarang ito",
    icon: "changes",
    content: (
      <>
        <p>
          Ia-update namin ang patakarang ito kapag nagbago ang aming mga gawain o ang batas. Ang
          petsa at bersyon sa itaas ang nagpapakita ng pinakahuling rebisyon. Ipapaalam namin sa
          iyo ang mahahalagang pagbabago sa pamamagitan ng notipikasyon sa app o email bago ito
          magkabisa. Kung hinihingi ng batas ang iyong pahintulot para sa bagong paggamit ng iyong
          datos, hihingin namin itong muli sa halip na ituring ang patuloy mong paggamit bilang
          pagsang-ayon.
        </p>
        <p>
          <strong>Bersyon 2.0 (Oktubre 8, 2026):</strong> isinulat muli para ilarawan ang datos na
          aktwal na hinahawakan ng iReside, ang mga service provider at feature ng AI nito, at
          ang iyong mga karapatan sa ilalim ng Data Privacy Act.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Makipag-ugnayan sa amin",
    icon: "contact",
    content: (
      <>
        <p>
          Para sa mga tanong tungkol sa patakarang ito o para gamitin ang iyong mga karapatan,
          makipag-ugnayan sa aming Data Protection Officer sa{" "}
          <LegalLink href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</LegalLink>. Para sa mga
          usapin tungkol sa isang partikular na ari-arian o pag-upa, maaari mo ring kontakin ang
          iyong landlord, na siyang Operator ng iyong instance.
        </p>
        <p>
          Tingnan din ang aming{" "}
          <Link href="/terms" className={LINK}>
            Mga Tuntunin ng Serbisyo
          </Link>
          .
        </p>
      </>
    ),
  },
]
