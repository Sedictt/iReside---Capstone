# Finance Hub for older landlords: what changed and why

Rebuilt on 2026-10-20. Covers `/landlord/invoices` (Finance Hub) and the invoice page that
opens from it, the dashboard and chat (`InvoiceModal`).

## The problem

The old screen was a finance dashboard: three money totals in jargon ("Net Cash Flow (30d)"),
three uppercase 10px tabs, a pill filter row plus two dropdowns, and invoice rows led by the
invoice number. Opening an invoice showed a two-column modal with "Invoice Specification",
"Ledger Reconciliation", "Action Center", a Confirm / Report Issue toggle, a "Resolution
Wizard", and two "Scroll for details / Scroll for actions" buttons because neither column fit.
Nothing told a first-time user what the screen was for or what they had to do.

## Principles we applied (with the evidence behind each)

1. **Task first, data second.** Open on "what do I need to do today", not totals
   (GOV.UK task-list pattern; action-centric dashboard guidance). → "Things to do today"
   cards sit above the list; the money totals moved into "Money in and out".
2. **Working memory is the bottleneck.** Older users should never carry a fact from one
   screen to the next (W3C WAI Older Users; Lu, Lin & Yueh 2017). → The open bill restates
   tenant, amount, method and reference inside the confirmation question.
3. **Recognition over recall; words, not icons.** Flat icons alone are poorly recognised by
   older adults (Wu et al. 2022, eye-tracking; NN/g). → Every button is a sentence
   ("Yes, the payment is correct", "Send Angelo a reminder"). Icons only support the words.
4. **No hidden navigation.** Hidden navigation cuts discoverability by more than 20% (NN/g).
   → No tabs inside the bill, no hover-only controls, no "scroll for more". One scrolling
   page in a fixed order: status, what to do, what the tenant sent, what the bill is for,
   history.
5. **Status is words, never colour alone.** Sentence-case adjective tags, few of them
   (NHS and Scottish Government tag guidance). → Eight plain tags: Paid, Late, Not paid yet /
   Due in N days, Payment to check, Cash to confirm, Refund to send, Refund sent,
   Problem reported. The whole card is the tap target (GOV.UK found users tapping the tag).
6. **Concrete sizes.** Body 16px+, labels 18px, amounts 24px+, targets 48px+, contrast
   4.5:1 (WCAG 1.4.3, 2.5.5; NIA guidance). → Built on the Settings kit from the 2026-10-14
   settings overhaul, which already encodes these.
7. **Fewer choices per screen.** Decision time grows with options (Hick's law). → Four
   piles replace seven status values: Needs my attention, Late, Waiting for payment, Paid.
   At most two action buttons on an open bill.
8. **Confirm only money actions, name the outcome.** Over-warning trains people to ignore
   warnings; buttons should say what happens, with no default "Yes" (NN/g confirmation
   dialogs). → One question per money action, facts restated, buttons "Yes, I received the
   cash" / "No, go back". The 3-second countdown button is gone.
9. **Say what happened and what comes next.** Alerts state the type and the next step and
   never blame the user (USWDS alert, GOV.UK confirmation page). → After an action the
   bill stays open with "Payment confirmed. Joshua got a receipt and this bill is now marked
   as paid. Nothing more to do." It never closes by itself.
10. **Forgiving errors.** Errors keep the input, sit next to the field, and name the fix.
    → "That did not work … Nothing on the bill was changed." plus a Try again button.
11. **Trust through an audit trail.** Older users fear irreversible mistakes with money.
    → "What happened so far" lists bill sent, payment sent, receipt issued, refund sent.
12. **Philippine specifics.** GCash reference numbers come from the SMS; Taglish is the
    preferred register. → Reference field labelled "From the GCash or bank text message";
    all new text has Filipino entries in `src/lib/i18n/modules/landlord-finance.ts`.

Sources: NN/g senior usability study and articles on recognition vs recall, hidden
navigation, confirmation dialogs and error messages; W3C WAI "Older Users"; Wu et al.
2022 (IJERPH); Lu, Lin & Yueh 2017 (Frontiers in Psychology); GOV.UK, NHS, Scottish
Government and USWDS design systems; WCAG 2.2; NIA/ACL web design tips for older adults.

## Where the words live

`src/lib/billing/invoice-plain-status.ts` resolves one state per invoice
(`resolveInvoicePlainState`) and turns it into the tag, headline, next-step sentence and
action label (`describeInvoice`). The list, the "things to do" cards and the open bill all
read it, so they can never disagree. (They did before: an in-person cash intent also stamps
`payment_submitted_at`, so the old list said "Needs Verification" while the old modal said
"Overdue".)

## Checklist for future changes to these screens

1. Body text 16px or larger, amounts 24px or larger.
2. Every tappable thing is 44px or taller; the whole card is the target.
3. No icon without a text label; no abbreviation a non-accountant must decode.
4. No tabs, accordions, hover or swipe gestures, or overflow menus.
5. At most two primary actions per screen, all as text buttons.
6. Every status is a sentence-case tag with text, readable in greyscale.
7. The first thing on the list answers "what must I do today?".
8. A money confirmation restates tenant, amount, method and reference; buttons name the
   outcome.
9. After every action: what happened, who was told, what is next, shown inline and kept
   until the user leaves.
10. Error states keep the input, sit next to the field, name the fix, never blame.

## Not done (needs the owner's call)

- **Light mode by default on money screens.** Research (Piepenbrock et al. 2013; NN/g)
  favours light backgrounds for older eyes. The app follows the user's theme toggle; both
  themes were checked, but no default was changed.
- The old modal's `any`-typed `refundMessage` prop is now typed loosely to keep the three
  chat callers compiling; those callers still pass the raw message object.
