import type { PatternDictionary } from "../patterns";

/**
 * Runtime-built message templates (validation, API errors) → Filipino. See ../patterns.ts.
 *
 * Captured values are translated on their own first, so every label used in these
 * sentences ("Full name", "Due date", ...) must also exist as an exact phrase
 * (see ./runtime-messages.ts). Exact phrases always win over these templates, and
 * among templates the one with the most literal text is tried first.
 */
export const filMessagePatterns: PatternDictionary = {
  // --- Shared field rules (src/lib/validation/rules.ts, zod-fields.ts, schemas/*) ---
  "{label} is required.": "Kailangan ang {label|lower}.",
  "{label} is required for a fixed-term lease.": "Kailangan ang {label|lower} para sa fixed-term na lease.",
  "{label} must be text.": "Dapat ay text ang {label|lower}.",
  "{label} must be at least {min} characters.": "Dapat ay hindi bababa sa {min} character ang {label|lower}.",
  "{label} cannot exceed {max} characters.": "Hindi puwedeng lumampas sa {max} character ang {label|lower}.",
  // "Message" is a verb (Mag-message) in the core dictionary, so pin the noun here.
  "Message cannot exceed {max} characters.": "Hindi puwedeng lumampas sa {max} character ang mensahe.",
  "{label} must not exceed {max} characters.": "Hindi puwedeng lumampas sa {max} character ang {label|lower}.",
  "{label} must be between {min} and {max} characters.": "Dapat ay {min} hanggang {max} character ang {label|lower}.",
  "{label} can only contain letters, spaces, hyphens, apostrophes, and periods.":
    "Letra, espasyo, gitling, kudlit, at tuldok lang ang puwede sa {label|lower}.",
  "{label} is too long.": "Masyadong mahaba ang {label|lower}.",
  "{label} is too large.": "Masyadong malaki ang {label|lower}.",
  "{label} do not match.": "Hindi magkatugma ang {label|lower}.",
  "{label} is invalid.": "Hindi valid ang {label|lower}.",
  "{label} are invalid.": "Hindi valid ang {label|lower}.",
  "{label} filter is invalid.": "Hindi valid ang filter na {label|lower}.",
  "{label} is out of range.": "Lampas sa puwedeng halaga ang {label|lower}.",
  "{label} must be a list.": "Dapat ay listahan ang {label|lower}.",
  "Enter the {length}-digit code.": "Ilagay ang {length}-digit na code.",
  "Enter a valid {label}.": "Maglagay ng valid na {label}.",
  "Select a {label}.": "Pumili ng {label}.",
  "Select a valid {label}.": "Pumili ng valid na {label}.",
  "Too many {label}.": "Masyadong marami ang {label}.",
  "You can add at most {max} {label}.": "Hanggang {max} {label} lang ang puwedeng idagdag.",

  // Links
  "{label} must start with http:// or https://.": "Dapat magsimula sa http:// o https:// ang {label|lower}.",
  "{label} must be a URL.": "Dapat ay URL ang {label|lower}.",
  "{label} must be a link.": "Dapat ay link ang {label|lower}.",
  "{label} must be a valid URL.": "Dapat ay valid na URL ang {label|lower}.",
  "{label} must be a valid http(s) URL.": "Dapat ay valid na http(s) URL ang {label|lower}.",
  "{label} must be a valid http(s) link.": "Dapat ay valid na http(s) link ang {label|lower}.",

  // Numbers and money
  "{label} must be a number.": "Dapat ay numero ang {label|lower}.",
  "{label} must be a whole number.": "Dapat ay buong numero ang {label|lower}.",
  "{label} must be at least {min}.": "Dapat ay hindi bababa sa {min} ang {label|lower}.",
  "{label} cannot exceed {max}.": "Hindi puwedeng lumampas sa {max} ang {label|lower}.",
  "{label} must be between {min} and {max}.": "Dapat ay nasa pagitan ng {min} at {max} ang {label|lower}.",
  "{label} must be a valid amount.": "Dapat ay valid na halaga ang {label|lower}.",
  "{label} must be greater than ₱{min}.": "Dapat ay higit sa ₱{min} ang {label|lower}.",
  "{label} must be at least ₱{min}.": "Dapat ay hindi bababa sa ₱{min} ang {label|lower}.",
  "{label} cannot exceed ₱{max}.": "Hindi puwedeng lumampas sa ₱{max} ang {label|lower}.",
  "{label} cannot be negative.": "Hindi puwedeng negatibo ang {label|lower}.",
  "{label} can have at most 2 decimal places.": "Hanggang 2 decimal place lang ang puwede sa {label|lower}.",
  "{label} cannot exceed the balance due of ₱{balance}.":
    "Hindi puwedeng lumampas sa natitirang balanse na ₱{balance} ang {label|lower}.",
  "Increase cannot exceed {max}%.": "Hindi puwedeng lumampas sa {max}% ang pagtaas.",

  // Dates
  "{label} must be a valid date.": "Dapat ay valid na petsa ang {label|lower}.",
  "{label} must be a valid month.": "Dapat ay valid na buwan ang {label|lower}.",
  "{label} cannot be before {min}.": "Hindi puwedeng mas maaga sa {min} ang {label|lower}.",
  "{label} cannot be after {max}.": "Hindi puwedeng lampas sa {max} ang {label|lower}.",
  "{endLabel} must be after the {startLabel}.": "Dapat ay pagkatapos ng {startLabel|lower} ang {endLabel|lower}.",
  "{endLabel} must be on or after the {startLabel}.":
    "Dapat ay kapareho o pagkatapos ng {startLabel|lower} ang {endLabel|lower}.",
  "{endLabel} must be after the start time.": "Dapat ay pagkatapos ng oras ng simula ang {endLabel|lower}.",
  "Move-out requests require a minimum of {days} days notice. Earliest available date is {date}.":
    "Kailangan ng hindi bababa sa {days} araw na abiso para sa move-out request. Ang pinakamaagang puwedeng petsa ay {date}.",
  "Move-out date cannot be after your lease end date ({date}).":
    "Hindi puwedeng lampas sa petsa ng pagtatapos ng lease mo ({date}) ang petsa ng pag-alis.",
  "Proposed end date must be after the current lease end date ({date}).":
    "Dapat ay pagkatapos ng kasalukuyang petsa ng pagtatapos ng lease ({date}) ang iminungkahing petsa ng pagtatapos.",
  "Proposed start date cannot be before the current lease end date ({date}).":
    "Hindi puwedeng mas maaga sa kasalukuyang petsa ng pagtatapos ng lease ({date}) ang iminungkahing petsa ng simula.",

  // Passwords and codes (password-policy.ts, account.schema.ts)
  "{label} must include letters and at least one number or symbol.":
    "Dapat may letra at kahit isang numero o simbolo ang {label|lower}.",
  "{label} is too common and easy to guess. Choose something more unique.":
    "Masyadong karaniwan at madaling hulaan ang {label|lower}. Pumili ng mas kakaiba.",
  '{label} is too predictable. Avoid repeated characters and runs like "abcdef" or "123456".':
    'Masyadong madaling hulaan ang {label|lower}. Iwasan ang paulit-ulit na character at sunod-sunod tulad ng "abcdef" o "123456".',
  "{label} must not contain your name or email address.":
    "Hindi dapat naglalaman ng pangalan o email address mo ang {label|lower}.",
  "Please enter the complete {length}-character security key.": "Pakilagay ang buong {length}-character na security key.",

  // Colors and social links (brand-setup.ts, landlord-settings.ts)
  "{label} hex code is required.": "Kailangan ang hex code ng {label|lower}.",
  "{label} must be a valid 3 or 6-digit hex color (e.g. #8B5CF6).":
    "Dapat ay valid na 3 o 6-digit na hex color ang {label|lower} (hal. #8B5CF6).",
  "{platform} handle or link cannot contain spaces.": "Hindi puwedeng may espasyo ang {platform} handle o link.",
  "Please enter a valid {platform} URL.": "Pakilagay ang valid na {platform} URL.",
  "{platform} handle cannot exceed {max} characters.": "Hindi puwedeng lumampas sa {max} character ang {platform} handle.",
  "{platform} handle contains invalid characters.": "May hindi valid na character ang {platform} handle.",

  // Images and files (media-validation.ts, upload.ts, billing/properties schemas)
  "{label} must be a PNG, JPG, WebP, GIF, HEIC or SVG image.":
    "Dapat ay PNG, JPG, WebP, GIF, HEIC o SVG na larawan ang {label|lower}.",
  "{label} must be a JPG, PNG, WebP, HEIC image or a PDF.": "Dapat ay JPG, PNG, WebP, HEIC na larawan o PDF ang {label|lower}.",
  "{label} must be a JPG, PNG, WebP or HEIC image.": "Dapat ay JPG, PNG, WebP o HEIC na larawan ang {label|lower}.",
  "{label} must be PNG, JPG, JPEG, WebP, or HEIC.": "Dapat ay PNG, JPG, JPEG, WebP, o HEIC ang {label|lower}.",
  "{label} must be a valid {formats} image.": "Dapat ay valid na {formats} na larawan ang {label|lower}.",
  "{label} is unreadable or invalid. Upload a clearer image.":
    "Hindi mabasa o hindi valid ang {label|lower}. Mag-upload ng mas malinaw na larawan.",
  "{label} must be {size} MB or smaller.": "Dapat ay {size} MB o mas maliit ang {label|lower}.",
  "{label} could not be read as a valid image or PDF. Upload the original file.":
    "Hindi mabasa ang {label|lower} bilang valid na larawan o PDF. I-upload ang orihinal na file.",
  "{label} could not be read as a valid image. Upload the original file.":
    "Hindi mabasa ang {label|lower} bilang valid na larawan. I-upload ang orihinal na file.",
  "{label} could not be read as {formats}.": "Hindi mabasa ang {label|lower} bilang {formats}.",
  "{label} is empty or corrupted. Please choose another file.": "Walang laman o sira ang {label|lower}. Pumili ng ibang file.",
  "{label} exceeds the {size}MB size limit.": "Lumampas ang {label|lower} sa {size}MB na limit.",
  "{label} must be an uploaded image.": "Dapat ay na-upload na larawan ang {label|lower}.",
  "File is too large. Max size is {size} MB.": "Masyadong malaki ang file. Hanggang {size} MB lang.",
  "The file extension does not match its contents. Upload a valid {formats} image.":
    "Hindi tugma ang file extension sa laman nito. Mag-upload ng valid na {formats} na larawan.",
  'The file "{fileName}" was rejected because it is empty (0 bytes) or corrupted. Please select a valid file.':
    'Hindi tinanggap ang file na "{fileName}" dahil wala itong laman (0 bytes) o sira. Pumili ng valid na file.',
  'The file "{fileName}" was blocked for security reasons. Executable or script files ({extension}) cannot be uploaded.':
    'Na-block ang file na "{fileName}" para sa seguridad. Hindi puwedeng i-upload ang executable o script file ({extension}).',
  'The file "{fileName}" was rejected because {format} images are not supported. Please upload {formats}.':
    'Hindi tinanggap ang file na "{fileName}" dahil hindi suportado ang {format} na larawan. Mag-upload ng {formats}.',
  'The file "{fileName}" was rejected because documents ({extension}) cannot be used as an image. Supported formats are: {formats}.':
    'Hindi tinanggap ang file na "{fileName}" dahil hindi puwedeng gamitin bilang larawan ang dokumento ({extension}). Mga suportadong format: {formats}.',
  'The file "{fileName}" was rejected because {extension} is not a supported {label} format. Supported formats are: {formats}.':
    'Hindi tinanggap ang file na "{fileName}" dahil hindi suportadong format ng {label} ang {extension}. Mga suportadong format: {formats}.',
  "The file \"{fileName}\" was rejected because '{extension}' is not permitted for {label}. Supported formats are: {formats}.":
    "Hindi tinanggap ang file na \"{fileName}\" dahil hindi pinapayagan ang '{extension}' para sa {label}. Mga suportadong format: {formats}.",
  'The file "{fileName}" exceeds the {max}MB size limit (selected file is {size}). Please choose a file smaller than {max}MB.':
    'Lumampas ang file na "{fileName}" sa {max}MB na limit (ang napiling file ay {size}). Pumili ng file na mas maliit sa {max}MB.',
  "Too many files selected. A maximum of {count} files can be uploaded at once.":
    "Masyadong maraming file ang napili. Hanggang {count} file lang ang puwedeng i-upload nang sabay.",
  "Too many files selected. A maximum of {count} file can be uploaded at once.":
    "Masyadong maraming file ang napili. Hanggang {count} file lang ang puwedeng i-upload nang sabay.",
  "Maximum {count} files": "Hanggang {count} file",
  "Too many files. Max allowed is {count}.": "Masyadong maraming file. Hanggang {count} lang ang puwede.",
  'Image type "{type}" is not supported. Please try converting to JPEG or PNG.':
    'Hindi suportado ang image type na "{type}". Subukang i-convert sa JPEG o PNG.',
  "You can attach up to {count} screenshots.": "Hanggang {count} screenshot lang ang puwedeng i-attach.",

  // Lists and limits
  "An invoice can have at most {count} items.": "Hanggang {count} item lang ang puwede sa isang invoice.",
  "You can save at most {count} readings at once.": "Hanggang {count} reading lang ang puwedeng i-save nang sabay.",
  "You can attach up to {count} images.": "Hanggang {count} larawan lang ang puwedeng i-attach.",
  "You can attach up to {count} photos.": "Hanggang {count} litrato lang ang puwedeng i-attach.",
  "You can add up to {count} photos.": "Hanggang {count} litrato lang ang puwedeng idagdag.",
  "A poll can have at most {count} options.": "Hanggang {count} option lang ang puwede sa isang poll.",
  "Each poll option cannot exceed {max} characters.": "Hindi puwedeng lumampas sa {max} character ang bawat poll option.",
  "You can send up to {count} attachments at once.": "Hanggang {count} attachment lang ang puwedeng ipadala nang sabay.",
  "A conversation can have at most {count} participants.": "Hanggang {count} kalahok lang ang puwede sa isang conversation.",
  "A property can have at most {count} images.": "Hanggang {count} larawan lang ang puwede sa isang property.",
  "You can offer at most {count} renewal terms.": "Hanggang {count} renewal term lang ang puwedeng i-alok.",
  "A {months}-month term is listed more than once.": "Higit sa isang beses nakalista ang {months}-buwang termino.",
  "You can keep up to {count} calendar notes. Delete older notes to add more.":
    "Hanggang {count} calendar note lang ang puwede. Magbura ng mga lumang note para makadagdag.",

  // Amenities and rules (properties.schema.ts)
  '"{name}" is already included in standard amenities.': 'Kasama na ang "{name}" sa mga standard na amenity.',
  '"{name}" is already in your custom amenities list.': 'Nasa listahan mo na ng custom amenities ang "{name}".',
  '"{name}" is already included in standard rules.': 'Kasama na ang "{name}" sa mga standard na patakaran.',
  '"{name}" is already in your saved rules list.': 'Nasa listahan mo na ng naka-save na patakaran ang "{name}".',
  'Amenity "{name}" is listed more than once.': 'Higit sa isang beses nakalista ang amenity na "{name}".',
  'House rule "{name}" is listed more than once.': 'Higit sa isang beses nakalista ang patakarang "{name}".',
  'Rule "{name}" is listed more than once.': 'Higit sa isang beses nakalista ang patakarang "{name}".',
  'This numbering would give more than one unit the name "{name}". Choose a different style or starting number.':
    'Sa numbering na ito, higit sa isang unit ang magkakapangalang "{name}". Pumili ng ibang style o panimulang numero.',

  // Application intake unit options (application-intake.ts)
  "{unit} • (Occupied — Unavailable)": "{unit} • (Okupado — Hindi available)",
  "{unit} • (On-going — Unavailable)": "{unit} • (May proseso — Hindi available)",

  // --- API route messages ---
  "Too many failed attempts. Security key recovery is locked for {minutes} more minute(s).":
    "Masyadong maraming maling subok. Naka-lock ang security key recovery nang {minutes} pang minuto.",
  "Invalid security key. {remaining} attempt(s) remaining before temporary lockout.":
    "Mali ang security key. {remaining} subok na lang bago pansamantalang ma-lock.",
  "Verification code sent to {email}": "Naipadala ang verification code sa {email}",
  "A 6-digit verification code has been sent to {email}.": "Naipadala ang 6-digit na verification code sa {email}.",
  "Email address {email} has been successfully verified and linked.": "Na-verify at na-link na ang email address na {email}.",
  "Please mark {item} as provided.": "Pakimarkahan ang {item} bilang naibigay na.",
  "Upload at least one photo for {item}.": "Mag-upload ng kahit isang litrato para sa {item}.",
  "Projected occupants ({count}) exceeds the defined capacity limit for this unit ({max}).":
    "Lumampas ang inaasahang bilang ng titira ({count}) sa itinakdang kapasidad ng unit na ito ({max}).",
  "A {status} application cannot be approved.": "Hindi maaaprubahan ang aplikasyong may status na {status}.",
  "Cannot regenerate signing link for application with status: {status}":
    "Hindi ma-regenerate ang signing link para sa aplikasyong may status na: {status}",
  "Cannot regenerate signing link for lease with status: {status}":
    "Hindi ma-regenerate ang signing link para sa lease na may status na: {status}",
  "Cannot generate signing link for application with status: {status}":
    "Hindi makagawa ng signing link para sa aplikasyong may status na: {status}",
  "Lease is not ready for signing. Current status: {status}": "Hindi pa handang pirmahan ang lease. Kasalukuyang status: {status}",
  "Cannot sign lease with status: {status}": "Hindi mapipirmahan ang lease na may status na: {status}",
  "The term of a {status} lease cannot be changed.": "Hindi na mababago ang termino ng lease na may status na {status}.",
  "Cannot approve request with status: {status}": "Hindi maaaprubahan ang request na may status na: {status}",
  "Cannot deny request with status: {status}": "Hindi matatanggihan ang request na may status na: {status}",
  "Cannot process request with status: {status}": "Hindi maproseso ang request na may status na: {status}",
  "Cannot record inspection for request with status: {status}. Must be 'approved'.":
    "Hindi maitala ang inspeksyon para sa request na may status na: {status}. Dapat ay 'approved'.",

  // Notifications created by API routes
  "Your move-out request for {date} has been approved.": "Naaprubahan na ang move-out request mo para sa {date}.",
  "Your move-out request has been denied. Reason: {reason}": "Tinanggihan ang move-out request mo. Dahilan: {reason}",
  "Your move-out request has been approved. Inspection scheduled for {date}.":
    "Naaprubahan na ang move-out request mo. Naka-schedule ang inspeksyon sa {date}.",
  "Your move-out has been completed. Security deposit refund: ₱{amount}":
    "Tapos na ang pag-alis mo. Refund ng security deposit: ₱{amount}",
  "Your landlord recorded a payment of ₱{amount} (Receipt #{receipt}).":
    "Nagtala ang may-ari ng bayad na ₱{amount} (Resibo #{receipt}).",
  "A tenant has requested to move out on {date}.": "May nangungupahang humiling na umalis sa {date}.",
  "Tenant has requested a lease renewal for {months} months.": "Humiling ang nangungupahan ng lease renewal para sa {months} buwan.",
  "A tenant requested a unit transfer. Reason: {reason}": "May nangungupahang humiling ng paglipat ng unit. Dahilan: {reason}",
  "{tenant} has signed the lease for {property} - {unit}. Please review and countersign.":
    "Pumirma na si {tenant} sa lease para sa {property} - {unit}. Pakisuri at pumirma rin.",
  "The lease for {property} - {unit} with {tenant} has been successfully activated. Both parties have signed the agreement.":
    "Aktibo na ang lease para sa {property} - {unit} kasama si {tenant}. Parehong pumirma na ang dalawang panig.",
  "{applicant} submitted a rental application for {unit}. Review the dossier now.":
    "Nagpasa si {applicant} ng rental application para sa {unit}. Suriin na ang dossier.",
  "A new invoice for {amount} has been issued for {unit}. Due date: {date}.":
    "May bagong invoice na {amount} para sa {unit}. Due date: {date}.",
  "Invoice {invoice} is awaiting in-person confirmation.": "Naghihintay ng personal na kumpirmasyon ang invoice {invoice}.",
  "Tenant submitted GCash proof for invoice {invoice}.": "Nagpasa ang nangungupahan ng GCash proof para sa invoice {invoice}.",
  "Invoice {invoice} is due soon. Tap Pay Now to continue.": "Malapit nang mag-due ang invoice {invoice}. I-tap ang Pay Now para magpatuloy.",
  "Invoice {invoice} was rejected.": "Tinanggihan ang invoice {invoice}.",
  "Invoice {invoice} was confirmed.": "Nakumpirma ang invoice {invoice}.",
  "Invoice {invoice} is confirmed and receipted.": "Nakumpirma at may resibo na ang invoice {invoice}.",
  "Refund for invoice {invoice} has been processed.": "Naproseso na ang refund para sa invoice {invoice}.",
  "Refund for invoice {invoice} has been processed. Reconciliation is complete.":
    "Naproseso na ang refund para sa invoice {invoice}. Tapos na ang reconciliation.",
  "Successfully revoked sessions with scope: {scope}": "Matagumpay na na-revoke ang mga session na may scope: {scope}",
  "{applicant} submitted payment proof ({amount}) for {unit}. Txn Ref: {reference}, GCash: {gcash}.":
    "Nagpasa si {applicant} ng patunay ng bayad ({amount}) para sa {unit}. Txn Ref: {reference}, GCash: {gcash}.",
  "Lease created for existing tenant account ({email}).": "Nagawa ang lease para sa kasalukuyang tenant account ({email}).",
  "Tenant account created. Temporary password: {password}. Please share these credentials with the tenant.":
    "Nagawa ang tenant account. Pansamantalang password: {password}. Pakibigay ang mga credential na ito sa nangungupahan.",
};
